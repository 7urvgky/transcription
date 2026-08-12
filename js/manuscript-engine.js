"use strict";

const ManuscriptEngine = {};

const A4_PAGE_WIDTH_PORTRAIT = 210;
const A4_PAGE_HEIGHT_PORTRAIT = 297;

const A4_PAGE_WIDTH_LANDSCAPE = 297;
const A4_PAGE_HEIGHT_LANDSCAPE = 210;

ManuscriptEngine.getUsableGridWidthMm = function (colsNum) {
  colsNum = parseInt(colsNum);
  if (AppState.orientation !== "portrait") {
    return 257;
  }
  return 170; // 원고지 가로 길이(mm) - 여백
};

// =====================================================
// 공통 좌표 상수
// =====================================================

// 원고지 중앙, 문장부호 Y 위치
const CENTER_Y = 50;
const PERIOD_Y = 43; // 마침표/쉼표 높이
const QUOTE_Y = 45; // 따옴표 높이

// =====================================================
//원고지 마지막 칸에 문장 부호 같이 넣기
// =====================================================
const SQUEEZED_CHAR_X = 40; // 본문 글자 X 위치
const SQUEEZED_SINGLE_PUNCT_X = 85; // 문장부호 X 위치

// =====================================================
// 단일 문장부호 위치
// =====================================================
const SINGLE_PERIOD_X = 25;

const SINGLE_OPEN_QUOTE_X = 75;
const SINGLE_CLOSE_QUOTE_X = 25;

const SINGLE_NORMAL_X = 50;

// =====================================================
// 특수 조합 좌표
// =====================================================

// periodQuote
const PERIOD_QUOTE_CHAR_X = 25;
const PERIOD_QUOTE_PUNCT_X = 75;

// periodOpeningQuote
const PERIOD_OPENING_QUOTE_CHAR_X = 25;
const PERIOD_OPENING_QUOTE_PUNCT_X = 75;

// quoteFirst
const QUOTE_FIRST_QUOTE_X = 25;
const QUOTE_FIRST_SYMBOL_X = 75;

// symbolFirst
const SYMBOL_FIRST_SYMBOL_X = 30;
const SYMBOL_FIRST_QUOTE_X = 75;

// doublePunct
const DOUBLE_PUNCT_1_X = 30;
const DOUBLE_PUNCT_2_X = 70;

// =====================================================
// 문장부호 Y 좌표 계산
// =====================================================

function getPunctY(p) {
  if (p === "." || p === ",") {
    return PERIOD_Y;
  }

  if (
    p === "“" ||
    p === "‘" ||
    p === '"' ||
    p === "'" ||
    p === "”" ||
    p === "’"
  ) {
    return QUOTE_Y;
  }

  return CENTER_Y;
}

ManuscriptEngine.cachedParsedCells = null;
ManuscriptEngine.lastParsedText = "";
ManuscriptEngine.lastParsedCols = null;

ManuscriptEngine.parseTextToManuscriptCells = function (text, cols) {
  if (
    ManuscriptEngine.cachedParsedCells &&
    ManuscriptEngine.lastParsedText === text &&
    ManuscriptEngine.lastParsedCols === cols
  ) {
    return ManuscriptEngine.cachedParsedCells;
  }
  // =====================================================
  // 원고지 문자 종류
  // =====================================================
  const cells = [];
  const isAlphanumeric = (c) => /[0-9a-zA-Z]/.test(c); // 숫자, 영문 판정
  const isUppercase = (c) => /[A-Z]/.test(c); // 영문 대문자 판정
  const isLowercase = (c) => /[a-z]/.test(c); // 영문 소문자 판정
  const isDigit = (c) => /[0-9]/.test(c); // 숫자 판정
  const isPunctuation = (c) => /[.,!?'"“”‘’()\[\]{}<>~;:：；！？]/.test(c); // 문장 부호 판정
  const isPeriodOrComma = (c) => c === "." || c === ","; // 구두점(마침표, 쉼표) 판정
  const isQuote = (c) => /[“‘”’"']/.test(c); // 따옴표 판정
  const isSymbol = (c) => /[!?！？]/.test(c); // 느낌표, 물음표 판정
  const isClosingMark = (c) => /[.,!?'"”’)\]}>]/.test(c); // 줄 첫 칸에 올 수 없는 닫는 문장부호. 앞줄 마지막 칸에 붙여 쓴다.
  /*
줄 끝 압축 테스트

다.
다,
다!
다?
다"
다”
다)
다]
다}

다."
다!”
다?”
다.)
다.]
다.}
다,]
다,}
*/
  const paragraphs = text.split("\n");

  paragraphs.forEach((pText, pIdx) => {
    if (pText.trim() === "" && pIdx > 0) {
      const colIndex = cells.length % cols;
      if (colIndex > 0) {
        const fillCount = cols - colIndex;
        for (let f = 0; f < fillCount; f++) {
          cells.push({ char: "", isSpace: true, isParagraphFiller: true });
        }
      }
      for (let f = 0; f < cols; f++) {
        cells.push({ char: "", isSpace: true, isParagraphFiller: true });
      }
      return;
    }

    if (pIdx > 0) {
      const colIndex = cells.length % cols;
      if (colIndex > 0) {
        const fillCount = cols - colIndex;
        for (let f = 0; f < fillCount; f++) {
          cells.push({ char: "", isSpace: true, isParagraphFiller: true });
        }
      }
    }

    cells.push({ char: " ", isSpace: true, isParagraphStartSpace: true });

    let charIdx = 0;
    while (charIdx < pText.length) {
      let char = pText[charIdx];
      let nextChar = pText[charIdx + 1];
      let colIndex = cells.length % cols;

      const isAtRowEnd = colIndex === 0 && cells.length > 0;

      // 원고지 마지막 칸의 문자 + 기호일 때 한 칸으로 합침
      if (isClosingMark(char) && isAtRowEnd) {
        let targetIdx = cells.length - 1;
        if (cells[targetIdx] && !cells[targetIdx].isParagraphFiller) {
          cells[targetIdx].squeezedPunct =
            (cells[targetIdx].squeezedPunct || "") + char;
          cells[targetIdx].isSqueezed = true;
          charIdx += 1;
          continue;
        }
      }

      if (
        isPeriodOrComma(char) &&
        nextChar &&
        (nextChar === "“" || nextChar === "‘")
      ) {
        cells.push({
          char: char,
          squeezedPunct: nextChar,
          isPeriodOpeningQuoteCombo: true,
        });
        charIdx += 2;
        continue;
      }

      if (
        isPeriodOrComma(char) &&
        nextChar &&
        (nextChar === "”" ||
          nextChar === "’" ||
          nextChar === '"' ||
          nextChar === "'")
      ) {
        cells.push({
          char: char,
          squeezedPunct: nextChar,
          isPeriodQuoteCombo: true,
        });
        charIdx += 2;
        continue;
      }

      if (isSymbol(char) && nextChar && isQuote(nextChar)) {
        cells.push({
          char: char,
          squeezedPunct: nextChar,
          isSymbolFirstCombo: true,
        });
        charIdx += 2;
        continue;
      }

      if (isQuote(char) && nextChar && isSymbol(nextChar)) {
        cells.push({
          char: char,
          squeezedPunct: nextChar,
          isQuoteFirstCombo: true,
        });
        charIdx += 2;
        continue;
      }

      if (isPunctuation(char) && nextChar && isPunctuation(nextChar)) {
        cells.push({
          char: char,
          squeezedPunct: nextChar,
          isDoublePunct: true,
        });
        charIdx += 2;
        continue;
      }

      if (char === " ") {
        if (colIndex === 0) {
          charIdx++;
          continue;
        }
        if (cells.length > 0) {
          const prevCell = cells[cells.length - 1];
          if (prevCell && (prevCell.char === "." || prevCell.char === ",")) {
            if (prevCell.isPeriodQuoteCombo) {
              cells.push({ char: " ", isSpace: true });
              charIdx++;
              continue;
            }
            charIdx++;
            continue;
          }
        }
        cells.push({ char: " ", isSpace: true });
        charIdx++;
        continue;
      }

      if (isAlphanumeric(char)) {
        const nextChar = pText[charIdx + 1];

        // 대문자 + 대문자
        if (isUppercase(char) && nextChar && isUppercase(nextChar)) {
          cells.push({
            char,
            isAlphanumeric: true,
          });

          charIdx += 1;
          continue;
        }

        // 소문자/숫자 조합은 2개씩
        if (nextChar && isAlphanumeric(nextChar)) {
          cells.push({
            char: char + nextChar,
            isAlphanumeric: true,
          });

          charIdx += 2;
        } else {
          cells.push({
            char,
            isAlphanumeric: true,
          });

          charIdx += 1;
        }

        continue;
      }

      cells.push({ char: char });
      charIdx++;
    }

    const endColIndex = cells.length % cols;
    if (endColIndex > 0) {
      const fillCount = cols - endColIndex;
      for (let f = 0; f < fillCount; f++) {
        cells.push({ char: "", isSpace: true, isParagraphFiller: true });
      }
    }
  });

  ManuscriptEngine.lastParsedText = text;
  ManuscriptEngine.lastParsedCols = cols;
  ManuscriptEngine.cachedParsedCells = cells;

  return cells;
};

/**
 * ============================================================
 * 원고지가 사용할 수 있는 실제 세로 공간 계산
 *
 * 고정된 218mm / 238mm 등의 값을 사용하지 않는다.
 *
 * 실제 A4 페이지 높이에서
 *
 *   1. pageTopPadding
 *   2. pageBottomPadding
 *   3. 현재 표시되는 원고지 헤더 영역
 *   4. 원고지 아래 실선 및 간격
 *   5. 꼬리말/페이지 번호 영역
 *
 * 을 제외한 나머지를 원고지 영역으로 사용한다.
 *
 * 이렇게 하면 pageTopPadding / pageBottomPadding을
 * 변경했을 때 원고지 행 수도 자동으로 변경된다.
 * ============================================================
 */
ManuscriptEngine.calculateGridAvailableHeightMm = function () {
  /*
   * ----------------------------------------------------------
   * 1. 현재 페이지의 실제 A4 높이
   * ----------------------------------------------------------
   */
  const pageHeightMm =
    AppState.orientation === "portrait"
      ? A4_PAGE_HEIGHT_PORTRAIT
      : A4_PAGE_HEIGHT_LANDSCAPE;

  /*
   * ----------------------------------------------------------
   * 2. 페이지 상하 여백
   *
   * createPageShell()에서 실제로 사용하는 값과 동일하다.
   * ----------------------------------------------------------
   */
  const pageTopPaddingMm = Number(SETTINGS.layout.pageTopPadding) || 0;

  const pageBottomPaddingMm = Number(SETTINGS.layout.pageBottomPadding) || 0;

  /*
   * ----------------------------------------------------------
   * 3. 페이지 내부에서 사용할 수 있는 전체 높이
   *
   * A4 높이 - 위 여백 - 아래 여백
   * ----------------------------------------------------------
   */
  const innerHeightMm = pageHeightMm - pageTopPaddingMm - pageBottomPaddingMm;

  /*
   * ----------------------------------------------------------
   * 4. 실제 헤더 영역 측정
   *
   * 현재 createGridPageHeader()가 실제 페이지에서 만드는
   * 헤더 구조를 그대로 임시 DOM에 만들어서 측정한다.
   *
   * 따라서
   *
   *   - 원고지 헤더 표시
   *   - 원고지 헤더 숨김
   *   - 제목
   *   - 헤더와 제목 사이의 간격
   *   - 제목 아래 선
   *   - 각종 설정값
   *
   * 이 실제 화면 구조에 따라 자동으로 계산된다.
   * ----------------------------------------------------------
   */

  const placeholders = getBlankPlaceholders();

  const headerHTML = buildHeaderHTML(placeholders);

  const titleText = AppState.hideInputTitle ? "" : AppState.articleTitle;

  /*
   * 임시 A4 페이지
   *
   * 화면에 보이지 않게 만들지만
   * display:none은 사용하지 않는다.
   *
   * display:none을 사용하면 브라우저가 실제 크기를
   * 계산하지 않기 때문이다.
   */
  const measurePage = document.createElement("div");

  measurePage.className =
    AppState.orientation === "portrait"
      ? "a4-page print-page portrait-page"
      : "a4-page print-page landscape-page";

  measurePage.style.position = "absolute";
  measurePage.style.left = "-100000px";
  measurePage.style.top = "0";
  measurePage.style.visibility = "hidden";
  measurePage.style.pointerEvents = "none";
  measurePage.style.width = `${
    AppState.orientation === "portrait"
      ? A4_PAGE_WIDTH_PORTRAIT
      : A4_PAGE_WIDTH_LANDSCAPE
  }mm`;

  measurePage.style.height = `${pageHeightMm}mm`;

  measurePage.style.maxWidth = "none";
  measurePage.style.maxHeight = "none";
  measurePage.style.margin = "0";
  measurePage.style.padding = "0";
  measurePage.style.boxSizing = "border-box";

  /*
   * 실제 createPageShell()과 동일한 내부 구조
   */
  const measureInner = document.createElement("div");

  measureInner.className = "print-page-inner";

  measureInner.style.width = "100%";
  measureInner.style.height = "100%";
  measureInner.style.boxSizing = "border-box";
  measureInner.style.display = "flex";
  measureInner.style.flexDirection = "column";
  measureInner.style.justifyContent = "flex-start";

  measureInner.style.padding = `${pageTopPaddingMm}mm
     ${SETTINGS.layout.pageSidePadding}mm
     ${pageBottomPaddingMm}mm
     ${SETTINGS.layout.pageSidePadding}mm`;

  measurePage.appendChild(measureInner);

  document.body.appendChild(measurePage);

  /*
   * ----------------------------------------------------------
   * 5. 실제 원고지 헤더를 임시 페이지에 넣는다.
   *
   * 실제 buildGridPage()에서 사용하는 함수와 동일하다.
   * ----------------------------------------------------------
   */
  const headerElements = createGridPageHeader(headerHTML, titleText);

  headerElements.forEach((el) => {
    measureInner.appendChild(el);
  });

  /*
   * ----------------------------------------------------------
   * 6. 실제 원고지 아래 실선도 넣는다.
   *
   * buildGridPage()에서 원고지 바로 아래에 들어가는 실선과 동일하다.
   * ----------------------------------------------------------
   */
  const measureBottomLine = createHorizontalLine(
    SETTINGS.manuscript.gridLineGap,
  );

  measureInner.appendChild(measureBottomLine);
  /*
   * ----------------------------------------------------------
   * 7. 헤더 + 아래 실선이 실제로 차지하는 높이를 측정한다.
   *
   * measureInner의 top부터 마지막 요소의 bottom까지를
   * 측정한다.
   *
   * 여기에는 padding-top 이후의 실제 flow 영역과
   * 각 요소의 margin이 포함된다.
   * ----------------------------------------------------------
   */
  const innerRect = measureInner.getBoundingClientRect();

  const bottomLineRect = measureBottomLine.getBoundingClientRect();

  const flowBottomMm = (bottomLineRect.bottom - innerRect.top) * (25.4 / 96);

  /*
   * padding-top은 이미 flowBottomMm 안에 포함되어 있다.
   *
   * 따라서 실제로 헤더와 하단선이 차지하는 높이만
   * 얻으려면 pageTopPadding을 빼 준다.
   */
  const headerAndBottomLineHeightMm = Math.max(
    0,
    flowBottomMm - pageTopPaddingMm,
  );

  /*
   * ----------------------------------------------------------
   * 8. 꼬리말/페이지 번호 영역 확보
   *
   * 현재 createGridFooter()는 absolute이므로
   * 일반적인 flex flow에는 포함되지 않는다.
   *
   * 하지만 꼬리말을 표시할 때 원고지가 그 영역까지
   * 내려가면 안 된다.
   *
   * 따라서 꼬리말 높이 + footerBottomMm을
   * 원고지 사용 영역에서 예약한다.
   *
   * 반대로 '꼬리말, 페이지 번호 표시 안 함'이면
   * 이 값을 0으로 만든다.
   * ----------------------------------------------------------
   */
  let footerReservedHeightMm = 0;

  if (!AppState.hidePageNumbers && typeof createGridFooter === "function") {
    const dummySpec = {
      pageIdx: 0,
      totalGridPages: 1,
      currentMode: "empty",
    };

    const measureFooter = createGridFooter(dummySpec);

    measureInner.appendChild(measureFooter);

    const footerHeightPx = measureFooter.getBoundingClientRect().height;

    const footerHeightMm = footerHeightPx * (25.4 / 96);

    footerReservedHeightMm = footerHeightMm;
  }

  /*
   * ----------------------------------------------------------
   * 9. 임시 DOM 제거
   * ----------------------------------------------------------
   */
  document.body.removeChild(measurePage);

  /*
   * ----------------------------------------------------------
   * 10. 최종 원고지 사용 가능 높이
   *
   * A4 전체 높이
   * - 위쪽 padding
   * - 아래쪽 padding
   * - 헤더/상단 영역
   * - 원고지 아래 실선 및 간격
   * - 꼬리말 영역
   * ----------------------------------------------------------
   */
  const availableHeightMm =
    innerHeightMm - headerAndBottomLineHeightMm - footerReservedHeightMm;

  /*
   * 절대로 음수가 되지 않도록 한다.
   */
  return Math.max(0, availableHeightMm);
};

ManuscriptEngine.calculateOptimalRows = function (cols) {
  if (cols === "line") {
    if (AppState.orientation === "portrait") {
      return AppState.hideManuscriptHeader ? 24 : 21;
    } else {
      return AppState.hideManuscriptHeader ? 16 : 13;
    }
  }

  const colsNum = parseInt(cols, 10);

  if (!Number.isFinite(colsNum) || colsNum <= 0) {
    return 1;
  }

  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const cellWidthMm = usableWidthMm / colsNum;

  const usableHeightMm = ManuscriptEngine.calculateGridAvailableHeightMm();

  const rows = Math.floor(usableHeightMm / cellWidthMm);

  return Math.max(1, rows);
};

ManuscriptEngine.calculateLineNoteAvailableHeightMm = function () {
  const pageHeightMm =
    AppState.orientation === "portrait"
      ? A4_PAGE_HEIGHT_PORTRAIT
      : A4_PAGE_HEIGHT_LANDSCAPE;

  const pageTopPaddingMm = Number(SETTINGS.layout.pageTopPadding) || 0;

  const pageBottomPaddingMm = Number(SETTINGS.layout.pageBottomPadding) || 0;

  const innerHeightMm = pageHeightMm - pageTopPaddingMm - pageBottomPaddingMm;

  /*
   * --------------------------------------------------------
   * 최종 사용 가능 높이
   * --------------------------------------------------------
   */

  return Math.max(0, innerHeightMm - headerHeightMm);
};

ManuscriptEngine.estimateLinesForSegments = function (segments, fontSizePt) {
  const charWidthMm = fontSizePt * 0.3527;
  const maxLineWidthMm = AppState.orientation === "portrait" ? 155 : 112;

  let totalLines = 0;

  function estimateCharWidthMm(char) {
    if (char === " ") {
      return charWidthMm * 0.35;
    }

    if (/[0-9a-zA-Z]/.test(char)) {
      return charWidthMm * 0.58;
    }

    if (/[.,!?'“”‘’()[\]{}<>~;:：；！？…·―—–]/.test(char)) {
      return charWidthMm * 0.5;
    }

    return charWidthMm;
  }

  const paragraphsToCalculate = [];
  let currentParaWords = [];
  let currentParaHasIndent = false;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.isBlankLine) {
      if (currentParaWords.length > 0) {
        paragraphsToCalculate.push({
          text: currentParaWords.join(" "),
          words: currentParaWords,
          hasIndent: currentParaHasIndent,
        });
        currentParaWords = [];
      }
      paragraphsToCalculate.push({ isBlankLine: true });
    } else {
      const prevSeg = i > 0 ? segments[i - 1] : null;
      const isNewParagraph =
        !prevSeg || prevSeg.isBlankLine || prevSeg.pIdx !== seg.pIdx;

      if (isNewParagraph) {
        if (currentParaWords.length > 0) {
          paragraphsToCalculate.push({
            text: currentParaWords.join(" "),
            words: currentParaWords,
            hasIndent: currentParaHasIndent,
          });
          currentParaWords = [];
        }
        currentParaHasIndent = !seg.isContinued;
      }

      const wordsInSeg = seg.text.split(" ");
      wordsInSeg.forEach((w, wIdx) => {
        if (w !== "") {
          currentParaWords.push(w);
        } else if (wIdx > 0 && wIdx < wordsInSeg.length - 1) {
          currentParaWords.push("");
        }
      });
    }
  }

  if (currentParaWords.length > 0) {
    paragraphsToCalculate.push({
      text: currentParaWords.join(" "),
      words: currentParaWords,
      hasIndent: currentParaHasIndent,
    });
  }

  paragraphsToCalculate.forEach((p) => {
    if (p.isBlankLine) {
      totalLines += 1.0;
      return;
    }

    const indentWidth = p.hasIndent ? charWidthMm * 1.5 : 0;
    let currentLineWidth = indentWidth;
    let linesInPara = 1;

    p.words.forEach((word) => {
      if (word === "") {
        currentLineWidth += estimateCharWidthMm(" ");
        return;
      }

      let wordWidth = 0;
      for (let char of word) {
        wordWidth += estimateCharWidthMm(char);
      }

      const spaceWidth =
        currentLineWidth > indentWidth ? estimateCharWidthMm(" ") : 0;

      if (currentLineWidth + spaceWidth + wordWidth > maxLineWidthMm) {
        linesInPara += 1;
        currentLineWidth = wordWidth;
      } else {
        currentLineWidth += spaceWidth + wordWidth;
      }
    });

    totalLines += linesInPara;
  });

  return totalLines;
};

ManuscriptEngine.getMaxLines = function (fontSizePt, pageIdx) {
  if (AppState.orientation === "portrait") {
    const baseLines = pageIdx === 0 ? 27 : 30;
    return Math.floor(baseLines * (10 / fontSizePt));
  } else {
    const baseLinesPerCol = pageIdx === 0 ? 16 : 18;
    const linesPerCol = Math.floor(baseLinesPerCol * (10 / fontSizePt));
    return linesPerCol * 2;
  }
};

ManuscriptEngine.getCellType = function (cellData) {
  if (!cellData) {
    return "normal";
  }

  if (cellData.isSqueezed) {
    return "squeezed";
  }

  if (cellData.isPeriodQuoteCombo) {
    return "periodQuote";
  }

  if (cellData.isPeriodOpeningQuoteCombo) {
    return "periodOpeningQuote";
  }

  if (cellData.isSymbolFirstCombo) {
    return "symbolFirst";
  }

  if (cellData.isQuoteFirstCombo) {
    return "quoteFirst";
  }

  if (cellData.isDoublePunct) {
    return "doublePunct";
  }

  return "normal";
};

ManuscriptEngine.getCellLayout = function (cellData) {
  const cellType = ManuscriptEngine.getCellType(cellData);

  if (cellType === "periodQuote") {
    return {
      type: "periodQuote",

      chars: [
        {
          text: cellData.char,
          x: PERIOD_QUOTE_CHAR_X,
          y: PERIOD_Y,
          fontSize: 100 * AppState.charScale,
        },

        {
          text: cellData.squeezedPunct,
          x: PERIOD_QUOTE_PUNCT_X,
          y: QUOTE_Y,
          fontSize: 100 * AppState.charScale,
        },
      ],
    };
  }
  if (cellType === "quoteFirst") {
    return {
      type: "quoteFirst",

      chars: [
        {
          text: cellData.char,
          x: QUOTE_FIRST_QUOTE_X,
          y: QUOTE_Y,
          fontSize: 100 * AppState.charScale,
        },

        {
          text: cellData.squeezedPunct,
          x: QUOTE_FIRST_SYMBOL_X,
          y: CENTER_Y,
          fontSize: 100 * AppState.charScale,
        },
      ],
    };
  }
  if (cellType === "symbolFirst") {
    return {
      type: "symbolFirst",

      chars: [
        {
          text: cellData.char,
          x: SYMBOL_FIRST_SYMBOL_X,
          y: CENTER_Y,
          fontSize: 100 * AppState.charScale,
        },

        {
          text: cellData.squeezedPunct,
          x: SYMBOL_FIRST_QUOTE_X,
          y: QUOTE_Y,
          fontSize: 100 * AppState.charScale,
        },
      ],
    };
  }
  if (cellType === "periodOpeningQuote") {
    return {
      type: "periodOpeningQuote",

      chars: [
        {
          text: cellData.char,
          x: PERIOD_OPENING_QUOTE_CHAR_X,
          y: PERIOD_Y,
          fontSize: 100 * AppState.charScale,
        },

        {
          text: cellData.squeezedPunct,
          x: PERIOD_OPENING_QUOTE_PUNCT_X,
          y: QUOTE_Y,
          fontSize: 100 * AppState.charScale,
        },
      ],
    };
  }
  if (cellType === "doublePunct") {
    let y1 = CENTER_Y;
    let y2 = CENTER_Y;

    const p1 = cellData.char;
    const p2 = cellData.squeezedPunct;

    if (p1 === "." || p1 === ",") {
      y1 = PERIOD_Y;
    }

    if (p2 === "." || p2 === ",") {
      y2 = PERIOD_Y;
    }

    if (p1 === '"' || p1 === "'" || p1 === "”" || p1 === "’") {
      y1 = QUOTE_Y;
    }

    if (p2 === '"' || p2 === "'" || p2 === "”" || p2 === "’") {
      y2 = QUOTE_Y;
    }

    if (p1 === "“" || p1 === "‘") {
      y1 = QUOTE_Y;
    }

    if (p2 === "“" || p2 === "‘") {
      y2 = QUOTE_Y;
    }

    return {
      type: "doublePunct",

      chars: [
        {
          text: p1,
          x: DOUBLE_PUNCT_1_X,
          y: y1,
          fontSize: 100 * AppState.charScale,
        },

        {
          text: p2,
          x: DOUBLE_PUNCT_2_X,
          y: y2,
          fontSize: 100 * AppState.charScale,
        },
      ],
    };
  }
  if (cellType === "squeezed") {
    const puncts = Array.from(cellData.squeezedPunct || "");

    // -------------------------------------------------
    // 문장부호 1개
    // -------------------------------------------------

    if (puncts.length === 1) {
      const p = puncts[0];

      let punctX = SQUEEZED_SINGLE_PUNCT_X;
      const punctY = getPunctY(p);

      return {
        type: "squeezedSingle",

        chars: [
          {
            text: cellData.char,
            x: SQUEEZED_CHAR_X,
            y: CENTER_Y,
            fontSize: 100 * AppState.charScale,
          },

          {
            text: p,
            x: punctX,
            y: punctY,
            fontSize: 100 * AppState.charScale,
          },
        ],
      };
    }

    if (puncts.length >= 2) {
      const chars = [
        {
          text: cellData.char,
          x: 30,
          y: CENTER_Y,
          fontSize: 100 * AppState.charScale,
        },
      ];

      puncts.forEach((p, idx) => {
        chars.push({
          text: p,
          x: 65 + idx * 15,
          y: getPunctY(p),
          fontSize: 100 * AppState.charScale,
        });
      });

      return {
        type: "squeezedMulti",
        chars,
      };
    }

    return null;
  }

  return null;
};
