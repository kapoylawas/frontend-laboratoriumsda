import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Pagination from '../../components/Pagination';
import LayoutAdmin from "../../layouts/admin";


export default function BeritaAcara() {
    const [beritaAcara, setBeritaAcara] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [keywords, setKeywords] = useState('');

    const userCookie = Cookies.get('user');
    const loggedInUser = userCookie ? JSON.parse(userCookie) : {};
    const isStaffOrAdmin = loggedInUser.role_id === 2 || loggedInUser.role_id === 3;

    const fetchData = async (pageNumber = 1, search = '') => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const queryParams = `page=${pageNumber}&search=${search}`;
                const response = await Api.get(`/api/berita-acara?${queryParams}`);
                setBeritaAcara(response.data.data);
                setPagination(response.data);
            } catch (error) {
                console.error('Error fetching berita acara:', error);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData(1, keywords);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            DRAFT: { class: 'bg-secondary', icon: '📝' },
            FINAL: { class: 'bg-success', icon: '✅' }
        };
        const s = statusMap[status] || { class: 'bg-secondary', icon: '❓' };
        return <span className={`badge-3d ${s.class} text-white px-2 py-1`}>{s.icon} {status}</span>;
    };

    return (
        <LayoutAdmin>
            <style>{`
                .card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 6px 6px 0px #000000 !important;
                    border-radius: 18px !important;
                    overflow: hidden !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .card-3d:hover {
                    box-shadow: 8px 8px 0px #000000 !important;
                    transform: translateY(-2px);
                }
                .badge-3d {
                    border: 1.5px solid #000000 !important;
                    box-shadow: 2px 2px 0px #000000 !important;
                    border-radius: 8px !important;
                    font-weight: 800 !important;
                }
                .btn-3d-primary {
                    background: #2563eb !important;
                    color: #ffffff !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    transition: all 0.1s ease-in-out !important;
                }
                .btn-3d-primary:hover {
                    background: #1d4ed8 !important;
                    color: #ffffff !important;
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0px #000000 !important;
                }
                .btn-3d-secondary {
                    background: #f1f5f9 !important;
                    color: #334155 !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 700 !important;
                }
                .banner-3d {
                    border: 2.5px solid #000000 !important;
                    box-shadow: 6px 6px 0px #000000 !important;
                    border-radius: 18px !important;
                    background: #ffffff !important;
                }
                .form-control-3d {
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 600;
                }
                .form-control-3d:focus {
                    box-shadow: 5px 5px 0px #000000 !important;
                    background-color: #fffdf0 !important;
                    outline: none;
                }
            `}</style>

            <div className="page-wrapper">
                <div className="page-header d-print-none">
                    <div className="container-fluid px-3 px-lg-4">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <h2 className="page-title fw-extrabold text-dark" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                                    📜 Berita Acara Pemeriksaan
                                </h2>
                                <div className="text-muted mt-1 fw-semibold">Kelola dan unduh laporan Berita Acara hasil uji</div>
                            </div>
                            {isStaffOrAdmin && (
                                <div className="col-auto ms-auto d-print-none">
                                    <div className="d-flex">
                                        <Link to="/berita-acara/create" className="btn btn-3d-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                                            Buat Berita Acara Baru
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-fluid px-3 px-lg-4">
                        {/* 3D Step 3 Banner */}
                        <div className="card mb-4 banner-3d p-3" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)' }}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 text-start">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="badge-3d bg-purple text-white fs-5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#9333ea' }}>
                                        3
                                    </div>
                                    <div>
                                        <h5 className="fw-extrabold mb-1 text-dark" style={{ fontSize: '1.05rem' }}>Langkah 3 dari 3: Berita Acara Pemeriksaan</h5>
                                        <small className="text-muted fw-semibold">Tahap Akhir: Pembuatan & Cetak Berita Acara Pengambilan Sampel & Hasil Uji</small>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Link to="/penjadwalan" className="btn btn-3d-secondary btn-sm me-1" style={{ fontSize: '0.85rem' }}>
                                        1. Jadwal
                                    </Link>
                                    <Link to="/hasil" className="btn btn-3d-secondary btn-sm" style={{ fontSize: '0.85rem' }}>
                                        2. Hasil
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="card card-3d">
                            <div className="card-header py-3" style={{ background: '#fafafa', borderBottom: '2px solid #000' }}>
                                <div className="row g-2 align-items-center">
                                    <div className="col">
                                        <h3 className="card-title fw-extrabold text-dark" style={{ fontSize: '1.1rem' }}>📋 Daftar Berita Acara</h3>
                                    </div>
                                    <div className="col-auto">
                                        <form onSubmit={handleSearch}>
                                            <div className="input-icon">
                                                <span className="input-icon-addon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-3d"
                                                    placeholder="🔍 Cari nomor BA or petugas..."
                                                    value={keywords}
                                                    onChange={(e) => setKeywords(e.target.value)}
                                                    style={{ paddingLeft: '42px' }}
                                                />
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-vcenter card-table table-striped">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>No. Berita Acara</th>
                                            <th>Jadwal</th>
                                            <th>Tanggal</th>
                                            <th>Petugas</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
                                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                                    <span className="ms-2">Memuat data...</span>
                                                </td>
                                            </tr>
                                        ) : beritaAcara.length > 0 ? (
                                            beritaAcara.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>{(pagination.current_page - 1) * pagination.per_page + index + 1}</td>
                                                    <td className="fw-semibold">{item.no_berita_acara || `BA-${item.id}`}</td>
                                                    <td>
                                                        {item.jadwals && item.jadwals.length > 0
                                                            ? item.jadwals.map(j => `JDL-${j.id}`).join(', ')
                                                            : (item.jadwal ? `JDL-${item.jadwal_id}` : '-')}
                                                    </td>
                                                    <td>{item.tanggal_pengambilan ? new Date(item.tanggal_pengambilan).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                                                    <td>{item.petugas_pengambil || '-'}</td>
                                                    <td>{getStatusBadge(item.status)}</td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <Link to={`/berita-acara/${item.id}`} className="btn btn-sm btn-outline-primary" title="Detail">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg>
                                                            </Link>
                                                            {isStaffOrAdmin && item.status === 'DRAFT' && (
                                                                <Link to={`/berita-acara/${item.id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.097 2.097 0 0 0 -2.954 -2.954l-8.657 8.657a2 2 0 0 0 -.548 1.02l-.432 2.159l2.159 -.432a2 2 0 0 0 1.02 -.548z" /><path d="M15.536 7.464l2 2" /></svg>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4 text-muted">
                                                    Belum ada data berita acara
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {pagination.last_page > 1 && (
                                <div className="card-footer d-flex align-items-center">
                                    <Pagination pagination={pagination} fetchData={fetchData} keywords={keywords} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </LayoutAdmin>
    );
}
