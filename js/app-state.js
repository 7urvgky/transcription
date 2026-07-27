// 단일화된 전역 애플리케이션 상태 (AppState 아키텍처)
    const AppState = {
      sourceText: "계절이 지나가는 하늘에는\n가을로 가득 차 있습니다.\n\n나는 아무 걱정도 없이\n가을 속의 별들을 다 헤일 듯합니다.\n\n가슴 속에 하나 둘 새겨지는 별을\n이제 다 못 헤는 것은\n쉬이 아침이 오는 까닭이요,\n내일 밤이 남은 까닭이요,\n아직 나의 청춘이 다하지 않은 까닭입니다.\n\n별 하나에 추억과\n별 하나에 사랑과\n별 하나에 쓸쓸함과\n별 하나에 동경과\n별 하나에 시와\n별 하나에 어머니, 어머니",
      articleTitle: "별 헤는 밤",
      gridCols: "20", 
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

      // 실시간 색상 및 불투명도 상태
      currentGridColor: '#69afa0',
      currentGuideColor: '#ff8c8c',
      gridOpacity: 1.0,
      guideOpacity: 0.35,

      // 화면 프리뷰 배율 제어 상태
      previewZoomMode: 'width', 
      previewZoomValue: 100,
      lastComputedScale: 1.0,

      // 개별 위젯 제어 상태
      hideGridGuides: false,
      patternGuide: true,
      patternEmpty: true,
      charYOffset: 0,
 
      // 임시 저장 시각 타임스탬프
      lastSavedTime: null
    };