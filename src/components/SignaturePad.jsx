import { useRef, useState, useEffect } from 'react';
import { FaEraser, FaCheckCircle, FaPen } from 'react-icons/fa';

export default function SignaturePad({ label, value, onChange, placeholderName }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value);
    const lastPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const updateCanvasSize = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0) {
                // Keep current content before resize
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(canvas, 0, 0);

                canvas.width = rect.width;
                canvas.height = 150;

                const ctx = canvas.getContext('2d');
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#1d4ed8'; // Dark blue sleek ink color

                if (value) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    };
                    img.src = value;
                    setIsEmpty(false);
                } else if (tempCanvas.width > 0) {
                    ctx.drawImage(tempCanvas, 0, 0);
                }
            }
        };

        updateCanvasSize();

        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [value]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches[0]) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const pos = getPos(e);
        lastPosRef.current = pos;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);

        // Smooth curve drawing
        const midX = (lastPosRef.current.x + pos.x) / 2;
        const midY = (lastPosRef.current.y + pos.y) / 2;
        ctx.quadraticCurveTo(lastPosRef.current.x, lastPosRef.current.y, midX, midY);
        ctx.stroke();

        lastPosRef.current = pos;
        setIsEmpty(false);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            // Compress signature image onto a compact 300x120 canvas to keep payload small & fast
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 300;
            tempCanvas.height = 120;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0, 300, 120);

            const dataUrl = tempCanvas.toDataURL('image/png');
            onChange(dataUrl);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onChange('');
    };

    return (
        <div className="signature-pad-wrapper mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-lt p-2 rounded-circle" style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaPen style={{ fontSize: '0.75rem' }} />
                    </span>
                    <label className="form-label fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>{label}</label>
                </div>
                <div className="d-flex align-items-center gap-2">
                    {isEmpty ? (
                        <span className="badge bg-warning-subtle text-warning fw-semibold px-2 py-1" style={{ fontSize: '0.75rem' }}>
                            Belum TTD
                        </span>
                    ) : (
                        <span className="badge bg-success-subtle text-success fw-semibold px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                            <FaCheckCircle /> TTD Terpasang
                        </span>
                    )}
                    <button 
                        type="button" 
                        className="btn btn-xs btn-outline-danger py-1 px-2 d-inline-flex align-items-center gap-1 rounded-2" 
                        onClick={clearCanvas}
                        style={{ fontSize: '0.75rem', fontWeight: 500 }}
                    >
                        <FaEraser /> Reset TTD
                    </button>
                </div>
            </div>
            
            <div 
                ref={containerRef}
                className="signature-canvas-box border rounded-3 position-relative overflow-hidden bg-white" 
                style={{ 
                    touchAction: 'none', 
                    cursor: 'crosshair', 
                    borderColor: isEmpty ? '#e2e8f0' : '#1d4ed8',
                    boxShadow: isEmpty ? 'none' : '0 0 0 3px rgba(29, 78, 216, 0.1)',
                    transition: 'all 0.2s ease-in-out'
                }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: '100%', height: '150px', display: 'block', background: 'radial-gradient(circle, #f8fafc 1px, transparent 1px) 0 0/16px 16px' }}
                />

                {isEmpty && (
                    <div 
                        className="position-absolute top-50 start-50 translate-middle text-muted pe-none text-center w-100 px-3" 
                        style={{ opacity: 0.45, fontSize: '0.85rem' }}
                    >
                        <div className="mb-1" style={{ fontSize: '1.5rem' }}>✍️</div>
                        <div className="fw-semibold">Goreskan Tanda Tangan Digital di Sini</div>
                        <div className="small text-secondary">{placeholderName ? `(Atas nama: ${placeholderName})` : ''}</div>
                    </div>
                )}
            </div>
            <div className="d-flex justify-content-between align-items-center mt-1 px-1">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    📱 Kompatibel dengan Layar Sentuh Tablet / Smartphone & Mouse
                </small>
                <small className="text-primary fw-medium" style={{ fontSize: '0.75rem' }}>
                    Goresan Halus & Presisi
                </small>
            </div>
        </div>
    );
}
