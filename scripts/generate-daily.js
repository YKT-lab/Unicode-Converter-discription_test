const fs =
  require("fs");

const path =
  require("path");

const crypto =
  require("crypto");

const fontkit =
  require("@cantoo/fontkit");


/* =========================================
   Paths
========================================= */

const ROOT =
  path.resolve(
    __dirname,
    ".."
  );


const DAILY_JSON_PATH =
  path.join(
    ROOT,
    "daily.json"
  );


/* =========================================
   Daily用に使うローカルフォント
========================================= */

const FONT_FILES = [
  {
    name:
      "Tangut Extended",

    file:
      "tangut-extended.woff2"
  },

  {
    name:
      "Plangothic P1",

    file:
      "fonts/PlangothicP1-Regular.woff2"
  },

  {
    name:
      "Plangothic P2",

    file:
      "fonts/PlangothicP2-Regular.woff2"
  },

  {
    name:
      "Egyptology Extended",

    file:
      "fonts/EgyptologyExtended.woff2"
  },

  {
    name:
      "UniHieroglyphica",

    file:
      "fonts/UniHieroglyphica.ttf"
  },

  {
    name:
      "BabelStone Pseudographica",

    file:
      "fonts/BabelStonePseudographica.woff2"
  },

  {
    name:
      "Noto Sans Symbols 2",

    file:
      "fonts/NotoSansSymbols2-Regular.ttf"
  },

  {
    name:
      "Noto Sans Phonetics",

    file:
      "fonts/phonetics/NotoSans-Regular.ttf"
  },

  {
    name:
      "Noto Sans JP",

    directory:
      "node_modules/@fontsource/noto-sans-jp/files",

    fileSuffix:
      "-400-normal.woff2"
  },

  {
    name:
      "Noto Music",

    file:
      "fonts/music/NotoMusic-Regular.ttf"
  }
];


/* =========================================
   JST date
========================================= */

function getJSTDateString(
  dayOffset = 0
) {

  const JST_OFFSET =
    9 *
    60 *
    60 *
    1000;


  const DAY =
    24 *
    60 *
    60 *
    1000;


  const date =
    new Date(
      Date.now()
      +
      JST_OFFSET
      +
      dayOffset *
      DAY
    );


  return date
    .toISOString()
    .slice(
      0,
      10
    );
}


/* =========================================
   Random
========================================= */

function randomIndex(
  length
) {

  return crypto.randomInt(
    length
  );
}


/* =========================================
   Character filter
========================================= */

const knownInvisible =
  new Set([
    0x115F,
    0x1160,
    0x2800,
    0x3164,
    0xFFA0,
    0xFFFD
  ]);


function isGoodDailyCharacter(
  codePoint
) {

  if (
    codePoint <
      0
    ||
    codePoint >
      0x10FFFF
  ) {
    return false;
  }


  if (
    codePoint >=
      0xD800
    &&
    codePoint <=
      0xDFFF
  ) {
    return false;
  }


  if (
    knownInvisible.has(
      codePoint
    )
  ) {
    return false;
  }


  const character =
    String.fromCodePoint(
      codePoint
    );


  /*
    制御文字
    書式文字
    サロゲート
    私用領域
    未割当
    結合文字
    空白類
    を除外
  */

  if (
    /(?:\p{Cc}|\p{Cf}|\p{Cs}|\p{Co}|\p{Cn}|\p{M}|\p{Z})/u
      .test(
        character
      )
  ) {

    return false;
  }


  try {

    if (
      /\p{Default_Ignorable_Code_Point}/u
        .test(
          character
        )
    ) {

      return false;
    }

  } catch (
    error
  ) {

    /*
      Node側が未対応でも
      上のGeneral Category判定は残る
    */
  }


  return true;
}


/* =========================================
   Daily categories
========================================= */

const DAILY_CATEGORIES = [
  "han",
  "kana",
  "number",
  "symbol",
  "music",
  "phonetics",
  "ancient"
];


function isInRange(
  codePoint,
  start,
  end
) {

  return (
    codePoint >=
      start
    &&
    codePoint <=
      end
  );
}


function isPhoneticsCodePoint(
  codePoint
) {

  return (
    isInRange(
      codePoint,
      0x0250,
      0x02FF
    )
    ||
    isInRange(
      codePoint,
      0x0300,
      0x036F
    )
    ||
    isInRange(
      codePoint,
      0x1D00,
      0x1DBF
    )
    ||
    isInRange(
      codePoint,
      0x1DC0,
      0x1DFF
    )
    ||
    isInRange(
      codePoint,
      0x1E00,
      0x1EFF
    )
    ||
    isInRange(
      codePoint,
      0xA700,
      0xA7FF
    )
    ||
    isInRange(
      codePoint,
      0xAB30,
      0xAB6F
    )
    ||
    isInRange(
      codePoint,
      0x10780,
      0x107BF
    )
    ||
    isInRange(
      codePoint,
      0x1DF00,
      0x1DFFF
    )
  );
}


function isKanaCodePoint(
  codePoint
) {

  const inKanaRange =
    (
      isInRange(
        codePoint,
        0x3040,
        0x30FF
      )
      ||
      isInRange(
        codePoint,
        0x31F0,
        0x31FF
      )
      ||
      isInRange(
        codePoint,
        0x1AFF0,
        0x1AFFF
      )
      ||
      isInRange(
        codePoint,
        0x1B000,
        0x1B16F
      )
    );


  if (
    !inKanaRange
  ) {
    return false;
  }


  const character =
    String.fromCodePoint(
      codePoint
    );


  return (
    /\p{Script=Hiragana}/u.test(
      character
    )
    ||
    /\p{Script=Katakana}/u.test(
      character
    )
  );
}


function isJapaneseDisplayCodePoint(
  codePoint
) {

  return (
    isInRange(
      codePoint,
      0x3000,
      0x30FF
    )
    ||
    isInRange(
      codePoint,
      0x31F0,
      0x31FF
    )
    ||
    isHanCodePoint(
      codePoint
    )
    ||
    isInRange(
      codePoint,
      0x1AFF0,
      0x1AFFF
    )
    ||
    isInRange(
      codePoint,
      0x1B000,
      0x1B16F
    )
  );
}


function isHanCodePoint(
  codePoint
) {

  return (
    isInRange(
      codePoint,
      0x3400,
      0x4DBF
    )
    ||
    isInRange(
      codePoint,
      0x4E00,
      0x9FFF
    )
  );
}


function isMusicCodePoint(
  codePoint
) {

  return (
    isInRange(
      codePoint,
      0x1D000,
      0x1D24F
    )
    ||
    isInRange(
      codePoint,
      0x2669,
      0x266F
    )
  );
}


function isAncientCodePoint(
  codePoint
) {

  /*
    現在、文字固有の説明資料が十分にある
    Egyptian Hieroglyphs Extended-A を
    古代文字カテゴリに採用する。
  */

  return isInRange(
    codePoint,
    0x13460,
    0x143FF
  );
}


function getDailyCategory(
  codePoint
) {

  if (
    isMusicCodePoint(
      codePoint
    )
  ) {
    return "music";
  }


  if (
    isPhoneticsCodePoint(
      codePoint
    )
  ) {
    return "phonetics";
  }


  if (
    isKanaCodePoint(
      codePoint
    )
  ) {
    return "kana";
  }


  if (
    isHanCodePoint(
      codePoint
    )
  ) {
    return "han";
  }


  if (
    isAncientCodePoint(
      codePoint
    )
  ) {
    return "ancient";
  }


  const character =
    String.fromCodePoint(
      codePoint
    );


  if (
    /\p{N}/u.test(
      character
    )
  ) {
    return "number";
  }


  if (
    /(?:\p{S}|\p{P})/u.test(
      character
    )
  ) {
    return "symbol";
  }


  return null;
}


function pickDailyCategory() {

  return DAILY_CATEGORIES[
    randomIndex(
      DAILY_CATEGORIES.length
    )
  ];
}


const categoryPoolCache =
  new WeakMap();


function getCategoryPools(
  fonts
) {

  const cached =
    categoryPoolCache.get(
      fonts
    );


  if (
    cached
  ) {
    return cached;
  }


  const sets =
    Object.fromEntries(
      DAILY_CATEGORIES.map(
        (
          category
        ) => [
          category,
          new Set()
        ]
      )
    );


  for (
    const fontRecord
    of fonts
  ) {

    for (
      const codePoint
      of fontRecord.candidates
    ) {

      const category =
        getDailyCategory(
          codePoint
        );


      if (
        category
        &&
        sets[
          category
        ]
      ) {

        sets[
          category
        ].add(
          codePoint
        );
      }
    }
  }


  const pools =
    Object.fromEntries(
      DAILY_CATEGORIES.map(
        (
          category
        ) => [
          category,
          Array.from(
            sets[
              category
            ]
          )
        ]
      )
    );


  categoryPoolCache.set(
    fonts,
    pools
  );


  return pools;
}


/* =========================================
   Load fonts
========================================= */

function loadFonts() {

  const fonts =
    [];


  const fontItems =
    [];


  for (
    const item
    of FONT_FILES
  ) {

    if (
      item.directory
    ) {

      const absoluteDirectory =
        path.join(
          ROOT,
          item.directory
        );


      if (
        !fs.existsSync(
          absoluteDirectory
        )
      ) {

        console.warn(
          `Font directory not found: ${item.directory}`
        );


        continue;
      }


      const fileNames =
        fs.readdirSync(
          absoluteDirectory
        )
        .filter(
          (
            fileName
          ) =>
            !item.fileSuffix
            ||
            fileName.endsWith(
              item.fileSuffix
            )
        );


      for (
        const fileName
        of fileNames
      ) {

        fontItems.push(
          {
            name:
              item.name,

            file:
              path.join(
                item.directory,
                fileName
              )
          }
        );
      }


      continue;
    }


    fontItems.push(
      item
    );
  }


  for (
    const item
    of fontItems
  ) {

    const absolutePath =
      path.join(
        ROOT,
        item.file
      );


    if (
      !fs.existsSync(
        absolutePath
      )
    ) {

      console.warn(
        `Font not found: ${item.file}`
      );


      continue;
    }


    try {

      const font =
        fontkit.openSync(
          absolutePath
        );


      const candidates =
        font.characterSet
          .filter(
            isGoodDailyCharacter
          );


      if (
        candidates.length ===
          0
      ) {

        continue;
      }


      let notdefPath =
        "";


      try {

        const notdef =
          font.getGlyph(
            0
          );


        if (
          notdef
          &&
          notdef.path
        ) {

          notdefPath =
            notdef.path.toSVG();
        }

      } catch (
        error
      ) {

        /*
          .notdefが取得できなくても
          glyph.id === 0 で判定できる
        */
      }


      fonts.push(
        {
          name:
            item.name,

          file:
            item.file,

          font,

          candidates,

          notdefPath
        }
      );

    } catch (
      error
    ) {

      console.error(
        `Failed to load ${item.file}`,
        error
      );
    }
  }


  if (
    fonts.length ===
      0
  ) {

    throw new Error(
      "No usable fonts found."
    );
  }


  const counts =
    new Map();


  for (
    const fontRecord
    of fonts
  ) {

    counts.set(
      fontRecord.name,
      (
        counts.get(
          fontRecord.name
        )
        ||
        0
      )
      +
      fontRecord.candidates.length
    );
  }


  for (
    const [
      name,
      count
    ]
    of counts
  ) {

    console.log(
      `${name}: ${count} candidates`
    );
  }


  return fonts;
}

/* =========================================
   Glyph → SVG data
========================================= */

function makeSvgGlyph(
  fontRecord,
  codePoint
) {

  const {
    font,
    notdefPath
  } =
    fontRecord;


  /*
    cmapに存在するか
  */

  if (
    !font.hasGlyphForCodePoint(
      codePoint
    )
  ) {

    return null;
  }


  let glyph;


  try {

    glyph =
      font.glyphForCodePoint(
        codePoint
      );

  } catch (
    error
  ) {

    return null;
  }


  /*
    glyph 0 は通常 .notdef
  */

  if (
    !glyph
    ||
    glyph.id ===
      0
    ||
    !glyph.path
  ) {

    return null;
  }


  let svgPath;


  try {

    svgPath =
      glyph.path.toSVG();

  } catch (
    error
  ) {

    return null;
  }


  /*
    輪郭が無いなら不採用
  */

  if (
    !svgPath
    ||
    svgPath.trim() ===
      ""
  ) {

    return null;
  }


  /*
    万一 .notdef と同じ輪郭なら不採用
  */

  if (
    notdefPath
    &&
    svgPath ===
      notdefPath
  ) {

    return null;
  }


  let bbox;


  try {

    bbox =
      glyph.path.bbox;

  } catch (
    error
  ) {

    return null;
  }


  if (
    !bbox
  ) {
    return null;
  }


  const width =
    bbox.maxX -
    bbox.minX;


  const height =
    bbox.maxY -
    bbox.minY;


  /*
    形が無い・点しかないものは除外
  */

  if (
    !Number.isFinite(
      width
    )
    ||
    !Number.isFinite(
      height
    )
    ||
    width <=
      0
    ||
    height <=
      0
  ) {

    return null;
  }


  /*
    字面の周囲に8%ほど余白
  */

  const padding =
    Math.max(
      width,
      height
    )
    *
    0.08;


  /*
    フォント座標はYが上向き。

    SVGはYが下向きなので、
    scale(1 -1) して表示する。

    反転後のY範囲は
    -maxY ～ -minY
  */

  const viewBoxX =
    bbox.minX -
    padding;


  const viewBoxY =
    -bbox.maxY -
    padding;


  const viewBoxWidth =
    width +
    padding *
    2;


  const viewBoxHeight =
    height +
    padding *
    2;


  return {
    path:
      svgPath,

    viewBox:
      [
        viewBoxX,
        viewBoxY,
        viewBoxWidth,
        viewBoxHeight
      ].join(
        " "
      )
  };
}


/* =========================================
   Unicode → 文字 と同じフォント優先順位
========================================= */

function inCodePointRange(
  codePoint,
  start,
  end
) {

  return (
    codePoint >=
      start
    &&
    codePoint <=
      end
  );
}


function getDisplayFontPriority(
  codePoint
) {

  /*
    js/fonts.js の getWebFontNames() と
    同じ優先順位にする。

    ここで先頭に来るフォントが、
    Unicode → 文字 で最初に試される
    フォントと一致する。
  */

  if (
    isMusicCodePoint(
      codePoint
    )
  ) {

    return [
      "Noto Music"
    ];
  }


  if (
    isPhoneticsCodePoint(
      codePoint
    )
  ) {

    return [
      "Noto Sans Phonetics"
    ];
  }


  if (
    isJapaneseDisplayCodePoint(
      codePoint
    )
  ) {

    return [
      "Noto Sans JP"
    ];
  }


  if (
    inCodePointRange(
      codePoint,
      0x13460,
      0x143FF
    )
  ) {

    return [
      "UniHieroglyphica",
      "Egyptology Extended",
      "Noto Sans Egyptian Hieroglyphs"
    ];
  }


  if (
    inCodePointRange(
      codePoint,
      0x187F8,
      0x187FF
    )
    ||
    inCodePointRange(
      codePoint,
      0x18D09,
      0x18D1E
    )
    ||
    inCodePointRange(
      codePoint,
      0x18D80,
      0x18DFF
    )
  ) {

    return [
      "Tangut Extended",
      "Noto Serif Tangut"
    ];
  }


  if (
    inCodePointRange(
      codePoint,
      0x1CC00,
      0x1CEBF
    )
  ) {

    return [
      "BabelStone Pseudographica",
      "Noto Sans Symbols 2 Local",
      "Noto Sans Symbols 2"
    ];
  }


  if (
    inCodePointRange(
      codePoint,
      0x101D0,
      0x101FF
    )
    ||
    inCodePointRange(
      codePoint,
      0x10E60,
      0x10E7F
    )
    ||
    inCodePointRange(
      codePoint,
      0x1D2C0,
      0x1D2DF
    )
    ||
    inCodePointRange(
      codePoint,
      0x1F500,
      0x1F5FF
    )
    ||
    inCodePointRange(
      codePoint,
      0x1F650,
      0x1F67F
    )
    ||
    inCodePointRange(
      codePoint,
      0x1F780,
      0x1F7FF
    )
    ||
    inCodePointRange(
      codePoint,
      0x1F800,
      0x1F8FF
    )
    ||
    inCodePointRange(
      codePoint,
      0x1FB00,
      0x1FBFF
    )
  ) {

    return [
      "Noto Sans Symbols 2 Local",
      "Noto Sans Symbols 2"
    ];
  }


  if (
    inCodePointRange(
      codePoint,
      0xF900,
      0xFAFF
    )
    ||
    inCodePointRange(
      codePoint,
      0x20000,
      0x2EE5F
    )
    ||
    inCodePointRange(
      codePoint,
      0x2F800,
      0x2FA1F
    )
    ||
    inCodePointRange(
      codePoint,
      0x30000,
      0x3347F
    )
  ) {

    return [
      "Plangothic P1",
      "Plangothic P2",
      "BabelStone Han"
    ];
  }


  const character =
    String.fromCodePoint(
      codePoint
    );


  if (
    /\p{N}/u.test(
      character
    )
  ) {

    return [
      "Noto Sans Phonetics",
      "Noto Sans JP",
      "Noto Sans Symbols 2"
    ];
  }


  if (
    /(?:\p{S}|\p{P})/u.test(
      character
    )
  ) {

    return [
      "Noto Sans Symbols 2",
      "Noto Sans JP",
      "Noto Sans Phonetics"
    ];
  }


  return [];
}


function getLocalFontRecordsByDisplayName(
  fonts,
  displayName
) {

  const aliases = {
    "Noto Sans Symbols 2 Local":
      "Noto Sans Symbols 2"
  };


  const recordName =
    aliases[
      displayName
    ]
    ||
    displayName;


  return fonts.filter(
    (
      item
    ) =>
      item.name ===
        recordName
  );
}

function resolveDisplaySvg(
  fonts,
  codePoint
) {

  const priority =
    getDisplayFontPriority(
      codePoint
    );


  if (
    priority.length ===
      0
  ) {

    return null;
  }


  const firstRecords =
    getLocalFontRecordsByDisplayName(
      fonts,
      priority[
        0
      ]
    );


  if (
    firstRecords.length ===
      0
  ) {

    return null;
  }


  for (
    const displayName
    of priority
  ) {

    const fontRecords =
      getLocalFontRecordsByDisplayName(
        fonts,
        displayName
      );


    for (
      const fontRecord
      of fontRecords
    ) {

      const svg =
        makeSvgGlyph(
          fontRecord,
          codePoint
        );


      if (
        svg
      ) {

        return {
          fontRecord,
          svg
        };
      }
    }
  }


  return null;
}

/* =========================================
   Generate one entry
========================================= */

function generateEntry(
  fonts,
  date,
  avoidCodePoint = null,
  preferredCategory = null
) {

  const category =
    preferredCategory
    ||
    pickDailyCategory();


  const pools =
    getCategoryPools(
      fonts
    );


  const candidates =
    pools[
      category
    ]
    ||
    [];


  if (
    candidates.length ===
      0
  ) {

    throw new Error(
      "No drawable candidates for daily category: " +
      category
    );
  }


  /*
    先にカテゴリを決め、そのカテゴリの中で
    コードポイントを均等に抽選する。

    フォント数・収録文字数の差で
    エジプト文字などへ偏るのを防ぐ。
  */

  for (
    let attempt = 0;
    attempt < 10000;
    attempt++
  ) {

    const codePoint =
      candidates[
        randomIndex(
          candidates.length
        )
      ];


    if (
      codePoint ===
      avoidCodePoint
    ) {
      continue;
    }


    const resolved =
      resolveDisplaySvg(
        fonts,
        codePoint
      );


    if (
      !resolved
    ) {
      continue;
    }


    const {
      fontRecord:
        displayFontRecord,
      svg
    } =
      resolved;


    const character =
      String.fromCodePoint(
        codePoint
      );


    const hex =
      codePoint
        .toString(
          16
        )
        .toUpperCase();


    return {
      date,

      category,

      codePoint:
        hex,

      character,

      font:
        displayFontRecord.name,

      svg
    };
  }


  throw new Error(
    "Could not generate a drawable daily character for category: " +
    category
  );
}


/* =========================================
   Existing daily data
========================================= */

function loadExistingDailyData() {

  try {

    return JSON.parse(
      fs.readFileSync(
        DAILY_JSON_PATH,
        "utf8"
      )
    );

  } catch (
    error
  ) {

    return {};
  }
}


/* =========================================
   Main
========================================= */

function main() {

  const forceRegenerateCurrent =
    process.env.FORCE_REGENERATE_CURRENT ===
      "true";


  const fonts =
    loadFonts();


  const currentDate =
    getJSTDateString(
      0
    );


  const nextDate =
    getJSTDateString(
      1
    );


  const existing =
    loadExistingDailyData();


  let current;


  if (
    forceRegenerateCurrent
  ) {

    console.log(
      "Manual test mode: regenerating current character."
    );


    current =
      generateEntry(
        fonts,
        currentDate
      );

  } else if (
    existing.current
    &&
    existing.current.date ===
      currentDate
  ) {

    current =
      existing.current;

  } else if (
    existing.next
    &&
    existing.next.date ===
      currentDate
  ) {

    current =
      existing.next;

  } else {

    current =
      generateEntry(
        fonts,
        currentDate
      );
  }


  const next =
    generateEntry(
      fonts,
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
    `Current: ${current.character} U+${current.codePoint} (${current.font})`
  );


  console.log(
    `Next: ${next.character} U+${next.codePoint} (${next.font})`
  );


  console.log(
    "daily.json updated."
  );
}



if (
  require.main === module
) {
  main();
}


module.exports = {
  DAILY_JSON_PATH,
  getJSTDateString,
  loadFonts,
  generateEntry,
  pickDailyCategory,
  getDailyCategory,
  loadExistingDailyData
};
