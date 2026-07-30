'use strict';


function calculateSourcePageHash(segments) {
  let hash = 0;
  for (let s = 0; s < segments.length; s++) {
    const text = segments[s].text || "";
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
  }
  return hash;
}

function calculatePageHash(pageCells, mode) {
  let hash = 0;
  for (let i = 0; i < pageCells.length; i++) {
    const cell = pageCells[i];
    if (!cell) continue;
    const str = (cell.char || "") + (cell.squeezedPunct || "");
    for (let j = 0; j < str.length; j++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(j);
      hash |= 0;
    }
  }
  return mode + "_" + hash;
}

function drawCellContent(
  cell,
  cellData,
  nextState,
  colsNum
) {
  // ============================================================
  // 특수 문장부호 여부 판정
  // ============================================================
  const isSpecialPunct = nextState.includes("_S_");

  const layout = ManuscriptEngine.getCellLayout(cellData);

  // ============================================================
  // 1. 특수 문장부호 (SVG 렌더링)
  // ============================================================
  if (isSpecialPunct) {
    let svgHtml = `
      <svg viewBox="0 0 100 100"
           class="w-full h-full select-none absolute inset-0 pointer-events-none"
           style="z-index: 10;">
        <g class="trace-text-node">
    `;

    if (layout) {
      svgHtml = appendLayoutTexts(svgHtml, layout);
    } else {
      const char = escapeHTML(cellData.char);
      let x = SINGLE_NORMAL_X;
      let y = CENTER_Y;

      // 마침표, 쉼표
      if (char === '.' || char === ',') {
        x = SINGLE_PERIOD_X;
        y = PERIOD_Y;
      }
      // 여는 따옴표
      else if (char === '“' || char === '‘') {
        x = SINGLE_OPEN_QUOTE_X;
        y = QUOTE_Y;
      }
      // 닫는 따옴표
      else if (char === '”' || char === '’') {
        x = SINGLE_CLOSE_QUOTE_X;
        y = QUOTE_Y;
      }

      svgHtml += `
        <text x="${x}"
              y="${y}"
              dominant-baseline="central"
              text-anchor="middle"
              font-size="${100 * ManuscriptEngine.CHAR_SCALE}"
              class="font-serif-fixed fill-current text-slate-800">
          ${char}
        </text>
      `;
    }

    svgHtml += `</g></svg>`;
    cell.innerHTML = svgHtml;
    return;
  }

// ============================================================
  // 2. 일반 문자 렌더링 (DOM 노드 재사용 극대화)
  // ============================================================
  const cellWidthMm = (AppState.orientation === 'portrait' ? 170 : 257) / colsNum;
  const targetFontSize = `${cellWidthMm * ManuscriptEngine.CHAR_SCALE}mm`;
  
  let charSpan = cell.firstElementChild;

  // 셀 내부에 이미 <span> 태그가 존재하는지 확인
  if (charSpan && charSpan.tagName === 'SPAN') {
    // ✅ dataset 속성을 이용해 DOM 레이아웃 연산 없이 빠른 문자열 비교 (Read 리플로우 방지)
    if (charSpan.dataset.fontSize !== targetFontSize) {
      charSpan.dataset.fontSize = targetFontSize;
      charSpan.style.fontSize = targetFontSize;
    }
  } else {
    // <span> 태그가 없거나 SVG 등 다른 태그가 있는 경우에만 1회 생성
    charSpan = document.createElement('span');
    charSpan.className =
      "font-serif-fixed text-slate-800 trace-text-node select-none absolute inset-0 flex items-center justify-center w-full h-full pointer-events-none cell-char-span";
    
    charSpan.dataset.fontSize = targetFontSize; // ✅ dataset에 저장
    charSpan.style.fontSize = targetFontSize;
    charSpan.style.lineHeight = "1";

    cell.replaceChildren(charSpan);
  }

  // DOM 파괴/생성 없이 텍스트 속성만 고속 최적화 변경 ($O(1)$)
  charSpan.textContent = cellData.char;
}

// 5. 원문 읽기 전용 렌더러
function renderSourcePageContent(wrapper, spec) {
    let nextState = spec.pageData.fontSize + "_" + calculateSourcePageHash(spec.pageData.segments);
    if (wrapper.dataset.stateKey !== nextState) {
    const pInnerContent = wrapper.querySelector('.p-inner-content');
    pInnerContent.innerHTML = "";
    const htmlParagraphs = [];
    let currentParaText = "";
    let isContinuedPara = false;
    let currentParaId = null;

    spec.pageData.segments.forEach(seg => {
        if (seg.isBlankLine) {
        if (currentParaText !== "") {
            htmlParagraphs.push({ text: currentParaText, isContinued: isContinuedPara, pIdx: currentParaId });
            currentParaText = "";
            currentParaId = null;
        }
        htmlParagraphs.push({ isBlank: true });
        } else {
        if (currentParaText === "") {
            isContinuedPara = seg.isContinued;
            currentParaText = seg.text;
            currentParaId = seg.pIdx;
        } else if (currentParaId !== seg.pIdx) {
            htmlParagraphs.push({ text: currentParaText, isContinued: isContinuedPara, pIdx: currentParaId });
            isContinuedPara = seg.isContinued;
            currentParaText = seg.text;
            currentParaId = seg.pIdx;
        } else {
            currentParaText += " " + seg.text;
        }
        }
    });
    if (currentParaText !== "") {
        htmlParagraphs.push({ text: currentParaText, isContinued: isContinuedPara, pIdx: currentParaId });
    }

    htmlParagraphs.forEach(p => {
        if (p.isBlank) {
        const emptySpacer = document.createElement('p');
        emptySpacer.className = "mb-0 text-justify";
        emptySpacer.innerHTML = "&nbsp;"; 
        pInnerContent.appendChild(emptySpacer);
        } else {
        const paraEl = document.createElement('p');
        paraEl.className = "mb-0 text-justify"; 
        paraEl.style.textIndent = p.isContinued ? "0" : "1.5em";
        paraEl.style.wordBreak = "keep-all";
        paraEl.style.textJustify = "inter-character";
        paraEl.textContent = p.text; 
        pInnerContent.appendChild(paraEl);
        }
    });
    wrapper.dataset.stateKey = nextState;
    }
}

// 6. 비할당형 롤링 해시 기반 원고지 렌더러
function renderGridPageContent(wrapper, spec, cellsData, cellsPerPage) {
    const pageOffset = spec.pageIdx * cellsPerPage;
    const pageCells = cellsData.slice(pageOffset, pageOffset + cellsPerPage);
    
    const pageContentHash = calculatePageHash(pageCells, spec.currentMode);
    
    if (wrapper.dataset.pageContentState === pageContentHash) {
    return; 
    }
    wrapper.dataset.pageContentState = pageContentHash;

    const cells = wrapper.querySelectorAll('.grid-cell-guide');
    const colsNum = parseInt(AppState.gridCols);

    for (let c = 0; c < cellsPerPage; c++) {
    const cellIdx = pageOffset + c;
    const cellData = pageCells[c] || { char: "" };
    const cell = cells[c];
    if (!cell) continue;

    let nextState = "EMPTY";
    if (spec.currentMode === 'guide' && cellData.char && cellData.char !== " ") {
        const isSpecialPunct = cellData.isSqueezed || 
                                cellData.isPeriodQuoteCombo || 
                                cellData.isPeriodOpeningQuoteCombo || 
                                cellData.isSymbolFirstCombo || 
                                cellData.isQuoteFirstCombo || 
                                cellData.isDoublePunct ||
                                /[.,!?'"“‘”’]/.test(cellData.char);
        nextState = cellData.char + "_" + (isSpecialPunct ? "S" : "N") + "_" + (cellData.squeezedPunct || "");
    }

    if (cell.dataset.charState === nextState) continue;

    if (nextState === "EMPTY") {
        cell.innerHTML = "";
    } else {
        drawCellContent(cell, cellData, nextState, colsNum);
    }
    cell.dataset.charState = nextState;
    }
}

// 7. 줄 노트 전용 렌더러
function renderLinePageContent(wrapper, spec, linesData, optRows) {
const startLineIdx = spec.pageIdx * optRows;
const pageLines = linesData.slice(startLineIdx, startLineIdx + optRows);

let hash = 0;
pageLines.forEach(l => {
  const text = l.text || "";
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  hash = (hash * 31 + (l.isFirstLine ? 1 : 0)) | 0;
  hash = (hash * 31 + (l.isLastLineOfPara ? 1 : 0)) | 0;
});
const pageContentHash = spec.currentMode + "_" + hash;

if (wrapper.dataset.pageContentState === pageContentHash) {
  return; 
}
wrapper.dataset.pageContentState = pageContentHash;

const rowDivs = wrapper.querySelectorAll('.manuscript-grid-border > div');

for (let r = 0; r < optRows; r++) {
  const lineIdx = startLineIdx + r;
  const lineObj = linesData[lineIdx] || { text: "", isFirstLine: false, isLastLineOfPara: true };
  const lineText = lineObj.text;
  const rowDiv = rowDivs[r];
  if (!rowDiv) continue;

  let nextState = "EMPTY";
  if (spec.currentMode === 'guide' && lineText) {
    nextState = lineText + "_" + lineObj.isFirstLine + "_" + lineObj.isLastLineOfPara;
  }

  if (rowDiv.dataset.lineState === nextState) continue;

  if (nextState === "EMPTY") {
    rowDiv.replaceChildren();
  } else {
    const textSpan = document.createElement('div');
    textSpan.textContent = lineText; 
    textSpan.className = "font-serif-fixed text-slate-300 font-medium select-none absolute left-[2mm] right-[2mm] bottom-[1.8mm] leading-none pb-0 whitespace-pre line-note-text-span";
    textSpan.style.textAlign = "justify";
    textSpan.style.textJustify = "inter-character";

    if (lineObj.isLastLineOfPara) {
      textSpan.style.textAlignLast = "left";
    } else {
      textSpan.style.textAlignLast = "justify";
    }

    textSpan.style.textIndent = lineObj.isFirstLine ? "1.2em" : "0"; 

    const baseFontSizeMm = (AppState.orientation === 'portrait') ? 5.2 : 6.2;
    const fontSizeNum = 12; 
    const adjustedFontSizeMm = baseFontSizeMm * (fontSizeNum / 12);
    textSpan.style.fontSize = `${adjustedFontSizeMm}mm`;
    rowDiv.replaceChildren(textSpan);
  }
  rowDiv.dataset.lineState = nextState;
}
}

// 빈 페이지 뼈대 빌드 엔진
    function buildSkeletonPage(spec, pageClass, headerHTML, optRows, isLineNote, cellsPerPage) {
      const titleText = AppState.hideInputTitle ? '' : AppState.articleTitle;
      const wrapper = document.createElement('div');
      wrapper.className = "page-scale-wrapper mb-10";
      wrapper.dataset.pageType = spec.type;
      wrapper.dataset.pageMode = spec.currentMode || 'none';

      const pageDiv = document.createElement('div');
      pageDiv.className = pageClass;

      const innerDiv = document.createElement('div');
      innerDiv.className = "print-page-inner";
      pageDiv.appendChild(innerDiv);
      wrapper.appendChild(pageDiv);

      if (spec.type === 'source') {
        if (spec.sIdx === 0) {
          const pageOneHeader = document.createElement('div');
          pageOneHeader.className = "pb-1 text-sm font-semibold custom-grid-text w-full shrink-0 mb-2";
          pageOneHeader.innerHTML = headerHTML;
          innerDiv.appendChild(pageOneHeader);

          const pageOneTitle = document.createElement('div');
          pageOneTitle.className = "mt-4 mb-2 w-full text-left shrink-0";
          pageOneTitle.innerHTML = `
            <h2 class="title-placeholder font-serif-fixed text-2xl font-bold tracking-wide text-slate-800 pb-1 leading-tight max-w-[95%] break-keep whitespace-normal" contenteditable="true" style="word-break: keep-all;">${escapeHTML(titleText)}</h2>
          `;
          innerDiv.appendChild(pageOneTitle);
        } else {
          const pageOneHeader = document.createElement('div');
          pageOneHeader.className = "pb-2 border-b border-dashed custom-grid-border grid grid-cols-3 items-center text-xs custom-grid-text opacity-80 font-serif-fixed shrink-0 w-full mb-4";
          pageOneHeader.innerHTML = `
            <span class="mini-header-left text-left tracking-wider opacity-90 text-[11px] font-medium" contenteditable="true">${escapeHTML(AppState.headerLeftText)}</span>
            <span class="mini-header-center text-center font-bold tracking-widest text-slate-800 text-[13px] px-2 break-keep whitespace-normal leading-tight" contenteditable="true" style="word-break: keep-all;">${escapeHTML(titleText)}</span>
            <span class="text-right"></span>
          `;
          innerDiv.appendChild(pageOneHeader);
        }

        const pageOneBody = document.createElement('div');
        pageOneBody.className = "w-full flex flex-col justify-start items-center mb-[15mm]";
        
        if (AppState.orientation === 'portrait') {
          pageOneBody.style.maxHeight = (spec.sIdx === 0) ? "175mm" : "195mm";
        } else {
          const baseHeight = (spec.sIdx === 0) ? 108 : 132;
          pageOneBody.style.maxHeight = `${baseHeight}mm`;
        }
        pageOneBody.style.minHeight = "0";

        const frameDiv = document.createElement('div');
        let borderClasses = "border-2 border-solid custom-grid-border bg-white flex flex-col justify-stretch p-6 w-full h-auto";
        if (spec.totalSourcePages > 1) {
          if (spec.sIdx === 0) borderClasses += " border-b-0 rounded-t-xl rounded-b-none";
          else if (spec.sIdx === spec.totalSourcePages - 1) borderClasses += " border-t-0 rounded-b-xl rounded-t-none";
          else borderClasses += " border-t-0 border-b-0 rounded-none";
        } else {
          borderClasses += " rounded-xl";
        }
        frameDiv.className = borderClasses;

        const pInnerContent = document.createElement('div');
        pInnerContent.className = "font-serif-fixed text-slate-800 leading-[2.2] font-medium w-full text-justify p-inner-content outline-none";
        pInnerContent.style.textJustify = "inter-character";
        pInnerContent.style.wordBreak = "keep-all";
        pInnerContent.style.fontSize = spec.pageData.fontSize; 
        pInnerContent.style.height = "auto";

        const fontSizeNum = parseInt(spec.pageData.fontSize);
        const maxLinesOnThisPage = (AppState.orientation === 'portrait') 
          ? ((spec.sIdx === 0) ? ManuscriptEngine.getMaxLines(
  fontSizeNum,
  0
) : ManuscriptEngine.getMaxLines(fontSizeNum, 1))
          : ((spec.sIdx === 0) ? ManuscriptEngine.getMaxLines(
  fontSizeNum,
  0
) / 2 : ManuscriptEngine.getMaxLines(fontSizeNum, 1) / 2); 
        
        const lineHeightMm = fontSizeNum * 2.2 * 0.352778;
        const maxContentHeightMm = maxLinesOnThisPage * lineHeightMm;

        pInnerContent.style.maxHeight = `${maxContentHeightMm}mm`;
        pInnerContent.style.overflow = "hidden"; 

        if (AppState.orientation === 'landscape') {
          pInnerContent.style.columnCount = "2";
          pInnerContent.style.columnGap = "15mm";
          pInnerContent.style.columnFill = "auto"; 
          pInnerContent.style.height = `${maxContentHeightMm}mm`;
        } else {
          pInnerContent.style.columnCount = "auto";
          pInnerContent.style.columnGap = "normal";
          pInnerContent.style.columnFill = "balance";
          pInnerContent.style.height = "auto";
        }

        frameDiv.appendChild(pInnerContent);
        pageOneBody.appendChild(frameDiv);
        innerDiv.appendChild(pageOneBody);

        if (!AppState.hidePageNumbers) {
          const pageOneFooter = document.createElement('div');
          pageOneFooter.className = "absolute bottom-[18mm] left-[20mm] right-[20mm] pt-2.5 flex justify-between items-center text-xs text-slate-400 font-bold shrink-0";
          const displaySourceFooter = AppState.customFooterSourceText !== null ? AppState.customFooterSourceText : footerSourceText;
          pageOneFooter.innerHTML = `
            <span class="tracking-wide text-slate-400"><span class="footer-label-source" contenteditable="true">${escapeHTML(displaySourceFooter)}</span></span>
            <span class="bg-emerald-50 text-emerald-800 px-3.5 py-1 rounded-full border border-emerald-100">${spec.sIdx + 1} / ${spec.totalSourcePages}</span>
          `;
          innerDiv.appendChild(pageOneFooter);
        }
      } else {
        if (!AppState.hideManuscriptHeader) {
          const gridPageHeader = document.createElement('div');
          gridPageHeader.className = "pb-1 text-sm font-semibold custom-grid-text w-full shrink-0 mb-2";
          gridPageHeader.innerHTML = headerHTML;
          innerDiv.appendChild(gridPageHeader);

          const gridPageTitle = document.createElement('div');
          gridPageTitle.className = "mt-3 mb-1 w-full text-left shrink-0";
          gridPageTitle.style.marginBottom = "2mm"; 
          
          const borderClass = isLineNote ? "" : "border-b custom-grid-border pb-1";
          gridPageTitle.innerHTML = `
            <div class="${borderClass}">
              <h2 class="title-placeholder font-serif-fixed text-xl font-bold tracking-wide text-slate-800 leading-tight max-w-[95%] break-keep whitespace-normal" contenteditable="true" style="word-break: keep-all;">${escapeHTML(titleText)}</h2>
            </div>
          `;
          innerDiv.appendChild(gridPageTitle);
        } else {
          if (!isLineNote) {
            const singleLine = document.createElement('div');
            singleLine.className = "w-full border-t border-solid custom-grid-border mb-[3mm] shrink-0";
            innerDiv.appendChild(singleLine);
          }
        }

        const gridWrapper = document.createElement('div');
        gridWrapper.className = AppState.hideManuscriptHeader ? "w-full flex items-center justify-center" : "w-full my-0 flex items-center justify-center"; 
        innerDiv.appendChild(gridWrapper);

        if (isLineNote) {
          const usableWidthMm = (AppState.orientation === 'portrait') ? 162 : 249;
          const relativeContainer = document.createElement('div');
          relativeContainer.className = "relative mx-auto";
          relativeContainer.style.width = `${usableWidthMm}mm`;
          relativeContainer.style.height = `${optRows * 10}mm`;

          const noteContainer = document.createElement('div');
          noteContainer.className = "w-full h-full border-t-2 manuscript-grid-border flex flex-col justify-start relative";
          
          for (let r = 0; r < optRows; r++) {
            const rowDiv = document.createElement('div');
            const isLastRow = (r === optRows - 1);
            const borderThicknessClass = isLastRow ? "border-b-[3px]" : "border-b";
            rowDiv.className = `${borderThicknessClass} manuscript-grid-border w-full shrink-0 relative`;
            rowDiv.style.height = "10mm";
            noteContainer.appendChild(rowDiv);
          }
          relativeContainer.appendChild(noteContainer);
          gridWrapper.appendChild(relativeContainer);
        } else {
          const colsNum = parseInt(AppState.gridCols);
          const usableWidthMm = (AppState.orientation === 'portrait') ? 170 : 257;
          const cellWidthMm = usableWidthMm / colsNum;
          
          const relativeContainer = document.createElement('div');
          relativeContainer.className = "relative mx-auto block";
          relativeContainer.style.width = `${usableWidthMm}mm`;
          relativeContainer.style.height = `${optRows * cellWidthMm}mm`;

          const gridBody = document.createElement('div');
          gridBody.className = "grid gap-0 border-2 manuscript-grid-border w-full h-full";
          gridBody.style.gridTemplateColumns = `repeat(${colsNum}, minmax(0, 1fr))`;
          gridBody.style.gridTemplateRows = `repeat(${optRows}, minmax(0, 1fr))`;

          for (let r = 0; r < optRows; r++) {
            for (let c = 0; c < colsNum; c++) {
              const cell = document.createElement('div');
              cell.className = "grid-cell-guide border-b border-r manuscript-grid-border flex items-center justify-center relative aspect-square";
              if (c === colsNum - 1) cell.classList.remove('border-r');
              if (r === optRows - 1) cell.classList.remove('border-b');
              gridBody.appendChild(cell);
            }
          }
          relativeContainer.appendChild(gridBody);

          if (!AppState.hideCharCount) {
            const pageOffset = spec.pageIdx * cellsPerPage;
            for (let r = 0; r < optRows; r++) {
              const rowStartCell = pageOffset + r * colsNum;
              const rowEndCell = pageOffset + (r + 1) * colsNum;
              const currentMaxMultiplesCount = Math.floor(rowEndCell / 100);
              
              for (let k = 1; k <= currentMaxMultiplesCount; k++) {
                const targetBaseValue = 100 * k;
                if (targetBaseValue > rowStartCell && targetBaseValue <= rowEndCell) {
                  const labelVal = rowEndCell; 
                  const label = document.createElement('div');
                  label.className = "absolute text-[10px] custom-grid-text font-mono font-bold opacity-75 flex items-center justify-start pointer-events-none";
                  label.style.right = "-32px";
                  label.style.width = "25px";
                  label.style.height = `${100 / optRows}%`;
                  label.style.top = `${(r * 100) / optRows}%`;
                  label.textContent = labelVal;
                  relativeContainer.appendChild(label);
                  break; 
                }
              }
            }
          }
          gridWrapper.appendChild(relativeContainer);
        }

        if (!isLineNote) {
          if (AppState.hideManuscriptHeader) {
            const singleBottomLine = document.createElement('div');
            singleBottomLine.className = "w-full border-t border-solid custom-grid-border mt-[3mm] shrink-0";
            innerDiv.appendChild(singleBottomLine);
          } else {
            const singleBottomLine = document.createElement('div');
            singleBottomLine.className = "w-full border-t border-solid custom-grid-border mt-[2mm] shrink-0";
            innerDiv.appendChild(singleBottomLine);
          }
        }

        if (!AppState.hidePageNumbers) {
          const footerDiv = document.createElement('div');
          footerDiv.className = "absolute bottom-[18mm] left-[20mm] right-[20mm] pt-2 flex justify-between items-center text-xs text-slate-400 font-bold shrink-0";
          
          let currentFooterLabel = "";
          let currentFooterClass = "";
          
          if (isLineNote) {
            if (spec.currentMode === 'guide') {
              currentFooterLabel = AppState.customFooterGuideText !== null ? AppState.customFooterGuideText : (footerGuideText + " - 줄 노트");
              currentFooterClass = "footer-label-guide";
            } else {
              currentFooterLabel = AppState.customFooterEmptyText !== null ? AppState.customFooterEmptyText : (footerEmptyText + " - 줄 노트");
              currentFooterClass = "footer-label-empty";
            }
          } else {
            if (spec.currentMode === 'guide') {
              currentFooterLabel = AppState.customFooterGuideText !== null ? AppState.customFooterGuideText : (footerGuideText + " - 가로 " + AppState.gridCols + "칸");
              currentFooterClass = "footer-label-guide";
            } else {
              currentFooterLabel = AppState.customFooterEmptyText !== null ? AppState.customFooterEmptyText : (footerEmptyText + " - 가로 " + AppState.gridCols + "칸");
              currentFooterClass = "footer-label-empty";
            }
          }

          footerDiv.innerHTML = `
            <span class="tracking-wide text-slate-400"><span class="${currentFooterClass}" contenteditable="true">${escapeHTML(currentFooterLabel)}</span></span>
            <span class="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">- ${spec.pageIdx + 1} / ${spec.totalGridPages} -</span>
          `;
          innerDiv.appendChild(footerDiv);
        }
      }

      return wrapper;
    }

// 4. 지면 데이터 동기화 분기 제어부
function renderPageContents(pageSpecs, currentLayoutSignature) {
    const container = document.getElementById('pages-container');
    const wrappers = Array.from(container.querySelectorAll('.page-scale-wrapper'));
    const pageClass = AppState.orientation === 'portrait' ? 'a4-page print-page portrait-page' : 'a4-page print-page landscape-page';
    const placeholders = getBlankPlaceholders();
    const headerHTML = buildHeaderHTML(placeholders);
    const optRows =
ManuscriptEngine.calculateOptimalRows(
AppState.gridCols
);
    const isLineNote = (AppState.gridCols === 'line');
    const cellsPerPage = isLineNote ? optRows : (parseInt(AppState.gridCols) * optRows);

    let cellsData = [];
    let linesData = [];

    if (isLineNote) {
    const maxNonSpace = (AppState.orientation === 'portrait') ? 25 : 33;
    linesData =
SourcePageEngine.splitTextForLineNote(
AppState.sourceText,
maxNonSpace
);
    } else {
    const colsNum = parseInt(AppState.gridCols);
    cellsData = ManuscriptEngine.parseTextToManuscriptCells(
AppState.sourceText,
colsNum
);
    }

    for (let i = 0; i < pageSpecs.length; i++) {
    const spec = pageSpecs[i];
    const wrapper = wrappers[i];

    const sourceFrameState =
        spec.type === 'source'
        ? `${spec.sIdx}_${spec.totalSourcePages}`
        : 'normal';

    // 레이아웃 비틀림 감지 시 해당 단일 지면만 뼈대 복원
    if (
wrapper.dataset.pageType !== spec.type ||
wrapper.dataset.pageMode !== (spec.currentMode || 'none') ||
wrapper.dataset.layoutSignature !== currentLayoutSignature ||
wrapper.dataset.sourceFrameState !== sourceFrameState
) {
        
        const rebuiltWrapper = buildSkeletonPage(spec, pageClass, headerHTML, optRows, isLineNote, cellsPerPage);
        wrapper.innerHTML = rebuiltWrapper.innerHTML;
wrapper.dataset.pageType = spec.type;
wrapper.dataset.pageMode = spec.currentMode || 'none';
wrapper.dataset.layoutSignature = currentLayoutSignature;
wrapper.dataset.sourceFrameState = sourceFrameState;
        delete wrapper.dataset.stateKey; 
        delete wrapper.dataset.pageContentState; 
    }

    // 각 서브 전용 렌더러에게 세부 그리기 작업 양도
    if (spec.type === 'source') {
        renderSourcePageContent(wrapper, spec);
    } else if (spec.type === 'grid') {
        renderGridPageContent(wrapper, spec, cellsData, cellsPerPage);
    } else if (spec.type === 'line') {
        renderLinePageContent(wrapper, spec, linesData, optRows);
    }
    }
}

// 3. 고성능 Flyweight 엘리먼트 풀 유지보수기
function adjustDOMWrappersPool(container, pageSpecs, currentLayoutSignature) {
  const existingWrappers = Array.from(container.querySelectorAll('.page-scale-wrapper'));
  
  // 1. 넘치는 기존 래퍼 엘리먼트 메모리 해제
  while (existingWrappers.length > pageSpecs.length) {
    const popped = existingWrappers.pop();
    container.removeChild(popped);
  }

  const pageClass = AppState.orientation === 'portrait' 
    ? 'a4-page print-page portrait-page' 
    : 'a4-page print-page landscape-page';
  const placeholders = getBlankPlaceholders();
  const headerHTML = buildHeaderHTML(placeholders);
  const optRows = ManuscriptEngine.calculateOptimalRows(AppState.gridCols);
  const isLineNote = (AppState.gridCols === 'line');
  const cellsPerPage = isLineNote ? optRows : (parseInt(AppState.gridCols) * optRows);

  // 2. 부족한 분량 주입 시 DocumentFragment를 활용한 단일 Reflow 처리
  if (existingWrappers.length < pageSpecs.length) {
    const fragment = document.createDocumentFragment();

    while (existingWrappers.length < pageSpecs.length) {
      const newSpec = pageSpecs[existingWrappers.length];
      const newWrapper = buildSkeletonPage(newSpec, pageClass, headerHTML, optRows, isLineNote, cellsPerPage);
      
      // 실제 DOM 트리가 아닌 가상 메모리 Fragment에 래퍼 축적
      fragment.appendChild(newWrapper);
      existingWrappers.push(newWrapper);
    }

    // 단 1회의 appendChild 호출로 전체 지면을 일괄 주입 ($N$회 Reflow -> 1회)
    container.appendChild(fragment);
  }
}

// 2. 페이지 스펙 모델링 생성부 (파싱 결과 객체 함께 반환)
function buildPageSpecs() {
    const pageSpecs = [];

    if (!AppState.excludeFirstPage) {
      const paragraphs = AppState.sourceText.split('\n');
      const sourcePages = SourcePageEngine.paginateSourceText(paragraphs);
      sourcePages.forEach((pageData, sIdx) => {
          pageSpecs.push({
            type: 'source',
            sIdx: sIdx,
            totalSourcePages: sourcePages.length,
            pageData: pageData
          });
      });
    }

    const optRows = ManuscriptEngine.calculateOptimalRows(AppState.gridCols);
    const isLineNote = (AppState.gridCols === 'line');
    const cellsPerPage = isLineNote ? optRows : (parseInt(AppState.gridCols) * optRows);
    
    let totalGridPages = 1;
    let cellsData = [];
    let linesData = [];

    if (isLineNote) {
      const maxNonSpace = (AppState.orientation === 'portrait') ? 25 : 33;
      linesData = SourcePageEngine.splitTextForLineNote(AppState.sourceText, maxNonSpace);
      totalGridPages = Math.ceil(linesData.length / optRows) || 1;
    } else {
      const colsNum = parseInt(AppState.gridCols);
      cellsData = ManuscriptEngine.parseTextToManuscriptCells(AppState.sourceText, colsNum);
      totalGridPages = Math.ceil(cellsData.length / cellsPerPage) || 1;
    }

    const renderingModes = [];
    if (AppState.patternGuide) renderingModes.push('guide');
    if (AppState.patternEmpty) renderingModes.push('empty');
    if (renderingModes.length === 0) renderingModes.push('empty');

    renderingModes.forEach(currentMode => {
      for (let pageIdx = 0; pageIdx < totalGridPages; pageIdx++) {
          pageSpecs.push({
            type: isLineNote ? 'line' : 'grid',
            pageIdx: pageIdx,
            totalGridPages: totalGridPages,
            currentMode: currentMode
          });
      }
    });

    return { pageSpecs, cachedData: { cellsData, linesData } };
}

// 1. renderPages() 메인 파이프라인
function renderPages() {
    const container = document.getElementById('pages-container');
    const currentLayoutSignature = AppState.orientation + "_" + AppState.gridCols + "_" + AppState.hideManuscriptHeader + "_" + AppState.hideCharCount + "_" + AppState.hidePageNumbers + "_" + AppState.excludeFirstPage + "_" + AppState.patternGuide + "_" + AppState.patternEmpty;

    // 단계 A: 페이지 메타 스펙 및 파싱 데이터 빌드
    const { pageSpecs, cachedData } = buildPageSpecs();

    // 단계 B: DOM 페이지 래퍼 보존 및 조율
    adjustDOMWrappersPool(container, pageSpecs, currentLayoutSignature);

    // 단계 C: 각 지면 서브 렌더러 분기 및 렌더링
    renderPageContents(pageSpecs, currentLayoutSignature, cachedData);

    // 단계 D: 실시간 메타 데이터 동기화
    updateHeaderAndTitle();

    const totalPages = container.querySelectorAll('.page-scale-wrapper').length;
    updatePageBadge(1, totalPages);
    
    requestAnimationFrame(() => {
      cachePageDimensions(); 
      adjustPreviewScale();  
    });

    setupIntersectionObserver();
    debouncedSave();
}

