import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Pagination from '../../components/Pagination';
import LayoutAdmin from "../../layouts/admin";
import Swal from 'sweetalert2';
import {
    IconFileText, IconPlus, IconSearch, IconCheck,
    IconClock, IconClockX, IconBan, IconChecklist, IconPackage,
    IconEye, IconSparkles, IconInfoCircle, IconUserCheck, IconSquareCheck,
    IconMapPin, IconHome, IconBuilding
} from '@tabler/icons-react';
import { parseLocationFromCatatan } from '../../utils/locationParser';
import PemohonanLocationCard from '../../components/PemohonanLocationCard';
import PemohonanLocationModal from '../../components/PemohonanLocationModal';

export default function SemuaPenawaran() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [keywords, setKeywords] = useState('');
    const [expandedRows, setExpandedRows] = useState({});
    const [selectedLocationItem, setSelectedLocationItem] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const fetchData = async (pageNumber = 1, search = '') => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/pemohonan/all?page=${pageNumber}&search=${search}`);
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

    const handleApprove = async (id) => {
        const confirmResult = await Swal.fire({
            title: 'Setujui Pemohonan?',
            html: `
                <div class="text-start">
                    <p>Pemohonan yang disetujui akan membuat:</p>
                    <ul class="text-start">
                        <li><strong>Order</strong> untuk setiap item sampel</li>
                        <li><strong>Hasil pemeriksaan</strong> yang perlu diisi nanti</li>
                    </ul>
                    <p class="text-muted small">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2fb344',
            confirmButtonText: 'Ya, Setujui!',
            cancelButtonText: 'Batal'
        });
        if (!confirmResult.isConfirmed) return;

        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                await Api.put(`/api/pemohonan/admin/${id}/approve`);
                Swal.fire('Berhasil!', 'Pemohonan telah disetujui.', 'success');
                fetchData(pagination.current_page || 1, keywords);
            } catch (error) {
                Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
            }
        }
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
                await Api.put(`/api/pemohonan/admin/${id}/cancel`, payload);
                Swal.fire('Berhasil!', 'Pemohonan telah dibatalkan.', 'success');
                fetchData(pagination.current_page || 1, keywords);
            } catch (error) {
                Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
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
                .btn-3d-green {
                    background: #10b981 !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 6px 12px;
                    transition: all 0.15s ease-in-out !important;
                    cursor: pointer;
                }
                .btn-3d-green:hover {
                    background: #059669 !important;
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
                    padding: 6px 12px;
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
                    padding: 6px 12px;
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
                        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                        border: "3px solid #000000",
                        boxShadow: "6px 6px 0px #000000"
                    }}
                >
                    <div className="row align-items-center position-relative" style={{ zIndex: 1 }}>
                        <div className="col-md-8">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2" style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                                <IconUserCheck size={16} className="text-info" />
                                <span className="text-white fw-bold fs-8 text-uppercase">Portal Verifikasi Admin</span>
                            </div>
                            <h2 className="text-white fw-extrabold display-6 mb-1 d-flex align-items-center gap-2">
                                <IconChecklist size={36} /> Semua Surat Penawaran (Admin)
                            </h2>
                            <p className="text-white-50 mb-0 fs-6">
                                Monitoring seluruh pengajuan surat penawaran dari pemohon dan berikan persetujuan (approve).
                            </p>
                        </div>
                        <div className="col-md-4 text-md-end mt-3 mt-md-0">
                            <Link to="/penawaran/create" className="btn-3d-primary">
                                <IconPlus size={18} />
                                Buat Penawaran Baru
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
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Perlu Persetujuan</div>
                            <div className="fs-2 fw-black text-warning">{statsPending}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#f0fdf4" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Telah Disetujui</div>
                            <div className="fs-2 fw-black text-success">{statsApproved}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#faf5ff" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Total Nilai Halaman</div>
                            <div className="fs-4 fw-black text-purple">{formatCurrency(statsGrandSum)}</div>
                        </div>
                    </div>
                </div>

                {/* 3D Table Container Card */}
                <div className="card-3d p-4 mb-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <div>
                            <h4 className="fw-extrabold text-dark mb-0 d-flex align-items-center gap-2">
                                <IconFileText size={24} className="text-primary" /> Daftar Pemohonan Pemohon
                            </h4>
                            <small className="text-muted">Klik baris untuk membuka rincian sampel atau lakukan tindakan persetujuan.</small>
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
                                    <th className="text-center" style={{ width: '50px' }}>No</th>
                                    <th style={{ minWidth: '150px' }}>Pemohon / Pengaju</th>
                                    <th className="text-center" style={{ width: '130px' }}>Jenis</th>
                                    <th style={{ minWidth: '260px' }}>Rincian Item</th>
                                    <th className="text-end" style={{ width: '120px' }}>Total Biaya</th>
                                    <th className="text-center" style={{ width: '130px' }}>Status</th>
                                    <th className="text-center" style={{ width: '110px' }}>Tanggal</th>
                                    <th className="text-center" style={{ width: '150px' }}>Aksi Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5">
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
                                        const loc = parseLocationFromCatatan(item.catatan, item);
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr
                                                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                    onClick={() => toggleRow(item.id)}
                                                    className={isExpanded ? "table-active" : ""}
                                                >
                                                    <td className="text-center fw-bold text-secondary">{rowNumber}</td>
                                                    <td>
                                                        <div className="fw-extrabold text-dark">{item.user?.name || item.user?.instansi || 'Pemohon'}</div>
                                                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '170px' }}>{item.user?.email || item.user?.no_hp || '-'}</small>
                                                    </td>
                                                    <td className="text-center">{getJenisBadge(item.jenis)}</td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-1 py-1">
                                                            {/* Badges line */}
                                                            <div className="d-flex align-items-center gap-1 flex-wrap">
                                                                <span className="badge-3d px-2 py-1 bg-white text-dark" style={{ fontSize: '11px' }}>
                                                                    {item.items?.length || 0} Sampel
                                                                </span>

                                                                {loc.isDiRumah && (
                                                                    <button
                                                                        type="button"
                                                                        className="badge-3d px-2 py-1 text-dark d-inline-flex align-items-center gap-1 border-0"
                                                                        style={{ 
                                                                            backgroundColor: '#fed7aa', 
                                                                            fontSize: '11px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedLocationItem(item);
                                                                            setShowLocationModal(true);
                                                                        }}
                                                                        title="Klik untuk melihat peta lokasi penjemputan"
                                                                    >
                                                                        <IconMapPin size={12} className="text-danger" /> Di Rumah • Peta
                                                                    </button>
                                                                )}

                                                                {loc.isLabkesda && (
                                                                    <span 
                                                                        className="badge-3d px-2 py-1 text-dark d-inline-flex align-items-center gap-1"
                                                                        style={{ backgroundColor: '#bfdbfe', fontSize: '11px' }}
                                                                    >
                                                                        <IconBuilding size={12} /> Di Labkesda
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Alamat Preview */}
                                                            {loc.alamat && (
                                                                <div 
                                                                    className="small text-secondary text-truncate d-flex align-items-center gap-1 mt-1" 
                                                                    style={{ maxWidth: '280px', fontSize: '11.5px', cursor: 'pointer' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedLocationItem(item);
                                                                        setShowLocationModal(true);
                                                                    }}
                                                                    title={`${loc.alamat} (Klik untuk buka peta)`}
                                                                >
                                                                    <span className="text-danger flex-shrink-0">📍</span>
                                                                    <span className="text-dark fw-bold text-truncate">{loc.alamat}</span>
                                                                </div>
                                                            )}

                                                            {/* Clean note if exists (excluding cancellation reason) */}
                                                            {loc.cleanNote ? (
                                                                <small className="text-muted fst-italic text-truncate" style={{ maxWidth: '280px', fontSize: '11px' }} title={loc.cleanNote}>
                                                                    "{loc.cleanNote}"
                                                                </small>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="text-end fw-black text-primary fs-6 text-nowrap">{formatCurrency(grandTotal)}</td>
                                                    <td className="text-center">
                                                        <div>{getStatusBadge(item.status)}</div>
                                                        {item.status === 'CANCELLED' && loc.alasanPembatalan && (
                                                            <small 
                                                                className="text-danger d-block text-truncate fw-semibold mt-1" 
                                                                style={{ maxWidth: '120px', fontSize: '10px' }}
                                                                title={loc.alasanPembatalan}
                                                            >
                                                                {loc.alasanPembatalan.replace('Alasan pembatalan oleh admin:', '').trim()}
                                                            </small>
                                                        )}
                                                    </td>
                                                    <td className="text-center text-muted small text-nowrap">
                                                        {item.tanggal_pengajuan ? (
                                                            <>
                                                                <div className="fw-semibold text-dark">{new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                <small style={{ fontSize: '11px' }}>{new Date(item.tanggal_pengajuan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                                                            </>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="text-center pe-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="d-flex justify-content-center align-items-center gap-1 flex-nowrap">
                                                            {item.status === 'PENDING' && (
                                                                <button
                                                                    className="btn-3d-green py-1 px-2"
                                                                    onClick={() => handleApprove(item.id)}
                                                                    title="Setujui (Approve)"
                                                                    style={{ fontSize: '12px' }}
                                                                >
                                                                    <IconSquareCheck size={15} /> Setujui
                                                                </button>
                                                            )}
                                                            <Link to={`/semua-penawaran/${item.id}`} className="btn-3d-secondary py-1 px-2 text-decoration-none" title="Lihat Detail">
                                                                <IconEye size={15} />
                                                            </Link>
                                                            {item.status === 'PENDING' && (
                                                                <button className="btn-3d-danger py-1 px-2" onClick={() => handleCancel(item.id)} title="Batalkan">
                                                                    <IconBan size={15} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded 3D Sub-Items Container */}
                                                {isExpanded && (
                                                    <tr key={`${item.id}-detail`}>
                                                        <td colSpan="8" className="p-0 border-top-0">
                                                            <div className="p-3" style={{ backgroundColor: '#f8fafc', borderBottom: '2.5px solid #000' }}>
                                                                {/* 1. Lokasi Pengambilan & Peta Preview */}
                                                                <PemohonanLocationCard 
                                                                    catatan={item.catatan} 
                                                                    item={item} 
                                                                    onOpenModal={(selected) => {
                                                                        setSelectedLocationItem(selected);
                                                                        setShowLocationModal(true);
                                                                    }} 
                                                                />

                                                                {/* 2. Item Sampel & Parameter Pengujian */}
                                                                {item.items && item.items.length > 0 && (
                                                                    <>
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
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5">
                                            <div className="py-4">
                                                <IconFileText size={56} className="text-muted mb-2" style={{ opacity: 0.4 }} />
                                                <h5 className="fw-bold text-dark mb-1">Belum Ada Data Pemohonan</h5>
                                                <p className="text-muted small mb-0">Belum ada surat penawaran yang diajukan.</p>
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

                {/* Location & Map Modal */}
                <PemohonanLocationModal 
                    isOpen={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    item={selectedLocationItem}
                />
            </div>
        </LayoutAdmin>
    );
}