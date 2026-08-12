"use strict";

// 원고지 프리셋 적용 관리
// 기존 기능은 건드리지 않고 프리셋 선택 시 필요한 상태만 변경한다.

function applyManuscriptPreset(presetKey) {
  const preset = MANUSCRIPT_PRESETS[presetKey];
  if (!preset) return;

  AppState.activePreset = presetKey;

  if (presetKey === "none") {
    return;
  }

  AppState.orientation = preset.direction;
  AppState.gridCols = String(preset.cols);

  // 프리셋은 전통 원고지 형태를 기본 사용
  AppState.traditionalGrid = true;
}

function isPresetMode() {
  return AppState.activePreset && AppState.activePreset !== "none";
}

function getActivePreset() {
  return MANUSCRIPT_PRESETS[AppState.activePreset] || MANUSCRIPT_PRESETS.none;
}
