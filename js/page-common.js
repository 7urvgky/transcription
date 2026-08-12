"use strict";

// =====================================================
// Common Page Helpers
// =====================================================

// Page Builder Helpers
function createPageShell(pageClass, spec) {
  const wrapper = document.createElement("div");

  wrapper.className = "page-scale-wrapper mb-10";

  wrapper.dataset.pageType = spec.type;

  wrapper.dataset.pageMode = spec.currentMode || "none";

  const pageDiv = document.createElement("div");

  pageDiv.className = `${pageClass} relative`;

  const innerDiv = document.createElement("div");

  innerDiv.style.padding = `${SETTINGS.layout.pageTopPadding}mm
   ${SETTINGS.layout.pageSidePadding}mm
   ${SETTINGS.layout.pageBottomPadding}mm
   ${SETTINGS.layout.pageSidePadding}mm`;

  innerDiv.className = "print-page-inner flex flex-col min-h-0";

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

// 헤더; 학교, 학생 정보 등
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
    el.textContent = AppState.articleTitle || "";
  });
}

function syncMetadata(className, value, activeElement) {
  document.querySelectorAll("." + className).forEach((el) => {
    if (el !== activeElement) {
      el.textContent = value;
    }
  });
}
