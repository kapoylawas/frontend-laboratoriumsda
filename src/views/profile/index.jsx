import LayoutAdmin from '../../layouts/admin'
import Cookies from "js-cookie";
import { useState, useEffect } from 'react';

export default function Profile() {
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const userCookie = Cookies.get("user");
        if (userCookie) {
            try {
                const parsedData = JSON.parse(userCookie);
                setUserData(parsedData);
                setFormData(parsedData);
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSave = () => {
        // Simpan perubahan ke cookies (dalam aplikasi nyata, ini akan disimpan ke API)
        Cookies.set("user", JSON.stringify(formData));
        setUserData(formData);
        setIsEditing(false);
        alert("Profile berhasil diperbarui!");
    };

    const handleCancel = () => {
        setFormData(userData);
        setIsEditing(false);
    };

    if (!userData) {
        return (
            <LayoutAdmin>
                <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    return (
        <LayoutAdmin>
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-10">
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-primary text-white py-3">
                                <h4 className="mb-0 text-center">PROFILE PENGGUNA</h4>
                            </div>
                            <div className="card-body p-4">
                                <div className="row mb-4">
                                    <div className="col-md-4 text-center">
                                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                            style={{ width: "120px", height: "120px" }}>
                                            <span className="text-white fw-bold display-5">
                                                {userData.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <h5 className="fw-bold">{userData.name}</h5>
                                        <span className="badge bg-info">{userData.role.name}</span>
                                    </div>
                                    <div className="col-md-8">
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small mb-1">Nama Lengkap</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="name"
                                                        value={formData.name || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                ) : (
                                                    <p className="fw-semibold">{userData.name}</p>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small mb-1">NIK</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="nik"
                                                        value={formData.nik || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                ) : (
                                                    <p className="fw-semibold">{userData.nik}</p>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small mb-1">Email</label>
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        name="email"
                                                        value={formData.email || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                ) : (
                                                    <p className="fw-semibold">{userData.email}</p>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small mb-1">Nomor Telepon</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="phone"
                                                        value={formData.phone || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                ) : (
                                                    <p className="fw-semibold">{userData.phone}</p>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small mb-1">Jenis Kelamin</label>
                                                {isEditing ? (
                                                    <select
                                                        className="form-select"
                                                        name="gender"
                                                        value={formData.gender || ''}
                                                        onChange={handleInputChange}
                                                    >
                                                        <option value="male">Laki-laki</option>
                                                        <option value="female">Perempuan</option>
                                                    </select>
                                                ) : (
                                                    <p className="fw-semibold text-capitalize">
                                                        {userData.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small mb-1">Status</label>
                                                <p className="fw-semibold">
                                                    {userData.is_active ? (
                                                        <span className="badge bg-success">Aktif</span>
                                                    ) : (
                                                        <span className="badge bg-danger">Tidak Aktif</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted small mb-1">Alamat</label>
                                    {isEditing ? (
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            name="alamat"
                                            value={formData.alamat || ''}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <p className="fw-semibold">{userData.alamat}</p>
                                    )}
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={handleCancel}
                                            >
                                                Batal
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleSave}
                                            >
                                                Simpan Perubahan
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .card {
                    border-radius: 15px;
                    overflow: hidden;
                }
                .card-header {
                    border-radius: 0 !important;
                }
            `}</style>
        </LayoutAdmin>
    )
}