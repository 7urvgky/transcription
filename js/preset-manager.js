"use strict";

// 원고지 프리셋 적용 관리
// 기존 기능은 건드리지 않고 프리셋 선택 시 필요한 상태만 변경한다.

function applyManuscriptPreset(presetKey) {
  const preset = MANUSCRIPT_PRESETS[presetKey];
  if (!preset) return;

  // 기존 상태 저장 (프리셋 해제 시 복원용)
  if (!AppState.previousPresetState) {
    AppState.previousPresetState = {
      orientation: AppState.orientation,
      gridCols: AppState.gridCols,
      traditionalGrid: AppState.traditionalGrid,
    };
  }

  AppState.activePreset = presetKey;

  if (presetKey === "none") {
    const prev = AppState.previousPresetState;

    if (prev) {
      AppState.orientation = prev.orientation;
      AppState.gridCols = prev.gridCols;
      AppState.traditionalGrid = prev.traditionalGrid;
    }

    AppState.previousPresetState = null;
    return;
  }

  AppState.orientation = preset.direction;
  AppState.gridCols = String(preset.cols);

  // 프리셋은 전통 원고지 형태를 기본 사용
  AppState.traditionalGrid = true;

  // 프리셋은 줄 사이 간격을 기본 적용
  AppState.traditionalRowGap = true;
}

function isPresetMode() {
  return AppState.activePreset && AppState.activePreset !== "none";
}

function getActivePreset() {
  return MANUSCRIPT_PRESETS[AppState.activePreset] || MANUSCRIPT_PRESETS.none;
}
