
//import hook react
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

//import hook useNavigate from react router dom
import { Link, useNavigate } from "react-router-dom";

//import store
import { useStore } from '../../stores/user';

//import SliderCaptcha component
import SliderCaptcha from '../../components/SliderCaptcha';


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

    // Blue-themed background animation
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

        // Blue color palette
        const blueShades = [
            { primary: '#4A90E2', secondary: '#7DC9FF' }, // Bright Blue
            { primary: '#2C3E50', secondary: '#3498DB' }, // Dark to Medium Blue
            { primary: '#1B4F8B', secondary: '#5D9BEC' }, // Navy to Sky Blue
            { primary: '#0F4C81', secondary: '#6AB0FF' }, // Indigo to Light Blue
            { primary: '#2874A6', secondary: '#85C1E9' }, // Ocean Blue
            { primary: '#1A5276', secondary: '#5DADE2' }  // Deep Blue
        ];

        class BlueParticle {
            constructor() {
                this.colorSet = blueShades[Math.floor(Math.random() * blueShades.length)];
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
                this.opacity = Math.random() * 0.1 + 0.05;
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
            particles.push(new BlueParticle());
        }

        // Animation loop
        const animate = () => {
            // Create blue gradient background
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#0B2F5C');
            gradient.addColorStop(0.5, '#1B4F8B');
            gradient.addColorStop(1, '#2C6B9E');
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
                ctx.fillStyle = i % 2 === 0 ? '#7DC9FF' : '#4A90E2';
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
            {/* Blue Animated Background */}
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

            <div className="login-container">
                {/* Blue Decorative Shapes */}
                <div className="decoration decoration-1"></div>
                <div className="decoration decoration-2"></div>
                <div className="decoration decoration-3"></div>

                {/* Header with Blue Glow */}
                <div className="text-center mb-4 position-relative">
                    <div className="logo-wrapper mx-auto">
                        <div className="logo-glow"></div>
                        <div className="logo-inner">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#blueGradient)" strokeWidth="1.5">
                                <defs>
                                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#4A90E2" />
                                        <stop offset="100%" stopColor="#2C6B9E" />
                                    </linearGradient>
                                </defs>
                                <path d="M4 4h16v16H4z" />
                                <path d="M8 8h8v8H8z" />
                                <circle cx="12" cy="12" r="2" fill="url(#blueGradient)" />
                                <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="h4 fw-bold mt-3 mb-1 text-white">Laboratorium Kesehatan Daerah</h2>
                    <p className="text-white-50 small">(Labkesda)</p>
                </div>

                {/* Login Card with Frosted Blue Glass */}
                <div className="card-wrapper">
                    <div className="card login-card">
                        <div className="card-body p-4">
                            <h3 className="h5 text-center mb-1 blue-gradient-text">🌊 Selamat Datang Kembali 🌊</h3>
                            <p className="text-center text-muted small mb-4">
                                Masuk ke akun Anda untuk melanjutkan
                            </p>

                            {/* Error Alert */}
                            {(loginFailed || errors.general) && (
                                <div className="alert alert-blue d-flex align-items-center mb-4">
                                    <div className="alert-icon me-2">⚠️</div>
                                    <span className="small">{loginFailed || errors.general}</span>
                                </div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={loginHandler} noValidate>
                                {/* Email Field */}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold blue-text">Email</label>
                                    <div className="input-wrapper">
                                        <div className="input-icon-wrapper">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="nama@email.com"
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback small">{errors.email}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label className="form-label small fw-semibold blue-text">Password</label>
                                        <Link to="/forgot-password" className="small text-decoration-none forgot-link">
                                            Lupa password?
                                        </Link>
                                    </div>
                                    <div className="input-wrapper">
                                        <div className="input-icon-wrapper">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </div>
                                        <input
                                            type="password"
                                            name="password"
                                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.password && (
                                        <div className="invalid-feedback small">{errors.password}</div>
                                    )}
                                </div>

                                {/* Blue Slider CAPTCHA */}
                                <div className="mb-4">
                                    <SliderCaptcha
                                        isVerified={slider.isVerified}
                                        onVerify={(verified) => setSlider(prev => ({ ...prev, isVerified: verified }))}
                                        resetTrigger={sliderResetCount}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Remember Me with Blue Checkbox */}
                                <div className="mb-4">
                                    <label className="custom-checkbox">
                                        <input
                                            type="checkbox"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="text-muted small">Ingat saya</span>
                                    </label>
                                </div>

                                {/* Blue Submit Button */}
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={isLoading || !slider.isVerified}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Memproses...
                                        </>
                                    ) : !slider.isVerified ? (
                                        <>
                                            <span className="me-1">🔷</span>
                                            Verifikasi Terlebih Dahulu
                                        </>
                                    ) : (
                                        <>
                                            <span className="me-1">🚀</span>
                                            Masuk ke Dashboard
                                        </>
                                    )}
                                </button>

                                {/* Decorative Blue Waves */}
                                <div className="decorative-waves">
                                    <div className="wave wave-1"></div>
                                    <div className="wave wave-2"></div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center mt-4 register-link">
                        <span className="text-white-50 small">Belum punya akun? </span>
                        <Link to="/register" className="small fw-semibold text-white register-link-text">
                            Daftar disini 🌊
                        </Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 1.5rem;
                    position: relative;
                    z-index: 1;
                }

                /* Blue Decorative Floating Shapes */
                .decoration {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(60px);
                    z-index: 0;
                    animation: float 20s infinite ease-in-out;
                }

                .decoration-1 {
                    width: 300px;
                    height: 300px;
                    background: rgba(74, 144, 226, 0.2);
                    top: -100px;
                    right: -100px;
                    animation-delay: 0s;
                }

                .decoration-2 {
                    width: 400px;
                    height: 400px;
                    background: rgba(44, 107, 158, 0.2);
                    bottom: -150px;
                    left: -150px;
                    animation-delay: -5s;
                }

                .decoration-3 {
                    width: 200px;
                    height: 200px;
                    background: rgba(125, 201, 255, 0.2);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: -10s;
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(50px, 50px) rotate(5deg); }
                    50% { transform: translate(0, 100px) rotate(10deg); }
                    75% { transform: translate(-50px, 50px) rotate(5deg); }
                }

                /* Logo with Blue Glow */
                .logo-wrapper {
                    width: 90px;
                    height: 90px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-glow {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #4A90E2, #2C6B9E);
                    filter: blur(15px);
                    opacity: 0.7;
                    animation: glowPulse 3s infinite;
                }

                @keyframes glowPulse {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }

                .logo-inner {
                    width: 70px;
                    height: 70px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    position: relative;
                    z-index: 1;
                }

                /* Card Styles */
                .card-wrapper {
                    width: 100%;
                    max-width: 440px;
                    position: relative;
                    z-index: 2;
                }

                .login-card {
                    border: none;
                    border-radius: 30px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    box-shadow: 
                        0 20px 40px rgba(0, 0, 0, 0.2),
                        0 0 0 2px rgba(74, 144, 226, 0.1) inset;
                    animation: cardFloat 1s ease-out;
                }

                @keyframes cardFloat {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .blue-gradient-text {
                    background: linear-gradient(135deg, #4A90E2, #2C6B9E);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: 600;
                }

                .blue-text {
                    color: #4A90E2;
                }

                /* Input Styles */
                .input-wrapper {
                    position: relative;
                }

                .input-icon-wrapper {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 2;
                    color: #4A90E2;
                }

                .form-control {
                    height: 52px;
                    border-radius: 15px;
                    border: 2px solid #e0f0ff;
                    background: white;
                    font-size: 14px;
                    padding-left: 50px;
                    transition: all 0.3s;
                }

                .form-control:focus {
                    border-color: #4A90E2;
                    box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.1);
                    outline: none;
                }

                .form-control.is-invalid {
                    border-color: #FF6B6B;
                }

                /* Blue Alert */
                .alert-blue {
                    background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(44, 107, 158, 0.1));
                    border: 2px solid #4A90E2;
                    border-radius: 15px;
                    color: #2C6B9E;
                    padding: 12px 16px;
                }

                .alert-icon {
                    font-size: 20px;
                }

                /* Forgot Password Link */
                .forgot-link {
                    color: #4A90E2;
                    transition: all 0.3s;
                }

                .forgot-link:hover {
                    color: #2C6B9E;
                    text-decoration: underline !important;
                }



                /* Custom Checkbox */
                .custom-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    user-select: none;
                }

                .custom-checkbox input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                }

                .checkmark {
                    position: relative;
                    height: 20px;
                    width: 20px;
                    background: white;
                    border: 2px solid #4A90E2;
                    border-radius: 6px;
                    transition: all 0.3s;
                }

                .custom-checkbox:hover .checkmark {
                    background: rgba(74, 144, 226, 0.1);
                }

                .custom-checkbox input:checked ~ .checkmark {
                    background: linear-gradient(135deg, #4A90E2, #2C6B9E);
                    border-color: transparent;
                }

                .checkmark:after {
                    content: "";
                    position: absolute;
                    display: none;
                }

                .custom-checkbox input:checked ~ .checkmark:after {
                    display: block;
                }

                .custom-checkbox .checkmark:after {
                    left: 6px;
                    top: 2px;
                    width: 5px;
                    height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }

                /* Submit Button */
                .btn-submit {
                    width: 100%;
                    height: 54px;
                    border: none;
                    border-radius: 27px;
                    background: linear-gradient(135deg, #4A90E2, #2C6B9E);
                    color: white;
                    font-weight: 600;
                    font-size: 15px;
                    transition: all 0.3s;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }

                .btn-submit::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        45deg,
                        transparent,
                        rgba(255, 255, 255, 0.3),
                        transparent
                    );
                    transform: rotate(45deg);
                    animation: btnShine 3s infinite;
                }

                @keyframes btnShine {
                    0% { transform: translateX(-100%) rotate(45deg); }
                    20%, 100% { transform: translateX(100%) rotate(45deg); }
                }

                .btn-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(74, 144, 226, 0.4);
                }

                .btn-submit:active:not(:disabled) {
                    transform: translateY(0);
                }

                .btn-submit:disabled {
                    background: linear-gradient(135deg, #a0c0e0, #8098b0);
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 8px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Decorative Waves */
                .decorative-waves {
                    position: relative;
                    margin-top: 20px;
                    height: 20px;
                }

                .wave {
                    position: absolute;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #4A90E2, transparent);
                }

                .wave-1 {
                    width: 100%;
                    top: 0;
                    animation: waveMove 3s infinite;
                }

                .wave-2 {
                    width: 70%;
                    left: 15%;
                    top: 10px;
                    animation: waveMove 3s infinite reverse;
                }

                @keyframes waveMove {
                    0% { opacity: 0.3; width: 0; }
                    50% { opacity: 1; width: 100%; }
                    100% { opacity: 0.3; width: 0; }
                }

                /* Register Link */
                .register-link {
                    animation: fadeInUp 1s;
                }

                .register-link-text {
                    transition: all 0.3s;
                }

                .register-link-text:hover {
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Responsive */
                @media (max-width: 576px) {
                    .login-container {
                        padding: 1rem;
                    }
                    
                    .login-card .card-body {
                        padding: 1.5rem !important;
                    }
                    


                    .decoration {
                        filter: blur(40px);
                    }

                    .decoration-1 {
                        width: 200px;
                        height: 200px;
                    }

                    .decoration-2 {
                        width: 300px;
                        height: 300px;
                    }
                }
            `}</style>
        </>
    )
}