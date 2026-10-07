/* =========================================
   DOM
========================================= */

const charInput =
  document.getElementById("charInput");

const unicodeInput =
  document.getElementById("unicodeInput");

const unicodeOutput =
  document.getElementById("unicodeOutput");

const charOutput =
  document.getElementById("charOutput");

const clearChar =
  document.getElementById("clearChar");

const clearUnicode =
  document.getElementById("clearUnicode");

const backUnicode =
  document.getElementById("backUnicode");

const toggleCharView =
  document.getElementById(
    "toggleCharView"
  );

const toggleUnicodeView =
  document.getElementById(
    "toggleUnicodeView"
  );

const dailyCharacter =
  document.getElementById("dailyCharacter");

const dailyCode =
  document.getElementById("dailyCode");

const dailyResearchLink =
  document.getElementById("dailyResearchLink");

/* =========================================
   Unicode Scope DOM
========================================= */

const unicodeScope =
  document.getElementById(
    "unicodeScope"
  );

const unicodeScopeRing =
  document.getElementById(
    "unicodeScopeRing"
  );

const unicodeScopeGlyph =
  document.getElementById(
    "unicodeScopeGlyph"
  );

const unicodeScopeCode =
  document.getElementById(
    "unicodeScopeCode"
  );

/* =========================================
   Helper
========================================= */

function inRange(
  codePoint,
  start,
  end
) {

  return (
    codePoint >= start &&
    codePoint <= end
  );
}

/* =========================================
   Timing
========================================= */

function sleep(
  milliseconds
) {

  return new Promise(
    (resolve) => {

      setTimeout(
        resolve,
        milliseconds
      );

    }
  );
}


function yieldToBrowser() {

  return new Promise(
    (resolve) => {

      setTimeout(
        resolve,
        0
      );

    }
  );
}
