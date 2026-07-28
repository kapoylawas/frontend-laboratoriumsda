import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from "js-cookie";
import Api from "../../services/api";
import LayoutAdmin from '../../layouts/admin';
import Hashids from 'hashids';
import Swal from 'sweetalert2';
import {
    FaReceipt,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaChevronDown,
    FaChevronUp,
    FaPrint,
    FaEye,
    FaFileInvoice,
    FaSpinner,
    FaShoppingBag,
    FaInfoCircle,
    FaCheck,
    FaRegCopy,
    FaQrcode,
    FaUpload
} from 'react-icons/fa';

const hashids = new Hashids('invoice-sidoarjo-lab-secret-key', 10);

export default function History() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [expandedInvoices, setExpandedInvoices] = useState({});
    const [uploadingTxId, setUploadingTxId] = useState(null);
    const navigate = useNavigate();

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

    const handleZoomQRIS = (qrisPath) => {
        const url = getImageUrl(qrisPath);
        Swal.fire({
            title: 'Kode QRIS Pembayaran',
            imageUrl: url,
            imageWidth: 320,
            imageAlt: 'QRIS Kode Pembayaran',
            showCloseButton: true,
            confirmButtonText: 'Tutup',
            confirmButtonColor: '#206bc4'
        });
    };

    const handleUploadProof = async (e, transactionId) => {
        e.preventDefault();
        const fileInput = e.target.elements.payment_proof;
        if (!fileInput || !fileInput.files[0]) {
            Swal.fire({
                icon: 'warning',
                title: 'File Belum Dipilih',
                text: 'Silakan pilih file gambar bukti transfer terlebih dahulu.',
                confirmButtonColor: '#206bc4'
            });
            return;
        }

        setUploadingTxId(transactionId);
        const token = Cookies.get("token");
        const formData = new FormData();
        formData.append("payment_proof", fileInput.files[0]);

        try {
            Api.defaults.headers.common["Authorization"] = token;
            await Api.put(`/api/transactions/${transactionId}/payment-proof`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Bukti Pembayaran Terkirim! 🎉',
                html: '<p class="text-muted mb-0">Bukti pembayaran Anda berhasil diunggah. Tim kami akan segera melakukan verifikasi.</p>',
                confirmButtonColor: '#2fb344',
                confirmButtonText: 'OK, Mantap!'
            });
            
            fetchData();
        } catch (error) {
            console.error("Error uploading payment proof:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mengunggah',
                text: error.response?.data?.message || 'Gagal mengunggah bukti pembayaran. Silakan coba lagi.',
                confirmButtonColor: '#d63939'
            });
        } finally {
            setUploadingTxId(null);
        }
    };

    const userCookie = Cookies.get("user");
    const parsedData = userCookie ? JSON.parse(userCookie) : {};
    const idUser = parsedData.id;

    const encodeId = (id) => {
        return hashids.encode(id);
    };

    const fetchData = async () => {
        setIsLoading(true);
        const token = Cookies.get("token");

        if (token && idUser) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const response = await Api.get(`/api/transaction-by-user/${idUser}`);
                const txList = response.data.data || [];
                setData(txList);
                setUserData(parsedData);

                const initialExpanded = {};
                txList.forEach(transaction => {
                    initialExpanded[transaction.id] = false;
                });
                setExpandedInvoices(initialExpanded);
            } catch (error) {
                console.error("There was an error fetching the data!", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleInvoice = (invoiceId) => {
        setExpandedInvoices(prev => ({
            ...prev,
            [invoiceId]: !prev[invoiceId]
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        if (status) {
            return {
                text: 'Lunas',
                bg: '#bbf7d0',
                color: '#166534'
            };
        }
        return {
            text: 'Belum Bayar',
            bg: '#fef08a',
            color: '#854d0e'
        };
    };

    const handlePrint = (transaction) => {
        const encodedId = encodeId(transaction.id);
        navigate(`/invoice/${encodedId}`);
    };

    const calculateTotalItems = (transaction) => {
        return transaction.transaction_details?.length || 0;
    };

    // Calculate KPI Stats
    const totalTxCount = data.length;
    const paidTxCount = data.filter(t => t.transaction_details?.[0]?.status_bayar).length;
    const unpaidTxCount = totalTxCount - paidTxCount;
    const totalGrandSum = data.reduce((acc, curr) => acc + (curr.grand_total || 0), 0);

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="container py-5 text-center">
                    <FaSpinner className="spinner-border text-primary fs-1 mb-3" style={{ width: '3rem', height: '3rem' }} />
                    <p className="text-muted fw-bold">Memuat riwayat transaksi...</p>
                </div>
            </LayoutAdmin>
        );
    }

    return (
        <LayoutAdmin>
            {/* Custom 3D Neo-Brutalist Styles */}
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
                    padding: 8px 16px;
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
                .input-3d {
                    border: 2.5px solid #000000 !important;
                    border-radius: 12px !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    font-weight: 600 !important;
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
                        <div className="col-md-8">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2" style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                                <FaReceipt size={14} className="text-warning" />
                                <span className="text-white fw-bold fs-8 text-uppercase">Manajemen Transaksi & Pembayaran</span>
                            </div>
                            <h2 className="text-white fw-extrabold display-6 mb-1 d-flex align-items-center gap-2">
                                <FaFileInvoice size={36} /> Riwayat Transaksi Pengujian
                            </h2>
                            <p className="text-white-50 mb-0 fs-6">
                                Daftar seluruh invoice transaksi, bukti pembayaran, status kelunasan, dan cetak lembar pembayaran.
                            </p>
                        </div>
                        <div className="col-md-4 text-md-end mt-3 mt-md-0">
                            <button className="btn-3d-secondary" onClick={fetchData}>
                                <FaReceipt /> Muat Ulang Transaksi
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3D KPI Stats Bar */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#eff6ff" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Total Transaksi</div>
                            <div className="fs-2 fw-black text-primary">{totalTxCount}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#f0fdf4" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Transaksi Lunas</div>
                            <div className="fs-2 fw-black text-success">{paidTxCount}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#fefce8" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Belum Bayar</div>
                            <div className="fs-2 fw-black text-warning">{unpaidTxCount}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card-3d p-3 text-center" style={{ backgroundColor: "#faf5ff" }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Total Nilai Transaksi</div>
                            <div className="fs-4 fw-black text-purple">{formatCurrency(totalGrandSum)}</div>
                        </div>
                    </div>
                </div>

                {/* Transaction Cards List */}
                <div className="d-flex flex-column gap-3">
                    {data.length === 0 ? (
                        <div className="card-3d p-5 text-center">
                            <FaFileInvoice size={56} className="text-muted mb-2" style={{ opacity: 0.4 }} />
                            <h4 className="fw-extrabold text-dark mb-1">Belum Ada Transaksi</h4>
                            <p className="text-muted mb-3">Seluruh riwayat pembayaran transaksi Anda akan ditampilkan secara otomatis di sini.</p>
                            <div>
                                <button className="btn-3d-primary" onClick={fetchData}>
                                    Muat Ulang Data
                                </button>
                            </div>
                        </div>
                    ) : (
                        data.map((transaction) => {
                            const isPaid = transaction.transaction_details?.[0]?.status_bayar;
                            const status = getStatusBadge(isPaid);
                            const totalItems = calculateTotalItems(transaction);
                            const isExpanded = expandedInvoices[transaction.id];

                            return (
                                <div key={transaction.id} className="card-3d p-0 overflow-hidden">
                                    {/* 3D Header Section */}
                                    <div
                                        className="p-4 d-flex flex-wrap align-items-center justify-content-between gap-3"
                                        style={{ cursor: "pointer", backgroundColor: isExpanded ? "#f8fafc" : "#ffffff" }}
                                        onClick={() => toggleInvoice(transaction.id)}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="p-3 rounded-circle" style={{ backgroundColor: "#dbeafe", border: "2px solid #000000" }}>
                                                <FaFileInvoice size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <h4 className="fw-black text-dark mb-0 font-monospace">{transaction.invoice}</h4>
                                                    <span
                                                        className="badge-3d px-3 py-1 d-inline-flex align-items-center gap-1"
                                                        style={{ backgroundColor: status.bg, color: status.color }}
                                                    >
                                                        <FaMoneyBillWave size={12} />
                                                        {status.text}
                                                    </span>
                                                </div>
                                                <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
                                                    <span className="d-flex align-items-center gap-1">
                                                        <FaCalendarAlt size={12} /> {formatDate(transaction.created_at)}
                                                    </span>
                                                    <span className="d-flex align-items-center gap-1">
                                                        <FaShoppingBag size={12} /> {totalItems} item pemeriksaan
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center gap-4 ms-auto">
                                            <div className="text-end">
                                                <div className="text-muted small fw-bold">Grand Total</div>
                                                <div className="fs-4 fw-black text-primary">{formatCurrency(transaction.grand_total)}</div>
                                            </div>
                                            <div className="btn-3d-secondary p-2 rounded-circle">
                                                {isExpanded ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Transaction Details */}
                                    {isExpanded && (
                                        <div className="p-4" style={{ backgroundColor: "#f8fafc", borderTop: "2.5px solid #000000" }}>
                                            <h5 className="fw-extrabold text-dark mb-3 d-flex align-items-center gap-2">
                                                <FaReceipt className="text-primary" /> Detail Items Pemeriksaan Laboratorium ({totalItems} Item)
                                            </h5>

                                            <div className="row g-2 mb-4">
                                                {transaction.transaction_details.map((detail, idx) => {
                                                    const itemStatus = getStatusBadge(detail.status_bayar);
                                                    return (
                                                        <div key={detail.id || idx} className="col-md-6 col-lg-4">
                                                            <div className="item-card-3d p-3">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div>
                                                                        <div className="fw-extrabold text-dark">{detail.sampel?.parameter || '-'}</div>
                                                                        <span className="badge-3d px-2 py-0 bg-info text-white" style={{ fontSize: '10px' }}>
                                                                            {detail.sampel?.category?.name || 'Tanpa Kategori'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="badge-3d px-2 py-1" style={{ backgroundColor: itemStatus.bg, color: itemStatus.color, fontSize: '11px' }}>
                                                                        {itemStatus.text}
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                                                    <small className="text-muted">Item #{idx + 1}</small>
                                                                    <span className="fw-black text-primary">{formatCurrency(detail.price)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Rincian Pembayaran QRIS & VA */}
                                            {!isPaid && (
                                                <div className="card-3d p-4 mb-4" style={{ backgroundColor: "#ffffff" }}>
                                                    <h5 className="fw-extrabold text-dark mb-3 d-flex align-items-center gap-2">
                                                        <FaMoneyBillWave className="text-success" /> Rincian Pembayaran (Virtual Account & QRIS)
                                                    </h5>

                                                    {!transaction.no_fa && !transaction.qris ? (
                                                        <div className="p-3 bg-warning-subtle text-warning rounded-3 border" style={{ border: '2px solid #000' }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <FaInfoCircle size={20} />
                                                                <div>
                                                                    <strong>Menunggu Rincian Pembayaran dari Admin</strong>
                                                                    <div className="small">Nomor Virtual Account & QRIS sedang disiapkan. Silakan cek berkala.</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="row g-3">
                                                            {/* Virtual Account / FA */}
                                                            <div className="col-md-6">
                                                                <div className="card-3d p-3" style={{ backgroundColor: "#f0fdf4" }}>
                                                                    <div className="text-muted small fw-bold text-uppercase mb-1">Nomor Virtual Account / FA</div>
                                                                    <div className="d-flex align-items-center justify-content-between">
                                                                        <span className="fs-3 fw-black text-success font-monospace">{transaction.no_fa || '-'}</span>
                                                                        {transaction.no_fa && (
                                                                            <button
                                                                                type="button"
                                                                                className="btn-3d-green py-1 px-3"
                                                                                onClick={() => {
                                                                                    navigator.clipboard.writeText(transaction.no_fa);
                                                                                    Swal.fire({
                                                                                        toast: true,
                                                                                        position: 'top-end',
                                                                                        icon: 'success',
                                                                                        title: 'Nomor FA disalin!',
                                                                                        showConfirmButton: false,
                                                                                        timer: 2000
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <FaRegCopy /> Salin
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <small className="text-muted mt-2 d-block">Lakukan transfer ke nomor Virtual Account di atas.</small>
                                                                </div>
                                                            </div>

                                                            {/* QRIS */}
                                                            <div className="col-md-6">
                                                                <div className="card-3d p-3 text-center" style={{ backgroundColor: "#ffffff" }}>
                                                                    <div className="text-uppercase fw-bold text-primary mb-2 d-flex align-items-center justify-content-center gap-1">
                                                                        <FaQrcode /> Kode QRIS Pembayaran
                                                                    </div>
                                                                    {transaction.qris ? (
                                                                        <div className="d-flex flex-column align-items-center">
                                                                            <img
                                                                                src={getImageUrl(transaction.qris)}
                                                                                alt="QRIS Pembayaran"
                                                                                onClick={() => handleZoomQRIS(transaction.qris)}
                                                                                style={{
                                                                                    width: "200px",
                                                                                    maxWidth: "100%",
                                                                                    height: "auto",
                                                                                    border: "2.5px solid #000000",
                                                                                    borderRadius: "12px",
                                                                                    cursor: "pointer"
                                                                                }}
                                                                                className="p-2 bg-white"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                className="btn-3d-secondary py-1 px-3 mt-2"
                                                                                onClick={() => handleZoomQRIS(transaction.qris)}
                                                                            >
                                                                                🔍 Perbesar QRIS
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted small">Belum ada QRIS dari Admin</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Upload Bukti Pembayaran */}
                                                            <div className="col-12 mt-3">
                                                                <div className="card-3d p-3">
                                                                    <h6 className="fw-extrabold text-dark mb-2">Unggah Bukti Transfer / Pembayaran</h6>
                                                                    {!transaction.payment_proof ? (
                                                                        <form onSubmit={(e) => handleUploadProof(e, transaction.id)}>
                                                                            <div className="row g-2 align-items-center">
                                                                                <div className="col-md-8">
                                                                                    <input
                                                                                        type="file"
                                                                                        className="form-control input-3d"
                                                                                        name="payment_proof"
                                                                                        accept="image/*"
                                                                                        required
                                                                                    />
                                                                                </div>
                                                                                <div className="col-md-4">
                                                                                    <button
                                                                                        type="submit"
                                                                                        className="btn-3d-green w-100 py-2"
                                                                                        disabled={uploadingTxId === transaction.id}
                                                                                    >
                                                                                        {uploadingTxId === transaction.id ? (
                                                                                            <><FaSpinner className="spinner me-2" /> Mengirim...</>
                                                                                        ) : (
                                                                                            <><FaUpload /> Kirim Bukti</>
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </form>
                                                                    ) : (
                                                                        <div className="p-3 rounded-3 bg-success-subtle d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ border: '2px solid #000' }}>
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <FaCheck className="text-success fs-4" />
                                                                                <div>
                                                                                    <strong className="text-success">Bukti Pembayaran Terkirim</strong>
                                                                                    <small className="text-muted d-block">Menunggu verifikasi admin untuk mengubah status menjadi Lunas.</small>
                                                                                </div>
                                                                            </div>
                                                                            <a
                                                                                href={getImageUrl(transaction.payment_proof)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="btn-3d-secondary py-1 px-3"
                                                                            >
                                                                                <FaEye /> Lihat Bukti
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Lunas Status Next Steps */}
                                            {isPaid && (
                                                <div className="card-3d p-3 mb-4" style={{ backgroundColor: "#f0fdf4" }}>
                                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                                        <div>
                                                            <h5 className="fw-black text-success mb-1">🎉 Transaksi Lunas Terverifikasi</h5>
                                                            <div className="text-muted small fw-bold">Alur Pengujian Laboratorium Selanjutnya:</div>
                                                            <div className="mt-2 d-flex flex-wrap gap-2">
                                                                <span className="badge-3d px-2 py-1 bg-primary text-white">1. Penjadwalan</span> ➔
                                                                <span className="badge-3d px-2 py-1 bg-info text-white">2. Isi Hasil</span> ➔
                                                                <span className="badge-3d px-2 py-1 bg-success text-white">3. Berita Acara</span>
                                                            </div>
                                                        </div>
                                                        {parsedData.role_id !== 1 && (
                                                            <Link to="/penjadwalan" className="btn-3d-primary">
                                                                📅 Langkah 1: Buat Jadwal ➔
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions Footer */}
                                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top">
                                                <button className="btn-3d-primary" onClick={() => handlePrint(transaction)}>
                                                    <FaPrint /> Cetak Lembar Invoice
                                                </button>
                                                <div className="text-end">
                                                    <div className="fs-5 fw-black text-primary">Total: {formatCurrency(transaction.grand_total)}</div>
                                                    <small className="text-muted">Termasuk PPN & Biaya Administrasi</small>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </LayoutAdmin>
    );
}