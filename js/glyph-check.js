/* =========================================
   Invisible characters
========================================= */

const knownInvisibleCodePoints =
  new Set([
    0x115F,
    0x1160,
    0x2800,
    0x3164,
    0xFFA0
  ]);


function isInvisibleCharacter(
  codePoint,
  character
) {

  if (
    knownInvisibleCodePoints.has(
      codePoint
    )
  ) {
    return true;
  }


  try {

    return (
      /\p{Default_Ignorable_Code_Point}/u
        .test(
          character
        )
    );

  } catch (
    error
  ) {

    console.warn(
      "Default_Ignorable check unavailable:",
      error
    );


    return false;
  }
}

/* =========================================
   Canvas glyph analysis
========================================= */

const glyphCanvas =
  document.createElement(
    "canvas"
  );


glyphCanvas.width =
  280;


glyphCanvas.height =
  280;


const glyphContext =
  glyphCanvas.getContext(
    "2d",
    {
      willReadFrequently:
        true
    }
  );


const glyphAnalysisCache =
  new Map();


function analyseGlyphPixels(
  character,
  fontFamily,
  fontSize = 120
) {

  const cacheKey =
    character
    +
    "|"
    +
    fontFamily
    +
    "|"
    +
    fontSize;


  if (
    glyphAnalysisCache.has(
      cacheKey
    )
  ) {

    return glyphAnalysisCache.get(
      cacheKey
    );
  }


  const width =
    glyphCanvas.width;


  const height =
    glyphCanvas.height;


  glyphContext.clearRect(
    0,
    0,
    width,
    height
  );


  glyphContext.save();


  glyphContext.fillStyle =
    "#000";


  glyphContext.textBaseline =
    "alphabetic";


  glyphContext.font =
    `${fontSize}px ${fontFamily}`;


  glyphContext.fillText(
    character,
    50,
    190
  );


  glyphContext.restore();


  const imageData =
    glyphContext.getImageData(
      0,
      0,
      width,
      height
    );


  const data =
    imageData.data;


  let inkPixels =
    0;


  let minX =
    width;


  let minY =
    height;


  let maxX =
    -1;


  let maxY =
    -1;


  let hash =
    2166136261;


  for (
    let y = 0;
    y < height;
    y++
  ) {

    for (
      let x = 0;
      x < width;
      x++
    ) {

      const alpha =
        data[
          (
            y *
            width +
            x
          )
          *
          4
          +
          3
        ];


      if (
        alpha > 8
      ) {

        inkPixels++;


        if (
          x < minX
        ) {
          minX = x;
        }


        if (
          x > maxX
        ) {
          maxX = x;
        }


        if (
          y < minY
        ) {
          minY = y;
        }


        if (
          y > maxY
        ) {
          maxY = y;
        }
      }


      hash ^=
        alpha;


      hash =
        Math.imul(
          hash,
          16777619
        );
    }
  }


  let result;


  if (
    inkPixels ===
    0
  ) {

    result = {
      inkPixels:
        0,

      width:
        0,

      height:
        0,

      hash:
        hash >>> 0
    };

  } else {

    result = {
      inkPixels,

      width:
        maxX -
        minX +
        1,

      height:
        maxY -
        minY +
        1,

      hash:
        hash >>> 0
    };
  }


  glyphAnalysisCache.set(
    cacheKey,
    result
  );


  if (
    glyphAnalysisCache.size >
    2000
  ) {

    const firstKey =
      glyphAnalysisCache
        .keys()
        .next()
        .value;


    glyphAnalysisCache.delete(
      firstKey
    );
  }


  return result;
}

/* =========================================
   Blank detection
========================================= */

function isRenderedBlank(
  character,
  fontFamily
) {

  const analysis =
    analyseGlyphPixels(
      character,
      fontFamily
    );


  return (
    analysis.inkPixels ===
    0
  );
}

/* =========================================
   Missing glyph detection
========================================= */

function sameGlyphSignature(
  first,
  second
) {

  if (
    first.inkPixels ===
    0
    ||
    second.inkPixels ===
    0
  ) {
    return false;
  }


  return (
    first.hash ===
      second.hash
    &&
    first.width ===
      second.width
    &&
    first.height ===
      second.height
  );
}


function looksLikeMissingGlyph(
  character,
  fontFamily
) {

  const target =
    analyseGlyphPixels(
      character,
      fontFamily
    );


  if (
    target.inkPixels ===
    0
  ) {
    return false;
  }


  const missingA =
    analyseGlyphPixels(
      String.fromCodePoint(
        0x0378
      ),
      fontFamily
    );


  const missingB =
    analyseGlyphPixels(
      String.fromCodePoint(
        0x10FFFF
      ),
      fontFamily
    );


  return (
    sameGlyphSignature(
      target,
      missingA
    )
    ||
    sameGlyphSignature(
      target,
      missingB
    )
  );
}

/* =========================================
   Egyptian auto scaling
========================================= */

function getGlyphScaleFactor(
  codePoint,
  character,
  fontFamily
) {

  if (
    !inRange(
      codePoint,
      0x13460,
      0x143FF
    )
  ) {
    return 1;
  }


  const analysis =
    analyseGlyphPixels(
      character,
      fontFamily,
      120
    );


  if (
    analysis.inkPixels ===
    0
  ) {
    return 1;
  }


  const largestSide =
    Math.max(
      analysis.width,
      analysis.height
    );


  if (
    largestSide >=
    62
  ) {
    return 1;
  }


  const scale =
    82 /
    Math.max(
      largestSide,
      1
    );


  return Math.min(
    14,
    Math.max(
      1,
      scale
    )
  );
}


function applyGlyphScale(
  wrapper,
  inner,
  codePoint,
  character
) {

  const fontFamily =
    getComputedStyle(
      inner
    )
    .fontFamily;


  const scale =
    getGlyphScaleFactor(
      codePoint,
      character,
      fontFamily
    );


  if (
    scale <=
    1.05
  ) {
    return;
  }


  inner.style.transform =
    `scale(${scale})`;


  inner.style.transformOrigin =
    "center center";


  wrapper.style.minWidth =
    "1.45em";


  wrapper.style.minHeight =
    "1.55em";


  wrapper.style.marginLeft =
    "0.16em";


  wrapper.style.marginRight =
    "0.16em";


  wrapper.style.overflow =
    "visible";
}


function applyDailyGlyphScale(
  inner,
  codePoint,
  character
) {

  const fontFamily =
    getComputedStyle(
      inner
    )
    .fontFamily;


  const scale =
    getGlyphScaleFactor(
      codePoint,
      character,
      fontFamily
    );


  if (
    scale <=
    1.05
  ) {
    return;
  }


  inner.style.transform =
    `scale(${Math.min(
      8,
      scale
    )})`;


  inner.style.transformOrigin =
    "center center";
}
