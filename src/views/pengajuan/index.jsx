import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Pagination from '../../components/Pagination';
import LayoutAdmin from "../../layouts/admin";
import Swal from 'sweetalert2';
import { useStore as useUserStore } from '../../stores/user';
import { isAdmin } from '../../constants/roles';
import {
    IconFileText, IconPlus, IconSearch, IconCheck,
    IconClock, IconClockX, IconBan, IconChecklist, IconPackage,
    IconEye, IconSparkles, IconInfoCircle
} from '@tabler/icons-react';

export default function Pengajuan() {
    const { user } = useUserStore();
    const userIsAdmin = isAdmin(user);
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [keywords, setKeywords] = useState('');
    const [expandedRows, setExpandedRows] = useState({});

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const fetchData = async (pageNumber = 1, search = '') => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/pemohonan?page=${pageNumber}&search=${search}`);
                setData(response.data.data || []);
                if (response.data.pagination) {
                    setPagination({
                        current_page: response.data.pagination.page || response.data.pagination.currentPage || 1,
                        per_page: response.data.pagination.limit || response.data.pagination.perPage || 10,
                        total: response.data.pagination.total || 0,
                        last_page: response.data.pagination.totalPages || response.data.pagination.last_page || 1,
                    });
                } else if (response.data.current_page) {
                    setPagination(response.data);
                }
            } catch (error) {
                console.error('Error fetching pemohonan:', error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data pemohonan!' });
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

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCancel = async (id) => {
        const result = await Swal.fire({
            title: 'Batalkan Pemohonan?',
            html: `
                <div class="text-start">
                    <p class="text-muted mb-2">Apakah Anda yakin ingin membatalkan pemohonan ini?</p>
                    <label for="alasan-cancel" class="form-label small fw-semibold">Alasan Pembatalan (opsional)</label>
                    <textarea id="alasan-cancel" class="form-control" rows="3" placeholder="Masukkan alasan pembatalan..."></textarea>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d63939',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText: 'Tidak',
            focusConfirm: false,
            preConfirm: () => {
                const alasan = document.getElementById('alasan-cancel')?.value || '';
                return { alasan };
            }
        });

        if (!result.isConfirmed) return;

        const { alasan } = result.value;
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const payload = {};
                if (alasan && alasan.trim()) {
                    payload.alasan = alasan.trim();
                }
                await Api.put(`/api/pemohonan/${id}/cancel`, payload);
                Swal.fire('Berhasil!', 'Pemohonan telah dibatalkan.', 'success');
                fetchData(pagination.current_page || 1, keywords);
            } catch (error) {
                Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
            }
        }
    };

    const handleCancelExpired = async () => {
        const confirmResult = await Swal.fire({
            title: 'Batalkan Pemohonan Expired?',
            html: `
                <div class="text-start">
                    <p>Ini akan membatalkan semua surat penawaran yang sudah <strong>melewati tanggal expired</strong> dan masih berstatus PENDING.</p>
                    <p class="text-muted small">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d63939',
            confirmButtonText: 'Ya, Batalkan Expired',
            cancelButtonText: 'Batal'
        });
        if (!confirmResult.isConfirmed) return;

        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.post('/api/pemohonan/cancel-expired');
                const result = response.data.data;
                const cancelledCount = result.cancelled_count || 0;
                const pemohonanIds = result.pemohonan_ids || [];

                if (cancelledCount === 0) {
                    await Swal.fire({
                        icon: 'info',
                        title: 'Tidak Ada Expired',
                        text: 'Tidak ada pemohonan yang perlu dibatalkan.',
                        confirmButtonText: 'OK'
                    });
                } else {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        html: `
                            <div class="text-center">
                                <div class="mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#2fb344" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                                </div>
                                <p class="fs-5 fw-bold mb-1">${cancelledCount} pemohonan dibatalkan</p>
                                <p class="text-muted">Semua surat penawaran yang expired telah dibatalkan.</p>
                                <div class="mt-3 p-2 rounded" style="background: rgba(214,57,57,0.1)">
                                    <small class="text-muted">ID Dibatalkan:</small><br>
                                    <strong>#${pemohonanIds.join(', #')}</strong>
                                </div>
                            </div>
                        `,
                        confirmButtonText: 'OK'
                    });
                }
                fetchData(pagination.current_page || 1, keywords);
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal membatalkan pemohonan expired.' });
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            PENDING: { bg: '#fef08a', color: '#854d0e', icon: <IconClock size={14} className="me-1" />, label: 'Menunggu' },
            APPROVED: { bg: '#bbf7d0', color: '#166534', icon: <IconCheck size={14} className="me-1" />, label: 'Disetujui' },
            CANCELLED: { bg: '#e2e8f0', color: '#334155', icon: <IconBan size={14} className="me-1" />, label: 'Dibatalkan' },
            EXPIRED: { bg: '#fecdd3', color: '#9f1239', icon: <IconClockX size={14} className="me-1" />, label: 'Kadaluarsa' }
        };
        const s = statusMap[status] || { bg: '#e2e8f0', color: '#334155', icon: null, label: status };

        return (
            <span
                className="badge-3d px-3 py-1 d-inline-flex align-items-center"
                style={{ backgroundColor: s.bg, color: s.color }}
            >
                {s.icon}
                {s.label}
            </span>
        );
    };

    const getJenisBadge = (jenis) => {
        if (jenis === 'PEMESANAN') {
            return (
                <span
                    className="badge-3d px-3 py-1 d-inline-flex align-items-center"
                    style={{ backgroundColor: '#bfdbfe', color: '#1e40af' }}
                >
                    <IconPackage size={14} className="me-1" />
                    Pemesanan
                </span>
            );
        }
        return (
            <span
                className="badge-3d px-3 py-1 d-inline-flex align-items-center"
                style={{ backgroundColor: '#c084fc', color: '#ffffff' }}
            >
                <IconFileText size={14} className="me-1" />
                Surat Penawaran
            </span>
        );
    };

    const calcGrandTotal = (items) => {
        if (!items || items.length === 0) return 0;
        return items.reduce((sum, item) => sum + (item.price || 0), 0);
    };

    // Calculate KPI Statistics
    const statsTotal = pagination.total || data.length || 0;
    const statsPending = data.filter(i => i.status === 'PENDING').length;
    const statsApproved = data.filter(i => i.status === 'APPROVED').length;
    const statsGrandSum = data.reduce((acc, curr) => acc + calcGrandTotal(curr.items), 0);

    return (
        <LayoutAdmin>
            {/* Custom 3D Styles */}
            <style>{`
                .card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 5px 5px 0px #000000 !important;
                    border-radius: 16px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .card-3d:hover {
                    box-shadow: 7px 7px 0px #000000 !important;
                    transform: translateY(-2px);
                }
                .item-card-3d {
                    background: #ffffff !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 12px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .item-card-3d:hover {
                    box-shadow: 5px 5px 0px #000000 !important;
                    transform: translateY(-2px);
                }
                .badge-3d {
                    border: 2px solid #000000 !important;
                    box-shadow: 2px 2px 0px #000000 !important;
                    border-radius: 8px !important;
                    font-weight: 800 !important;
                }
                .btn-3d-primary {
                    background: #2563eb !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px 16px;
                    transition: all 0.15s ease-in-out !important;
                    text-decoration: none !important;
                    cursor: pointer;
                }
                .btn-3d-primary:hover {
                    background: #1d4ed8 !important;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .btn-3d-secondary {
                    background: #f1f5f9 !important;
                    color: #0f172a !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px 16px;
                    transition: all 0.15s ease-in-out !important;
                    text-decoration: none !important;
                    cursor: pointer;
                }
                .btn-3d-secondary:hover {
                    background: #e2e8f0 !important;
                    color: #000000 !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .btn-3d-danger {
                    background: #ef4444 !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 8px 16px;
                    transition: all 0.15s ease-in-out !important;
                    cursor: pointer;
                }
                .btn-3d-danger:hover {
                    background: #dc2626 !important;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .input-3d {
                    border: 2.5px solid #000000 !important;
                    border-radius: 12px !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    font-weight: 600 !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .input-3d:focus {
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-color: #2563eb !important;
                }
                .table-3d-header th {
                    background-color: #f8fafc !important;
                    border-bottom: 2.5px solid #000000 !important;
                    color: #0f172a !important;
                    font-weight: 800 !important;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            `}</style>

            <div className="container-xl py-4">
                {/* 3D Hero Header Banner */}
                <div
                    className="p-4 rounded-4 mb-4 position-relative overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                        border: "3px solid #000000",
                        boxShadow: "6px 6px 0px #000000"
                    }}
                >
                    <div className="row align-items-center position-relative" style={{ zIndex: 1 }}>
                        <div className="col-md-7">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2" style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                                <IconSparkles size={16} className="text-warning" />
                                <span className="text-white fw-bold fs-8 text-uppercase">Layanan Pengajuan Labkesda</span>
                            </div>
                            <h2 className="text-white fw-extrabold display-6 mb-1 d-flex align-items-center gap-2">
                                <IconFileText size={36} /> Surat Penawaran & Pemohonan
                            </h2>
                            <p className="text-white-50 mb-0 fs-6">
                                Kelola pengajuan surat penawaran harga pengujian laboratorium dan pemesanan sampel secara terpadu.
                            </p>
                        </div>
                        <div className="col-md-5 text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end flex-wrap">
                            {userIsAdmin && (
                                <button className="btn-3d-danger" onClick={handleCancelExpired} title="Batalkan semua pemohonan yang expired">
                                    <IconClockX size={18} />
                                    Cancel Expired
                                </button>
                            )}
                            <Link to="/penawaran/create" className="btn-3d-primary">
                                <IconPlus size={18} />
                                Buat Pemohonan Baru
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 3D Summary KPI Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#eff6ff" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Total Pemohonan</div>
                            <div className="fs-2 fw-black text-primary">{statsTotal}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#fefce8" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Menunggu (Pending)</div>
                            <div className="fs-2 fw-black text-warning">{statsPending}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#f0fdf4" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Disetujui (Approved)</div>
                            <div className="fs-2 fw-black text-success">{statsApproved}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#faf5ff" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Estimasi Nilai Halaman</div>
                            <div className="fs-4 fw-black text-purple">{formatCurrency(statsGrandSum)}</div>
                        </div>
                    </div>
                </div>

                {/* 3D Table Container Card */}
                <div className="card-3d p-4 mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0 d-flex align-items-center gap-2">
                                <IconChecklist size={24} className="text-primary" /> Daftar Pengajuan Surat Penawaran
                            </h4>
                            <small className="text-muted">Klik baris tabel untuk melihat rincian item pengujian sampel.</small>
                        </div>
                        <form onSubmit={handleSearch} className="d-flex gap-2" style={{ maxWidth: '360px', width: '100%' }}>
                            <div className="input-group">
                                <span className="input-group-text bg-white" style={{ border: "2.5px solid #000", borderRight: "none", borderRadius: "12px 0 0 12px", boxShadow: "3px 3px 0px #000" }}>
                                    <IconSearch size={18} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control input-3d"
                                    style={{ borderRadius: "0 12px 12px 0" }}
                                    placeholder="Cari pemohonan..."
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                />
                            </div>
                        </form>
                    </div>

                    <div className="table-responsive rounded-3" style={{ border: "2.5px solid #000" }}>
                        <table className="table table-vcenter mb-0 align-middle">
                            <thead className="table-3d-header">
                                <tr>
                                    <th className="text-center" style={{ width: '60px' }}>No</th>
                                    <th>Jenis Pengajuan</th>
                                    <th>Rincian Item</th>
                                    <th>Total Biaya</th>
                                    <th>Status</th>
                                    <th>Tanggal Pengajuan</th>
                                    <th className="text-end pe-4" style={{ width: '140px' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5">
                                            <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
                                            <p className="text-muted fw-semibold mb-0">Memuat data pemohonan...</p>
                                        </td>
                                    </tr>
                                ) : data.length > 0 ? (
                                    data.map((item, index) => {
                                        const rowNumber = pagination.current_page
                                            ? (pagination.current_page - 1) * (pagination.per_page || 10) + index + 1
                                            : index + 1;
                                        const isExpanded = expandedRows[item.id];
                                        const grandTotal = calcGrandTotal(item.items);
                                        return (
                                            <>
                                                <tr
                                                    key={item.id}
                                                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                    onClick={() => toggleRow(item.id)}
                                                    className={isExpanded ? "table-active" : ""}
                                                >
                                                    <td className="text-center fw-bold text-secondary">{rowNumber}</td>
                                                    <td>{getJenisBadge(item.jenis)}</td>
                                                    <td>
                                                        <div>
                                                            <span className="badge-3d px-2 py-1 bg-white text-dark me-2" style={{ fontSize: '11px' }}>
                                                                {item.items?.length || 0} item sampel
                                                            </span>
                                                            {item.catatan && (
                                                                <small className="text-muted fst-italic">- {item.catatan}</small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="fw-black text-primary fs-6">{formatCurrency(grandTotal)}</td>
                                                    <td>{getStatusBadge(item.status)}</td>
                                                    <td className="text-muted small">
                                                        {item.tanggal_pengajuan ? (
                                                            <>
                                                                <div className="fw-semibold text-dark">{new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                <small>{new Date(item.tanggal_pengajuan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                                                            </>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="text-end pe-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Link to={`/penawaran/${item.id}`} className="btn-3d-secondary py-1 px-2 text-decoration-none" title="Lihat Detail">
                                                                <IconEye size={16} />
                                                            </Link>
                                                            {item.status === 'PENDING' && userIsAdmin && (
                                                                <button className="btn-3d-danger py-1 px-2" onClick={() => handleCancel(item.id)} title="Batalkan">
                                                                    <IconBan size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded 3D Sub-Items Container */}
                                                {isExpanded && item.items && item.items.length > 0 && (
                                                    <tr key={`${item.id}-detail`}>
                                                        <td colSpan="7" className="p-0 border-top-0">
                                                            <div className="p-3" style={{ backgroundColor: '#f8fafc', borderBottom: '2.5px solid #000' }}>
                                                                <div className="fw-bold text-uppercase fs-8 text-primary mb-2 d-flex align-items-center gap-1">
                                                                    <IconInfoCircle size={16} /> Item Sampel & Parameter Pengujian (#{item.id})
                                                                </div>
                                                                <div className="row g-2">
                                                                    {item.items.map((subItem, subIdx) => (
                                                                        <div key={subItem.id || subIdx} className="col-md-6 col-lg-4">
                                                                            <div className="item-card-3d p-3">
                                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                    <div>
                                                                                        <div className="fw-extrabold text-dark fs-6">{subItem.sampel?.parameter || '-'}</div>
                                                                                        <span className="badge-3d px-2 py-0 bg-info text-white" style={{ fontSize: '10px' }}>
                                                                                            {subItem.sampel?.category?.name || 'Tanpa Kategori'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="badge-3d px-2 py-1 bg-warning text-dark">
                                                                                        x{subItem.qty}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                                                                    <small className="text-muted">{formatCurrency(subItem.sampel?.price_sell || 0)} / item</small>
                                                                                    <span className="fw-extrabold text-primary">{formatCurrency(subItem.price || 0)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {item.catatan && (
                                                                    <div className="mt-3 p-2 bg-white rounded-3 border" style={{ border: '2px solid #000' }}>
                                                                        <small className="text-dark fw-semibold">Catatan Tambahan:</small>
                                                                        <p className="mb-0 small text-muted">{item.catatan}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5">
                                            <div className="py-4">
                                                <IconFileText size={56} className="text-muted mb-2" style={{ opacity: 0.4 }} />
                                                <h5 className="fw-bold text-dark mb-1">Belum Ada Data Pemohonan</h5>
                                                <p className="text-muted small mb-3">Buat surat penawaran atau pemohonan sampel baru untuk memulai.</p>
                                                <Link to="/penawaran/create" className="btn-3d-primary d-inline-flex">
                                                    <IconPlus size={18} />
                                                    Buat Pemohonan Baru
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.last_page > 1 && (
                        <div className="mt-4 d-flex align-items-center justify-content-between">
                            <Pagination pagination={pagination} fetchData={fetchData} keywords={keywords} />
                        </div>
                    )}
                </div>
            </div>
        </LayoutAdmin>
    );
}
