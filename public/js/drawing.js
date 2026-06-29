import { state, PMIN } from './state.js';
import { canvas, ctx, imageContainer, referenceImage } from './dom.js';
import { resizeCanvasForFreeMode, resizeCanvas, updateNextImageButtonState } from './images.js';
import { applyCanvasViewTransform, applyCropClip, getBaseCoordinates, getCanvasPointFromClient, isTransformKeyActive, beginTransformGesture, updateTransformGesture, endTransformGesture, resetViewState, applyReferenceTransform, applyViewChange, isPointInActiveCrop } from './transform.js';
import { updateGridOverlays } from './grid.js';

export function setupCanvas() {
  // Initialize with free mode canvas size
  resizeCanvasForFreeMode();
  canvas.style.touchAction = 'none';
  if (imageContainer) {
    imageContainer.style.touchAction = 'none';
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    if (state.currentMode === 'free') {
      resizeCanvasForFreeMode();
    } else {
      resizeCanvas();
    }
  });

  // 描画イベント
  canvas.addEventListener('pointerdown', startDrawing);
  canvas.addEventListener('pointermove', draw);
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);

  if (imageContainer) {
    imageContainer.addEventListener('pointerdown', (e) => {
      if (isTransformKeyActive()) {
        beginTransformGesture(e, imageContainer);
      } else if (referenceImage.style.display !== 'none') {
        beginTransformGesture(e, imageContainer, 'move');
      }
    });
    imageContainer.addEventListener('pointermove', updateTransformGesture);
    imageContainer.addEventListener('pointerup', endTransformGesture);
    imageContainer.addEventListener('pointercancel', endTransformGesture);
  }
}

export function getCanvasCoordinates(e) {
  return getCanvasPointFromClient(e.clientX, e.clientY);
}

export function getPressure(e) {
  if (e.pointerType === 'mouse' || e.pressure === 0) return 1;
  return e.pressure;
}

export function getEffectiveLineWidth(size, pressure) {
  return size * (PMIN + (1 - PMIN) * pressure);
}

export function setStrokeStyle(stroke) {
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
  ctx.fillStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

export function drawStrokePoint(stroke, point) {
  const effWidth = getEffectiveLineWidth(stroke.size, point.pressure ?? 1);
  ctx.beginPath();
  ctx.arc(point.x, point.y, effWidth / 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStrokeSegment(stroke, prevPoint, currPoint) {
  const avgPressure = ((prevPoint.pressure ?? 1) + (currPoint.pressure ?? 1)) / 2;
  const effWidth = getEffectiveLineWidth(stroke.size, avgPressure);

  ctx.beginPath();
  ctx.moveTo(prevPoint.x, prevPoint.y);
  ctx.lineTo(currPoint.x, currPoint.y);
  ctx.lineWidth = effWidth;
  ctx.stroke();
}

export function drawTransformedStrokePoint(stroke, point) {
  ctx.save();
  applyCanvasViewTransform();
  applyCropClip();
  setStrokeStyle(stroke);
  drawStrokePoint(stroke, point);
  ctx.restore();
}

export function drawTransformedStrokeSegment(stroke, prevPoint, currPoint) {
  ctx.save();
  applyCanvasViewTransform();
  applyCropClip();
  setStrokeStyle(stroke);
  drawStrokeSegment(stroke, prevPoint, currPoint);
  ctx.restore();
}

export function startDrawing(e) {
  e.preventDefault();
  if (isTransformKeyActive()) {
    beginTransformGesture(e, canvas);
    return;
  }

  const {x, y} = getBaseCoordinates(e);
  if (!isPointInActiveCrop(x, y)) return;

  canvas.setPointerCapture(e.pointerId);
  state.isDrawing = true;
  const pressure = getPressure(e);

  // Start a new stroke
  state.currentStroke = {
    points: [{x, y, pressure}],
    color: state.penColor,
    size: state.penSize,
    tool: state.currentTool
  };

  // タップのみのストロークも即時表示する
  drawTransformedStrokePoint(state.currentStroke, state.currentStroke.points[0]);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function draw(e) {
  e.preventDefault();
  if (state.transformGesture) {
    updateTransformGesture(e);
    return;
  }
  if (!state.isDrawing) return;

  const {x, y} = getBaseCoordinates(e);
  if (!isPointInActiveCrop(x, y)) return;

  const pressure = getPressure(e);

  // Add point to current stroke
  if (state.currentStroke && state.currentStroke.points.length > 0) {
    const prevPoint = state.currentStroke.points[state.currentStroke.points.length - 1];
    const distance = Math.hypot(x - prevPoint.x, y - prevPoint.y);
    if (distance < 1) return;

    const currPoint = {x, y, pressure};
    state.currentStroke.points.push(currPoint);

    // Draw line segment from previous point to current point
    drawTransformedStrokeSegment(state.currentStroke, prevPoint, currPoint);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

export function stopDrawing(e) {
  e.preventDefault();
  if (state.transformGesture) {
    endTransformGesture(e);
    return;
  }

  if (state.isDrawing && state.currentStroke && state.currentStroke.points.length > 0) {
    // ストロークを統合履歴へ保存する
    state.strokes.push(state.currentStroke);
    state.historyStack.push({type: 'stroke', stroke: state.currentStroke});
    // 新しい操作後は redo 履歴を破棄する
    state.redoStack = [];
    state.currentStroke = null;
    // Update Next Image button state
    updateNextImageButtonState();
  }
  state.isDrawing = false;
}

export function clearCanvas() {
  resetViewState();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Clear stroke history
  state.strokes = [];
  state.historyStack = [];
  state.redoStack = [];
  state.currentStroke = null;
  applyReferenceTransform();
  updateGridOverlays();
  // Update Next Image button state
  updateNextImageButtonState();
}

export function undo() {
  if (state.historyStack.length === 0) return;

  const action = state.historyStack.pop();
  if (action.type === 'stroke') {
    state.redoStack.push({type: 'stroke', stroke: state.strokes.pop()});
  } else if (action.type === 'view') {
    state.viewState = structuredClone(action.before);
    state.redoStack.push(action);
  }

  applyViewChange();

  // Update Next Image button state
  updateNextImageButtonState();
}

export function redo() {
  if (state.redoStack.length === 0) return;

  const action = state.redoStack.pop();
  if (action.type === 'stroke') {
    state.strokes.push(action.stroke);
    state.historyStack.push({type: 'stroke', stroke: action.stroke});
  } else if (action.type === 'view') {
    state.viewState = structuredClone(action.after);
    state.historyStack.push(action);
  }

  applyViewChange();

  // Update Next Image button state
  updateNextImageButtonState();
}

export function redrawCanvas() {
  // Clear canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  applyCanvasViewTransform();
  applyCropClip();

  // Redraw all state.strokes
  state.strokes.forEach(stroke => {
    if (stroke.points.length === 0) return;

    setStrokeStyle(stroke);

    if (stroke.points.length === 1) {
      drawStrokePoint(stroke, stroke.points[0]);
      return;
    }

    for (let i = 1; i < stroke.points.length; i++) {
      const prevPoint = stroke.points[i - 1];
      const currPoint = stroke.points[i];
      drawStrokeSegment(stroke, prevPoint, currPoint);
    }
  });

  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function drawPenSizePreview() {
  // First redraw the canvas to clear previous preview
  redrawCanvas();

  // If preview is enabled, draw the circle
  if (state.showPenSizePreview) {
    ctx.save();

    // Calculate canvas center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw preview circle at center
    ctx.beginPath();
    ctx.arc(centerX, centerY, state.penSize / 2, 0, Math.PI * 2);

    // Draw outline
    ctx.strokeStyle = state.currentTool === 'eraser' ? '#ff0000' : state.penColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw semi-transparent fill
    ctx.fillStyle = state.currentTool === 'eraser' ? 'rgba(255, 0, 0, 0.2)' : state.penColor + '33';
    ctx.fill();

    ctx.restore();
  }
}
