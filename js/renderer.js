"use strict";

function calculateSourcePageHash(segments) {
  let hash = 0;
  segments.forEach((seg) => {
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

function drawCellContent(cell, cellData, nextState, colsNum) {
  // ============================================================
  // 특수 문장부호 여부 판정
  // ============================================================

  const isSpecialPunct = nextState.includes("_S_");

  const layout = ManuscriptEngine.getCellLayout(cellData);

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
      svgHtml = appendLayoutTexts(svgHtml, layout);
    }

    // ============================================================
    // 단일 문장부호 렌더링
    // ============================================================
    else {
      const char = escapeHTML(cellData.char);

      let x = SINGLE_NORMAL_X;
      let y = CENTER_Y;

      // 마침표, 쉼표
      if (char === "." || char === ",") {
        x = SINGLE_PERIOD_X;
        y = PERIOD_Y;
      }

      // 여는 따옴표
      else if (char === "“" || char === "‘") {
        x = SINGLE_OPEN_QUOTE_X;
        y = QUOTE_Y;
      }

      // 닫는 따옴표
      else if (char === "”" || char === "’") {
        x = SINGLE_CLOSE_QUOTE_X;
        y = QUOTE_Y;
      }

      svgHtml += `
    <text x="${x}"
          y="${y}"
          dominant-baseline="central"
          text-anchor="middle"
          font-size="${100 * AppState.charScale}"
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
      ManuscriptEngine.getUsableGridWidthMm(colsNum) / colsNum;

    const charSpan = document.createElement("span");

    charSpan.className =
      "font-serif-fixed text-slate-800 trace-text-node select-none absolute inset-0 flex items-center justify-center w-full h-full pointer-events-none cell-char-span";

    charSpan.style.lineHeight = "1";

    const charText = document.createElement("span");

    charText.textContent = cellData.char;
    charText.style.fontSize = `${cellWidthMm * AppState.charScale}mm`;
    charText.style.lineHeight = "1";

    charSpan.appendChild(charText);
    cell.appendChild(charSpan);
  }
}

// ... existing renderer functions remain unchanged ...

// 1. renderPages() 전체 조판 엔진 책임 분배 실행계획부
function renderPages() {
  const container = document.getElementById("pages-container");
  const currentLayoutSignature = [
    AppState.orientation,
    AppState.gridCols,
    AppState.traditionalGrid,

    // 프리셋이 바뀌면 기존 DOM 래퍼를 재사용하지 않고
    // 프리셋에 맞는 페이지 조판을 다시 구성한다.
    AppState.activePreset || "none",

    AppState.hideInputTitle,

    AppState.hideManuscriptHeader,
    AppState.hideCharCount,
    AppState.hidePageNumbers,
    AppState.excludeFirstPage,
    AppState.hideStudentInfo,
    AppState.crossGuide,

    AppState.leftTriangleGuide,
    AppState.leftTriangleGuideColor,
    AppState.leftTriangleGuideOpacity,

    AppState.topTriangleGuide,
    AppState.topTriangleGuideColor,
    AppState.topTriangleGuideOpacity,

    AppState.diamondGuide,
    AppState.diamondGuideColor,
    AppState.diamondGuideOpacity,

    AppState.squareGuide,
    AppState.squareGuideColor,
    AppState.squareGuideOpacity,
    AppState.squareGuideInset,

    AppState.currentGridColor,
    AppState.gridOpacity,

    AppState.crossGuideColor,
    AppState.crossGuideOpacity,

    AppState.patternGuide,
    AppState.patternEmpty,
  ].join("_");

  // 단계 A: 페이지 메타 스펙 빌드 (구조 연산 전담)
  const pageSpecs = buildPageSpecs();

  // 단계 B: DOM 페이지 래퍼 보존 및 조율 (엘리먼트 풀 재사용 기법)
  adjustDOMWrappersPool(container, pageSpecs, currentLayoutSignature);
  console.log("SIGNATURE", currentLayoutSignature);

  // 단계 C: 각 지면 서브 렌더러 분기 및 가상 렌더링 (데이터 바인딩 전담)
  renderPageContents(pageSpecs, currentLayoutSignature);

  // 단계 D: 실시간 메타 데이터 동기화 및 부속 상태 갱신
  updateHeaderAndTitle();

  const totalPages = container.querySelectorAll(".page-scale-wrapper").length;
  updatePageBadge(1, totalPages);

  cachePageDimensions();
  adjustPreviewScale();

  setupIntersectionObserver();
  debouncedSave();
}