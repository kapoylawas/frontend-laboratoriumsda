import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Aktifasi() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("memproses"); // memproses, berhasil, gagal
    const [message, setMessage] = useState("Sedang mengaktifkan akun Anda...");
    const [detailError, setDetailError] = useState("");
    const [countdown, setCountdown] = useState(30); // Hitung mundur 30 detik

    useEffect(() => {
        const activateAccount = async () => {
            // Validasi format token
            if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
                setStatus("gagal");
                setMessage("Token aktivasi tidak valid");
                setDetailError("Format token tidak sesuai dengan yang diharapkan");
                return;
            }

            try {
                const response = await fetch(`https://api-lab.sidoarjokab.go.id/api/activate/${token}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json();

                if (response.ok && data.meta.success) {
                    setStatus("berhasil");
                    setMessage(data.meta.message || "Akun Anda berhasil diaktifkan!");

                    // Hitung mundur dan redirect ke halaman login setelah 30 detik
                    const countdownInterval = setInterval(() => {
                        setCountdown((prev) => {
                            if (prev <= 1) {
                                clearInterval(countdownInterval);
                                navigate("/");
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);

                    // Cleanup function untuk clear interval
                    return () => clearInterval(countdownInterval);
                } else {
                    setStatus("gagal");
                    setMessage(data.meta?.message || "Aktivasi akun gagal");
                    setDetailError(data.error_details || "");
                }
            } catch (error) {
                setStatus("gagal");
                setMessage("Terjadi kesalahan jaringan");
                setDetailError("Silakan coba lagi nanti atau hubungi administrator");
            }
        };

        if (token) {
            activateAccount();
        } else {
            setStatus("gagal");
            setMessage("Token aktivasi tidak ditemukan");
            setDetailError("URL yang Anda akses tidak mengandung token aktivasi yang valid");
        }
    }, [token, navigate]);

    const renderContent = () => {
        switch (status) {
            case "berhasil":
                return (
                    <div className="text-center">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" className="bi bi-check-circle-fill text-success" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                            </svg>
                        </div>
                        <h4 className="display-6 fw-bold text-success">AKTIVASI BERHASIL</h4>
                        <p className="lead">{message}</p>
                        <div className="mt-4">
                            <p>Anda akan diarahkan ke halaman login dalam
                                <span className="countdown-text fw-bold text-danger mx-1" style={{ fontSize: '1.5rem' }}>
                                    {countdown}
                                </span>
                                detik.
                            </p>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                                <div
                                    className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                                    style={{ width: `${(countdown / 30) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="mt-3">
                            <button
                                className="btn btn-outline-success me-2"
                                onClick={() => navigate("/")}
                            >
                                Login Sekarang
                            </button>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => navigate("/")}
                            >
                                Ke Halaman Utama
                            </button>
                        </div>
                    </div>
                );

            case "gagal":
                return (
                    <div className="text-center">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" className="bi bi-x-circle-fill text-danger" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                            </svg>
                        </div>
                        <h4 className="display-6 fw-bold text-danger">AKTIVASI GAGAL</h4>
                        <p className="lead">{message}</p>
                        {detailError && (
                            <div className="alert alert-warning mt-3" role="alert">
                                <strong>Detail Error:</strong> {detailError}
                            </div>
                        )}
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate("/")}
                            >
                                Kembali ke Login
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => window.location.reload()}
                            >
                                Coba Lagi
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center">
                        <div className="mb-4">
                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                                <span className="visually-hidden">Memproses...</span>
                            </div>
                        </div>
                        <h4 className="display-6 fw-bold">SEDANG MEMPROSES</h4>
                        <p className="lead">{message}</p>
                        <div className="mt-3">
                            <p>Token: <code className="bg-light p-1 rounded">{token}</code></p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="p-5 mb-4 bg-light rounded-3 shadow-sm">
                        <div className="container-fluid py-5">
                            {renderContent()}
                        </div>
                    </div>

                    {/* Informasi tambahan */}
                    <div className="card mt-4">
                        <div className="card-body">
                            <h5 className="card-title">Butuh Bantuan?</h5>
                            <p className="card-text">
                                Jika Anda mengalami masalah dalam proses aktivasi, silakan hubungi tim support kami di:
                            </p>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">Email: support@sidoarjokab.go.id</li>
                                <li className="list-group-item">Telepon: (021) 1234-5678</li>
                                <li className="list-group-item">Jam Operasional: Senin - Jumat, 08:00 - 16:00 WIB</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .progress-bar {
                    transition: width 1s ease-in-out;
                }
                .card {
                    border: none;
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
                }
                .list-group-item {
                    background-color: transparent;
                    border: none;
                    padding: 0.5rem 1rem;
                }
                .countdown-text {
                    display: inline-block;
                    min-width: 30px;
                    text-align: center;
                    animation: pulse 0.5s ease-in-out;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}