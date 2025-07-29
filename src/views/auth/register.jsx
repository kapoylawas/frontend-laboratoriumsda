//import layout auth
import LayoutAuth from '../../layouts/auth'

//import hook react
import React, { useState } from 'react';

//import hook useNavigate from react router dom
import { Link, useNavigate } from "react-router-dom";

//import toats
import toast from "react-hot-toast";

//import handler error
import { handleErrors } from "../../utils/handleErrors";
import Api from '../../services/api';

export default function Register() {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    //state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nik: "",
        phone: "",
        gender: "",
        alamat: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,13}$/;
        const nikRegex = /^[0-9]{16}$/;

        if (!formData.name.trim()) newErrors.name = "Nama lengkap wajib diisi";
        if (!formData.email) {
            newErrors.email = "Email wajib diisi";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Format email tidak valid";
        }
        if (!formData.nik) {
            newErrors.nik = "NIK wajib diisi";
        } else if (!nikRegex.test(formData.nik)) {
            newErrors.nik = "NIK harus 16 digit angka";
        }
        if (!formData.phone) {
            newErrors.phone = "Nomor telepon wajib diisi";
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "Nomor telepon harus 10-13 digit angka";
        }
        if (!formData.gender) {
            newErrors.gender = "Jenis kelamin wajib dipilih";
        } else if (!['male', 'female'].includes(formData.gender)) {
            newErrors.gender = "Pilih jenis kelamin yang valid";
        }
        if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";
        if (!formData.password) {
            newErrors.password = "Password wajib diisi";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password minimal 8 karakter";
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Password tidak cocok";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    //function "storeUser"
    const storeRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Log data sebelum dikirim untuk debugging
            console.log('Data yang dikirim:', {
                ...formData,
                password: '***' // Jangan log password sebenarnya
            });

            // Pastikan gender dikirim dalam format yang benar (uppercase/lowercase)
            const payload = {
                name: formData.name,
                email: formData.email,
                nik: formData.nik,
                phone: formData.phone,
                gender: formData.gender,
                alamat: formData.alamat,
                password: formData.password
            };

            const response = await Api.post('/api/register', payload);

            // Show success toast
            toast.success(`${response.data.meta.message}`, {
                duration: 8000,
                position: "top-center",
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

            // Reset form
            setFormData({
                name: "",
                email: "",
                nik: "",
                phone: "",
                gender: "",
                alamat: "",
                password: "",
                confirmPassword: ""
            });

            // Redirect to login
            navigate('/');

        } catch (error) {
            if (error.response) {
                // Handle 422 Unprocessable Entity khusus
                if (error.response.status === 422) {
                    // Jika backend mengembalikan error validasi
                    if (error.response.data.errors) {
                        setErrors(error.response.data.errors);
                    } else {
                        // Format error default
                        handleErrors(error.response.data, setErrors);
                    }

                    // Log error untuk debugging
                    console.error('Validation errors:', error.response.data);
                } else {
                    // Handle error lainnya
                    handleErrors(error.response.data, setErrors);
                }
            } else if (error.request) {
                // Request dikirim tapi tidak ada response
                toast.error("Tidak ada respon dari server");
                console.error('No response:', error.request);
            } else {
                // Error lainnya
                toast.error("Terjadi kesalahan jaringan");
                console.error('Error:', error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }


    return (
        <LayoutAuth>
            <div className="container-sm">
                <div className="text-center mb-5">
                    <div className="text-center mb-5">
                        <div className="d-flex justify-content-center">
                            <div className="p-4 bg-blue-lt rounded-circle shadow-sm" style={{
                                backgroundColor: 'rgba(70, 146, 245, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <img src="/images/laboratory.png" height="70" alt="Lab Logo" />
                            </div>
                        </div>
                        <h1 className="h2 mt-4 mb-2 text-primary">Laboratorium Kesehatan Daerah <br /> Kabupaten Sidoarjo</h1>
                        <h2 className="h3 text-gradient text-info mb-1">Pendaftaran Akun Baru</h2>
                        <p className="text-muted">Daftarkan diri Anda untuk mengakses layanan kami</p>
                    </div>
                </div>

                <div className="card card-md rounded-4 shadow-sm border-0" style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="card-body p-5">
                        <form onSubmit={storeRegister} autoComplete="off" noValidate>
                            <div className="mb-4">
                                <label className="form-label">Nama Lengkap</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    placeholder="Nama Lengkap"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    placeholder="your@email.com"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label">NIK</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.nik ? 'is-invalid' : ''}`}
                                        placeholder="16 digit NIK"
                                        name="nik"
                                        value={formData.nik}
                                        onChange={handleChange}
                                    />
                                    {errors.nik && <div className="invalid-feedback">{errors.nik}</div>}
                                </div>

                                <div className="col-md-6 mb-4">
                                    <label className="form-label">No. Telepon</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                        placeholder="081234567890"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Jenis Kelamin</label>
                                <select
                                    className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Pilih Jenis Kelamin</option>
                                    <option value="male">Laki-laki</option>
                                    <option value="female">Perempuan</option>
                                </select>
                                {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Alamat Lengkap</label>
                                <textarea
                                    className={`form-control ${errors.alamat ? 'is-invalid' : ''}`}
                                    placeholder="Alamat Lengkap"
                                    rows="3"
                                    name="alamat"
                                    value={formData.alamat}
                                    onChange={handleChange}
                                ></textarea>
                                {errors.alamat && <div className="invalid-feedback">{errors.alamat}</div>}
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                        placeholder="Minimal 8 karakter"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                </div>

                                <div className="col-md-6 mb-4">
                                    <label className="form-label">Konfirmasi Password</label>
                                    <input
                                        type="password"
                                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                        placeholder="Ulangi password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2 rounded-pill shadow-sm"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Memproses...
                                        </>
                                    ) : (
                                        "Daftar Sekarang"
                                    )}
                                </button>
                            </div>

                            <div className="text-center mt-4">
                                <p className="text-muted">Sudah punya akun? <Link to={"/"} className="text-primary">Masuk disini</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </LayoutAuth>
    )
}