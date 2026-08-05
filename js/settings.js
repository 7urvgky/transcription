/**
 * 필사 용지 만들기 기본 설정
 *
 * 변경 시 앱 전체에 적용
 */

"use strict";

const SETTINGS = {
  // =====================================================
  // 페이지 레이아웃(mm)
  // =====================================================
  layout: {
    // 페이지 기본 여백
    pageTopPadding: 18,
    pageSidePadding: 20,
    pageBottomPadding: 23.5, // 이슈: 현재 본문 높이가 고정되어 있음. TODO: 하단 라벨 높이에 따라 동적 조정 필요

    // 하단 꼬리말 위치
    footerBottomMm: 18, // 하단 꼬리말 여백 mm
    footerLeftRightMm: 20, // 하단 꼬리말 좌우 여백 mm
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

    // 여백
    sourceTitleTop: 4, // 원문 보기 헤더와 제목 사이 여백 mm
    sourceTitleBottom: 2, // 원문 보기 제목과 본문 사이 여백 mm
    sourceBodyBottom: 15, // 원문 보기 본문 아래 여백 mm
    headerLeftText: "", // 원문 보기 2페이지 이후 왼쪽 상단 머리말
  },

  // =====================================================
  // 원고지 설정
  // =====================================================
  manuscript: {
    // 글자
    charScale: 0.8, // 원고지 칸 대비 글자 크기
    traceOpacity: 0.2, // 따라쓰기 글자 투명도

    // 여백
    gridHeaderBottom: 5, // 원고지 헤더와 원고지 제목 간격 mm

    gridLineGap: 2.5, // 원고지와 위 아래 실선 간격 mm
    titleLineGap: 2, // 원고지 제목과 위 실선 간격 mm
    horizontalLineExtraWidth: 2, // 원고지 위 아래 실선 길이 조절
  },

  stroke: {
    // 선 두께
    borderMm: 0.5, // 원고지 외곽선
    gridLineMm: 0.25, // 원고지 격자
    guideLineMm: 0.25, // 가이드선
  },

  // =====================================================
  // 가이드 설정
  // =====================================================
  guide: {
    // 점선
    dashMm: 0.6, // 길이
    gapMm: 0.3926, // 간격

    // 왼쪽 삼각형
    lefttriangleGuide: false,
    lefttriangleGuideColor: "#ff0000",
    lefttriangleGuideOpacity: 0.35,

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
    // 0.1 = 상하좌우 10% 안쪽
    // 실제 네모 크기 = 80%
    squareGuideInset: 0.1,
  },

  // =====================================================
  // 기본 색상
  // =====================================================
  defaultColors: {
    grid: "#69afa0", // 원고지 색
    guide: "#ff0000", // 십자 가이드 색
  },

  // =====================================================
  // 기본 투명도
  // =====================================================
  defaultOpacity: {
    grid: 1.0,
    guide: 0.35,
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
