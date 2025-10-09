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

    // Generate CAPTCHA saat komponen dimount
    useEffect(() => {
        generateCaptcha();
    }, []);

    // Fungsi untuk menghasilkan CAPTCHA
    const generateCaptcha = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Generate random text (huruf dan angka)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let text = '';
        for (let i = 0; i < 6; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        setCaptchaText(text);

        // Background dengan gradien
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#4e73df');
        gradient.addColorStop(1, '#224abe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tambahkan noise (titik-titik)
        for (let i = 0; i < 150; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                1.5,
                1.5
            );
        }

        // Tambahkan garis acak
        for (let i = 0; i < 8; i++) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Tulis teks CAPTCHA
        ctx.font = 'bold 30px "Arial", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Tambahkan distorsi pada posisi dan rotasi huruf
        for (let i = 0; i < text.length; i++) {
            const x = 35 + i * 28;
            const y = 30 + Math.random() * 12 - 6;

            // Rotasi huruf sedikit
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((Math.random() - 0.5) * 0.3);

            // Tambahkan shadow untuk efek 3D
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }
    };

    //function to handle errors from server
    const handleServerErrors = (errorData) => {
        // Handle authorization type error
        if (errorData.error?.type === 'authorization') {
            setLoginFailed(errorData.error.message);
            // Also highlight the specific field if provided
            if (errorData.error.field) {
                setErrors(prev => ({
                    ...prev,
                    [errorData.error.field]: errorData.error.message
                }));
            }
            return;
        }

        // Handle validation errors array
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

    //function "loginHanlder"
    const loginHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setLoginFailed('');
        setCaptchaError('');

        // Validasi CAPTCHA
        if (userCaptchaInput.toLowerCase() !== captchaText.toLowerCase()) {
            setCaptchaError('Kode keamanan tidak sesuai. Silakan coba lagi.');
            setIsLoading(false);
            generateCaptcha(); // Generate CAPTCHA baru
            setUserCaptchaInput(''); // Reset input
            return;
        }

        try {
            //call action "login" from store
            await login({ email, password });
            //redirect to dashboard
            navigate('/dashboard');
        } catch (error) {
            setIsLoading(false);

            if (error.response?.data) {
                if (error.response.data.message) {
                    // Handle general error message
                    setLoginFailed(error.response.data.message);
                } else {
                    // Handle structured errors
                    handleServerErrors(error.response.data);
                }
            } else {
                // Handle network or other errors
                setLoginFailed('Terjadi kesalahan pada server. Silakan coba lagi.');
            }

            // Generate CAPTCHA baru jika login gagal
            generateCaptcha();
            setUserCaptchaInput('');
        }
    };

    return (
        <>
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
                                        // Clear email error when user types
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
                                        // Clear password error when user types
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

                            {/* CAPTCHA Section - Layout yang Lebih Baik */}
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
                    background-color: #fff;
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
                }
                .form-control:focus {
                    border-color: #4e73df;
                    box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
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
                        width: 100%;
                    }
                }
            `}</style>
        </>
    )
}