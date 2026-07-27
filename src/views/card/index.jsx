import { useState, useEffect } from "react";
import LayoutAdmin from "../../layouts/admin";
import Cookies from "js-cookie";
import Api from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import {
    IconShoppingCart,
    IconPackage,
    IconCurrencyDollar,
    IconAlertCircle,
    IconChevronDown,
    IconChevronUp,
    IconCreditCard,
    IconTrash,
    IconCheck,
    IconX,
    IconRefresh,
    IconArchive,
    IconCategory,
    IconChartBar,
    IconCalendar,
    IconAlertTriangle,
    IconClock,
    IconArrowRight,
    IconPrinter,
    IconEdit,
    IconUser,
    IconSparkles,
    IconFlask,
    IconLoader
} from "@tabler/icons-react";
import "./cart.css";
import PaymentAllModal from "./paymentModal";

export default function Cart() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAllPaymentModal, setShowAllPaymentModal] = useState(false);
    const [categoryToPay, setCategoryToPay] = useState(null);
    const [paymentData, setPaymentData] = useState({
        cash: 0,
        discount: 0,
        grand_total: 0
    });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [userData, setUserData] = useState(null);

    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    const userCookie = Cookies.get("user");
    const parsedData = userCookie ? JSON.parse(userCookie) : {};
    const iduser = parsedData.id;

    const fetchData = async () => {
        setIsLoading(true);
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const response = await Api.get(`/api/sampels-by-user/${iduser}`);
                const sampelItems = response.data.data || [];
                setData(sampelItems);

                setUserData(parsedData);

                const categories = [...new Set(sampelItems.map(item => item.sampel?.category?.name || 'Lainnya'))];
                const initialExpanded = {};
                categories.forEach(category => {
                    initialExpanded[category] = true;
                });
                setExpandedCategories(initialExpanded);
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

    const openDeleteModal = (item) => {
        if (!item.status) {
            setItemToDelete(item);
            setShowDeleteModal(true);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        setDeletingId(itemToDelete.id);
        const token = Cookies.get("token");

        try {
            Api.defaults.headers.common["Authorization"] = token;
            await Api.delete(`/api/carts/${itemToDelete.id}`);

            setData(prevData => prevData.filter(item => item.id !== itemToDelete.id));
            closeDeleteModal();
        } catch (error) {
            console.error("There was an error deleting the sample!", error);
            alert("Gagal menghapus sampel. Silakan coba lagi.");
        } finally {
            setDeletingId(null);
        }
    };

    const groupByCategory = (dataItems) => {
        return dataItems.reduce((acc, item) => {
            const categoryName = item.sampel?.category?.name || 'Tanpa Kategori';
            const categoryColor = item.sampel?.category?.color || getCategoryColor(categoryName);

            if (!acc[categoryName]) {
                acc[categoryName] = {
                    items: [],
                    total: 0,
                    color: categoryColor,
                    itemCount: 0,
                    bgColor: getCategoryBgColor(categoryName),
                    hasUnpaidItems: false,
                    unpaidCount: 0,
                    unpaidTotal: 0
                };
            }
            acc[categoryName].items.push(item);
            const itemSubtotal = (item.price || 0) * (item.qty || 1);
            acc[categoryName].total += itemSubtotal;
            acc[categoryName].itemCount += (item.qty || 1);

            if (!item.status) {
                acc[categoryName].hasUnpaidItems = true;
                acc[categoryName].unpaidCount += 1;
                acc[categoryName].unpaidTotal += itemSubtotal;
            }

            return acc;
        }, {});
    };

    const openPaymentModal = (categoryName) => {
        setCategoryToPay(categoryName);
        const categoryData = groupedData[categoryName];
        setPaymentData({
            cash: categoryData.unpaidTotal,
            discount: 0,
            grand_total: categoryData.unpaidTotal
        });
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setCategoryToPay(null);
        setPaymentData({
            cash: 0,
            discount: 0,
            grand_total: 0
        });
        setIsProcessingPayment(false);
    };

    const openAllPaymentModal = () => {
        setCategoryToPay("SEMUA KATEGORI");
        setPaymentData({
            cash: unpaidTotal,
            discount: 0,
            grand_total: unpaidTotal
        });
        setShowAllPaymentModal(true);
    };

    const closeAllPaymentModal = () => {
        setShowAllPaymentModal(false);
        setCategoryToPay(null);
        setPaymentData({
            cash: 0,
            discount: 0,
            grand_total: 0
        });
        setIsProcessingPayment(false);
    };

    const calculateChange = () => {
        const change = paymentData.cash - paymentData.grand_total;
        return change > 0 ? change : 0;
    };

    const handlePaymentDataChange = (field, value) => {
        setPaymentData(prev => {
            const newData = { ...prev, [field]: parseFloat(value) || 0 };

            if (field === 'discount') {
                let originalTotal = 0;

                if (categoryToPay === "SEMUA KATEGORI") {
                    originalTotal = Object.values(groupedData).reduce((total, category) => {
                        return total + category.unpaidTotal;
                    }, 0);
                } else {
                    const categoryData = groupedData[categoryToPay];
                    originalTotal = categoryData ? categoryData.unpaidTotal : 0;
                }

                newData.grand_total = Math.max(0, originalTotal - newData.discount);
            }

            return newData;
        });
    };

    const handlePayment = async () => {
        if (!categoryToPay) return;

        setIsProcessingPayment(true);
        const token = Cookies.get("token");

        try {
            const unpaidItems = groupedData[categoryToPay].items.filter(item => !item.status);
            const cartIds = unpaidItems.map(item => item.id);

            const transactionData = {
                cash: paymentData.cash,
                grand_total: paymentData.grand_total,
                discount: paymentData.discount,
                user_id: iduser,
                cart_ids: cartIds,
                change: calculateChange(),
                category_name: categoryToPay
            };

            Api.defaults.headers.common["Authorization"] = token;
            const transactionResponse = await Api.post('/api/transactions', transactionData);

            for (const item of unpaidItems) {
                await Api.patch(`/api/carts/${item.id}`, { status: true });
            }

            await fetchData();
            closePaymentModal();
            printReceipt(transactionResponse.data.data, unpaidItems, categoryToPay);

            setSuccessMessage(`Pembayaran untuk kategori ${categoryToPay} berhasil!`);
            setShowSuccessNotification(true);

            setTimeout(() => {
                navigate("/history");
            }, 3000);

        } catch (error) {
            console.error("There was an error processing payment!", error);
            alert("Gagal memproses pembayaran. Silakan coba lagi.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleAllPayment = async () => {
        setIsProcessingPayment(true);
        const token = Cookies.get("token");

        try {
            const allUnpaidItems = [];
            Object.values(groupedData).forEach(category => {
                const unpaidItems = category.items.filter(item => !item.status);
                allUnpaidItems.push(...unpaidItems);
            });

            if (allUnpaidItems.length === 0) {
                alert("Tidak ada item yang perlu dibayar.");
                setIsProcessingPayment(false);
                return;
            }

            const cartIds = allUnpaidItems.map(item => item.id);

            const transactionData = {
                cash: paymentData.cash,
                grand_total: paymentData.grand_total,
                discount: paymentData.discount,
                user_id: iduser,
                cart_ids: cartIds,
                change: calculateChange(),
                category_name: "SEMUA KATEGORI"
            };

            Api.defaults.headers.common["Authorization"] = token;
            const transactionResponse = await Api.post('/api/transactions', transactionData);

            closeAllPaymentModal();
            printReceipt(transactionResponse.data.data, allUnpaidItems, "SEMUA KATEGORI");

            const unpaidCategoriesCount = Object.values(groupedData).filter(cat => cat.hasUnpaidItems).length;
            setSuccessMessage(`Pembayaran berhasil! ${allUnpaidItems.length} item dari ${unpaidCategoriesCount} kategori telah dibayar.`);
            setShowSuccessNotification(true);

            navigate("/history");

        } catch (error) {
            console.error("There was an error processing payment!", error);
            alert("Gagal memproses pembayaran. Silakan coba lagi.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleCheckoutPemohon = async () => {
        setIsProcessingPayment(true);
        const token = Cookies.get("token");

        try {
            const allUnpaidItems = [];
            Object.values(groupedData).forEach(category => {
                const unpaidItems = category.items.filter(item => !item.status);
                allUnpaidItems.push(...unpaidItems);
            });

            if (allUnpaidItems.length === 0) {
                alert("Tidak ada item yang perlu checkout.");
                setIsProcessingPayment(false);
                return;
            }

            const cartIds = allUnpaidItems.map(item => item.id);

            const allUnpaidTotal = Object.values(groupedData).reduce((total, category) => {
                return total + category.unpaidTotal;
            }, 0);

            const transactionData = {
                cash: 0,
                grand_total: allUnpaidTotal,
                discount: 0,
                user_id: iduser,
                cart_ids: cartIds,
                change: 0,
                category_name: "SEMUA KATEGORI"
            };

            Api.defaults.headers.common["Authorization"] = token;
            await Api.post('/api/transactions', transactionData);

            const unpaidCategoriesCount = Object.values(groupedData).filter(cat => cat.hasUnpaidItems).length;
            setSuccessMessage(`Invoice tagihan berhasil dibuat! ${allUnpaidItems.length} item dari ${unpaidCategoriesCount} kategori sedang menunggu rincian pembayaran dari admin.`);
            setShowSuccessNotification(true);

            setTimeout(() => {
                navigate("/history");
            }, 2000);

        } catch (error) {
            console.error("There was an error processing checkout!", error);
            alert("Gagal memproses checkout. Silakan coba lagi.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const printReceipt = (transaction, items, categoryName) => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date();

        const receiptContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Pembayaran - ${categoryName}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier Prime', monospace; width: 80mm; padding: 5mm; background: #fff; color: #000; font-size: 11px; }
                    .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
                    .company-name { font-weight: bold; font-size: 14px; text-transform: uppercase; }
                    .company-address { font-size: 9px; color: #333; }
                    .receipt-title { text-align: center; font-weight: bold; font-size: 12px; margin: 8px 0; }
                    .transaction-info, .customer-info { margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                    .info-label { font-weight: bold; }
                    .items-table { width: 100%; margin-bottom: 8px; border-collapse: collapse; }
                    .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 3px 0; font-size: 10px; }
                    .items-table td { padding: 3px 0; vertical-align: top; }
                    .item-name { width: 50%; } .item-qty { width: 15%; text-align: center; } .item-price { width: 35%; text-align: right; }
                    .total-section { border-top: 1px dashed #000; padding-top: 6px; margin-bottom: 8px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                    .grand-total { font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
                    .payment-info { border-top: 1px dashed #000; padding-top: 6px; margin-bottom: 10px; }
                    .thank-you { text-align: center; font-weight: bold; margin: 10px 0 5px; }
                    .footer { text-align: center; font-size: 8px; color: #555; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div class="company-name">LABORATORIUM ANALIS</div>
                        <div class="company-address">Jl. Contoh Alamat No. 123</div>
                        <div class="company-address">Telp: (021) 123-4567</div>
                    </div>
                    <div class="receipt-title">STRUK PEMBAYARAN</div>
                    <div class="transaction-info">
                        <div class="info-row"><span class="info-label">No. Transaksi:</span><span>${transaction.id || 'TRX-' + Date.now()}</span></div>
                        <div class="info-row"><span class="info-label">Tanggal:</span><span>${currentDate.toLocaleDateString('id-ID')}</span></div>
                        <div class="info-row"><span class="info-label">Waktu:</span><span>${currentDate.toLocaleTimeString('id-ID')}</span></div>
                        <div class="info-row"><span class="info-label">Kategori:</span><span>${categoryName}</span></div>
                    </div>
                    <div class="customer-info">
                        <div class="info-row"><span class="info-label">Pelanggan:</span><span>${userData?.name || 'Guest'}</span></div>
                    </div>
                    <table class="items-table">
                        <thead>
                            <tr><th class="item-name">Item</th><th class="item-qty">Qty</th><th class="item-price">Subtotal</th></tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td class="item-name">${item.sampel?.parameter || item.sampel?.name}</td>
                                    <td class="item-qty">${item.qty}</td>
                                    <td class="item-price">${formatCurrency((item.price || 0) * item.qty)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total-section">
                        <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(transaction.grand_total + transaction.discount)}</span></div>
                        ${transaction.discount > 0 ? `<div class="total-row"><span>Diskon:</span><span>-${formatCurrency(transaction.discount)}</span></div>` : ''}
                        <div class="grand-total total-row"><span>TOTAL:</span><span>${formatCurrency(transaction.grand_total)}</span></div>
                    </div>
                    <div class="payment-info">
                        <div class="total-row"><span>Cash:</span><span>${formatCurrency(transaction.cash)}</span></div>
                        <div class="total-row"><span>Kembali:</span><span>${formatCurrency(transaction.change)}</span></div>
                    </div>
                    <div class="thank-you">Terima kasih atas kepercayaan Anda</div>
                    <div class="footer">
                        <div>*** Struk ini sebagai bukti pembayaran ***</div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 1000);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(receiptContent);
        printWindow.document.close();
    };

    const getCategoryColor = (categoryName) => {
        const colors = [
            'from-blue-500 to-blue-600',
            'from-slate-500 to-slate-600',
            'from-emerald-500 to-emerald-600',
            'from-violet-500 to-violet-600',
            'from-cyan-500 to-cyan-600',
            'from-indigo-500 to-indigo-600'
        ];
        const index = categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    const getCategoryBgColor = (categoryName) => {
        const colors = [
            'bg-blue-50 border-blue-200',
            'bg-slate-50 border-slate-200',
            'bg-emerald-50 border-emerald-200',
            'bg-violet-50 border-violet-200',
            'bg-cyan-50 border-cyan-200',
            'bg-indigo-50 border-indigo-200'
        ];
        const index = categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % colors.length;
        return colors[index];
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
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const groupedData = groupByCategory(data);
    const grandTotal = Object.values(groupedData).reduce((total, category) => total + category.total, 0);
    const totalCategories = Object.keys(groupedData).length;
    const totalSamples = Object.values(groupedData).reduce((sum, category) => sum + category.itemCount, 0);

    const unpaidTotal = Object.values(groupedData).reduce((total, category) => {
        return total + category.unpaidTotal;
    }, 0);

    const hasUnpaidItems = Object.values(groupedData).some(category => category.hasUnpaidItems);

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="page-wrapper py-5 text-center">
                    <div className="container-xl">
                        <div className="card-3d p-5">
                            <div className="spinner-border text-primary me-2" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                            <div className="mt-3 fw-bold text-dark fs-5">Memuat keranjang pemesanan sampel...</div>
                        </div>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    return (
        <LayoutAdmin>
            {/* 3D Neo-Brutalist Theme Styles */}
            <style>{`
                .card-3d {
                    background: #ffffff !important;
                    border: 3px solid #000000 !important;
                    box-shadow: 6px 6px 0px #000000 !important;
                    border-radius: 20px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .hero-card-3d {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
                    border: 3px solid #000000 !important;
                    box-shadow: 6px 6px 0px #000000 !important;
                    border-radius: 22px !important;
                    color: #ffffff !important;
                }
                .stat-card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 5px 5px 0px #000000 !important;
                    border-radius: 16px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .stat-card-3d:hover {
                    box-shadow: 7px 7px 0px #000000 !important;
                    transform: translateY(-2px);
                }
                .category-card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 5px 5px 0px #000000 !important;
                    border-radius: 18px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .item-card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 16px !important;
                    transition: all 0.15s ease-in-out !important;
                    height: 100%;
                }
                .item-card-3d:hover {
                    box-shadow: 6px 6px 0px #000000 !important;
                    transform: translateY(-2px);
                }
                .item-card-3d.paid-item {
                    background: #f0fdf4 !important;
                    border-color: #16a34a !important;
                }
                .item-card-3d.unpaid-item {
                    background: #fffbeb !important;
                    border-color: #d97706 !important;
                }
                .badge-3d {
                    border: 2px solid #000000 !important;
                    box-shadow: 2px 2px 0px #000000 !important;
                    border-radius: 8px !important;
                    font-weight: 800 !important;
                    padding: 4px 10px !important;
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
                    gap: 6px;
                    transition: all 0.15s ease-in-out !important;
                    text-decoration: none !important;
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
                    transition: all 0.15s ease-in-out !important;
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
                    gap: 6px;
                    transition: all 0.15s ease-in-out !important;
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
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease-in-out !important;
                }
                .btn-3d-danger:hover {
                    background: #dc2626 !important;
                    color: #ffffff !important;
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0px #000000 !important;
                }
                .custom-order-modal-content {
                    background: #ffffff !important;
                    border: 3px solid #000000 !important;
                    border-radius: 20px !important;
                    box-shadow: 8px 8px 0px #000000 !important;
                    overflow: hidden !important;
                }
            `}</style>

            <div className="page-wrapper py-3">
                <div className="container-xl">
                    {/* Notifikasi Sukses */}
                    {showSuccessNotification && (
                        <div className="card-3d p-3 mb-4 bg-success-subtle text-success border-success" style={{ borderColor: '#16a34a' }}>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <IconCheck size={28} className="text-success" />
                                    <div>
                                        <h5 className="fw-black mb-0 text-success">Pembayaran Berhasil!</h5>
                                        <div className="small">{successMessage}</div>
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowSuccessNotification(false)}></button>
                            </div>
                        </div>
                    )}

                    {/* Hero Header Card 3D */}
                    <div className="hero-card-3d p-4 mb-4">
                        <div className="row align-items-center g-3">
                            <div className="col-lg-8">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div className="p-3 bg-primary text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '3px 3px 0px #000' }}>
                                        <IconShoppingCart size={32} />
                                    </div>
                                    <div>
                                        <h2 className="fw-black mb-1 text-white" style={{ fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
                                            Riwayat & Keranjang Pemesanan
                                        </h2>
                                        <div className="text-white-50 small">
                                            Daftar sampel yang telah diajukan/dipesan dan status kelunasan tagihan
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    <span className="badge badge-3d bg-info text-dark">
                                        <IconCategory size={14} className="me-1" /> {totalCategories} Kategori
                                    </span>
                                    <span className="badge badge-3d bg-success text-white">
                                        <IconPackage size={14} className="me-1" /> {totalSamples} Sampel Total
                                    </span>
                                    {hasUnpaidItems && (
                                        <span className="badge badge-3d bg-warning text-dark">
                                            <IconAlertTriangle size={14} className="me-1" /> Belum Bayar: {formatCurrency(unpaidTotal)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end">
                                <Link to="/orders" className="btn btn-3d-green py-2 px-3 me-2">
                                    <IconShoppingCart size={18} /> Tambah Pesanan
                                </Link>
                                <button onClick={fetchData} className="btn btn-3d-secondary py-2 px-3">
                                    <IconRefresh size={18} /> Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stat Cards 3D */}
                    <div className="row g-3 mb-4">
                        <div className="col-sm-6 col-lg-3">
                            <div className="stat-card-3d p-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-3 bg-primary text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                        <IconCategory size={24} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-bold">TOTAL KATEGORI</div>
                                        <div className="fw-black text-dark fs-3">{totalCategories}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="stat-card-3d p-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-3 bg-success text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                        <IconPackage size={24} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-bold">TOTAL SAMPEL</div>
                                        <div className="fw-black text-dark fs-3">{totalSamples}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="stat-card-3d p-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-3 bg-info text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                        <IconCurrencyDollar size={24} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-bold">TOTAL BIAYA</div>
                                        <div className="fw-black text-primary fs-5">{formatCurrency(grandTotal)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="stat-card-3d p-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className={`p-3 ${unpaidTotal > 0 ? 'bg-warning text-dark' : 'bg-success text-white'} rounded-3 border border-2 border-dark`} style={{ boxShadow: '2px 2px 0px #000' }}>
                                        <IconAlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-bold">BELUM DIBAYAR</div>
                                        <div className={`fw-black fs-5 ${unpaidTotal > 0 ? 'text-danger' : 'text-success'}`}>
                                            {formatCurrency(unpaidTotal)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alert Pembayaran Tertunda 3D */}
                    {hasUnpaidItems && (
                        <div className="card-3d p-4 mb-4" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="p-3 bg-warning text-dark rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                        <IconAlertTriangle size={28} />
                                    </div>
                                    <div>
                                        <h4 className="fw-black text-dark mb-1">Pembayaran Menunggu Konfirmasi / Lunas</h4>
                                        <p className="text-secondary small mb-0">
                                            Anda memiliki <strong>{Object.values(groupedData).reduce((sum, cat) => sum + cat.unpaidCount, 0)} sampel</strong> yang belum dibayar dengan total tagihan <strong>{formatCurrency(unpaidTotal)}</strong>.
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {parsedData.role_id === 2 ? (
                                        <button className="btn btn-3d-green py-2 px-4" onClick={openAllPaymentModal}>
                                            <IconCreditCard size={18} /> Bayar Semua Tagihan
                                        </button>
                                    ) : (
                                        <button className="btn btn-3d-primary py-2 px-4" onClick={handleCheckoutPemohon} disabled={isProcessingPayment}>
                                            {isProcessingPayment ? "Memproses..." : <><IconFileText size={18} /> Buat Invoice Tagihan</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Card 3D */}
                    <div className="card-3d p-4">
                        <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-2 border-dark">
                            <div className="d-flex align-items-center gap-2">
                                <div className="p-2 bg-primary text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                    <IconShoppingCart size={20} />
                                </div>
                                <h3 className="fw-black text-dark mb-0">Detail Rincian Pemesanan</h3>
                            </div>

                            {hasUnpaidItems && (
                                <div className="d-flex align-items-center gap-2">
                                    {parsedData.role_id === 2 ? (
                                        <button className="btn btn-3d-green py-1.5 px-3" onClick={openAllPaymentModal}>
                                            <IconCreditCard size={16} /> Bayar Semua
                                        </button>
                                    ) : (
                                        <button className="btn btn-3d-primary py-1.5 px-3" onClick={handleCheckoutPemohon} disabled={isProcessingPayment}>
                                            {isProcessingPayment ? "Memproses..." : "Buat Invoice Tagihan"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {Object.keys(groupedData).length === 0 ? (
                            <div className="text-center py-5">
                                <IconArchive size={64} className="text-muted mb-3 opacity-50" />
                                <h3 className="fw-black text-dark mb-2">Keranjang Pemesanan Kosong</h3>
                                <p className="text-muted mb-4">Belum ada sampel atau parameter yang ditambahkan ke keranjang.</p>
                                <Link to="/orders" className="btn btn-3d-primary py-2 px-4">
                                    Pilih Sampel Sekarang
                                </Link>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-4">
                                {Object.entries(groupedData).map(([categoryName, categoryData], categoryIndex) => {
                                    const isCategoryPaid = !categoryData.hasUnpaidItems;
                                    const unpaidCount = categoryData.unpaidCount;
                                    const unpaidTotalCategory = categoryData.unpaidTotal;
                                    const isExpanded = expandedCategories[categoryName];

                                    return (
                                        <div key={categoryName} className="category-card-3d overflow-hidden">
                                            <div
                                                className="p-3 d-flex justify-content-between align-items-center cursor-pointer"
                                                onClick={() => toggleCategory(categoryName)}
                                                style={{
                                                    backgroundColor: isCategoryPaid ? '#f0fdf4' : '#fffbeb',
                                                    borderBottom: isExpanded ? '2.5px solid #000' : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="p-2 bg-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                                        {isExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <h4 className="m-0 fw-black text-dark">{categoryName}</h4>
                                                            <span className="badge badge-3d bg-primary text-white">
                                                                {categoryData.itemCount} Sampel
                                                            </span>
                                                            {!isCategoryPaid && (
                                                                <span className="badge badge-3d bg-warning text-dark">
                                                                    {unpaidCount} Belum Bayar
                                                                </span>
                                                            )}
                                                            {isCategoryPaid && (
                                                                <span className="badge badge-3d bg-success text-white">
                                                                    LUNAS
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="text-end">
                                                        <div className={`fw-black fs-5 ${isCategoryPaid ? 'text-success' : 'text-primary'}`}>
                                                            {formatCurrency(categoryData.total)}
                                                        </div>
                                                        {!isCategoryPaid && (
                                                            <small className="text-danger fw-bold">
                                                                {formatCurrency(unpaidTotalCategory)} Belum Lunas
                                                            </small>
                                                        )}
                                                    </div>
                                                    {!isCategoryPaid && parsedData.role_id === 2 && (
                                                        <button
                                                            className="btn btn-3d-green py-1 px-3"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openPaymentModal(categoryName);
                                                            }}
                                                        >
                                                            Bayar Kategori
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-3 bg-light">
                                                    <div className="row g-3">
                                                        {categoryData.items.map((item, index) => (
                                                            <div key={item.id} className="col-md-6 col-lg-4">
                                                                <div className={`item-card-3d p-3 ${item.status ? 'paid-item' : 'unpaid-item'}`}>
                                                                    <div className="d-flex align-items-start justify-content-between mb-2">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <span className="badge badge-3d bg-dark text-white">
                                                                                #{index + 1}
                                                                            </span>
                                                                            <h6 className="fw-black text-dark mb-0">{item.sampel?.parameter || item.sampel?.name}</h6>
                                                                        </div>
                                                                        {item.status ? (
                                                                            <span className="badge badge-3d bg-success text-white">LUNAS</span>
                                                                        ) : (
                                                                            <span className="badge badge-3d bg-warning text-dark">BELUM BAYAR</span>
                                                                        )}
                                                                    </div>

                                                                    <div className="text-muted small mb-2">
                                                                        Kategori: {categoryName}
                                                                    </div>

                                                                    <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
                                                                        <div>
                                                                            <div className="text-muted small">Qty: {item.qty} × {formatCurrency(item.price)}</div>
                                                                            <div className="fw-black text-primary fs-5">
                                                                                {formatCurrency((item.price || 0) * item.qty)}
                                                                            </div>
                                                                        </div>

                                                                        {!item.status && (
                                                                            <button
                                                                                className="btn btn-3d-danger py-1 px-2 text-white"
                                                                                onClick={() => openDeleteModal(item)}
                                                                                disabled={deletingId === item.id}
                                                                                title="Hapus sampel dari keranjang"
                                                                            >
                                                                                {deletingId === item.id ? "Hapus..." : <><IconTrash size={16} className="me-1" /> Hapus</>}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {Object.keys(groupedData).length > 0 && (
                            <div className="mt-4 pt-3 border-top border-2 border-dark d-flex align-items-center justify-content-between flex-wrap gap-3">
                                <div>
                                    <h4 className="fw-black text-dark mb-1">Total Keseluruhan</h4>
                                    <div className="text-muted small">
                                        {totalSamples} sampel dalam {totalCategories} kategori
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="fw-black text-primary" style={{ fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
                                        {formatCurrency(grandTotal)}
                                    </div>
                                    {unpaidTotal > 0 && (
                                        <div className="text-danger fw-bold small">
                                            Belum dibayar: {formatCurrency(unpaidTotal)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal 3D */}
            {showDeleteModal && itemToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div 
                        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1051 }} 
                        onClick={closeDeleteModal}
                    ></div>

                    <div style={{ position: 'relative', zIndex: 1052, width: '100%', maxWidth: '480px' }}>
                        <div className="custom-order-modal-content">
                            <div className="custom-order-modal-header d-flex justify-content-between align-items-center" style={{ background: '#ef4444', color: '#ffffff', borderBottom: '2.5px solid #000', padding: '1rem 1.5rem' }}>
                                <h5 className="modal-title mb-0 fw-black d-flex align-items-center gap-2 text-white fs-5">
                                    <IconAlertTriangle size={22} /> Konfirmasi Hapus Sampel
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeDeleteModal}
                                    disabled={deletingId === itemToDelete.id}
                                    style={{ cursor: 'pointer' }}
                                ></button>
                            </div>
                            <div className="custom-order-modal-body p-4 text-center">
                                <div className="p-3 text-danger d-inline-block rounded-circle mb-3 border border-2 border-dark" style={{ boxShadow: '3px 3px 0px #000', background: '#fee2e2' }}>
                                    <IconTrash size={36} />
                                </div>
                                <h4 className="fw-black text-dark mb-2">Hapus Sampel dari Keranjang?</h4>
                                <p className="text-muted small mb-3">
                                    Apakah Anda yakin ingin menghapus sampel <strong>"{itemToDelete.sampel?.parameter || itemToDelete.sampel?.name}"</strong>?
                                </p>
                                <div className="p-3 bg-light text-start" style={{ border: '2px solid #000', boxShadow: '3px 3px 0px #000', borderRadius: '14px' }}>
                                    <div className="fw-black text-dark mb-2 small">DETAIL ITEM:</div>
                                    <div className="text-secondary small d-flex flex-column gap-1">
                                        <div>• <strong>Kategori:</strong> {itemToDelete.sampel?.category?.name}</div>
                                        <div>• <strong>Parameter:</strong> {itemToDelete.sampel?.parameter}</div>
                                        <div>• <strong>Jumlah (Qty):</strong> {itemToDelete.qty}</div>
                                        <div>• <strong>Subtotal:</strong> <span className="fw-black text-primary">{formatCurrency((itemToDelete.price || 0) * itemToDelete.qty)}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="custom-order-modal-footer p-3 bg-light" style={{ borderTop: '2.5px solid #000' }}>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <button 
                                            type="button"
                                            className="btn btn-3d-secondary w-100 py-2.5" 
                                            style={{ border: '2.5px solid #000', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }}
                                            onClick={closeDeleteModal} 
                                            disabled={deletingId === itemToDelete.id}
                                        >
                                            <IconX size={18} /> Batal
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button 
                                            type="button"
                                            className="btn btn-3d-danger w-100 py-2.5 text-white" 
                                            style={{ border: '2.5px solid #000', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }}
                                            onClick={handleDelete} 
                                            disabled={deletingId === itemToDelete.id}
                                        >
                                            {deletingId === itemToDelete.id ? (
                                                "Menghapus..."
                                            ) : (
                                                <><IconTrash size={18} /> Ya, Hapus!</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Confirmation Modal Per Kategori 3D */}
            {showPaymentModal && categoryToPay && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div 
                        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1051 }} 
                        onClick={closePaymentModal}
                    ></div>

                    <div style={{ position: 'relative', zIndex: 1052, width: '100%', maxWidth: '1000px' }}>
                        <div className="custom-order-modal-content">
                            <div className="custom-order-modal-header d-flex justify-content-between align-items-center" style={{ background: '#0f172a', color: '#ffffff', borderBottom: '2.5px solid #000', padding: '1rem 1.5rem' }}>
                                <h5 className="modal-title mb-0 fw-black d-flex align-items-center gap-2 text-white fs-5">
                                    <IconCreditCard size={22} /> Pembayaran — {categoryToPay}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closePaymentModal}
                                    disabled={isProcessingPayment}
                                    style={{ cursor: 'pointer' }}
                                ></button>
                            </div>
                            <div className="custom-order-modal-body p-4">
                                <div className="row g-4">
                                    <div className="col-md-7">
                                        <div className="card-3d p-3">
                                            <h5 className="fw-black text-dark mb-3">Rincian Sampel Kategori</h5>
                                            <div className="table-responsive">
                                                <table className="table align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th>No</th>
                                                            <th>Parameter</th>
                                                            <th className="text-center">Qty</th>
                                                            <th className="text-end">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {groupedData[categoryToPay].items
                                                            .filter(item => !item.status)
                                                            .map((item, index) => (
                                                                <tr key={item.id}>
                                                                    <td>{index + 1}</td>
                                                                    <td className="fw-bold">{item.sampel?.parameter}</td>
                                                                    <td className="text-center">{item.qty}</td>
                                                                    <td className="text-end fw-black text-primary">{formatCurrency((item.price || 0) * item.qty)}</td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-5">
                                        <div className="card-3d p-3">
                                            <h5 className="fw-black text-dark mb-3">Informasi Pembayaran</h5>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold text-dark mb-1">Total Tagihan</label>
                                                <div className="form-control input-3d bg-light fw-black text-primary fs-5">
                                                    {formatCurrency(groupedData[categoryToPay].unpaidTotal)}
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold text-dark mb-1">Uang Tunai (Cash)</label>
                                                <input
                                                    type="number"
                                                    className="form-control input-3d"
                                                    value={paymentData.cash}
                                                    onChange={(e) => handlePaymentDataChange('cash', e.target.value)}
                                                    disabled={isProcessingPayment}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold text-dark mb-1">Kembalian</label>
                                                <div className="form-control input-3d fw-black text-success fs-5">
                                                    {formatCurrency(calculateChange())}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="custom-order-modal-footer p-3 bg-light d-flex justify-content-between" style={{ borderTop: '2.5px solid #000' }}>
                                <button type="button" className="btn btn-3d-secondary py-2 px-4" onClick={closePaymentModal} disabled={isProcessingPayment} style={{ cursor: 'pointer', fontWeight: 800 }}>
                                    Batal
                                </button>
                                <button type="button" className="btn btn-3d-green py-2 px-4" onClick={handlePayment} disabled={isProcessingPayment} style={{ cursor: 'pointer', fontWeight: 800 }}>
                                    {isProcessingPayment ? "Memproses..." : <><IconPrinter size={18} /> Bayar & Cetak Struk</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Payment Confirmation Modal */}
            <PaymentAllModal
                showAllPaymentModal={showAllPaymentModal}
                closeAllPaymentModal={closeAllPaymentModal}
                isProcessingPayment={isProcessingPayment}
                userData={userData}
                groupedData={groupedData}
                unpaidTotal={unpaidTotal}
                paymentData={paymentData}
                handlePaymentDataChange={handlePaymentDataChange}
                calculateChange={calculateChange}
                handleAllPayment={handleAllPayment}
                formatCurrency={formatCurrency}
            />
        </LayoutAdmin>
    );
}