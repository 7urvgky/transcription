// 임시 저장 시각 UI 업데이트
function updateAutoSaveStatus() {
  const el = document.getElementById("auto-save-status");
  if (!el) return;
  if (!AppState.lastSavedTime) {
    el.textContent = "";
    return;
  }
  const d = new Date(AppState.lastSavedTime);
  if (isNaN(d.getTime())) {
    el.textContent = "";
    return;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  el.style.whiteSpace = "pre-line";
  el.textContent =
    `${year}. ${month}. ${date}. ${hours}:${minutes}:${seconds} 로컬에 임시 저장 되었습니다.\n` +
    `(인터넷에는 어떠한 입력 데이터도 송신 되지 않습니다.)`;
}

// 부동소수점 숫자 비교
// JavaScript 계산 과정에서 발생하는 미세한 오차를 허용한다.
function isSameNumber(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.000001;
}

// 기본 상태 확인
function isDefaultState() {
  return (
    AppState.sourceText === DEFAULT_APP_STATE.sourceText &&
    AppState.articleTitle === DEFAULT_APP_STATE.articleTitle &&
    AppState.hideInputTitle === DEFAULT_APP_STATE.hideInputTitle &&
    AppState.gridCols === DEFAULT_APP_STATE.gridCols &&
    AppState.hideStudentInfo === DEFAULT_APP_STATE.hideStudentInfo &&
    AppState.schoolName === DEFAULT_APP_STATE.schoolName &&
    AppState.gradeInfo === DEFAULT_APP_STATE.gradeInfo &&
    AppState.studentName === DEFAULT_APP_STATE.studentName &&
    AppState.excludeFirstPage === DEFAULT_APP_STATE.excludeFirstPage &&
    AppState.hideManuscriptHeader === DEFAULT_APP_STATE.hideManuscriptHeader &&
    AppState.hideCharCount === DEFAULT_APP_STATE.hideCharCount &&
    AppState.hidePageNumbers === DEFAULT_APP_STATE.hidePageNumbers &&
    AppState.traditionalGrid === DEFAULT_APP_STATE.traditionalGrid &&
    AppState.orientation === DEFAULT_APP_STATE.orientation &&
    AppState.headerLeftText === DEFAULT_APP_STATE.headerLeftText &&
    AppState.customFooterSourceText ===
      DEFAULT_APP_STATE.customFooterSourceText &&
    AppState.customFooterGuideText ===
      DEFAULT_APP_STATE.customFooterGuideText &&
    AppState.customFooterEmptyText ===
      DEFAULT_APP_STATE.customFooterEmptyText &&
    AppState.currentGridColor === DEFAULT_APP_STATE.currentGridColor &&
    isSameNumber(AppState.gridOpacity, DEFAULT_APP_STATE.gridOpacity) &&
    AppState.crossGuideColor === DEFAULT_APP_STATE.crossGuideColor &&
    isSameNumber(
      AppState.crossGuideOpacity,
      DEFAULT_APP_STATE.crossGuideOpacity,
    ) &&
    AppState.leftTriangleGuide === DEFAULT_APP_STATE.leftTriangleGuide &&
    AppState.leftTriangleGuideColor ===
      DEFAULT_APP_STATE.leftTriangleGuideColor &&
    isSameNumber(
      AppState.leftTriangleGuideOpacity,
      DEFAULT_APP_STATE.leftTriangleGuideOpacity,
    ) &&
    AppState.topTriangleGuide === DEFAULT_APP_STATE.topTriangleGuide &&
    AppState.topTriangleGuideColor ===
      DEFAULT_APP_STATE.topTriangleGuideColor &&
    isSameNumber(
      AppState.topTriangleGuideOpacity,
      DEFAULT_APP_STATE.topTriangleGuideOpacity,
    ) &&
    AppState.diamondGuide === DEFAULT_APP_STATE.diamondGuide &&
    AppState.diamondGuideColor === DEFAULT_APP_STATE.diamondGuideColor &&
    isSameNumber(
      AppState.diamondGuideOpacity,
      DEFAULT_APP_STATE.diamondGuideOpacity,
    ) &&
    AppState.squareGuide === DEFAULT_APP_STATE.squareGuide &&
    AppState.squareGuideColor === DEFAULT_APP_STATE.squareGuideColor &&
    isSameNumber(
      AppState.squareGuideOpacity,
      DEFAULT_APP_STATE.squareGuideOpacity,
    ) &&
    isSameNumber(
      AppState.squareGuideInset,
      DEFAULT_APP_STATE.squareGuideInset,
    ) &&
    isSameNumber(AppState.charScale, DEFAULT_APP_STATE.charScale) &&
    isSameNumber(AppState.charYOffset, DEFAULT_APP_STATE.charYOffset) &&
    AppState.patternGuide === DEFAULT_APP_STATE.patternGuide &&
    AppState.patternEmpty === DEFAULT_APP_STATE.patternEmpty
  );
}

// 로컬 스토리지 상태 보존
function saveToLocalStorage() {
  if (isDefaultState()) {
    localStorage.removeItem("manuscriptPaperData");
    return;
  }

  AppState.lastSavedTime = new Date().toISOString();

  localStorage.setItem("manuscriptPaperData", JSON.stringify(AppState));

  updateAutoSaveStatus();
}

// 로컬 스토리지 안전 수신 및 수화(Hydration)
function loadFromLocalStorage() {
  const saved = localStorage.getItem("manuscriptPaperData");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    Object.keys(data).forEach((key) => {
      if (key in AppState) {
        AppState[key] = data[key];
      }
    });
  } catch (err) {
    console.error("로컬 스토리지 파싱 에러:", err);
  }
}

// 설정 JSON 파일 추출
async function exportSettings() {
  const json = JSON.stringify(AppState, null, 2);

  if (window.showSaveFilePicker) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: "필사용지설정.json",
        types: [
          {
            description: "JSON 파일",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
    } catch (err) {
      console.log("저장 취소");
    }
    return;
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "필사용지설정.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 설정 데이터 병합 수화
function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch (error) {
      showCustomAlert("가져오기 실패", "올바른 설정 파일(JSON)이 아닙니다.");
      return;
    }

    if (typeof data !== "object" || data === null || !("sourceText" in data)) {
      showCustomAlert(
        "가져오기 실패",
        "필사용지 설정 파일 규격에 일치하지 않습니다.",
      );
      return;
    }

    Object.keys(data).forEach((key) => {
      if (key in AppState) {
        AppState[key] = data[key];
      }
    });

    applyLoadedDataToUI();

    updatePageStyleSheet();
    setOrientation(AppState.orientation);

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

    updateGridOpacity(AppState.gridOpacity * 100);
    updateGuideOpacity(AppState.crossGuideOpacity * 100);
    updateCharYOffset(AppState.charYOffset);

    saveToLocalStorage();
    renderPages();
  };
  reader.readAsText(file);
}
