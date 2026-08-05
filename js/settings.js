/**
 * 필사 용지 만들기 기본 설정
 *
 * 레이아웃
 * 기본 문서 템플릿
 * 원고지 설정
 * 원문 보기 설정
 * 푸터 설정
 *
 * 변경 시 앱 전체에 적용됨
 */

"use strict";

const SETTINGS = {
  manuscript: {
    charScale: 0.8, // 원고지 글씨 크기 비율
    traceOpacity: 0.2, // 원고지 글씨 투명도
  },

  // 페이지 레이아웃, 원고지, 하단 라벨, 원고지 선 두께, 간격, 색상, 투명도 등 기본 설정

  layout: {
    // 페이지 기본 여백 설정
    pageTopPadding: 18, // 페이지 위 여백 mm
    pageSidePadding: 20, // 페이지 좌우 여백 mm
    pageBottomPadding: 23.5, // 페이지 아래 여백 mm TODO: 현재 본문 높이가 고정되어 있음. 추후 하단 라벨 높이에 따라 동적 조정 필요

    // 하단 꼬리말 위치
    footerBottomMm: 18, // 하단 꼬리말 여백 mm
    footerLeftRightMm: 20, // 하단 꼬리말 좌우 여백 mm

    // 원문 보기 여백 설정
    sourceTitleTop: 4, // 원문 보기 헤더와 제목 사이 여백 mm
    sourceTitleBottom: 2, // 원문 보기 제목과 본문 사이 여백 mm
    sourceBodyBottom: 15, // 원문 보기 본문 아래 여백 mm
    headerLeftText: "", // 원문 보기 2페이지 이후 왼쪽 상단 머리말

    // 원고지 여백 설정
    gridHeaderBottom: 5, // 원고지 헤더와 원고지 제목 간격 mm

    // 원고지 실선 간격 설정
    gridLineGap: 2.5, // 원고지와 위 아래 실선 간격 mm
    titleLineGap: 1, // 원고지 제목과 위 실선 간격 mm
    horizontalLineExtraWidth: 2, // 원고지 위 아래 실선 길이 조절
  },

  // 하단 기본 라벨
  footer: {
    source: "원문 읽기", // 원문 보기 하단 라벨
    guide: "따라 쓰기", // 따라 쓰기 하단 라벨
    empty: "원고지", // 빈 원고지 하단 라벨
  },

  // 페이지 높이 설정
  sourcePage: {
    portraitFirstPageHeight: 175, // 세로 모드 첫 페이지 높이 mm
    portraitOtherPageHeight: 195, // 세로 모드 다른 페이지 높이 mm

    landscapeFirstPageHeight: 108, // 가로 모드 첫 페이지 높이 mm
    landscapeOtherPageHeight: 132, // 가로 모드 다른 페이지 높이 mm

    landscapeColumnGap: 15, // 가로 모드 열 간격 mm
  },

  // 원고지 선 두께, 간격 설정
  stroke: {
    borderMm: 0.5, // 원고지 테두리 mm
    gridLineMm: 0.25, // 원고지 격자 mm
    guideLineMm: 0.25, // 따라 쓰기 가이드 mm
  },

  guide: {
    dashMm: 0.6,
    gapMm: 0.3926,

    lefttriangleGuide: false,
    lefttriangleGuideColor: "#ff0000",
    lefttriangleGuideOpacity: 0.35,

    topTriangleGuide: false,
    topTriangleGuideColor: "#ff0000",
    topTriangleGuideOpacity: 0.35,

    diamondGuide: false,
    diamondGuideColor: "#ff0000",
    diamondGuideOpacity: 0.35,

    squareGuide: false,
    squareGuideColor: "#ff0000",
    squareGuideOpacity: 0.35,
    squareGuideInset: 0.1, // 네모 가이드 크기 조절. 0.1 = 상하좌우 10% 들어가기 = 크기는 80%
  },

  // 원고지 기본 색상 및 투명도 설정
  defaultColors: {
    grid: "#69afa0",
    guide: "#ff0000",
  },

  defaultOpacity: {
    grid: 1.0,
    guide: 0.35,
  },

  // 기본 입력 내용 설정
  defaults: {
    // 원고지 칸 수, 방향 설정
    gridCols: "20", // 원고지 기본 칸 수 10칸, 12칸, 14칸, 16칸, 18칸, 20칸, 22칸, 24칸
    orientation: "portrait", // 기본 세로 모드 portrait, 가로 모드 landscape
    // 학생 정보 설정
    schoolName: "건국초등학교",
    gradeInfo: "",
    studentName: "",
    // 학생 정보 비어 있을 때 처리 규칙
    emptySchoolPlaceholder: "", // 빈 학교 이름 자리 처리
    emptyGradePlaceholder: "__________학년 __________반", // 빈 학년/반 자리 처리
    emptyNamePlaceholder: "", // 빈 이름 자리 처리

    // 기본 원문 및 제목 설정
    articleTitle: "별 헤는 밤",
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
