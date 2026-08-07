"use strict";
// =====================================================
// Grid Renderer
// 원고지-일반 SVG 렌더링 전용
// =====================================================

function createCharCountLabels(
  relativeContainer,
  spec,
  optRows,
  colsNum,
  cellsPerPage,
) {
  const pageOffset = spec.pageIdx * cellsPerPage;

  for (let r = 0; r < optRows; r++) {
    const rowStartCell = pageOffset + r * colsNum;

    const rowEndCell = pageOffset + (r + 1) * colsNum;

    const currentMaxMultiplesCount = Math.floor(rowEndCell / 100);

    for (let k = 1; k <= currentMaxMultiplesCount; k++) {
      const targetBaseValue = 100 * k;

      if (targetBaseValue > rowStartCell && targetBaseValue <= rowEndCell) {
        const labelVal = rowEndCell;

        const label = document.createElement("div");

        label.className =
          "absolute text-[10px] custom-grid-text font-mono font-bold opacity-75 flex items-center justify-start pointer-events-none";

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

function createGrid(spec, optRows, cellsPerPage) {
  const colsNum = parseInt(AppState.gridCols);

  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const cellWidthMm = usableWidthMm / colsNum;

  const relativeContainer = document.createElement("div");

  relativeContainer.className = "relative mx-auto block";

  relativeContainer.style.width = `${usableWidthMm}mm`;

  relativeContainer.style.height = `${optRows * cellWidthMm}mm`;

  const svgGrid = createGridSvg(colsNum, optRows);

  const gridBody = createGridBody(colsNum, optRows);

  gridBody.style.position = "absolute";
  gridBody.style.left = "0";
  gridBody.style.top = "0";
  gridBody.style.width = "100%";
  gridBody.style.height = "100%";
  relativeContainer.appendChild(svgGrid);
  relativeContainer.appendChild(gridBody);

  if (!AppState.hideCharCount) {
    createCharCountLabels(
      relativeContainer,
      spec,
      optRows,
      colsNum,
      cellsPerPage,
    );
  }

  return relativeContainer;
}

function createGridSvg(colsNum, optRows) {
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");

  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const cellWidthMm = usableWidthMm / colsNum;

  // 원고지 선 두께, 점선 길이, 점선 간격을 mm 단위로 정의하고, 이를 cellWidthMm로 나누어 상대적인 stroke-width와 dasharray를 계산합니다.
  const borderMm = SETTINGS.stroke.borderMm;

  const gridLineMm = SETTINGS.stroke.gridLineMm;

  const guideLineMm = SETTINGS.guide.guideLineMm;

  const borderWidth = borderMm / cellWidthMm;

  const gridStrokeWidth = gridLineMm / cellWidthMm;

  const guideStrokeWidth = guideLineMm / cellWidthMm;

  const dashMm = SETTINGS.guide.dashMm;

  const gapMm = SETTINGS.guide.gapMm;

  const dashLength = dashMm / cellWidthMm;

  const gapLength = gapMm / cellWidthMm;

  svg.setAttribute("viewBox", `0 0 ${colsNum} ${optRows}`);

  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.pointerEvents = "none";
  svg.style.overflow = "visible";

  const gridColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--manuscript-grid-color")
    .trim();

  const guideColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--guide-color")
    .trim();

  const leftTriangleGuideColor = hexToRgba(
    AppState.leftTriangleGuideColor,
    AppState.leftTriangleGuideOpacity,
  );
  const topTriangleGuideColor = hexToRgba(
    AppState.topTriangleGuideColor,
    AppState.topTriangleGuideOpacity,
  );
  const diamondGuideColor = hexToRgba(
    AppState.diamondGuideColor,
    AppState.diamondGuideOpacity,
  );
  const squareGuideColor = hexToRgba(
    AppState.squareGuideColor,
    AppState.squareGuideOpacity,
  );

  for (let x = 1; x < colsNum; x++) {
    const line = document.createElementNS(svgNS, "line");

    line.setAttribute("x1", x);
    line.setAttribute("y1", 0);

    line.setAttribute("x2", x);
    line.setAttribute("y2", optRows);

    line.setAttribute("stroke", gridColor);
    line.setAttribute("stroke-width", gridStrokeWidth);

    svg.appendChild(line);
  }

  for (let y = 1; y < optRows; y++) {
    const line = document.createElementNS(svgNS, "line");

    line.setAttribute("x1", 0);
    line.setAttribute("y1", y);

    line.setAttribute("x2", colsNum);
    line.setAttribute("y2", y);

    line.setAttribute("stroke", gridColor);
    line.setAttribute("stroke-width", gridStrokeWidth);

    svg.appendChild(line);
  }

  // =====================
  // 외곽선 전용 rect
  // =====================

  // 위쪽
  const topBorder = document.createElementNS(svgNS, "rect");

  topBorder.setAttribute("x", -borderWidth);

  topBorder.setAttribute("y", -borderWidth);

  topBorder.setAttribute("width", colsNum + borderWidth * 2);

  topBorder.setAttribute("height", borderWidth);

  topBorder.setAttribute("fill", gridColor);

  svg.appendChild(topBorder);

  // 아래쪽
  const bottomBorder = document.createElementNS(svgNS, "rect");

  bottomBorder.setAttribute("x", -borderWidth);

  bottomBorder.setAttribute("y", optRows);

  bottomBorder.setAttribute("width", colsNum + borderWidth * 2);

  bottomBorder.setAttribute("height", borderWidth);

  bottomBorder.setAttribute("fill", gridColor);

  svg.appendChild(bottomBorder);

  // 왼쪽
  const leftBorder = document.createElementNS(svgNS, "rect");

  leftBorder.setAttribute("x", -borderWidth);

  leftBorder.setAttribute("y", -borderWidth);

  leftBorder.setAttribute("width", borderWidth);

  leftBorder.setAttribute("height", optRows + borderWidth * 2);

  leftBorder.setAttribute("fill", gridColor);

  svg.appendChild(leftBorder);

  // 오른쪽
  const rightBorder = document.createElementNS(svgNS, "rect");

  rightBorder.setAttribute("x", colsNum);

  rightBorder.setAttribute("y", -borderWidth);

  rightBorder.setAttribute("width", borderWidth);

  rightBorder.setAttribute("height", optRows + borderWidth * 2);

  rightBorder.setAttribute("fill", gridColor);

  svg.appendChild(rightBorder);

  for (let row = 0; row < optRows; row++) {
    for (let col = 0; col < colsNum; col++) {
      // =====================
      // 십자 가이드
      // =====================
      if (AppState.crossGuide) {
        const h = document.createElementNS(svgNS, "line");

        h.setAttribute("x1", col);
        h.setAttribute("y1", row + 0.5);

        h.setAttribute("x2", col + 1);
        h.setAttribute("y2", row + 0.5);

        h.setAttribute("stroke", guideColor);
        h.setAttribute("stroke-width", guideStrokeWidth);
        h.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(h);

        const v = document.createElementNS(svgNS, "line");

        v.setAttribute("x1", col + 0.5);
        v.setAttribute("y1", row);

        v.setAttribute("x2", col + 0.5);
        v.setAttribute("y2", row + 1);

        v.setAttribute("stroke", guideColor);
        v.setAttribute("stroke-width", guideStrokeWidth);
        v.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(v);
      }

      // =====================
      // 왼쪽 삼각형 가이드
      // =====================
      if (AppState.leftTriangleGuide) {
        const d1 = document.createElementNS(svgNS, "line");

        d1.setAttribute("x1", col + 1);
        d1.setAttribute("y1", row);

        d1.setAttribute("x2", col);
        d1.setAttribute("y2", row + 0.5);

        d1.setAttribute("stroke", leftTriangleGuideColor);
        d1.setAttribute("stroke-width", guideStrokeWidth);
        d1.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(d1);

        const d2 = document.createElementNS(svgNS, "line");

        d2.setAttribute("x1", col + 1);
        d2.setAttribute("y1", row + 1);

        d2.setAttribute("x2", col);
        d2.setAttribute("y2", row + 0.5);

        d2.setAttribute("stroke", leftTriangleGuideColor);
        d2.setAttribute("stroke-width", guideStrokeWidth);
        d2.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(d2);
      }

      // =====================
      // 위쪽 삼각형 가이드
      // =====================
      if (AppState.topTriangleGuide) {
        const d1 = document.createElementNS(svgNS, "line");

        d1.setAttribute("x1", col);
        d1.setAttribute("y1", row + 1);

        d1.setAttribute("x2", col + 0.5);
        d1.setAttribute("y2", row);

        d1.setAttribute("stroke", topTriangleGuideColor);

        d1.setAttribute("stroke-width", guideStrokeWidth);

        d1.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(d1);

        const d2 = document.createElementNS(svgNS, "line");

        d2.setAttribute("x1", col + 1);
        d2.setAttribute("y1", row + 1);

        d2.setAttribute("x2", col + 0.5);
        d2.setAttribute("y2", row);

        d2.setAttribute("stroke", topTriangleGuideColor);

        d2.setAttribute("stroke-width", guideStrokeWidth);

        d2.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(d2);
      }
      // =====================
      // 마름모꼴 가이드
      // =====================
      if (AppState.diamondGuide) {
        const segments = [
          [col, row + 0.5, col + 0.5, row],
          [col + 0.5, row, col + 1, row + 0.5],
          [col + 1, row + 0.5, col + 0.5, row + 1],
          [col + 0.5, row + 1, col, row + 0.5],
        ];

        segments.forEach((s) => {
          const line = document.createElementNS(svgNS, "line");

          line.setAttribute("x1", s[0]);
          line.setAttribute("y1", s[1]);
          line.setAttribute("x2", s[2]);
          line.setAttribute("y2", s[3]);

          line.setAttribute("stroke", diamondGuideColor);

          line.setAttribute("stroke-width", guideStrokeWidth);

          line.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

          svg.appendChild(line);
        });
      }
      // =====================
      // 네모 가이드
      // =====================
      if (AppState.squareGuide) {
        const inset = AppState.squareGuideInset;

        const rect = document.createElementNS(svgNS, "rect");

        rect.setAttribute("x", col + inset);

        rect.setAttribute("y", row + inset);

        rect.setAttribute("width", 1 - inset * 2);

        rect.setAttribute("height", 1 - inset * 2);

        rect.setAttribute("fill", "none");

        rect.setAttribute("stroke", squareGuideColor);

        rect.setAttribute("stroke-width", guideStrokeWidth);

        rect.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(rect);
      }
    }
  }

  return svg;
}

function createGridBody(colsNum, optRows) {
  const gridBody = document.createElement("div");

  gridBody.className = "grid gap-0 w-full h-full";

  gridBody.style.gridTemplateColumns = `repeat(${colsNum}, minmax(0, 1fr))`;

  gridBody.style.gridTemplateRows = `repeat(${optRows}, minmax(0, 1fr))`;

  for (let r = 0; r < optRows; r++) {
    for (let c = 0; c < colsNum; c++) {
      const cell = document.createElement("div");

      cell.className =
        "grid-cell-guide flex items-center justify-center relative aspect-square";

      gridBody.appendChild(cell);
    }
  }

  return gridBody;
}
