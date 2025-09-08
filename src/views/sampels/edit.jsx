import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import { IconEdit } from "@tabler/icons-react";

export default function SampelEdit({ fetchData, sampelsId }) {
    const [categoryID, setCategoryID] = useState("");
    const [parameter, setParameter] = useState("");
    const [priceSell, setPriceSell] = useState("");

    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentSampelId, setCurrentSampelId] = useState(null);
    const modalRef = useRef(null);
    const selectRef = useRef(null);

    const token = Cookies.get("token");

    const fetchCategories = async () => {
        // Set authorization header with token
        Api.defaults.headers.common['Authorization'] = token;
        await Api.get('/api/categories-all')
            .then(response => {
                setCategories(response.data.data);
            });
    }

    const fetchSampels = async (id) => {
        if (id) {
            try {
                // Set authorization header with token
                Api.defaults.headers.common['Authorization'] = token;
                const response = await Api.get(`/api/sampels/${id}`);
                const sampel = response.data.data;

                // Set form values from API response
                setCategoryID(sampel.category_id);
                setParameter(sampel.parameter);
                setPriceSell(formatRupiah(sampel.price_sell.toString()));
                setCurrentSampelId(id);
            } catch (error) {
                console.error("There was an error fetching the sampel data!", error);
                toast.error("Failed to fetch sampel data");
            }
        }
    };

    useEffect(() => {
        const modalElement = modalRef.current;

        const handleShowModal = () => {
            fetchSampels(sampelsId);
        };

        if (modalElement) {
            modalElement.addEventListener('show.bs.modal', handleShowModal);
        }

        return () => {
            if (modalElement) {
                modalElement.removeEventListener('show.bs.modal', handleShowModal);
            }
        };
    }, [sampelsId, token]);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Fungsi untuk memformat input menjadi format Rupiah
    const formatRupiah = (value) => {
        // Hapus semua karakter selain angka
        const numericValue = value.replace(/\D/g, '');

        // Format dengan titik sebagai pemisah ribuan
        if (numericValue) {
            return new Intl.NumberFormat('id-ID').format(numericValue);
        }
        return '';
    };

    const handlePriceChange = (e) => {
        const formattedValue = formatRupiah(e.target.value);
        setPriceSell(formattedValue);
    };

    // Fungsi untuk mendapatkan nilai numerik dari format Rupiah
    const getNumericValue = (formattedValue) => {
        return formattedValue.replace(/\./g, '');
    };

    const updateSampels = async (e) => {
        e.preventDefault();

        // Reset errors
        setErrors({});

        // Validasi
        const newErrors = {};
        if (!categoryID) newErrors.category_id = "Category is required";
        if (!parameter.trim()) newErrors.parameter = "Parameter name is required";
        if (!priceSell) newErrors.price_sell = "Price is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Set loading state
        setIsLoading(true);

        // Set authorization header with token
        Api.defaults.headers.common['Authorization'] = token;
        await Api.put(`/api/sampels/${currentSampelId}`, {
            category_id: categoryID,
            parameter: parameter,
            price_sell: getNumericValue(priceSell), // Konversi format Rupiah ke angka
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
            setCategoryID("");
            setParameter("");
            setPriceSell("");
            setCurrentSampelId(null);
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
            <button
                className="btn btn-icon btn-sm btn-outline-primary"
                title="Edit Sampel"
                data-bs-toggle="modal"
                data-bs-target={`#modal-edit-sampel-${sampelsId}`}
            >
                <IconEdit size={16} />
            </button>

            <div
                className="modal fade"
                id={`modal-edit-sampel-${sampelsId}`}
                tabIndex="-1"
                role="dialog"
                aria-hidden="true"
                ref={modalRef}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden', maxWidth: '500px', margin: '0 auto' }}>
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
                        <form onSubmit={updateSampels}>
                            <div className="modal-header bg-light px-4 pt-4 pb-0 border-0">
                                <div className="w-100 text-center">
                                    <h3 className="fw-bold mb-1">Edit Sample</h3>
                                    <p className="text-muted">Update sample information</p>
                                </div>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Category</label>
                                    <select
                                        className={`form-select form-select-lg ${errors.category_id ? 'is-invalid' : ''}`}
                                        value={categoryID}
                                        onChange={(e) => setCategoryID(e.target.value)}
                                        disabled={isLoading}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && (
                                        <div className="invalid-feedback d-block mt-1">
                                            {errors.category_id}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Parameter Name</label>
                                    <input
                                        type="text"
                                        className={`form-control form-control-lg ${errors.parameter ? 'is-invalid' : ''}`}
                                        value={parameter}
                                        onChange={(e) => setParameter(e.target.value)}
                                        placeholder="Enter parameter name"
                                        disabled={isLoading}
                                    />
                                    {errors.parameter && (
                                        <div className="invalid-feedback d-block mt-1">
                                            {errors.parameter}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Price</label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text">Rp</span>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.price_sell ? 'is-invalid' : ''}`}
                                            value={priceSell}
                                            onChange={handlePriceChange}
                                            placeholder="Enter price"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.price_sell && (
                                        <div className="invalid-feedback d-block mt-1">
                                            {errors.price_sell}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer justify-content-center py-4 border-top-0 bg-light">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill px-4"
                                    data-bs-dismiss="modal"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className="btn btn-primary rounded-pill px-4 ms-3 d-flex align-items-center justify-content-center"
                                    disabled={isLoading}
                                    style={{ minWidth: '140px' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-check me-1" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M5 12l5 5l10 -10" />
                                            </svg>
                                            Update Sample
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
                    #modal-edit-sampel-${sampelsId} {
                        z-index: 1050;
                    }
                    .modal-content {
                        pointer-events: auto;
                        border: none;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                    }
                    .form-control-lg, .form-select-lg {
                        padding: 12px 16px;
                        font-size: 16px;
                        border-radius: 12px;
                    }
                    .input-group-lg > .form-control,
                    .input-group-lg > .input-group-text {
                        padding: 12px 16px;
                        font-size: 16px;
                    }
                    .input-group-text {
                        background-color: #f8f9fa;
                        border-radius: 12px 0 0 12px;
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
                    .form-label {
                        margin-bottom: 0.5rem;
                        color: #3b4a5a;
                    }
                    @media (max-width: 576px) {
                        .modal-content {
                            margin: 20px;
                            width: auto;
                        }
                        .modal-body {
                            padding: 1.5rem !important;
                        }
                    }
                `}
            </style>
        </>
    )
}