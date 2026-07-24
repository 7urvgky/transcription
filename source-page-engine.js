'use strict';

const SourcePageEngine = {};

 SourcePageEngine.canFitSinglePage =
function(paragraphs, fontSizePt) {
      const segments = [];
      paragraphs.forEach((p, pIdx) => {
        if (p.trim() === "") {
          segments.push({ isBlankLine: true, pIdx: pIdx });
        } else {
          segments.push({ text: p.trim(), isContinued: false, pIdx: pIdx });
        }
      });
      const lines = ManuscriptEngine.estimateLinesForSegments(segments, fontSizePt);
      const maxLines = ManuscriptEngine.getMaxLines(fontSizePt, 0); 
      return lines <= maxLines;
    }

SourcePageEngine.paginateSourceText =
function(paragraphs) {
      let globalFontSize = '12pt';
      
      if (SourcePageEngine.canFitSinglePage(paragraphs, 12)) {
        globalFontSize = '12pt';
      } else if (SourcePageEngine.canFitSinglePage(paragraphs, 11)) {
        globalFontSize = '11pt';
      } else if (SourcePageEngine.canFitSinglePage(paragraphs, 10)) {
        globalFontSize = '10pt';
      } else {
        globalFontSize = '12pt'; 
      }

      const fontSizeNum = parseInt(globalFontSize);

      const stream = [];
      paragraphs.forEach((p, pIdx) => {
        const trimmed = p.trim();
        if (trimmed === "") {
          stream.push({ type: 'blank', pIdx: pIdx });
        } else {
          const sentences = trimmed.split(/(?<=[.?!])\s+/);
          sentences.forEach((s, idx) => {
            if (s.trim() !== "") {
              stream.push({
                type: 'sentence',
                text: s.trim(),
                isParaStart: (idx === 0),
                pIdx: pIdx
              });
            }
          });
        }
      });

      const pages = [];
      let currentPageIdx = 0;
      let currentPageSegments = [];

      for (let i = 0; i < stream.length; i++) {
        const item = stream[i];
        let candidateSegments = [...currentPageSegments];
        let nextSegment;

        if (item.type === 'blank') {
          nextSegment = { isBlankLine: true, pIdx: item.pIdx };
        } else {
          const isContinued = !item.isParaStart;
          nextSegment = { text: item.text, isContinued: isContinued, pIdx: item.pIdx };
        }

        candidateSegments.push(nextSegment);

        const maxLines = ManuscriptEngine.getMaxLines(fontSizeNum, currentPageIdx);
        const estimated = ManuscriptEngine.estimateLinesForSegments(candidateSegments, fontSizeNum);

        if (estimated <= maxLines) {
          currentPageSegments.push(nextSegment);
        } else {
          if (currentPageSegments.length > 0) {
            pages.push({ segments: [...currentPageSegments], fontSize: globalFontSize });
            currentPageSegments = [];
            currentPageIdx++;

            if (item.type === 'sentence') {
              const isContinuedOnNewPage = !item.isParaStart;
              currentPageSegments.push({ text: item.text, isContinued: isContinuedOnNewPage, pIdx: item.pIdx });
            } else {
              currentPageSegments.push({ isBlankLine: true, pIdx: item.pIdx });
            }
          } else {
            currentPageSegments.push(nextSegment);
          }
        }
      }
      
      if (currentPageSegments.length > 0) {
        pages.push({ segments: currentPageSegments, fontSize: globalFontSize });
      }

      return pages;
    }

SourcePageEngine.splitTextForLineNote =
function(text, maxNonSpace) {
      const lines = [];
      const paragraphs = text.split('\n');
      const isPunctuation = (c) => /[.,!?'"ным“('_~);:]/.test(c) || /[.,!?'""]["“”‘’()\[\]{}<>~?;:：；！？]/.test(c);

      paragraphs.forEach((p) => {
        if (p.trim() === "") {
          lines.push({ text: "", isFirstLine: false, isLastLineOfPara: true });
          return;
        }

        let chars = Array.from(p);
        let currentLineText = "";
        let currentNonSpaceCount = 0;
        let isFirstLine = true;

        let i = 0;
        while (i < chars.length) {
          let char = chars[i];
          let isSpace = (char === ' ' || char === '\t' || char === '\r');

          if (!isSpace && currentNonSpaceCount >= maxNonSpace) {
            if (isPunctuation(char)) {
              while (i < chars.length && isPunctuation(chars[i])) {
                currentLineText += chars[i];
                i++;
              }
            }
            
            lines.push({ text: currentLineText, isFirstLine: isFirstLine, isLastLineOfPara: false });
            currentLineText = "";
            currentNonSpaceCount = 0;
            isFirstLine = false;
            
            if (i < chars.length && (chars[i] === ' ' || chars[i] === '\t' || chars[i] === '\r')) {
              i++;
            }
            continue;
          }

          currentLineText += char;
          if (!isSpace) {
            currentNonSpaceCount++;
          }
          i++;
        }

        if (currentLineText.length > 0 || isFirstLine) {
          lines.push({ text: currentLineText, isFirstLine: isFirstLine, isLastLineOfPara: true });
        }
      });

      return lines;
    }