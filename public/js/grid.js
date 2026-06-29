import { canvas, referenceImage, referenceGridCanvas, drawingGridCanvas, gridDivisionsInput, gridToggle } from './dom.js';
import { clamp } from './utils.js';
import { applyViewTransformToElement } from './transform.js';

export function getGridDivisions() {
  if (!gridDivisionsInput) return 0;
  const divisions = parseInt(gridDivisionsInput.value, 10);
  if (Number.isNaN(divisions)) return 0;
  return clamp(divisions, 0, 50);
}

export function isGridVisible() {
  return Boolean(gridToggle && gridToggle.checked && getGridDivisions() >= 1);
}

export function syncOverlayToTarget(overlay, target) {
  if (!overlay || !target || !target.parentElement) return;

  const previousTransform = target.style.transform;
  target.style.transform = 'none';
  const containerRect = target.parentElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  target.style.transform = previousTransform;

  overlay.style.left = `${targetRect.left - containerRect.left}px`;
  overlay.style.top = `${targetRect.top - containerRect.top}px`;
  overlay.style.width = `${targetRect.width}px`;
  overlay.style.height = `${targetRect.height}px`;
  overlay.width = canvas.width;
  overlay.height = canvas.height;
}

export function positionGridOverlays() {
  syncOverlayToTarget(referenceGridCanvas, referenceImage);
  syncOverlayToTarget(drawingGridCanvas, canvas);
}

export function drawGridOnCanvas(gridCanvas, divisions) {
  if (!gridCanvas) return;

  const gridCtx = gridCanvas.getContext('2d');
  const w = gridCanvas.width;
  const h = gridCanvas.height;
  gridCtx.setTransform(1, 0, 0, 1, 0, 0);
  gridCtx.clearRect(0, 0, w, h);

  if (divisions < 1 || w === 0 || h === 0) return;

  const cellSize = w / divisions;
  gridCtx.save();
  gridCtx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  gridCtx.lineWidth = 1;
  gridCtx.beginPath();

  for (let i = 0; i <= divisions; i++) {
    const x = i === divisions ? w : i * cellSize;
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, h);
  }

  for (let y = 0; y < h; y += cellSize) {
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(w, y);
  }
  gridCtx.moveTo(0, h);
  gridCtx.lineTo(w, h);

  gridCtx.stroke();
  gridCtx.restore();
}

export function drawGrid() {
  const divisions = isGridVisible() ? getGridDivisions() : 0;
  drawGridOnCanvas(referenceGridCanvas, divisions);
  drawGridOnCanvas(drawingGridCanvas, divisions);
}

export function updateGridOverlays() {
  positionGridOverlays();
  drawGrid();
  applyViewTransformToElement(referenceGridCanvas);
  applyViewTransformToElement(drawingGridCanvas);
}
