const DEFAULT_APP_STATE = {
  sourceText: SETTINGS.defaults.sourceText,
  hideInputTitle: false,
  articleTitle: SETTINGS.defaults.articleTitle,

  gridCols: SETTINGS.defaults.gridCols,
  charScale: SETTINGS.manuscript.charScale,

  activePreset: "none",

  hideStudentInfo: false,
  schoolName: SETTINGS.defaults.schoolName,
  gradeInfo: SETTINGS.defaults.gradeInfo,
  studentName: SETTINGS.defaults.studentName,

  excludeFirstPage: false,
  hideManuscriptHeader: false,
  hideCharCount: false,
  hidePageNumbers: false,
  traditionalGrid: false,
  orientation: SETTINGS.defaults.orientation,

  headerLeftText: SETTINGS.sourcePage.headerLeftText,

  customFooterSourceText: null,
  customFooterGuideText: null,
  customFooterEmptyText: null,

  currentGridColor: SETTINGS.stroke.gridColor,

  crossGuide: SETTINGS.guide.crossGuide,
  crossGuideColor: SETTINGS.guide.crossGuideColor,
  crossGuideOpacity: SETTINGS.guide.crossGuideOpacity,

  leftTriangleGuide: SETTINGS.guide.leftTriangleGuide,
  leftTriangleGuideColor: SETTINGS.guide.leftTriangleGuideColor,
  leftTriangleGuideOpacity: SETTINGS.guide.leftTriangleGuideOpacity,

  topTriangleGuide: SETTINGS.guide.topTriangleGuide,
  topTriangleGuideColor: SETTINGS.guide.topTriangleGuideColor,
  topTriangleGuideOpacity: SETTINGS.guide.topTriangleGuideOpacity,

  diamondGuide: SETTINGS.guide.diamondGuide,
  diamondGuideColor: SETTINGS.guide.diamondGuideColor,
  diamondGuideOpacity: SETTINGS.guide.diamondGuideOpacity,

  squareGuide: SETTINGS.guide.squareGuide,
  squareGuideColor: SETTINGS.guide.squareGuideColor,
  squareGuideOpacity: SETTINGS.guide.squareGuideOpacity,
  squareGuideInset: SETTINGS.guide.squareGuideInset,

  gridOpacity: SETTINGS.stroke.gridOpacity,

  patternGuide: true,
  patternEmpty: true,

  charYOffset: 0,

  previewZoomMode: "width",
  previewZoomValue: 100,
};

const AppState = {
  sourceText: DEFAULT_APP_STATE.sourceText,
  hideInputTitle: DEFAULT_APP_STATE.hideInputTitle,
  articleTitle: DEFAULT_APP_STATE.articleTitle,

  gridCols: DEFAULT_APP_STATE.gridCols,
  charScale: DEFAULT_APP_STATE.charScale,

  activePreset: DEFAULT_APP_STATE.activePreset,

  hideStudentInfo: DEFAULT_APP_STATE.hideStudentInfo,
  schoolName: DEFAULT_APP_STATE.schoolName,
  gradeInfo: DEFAULT_APP_STATE.gradeInfo,
  studentName: DEFAULT_APP_STATE.studentName,

  excludeFirstPage: DEFAULT_APP_STATE.excludeFirstPage,
  hideManuscriptHeader: DEFAULT_APP_STATE.hideManuscriptHeader,
  hideCharCount: DEFAULT_APP_STATE.hideCharCount,
  hidePageNumbers: DEFAULT_APP_STATE.hidePageNumbers,
  traditionalGrid: DEFAULT_APP_STATE.traditionalGrid,
  orientation: DEFAULT_APP_STATE.orientation,

  headerLeftText: DEFAULT_APP_STATE.headerLeftText,

  customFooterSourceText: DEFAULT_APP_STATE.customFooterSourceText,
  customFooterGuideText: DEFAULT_APP_STATE.customFooterGuideText,
  customFooterEmptyText: DEFAULT_APP_STATE.customFooterEmptyText,

  currentGridColor: DEFAULT_APP_STATE.currentGridColor,
  gridOpacity: DEFAULT_APP_STATE.gridOpacity,

  crossGuide: DEFAULT_APP_STATE.crossGuide,
  crossGuideColor: DEFAULT_APP_STATE.crossGuideColor,
  crossGuideOpacity: DEFAULT_APP_STATE.crossGuideOpacity,

  leftTriangleGuide: DEFAULT_APP_STATE.leftTriangleGuide,
  leftTriangleGuideColor: DEFAULT_APP_STATE.leftTriangleGuideColor,
  leftTriangleGuideOpacity: DEFAULT_APP_STATE.leftTriangleGuideOpacity,

  topTriangleGuide: DEFAULT_APP_STATE.topTriangleGuide,
  topTriangleGuideColor: DEFAULT_APP_STATE.topTriangleGuideColor,
  topTriangleGuideOpacity: DEFAULT_APP_STATE.topTriangleGuideOpacity,

  diamondGuide: DEFAULT_APP_STATE.diamondGuide,
  diamondGuideColor: DEFAULT_APP_STATE.diamondGuideColor,
  diamondGuideOpacity: DEFAULT_APP_STATE.diamondGuideOpacity,

  squareGuide: DEFAULT_APP_STATE.squareGuide,
  squareGuideColor: DEFAULT_APP_STATE.squareGuideColor,
  squareGuideOpacity: DEFAULT_APP_STATE.squareGuideOpacity,
  squareGuideInset: DEFAULT_APP_STATE.squareGuideInset,

  patternGuide: DEFAULT_APP_STATE.patternGuide,
  patternEmpty: DEFAULT_APP_STATE.patternEmpty,

  charYOffset: DEFAULT_APP_STATE.charYOffset,

  previewZoomMode: DEFAULT_APP_STATE.previewZoomMode,
  previewZoomValue: DEFAULT_APP_STATE.previewZoomValue,

  lastComputedScale: 1.0,
  lastSavedTime: null,
};
