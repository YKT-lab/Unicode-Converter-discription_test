/* =========================================
   Expandable textarea helpers
========================================= */

function resizeExpandedTextarea(
  textarea
) {

  if (
    !textarea
    ||
    !textarea.classList.contains(
      "input-expanded"
    )
  ) {
    return;
  }


  /*
    いったん高さをautoに戻してから
    scrollHeightを取り直すことで、
    文字が増えた時だけでなく
    減った時にも正しい高さへ縮む。
  */

  textarea.style.height =
    "auto";


  textarea.style.height =
    textarea.scrollHeight +
    "px";
}


function setTextareaExpanded(
  textarea,
  button,
  expanded
) {

  if (
    !textarea
    ||
    !button
  ) {
    return;
  }


  textarea.classList.toggle(
    "input-expanded",
    expanded
  );


  button.textContent =
    expanded
      ? "元に戻す"
      : "全表示";


  button.setAttribute(
    "aria-expanded",
    String(expanded)
  );


  if (
    expanded
  ) {

    requestAnimationFrame(
      () => {

        resizeExpandedTextarea(
          textarea
        );

      }
    );

    return;
  }


  /*
    CSS側の通常サイズへ戻す。
  */

  textarea.style.height =
    "";


  textarea.scrollTop =
    0;


  textarea.scrollLeft =
    0;
}


function toggleTextareaExpanded(
  textarea,
  button
) {

  if (
    !textarea
    ||
    !button
  ) {
    return;
  }


  const expanded =
    !textarea.classList.contains(
      "input-expanded"
    );


  setTextareaExpanded(
    textarea,
    button,
    expanded
  );
}


function resetTextareaExpanded(
  textarea,
  button
) {

  setTextareaExpanded(
    textarea,
    button,
    false
  );
}


/* =========================================
   Expand buttons
========================================= */

if (
  toggleCharView
) {

  toggleCharView.setAttribute(
    "aria-controls",
    "charInput"
  );


  toggleCharView.setAttribute(
    "aria-expanded",
    "false"
  );


  toggleCharView.addEventListener(
    "click",
    () => {

      toggleTextareaExpanded(
        charInput,
        toggleCharView
      );

    }
  );
}


if (
  toggleUnicodeView
) {

  toggleUnicodeView.setAttribute(
    "aria-controls",
    "unicodeInput"
  );


  toggleUnicodeView.setAttribute(
    "aria-expanded",
    "false"
  );


  toggleUnicodeView.addEventListener(
    "click",
    () => {

      toggleTextareaExpanded(
        unicodeInput,
        toggleUnicodeView
      );

    }
  );
}


/* =========================================
   Events
========================================= */

charInput.addEventListener(
  "input",
  () => {

    convertCharacters();


    resizeExpandedTextarea(
      charInput
    );

  }
);


unicodeInput.addEventListener(
  "input",
  () => {

    unicodeRun++;


    clearTimeout(
      unicodeInputTimer
    );


    hideUnicodeScope();


    resizeExpandedTextarea(
      unicodeInput
    );


    unicodeInputTimer =
      setTimeout(
        convertUnicode,
        300
      );

  }
);


document
  .querySelectorAll(
    "[data-random-count]"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          generateRandomUnicode(
            Number(
              button.dataset.randomCount
            )
          );


          requestAnimationFrame(
            () => {

              resizeExpandedTextarea(
                unicodeInput
              );

            }
          );

        }
      );

    }
  );


backUnicode.addEventListener(
  "click",
  () => {

    goBackUnicode();


    requestAnimationFrame(
      () => {

        resizeExpandedTextarea(
          unicodeInput
        );

      }
    );

  }
);


clearChar.addEventListener(
  "click",
  () => {

    charInput.value =
      "";


    unicodeOutput.textContent =
      "";


    resetTextareaExpanded(
      charInput,
      toggleCharView
    );


    hideUnicodeScope();


    charInput.focus();
  }
);


clearUnicode.addEventListener(
  "click",
  () => {

    unicodeRun++;


    clearTimeout(
      unicodeInputTimer
    );


    unicodeInput.value =
      "";


    charOutput.textContent =
      "";


    resetTextareaExpanded(
      unicodeInput,
      toggleUnicodeView
    );


    hideUnicodeScope();


    unicodeInput.focus();
  }
);


/*
  画面回転やウィンドウ幅変更で
  折り返し位置が変わった時にも
  全表示の高さを合わせ直す。
*/

window.addEventListener(
  "resize",
  () => {

    resizeExpandedTextarea(
      charInput
    );


    resizeExpandedTextarea(
      unicodeInput
    );

  },
  {
    passive: true
  }
);


/* =========================================
   Startup
========================================= */

updateBackButton();


loadDailyCharacter();


let lastJSTDate =
  getJSTDateString();


setInterval(
  () => {

    const now =
      getJSTDateString();


    if (
      now !==
      lastJSTDate
    ) {

      lastJSTDate =
        now;


      hideUnicodeScope();


      loadDailyCharacter();
    }

  },
  60000
);
