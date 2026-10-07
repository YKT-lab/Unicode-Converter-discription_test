const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUT_PATH = path.join(ROOT, "research-test.json");
const OUTPUT_PATH = path.join(ROOT, "description-test.json");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set.");
}

const research = JSON.parse(
  fs.readFileSync(INPUT_PATH, "utf8")
);

if (!research.accepted) {
  throw new Error("Research result is not accepted.");
}

const prompt = [
  "あなたはUnicode文字図鑑の編集者です。",
  "以下のUnicode公式資料から取得した事実だけを使って、日本語の短い解説を書いてください。",
  "資料にない事実を補わないでください。推測は禁止です。",
  "専門用語は必要なら短く言い換えてください。",
  "summaryは1〜2文、usageは1〜2文、triviaは1文程度にしてください。",
  "triviaに適切な内容がなければ空文字列にしてください。",
  "",
  "対象文字:",
  research.character + " " + research.codePoint,
  "",
  "基本情報:",
  JSON.stringify(research.metadata, null, 2),
  "",
  "確認済みの文字固有情報:",
  JSON.stringify(research.facts, null, 2)
].join("\n");

const body = {
  model: "gemini-3.1-flash-lite",
  input: prompt,
  response_format: {
    type: "text",
    mime_type: "application/json",
    schema: {
      type: "object",
      properties: {
        summary: {
          type: "string"
        },
        usage: {
          type: "string"
        },
        trivia: {
          type: "string"
        }
      },
      required: [
        "summary",
        "usage",
        "trivia"
      ]
    }
  }
};

async function main() {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      "Gemini API error: " +
      response.status +
      " " +
      raw
    );
  }

  const data = JSON.parse(raw);

  const text = (data.steps || [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error(
      "Gemini returned no text. Raw response: " + raw
    );
  }

  const description = JSON.parse(text);

  const result = {
    generatedAt: new Date().toISOString(),
    testOnly: true,
    model: "gemini-3.1-flash-lite",
    character: research.character,
    codePoint: research.codePoint,
    unicodeName: research.metadata.unicodeName,
    description,
    sourceFacts: research.facts
  };

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(result, null, 2) + "\n",
    "utf8"
  );

  console.log(
    JSON.stringify(
      result.description,
      null,
      2
    )
  );

  console.log(
    "Saved: " + OUTPUT_PATH
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
