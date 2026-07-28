import { useState, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import { IconUserPlus, IconX, IconCheck, IconEye, IconEyeOff } from "@tabler/icons-react";

const FORM_INITIAL = {
    name: "", email: "", nik: "", phone: "",
    gender: "", alamat: "", role_id: "", password: ""
};

// Tombol trigger saja — untuk empty state di user/index.jsx
export function UserCreateTrigger({ onClick }) {
    return (
        <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={onClick}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Tambah Pengguna
        </button>
    );
}

export default function UserCreate({ fetchData, showModal, setShowModal }) {
    const [formData, setFormData] = useState(FORM_INITIAL);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const token = Cookies.get("token");

    useEffect(() => {
        Api.defaults.headers.common['Authorization'] = token;
        Api.get('/api/roles-all')
            .then(r => setRoles(r.data.data || []))
            .catch(console.error);
    }, []);

    const openModal = () => {
        setFormData(FORM_INITIAL);
        setErrors({});
        setShowPassword(false);
        setIsLoading(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData(FORM_INITIAL);
        setErrors({});
        setShowPassword(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const e = {};
        if (!formData.name.trim()) e.name = "Nama lengkap wajib diisi";
        if (!formData.email.trim()) e.email = "Email wajib diisi";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Format email tidak valid";
        if (!formData.nik.trim()) e.nik = "NIK wajib diisi";
        if (!formData.phone.trim()) e.phone = "Nomor telepon wajib diisi";
        if (!formData.gender) e.gender = "Jenis kelamin wajib dipilih";
        if (!formData.alamat.trim()) e.alamat = "Alamat wajib diisi";
        if (!formData.role_id) e.role_id = "Peran pengguna wajib dipilih";
        if (!formData.password) e.password = "Kata sandi wajib diisi";
        else if (formData.password.length < 6) e.password = "Kata sandi minimal 6 karakter";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const storeUser = async (ev) => {
        ev.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);

        try {
            Api.defaults.headers.common['Authorization'] = token;
            const response = await Api.post('/api/users', formData);
            toast.success(response.data.meta?.message || 'Pengguna berhasil dibuat', {
                duration: 3000, position: "top-center",
            });
            closeModal();
            fetchData();
        } catch (error) {
            if (error.response?.data) handleErrors(error.response.data, setErrors);
            else toast.error("Gagal membuat pengguna baru");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Tombol Trigger di header */}
            <UserCreateTrigger onClick={openModal} />

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
                        style={{ maxWidth: "700px", width: "100%", maxHeight: "92vh", display: "flex", flexDirection: "column", animation: "soModalFadeIn 0.2s ease-out" }}
                    >
                        {/* Header */}
                        <div
                            className="px-4 py-3 text-white d-flex align-items-center justify-content-between"
                            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", flexShrink: 0 }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ backgroundColor: "rgba(255,255,255,0.2)", width: 40, height: 40, flexShrink: 0 }}>
                                    <IconUserPlus size={20} color="#fff" />
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold fs-5 text-white">Tambah Pengguna Sistem</h5>
                                    <small style={{ color: "rgba(255,255,255,0.85)" }}>Isi data lengkap pengguna baru</small>
                                </div>
                            </div>
                            <button type="button" onClick={closeModal}
                                style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}>
                                <IconX size={18} color="#fff" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={storeUser} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                            <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-name">Nama Lengkap <span className="text-danger">*</span></label>
                                        <input id="u-name" type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            name="name" value={formData.name} onChange={handleInputChange}
                                            placeholder="Nama pengguna" disabled={isLoading} />
                                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-email">Email <span className="text-danger">*</span></label>
                                        <input id="u-email" type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            name="email" value={formData.email} onChange={handleInputChange}
                                            placeholder="email@domain.com" disabled={isLoading} />
                                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-nik">NIK <span className="text-danger">*</span></label>
                                        <input id="u-nik" type="text" className={`form-control ${errors.nik ? 'is-invalid' : ''}`}
                                            name="nik" value={formData.nik} onChange={handleInputChange}
                                            placeholder="Nomor Induk Kependudukan" disabled={isLoading} />
                                        {errors.nik && <div className="invalid-feedback">{errors.nik}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-phone">No. Telepon <span className="text-danger">*</span></label>
                                        <input id="u-phone" type="text" className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            name="phone" value={formData.phone} onChange={handleInputChange}
                                            placeholder="081234567890" disabled={isLoading} />
                                        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-gender">Jenis Kelamin <span className="text-danger">*</span></label>
                                        <select id="u-gender" className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                                            name="gender" value={formData.gender} onChange={handleInputChange} disabled={isLoading}>
                                            <option value="">-- Pilih --</option>
                                            <option value="male">Laki-laki</option>
                                            <option value="female">Perempuan</option>
                                        </select>
                                        {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-role">Peran / Role <span className="text-danger">*</span></label>
                                        <select id="u-role" className={`form-select ${errors.role_id ? 'is-invalid' : ''}`}
                                            name="role_id" value={formData.role_id} onChange={handleInputChange} disabled={isLoading}>
                                            <option value="">-- Pilih Role --</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                        {errors.role_id && <div className="invalid-feedback">{errors.role_id}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-alamat">Alamat Lengkap <span className="text-danger">*</span></label>
                                        <textarea id="u-alamat" className={`form-control ${errors.alamat ? 'is-invalid' : ''}`}
                                            name="alamat" value={formData.alamat} onChange={handleInputChange}
                                            placeholder="Alamat domisili" rows="2" disabled={isLoading}></textarea>
                                        {errors.alamat && <div className="invalid-feedback">{errors.alamat}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-dark" htmlFor="u-password">Kata Sandi <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <input id="u-password" type={showPassword ? "text" : "password"}
                                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                name="password" value={formData.password} onChange={handleInputChange}
                                                placeholder="Minimal 6 karakter" disabled={isLoading} />
                                            <button type="button" className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                                                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </button>
                                            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 bg-light border-top d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
                                <button type="button" className="btn btn-outline-secondary px-4" onClick={closeModal} disabled={isLoading}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary px-4" disabled={isLoading}>
                                    {isLoading ? (
                                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Menyimpan...</>
                                    ) : (
                                        <><IconCheck size={16} className="me-1" />Simpan Pengguna</>
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