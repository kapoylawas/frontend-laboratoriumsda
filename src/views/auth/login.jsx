//import layout auth
import LayoutAuth from '../../layouts/auth'

//import hook react
import { useState, useRef, useEffect } from 'react';

//import hook useNavigate from react router dom
import { Link, useNavigate } from "react-router-dom";

//import store
import { useStore } from '../../stores/user';

export default function Login() {
    //navigate
    const navigate = useNavigate();

    //destruct action "login" from store
    const { login } = useStore();

    //define state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // CAPTCHA state
    const [captchaText, setCaptchaText] = useState('');
    const [userCaptchaInput, setUserCaptchaInput] = useState('');
    const [captchaError, setCaptchaError] = useState('');

    //define state errors
    const [errors, setErrors] = useState({});
    const [loginFailed, setLoginFailed] = useState('');

    // Ref untuk canvas
    const canvasRef = useRef(null);
    const bgCanvasRef = useRef(null);

    // Generate CAPTCHA saat komponen dimount
    useEffect(() => {
        generateCaptcha();
        initLabAnimation();
    }, []);

    // Fungsi untuk animasi background laboratorium
    const initLabAnimation = () => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Lab equipment and elements
        const labElements = [];
        const elementCount = 12; // Kurangi sedikit untuk performa

        // Color palette untuk laboratorium
        const colors = {
            primary: '#4e73df',
            secondary: '#36b9cc',
            accent: '#1cc88a',
            equipment: '#e74a3b',
            glass: 'rgba(255, 255, 255, 0.8)',
            liquid: 'rgba(52, 152, 219, 0.6)'
        };

        // Class untuk elemen laboratorium
        class LabElement {
            constructor(type) {
                this.type = type;
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 40 + 20;
                this.speed = Math.random() * 0.3 + 0.1; // Lebih lambat
                this.angle = Math.random() * Math.PI * 2;
                this.pulse = 0;
                this.pulseSpeed = Math.random() * 0.05 + 0.02;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.01;
            }

            update() {
                // Gerakan floating
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;

                // Rotasi
                this.rotation += this.rotationSpeed;

                // Pulsating effect
                this.pulse += this.pulseSpeed;

                // Boundary check
                if (this.x < -100 || this.x > canvas.width + 100 ||
                    this.y < -100 || this.y > canvas.height + 100) {
                    this.reset();
                    this.x = this.x < 0 ? canvas.width + 50 : -50;
                    this.y = Math.random() * canvas.height;
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);

                const pulseScale = 1 + Math.sin(this.pulse) * 0.1;

                switch (this.type) {
                    case 'microscope':
                        this.drawMicroscope(pulseScale);
                        break;
                    case 'flask':
                        this.drawFlask(pulseScale);
                        break;
                    case 'testtube':
                        this.drawTestTube(pulseScale);
                        break;
                    case 'molecule':
                        this.drawMolecule(pulseScale);
                        break;
                    case 'bacteria':
                        this.drawBacteria(pulseScale);
                        break;
                }

                ctx.restore();
            }

            drawMicroscope(pulseScale) {
                // Base
                ctx.fillStyle = colors.equipment;
                ctx.fillRect(-this.size * 0.3, -this.size * 0.1, this.size * 0.6, this.size * 0.2);

                // Stand
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(-this.size * 0.05, -this.size * 0.4, this.size * 0.1, this.size * 0.3);

                // Microscope body
                ctx.fillStyle = colors.primary;
                ctx.fillRect(-this.size * 0.2, -this.size * 0.6, this.size * 0.4, this.size * 0.2);

                // Lens - dengan efek berkedip
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + Math.sin(this.pulse) * 0.3})`;
                ctx.beginPath();
                ctx.arc(0, -this.size * 0.5, this.size * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }

            drawFlask(pulseScale) {
                // Flask body
                ctx.fillStyle = colors.glass;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 0.3, this.size * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Liquid inside - dengan animasi
                ctx.fillStyle = colors.liquid;
                ctx.beginPath();
                ctx.ellipse(0, this.size * 0.1, this.size * 0.25, this.size * 0.3 * (0.6 + Math.sin(this.pulse) * 0.1), 0, 0, Math.PI * 2);
                ctx.fill();

                // Bubbles
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let i = 0; i < 3; i++) {
                    const bubbleY = this.size * (0.1 + Math.sin(this.pulse + i) * 0.05);
                    ctx.beginPath();
                    ctx.arc(this.size * (Math.sin(this.pulse + i) * 0.1), bubbleY, this.size * 0.03, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            drawTestTube(pulseScale) {
                // Tube body
                ctx.fillStyle = colors.glass;
                ctx.strokeStyle = colors.secondary;
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.roundRect(-this.size * 0.15, -this.size * 0.4, this.size * 0.3, this.size * 0.8, this.size * 0.1);
                ctx.fill();
                ctx.stroke();

                // Liquid
                ctx.fillStyle = colors.accent;
                ctx.beginPath();
                ctx.roundRect(-this.size * 0.12, this.size * 0.2, this.size * 0.24, this.size * 0.2 * (0.8 + Math.sin(this.pulse) * 0.2), this.size * 0.05);
                ctx.fill();
            }

            drawMolecule(pulseScale) {
                // Central atom
                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.1, 0, Math.PI * 2);
                ctx.fill();

                // Bonds dan atoms
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 2;

                for (let i = 0; i < 4; i++) {
                    const angle = this.rotation + (i * Math.PI / 2);
                    const bondLength = this.size * 0.3;
                    const endX = Math.cos(angle) * bondLength;
                    const endY = Math.sin(angle) * bondLength;

                    // Bond line
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    // End atom
                    ctx.fillStyle = i % 2 === 0 ? colors.secondary : colors.accent;
                    ctx.beginPath();
                    ctx.arc(endX, endY, this.size * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            drawBacteria(pulseScale) {
                // Bacteria body
                ctx.fillStyle = colors.accent;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 0.2 * pulseScale, this.size * 0.15 * pulseScale, this.rotation, 0, Math.PI * 2);
                ctx.fill();

                // Flagella
                ctx.strokeStyle = colors.accent;
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const angle = this.rotation + (i * Math.PI * 2 / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    for (let j = 1; j <= 3; j++) {
                        const waveX = Math.cos(angle) * this.size * 0.1 * j + Math.sin(this.pulse * 2 + j) * 5;
                        const waveY = Math.sin(angle) * this.size * 0.1 * j + Math.cos(this.pulse * 2 + j) * 5;
                        ctx.lineTo(waveX, waveY);
                    }
                    ctx.stroke();
                }
            }
        }

        // Create lab elements
        const elementTypes = ['microscope', 'flask', 'testtube', 'molecule', 'bacteria'];
        for (let i = 0; i < elementCount; i++) {
            const type = elementTypes[Math.floor(Math.random() * elementTypes.length)];
            labElements.push(new LabElement(type));
        }

        // Scientist character
        const scientist = {
            x: canvas.width * 0.7,
            y: canvas.height * 0.6,
            size: 80,
            armWave: 0,
            headTilt: 0,
            update: function () {
                this.armWave += 0.05;
                this.headTilt = Math.sin(this.armWave * 0.5) * 0.1;
            },
            draw: function () {
                ctx.save();
                ctx.translate(this.x, this.y);

                // Lab coat body
                ctx.fillStyle = 'white';
                ctx.fillRect(-this.size * 0.2, -this.size * 0.3, this.size * 0.4, this.size * 0.6);

                // Head
                ctx.fillStyle = '#f8d7b7';
                ctx.beginPath();
                ctx.arc(0, -this.size * 0.4, this.size * 0.15, 0, Math.PI * 2);
                ctx.fill();

                // Face features
                ctx.fillStyle = '#2c3e50';
                // Eyes
                ctx.beginPath();
                ctx.arc(-this.size * 0.05, -this.size * 0.42, this.size * 0.02, 0, Math.PI * 2);
                ctx.arc(this.size * 0.05, -this.size * 0.42, this.size * 0.02, 0, Math.PI * 2);
                ctx.fill();

                // Mouth
                ctx.beginPath();
                ctx.arc(0, -this.size * 0.38, this.size * 0.02, 0, Math.PI);
                ctx.stroke();

                // Arms - dengan animasi
                ctx.strokeStyle = 'white';
                ctx.lineWidth = this.size * 0.05;

                // Left arm (memegang sesuatu)
                ctx.beginPath();
                ctx.moveTo(-this.size * 0.2, -this.size * 0.1);
                ctx.lineTo(-this.size * 0.4, -this.size * 0.2 + Math.sin(this.armWave) * 10);
                ctx.stroke();

                // Right arm (menggerakkan mouse/alat)
                ctx.beginPath();
                ctx.moveTo(this.size * 0.2, -this.size * 0.1);
                ctx.lineTo(this.size * 0.4, -this.size * 0.05 + Math.sin(this.armWave + 1) * 5);
                ctx.stroke();

                // Computer monitor di depan scientist
                ctx.fillStyle = '#34495e';
                ctx.fillRect(this.size * 0.3, -this.size * 0.2, this.size * 0.3, this.size * 0.25);

                // Screen dengan data bergerak
                ctx.fillStyle = '#1abc9c';
                for (let i = 0; i < 5; i++) {
                    const height = this.size * 0.02 + Math.sin(this.armWave + i) * this.size * 0.01;
                    ctx.fillRect(
                        this.size * 0.35 + i * this.size * 0.05,
                        -this.size * 0.1 - height / 2,
                        this.size * 0.03,
                        height
                    );
                }

                ctx.restore();
            }
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#f8f9fa');
            gradient.addColorStop(1, '#e9ecef');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw subtle grid lines
            ctx.strokeStyle = 'rgba(78, 115, 223, 0.05)';
            ctx.lineWidth = 1;
            const gridSize = 50;

            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Update and draw lab elements
            labElements.forEach(element => {
                element.update();
                element.draw();
            });

            // Update and draw scientist
            scientist.update();
            scientist.draw();

            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup function
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    };

    // Fungsi untuk menghasilkan CAPTCHA
    const generateCaptcha = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let text = '';
        for (let i = 0; i < 6; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        setCaptchaText(text);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#4e73df');
        gradient.addColorStop(1, '#224abe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 150; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                1.5,
                1.5
            );
        }

        for (let i = 0; i < 8; i++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        ctx.font = 'bold 30px "Arial", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < text.length; i++) {
            const x = 35 + i * 28;
            const y = 30 + Math.random() * 12 - 6;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((Math.random() - 0.5) * 0.3);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }
    };

    // function to handle errors from server
    const handleServerErrors = (errorData) => {
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
    };

    // function "loginHanlder"
    const loginHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setLoginFailed('');
        setCaptchaError('');

        if (userCaptchaInput.toLowerCase() !== captchaText.toLowerCase()) {
            setCaptchaError('Kode keamanan tidak sesuai. Silakan coba lagi.');
            setIsLoading(false);
            generateCaptcha();
            setUserCaptchaInput('');
            return;
        }

        try {
            await login({ email, password });
            navigate('/dashboard');
        } catch (error) {
            setIsLoading(false);
            if (error.response?.data) {
                if (error.response.data.message) {
                    setLoginFailed(error.response.data.message);
                } else {
                    handleServerErrors(error.response.data);
                }
            } else {
                setLoginFailed('Terjadi kesalahan pada server. Silakan coba lagi.');
            }
            generateCaptcha();
            setUserCaptchaInput('');
        }
    };

    return (
        <>
            {/* Background Animation Canvas */}
            <canvas
                ref={bgCanvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1,
                }}
            />

            <div className="container-md">
                <div className="text-center mb-5">
                    <div className="d-flex justify-content-center">
                        <div className="p-4 bg-blue-lt rounded-circle shadow-sm" style={{ backgroundColor: 'rgba(70, 146, 245, 0.1)' }}>
                            <img src="/images/laboratory.png" height="70" alt="Lab Logo" />
                        </div>
                    </div>
                    <h1 className="h2 mt-4 mb-1">Laboratorium Kesehatan Daerah</h1>
                    <p className="text-muted">(Labkesda)</p>
                </div>

                <div className="card card-lg rounded-4 shadow-sm border-0 mx-auto" style={{ maxWidth: '480px' }}>
                    <div className="card-body p-5">
                        <h2 className="h3 text-center mb-4">Selamat datang kembali</h2>
                        <p className="text-center text-muted mb-4">Silakan masuk untuk mengakses akun Anda</p>

                        {(loginFailed || errors.general) && (
                            <div className="alert alert-danger d-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-alert-circle me-2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <div>{loginFailed || errors.general}</div>
                            </div>
                        )}

                        <form onSubmit={loginHandler} autoComplete="off" noValidate>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) {
                                            setErrors(prev => ({ ...prev, email: '' }));
                                            setLoginFailed('');
                                        }
                                    }}
                                    placeholder="your@email.com"
                                    autoFocus
                                />
                                {errors.email && (
                                    <div className="invalid-feedback">
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <label className="form-label">Password</label>
                                    <Link to="/forgot-password" className="form-label-link text-decoration-none">Lupa password?</Link>
                                </div>
                                <input
                                    type="password"
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) {
                                            setErrors(prev => ({ ...prev, password: '' }));
                                            setLoginFailed('');
                                        }
                                    }}
                                    placeholder="Password Anda"
                                />
                                {errors.message && (
                                    <div className="invalid-feedback">
                                        {errors.message}
                                    </div>
                                )}
                            </div>

                            {/* CAPTCHA Section */}
                            <div className="mb-4">
                                <label className="form-label">Kode Keamanan</label>
                                <div className="captcha-wrapper">
                                    <div className="captcha-display-container position-relative flex-shrink-0">
                                        <canvas
                                            ref={canvasRef}
                                            width="330"
                                            height="60"
                                            className="rounded-3 border-0 shadow-sm"
                                        ></canvas>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light position-absolute shadow-sm"
                                            style={{
                                                top: '-8px',
                                                right: '-8px',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #dee2e6',
                                                backgroundColor: 'white'
                                            }}
                                            onClick={generateCaptcha}
                                            title="Refresh CAPTCHA"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6c757d" viewBox="0 0 16 16">
                                                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="captcha-input-container flex-grow-1 mt-2">
                                        <input
                                            type="text"
                                            className={`form-control form-control-lg ${captchaError ? 'is-invalid' : ''}`}
                                            value={userCaptchaInput}
                                            onChange={(e) => {
                                                setUserCaptchaInput(e.target.value);
                                                if (captchaError) setCaptchaError('');
                                            }}
                                            placeholder=" Ketik kode yang terlihat di gambar"
                                            style={{ height: '60px' }}
                                        />
                                        {captchaError && (
                                            <div className="invalid-feedback">
                                                {captchaError}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label className="form-check-label">Ingat saya</label>
                                </div>
                            </div>

                            <div className="form-footer">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-3 rounded-pill fw-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Sedang masuk...
                                        </>
                                    ) : 'Masuk'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="text-center text-muted mt-4">
                    Belum punya akun?{' '}
                    <Link to={"/register"} className="text-decoration-none fw-semibold">Daftar disini</Link>
                </div>
            </div>

            <style jsx>{`
                .container-md {
                    max-width: 520px;
                }
                .card {
                    border: none;
                    background-color: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                }
                .btn-primary {
                    background-color: #4e73df;
                    border-color: #4e73df;
                    transition: all 0.3s;
                }
                .btn-primary:hover {
                    background-color: #3a5ec0;
                    border-color: #3a5ec0;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .form-control {
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #e0e0e0;
                    background: rgba(255, 255, 255, 0.9);
                }
                .form-control:focus {
                    border-color: #4e73df;
                    box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
                    background: white;
                }
                .invalid-feedback {
                    display: block;
                }
                .alert-danger {
                    background-color: #f8d7da;
                    border-color: #f5c6cb;
                    color: #721c24;
                }
                .captcha-display-container {
                    position: relative;
                }
                .captcha-wrapper {
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e9ecef;
                }
                canvas {
                    background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                canvas:hover {
                    transform: scale(1.02);
                }
                .btn-light:hover {
                    background-color: #e9ecef;
                    border-color: #dee2e6;
                }
                
                @media (max-width: 576px) {
                    .card-body {
                        padding: 1.5rem !important;
                    }
                    .captcha-wrapper {
                        padding: 1rem;
                    }
                    .d-flex.align-items-start.gap-3 {
                        flex-direction: column;
                        gap: 1rem !important;
                    }
                    .captcha-display-container {
                        align-self: center;
                    }
                    .captcha-input-container {
                        width: '100%';
                    }
                }
            `}</style>
        </>
    )
}