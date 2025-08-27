import React from "react";

const EmailConfirmationModal = ({ isOpen, onClose, email }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="email-icon-container">
                        <svg width="35" height="35" viewBox="0 0 24 24" fill="#2c5aa0">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                        </svg>
                    </div>
                    <h2>Periksa Email Anda</h2>
                </div>

                <div className="modal-body">
                    <p>
                        Kami telah mengirimkan email aktivasi ke <strong>{email}</strong>.
                    </p>
                    <p>
                        Silakan periksa kotak masuk email Anda dan klik tautan aktivasi untuk
                        mengaktifkan akun.
                    </p>
                    <p className="email-tip">
                        Jika tidak menemukan email, periksa folder spam atau junk mail.
                    </p>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="confirm-button">
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailConfirmationModal;