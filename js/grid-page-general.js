"use strict";
// =====================================================
// 원고지 - 일반 페이지 생성
// =====================================================
function createGridFooter(spec) {
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
        : SETTINGS.footer.guide + " - 가로 " + AppState.gridCols + "칸";

    currentFooterClass = "footer-label-guide";
  } else {
    currentFooterLabel =
      AppState.customFooterEmptyText !== null
        ? AppState.customFooterEmptyText
        : SETTINGS.footer.empty + " - 가로 " + AppState.gridCols + "칸";

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

function createGridTitle(titleText) {
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

  title.appendChild(createTitleLine());

  return title;
}

function createGridPageHeader(headerHTML, titleText) {
  const elements = [];

  if (AppState.hideManuscriptHeader) {
    elements.push(
      createHorizontalLine(
        SETTINGS.manuscript.gridLineGap,
        SETTINGS.manuscript.gridLineGap,
      ),
    );

    return elements;
  }

  elements.push(createGridHeader(headerHTML));

  elements.push(createGridTitle(titleText));

  return elements;
}

function buildGridPage(
  innerDiv,
  spec,
  headerHTML,
  titleText,
  optRows,
  cellsPerPage,
) {
  const headerElements = createGridPageHeader(headerHTML, titleText);

  headerElements.forEach((el) => {
    innerDiv.appendChild(el);
  });

  const gridWrapper = document.createElement("div");

  gridWrapper.className = "w-full flex items-center justify-center";

  innerDiv.appendChild(gridWrapper);

  gridWrapper.appendChild(createGrid(spec, optRows, cellsPerPage));

  innerDiv.appendChild(createHorizontalLine(SETTINGS.layout.gridLineGap));

  if (!AppState.hidePageNumbers) {
    innerDiv.appendChild(createGridFooter(spec));
  }
}

function buildSkeletonPage(spec, pageClass, headerHTML, optRows, cellsPerPage) {
  const titleText = AppState.hideInputTitle ? "" : AppState.articleTitle;

  const { wrapper, innerDiv } = createPageShell(pageClass, spec);

  if (spec.type === "source") {
    createSourceHeader(innerDiv, spec, headerHTML, titleText);
    createSourceBody(innerDiv, spec);
    createSourceFooter(innerDiv, spec);
  } else {
    buildGridPage(innerDiv, spec, headerHTML, titleText, optRows, cellsPerPage);
  }
  return wrapper;
}
