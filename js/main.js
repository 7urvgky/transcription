"use strict";

// 하단 라벨 위치 적용
function applyFooterPosition(el) {
  el.style.left = `${SETTINGS.layout.footerLeftRightMm}mm`;
  el.style.right = `${SETTINGS.layout.footerLeftRightMm}mm`;
  el.style.bottom = `${SETTINGS.layout.footerBottomMm}mm`;
}

// Layout Thrashing 최적화용 치수 캐시
let cachedPageWidth = 0;
let cachedPageHeight = 0;

// 모달 콜백 핸들러
let activeModalCallback = null;
window.hasShownLengthWarning = false;

// [보안 지향] DOM 기반 HTML Injection 차단 탈출 필터
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 디바운서
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Hydrated 상태를 UI 뷰에 정적 매핑
function applyLoadedDataToUI() {
  document.getElementById("source-text").value = AppState.sourceText;
  document.getElementById("hide-input-title").checked = AppState.hideInputTitle;
  document.getElementById("input-title").value = AppState.articleTitle;
  document.getElementById("hide-student-info").checked =
    AppState.hideStudentInfo;
  document.getElementById("input-school").value = AppState.schoolName;
  document.getElementById("input-grade").value = AppState.gradeInfo;
  document.getElementById("input-name").value = AppState.studentName;
  document.getElementById("grid-cols-select").value = AppState.gridCols;
  document.getElementById("hide-manuscript-header").checked =
    AppState.hideManuscriptHeader;
  document.getElementById("hide-char-count").checked = AppState.hideCharCount;
  document.getElementById("hide-page-numbers").checked =
    AppState.hidePageNumbers;
  document.getElementById("lefttriangle-guide").checked =
    AppState.lefttriangleGuide;
  document.getElementById("top-triangle-guide").checked =
    AppState.topTriangleGuide;
  document.getElementById("diamond-guide").checked = AppState.diamondGuide;
  document.getElementById("square-guide").checked = AppState.squareGuide;

  document.getElementById("cross-guides").checked = AppState.crossGuide;
  document.getElementById("pattern-guide").checked = AppState.patternGuide;
  document.getElementById("pattern-empty").checked = AppState.patternEmpty;
  document.getElementById("exclude-first-page").checked =
    !AppState.excludeFirstPage;
  document.getElementById("char-counter").textContent =
    `${AppState.sourceText.length}자 입력됨`;
  document.title = AppState.articleTitle
    ? AppState.articleTitle
    : "필사 용지 만들기";
  updateAutoSaveStatus();
}

function showCustomAlert(title, message) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").textContent = message;
  document.getElementById("modal-btn-cancel").classList.add("hidden");
  document.getElementById("modal-icon-container").className =
    "p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0";
  document.getElementById("custom-modal-overlay").classList.remove("hidden");
  document.getElementById("custom-modal-overlay").classList.add("flex");
  activeModalCallback = null;
}

function showCustomConfirm(title, message, onConfirm) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").textContent = message;
  document.getElementById("modal-btn-cancel").classList.remove("hidden");
  document.getElementById("modal-icon-container").className =
    "p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0";
  document.getElementById("custom-modal-overlay").classList.remove("hidden");
  document.getElementById("custom-modal-overlay").classList.add("flex");
  activeModalCallback = onConfirm;
}

function closeCustomModal(isConfirmed) {
  document.getElementById("custom-modal-overlay").classList.add("hidden");
  document.getElementById("custom-modal-overlay").classList.remove("flex");
  if (isConfirmed && activeModalCallback) {
    activeModalCallback();
  }
  activeModalCallback = null;
}

function triggerResetConfirm() {
  showCustomConfirm(
    "임시 저장 데이터 초기화",
    "입력된 내용과 설정을 완전히 초기화하고 처음으로 되돌릴까요?",
    function () {
      localStorage.removeItem("manuscriptPaperData");
      location.reload();
    },
  );
}

// 렌더 및 저장 디바운서 연계
const debouncedRender = debounce(renderPages, 200);
const debouncedSave = debounce(saveToLocalStorage, 500);

function hexToRgba(hex, alpha = 0.35) {
  if (!hex) return `rgba(0, 0, 0, ${alpha})`;
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function setGridColor(val, isCustom = false, shouldSave = true) {
  AppState.currentGridColor = val;
  document.documentElement.style.setProperty("--grid-color", val);
  document.documentElement.style.setProperty(
    "--manuscript-grid-color",
    hexToRgba(val, AppState.gridOpacity),
  );

  const buttons = document.querySelectorAll(".grid-color-check");
  buttons.forEach((el) => el.classList.add("hidden"));

  if (!isCustom) {
    const matchedBtn =
      document.querySelector(
        `button[onclick^="setGridColor('${val}'"] .grid-color-check`,
      ) ||
      document.querySelector(`button[onclick*="'${val}'"] .grid-color-check`);
    if (matchedBtn) matchedBtn.classList.remove("hidden");
    document.getElementById("grid-color-picker").value = val;
  } else {
    document.getElementById("grid-color-picker").value = val;
  }

  // '다른 색' 원형 디자인 동적 커스텀 매핑
  const customBtnSpan = document.querySelector(
    'button[onclick*="grid-color-picker.click()"] span',
  );
  if (customBtnSpan) {
    if (isCustom) {
      customBtnSpan.style.backgroundColor = val;
      customBtnSpan.style.backgroundImage = "none";
    } else {
      customBtnSpan.style.backgroundColor = "";
      customBtnSpan.style.backgroundImage =
        "linear-gradient(to top right, #6366f1, #a855f7, #ec4899)";
    }
  }

  if (shouldSave) {
    markStateChanged();
    renderPages();
  }
}
function setlefttriangleGuideColor(val, shouldSave = true) {
  AppState.lefttriangleGuideColor = val;

  const checks = document.querySelectorAll(".lefttriangle-guide-color-check");

  checks.forEach((el) => el.classList.add("hidden"));

  const matchedBtn = document.querySelector(
    `button[onclick*="${val}"] .lefttriangle-guide-color-check`,
  );

  if (matchedBtn) {
    matchedBtn.classList.remove("hidden");
  }

  const picker = document.getElementById("lefttriangle-guide-color-picker");

  if (picker) {
    picker.value = val;
  }

  if (shouldSave) {
    markStateChanged();
    renderPages();
  }
}

function updatelefttriangleGuideOpacity(val) {
  AppState.lefttriangleGuideOpacity = Number(val) / 100;

  document.getElementById("lefttriangleGuideOpacityVal").innerText = val + "%";

  markStateChanged();
  renderPages();
}
function setTopTriangleGuideColor(val, shouldSave = true) {
  AppState.topTriangleGuideColor = val;

  const checks = document.querySelectorAll(".top-triangle-guide-color-check");

  checks.forEach((el) => el.classList.add("hidden"));

  const matchedBtn = document.querySelector(
    `button[onclick*="${val}"] .top-triangle-guide-color-check`,
  );

  if (matchedBtn) {
    matchedBtn.classList.remove("hidden");
  }

  const picker = document.getElementById("top-triangle-guide-color-picker");

  if (picker) {
    picker.value = val;
  }

  if (shouldSave) {
    markStateChanged();
    renderPages();
  }
}
function updateTopTriangleGuideOpacity(val) {
  AppState.topTriangleGuideOpacity = Number(val) / 100;

  document.getElementById("topTriangleGuideOpacityVal").innerText = val + "%";

  markStateChanged();
  renderPages();
}

function setSquareGuideColor(val, shouldSave = true) {
  AppState.squareGuideColor = val;

  const checks = document.querySelectorAll(".square-guide-color-check");

  checks.forEach((el) => el.classList.add("hidden"));

  const matchedBtn = document.querySelector(
    `button[onclick*="${val}"] .square-guide-color-check`,
  );

  if (matchedBtn) {
    matchedBtn.classList.remove("hidden");
  }

  const picker = document.getElementById("square-guide-color-picker");

  if (picker) {
    picker.value = val;
  }

  if (shouldSave) {
    markStateChanged();
    renderPages();
  }
}

function updateSquareGuideOpacity(val) {
  AppState.squareGuideOpacity = Number(val) / 100;

  document.getElementById("squareGuideOpacityVal").innerText = val + "%";

  markStateChanged();
  renderPages();
}

function updateSquareGuideSize(val) {
  const sizeRatio = Number(val) / 100;

  AppState.squareGuideInset = (1 - sizeRatio) / 2;

  const el = document.getElementById("squareGuideSizeVal");

  if (el) {
    el.innerText = val + "%";
  }

  markStateChanged();
  renderPages();
}

function setDiamondGuideColor(val, shouldSave = true) {
  AppState.diamondGuideColor = val;

  const checks = document.querySelectorAll(".diamond-guide-color-check");

  checks.forEach((el) => el.classList.add("hidden"));

  const matchedBtn = document.querySelector(
    `button[onclick*="${val}"] .diamond-guide-color-check`,
  );

  if (matchedBtn) {
    matchedBtn.classList.remove("hidden");
  }

  const picker = document.getElementById("diamond-guide-color-picker");

  if (picker) {
    picker.value = val;
  }

  if (shouldSave) {
    markStateChanged();
    renderPages();
  }
}

function updateDiamondGuideOpacity(val) {
  AppState.diamondGuideOpacity = Number(val) / 100;

  document.getElementById("diamondGuideOpacityVal").innerText = val + "%";

  markStateChanged();
  renderPages();
}
function setGuideColor(val, isCustom = false, shouldSave = true) {
  AppState.currentGuideColor = val;

  updateGridGuides();

  const checks = document.querySelectorAll(".guide-color-check");
  checks.forEach((el) => el.classList.add("hidden"));

  if (!isCustom) {
    const matchedBtn =
      document.querySelector(
        `button[onclick^="setGuideColor('${val}'"] .guide-color-check`,
      ) ||
      document.querySelector(`button[onclick*="'${val}'"] .guide-color-check`);
    if (matchedBtn) matchedBtn.classList.remove("hidden");
    document.getElementById("guide-color-picker").value = val;
  } else {
    document.getElementById("guide-color-picker").value = val;
  }

  // '다른 색' 원형 디자인 동적 커스텀 매핑
  const customBtnSpan = document.querySelector(
    'button[onclick*="guide-color-picker.click()"] span',
  );
  if (customBtnSpan) {
    if (isCustom) {
      customBtnSpan.style.backgroundColor = val;
      customBtnSpan.style.backgroundImage = "none";
    } else {
      customBtnSpan.style.backgroundColor = "";
      customBtnSpan.style.backgroundImage =
        "linear-gradient(to top right, #6366f1, #a855f7, #ec4899)";
    }
  }

  if (shouldSave) {
    markStateChanged();
    renderPages();
  }
}

function updateGridGuides() {
  document.documentElement.style.setProperty(
    "--guide-display",
    AppState.crossGuide ? "none" : "block",
  );
  document.documentElement.style.setProperty(
    "--guide-color",
    hexToRgba(AppState.currentGuideColor, AppState.guideOpacity),
  );
  renderPages();
}

function updateGridOpacity(val) {
  AppState.gridOpacity = Number(val) / 100;
  document.getElementById("gridOpacityVal").innerText = val + "%";

  const slider = document.getElementById("gridOpacitySlider");
  if (slider && slider.value != val) {
    slider.value = val;
  }

  document.documentElement.style.setProperty(
    "--manuscript-grid-color",
    hexToRgba(AppState.currentGridColor, AppState.gridOpacity),
  );
  markStateChanged();
  renderPages();
}

function updateGuideOpacity(val) {
  AppState.guideOpacity = Number(val) / 100;
  document.getElementById("guideOpacityVal").innerText = val + "%";

  const slider = document.getElementById("guideOpacitySlider");
  if (slider && slider.value != val) {
    slider.value = val;
  }

  updateGridGuides();
  markStateChanged();
  renderPages();
}

function updateCharYOffset(val) {
  AppState.charYOffset = Number(val);
  const displayVal = (val > 0 ? "+" : "") + val + "%";
  document.getElementById("charYOffsetVal").innerText = displayVal;

  const slider = document.getElementById("charYOffsetSlider");
  if (slider && slider.value != val) {
    slider.value = val;
  }

  document.documentElement.style.setProperty("--char-y-offset", val + "%");
  markStateChanged();
}

function setOrientation(mode) {
  AppState.orientation = mode;

  const btnPortrait = document.getElementById("btn-portrait");
  const btnLandscape = document.getElementById("btn-landscape");

  if (AppState.orientation === "portrait") {
    btnPortrait.className =
      "py-2.5 px-4 rounded-lg border-2 border-emerald-600 bg-emerald-50 text-emerald-800 font-bold text-sm transition-all flex items-center justify-center space-x-2";
    btnLandscape.className =
      "py-2.5 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-sm transition-all flex items-center justify-center space-x-2";
  } else {
    btnPortrait.className =
      "py-2.5 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-sm transition-all flex items-center justify-center space-x-2";
    btnLandscape.className =
      "py-2.5 px-4 rounded-lg border-2 border-emerald-600 bg-emerald-50 text-emerald-800 font-bold text-sm transition-all flex items-center justify-center space-x-2";
  }
  markStateChanged();
  updatePageStyleSheet();
  renderPages();

  setTimeout(cachePageDimensions, 100);
}

// 용지 인쇄용 미디어 쿼리 주입
function updatePageStyleSheet() {
  let styleEl = document.getElementById("dynamic-page-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "dynamic-page-style";
    document.head.appendChild(styleEl);
  }
  if (AppState.orientation === "portrait") {
    styleEl.innerHTML = `
            @page { size: A4 portrait !important; margin: 0mm !important; }
            :root {
              --screen-page-width: 210mm;
              --screen-page-height: 297mm;
              --print-page-width: 210mm;
              --print-page-height: 297mm;
            }
            .print-page {
              width: var(--screen-page-width) !important;
              height: var(--screen-page-height) !important;
              max-width: var(--screen-page-width) !important;
              max-height: var(--screen-page-height) !important;
              margin: 0 auto 2.5rem auto !important;
            }
            @media print {
              .print-page {
                width: var(--print-page-width) !important;
                height: var(--print-page-height) !important;
                max-width: var(--print-page-width) !important;
                max-height: var(--print-page-height) !important;
                margin: 0 !important;
                transform: none !important;
                top: 0 !important;
                left: 0 !important;
              }
              .page-scale-wrapper {
                height: auto !important;
              }
            }
          `;
  } else {
    styleEl.innerHTML = `
            @page { size: A4 landscape !important; margin: 0 !important; }
            :root {
              --screen-page-width: 297mm;
              --screen-page-height: 210mm;
              --print-page-width: 297mm;
              --print-page-height: 210mm;
            }
            .print-page {
              width: var(--screen-page-width) !important;
              height: var(--screen-page-height) !important;
              max-width: var(--screen-page-width) !important;
              max-height: var(--screen-page-height) !important;
              margin: 0 auto 2.5rem auto !important;
            }
            @media print {
              .print-page {
                width: var(--print-page-width) !important;
                height: var(--print-page-height) !important;
                max-width: var(--print-page-width) !important;
                max-height: var(--print-page-height) !important;
                margin: 0 !important;
                transform: none !important;
                top: 0 !important;
                left: 0 !important;
              }
              .page-scale-wrapper {
                height: auto !important;
              }
            }
          `;
  }
}

function getBlankPlaceholders() {
  return {
    school:
      AppState.schoolName === " " || AppState.schoolName.trim()
        ? AppState.schoolName
        : SETTINGS.defaults.emptySchoolPlaceholder,

    grade:
      AppState.gradeInfo === " " || AppState.gradeInfo.trim()
        ? AppState.gradeInfo
        : SETTINGS.defaults.emptyGradePlaceholder,

    name:
      AppState.studentName === " " || AppState.studentName.trim()
        ? AppState.studentName
        : SETTINGS.defaults.emptyNamePlaceholder,
  };
}

function buildHeaderHTML(placeholders) {
  if (AppState.hideStudentInfo) {
    return "";
  }
  return `
          <div class="flex items-center justify-between w-full text-slate-800 text-sm font-bold">
            <div class="flex items-center space-x-6">
              <span class="school-placeholder whitespace-nowrap" contenteditable="true">${escapeHTML(placeholders.school)}</span>
              <span class="grade-placeholder whitespace-nowrap" contenteditable="true">${escapeHTML(placeholders.grade)}</span>
            </div>
            <div class="flex items-center border-2 custom-grid-border rounded-lg px-4 py-1.5 bg-slate-50/50 w-[240px]">
              <span class="text-sm font-extrabold text-slate-700 shrink-0 mr-3">이름 :</span>
              <div class="name-placeholder-container flex-1 flex justify-center items-center min-w-[100px]">
                ${
                  AppState.studentName.trim()
                    ? `<span class="name-placeholder text-slate-900 text-base font-extrabold flex-1 text-center tracking-[1em] pl-[1em]" contenteditable="true">${escapeHTML(AppState.studentName)}</span>`
                    : `<span class="name-placeholder text-slate-400 text-base font-medium flex-1 text-center tracking-normal" contenteditable="true"></span>`
                }
              </div>
            </div>
          </div>
        `;
}

function updateHeaderAndTitle() {
  const placeholders = getBlankPlaceholders();

  document
    .querySelectorAll(".school-placeholder")
    .forEach((el) => (el.textContent = placeholders.school));
  document
    .querySelectorAll(".grade-placeholder")
    .forEach((el) => (el.textContent = placeholders.grade));

  document.querySelectorAll(".name-placeholder-container").forEach((el) => {
    if (AppState.studentName.trim()) {
      el.innerHTML = `<span class="name-placeholder text-slate-900 text-base font-extrabold flex-1 text-center tracking-[1em] pl-[1em]" contenteditable="true">${escapeHTML(AppState.studentName)}</span>`;
    } else {
      el.innerHTML = `<span class="name-placeholder text-slate-400 text-base font-medium flex-1 text-center tracking-normal" contenteditable="true"></span>`;
    }
  });

  document.querySelectorAll(".title-placeholder").forEach((el) => {
    el.textContent = AppState.hideInputTitle ? "" : AppState.articleTitle || "";
  });
}

function syncMetadata(className, value, activeElement) {
  document.querySelectorAll("." + className).forEach((el) => {
    if (el !== activeElement) {
      el.textContent = value;
    }
  });
}

// Header / Footer
function createGridFooter(spec, isLineNote) {
  const footerDiv = document.createElement("div");

  footerDiv.className =
    "absolute pt-2 flex justify-between items-center text-xs text-slate-400 font-bold shrink-0";

  applyFooterPosition(footerDiv);

  let currentFooterLabel = "";
  let currentFooterClass = "";

  if (isLineNote) {
    if (spec.currentMode === "guide") {
      currentFooterLabel =
        AppState.customFooterGuideText !== null
          ? AppState.customFooterGuideText
          : SETTINGS.footer.guide + " - 줄 노트";

      currentFooterClass = "footer-label-guide";
    } else {
      currentFooterLabel =
        AppState.customFooterEmptyText !== null
          ? AppState.customFooterEmptyText
          : SETTINGS.footer.empty + " - 줄 노트";

      currentFooterClass = "footer-label-empty";
    }
  } else {
    if (spec.currentMode === "guide") {
      currentFooterLabel =
        AppState.customFooterGuideText !== null
          ? AppState.customFooterGuideText
          : SETTINGS.footer.guide + " - 가로 " + AppState.gridCols + "칸";

      currentFooterClass = "footer-label-guide";
    } else {
      currentFooterLabel =
        AppState.customFooterEmptyText !== null
          ? AppState.customFooterEmptyText
          : SETTINGS.footer.empty + " - 가로 " + AppState.gridCols + "칸";

      currentFooterClass = "footer-label-empty";
    }
  }

  footerDiv.innerHTML = `
        <span class="tracking-wide text-slate-400">
          <span class="${currentFooterClass}" contenteditable="true">
            ${escapeHTML(currentFooterLabel)}
          </span>
        </span>

        <span class="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
          - ${spec.pageIdx + 1} / ${spec.totalGridPages} -
        </span>
      `;

  return footerDiv;
}

function createPageHeader(headerHTML, titleText, isLineNote) {
  const elements = [];

  if (AppState.hideManuscriptHeader) {
    if (!isLineNote) {
      elements.push(
        createHorizontalLine(
          SETTINGS.manuscript.gridLineGap,
          SETTINGS.manuscript.gridLineGap,
        ),
      );
    }

    return elements;
  }

  elements.push(createGridHeader(headerHTML));

  elements.push(createGridTitle(titleText, isLineNote));

  return elements;
}

// Line Note
function createLineNote(optRows) {
  const usableWidthMm = AppState.orientation === "portrait" ? 162 : 249;

  const relativeContainer = document.createElement("div");

  relativeContainer.className = "relative mx-auto";

  relativeContainer.style.width = `${usableWidthMm}mm`;

  relativeContainer.style.height = `${optRows * 10}mm`;

  const noteContainer = document.createElement("div");

  noteContainer.className =
    "w-full h-full border-t-2 manuscript-grid-border flex flex-col justify-start relative";

  for (let r = 0; r < optRows; r++) {
    const rowDiv = document.createElement("div");

    const isLastRow = r === optRows - 1;

    const borderThicknessClass = isLastRow ? "border-b-[3px]" : "border-b";

    rowDiv.className = `${borderThicknessClass} manuscript-grid-border w-full shrink-0 relative`;

    rowDiv.style.height = "10mm";

    noteContainer.appendChild(rowDiv);
  }

  relativeContainer.appendChild(noteContainer);

  return relativeContainer;
}

// Grid Helpers
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

  const lefttriangleGuideColor = hexToRgba(
    AppState.lefttriangleGuideColor,
    AppState.lefttriangleGuideOpacity,
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
      if (AppState.lefttriangleGuide) {
        const d1 = document.createElementNS(svgNS, "line");

        d1.setAttribute("x1", col + 1);
        d1.setAttribute("y1", row);

        d1.setAttribute("x2", col);
        d1.setAttribute("y2", row + 0.5);

        d1.setAttribute("stroke", lefttriangleGuideColor);
        d1.setAttribute("stroke-width", guideStrokeWidth);
        d1.setAttribute("stroke-dasharray", `${dashLength} ${gapLength}`);

        svg.appendChild(d1);

        const d2 = document.createElementNS(svgNS, "line");

        d2.setAttribute("x1", col + 1);
        d2.setAttribute("y1", row + 1);

        d2.setAttribute("x2", col);
        d2.setAttribute("y2", row + 0.5);

        d2.setAttribute("stroke", lefttriangleGuideColor);
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

// Page Builder Helpers
function createPageShell(pageClass, spec) {
  const wrapper = document.createElement("div");

  wrapper.className = "page-scale-wrapper mb-10";

  wrapper.dataset.pageType = spec.type;

  wrapper.dataset.pageMode = spec.currentMode || "none";

  const pageDiv = document.createElement("div");

  pageDiv.className = pageClass;

  const innerDiv = document.createElement("div");

  innerDiv.style.padding = `${SETTINGS.layout.pageTopPadding}mm
   ${SETTINGS.layout.pageSidePadding}mm
   ${SETTINGS.layout.pageBottomPadding}mm
   ${SETTINGS.layout.pageSidePadding}mm`;

  innerDiv.className = "print-page-inner";

  pageDiv.appendChild(innerDiv);

  wrapper.appendChild(pageDiv);

  return {
    wrapper,
    pageDiv,
    innerDiv,
  };
}
function styleBottomLine(singleBottomLine) {
  const colsNum = parseInt(AppState.gridCols);

  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const extraWidth = SETTINGS.manuscript.horizontalLineExtraWidth;

  singleBottomLine.style.width = `${usableWidthMm + extraWidth}mm`;

  singleBottomLine.style.position = "relative";

  singleBottomLine.style.left = `${-extraWidth / 2}mm`;

  singleBottomLine.style.marginLeft = "auto";

  singleBottomLine.style.marginRight = "auto";
}

function createTitleLine() {
  const colsNum = parseInt(AppState.gridCols);

  const usableWidthMm = ManuscriptEngine.getUsableGridWidthMm(colsNum);

  const extraWidth = SETTINGS.manuscript.horizontalLineExtraWidth;

  const titleLine = document.createElement("div");

  titleLine.className = "custom-grid-border";

  titleLine.style.borderTop = "1px solid currentColor";

  titleLine.style.width = `${usableWidthMm + extraWidth}mm`;

  titleLine.style.marginTop = `${SETTINGS.manuscript.titleLineGap}mm`;

  titleLine.style.position = "relative";

  titleLine.style.left = `${-extraWidth / 2}mm`;

  return titleLine;
}

function createGridHeader(headerHTML) {
  const header = document.createElement("div");

  header.className =
    "pb-1 text-sm font-semibold custom-grid-text w-full shrink-0";

  header.style.marginBottom = `${SETTINGS.manuscript.gridHeaderBottom}mm`;

  header.innerHTML = headerHTML;

  return header;
}

function createGridTitle(titleText, isLineNote) {
  const title = document.createElement("div");

  title.className = "mb-1 w-full text-left shrink-0";

  title.style.marginBottom = `${SETTINGS.manuscript.gridLineGap}mm`;

  title.innerHTML = `
    <div>
      <h2
        class="title-placeholder font-serif-fixed text-xl font-bold tracking-wide text-slate-800 leading-tight max-w-[95%] break-keep whitespace-normal"
        contenteditable="true"
        style="word-break: keep-all;"
      >
        ${escapeHTML(titleText)}
      </h2>
    </div>
  `;

  if (!isLineNote) {
    title.appendChild(createTitleLine());
  }

  return title;
}

function createHorizontalLine(marginTopMm = 0, marginBottomMm = 0) {
  const line = document.createElement("div");

  line.className = "w-full border-t border-solid custom-grid-border shrink-0";

  if (marginTopMm > 0) {
    line.style.marginTop = `${marginTopMm}mm`;
  }

  if (marginBottomMm > 0) {
    line.style.marginBottom = `${marginBottomMm}mm`;
  }

  styleBottomLine(line);

  return line;
}
function createSourceHeader(innerDiv, spec, headerHTML, titleText) {
  if (spec.sIdx === 0) {
    const pageOneHeader = document.createElement("div");
    pageOneHeader.className =
      "pb-1 text-sm font-semibold custom-grid-text w-full shrink-0 mb-2";
    pageOneHeader.innerHTML = headerHTML;
    innerDiv.appendChild(pageOneHeader);

    const pageOneTitle = document.createElement("div");
    pageOneTitle.className = "w-full text-left shrink-0";

    pageOneTitle.style.marginTop = `${SETTINGS.sourcePage.sourceTitleTop}mm`;

    pageOneTitle.style.marginBottom = `${SETTINGS.sourcePage.sourceTitleBottom}mm`;
    pageOneTitle.innerHTML = `
              <h2 class="title-placeholder font-serif-fixed text-2xl font-bold tracking-wide text-slate-800 pb-1 leading-tight max-w-[95%] break-keep whitespace-normal" contenteditable="true" style="word-break: keep-all;">${escapeHTML(titleText)}</h2>
            `;
    innerDiv.appendChild(pageOneTitle);
  } else {
    const pageOneHeader = document.createElement("div");
    pageOneHeader.className =
      "pb-2 border-b border-dashed custom-grid-border grid grid-cols-3 items-center text-xs custom-grid-text opacity-80 font-serif-fixed shrink-0 w-full mb-4";
    pageOneHeader.innerHTML = `
              <span class="mini-header-left text-left tracking-wider opacity-90 text-[11px] font-medium" contenteditable="true">${escapeHTML(AppState.headerLeftText)}</span>
              <span class="mini-header-center text-center font-bold tracking-widest text-slate-800 text-[13px] px-2 break-keep whitespace-normal leading-tight" contenteditable="true" style="word-break: keep-all;">${escapeHTML(titleText)}</span>
              <span class="text-right"></span>
            `;
    innerDiv.appendChild(pageOneHeader);
  }
}

function createSourceFooter(innerDiv, spec) {
  if (AppState.hidePageNumbers) {
    return;
  }

  const pageOneFooter = document.createElement("div");

  pageOneFooter.className =
    "absolute pt-2.5 flex justify-between items-center text-xs text-slate-400 font-bold shrink-0";

  applyFooterPosition(pageOneFooter);

  const displaySourceFooter =
    AppState.customFooterSourceText !== null
      ? AppState.customFooterSourceText
      : SETTINGS.footer.source;

  pageOneFooter.innerHTML = `
    <span class="tracking-wide text-slate-400">
      <span
        class="footer-label-source"
        contenteditable="true"
      >
        ${escapeHTML(displaySourceFooter)}
      </span>
    </span>

    <span class="bg-emerald-50 text-emerald-800 px-3.5 py-1 rounded-full border border-emerald-100">
      ${spec.sIdx + 1} / ${spec.totalSourcePages}
    </span>
  `;

  innerDiv.appendChild(pageOneFooter);
}
function createSourceBody(innerDiv, spec) {
  const pageOneBody = document.createElement("div");
  pageOneBody.className = "w-full flex flex-col justify-start items-center";

  pageOneBody.style.marginBottom = `${SETTINGS.sourcePage.sourceBodyBottom}mm`;

  if (AppState.orientation === "portrait") {
    pageOneBody.style.maxHeight =
      spec.sIdx === 0
        ? `${SETTINGS.sourcePage.portraitFirstPageHeight}mm`
        : `${SETTINGS.sourcePage.portraitOtherPageHeight}mm`;
  } else {
    pageOneBody.style.maxHeight =
      spec.sIdx === 0
        ? `${SETTINGS.sourcePage.landscapeFirstPageHeight}mm`
        : `${SETTINGS.sourcePage.landscapeOtherPageHeight}mm`;
  }

  pageOneBody.style.minHeight = "0";

  const frameDiv = document.createElement("div");
  let borderClasses =
    "border-2 border-solid custom-grid-border bg-white flex flex-col justify-stretch p-6 w-full h-auto";
  if (spec.totalSourcePages > 1) {
    if (spec.sIdx === 0)
      borderClasses += " border-b-0 rounded-t-xl rounded-b-none";
    else if (spec.sIdx === spec.totalSourcePages - 1)
      borderClasses += " border-t-0 rounded-b-xl rounded-t-none";
    else borderClasses += " border-t-0 border-b-0 rounded-none";
  } else {
    borderClasses += " rounded-xl";
  }
  frameDiv.className = borderClasses;

  const pInnerContent = document.createElement("div");
  pInnerContent.className =
    "font-serif-fixed text-slate-800 leading-[2.2] font-medium w-full text-justify p-inner-content outline-none";
  pInnerContent.style.textJustify = "inter-character";
  pInnerContent.style.wordBreak = "keep-all";
  pInnerContent.style.fontSize = spec.pageData.fontSize;
  pInnerContent.style.height = "auto";

  const fontSizeNum = parseInt(spec.pageData.fontSize);
  const maxLinesOnThisPage =
    AppState.orientation === "portrait"
      ? spec.sIdx === 0
        ? ManuscriptEngine.getMaxLines(fontSizeNum, 0)
        : ManuscriptEngine.getMaxLines(fontSizeNum, 1)
      : spec.sIdx === 0
        ? ManuscriptEngine.getMaxLines(fontSizeNum, 0) / 2
        : ManuscriptEngine.getMaxLines(fontSizeNum, 1) / 2;

  const lineHeightMm = fontSizeNum * 2.2 * 0.352778;
  const maxContentHeightMm = maxLinesOnThisPage * lineHeightMm;

  pInnerContent.style.maxHeight = `${maxContentHeightMm}mm`;
  pInnerContent.style.overflow = "hidden";

  if (AppState.orientation === "landscape") {
    pInnerContent.style.columnCount = "2";
    pInnerContent.style.columnGap = `${SETTINGS.sourcePage.landscapeColumnGap}mm`;
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
}

function buildGridPage(
  innerDiv,
  spec,
  headerHTML,
  titleText,
  isLineNote,
  optRows,
  cellsPerPage,
) {
  const headerElements = createPageHeader(headerHTML, titleText, isLineNote);

  headerElements.forEach((el) => {
    innerDiv.appendChild(el);
  });

  const gridWrapper = document.createElement("div");

  gridWrapper.className = "w-full flex items-center justify-center";

  innerDiv.appendChild(gridWrapper);

  if (isLineNote) {
    gridWrapper.appendChild(createLineNote(optRows));
  } else {
    gridWrapper.appendChild(createGrid(spec, optRows, cellsPerPage));

    innerDiv.appendChild(createHorizontalLine(SETTINGS.manuscript.gridLineGap));
  }

  if (!AppState.hidePageNumbers) {
    innerDiv.appendChild(createGridFooter(spec, isLineNote));
  }
}

// Main Page Builder
function buildSkeletonPage(
  spec,
  pageClass,
  headerHTML,
  optRows,
  isLineNote,
  cellsPerPage,
) {
  const titleText = AppState.hideInputTitle ? "" : AppState.articleTitle;

  const { wrapper, innerDiv } = createPageShell(pageClass, spec);

  if (spec.type === "source") {
    createSourceHeader(innerDiv, spec, headerHTML, titleText);
    createSourceBody(innerDiv, spec);
    createSourceFooter(innerDiv, spec);
  } else {
    buildGridPage(
      innerDiv,
      spec,
      headerHTML,
      titleText,
      isLineNote,
      optRows,
      cellsPerPage,
    );
  }
  return wrapper;
}

function appendLayoutTexts(svgHtml, layout) {
  layout.chars.forEach((item) => {
    svgHtml += `
        <text
          x="${item.x}"
          y="${item.y}"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="${item.fontSize}"
          class="font-serif-fixed fill-current text-slate-800">
          ${escapeHTML(item.text)}
        </text>
      `;
  });

  return svgHtml;
}

// IntersectionObserver를 통한 쪽 감지 스캐너
let pageObserver = null;
function setupIntersectionObserver() {
  if (pageObserver) {
    pageObserver.disconnect();
  }

  const options = {
    root: document.querySelector("main"),
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  };

  const visibilityMap = new Map();

  pageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      visibilityMap.set(entry.target, entry.intersectionRatio);
    });

    let maxRatio = -1;
    let activeTarget = null;

    visibilityMap.forEach((ratio, target) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        activeTarget = target;
      }
    });

    if (activeTarget) {
      const wrappers = Array.from(
        document.querySelectorAll(".page-scale-wrapper"),
      );
      const currentPageNum = wrappers.indexOf(activeTarget) + 1;
      const totalPages = wrappers.length;
      updatePageBadge(currentPageNum, totalPages);
    }
  }, options);

  document.querySelectorAll(".page-scale-wrapper").forEach((wrapper) => {
    pageObserver.observe(wrapper);
  });
}

function updatePageBadge(current, total) {
  const pagesBadge = document.getElementById("total-pages-badge");
  const inputField = document.getElementById("pages-badge-input");
  if (pagesBadge && (!inputField || inputField.classList.contains("hidden"))) {
    pagesBadge.textContent = `📄 ${current} / ${total}`;
  }
}

function cachePageDimensions() {
  const firstPage = document.querySelector(".print-page");
  if (firstPage) {
    cachedPageWidth = firstPage.offsetWidth;
    cachedPageHeight = firstPage.offsetHeight;
  }
}

let scaleRequestPending = false;
function adjustPreviewScale() {
  if (scaleRequestPending) return;
  scaleRequestPending = true;

  window.requestAnimationFrame(() => {
    scaleRequestPending = false;

    const wrappers = document.querySelectorAll(".page-scale-wrapper");
    if (wrappers.length === 0) return;

    const mainArea = document.querySelector("main");
    if (!mainArea) return;

    const availableWidth = mainArea.offsetWidth - 48;
    const isNarrowLayout = window.innerWidth < 1024;
    const header = document.querySelector("header");

    const headerHeight = header ? header.offsetHeight : 0;

    const availableHeight = Math.max(
      200,
      window.innerHeight - headerHeight - 48,
    );

    if (cachedPageWidth === 0 || cachedPageHeight === 0) {
      cachePageDimensions();
    }

    const pageNaturalWidth = cachedPageWidth || 794;
    const pageNaturalHeight = cachedPageHeight || 1123;

    let scale = 1;

    if (AppState.previewZoomMode === "width") {
      if (availableWidth > 0 && pageNaturalWidth > 0) {
        scale = availableWidth / pageNaturalWidth;
      }
    } else if (AppState.previewZoomMode === "page") {
      if (
        availableWidth > 0 &&
        availableHeight > 0 &&
        pageNaturalWidth > 0 &&
        pageNaturalHeight > 0
      ) {
        const scaleW = availableWidth / pageNaturalWidth;
        const scaleH = availableHeight / pageNaturalHeight;
        scale = Math.min(scaleW, scaleH);
      }
    } else {
      scale = AppState.previewZoomValue / 100;
    }

    AppState.lastComputedScale = scale;

    wrappers.forEach((wrapper) => {
      const page = wrapper.querySelector(".print-page");
      if (!page) return;
      page.style.transform = `scale(${scale})`;
      page.style.transformOrigin = "top center";
      wrapper.style.height = `${pageNaturalHeight * scale}px`;
    });

    const indicator = document.getElementById("zoom-indicator-text");
    if (indicator) {
      if (AppState.previewZoomMode === "width") {
        indicator.textContent = "폭 맞춤";
      } else if (AppState.previewZoomMode === "page") {
        indicator.textContent = "쪽 맞춤";
      } else {
        indicator.textContent = `${AppState.previewZoomValue}%`;
      }
    }

    updateZoomButtonsState(scale);
    updateZoomModeUI();
  });
}

function updateZoomButtonsState(calculatedScale) {
  const btnOut = document.getElementById("btn-zoom-out");
  const btnIn = document.getElementById("btn-zoom-in");
  if (!btnOut || !btnIn) return;

  let currentVal = AppState.previewZoomValue;
  if (AppState.previewZoomMode !== "manual" && calculatedScale) {
    currentVal = Math.round(calculatedScale * 100);
  }

  if (currentVal <= 30) {
    btnOut.classList.add("opacity-30", "pointer-events-none");
    btnOut.classList.remove("hover:bg-slate-800", "active:scale-95");
  } else {
    btnOut.classList.remove("opacity-30", "pointer-events-none");
    btnOut.classList.add("hover:bg-slate-800", "active:scale-95");
  }

  if (currentVal >= 200) {
    btnIn.classList.add("opacity-30", "pointer-events-none");
    btnIn.classList.remove("hover:bg-slate-800", "active:scale-95");
  } else {
    btnIn.classList.remove("opacity-30", "pointer-events-none");
    btnIn.classList.add("hover:bg-slate-800", "active:scale-95");
  }
}

function zoomIn() {
  let currentVal = AppState.previewZoomValue;
  if (AppState.previewZoomMode !== "manual") {
    currentVal = Math.round((AppState.lastComputedScale || 1.0) * 100);
  }

  const nextVal = Math.floor(currentVal / 10) * 10 + 10;
  AppState.previewZoomValue = Math.min(200, nextVal);
  AppState.previewZoomMode = "manual";
  updateZoomModeUI();
  adjustPreviewScale();
}

function zoomOut() {
  let currentVal = AppState.previewZoomValue;
  if (AppState.previewZoomMode !== "manual") {
    currentVal = Math.round((AppState.lastComputedScale || 1.0) * 100);
  }

  const nextVal = Math.ceil(currentVal / 10) * 10 - 10;
  AppState.previewZoomValue = Math.max(30, nextVal);
  AppState.previewZoomMode = "manual";
  updateZoomModeUI();
  adjustPreviewScale();
}

function setZoomMode(mode) {
  AppState.previewZoomMode = mode;
  updateZoomModeUI();
  adjustPreviewScale();
}

function updateZoomModeUI() {
  const btnWidth = document.getElementById("btn-zoom-width");
  const btnPage = document.getElementById("btn-zoom-page");
  if (!btnWidth || !btnPage) return;

  const activeClass =
    "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer";
  const inactiveClass =
    "bg-slate-800 text-slate-500 pointer-events-none cursor-default";
  const baseBtnClass =
    "text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-sm";

  if (AppState.previewZoomMode === "width") {
    btnWidth.className = `${baseBtnClass} ${inactiveClass}`;
    btnPage.className = `${baseBtnClass} ${activeClass}`;
  } else if (AppState.previewZoomMode === "page") {
    btnWidth.className = `${baseBtnClass} ${activeClass}`;
    btnPage.className = `${baseBtnClass} ${inactiveClass}`;
  } else {
    btnWidth.className = `${baseBtnClass} ${activeClass}`;
    btnPage.className = `${baseBtnClass} ${activeClass}`;
  }
}

function enableZoomInput() {
  const textSpan = document.getElementById("zoom-indicator-text");
  const inputField = document.getElementById("zoom-input-field");
  if (!textSpan || !inputField) return;

  let currentVal = AppState.previewZoomValue;
  if (AppState.previewZoomMode !== "manual") {
    currentVal = Math.round((AppState.lastComputedScale || 1.0) * 100);
  }

  inputField.value = currentVal;
  textSpan.classList.add("hidden");
  inputField.classList.remove("hidden");
  inputField.focus();
  inputField.select();
}

function disableZoomInput(val) {
  const textSpan = document.getElementById("zoom-indicator-text");
  const inputField = document.getElementById("zoom-input-field");
  if (!textSpan || !inputField) return;

  let num = parseInt(val);
  if (isNaN(num)) {
    num = AppState.previewZoomValue;
  }

  num = Math.max(30, Math.min(200, num));

  AppState.previewZoomValue = num;
  AppState.previewZoomMode = "manual";

  inputField.classList.add("hidden");
  textSpan.classList.remove("hidden");

  updateZoomModeUI();
  adjustPreviewScale();
}

function enablePageInput(e) {
  const textSpan = document.getElementById("total-pages-badge");
  const inputField = document.getElementById("pages-badge-input");
  if (!textSpan || !inputField) return;

  if (!inputField.classList.contains("hidden")) return;
  const wrappers = document.querySelectorAll(".page-scale-wrapper");

  const totalPages = wrappers.length;

  inputField.min = 1;
  inputField.max = totalPages;
  const text = textSpan.textContent;
  const match = text.match(/📄\s*(\d+)\s*\/\s*(\d+)/);
  let currentPage = 1;
  if (match) {
    currentPage = parseInt(match[1]);
  }

  inputField.value = currentPage;
  textSpan.classList.add("hidden");
  inputField.classList.remove("hidden");
  inputField.focus();
  inputField.select();
}

function disablePageInput(val) {
  const textSpan = document.getElementById("total-pages-badge");
  const inputField = document.getElementById("pages-badge-input");
  if (!textSpan || !inputField) return;

  const wrappers = document.querySelectorAll(".page-scale-wrapper");
  const totalPages = wrappers.length;

  // 입력값 검증 (숫자 변환 및 범위 제한)
  let pageNum = parseInt(val, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    pageNum = 1;
  } else if (pageNum > totalPages) {
    pageNum = totalPages;
  }

  // 대상 페이지 요소로 부드럽게 스크롤 이동
  if (totalPages > 0 && wrappers[pageNum - 1]) {
    wrappers[pageNum - 1].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Input 숨김 처리 및 배지 UI 복원
  inputField.classList.add("hidden");
  textSpan.classList.remove("hidden");
  textSpan.textContent = `📄 ${pageNum} / ${totalPages}`;
}

// 시스템 이니셜라이저
async function initApp() {
  const savedData = localStorage.getItem("manuscriptPaperData");

  if (savedData) {
    const restore = window.confirm(
      "임시 저장된 내용이 있습니다.\n불러 올까요?",
    );

    if (restore) {
      loadFromLocalStorage();
    } else {
      localStorage.removeItem("manuscriptPaperData");
    }
  }

  applyLoadedDataToUI();

  const presetGridColors = [
    "#000000",
    "#69afa0",
    "#ff0000",
    "#2563eb",
    "#991b1b",
  ];
  const presetGuideColors = [
    "#000000",
    "#69afa0",
    "#ff0000",
    "#2563eb",
    "#991b1b",
  ];

  document.documentElement.style.setProperty(
    "--guide-display",
    AppState.crossGuide ? "none" : "block",
  );
  document.documentElement.style.setProperty(
    "--trace-opacity",
    SETTINGS.manuscript.traceOpacity,
  );
  document
    .getElementById("lefttriangle-guide")
    .addEventListener("change", (e) => {
      AppState.lefttriangleGuide = e.target.checked;

      markStateChanged();
      renderPages();
    });

  document
    .getElementById("top-triangle-guide")
    .addEventListener("change", (e) => {
      AppState.topTriangleGuide = e.target.checked;

      markStateChanged();
      renderPages();
    });

  document.getElementById("diamond-guide").addEventListener("change", (e) => {
    AppState.diamondGuide = e.target.checked;

    markStateChanged();
    renderPages();
  });

  document.getElementById("square-guide").addEventListener("change", (e) => {
    AppState.squareGuide = e.target.checked;

    markStateChanged();
    renderPages();
  });
  // 전역 CSS 속성 바인딩, 버튼 체크 표시 활성화 및 커스텀 원형 동적 매핑
  setGridColor(
    AppState.currentGridColor,
    !presetGridColors.includes(AppState.currentGridColor),
    false,
  );
  setGuideColor(
    AppState.currentGuideColor,
    !presetGuideColors.includes(AppState.currentGuideColor),
    false,
  );

  setlefttriangleGuideColor(AppState.lefttriangleGuideColor, false);
  setTopTriangleGuideColor(AppState.topTriangleGuideColor, false);
  setDiamondGuideColor(AppState.diamondGuideColor, false);
  setSquareGuideColor(AppState.squareGuideColor, false);

  updateSquareGuideOpacity(AppState.squareGuideOpacity * 100);
  updateSquareGuideSize(Math.round((1 - AppState.squareGuideInset * 2) * 100));
  // 개별 슬라이더 수치 복원 및 DOM 슬라이더 일치 작업
  updateGridOpacity(AppState.gridOpacity * 100);
  updateGuideOpacity(AppState.guideOpacity * 100);
  updateCharYOffset(AppState.charYOffset);

  updatePageStyleSheet();

  if (document.fonts) {
    await Promise.all([
      document.fonts.load('400 16px "Noto Sans JP"'),
      document.fonts.load('400 16px "Noto Serif JP"'),

      document.fonts.load('400 16px "Noto Sans KR"'),
      document.fonts.load('400 16px "Noto Serif KR"'),
      document.fonts.ready,
    ]);
  }

  renderPages();
  initializeControllers();
  cachePageDimensions();
  adjustPreviewScale();

  const pagesInput = document.getElementById("pages-badge-input");
  if (pagesInput) {
    pagesInput.addEventListener("input", () => {
      const wrappers = document.querySelectorAll(".page-scale-wrapper");

      let pageNum = parseInt(pagesInput.value, 10);

      if (isNaN(pageNum) || pageNum < 1 || pageNum > wrappers.length) {
        return;
      }

      wrappers[pageNum - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    if (pagesInput) {
      pagesInput.addEventListener("keydown", (e) => {
        const maxPage = document.querySelectorAll(".page-scale-wrapper").length;

        let pageNum = parseInt(pagesInput.value, 10) || 1;

        if (e.key === "ArrowRight") {
          e.preventDefault();

          pageNum = Math.min(maxPage, pageNum + 1);

          pagesInput.value = pageNum;

          document
            .querySelectorAll(".page-scale-wrapper")
            [pageNum - 1]?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();

          pageNum = Math.max(1, pageNum - 1);

          pagesInput.value = pageNum;

          document
            .querySelectorAll(".page-scale-wrapper")
            [pageNum - 1]?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
        }
      });
    }
  }
  const loadingEl = document.getElementById("font-loading");
  if (loadingEl) {
    loadingEl.remove();
  }

  const pagesContainer = document.getElementById("pages-container");
  if (pagesContainer) {
    pagesContainer.classList.remove("opacity-0");
  }
}

initApp();

let resizeTimeout = null;
