"use strict";

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
  document.getElementById("traditional-grid").checked =
    AppState.traditionalGrid;
  document.getElementById("source-column-divider").checked =
    AppState.sourceColumnDivider;
  if (typeof syncPresetUI === "function") {
    syncPresetUI();
  }
  document.getElementById("lefttriangle-guide").checked =
    AppState.leftTriangleGuide;
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

function setleftTriangleGuideColor(val, shouldSave = true) {
  AppState.leftTriangleGuideColor = val;

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

function updateleftTriangleGuideOpacity(val) {
  AppState.leftTriangleGuideOpacity = Number(val) / 100;

  document.getElementById("leftTriangleGuideOpacityVal").innerText = val + "%";

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
  AppState.crossGuideColor = val;

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
    "--guide-color",
    hexToRgba(AppState.crossGuideColor, AppState.crossGuideOpacity),
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
  AppState.crossGuideOpacity = Number(val) / 100;
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

function appendLayoutTexts(svgHtml, layout) {
  layout.chars.forEach((item) => {
    svgHtml += `
        <text
          x="${item.x}"
          y="${item.y}"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="${item.fontSize}"
          class="font-serif-fixed fill-current text-slate-800"
          transform="translate(0, -2)">
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
      AppState.leftTriangleGuide = e.target.checked;

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
    AppState.crossGuideColor,
    !presetGuideColors.includes(AppState.crossGuideColor),
    false,
  );

  setleftTriangleGuideColor(AppState.leftTriangleGuideColor, false);
  setTopTriangleGuideColor(AppState.topTriangleGuideColor, false);
  setDiamondGuideColor(AppState.diamondGuideColor, false);
  setSquareGuideColor(AppState.squareGuideColor, false);

  updateSquareGuideOpacity(AppState.squareGuideOpacity * 100);
  updateSquareGuideSize(Math.round((1 - AppState.squareGuideInset * 2) * 100));
  // 개별 슬라이더 수치 복원 및 DOM 슬라이더 일치 작업
  updateGridOpacity(AppState.gridOpacity * 100);
  updateGuideOpacity(AppState.crossGuideOpacity * 100);
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
