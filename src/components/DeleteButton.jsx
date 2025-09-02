//import service api
import Api from "../services/api";

//import js cookie
import Cookies from "js-cookie";

//import toats
import toast from "react-hot-toast";

//import react-confirm-alert
import { confirmAlert } from 'react-confirm-alert';

//import CSS react-confirm-alert
import 'react-confirm-alert/src/react-confirm-alert.css';

import {
    IconTrash,
    IconAlertTriangle,
    IconX
} from "@tabler/icons-react";

export default function DeleteButton({ id, endpoint, fetchData, namaItem = "data ini" }) {

    // Get token from cookies
    const token = Cookies.get('token');

    // Function to show confirmation dialog
    const confirmDelete = () => {

        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="custom-confirm-ui">
                        <div className="confirm-overlay" onClick={onClose} />
                        <div className="confirm-dialog">
                            <div className="confirm-header">
                                <div className="confirm-icon-wrapper">
                                    <IconAlertTriangle size={32} className="confirm-icon" />
                                </div>
                                <button className="confirm-close-btn" onClick={onClose}>
                                    <IconX size={20} />
                                </button>
                            </div>

                            <div className="confirm-content">
                                <h3>Konfirmasi Penghapusan</h3>
                                <p>Apakah Anda yakin ingin menghapus <strong>{namaItem}</strong>? Tindakan ini tidak dapat dibatalkan dan data akan dihapus secara permanen dari sistem.</p>
                            </div>

                            <div className="confirm-footer">
                                <button
                                    className="confirm-btn confirm-btn-cancel"
                                    onClick={onClose}
                                >
                                    Batal
                                </button>
                                <button
                                    className="confirm-btn confirm-btn-delete"
                                    onClick={() => {
                                        deleteData();
                                        onClose();
                                    }}
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>

                        <style jsx>{`
                            .custom-confirm-ui {
                                position: fixed;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                z-index: 10000;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            
                            .confirm-overlay {
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background-color: rgba(0, 0, 0, 0.5);
                            }
                            
                            .confirm-dialog {
                                background: white;
                                border-radius: 12px;
                                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                                width: 90%;
                                max-width: 450px;
                                z-index: 10001;
                                overflow: hidden;
                                animation: dialog-appear 0.2s ease-out;
                            }
                            
                            @keyframes dialog-appear {
                                from {
                                    opacity: 0;
                                    transform: translateY(-10px) scale(0.95);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0) scale(1);
                                }
                            }
                            
                            .confirm-header {
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 20px 20px 0;
                            }
                            
                            .confirm-icon-wrapper {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                background-color: #fff4f4;
                                color: #e53e3e;
                            }
                            
                            .confirm-close-btn {
                                background: none;
                                border: none;
                                color: #718096;
                                cursor: pointer;
                                padding: 5px;
                                border-radius: 4px;
                                transition: background-color 0.2s;
                            }
                            
                            .confirm-close-btn:hover {
                                background-color: #f7fafc;
                            }
                            
                            .confirm-content {
                                padding: 20px;
                            }
                            
                            .confirm-content h3 {
                                margin: 0 0 12px;
                                color: #2d3748;
                                font-size: 1.5rem;
                                font-weight: 600;
                            }
                            
                            .confirm-content p {
                                margin: 0;
                                color: #4a5568;
                                line-height: 1.5;
                            }
                            
                            .confirm-footer {
                                display: flex;
                                justify-content: flex-end;
                                gap: 12px;
                                padding: 0 20px 20px;
                            }
                            
                            .confirm-btn {
                                padding: 10px 20px;
                                border: none;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.2s;
                            }
                            
                            .confirm-btn-cancel {
                                background-color: #f7fafc;
                                color: #4a5568;
                            }
                            
                            .confirm-btn-cancel:hover {
                                background-color: #edf2f7;
                            }
                            
                            .confirm-btn-delete {
                                background-color: #e53e3e;
                                color: white;
                            }
                            
                            .confirm-btn-delete:hover {
                                background-color: #c53030;
                            }
                        `}</style>
                    </div>
                );
            }
        });
    };

    // Function to handle data deletion
    const deleteData = async () => {
        try {

            // Set authorization header with token
            Api.defaults.headers.common['Authorization'] = token;

            // Call API to delete data
            await Api.delete(`${endpoint}/${id}`)
                .then((response) => {

                    // Show success notification
                    toast.success(`${response.data.meta.message}`, {
                        duration: 5000,
                        position: "top-center",
                        style: {
                            borderRadius: '10px',
                            background: '#48bb78',
                            color: '#fff',
                        },
                        icon: '✅',
                    });

                    // Refresh data after deletion
                    fetchData();
                })
        } catch (error) {

            toast.error("Gagal menghapus data. Silakan coba lagi.", {
                duration: 5000,
                position: "top-center",
                style: {
                    borderRadius: '10px',
                    background: '#f56565',
                    color: '#fff',
                },
                icon: '❌',
            });
        }
    };

    return (
        <button
            className="btn btn-icon btn-sm btn-outline-danger"
            title={`Hapus ${namaItem}`}
            onClick={confirmDelete}
            aria-label={`Hapus ${namaItem}`}
        >
            <IconTrash size={16} />
        </button>
    );

}