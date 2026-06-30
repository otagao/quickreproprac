import { referenceImage, noImageText, dropZone, fileInput } from './dom.js';
import { resetViewState } from './transform.js';
import { resizeCanvas } from './images.js';
import { resetStopwatch, startStopwatch } from './timer.js';

let currentObjectURL = null;

export function initDropZone() {
  if (!dropZone || !fileInput) return;

  // クリックでファイル選択ダイアログを開く
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // ファイル選択ダイアログでの選択
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) loadImageFile(files[0]);
    fileInput.value = '';
  });

  // ドラッグオーバー
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    // 子要素へのleaveは無視
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });

  // ドロップ
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    // DataTransfer.items を使って type で画像を確認
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (const item of e.dataTransfer.items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          loadImageFile(item.getAsFile());
          return;
        }
      }
    }

    // フォールバック: files プロパティを使用
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) loadImageFile(files[0]);
  });
}

export function loadImageFile(file) {
  if (!file) return;

  // 前のオブジェクトURLを解放
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
  }

  currentObjectURL = URL.createObjectURL(file);
  referenceImage.src = currentObjectURL;
  referenceImage.style.display = 'block';
  noImageText.style.display = 'none';

  referenceImage.onload = () => {
    resetViewState();
    resizeCanvas();
    resetStopwatch();
    startStopwatch();
  };
}
