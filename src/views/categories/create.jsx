import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";

export default function CategoryCreate({ fetchData }) {
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false); // State untuk loading
    const modalRef = useRef(null);

    const token = Cookies.get("token");

    // Inisialisasi modal setelah komponen dimount
    useEffect(() => {
        if (modalRef.current) {
            const modal = new bootstrap.Modal(modalRef.current);
        }
    }, []);

    const storeCategory = async (e) => {
        e.preventDefault();

        // Reset errors
        setErrors({});

        // Validasi sederhana
        if (!name.trim()) {
            setErrors({ name: "Category name is required" });
            return;
        }

        // Set loading state
        setIsLoading(true);

        // Set authorization header with token
        Api.defaults.headers.common['Authorization'] = token;
        await Api.post('/api/categories', {
            name: name,
        }).then((response) => {
            toast.success(`${response.data.meta.message}`, {
                duration: 4000,
                position: "top-center",
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

            // Hide the modal
            const modalElement = modalRef.current;
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Call function "fetchData"
            fetchData();

            // Reset form
            setName('');

        })
            .catch((error) => {
                handleErrors(error.response.data, setErrors);
            })
            .finally(() => {
                // Reset loading state regardless of success or failure
                setIsLoading(false);
            });
    }

    return (
        <>
            <a href="#" className="btn btn-primary d-sm-inline-block" data-bs-toggle="modal" data-bs-target="#modal-create-category">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 5l0 14" />
                    <path d="M5 12l14 0" />
                </svg>
                Tmabah Data
            </a>

            <div className="modal fade" id="modal-create-category" tabIndex="-1" role="dialog" aria-hidden="true" ref={modalRef}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden', maxWidth: '500px', margin: '0 auto' }}>
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
                        <form onSubmit={storeCategory}>
                            <div className="modal-body p-5 text-center">
                                <div className="mb-4">
                                    <h3 className="fw-bold mb-1">Create New Category</h3>
                                    <p className="text-muted">Add a new category to organize your content</p>
                                </div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder='Enter category name'
                                        style={{ textAlign: 'center' }}
                                        autoFocus
                                        disabled={isLoading} // Disable input saat loading
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback d-block mt-2">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer justify-content-center py-4 border-top-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill px-4"
                                    data-bs-dismiss="modal"
                                    disabled={isLoading} // Disable tombol cancel saat loading
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className="btn btn-primary rounded-pill px-4 ms-3 d-flex align-items-center justify-content-center"
                                    disabled={isLoading} // Disable tombol save saat loading
                                    style={{ minWidth: '140px' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-check me-1" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M5 12l5 5l10 -10" />
                                            </svg>
                                            Save Category
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* CSS untuk styling modal */}
            <style>
                {`
                    .modal-backdrop {
                        z-index: 1040;
                    }
                    #modal-create-category {
                        z-index: 1050;
                    }
                    .modal-content {
                        pointer-events: auto;
                        border: none;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                    }
                    .form-control-lg {
                        padding: 12px 16px;
                        font-size: 16px;
                        border-radius: 12px;
                    }
                    .btn {
                        font-weight: 500;
                    }
                    .btn-primary {
                        background-color: #206bc4;
                        border-color: #206bc4;
                    }
                    .btn-primary:hover {
                        background-color: #1a5aa0;
                        border-color: #1a5aa0;
                    }
                    .btn:disabled {
                        opacity: 0.65;
                        pointer-events: none;
                    }
                    @media (max-width: 576px) {
                        .modal-content {
                            margin: 20px;
                            width: auto;
                        }
                        .modal-body {
                            padding: 2rem 1.5rem !important;
                        }
                    }
                `}
            </style>
        </>
    )
}