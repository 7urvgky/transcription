"use strict";

// 원고지 프리셋 데이터
const MANUSCRIPT_PRESETS = {
  none: { name: "프리셋 해제" },
  horizontal60: {
    name: "가로 60자",
    direction: "landscape",
    rows: 6,
    cols: 10,
    label: "6 x 10 = 60자",
  },
  vertical130: {
    name: "세로 130자",
    direction: "portrait",
    rows: 13,
    cols: 10,
    label: "13 x 10 = 130자",
  },
  horizontal200: {
    name: "가로 200자",
    direction: "landscape",
    rows: 10,
    cols: 20,
    label: "10 x 20 = 200자",
  },
  vertical500: {
    name: "세로 500자",
    direction: "portrait",
    rows: 25,
    cols: 20,
    label: "25 x 20 = 500자",
  },
};
