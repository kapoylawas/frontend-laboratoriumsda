import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import { IconEdit, IconFolder, IconCheck, IconX } from "@tabler/icons-react";

export default function CategoryEdit({ fetchData, categoryId }) {
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef(null);

    const token = Cookies.get("token");

    const fetchCategory = async (id) => {
        if (id) {
            try {
                Api.defaults.headers.common['Authorization'] = token;
                const response = await Api.get(`/api/categories/${id}`);
                const category = response.data?.data || {};
                setName(category.name || "");
            } catch (error) {
                console.error("Error fetching category:", error);
            }
        }
    };

    useEffect(() => {
        const modalElement = modalRef.current;
        const handleShowModal = () => {
            fetchCategory(categoryId);
        };

        if (modalElement) {
            modalElement.addEventListener('show.bs.modal', handleShowModal);
        }

        return () => {
            if (modalElement) {
                modalElement.removeEventListener('show.bs.modal', handleShowModal);
            }
        };
    }, [categoryId, token]);

    const updateCategory = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!name.trim()) {
            setErrors({ name: "Nama kategori wajib diisi" });
            return;
        }

        setIsLoading(true);

        try {
            Api.defaults.headers.common['Authorization'] = token;
            const response = await Api.put(`/api/categories/${categoryId}`, {
                name: name.trim(),
            });

            toast.success(response.data?.meta?.message || 'Kategori berhasil diperbarui', {
                duration: 3000,
                position: "top-center",
                style: {
                    border: '2px solid #000',
                    boxShadow: '4px 4px 0px #000',
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold'
                },
            });

            const modalEl = modalRef.current || document.getElementById(`modal-edit-category-${categoryId}`);
            if (modalEl) {
                if (window.bootstrap && window.bootstrap.Modal) {
                    const modalInstance = window.bootstrap.Modal.getInstance(modalEl) || window.bootstrap.Modal.getOrCreateInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                } else {
                    const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
                    if (closeBtn) closeBtn.click();
                }
            }

            setTimeout(() => {
                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('padding-right');
            }, 300);

            fetchData();
        } catch (error) {
            console.error("Error updating category:", error);
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                handleErrors(error.response.data, setErrors);
            } else {
                toast.error(error.response?.data?.meta?.message || "Gagal memperbarui kategori");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className="btn-pop-blue p-1 px-2 fs-7"
                title="Edit Kategori"
                data-bs-toggle="modal"
                data-bs-target={`#modal-edit-category-${categoryId}`}
            >
                <IconEdit size={16} />
            </button>

            <div
                className="modal fade"
                id={`modal-edit-category-${categoryId}`}
                tabIndex="-1"
                aria-hidden="true"
                ref={modalRef}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content" style={{ border: '3px solid #000', boxShadow: '8px 8px 0px #000', borderRadius: '20px' }}>
                        <div className="modal-header bg-light" style={{ borderBottom: '2.5px solid #000' }}>
                            <h5 className="modal-title fw-black text-dark d-flex align-items-center gap-2">
                                <IconFolder size={22} className="text-primary" /> Edit Kategori Layanan
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={updateCategory}>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Nama Kategori <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`form-control py-2 shadow-none ${errors.name ? 'is-invalid' : ''}`}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Masukkan nama kategori"
                                        style={{ border: '2px solid #000', borderRadius: '10px' }}
                                        disabled={isLoading}
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback fw-bold mt-1">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer" style={{ borderTop: '2.5px solid #000' }}>
                                <button
                                    type="button"
                                    className="btn-pop-yellow py-2 px-4"
                                    data-bs-dismiss="modal"
                                    disabled={isLoading}
                                >
                                    <IconX size={18} /> Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-pop-green py-2 px-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Memperbarui...
                                        </>
                                    ) : (
                                        <>
                                            <IconCheck size={18} /> Perbarui Kategori
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}