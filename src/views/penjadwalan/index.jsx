import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import LayoutAdmin from '../../layouts/admin';
import PaginationComponent from '../../components/Pagination';
import Swal from 'sweetalert2';

export default function Penjadwalan() {
    const [activeTab, setActiveTab] = useState('jadwal');
    const [jadwalList, setJadwalList] = useState([]);
    const [isLoadingJadwal, setIsLoadingJadwal] = useState(true);
    const [jadwalPagination, setJadwalPagination] = useState({ currentPage: 1, perPage: 10, total: 0, totalPages: 1 });

    const [transactions, setTransactions] = useState([]);
    const [isLoadingTx, setIsLoadingTx] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedRows, setExpandedRows] = useState({});
    const [txPagination, setTxPagination] = useState({ currentPage: 1, perPage: 10, total: 0, totalPages: 1 });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        tanggal_pengambilan: '', jam_pengambilan: '', lokasi: '', petugas: '', catatan: '',
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailDataList, setDetailDataList] = useState([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatDateLong = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (timeStr) => timeStr || '-';

    // Fetch jadwal list
    const fetchJadwal = async (pageNumber = 1) => {
        setIsLoadingJadwal(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/jadwal-pengambilan?page=${pageNumber}&limit=10`);
                setJadwalList(response.data.data || []);
                if (response.data.pagination) {
                    setJadwalPagination({
                        currentPage: response.data.pagination.page || 1,
                        perPage: response.data.pagination.limit || 10,
                        total: response.data.pagination.total || 0,
                        totalPages: response.data.pagination.totalPages || 1,
                    });
                }
            } catch (error) {
                console.error('Error fetching jadwal:', error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data jadwal!' });
            }
        }
        setIsLoadingJadwal(false);
    };

    // Fetch transactions
    const fetchTransactions = async (pageNumber = 1, keywords = '', status = '') => {
        setIsLoadingTx(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const params = [`page=${pageNumber}`, `limit=10`];
                if (keywords) params.push(`search=${keywords}`);
                if (status !== '') params.push(`status=${status}`);
                const response = await Api.get(`/api/transactions?${params.join('&')}`);
                setTransactions(response.data.data || []);
                if (response.data.pagination) {
                    setTxPagination({
                        currentPage: response.data.pagination.page || 1,
                        perPage: response.data.pagination.limit || 10,
                        total: response.data.pagination.total || 0,
                        totalPages: response.data.pagination.totalPages || 1,
                    });
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        }
        setIsLoadingTx(false);
    };

    useEffect(() => {
        fetchJadwal();
        fetchTransactions();
    }, []);

    // Detail berita acara - fetch all jadwal for an invoice
    const handleViewDetail = async (jadwalItems) => {
        setIsLoadingDetail(true);
        setShowDetailModal(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const results = await Promise.all(
                    jadwalItems.map(async (j) => {
                        const res = await Api.get(`/api/jadwal-pengambilan/${j.id}`);
                        return res.data.data || null;
                    })
                );
                setDetailDataList(results.filter(Boolean));
            } catch (error) {
                console.error('Error fetching detail:', error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil detail berita acara!' });
                setShowDetailModal(false);
            }
        }
        setIsLoadingDetail(false);
    };

    const handleSearch = (e) => { e.preventDefault(); fetchTransactions(1, search, filterStatus); };
    const handleStatusFilter = (status) => { setFilterStatus(status); fetchTransactions(1, search, status); };
    const handleClearFilters = () => { setSearch(''); setFilterStatus(''); fetchTransactions(1, '', ''); };
    const toggleRow = (id) => { setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] })); };

    const openCreateModal = (transaction) => {
        setSelectedTransaction(transaction);
        setFormData({ tanggal_pengambilan: '', jam_pengambilan: '', lokasi: '', petugas: '', catatan: '' });
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setSelectedTransaction(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmitSchedule = async (e) => {
        e.preventDefault();
        if (!formData.tanggal_pengambilan || !formData.jam_pengambilan || !formData.lokasi) {
            Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Tanggal, jam, dan lokasi pengambilan wajib diisi!' });
            return;
        }

        const paidDetails = (selectedTransaction?.transaction_details || []).filter((d) => d.status_bayar);
        if (paidDetails.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Tidak Ada Item', text: 'Tidak ada item yang sudah lunas pada transaksi ini!' });
            return;
        }

        setIsSubmitting(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            let successCount = 0;
            let failCount = 0;
            const failedParams = [];

            for (const detail of paidDetails) {
                try {
                    await Api.post('/api/jadwal-pengambilan', {
                        transaction_detail_id: detail.id,
                        tanggal_pengambilan: formData.tanggal_pengambilan,
                        jam_pengambilan: formData.jam_pengambilan,
                        lokasi: formData.lokasi,
                        petugas: formData.petugas,
                        catatan: formData.catatan,
                    });
                    successCount++;
                } catch (error) {
                    failCount++;
                    failedParams.push(detail.sampel?.parameter || `ID ${detail.id}`);
                }
            }

            if (failCount === 0) {
                Swal.fire({
                    icon: 'success', title: 'Berhasil!',
                    html: `<div class="text-start">
                        <p>Jadwal pengambilan berhasil dibuat untuk <strong>${successCount} parameter</strong>:</p>
                        <div class="mb-1"><strong>Tanggal:</strong> ${formatDateLong(formData.tanggal_pengambilan)}</div>
                        <div class="mb-1"><strong>Jam:</strong> ${formData.jam_pengambilan} WIB</div>
                        <div class="mb-1"><strong>Lokasi:</strong> ${formData.lokasi}</div>
                        ${formData.petugas ? `<div class="mb-1"><strong>Petugas:</strong> ${formData.petugas}</div>` : ''}
                    </div>`,
                });
            } else {
                Swal.fire({
                    icon: successCount > 0 ? 'warning' : 'error',
                    title: successCount > 0 ? 'Sebagian Berhasil' : 'Gagal',
                    html: `<div class="text-start">
                        <p><strong>${successCount}</strong> berhasil, <strong>${failCount}</strong> gagal</p>
                        ${failedParams.length > 0 ? `<div class="text-muted small">Gagal: ${failedParams.join(', ')}</div>` : ''}
                    </div>`,
                });
            }
            closeCreateModal();
            fetchJadwal(jadwalPagination.currentPage);
            fetchTransactions(txPagination.currentPage, search, filterStatus);
        }
        setIsSubmitting(false);
    };

    const getPaymentBadge = (statusBayar) => {
        if (statusBayar) {
            return (<span className="badge bg-success"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>Lunas</span>);
        }
        return (<span className="badge bg-warning text-dark"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6.5 7h11" /><path d="M6.5 17h11" /><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" /></svg>Belum Bayar</span>);
    };

    const getDetailsGroupedByCategory = (details) => {
        const grouped = {};
        (details || []).forEach((detail) => {
            const catId = detail.sampel?.category_id || '0';
            const catName = detail.sampel?.category?.name || `Kategori #${catId}`;
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(detail);
        });
        return grouped;
    };

    const getCategoryColor = (catName) => {
        const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary'];
        let hash = 0;
        for (let i = 0; i < catName.length; i++) hash = catName.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const getRowNumber = (index) => (txPagination.currentPage - 1) * txPagination.perPage + index + 1;

    const txRange = txPagination.total > 0
        ? { start: (txPagination.currentPage - 1) * txPagination.perPage + 1, end: Math.min(txPagination.currentPage * txPagination.perPage, txPagination.total) }
        : { start: 0, end: 0 };

    const jadwalRange = jadwalPagination.total > 0
        ? { start: (jadwalPagination.currentPage - 1) * jadwalPagination.perPage + 1, end: Math.min(jadwalPagination.currentPage * jadwalPagination.perPage, jadwalPagination.total) }
        : { start: 0, end: 0 };

    // Is date in the past?
    const isDatePast = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    };

    return (
        <LayoutAdmin>
            <div className="page-wrapper">
                <div className="page-header d-print-none">
                    <div className="container-xl">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <h2 className="page-title">Penjadwalan</h2>
                                <div className="text-muted mt-1">Kelola jadwal pengambilan sampel</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-xl">
                        {/* Tab Navigation */}
                        <div className="card mb-3">
                            <div className="card-body p-0">
                                <ul className="nav nav-tabs nav-fill card-tabs" style={{ borderBottom: 'none' }}>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 'jadwal' ? 'active' : ''}`}
                                            onClick={() => { setActiveTab('jadwal'); fetchJadwal(jadwalPagination.currentPage); }}
                                            style={{ borderBottom: activeTab === 'jadwal' ? '3px solid var(--tblr-primary)' : 'none', fontWeight: activeTab === 'jadwal' ? 600 : 400 }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                                            Daftar Jadwal
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 'transaksi' ? 'active' : ''}`}
                                            onClick={() => { setActiveTab('transaksi'); fetchTransactions(txPagination.currentPage, search, filterStatus); }}
                                            style={{ borderBottom: activeTab === 'transaksi' ? '3px solid var(--tblr-primary)' : 'none', fontWeight: activeTab === 'transaksi' ? 600 : 400 }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 8v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-2" /></svg>
                                            Buat dari Transaksi
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* ========== TAB 1: JADWAL LIST ========== */}
                        {activeTab === 'jadwal' && (
                            <>
                                {/* Summary Cards */}
                                <div className="row row-cards mb-3">
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar me-3" style={{ backgroundColor: 'rgba(32,107,196,0.1)', color: '#206ba4', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small">Total Jadwal</div>
                                                        <div className="fs-3 fw-bold">{jadwalPagination.total}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar me-3" style={{ backgroundColor: 'rgba(47,179,68,0.1)', color: '#2fb344', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small">Akan Datang</div>
                                                        <div className="fs-3 fw-bold text-success">{jadwalList.filter(j => !isDatePast(j.tanggal_pengambilan)).length}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card">
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar me-3" style={{ backgroundColor: 'rgba(251,182,6,0.1)', color: '#fbb606', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small">Sudah Lewat</div>
                                                        <div className="fs-3 fw-bold text-warning">{jadwalList.filter(j => isDatePast(j.tanggal_pengambilan)).length}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Jadwal Cards */}
                                {isLoadingJadwal ? (
                                    <div className="card">
                                        <div className="card-body text-center py-5">
                                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                            <p className="mt-3 text-muted">Memuat data jadwal...</p>
                                        </div>
                                    </div>
                                ) : jadwalList.length === 0 ? (
                                    <div className="card">
                                        <div className="card-body text-center py-5">
                                            <div style={{ opacity: 0.4 }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                                                <p className="text-muted mb-0">Belum ada jadwal pengambilan</p>
                                                <small className="text-muted">Buat jadwal dari tab &ldquo;Buat dari Transaksi&rdquo;</small>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {(() => {
                                            const grouped = {};
                                            jadwalList.forEach((j) => {
                                                const txId = j.transaction_detail?.transaction?.id || 0;
                                                const key = `${txId}_${j.transaction_detail?.transaction?.invoice || '-'}`;
                                                if (!grouped[key]) grouped[key] = { items: [], invoice: j.transaction_detail?.transaction?.invoice || '-', user: j.transaction_detail?.transaction?.user };
                                                grouped[key].items.push(j);
                                            });

                                            return Object.entries(grouped).map(([key, group]) => {
                                                const upcoming = group.items.filter(j => !isDatePast(j.tanggal_pengambilan)).length;
                                                const past = group.items.length - upcoming;

                                                return (
                                                    <div className="card mb-3" key={key}>
                                                        <div className="card-header">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <span className="badge bg-primary-lt" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>{group.invoice}</span>
                                                                    <div>
                                                                        <div className="fw-semibold small">{group.user?.name || '-'}</div>
                                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{group.user?.email || '-'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="d-flex gap-1">
                                                                        {upcoming > 0 && <span className="badge bg-success">{upcoming} Akan Datang</span>}
                                                                        {past > 0 && <span className="badge bg-warning text-dark">{past} Sudah Lewat</span>}
                                                                    </div>
                                                                    <button className="btn btn-sm btn-primary" onClick={() => handleViewDetail(group.items)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>
                                                                        Berita Acara
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="table-responsive">
                                                            <table className="table table-vcenter card-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Parameter</th>
                                                                        <th>Kategori</th>
                                                                        <th>Qty</th>
                                                                        <th>Tanggal</th>
                                                                        <th>Waktu</th>
                                                                        <th>Lokasi</th>
                                                                        <th className="text-center">Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {group.items.map((jadwal) => {
                                                                        const td = jadwal.transaction_detail;
                                                                        const sampel = td?.sampel;
                                                                        const category = sampel?.category;
                                                                        const isPastItem = isDatePast(jadwal.tanggal_pengambilan);
                                                                        const color = category ? getCategoryColor(category.name) : 'secondary';

                                                                        return (
                                                                            <tr key={jadwal.id}>
                                                                                <td><span className="badge bg-primary-lt">{sampel?.parameter || '-'}</span></td>
                                                                                <td><span className={`badge bg-${color}`}>{category?.name || '-'}</span></td>
                                                                                <td className="text-center"><span className="badge bg-info">{td?.qty || 0}</span></td>
                                                                                <td>
                                                                                    <div className="small fw-semibold">{new Date(jadwal.tanggal_pengambilan).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                                </td>
                                                                                <td><span className="fw-semibold">{formatTime(jadwal.jam_pengambilan)}</span></td>
                                                                                <td>
                                                                                    <div className="small" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{jadwal.lokasi}</div>
                                                                                </td>
                                                                                <td className="text-center">
                                                                                    <span className={`badge bg-${isPastItem ? 'warning text-dark' : 'success'}`}>{isPastItem ? 'Sudah Lewat' : 'Akan Datang'}</span>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}

                                        {/* Pagination */}
                                        {jadwalPagination.total > 0 && (
                                            <div className="card mt-3">
                                                <div className="card-footer d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small">Menampilkan {jadwalRange.start} - {jadwalRange.end} dari {jadwalPagination.total} jadwal</span>
                                                    <PaginationComponent
                                                        currentPage={jadwalPagination.currentPage}
                                                        perPage={jadwalPagination.perPage}
                                                        total={jadwalPagination.total}
                                                        onChange={(page) => fetchJadwal(page)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {/* ========== TAB 2: TRANSAKSI (CREATE) ========== */}
                        {activeTab === 'transaksi' && (
                            <>
                                {/* Search & Filter */}
                                <div className="card mb-3">
                                    <div className="card-body">
                                        <form onSubmit={handleSearch}>
                                            <div className="row g-2 align-items-center">
                                                <div className="col-md">
                                                    <div className="input-icon">
                                                        <span className="input-icon-addon">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                                                        </span>
                                                        <input type="text" className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari invoice atau nama..." />
                                                    </div>
                                                </div>
                                                <div className="col-auto">
                                                    <div className="btn-group">
                                                        <button type="button" className={`btn ${filterStatus === '' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleStatusFilter('')}>Semua</button>
                                                        <button type="button" className={`btn ${filterStatus === 'true' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleStatusFilter('true')}>Lunas</button>
                                                        <button type="button" className={`btn ${filterStatus === 'false' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => handleStatusFilter('false')}>Belum Bayar</button>
                                                    </div>
                                                </div>
                                                <div className="col-auto">
                                                    <button type="submit" className="btn btn-primary">Cari</button>
                                                </div>
                                                <div className="col-auto">
                                                    <button type="button" className="btn btn-outline-secondary" onClick={handleClearFilters}>Reset</button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Transaction List */}
                                {isLoadingTx ? (
                                    <div className="card">
                                        <div className="card-body text-center py-5">
                                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                            <p className="mt-3 text-muted">Memuat data transaksi...</p>
                                        </div>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="card">
                                        <div className="card-body text-center py-5">
                                            <div style={{ opacity: 0.4 }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 8v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-2" /></svg>
                                                <p className="text-muted mb-0">Belum ada data transaksi</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {transactions.map((transaction, index) => {
                                            const isExpanded = expandedRows[transaction.id];
                                            const details = transaction.transaction_details || [];
                                            const allPaid = details.length > 0 && details.every((d) => d.status_bayar);
                                            const somePaid = details.some((d) => d.status_bayar);
                                            const groupedDetails = getDetailsGroupedByCategory(details);

                                            return (
                                                <div className="card mb-3" key={transaction.id}>
                                                    <div className="card-header cursor-pointer" onClick={() => toggleRow(transaction.id)} style={{ cursor: 'pointer' }}>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <span className="badge bg-primary-lt" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>#{getRowNumber(index)}</span>
                                                                <div>
                                                                    <div className="fw-bold">{transaction.invoice || `INV-${transaction.id}`}</div>
                                                                    <div className="text-muted small">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>
                                                                        {transaction.user?.name || '-'}
                                                                        <span className="ms-2">{formatDateTime(transaction.created_at)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-3">
                                                                {somePaid && (
                                                                    <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); openCreateModal(transaction); }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                                                                        Buat Jadwal
                                                                    </button>
                                                                )}
                                                                <div className="text-end">
                                                                    <div className="fw-bold text-primary fs-5">{formatCurrency(transaction.grand_total)}</div>
                                                                    <div className="d-flex gap-1 justify-content-end">
                                                                        <span className="badge bg-info-lt">{details.length} item</span>
                                                                        {getPaymentBadge(allPaid || (somePaid && details.filter(d => d.status_bayar).length === details.length))}
                                                                    </div>
                                                                </div>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="card-body pt-0">
                                                            <div className="d-flex justify-content-between align-items-center p-2 mb-3 rounded" style={{ backgroundColor: 'var(--tblr-card-bg, #f8f9fa)' }}>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="avatar avatar-sm" style={{ backgroundColor: 'var(--tblr-primary)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
                                                                        {transaction.user?.name ? transaction.user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="fw-semibold small">{transaction.user?.name || '-'}</div>
                                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{transaction.user?.email || '-'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-muted small">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
                                                                    {formatDateTime(transaction.created_at)}
                                                                </div>
                                                            </div>

                                                            {Object.entries(groupedDetails).map(([catName, catDetails]) => {
                                                                const color = getCategoryColor(catName);
                                                                return (
                                                                    <div key={catName} className="mb-3">
                                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                                            <span className={`badge bg-${color}`} style={{ fontSize: '0.8rem' }}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 3h6v11l-3 3l-3 -3v-11z" /><path d="M7 21h10" /><path d="M9 14h6v3h-6z" /></svg>
                                                                                {catName}
                                                                            </span>
                                                                            <span className="text-muted small">{catDetails.length} parameter</span>
                                                                        </div>
                                                                        <div className="table-responsive">
                                                                            <table className="table table-vcenter table-sm">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Parameter</th>
                                                                                        <th className="text-center">Qty</th>
                                                                                        <th className="text-end">Harga</th>
                                                                                        <th className="text-center">Pembayaran</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {catDetails.map((detail) => (
                                                                                        <tr key={detail.id}>
                                                                                            <td className="fw-semibold">{detail.sampel?.parameter || '-'}</td>
                                                                                            <td className="text-center"><span className="badge bg-primary">{detail.qty}</span></td>
                                                                                            <td className="text-end fw-semibold">{formatCurrency(detail.price)}</td>
                                                                                            <td className="text-center">{getPaymentBadge(detail.status_bayar)}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                                <tfoot>
                                                                                    <tr>
                                                                                        <td colSpan="2" className="text-end text-muted small">Subtotal {catName}</td>
                                                                                        <td className="text-end fw-bold text-primary">{formatCurrency(catDetails.reduce((s, d) => s + (d.price || 0), 0))}</td>
                                                                                        <td></td>
                                                                                    </tr>
                                                                                </tfoot>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: 'rgba(32,107,196,0.08)' }}>
                                                                <span className="fw-bold">Grand Total</span>
                                                                <span className="fs-4 fw-bold text-primary">{formatCurrency(transaction.grand_total)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {txPagination.total > 0 && (
                                            <div className="card">
                                                <div className="card-footer d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small">Menampilkan {txRange.start} - {txRange.end} dari {txPagination.total} transaksi</span>
                                                    <PaginationComponent currentPage={txPagination.currentPage} perPage={txPagination.perPage} total={txPagination.total} onChange={(page) => fetchTransactions(page, search, filterStatus)} />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== CREATE SCHEDULE MODAL ========== */}
            {showCreateModal && selectedTransaction && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #206ba4, #2fb344)', color: 'white' }}>
                                <div className="d-flex align-items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                                    <h5 className="modal-title mb-0">Buat Jadwal Pengambilan</h5>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={closeCreateModal}></button>
                            </div>
                            <form onSubmit={handleSubmitSchedule}>
                                <div className="modal-body">
                                    {/* Transaction Info */}
                                    <div className="card mb-3" style={{ backgroundColor: 'var(--tblr-card-bg, #f8f9fa)' }}>
                                        <div className="card-body p-3">
                                            <div className="row">
                                                <div className="col-6">
                                                    <div className="text-muted small">Invoice</div>
                                                    <div className="fw-semibold">{selectedTransaction?.invoice || '-'}</div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-muted small">Pemohon</div>
                                                    <div className="fw-semibold">{selectedTransaction?.user?.name || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Paid Items List */}
                                    <div className="mb-3">
                                        <label className="form-label">Parameter Akan Dijadwalkan</label>
                                        <div className="card">
                                            <div className="card-body p-0">
                                                {(selectedTransaction?.transaction_details || [])
                                                    .filter((d) => d.status_bayar)
                                                    .map((detail, idx) => (
                                                        <div key={detail.id} className={`d-flex align-items-center gap-2 p-2 ${idx > 0 ? 'border-top' : ''}`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#2fb344', flexShrink: 0 }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                                                            <span className={`badge bg-${getCategoryColor(detail.sampel?.category?.name || 'X')}`}>{detail.sampel?.category?.name || '-'}</span>
                                                            <span className="fw-semibold">{detail.sampel?.parameter || '-'}</span>
                                                            <span className="text-muted ms-auto small">{formatCurrency(detail.price)} x {detail.qty}</span>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                        <div className="form-hint">Semua parameter lunas akan dijadwalkan dengan jadwal yang sama.</div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label required">Tanggal Pengambilan</label>
                                            <input type="date" className="form-control" name="tanggal_pengambilan" value={formData.tanggal_pengambilan} onChange={handleFormChange} min={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label required">Jam Pengambilan</label>
                                            <input type="time" className="form-control" name="jam_pengambilan" value={formData.jam_pengambilan} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label required">Lokasi Pengambilan</label>
                                        <input type="text" className="form-control" name="lokasi" value={formData.lokasi} onChange={handleFormChange} placeholder="cth: Puskesmas Kecamatan" />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Petugas</label>
                                        <input type="text" className="form-control" name="petugas" value={formData.petugas} onChange={handleFormChange} placeholder="cth: Tim Sanitarian A" />
                                    </div>
                                    <div className="mb-0">
                                        <label className="form-label">Catatan</label>
                                        <textarea className="form-control" name="catatan" value={formData.catatan} onChange={handleFormChange} rows={2} placeholder="cth: Bawa surat rujukan" />
                                        <div className="form-hint">Opsional. Informasi tambahan untuk pengambilan sampel.</div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary me-auto" onClick={closeCreateModal}>Batal</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? (<><span className="spinner-border spinner-border-sm me-2" role="status"></span>Menyimpan...</>) : (<><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>Buat Jadwal</>)}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== DETAIL BERITA ACARA MODAL ========== */}
            {showDetailModal && createPortal(
                <>
                    <style>{`
                        #berita-acara-modal {
                            position: fixed !important;
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            bottom: 0 !important;
                            width: 100vw !important;
                            height: 100vh !important;
                            z-index: 2000 !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            overflow-y: auto !important;
                        }
                        #berita-acara-modal .ba-dialog {
                            width: 1200px !important;
                            max-width: 95vw !important;
                            margin: 20px auto !important;
                        }
                        #berita-acara-modal .ba-content {
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                            width: 100% !important;
                            max-height: 92vh;
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                        }
                        #berita-acara-modal .ba-body {
                            flex: 1 1 auto;
                            overflow-y: auto;
                        }
                    `}</style>
                    <div id="berita-acara-modal" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="ba-dialog">
                            <div className="ba-content">
                            {isLoadingDetail ? (
                                <div className="ba-body text-center py-5">
                                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                    <p className="mt-3 text-muted">Memuat berita acara...</p>
                                </div>
                            ) : detailDataList.length > 0 ? (() => {
                                const first = detailDataList[0];
                                const tx = first.transaction_detail?.transaction;
                                const user = tx?.user;
                                // Group sampel by category
                                const catGrouped = {};
                                detailDataList.forEach((d) => {
                                    const catName = d.transaction_detail?.sampel?.category?.name || 'Lainnya';
                                    if (!catGrouped[catName]) catGrouped[catName] = [];
                                    catGrouped[catName].push(d);
                                });
                                const totalQty = detailDataList.reduce((s, d) => s + (d.transaction_detail?.qty || 0), 0);
                                const totalPrice = detailDataList.reduce((s, d) => s + (d.transaction_detail?.price || 0), 0);
                                // Collect unique catatan
                                const catatanList = [...new Set(detailDataList.map(d => d.catatan).filter(Boolean))];
                                const petugas = first.petugas;

                                return (
                                    <>
                                        <div className="modal-header py-2" style={{ background: 'linear-gradient(135deg, #206ba4, #2fb344)', color: 'white', flex: '0 0 auto' }}>
                                            <h6 className="modal-title mb-0 fw-bold">Berita Acara Pengambilan Sampel</h6>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
                                        </div>

                                        <div className="ba-body p-0">
                                            <div style={{ padding: '40px 48px', background: 'white', color: '#1a1a1a' }}>

                                                {/* LETTERHEAD */}
                                                <div style={{ textAlign: 'center', borderBottom: '3px double #206ba4', paddingBottom: '20px', marginBottom: '24px' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#666', letterSpacing: '1px', textTransform: 'uppercase' }}>Pemerintah Kabupaten Sidoarjo</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#206ba4', marginTop: '2px' }}>LABORATORIUM KESEHATAN DAERAH</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>Jl. Geluran No. 1, Taman, Sidoarjo 61214</div>
                                                </div>

                                                {/* TITLE */}
                                                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#1a1a1a' }}>Berita Acara</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '1px', color: '#333' }}>Pengambilan Sampel</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px' }}>Nomor: {tx?.invoice || '-'}</div>
                                                </div>

                                                {/* OPENING PARAGRAPH */}
                                                <div style={{ fontSize: '0.9rem', lineHeight: '1.8', marginBottom: '24px', textAlign: 'justify' }}>
                                                    Pada hari ini <strong>{new Date(first.tanggal_pengambilan).toLocaleDateString('id-ID', { weekday: 'long' })}</strong>,
                                                    tanggal <strong>{formatDateLong(first.tanggal_pengambilan)}</strong>,
                                                    pukul <strong>{formatTime(first.jam_pengambilan)} WIB</strong>,
                                                    bertempat di <strong>{first.lokasi}</strong>,
                                                    telah dilaksanakan pengambilan sampel dengan rincian sebagai berikut:
                                                </div>

                                                {/* SECTION: PEMOHON */}
                                                <div style={{ marginBottom: '24px' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#206ba4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>
                                                        A. Data Pemohon
                                                    </div>
                                                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                        <tbody>
                                                            <tr>
                                                                <td style={{ padding: '6px 0', width: '140px', color: '#666', verticalAlign: 'top' }}>Nama</td>
                                                                <td style={{ padding: '6px 12px', width: '12px', verticalAlign: 'top' }}>:</td>
                                                                <td style={{ padding: '6px 0', fontWeight: 600 }}>{user?.name || '-'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px 0', color: '#666', verticalAlign: 'top' }}>NIK</td>
                                                                <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>:</td>
                                                                <td style={{ padding: '6px 0' }}>{user?.nik || '-'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px 0', color: '#666', verticalAlign: 'top' }}>Telepon</td>
                                                                <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>:</td>
                                                                <td style={{ padding: '6px 0' }}>{user?.phone || '-'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px 0', color: '#666', verticalAlign: 'top' }}>Email</td>
                                                                <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>:</td>
                                                                <td style={{ padding: '6px 0' }}>{user?.email || '-'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* SECTION: SAMPEL - TABLE WITH ALL ITEMS */}
                                                <div style={{ marginBottom: '24px' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#206ba4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>
                                                        B. Data Sampel
                                                    </div>
                                                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: '#f0f4f8' }}>
                                                                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #d0d7de', width: '36px' }}>No</th>
                                                                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #d0d7de' }}>Parameter</th>
                                                                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #d0d7de' }}>Kategori</th>
                                                                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #d0d7de' }}>Qty</th>
                                                                <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #d0d7de' }}>Hasil</th>
                                                                <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '2px solid #d0d7de' }}>Harga</th>
                                                                <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #d0d7de' }}>Status Bayar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(catGrouped).map(([catName, catItems], catIdx) => {
                                                                const color = getCategoryColor(catName);
                                                                return catItems.map((d, itemIdx) => {
                                                                    const td = d.transaction_detail;
                                                                    const num = catIdx === 0 ? itemIdx + 1 : Object.values(catGrouped).slice(0, catIdx).reduce((s, arr) => s + arr.length, 0) + itemIdx + 1;
                                                                    // Extract hasil safely: can be object, array, or string
                                                                    const rawHasil = td?.sampel?.hasil;
                                                                    let hasilText = '-';
                                                                    let hasilMetode = '';
                                                                    if (rawHasil) {
                                                                        if (Array.isArray(rawHasil)) {
                                                                            const latest = rawHasil[rawHasil.length - 1];
                                                                            hasilText = (typeof latest === 'object' ? latest?.hasil : latest) || '-';
                                                                            hasilMetode = (typeof latest === 'object' ? latest?.metode : '') || '';
                                                                        } else if (typeof rawHasil === 'object') {
                                                                            hasilText = rawHasil.hasil || '-';
                                                                            hasilMetode = rawHasil.metode || '';
                                                                        } else {
                                                                            hasilText = String(rawHasil);
                                                                        }
                                                                    }
                                                                    const hasResult = hasilText && hasilText !== '-';
                                                                    return (
                                                                        <tr key={d.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                                            <td style={{ padding: '7px 10px', textAlign: 'center' }}>{num}</td>
                                                                            <td style={{ padding: '7px 10px', fontWeight: 500 }}>{td?.sampel?.parameter || '-'}</td>
                                                                            <td style={{ padding: '7px 10px' }}><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: `var(--tblr-${color}-rgb, 0.1)`, color: `var(--tblr-${color})` }}>{catName}</span></td>
                                                                            <td style={{ padding: '7px 10px', textAlign: 'center' }}>{td?.qty || 0}</td>
                                                                            <td style={{ padding: '7px 10px' }}>
                                                                                {hasResult ? (
                                                                                    <div>
                                                                                        <div style={{ fontWeight: 600, color: '#206ba4' }}>{hasilText}</div>
                                                                                        {hasilMetode && <div style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>{hasilMetode}</div>}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span style={{ color: '#aaa', fontStyle: 'italic' }}>Belum ada hasil</span>
                                                                                )}
                                                                            </td>
                                                                            <td style={{ padding: '7px 10px', textAlign: 'right' }}>{formatCurrency(td?.price)}</td>
                                                                            <td style={{ padding: '7px 10px', textAlign: 'center' }}>{td?.status_bayar ? 'Lunas' : 'Belum Bayar'}</td>
                                                                        </tr>
                                                                    );
                                                                });
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr style={{ backgroundColor: '#f0f4f8', fontWeight: 600 }}>
                                                                <td colSpan="3" style={{ padding: '8px 10px', textAlign: 'right' }}>Total</td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{totalQty}</td>
                                                                <td></td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(totalPrice)}</td>
                                                                <td></td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>

                                                {/* SECTION: PENJADWALAN */}
                                                <div style={{ marginBottom: '24px' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#206ba4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>
                                                        C. Jadwal Pengambilan
                                                    </div>
                                                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                        <tbody>
                                                            <tr>
                                                                <td style={{ padding: '6px 0', width: '140px', color: '#666', verticalAlign: 'top' }}>Hari / Tanggal</td>
                                                                <td style={{ padding: '6px 12px', width: '12px', verticalAlign: 'top' }}>:</td>
                                                                <td style={{ padding: '6px 0', fontWeight: 600 }}>{new Date(first.tanggal_pengambilan).toLocaleDateString('id-ID', { weekday: 'long' })}, {formatDateLong(first.tanggal_pengambilan)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px 0', color: '#666', verticalAlign: 'top' }}>Waktu</td>
                                                                <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>:</td>
                                                                <td style={{ padding: '6px 0', fontWeight: 600 }}>{formatTime(first.jam_pengambilan)} WIB</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px 0', color: '#666', verticalAlign: 'top' }}>Lokasi</td>
                                                                <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>:</td>
                                                                <td style={{ padding: '6px 0' }}>{first.lokasi}</td>
                                                            </tr>
                                                            {petugas && (
                                                                <tr>
                                                                    <td style={{ padding: '6px 0', color: '#666', verticalAlign: 'top' }}>Petugas</td>
                                                                    <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>:</td>
                                                                    <td style={{ padding: '6px 0' }}>{petugas}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* SECTION: CATATAN */}
                                                {catatanList.length > 0 && (
                                                    <div style={{ marginBottom: '24px' }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#206ba4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>
                                                            D. Catatan
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', lineHeight: '1.7', padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: '6px', borderLeft: '3px solid #206ba4' }}>
                                                            {catatanList.join('; ')}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* DIVIDER */}
                                                <div style={{ borderTop: '1px solid #e5e7eb', margin: '32px 0' }}></div>

                                                {/* SIGNATURE SECTION */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <div style={{ textAlign: 'center', width: '45%' }}>
                                                        <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Pemohon,</div>
                                                        <div style={{ height: '70px' }}></div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, borderTop: '1px solid #1a1a1a', display: 'inline-block', paddingTop: '4px', minWidth: '200px' }}>
                                                            {user?.name || '..........................'}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'center', width: '45%' }}>
                                                        <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Petugas Pengambil,</div>
                                                        <div style={{ height: '70px' }}></div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, borderTop: '1px solid #1a1a1a', display: 'inline-block', paddingTop: '4px', minWidth: '200px' }}>
                                                            {petugas || '..........................'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* FOOTER TIMESTAMP */}
                                                <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.75rem', color: '#aaa' }}>
                                                    Dokumen ini dicetak secara otomatis pada {formatDateTime(first.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-footer py-2" style={{ flex: '0 0 auto' }}>
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
                                            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 13m0 2a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M7 15v4h10v-4" /></svg>
                                                Cetak
                                            </button>
                                        </div>
                                    </>
                                );
                            })() : (
                                <div className="ba-body text-center py-5">
                                    <p className="text-muted">Data tidak ditemukan</p>
                                    <button className="btn btn-outline-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </>,
                document.body
            )}
        </LayoutAdmin>
    );
}
