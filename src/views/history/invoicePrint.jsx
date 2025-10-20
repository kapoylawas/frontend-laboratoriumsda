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
    FaFileInvoiceDollar,
    FaBuilding,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaCalendarAlt,
    FaMoneyBillWave
} from 'react-icons/fa';

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
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Fungsi untuk print biasa dengan preview di tab baru
    const generatePrintPreview = () => {
        if (!invoiceRef.current || !transaction) return;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invoice ${transaction.invoice}</title>
                <style>
                    ${getPrintStyles()}
                </style>
            </head>
            <body>
                ${generateInvoiceHTML()}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // Fungsi untuk generate PDF yang rapi
    const generateInvoicePDF = async () => {
        if (!invoiceRef.current || !transaction) return;

        setIsGeneratingPDF(true);

        try {
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `invoice-${transaction.invoice}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 1.0
                },
                html2canvas: {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
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
                .from(invoiceRef.current)
                .save();

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Terjadi kesalahan saat menggenerate PDF: ' + error.message);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const getPrintStyles = () => `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #ffffff;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2c5aa0;
        }
        
        .company-info h1 {
            color: #2c5aa0;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .company-info .subtitle {
            color: #666;
            font-size: 14px;
            font-weight: 500;
        }
        
        .company-address {
            color: #666;
            font-size: 12px;
            line-height: 1.4;
            margin-top: 8px;
        }
        
        .invoice-title {
            text-align: right;
        }
        
        .invoice-title h2 {
            color: #2c5aa0;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .invoice-number {
            color: #333;
            font-size: 16px;
            font-weight: 600;
            background: #f8f9fa;
            padding: 8px 15px;
            border-radius: 4px;
            display: inline-block;
        }
        
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .info-section h3 {
            color: #2c5aa0;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }
        
        .client-details, .invoice-details {
            font-size: 13px;
        }
        
        .client-item, .detail-item {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        .items-section {
            margin-bottom: 25px;
        }
        
        .items-section h3 {
            color: #2c5aa0;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .items-table th {
            background: #2c5aa0;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
        }
        
        .items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 13px;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
        }
        
        .status-paid {
            background: #d4edda;
            color: #155724;
        }
        
        .status-pending {
            background: #f8d7da;
            color: #721c24;
        }
        
        .summary-section {
            margin-bottom: 25px;
        }
        
        .total-summary {
            max-width: 300px;
            margin-left: auto;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .grand-total {
            font-size: 16px;
            font-weight: 700;
            color: #2c5aa0;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #2c5aa0;
        }
        
        .invoice-footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 25px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        
        .payment-info h4, .notes-section h4 {
            color: #2c5aa0;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .payment-info p, .notes-section ul {
            font-size: 12px;
            color: #666;
        }
        
        .notes-section ul {
            padding-left: 20px;
        }
        
        .notes-section li {
            margin-bottom: 5px;
        }
        
        .signature-section {
            text-align: center;
        }
        
        .signature-line {
            width: 200px;
            height: 1px;
            background: #333;
            margin: 40px auto 10px;
        }
        
        .watermark {
            position: fixed;
            bottom: 10px;
            right: 10px;
            font-size: 10px;
            color: #ccc;
            opacity: 0.7;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                border: none;
                padding: 15px;
            }
        }
    `;

    const generateInvoiceHTML = () => {
        if (!transaction) return '';

        return `
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="company-info">
                        <h1>LABORATORIUM ANALIS</h1>
                        <div class="subtitle">Laboratorium Terpercaya</div>
                        <div class="company-address">
                            Jl. Contoh Alamat No. 123<br />
                            Jakarta Selatan, 12345<br />
                            Telp: (021) 123-4567<br />
                            Email: info@laboratorium.com
                        </div>
                    </div>
                    <div class="invoice-title">
                        <h2>INVOICE</h2>
                        <div class="invoice-number">${transaction.invoice}</div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="client-info">
                        <h3>Kepada:</h3>
                        <div class="client-details">
                            <div class="client-item">
                                <strong>${userData?.name || 'Nama Pelanggan'}</strong>
                            </div>
                            <div class="client-item">
                                ${userData?.phone || 'Telepon tidak tersedia'}
                            </div>
                            <div class="client-item">
                                ${userData?.email || 'Email tidak tersedia'}
                            </div>
                        </div>
                    </div>
                    <div class="invoice-info">
                        <h3>Detail Invoice:</h3>
                        <div class="invoice-details">
                            <div class="detail-item">
                                Tanggal: ${formatDate(transaction.created_at)}
                            </div>
                            <div class="detail-item">
                                No. Invoice: ${transaction.invoice}
                            </div>
                            <div class="detail-item">
                                Status: ${transaction.transaction_details[0]?.status_bayar ? 'LUNAS' : 'BELUM BAYAR'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="items-section">
                    <h3>Detail Pemeriksaan:</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th width="5%">#</th>
                                <th width="55%">Parameter Pemeriksaan</th>
                                <th width="20%">Harga</th>
                                <th width="20%">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transaction.transaction_details.map((detail, index) => `
                                <tr>
                                    <td class="text-center">${index + 1}</td>
                                    <td>${detail.sampel?.parameter || 'Parameter tidak tersedia'}</td>
                                    <td class="text-right">${formatCurrency(detail.price)}</td>
                                    <td class="text-center">
                                        <span class="status-badge ${detail.status_bayar ? 'status-paid' : 'status-pending'}">
                                            ${detail.status_bayar ? 'LUNAS' : 'BELUM BAYAR'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="summary-section">
                    <div class="total-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(transaction.grand_total)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Pajak (0%):</span>
                            <span>${formatCurrency(0)}</span>
                        </div>
                        <div class="summary-row grand-total">
                            <span>Total:</span>
                            <span>${formatCurrency(transaction.grand_total)}</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-footer">
                    <div class="payment-info">
                        <h4>Informasi Pembayaran:</h4>
                        <p>
                            Transfer ke: BANK ABC<br />
                            No. Rekening: 1234-5678-9012<br />
                            Atas Nama: Laboratorium Analis
                        </p>
                    </div>
                    <div class="signature-section">
                        <div class="signature">
                            <div class="signature-line"></div>
                            <p>Hormat Kami,<br />Laboratorium Analis</p>
                        </div>
                    </div>
                </div>

                <div class="notes-section">
                    <h4>Catatan:</h4>
                    <ul>
                        <li>Invoice ini sah dan dapat digunakan sebagai bukti pembayaran</li>
                        <li>Pembayaran diharapkan lunas dalam waktu 7 hari</li>
                        <li>Untuk pertanyaan lebih lanjut, hubungi customer service kami</li>
                    </ul>
                </div>

                <div class="watermark">
                    Generated on ${new Date().toLocaleDateString('id-ID')}
                </div>
            </div>
        `;
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

    return (
        <div className="invoice-print-container">
            {/* Action Bar - Tidak akan tercetak */}
            <div className="action-bar no-print">
                <div className="action-buttons">
                    <button onClick={() => navigate(-1)} className="btn btn-outline">
                        <FaArrowLeft className="btn-icon" />
                        Kembali
                    </button>
                    <button onClick={generatePrintPreview} className="btn btn-primary">
                        <FaPrint className="btn-icon" />
                        Print Preview
                    </button>
                    <button
                        onClick={generateInvoicePDF}
                        className="btn btn-success"
                        disabled={isGeneratingPDF}
                    >
                        {isGeneratingPDF ? (
                            <FaSpinner className="btn-icon spinning" />
                        ) : (
                            <FaDownload className="btn-icon" />
                        )}
                        {isGeneratingPDF ? 'Membuat PDF...' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {/* Invoice Content untuk tampilan di browser */}
            <div className="invoice-content" id="invoice-content" ref={invoiceRef}>
                <div className="invoice-container-preview">
                    <div className="invoice-header">
                        <div className="company-info">
                            <div className="company-logo">
                                <FaBuilding />
                            </div>
                            <div>
                                <h1 className="company-name">LABORATORIUM ANALIS</h1>
                                <p className="company-subtitle">Laboratorium Terpercaya</p>
                                <p className="company-address">
                                    Jl. Contoh Alamat No. 123<br />
                                    Jakarta Selatan, 12345<br />
                                    Telp: (021) 123-4567<br />
                                    Email: info@laboratorium.com
                                </p>
                            </div>
                        </div>
                        <div className="invoice-title">
                            <div className="title-icon">
                                <FaFileInvoiceDollar />
                            </div>
                            <h2>INVOICE</h2>
                            <div className="invoice-number">{transaction.invoice}</div>
                        </div>
                    </div>

                    <div className="info-section">
                        <div className="client-info">
                            <h3>Kepada:</h3>
                            <div className="client-details">
                                <div className="client-item">
                                    <FaUser className="client-icon" />
                                    <strong>{userData?.name || 'Nama Pelanggan'}</strong>
                                </div>
                                <div className="client-item">
                                    <FaPhone className="client-icon" />
                                    {userData?.phone || 'Telepon tidak tersedia'}
                                </div>
                                <div className="client-item">
                                    <FaEnvelope className="client-icon" />
                                    {userData?.email || 'Email tidak tersedia'}
                                </div>
                            </div>
                        </div>
                        <div className="invoice-info">
                            <h3>Detail Invoice:</h3>
                            <div className="invoice-details">
                                <div className="detail-item">
                                    <FaCalendarAlt className="detail-icon" />
                                    <span>Tanggal: {formatDate(transaction.created_at)}</span>
                                </div>
                                <div className="detail-item">
                                    <FaFileInvoiceDollar className="detail-icon" />
                                    <span>No. Invoice: {transaction.invoice}</span>
                                </div>
                                <div className="detail-item">
                                    <FaMoneyBillWave className="detail-icon" />
                                    <span>Status: {transaction.transaction_details[0]?.status_bayar ? 'LUNAS' : 'BELUM BAYAR'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="items-section">
                        <h3>Detail Pemeriksaan:</h3>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th width="5%">#</th>
                                    <th width="55%">Parameter Pemeriksaan</th>
                                    <th width="20%">Harga</th>
                                    <th width="20%">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transaction.transaction_details.map((detail, index) => (
                                    <tr key={detail.id}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{detail.sampel?.parameter || 'Parameter tidak tersedia'}</td>
                                        <td className="text-right">{formatCurrency(detail.price)}</td>
                                        <td className="text-center">
                                            <span className={`status-badge ${detail.status_bayar ? 'status-paid' : 'status-pending'}`}>
                                                {detail.status_bayar ? 'LUNAS' : 'BELUM BAYAR'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="summary-section">
                        <div className="total-summary">
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(transaction.grand_total)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Pajak (0%):</span>
                                <span>{formatCurrency(0)}</span>
                            </div>
                            <div className="summary-row grand-total">
                                <span>Total:</span>
                                <span>{formatCurrency(transaction.grand_total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="invoice-footer">
                        <div className="payment-info">
                            <h4>Informasi Pembayaran:</h4>
                            <p>
                                Transfer ke: BANK ABC<br />
                                No. Rekening: 1234-5678-9012<br />
                                Atas Nama: Laboratorium Analis
                            </p>
                        </div>
                        <div className="signature-section">
                            <div className="signature">
                                <div className="signature-line"></div>
                                <p>Hormat Kami,<br />Laboratorium Analis</p>
                            </div>
                        </div>
                    </div>

                    <div className="notes-section">
                        <h4>Catatan:</h4>
                        <ul>
                            <li>Invoice ini sah dan dapat digunakan sebagai bukti pembayaran</li>
                            <li>Pembayaran diharapkan lunas dalam waktu 7 hari</li>
                            <li>Untuk pertanyaan lebih lanjut, hubungi customer service kami</li>
                        </ul>
                    </div>
                </div>
            </div>
            <style>{`
                /* invoicePrint.css */

                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                /* Base Styles */

                .invoice-print-container {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding: 20px;
                    font-family: 'Inter', sans-serif;
                }


                /* Action Bar */

                .action-bar {
                    background: white;
                    padding: 1.5rem 2rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: center;
                }

                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }


                /* Button Styles */

                .btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    font-size: 0.9rem;
                    min-width: 140px;
                    justify-content: center;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                }

                .btn-success {
                    background: linear-gradient(135deg, #28a745, #1e7e34);
                    color: white;
                }

                .btn-outline {
                    background: transparent;
                    color: #007bff;
                    border: 2px solid #007bff;
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-icon {
                    font-size: 0.9rem;
                }


                /* Invoice Content */

                .invoice-content {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
                    padding: 3rem;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .invoice-container-preview {
                    max-width: 800px;
                    margin: 0 auto;
                }


                /* Invoice Header */

                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2.5rem;
                    padding-bottom: 2rem;
                    border-bottom: 3px solid #2c5aa0;
                }

                .company-info {
                    display: flex;
                    gap: 1.5rem;
                    align-items: flex-start;
                }

                .company-logo {
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #2c5aa0, #1e3a8a);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2rem;
                    box-shadow: 0 4px 15px rgba(44, 90, 160, 0.3);
                }

                .company-name {
                    color: #2c5aa0;
                    margin: 0 0 0.5rem 0;
                    font-size: 1.8rem;
                    font-weight: 700;
                }

                .company-subtitle {
                    color: #6c757d;
                    font-size: 1rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }

                .company-address {
                    color: #6c757d;
                    line-height: 1.5;
                    margin: 0;
                    font-size: 0.9rem;
                }

                .invoice-title {
                    text-align: right;
                }

                .title-icon {
                    font-size: 2.5rem;
                    color: #2c5aa0;
                    margin-bottom: 0.5rem;
                }

                .invoice-title h2 {
                    color: #2c5aa0;
                    margin: 0.5rem 0;
                    font-size: 2.2rem;
                    font-weight: 700;
                }

                .invoice-number {
                    background: linear-gradient(135deg, #2c5aa0, #1e3a8a);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    box-shadow: 0 2px 10px rgba(44, 90, 160, 0.3);
                }


                /* Info Section */

                .info-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2.5rem;
                    margin-bottom: 2.5rem;
                    padding: 2rem;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 12px;
                    border-left: 4px solid #2c5aa0;
                }

                .client-info h3,
                .invoice-info h3 {
                    color: #2c5aa0;
                    margin-bottom: 1.2rem;
                    border-bottom: 2px solid #dee2e6;
                    padding-bottom: 0.75rem;
                    font-size: 1.2rem;
                    font-weight: 600;
                }

                .client-item,
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                    color: #495057;
                    font-size: 0.95rem;
                }

                .client-icon,
                .detail-icon {
                    color: #2c5aa0;
                    width: 16px;
                    font-size: 0.9rem;
                }


                /* Items Section */

                .items-section {
                    margin-bottom: 2.5rem;
                }

                .items-section h3 {
                    color: #2c5aa0;
                    margin-bottom: 1.2rem;
                    font-size: 1.3rem;
                    font-weight: 600;
                }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
                }

                .items-table th {
                    background: linear-gradient(135deg, #2c5aa0, #1e3a8a);
                    color: white;
                    padding: 1.2rem 1rem;
                    text-align: left;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .items-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #e9ecef;
                    background: white;
                    font-size: 0.9rem;
                }

                .items-table tr:last-child td {
                    border-bottom: none;
                }

                .items-table tr:hover td {
                    background: #f8f9fa;
                }

                .text-center {
                    text-align: center;
                }

                .text-right {
                    text-align: right;
                }


                /* Status Badges */

                .status-badge {
                    padding: 0.4rem 1rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: inline-block;
                    min-width: 100px;
                }

                .status-paid {
                    background: linear-gradient(135deg, #d4edda, #c3e6cb);
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .status-pending {
                    background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }


                /* Summary Section */

                .summary-section {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 2.5rem;
                }

                .total-summary {
                    width: 350px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 2rem;
                    border-radius: 12px;
                    border-left: 4px solid #2c5aa0;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid #dee2e6;
                    color: #495057;
                    font-size: 1rem;
                }

                .grand-total {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #2c5aa0;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 2px solid #2c5aa0;
                }


                /* Footer */

                .invoice-footer {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2.5rem;
                    margin-bottom: 2.5rem;
                    padding-top: 2.5rem;
                    border-top: 2px solid #e9ecef;
                }

                .payment-info h4,
                .notes-section h4 {
                    color: #2c5aa0;
                    margin-bottom: 1.2rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .payment-info p {
                    color: #6c757d;
                    line-height: 1.6;
                    font-size: 0.9rem;
                }

                .signature {
                    text-align: center;
                }

                .signature-line {
                    width: 250px;
                    height: 2px;
                    background: #495057;
                    margin: 3rem auto 0.75rem;
                }

                .signature p {
                    color: #6c757d;
                    font-size: 0.9rem;
                }

                .notes-section ul {
                    color: #6c757d;
                    padding-left: 1.5rem;
                    margin: 0;
                    font-size: 0.9rem;
                }

                .notes-section li {
                    margin-bottom: 0.5rem;
                    line-height: 1.5;
                }


                /* Loading & Error States */

                .loading-container,
                .error-container {
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
                    color: #2c5aa0;
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


                /* Animations */

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }


                /* Print Styles */

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
                    .invoice-container-preview {
                        max-width: 100%;
                    }
                    body {
                        background: white !important;
                        font-size: 12pt;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .invoice-header,
                    .info-section,
                    .items-section,
                    .summary-section,
                    .invoice-footer {
                        break-inside: avoid;
                    }
                    .items-table {
                        font-size: 10pt;
                    }
                    /* Ensure gradients and colors print correctly */
                    .company-logo,
                    .invoice-number,
                    .items-table th,
                    .status-badge {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }


                /* Responsive Design */

                @media (max-width: 1024px) {
                    .invoice-content {
                        padding: 2rem;
                    }
                    .info-section,
                    .invoice-footer {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                }

                @media (max-width: 768px) {
                    .invoice-print-container {
                        padding: 10px;
                    }
                    .invoice-content {
                        padding: 1.5rem;
                        border-radius: 8px;
                    }
                    .invoice-header {
                        flex-direction: column;
                        gap: 1.5rem;
                        text-align: center;
                    }
                    .company-info {
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                    }
                    .invoice-title {
                        text-align: center;
                    }
                    .action-bar {
                        padding: 1rem;
                    }
                    .action-buttons {
                        flex-direction: column;
                        width: 100%;
                    }
                    .btn {
                        width: 100%;
                    }
                    .total-summary {
                        width: 100%;
                    }
                    .items-table {
                        font-size: 0.8rem;
                    }
                    .items-table th,
                    .items-table td {
                        padding: 0.75rem 0.5rem;
                    }
                }

                @media (max-width: 480px) {
                    .invoice-content {
                        padding: 1rem;
                    }
                    .company-name {
                        font-size: 1.4rem;
                    }
                    .invoice-title h2 {
                        font-size: 1.6rem;
                    }
                    .info-section {
                        padding: 1.5rem;
                    }
                    .client-item,
                    .detail-item {
                        font-size: 0.85rem;
                    }
                }   
            `}</style>
        </div>

    );
}