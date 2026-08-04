const DEFAULT_APP_STATE = {
  sourceText: SETTINGS.defaults.sourceText,
  hideInputTitle: false,
  articleTitle: SETTINGS.defaults.articleTitle,

  gridCols: SETTINGS.defaults.gridCols,

  hideStudentInfo: false,
  schoolName: SETTINGS.defaults.schoolName,
  gradeInfo: SETTINGS.defaults.gradeInfo,
  studentName: SETTINGS.defaults.studentName,

  excludeFirstPage: false,
  hideManuscriptHeader: false,
  hideCharCount: false,
  hidePageNumbers: false,
  orientation: SETTINGS.defaults.orientation,

  headerLeftText: SETTINGS.defaults.headerLeftText,

  customFooterSourceText: null,
  customFooterGuideText: null,
  customFooterEmptyText: null,

  currentGridColor: SETTINGS.defaultColors.grid,
  currentGuideColor: SETTINGS.defaultColors.guide,

  lefttriangleGuide: SETTINGS.guide.lefttriangleGuide,
  lefttriangleGuideColor: SETTINGS.guide.lefttriangleGuideColor,
  lefttriangleGuideOpacity: SETTINGS.guide.lefttriangleGuideOpacity,

  topTriangleGuide: SETTINGS.guide.topTriangleGuide,
  topTriangleGuideColor: SETTINGS.guide.topTriangleGuideColor,
  topTriangleGuideOpacity: SETTINGS.guide.topTriangleGuideOpacity,

  gridOpacity: SETTINGS.defaultOpacity.grid,
  guideOpacity: SETTINGS.defaultOpacity.guide,

  showGridGuides: true,
  lefttriangleGuide: false,
  topTriangleGuide: false,

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

  lefttriangleGuide: DEFAULT_APP_STATE.lefttriangleGuide,
  lefttriangleGuideColor: DEFAULT_APP_STATE.lefttriangleGuideColor,
  lefttriangleGuideOpacity: DEFAULT_APP_STATE.lefttriangleGuideOpacity,

  topTriangleGuide: DEFAULT_APP_STATE.topTriangleGuide,
  topTriangleGuideColor: DEFAULT_APP_STATE.topTriangleGuideColor,
  topTriangleGuideOpacity: DEFAULT_APP_STATE.topTriangleGuideOpacity,

  gridOpacity: DEFAULT_APP_STATE.gridOpacity,
  guideOpacity: DEFAULT_APP_STATE.guideOpacity,

  showGridGuides: DEFAULT_APP_STATE.showGridGuides,
  patternGuide: DEFAULT_APP_STATE.patternGuide,
  patternEmpty: DEFAULT_APP_STATE.patternEmpty,

  charYOffset: DEFAULT_APP_STATE.charYOffset,

  previewZoomMode: DEFAULT_APP_STATE.previewZoomMode,
  previewZoomValue: DEFAULT_APP_STATE.previewZoomValue,

  lastComputedScale: 1.0,
  lastSavedTime: null,
};
