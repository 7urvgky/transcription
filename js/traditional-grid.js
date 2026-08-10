"use strict";

/**
 * ============================================================
 * Traditional Manuscript Grid
 * 전통 원고지 전용 렌더러
 *
 * 주의:
 * - 기존 createGridSvg()는 절대 수정하지 않는다.
 * - 기존 createGridBody()도 수정하지 않는다.
 * - 기존 문자 렌더링(renderGridPageContent)을 그대로 사용한다.
 * - 기존 일반 원고지와 완전히 독립된 지면 구조를 만든다.
 * ============================================================
 */
function calculateTraditionalGridRows(cols) {
  if (cols === "line") {
    return ManuscriptEngine.calculateOptimalRows(cols);
  }

  const colsNum = parseInt(cols, 10);

  if (!Number.isFinite(colsNum) || colsNum <= 0) {
    return 1;
  }

  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const cellWidthMm = usableWidthMm / colsNum;

  const rowGapMm = Number(SETTINGS.manuscript.traditionalRowGap) || 0;

  /*
   * 일반 원고지가 사용할 수 있는 실제 높이
   */
  const usableHeightMm = ManuscriptEngine.calculateGridAvailableHeightMm();

  /*
   * 전통 원고지:
   *
   * rows × cellHeight
   * +
   * (rows - 1) × rowGap
   *
   * 이 높이가 usableHeightMm을 넘지 않아야 한다.
   */
  let traditionalRows = Math.floor(
    (usableHeightMm + rowGapMm) / (cellWidthMm + rowGapMm),
  );

  traditionalRows = Math.max(1, traditionalRows);

  return traditionalRows;
}

/**
 * 현재 원고지 모드에서 사용할 행 수를 반환한다.
 *
 * traditionalGrid가 false이면 기존과 완전히 동일하다.
 */
function getActiveGridRows(cols) {
  if (AppState.traditionalGrid && cols !== "line") {
    return calculateTraditionalGridRows(cols);
  }

  return ManuscriptEngine.calculateOptimalRows(cols);
}

/**
 * 전통 원고지 한 행을 그리는 SVG.
 *
 * 한 행 자체가 하나의 독립된 원고지 띠가 된다.
 *
 * 예:
 *
 * ┌─┬─┬─┬─┬─┐
 * │ │ │ │ │ │
 * └─┴─┴─┴─┴─┘
 *
 *       ↓ 여백
 *
 * ┌─┬─┬─┬─┬─┐
 * │ │ │ │ │ │
 * └─┴─┴─┴─┴─┘
 */
function createTraditionalRowSvg(colsNum, rowIndex, totalRows) {
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${colsNum} 1`);

  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.pointerEvents = "none";
  svg.style.overflow = "visible";

  /*
   * 기존 일반 원고지와 동일한 선 두께 계산
   */
  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const cellWidthMm = usableWidthMm / colsNum;

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

  /*
   * 기존 원고지와 동일한 색상
   */
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

  /*
   * ==========================================================
   * 세로 격자
   * ==========================================================
   */

  for (let x = 1; x < colsNum; x++) {
    const line = document.createElementNS(svgNS, "line");

    line.setAttribute("x1", x);

    line.setAttribute("y1", 0);

    line.setAttribute("x2", x);

    line.setAttribute("y2", 1);

    line.setAttribute("stroke", gridColor);

    /*
     * 일반 격자선과 동일한 두께
     */
    line.setAttribute("stroke-width", gridStrokeWidth);

    svg.appendChild(line);
  }

  /*
   * ==========================================================
   * 행 내부 가로선
   *
   * 전통 원고지에서는 각 행이 독립되어 있으므로
   * 한 행의 위/아래 선만 그린다.
   * ==========================================================
   */
  /*
   * 첫 번째 행의 위쪽 선은 그리지 않는다.
   *
   * 첫 번째 행의 위쪽은
   * createTraditionalOuterBorder()가
   * 전체 외곽선으로 담당한다.
   *
   * 따라서 첫 번째 행에서 이 선을 다시 그리면
   * 외곽선과 겹쳐 두꺼워진다.
   */
  if (rowIndex > 0) {
    const topLine = document.createElementNS(svgNS, "line");

    topLine.setAttribute("x1", 0);

    topLine.setAttribute("y1", 0);

    topLine.setAttribute("x2", colsNum);

    topLine.setAttribute("y2", 0);

    topLine.setAttribute("stroke", gridColor);

    /*
     * 행 사이 선은 일반 격자선과 동일한 두께
     */
    topLine.setAttribute("stroke-width", gridStrokeWidth);

    svg.appendChild(topLine);
  }

  /*
   * 마지막 행의 아래쪽 선은 그리지 않는다.
   *
   * 마지막 행의 아래쪽은
   * createTraditionalOuterBorder()가
   * 전체 외곽선으로 담당한다.
   *
   * 따라서 마지막 행에서 이 선을 다시 그리면
   * 외곽선과 겹쳐 두꺼워진다.
   */
  if (rowIndex < totalRows - 1) {
    const bottomLine = document.createElementNS(svgNS, "line");

    bottomLine.setAttribute("x1", 0);

    bottomLine.setAttribute("y1", 1);

    bottomLine.setAttribute("x2", colsNum);

    bottomLine.setAttribute("y2", 1);

    bottomLine.setAttribute("stroke", gridColor);

    /*
     * 행 사이 선은 일반 격자선과 동일한 두께
     */
    bottomLine.setAttribute("stroke-width", gridStrokeWidth);

    svg.appendChild(bottomLine);
  }

  /*
   * ==========================================================
   * 각 칸별 가이드
   *
   * 기존 createGridSvg()와 같은 좌표계를 사용한다.
   * ==========================================================
   */

  for (let col = 0; col < colsNum; col++) {
    /*
     * --------------------------------------------------------
     * 십자 가이드
     * --------------------------------------------------------
     */

    if (AppState.crossGuide) {
      const h = document.createElementNS(svgNS, "line");

      h.setAttribute("x1", col);

      h.setAttribute("y1", 0.5);

      h.setAttribute("x2", col + 1);

      h.setAttribute("y2", 0.5);

      h.setAttribute("stroke", guideColor);

      h.setAttribute("stroke-width", guideStrokeWidth);

      h.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

      svg.appendChild(h);

      const v = document.createElementNS(svgNS, "line");

      v.setAttribute("x1", col + 0.5);

      v.setAttribute("y1", 0);

      v.setAttribute("x2", col + 0.5);

      v.setAttribute("y2", 1);

      v.setAttribute("stroke", guideColor);

      v.setAttribute("stroke-width", guideStrokeWidth);

      v.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

      svg.appendChild(v);
    }

    /*
     * --------------------------------------------------------
     * 왼쪽 삼각형
     * --------------------------------------------------------
     */

    if (AppState.leftTriangleGuide) {
      const d1 = document.createElementNS(svgNS, "line");

      d1.setAttribute("x1", col + 1);

      d1.setAttribute("y1", 0);

      d1.setAttribute("x2", col);

      d1.setAttribute("y2", 0.5);

      d1.setAttribute("stroke", leftTriangleGuideColor);

      d1.setAttribute("stroke-width", guideStrokeWidth);

      d1.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

      svg.appendChild(d1);

      const d2 = document.createElementNS(svgNS, "line");

      d2.setAttribute("x1", col + 1);

      d2.setAttribute("y1", 1);

      d2.setAttribute("x2", col);

      d2.setAttribute("y2", 0.5);

      d2.setAttribute("stroke", leftTriangleGuideColor);

      d2.setAttribute("stroke-width", guideStrokeWidth);

      d2.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

      svg.appendChild(d2);
    }

    /*
     * --------------------------------------------------------
     * 위쪽 삼각형
     * --------------------------------------------------------
     */

    if (AppState.topTriangleGuide) {
      const d1 = document.createElementNS(svgNS, "line");

      d1.setAttribute("x1", col);

      d1.setAttribute("y1", 1);

      d1.setAttribute("x2", col + 0.5);

      d1.setAttribute("y2", 0);

      d1.setAttribute("stroke", topTriangleGuideColor);

      d1.setAttribute("stroke-width", guideStrokeWidth);

      d1.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

      svg.appendChild(d1);

      const d2 = document.createElementNS(svgNS, "line");

      d2.setAttribute("x1", col + 1);

      d2.setAttribute("y1", 1);

      d2.setAttribute("x2", col + 0.5);

      d2.setAttribute("y2", 0);

      d2.setAttribute("stroke", topTriangleGuideColor);

      d2.setAttribute("stroke-width", guideStrokeWidth);

      d2.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

      svg.appendChild(d2);
    }

    /*
     * --------------------------------------------------------
     * 마름모 가이드
     * --------------------------------------------------------
     */

    if (AppState.diamondGuide) {
      const segments = [
        [col, 0.5, col + 0.5, 0],
        [col + 0.5, 0, col + 1, 0.5],
        [col + 1, 0.5, col + 0.5, 1],
        [col + 0.5, 1, col, 0.5],
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

    /*
     * --------------------------------------------------------
     * 네모 가이드
     * --------------------------------------------------------
     */

    if (AppState.squareGuide) {
      const inset = AppState.squareGuideInset;

      const rect = document.createElementNS(svgNS, "rect");

      rect.setAttribute("x", col + inset);

      rect.setAttribute("y", inset);

      rect.setAttribute("width", 1 - inset * 2);

      rect.setAttribute("height", 1 - inset * 2);

      rect.setAttribute("fill", "none");

      rect.setAttribute("stroke", squareGuideColor);

      rect.setAttribute("stroke-width", guideStrokeWidth);

      rect.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

      svg.appendChild(rect);
    }
  }

  return svg;
}
/**
 * ============================================================
 * 전통 원고지 전체 외곽선
 *
 * 기존 createGridSvg()의 외곽선과 동일한 방식으로
 * borderWidth를 사용한다.
 *
 * 행 사이의 빈 공간에서도 외곽선이 끊기지 않는다.
 * ============================================================
 */
function createTraditionalOuterBorder(colsNum, optRows, cellWidthMm, rowGapMm) {
  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");

  /*
   * 기존 createGridSvg()와 동일한 계산
   */
  const borderMm = SETTINGS.stroke.borderMm;

  const borderWidth = borderMm / cellWidthMm;

  /*
   * 행 사이 간격을 셀 하나의 높이를 기준으로
   * SVG 좌표계로 변환한다.
   */
  const rowGapUnits = rowGapMm / cellWidthMm;

  /*
   * 전체 높이
   *
   * 행 높이 × 행 수
   * +
   * 행 사이 간격 × (행 수 - 1)
   */
  const totalHeightUnits = optRows + rowGapUnits * Math.max(0, optRows - 1);

  /*
   * 기존 원고지와 동일한 색상
   */
  const gridColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--manuscript-grid-color")
    .trim();

  /*
   * 기존 createGridSvg()와 동일한 좌표계
   */
  svg.setAttribute("viewBox", `0 0 ${colsNum} ${totalHeightUnits}`);

  svg.style.position = "absolute";

  svg.style.left = "0";

  svg.style.top = "0";

  svg.style.width = "100%";

  svg.style.height = "100%";

  svg.style.pointerEvents = "none";

  svg.style.overflow = "visible";

  /*
   * ==========================================================
   * 위쪽 외곽선
   * ==========================================================
   */
  const topBorder = document.createElementNS(svgNS, "rect");

  topBorder.setAttribute("x", -borderWidth);

  topBorder.setAttribute("y", -borderWidth);

  topBorder.setAttribute("width", colsNum + borderWidth * 2);

  topBorder.setAttribute("height", borderWidth);

  topBorder.setAttribute("fill", gridColor);

  svg.appendChild(topBorder);

  /*
   * ==========================================================
   * 아래쪽 외곽선
   * ==========================================================
   */
  const bottomBorder = document.createElementNS(svgNS, "rect");

  bottomBorder.setAttribute("x", -borderWidth);

  bottomBorder.setAttribute("y", totalHeightUnits);

  bottomBorder.setAttribute("width", colsNum + borderWidth * 2);

  bottomBorder.setAttribute("height", borderWidth);

  bottomBorder.setAttribute("fill", gridColor);

  svg.appendChild(bottomBorder);

  /*
   * ==========================================================
   * 왼쪽 외곽선
   * ==========================================================
   */
  const leftBorder = document.createElementNS(svgNS, "rect");

  leftBorder.setAttribute("x", -borderWidth);

  leftBorder.setAttribute("y", -borderWidth);

  leftBorder.setAttribute("width", borderWidth);

  leftBorder.setAttribute("height", totalHeightUnits + borderWidth * 2);

  leftBorder.setAttribute("fill", gridColor);

  svg.appendChild(leftBorder);

  /*
   * ==========================================================
   * 오른쪽 외곽선
   * ==========================================================
   */
  const rightBorder = document.createElementNS(svgNS, "rect");

  rightBorder.setAttribute("x", colsNum);

  rightBorder.setAttribute("y", -borderWidth);

  rightBorder.setAttribute("width", borderWidth);

  rightBorder.setAttribute("height", totalHeightUnits + borderWidth * 2);

  rightBorder.setAttribute("fill", gridColor);

  svg.appendChild(rightBorder);

  return svg;
}
/**
 * ============================================================
 * 전통 원고지의 한 행에 해당하는 DOM
 * ============================================================
 */
function createTraditionalGridRow(colsNum, cellWidthMm, rowIndex, totalRows) {
  const row = document.createElement("div");

  row.className = "traditional-grid-row relative";

  row.style.width = "100%";

  row.style.height = `${cellWidthMm}mm`;

  row.style.flex = "0 0 auto";

  /*
   * 셀을 담는 실제 DOM
   */
  const gridBody = document.createElement("div");

  gridBody.className = "grid gap-0 w-full h-full relative";

  gridBody.style.gridTemplateColumns = `repeat(${colsNum}, minmax(0, 1fr))`;

  gridBody.style.gridTemplateRows = "1fr";

  /*
   * 실제 셀 생성
   */
  for (let c = 0; c < colsNum; c++) {
    const cell = document.createElement("div");

    /*
     * 기존 renderGridPageContent()가
     * 이 클래스를 찾아 문자 데이터를 넣는다.
     */
    cell.className =
      "grid-cell-guide flex items-center justify-center relative aspect-square";

    gridBody.appendChild(cell);
  }

  /*
   * 격자 및 가이드를 SVG로 그린다.
   *
   * SVG를 먼저 삽입해도 되지만,
   * 문자 DOM이 위에 있어야 하므로
   * gridBody를 먼저 삽입하고
   * SVG를 마지막에 넣되 pointer-events:none으로 처리한다.
   */
  row.appendChild(gridBody);

  const svgGrid = createTraditionalRowSvg(colsNum, rowIndex, totalRows);

  row.appendChild(svgGrid);

  return row;
}

/**
 * ============================================================
 * 전통 원고지 글자 수 표시
 * ============================================================
 *
 * 기존 createCharCountLabels()는
 * 전체 원고지가 하나의 직사각형이라고 가정한다.
 *
 * 전통 원고지는 행 사이에 빈 공간이 있기 때문에
 * 별도의 위치 계산을 사용한다.
 */
function createTraditionalCharCountLabels(
  relativeContainer,
  spec,
  optRows,
  colsNum,
  cellsPerPage,
  cellWidthMm,
  rowGapMm,
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

        /*
         * 행 사이 간격을 포함한 실제 위치
         */
        const rowTopMm = r * (cellWidthMm + rowGapMm);

        label.style.top = `${rowTopMm}mm`;

        label.style.height = `${cellWidthMm}mm`;

        label.textContent = labelVal;

        relativeContainer.appendChild(label);

        break;
      }
    }
  }
}

/**
 * ============================================================
 * 전통 원고지 전체
 * ============================================================
 */
function createTraditionalGrid(spec, optRows, cellsPerPage) {
  const colsNum = parseInt(AppState.gridCols, 10);

  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const cellWidthMm = usableWidthMm / colsNum;

  const rowGapMm = SETTINGS.manuscript.traditionalRowGap;

  /*
   * 전체 전통 원고지 컨테이너
   */
  const relativeContainer = document.createElement("div");

  relativeContainer.className =
    "traditional-grid-container relative mx-auto block";

  relativeContainer.style.width = `${usableWidthMm}mm`;

  /*
   * 마지막 행에는 gap을 넣지 않는다.
   *
   * 전체 높이 =
   *
   * 행 높이 × 행 수
   * +
   * 행 사이 간격 × (행 수 - 1)
   */
  const totalHeightMm =
    cellWidthMm * optRows + rowGapMm * Math.max(0, optRows - 1);

  relativeContainer.style.height = `${totalHeightMm}mm`;

  relativeContainer.dataset.gridHeightMm = totalHeightMm;

  relativeContainer.dataset.gridRows = optRows;

  relativeContainer.style.display = "flex";

  relativeContainer.style.flexDirection = "column";

  relativeContainer.style.gap = `${rowGapMm}mm`;

  /*
   * 행 생성
   */
  for (let r = 0; r < optRows; r++) {
    const row = createTraditionalGridRow(colsNum, cellWidthMm, r, optRows);

    relativeContainer.appendChild(row);
  }
  /*
   * ============================================================
   * 전체 외곽선
   *
   * 행 단위의 격자와 별도로 전체 페이지를 감싼다.
   * 따라서 행 사이의 빈 공간에서도 좌우 외곽선이 이어진다.
   * ============================================================
   */
  const outerBorder = createTraditionalOuterBorder(
    colsNum,
    optRows,
    cellWidthMm,
    rowGapMm,
  );

  relativeContainer.appendChild(outerBorder);
  /*
   * 글자 수 표시
   */
  if (!AppState.hideCharCount) {
    createTraditionalCharCountLabels(
      relativeContainer,
      spec,
      optRows,
      colsNum,
      cellsPerPage,
      cellWidthMm,
      rowGapMm,
    );
  }

  return relativeContainer;
}

/**
 * ============================================================
 * 전통 원고지 여부를 데이터셋에 표시
 * ============================================================
 */
function isTraditionalGridEnabled() {
  return AppState.traditionalGrid === true && AppState.gridCols !== "line";
}
