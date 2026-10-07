/* =========================================
   Status label
========================================= */

function makeStatusSpan(
  text
) {

  const span =
    document.createElement(
      "span"
    );


  span.className =
    "character-status";


  span.textContent =
    text;


  return span;
}

/* =========================================
   Character → Unicode
========================================= */

function convertCharacters() {

  const text =
    charInput.value;


  if (
    text.length ===
    0
  ) {

    unicodeOutput.textContent =
      "";


    return;
  }


  unicodeOutput.textContent =
    Array.from(
      text
    )
    .map(
      (character) => {

        return (
          "U+"
          +
          character
            .codePointAt(
              0
            )
            .toString(
              16
            )
            .toUpperCase()
        );

      }
    )
    .join(
      " "
    );
}

/* =========================================
   Unicode parser
========================================= */

function parseUnicodeToken(
  token
) {

  let value =
    token
      .trim()
      .replace(
        /^U\+/i,
        ""
      )
      .replace(
        /^0x/i,
        ""
      );


  if (
    !/^[0-9A-F]+$/i
      .test(
        value
      )
  ) {
    return null;
  }


  const codePoint =
    parseInt(
      value,
      16
    );


  if (
    !Number.isInteger(
      codePoint
    )
  ) {
    return null;
  }


  if (
    codePoint <
    0
    ||
    codePoint >
    0x10FFFF
  ) {
    return null;
  }


  if (
    codePoint >=
      0xD800
    &&
    codePoint <=
      0xDFFF
  ) {
    return null;
  }


  return codePoint;
}

/* =========================================
   History
========================================= */

const unicodeHistory =
  [];


function updateBackButton() {

  backUnicode.disabled =
    unicodeHistory.length ===
    0;
}


function saveUnicodeHistory() {

  const currentValue =
    unicodeInput.value;


  const lastValue =
    unicodeHistory[
      unicodeHistory.length -
      1
    ];


  if (
    currentValue ===
    lastValue
  ) {
    return;
  }


  unicodeHistory.push(
    currentValue
  );


  if (
    unicodeHistory.length >
    50
  ) {

    unicodeHistory.shift();
  }


  updateBackButton();
}

/* =========================================
   Input timer
========================================= */

let unicodeRun =
  0;


let unicodeInputTimer =
  null;

/* =========================================
   Back
========================================= */

function goBackUnicode() {

  if (
    unicodeHistory.length ===
    0
  ) {
    return;
  }


  unicodeRun++;


  clearTimeout(
    unicodeInputTimer
  );


  unicodeInput.value =
    unicodeHistory.pop();


  updateBackButton();


  convertUnicode();
}

/* =========================================
   Glyph DOM
========================================= */

function createGlyphElement(
  codePoint,
  character
) {

  const wrapper =
    document.createElement(
      "span"
    );


  wrapper.className =
    "character-span "
    +
    getFontClass(
      codePoint
    );


  const inner =
    document.createElement(
      "span"
    );


  inner.className =
    "glyph-inner";


  inner.textContent =
    character;


  wrapper.appendChild(
    inner
  );


  return {
    wrapper,
    inner
  };
}

/* =========================================
   Unicode → Character
========================================= */

async function convertUnicode() {

  const currentRun =
    ++unicodeRun;


  const raw =
    unicodeInput.value.trim();


  charOutput.className =
    "result character-result";


  charOutput.textContent =
    "";


  hideUnicodeScope();


  if (
    raw.length ===
    0
  ) {
    return;
  }


  const tokens =
    raw
      .split(
        /[\s,]+/
      )
      .filter(
        Boolean
      );


  for (
    const token
    of tokens
  ) {

    if (
      currentRun !==
      unicodeRun
    ) {
      return;
    }


    const codePoint =
      parseUnicodeToken(
        token
      );


    if (
      codePoint ===
      null
    ) {

      const error =
        document.createElement(
          "span"
        );


      error.className =
        "invalid-unicode";


      error.textContent =
        "無効: "
        +
        token;


      charOutput.appendChild(
        error
      );


      await yieldToBrowser();


      continue;
    }


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


    if (
      isInvisibleCharacter(
        codePoint,
        character
      )
    ) {

      charOutput.appendChild(
        makeStatusSpan(
          "不可視: U+"
          +
          hex
        )
      );


      await yieldToBrowser();


      continue;
    }


    const {
      wrapper,
      inner
    } =
      createGlyphElement(
        codePoint,
        character
      );


    const fontNames =
      getWebFontNames(
        codePoint
      );


    if (
      fontNames.length >
      0
    ) {

      wrapper.classList.add(
        "loading-character"
      );
    }


    charOutput.appendChild(
      wrapper
    );


    await yieldToBrowser();


    if (
      currentRun !==
      unicodeRun
    ) {
      return;
    }


    if (
      fontNames.length >
      0
    ) {

      await waitForCharacterFont(
        codePoint,
        character
      );
    }


    if (
      currentRun !==
      unicodeRun
    ) {
      return;
    }


    wrapper.classList.remove(
      "loading-character"
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

      wrapper.replaceWith(
        makeStatusSpan(
          "空白: U+"
          +
          hex
        )
      );


      await yieldToBrowser();


      continue;
    }


    if (
      looksLikeMissingGlyph(
        character,
        fontFamily
      )
    ) {

      wrapper.replaceWith(
        makeStatusSpan(
          "未対応: U+"
          +
          hex
        )
      );


      await yieldToBrowser();


      continue;
    }


    applyGlyphScale(
      wrapper,
      inner,
      codePoint,
      character
    );


    await yieldToBrowser();
  }
}
