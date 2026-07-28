import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import {
    IconEdit,
    IconUser,
    IconEye,
    IconEyeOff,
    IconCheck,
    IconX
} from "@tabler/icons-react";

export default function UserEdit({ fetchData, userId }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nik: "",
        phone: "",
        gender: "",
        alamat: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const modalRef = useRef(null);

    const token = Cookies.get("token");

    const fetchUser = async (id) => {
        if (id) {
            try {
                Api.defaults.headers.common['Authorization'] = token;
                const response = await Api.get(`/api/users/${id}`);
                const user = response.data.data;

                setFormData({
                    name: user.name || "",
                    email: user.email || "",
                    nik: user.nik || "",
                    phone: user.phone || "",
                    gender: user.gender || "",
                    alamat: user.alamat || "",
                    password: "",
                });
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        }
    };

    useEffect(() => {
        const modalElement = modalRef.current;
        const handleShowModal = () => {
            fetchUser(userId);
        };

        if (modalElement) {
            modalElement.addEventListener('show.bs.modal', handleShowModal);
        }

        return () => {
            if (modalElement) {
                modalElement.removeEventListener('show.bs.modal', handleShowModal);
            }
        };
    }, [userId, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = "Nama lengkap wajib diisi";
        if (!formData.email.trim()) newErrors.email = "Email wajib diisi";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Format email tidak valid";
        if (!formData.nik.trim()) newErrors.nik = "NIK wajib diisi";
        if (!formData.phone.trim()) newErrors.phone = "Nomor telepon wajib diisi";
        if (!formData.gender) newErrors.gender = "Jenis kelamin wajib dipilih";
        if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";

        if (formData.password && formData.password.length < 6) {
            newErrors.password = "Password minimal 6 karakter";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updateUser = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const dataToSend = {
                name: formData.name,
                email: formData.email,
                nik: formData.nik,
                phone: formData.phone,
                gender: formData.gender,
                alamat: formData.alamat,
            };

            if (formData.password) {
                dataToSend.password = formData.password;
            }

            Api.defaults.headers.common['Authorization'] = token;
            const response = await Api.put(`/api/users/${userId}`, dataToSend);

            toast.success(`${response.data.meta.message || 'Data pengguna berhasil diperbarui'}`, {
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

        } catch (error) {
            if (error.response && error.response.data) {
                handleErrors(error.response.data, setErrors);
            } else {
                toast.error("Gagal memperbarui data pengguna");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className="btn-pop-blue p-1 px-2 fs-7"
                title="Edit User"
                data-bs-toggle="modal"
                data-bs-target={`#modal-edit-user-${userId}`}
            >
                <IconEdit size={16} />
            </button>

            <div
                className="modal fade"
                id={`modal-edit-user-${userId}`}
                tabIndex="-1"
                aria-hidden="true"
                ref={modalRef}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content" style={{ border: '3px solid #000', boxShadow: '8px 8px 0px #000', borderRadius: '20px' }}>
                        <div className="modal-header bg-light" style={{ borderBottom: '2.5px solid #000' }}>
                            <h5 className="modal-title fw-black text-dark d-flex align-items-center gap-2">
                                <IconUser size={22} className="text-primary" /> Edit Data Pengguna
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={updateUser}>
                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark">Nama Lengkap <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`form-control py-2 shadow-none ${errors.name ? 'is-invalid' : ''}`}
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Masukkan nama"
                                            style={{ border: '2px solid #000', borderRadius: '10px' }}
                                            disabled={loading}
                                        />
                                        {errors.name && <div className="invalid-feedback fw-bold">{errors.name}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark">Alamat Email <span className="text-danger">*</span></label>
                                        <input
                                            type="email"
                                            className={`form-control py-2 shadow-none ${errors.email ? 'is-invalid' : ''}`}
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="email@domain.com"
                                            style={{ border: '2px solid #000', borderRadius: '10px' }}
                                            disabled={loading}
                                        />
                                        {errors.email && <div className="invalid-feedback fw-bold">{errors.email}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark">NIK <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`form-control py-2 shadow-none ${errors.nik ? 'is-invalid' : ''}`}
                                            name="nik"
                                            value={formData.nik}
                                            onChange={handleInputChange}
                                            placeholder="NIK 16 digit"
                                            style={{ border: '2px solid #000', borderRadius: '10px' }}
                                            disabled={loading}
                                        />
                                        {errors.nik && <div className="invalid-feedback fw-bold">{errors.nik}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark">Nomor Telepon <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`form-control py-2 shadow-none ${errors.phone ? 'is-invalid' : ''}`}
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="081234567890"
                                            style={{ border: '2px solid #000', borderRadius: '10px' }}
                                            disabled={loading}
                                        />
                                        {errors.phone && <div className="invalid-feedback fw-bold">{errors.phone}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark">Jenis Kelamin <span className="text-danger">*</span></label>
                                        <select
                                            className={`form-select py-2 shadow-none ${errors.gender ? 'is-invalid' : ''}`}
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            style={{ border: '2px solid #000', borderRadius: '10px' }}
                                            disabled={loading}
                                        >
                                            <option value="">-- Pilih Jenis Kelamin --</option>
                                            <option value="male">Laki-laki</option>
                                            <option value="female">Perempuan</option>
                                        </select>
                                        {errors.gender && <div className="invalid-feedback fw-bold">{errors.gender}</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-dark">Kata Sandi Baru <small className="text-muted fw-normal">(Opsional)</small></label>
                                        <div className="input-group" style={{ border: '2px solid #000', borderRadius: '10px', overflow: 'hidden' }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className={`form-control border-0 py-2 shadow-none ${errors.password ? 'is-invalid' : ''}`}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Kosongkan jika tidak diubah"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-light border-0 px-3"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={loading}
                                            >
                                                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && <div className="invalid-feedback fw-bold d-block mt-1">{errors.password}</div>}
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-bold text-dark">Alamat Lengkap <span className="text-danger">*</span></label>
                                        <textarea
                                            className={`form-control py-2 shadow-none ${errors.alamat ? 'is-invalid' : ''}`}
                                            name="alamat"
                                            value={formData.alamat}
                                            onChange={handleInputChange}
                                            placeholder="Alamat domisili"
                                            rows="2"
                                            style={{ border: '2px solid #000', borderRadius: '10px' }}
                                            disabled={loading}
                                        ></textarea>
                                        {errors.alamat && <div className="invalid-feedback fw-bold">{errors.alamat}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ borderTop: '2.5px solid #000' }}>
                                <button
                                    type="button"
                                    className="btn-pop-yellow py-2 px-4"
                                    data-bs-dismiss="modal"
                                    disabled={loading}
                                >
                                    <IconX size={18} /> Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn-pop-green py-2 px-4"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Memperbarui...
                                        </>
                                    ) : (
                                        <>
                                            <IconCheck size={18} /> Perbarui Pengguna
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