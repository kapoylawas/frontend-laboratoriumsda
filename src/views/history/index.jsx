import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from "js-cookie";
import Api from "../../services/api";
import LayoutAdmin from '../../layouts/admin';
import Hashids from 'hashids';
import Swal from 'sweetalert2';

// Import icon (gunakan react-icons)
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
    FaInfoCircle
} from 'react-icons/fa';

// Inisialisasi Hashids
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
            
            fetchData(); // Refresh data transaksi
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
    const parsedData = JSON.parse(userCookie);
    const idUser = parsedData.id;

    // Fungsi untuk encode ID
    const encodeId = (id) => {
        return hashids.encode(id);
    };

    // Fungsi untuk decode ID (jika diperlukan di component ini)
    const decodeId = (hash) => {
        const decoded = hashids.decode(hash);
        return decoded.length > 0 ? decoded[0] : null;
    };

    const fetchData = async () => {
        setIsLoading(true);
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const response = await Api.get(`/api/transaction-by-user/${idUser}`);
                setData(response.data.data);

                // Simpan data user untuk print
                setUserData(parsedData);

                // Set semua invoice sebagai collapsed secara default
                const initialExpanded = {};
                response.data.data.forEach(transaction => {
                    initialExpanded[transaction.id] = false;
                });
                setExpandedInvoices(initialExpanded);
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
        }).format(amount);
    };

    const formatDate = (dateString) => {
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
                class: 'status-badge status-paid'
            };
        }
        return {
            text: 'Belum Bayar',
            class: 'status-badge status-pending'
        };
    };

    const handlePrint = (transaction) => {
        // Encode ID sebelum navigasi
        const encodedId = encodeId(transaction.id);
        navigate(`/invoice/${encodedId}`);
    };

    const handleViewDetails = (transaction) => {
        console.log("View details:", transaction);
    };

    const calculateTotalItems = (transaction) => {
        return transaction.transaction_details.length;
    };

    // Test encoding (untuk debugging)
    // useEffect(() => {
    //     if (data.length > 0) {
    //         console.log('Contoh encoded ID:', {
    //             original: data[0].id,
    //             encoded: encodeId(data[0].id),
    //             decoded: decodeId(encodeId(data[0].id))
    //         });
    //     }
    // }, [data]);

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="container py-5">
                    <div className="row justify-content-center">
                        <div className="col-12 text-center">
                            <div className="loading-spinner">
                                <FaSpinner className="spinner-icon" />
                            </div>
                            <p className="loading-text">Memuat riwayat transaksi...</p>
                        </div>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    return (
        <LayoutAdmin>
            <div className="history-container">
                <div className="container py-5">
                    <div className="row justify-content-center">
                        <div className="col-12 col-lg-10">
                            {/* Header */}
                            <div className="history-header">
                                <div className="header-content">
                                    <div className="title-section">
                                        <h1 className="page-title">Riwayat Transaksi</h1>
                                        <p className="page-subtitle">Daftar semua transaksi yang telah dilakukan</p>
                                    </div>
                                    <div className="stats-badge">
                                        <div className="badge-content">
                                            <FaReceipt className="badge-icon" />
                                            <span>Total: {data.length} Transaksi</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction List */}
                            <div className="transaction-list">
                                {data.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">
                                            <FaFileInvoice />
                                        </div>
                                        <h3 className="empty-title">Belum ada transaksi</h3>
                                        <p className="empty-description">
                                            Transaksi yang Anda lakukan akan muncul di sini
                                        </p>
                                        <button
                                            className="reload-btn"
                                            onClick={fetchData}
                                        >
                                            <FaSpinner className="btn-icon" />
                                            Muat Ulang
                                        </button>
                                    </div>
                                ) : (
                                    data.map((transaction) => {
                                        const status = getStatusBadge(transaction.transaction_details[0]?.status_bayar);
                                        const totalItems = calculateTotalItems(transaction);

                                        return (
                                            <div key={transaction.id} className="transaction-card">
                                                <div
                                                    className="card-header"
                                                    onClick={() => toggleInvoice(transaction.id)}
                                                >
                                                    <div className="header-content">
                                                        <div className="transaction-info">
                                                            <div className="info-icon">
                                                                <FaFileInvoice />
                                                            </div>
                                                            <div className="info-details">
                                                                <h3 className="invoice-number">
                                                                    {transaction.invoice}
                                                                </h3>
                                                                <div className="transaction-meta">
                                                                    <div className="meta-item">
                                                                        <FaCalendarAlt className="meta-icon" />
                                                                        <span>{formatDate(transaction.created_at)}</span>
                                                                    </div>
                                                                    <div className="meta-item">
                                                                        <FaShoppingBag className="meta-icon" />
                                                                        <span>{totalItems} item pemeriksaan</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="transaction-summary">
                                                            <div className="amount">{formatCurrency(transaction.grand_total)}</div>
                                                            <div className={status.class}>
                                                                <FaMoneyBillWave className="status-icon" />
                                                                {status.text}
                                                            </div>
                                                        </div>
                                                        <div className="expand-icon">
                                                            {expandedInvoices[transaction.id] ? (
                                                                <FaChevronUp />
                                                            ) : (
                                                                <FaChevronDown />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Transaction Details */}
                                                {expandedInvoices[transaction.id] && (
                                                    <div className="card-details">
                                                        <div className="details-header">
                                                            <h4>Detail Pemeriksaan ({totalItems} item)</h4>
                                                        </div>

                                                        <div className="items-list">
                                                            {transaction.transaction_details.map((detail, index) => {
                                                                const itemStatus = getStatusBadge(detail.status_bayar);
                                                                return (
                                                                    <div key={detail.id} className="item-row">
                                                                        <div className="item-number">
                                                                            #{index + 1}
                                                                        </div>
                                                                        <div className="item-name">
                                                                            {detail.sampel.parameter}
                                                                        </div>
                                                                        <div className="item-price">
                                                                            {formatCurrency(detail.price)}
                                                                        </div>
                                                                        <div className="item-status">
                                                                            <span className={itemStatus.class}>
                                                                                {itemStatus.text}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Section Info QRIS & Nomor FA */}
                                                        {!transaction.transaction_details[0]?.status_bayar && (
                                                            <div className="payment-gateway-section mt-4 p-3 rounded mb-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                                <h5 className="fw-bold mb-3 text-secondary d-flex align-items-center">
                                                                    <FaMoneyBillWave className="me-2 text-primary" style={{ verticalAlign: 'middle' }} /> Rincian Pembayaran
                                                                </h5>
                                                                
                                                                {!transaction.no_fa && !transaction.qris ? (
                                                                    <div className="alert alert-warning mb-0 border-0 shadow-sm d-flex align-items-center">
                                                                        <FaInfoCircle className="me-3 fs-3 text-warning" />
                                                                        <div>
                                                                            <strong className="d-block text-warning">Menunggu Rincian Pembayaran</strong>
                                                                            Admin sedang menyiapkan Nomor FA (Virtual Account) dan kode QRIS. Silakan periksa kembali halaman ini secara berkala.
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="row g-3 align-items-stretch text-start">
                                                                         {/* FA info */}
                                                                        <div className="col-md-6">
                                                                            <div className="card h-100 border-0 shadow-sm p-3" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px' }}>
                                                                                <span className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>Nomor Virtual Account / FA</span>
                                                                                <div className="d-flex align-items-center justify-content-between">
                                                                                    <span className="fs-3 fw-bold text-success font-monospace">{transaction.no_fa || '-'}</span>
                                                                                    {transaction.no_fa && (
                                                                                        <button 
                                                                                            type="button"
                                                                                            className="btn btn-sm btn-outline-success border-0 bg-white fw-bold shadow-sm"
                                                                                            onClick={() => {
                                                                                                navigator.clipboard.writeText(transaction.no_fa);
                                                                                                Swal.fire({
                                                                                                    toast: true,
                                                                                                    position: 'top-end',
                                                                                                    icon: 'success',
                                                                                                    title: 'Nomor FA disalin ke clipboard!',
                                                                                                    showConfirmButton: false,
                                                                                                    timer: 2000
                                                                                                });
                                                                                            }}
                                                                                        >
                                                                                            Salin
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                                <p className="small text-muted mt-2 mb-0" style={{ fontSize: '0.8rem' }}>Lakukan transfer ke nomor Virtual Account di atas.</p>
                                                                            </div>
                                                                        </div>

                                                                        {/* QRIS info */}
                                                                        <div className="col-md-6">
                                                                            <div className="card h-100 border-0 shadow-sm p-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#ffffff', borderRadius: '12px' }}>
                                                                                <span className="text-uppercase fw-bold text-primary mb-3 d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                                                                                    <FaReceipt /> Kode QRIS Pembayaran
                                                                                </span>
                                                                                {transaction.qris ? (
                                                                                    <div className="d-flex flex-column align-items-center w-100">
                                                                                        {/\.(jpg|jpeg|png|webp|svg)$/i.test(transaction.qris) || transaction.qris.startsWith('http') ? (
                                                                                            <div className="position-relative text-center">
                                                                                                <img 
                                                                                                    src={getImageUrl(transaction.qris)} 
                                                                                                    alt="QRIS Pembayaran" 
                                                                                                    onClick={() => handleZoomQRIS(transaction.qris)}
                                                                                                    onError={(e) => {
                                                                                                        e.target.style.display = 'none';
                                                                                                        if (e.target.nextSibling) {
                                                                                                            e.target.nextSibling.style.display = 'inline-block';
                                                                                                        }
                                                                                                    }}
                                                                                                    style={{ 
                                                                                                        width: '240px', 
                                                                                                        maxWidth: '100%', 
                                                                                                        height: 'auto', 
                                                                                                        border: '2px solid #206bc4', 
                                                                                                        padding: '10px', 
                                                                                                        borderRadius: '12px',
                                                                                                        boxShadow: '0 4px 14px rgba(32, 107, 196, 0.15)',
                                                                                                        cursor: 'pointer',
                                                                                                        transition: 'transform 0.2s ease-in-out'
                                                                                                    }} 
                                                                                                    className="img-fluid bg-white"
                                                                                                    title="Klik untuk memperbesar QRIS"
                                                                                                />
                                                                                                <span className="badge bg-primary font-monospace mt-2" style={{ display: 'none', fontSize: '0.9rem' }}>
                                                                                                    {transaction.qris}
                                                                                                </span>
                                                                                                <div className="mt-2">
                                                                                                    <button 
                                                                                                        type="button" 
                                                                                                        className="btn btn-sm btn-outline-primary rounded-pill px-3 mt-1 fw-semibold" 
                                                                                                        onClick={() => handleZoomQRIS(transaction.qris)}
                                                                                                        style={{ fontSize: '0.78rem' }}
                                                                                                    >
                                                                                                        🔍 Klik untuk Memperbesar QRIS
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="badge bg-primary-lt font-monospace fs-4 px-3 py-2">
                                                                                                {transaction.qris}
                                                                                            </span>
                                                                                        )}
                                                                                        <small className="text-muted mt-3 d-block" style={{ fontSize: '0.78rem' }}>
                                                                                            Pindai kode QR di atas menggunakan GoPay, OVO, ShopeePay, Dana, atau Mobile Banking Anda.
                                                                                        </small>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-muted small">Belum ada QRIS dari Admin</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Payment Proof Section */}
                                                                        <div className="col-12 mt-3">
                                                                            <div className="card border-0 shadow-sm p-3" style={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                                                                <h6 className="fw-bold text-gray-900 mb-3" style={{ fontSize: '0.9rem' }}>Bukti Pembayaran</h6>
                                                                                
                                                                                {!transaction.payment_proof ? (
                                                                                    <form onSubmit={(e) => handleUploadProof(e, transaction.id)}>
                                                                                        <div className="row align-items-center g-2">
                                                                                            <div className="col-md-8 col-sm-12">
                                                                                                <input 
                                                                                                    type="file" 
                                                                                                    className="form-control" 
                                                                                                    name="payment_proof" 
                                                                                                    accept="image/*"
                                                                                                    required 
                                                                                                />
                                                                                                <small className="text-muted mt-1 d-block" style={{ fontSize: '0.75rem' }}>Pilih gambar bukti pembayaran (.png, .jpg, .jpeg, maks 5MB)</small>
                                                                                            </div>
                                                                                            <div className="col-md-4 col-sm-12">
                                                                                                <button 
                                                                                                    type="submit" 
                                                                                                    className="btn btn-success w-100 text-white d-flex align-items-center justify-content-center fw-bold"
                                                                                                    disabled={uploadingTxId === transaction.id}
                                                                                                >
                                                                                                    {uploadingTxId === transaction.id ? (
                                                                                                        <><FaSpinner className="spinner me-2" /> Mengirim...</>
                                                                                                    ) : (
                                                                                                        "Kirim Bukti Pembayaran"
                                                                                                    )}
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </form>
                                                                                ) : (
                                                                                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3 p-3 rounded" style={{ backgroundColor: '#f0fdf4', border: '1px solid #b7ebc6' }}>
                                                                                        <div className="text-success d-flex align-items-center">
                                                                                            <span className="badge bg-success-lt p-2 rounded-circle me-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '1rem' }}>✔</span>
                                                                                            <div>
                                                                                                <strong className="d-block text-success" style={{ fontSize: '0.9rem' }}>Bukti Pembayaran Terkirim</strong>
                                                                                                <span className="text-muted small" style={{ fontSize: '0.8rem' }}>Menunggu verifikasi admin untuk mengubah status menjadi Lunas.</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="ms-md-auto">
                                                                                            <a 
                                                                                                href={getImageUrl(transaction.payment_proof)} 
                                                                                                target="_blank" 
                                                                                                rel="noopener noreferrer"
                                                                                                className="btn btn-sm btn-outline-success fw-bold d-flex align-items-center gap-1"
                                                                                            >
                                                                                                <FaEye /> Lihat Bukti
                                                                                            </a>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                         {/* Actions */}
                                                        <div className="details-footer flex-column align-items-stretch gap-3">
                                                            {transaction.transaction_details[0]?.status_bayar && (
                                                                <div className="alert border-0 shadow-sm p-3 text-start mb-0" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)', borderLeft: '4px solid #0d6efd' }}>
                                                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                                        <div>
                                                                            <strong className="text-success fs-6 d-block">🎉 Status Transaksi: LUNAS BAYAR</strong>
                                                                            <span className="text-muted small">Langkah berikutnya dalam alur kerja pengujian:</span>
                                                                            <div className="mt-1 small fw-bold text-dark">
                                                                                <span className="badge bg-primary me-1">1. Buat Jadwal</span> ➔ 
                                                                                <span className="badge bg-secondary ms-2 me-1">2. Isi Hasil</span> ➔ 
                                                                                <span className="badge bg-secondary ms-2 me-1">3. Berita Acara</span>
                                                                            </div>
                                                                        </div>
                                                                        <Link to="/penjadwalan" className="btn btn-sm btn-primary text-white fw-bold px-3 py-2 rounded-pill shadow-sm">
                                                                            📅 Langkah 1: Buat Jadwal ➔
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 w-100">
                                                                <div className="action-buttons">
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        onClick={() => handlePrint(transaction)}
                                                                    >
                                                                        <FaPrint className="btn-icon" />
                                                                        Cetak Invoice
                                                                    </button>
                                                                </div>
                                                                <div className="total-summary">
                                                                    <div className="total-amount">
                                                                        Total: {formatCurrency(transaction.grand_total)}
                                                                    </div>
                                                                    <small className="total-note">
                                                                        Termasuk pajak dan biaya lainnya
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Info Section */}
                            {data.length > 0 && (
                                <div className="info-section">
                                    <div className="info-card">
                                        <div className="info-content">
                                            <FaInfoCircle className="info-icon" />
                                            <div className="info-text">
                                                <strong>Informasi:</strong> Semua transaksi yang telah selesai akan tercatat di halaman ini.
                                                Untuk informasi lebih lanjut atau pertanyaan mengenai transaksi, hubungi customer service kami.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                /* CSS styles tetap sama seperti sebelumnya */
                .history-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                }

                .history-header {
                    margin-bottom: 2rem;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .title-section {
                    flex: 1;
                }

                .page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2d3748;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .page-subtitle {
                    color: #718096;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .stats-badge {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 50px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .badge-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                }

                .badge-icon {
                    font-size: 1.1rem;
                }

                .transaction-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .transaction-card {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .transaction-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                }

                .card-header {
                    padding: 1.5rem 2rem;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .card-header:hover {
                    background-color: #f8fafc;
                }

                .card-header .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }

                .transaction-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex: 1;
                }

                .info-icon {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.2rem;
                }

                .info-details {
                    flex: 1;
                }

                .invoice-number {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #2d3748;
                    margin: 0 0 0.5rem 0;
                }

                .transaction-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #718096;
                    font-size: 0.9rem;
                }

                .meta-icon {
                    font-size: 0.8rem;
                }

                .transaction-summary {
                    text-align: right;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .amount {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2d3748;
                }

                .status-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .status-paid {
                    background: rgba(72, 187, 120, 0.1);
                    color: #38a169;
                }

                .status-pending {
                    background: rgba(237, 137, 54, 0.1);
                    color: #dd6b20;
                }

                .expand-icon {
                    color: #a0aec0;
                    font-size: 1.1rem;
                    transition: transform 0.3s ease;
                }

                .card-details {
                    background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
                    padding: 2rem;
                    border-top: 1px solid #e2e8f0;
                }

                .details-header {
                    margin-bottom: 1.5rem;
                }

                .details-header h4 {
                    color: #2d3748;
                    font-weight: 600;
                    margin: 0;
                }

                .items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .item-row {
                    display: grid;
                    grid-template-columns: 50px 1fr auto auto;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }

                .item-number {
                    color: #718096;
                    font-weight: 600;
                    text-align: center;
                }

                .item-name {
                    color: #2d3748;
                    font-weight: 500;
                }

                .item-price {
                    color: #2d3748;
                    font-weight: 600;
                }

                .item-status .status-badge {
                    font-size: 0.75rem;
                    padding: 0.4rem 0.8rem;
                }

                .details-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e2e8f0;
                }

                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 10px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    font-size: 0.9rem;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .btn-outline {
                    background: transparent;
                    color: #667eea;
                    border: 2px solid #667eea;
                }

                .btn-outline:hover {
                    background: #667eea;
                    color: white;
                    transform: translateY(-2px);
                }

                .btn-icon {
                    font-size: 0.9rem;
                }

                .total-summary {
                    text-align: right;
                }

                .total-amount {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2d3748;
                    margin-bottom: 0.25rem;
                }

                .total-note {
                    color: #718096;
                    font-size: 0.8rem;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                }

                .empty-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    color: #a0aec0;
                    font-size: 2rem;
                }

                .empty-title {
                    color: #2d3748;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .empty-description {
                    color: #718096;
                    margin-bottom: 2rem;
                }

                .reload-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 10px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .reload-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .info-section {
                    margin-top: 2rem;
                }

                .info-card {
                    background: linear-gradient(135deg, #90cdf4 0%, #4299e1 100%);
                    color: white;
                    padding: 1.5rem;
                    border-radius: 16px;
                    box-shadow: 0 4px 15px rgba(66, 153, 225, 0.3);
                }

                .info-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .info-icon {
                    font-size: 1.2rem;
                    flex-shrink: 0;
                    margin-top: 0.1rem;
                }

                .info-text {
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .loading-spinner {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 1rem;
                }

                .spinner-icon {
                    font-size: 2rem;
                    color: #667eea;
                    animation: spin 1s linear infinite;
                }

                .loading-text {
                    color: #718096;
                    font-size: 1.1rem;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        text-align: center;
                    }
                    .stats-badge {
                        align-self: center;
                    }
                    .card-header .header-content {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .transaction-summary {
                        text-align: left;
                        width: 100%;
                    }
                    .item-row {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 0.5rem;
                    }
                    .details-footer {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .action-buttons {
                        justify-content: center;
                    }
                    .total-summary {
                        text-align: center;
                    }
                }
            `}</style>
        </LayoutAdmin>
    );
}