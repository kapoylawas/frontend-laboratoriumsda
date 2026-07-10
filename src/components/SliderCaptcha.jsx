import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export default function SliderCaptcha({ isVerified, onVerify, resetTrigger, disabled }) {
    const [value, setValue] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [showReset, setShowReset] = useState(false);

    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);

    const SLIDER_THRESHOLD = 95;

    // Use a ref to store state values for the stable event handlers
    const stateRef = useRef({
        isDragging: false,
        isVerified: false,
        value: 0,
        disabled: false
    });

    const onVerifyRef = useRef(onVerify);

    // Synchronize props to refs
    useEffect(() => {
        stateRef.current.isVerified = isVerified;
        stateRef.current.disabled = disabled;
        onVerifyRef.current = onVerify;
    }, [isVerified, disabled, onVerify]);

    // Reset handler
    const handleReset = useCallback(() => {
        setValue(0);
        setIsDragging(false);
        setError('');
        setShowReset(false);
        stateRef.current.value = 0;
        stateRef.current.isDragging = false;
        if (onVerifyRef.current) onVerifyRef.current(false);
    }, []);

    // Reset only when resetTrigger actually changes and is > 0 (e.g. parent increments it on login failure)
    useEffect(() => {
        if (resetTrigger > 0) {
            handleReset();
        }
    }, [resetTrigger, handleReset]);

    // Particle Burst Animation class
    class Bubble {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 8 + 4;
            this.speedX = (Math.random() - 0.5) * 4;
            this.speedY = -Math.random() * 3 - 2;
            this.opacity = 1;
            this.color = Math.random() > 0.5 ? '#7DC9FF' : '#4A90E2';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.opacity -= 0.02;
            if (this.size > 0.2) this.size -= 0.1;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Trigger bubble burst at the right side
    const triggerBubbleBurst = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const bubbles = [];
        // Spawn bubbles around the verified thumb position (at the right side)
        const spawnX = rect.width - 30;
        const spawnY = rect.height / 2;

        for (let i = 0; i < 35; i++) {
            bubbles.push(new Bubble(spawnX, spawnY));
        }

        const animateBubbles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const bubble = bubbles[i];
                bubble.update();
                bubble.draw(ctx);
                
                if (bubble.opacity <= 0 || bubble.size <= 0) {
                    bubbles.splice(i, 1);
                }
            }

            if (bubbles.length > 0) {
                animationFrameRef.current = requestAnimationFrame(animateBubbles);
            }
        };

        animateBubbles();
    }, []);

    // Cleanup animation frame
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Handle Drag start
    const handleStart = (e) => {
        if (isVerified || disabled) return;
        // Check if mouse click is left click
        if (e.button !== undefined && e.button !== 0) return;
        
        setIsDragging(true);
        stateRef.current.isDragging = true;
        setError('');
        setShowReset(false);
    };

    // Add global event listeners during dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e) => {
            if (!stateRef.current.isDragging || !containerRef.current || stateRef.current.isVerified) return;

            const rect = containerRef.current.getBoundingClientRect();
            const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
            if (clientX === undefined) return;

            let x = clientX - rect.left;
            let percentage = (x / rect.width) * 100;
            percentage = Math.max(0, Math.min(percentage, 100));

            setValue(percentage);
            stateRef.current.value = percentage;

            // Instantly verify if threshold is met
            if (percentage >= SLIDER_THRESHOLD) {
                setIsDragging(false);
                stateRef.current.isDragging = false;
                setValue(100);
                stateRef.current.value = 100;
                if (onVerifyRef.current) onVerifyRef.current(true);
                setTimeout(triggerBubbleBurst, 50);
            }
        };

        const handleEnd = () => {
            if (!stateRef.current.isDragging) return;
            setIsDragging(false);
            stateRef.current.isDragging = false;

            if (stateRef.current.value < SLIDER_THRESHOLD) {
                setValue(0);
                stateRef.current.value = 0;
                setError('Geser slider sampai ke ujung kanan');
                setShowReset(true);
            }
        };

        const onMove = (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            handleMove(e);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, triggerBubbleBurst]);

    // Inline CSS styling styles
    const fillStyle = useMemo(() => ({
        width: `${value}%`,
        background: isVerified
            ? 'linear-gradient(90deg, #28b463 0%, #2ecc71 100%)' // Green gradient when verified
            : 'linear-gradient(90deg, #4A90E2 0%, #7DC9FF 100%)',
        // Only animate (transition) when not dragging (for smooth snapping back or completion)
        transition: isDragging ? 'none' : 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
    }), [value, isVerified, isDragging]);

    const thumbStyle = useMemo(() => ({
        left: `${value}%`,
        borderColor: isVerified ? '#2ecc71' : '#4A90E2',
        background: isVerified
            ? 'linear-gradient(135deg, #28b463, #2ecc71)'
            : 'linear-gradient(135deg, #4A90E2, #7DC9FF)',
        transition: isDragging ? 'none' : 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1), background 0.3s, border-color 0.3s'
    }), [value, isVerified, isDragging]);

    return (
        <div className="slider-captcha-component">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label small fw-semibold blue-text m-0">
                    <span className="me-1">🔷</span> Verifikasi Keamanan
                </label>
                <span className={`status-badge-custom ${isVerified ? 'verified' : 'pending'}`}>
                    {isVerified ? '✓ Terverifikasi' : '⚡ Verifikasi'}
                </span>
            </div>

            <div className={`captcha-wrapper-custom ${error ? 'has-error' : ''} ${isVerified ? 'is-verified' : ''}`}>
                {/* Main Slider Track */}
                <div
                    ref={containerRef}
                    className={`slider-container-custom ${isVerified ? 'is-verified' : ''} ${isDragging ? 'is-dragging' : ''}`}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                    style={{ opacity: disabled ? 0.6 : 1 }}
                >
                    {/* Bubble bursting canvas overlay */}
                    <canvas ref={canvasRef} className="bubble-canvas" />

                    {/* Progress Fill */}
                    <div className="slider-fill-custom" style={fillStyle} />

                    {/* Handle Thumb */}
                    <div className="slider-thumb-custom" style={thumbStyle}>
                        {isVerified ? '✓' : '→'}
                    </div>

                    {/* Instruction/Status Text */}
                    <div className="slider-text-custom">
                        {isVerified ? (
                            <span className="text-white fw-bold text-shadow animate-pulse-custom">
                                🌊 Verifikasi Berhasil! 🌊
                            </span>
                        ) : isDragging && value > 10 ? (
                            <span className={value > 55 ? 'text-white text-shadow' : 'text-muted'}>
                                Lepas untuk reset
                            </span>
                        ) : (
                            <span className="shimmer-text">
                                Geser ke kanan untuk verifikasi →
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer status/retry actions */}
                <div className="d-flex justify-content-between align-items-center mt-2 min-h-24">
                    {showReset && !isVerified && (
                        <button
                            type="button"
                            className="btn-reset-custom"
                            onClick={handleReset}
                            disabled={disabled}
                        >
                            🔄 Coba Lagi
                        </button>
                    )}

                    {error && !isVerified && (
                        <div className="error-message-custom">
                            ⚠️ {error}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .slider-captcha-component {
                    width: 100%;
                }
                .min-h-24 {
                    min-height: 28px;
                }
                .blue-text {
                    color: #4A90E2;
                }
                .status-badge-custom {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                .status-badge-custom.pending {
                    background: rgba(74, 144, 226, 0.1);
                    border: 1px solid #4A90E2;
                    color: #4A90E2;
                }
                .status-badge-custom.verified {
                    background: rgba(46, 204, 113, 0.1);
                    border: 1px solid #2ecc71;
                    color: #27ae60;
                }
                .captcha-wrapper-custom {
                    background: #fbfdff;
                    padding: 12px;
                    border-radius: 18px;
                    border: 1.5px solid #e2f0fd;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .captcha-wrapper-custom.is-verified {
                    border-color: #2ecc71;
                    background: rgba(46, 204, 113, 0.05);
                }
                .captcha-wrapper-custom.has-error {
                    border-color: #ff6b6b;
                    animation: shakeCustom 0.5s ease;
                }
                @keyframes shakeCustom {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-4px); }
                    40%, 80% { transform: translateX(4px); }
                }
                .slider-container-custom {
                    position: relative;
                    height: 52px;
                    background: #ffffff;
                    border-radius: 26px;
                    cursor: grab;
                    user-select: none;
                    overflow: hidden;
                    border: 1.5px solid #d4e8fc;
                    box-shadow: inset 0 2px 5px rgba(74, 144, 226, 0.05);
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .slider-container-custom.is-dragging {
                    cursor: grabbing;
                    border-color: #4A90E2;
                    box-shadow: 0 4px 15px rgba(74, 144, 226, 0.15);
                }
                .slider-container-custom.is-verified {
                    cursor: default;
                    border-color: #2ecc71;
                    background: #2ecc71;
                }
                .bubble-canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 4;
                }
                .slider-fill-custom {
                    position: absolute;
                    height: 100%;
                    border-radius: 26px;
                    left: 0;
                    top: 0;
                    z-index: 1;
                }
                .slider-thumb-custom {
                    position: absolute;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
                    border: 2px solid;
                    z-index: 3;
                    font-size: 20px;
                    font-weight: bold;
                    color: white;
                    cursor: inherit;
                }
                .slider-container-custom:not(.is-verified) .slider-thumb-custom {
                    animation: thumbGlow 2s infinite ease-in-out;
                }
                @keyframes thumbGlow {
                    0%, 100% { box-shadow: 0 3px 10px rgba(74, 144, 226, 0.2); }
                    50% { box-shadow: 0 3px 18px rgba(74, 144, 226, 0.5); }
                }
                .slider-text-custom {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 13px;
                    font-weight: 600;
                    white-space: nowrap;
                    z-index: 2;
                    pointer-events: none;
                    transition: color 0.3s;
                }
                .text-shadow {
                    text-shadow: 0 1px 3px rgba(0,0,0,0.15);
                }
                .animate-pulse-custom {
                    animation: pulseText 1.5s infinite;
                }
                @keyframes pulseText {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                /* Shimmer light sweep text animation */
                .shimmer-text {
                    background: linear-gradient(90deg, #88a8d0 0%, #4A90E2 50%, #88a8d0 100%);
                    background-size: 200% auto;
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: shimmerTextAnim 3s infinite linear;
                }
                @keyframes shimmerTextAnim {
                    0% { background-position: -100% 0; }
                    100% { background-position: 100% 0; }
                }
                .btn-reset-custom {
                    background: #f0f7ff;
                    border: 1px solid #c2e0ff;
                    border-radius: 12px;
                    padding: 4px 12px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #4A90E2;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-reset-custom:hover {
                    background: #e0efff;
                    color: #2C6B9E;
                    transform: translateY(-1px);
                }
                .error-message-custom {
                    color: #ff6b6b;
                    font-size: 11px;
                    font-weight: 600;
                    background: rgba(255, 107, 107, 0.08);
                    padding: 3px 10px;
                    border-radius: 10px;
                }
                @media (max-width: 576px) {
                    .slider-container-custom {
                        height: 48px;
                    }
                    .slider-thumb-custom {
                        width: 44px;
                        height: 44px;
                    }
                    .slider-text-custom {
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
}
