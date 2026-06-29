import { state } from './state.js';
import { canvas, savedCount, exportBtn, statusText } from './dom.js';
import { t } from './i18n.js';

export function saveCurrentCanvas() {
  // Only save if auto-switch is active (timer is running)
  if (!state.timerInterval) return;

  // Check if canvas has any content (state.strokes)
  if (state.strokes.length === 0) return;

  // Save canvas as data URL
  const dataURL = canvas.toDataURL('image/png');
  state.savedCanvases.push(dataURL);
  updateSavedCount();
}

export function updateSavedCount() {
  savedCount.textContent = state.savedCanvases.length;
  exportBtn.disabled = state.savedCanvases.length === 0;
}

export function convertToSquare(dataURL) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Determine the size of the square (use the larger dimension)
      const size = Math.max(img.width, img.height);

      // Create a temporary canvas for the square image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = size;
      tempCanvas.height = size;
      const tempCtx = tempCanvas.getContext('2d');

      // Fill with white background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, size, size);

      // Calculate centering offsets
      const offsetX = (size - img.width) / 2;
      const offsetY = (size - img.height) / 2;

      // Draw the image centered on the canvas
      tempCtx.drawImage(img, offsetX, offsetY);

      // Convert to data URL
      resolve(tempCanvas.toDataURL('image/png'));
    };
    img.src = dataURL;
  });
}

export async function createTiledImage() {
  if (state.savedCanvases.length === 0) {
    alert(t('noSavedDrawings'));
    return;
  }

  // Convert all canvases to square format
  const squareImages = await Promise.all(
    state.savedCanvases.map(dataURL => convertToSquare(dataURL))
  );

  // Calculate grid dimensions (as square as possible)
  const totalImages = squareImages.length;
  const gridCols = Math.ceil(Math.sqrt(totalImages));
  const gridRows = Math.ceil(totalImages / gridCols);

  // Determine tile size (compress to reasonable size)
  const tileSize = 400; // Each tile will be 400x400px

  // Create final canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = gridCols * tileSize;
  finalCanvas.height = gridRows * tileSize;
  const finalCtx = finalCanvas.getContext('2d');

  // Fill background with white
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  // Load and draw each image
  const imagePromises = squareImages.map((dataURL, index) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        const x = col * tileSize;
        const y = row * tileSize;

        // Draw the image scaled to tile size
        finalCtx.drawImage(img, x, y, tileSize, tileSize);
        resolve();
      };
      img.src = dataURL;
    });
  });

  await Promise.all(imagePromises);

  // Convert to blob and download
  finalCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    link.download = `sketch-practice-${timestamp}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    statusText.textContent = t('exportComplete');
  }, 'image/png');
}

export function handleExport() {
  createTiledImage();
}
