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
   Load fonts
========================================= */

function loadFonts() {

  const fonts =
    [];


  for (
    const item
    of FONT_FILES
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

        console.warn(
          `No candidates: ${item.name}`
        );


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


      console.log(
        `${item.name}: ${candidates.length} candidates`
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


  return [];
}


function getLocalFontRecordByDisplayName(
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


  return fonts.find(
    (
      item
    ) =>
      item.name ===
        recordName
  )
  ||
  null;
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


  /*
    Unicode → 文字 側で最初に指定されている
    フォントがローカルに無い場合は、
    別フォントでSVGを作ると字体が一致しない。

    そのため、その候補自体を日次文字には採用しない。
  */

  const firstRecord =
    getLocalFontRecordByDisplayName(
      fonts,
      priority[
        0
      ]
    );


  if (
    !firstRecord
  ) {

    return null;
  }


  for (
    const displayName
    of priority
  ) {

    const fontRecord =
      getLocalFontRecordByDisplayName(
        fonts,
        displayName
      );


    if (
      !fontRecord
    ) {
      continue;
    }


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


  return null;
}


/* =========================================
   Generate one entry
========================================= */

function generateEntry(
  fonts,
  date,
  avoidCodePoint = null
) {

  /*
    失敗した候補は捨てて
    別の文字を再抽選する。

    daily.json に入る時点では
    必ずSVG輪郭を取得済みにする。
  */

  for (
    let attempt = 0;
    attempt < 10000;
    attempt++
  ) {

    /*
      フォントを先にランダム選択。

      こうすることでPlangothicの
      巨大な漢字数だけに
      抽選が偏りすぎない。
    */

    const fontRecord =
      fonts[
        randomIndex(
          fonts.length
        )
      ];


    const codePoint =
      fontRecord.candidates[
        randomIndex(
          fontRecord
            .candidates
            .length
        )
      ];


    if (
      codePoint ===
      avoidCodePoint
    ) {
      continue;
    }


    /*
      抽選元のフォントではなく、
      Unicode → 文字 と同じ優先順位で
      実際に表示用フォントを選び直す。
    */

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

      codePoint:
        hex,

      character,

      font:
        displayFontRecord.name,

      svg
    };
  }


  throw new Error(
    "Could not generate a drawable daily character."
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
  loadExistingDailyData
};
