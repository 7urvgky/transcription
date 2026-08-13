"use strict";

/*
 * 프리셋은 이 목록만 수정하면 추가·삭제할 수 있다.
 * 일반 원고지의 설정값은 presetRestoreState에 보관해 해제 시 되돌린다.
 */
const MANUSCRIPT_PRESETS = {
  none: { id: "none", name: "프리셋 해제" },
  "landscape-60": {
    id: "landscape-60",
    name: "가로 방향 6 × 10 = 60자",
    orientation: "landscape",
    rows: 6,
    cols: 10,
  },
  "portrait-130": {
    id: "portrait-130",
    name: "세로 방향 13 × 10 = 130자",
    orientation: "portrait",
    rows: 13,
    cols: 10,
  },
  "landscape-200": {
    id: "landscape-200",
    name: "가로 방향 10 × 20 = 200자",
    orientation: "landscape",
    rows: 10,
    cols: 20,
  },
  "portrait-500": {
    id: "portrait-500",
    name: "세로 방향 25 × 20 = 500자",
    orientation: "portrait",
    rows: 25,
    cols: 20,
  },
};

function getActiveManuscriptPreset() {
  return MANUSCRIPT_PRESETS[AppState.presetId] || MANUSCRIPT_PRESETS.none;
}

function isPresetMode() {
  return AppState.presetMode === true && AppState.presetId !== "none";
}

/* 프리셋 격자가 표식 및 학생 정보와 겹치지 않도록 셀 크기를 계산한다. */
function getPresetGridMetrics() {
  const preset = getActiveManuscriptPreset();
  const pageWidthMm = preset.orientation === "portrait" ? 210 : 297;
  const pageHeightMm = preset.orientation === "portrait" ? 297 : 210;
  const sideMarginMm = 14;
  // 학생 정보가 표시되어도 격자 행 수·셀 크기가 달라지지 않게
  // 항상 동일한 상단 공간을 예약한다.
  const topReservedMm = 25;
  const bottomReservedMm = 14;
  const rowGapMm = AppState.traditionalGrid
    ? Number(SETTINGS.manuscript.traditionalRowGap) || 0
    : 0;
  const widthBasedCellMm = (pageWidthMm - sideMarginMm * 2) / preset.cols;
  const heightBasedCellMm =
    (pageHeightMm -
      topReservedMm -
      bottomReservedMm -
      rowGapMm * Math.max(0, preset.rows - 1)) /
    preset.rows;
  const cellWidthMm = Math.max(
    1,
    Math.min(widthBasedCellMm, heightBasedCellMm),
  );

  return {
    cols: preset.cols,
    rows: preset.rows,
    rowGapMm,
    cellWidthMm,
    widthMm: cellWidthMm * preset.cols,
  };
}

function syncPresetUI() {
  const active = isPresetMode();
  const button = document.getElementById("preset-menu-button");
  const gridSelect = document.getElementById("grid-cols-select");
  const traditionalGrid = document.getElementById("traditional-grid");
  const portraitButton = document.getElementById("btn-portrait");
  const landscapeButton = document.getElementById("btn-landscape");

  if (button) {
    button.textContent = active ? "PRESET ✓" : "PRESET";
    button.classList.toggle("border-red-200", active);
    button.classList.toggle("bg-red-50", active);
    button.classList.toggle("text-red-700", active);
    button.classList.toggle("border-slate-300", !active);
    button.classList.toggle("bg-white", !active);
    button.classList.toggle("text-slate-600", !active);
  }
  document.querySelectorAll(".preset-option").forEach((option) => {
    const selected = active && option.dataset.presetId === AppState.presetId;
    option.classList.toggle("bg-slate-100", selected);
    option.classList.toggle("font-black", selected);
    option.dataset.selected = selected ? "true" : "false";
  });
  if (gridSelect) gridSelect.disabled = active;
  if (traditionalGrid) traditionalGrid.disabled = false;
  if (portraitButton) portraitButton.disabled = active;
  if (landscapeButton) landscapeButton.disabled = active;
}

function applyManuscriptPreset(presetId) {
  const preset = MANUSCRIPT_PRESETS[presetId] || MANUSCRIPT_PRESETS.none;

  if (preset.id === "none") {
    disableManuscriptPreset();
    return;
  }

  if (!isPresetMode()) {
    AppState.presetRestoreState = {
      gridCols: AppState.gridCols,
      orientation: AppState.orientation,
      traditionalGrid: AppState.traditionalGrid,
      hideStudentInfo: AppState.hideStudentInfo,
      hideCharCount: AppState.hideCharCount,
      hideManuscriptHeader: AppState.hideManuscriptHeader,
      hidePageNumbers: AppState.hidePageNumbers,
      excludeFirstPage: AppState.excludeFirstPage,
    };
  }

  AppState.presetId = preset.id;
  AppState.presetMode = true;
  AppState.gridCols = String(preset.cols);
  AppState.traditionalGrid = true;
  AppState.hideStudentInfo = true;
  AppState.hideCharCount = true;
  AppState.hideManuscriptHeader = false;
  AppState.hidePageNumbers = false;
  AppState.excludeFirstPage = true;

  setOrientation(preset.orientation);
  document.getElementById("grid-cols-select").value = String(preset.cols);
  document.getElementById("traditional-grid").checked = true;
  document.getElementById("hide-student-info").checked = true;
  document.getElementById("hide-char-count").checked = true;
  document.getElementById("hide-manuscript-header").checked = false;
  document.getElementById("hide-page-numbers").checked = false;
  document.getElementById("exclude-first-page").checked = false;
  syncPresetUI();
  markStateChanged();
  renderPages();
}

function disableManuscriptPreset() {
  const restore = AppState.presetRestoreState;

  AppState.presetId = "none";
  AppState.presetMode = false;
  AppState.presetRestoreState = null;

  if (restore) {
    AppState.gridCols = restore.gridCols;
    AppState.traditionalGrid = restore.traditionalGrid;
    AppState.hideStudentInfo = restore.hideStudentInfo;
    AppState.hideCharCount = restore.hideCharCount;
    AppState.hideManuscriptHeader = restore.hideManuscriptHeader;
    AppState.hidePageNumbers = restore.hidePageNumbers;
    AppState.excludeFirstPage = restore.excludeFirstPage;
    setOrientation(restore.orientation);
  }

  document.getElementById("grid-cols-select").value = AppState.gridCols;
  document.getElementById("traditional-grid").checked =
    AppState.traditionalGrid;
  document.getElementById("hide-student-info").checked =
    AppState.hideStudentInfo;
  document.getElementById("hide-char-count").checked = AppState.hideCharCount;
  document.getElementById("hide-manuscript-header").checked =
    AppState.hideManuscriptHeader;
  document.getElementById("hide-page-numbers").checked =
    AppState.hidePageNumbers;
  document.getElementById("exclude-first-page").checked =
    !AppState.excludeFirstPage;
  syncPresetUI();
  markStateChanged();
  renderPages();
}

/* 일반 헤더·푸터를 만들지 않는 프리셋 전용 지면. */
function createPresetStudentInfo() {
  const info = document.createElement("div");
  info.className = "absolute flex items-center font-bold text-slate-700";
  info.style.top = `${SETTINGS.manuscriptPreset.studentInfoTopMm}mm`;
  info.style.left = "14mm";
  // 고정 폭을 두면 페이지 중간에서 학생 정보가 잘리므로,
  // 좌우 여백 사이의 모든 너비를 사용한다. 설정값은 최소 폭으로만 쓴다.
  info.style.right = "14mm";
  info.style.minWidth = `${SETTINGS.manuscriptPreset.studentInfoWidthMm}mm`;
  info.style.maxWidth = "calc(100% - 28mm)";
  info.style.gap = `${SETTINGS.manuscriptPreset.studentInfoGapMm}mm`;
  info.style.fontSize = `${SETTINGS.manuscriptPreset.studentInfoFontSizePx}px`;
  const placeholders = getBlankPlaceholders();
  info.innerHTML = `
    <span class="school-placeholder shrink-0 whitespace-nowrap overflow-hidden text-ellipsis" contenteditable="true">${escapeHTML(placeholders.school)}</span>
    <span class="grade-placeholder shrink-0 whitespace-nowrap overflow-hidden text-ellipsis" contenteditable="true">${escapeHTML(placeholders.grade)}</span>
    <span class="shrink-0 whitespace-nowrap">이름 : <span class="name-placeholder inline-block max-w-[42mm] align-bottom text-center tracking-[0.35em] pl-[0.35em] overflow-hidden text-ellipsis" contenteditable="true">${escapeHTML(AppState.studentName)}</span></span>
  `;
  return info;
}

function buildPresetGridPage(innerDiv, spec, optRows, cellsPerPage) {
  const preset = getActiveManuscriptPreset();

  if (!AppState.hideStudentInfo) {
    innerDiv.appendChild(createPresetStudentInfo());
  }

  const gridAnchor = document.createElement("div");
  gridAnchor.className = "absolute inset-0 flex items-center justify-center";
  gridAnchor.style.pointerEvents = "none";

  const metrics = getPresetGridMetrics();
  const gridStage = document.createElement("div");
  gridStage.className = "relative";
  gridStage.style.width = `${metrics.widthMm}mm`;
  gridStage.style.height = `${
    metrics.cellWidthMm * metrics.rows +
    metrics.rowGapMm * Math.max(0, metrics.rows - 1)
  }mm`;

  const grid = createTraditionalGrid(spec, optRows, cellsPerPage);
  grid.style.pointerEvents = "auto";
  gridStage.appendChild(grid);

  if (SETTINGS.manuscript.showHorizontalLines) {
    const lineWidth = `calc(100% + ${SETTINGS.manuscriptPreset.horizontalLineExtraWidthMm}mm)`;
    const createCenteredLine = (verticalPosition, value) => {
      const line = document.createElement("div");
      line.className = "absolute border-t custom-grid-border";
      line.style[verticalPosition] = value;
      line.style.width = lineWidth;
      line.style.left = "50%";
      line.style.transform = "translateX(-50%)";
      line.style.boxSizing = "border-box";
      return line;
    };
    gridStage.appendChild(
      createCenteredLine(
        "bottom",
        `calc(100% + ${SETTINGS.manuscript.gridLineGap}mm)`,
      ),
    );
    gridStage.appendChild(
      createCenteredLine(
        "top",
        `calc(100% + ${SETTINGS.manuscript.gridLineGap}mm)`,
      ),
    );
  }

  if (!AppState.hideManuscriptHeader) {
    const numberLabel = document.createElement("div");
    numberLabel.className = "absolute text-slate-600 leading-none";
    numberLabel.style.bottom = `calc(100% + ${SETTINGS.manuscript.gridLineGap + 2}mm)`;
    numberLabel.style.right = `${SETTINGS.manuscriptPreset.numberInsetFromRightMm}mm`;
    numberLabel.style.fontFamily = '"Noto Serif KR", serif';
    numberLabel.style.fontStyle = "italic";
    numberLabel.style.fontSize = `${SETTINGS.manuscriptPreset.numberFontSizePx}px`;
    numberLabel.style.color = "var(--grid-color)";
    numberLabel.innerHTML = `No. <span class="inline-block align-baseline border-b" style="width:${SETTINGS.manuscriptPreset.numberUnderlineWidthMm}mm; border-color:var(--grid-color)"></span>`;
    gridStage.appendChild(numberLabel);
  }

  if (!AppState.hidePageNumbers) {
    const sizeLabel = document.createElement("div");
    sizeLabel.className = "absolute text-slate-600 leading-none";
    sizeLabel.style.top = `calc(100% + ${SETTINGS.manuscript.gridLineGap + 2}mm)`;
    sizeLabel.style.left = `${SETTINGS.manuscriptPreset.footerInsetFromLeftMm}mm`;
    sizeLabel.style.fontFamily = '"Noto Serif KR", serif';
    sizeLabel.style.fontSize = `${SETTINGS.manuscriptPreset.footerFontSizePx}px`;
    sizeLabel.style.color = "var(--grid-color)";
    sizeLabel.textContent = `${preset.rows} × ${preset.cols}`;
    gridStage.appendChild(sizeLabel);
  }

  gridAnchor.appendChild(gridStage);
  innerDiv.appendChild(gridAnchor);
}

function bindPresetUI() {
  const menuButton = document.getElementById("preset-menu-button");
  const menu = document.getElementById("preset-menu");
  if (!menuButton || !menu) return;

  menuButton.addEventListener("click", () => menu.classList.toggle("hidden"));
  document.addEventListener("click", (event) => {
    if (
      !menu.classList.contains("hidden") &&
      !menu.contains(event.target) &&
      event.target !== menuButton
    ) {
      menu.classList.add("hidden");
    }
  });
  document.querySelectorAll(".preset-option").forEach((button) => {
    button.addEventListener("click", () => {
      applyManuscriptPreset(button.dataset.presetId);
      menu.classList.add("hidden");
    });
  });
  syncPresetUI();
}
