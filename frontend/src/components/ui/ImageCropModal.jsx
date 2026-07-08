// frontend/src/components/ui/ImageCropModal.jsx
// ============================================================
// Lightweight canvas-based crop/zoom/resize modal.
// No external cropper library needed — pure <canvas> + pointer events.
// User can drag the image to reposition it and use the slider to zoom,
// then "Save" exports a fixed-size square JPEG blob ready to upload.
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';

const OUTPUT_SIZE = 480; // exported image will be OUTPUT_SIZE x OUTPUT_SIZE px
const VIEWPORT_SIZE = 320; // on-screen crop circle/box size in px

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const dragState = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the image whenever a new src comes in
  useEffect(() => {
    if (!imageSrc) return;
    setImgLoaded(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const baseScale = useCallback(() => {
    const img = imgRef.current;
    if (!img) return 1;
    // Scale so the image always covers the viewport square at zoom = 1
    return VIEWPORT_SIZE / Math.min(img.width, img.height);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    const scale = baseScale() * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    const x = (VIEWPORT_SIZE - drawW) / 2 + offset.x;
    const y = (VIEWPORT_SIZE - drawH) / 2 + offset.y;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    ctx.clip();
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();

    // Dim area outside the circular crop guide
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.rect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [zoom, offset, baseScale]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  // Clamp offset so the image can never be dragged away from covering the viewport
  const clampOffset = useCallback((rawOffset, currentZoom) => {
    const img = imgRef.current;
    if (!img) return rawOffset;
    const scale = baseScale() * currentZoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const maxX = Math.max(0, (drawW - VIEWPORT_SIZE) / 2);
    const maxY = Math.max(0, (drawH - VIEWPORT_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, rawOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, rawOffset.y))
    };
  }, [baseScale]);

  const handlePointerDown = (e) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffset: offset
    };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next = {
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy
    };
    setOffset(clampOffset(next, zoom));
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const handleZoomChange = (e) => {
    const nextZoom = parseFloat(e.target.value);
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev, nextZoom));
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    try {
      const scale = baseScale() * zoom;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (VIEWPORT_SIZE - drawW) / 2 + offset.x;
      const y = (VIEWPORT_SIZE - drawH) / 2 + offset.y;

      // Render at full OUTPUT_SIZE resolution for a crisp, resized square avatar
      const outputScale = OUTPUT_SIZE / VIEWPORT_SIZE;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = OUTPUT_SIZE;
      exportCanvas.height = OUTPUT_SIZE;
      const ctx = exportCanvas.getContext('2d');
      ctx.drawImage(
        img,
        x * outputScale,
        y * outputScale,
        drawW * outputScale,
        drawH * outputScale
      );

      exportCanvas.toBlob(
        (blob) => {
          setSaving(false);
          if (blob) onCropComplete(blob);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Profile Photo" size="sm">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={VIEWPORT_SIZE}
          height={VIEWPORT_SIZE}
          className="rounded-lg bg-gray-100 dark:bg-gray-700 cursor-move touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Zoom
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={handleZoomChange}
            className="w-full accent-blue-600"
          />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Drag the photo to reposition it, use the slider to zoom, then save.
        </p>

        <div className="flex gap-3 w-full pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!imgLoaded}
            className="flex-1"
          >
            Save Photo
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropModal;