import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import {
    IconUserPlus,
    IconEye,
    IconEyeOff
} from "@tabler/icons-react";

export default function UserCreate({ fetchData }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nik: "",
        phone: "",
        gender: "",
        alamat: "",
        role_id: "",
        password: ""
    });
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const modalRef = useRef(null);

    const token = Cookies.get("token");

    const fetchRoles = async () => {
        Api.defaults.headers.common['Authorization'] = token;
        await Api.get('/api/roles-all')
            .then(response => {
                setRoles(response.data.data);
            })
            .catch(error => {
                console.error("Error fetching roles:", error);
                toast.error("Gagal memuat peran pengguna");
            });
    }

    useEffect(() => {
        if (modalRef.current) {
            const modal = new bootstrap.Modal(modalRef.current);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Hapus error ketika pengguna mulai mengetik
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    }

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = "Nama lengkap wajib diisi";
        if (!formData.email.trim()) newErrors.email = "Email wajib diisi";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Format email tidak valid";
        if (!formData.nik.trim()) newErrors.nik = "NIK wajib diisi";
        if (!formData.phone.trim()) newErrors.phone = "Nomor telepon wajib diisi";
        if (!formData.gender) newErrors.gender = "Jenis kelamin wajib dipilih";
        if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";
        if (!formData.role_id) newErrors.role_id = "Peran pengguna wajib dipilih";
        if (!formData.password) newErrors.password = "Kata sandi wajib diisi";
        else if (formData.password.length < 6) newErrors.password = "Kata sandi minimal 6 karakter";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const storeUser = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        Api.defaults.headers.common['Authorization'] = token;
        await Api.post('/api/users', formData)
            .then((response) => {
                toast.success(`${response.data.meta.message}`, {
                    duration: 4000,
                    position: "top-center",
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });

                // Sembunyikan modal
                const modalElement = modalRef.current;
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();

                // Panggil fungsi "fetchData"
                fetchData();

                // Reset form
                setFormData({
                    name: "",
                    email: "",
                    nik: "",
                    phone: "",
                    gender: "",
                    alamat: "",
                    role_id: "",
                    password: ""
                });
            })
            .catch((error) => {
                handleErrors(error.response.data, setErrors);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <>
            <button className="btn btn-primary d-none d-sm-inline-block" data-bs-toggle="modal" data-bs-target="#modal-create-user">
                <IconUserPlus size={18} className="me-1" />
                Tambah Pengguna
            </button>

            <div className="modal fade" id="modal-create-user" tabIndex="-1" role="dialog" aria-hidden="true" ref={modalRef}>
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header bg-light">
                            <h5 className="modal-title fw-bold">Buat Pengguna Baru</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={storeUser}>
                            <div className="modal-body p-4">
                                <p className="text-muted mb-4">Tambahkan pengguna baru untuk mengelola konten Anda</p>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Nama Lengkap <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Masukkan nama lengkap"
                                                disabled={isLoading}
                                            />
                                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Alamat Email <span className="text-danger">*</span></label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Masukkan alamat email"
                                                disabled={isLoading}
                                            />
                                            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">NIK <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.nik ? 'is-invalid' : ''}`}
                                                name="nik"
                                                value={formData.nik}
                                                onChange={handleInputChange}
                                                placeholder="Masukkan NIK"
                                                disabled={isLoading}
                                            />
                                            {errors.nik && <div className="invalid-feedback">{errors.nik}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Nomor Telepon <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Masukkan nomor telepon"
                                                disabled={isLoading}
                                            />
                                            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Jenis Kelamin <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                            >
                                                <option value="">Pilih jenis kelamin</option>
                                                <option value="male">Laki-laki</option>
                                                <option value="female">Perempuan</option>
                                            </select>
                                            {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Peran Pengguna <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select ${errors.role_id ? 'is-invalid' : ''}`}
                                                name="role_id"
                                                value={formData.role_id}
                                                onChange={handleInputChange}
                                                disabled={isLoading}
                                            >
                                                <option value="">Pilih peran pengguna</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                            {errors.role_id && <div className="invalid-feedback">{errors.role_id}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Alamat Lengkap <span className="text-danger">*</span></label>
                                    <textarea
                                        className={`form-control ${errors.alamat ? 'is-invalid' : ''}`}
                                        name="alamat"
                                        value={formData.alamat}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan alamat lengkap"
                                        rows="3"
                                        disabled={isLoading}
                                    ></textarea>
                                    {errors.alamat && <div className="invalid-feedback">{errors.alamat}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Kata Sandi <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Masukkan kata sandi"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                        </button>
                                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                    </div>
                                    <div className="form-text">Kata sandi harus terdiri dari minimal 6 karakter</div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill px-4"
                                    data-bs-dismiss="modal"
                                    disabled={isLoading}
                                >
                                    Batal
                                </button>
                                <button
                                    type='submit'
                                    className="btn btn-primary rounded-pill px-4 d-flex align-items-center justify-content-center"
                                    disabled={isLoading}
                                    style={{ minWidth: '140px' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-check me-1" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M5 12l5 5l10 -10" />
                                            </svg>
                                            Simpan Pengguna
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>
                {`
          .modal-backdrop {
            z-index: 1040;
          }
          #modal-create-user {
            z-index: 1050;
          }
          .modal-content {
            border: none;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          }
          .form-control, .form-select {
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 14px;
          }
          .form-label {
            font-weight: 500;
            margin-bottom: 6px;
            font-size: 14px;
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
          .text-danger {
            color: #dc3545 !important;
          }
          @media (max-width: 768px) {
            .modal-dialog {
              margin: 20px;
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