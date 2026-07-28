'use strict';
function calculateSourcePageHash(segments) {
      let hash = 0;
      segments.forEach(seg => {
        const text = seg.text || "";
        for (let i = 0; i < text.length; i++) {
          hash = (hash * 31 + text.charCodeAt(i)) | 0;
        }
      });
      return hash;
}

function calculatePageHash(pageCells, mode) {
      let hash = 0;
      for (let i = 0; i < pageCells.length; i++) {
        const char = pageCells[i].char || "";
        const squeezed = pageCells[i].squeezedPunct || "";
        for (let j = 0; j < char.length; j++) {
          hash = (hash * 31 + char.charCodeAt(j)) | 0;
        }
        for (let j = 0; j < squeezed.length; j++) {
          hash = (hash * 31 + squeezed.charCodeAt(j)) | 0;
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

  const isSpecialPunct =
    nextState.includes("_S_");

  const layout =
    ManuscriptEngine.getCellLayout(
      cellData
    );

  // ============================================================
  // SVG 렌더링
  // ============================================================

  if (isSpecialPunct) {

    let svgHtml = `
      <svg viewBox="0 0 100 100"
           class="w-full h-full select-none absolute inset-0 pointer-events-none"
           style="z-index: 10;">
        <g class="trace-text-node">
    `;

    // ============================================================
    // layout 기반 렌더링
    // ============================================================

    if (layout) {

      svgHtml =
        appendLayoutTexts(
          svgHtml,
          layout
        );

    }

// ============================================================
// 단일 문장부호 렌더링
// ============================================================

else {

  const char =
    escapeHTML(
      cellData.char
    );

  let x = SINGLE_NORMAL_X;
  let y = CENTER_Y;

  // 마침표, 쉼표
  if (
    char === '.' ||
    char === ','
  ) {

    x = SINGLE_PERIOD_X;
    y = PERIOD_Y;

  }

  // 여는 따옴표
  else if (
    char === '“' ||
    char === '‘'
  ) {

    x = SINGLE_OPEN_QUOTE_X;
    y = QUOTE_Y;

  }

  // 닫는 따옴표
  else if (
    char === '”' ||
    char === '’'
  ) {

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

    // ============================================================
    // SVG 종료
    // ============================================================

    svgHtml += `</g></svg>`;

    cell.innerHTML = svgHtml;

  }

  // ============================================================
  // 일반 문자 렌더링
  // ============================================================

  else {

    const cellWidthMm =
      (
        AppState.orientation === 'portrait'
          ? 170
          : 257
      ) / colsNum;

    const charSpan =
      document.createElement(
        'span'
      );

    charSpan.className =
      "font-serif-fixed text-slate-800 trace-text-node select-none absolute inset-0 flex items-center justify-center w-full h-full pointer-events-none cell-char-span";

    charSpan.style.fontSize =
      `${cellWidthMm * ManuscriptEngine.CHAR_SCALE}mm`;

    charSpan.style.lineHeight = "1";

    charSpan.textContent =
      cellData.char;

    cell.replaceChildren(
      charSpan
    );

  }

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
        delete wrapper.dataset.sourceFrameState;
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
      
      // 넘치는 기존 래퍼 엘리먼트 메모리 해제
      while (existingWrappers.length > pageSpecs.length) {
        const popped = existingWrappers.pop();
        container.removeChild(popped);
      }

      const pageClass = AppState.orientation === 'portrait' ? 'a4-page print-page portrait-page' : 'a4-page print-page landscape-page';
      const placeholders = getBlankPlaceholders();
      const headerHTML = buildHeaderHTML(placeholders);
      const optRows =
  ManuscriptEngine.calculateOptimalRows(
    AppState.gridCols
  );
      const isLineNote = (AppState.gridCols === 'line');
      const cellsPerPage = isLineNote ? optRows : (parseInt(AppState.gridCols) * optRows);

      // 부족한 분량만 최소 가상 객체 주입
      while (existingWrappers.length < pageSpecs.length) {
        const newSpec = pageSpecs[existingWrappers.length];
        const newWrapper = buildSkeletonPage(newSpec, pageClass, headerHTML, optRows, isLineNote, cellsPerPage);
        container.appendChild(newWrapper);
        existingWrappers.push(newWrapper);
      }
}

// 2. 페이지 스펙 모델링 생성부
function buildPageSpecs() {
    const pageSpecs = [];

    // A4 원문 읽기 지면
    if (!AppState.excludeFirstPage) {
    const paragraphs = AppState.sourceText.split('\n');
    const sourcePages =
SourcePageEngine
.paginateSourceText(
    paragraphs
);
    sourcePages.forEach((pageData, sIdx) => {
        pageSpecs.push({
        type: 'source',
        sIdx: sIdx,
        totalSourcePages: sourcePages.length,
        pageData: pageData
        });
    });
    }

    // 원고지 및 줄노트 지면 계산
    const optRows =
ManuscriptEngine.calculateOptimalRows(
AppState.gridCols
);
    const isLineNote = (AppState.gridCols === 'line');
    const cellsPerPage = isLineNote ? optRows : (parseInt(AppState.gridCols) * optRows);
    
    let totalGridPages = 1;
    if (isLineNote) {
    const maxNonSpace =
(AppState.orientation === 'portrait')
? 25
: 33;

const linesData =
SourcePageEngine.splitTextForLineNote(
AppState.sourceText,
maxNonSpace
);
    totalGridPages = Math.ceil(linesData.length / optRows) || 1;
    } else {
    const colsNum = parseInt(AppState.gridCols);
    const cellsData = ManuscriptEngine.parseTextToManuscriptCells(
AppState.sourceText,
colsNum
);
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

    return pageSpecs;
}

// 1. renderPages() 전체 조판 엔진 책임 분배 실행계획부
function renderPages() {
    const container = document.getElementById('pages-container');
    const currentLayoutSignature = AppState.orientation + "_" + AppState.gridCols + "_" + AppState.hideManuscriptHeader + "_" + AppState.hideCharCount + "_" + AppState.hidePageNumbers + "_" + AppState.excludeFirstPage + "_" + AppState.patternGuide + "_" + AppState.patternEmpty;

    // 단계 A: 페이지 메타 스펙 빌드 (구조 연산 전담)
    const pageSpecs = buildPageSpecs();

    // 단계 B: DOM 페이지 래퍼 보존 및 조율 (엘리먼트 풀 재사용 기법)
    adjustDOMWrappersPool(container, pageSpecs, currentLayoutSignature);

    // 단계 C: 각 지면 서브 렌더러 분기 및 가상 렌더링 (데이터 바인딩 전담)
    renderPageContents(pageSpecs, currentLayoutSignature);

    // 단계 D: 실시간 메타 데이터 동기화 및 부속 상태 갱신
    updateHeaderAndTitle();

    const totalPages = container.querySelectorAll('.page-scale-wrapper').length;
    updatePageBadge(1, totalPages);
    
    cachePageDimensions();
    adjustPreviewScale();

    setupIntersectionObserver();
    debouncedSave();
}

