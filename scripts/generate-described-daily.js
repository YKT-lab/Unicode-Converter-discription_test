const fs = require("fs");

const {
  DAILY_JSON_PATH,
  getJSTDateString,
  loadFonts,
  generateEntry
} = require("./generate-daily.js");


const API_KEY =
  process.env.GEMINI_API_KEY;


if (!API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is not set."
  );
}


const UCD_BASE =
  "https://www.unicode.org/Public/UCD/latest/ucd";


const SOURCES = {
  derivedName:
    UCD_BASE +
    "/extracted/DerivedName.txt",

  blocks:
    UCD_BASE +
    "/Blocks.txt",

  scripts:
    UCD_BASE +
    "/Scripts.txt",

  age:
    UCD_BASE +
    "/DerivedAge.txt",

  generalCategory:
    UCD_BASE +
    "/extracted/DerivedGeneralCategory.txt",

  namesList:
    UCD_BASE +
    "/NamesList.txt",

  unikemet:
    UCD_BASE +
    "/Unikemet.txt"
};


function hex(
  codePoint
) {

  return codePoint
    .toString(16)
    .toUpperCase()
    .padStart(
      4,
      "0"
    );
}


async function fetchText(
  url
) {

  const response =
    await fetch(
      url,
      {
        headers: {
          "User-Agent":
            "Unicode-Converter description test"
        },

        signal:
          AbortSignal.timeout(
            30000
          )
      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      response.status +
      " " +
      response.statusText +
      ": " +
      url
    );
  }


  return response.text();
}


async function loadResearchSources() {

  const entries =
    Object.entries(
      SOURCES
    );


  const texts =
    await Promise.all(
      entries.map(
        (
          [
            ,
            url
          ]
        ) =>
          fetchText(
            url
          )
      )
    );


  return Object.fromEntries(
    entries.map(
      (
        [
          key
        ],
        index
      ) => [
        key,
        texts[
          index
        ]
      ]
    )
  );
}


function parseRange(
  raw
) {

  const value =
    raw.trim();


  if (
    value.includes(
      ".."
    )
  ) {

    const [
      start,
      end
    ] =
      value.split(
        ".."
      );


    return [
      parseInt(
        start,
        16
      ),

      parseInt(
        end,
        16
      )
    ];
  }


  const point =
    parseInt(
      value,
      16
    );


  return [
    point,
    point
  ];
}


function findSemicolonProperty(
  text,
  codePoint
) {

  for (
    const line
    of text.split(
      /\r?\n/
    )
  ) {

    const data =
      line
        .split(
          "#"
        )[
          0
        ]
        .trim();


    if (
      !data
      ||
      !data.includes(
        ";"
      )
    ) {
      continue;
    }


    const [
      rangeText,
      valueText
    ] =
      data.split(
        ";",
        2
      );


    const [
      start,
      end
    ] =
      parseRange(
        rangeText
      );


    if (
      codePoint >=
        start
      &&
      codePoint <=
        end
    ) {

      return valueText
        .trim();
    }
  }


  return null;
}


function findDerivedName(
  text,
  codePoint
) {

  const value =
    findSemicolonProperty(
      text,
      codePoint
    );


  if (
    !value
  ) {
    return null;
  }


  return value.replace(
    "*",
    hex(
      codePoint
    )
  );
}


function findNamesListEntry(
  text,
  codePoint
) {

  const lines =
    text.split(
      /\r?\n/
    );


  const target =
    hex(
      codePoint
    );


  let collecting =
    false;


  const raw =
    [];


  for (
    const line
    of lines
  ) {

    const match =
      line.match(
        /^([0-9A-F]{4,6})\t(.*)$/
      );


    if (
      match
    ) {

      if (
        collecting
      ) {
        break;
      }


      if (
        match[
          1
        ] ===
        target
      ) {

        collecting =
          true;


        raw.push(
          {
            type:
              "name",

            text:
              match[
                2
              ].trim()
          }
        );
      }


      continue;
    }


    if (
      !collecting
      ||
      !line.startsWith(
        "\t"
      )
    ) {
      continue;
    }


    const item =
      line.trim();


    if (
      !item
    ) {
      continue;
    }


    const marker =
      item[
        0
      ];


    const body =
      item
        .slice(
          1
        )
        .trim();


    const typeMap = {
      "*":
        "comment",

      "=":
        "alias",

      "%":
        "formalAlias",

      "#":
        "notice",

      "x":
        "crossReference",

      ":":
        "decomposition",

      "~":
        "variation"
    };


    raw.push(
      {
        type:
          typeMap[
            marker
          ]
          ||
          "other",

        text:
          body
          ||
          item
      }
    );
  }


  return raw;
}


function findUnikemet(
  text,
  codePoint
) {

  const target =
    "U+" +
    hex(
      codePoint
    );


  const properties =
    {};


  for (
    const line
    of text.split(
      /\r?\n/
    )
  ) {

    if (
      !line
      ||
      line.startsWith(
        "#"
      )
    ) {
      continue;
    }


    const fields =
      line.split(
        "\t"
      );


    if (
      fields.length <
        3
      ||
      fields[
        0
      ].trim() !==
        target
    ) {
      continue;
    }


    const property =
      fields[
        1
      ].trim();


    const value =
      fields
        .slice(
          2
        )
        .join(
          "\t"
        )
        .trim();


    if (
      property
      &&
      value
    ) {

      properties[
        property
      ] =
        value;
    }
  }


  return properties;
}


function normalizeFactText(
  text
) {

  return String(
    text
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9\p{L}\p{N}]+/gu,
      " "
    )
    .trim();
}


function makeFacts(
  namesList,
  unikemet
) {

  const facts =
    [];


  const seen =
    new Set();


  const push = (
    kind,
    text,
    source,
    strength =
      "strong"
  ) => {

    if (
      !text
    ) {
      return;
    }


    const normalized =
      normalizeFactText(
        text
      );


    if (
      !normalized
      ||
      seen.has(
        normalized
      )
    ) {
      return;
    }


    seen.add(
      normalized
    );


    facts.push(
      {
        kind,
        text,
        source,
        strength
      }
    );
  };


  push(
    "appearance",
    unikemet.kEH_Desc,
    "Unicode Unikemet",
    "strong"
  );


  push(
    "function",
    unikemet.kEH_Func,
    "Unicode Unikemet",
    "strong"
  );


  push(
    "functionValue",
    unikemet.kEH_FVal,
    "Unicode Unikemet",
    "strong"
  );


  for (
    const item
    of namesList
  ) {

    if (
      item.type ===
        "comment"
    ) {

      push(
        "namesList:comment",
        item.text,
        "Unicode NamesList",
        "strong"
      );

    } else if (
      [
        "alias",
        "formalAlias",
        "notice"
      ].includes(
        item.type
      )
    ) {

      push(
        "namesList:" +
          item.type,
        item.text,
        "Unicode NamesList",
        "supporting"
      );
    }
  }


  push(
    "catalogIndex",
    unikemet.kEH_UniK,
    "Unicode Unikemet",
    "supporting"
  );


  push(
    "taxonomyIndex",
    unikemet.kEH_Cat,
    "Unicode Unikemet",
    "supporting"
  );


  return facts;
}


function researchCharacter(
  sourceTexts,
  entry
) {

  const codePoint =
    parseInt(
      entry.codePoint,
      16
    );


  const unicodeName =
    findDerivedName(
      sourceTexts.derivedName,
      codePoint
    );


  const block =
    findSemicolonProperty(
      sourceTexts.blocks,
      codePoint
    );


  const script =
    findSemicolonProperty(
      sourceTexts.scripts,
      codePoint
    );


  const age =
    findSemicolonProperty(
      sourceTexts.age,
      codePoint
    );


  const generalCategory =
    findSemicolonProperty(
      sourceTexts.generalCategory,
      codePoint
    );


  const namesList =
    findNamesListEntry(
      sourceTexts.namesList,
      codePoint
    );


  const unikemet =
    findUnikemet(
      sourceTexts.unikemet,
      codePoint
    );


  const facts =
    makeFacts(
      namesList,
      unikemet
    );


  const strongFacts =
    facts.filter(
      (
        item
      ) =>
        item.strength ===
          "strong"
    );


  const accepted =
    Boolean(
      unicodeName
      &&
      block
      &&
      script
    )
    &&
    strongFacts.length >=
      2;


  return {
    accepted,

    metadata: {
      unicodeName,
      block,
      script,
      age,
      generalCategory
    },

    facts,

    sources: [
      {
        name:
          "Unicode DerivedName",

        url:
          SOURCES.derivedName
      },

      {
        name:
          "Unicode NamesList",

        url:
          SOURCES.namesList
      },

      {
        name:
          "Unicode Unikemet",

        url:
          SOURCES.unikemet
      }
    ]
  };
}


function sleep(
  milliseconds
) {

  return new Promise(
    (
      resolve
    ) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}


async function generateDescription(
  entry,
  research
) {

  const prompt = [
    "あなたはUnicode文字図鑑の編集者です。",
    "以下のUnicode公式資料から確認済みの事実だけを使って、日本語の短い解説を書いてください。",
    "資料にない事実を補わないでください。推測は禁止です。",
    "同じ事実を言い換えて水増ししないでください。",
    "summaryは1〜2文、usageは1〜2文、supplementalInfoは必要な場合だけ1文程度にしてください。",
    "summaryは対象文字・U+XXXX・Unicode名・「この文字は」などを主語にせず、見た目や意味の説明から直接始めてください。たとえば「横向きの角を持つ雄羊の頭をした蛇を表します。」のように書いてください。",
    "usageには転写や読みを混ぜず、意味や機能だけを書いてください。転写はfactsのfunctionValueから別欄に表示します。",
    "supplementalInfoは本文を理解する助けになる追加情報だけにしてください。",
    "カタログ番号・分類番号・Unicode名・コードポイント・ブロック名・Unicode追加バージョンだけしか材料がない場合、supplementalInfoは必ず空文字列にしてください。",
    "",
    "対象文字:",
    entry.character +
      " U+" +
      entry.codePoint,
    "",
    "基本情報:",
    JSON.stringify(
      research.metadata,
      null,
      2
    ),
    "",
    "確認済みの文字固有情報:",
    JSON.stringify(
      research.facts,
      null,
      2
    )
  ].join(
    "\n"
  );


  const body = {
    model:
      "gemini-3.1-flash-lite",

    input:
      prompt,

    response_format: {
      type:
        "text",

      mime_type:
        "application/json",

      schema: {
        type:
          "object",

        properties: {
          summary: {
            type:
              "string"
          },

          usage: {
            type:
              "string"
          },

          supplementalInfo: {
            type:
              "string"
          }
        },

        required: [
          "summary",
          "usage",
          "supplementalInfo"
        ]
      }
    }
  };


  for (
    let attempt = 1;
    attempt <= 4;
    attempt++
  ) {

    const response =
      await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              API_KEY
          },

          body:
            JSON.stringify(
              body
            ),

          signal:
            AbortSignal.timeout(
              60000
            )
        }
      );


    const raw =
      await response.text();


    if (
      response.ok
    ) {

      const data =
        JSON.parse(
          raw
        );


      const text =
        (
          data.steps
          ||
          []
        )
          .filter(
            (
              step
            ) =>
              step.type ===
                "model_output"
          )
          .flatMap(
            (
              step
            ) =>
              step.content
              ||
              []
          )
          .filter(
            (
              part
            ) =>
              part.type ===
                "text"
          )
          .map(
            (
              part
            ) =>
              part.text
              ||
              ""
          )
          .join(
            ""
          )
          .trim();


      if (
        !text
      ) {

        throw new Error(
          "Gemini returned no text."
        );
      }


      return JSON.parse(
        text
      );
    }


    if (
      ![
        429,
        503
      ].includes(
        response.status
      )
      ||
      attempt ===
        4
    ) {

      throw new Error(
        "Gemini API error: " +
        response.status +
        " " +
        raw
      );
    }


    console.warn(
      "Gemini temporary error " +
      response.status +
      ". Retrying..."
    );


    await sleep(
      2000 *
      Math.pow(
        2,
        attempt -
          1
      )
    );
  }


  throw new Error(
    "Gemini description failed."
  );
}


async function generateAcceptedEntry(
  fonts,
  sourceTexts,
  date,
  avoidCodePoint =
    null
) {

  const MAX_RESEARCH_ATTEMPTS =
    60;


  for (
    let attempt = 1;
    attempt <=
      MAX_RESEARCH_ATTEMPTS;
    attempt++
  ) {

    const entry =
      generateEntry(
        fonts,
        date,
        avoidCodePoint
      );


    const research =
      researchCharacter(
        sourceTexts,
        entry
      );


    console.log(
      "Research attempt " +
      attempt +
      ": " +
      entry.character +
      " U+" +
      entry.codePoint +
      " -> " +
      (
        research.accepted
          ? "accepted"
          : "rejected"
      )
    );


    if (
      !research.accepted
    ) {
      continue;
    }


    const description =
      await generateDescription(
        entry,
        research
      );


    const hasSupplementalFacts =
      research.facts.some(
        (
          fact
        ) =>
          ![
            "appearance",
            "function",
            "functionValue",
            "namesList:comment",
            "catalogIndex",
            "taxonomyIndex"
          ].includes(
            fact.kind
          )
      );


    return {
      ...entry,

      info: {
        ...research.metadata,

        summary:
          description.summary,

        usage:
          description.usage,

        supplementalInfo:
          hasSupplementalFacts
            ? description.supplementalInfo
            : "",

        facts:
          research.facts,

        sources:
          research.sources
      }
    };
  }


  throw new Error(
    "Could not find a sufficiently documented character within " +
    MAX_RESEARCH_ATTEMPTS +
    " attempts."
  );
}


async function main() {

  console.log(
    "Loading fonts..."
  );


  const fonts =
    loadFonts();


  console.log(
    "Loading Unicode official research data..."
  );


  const sourceTexts =
    await loadResearchSources();


  const currentDate =
    getJSTDateString(
      0
    );


  const nextDate =
    getJSTDateString(
      1
    );


  console.log(
    "Generating described current character..."
  );


  const current =
    await generateAcceptedEntry(
      fonts,
      sourceTexts,
      currentDate
    );


  console.log(
    "Generating described next character..."
  );


  const next =
    await generateAcceptedEntry(
      fonts,
      sourceTexts,
      nextDate,
      parseInt(
        current.codePoint,
        16
      )
    );


  const data = {
    current,
    next
  };


  fs.writeFileSync(
    DAILY_JSON_PATH,
    JSON.stringify(
      data,
      null,
      2
    )
    +
    "\n",
    "utf8"
  );


  console.log(
    "Current: " +
    current.character +
    " U+" +
    current.codePoint
  );


  console.log(
    "Current description: " +
    current.info.summary
  );


  console.log(
    "Next: " +
    next.character +
    " U+" +
    next.codePoint
  );


  console.log(
    "daily.json updated with descriptions."
  );
}


main().catch(
  (
    error
  ) => {

    console.error(
      error
    );


    process.exit(
      1
    );
  }
);
