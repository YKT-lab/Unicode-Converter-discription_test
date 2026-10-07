const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "research-test.json");

const UCD_BASE = "https://www.unicode.org/Public/UCD/latest/ucd";

const SOURCES = {
  derivedName: `${UCD_BASE}/extracted/DerivedName.txt`,
  blocks: `${UCD_BASE}/Blocks.txt`,
  scripts: `${UCD_BASE}/Scripts.txt`,
  age: `${UCD_BASE}/DerivedAge.txt`,
  generalCategory: `${UCD_BASE}/extracted/DerivedGeneralCategory.txt`,
  namesList: `${UCD_BASE}/NamesList.txt`,
  unikemet: `${UCD_BASE}/Unikemet.txt`
};

function parseCodePoint(input) {
  const value = String(input || "").trim();

  if (!value) {
    return 0x13014;
  }

  if (/^U\+[0-9A-F]+$/i.test(value)) {
    return parseInt(value.slice(2), 16);
  }

  if (/^[0-9A-F]{4,6}$/i.test(value)) {
    return parseInt(value, 16);
  }

  const first = Array.from(value)[0];

  if (!first) {
    throw new Error("Invalid character input.");
  }

  return first.codePointAt(0);
}

function hex(codePoint) {
  return codePoint.toString(16).toUpperCase().padStart(4, "0");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Unicode-Converter research test"
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return response.text();
}

function parseRange(raw) {
  const value = raw.trim();

  if (value.includes("..")) {
    const [start, end] = value.split("..");
    return [parseInt(start, 16), parseInt(end, 16)];
  }

  const point = parseInt(value, 16);
  return [point, point];
}

function findSemicolonProperty(text, codePoint) {
  for (const line of text.split(/\r?\n/)) {
    const data = line.split("#")[0].trim();

    if (!data || !data.includes(";")) {
      continue;
    }

    const [rangeText, valueText] = data.split(";", 2);
    const [start, end] = parseRange(rangeText);

    if (codePoint >= start && codePoint <= end) {
      return valueText.trim();
    }
  }

  return null;
}

function findDerivedName(text, codePoint) {
  const value = findSemicolonProperty(text, codePoint);

  if (!value) {
    return null;
  }

  return value.replace("*", hex(codePoint));
}

function findNamesListEntry(text, codePoint) {
  const lines = text.split(/\r?\n/);
  const target = hex(codePoint);
  let collecting = false;
  const raw = [];

  for (const line of lines) {
    const match = line.match(/^([0-9A-F]{4,6})\t(.*)$/);

    if (match) {
      if (collecting) {
        break;
      }

      if (match[1] === target) {
        collecting = true;
        raw.push({
          type: "name",
          text: match[2].trim()
        });
      }

      continue;
    }

    if (!collecting || !line.startsWith("\t")) {
      continue;
    }

    const item = line.trim();

    if (!item) {
      continue;
    }

    const marker = item[0];
    const body = item.slice(1).trim();

    const typeMap = {
      "*": "comment",
      "=": "alias",
      "%": "formalAlias",
      "#": "notice",
      "x": "crossReference",
      ":": "decomposition",
      "~": "variation"
    };

    raw.push({
      type: typeMap[marker] || "other",
      text: body || item
    });
  }

  return raw;
}

function findUnikemet(text, codePoint) {
  const target = `U+${hex(codePoint)}`;
  const properties = {};

  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    const fields = line.split("\t");

    if (fields.length < 3 || fields[0].trim() !== target) {
      continue;
    }

    const property = fields[1].trim();
    const value = fields.slice(2).join("\t").trim();

    if (property && value) {
      properties[property] = value;
    }
  }

  return properties;
}

function makeFacts(namesList, unikemet) {
  const facts = [];

  const push = (kind, text, source, strength = "strong") => {
    if (!text) {
      return;
    }

    if (facts.some((item) => item.kind === kind && item.text === text)) {
      return;
    }

    facts.push({
      kind,
      text,
      source,
      strength
    });
  };

  push("appearance", unikemet.kEH_Desc, "Unicode Unikemet", "strong");
  push("function", unikemet.kEH_Func, "Unicode Unikemet", "strong");
  push("functionValue", unikemet.kEH_FVal, "Unicode Unikemet", "strong");

  for (const item of namesList) {
    if (["comment", "alias", "formalAlias", "notice"].includes(item.type)) {
      push(
        `namesList:${item.type}`,
        item.text,
        "Unicode NamesList",
        item.type === "comment" ? "strong" : "supporting"
      );
    }
  }

  push("catalogIndex", unikemet.kEH_UniK, "Unicode Unikemet", "supporting");
  push("taxonomyIndex", unikemet.kEH_Cat, "Unicode Unikemet", "supporting");
  push("coreStatus", unikemet.kEH_Core, "Unicode Unikemet", "supporting");

  return facts;
}

async function main() {
  const codePoint = parseCodePoint(process.argv[2] || process.env.CODE_POINT);
  const character = String.fromCodePoint(codePoint);

  console.log(`Researching ${character} U+${hex(codePoint)}...`);

  const [
    derivedNameText,
    blocksText,
    scriptsText,
    ageText,
    categoryText,
    namesListText,
    unikemetText
  ] = await Promise.all([
    fetchText(SOURCES.derivedName),
    fetchText(SOURCES.blocks),
    fetchText(SOURCES.scripts),
    fetchText(SOURCES.age),
    fetchText(SOURCES.generalCategory),
    fetchText(SOURCES.namesList),
    fetchText(SOURCES.unikemet)
  ]);

  const unicodeName = findDerivedName(derivedNameText, codePoint);
  const block = findSemicolonProperty(blocksText, codePoint);
  const scriptName = findSemicolonProperty(scriptsText, codePoint);
  const age = findSemicolonProperty(ageText, codePoint);
  const generalCategory = findSemicolonProperty(categoryText, codePoint);
  const namesList = findNamesListEntry(namesListText, codePoint);
  const unikemet = findUnikemet(unikemetText, codePoint);
  const facts = makeFacts(namesList, unikemet);

  const strongFacts = facts.filter((item) => item.strength === "strong");
  const hasIdentity = Boolean(unicodeName && block && scriptName);
  const accepted = hasIdentity && facts.length >= 2 && strongFacts.length >= 1;

  const result = {
    generatedAt: new Date().toISOString(),
    testOnly: true,
    accepted,
    reason: accepted
      ? "Unicode公式資料から、文字固有の情報を2件以上（うち強い情報1件以上）確認できた。"
      : "Unicode公式資料だけでは、現在の掲載基準を満たす文字固有情報を確認できなかった。",
    character,
    codePoint: `U+${hex(codePoint)}`,
    metadata: {
      unicodeName,
      block,
      script: scriptName,
      age,
      generalCategory
    },
    facts,
    unicodeData: {
      namesList,
      unikemet
    },
    sources: Object.entries(SOURCES).map(([name, url]) => ({
      name,
      url
    }))
  };

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(result, null, 2) + "\n",
    "utf8"
  );

  console.log(JSON.stringify({
    accepted: result.accepted,
    codePoint: result.codePoint,
    unicodeName: result.metadata.unicodeName,
    factCount: result.facts.length,
    strongFactCount: strongFacts.length
  }, null, 2));

  console.log(`Saved: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
