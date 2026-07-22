import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import LayoutAdmin from '../../layouts/admin';
import PaginationComponent from '../../components/Pagination';
import Swal from 'sweetalert2';
import { encodeId } from '../../utils/hashids';

export default function Penjadwalan() {
    const navigate = useNavigate();
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

    // Admin Payment states & handlers
    const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
    const [adminPaymentTx, setAdminPaymentTx] = useState(null);
    const [adminNoFa, setAdminNoFa] = useState('');
    const [adminQrisFile, setAdminQrisFile] = useState(null);
    const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

    const openPaymentInfoModal = (transaction) => {
        setAdminPaymentTx(transaction);
        setAdminNoFa(transaction.no_fa || '');
        setAdminQrisFile(null);
        setShowPaymentInfoModal(true);
    };

    const closePaymentInfoModal = () => {
        setShowPaymentInfoModal(false);
        setAdminPaymentTx(null);
        setAdminNoFa('');
        setAdminQrisFile(null);
    };

    const handlePaymentInfoSubmit = async (e) => {
        e.preventDefault();
        if (!adminNoFa && !adminQrisFile && !adminPaymentTx?.qris && !adminPaymentTx?.no_fa) {
            Swal.fire({ icon: 'warning', title: 'Input Kosong', text: 'Masukkan Nomor FA atau pilih file QRIS!' });
            return;
        }

        setIsAdminSubmitting(true);
        const token = Cookies.get('token');
        const formData = new FormData();
        if (adminNoFa) formData.append('no_fa', adminNoFa);
        if (adminQrisFile) formData.append('qris', adminQrisFile);

        try {
            Api.defaults.headers.common['Authorization'] = token;
            await Api.put(`/api/transactions/${adminPaymentTx.id}/payment-info`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Informasi pembayaran berhasil diperbarui!' });
            closePaymentInfoModal();
            fetchTransactions(txPagination.currentPage, search, filterStatus);
        } catch (error) {
            console.error('Error saving payment info:', error);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui informasi pembayaran!' });
        } finally {
            setIsAdminSubmitting(false);
        }
    };

    const handleConfirmLunas = async (transaction) => {
        const result = await Swal.fire({
            title: 'Konfirmasi Lunas',
            text: `Apakah Anda yakin ingin menandai transaksi ${transaction.invoice} sebagai LUNAS?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Lunas',
            cancelButtonText: 'Batal',
        });

        if (result.isConfirmed) {
            const token = Cookies.get('token');
            try {
                Api.defaults.headers.common['Authorization'] = token;
                await Api.put(`/api/transactions/${transaction.id}/confirm-paid`);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Transaksi dikonfirmasi Lunas!' });
                fetchTransactions(txPagination.currentPage, search, filterStatus);
            } catch (error) {
                console.error('Error confirming payment:', error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengonfirmasi pembayaran!' });
            }
        }
    };

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

    const getImageUrl = (filename) => {
        if (!filename) return '';
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            return filename;
        }
        const cleanPath = filename.startsWith('/uploads/') 
            ? filename.replace('/uploads/', '') 
            : filename.startsWith('uploads/') 
                ? filename.replace('uploads/', '') 
                : filename;
        return `${import.meta.env.VITE_APP_BASEURL}/uploads/${cleanPath}`;
    };

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

        // Prefill from the first existing schedule if present
        const paidDetails = (transaction?.transaction_details || []).filter((d) => d.status_bayar);
        const firstScheduled = paidDetails.find((d) => d.JadwalPengambilan && d.JadwalPengambilan.length > 0);
        if (firstScheduled && firstScheduled.JadwalPengambilan.length > 0) {
            const existing = firstScheduled.JadwalPengambilan[0];
            setFormData({
                tanggal_pengambilan: existing.tanggal_pengambilan ? existing.tanggal_pengambilan.slice(0, 10) : '',
                jam_pengambilan: existing.jam_pengambilan || '',
                lokasi: existing.lokasi || '',
                petugas: existing.petugas || '',
                catatan: existing.catatan || '',
            });
        } else {
            setFormData({ tanggal_pengambilan: '', jam_pengambilan: '', lokasi: '', petugas: '', catatan: '' });
        }
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
            return (
                <span className="badge bg-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                    Lunas Bayar
                </span>
            );
        }
        return (
            <span className="badge bg-warning text-dark">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6.5 7h11" /><path d="M6.5 17h11" /><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" /></svg>
                Belum Lunas
            </span>
        );
    };

    const getOverallPaymentBadge = (details) => {
        if (!details || details.length === 0) return getPaymentBadge(false);
        const allPaid = details.every((d) => d.status_bayar);
        const somePaid = details.some((d) => d.status_bayar);

        if (allPaid) {
            return (
                <span className="badge bg-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                    Lunas Bayar
                </span>
            );
        }
        if (somePaid) {
            return (
                <span className="badge bg-info text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                    Sebagian Lunas
                </span>
            );
        }
        return (
            <span className="badge bg-warning text-dark">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6.5 7h11" /><path d="M6.5 17h11" /><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" /></svg>
                Belum Lunas
            </span>
        );
    };

    const getScheduleInfo = (transaction) => {
        const details = transaction?.transaction_details || [];
        const paidDetails = details.filter((d) => d.status_bayar);
        // Prisma returns the relation as 'JadwalPengambilan' (PascalCase array)
        const scheduledDetails = paidDetails.filter((d) =>
            d.JadwalPengambilan && d.JadwalPengambilan.length > 0
        );
        const count = scheduledDetails.length;
        const totalPaid = paidDetails.length;
        const hasSchedule = count > 0;
        const isComplete = totalPaid > 0 && count >= totalPaid;
        const isPartial = hasSchedule && !isComplete;

        return {
            count,
            totalPaid,
            hasSchedule,
            isComplete,
            isPartial,
            scheduledDetails,
            paidDetails
        };
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
                .btn-3d-primary:active {
                    transform: translate(2px, 2px);
                    box-shadow: 1px 1px 0px #000000 !important;
                }
                .btn-3d-success {
                    background: #16a34a !important;
                    color: #ffffff !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    transition: all 0.1s ease-in-out !important;
                }
                .btn-3d-success:hover {
                    background: #15803d !important;
                    color: #ffffff !important;
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0px #000000 !important;
                }
                .btn-3d-warning {
                    background: #eab308 !important;
                    color: #000000 !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    transition: all 0.1s ease-in-out !important;
                }
                .btn-3d-danger {
                    background: #dc2626 !important;
                    color: #ffffff !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    transition: all 0.1s ease-in-out !important;
                }
                .btn-3d-outline-danger {
                    background: #ffffff !important;
                    color: #dc2626 !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                }
                .btn-3d-outline-danger:hover {
                    background: #fef2f2 !important;
                    color: #b91c1c !important;
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0px #000000 !important;
                }
                .btn-3d-outline-success {
                    background: #ffffff !important;
                    color: #16a34a !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                }
                .btn-3d-outline-success:hover {
                    background: #f0fdf4 !important;
                    color: #15803d !important;
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
                .modal-content-3d {
                    border: 3.5px solid #000000 !important;
                    box-shadow: 10px 10px 0px #000000 !important;
                    border-radius: 24px !important;
                    overflow: hidden;
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
                                    ✨ Penjadwalan Laboratorium
                                </h2>
                                <div className="text-muted mt-1 fw-semibold">Kelola jadwal pengambilan sampel uji dengan tampilan 3D</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-fluid px-3 px-lg-4">
                        {/* 3D Workflow Step Banner */}
                        <div className="card mb-4 banner-3d p-3" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)' }}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 text-start">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="badge-3d bg-primary text-white fs-5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                                        1
                                    </div>
                                    <div>
                                        <h5 className="fw-extrabold mb-1 text-dark" style={{ fontSize: '1.05rem' }}>Langkah 1 dari 3: Penjadwalan Sampel & Pengambilan</h5>
                                        <small className="text-muted fw-semibold">Setelah transaksi LUNAS BAYAR ➜ <strong>Buat Jadwal terlebih dahulu</strong> ➜ Lalu lanjut ke Isi Hasil Uji</small>
                                    </div>
                                </div>
                                <Link to="/hasil" className="btn btn-3d-primary px-3 py-2">
                                    Lanjut ke Langkah 2: Isi Hasil ➔
                                </Link>
                            </div>
                        </div>

                        {/* 3D Segmented Tab Control */}
                        <div className="card mb-4 card-3d p-2">
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <button
                                        type="button"
                                        className={`btn w-100 py-3 ${activeTab === 'jadwal' ? 'btn-3d-primary' : 'btn-3d-secondary'}`}
                                        onClick={() => { setActiveTab('jadwal'); fetchJadwal(jadwalPagination.currentPage); }}
                                        style={{ fontSize: '0.95rem' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                                        📋 Daftar Jadwal Pengambilan
                                    </button>
                                </div>
                                <div className="col-md-6">
                                    <button
                                        type="button"
                                        className={`btn w-100 py-3 ${activeTab === 'transaksi' ? 'btn-3d-primary' : 'btn-3d-secondary'}`}
                                        onClick={() => { setActiveTab('transaksi'); fetchTransactions(txPagination.currentPage, search, filterStatus); }}
                                        style={{ fontSize: '0.95rem' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 8v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2v-2" /></svg>
                                        ➕ Buat Jadwal dari Transaksi
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ========== TAB 1: JADWAL LIST ========== */}
                        {activeTab === 'jadwal' && (
                            <>
                                {/* 3D Summary Cards */}
                                <div className="row row-cards mb-4">
                                    <div className="col-md-4">
                                        <div className="card card-3d p-2">
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="badge-3d bg-primary text-white me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small fw-bold uppercase">Total Jadwal</div>
                                                        <div className="fs-2 fw-extrabold text-dark">{jadwalPagination.total}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card card-3d p-2">
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="badge-3d bg-success text-white me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small fw-bold uppercase">Akan Datang</div>
                                                        <div className="fs-2 fw-extrabold text-success">{jadwalList.filter(j => !isDatePast(j.tanggal_pengambilan)).length}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card card-3d p-2">
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="badge-3d bg-warning text-dark me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small fw-bold uppercase">Sudah Lewat</div>
                                                        <div className="fs-2 fw-extrabold text-warning">{jadwalList.filter(j => isDatePast(j.tanggal_pengambilan)).length}</div>
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
                                                    <div className="card mb-4 card-3d" key={key}>
                                                        <div className="card-header py-3" style={{ background: '#fafafa', borderBottom: '2px solid #000' }}>
                                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <span className="badge-3d bg-primary text-white" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>{group.invoice}</span>
                                                                    <div>
                                                                        <div className="fw-extrabold text-dark" style={{ fontSize: '0.95rem' }}>{group.user?.name || '-'}</div>
                                                                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{group.user?.email || '-'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="d-flex gap-1">
                                                                        {upcoming > 0 && <span className="badge-3d bg-success text-white" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>{upcoming} Akan Datang</span>}
                                                                        {past > 0 && <span className="badge-3d bg-warning text-dark" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>{past} Sudah Lewat</span>}
                                                                    </div>
                                                                    {(() => {
                                                                        const existingBA = group.items.find(j => j.berita_acara)?.berita_acara;
                                                                        if (existingBA) {
                                                                            return (
                                                                                <button className="btn btn-3d-success btn-sm d-flex align-items-center gap-1" onClick={() => navigate(`/berita-acara/${existingBA.id}`)}>
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>
                                                                                    Lihat Berita Acara ({existingBA.no_berita_acara})
                                                                                </button>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <button className="btn btn-3d-primary btn-sm d-flex align-items-center gap-1" onClick={() => handleViewDetail(group.items)}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>
                                                                                Pratinjau Berita Acara
                                                                            </button>
                                                                        );
                                                                    })()}
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
                                {/* 3D Search & Filter Card */}
                                <div className="card mb-4 card-3d">
                                    <div className="card-body p-3">
                                        <form onSubmit={handleSearch}>
                                            <div className="row g-2 align-items-center">
                                                <div className="col-md">
                                                    <div className="input-icon">
                                                        <span className="input-icon-addon">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                                                        </span>
                                                        <input type="text" className="form-control form-control-3d" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Cari invoice, NIK, atau nama pemohon..." style={{ paddingLeft: '42px' }} />
                                                    </div>
                                                </div>
                                                <div className="col-12 col-md-auto">
                                                    <div className="d-flex gap-2 flex-wrap">
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm fw-bold ${filterStatus === '' ? 'btn-3d-primary' : 'btn-3d-secondary'}`}
                                                            onClick={() => handleStatusFilter('')}
                                                            style={{ minWidth: '110px' }}
                                                        >
                                                            🗂️ Semua Status
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm fw-bold ${filterStatus === 'false' ? 'btn-3d-warning' : 'btn-3d-secondary'}`}
                                                            onClick={() => handleStatusFilter('false')}
                                                            style={{ minWidth: '110px' }}
                                                        >
                                                            ⏳ Belum Lunas
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm fw-bold ${filterStatus === 'true' ? 'btn-3d-success' : 'btn-3d-secondary'}`}
                                                            onClick={() => handleStatusFilter('true')}
                                                            style={{ minWidth: '110px' }}
                                                        >
                                                            ✅ Lunas Bayar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="col-auto">
                                                    <button type="submit" className="btn btn-sm btn-3d-primary px-3">🔍 Cari</button>
                                                </div>
                                                <div className="col-auto">
                                                    <button type="button" className="btn btn-sm btn-3d-secondary px-3" onClick={handleClearFilters}>🔄 Reset</button>
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
                                                <div className="card mb-4 card-3d" key={transaction.id}>
                                                    <div className="card-header cursor-pointer py-3" onClick={() => toggleRow(transaction.id)} style={{ cursor: 'pointer', background: '#fafafa', borderBottom: '2px solid #000' }}>
                                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <span className="badge-3d bg-primary text-white" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>#{getRowNumber(index)}</span>
                                                                <div>
                                                                    <div className="fw-extrabold text-dark" style={{ fontSize: '1.05rem' }}>{transaction.invoice || `INV-${transaction.id}`}</div>
                                                                    <div className="text-muted small d-flex flex-wrap align-items-center gap-2 mt-1">
                                                                        <span className="fw-bold text-dark">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>
                                                                            {transaction.user?.name || '-'}
                                                                        </span>
                                                                        {transaction.user?.phone && (
                                                                            <span className="badge-3d bg-light text-dark" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                                                📞 {transaction.user.phone}
                                                                            </span>
                                                                        )}
                                                                        {transaction.user?.nik && (
                                                                            <span className="badge-3d bg-light text-muted" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                                                NIK: {transaction.user.nik}
                                                                            </span>
                                                                        )}
                                                                        <span className="ms-1 text-muted" style={{ fontSize: '0.75rem' }}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
                                                                            {formatDateTime(transaction.created_at)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-3d-outline-danger btn-sm d-flex align-items-center gap-1" 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        window.open(`/invoice/${encodeId(transaction.id)}`, '_blank');
                                                                    }}
                                                                    title="Download PDF Invoice untuk SPJ"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M12 17v-6" /><path d="M9 14l3 3l3 -3" /></svg>
                                                                    PDF SPJ
                                                                </button>

                                                                {/* Dynamic Schedule 3D Action Button */}
                                                                {(() => {
                                                                    const schedInfo = getScheduleInfo(transaction);
                                                                    if (schedInfo.isComplete) {
                                                                        return (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-3d-outline-success btn-sm d-flex align-items-center gap-1"
                                                                                onClick={(e) => { e.stopPropagation(); openCreateModal(transaction); }}
                                                                                title="Edit / Ubah Jadwal Pengambilan"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>
                                                                                ✏️ Edit / Ubah Jadwal
                                                                            </button>
                                                                        );
                                                                    }
                                                                    if (schedInfo.isPartial) {
                                                                        return (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-3d-warning btn-sm d-flex align-items-center gap-1"
                                                                                onClick={(e) => { e.stopPropagation(); openCreateModal(transaction); }}
                                                                                title="Lengkapi Jadwal"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                                                                                ➕ Lengkapi Jadwal ({schedInfo.count}/{schedInfo.totalPaid})
                                                                            </button>
                                                                        );
                                                                    }
                                                                    if (somePaid) {
                                                                        return (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-3d-primary btn-sm d-flex align-items-center gap-1"
                                                                                onClick={(e) => { e.stopPropagation(); openCreateModal(transaction); }}
                                                                                title="Buat Jadwal Pengambilan Sampel Baru"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                                                                                📅 Buat Jadwal
                                                                            </button>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <button type="button" className="btn btn-3d-secondary btn-sm text-muted" disabled>
                                                                            🔒 Belum Lunas
                                                                        </button>
                                                                    );
                                                                })()}

                                                                <div className="text-end">
                                                                    <div className="fw-extrabold text-primary fs-5">{formatCurrency(transaction.grand_total)}</div>
                                                                    <div className="d-flex gap-1 justify-content-end align-items-center">
                                                                        <span className="badge-3d bg-info text-white" style={{ fontSize: '0.75rem' }}>{details.length} item</span>
                                                                        {getOverallPaymentBadge(details)}
                                                                        {(() => {
                                                                            const schedInfo = getScheduleInfo(transaction);
                                                                            if (schedInfo.isComplete) {
                                                                                return (
                                                                                    <span className="badge-3d bg-success text-white" style={{ fontSize: '0.75rem' }}>
                                                                                        ✅ Terjadwal ({schedInfo.count}/{schedInfo.totalPaid})
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            if (schedInfo.isPartial) {
                                                                                return (
                                                                                    <span className="badge-3d bg-warning text-dark" style={{ fontSize: '0.75rem' }}>
                                                                                        ⏳ Sebagian ({schedInfo.count}/{schedInfo.totalPaid})
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            if (schedInfo.totalPaid > 0) {
                                                                                return (
                                                                                    <span className="badge-3d bg-danger text-white" style={{ fontSize: '0.75rem' }}>
                                                                                        ⚠️ Belum Ada Jadwal
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="card-body pt-3">
                                                            {/* Information Card: Who Ordered */}
                                                            <div className="card mb-3 border-primary-subtle" style={{ backgroundColor: 'rgba(32,107,196,0.03)', border: '1px solid rgba(32,107,196,0.15)' }}>
                                                                <div className="card-body p-3">
                                                                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                                                                        <h6 className="card-title mb-0 d-flex align-items-center text-primary" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>
                                                                            Informasi Pemesan (Orderer Details)
                                                                        </h6>
                                                                        <span className="badge bg-primary-lt" style={{ fontSize: '0.75rem' }}>User ID #{transaction.user?.id || '-'}</span>
                                                                    </div>
                                                                    <div className="row g-2">
                                                                        <div className="col-md-3 col-6">
                                                                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Nama Pemohon</div>
                                                                            <div className="fw-bold text-dark">{transaction.user?.name || '-'}</div>
                                                                        </div>
                                                                        <div className="col-md-3 col-6">
                                                                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>NIK</div>
                                                                            <div className="fw-semibold text-dark">{transaction.user?.nik || '-'}</div>
                                                                        </div>
                                                                        <div className="col-md-3 col-6">
                                                                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>No. Telepon / WA</div>
                                                                            <div className="fw-semibold text-dark">{transaction.user?.phone || '-'}</div>
                                                                        </div>
                                                                        <div className="col-md-3 col-6">
                                                                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Email</div>
                                                                            <div className="fw-semibold text-dark">{transaction.user?.email || '-'}</div>
                                                                        </div>
                                                                    </div>
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

                                                            <div className="d-flex justify-content-between align-items-center p-3 rounded flex-wrap gap-2" style={{ backgroundColor: 'rgba(32,107,196,0.08)' }}>
                                                                <div>
                                                                    <span className="fw-bold me-2">Grand Total:</span>
                                                                    <span className="fs-4 fw-bold text-primary">{formatCurrency(transaction.grand_total)}</span>
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-danger btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
                                                                    onClick={() => window.open(`/invoice/${encodeId(transaction.id)}`, '_blank')}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M12 17v-6" /><path d="M9 14l3 3l3 -3" /></svg>
                                                                    Download PDF Invoice (SPJ)
                                                                </button>
                                                            </div>

                                                            {/* Admin Payment Management Actions */}
                                                            {!allPaid && (
                                                                <div className="payment-admin-panel mt-3 p-3 rounded border text-start" style={{ backgroundColor: '#fdfcfe', borderColor: '#d3c3e5' }}>
                                                                    <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-primary" style={{ verticalAlign: 'middle' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3" /><path d="M20 12v4a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-4" /><path d="M16 12h4v4h-4z" /></svg>
                                                                        Kelola Pembayaran & Tagihan
                                                                    </h6>
                                                                    
                                                                    <div className="row g-3 align-items-center">
                                                                        <div className="col-md-6">
                                                                            <div className="small text-muted" style={{ fontSize: '0.8rem' }}>Status Rincian Pembayaran:</div>
                                                                            {transaction.no_fa || transaction.qris ? (
                                                                                <div className="mt-1 d-flex align-items-center gap-2">
                                                                                    <span className="badge bg-success-lt" style={{ fontSize: '0.8rem' }}>Nomor FA & QRIS Sudah Terpasang</span>
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-xs btn-outline-primary px-2"
                                                                                        onClick={() => openPaymentInfoModal(transaction)}
                                                                                    >
                                                                                        Edit Info
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="mt-1 d-flex align-items-center gap-2">
                                                                                    <span className="badge bg-warning-lt text-warning" style={{ fontSize: '0.8rem' }}>Belum diinput oleh Admin</span>
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-sm btn-primary py-1 px-2"
                                                                                        onClick={() => openPaymentInfoModal(transaction)}
                                                                                        style={{ fontSize: '0.85rem' }}
                                                                                    >
                                                                                        Input FA & QRIS
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        <div className="col-md-6 text-md-end text-start">
                                                                            {transaction.payment_proof ? (
                                                                                <div className="d-flex flex-column align-items-md-end align-items-start gap-2">
                                                                                    <div className="small text-success d-flex align-items-center gap-2 justify-content-end w-100" style={{ fontSize: '0.85rem' }}>
                                                                                        <span>✔ Bukti Pembayaran Terkirim</span>
                                                                                        <a 
                                                                                            href={getImageUrl(transaction.payment_proof)} 
                                                                                            target="_blank" 
                                                                                            rel="noopener noreferrer"
                                                                                            className="btn btn-sm btn-outline-info py-0 px-2"
                                                                                            style={{ fontSize: '0.8rem' }}
                                                                                        >
                                                                                            Lihat Bukti
                                                                                        </a>
                                                                                    </div>
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-success btn-sm text-white"
                                                                                        onClick={() => handleConfirmLunas(transaction)}
                                                                                    >
                                                                                        Konfirmasi Lunas (Setujui)
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="d-flex flex-column align-items-md-end align-items-start gap-2">
                                                                                    <span className="text-muted small" style={{ fontSize: '0.8rem' }}>Menunggu upload bukti bayar dari user</span>
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-outline-success btn-sm"
                                                                                        onClick={() => handleConfirmLunas(transaction)}
                                                                                    >
                                                                                        Tandai Lunas Langsung
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Admin Payment Archive (If Paid) */}
                                                            {allPaid && (transaction.no_fa || transaction.qris || transaction.payment_proof) && (
                                                                <div className="payment-admin-panel mt-3 p-3 rounded border text-start" style={{ backgroundColor: '#f0fdf4', borderColor: '#b7ebc6' }}>
                                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                                        <h6 className="fw-bold text-success mb-0 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-success" style={{ verticalAlign: 'middle' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                                                                            Arsip & Bukti Pembayaran (Lunas)
                                                                        </h6>
                                                                        <button 
                                                                            type="button" 
                                                                            className="btn btn-xs btn-outline-success px-2 py-1"
                                                                            onClick={() => openPaymentInfoModal(transaction)}
                                                                            style={{ fontSize: '0.75rem' }}
                                                                        >
                                                                            Edit FA / QRIS
                                                                        </button>
                                                                    </div>
                                                                    <div className="row g-3 align-items-center">
                                                                        <div className="col-md-6">
                                                                            {transaction.no_fa && (
                                                                                <div className="mb-2">
                                                                                    <span className="text-muted small d-block" style={{ fontSize: '0.75rem' }}>Nomor FA / Virtual Account:</span>
                                                                                    <strong className="text-success">{transaction.no_fa}</strong>
                                                                                </div>
                                                                            )}
                                                                            {transaction.qris && (
                                                                                <div>
                                                                                    <span className="text-muted small d-block mb-1" style={{ fontSize: '0.75rem' }}>Kode QRIS:</span>
                                                                                    {/\.(jpg|jpeg|png|webp|svg)$/i.test(transaction.qris) || transaction.qris.startsWith('http') ? (
                                                                                        <a 
                                                                                            href={getImageUrl(transaction.qris)} 
                                                                                            target="_blank" 
                                                                                            rel="noopener noreferrer"
                                                                                        >
                                                                                            <img 
                                                                                                src={getImageUrl(transaction.qris)} 
                                                                                                alt="QRIS" 
                                                                                                onError={(e) => {
                                                                                                    e.target.style.display = 'none';
                                                                                                    if (e.target.nextSibling) {
                                                                                                        e.target.nextSibling.style.display = 'inline-block';
                                                                                                    }
                                                                                                }}
                                                                                                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', border: '1px solid #b7ebc6', borderRadius: '4px', padding: '2px', backgroundColor: '#fff' }} 
                                                                                            />
                                                                                            <span className="badge bg-success-lt font-monospace" style={{ display: 'none', fontSize: '0.8rem' }}>
                                                                                                {transaction.qris}
                                                                                            </span>
                                                                                        </a>
                                                                                    ) : (
                                                                                        <span className="badge bg-success-lt font-monospace" style={{ fontSize: '0.85rem', padding: '5px 8px' }}>
                                                                                            {transaction.qris}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="col-md-6 text-md-end text-start">
                                                                            {transaction.payment_proof ? (
                                                                                <div className="d-flex align-items-center justify-content-md-end gap-2">
                                                                                    <span className="text-muted small" style={{ fontSize: '0.8rem' }}>Bukti Transfer:</span>
                                                                                    <a 
                                                                                        href={getImageUrl(transaction.payment_proof)} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className="btn btn-sm btn-success text-white d-flex align-items-center gap-1"
                                                                                        style={{ fontSize: '0.8rem' }}
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg>
                                                                                        Lihat Bukti
                                                                                    </a>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-muted small" style={{ fontSize: '0.8rem' }}>Dibayar tanpa unggah bukti (Kasir/Manual)</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
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

            {/* ========== INPUT PAYMENT INFO MODAL ========== */}
            {showPaymentInfoModal && adminPaymentTx && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title mb-0 text-white">Input Informasi Pembayaran</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closePaymentInfoModal}></button>
                            </div>
                            <form onSubmit={handlePaymentInfoSubmit}>
                                <div className="modal-body text-start">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Invoice</label>
                                        <div className="form-control bg-light">{adminPaymentTx.invoice}</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Nomor FA / Virtual Account</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={adminNoFa} 
                                            onChange={(e) => setAdminNoFa(e.target.value)} 
                                            placeholder="Masukkan nomor VA/FA pembayaran" 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Upload Kode QRIS</label>
                                        <input 
                                            type="file" 
                                            className="form-control" 
                                            accept="image/*"
                                            onChange={(e) => setAdminQrisFile(e.target.files[0])} 
                                        />
                                        <small className="text-muted mt-1 d-block">Pilih gambar kode QRIS pembayaran</small>
                                        
                                        {adminPaymentTx.qris && (
                                            <div className="mt-2 text-start">
                                                <div className="text-muted small">QRIS saat ini:</div>
                                                <img 
                                                    src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${adminPaymentTx.qris}`} 
                                                    alt="QRIS Current" 
                                                    style={{ maxWidth: '100px', height: 'auto', border: '1px solid #ddd', padding: '3px', borderRadius: '4px' }} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closePaymentInfoModal}>Batal</button>
                                    <button type="submit" className="btn btn-primary text-white" disabled={isAdminSubmitting}>
                                        {isAdminSubmitting ? 'Menyimpan...' : 'Simpan Informasi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
                                // Get pemohon from transaction user, fallback to logged-in user
                                const txUser = tx?.user;
                                const loggedInUser = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : {};
                                const user = txUser || loggedInUser;
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
                                        <div className="modal-footer py-2 d-flex justify-content-between align-items-center" style={{ flex: '0 0 auto' }}>
                                            <div>
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDetailModal(false)}>Tutup</button>
                                            </div>
                                            <div className="d-flex gap-2">
                                                {(() => {
                                                    const linkedBA = detailDataList.find(d => d.berita_acara)?.berita_acara;
                                                    if (linkedBA) {
                                                        return (
                                                            <button type="button" className="btn btn-success" onClick={() => { setShowDetailModal(false); navigate(`/berita-acara/${linkedBA.id}`); }}>
                                                                Buka Dokumen Berita Acara ({linkedBA.no_berita_acara})
                                                            </button>
                                                        );
                                                    }
                                                    return (
                                                        <button type="button" className="btn btn-warning text-dark" onClick={() => { setShowDetailModal(false); navigate('/berita-acara/create'); }}>
                                                            + Buat Berita Acara Baru
                                                        </button>
                                                    );
                                                })()}
                                                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" /><path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" /><path d="M7 13m0 2a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 13m0 2a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M7 15v4h10v-4" /></svg>
                                                    Cetak
                                                </button>
                                            </div>
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
