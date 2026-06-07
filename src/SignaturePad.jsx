import React, { useEffect, useRef, useState } from 'react';

// Lightweight canvas signature pad. Reports whether a signature has been
// drawn via onChange(hasInk); the parent records the signed-on timestamp.
export default function SignaturePad({ onChange, disabled = false, defaultSigned = false }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  // Seed from defaultSigned so returning from the review step (where a signature
  // value already exists) shows "captured" rather than an empty-looking pad.
  const hasInk = useRef(defaultSigned);
  const [empty, setEmpty] = useState(!defaultSigned);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
  }, []);

  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    if (disabled) return;
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk.current) {
      hasInk.current = true;
      setEmpty(false);
      onChange(true);
    }
  }

  function end() { drawing.current = false; }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setEmpty(true);
    onChange(false);
  }

  return (
    <div className={`forms-sig ${disabled ? 'is-disabled' : ''}`}>
      <canvas
        ref={canvasRef}
        className="forms-sig-canvas"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="forms-sig-bar">
        <span className="forms-sig-hint">{disabled ? 'Signature' : empty ? 'Sign above with your mouse or finger' : 'Signature captured'}</span>
        <button type="button" className="forms-sig-clear" onClick={clear} disabled={empty || disabled}>Clear</button>
      </div>
    </div>
  );
}
