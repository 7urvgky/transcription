"use strict";

const ManuscriptEngine = {};

const GRID_USABLE_HEIGHT_PORTRAIT = 218; // 원고지 세로 길이(mm) - 여백 ; 헤더 표시 상태 (세로 모드)
const GRID_USABLE_HEIGHT_PORTRAIT_NO_HEADER = 238; // 원고지 세로 길이(mm) - 여백 ; 헤더 숨김 상태

const GRID_USABLE_HEIGHT_LANDSCAPE = 133; // 원고지 세로 길이(mm) - 여백 ; 헤더 표시 상태 (가로 모드)
const GRID_USABLE_HEIGHT_LANDSCAPE_NO_HEADER = 158; // 원고지 세로 길이(mm) - 여백 ; 헤더 숨김 상태 (가로 모드)

ManuscriptEngine.CHAR_SCALE = 0.62; //원고지 칸 크기 대비 문자 크기

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
const PERIOD_Y = 55; // 마침표/쉼표 높이
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

  const cells = [];
  const isAlphanumeric = (c) => /[0-9a-zA-Z]/.test(c);
  const isPunctuation = (c) =>
    /[.,!?'"ным“('_~);:]/.test(c) ||
    /[.,!?'""]["“”‘’()\[\]{}<>~?;:：；！？]/.test(c);

  const isPeriodOrComma = (c) => c === "." || c === ",";
  const isQuote = (c) => /[“‘”’"']/.test(c);
  const isSymbol = (c) => /[!?！？]/.test(c);

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

      // 원고지 마지막 칸의 문자 + 기호일 때한 칸으로 합침
      if (isPunctuation(char) && isAtRowEnd) {
        let targetIdx = cells.length - 1;
        if (
          cells[targetIdx] &&
          !cells[targetIdx].isParagraphFiller &&
          !cells[targetIdx].squeezedPunct
        ) {
          cells[targetIdx].squeezedPunct = char;
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
        let nextChar = pText[charIdx + 1];
        if (nextChar && isAlphanumeric(nextChar)) {
          cells.push({ char: char + nextChar, isAlphanumeric: true });
          charIdx += 2;
        } else {
          cells.push({ char: char, isAlphanumeric: true });
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

ManuscriptEngine.calculateOptimalRows = function (cols) {
  if (cols === "line") {
    if (AppState.orientation === "portrait") {
      return AppState.hideManuscriptHeader ? 24 : 21;
    } else {
      return AppState.hideManuscriptHeader ? 16 : 13;
    }
  }
  const colsNum = parseInt(cols);
  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);
  const cellWidthMm = usableWidthMm / colsNum;

  const usableHeightMm = 
    AppState.orientation === "portrait"
      ? AppState.hideManuscriptHeader
        ? GRID_USABLE_HEIGHT_PORTRAIT_NO_HEADER
        : GRID_USABLE_HEIGHT_PORTRAIT
      : AppState.hideManuscriptHeader
        ? GRID_USABLE_HEIGHT_LANDSCAPE_NO_HEADER
        : GRID_USABLE_HEIGHT_LANDSCAPE;

  return Math.floor(usableHeightMm / cellWidthMm);
};

ManuscriptEngine.estimateLinesForSegments = function (segments, fontSizePt) {
  const charWidthMm = fontSizePt * 0.3527;
  const maxLineWidthMm = AppState.orientation === "portrait" ? 155 : 112;

  let totalLines = 0;

  function getCharWidthMm(char) {
    if (/[0-9a-zA-Z]/.test(char)) return charWidthMm * 0.58;
    if (char === " ") return charWidthMm * 0.35;
    if (/[.,!?'"ным“('_~);:]/.test(char)) return charWidthMm * 0.5;
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
        currentLineWidth += getCharWidthMm(" ");
        return;
      }

      let wordWidth = 0;
      for (let char of word) {
        wordWidth += getCharWidthMm(char);
      }

      const spaceWidth =
        currentLineWidth > indentWidth ? getCharWidthMm(" ") : 0;

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
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
        },

        {
          text: cellData.squeezedPunct,
          x: PERIOD_QUOTE_PUNCT_X,
          y: QUOTE_Y,
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
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
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
        },

        {
          text: cellData.squeezedPunct,
          x: QUOTE_FIRST_SYMBOL_X,
          y: CENTER_Y,
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
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
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
        },

        {
          text: cellData.squeezedPunct,
          x: SYMBOL_FIRST_QUOTE_X,
          y: QUOTE_Y,
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
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
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
        },

        {
          text: cellData.squeezedPunct,
          x: PERIOD_OPENING_QUOTE_PUNCT_X,
          y: QUOTE_Y,
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
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
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
        },

        {
          text: p2,
          x: DOUBLE_PUNCT_2_X,
          y: y2,
          fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
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
            fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
          },

          {
            text: p,
            x: punctX,
            y: punctY,
            fontSize: 100 * ManuscriptEngine.CHAR_SCALE,
          },
        ],
      };
    }

    return null;
  }

  return null;
};
