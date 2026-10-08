/* =========================================
   Unicode → Font class
========================================= */

function getFontClass(
  codePoint
) {

  /* Latin Extended-D */

  if (
    inRange(
      codePoint,
      0xA720,
      0xA7FF
    )
  ) {
    return "font-latin-extended-d";
  }


  /* Kawi */

  if (
    inRange(
      codePoint,
      0x11F00,
      0x11F5F
    )
  ) {
    return "font-kawi";
  }


  /* Toto */

  if (
    inRange(
      codePoint,
      0x1E290,
      0x1E2BF
    )
  ) {
    return "font-toto";
  }


  /* Tangut Extended */

  if (
    inRange(
      codePoint,
      0x187F8,
      0x187FF
    )
    ||
    inRange(
      codePoint,
      0x18D09,
      0x18D1E
    )
    ||
    inRange(
      codePoint,
      0x18D80,
      0x18DFF
    )
  ) {
    return "font-tangut-extended";
  }


  /* Tangut iteration mark */

  if (
    codePoint ===
    0x16FE0
  ) {
    return "font-tangut";
  }


  /* Tangut + Components */

  if (
    inRange(
      codePoint,
      0x17000,
      0x187F7
    )
    ||
    inRange(
      codePoint,
      0x18800,
      0x18AFF
    )
    ||
    inRange(
      codePoint,
      0x18D00,
      0x18D08
    )
  ) {
    return "font-tangut";
  }


  /* Nüshu iteration mark */

  if (
    codePoint ===
    0x16FE1
  ) {
    return "font-nushu";
  }


  /* Nüshu */

  if (
    inRange(
      codePoint,
      0x1B170,
      0x1B2FF
    )
  ) {
    return "font-nushu";
  }


  /* Khitan */

  if (
    inRange(
      codePoint,
      0x18B00,
      0x18CFF
    )
  ) {
    return "font-khitan";
  }


  /* Cuneiform */

  if (
    inRange(
      codePoint,
      0x12000,
      0x1254F
    )
  ) {
    return "font-cuneiform";
  }


  /* Egyptian Extended-A */

  if (
    inRange(
      codePoint,
      0x13460,
      0x143FF
    )
  ) {
    return "font-egyptian-extended";
  }


  /* Egyptian */

  if (
    inRange(
      codePoint,
      0x13000,
      0x1345F
    )
  ) {
    return "font-egyptian";
  }


  /* Anatolian */

  if (
    inRange(
      codePoint,
      0x14400,
      0x1467F
    )
  ) {
    return "font-anatolian";
  }


  /* Tangsa */

  if (
    inRange(
      codePoint,
      0x16A70,
      0x16ACF
    )
  ) {
    return "font-tangsa";
  }


  /* Nandinagari */

  if (
    inRange(
      codePoint,
      0x119A0,
      0x119FF
    )
  ) {
    return "font-nandinagari";
  }


  /* Musical */

  if (
    inRange(
      codePoint,
      0x1D000,
      0x1D24F
    )
  ) {
    return "font-music";
  }


  /* SignWriting */

  if (
    inRange(
      codePoint,
      0x1D800,
      0x1DAAF
    )
  ) {
    return "font-signwriting";
  }


  /* Indic Siyaq */

  if (
    inRange(
      codePoint,
      0x1EC70,
      0x1ECBF
    )
  ) {
    return "font-indic-siyaq";
  }


  /* Arabic Mathematical */

  if (
    inRange(
      codePoint,
      0x1EE00,
      0x1EEFF
    )
  ) {
    return "font-math";
  }


  /* Legacy Computing Supplement */

  if (
    inRange(
      codePoint,
      0x1CC00,
      0x1CEBF
    )
  ) {
    return "font-legacy-supp";
  }


  /* Phaistos Disc */

  if (
    inRange(
      codePoint,
      0x101D0,
      0x101FF
    )
  ) {
    return "font-symbols2";
  }


  /* Rumi Numeral Symbols */

  if (
    inRange(
      codePoint,
      0x10E60,
      0x10E7F
    )
  ) {
    return "font-symbols2";
  }


  /* Kaktovik Numerals */

  if (
    inRange(
      codePoint,
      0x1D2C0,
      0x1D2DF
    )
  ) {
    return "font-symbols2";
  }


  /* Misc Symbols + Pictographs */

  if (
    inRange(
      codePoint,
      0x1F500,
      0x1F5FF
    )
  ) {
    return "font-symbols2";
  }


  /* Ornamental Dingbats */

  if (
    inRange(
      codePoint,
      0x1F650,
      0x1F67F
    )
  ) {
    return "font-symbols2";
  }


  /* Geometric Shapes Extended */

  if (
    inRange(
      codePoint,
      0x1F780,
      0x1F7FF
    )
  ) {
    return "font-symbols2";
  }


  /* Supplemental Arrows-C */

  if (
    inRange(
      codePoint,
      0x1F800,
      0x1F8FF
    )
  ) {
    return "font-symbols2";
  }


  /* Legacy Computing */

  if (
    inRange(
      codePoint,
      0x1FB00,
      0x1FBFF
    )
  ) {
    return "font-symbols2";
  }


  /* CJK Compatibility */

  if (
    inRange(
      codePoint,
      0xF900,
      0xFAFF
    )
  ) {
    return "font-cjk-ext";
  }


  /* CJK Extensions */

  if (
    inRange(
      codePoint,
      0x20000,
      0x2EE5F
    )
    ||
    inRange(
      codePoint,
      0x2F800,
      0x2FA1F
    )
    ||
    inRange(
      codePoint,
      0x30000,
      0x3347F
    )
  ) {
    return "font-cjk-ext";
  }


  return "font-normal";
}

/* =========================================
   Font names
========================================= */

function getWebFontNames(
  codePoint
) {

  switch (
    getFontClass(
      codePoint
    )
  ) {

    case "font-latin-extended-d":
      return [
        "Noto Sans"
      ];


    case "font-kawi":
      return [
        "Noto Sans Kawi"
      ];


    case "font-toto":
      return [
        "Noto Serif Toto"
      ];


    case "font-tangut":
      return [
        "Noto Serif Tangut"
      ];


    case "font-tangut-extended":
      return [
        "Tangut Extended",
        "Noto Serif Tangut"
      ];


    case "font-nushu":
      return [
        "Noto Sans Nushu"
      ];


    case "font-khitan":
      return [
        "Noto Serif Khitan Small Script"
      ];


    case "font-cuneiform":
      return [
        "Noto Sans Cuneiform"
      ];


    case "font-egyptian":
      return [
        "Noto Sans Egyptian Hieroglyphs"
      ];


    case "font-egyptian-extended":
      return [
        "UniHieroglyphica",
        "Egyptology Extended",
        "Noto Sans Egyptian Hieroglyphs"
      ];


    case "font-anatolian":
      return [
        "Noto Sans Anatolian Hieroglyphs"
      ];


    case "font-tangsa":
      return [
        "Noto Sans Tangsa"
      ];


    case "font-nandinagari":
      return [
        "Noto Sans Nandinagari"
      ];


    case "font-music":
      return [
        "Noto Music"
      ];


    case "font-signwriting":
      return [
        "Noto Sans SignWriting"
      ];


    case "font-symbols2":
      return [
        "Noto Sans Symbols 2 Local",
        "Noto Sans Symbols 2"
      ];


    case "font-legacy-supp":
      return [
        "BabelStone Pseudographica",
        "Noto Sans Symbols 2 Local",
        "Noto Sans Symbols 2"
      ];


    case "font-math":
      return [
        "Noto Sans Math"
      ];


    case "font-indic-siyaq":
      return [
        "Noto Sans Indic Siyaq Numbers"
      ];


    case "font-cjk-ext":
      return [
        "Plangothic P1",
        "Plangothic P2",
        "BabelStone Han"
      ];


    default:
      return [];
  }
}

/* =========================================
   Font loading
========================================= */

async function waitForCharacterFont(
  codePoint,
  character
) {

  const fontNames =
    getWebFontNames(
      codePoint
    );


  if (
    fontNames.length ===
    0
  ) {
    return;
  }


  if (
    !document.fonts
  ) {

    await sleep(
      800
    );

    return;
  }


  try {

    const loads =
      fontNames.map(
        (fontName) => {

          return document.fonts.load(
            `100px "${fontName}"`,
            character
          );

        }
      );


    await Promise.race(
      [
        Promise.allSettled(
          loads
        ),

        sleep(
          6000
        )
      ]
    );

  } catch (
    error
  ) {

    console.warn(
      "Font loading failed:",
      error
    );
  }
}
