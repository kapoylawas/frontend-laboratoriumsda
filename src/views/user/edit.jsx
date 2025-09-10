import React, { useState, useRef, useEffect } from 'react';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Api from "../../services/api";
import { handleErrors } from "../../utils/handleErrors";
import {
    IconEdit,
    IconUser,
    IconMail,
    IconId,
    IconPhone,
    IconMapPin,
    IconLock,
    IconEye,
    IconEyeOff
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
                // Set authorization header with token
                Api.defaults.headers.common['Authorization'] = token;
                const response = await Api.get(`/api/users/${id}`);
                const user = response.data.data;

                // Set semua field user ke state (kecuali password)
                setFormData({
                    name: user.name || "",
                    email: user.email || "",
                    nik: user.nik || "",
                    phone: user.phone || "",
                    gender: user.gender || "",
                    alamat: user.alamat || "",
                    password: user.alamat || "",
                });
            } catch (error) {
                console.error("There was an error fetching the user data!", error);
                toast.error("Gagal mengambil data pengguna");
            }
        }
    };

    // Event listener untuk modal show
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

        // Hapus error untuk field ini jika ada
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

        if (!formData.name.trim()) {
            newErrors.name = "Nama lengkap wajib diisi";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email wajib diisi";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Format email tidak valid";
        }

        if (!formData.nik.trim()) {
            newErrors.nik = "NIK wajib diisi";
        } else if (formData.nik.length !== 16) {
            newErrors.nik = "NIK harus 16 digit";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Nomor telepon wajib diisi";
        }

        if (!formData.gender) {
            newErrors.gender = "Jenis kelamin wajib dipilih";
        }

        if (!formData.alamat.trim()) {
            newErrors.alamat = "Alamat wajib diisi";
        }

        // Validasi password hanya jika diisi
        if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = "Password minimal 6 karakter";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updateUser = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Siapkan data untuk dikirim
            // JANGAN menghapus field password meskipun kosong, karena API mungkin mengharuskannya
            const dataToSend = {
                name: formData.name,
                email: formData.email,
                nik: formData.nik,
                phone: formData.phone,
                gender: formData.gender,
                alamat: formData.alamat,
                password: formData.password || null // Kirim null jika password kosong
            };

            // Set authorization header with token
            Api.defaults.headers.common['Authorization'] = token;
            const response = await Api.put(`/api/users/${userId}`, dataToSend);

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

        } catch (error) {
            console.error("Update error:", error);

            // Coba pendekatan alternatif jika dengan null masih error
            if (error.response?.data?.meta?.success === false) {
                try {
                    // Coba tanpa mengirim password jika kosong
                    const dataToSend = {
                        name: formData.name,
                        email: formData.email,
                        nik: formData.nik,
                        phone: formData.phone,
                        gender: formData.gender,
                        alamat: formData.alamat
                    };

                    // Hanya tambahkan password jika diisi
                    if (formData.password) {
                        dataToSend.password = formData.password;
                    }

                    const response = await Api.put(`/api/users/${userId}`, dataToSend);

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
                    return;
                } catch (secondError) {
                    handleErrors(secondError.response?.data, setErrors);
                    toast.error("Gagal memperbarui data pengguna");
                }
            } else {
                handleErrors(error.response?.data, setErrors);
                toast.error("Gagal memperbarui data pengguna");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <button
                className="btn btn-icon btn-sm btn-outline-primary"
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
                role="dialog"
                aria-hidden="true"
                ref={modalRef}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header bg-light">
                            <h5 className="modal-title fw-bold">Edit Data Pengguna</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={updateUser}>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="name" className="form-label">
                                            <IconUser size={18} className="me-2" />
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter name"
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="email" className="form-label">
                                            <IconMail size={18} className="me-2" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter email"
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="nik" className="form-label">
                                            <IconId size={18} className="me-2" />
                                            NIK
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.nik ? 'is-invalid' : ''}`}
                                            id="nik"
                                            name="nik"
                                            value={formData.nik}
                                            onChange={handleInputChange}
                                            placeholder="Enter NIK"
                                            maxLength="16"
                                        />
                                        {errors.nik && (
                                            <div className="invalid-feedback">
                                                {errors.nik}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="phone" className="form-label">
                                            <IconPhone size={18} className="me-2" />
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="Enter phone number"
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback">
                                                {errors.phone}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="gender" className="form-label">
                                            Gender
                                        </label>
                                        <select
                                            className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                        {errors.gender && (
                                            <div className="invalid-feedback">
                                                {errors.gender}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="alamat" className="form-label">
                                            <IconMapPin size={18} className="me-2" />
                                            Alamat
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.alamat ? 'is-invalid' : ''}`}
                                            id="alamat"
                                            name="alamat"
                                            value={formData.alamat}
                                            onChange={handleInputChange}
                                            placeholder="Enter address"
                                        />
                                        {errors.alamat && (
                                            <div className="invalid-feedback">
                                                {errors.alamat}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label htmlFor="password" className="form-label">
                                            <IconLock size={18} className="me-2" />
                                            Password (Optional)
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Leave empty to keep current password"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </button>
                                            {errors.password && (
                                                <div className="invalid-feedback">
                                                    {errors.password}
                                                </div>
                                            )}
                                        </div>
                                        <small className="text-muted">Minimum 6 characters</small>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
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
                    #modal-edit-category {
                        z-index: 1050;
                    }
                    .modal-header {
                        border-bottom: 1px solid #e9ecef;
                        border-top-left-radius: 16px;
                        border-top-right-radius: 16px;
                    }
                    
                    .modal-footer {
                        border-top: 1px solid #e9ecef;
                        border-bottom-left-radius: 16px;
                        border-bottom-right-radius: 16px;
                    }
                    
                    .form-label {
                        font-weight: 500;
                        color: #495057;
                        display: flex;
                        align-items: center;
                    }
                    
                    .form-control, .form-select {
                        border-radius: 8px;
                        padding: 10px 12px;
                    }
                    
                    .form-control:focus, .form-select:focus {
                        box-shadow: 0 0 0 3px rgba(32, 107, 196, 0.15);
                        border-color: #206bc4;
                    }
                    
                    .btn {
                        border-radius: 8px;
                        padding: 8px 16px;
                        font-weight: 500;
                    }
                    
                    .btn-primary {
                        background-color: #206bc4;
                        border-color: #206bc4;
                    }
                    
                    .btn-primary:hover, .btn-primary:focus {
                        background-color: #1a5aa0;
                        border-color: #1a5aa0;
                    }
                    
                    .btn-primary:disabled {
                        background-color: #206bc4;
                        border-color: #206bc4;
                        opacity: 0.65;
                    }
                    
                    @media (max-width: 768px) {
                        .modal-dialog {
                            margin: 20px;
                        }
                    }
                `}
            </style>
        </>
    );
}