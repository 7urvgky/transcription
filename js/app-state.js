const DEFAULT_APP_STATE = {
  sourceText: `계절이 지나가는 하늘에는
가을로 가득 차 있습니다.

나는 아무 걱정도 없이
가을 속의 별들을 다 헤일 듯합니다.

가슴 속에 하나 둘 새겨지는 별을
이제 다 못 헤는 것은
쉬이 아침이 오는 까닭이요,
내일 밤이 남은 까닭이요,
아직 나의 청춘이 다하지 않은 까닭입니다.

별 하나에 추억과
별 하나에 사랑과
별 하나에 쓸쓸함과
별 하나에 동경과
별 하나에 시와
별 하나에 어머니, 어머니`,
  hideInputTitle: false,
  articleTitle: "별 헤는 밤",

  gridCols: "20",

  hideStudentInfo: false,
  schoolName: "건국초등학교",
  gradeInfo: "",
  studentName: "",

  excludeFirstPage: false,
  hideManuscriptHeader: false,
  hideCharCount: false,
  hidePageNumbers: false,
  orientation: "portrait",

  headerLeftText: "",

  customFooterSourceText: null,
  customFooterGuideText: null,
  customFooterEmptyText: null,

  currentGridColor: "#69afa0",
  currentGuideColor: "#ff8c8c",
  gridOpacity: 1.0,
  guideOpacity: 0.35,

  hideGridGuides: false,
  patternGuide: true,
  patternEmpty: true,

  charYOffset: 0,

  previewZoomMode: "width",
  previewZoomValue: 100,
};

// 단일화된 전역 애플리케이션 상태 (AppState 아키텍처)
const AppState = {
  sourceText: DEFAULT_APP_STATE.sourceText,
  hideInputTitle: DEFAULT_APP_STATE.hideInputTitle,
  articleTitle: DEFAULT_APP_STATE.articleTitle,

  gridCols: DEFAULT_APP_STATE.gridCols,

  hideStudentInfo: DEFAULT_APP_STATE.hideStudentInfo,
  schoolName: DEFAULT_APP_STATE.schoolName,
  gradeInfo: DEFAULT_APP_STATE.gradeInfo,
  studentName: DEFAULT_APP_STATE.studentName,

  excludeFirstPage: DEFAULT_APP_STATE.excludeFirstPage,
  hideManuscriptHeader: DEFAULT_APP_STATE.hideManuscriptHeader,
  hideCharCount: DEFAULT_APP_STATE.hideCharCount,
  hidePageNumbers: DEFAULT_APP_STATE.hidePageNumbers,
  orientation: DEFAULT_APP_STATE.orientation,

  headerLeftText: DEFAULT_APP_STATE.headerLeftText,

  customFooterSourceText: DEFAULT_APP_STATE.customFooterSourceText,
  customFooterGuideText: DEFAULT_APP_STATE.customFooterGuideText,
  customFooterEmptyText: DEFAULT_APP_STATE.customFooterEmptyText,

  currentGridColor: DEFAULT_APP_STATE.currentGridColor,
  currentGuideColor: DEFAULT_APP_STATE.currentGuideColor,
  gridOpacity: DEFAULT_APP_STATE.gridOpacity,
  guideOpacity: DEFAULT_APP_STATE.guideOpacity,

  hideGridGuides: DEFAULT_APP_STATE.hideGridGuides,
  patternGuide: DEFAULT_APP_STATE.patternGuide,
  patternEmpty: DEFAULT_APP_STATE.patternEmpty,

  charYOffset: DEFAULT_APP_STATE.charYOffset,

  previewZoomMode: DEFAULT_APP_STATE.previewZoomMode,
  previewZoomValue: DEFAULT_APP_STATE.previewZoomValue,

  lastComputedScale: 1.0,
  lastSavedTime: null,
};
