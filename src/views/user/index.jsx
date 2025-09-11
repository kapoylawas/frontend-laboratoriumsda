import { useState, useEffect } from "react";
import LayoutAdmin from "../../layouts/admin";
import Cookies from "js-cookie";
import Api from "../../services/api";
import PaginationComponent from "../../components/Pagination";
import {
    IconSearch,
    IconRefresh,
    IconUser,
    IconMail,
    IconPhone,
    IconMapPin,
    IconGenderMale,
    IconGenderFemale,
    IconUserPlus,
    IconUserCheck,
    IconUserOff,
    IconLicense,
    IconPower,
    IconCircleCheck,
    IconCircleX // Icon untuk notifikasi error
} from "@tabler/icons-react";
import UserEdit from "./edit";
import DeleteButton from "../../components/DeleteButton";
import UserCreate from "./create";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 0,
        total: 0
    });
    const [keywords, setKeywords] = useState("");
    const [roles, setRoles] = useState([]);
    const [activatingUser, setActivatingUser] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Fetch roles data
    useEffect(() => {
        const fetchRoles = async () => {
            const token = Cookies.get("token");
            if (token) {
                Api.defaults.headers.common["Authorization"] = token;
                try {
                    const response = await Api.get('/api/roles-all');
                    setRoles(response.data.data);
                } catch (error) {
                    console.error("Error fetching roles:", error);
                }
            }
        };

        fetchRoles();
    }, []);

    const fetchData = async (pageNumber = 1, keywords = "") => {
        setIsLoading(true);
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                let queryParams = `page=${pageNumber}&search=${keywords}`;
                const response = await Api.get(`/api/users?${queryParams}`);

                setUsers(response.data.data);
                setPagination({
                    currentPage: response.data.pagination.currentPage,
                    perPage: response.data.pagination.perPage,
                    total: response.data.pagination.total
                });
            } catch (error) {
                console.error("There was an error fetching the data!", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            console.error("Token is not available!");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const searchHandlder = () => {
        fetchData(1, keywords);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            searchHandlder();
        }
    };

    const resetSearch = () => {
        setKeywords("");
        fetchData(1, "");
    };

    // Fungsi untuk mengaktifkan pengguna
    const activateUser = async (userId) => {
        setActivatingUser(userId);
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                await Api.put(`/api/aktifUsers/${userId}`);

                setUsers(users.map(user =>
                    user.id === userId ? { ...user, is_active: true } : user
                ));

                setShowSuccessModal(true);

            } catch (error) {
                console.error("Error activating user:", error);
                setErrorMessage("Gagal mengaktifkan pengguna. Silakan coba lagi.");
                setShowErrorModal(true);
            } finally {
                setActivatingUser(null);
            }
        }
    };

    // Count users by status and role based on actual data
    const activeUsersCount = users.filter(user => user.is_active).length;
    const inactiveUsersCount = users.filter(user => !user.is_active).length;

    return (
        <LayoutAdmin>
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle">Manajemen</div>
                            <h2 className="page-title">Data Pengguna</h2>
                        </div>
                        <div className="col-auto ms-auto d-print-none">
                            <div className="btn-list">
                                <UserCreate fetchData={fetchData} />
                                <button
                                    onClick={() => fetchData()}
                                    className="btn btn-outline-primary"
                                    disabled={isLoading}
                                >
                                    <IconRefresh size={18} className="me-1" />
                                    {isLoading ? "Memuat..." : "Refresh"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="container-xl">
                    {/* Search Card */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h3 className="card-title">
                                Pencarian Pengguna
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-8">
                                    <label className="form-label">Cari Pengguna</label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <IconSearch size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={keywords}
                                            onChange={(e) => setKeywords(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Cari berdasarkan nama, email, atau telepon..."
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4 d-flex align-items-end">
                                    <div className="btn-group w-100">
                                        <button
                                            onClick={searchHandlder}
                                            className="btn btn-primary"
                                            disabled={isLoading}
                                        >
                                            <IconSearch size={18} className="me-1" />
                                            {isLoading ? "Mencari..." : "Cari"}
                                        </button>

                                        {keywords && (
                                            <button
                                                onClick={resetSearch}
                                                className="btn btn-outline-secondary"
                                                disabled={isLoading}
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="row row-deck row-cards mb-4">
                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <span className="bg-primary text-white avatar">
                                                <IconUser size={24} />
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">
                                                {pagination.total} Pengguna
                                            </div>
                                            <div className="text-muted">
                                                Total pengguna terdaftar
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <span className="bg-green text-white avatar">
                                                <IconUserCheck size={24} />
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">
                                                {activeUsersCount} Aktif
                                            </div>
                                            <div className="text-muted">
                                                Pengguna aktif
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <span className="bg-red text-white avatar">
                                                <IconUserOff size={24} />
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">
                                                {inactiveUsersCount} Nonaktif
                                            </div>
                                            <div className="text-muted">
                                                Pengguna nonaktif
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <span className="bg-blue text-white avatar">
                                                <IconLicense size={24} />
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">
                                                {roles.length} Role
                                            </div>
                                            <div className="text-muted">
                                                Jumlah role tersedia
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Daftar Pengguna</h3>
                            <div className="card-actions">
                                <span className="badge bg-primary-lt ms-2">
                                    {pagination.total} items
                                </span>
                            </div>
                        </div>

                        <div className="table-responsive">
                            {isLoading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2">Memuat data pengguna...</p>
                                </div>
                            ) : (
                                <>
                                    <table className="table table-vcenter table-hover table-nowrap card-table">
                                        <thead>
                                            <tr>
                                                <th>Pengguna</th>
                                                <th>Kontak</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th className="text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.length > 0 ? (
                                                users.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <span className={`avatar ${user.gender === 'male' ? 'bg-blue-lt' : 'bg-pink-lt'} me-3`}>
                                                                    {user.gender === 'male' ?
                                                                        <IconGenderMale /> :
                                                                        <IconGenderFemale />
                                                                    }
                                                                </span>
                                                                <div>
                                                                    <div className="font-weight-medium">{user.name}</div>
                                                                    <div className="text-muted text-h5">
                                                                        {user.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex flex-column">
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <IconMail size={16} className="text-muted me-2" />
                                                                    <span>{user.email}</span>
                                                                </div>
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <IconPhone size={16} className="text-muted me-2" />
                                                                    <span>{user.phone || '-'}</span>
                                                                </div>
                                                                {user.alamat && (
                                                                    <div className="d-flex align-items-center">
                                                                        <IconMapPin size={16} className="text-muted me-2" />
                                                                        <span className="text-truncate" style={{ maxWidth: '200px' }} title={user.alamat}>
                                                                            {user.alamat}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${user.role_id === 1 ? 'bg-blue-lt' : 'bg-cyan-lt'} py-1 px-2`}>
                                                                {user.role?.name || 'Tidak ada role'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${user.is_active ? 'bg-success-lt' : 'bg-danger-lt'} py-1 px-2`}>
                                                                {user.is_active ? (
                                                                    <>
                                                                        <IconUserCheck size={14} className="me-1" />
                                                                        Aktif
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <IconUserOff size={14} className="me-1" />
                                                                        Nonaktif
                                                                    </>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="btn-list justify-content-center">
                                                                <UserEdit userId={user.id} fetchData={fetchData} />

                                                                {!user.is_active && (
                                                                    <button
                                                                        className="btn btn-icon btn-sm btn-outline-success"
                                                                        title="Aktifkan pengguna"
                                                                        onClick={() => activateUser(user.id)}
                                                                        disabled={activatingUser === user.id}
                                                                    >
                                                                        {activatingUser === user.id ? (
                                                                            <div className="spinner-border spinner-border-sm" role="status"></div>
                                                                        ) : (
                                                                            <IconPower size={16} />
                                                                        )}
                                                                    </button>
                                                                )}

                                                                <DeleteButton id={user.id} endpoint="/api/users" fetchData={fetchData} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-5">
                                                        <div className="d-flex flex-column align-items-center">
                                                            <div className="bg-azure-lt p-4 rounded-circle mb-3">
                                                                <IconSearch size={32} className="text-azure" />
                                                            </div>
                                                            <h3 className="h5">Data tidak ditemukan</h3>
                                                            <p className="text-muted text-center">
                                                                {keywords
                                                                    ? `Tidak ada hasil untuk pencarian "${keywords}". Coba dengan kata kunci lain.`
                                                                    : "Belum ada pengguna yang terdaftar."}
                                                            </p>
                                                            {keywords ? (
                                                                <button
                                                                    onClick={resetSearch}
                                                                    className="btn btn-primary"
                                                                >
                                                                    Tampilkan Semua Pengguna
                                                                </button>
                                                            ) : (
                                                                <button className="btn btn-primary">
                                                                    <IconUserPlus size={18} className="me-1" />
                                                                    Tambah Pengguna Pertama
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {users.length > 0 && (
                                        <div className="card-footer d-flex align-items-center">
                                            <PaginationComponent
                                                currentPage={pagination.currentPage}
                                                perPage={pagination.perPage}
                                                total={pagination.total}
                                                onChange={(pageNumber) => fetchData(pageNumber, keywords)}
                                                position="center"
                                            />
                                            <small className="text-muted ms-auto">
                                                Menampilkan {users.length} dari {pagination.total} pengguna
                                            </small>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Notifikasi Sukses */}
            {showSuccessModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-sm modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-status bg-success"></div>
                                <div className="modal-body text-center py-4">
                                    <IconCircleCheck size={48} className="text-success mb-2" />
                                    <h3>Berhasil!</h3>
                                    <div className="text-muted">
                                        Pengguna berhasil diaktifkan!
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <div className="w-100">
                                        <div className="row">
                                            <div className="col">
                                                <button
                                                    className="btn btn-success w-100"
                                                    onClick={() => setShowSuccessModal(false)}
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Notifikasi Error */}
            {showErrorModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-sm modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-status bg-danger"></div>
                                <div className="modal-body text-center py-4">
                                    <IconCircleX size={48} className="text-danger mb-2" />
                                    <h3>Gagal!</h3>
                                    <div className="text-muted">
                                        {errorMessage}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <div className="w-100">
                                        <div className="row">
                                            <div className="col">
                                                <button
                                                    className="btn btn-danger w-100"
                                                    onClick={() => setShowErrorModal(false)}
                                                >
                                                    Tutup
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .cursor-pointer {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .cursor-pointer:hover {
                    background-color: #3b82f6 !important;
                    color: white !important;
                    transform: translateY(-1px);
                }
                .custom-tooltip {
                    max-width: 300px;
                }
                .tooltip-content {
                    font-size: 14px;
                    line-height: 1.4;
                }
                .modal-content {
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                    border: none;
                }
                .modal-status {
                    height: 6px;
                    background-position: center;
                    background-size: cover;
                }
                .modal.show {
                    backdrop-filter: blur(4px);
                }
            `}</style>
        </LayoutAdmin>
    )
}