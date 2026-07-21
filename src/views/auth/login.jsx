//import hook react
import { useState, useRef, useEffect, useCallback } from 'react';

//import hook useNavigate from react router dom
import { Link, useNavigate } from "react-router-dom";

//import store
import { useStore } from '../../stores/user';

//import SliderCaptcha component
import SliderCaptcha from '../../components/SliderCaptcha';

//import Tabler Icons
import { IconArrowLeft, IconLock, IconMail, IconSparkles, IconUserPlus, IconFlask } from '@tabler/icons-react';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useStore();

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginFailed, setLoginFailed] = useState('');

    // Slider CAPTCHA state
    const [slider, setSlider] = useState({
        isVerified: false
    });
    const [sliderResetCount, setSliderResetCount] = useState(0);

    // Refs
    const bgCanvasRef = useRef(null);
    const animationFrameRef = useRef();

    // Constants
    const AUTO_RESET_TIME = 30000;

    // Handlers for form input
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
            setLoginFailed('');
        }
    }, [errors]);

    // Reset handler for slider
    const resetSlider = useCallback(() => {
        setSlider({ isVerified: false });
        setSliderResetCount(prev => prev + 1);
    }, []);

    // Auto reset timer
    useEffect(() => {
        let timeout;
        if (slider.isVerified) {
            timeout = setTimeout(resetSlider, AUTO_RESET_TIME);
        }
        return () => clearTimeout(timeout);
    }, [slider.isVerified, resetSlider]);

    // Red-themed Trakteer background animation
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        resize();
        window.addEventListener('resize', resize);

        // Soft Elegant Red color palette
        const redShades = [
            { primary: '#b91c1c', secondary: '#f43f5e' },
            { primary: '#9f1239', secondary: '#fb7185' },
            { primary: '#881337', secondary: '#fde047' },
            { primary: '#e11d48', secondary: '#f472b6' }
        ];

        class RedParticle {
            constructor() {
                this.colorSet = redShades[Math.floor(Math.random() * redShades.length)];
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 50 + 25;
                this.speedX = (Math.random() - 0.5) * 0.2;
                this.speedY = (Math.random() - 0.5) * 0.2;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.001;
                this.pulse = Math.random() * Math.PI * 2;
                this.pulseSpeed = 0.01;
                this.opacity = Math.random() * 0.08 + 0.03;
                this.shape = Math.floor(Math.random() * 3);
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.rotation += this.rotationSpeed;
                this.pulse += this.pulseSpeed;

                if (this.x < -100) this.x = width + 100;
                if (this.x > width + 100) this.x = -100;
                if (this.y < -100) this.y = height + 100;
                if (this.y > height + 100) this.y = -100;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                const scale = 1 + Math.sin(this.pulse) * 0.1;
                const gradient = ctx.createLinearGradient(
                    -this.size/2, -this.size/2, 
                    this.size/2, this.size/2
                );
                gradient.addColorStop(0, this.colorSet.primary);
                gradient.addColorStop(1, this.colorSet.secondary);
                
                ctx.globalAlpha = this.opacity * (0.8 + Math.sin(this.pulse) * 0.2);
                ctx.fillStyle = gradient;

                switch(this.shape) {
                    case 0: // Circle
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size * scale / 2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 1: // Square (rounded)
                        ctx.beginPath();
                        ctx.roundRect(-this.size * scale / 2, -this.size * scale / 2, 
                                    this.size * scale, this.size * scale, 15);
                        ctx.fill();
                        break;
                    case 2: // Triangle
                        ctx.beginPath();
                        ctx.moveTo(0, -this.size * scale / 2);
                        ctx.lineTo(this.size * scale / 2, this.size * scale / 2);
                        ctx.lineTo(-this.size * scale / 2, this.size * scale / 2);
                        ctx.closePath();
                        ctx.fill();
                        break;
                }
                
                ctx.restore();
            }
        }

        // Create particles
        const particles = [];
        const PARTICLE_COUNT = 20;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new RedParticle());
        }

        // Animation loop
        const animate = () => {
            // Soft Elegant Deep Crimson Red Gradient background
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#991b1b');
            gradient.addColorStop(0.5, '#881337');
            gradient.addColorStop(1, '#4c0519');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Draw floating particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw subtle sparkles
            ctx.save();
            ctx.globalAlpha = 0.2;
            for (let i = 0; i < 30; i++) {
                const x = (Math.sin(Date.now() * 0.001 + i) * 50 + i * 70) % width;
                const y = (Math.cos(Date.now() * 0.001 + i) * 30 + i * 40) % height;
                ctx.fillStyle = i % 2 === 0 ? '#ffe600' : '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Error handler
    const handleServerErrors = useCallback((errorData) => {
        if (errorData.error?.type === 'authorization') {
            setLoginFailed(errorData.error.message);
            if (errorData.error.field) {
                setErrors(prev => ({
                    ...prev,
                    [errorData.error.field]: errorData.error.message
                }));
            }
            return;
        }

        if (errorData.errors && Array.isArray(errorData.errors)) {
            const newErrors = {};
            errorData.errors.forEach(error => {
                if (error.path && !newErrors[error.path]) {
                    newErrors[error.path] = error.msg;
                }
            });
            setErrors(newErrors);
        }
    }, []);

    // Login handler
    const loginHandler = async (e) => {
        e.preventDefault();

        if (!slider.isVerified) {
            return;
        }

        setIsLoading(true);
        setErrors({});
        setLoginFailed('');

        try {
            await login(formData);
            navigate('/dashboard');
        } catch (error) {
            setIsLoading(false);
            if (error.response?.data) {
                error.response.data.message 
                    ? setLoginFailed(error.response.data.message)
                    : handleServerErrors(error.response.data);
            } else {
                setLoginFailed('Terjadi kesalahan pada server. Silakan coba lagi.');
            }
            resetSlider();
        }
    };

    return (
        <>
            {/* Trakteer Red Animated Canvas Background */}
            <canvas
                ref={bgCanvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}
            />

            {/* Dot grid overlay matching landing page */}
            <div className="login-dots-overlay"></div>

            <div className="login-container">
                {/* Back to Landing Page Button */}
                <div className="top-nav-bar">
                    <Link to="/" className="btn-back-home">
                        <IconArrowLeft size={18} />
                        <span>Ke Beranda</span>
                    </Link>
                </div>

                {/* Header Section */}
                <div className="text-center mb-4 position-relative">
                    <div className="logo-wrapper mx-auto">
                        <div className="logo-inner">
                            <img
                                src="/sidoarjo.png"
                                onError={(e) => { e.target.src = "/images/laboratory.png"; }}
                                width="44"
                                height="52"
                                alt="Logo Kab Sidoarjo"
                            />
                        </div>
                    </div>
                    <h2 className="h4 fw-black mt-3 mb-1 text-white text-shadow-heavy">
                        Laboratorium Kesehatan Daerah
                    </h2>
                    <p className="text-warning-glow fw-bold small text-shadow-sub">
                        (UPT Labkesda Kab. Sidoarjo)
                    </p>
                </div>

                {/* 3D Neubrutalism Login Card */}
                <div className="card-wrapper">
                    <div className="card login-card">
                        <div className="card-body p-4 p-md-5">
                            <div className="text-center mb-4">
                                <div className="badge-3d-title mb-2">
                                    <IconSparkles size={16} className="text-danger me-1" />
                                    <span>Portal Masuk Sistem</span>
                                </div>
                                <h3 className="h4 fw-black text-dark mb-1">Selamat Datang Kembali</h3>
                                <p className="text-secondary small mb-0">
                                    Masukkan email dan kata sandi Anda untuk melanjutkan
                                </p>
                            </div>

                            {/* Error Alert */}
                            {(loginFailed || errors.general) && (
                                <div className="alert alert-red-3d d-flex align-items-center mb-4">
                                    <div className="alert-icon me-2">⚠️</div>
                                    <span className="small fw-bold">{loginFailed || errors.general}</span>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={loginHandler} noValidate>
                                {/* Email Field */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-dark">Alamat Email</label>
                                    <div className="input-wrapper">
                                        <div className="input-icon-wrapper">
                                            <IconMail size={20} className="text-danger" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            className={`form-control form-control-3d ${errors.email ? 'is-invalid' : ''}`}
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="nama@email.com"
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback small fw-bold mt-1">{errors.email}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="form-label small fw-bold text-dark mb-0">Kata Sandi</label>
                                        <Link to="/forgot-password" className="small fw-bold text-danger forgot-link">
                                            Lupa password?
                                        </Link>
                                    </div>
                                    <div className="input-wrapper">
                                        <div className="input-icon-wrapper">
                                            <IconLock size={20} className="text-danger" />
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            className={`form-control form-control-3d ${errors.password ? 'is-invalid' : ''}`}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.password && (
                                        <div className="invalid-feedback small fw-bold mt-1">{errors.password}</div>
                                    )}
                                </div>

                                {/* Slider CAPTCHA */}
                                <div className="mb-4">
                                    <SliderCaptcha
                                        isVerified={slider.isVerified}
                                        onVerify={(verified) => setSlider(prev => ({ ...prev, isVerified: verified }))}
                                        resetTrigger={sliderResetCount}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Remember Me */}
                                <div className="mb-4">
                                    <label className="custom-checkbox-3d">
                                        <input
                                            type="checkbox"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                        <span className="checkmark-3d"></span>
                                        <span className="fw-semibold small text-dark">Ingat sesi saya</span>
                                    </label>
                                </div>

                                {/* 3D Green Submit Button */}
                                <button
                                    type="submit"
                                    className="btn-submit-3d"
                                    disabled={isLoading || !slider.isVerified}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Memproses Masuk...
                                        </>
                                    ) : !slider.isVerified ? (
                                        <>
                                            <IconLock size={18} className="me-1" />
                                            Verifikasi Geser Terlebih Dahulu
                                        </>
                                    ) : (
                                        <>
                                            🚀 Masuk ke Dashboard
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 3D Register Link */}
                    <div className="text-center mt-4 d-flex align-items-center justify-content-center flex-wrap gap-2">
                        <span className="text-white fw-bold small text-shadow-sub">Belum punya akun? </span>
                        <Link to="/register" className="register-btn-3d">
                            <IconUserPlus size={16} />
                            <span>Daftar Akun Baru ➔</span>
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
                .login-dots-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: radial-gradient(rgba(255, 255, 255, 0.18) 1.5px, transparent 1.5px);
                    background-size: 24px 24px;
                    pointer-events: none;
                    z-index: 1;
                }

                .login-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem 1.5rem;
                    position: relative;
                    z-index: 2;
                }

                .top-nav-bar {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    z-index: 10;
                }

                .btn-back-home {
                    background: #67e8f9;
                    color: #000000 !important;
                    font-weight: 800;
                    font-size: 0.88rem;
                    padding: 8px 16px;
                    border-radius: 12px;
                    border: 2.5px solid #000000;
                    box-shadow: 4px 4px 0px #000000;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    text-decoration: none !important;
                    transition: all 0.15s ease-in-out;
                }

                .btn-back-home:hover {
                    background: #22d3ee;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000;
                }

                .logo-wrapper {
                    width: 84px;
                    height: 84px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-inner {
                    width: 84px;
                    height: 84px;
                    background: #ffffff;
                    border: 3px solid #000000;
                    box-shadow: 5px 5px 0px #000000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .text-shadow-heavy {
                    text-shadow: 0 3px 8px rgba(0, 0, 0, 0.6);
                }

                .text-shadow-sub {
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
                }

                .text-warning-glow {
                    color: #ffe600 !important;
                }

                .card-wrapper {
                    width: 100%;
                    max-width: 460px;
                    position: relative;
                    z-index: 2;
                }

                /* 3D Neubrutalism Card */
                .login-card {
                    background: #ffffff;
                    border: 3px solid #000000;
                    border-radius: 24px;
                    box-shadow: 8px 8px 0px #000000;
                    overflow: hidden;
                }

                .badge-3d-title {
                    display: inline-flex;
                    align-items: center;
                    background: #fee2e2;
                    color: #e50914;
                    font-weight: 800;
                    font-size: 0.82rem;
                    padding: 5px 14px;
                    border: 2px solid #000000;
                    box-shadow: 3px 3px 0px #000000;
                    border-radius: 10px;
                }

                .alert-red-3d {
                    background: #fef2f2;
                    border: 2.5px solid #000000;
                    box-shadow: 4px 4px 0px #000000;
                    border-radius: 14px;
                    color: #991b1b;
                    padding: 12px 16px;
                }

                .input-wrapper {
                    position: relative;
                }

                .input-icon-wrapper {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 3;
                }

                .form-control-3d {
                    height: 52px;
                    border-radius: 14px;
                    border: 2.5px solid #000000;
                    box-shadow: 3px 3px 0px #000000;
                    background: #ffffff;
                    font-size: 14px;
                    font-weight: 600;
                    padding-left: 50px;
                    transition: all 0.15s ease-in-out;
                }

                .form-control-3d:focus {
                    background: #fffdf0;
                    border-color: #000000;
                    box-shadow: 5px 5px 0px #000000;
                    outline: none;
                }

                .custom-checkbox-3d {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    user-select: none;
                }

                .custom-checkbox-3d input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                }

                .checkmark-3d {
                    position: relative;
                    height: 22px;
                    width: 22px;
                    background: #ffffff;
                    border: 2.5px solid #000000;
                    box-shadow: 2px 2px 0px #000000;
                    border-radius: 6px;
                    transition: all 0.15s;
                }

                .custom-checkbox-3d input:checked ~ .checkmark-3d {
                    background: #10b981;
                }

                .checkmark-3d:after {
                    content: "";
                    position: absolute;
                    display: none;
                    left: 6px;
                    top: 2px;
                    width: 6px;
                    height: 11px;
                    border: solid white;
                    border-width: 0 2.5px 2.5px 0;
                    transform: rotate(45deg);
                }

                .custom-checkbox-3d input:checked ~ .checkmark-3d:after {
                    display: block;
                }

                /* 3D Submit Button */
                .btn-submit-3d {
                    width: 100%;
                    height: 54px;
                    border: 3px solid #000000;
                    border-radius: 14px;
                    background: #10b981;
                    color: #ffffff;
                    font-weight: 900;
                    font-size: 1.05rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 5px 5px 0px #000000;
                    transition: all 0.15s ease-in-out;
                }

                .btn-submit-3d:hover:not(:disabled) {
                    background: #059669;
                    transform: translate(-2px, -2px);
                    box-shadow: 7px 7px 0px #000000;
                }

                .btn-submit-3d:active:not(:disabled) {
                    transform: translate(2px, 2px);
                    box-shadow: 2px 2px 0px #000000;
                }

                .btn-submit-3d:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                    opacity: 0.8;
                }

                /* 3D Register Button */
                .register-btn-3d {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 18px;
                    background: #fbbf24;
                    color: #000000 !important;
                    border: 2.5px solid #000000;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 800;
                    text-decoration: none !important;
                    box-shadow: 4px 4px 0px #000000;
                    transition: all 0.15s ease-in-out;
                }

                .register-btn-3d:hover {
                    background: #f59e0b;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000;
                }

                .register-btn-3d:active {
                    transform: translate(2px, 2px);
                    box-shadow: 1px 1px 0px #000000;
                }

                @media (max-width: 576px) {
                    .login-container {
                        padding: 4rem 1rem 2rem 1rem;
                    }
                    .top-nav-bar {
                        top: 12px;
                        left: 12px;
                    }
                }
            `}</style>
        </>
    )
}