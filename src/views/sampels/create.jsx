import { useState, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import { IconFlask, IconX, IconCheck } from "@tabler/icons-react";

export default function SampelCreate({ fetchData }) {
    const [showModal, setShowModal] = useState(false);
    const [categoryID, setCategoryID] = useState("");
    const [parameter, setParameter] = useState("");
    const [priceSell, setPriceSell] = useState("");
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const token = Cookies.get("token");

    const fetchCategories = async () => {
        try {
            Api.defaults.headers.common['Authorization'] = token;
            const response = await Api.get('/api/categories-all');
            setCategories(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const formatRupiah = (value) => {
        const numericValue = value.replace(/\D/g, '');
        return numericValue ? new Intl.NumberFormat('id-ID').format(numericValue) : '';
    };

    const openModal = () => {
        setCategoryID("");
        setParameter("");
        setPriceSell("");
        setErrors({});
        setIsLoading(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setCategoryID("");
        setParameter("");
        setPriceSell("");
        setErrors({});
    };

    const storeSampels = async (e) => {
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
        try {
            Api.defaults.headers.common['Authorization'] = token;
            const response = await Api.post('/api/sampels', {
                category_id: categoryID,
                parameter: parameter.trim(),
                price_sell: priceSell.replace(/\./g, '') || 0,
            });

            toast.success(response.data?.meta?.message || 'Parameter berhasil ditambahkan', {
                duration: 3000,
                position: "top-center",
            });

            closeModal();
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                handleErrors(error.response.data, setErrors);
            } else {
                toast.error(error.response?.data?.meta?.message || "Gagal menambahkan sampel");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Tombol Trigger */}
            <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={openModal}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Parameter
            </button>

            {/* Modal — React state, z-index 9999 */}
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
                        padding: "1rem",
                        overflowY: "auto"
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div
                        className="bg-white rounded-4 shadow-lg overflow-hidden"
                        style={{ maxWidth: "520px", width: "100%", animation: "soModalFadeIn 0.2s ease-out" }}
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
                                    <IconFlask size={20} color="#fff" />
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold fs-5 text-white">Tambah Parameter Sampel</h5>
                                    <small style={{ color: "rgba(255,255,255,0.85)" }}>Masukkan parameter dan tarif pengujian</small>
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
                        <form onSubmit={storeSampels}>
                            <div className="p-4">
                                {/* Kategori */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-dark" htmlFor="sp-category">
                                        Kategori Layanan <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        id="sp-category"
                                        className={`form-select ${errors.category_id ? 'is-invalid' : ''}`}
                                        value={categoryID}
                                        onChange={(e) => setCategoryID(e.target.value)}
                                        disabled={isLoading}
                                    >
                                        <option value="">-- Pilih Kategori --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {errors.category_id && <div className="invalid-feedback">{errors.category_id}</div>}
                                </div>

                                {/* Nama Parameter */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-dark" htmlFor="sp-parameter">
                                        Nama Parameter <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        id="sp-parameter"
                                        type="text"
                                        className={`form-control ${errors.parameter ? 'is-invalid' : ''}`}
                                        value={parameter}
                                        onChange={(e) => setParameter(e.target.value)}
                                        placeholder="e.g. pH Air, E. Coli, Timbal (Pb)"
                                        disabled={isLoading}
                                    />
                                    {errors.parameter && <div className="invalid-feedback">{errors.parameter}</div>}
                                </div>

                                {/* Harga */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold text-dark" htmlFor="sp-price">
                                        Tarif Pengujian (Rp) <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">Rp</span>
                                        <input
                                            id="sp-price"
                                            type="text"
                                            className={`form-control ${errors.price_sell ? 'is-invalid' : ''}`}
                                            value={priceSell}
                                            onChange={(e) => setPriceSell(formatRupiah(e.target.value))}
                                            placeholder="50.000"
                                            disabled={isLoading}
                                        />
                                        {errors.price_sell && <div className="invalid-feedback">{errors.price_sell}</div>}
                                    </div>
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
                                        <><IconCheck size={16} className="me-1" />Simpan Parameter</>
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