import { initDropZone } from './dropzone.js';
import { setupCanvas } from './drawing.js';
import { handlePenColorChange, setupEventListeners } from './ui.js';
import { switchMode, updateNextImageButtonState } from './images.js';
import { getCurrentLang, setLanguage } from './i18n.js';
import { colorPickerSwatch } from './dom.js';
import { initColorPicker } from './colorpicker.js';

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(getCurrentLang());
  initDropZone();
  setupCanvas();
  initColorPicker(colorPickerSwatch, handlePenColorChange);
  setupEventListeners();
  // 初期モードをイメージモードとして適用（timerSection/exportSectionを非表示にする）
  switchMode('image');
  updateNextImageButtonState();
});
