"use strict";

// 원고지 프리셋 정의
// 새로운 프리셋 추가 시 이 파일만 수정
const MANUSCRIPT_PRESETS = {
  none: {
    name: "프리셋 해제",
    enabled: false,
  },

  landscape60: {
    name: "가로 60자",
    direction: "landscape",
    rows: 6,
    cols: 10,
    totalChars: 60,
  },

  portrait130: {
    name: "세로 130자",
    direction: "portrait",
    rows: 13,
    cols: 10,
    totalChars: 130,
  },

  landscape200: {
    name: "가로 200자",
    direction: "landscape",
    rows: 10,
    cols: 20,
    totalChars: 200,
  },

  portrait500: {
    name: "세로 500자",
    direction: "portrait",
    rows: 25,
    cols: 20,
    totalChars: 500,
  },
};
