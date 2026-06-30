import { state } from './state.js';

export const translations = {
  ja: {
    title: 'クロッキー練習ツール',
    appTitle: 'クロッキー練習ツール',
    practiceMode: '練習モード',
    imageMode: 'イメージモード',
    freeMode: 'フリーモード',
    folderSelection: 'フォルダ選択',
    loadingFolders: 'フォルダを読み込み中...',
    loadImages: '画像を読み込む',
    timerSettings: 'タイマー設定',
    switchInterval: '切替間隔（秒）:',
    maxSwitches: '最大切替回数（フリーモード）:',
    startAutoSwitch: '自動切替を開始',
    stop: '停止',
    nextImage: '次の画像',
    nextCanvas: '次のキャンバス',
    drawingTools: '描画ツール',
    penPresets: 'ペンプリセット (1, 2, 3):',
    preset1: 'プリセット1',
    preset2: 'プリセット2',
    preset3: 'プリセット3',
    penColor: 'ペンの色:',
    penSize: 'ペンのサイズ:',
    gridDivisions: 'グリッド分割数（0=非表示）',
    showGrid: 'グリッド表示',
    eraser: '消しゴム',
    pen: 'ペン',
    clearCanvas: 'キャンバスをクリア',
    selectFoldersPrompt: 'フォルダを選択して画像を読み込んでください',
    dropZoneTitle: '参照画像',
    dropZonePrompt: 'ここに画像をドロップ、またはクリックして選択',
    privacyNote: '入力した画像はブラウザ内で処理が完結するため、サーバーに送信されず流出する心配はありません。',
    dropImagePrompt: '画像をドロップして練習を開始',
    exportSavedDrawings: '保存された模写をエクスポート',
    savedDrawings: '保存された模写:',
    reference: 'リファレンス',
    noImageLoaded: '画像が読み込まれていません',
    yourDrawing: 'あなたの描画',
    shortcuts: 'ショートカットキー',
    langToggleToEn: 'English',
    langToggleToJa: '日本語',
    freeModeLabel: 'フリーモード: 外部ウィンドウを模写',
    loadedImages: '{n}枚の画像を読み込みました',
    maxSwitchesReached: '最大切り替え数（{n}）に到達しました',
    allImagesShown: '全ての画像を表示しました',
    confirmClear: 'キャンバスをクリアしますか？',
    loading: '読み込み中...',
    shortcutRotate: 'R + ドラッグ: リファレンス回転',
    shortcutScale: 'S + ドラッグ: 拡大縮小',
    shortcutCrop: 'C + ドラッグ: クロップ',
    shortcutMove: 'Space + ドラッグ: 移動',
    shortcutPreset: '1 / 2 / 3: ペンプリセット切替',
    shortcutUndo: 'Ctrl/Cmd+Z: 元に戻す',
    shortcutRedo: 'Ctrl/Cmd+Y / Ctrl/Cmd+Shift+Z: やり直し',
    shortcutNote: '※入力欄フォーカス中は変形ショートカット無効',
    noFoldersFound: '画像フォルダが見つかりません。アプリケーションディレクトリに画像入りフォルダを作成してください',
    errorLoadingFolders: 'フォルダの読み込みに失敗しました',
    selectAtLeastOneFolder: '少なくとも1つのフォルダを選択してください',
    noImagesFoundSelected: '選択したフォルダに画像が見つかりません',
    noImagesFound: '画像が見つかりません',
    errorLoadingImages: '画像の読み込みに失敗しました',
    invalidInterval: '有効な切替間隔を入力してください（最小1秒）',
    loadImagesFirst: '先に画像を読み込んでください',
    invalidMaxSwitches: '有効な最大切替回数を入力してください（最小1）',
    autoClearActive: '自動クリア実行中',
    autoSwitchActive: '自動切替実行中',
    autoSwitchStopped: '自動切替を停止しました',
    noSavedDrawings: '保存された模写がありません',
    exportComplete: '画像をエクスポートしました'
  },
  en: {
    title: 'Sketch Practice Tool',
    appTitle: 'Sketch Practice Tool',
    practiceMode: 'Practice Mode',
    imageMode: 'Image Mode',
    freeMode: 'Free Mode',
    folderSelection: 'Folder Selection',
    loadingFolders: 'Loading folders...',
    loadImages: 'Load Images',
    timerSettings: 'Timer Settings',
    switchInterval: 'Switch Interval (seconds):',
    maxSwitches: 'Max Switches (Free Mode):',
    startAutoSwitch: 'Start Auto-Switch',
    stop: 'Stop',
    nextImage: 'Next Image',
    nextCanvas: 'Next Canvas',
    drawingTools: 'Drawing Tools',
    penPresets: 'Pen Presets (1, 2, 3):',
    preset1: 'Preset 1',
    preset2: 'Preset 2',
    preset3: 'Preset 3',
    penColor: 'Pen Color:',
    penSize: 'Pen Size:',
    gridDivisions: 'Grid Divisions (0=hidden)',
    showGrid: 'Show Grid',
    eraser: 'Eraser',
    pen: 'Pen',
    clearCanvas: 'Clear Canvas',
    selectFoldersPrompt: 'Select folders and load images to start',
    dropZoneTitle: 'Reference Image',
    dropZonePrompt: 'Drop an image here, or click to select',
    privacyNote: 'Images are processed entirely in your browser and are never sent to any server.',
    dropImagePrompt: 'Drop an image to start practicing',
    exportSavedDrawings: 'Export Saved Drawings',
    savedDrawings: 'Saved drawings:',
    reference: 'Reference',
    noImageLoaded: 'No image loaded',
    yourDrawing: 'Your Drawing',
    shortcuts: 'Shortcuts',
    langToggleToEn: 'English',
    langToggleToJa: '日本語',
    freeModeLabel: 'Free Mode: Draw from external reference',
    loadedImages: 'Loaded {n} images',
    maxSwitchesReached: 'Reached max switches ({n})',
    allImagesShown: 'All images have been shown',
    confirmClear: 'Are you sure you want to clear the canvas?',
    loading: 'Loading...',
    shortcutRotate: 'R + Drag: Rotate reference',
    shortcutScale: 'S + Drag: Scale reference',
    shortcutCrop: 'C + Drag: Crop reference',
    shortcutMove: 'Space + Drag: Move reference',
    shortcutPreset: '1 / 2 / 3: Switch pen preset',
    shortcutUndo: 'Ctrl/Cmd+Z: Undo',
    shortcutRedo: 'Ctrl/Cmd+Y / Ctrl/Cmd+Shift+Z: Redo',
    shortcutNote: '* Transform shortcuts disabled while input is focused',
    noFoldersFound: 'No folders found. Create folders with images in the application directory.',
    errorLoadingFolders: 'Error loading folders',
    selectAtLeastOneFolder: 'Please select at least one folder',
    noImagesFoundSelected: 'No images found in selected folders',
    noImagesFound: 'No images found',
    errorLoadingImages: 'Error loading images',
    invalidInterval: 'Please enter a valid interval (minimum 1 second)',
    loadImagesFirst: 'Please load images first',
    invalidMaxSwitches: 'Please enter a valid max switches value (minimum 1)',
    autoClearActive: 'Auto-clear active',
    autoSwitchActive: 'Auto-switch active',
    autoSwitchStopped: 'Auto-switch stopped',
    noSavedDrawings: 'No saved drawings',
    exportComplete: 'Image exported'
  }
};

const STORAGE_KEY = 'quickreproprac.language';
const SUPPORTED_LANGS = new Set(Object.keys(translations));

export function getCurrentLang() {
  try {
    const savedLang = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGS.has(savedLang)) return savedLang;
  } catch (error) {
    // localStorage can be unavailable in restricted browser contexts.
  }

  return navigator.language && navigator.language.startsWith('ja') ? 'ja' : 'en';
}

export function t(key, params = {}) {
  const lang = SUPPORTED_LANGS.has(state.language) ? state.language : getCurrentLang();
  const template = translations[lang][key] || translations.en[key] || key;

  return template.replace(/\{(\w+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? params[name] : match
  ));
}

export function applyTranslations() {
  const lang = SUPPORTED_LANGS.has(state.language) ? state.language : getCurrentLang();

  document.documentElement.lang = lang;
  document.title = translations[lang].title;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.id === 'langToggleBtn'
      ? (lang === 'ja' ? 'langToggleToEn' : 'langToggleToJa')
      : element.dataset.i18n;
    element.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
}

export function setLanguage(lang) {
  state.language = SUPPORTED_LANGS.has(lang) ? lang : getCurrentLang();

  try {
    localStorage.setItem(STORAGE_KEY, state.language);
  } catch (error) {
    // Ignore storage failures and keep the in-memory language.
  }

  applyTranslations();

  import('./images.js').then(({ updateDynamicTexts }) => {
    updateDynamicTexts();
  });
}
