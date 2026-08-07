"use strict";
// =====================================================
// Line Note 줄 노트 전용 렌더러
// =====================================================
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

function createLineNoteFooter(spec) {
  const footerDiv = document.createElement("div");

  footerDiv.className =
    "absolute pt-2 flex justify-between items-center text-xs text-slate-400 font-bold shrink-0";

  applyFooterPosition(footerDiv);

  let currentFooterLabel = "";
  let currentFooterClass = "";

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

function buildLineNotePage(innerDiv, spec, headerHTML, titleText, optRows) {
  const headerElements = createLineNotePageHeader(headerHTML, titleText);

  headerElements.forEach((el) => {
    innerDiv.appendChild(el);
  });

  const gridWrapper = document.createElement("div");

  gridWrapper.className = "w-full flex items-center justify-center";

  innerDiv.appendChild(gridWrapper);

  gridWrapper.appendChild(createLineNote(optRows));

  if (!AppState.hidePageNumbers) {
    innerDiv.appendChild(createLineNoteFooter(spec));
  }
}

function buildLineNoteSkeletonPage(spec, pageClass, headerHTML, optRows) {
  const titleText = AppState.hideInputTitle ? "" : AppState.articleTitle;

  const { wrapper, innerDiv } = createPageShell(pageClass, spec);

  buildLineNotePage(innerDiv, spec, headerHTML, titleText, optRows);

  return wrapper;
}

function createLineNotePageHeader(headerHTML, titleText) {
  const elements = [];

  if (AppState.hideManuscriptHeader) {
    return elements;
  }

  elements.push(createGridHeader(headerHTML));

  elements.push(createLineNoteTitle(titleText));

  return elements;
}

function createLineNoteTitle(titleText) {
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

  return title;
}
