/* =========================================
   Secure random
========================================= */

function secureRandomInteger(
  max
) {

  const range =
    0x100000000;


  const limit =
    Math.floor(
      range /
      max
    )
    *
    max;


  const values =
    new Uint32Array(
      1
    );


  while (
    true
  ) {

    crypto.getRandomValues(
      values
    );


    if (
      values[0] <
      limit
    ) {

      return (
        values[0] %
        max
      );
    }
  }
}

/* =========================================
   Random filter
========================================= */

function isUsableRandomCharacter(
  codePoint
) {

  if (
    codePoint >=
      0xD800
    &&
    codePoint <=
      0xDFFF
  ) {
    return false;
  }


  /*
    Replacement Character は
    「不明な文字の代用品」なので
    ランダム生成の候補から除外する。
  */

  if (
    codePoint ===
      0xFFFD
  ) {
    return false;
  }


  const character =
    String.fromCodePoint(
      codePoint
    );


  if (
    isInvisibleCharacter(
      codePoint,
      character
    )
  ) {
    return false;
  }


  if (
    !/\p{Assigned}/u
      .test(
        character
      )
  ) {
    return false;
  }


  if (
    /\p{Cc}/u.test(
      character
    )
  ) {
    return false;
  }


  if (
    /\p{Cf}/u.test(
      character
    )
  ) {
    return false;
  }


  if (
    /\p{Co}/u.test(
      character
    )
  ) {
    return false;
  }


  if (
    /\p{M}/u.test(
      character
    )
  ) {
    return false;
  }


  if (
    /\p{Z}/u.test(
      character
    )
  ) {
    return false;
  }


  return true;
}


function generateRandomCodePoint() {

  while (
    true
  ) {

    const codePoint =
      secureRandomInteger(
        0x110000
      );


    if (
      isUsableRandomCharacter(
        codePoint
      )
    ) {

      return codePoint;
    }
  }
}

/* =========================================
   Random generation
========================================= */

function generateRandomUnicode(
  count
) {

  saveUnicodeHistory();


  const values =
    [];


  for (
    let index = 0;
    index < count;
    index++
  ) {

    const codePoint =
      generateRandomCodePoint();


    values.push(
      "U+"
      +
      codePoint
        .toString(
          16
        )
        .toUpperCase()
    );
  }


  unicodeInput.value =
    values.join(
      " "
    );


  convertUnicode();
}
