/* =========================================
   JST date
========================================= */

function getJSTDateString() {

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Tokyo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    )
    .formatToParts(
      new Date()
    );


  const part =
    (type) => {

      return parts.find(
        (item) =>
          item.type ===
          type
      )?.value;

    };


  return (
    part("year")
    +
    "-"
    +
    part("month")
    +
    "-"
    +
    part("day")
  );
}

/* =========================================
   Daily SVG validation
========================================= */

function isValidDailySvg(
  svgData
) {

  if (
    !svgData
    ||
    typeof svgData.path !==
      "string"
    ||
    typeof svgData.viewBox !==
      "string"
    ||
    svgData.path.trim() ===
      ""
  ) {

    return false;
  }


  const viewBoxParts =
    svgData.viewBox
      .trim()
      .split(
        /\s+/
      )
      .map(
        Number
      );


  if (
    viewBoxParts.length !==
    4
  ) {
    return false;
  }


  if (
    !viewBoxParts.every(
      Number.isFinite
    )
  ) {
    return false;
  }


  if (
    viewBoxParts[2] <=
      0
    ||
    viewBoxParts[3] <=
      0
  ) {
    return false;
  }


  return true;
}

/* =========================================
   Render Daily SVG
========================================= */

function renderDailySvg(
  svgData,
  character
) {

  const SVG_NS =
    "http://www.w3.org/2000/svg";


  const svg =
    document.createElementNS(
      SVG_NS,
      "svg"
    );


  svg.classList.add(
    "daily-character-svg"
  );


  svg.setAttribute(
    "viewBox",
    svgData.viewBox
  );


  svg.setAttribute(
    "preserveAspectRatio",
    "xMidYMid meet"
  );


  svg.setAttribute(
    "role",
    "img"
  );


  svg.setAttribute(
    "aria-label",
    character
  );


  svg.setAttribute(
    "focusable",
    "false"
  );


  /*
    CSSを追加していなくても
    このJSだけで適切な大きさになる
  */

  svg.style.display =
    "block";


  svg.style.width =
    "110px";


  svg.style.height =
    "110px";


  svg.style.maxWidth =
    "100%";


  svg.style.overflow =
    "visible";


  svg.style.pointerEvents =
    "none";


  svg.style.shapeRendering =
    "geometricPrecision";


  const path =
    document.createElementNS(
      SVG_NS,
      "path"
    );


  path.setAttribute(
    "d",
    svgData.path
  );


  /*
    Font座標はYが上向き、
    SVGはYが下向きなので反転する。

    generate-daily.js側のviewBoxも
    この反転を前提に生成する。
  */

  path.setAttribute(
    "transform",
    "scale(1 -1)"
  );


  path.setAttribute(
    "fill",
    "currentColor"
  );


  svg.appendChild(
    path
  );


  dailyCharacter.appendChild(
    svg
  );
}

/* =========================================
   Daily old-font fallback
========================================= */

async function renderDailyFontFallback(
  codePoint,
  character
) {

  if (
    isInvisibleCharacter(
      codePoint,
      character
    )
  ) {

    dailyCharacter.className =
      "character font-normal";


    dailyCharacter.textContent =
      "不可視";


    return;
  }


  dailyCharacter.className =
    "character "
    +
    getFontClass(
      codePoint
    )
    +
    " loading-character";


  dailyCharacter.textContent =
    "";


  const inner =
    document.createElement(
      "span"
    );


  inner.className =
    "daily-glyph-inner";


  inner.textContent =
    character;


  dailyCharacter.appendChild(
    inner
  );


  await waitForCharacterFont(
    codePoint,
    character
  );


  const fontFamily =
    getComputedStyle(
      inner
    )
    .fontFamily;


  if (
    isRenderedBlank(
      character,
      fontFamily
    )
  ) {

    dailyCharacter.className =
      "character font-normal";


    dailyCharacter.textContent =
      "空白";


    return;
  }


  if (
    looksLikeMissingGlyph(
      character,
      fontFamily
    )
  ) {

    dailyCharacter.className =
      "character font-normal";


    dailyCharacter.textContent =
      "未対応";


    return;
  }


  dailyCharacter
    .classList
    .remove(
      "loading-character"
    );


  applyDailyGlyphScale(
    inner,
    codePoint,
    character
  );
}

/* =========================================
   Daily explanation
========================================= */

function setDailyInlineGlyphFont(
  element,
  entry
) {

  const families = {
    "Tangut Extended":
      "Tangut Extended",

    "Plangothic P1":
      "Plangothic P1",

    "Plangothic P2":
      "Plangothic P2",

    "Egyptology Extended":
      "Egyptology Extended",

    "UniHieroglyphica":
      "UniHieroglyphica",

    "BabelStone Pseudographica":
      "BabelStone Pseudographica",

    "Noto Sans Symbols 2":
      "Noto Sans Symbols 2 Local"
  };


  const family =
    families[
      entry.font
    ];


  if (
    family
  ) {

    element.style.fontFamily =
      `"${family}"`;

    return;
  }


  element.classList.add(
    getFontClass(
      parseInt(
        entry.codePoint,
        16
      )
    )
  );
}


function renderDailySummary(
  text,
  entry
) {

  dailySummary.replaceChildren();


  if (
    typeof text !==
      "string"
    ||
    !text.trim()
  ) {
    return;
  }


  const summary =
    text.trim();


  const codeMatch =
    summary.match(
      /^U\+[0-9A-F]+/i
    );


  if (
    !codeMatch
  ) {

    dailySummary.textContent =
      summary;


    return;
  }


  const glyph =
    document.createElement(
      "span"
    );


  glyph.className =
    "daily-inline-glyph";


  glyph.textContent =
    String.fromCodePoint(
      parseInt(
        entry.codePoint,
        16
      )
    );


  setDailyInlineGlyphFont(
    glyph,
    entry
  );


  dailySummary.appendChild(
    glyph
  );


  dailySummary.appendChild(
    document.createTextNode(
      summary.slice(
        codeMatch[
          0
        ].length
      )
    )
  );
}


function getDailyTransliteration(
  info
) {

  if (
    !Array.isArray(
      info?.facts
    )
  ) {
    return "";
  }


  const fact =
    info.facts.find(
      (
        item
      ) =>
        item
        &&
        item.kind ===
          "functionValue"
        &&
        typeof item.text ===
          "string"
        &&
        item.text.trim()
    );


  return fact
    ? fact.text.trim()
    : "";
}


function resetDailyInfo() {

  dailyName.hidden =
    true;


  dailyName.textContent =
    "";


  dailyInfo.hidden =
    true;


  dailySummary.replaceChildren();


  dailyUsageSection.hidden =
    true;


  dailyUsage.textContent =
    "";


  dailyTransliterationSection.hidden =
    true;


  dailyTransliteration.textContent =
    "";


  dailySupplementSection.hidden =
    true;


  dailySupplement.textContent =
    "";


  dailySources.hidden =
    true;


  dailySources.open =
    false;


  dailySourceList.replaceChildren();
}


function renderDailyInfo(
  info,
  entry
) {

  resetDailyInfo();


  if (
    !info
    ||
    typeof info !==
      "object"
  ) {
    return;
  }


  if (
    typeof info.unicodeName ===
      "string"
    &&
    info.unicodeName.trim()
  ) {

    dailyName.textContent =
      info.unicodeName.trim();


    dailyName.hidden =
      false;
  }


  if (
    typeof info.summary !==
      "string"
    ||
    !info.summary.trim()
  ) {
    return;
  }


  renderDailySummary(
    info.summary,
    entry
  );


  dailyInfo.hidden =
    false;


  if (
    typeof info.usage ===
      "string"
    &&
    info.usage.trim()
  ) {

    dailyUsage.textContent =
      info.usage.trim();


    dailyUsageSection.hidden =
      false;
  }


  const transliteration =
    getDailyTransliteration(
      info
    );


  if (
    transliteration
  ) {

    dailyTransliteration.textContent =
      transliteration;


    dailyTransliterationSection.hidden =
      false;
  }


  if (
    typeof info.supplementalInfo ===
      "string"
    &&
    info.supplementalInfo.trim()
  ) {

    dailySupplement.textContent =
      info.supplementalInfo.trim();


    dailySupplementSection.hidden =
      false;
  }


  if (
    Array.isArray(
      info.sources
    )
  ) {

    for (
      const source
      of info.sources
    ) {

      if (
        !source
        ||
        typeof source.url !==
          "string"
        ||
        !/^https:\/\//i.test(
          source.url
        )
      ) {
        continue;
      }


      const item =
        document.createElement(
          "li"
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        source.url;


      link.target =
        "_blank";


      link.rel =
        "noopener noreferrer";


      link.textContent =
        (
          typeof source.name ===
            "string"
          &&
          source.name.trim()
        )
          ? source.name.trim()
          : source.url;


      item.appendChild(
        link
      );


      dailySourceList.appendChild(
        item
      );
    }


    if (
      dailySourceList.children.length >
        0
    ) {

      dailySources.hidden =
        false;
    }
  }
}


/* =========================================
   Daily character
========================================= */

async function loadDailyCharacter() {

  hideUnicodeScope();


  dailyCharacter.className =
    "character loading-character";


  dailyCharacter.textContent =
    "?";


  dailyCode.textContent =
    "読み込み中…";


  resetDailyInfo();


  dailyResearchLink
    .classList
    .add(
      "disabled"
    );


  dailyResearchLink.href =
    "#";


  try {

    const response =
      await fetch(
        "./daily.json?t="
        +
        Date.now(),
        {
          cache:
            "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "daily.json load failed"
      );
    }


    const data =
      await response.json();


    const today =
      getJSTDateString();


    const entry =
      [
        data.current,
        data.next
      ]
      .filter(
        Boolean
      )
      .find(
        (item) =>
          item.date ===
          today
      );


    if (
      !entry
      ||
      typeof entry.codePoint !==
        "string"
      ||
      !/^[0-9A-F]+$/i
        .test(
          entry.codePoint
        )
    ) {

      throw new Error(
        "today entry not found"
      );
    }


    const codePoint =
      parseInt(
        entry.codePoint,
        16
      );


    if (
      !Number.isInteger(
        codePoint
      )
      ||
      codePoint <
        0
      ||
      codePoint >
        0x10FFFF
      ||
      (
        codePoint >=
          0xD800
        &&
        codePoint <=
          0xDFFF
      )
    ) {

      throw new Error(
        "invalid code point"
      );
    }


    /*
      character欄がGitHub上で
      空白に見えていても関係ない。

      codePointからこちらで
      本物のUnicode文字を復元する。
    */

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


    dailyCode.textContent =
      "U+"
      +
      hex;


    renderDailyInfo(
      entry.info,
      entry
    );


    dailyResearchLink.href =
      "https://0g0.org/unicode/"
      +
      hex
      +
      "/";


    /*
      新方式

      daily.json にSVG輪郭があるなら
      フォントを一切使わずSVG表示。
    */

    if (
      isValidDailySvg(
        entry.svg
      )
    ) {

      dailyCharacter.className =
        "character";


      dailyCharacter.textContent =
        "";


      renderDailySvg(
        entry.svg,
        character
      );


      dailyResearchLink
        .classList
        .remove(
          "disabled"
        );


      return;
    }


    /*
      移行期間用

      まだdaily.jsonが旧形式なら
      従来のフォント表示を使う。

      新しいGitHub Actionsが
      daily.jsonを更新した後は
      基本的にこちらには来ない。
    */

    console.warn(
      "Daily SVG is not available. Using font fallback."
    );


    await renderDailyFontFallback(
      codePoint,
      character
    );


    dailyResearchLink
      .classList
      .remove(
        "disabled"
      );

  } catch (
    error
  ) {

    console.error(
      error
    );


    dailyCharacter.className =
      "character font-normal";


    dailyCharacter.textContent =
      "？";


    dailyCode.textContent =
      "更新待ち";


    dailyResearchLink
      .classList
      .add(
        "disabled"
      );
  }
}
