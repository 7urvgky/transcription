'use strict';

    // [성능 향상] parseTextToManuscriptCells 결과 캐싱 레이어 탑재
const ManuscriptEngine = {};

ManuscriptEngine.cachedParsedCells = null;
ManuscriptEngine.lastParsedText = "";
ManuscriptEngine.lastParsedCols = null;

    ManuscriptEngine.parseTextToManuscriptCells =
function(text, cols) {
      if (ManuscriptEngine.cachedParsedCells && ManuscriptEngine.lastParsedText === text && ManuscriptEngine.lastParsedCols === cols) {
        return ManuscriptEngine.cachedParsedCells;
      }

      const cells = [];
      const isAlphanumeric = (c) => /[0-9a-zA-Z]/.test(c);
      const isPunctuation = (c) => /[.,!?'"ным“('_~);:]/.test(c) || /[.,!?'""]["“”‘’()\[\]{}<>~?;:：；！？]/.test(c);
      
      const isPeriodOrComma = (c) => c === '.' || c === ',';
      const isQuote = (c) => /[“‘”’"']/.test(c);
      const isSymbol = (c) => /[!?！？]/.test(c); 

      const paragraphs = text.split('\n');

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

          const isAtRowEnd = (colIndex === 0 && cells.length > 0);

        
          // 원고지 마지막 칸의 문자 + 기호일 때한 칸으로 합침
          if (isPunctuation(char) && isAtRowEnd) {
            let targetIdx = cells.length - 1;
            if (cells[targetIdx] && !cells[targetIdx].isParagraphFiller && !cells[targetIdx].squeezedPunct) {
              cells[targetIdx].squeezedPunct = char; 
              cells[targetIdx].isSqueezed = true;
              charIdx += 1;
              continue;
            }
          }

        
          if (isPeriodOrComma(char) && nextChar && (nextChar === '“' || nextChar === '‘')) {
            cells.push({
              char: char,
              squeezedPunct: nextChar,
              isPeriodOpeningQuoteCombo: true
            });
            charIdx += 2;
            continue;
          }

          if (isPeriodOrComma(char) && nextChar && (nextChar === '”' || nextChar === '’' || nextChar === '"' || nextChar === "'")) {
            cells.push({
              char: char,
              squeezedPunct: nextChar,
              isPeriodQuoteCombo: true
            });
            charIdx += 2;
            continue;
          }

          if (isSymbol(char) && nextChar && isQuote(nextChar)) {
            cells.push({
              char: char,
              squeezedPunct: nextChar,
              isSymbolFirstCombo: true
            });
            charIdx += 2;
            continue;
          }

          if (isQuote(char) && nextChar && isSymbol(nextChar)) {
            cells.push({
              char: char,
              squeezedPunct: nextChar,
              isQuoteFirstCombo: true
            });
            charIdx += 2;
            continue;
          }

          if (isPunctuation(char) && nextChar && isPunctuation(nextChar)) {
            cells.push({
              char: char,
              squeezedPunct: nextChar,
              isDoublePunct: true
            });
            charIdx += 2;
            continue;
          }

          if (char === ' ') {
            if (colIndex === 0) {
              charIdx++;
              continue;
            }
            if (cells.length > 0) {
              const prevCell = cells[cells.length - 1];
              if (prevCell && (prevCell.char === '.' || prevCell.char === ',')) {
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
    }

    ManuscriptEngine.calculateOptimalRows =
function(cols) {
      if (cols === "line") {
        if (AppState.orientation === 'portrait') {
          return AppState.hideManuscriptHeader ? 24 : 21; 
        } else {
          return AppState.hideManuscriptHeader ? 16 : 13; 
        }
      }
      const colsNum = parseInt(cols);
      
      if (colsNum === 20 && AppState.orientation === 'portrait') {
        return 25;
      }
      
      const usableWidthMm = (AppState.orientation === 'portrait') ? 170 : 257;
      const cellWidthMm = usableWidthMm / colsNum;
      
      const usableHeightMm = (AppState.orientation === 'portrait')
        ? (AppState.hideManuscriptHeader ? 228 : 208)
        : (AppState.hideManuscriptHeader ? 158 : 133);

      return Math.floor(usableHeightMm / cellWidthMm);
    }

    function estimateLinesForSegments(segments, fontSizePt) {
      const charWidthMm = fontSizePt * 0.3527; 
      const maxLineWidthMm = (AppState.orientation === 'portrait') ? 155 : 112; 

      let totalLines = 0;

      function getCharWidthMm(char) {
        if (/[0-9a-zA-Z]/.test(char)) return charWidthMm * 0.58; 
        if (char === ' ') return charWidthMm * 0.35; 
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
              text: currentParaWords.join(' '),
              words: currentParaWords,
              hasIndent: currentParaHasIndent
            });
            currentParaWords = [];
          }
          paragraphsToCalculate.push({ isBlankLine: true });
        } else {
          const prevSeg = i > 0 ? segments[i - 1] : null;
          const isNewParagraph = !prevSeg || prevSeg.isBlankLine || (prevSeg.pIdx !== seg.pIdx);

          if (isNewParagraph) {
            if (currentParaWords.length > 0) {
              paragraphsToCalculate.push({
                text: currentParaWords.join(' '),
                words: currentParaWords,
                hasIndent: currentParaHasIndent
              });
              currentParaWords = [];
            }
            currentParaHasIndent = !seg.isContinued;
          }

          const wordsInSeg = seg.text.split(' ');
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
          text: currentParaWords.join(' '),
          words: currentParaWords,
          hasIndent: currentParaHasIndent
        });
      }

      paragraphsToCalculate.forEach(p => {
        if (p.isBlankLine) {
          totalLines += 1.0;
          return;
        }

        const indentWidth = p.hasIndent ? (charWidthMm * 1.5) : 0;
        let currentLineWidth = indentWidth;
        let linesInPara = 1;

        p.words.forEach(word => {
          if (word === "") {
            currentLineWidth += getCharWidthMm(' ');
            return;
          }

          let wordWidth = 0;
          for (let char of word) {
            wordWidth += getCharWidthMm(char);
          }

          const spaceWidth = (currentLineWidth > indentWidth) ? getCharWidthMm(' ') : 0;

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
    }

    ManuscriptEngine.getMaxLines =
function(fontSizePt, pageIdx) {
      if (AppState.orientation === 'portrait') {
        const baseLines = (pageIdx === 0) ? 27 : 30;
        return Math.floor(baseLines * (10 / fontSizePt));
      } else { 
        const baseLinesPerCol = (pageIdx === 0) ? 16 : 18;
        const linesPerCol = Math.floor(baseLinesPerCol * (10 / fontSizePt));
        return linesPerCol * 2; 
      }
    }