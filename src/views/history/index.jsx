import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import Api from "../../services/api";
import LayoutAdmin from '../../layouts/admin';

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

export default function History() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [expandedInvoices, setExpandedInvoices] = useState({});
    const navigate = useNavigate();

    const userCookie = Cookies.get("user");
    const parsedData = JSON.parse(userCookie);
    const idUser = parsedData.id;

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
        // Navigate to print page instead of window.print()
        navigate(`/invoice/${transaction.id}`);
    };

    const handleViewDetails = (transaction) => {
        console.log("View details:", transaction);
    };

    const calculateTotalItems = (transaction) => {
        return transaction.transaction_details.length;
    };

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

                                                        {/* Actions */}
                                                        <div className="details-footer">
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