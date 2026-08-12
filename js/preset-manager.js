"use strict";

// 원고지 프리셋 적용 관리
// 기존 기능은 건드리지 않고 프리셋 선택 시 필요한 상태만 변경한다.

function applyManuscriptPreset(presetKey) {
  const preset = MANUSCRIPT_PRESETS[presetKey];
  if (!preset) return;

  // 프리셋 적용 전 현재 설정 저장
  if (!AppState.previousPresetState) {
    AppState.previousPresetState = {
      orientation: AppState.orientation,
      gridCols: AppState.gridCols,
      traditionalGrid: AppState.traditionalGrid,
      traditionalRowGap: AppState.traditionalRowGap,
      presetRows: AppState.presetRows,
    };
  }

  AppState.activePreset = presetKey;

  // 프리셋 해제
  if (presetKey === "none") {
    const prev = AppState.previousPresetState;

    if (prev) {
      AppState.orientation = prev.orientation;
      AppState.gridCols = prev.gridCols;
      AppState.traditionalGrid = prev.traditionalGrid;
      AppState.traditionalRowGap = prev.traditionalRowGap;
      AppState.presetRows = prev.presetRows;
    }

    AppState.previousPresetState = null;
    return;
  }

  // 프리셋 적용
  AppState.orientation = preset.direction || preset.orientation;
  AppState.gridCols = String(preset.cols);
  AppState.presetRows = preset.rows;

  // 전통 원고지 + 줄 사이 간격 자동 적용
  AppState.traditionalGrid = true;
}

function isPresetMode() {
  return AppState.activePreset && AppState.activePreset !== "none";
}

function getActivePreset() {
  return MANUSCRIPT_PRESETS[AppState.activePreset] || MANUSCRIPT_PRESETS.none;
}
