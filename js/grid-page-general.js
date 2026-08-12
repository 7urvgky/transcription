"use strict";
// =====================================================
// 원고지 - 일반 페이지 생성
// =====================================================
function createGridFooter(spec) {
  const footerDiv = document.createElement("div");

  /*
   * ==========================================================
   * 페이지 바닥 기준으로 footer 배치
   *
   * 기존에는 normal flow에 포함되어 있어서
   * 원고지의 높이와 footer의 위치가 서로 영향을 주었다.
   *
   * 이제 absolute로 페이지 자체를 기준으로 배치한다.
   * ==========================================================
   */

  footerDiv.className =
    "absolute left-0 w-full flex justify-between items-center text-xs text-slate-400 font-bold";

  footerDiv.style.bottom = `${SETTINGS.manuscript.footerBottom}mm`;

  /*
   * footer가 페이지 내부 여백 영역 전체를 사용할 수 있도록
   * 좌우 위치를 명시한다.
   */
  footerDiv.style.paddingLeft = `${SETTINGS.layout.pageSidePadding}mm`;
  footerDiv.style.paddingRight = `${SETTINGS.layout.pageSidePadding}mm`;

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

  if (!AppState.hideInputTitle) {
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
  }

  title.appendChild(createTitleLine());

  return title;
}

function createGridPageHeader(headerHTML, titleText) {
  const elements = [];

  if (AppState.hideManuscriptHeader) {
    elements.push(createHorizontalLine(0, SETTINGS.manuscript.gridLineGap));
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
  /*
   * ============================================================
   * 헤더 / 제목
   * ============================================================
   */
  const headerElements = createGridPageHeader(headerHTML, titleText);

  headerElements.forEach((el) => {
    innerDiv.appendChild(el);
  });

  /*
   * ============================================================
   * 원고지 영역
   *
   * 원고지와 아래 실선을 하나의 영역으로 묶는다.
   *
   * 이렇게 해야 footer를 페이지 바닥으로 이동시켜도
   * 원고지와 실선 사이의 관계가 변하지 않는다.
   * ============================================================
   */
  const manuscriptArea = document.createElement("div");

  manuscriptArea.className = "w-full shrink-0 flex flex-col";

  /*
   * ============================================================
   * 원고지
   * ============================================================
   */
  const gridWrapper = document.createElement("div");

  gridWrapper.className =
    "w-full flex-1 min-h-0 flex items-center justify-center";

  manuscriptArea.appendChild(gridWrapper);

  if (AppState.traditionalGrid) {
    gridWrapper.appendChild(createTraditionalGrid(spec, optRows, cellsPerPage));
  } else {
    gridWrapper.appendChild(createGrid(spec, optRows, cellsPerPage));
  }

  /*
   * ============================================================
   * 원고지 아래 실선
   * ============================================================
   */
  manuscriptArea.appendChild(
    createHorizontalLine(SETTINGS.manuscript.gridLineGap),
  );

  /*
   * 원고지 + 실선을 하나의 영역으로 추가
   */
  innerDiv.appendChild(manuscriptArea);

  /*
   * ============================================================
   * 남는 공간
   *
   * 이 공간이 페이지의 남은 높이를 모두 차지한다.
   * 따라서 footer가 원고지 높이에 영향을 받지 않는다.
   * ============================================================
   */
  const footerSpacer = document.createElement("div");

  footerSpacer.className = "flex-1 min-h-0";

  innerDiv.appendChild(footerSpacer);

  /*
   * ============================================================
   * 꼬리말 / 페이지 번호
   *
   * 페이지 바닥을 기준으로 배치한다.
   * ============================================================
   */
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
