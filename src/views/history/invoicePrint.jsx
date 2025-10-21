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
    FaFilePdf
} from 'react-icons/fa';
import LayoutAdmin from '../../layouts/admin';

export default function InvoicePrint() {
    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const invoiceRef = useRef();

    const fetchTransaction = async () => {
        if (!id) return;

        setIsLoading(true);
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const response = await Api.get(`/api/transaction-by-id/${id}`);
                setTransaction(response.data.data);

                // Get user data from cookie
                const userCookie = Cookies.get("user");
                if (userCookie) {
                    setUserData(JSON.parse(userCookie));
                }
            } catch (error) {
                console.error("Error fetching transaction:", error);
            } finally {
                setIsLoading(false);
            }
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
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    // Fungsi untuk generate PDF yang rapi dengan spasi yang benar
    const generateInvoicePDF = async () => {
        if (!invoiceRef.current || !transaction) return;

        setIsGeneratingPDF(true);

        try {
            // Buat elemen temporary untuk PDF generation
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generateInvoiceHTML();
            document.body.appendChild(tempDiv);

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `invoice-${transaction.invoice}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 1.0
                },
                html2canvas: {
                    scale: 3, // Higher scale for better quality
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    backgroundColor: '#ffffff',
                    width: 794, // A4 width in pixels at 96 DPI
                    height: 1123 // A4 height in pixels
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

            // Clean up
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

        const subtotal = transaction.transaction_details.reduce((sum, detail) => sum + detail.price, 0);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invoice ${transaction.invoice}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Inter', sans-serif;
                        line-height: 1.4;
                        color: #000000;
                        background: #ffffff;
                        padding: 15mm;
                        font-size: 11pt;
                    }
                    
                    .invoice-container {
                        width: 100%;
                        max-width: 170mm;
                        margin: 0 auto;
                        background: white;
                    }
                    
                    .header-section {
                        text-align: center;
                        margin-bottom: 8mm;
                        padding-bottom: 4mm;
                        border-bottom: 1px solid #000;
                    }
                    
                    .clinic-name {
                        color: #000;
                        font-size: 14pt;
                        font-weight: 700;
                        margin-bottom: 2mm;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .clinic-address {
                        color: #000;
                        font-size: 9pt;
                        font-weight: 400;
                        margin-bottom: 1mm;
                        line-height: 1.3;
                    }
                    
                    .clinic-address span {
                        display: inline-block;
                        margin: 0 2px;
                    }
                    
                    .invoice-title {
                        margin-top: 4mm;
                    }
                    
                    .invoice-title h1 {
                        color: #000;
                        font-size: 16pt;
                        font-weight: 700;
                        margin-bottom: 2mm;
                        text-transform: uppercase;
                    }
                    
                    .info-sections {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 6mm;
                        gap: 10mm;
                    }
                    
                    .invoice-info, .client-info {
                        flex: 1;
                    }
                    
                    .section-title {
                        color: #000;
                        font-size: 10pt;
                        font-weight: 600;
                        margin-bottom: 2mm;
                        text-transform: uppercase;
                        border-bottom: 1px solid #000;
                        padding-bottom: 1mm;
                    }
                    
                    .detail-item {
                        font-size: 9pt;
                        margin-bottom: 1mm;
                        line-height: 1.3;
                    }
                    
                    .detail-item strong {
                        font-weight: 600;
                    }
                    
                    .client-name {
                        font-weight: 600;
                        margin-bottom: 1mm;
                        font-size: 10pt;
                    }
                    
                    .items-section {
                        margin-bottom: 6mm;
                    }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9pt;
                    }
                    
                    .items-table th {
                        background: #f5f5f5;
                        color: #000;
                        padding: 2mm 1mm;
                        text-align: left;
                        font-weight: 600;
                        border: 1px solid #000;
                        text-transform: uppercase;
                    }
                    
                    .items-table td {
                        padding: 2mm 1mm;
                        border: 1px solid #000;
                        vertical-align: top;
                    }
                    
                    .text-center { 
                        text-align: center; 
                    }
                    
                    .text-right { 
                        text-align: right; 
                    }
                    
                    .total-section {
                        margin-bottom: 6mm;
                    }
                    
                    .total-table {
                        width: 60mm;
                        margin-left: auto;
                        border-collapse: collapse;
                        font-size: 9pt;
                    }
                    
                    .total-table td {
                        padding: 1.5mm 2mm;
                        border: 1px solid #000;
                    }
                    
                    .total-label {
                        font-weight: 600;
                        background: #f5f5f5;
                    }
                    
                    .footer-section {
                        margin-top: 6mm;
                        padding-top: 4mm;
                        border-top: 1px solid #000;
                    }
                    
                    .terbilang-section {
                        margin-bottom: 4mm;
                    }
                    
                    .terbilang-text {
                        font-size: 9pt;
                        font-weight: 600;
                        color: #000;
                        line-height: 1.3;
                    }
                    
                    .payment-info h4 {
                        color: #000;
                        font-size: 10pt;
                        font-weight: 600;
                        margin-bottom: 2mm;
                        text-transform: uppercase;
                    }
                    
                    .payment-info p {
                        font-size: 9pt;
                        color: #000;
                        line-height: 1.4;
                    }
                    
                    .spacer {
                        height: 2mm;
                    }
                    
                    @media print {
                        body {
                            margin: 0;
                            padding: 15mm;
                            background: white !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <!-- Header Section -->
                    <div class="header-section">
                        <div class="clinic-name">Laboratorium Kesehatan Daerah Kabupaten Sidoarjo</div>
                        <div class="clinic-address">
                            <span>Jalan.</span> <span>A. Yani</span> <span>Gedangan</span> <span>Nomer.</span> <span>330</span> <span>Kab.Sidoarjo</span>
                        </div>
                        <div class="clinic-address">
                            <span>Kecamatan Gedangan</span> <span>Telp.</span> <span>0859</span> <span>4634</span> <span>5774</span>
                        </div>
                        <div class="clinic-address">
                            <span>Kabupaten</span> <span>Sidoarjo</span>
                        </div>
                        <div class="invoice-title">
                            <h1>INVOICE</h1>
                        </div>
                    </div>

                    <!-- Info Sections -->
                    <div class="info-sections">
                        <div class="invoice-info">
                            <div class="section-title">INVOICE</div>
                            <div class="detail-item">
                                <strong>Tanggal:</strong> ${formatDate(transaction.created_at)}
                            </div>
                            <div class="detail-item">
                                <strong>Invoice:</strong> ${transaction.invoice}
                            </div>
                        </div>
                        <div class="client-info">
                            <div class="section-title">KEPADA</div>
                            <div class="client-name">${userData?.name || 'ariefsanggautama'}</div>
                            <div class="detail-item">${formatAddress(userData?.address || 'Taman Puri Bintaro PB 33 No.37B Bintaro Sektor 9')}</div>
                            <div class="detail-item">${formatCity(userData?.city || 'Tangerang Selatan Banten')}</div>
                        </div>
                    </div>

                    <div class="spacer"></div>

                    <!-- Items Table -->
                    <div class="items-section">
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th width="8%">NO.</th>
                                    <th width="47%">JENIS PEMERIKSAAN</th>
                                    <th width="15%">JUMLAH</th>
                                    <th width="15%">HARGA / ITEM</th>
                                    <th width="15%">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transaction.transaction_details.map((detail, index) => `
                                    <tr>
                                        <td class="text-center">${index + 1}.</td>
                                        <td>${detail.sampel?.parameter || `Jenis Pemeriksaan ${index + 1}`}</td>
                                        <td class="text-center">1 (satu)</td>
                                        <td class="text-right">${formatCurrency(detail.price)}</td>
                                        <td class="text-right">${formatCurrency(detail.price)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Total Section -->
                    <div class="total-section">
                        <table class="total-table">
                            <tr>
                                <td class="total-label" width="60%">Total</td>
                                <td class="text-right" width="40%">${formatCurrency(subtotal)}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Footer Section -->
                    <div class="footer-section">
                        <div class="terbilang-section">
                            <p class="terbilang-text"><strong>Terbilang:</strong> ${convertToWords(subtotal)}</p>
                        </div>
                        <div class="payment-info">
                            <h4>KETERANGAN:</h4>
                            <p>
                                Lakukan pembayaran ke nomor rekening:<br />
                                BCA 4760219661<br />
                                a.n. Christopher Roswell
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    // Fungsi untuk memformat alamat dengan spasi
    const formatAddress = (address) => {
        return address
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
            .replace(/([0-9])([A-Za-z])/g, '$1 $2')
            .replace(/([A-Za-z])([0-9])/g, '$1 $2');
    };

    // Fungsi untuk memformat kota dengan spasi
    const formatCity = (city) => {
        return city
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    };

    // Fungsi untuk mengkonversi angka ke terbilang (dalam bahasa Indonesia)
    const convertToWords = (number) => {
        if (number === 0) return 'nol rupiah';

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
        return words + ' rupiah';
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <FaSpinner className="spinner-icon" />
                </div>
                <p className="loading-text">Memuat data invoice...</p>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="error-container">
                <h2>Data tidak ditemukan</h2>
                <p>Transaksi tidak ditemukan atau telah dihapus</p>
                <button onClick={() => navigate(-1)} className="btn btn-primary">
                    <FaArrowLeft className="btn-icon" />
                    Kembali
                </button>
            </div>
        );
    }

    // Calculate totals for display
    const subtotal = transaction.transaction_details.reduce((sum, detail) => sum + detail.price, 0);

    return (
        <LayoutAdmin>
            <div className="invoice-print-container">
                {/* Action Bar - Tidak akan tercetak */}
                <div className="action-bar no-print">
                    <div className="action-header">
                        <h2 className="page-title">
                            <FaFilePdf className="title-icon" />
                            Invoice #{transaction.invoice}
                        </h2>
                        <p className="page-subtitle">Preview dan download invoice transaksi</p>
                    </div>
                    <div className="action-buttons">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn btn-back"
                        >
                            <FaArrowLeft className="btn-icon" />
                            Kembali ke Daftar
                        </button>
                        <div className="button-divider"></div>
                        <button
                            onClick={generateInvoicePDF}
                            className="btn btn-download"
                            disabled={isGeneratingPDF}
                        >
                            {isGeneratingPDF ? (
                                <FaSpinner className="btn-icon spinning" />
                            ) : (
                                <FaDownload className="btn-icon" />
                            )}
                            {isGeneratingPDF ? 'Sedang Membuat PDF...' : 'Download PDF Invoice'}
                        </button>
                    </div>
                </div>

                {/* Invoice Content untuk tampilan di browser */}
                <div className="invoice-content" id="invoice-content" ref={invoiceRef}>
                    <div className="invoice-container-preview">
                        {/* Header Section */}
                        <div className="header-section">
                            <div className="clinic-name">Laboratorium Kesehatan Daerah Kabupaten Sidoarjo</div>
                            <div className="clinic-address">Jalan A. Yani Gedangan Nomer 330.</div>
                            <div className="clinic-address">Kecamatan Gedangan Telp. 0859 4634 5774</div>
                            <div className="clinic-address">Kabupaten Sidoarjo</div>
                            <div className="invoice-title">
                                <h1>INVOICE</h1>
                            </div>
                        </div>

                        {/* Info Sections */}
                        <div className="info-sections">
                            <div className="invoice-info">
                                <h3 className="section-title">INVOICE</h3>
                                <div className="detail-item">
                                    <strong>Tanggal:</strong> {formatDate(transaction.created_at)}
                                </div>
                                <div className="detail-item">
                                    <strong>Invoice:</strong> {transaction.invoice}
                                </div>
                            </div>
                            <div className="client-info">
                                <h3 className="section-title">KEPADA</h3>
                                <div className="client-name">
                                    <strong>{userData?.name || 'ariefsanggautama'}</strong>
                                </div>
                                <div className="detail-item">
                                    {userData?.address || 'Taman Puri Bintaro PB 33 No.37B Bintaro Sektor 9'}
                                </div>
                                <div className="detail-item">
                                    {userData?.city || 'Tangerang Selatan Banten'}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="items-section">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th width="8%">NO.</th>
                                        <th width="47%">JENIS PEMERIKSAAN</th>
                                        <th width="15%">JUMLAH</th>
                                        <th width="15%">HARGA / ITEM</th>
                                        <th width="15%">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transaction.transaction_details.map((detail, index) => (
                                        <tr key={detail.id}>
                                            <td className="text-center">{index + 1}.</td>
                                            <td>{detail.sampel?.parameter || `Jenis Pemeriksaan ${index + 1}`}</td>
                                            <td className="text-center">1 (satu)</td>
                                            <td className="text-right">{formatCurrency(detail.price)}</td>
                                            <td className="text-right">{formatCurrency(detail.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Total Section */}
                        <div className="total-section">
                            <table className="total-table">
                                <tbody>
                                    <tr>
                                        <td className="total-label" width="60%">Total</td>
                                        <td className="text-right" width="40%">{formatCurrency(subtotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Section */}
                        <div className="footer-section">
                            <div className="terbilang-section">
                                <p className="terbilang-text"><strong>Terbilang:</strong> {convertToWords(subtotal)}</p>
                            </div>
                            <div className="payment-info">
                                <h4>KETERANGAN:</h4>
                                <p>
                                    Lakukan pembayaran ke nomor rekening:<br />
                                    BCA 4760219661<br />
                                    a.n. Christopher Roswell
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                .invoice-print-container {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding: 20px;
                    font-family: 'Inter', sans-serif;
                }

                .action-bar {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 2rem;
                    border: 1px solid #e9ecef;
                }

                .action-header {
                    flex: 1;
                }

                .page-title {
                    color: #2c3e50;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0 0 0.5rem 0;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .title-icon {
                    color: #e74c3c;
                    font-size: 1.4rem;
                }

                .page-subtitle {
                    color: #6c757d;
                    font-size: 0.95rem;
                    margin: 0;
                    font-weight: 400;
                }

                .action-buttons {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-shrink: 0;
                }

                .button-divider {
                    width: 1px;
                    height: 30px;
                    background: #e9ecef;
                    margin: 0 0.5rem;
                }

                .btn {
                    padding: 0.875rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    font-size: 0.95rem;
                    min-width: 180px;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    position: relative;
                    overflow: hidden;
                }

                .btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: left 0.5s;
                }

                .btn:hover::before {
                    left: 100%;
                }

                .btn-back {
                    background: linear-gradient(135deg, #6c757d, #495057);
                    color: white;
                    border: 2px solid #495057;
                }

                .btn-back:hover {
                    background: linear-gradient(135deg, #5a6268, #3d4348);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
                }

                .btn-download {
                    background: linear-gradient(135deg, #28a745, #1e7e34);
                    color: white;
                    border: 2px solid #1e7e34;
                }

                .btn-download:hover:not(:disabled) {
                    background: linear-gradient(135deg, #218838, #155724);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .btn:disabled:hover::before {
                    left: -100%;
                }

                .btn-icon {
                    font-size: 1rem;
                    flex-shrink: 0;
                }

                .invoice-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
                    padding: 40px;
                    max-width: 210mm;
                    margin: 0 auto;
                    font-size: 12pt;
                    border: 1px solid #e9ecef;
                }

                .invoice-container-preview {
                    max-width: 100%;
                }

                .header-section {
                    text-align: center;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #000;
                }

                .clinic-name {
                    color: #000;
                    margin: 0 0 10px 0;
                    font-size: 1.4rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .clinic-address {
                    color: #000;
                    font-size: 0.9rem;
                    margin: 3px 0;
                    font-weight: 400;
                    line-height: 1.3;
                }

                .invoice-title h1 {
                    color: #000;
                    margin: 15px 0 5px 0;
                    font-size: 1.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .info-sections {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 25px;
                    gap: 40px;
                }

                .invoice-info, .client-info {
                    flex: 1;
                }

                .section-title {
                    color: #000;
                    margin-bottom: 10px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    border-bottom: 1px solid #000;
                    padding-bottom: 5px;
                }

                .detail-item {
                    color: #000;
                    font-size: 0.9rem;
                    margin-bottom: 5px;
                    line-height: 1.3;
                }

                .client-name {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #000;
                    font-size: 1rem;
                }

                .items-section {
                    margin-bottom: 25px;
                }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border: 1px solid #000;
                    font-size: 0.9rem;
                }

                .items-table th {
                    background: #f5f5f5;
                    color: #000;
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: 600;
                    border: 1px solid #000;
                    text-transform: uppercase;
                }

                .items-table td {
                    padding: 10px 8px;
                    border: 1px solid #000;
                    vertical-align: top;
                }

                .text-center {
                    text-align: center;
                }

                .text-right {
                    text-align: right;
                }

                .total-section {
                    margin-bottom: 25px;
                }

                .total-table {
                    width: 200px;
                    margin-left: auto;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                    border: 1px solid #000;
                }

                .total-table td {
                    padding: 8px 12px;
                    border: 1px solid #000;
                }

                .total-label {
                    font-weight: 600;
                    background: #f5f5f5;
                }

                .footer-section {
                    margin-top: 25px;
                    padding-top: 15px;
                    border-top: 2px solid #000;
                }

                .terbilang-section {
                    margin-bottom: 15px;
                }

                .terbilang-text {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #000;
                    line-height: 1.3;
                }

                .payment-info h4 {
                    color: #000;
                    margin-bottom: 8px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .payment-info p {
                    color: #000;
                    line-height: 1.4;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .loading-container, .error-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 50vh;
                    text-align: center;
                }

                .loading-spinner {
                    margin-bottom: 1.5rem;
                }

                .spinner-icon {
                    font-size: 3.5rem;
                    color: #007bff;
                    animation: spin 1s linear infinite;
                }

                .loading-text {
                    color: #6c757d;
                    font-size: 1.3rem;
                    font-weight: 500;
                }

                .error-container h2 {
                    color: #dc3545;
                    margin-bottom: 1rem;
                    font-size: 1.8rem;
                }

                .error-container p {
                    color: #6c757d;
                    margin-bottom: 2rem;
                    font-size: 1.1rem;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }

                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .invoice-print-container {
                        background: white;
                        padding: 0;
                        margin: 0;
                    }
                    .invoice-content {
                        box-shadow: none;
                        padding: 0;
                        margin: 0;
                        border-radius: 0;
                    }
                }

                @media (max-width: 1024px) {
                    .action-bar {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1.5rem;
                    }
                    
                    .action-buttons {
                        justify-content: center;
                    }
                }

                @media (max-width: 768px) {
                    .invoice-print-container {
                        padding: 15px;
                    }
                    
                    .action-bar {
                        padding: 1.5rem;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        width: 100%;
                    }
                    
                    .button-divider {
                        display: none;
                    }
                    
                    .btn {
                        width: 100%;
                        min-width: auto;
                    }
                    
                    .invoice-content {
                        padding: 20px;
                    }
                    
                    .info-sections {
                        flex-direction: column;
                        gap: 20px;
                    }
                    
                    .page-title {
                        font-size: 1.3rem;
                    }
                }

                @media (max-width: 480px) {
                    .invoice-print-container {
                        padding: 10px;
                    }
                    
                    .action-bar {
                        padding: 1rem;
                    }
                    
                    .invoice-content {
                        padding: 15px;
                    }
                    
                    .page-title {
                        font-size: 1.2rem;
                    }
                    
                    .btn {
                        padding: 0.75rem 1rem;
                        font-size: 0.9rem;
                    }
                }
            `}</style>
            </div>
        </LayoutAdmin>
    );
}