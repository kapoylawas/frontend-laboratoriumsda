import React from "react";
import "./EmailInfoCard.css";

const EmailInfoCard = () => {
    return (
        <div className="email-info-card">
            <div className="email-info-header">
                <i className="fas fa-info-circle"></i>
                <h5>Mengapa menggunakan email aktif?</h5>
            </div>
            <div className="email-info-body">
                <ul>
                    <li>
                        <i className="fas fa-check-circle text-success"></i>
                        <span>Verifikasi akun akan dikirim ke email Anda</span>
                    </li>
                    <li>
                        <i className="fas fa-check-circle text-success"></i>
                        <span>Pemulihan akun jika lupa password</span>
                    </li>
                </ul>
                <div className="email-tips">
                    <p className="mb-1"><strong>Pastikan email:</strong></p>
                    <div className="d-flex align-items-center">
                        <i className="fas fa-shield-alt text-primary me-2"></i>
                        <span>Aktif dan dapat diakses</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <i className="fas fa-envelope text-primary me-2"></i>
                        <span>Benar dan valid</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <i className="fas fa-user-check text-primary me-2"></i>
                        <span>Milik pribadi Anda</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailInfoCard;