import { useState } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import { IconFolder, IconX, IconCheck } from "@tabler/icons-react";

export default function CategoryCreate({ fetchData, showModal, setShowModal }) {
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const token = Cookies.get("token");

    const openModal = () => {
        setName("");
        setErrors({});
        setIsLoading(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setName("");
        setErrors({});
    };

    const storeCategory = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!name.trim()) {
            setErrors({ name: "Nama kategori wajib diisi" });
            return;
        }

        setIsLoading(true);
        try {
            Api.defaults.headers.common['Authorization'] = token;
            await Api.post('/api/categories', { name: name.trim() });

            toast.success('Kategori berhasil ditambahkan', {
                duration: 3000,
                position: "top-center",
            });

            closeModal();
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                handleErrors(error.response.data, setErrors);
            } else {
                toast.error(error.response?.data?.meta?.message || "Gagal menambah kategori");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Tombol Trigger di header */}
            <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={openModal}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Kategori
            </button>

            {/* Modal — React state, bukan Bootstrap JS */}
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem"
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div
                        className="bg-white rounded-4 shadow-lg overflow-hidden"
                        style={{ maxWidth: "480px", width: "100%", animation: "soModalFadeIn 0.2s ease-out" }}
                    >
                        {/* Header */}
                        <div
                            className="px-4 py-3 text-white d-flex align-items-center justify-content-between"
                            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ backgroundColor: "rgba(255,255,255,0.2)", width: 40, height: 40, flexShrink: 0 }}
                                >
                                    <IconFolder size={20} color="#fff" />
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold fs-5 text-white">Tambah Kategori Layanan</h5>
                                    <small style={{ color: "rgba(255,255,255,0.85)" }}>Masukkan nama kategori pengujian baru</small>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.15)",
                                    border: "none", borderRadius: "50%",
                                    width: 34, height: 34,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
                            >
                                <IconX size={18} color="#fff" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={storeCategory}>
                            <div className="p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-dark" htmlFor="cat-name">
                                        Nama Kategori <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        id="cat-name"
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Air Minum, Makanan, Usap Alat"
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 bg-light border-top d-flex align-items-center justify-content-between">
                                <button type="button" className="btn btn-outline-secondary px-4" onClick={closeModal} disabled={isLoading}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary px-4" disabled={isLoading}>
                                    {isLoading ? (
                                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Menyimpan...</>
                                    ) : (
                                        <><IconCheck size={16} className="me-1" />Simpan Kategori</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}