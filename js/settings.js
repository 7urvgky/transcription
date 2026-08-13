"use strict";

/**
 * 필사 용지 만들기 기본 설정
 *
 * 변경 시 앱 전체에 적용
 */

const SETTINGS = {
  // =====================================================
  // 페이지 레이아웃(mm)
  // =====================================================
  layout: {
    // 페이지 기본 여백
    pageTopPadding: 18,
    pageSidePadding: 20,
    pageBottomPadding: 15,
  },

  // =====================================================
  // 하단 라벨
  // =====================================================
  footer: {
    source: "원문 읽기",
    guide: "따라 쓰기",
    empty: "원고지",
  },

  // =====================================================
  // 원문 보기 페이지 설정
  // =====================================================
  sourcePage: {
    portraitFirstPageHeight: 175,
    portraitOtherPageHeight: 195,

    landscapeFirstPageHeight: 108,
    landscapeOtherPageHeight: 132,

    landscapeColumnGap: 15, // 가로 모드 열 간격 mm
    showLandscapeColumnDivider: false, // 가로 원문 두 단 사이 점선 표시
    landscapeColumnDividerWidthMm: 0.25, // 중앙 점선 두께
    landscapeColumnDividerDashMm: 1, // 중앙 점선의 선 길이
    landscapeColumnDividerGapMm: 1, // 중앙 점선의 선 간격

    // 여백
    sourceHeaderBottom: 5, // 원문 보기 헤더 아래 여백 mm
    sourceTitleTop: 0, // 원문 보기 헤더와 제목 사이 여백 mm
    sourceTitleBottom: 2, // 원문 보기 제목과 본문 사이 여백 mm
    sourceBodyBottom: 15, // 원문 보기 본문 아래 여백 mm
    headerLeftText: "", // 원문 보기 2페이지 이후 왼쪽 상단 머리말

    sourceFooterBottom: 0, // 원문 보기 꼬리말의 페이지 하단 여백 mm
  },

  // =====================================================
  // 원고지 설정
  // =====================================================
  manuscript: {
    // 글자
    charScale: 0.8, // 원고지 칸 대비 글자 크기
    traceOpacity: 0.2, // 따라쓰기 글자 투명도

    // 여백
    gridHeaderBottom: 0, // 원고지 헤더와 원고지 제목 간격 mm

    titleTopGap: 5, // 원고지 제목 위 간격 mm

    gridLineGap: 2.5, // 원고지와 위 아래 실선 간격 mm
    showHorizontalLines: true, // 원고지 위·아래 실선 표시
    titleLineGap: 2, // 원고지 제목과 위 실선 간격 mm
    horizontalLineExtraWidth: 1, // 원고지 위 아래 실선 추가 길이 조절

    // 꼬리말
    // 페이지 안쪽 바닥에서 footer까지의 거리(mm)
    footerBottom: 13,

    // 전통 원고지
    traditionalRowGap: 2.5, // 한 행의 원고지와 다음 행의 원고지 사이의 실제 여백
  },

  linenote: {
    notetitletopmargin: 10, // 줄 노트 글 제목 위 여백
    notetopmargin: 5, // 줄 노트 원고지 위 여백

    notetopmargin_notitle: 15, // 줄 토느 글 제목 표시 안 할 때 원고지 위 여백
  },

  // 프리셋 원고지 전용 표식·학생 정보 위치 설정
  manuscriptPreset: {
    numberFontSizePx: 14, // No. 글자 크기 (기존 12px의 약 1.3배)
    footerFontSizePx: 14, // 줄 수 × 칸 수 글자 크기
    numberUnderlineWidthMm: 20, // No. 옆 밑줄 길이 (1.5cm)
    studentInfoTopMm: 8, // 학생 정보의 페이지 위쪽 위치
    studentInfoFontSizePx: 14, // 학생 정보 글자 크기
    studentInfoGapMm: 8, // 학생 정보 항목 사이 간격
    studentInfoWidthMm: 125, // 페이지 왼쪽에 모아 둘 학생 정보의 최대 폭
    numberInsetFromRightMm: 1.5, // No.를 원고지 오른쪽 선에서 왼쪽으로 들이는 정도
    footerInsetFromLeftMm: 1.5, // 푸터를 원고지 왼쪽 선에서 오른쪽으로 들이는 정도
    horizontalLineExtraWidthMm: 1, // 원고지 폭 대비 위·아래 실선의 추가 길이
  },

  // 원고지 선 설정
  stroke: {
    // 선 두께
    borderMm: 0.5, // 원고지 외곽선
    gridLineMm: 0.25, // 원고지 격자
    gridColor: "#69afa0", // 원고지 색
    gridOpacity: 1.0, // 원고지 선 투명도
  },

  // =====================================================
  // 가이드 설정
  // =====================================================
  guide: {
    // 점선
    dashMm: 0.6, // 길이
    gapMm: 0.3926, // 간격
    guideLineMm: 0.25, // 두께

    // 십자
    crossGuide: true,
    crossGuideColor: "#ff0000",
    crossGuideOpacity: 0.35,

    // 왼쪽 삼각형
    leftTriangleGuide: false,
    leftTriangleGuideColor: "#ff0000",
    leftTriangleGuideOpacity: 0.35,

    // 위쪽 삼각형
    topTriangleGuide: false,
    topTriangleGuideColor: "#ff0000",
    topTriangleGuideOpacity: 0.35,

    // 마름모
    diamondGuide: false,
    diamondGuideColor: "#ff0000",
    diamondGuideOpacity: 0.35,

    // 네모
    squareGuide: false,
    squareGuideColor: "#ff0000",
    squareGuideOpacity: 0.35,

    // 네모 크기
    // 0.1 = 상하좌우 각 10% 안쪽
    // 실제 네모 크기 = 80%
    squareGuideInset: 0.1,
  },

  // =====================================================
  // 초기 문서 상태
  // =====================================================
  defaults: {
    // 원고지
    gridCols: "20", // 원고지 기본 칸 수 10칸, 12칸, 14칸, 16칸, 18칸, 20칸, 22칸, 24칸
    orientation: "portrait",

    // 학생 정보
    schoolName: "건국초등학교",
    gradeInfo: "",
    studentName: "",

    // 학생 정보 비어 있을 때
    emptySchoolPlaceholder: "",
    emptyGradePlaceholder: "__________학년 __________반",
    emptyNamePlaceholder: "",

    // 기본 제목
    articleTitle: "별 헤는 밤",

    // 기본 원문
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
  },
};
