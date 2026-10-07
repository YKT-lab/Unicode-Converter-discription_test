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

  const viewBox =
    svgData.viewBox
      .trim()
      .split(
        /\s+/
      )
      .map(
        Number
      );


  const [
    viewBoxX,
    viewBoxY,
    viewBoxWidth,
    viewBoxHeight
  ] =
    viewBox;


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.className =
    "daily-character-canvas";


  canvas.setAttribute(
    "role",
    "img"
  );


  canvas.setAttribute(
    "aria-label",
    character
  );


  dailyCharacter.appendChild(
    canvas
  );


  const draw = () => {

    const rect =
      canvas.getBoundingClientRect();


    const cssWidth =
      Math.max(
        rect.width,
        1
      );


    const cssHeight =
      Math.max(
        rect.height,
        1
      );


    const deviceScale =
      Math.max(
        window.devicePixelRatio
        ||
        1,
        1
      );


    /*
      4倍スーパーサンプリング。
      CSS上は小さく見せつつ、
      内部では高解像度で描いてから
      ブラウザに縮小させる。
    */

    const supersample =
      4;


    const pixelWidth =
      Math.ceil(
        cssWidth
        *
        deviceScale
        *
        supersample
      );


    const pixelHeight =
      Math.ceil(
        cssHeight
        *
        deviceScale
        *
        supersample
      );


    if (
      canvas.width !==
        pixelWidth
      ||
      canvas.height !==
        pixelHeight
    ) {

      canvas.width =
        pixelWidth;


      canvas.height =
        pixelHeight;
    }


    const context =
      canvas.getContext(
        "2d",
        {
          alpha:
            true
        }
      );


    if (
      !context
    ) {
      return;
    }


    context.clearRect(
      0,
      0,
      pixelWidth,
      pixelHeight
    );


    context.imageSmoothingEnabled =
      true;


    context.imageSmoothingQuality =
      "high";


    let path;


    try {

      path =
        new Path2D(
          svgData.path
        );

    } catch (
      error
    ) {

      console.warn(
        "Daily Path2D rendering failed:",
        error
      );


      return;
    }


    const scale =
      Math.min(
        pixelWidth /
          viewBoxWidth,
        pixelHeight /
          viewBoxHeight
      );


    const offsetX =
      (
        pixelWidth
        -
        viewBoxWidth *
        scale
      )
      /
      2;


    const offsetY =
      (
        pixelHeight
        -
        viewBoxHeight *
        scale
      )
      /
      2;


    context.save();


    /*
      fontkitのY軸は上向きなので、
      ここでSVG表示時と同じように反転する。
    */

    context.setTransform(
      scale,
      0,
      0,
      -scale,
      offsetX
      -
      viewBoxX *
      scale,
      offsetY
      -
      viewBoxY *
      scale
    );


    context.fillStyle =
      getComputedStyle(
        dailyCharacter
      )
      .color;


    context.fill(
      path
    );


    context.restore();
  };


  requestAnimationFrame(
    draw
  );


  if (
    document.fonts
    &&
    document.fonts.ready
  ) {

    document.fonts.ready
      .then(
        draw
      )
      .catch(
        () => {}
      );
  }
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


function renderDailyTransliteration(
  text
) {

  dailyTransliteration.textContent =
    text;
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


  dailyTransliterationMeta.hidden =
    true;


  dailyTransliteration.replaceChildren();


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

    renderDailyTransliteration(
      transliteration
    );


    dailyTransliterationMeta.hidden =
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



  }
}
