//import layout auth
import LayoutAuth from '../../layouts/auth'

//import hook react
import { useState } from 'react';

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

    //define state errors
    const [errors, setErrors] = useState({});
    const [loginFailed, setLoginFailed] = useState('');

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
        }
    };

    return (
        <LayoutAuth>
            <div className="container-sm">
                <div className="text-center mb-5">
                    <div className="d-flex justify-content-center">
                        <div className="p-4 bg-blue-lt rounded-circle shadow-sm" style={{ backgroundColor: 'rgba(70, 146, 245, 0.1)' }}>
                            <img src="/images/laboratory.png" height="70" alt="Lab Logo" />
                        </div>
                    </div>
                    <h1 className="h2 mt-4 mb-1">Laboratorium Kesehatan Daerah</h1>
                    <p className="text-muted">(Labkesda)</p>
                </div>

                <div className="card card-md rounded-4 shadow-sm border-0">
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
                                    className="btn btn-primary w-100 py-2 rounded-pill"
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
                    <Link to={"/register"} className="text-decoration-none">Daftar disini</Link>
                </div>
            </div>

            <style jsx>{`
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
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
                .container-sm {
                    max-width: 420px;
                }
                .invalid-feedback {
                    display: block;
                }
                .alert-danger {
                    background-color: #f8d7da;
                    border-color: #f5c6cb;
                    color: #721c24;
                }
            `}</style>
        </LayoutAuth>
    )
}