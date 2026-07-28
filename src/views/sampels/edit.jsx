import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import { IconEdit, IconFlask, IconCheck, IconX } from "@tabler/icons-react";

export default function SampelEdit({ fetchData, sampelsId }) {
    const [categoryID, setCategoryID] = useState("");
    const [parameter, setParameter] = useState("");
    const [priceSell, setPriceSell] = useState("");

    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef(null);

    const token = Cookies.get("token");

    const fetchCategories = async () => {
        Api.defaults.headers.common['Authorization'] = token;
        await Api.get('/api/categories-all')
            .then(response => {
                setCategories(response.data.data || []);
            })
            .catch(() => null);
    }

    const fetchSampel = async (id) => {
        if (id) {
            try {
                Api.defaults.headers.common['Authorization'] = token;
                const response = await Api.get(`/api/sampels/${id}`);
                const sampel = response.data.data;

                setCategoryID(sampel.category_id || "");
                setParameter(sampel.parameter || "");
                setPriceSell(formatRupiah((sampel.price_sell || 0).toString()));
            } catch (error) {
                console.error("Error fetching sampel data:", error);
            }
        }
    };

    useEffect(() => {
        const modalElement = modalRef.current;
        const handleShowModal = () => {
            fetchSampel(sampelsId);
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

    const formatRupiah = (value) => {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue) {
            return new Intl.NumberFormat('id-ID').format(numericValue);
        }
        return '';
    };

    const handlePriceChange = (e) => {
        const formattedValue = formatRupiah(e.target.value);
        setPriceSell(formattedValue);
    };

    const getNumericValue = (formattedValue) => {
        return formattedValue.replace(/\./g, '');
    };

    const updateSampels = async (e) => {
        e.preventDefault();
        setErrors({});

        const newErrors = {};
        if (!categoryID) newErrors.category_id = "Kategori wajib dipilih";
        if (!parameter.trim()) newErrors.parameter = "Nama parameter wajib diisi";
        if (!priceSell) newErrors.price_sell = "Harga tarif wajib diisi";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        Api.defaults.headers.common['Authorization'] = token;
        await Api.put(`/api/sampels/${sampelsId}`, {
            category_id: categoryID,
            parameter: parameter,
            price_sell: getNumericValue(priceSell) || 0,
        }).then((response) => {
            toast.success(`${response.data.meta.message || 'Parameter sampel berhasil diperbarui'}`, {
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

            if (modalRef.current) {
                if (window.bootstrap && window.bootstrap.Modal) {
                    const modalInstance = window.bootstrap.Modal.getInstance(modalRef.current) || new window.bootstrap.Modal(modalRef.current);
                    modalInstance.hide();
                } else {
                    const closeBtn = modalRef.current.querySelector('[data-bs-dismiss="modal"]');
                    if (closeBtn) closeBtn.click();
                }
            }

            fetchData();
        })
            .catch((error) => {
                if (error.response && error.response.data) {
                    handleErrors(error.response.data, setErrors);
                } else {
                    toast.error("Gagal memperbarui sampel");
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <>
            <button
                type="button"
                className="btn-pop-blue p-1 px-2 fs-7"
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
                aria-hidden="true"
                ref={modalRef}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content" style={{ border: '3px solid #000', boxShadow: '8px 8px 0px #000', borderRadius: '20px' }}>
                        <div className="modal-header bg-light" style={{ borderBottom: '2.5px solid #000' }}>
                            <h5 className="modal-title fw-black text-dark d-flex align-items-center gap-2">
                                <IconFlask size={22} className="text-primary" /> Edit Parameter Sampel
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={updateSampels}>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Kategori Layanan <span className="text-danger">*</span></label>
                                    <select
                                        className={`form-select py-2 shadow-none ${errors.category_id ? 'is-invalid' : ''}`}
                                        value={categoryID}
                                        onChange={(e) => setCategoryID(e.target.value)}
                                        style={{ border: '2px solid #000', borderRadius: '10px' }}
                                        disabled={isLoading}
                                    >
                                        <option value="">-- Pilih Kategori --</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && (
                                        <div className="invalid-feedback fw-bold mt-1">
                                            {errors.category_id}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Nama Parameter Pengujian <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`form-control py-2 shadow-none ${errors.parameter ? 'is-invalid' : ''}`}
                                        value={parameter}
                                        onChange={(e) => setParameter(e.target.value)}
                                        placeholder="Nama parameter sampel"
                                        style={{ border: '2px solid #000', borderRadius: '10px' }}
                                        disabled={isLoading}
                                    />
                                    {errors.parameter && (
                                        <div className="invalid-feedback fw-bold mt-1">
                                            {errors.parameter}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-dark">Tarif Pengujian (Rp) <span className="text-danger">*</span></label>
                                    <div className="input-group" style={{ border: '2px solid #000', borderRadius: '10px', overflow: 'hidden' }}>
                                        <span className="input-group-text bg-light border-0 fw-bold">Rp</span>
                                        <input
                                            type="text"
                                            className={`form-control border-0 py-2 shadow-none ${errors.price_sell ? 'is-invalid' : ''}`}
                                            value={priceSell}
                                            onChange={handlePriceChange}
                                            placeholder="50.000"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.price_sell && (
                                        <div className="invalid-feedback fw-bold d-block mt-1">
                                            {errors.price_sell}
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
                                            <IconCheck size={18} /> Perbarui Sampel
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}