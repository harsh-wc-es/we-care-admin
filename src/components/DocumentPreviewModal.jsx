import { useEffect, useRef, useState } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function previewKind(contentType = '', fileName = '') {
  const normalizedType = contentType.toLowerCase();
  const normalizedName = fileName.toLowerCase();
  if (normalizedType.includes('pdf') || normalizedName.endsWith('.pdf')) return 'pdf';
  if (normalizedType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(normalizedName)) return 'image';
  return 'download';
}

function touchDistance(touches) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export default function DocumentPreviewModal({
  title,
  subtitle,
  blobUrl,
  contentType,
  fileName,
  loading,
  error,
  imageAlt = 'Document preview',
  unavailableMessage = 'This document type can be opened in a new tab or downloaded.',
  onClose,
  children,
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const interactionRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const pinchRef = useRef({ active: false, distance: 0, scale: 1 });

  const kind = blobUrl ? previewKind(contentType, fileName) : null;
  const isImage = kind === 'image';

  useEffect(() => {
    setScale(1);
    setRotation(0);
    setTranslate({ x: 0, y: 0 });
    setIsDragging(false);
    dragRef.current.active = false;
    pinchRef.current.active = false;
  }, [blobUrl]);

  const clampTranslate = (nextTranslate, nextScale = scale) => {
    if (nextScale <= 1) return { x: 0, y: 0 };
    const maxPan = Math.max(120, (nextScale - 1) * 650);
    return {
      x: clamp(nextTranslate.x, -maxPan, maxPan),
      y: clamp(nextTranslate.y, -maxPan, maxPan),
    };
  };

  const applyScale = (nextScale, point = null) => {
    setScale((currentScale) => {
      const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      if (clampedScale <= 1) {
        setTranslate({ x: 0, y: 0 });
        return clampedScale;
      }

      if (point && interactionRef.current) {
        const rect = interactionRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const ratio = clampedScale / currentScale;
        setTranslate((currentTranslate) => clampTranslate({
          x: currentTranslate.x - (point.x - centerX) * (ratio - 1),
          y: currentTranslate.y - (point.y - centerY) * (ratio - 1),
        }, clampedScale));
      } else {
        setTranslate((currentTranslate) => clampTranslate(currentTranslate, clampedScale));
      }

      return clampedScale;
    });
  };

  const zoomIn = () => applyScale(scale + ZOOM_STEP);
  const zoomOut = () => applyScale(scale - ZOOM_STEP);
  const reset = () => {
    setRotation(0);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const handleWheel = (event) => {
    if (!isImage) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    applyScale(scale + direction * ZOOM_STEP, { x: event.clientX, y: event.clientY });
  };

  const startDrag = (clientX, clientY) => {
    if (!isImage || scale <= 1) return;
    dragRef.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      originX: translate.x,
      originY: translate.y,
    };
    setIsDragging(true);
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current.active || scale <= 1) return;
    const nextTranslate = {
      x: dragRef.current.originX + clientX - dragRef.current.startX,
      y: dragRef.current.originY + clientY - dragRef.current.startY,
    };
    setTranslate(clampTranslate(nextTranslate));
  };

  const endDrag = () => {
    dragRef.current.active = false;
    pinchRef.current.active = false;
    setIsDragging(false);
  };

  const handleMouseDown = (event) => {
    event.preventDefault();
    startDrag(event.clientX, event.clientY);
  };

  const handleMouseMove = (event) => {
    if (!dragRef.current.active) return;
    event.preventDefault();
    moveDrag(event.clientX, event.clientY);
  };

  const handleTouchStart = (event) => {
    if (!isImage) return;
    if (event.touches.length === 2) {
      event.preventDefault();
      pinchRef.current = { active: true, distance: touchDistance(event.touches), scale };
      dragRef.current.active = false;
      setIsDragging(false);
      return;
    }
    if (event.touches.length === 1 && scale > 1) {
      event.preventDefault();
      startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  const handleTouchMove = (event) => {
    if (!isImage) return;
    if (event.touches.length === 2 && pinchRef.current.active) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      if (pinchRef.current.distance > 0) {
        applyScale(pinchRef.current.scale * (distance / pinchRef.current.distance));
      }
      return;
    }
    if (event.touches.length === 1 && dragRef.current.active) {
      event.preventDefault();
      moveDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  const cursor = isImage && scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';
  const transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale}) rotate(${rotation}deg)`;

  return (
    <div className="drawer-overlay document-preview-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="document-preview-modal" role="dialog" aria-modal="true" aria-labelledby="document-preview-title" onClick={(event) => event.stopPropagation()}>
        <div className="document-preview-modal__header">
          <div>
            <h2 id="document-preview-title">{title || 'Document Preview'}</h2>
            <p>{subtitle || fileName || 'Protected document'}</p>
          </div>
          <button className="btn btn-outline" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="document-preview-modal__body">
          {loading && <LoadingSkeleton style={{ height: 420 }} />}
          {!loading && error && <ErrorState title={error} />}
          {!loading && !error && blobUrl && kind === 'pdf' && (
            <iframe className="document-preview-frame" src={blobUrl} title={title || 'Document Preview'} />
          )}
          {!loading && !error && blobUrl && isImage && (
            <>
              <div
                ref={interactionRef}
                className={`document-preview-image-wrap${scale > 1 ? ' document-preview-image-wrap--zoomed' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={endDrag}
                onTouchCancel={endDrag}
                style={{ cursor }}
              >
                <img
                  className="document-preview-image"
                  src={blobUrl}
                  alt={imageAlt}
                  draggable={false}
                  style={{ transform }}
                />
              </div>
              <p className="document-preview-help">Scroll to zoom • Drag to move • Pinch to zoom on touch screens</p>
            </>
          )}
          {!loading && !error && blobUrl && kind === 'download' && (
            <EmptyState title="Preview unavailable" message={unavailableMessage} />
          )}
        </div>

        <div className="document-preview-modal__actions">
          {blobUrl && isImage && (
            <div className="document-preview-rotate-actions">
              <button className="btn btn-outline" type="button" onClick={() => setRotation((current) => current - 90)}>Rotate left</button>
              <button className="btn btn-outline" type="button" onClick={() => setRotation((current) => current + 90)}>Rotate right</button>
              <button className="btn btn-outline" type="button" onClick={reset}>Reset</button>
              <button className="btn btn-outline" type="button" disabled={scale <= MIN_SCALE} onClick={zoomOut}>Zoom out</button>
              <span className="document-preview-zoom-label">{Math.round(scale * 100)}%</span>
              <button className="btn btn-outline" type="button" disabled={scale >= MAX_SCALE} onClick={zoomIn}>Zoom in</button>
            </div>
          )}
          {children}
          <button className="btn btn-outline" type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
