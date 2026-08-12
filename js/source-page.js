"use strict";

// =====================================================
// Source Page
// 원문 읽기 페이지
// =====================================================

function createSourceHeader(innerDiv, spec, headerHTML, titleText) {
  if (spec.sIdx === 0) {
    const pageOneHeader = document.createElement("div");
    pageOneHeader.className =
      "pb-1 text-sm font-semibold custom-grid-text w-full shrink-0";

    pageOneHeader.style.marginBottom = `${SETTINGS.sourcePage.sourceHeaderBottom}mm`;
    pageOneHeader.innerHTML = headerHTML;
    innerDiv.appendChild(pageOneHeader);

    const pageOneTitle = document.createElement("div");
    pageOneTitle.className = "w-full text-left shrink-0";

    pageOneTitle.style.marginTop = `${SETTINGS.sourcePage.sourceTitleTop}mm`;

    pageOneTitle.style.marginBottom = `${SETTINGS.sourcePage.sourceTitleBottom}mm`;
    if (!AppState.hideInputTitle) {
      pageOneTitle.innerHTML = `
    <h2 class="title-placeholder font-serif-fixed text-2xl font-bold tracking-wide text-slate-800 pb-1 leading-tight max-w-[95%] break-keep whitespace-normal" contenteditable="true" style="word-break: keep-all;">
      ${escapeHTML(titleText)}
    </h2>
  `;

      innerDiv.appendChild(pageOneTitle);
    }
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

  /*
   * 페이지 바닥을 기준으로 footer 위치를 조절하기 위한 spacer.
   *
   * innerDiv의 남은 공간을 모두 차지하고,
   * footer를 페이지 아래쪽으로 밀어낸다.
   */
  const footerSpacer = document.createElement("div");

  footerSpacer.className = "flex-1 min-h-0";

  innerDiv.appendChild(footerSpacer);

  const pageOneFooter = document.createElement("div");

  /*
   * footer는 정상적인 Flex 흐름에 포함된다.
   * spacer가 남은 공간을 모두 차지하므로
   * footer는 페이지 하단에 배치된다.
   */
  pageOneFooter.className =
    "w-full flex justify-between items-center text-xs text-slate-400 font-bold shrink-0";

  /*
   * 페이지 바닥에서 footer까지의 거리.
   *
   * footerBottom = 0
   * → footer 자체가 페이지 하단에 최대한 가깝게 배치
   *
   * 숫자를 크게 할수록 위로 올라간다.
   */
  pageOneFooter.style.marginBottom = `${SETTINGS.sourcePage.sourceFooterBottom}mm`;

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
