import { loadFolders } from './folders.js';
import { setupCanvas } from './drawing.js';
import { setupEventListeners } from './ui.js';
import { updateNextImageButtonState } from './images.js';
import { getCurrentLang, setLanguage } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(getCurrentLang());
  loadFolders();
  setupCanvas();
  setupEventListeners();
  // Initialize Next Image button state
  updateNextImageButtonState();
});
