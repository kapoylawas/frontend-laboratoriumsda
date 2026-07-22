import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import Api from "../../services/api";
import html2pdf from 'html2pdf.js';
import {
    FaSpinner,
    FaPrint,
    FaDownload,
    FaArrowLeft,
    FaFilePdf,
    FaCheckCircle,
    FaClock,
    FaUser,
    FaHashtag
} from 'react-icons/fa';
import LayoutAdmin from '../../layouts/admin';
import { decodeId } from '../../utils/hashids';

export default function InvoicePrint() {
    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const invoiceRef = useRef();

    const fetchTransaction = async () => {
        if (!id) {
            setError('ID tidak valid');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const decodedId = decodeId(id);

                if (!decodedId) {
                    setError('ID transaksi tidak valid');
                    setIsLoading(false);
                    return;
                }

                const response = await Api.get(`/api/transaction-by-id/${decodedId}`);

                if (response.data.data) {
                    setTransaction(response.data.data);

                    const userCookie = Cookies.get("user");
                    if (userCookie) {
                        setUserData(JSON.parse(userCookie));
                    }
                } else {
                    setError('Transaksi tidak ditemukan');
                }
            } catch (error) {
                console.error("Error fetching transaction:", error);
                setError('Terjadi kesalahan saat mengambil data transaksi');
            } finally {
                setIsLoading(false);
            }
        } else {
            setError('Token tidak tersedia');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchTransaction();
        }
    }, [id]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const convertToWords = (number) => {
        if (!number || number === 0) return 'nol rupiah';

        const units = ['', 'ribu', 'juta', 'miliar', 'triliun'];
        const numbers = [
            '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
            'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
            'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'
        ];

        const convert = (num) => {
            if (num < 20) {
                return numbers[num];
            } else if (num < 100) {
                return numbers[Math.floor(num / 10)] + ' puluh' + (num % 10 !== 0 ? ' ' + numbers[num % 10] : '');
            } else if (num < 200) {
                return 'seratus' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
            } else if (num < 1000) {
                return numbers[Math.floor(num / 100)] + ' ratus' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
            }

            for (let i = 0; i < units.length; i++) {
                const divisor = Math.pow(1000, i + 1);
                if (num < divisor) {
                    const currentUnit = Math.floor(num / (divisor / 1000));
                    if (currentUnit === 1 && i === 1) {
                        return 'seribu' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
                    } else {
                        return convert(currentUnit) + ' ' + units[i] + (num % (divisor / 1000) !== 0 ? ' ' + convert(num % (divisor / 1000)) : '');
                    }
                }
            }
            return '';
        };

        const words = convert(number).trim();
        return words.charAt(0).toUpperCase() + words.slice(1) + ' rupiah';
    };

    const generateInvoicePDF = async () => {
        if (!invoiceRef.current || !transaction) return;

        setIsGeneratingPDF(true);

        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generateInvoiceHTML();
            document.body.appendChild(tempDiv);

            const opt = {
                margin: [8, 8, 8, 8],
                filename: `Invoice-${transaction.invoice || 'SPJ'}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                }
            };

            await html2pdf()
                .set(opt)
                .from(tempDiv)
                .save();

            document.body.removeChild(tempDiv);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Terjadi kesalahan saat menggenerate PDF: ' + error.message);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const generateInvoiceHTML = () => {
        if (!transaction) return '';

        const subtotal = transaction.transaction_details ? transaction.transaction_details.reduce((sum, detail) => sum + (detail.price || 0), 0) : 0;
        const allPaid = transaction.transaction_details && transaction.transaction_details.length > 0 && transaction.transaction_details.every(d => d.status_bayar);
        const customerName = transaction.user?.name || userData?.name || 'Pemohon Umum';
        const customerPhone = transaction.user?.phone || userData?.phone || '-';
        const customerNik = transaction.user?.nik || userData?.nik || '-';
        const customerEmail = transaction.user?.email || userData?.email || '-';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invoice ${transaction.invoice}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                    
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #ffffff; padding: 12mm 15mm; font-size: 10pt; line-height: 1.5; }
                    .pdf-header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
                    .pdf-header h2 { font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 2px; }
                    .pdf-header h3 { font-size: 11pt; font-weight: 700; text-transform: uppercase; color: #1e3a8a; margin-bottom: 4px; }
                    .pdf-header p { font-size: 8.5pt; color: #475569; }
                    
                    .pdf-title-banner { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
                    .pdf-title-banner h1 { font-size: 14pt; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }
                    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; }
                    .status-lunas { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
                    .status-belum { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

                    .info-grid { display: table; width: 100%; margin-bottom: 16px; table-layout: fixed; }
                    .info-col { display: table-cell; width: 50%; vertical-align: top; padding-right: 10px; }
                    .info-col:last-child { padding-right: 0; padding-left: 10px; }
                    .info-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; height: 100%; }
                    .info-box-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
                    .info-row { font-size: 8.5pt; margin-bottom: 4px; display: flex; justify-content: space-between; }
                    .info-label { font-weight: 600; color: #64748b; }
                    .info-val { font-weight: 700; color: #0f172a; text-align: right; }

                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 8.5pt; }
                    .items-table th { background: #1e3a8a; color: #ffffff; padding: 8px 10px; font-weight: 700; text-align: left; text-transform: uppercase; border: 1px solid #1e3a8a; }
                    .items-table td { padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: middle; }
                    .items-table tr:nth-child(even) td { background: #f8fafc; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }

                    .summary-container { margin-bottom: 20px; }
                    .total-card { background: #f0f6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; }
                    .terbilang-card { background: #ffffff; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px 14px; font-size: 8.5pt; color: #334155; }

                    .signature-section { margin-top: 30px; display: table; width: 100%; table-layout: fixed; }
                    .sig-col { display: table-cell; width: 50%; text-align: center; vertical-align: top; }
                    .sig-title { font-size: 8.5pt; color: #475569; margin-bottom: 50px; }
                    .sig-name { font-size: 9.5pt; font-weight: 700; color: #0f172a; text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="pdf-header">
                    <h2>Pemerintah Kabupaten Sidoarjo</h2>
                    <h3>Dinas Kesehatan - UPT Laboratorium Kesehatan Daerah</h3>
                    <p>Jl. A. Yani Gedangan No. 330, Kecamatan Gedangan, Kab. Sidoarjo | Telp: 0859 4634 5774</p>
                </div>

                <div class="pdf-title-banner">
                    <div>
                        <h1>INVOICE / BUKTI SPJ</h1>
                        <p style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">Dokumen Pembayaran Resmi Pengujian Laboratorium</p>
                    </div>
                    <div>
                        ${allPaid ? 
                            `<span class="status-badge status-lunas">LUNAS BAYAR</span>` : 
                            `<span class="status-badge status-belum">BELUM LUNAS</span>`
                        }
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-col">
                        <div class="info-box">
                            <div class="info-box-title">Pemohon / Pelanggan</div>
                            <div class="info-row"><span class="info-label">Nama:</span> <span class="info-val">${customerName}</span></div>
                            <div class="info-row"><span class="info-label">NIK:</span> <span class="info-val">${customerNik}</span></div>
                            <div class="info-row"><span class="info-label">No. Telepon / WA:</span> <span class="info-val">${customerPhone}</span></div>
                            <div class="info-row"><span class="info-label">Email:</span> <span class="info-val">${customerEmail}</span></div>
                        </div>
                    </div>
                    <div class="info-col">
                        <div class="info-box">
                            <div class="info-box-title">Rincian Transaksi</div>
                            <div class="info-row"><span class="info-label">No. Invoice:</span> <span class="info-val">${transaction.invoice || '-'}</span></div>
                            <div class="info-row"><span class="info-label">Tanggal:</span> <span class="info-val">${formatDate(transaction.created_at)}</span></div>
                            <div class="info-row"><span class="info-label">No. FA / VA:</span> <span class="info-val">${transaction.no_fa || '-'}</span></div>
                            <div class="info-row"><span class="info-label">Metode Pembayaran:</span> <span class="info-val">${transaction.no_fa ? 'Virtual Account' : transaction.qris ? 'QRIS' : 'Kasir / Manual'}</span></div>
                        </div>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th width="6%" class="text-center">NO.</th>
                            <th width="54%">JENIS PEMERIKSAAN / PARAMETER SAMPEL</th>
                            <th width="12%" class="text-center">JUMLAH</th>
                            <th width="14%" class="text-right">HARGA SATUAN</th>
                            <th width="14%" class="text-right">SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transaction.transaction_details.map((detail, idx) => `
                            <tr>
                                <td class="text-center">${idx + 1}</td>
                                <td><strong>${detail.sampel?.parameter || 'Pemeriksaan Sampel'}</strong></td>
                                <td class="text-center">1 Sampel</td>
                                <td class="text-right">${formatCurrency(detail.price)}</td>
                                <td class="text-right"><strong>${formatCurrency(detail.price)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="summary-container">
                    <div class="total-card" style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11pt; font-weight: 700; color: #1e3a8a;">GRAND TOTAL PEMBAYARAN:</span>
                        <span style="font-size: 14pt; font-weight: 800; color: #1e3a8a;">${formatCurrency(subtotal)}</span>
                    </div>
                    <div class="terbilang-card">
                        <strong>Terbilang:</strong> <em># ${convertToWords(subtotal)} #</em>
                    </div>
                </div>

                <div class="signature-section">
                    <div class="sig-col">
                        <div class="sig-title">Pemohon / Pelanggan</div>
                        <div class="sig-name">${customerName}</div>
                    </div>
                    <div class="sig-col">
                        <div class="sig-title">Sidoarjo, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Petugas Admin UPT Labkesda</div>
                        <div class="sig-name">Petugas Kasir & Verifikasi</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5 className="text-secondary fw-semibold">Memuat Data Invoice & SPJ...</h5>
                </div>
            </LayoutAdmin>
        );
    }

    if (error || !transaction) {
        return (
            <LayoutAdmin>
                <div className="container py-5 text-center">
                    <div className="card shadow-sm border-0 p-5 mx-auto" style={{ maxWidth: '500px', borderRadius: '16px' }}>
                        <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
                        <h4 className="fw-bold text-dark mb-2">Data Invoice Tidak Ditemukan</h4>
                        <p className="text-muted mb-4">{error || 'Transaksi tidak ditemukan atau telah dihapus dari sistem.'}</p>
                        <button onClick={() => navigate('/penjadwalan')} className="btn btn-primary rounded-pill px-4">
                            <FaArrowLeft className="me-2" /> Kembali ke Daftar Transaksi
                        </button>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    const subtotal = transaction.transaction_details ? transaction.transaction_details.reduce((sum, detail) => sum + (detail.price || 0), 0) : 0;
    const allPaid = transaction.transaction_details && transaction.transaction_details.length > 0 && transaction.transaction_details.every(d => d.status_bayar);
    const customerName = transaction.user?.name || userData?.name || 'Pemohon Umum';
    const customerPhone = transaction.user?.phone || userData?.phone || '-';
    const customerNik = transaction.user?.nik || userData?.nik || '-';
    const customerEmail = transaction.user?.email || userData?.email || '-';

    return (
        <LayoutAdmin>
            <div className="invoice-page-wrapper py-4 px-2 px-md-4" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
                
                {/* Header Action Bar - Screen Only (no-print) */}
                <div className="card border-0 shadow-sm mb-4 no-print overflow-hidden" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #206bc4 100%)' }}>
                    <div className="card-body p-4 text-white">
                        <div className="row align-items-center g-3">
                            <div className="col-md-7">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className="badge bg-white text-primary fw-bold px-3 py-2 rounded-pill" style={{ fontSize: '0.8rem' }}>
                                        DOKUMEN INVOICE & SPJ
                                    </span>
                                    {allPaid ? (
                                        <span className="badge bg-success text-white fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                            <FaCheckCircle /> LUNAS BAYAR
                                        </span>
                                    ) : (
                                        <span className="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                            <FaClock /> BELUM LUNAS
                                        </span>
                                    )}
                                </div>
                                <h2 className="fw-extrabold text-white mb-1 d-flex align-items-center gap-2">
                                    <FaFilePdf className="text-info" /> Invoice #{transaction.invoice}
                                </h2>
                                <p className="text-white-50 mb-0 small">
                                    Dokumen rincian pembayaran resmi UPT Laboratorium Kesehatan Daerah Kabupaten Sidoarjo.
                                </p>
                            </div>
                            <div className="col-md-5 text-md-end text-start">
                                <div className="d-flex flex-wrap gap-2 justify-content-md-end justify-content-start">
                                    <button
                                        onClick={() => navigate('/penjadwalan')}
                                        className="btn btn-light btn-sm fw-semibold rounded-pill px-3 py-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                    >
                                        <FaArrowLeft /> Kembali
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="btn btn-outline-light btn-sm fw-semibold rounded-pill px-3 py-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                    >
                                        <FaPrint /> Cetak
                                    </button>
                                    <button
                                        onClick={generateInvoicePDF}
                                        className="btn btn-success btn-sm fw-bold rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 shadow"
                                        disabled={isGeneratingPDF}
                                    >
                                        {isGeneratingPDF ? (
                                            <><FaSpinner className="spinner me-1" /> Generating...</>
                                        ) : (
                                            <><FaDownload /> Download PDF (SPJ)</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Printable Invoice Document Container */}
                <div className="card border-0 shadow-lg mx-auto overflow-hidden printable-card" style={{ maxWidth: '900px', borderRadius: '16px', backgroundColor: '#ffffff' }} ref={invoiceRef}>
                    <div className="card-body p-4 p-md-5">

                        {/* Kop Surat Header */}
                        <div className="header-kop text-center pb-3 mb-4" style={{ borderBottom: '3px double #1e293b' }}>
                            <h5 className="fw-extrabold text-uppercase text-dark mb-1" style={{ letterSpacing: '0.5px' }}>PEMERINTAH KABUPATEN SIDOARJO</h5>
                            <h4 className="fw-bold text-uppercase text-primary mb-1" style={{ letterSpacing: '0.5px' }}>DINAS KESEHATAN</h4>
                            <h3 className="fw-black text-uppercase text-dark mb-2" style={{ letterSpacing: '0.8px' }}>UPT LABORATORIUM KESEHATAN DAERAH</h3>
                            <p className="text-muted small mb-0">
                                Jalan A. Yani Gedangan Nomer 330, Kecamatan Gedangan | Telp: 0859 4634 5774 | Kabupaten Sidoarjo
                            </p>
                        </div>

                        {/* Title Banner */}
                        <div className="title-banner p-3 rounded-3 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div>
                                <h4 className="fw-bold text-dark mb-0">INVOICE / BUKTI SPJ</h4>
                                <span className="text-muted small">Rincian Pengajuan Pemeriksaan Laboratorium</span>
                            </div>
                            <div>
                                {allPaid ? (
                                    <span className="badge bg-success-lt text-success fw-bold fs-6 px-3 py-2 rounded-pill border border-success">
                                        ✔ LUNAS BAYAR
                                    </span>
                                ) : (
                                    <span className="badge bg-warning-lt text-warning-emphasis fw-bold fs-6 px-3 py-2 rounded-pill border border-warning">
                                        ⏳ MENUNGGU PEMBAYARAN
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Information Grid Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="card h-100 border p-3 rounded-3" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
                                    <h6 className="fw-bold text-primary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                                        <FaUser className="text-primary" /> Pemohon / Pelanggan
                                    </h6>
                                    <div className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted small">Nama:</span>
                                        <strong className="text-dark small">{customerName}</strong>
                                    </div>
                                    <div className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted small">NIK:</span>
                                        <span className="text-dark small fw-semibold">{customerNik}</span>
                                    </div>
                                    <div className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted small">No. HP / WA:</span>
                                        <span className="text-dark small fw-semibold">{customerPhone}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Email:</span>
                                        <span className="text-dark small fw-semibold">{customerEmail}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card h-100 border p-3 rounded-3" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
                                    <h6 className="fw-bold text-primary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                                        <FaHashtag className="text-primary" /> Rincian Transaksi
                                    </h6>
                                    <div className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted small">No. Invoice:</span>
                                        <strong className="text-primary small font-monospace">{transaction.invoice || '-'}</strong>
                                    </div>
                                    <div className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted small">Tanggal:</span>
                                        <span className="text-dark small fw-semibold">{formatDate(transaction.created_at)}</span>
                                    </div>
                                    <div className="mb-2 d-flex justify-content-between">
                                        <span className="text-muted small">No. FA / VA:</span>
                                        <span className="text-success small fw-bold font-monospace">{transaction.no_fa || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Pembayaran via:</span>
                                        <span className="text-dark small fw-semibold">{transaction.no_fa ? 'Virtual Account' : transaction.qris ? 'QRIS' : 'Kasir / Manual'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Itemized Details Table */}
                        <div className="table-responsive mb-4">
                            <table className="table table-bordered align-middle mb-0" style={{ borderColor: '#cbd5e1' }}>
                                <thead className="table-dark" style={{ backgroundColor: '#1e3a8a' }}>
                                    <tr className="text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                        <th className="text-center" style={{ width: '50px' }}>No</th>
                                        <th>Jenis Pemeriksaan / Parameter Sampel</th>
                                        <th className="text-center" style={{ width: '110px' }}>Jumlah</th>
                                        <th className="text-end" style={{ width: '140px' }}>Harga Satuan</th>
                                        <th className="text-end" style={{ width: '150px' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transaction.transaction_details && transaction.transaction_details.map((detail, idx) => (
                                        <tr key={detail.id || idx}>
                                            <td className="text-center fw-semibold" style={{ fontSize: '0.85rem' }}>{idx + 1}</td>
                                            <td>
                                                <strong className="text-dark d-block" style={{ fontSize: '0.9rem' }}>{detail.sampel?.parameter || 'Pemeriksaan Sampel'}</strong>
                                                <span className="text-muted small" style={{ fontSize: '0.78rem' }}>Sampel Uji Laboratorium</span>
                                            </td>
                                            <td className="text-center text-muted small">1 Sampel</td>
                                            <td className="text-end text-secondary small">{formatCurrency(detail.price)}</td>
                                            <td className="text-end fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{formatCurrency(detail.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Total Card & Terbilang */}
                        <div className="card border-0 p-3 mb-4 rounded-3" style={{ backgroundColor: '#f0f6ff', border: '1px solid #bfdbfe' }}>
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                                <span className="fw-extrabold text-primary text-uppercase" style={{ fontSize: '1rem' }}>GRAND TOTAL PEMBAYARAN:</span>
                                <span className="fs-3 fw-black text-primary font-monospace">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="p-2 rounded bg-white border text-secondary" style={{ fontSize: '0.85rem' }}>
                                <strong>Terbilang:</strong> <em className="text-dark"># {convertToWords(subtotal)} #</em>
                            </div>
                        </div>

                        {/* Bank Account Info & Signatures */}
                        <div className="row g-4 align-items-end mt-3">
                            <div className="col-md-6">
                                <div className="p-3 rounded border bg-light">
                                    <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.85rem' }}>Catatan Pembayaran:</h6>
                                    <p className="text-muted small mb-1">
                                        Pembayaran transfer bank dapat dilakukan ke rekening resmi:<br />
                                        <strong className="text-dark">Bank BCA: 4760219661</strong> (a.n. Labpesda Sidoarjo)
                                    </p>
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Simpan bukti pembayaran/kuitansi ini sebagai lampiran sah SPJ.</small>
                                </div>
                            </div>
                            <div className="col-md-6 text-center">
                                <div className="d-flex justify-content-around text-center">
                                    <div>
                                        <div className="text-muted small mb-5">Pemohon / Pelanggan,</div>
                                        <strong className="text-dark border-bottom border-dark pb-1 d-inline-block" style={{ fontSize: '0.9rem' }}>
                                            {customerName}
                                        </strong>
                                    </div>
                                    <div>
                                        <div className="text-muted small mb-1">Sidoarjo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        <div className="text-muted small mb-4">Petugas Admin Kasir,</div>
                                        <strong className="text-dark border-bottom border-dark pb-1 d-inline-block" style={{ fontSize: '0.9rem' }}>
                                            Kasir & Verifikasi UPT Labkesda
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <style>{`
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                        body {
                            background-color: #ffffff !important;
                        }
                        .invoice-page-wrapper {
                            padding: 0 !important;
                            background: white !important;
                        }
                        .printable-card {
                            box-shadow: none !important;
                            border: none !important;
                            max-width: 100% !important;
                        }
                    }
                `}</style>

            </div>
        </LayoutAdmin>
    );
}