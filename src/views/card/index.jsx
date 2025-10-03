import { useState, useEffect } from "react";
import LayoutAdmin from "../../layouts/admin";
import Cookies from "js-cookie";
import Api from "../../services/api";
import {
    FiShoppingCart,
    FiPackage,
    FiDollarSign,
    FiAlertCircle,
    FiChevronDown,
    FiCreditCard,
    FiTrash2,
    FiCheckCircle,
    FiX,
    FiLoader,
    FiArchive,
    FiLayers,
    FiBarChart2,
    FiCalendar,
    FiAlertTriangle,
    FiClock,
    FiArrowRight,
    FiPrinter,
    FiEdit,
    FiUser
} from "react-icons/fi";
import "./cart.css"

export default function Cart() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [categoryToPay, setCategoryToPay] = useState(null);
    const [paymentData, setPaymentData] = useState({
        cash: 0,
        discount: 0,
        grand_total: 0
    });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [userData, setUserData] = useState(null);

    const userCookie = Cookies.get("user");
    const parsedData = JSON.parse(userCookie);
    const iduser = parsedData.id;

    const fetchData = async () => {
        setIsLoading(true);
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const response = await Api.get(`/api/sampels-by-user/${iduser}`);
                setData(response.data.data);

                // Simpan data user untuk print
                setUserData(parsedData);

                // Set semua kategori sebagai expanded secara default
                const categories = [...new Set(response.data.data.map(item => item.sampel.category.name))];
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

    // Fungsi untuk membuka modal konfirmasi hapus
    const openDeleteModal = (item) => {
        // Hanya izinkan hapus jika status false
        if (!item.status) {
            setItemToDelete(item);
            setShowDeleteModal(true);
        }
    };

    // Fungsi untuk menutup modal
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    // Fungsi untuk menghapus sampel
    const handleDelete = async () => {
        if (!itemToDelete) return;

        setDeletingId(itemToDelete.id);
        const token = Cookies.get("token");

        try {
            Api.defaults.headers.common["Authorization"] = token;
            await Api.delete(`/api/carts/${itemToDelete.id}`);

            // Update data setelah penghapusan
            setData(prevData => prevData.filter(item => item.id !== itemToDelete.id));

            // Tutup modal setelah berhasil menghapus
            closeDeleteModal();
        } catch (error) {
            console.error("There was an error deleting the sample!", error);
            alert("Gagal menghapus sampel. Silakan coba lagi.");
        } finally {
            setDeletingId(null);
        }
    };

    // Fungsi untuk mengelompokkan data berdasarkan kategori
    const groupByCategory = (data) => {
        return data.reduce((acc, item) => {
            const categoryName = item.sampel.category.name;
            const categoryColor = item.sampel.category.color || getCategoryColor(categoryName);

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
            acc[categoryName].total += item.price * item.qty;
            acc[categoryName].itemCount += item.qty;

            // Cek jika ada item yang belum dibayar dalam kategori ini
            if (!item.status) {
                acc[categoryName].hasUnpaidItems = true;
                acc[categoryName].unpaidCount += 1;
                acc[categoryName].unpaidTotal += item.price * item.qty;
            }

            return acc;
        }, {});
    };

    // Fungsi untuk membuka modal pembayaran
    const openPaymentModal = (categoryName) => {
        const categoryData = groupedData[categoryName];
        if (!categoryData || !categoryData.hasUnpaidItems) return;

        setCategoryToPay(categoryName);
        setPaymentData({
            cash: categoryData.unpaidTotal,
            discount: 0,
            grand_total: categoryData.unpaidTotal
        });
        setShowPaymentModal(true);
    };

    // Fungsi untuk menutup modal pembayaran
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

    // Fungsi untuk menghitung kembalian
    const calculateChange = () => {
        const change = paymentData.cash - paymentData.grand_total;
        return change > 0 ? change : 0;
    };

    // Fungsi untuk update data pembayaran
    const handlePaymentDataChange = (field, value) => {
        setPaymentData(prev => {
            const newData = { ...prev, [field]: parseFloat(value) || 0 };

            // Otomatis hitung grand_total jika discount berubah
            if (field === 'discount') {
                const categoryData = groupedData[categoryToPay];
                const originalTotal = categoryData ? categoryData.unpaidTotal : 0;
                newData.grand_total = Math.max(0, originalTotal - newData.discount);
            }

            return newData;
        });
    };

    // Fungsi untuk handle pembayaran
    const handlePayment = async () => {
        if (!categoryToPay) return;

        setIsProcessingPayment(true);
        const token = Cookies.get("token");

        try {
            // Ambil semua item dalam kategori yang statusnya false
            const unpaidItems = groupedData[categoryToPay].items.filter(item => !item.status);
            const cartIds = unpaidItems.map(item => item.id);

            // Data untuk transaction
            const transactionData = {
                cash: paymentData.cash,
                grand_total: paymentData.grand_total,
                discount: paymentData.discount,
                user_id: iduser,
                cart_ids: cartIds,
                change: calculateChange(),
                category_name: categoryToPay
            };

            // Insert transaction ke API
            Api.defaults.headers.common["Authorization"] = token;
            const transactionResponse = await Api.post('/api/transactions', transactionData);

            // Update status semua item yang dibayar
            for (const item of unpaidItems) {
                await Api.patch(`/api/carts/${item.id}`, { status: true });
            }

            // Refresh data
            await fetchData();

            // Tutup modal dan buka print
            closePaymentModal();

            // Cetak PDF dengan data dari sampels-by-user
            printReceipt(transactionResponse.data.data, unpaidItems, categoryToPay);

            alert(`Pembayaran untuk kategori ${categoryToPay} berhasil!`);
        } catch (error) {
            console.error("There was an error processing payment!", error);
            alert("Gagal memproses pembayaran. Silakan coba lagi.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Fungsi untuk mencetak PDF
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
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body { 
                        font-family: 'Courier Prime', monospace; 
                        margin: 0; 
                        padding: 20px; 
                        font-size: 14px;
                        line-height: 1.4;
                        background: white;
                        color: black;
                    }
                    
                    .receipt {
                        max-width: 300px;
                        margin: 0 auto;
                    }
                    
                    .header { 
                        text-align: center; 
                        margin-bottom: 15px; 
                        padding-bottom: 10px;
                        border-bottom: 2px dashed #000;
                    }
                    
                    .company-name {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        text-transform: uppercase;
                    }
                    
                    .company-address {
                        font-size: 12px;
                        margin-bottom: 5px;
                    }
                    
                    .receipt-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 10px 0;
                        text-transform: uppercase;
                    }
                    
                    .transaction-info {
                        margin: 10px 0;
                        padding: 10px 0;
                        border-bottom: 1px dashed #000;
                    }
                    
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                    }
                    
                    .info-label {
                        font-weight: bold;
                    }
                    
                    .customer-info {
                        margin: 10px 0;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 5px;
                    }
                    
                    .items-table {
                        width: 100%;
                        margin: 15px 0;
                        border-collapse: collapse;
                    }
                    
                    .items-table th {
                        text-align: left;
                        padding: 5px 0;
                        border-bottom: 1px dashed #000;
                        font-weight: bold;
                    }
                    
                    .items-table td {
                        padding: 4px 0;
                        border-bottom: 1px dotted #ccc;
                    }
                    
                    .items-table .item-name {
                        width: 60%;
                    }
                    
                    .items-table .item-qty {
                        width: 15%;
                        text-align: center;
                    }
                    
                    .items-table .item-price {
                        width: 25%;
                        text-align: right;
                    }
                    
                    .total-section {
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 2px dashed #000;
                    }
                    
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    
                    .grand-total {
                        font-weight: bold;
                        font-size: 16px;
                        margin: 10px 0;
                        padding: 10px 0;
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                    }
                    
                    .payment-info {
                        margin: 15px 0;
                        padding: 10px;
                        background: #f0f0f0;
                        border-radius: 5px;
                    }
                    
                    .footer { 
                        margin-top: 20px; 
                        text-align: center; 
                        font-size: 11px;
                        padding-top: 10px;
                        border-top: 1px dashed #000;
                    }
                    
                    .barcode {
                        text-align: center;
                        margin: 15px 0;
                    }
                    
                    .thank-you {
                        text-align: center;
                        font-weight: bold;
                        margin: 15px 0;
                        font-style: italic;
                    }
                    
                    @media print {
                        body {
                            padding: 10px;
                        }
                        
                        .receipt {
                            max-width: 100%;
                        }
                    }
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
                        <div class="info-row">
                            <span class="info-label">No. Transaksi:</span>
                            <span>${transaction.id || 'TRX-' + Date.now()}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Tanggal:</span>
                            <span>${currentDate.toLocaleDateString('id-ID')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Waktu:</span>
                            <span>${currentDate.toLocaleTimeString('id-ID')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Kategori:</span>
                            <span>${categoryName}</span>
                        </div>
                    </div>
                    
                    <div class="customer-info">
                        <div class="info-row">
                            <span class="info-label">Pelanggan:</span>
                            <span>${userData?.name || 'Guest'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ID User:</span>
                            <span>${userData?.id || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="item-name">Item</th>
                                <th class="item-qty">Qty</th>
                                <th class="item-price">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td class="item-name">${item.sampel.name}</td>
                                    <td class="item-qty">${item.qty}</td>
                                    <td class="item-price">${formatCurrency(item.price * item.qty)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="total-section">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(transaction.grand_total + transaction.discount)}</span>
                        </div>
                        ${transaction.discount > 0 ? `
                        <div class="total-row">
                            <span>Diskon:</span>
                            <span>-${formatCurrency(transaction.discount)}</span>
                        </div>
                        ` : ''}
                        <div class="grand-total total-row">
                            <span>TOTAL:</span>
                            <span>${formatCurrency(transaction.grand_total)}</span>
                        </div>
                    </div>
                    
                    <div class="payment-info">
                        <div class="total-row">
                            <span>Cash:</span>
                            <span>${formatCurrency(transaction.cash)}</span>
                        </div>
                        <div class="total-row">
                            <span>Kembali:</span>
                            <span>${formatCurrency(transaction.change)}</span>
                        </div>
                    </div>
                    
                    <div class="thank-you">
                        Terima kasih atas kepercayaan Anda
                    </div>
                    
                    <div class="footer">
                        <div>*** Struk ini sebagai bukti pembayaran ***</div>
                        <div>Simpan struk ini untuk keperluan klaim</div>
                        <div>www.laboratorium-analis.com</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(receiptContent);
        printWindow.document.close();
    };

    // Utility function untuk menentukan warna badge yang profesional
    const getBadgeColor = (categoryName, index) => {
        const colorSchemes = [
            'professional-blue',      // Biru profesional
            'professional-teal',      // Teal elegan
            'professional-indigo',    // Indigo modern
            'professional-slate',     // Slate netral
            'professional-emerald',   // Emerald segar
            'professional-violet'     // Violet kreatif
        ];

        // Untuk "PAKET PEMERIKSAAN AIR BERSIH" gunakan warna khusus
        if (categoryName.includes('PAKET PEMERIKSAAN AIR BERSIH')) {
            return 'professional-blue';
        }

        const colorIndex = index % colorSchemes.length;
        return colorSchemes[colorIndex];
    };

    // Warna gradient untuk kategori
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

    // Warna background untuk kategori
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

    // Warna untuk avatar/nomor sampel
    const getAvatarColor = (index, categoryName) => {
        const colors = [
            'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
            'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
            'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
            'bg-gradient-to-r from-violet-500 to-violet-600 text-white',
            'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
            'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
        ];
        const colorIndex = (index % colors.length);
        return colors[colorIndex];
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Toggle expand/collapse category
    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const groupedData = groupByCategory(data);
    const grandTotal = Object.values(groupedData).reduce((total, category) => total + category.total, 0);
    const totalItems = data.length;
    const totalCategories = Object.keys(groupedData).length;
    const totalSamples = Object.values(groupedData).reduce((sum, category) => sum + category.itemCount, 0);

    // Hitung total yang belum dibayar
    const unpaidTotal = Object.values(groupedData).reduce((total, category) => {
        return total + category.unpaidTotal;
    }, 0);

    // Cek apakah ada item yang belum dibayar
    const hasUnpaidItems = Object.values(groupedData).some(category => category.hasUnpaidItems);

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="page-header">
                    <div className="container-xl">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <div className="page-pretitle text-muted">History Pemesanan</div>
                                <h2 className="page-title">Sampel Yang Dipesan</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="page-body">
                    <div className="container-xl">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <div className="mt-3 text-muted">Memuat data sampel...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    return (
        <LayoutAdmin>
            <div className="page-header">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle text-muted">
                                <FiShoppingCart className="me-2" />
                                History Pemesanan
                            </div>
                            <h2 className="page-title">Sampel Yang Dipesan</h2>
                        </div>
                        <div className="col-auto">
                            <div className="btn-list">
                                <span className="badge bg-blue-lt">
                                    <FiLayers className="me-1" />
                                    Total Kategori: {totalCategories}
                                </span>
                                <span className="badge bg-green-lt">
                                    <FiPackage className="me-1" />
                                    Total Sampel: {totalSamples}
                                </span>
                                {hasUnpaidItems && (
                                    <span className="badge bg-orange-lt">
                                        <FiAlertTriangle className="me-1" />
                                        Belum Bayar: {formatCurrency(unpaidTotal)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="container-xl">
                    {/* Summary Cards */}
                    <div className="row row-deck row-cards mb-4">
                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <div className="bg-primary text-white avatar">
                                                <FiLayers className="icon" />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Total Kategori</div>
                                            <div className="text-muted">
                                                <h2 className="mt-2 mb-0">{totalCategories}</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <div className="bg-success text-white avatar">
                                                <FiPackage className="icon" />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Total Sampel</div>
                                            <div className="text-muted">
                                                <h2 className="mt-2 mb-0">{totalSamples}</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <div className="bg-info text-white avatar">
                                                <FiDollarSign className="icon" />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Total Biaya</div>
                                            <div className="text-muted">
                                                <h2 className="mt-2 mb-0" style={{ fontSize: '1.25rem' }}>
                                                    {formatCurrency(grandTotal)}
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                            <div className="card card-sm">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <div className={`${unpaidTotal > 0 ? 'bg-warning' : 'bg-success'} text-white avatar`}>
                                                <FiAlertTriangle className="icon" />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Belum Dibayar</div>
                                            <div className="text-muted">
                                                <h2 className={`mt-2 mb-0 ${unpaidTotal > 0 ? 'text-warning' : 'text-success'}`} style={{ fontSize: '1.25rem' }}>
                                                    {formatCurrency(unpaidTotal)}
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Peringatan Item Belum Lunas */}
                    {hasUnpaidItems && (
                        <div className="alert alert-warning mb-4">
                            <div className="d-flex align-items-center">
                                <FiAlertTriangle className="me-3" size={24} />
                                <div className="flex-fill">
                                    <h5 className="alert-title">Pembayaran Tertunda</h5>
                                    <div className="text-muted">
                                        Anda memiliki <strong>{Object.values(groupedData).reduce((sum, cat) => sum + cat.unpaidCount, 0)} sampel</strong>
                                        yang belum dibayar dengan total <strong>{formatCurrency(unpaidTotal)}</strong>.
                                        Silakan lakukan pembayaran untuk melanjutkan proses.
                                    </div>
                                </div>
                                <FiArrowRight className="ms-3" />
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                <FiShoppingCart className="me-2" />
                                Detail Pemesanan
                            </h3>
                            {hasUnpaidItems && (
                                <div className="card-actions">
                                    <span className="badge bg-warning">
                                        <FiClock className="me-1" />
                                        {Object.values(groupedData).reduce((sum, cat) => sum + cat.unpaidCount, 0)} Menunggu Pembayaran
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="card-body p-0">
                            {Object.keys(groupedData).length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="empty">
                                        <div className="empty-img">
                                            <FiArchive size={64} className="text-muted mb-3" />
                                        </div>
                                        <p className="empty-title">Tidak ada sampel/parameter yang dipesan</p>
                                        <p className="empty-subtitle text-muted">
                                            Belum ada sampel/parameter yang ditambahkan ke dalam keranjang pemesanan.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {Object.entries(groupedData).map(([categoryName, categoryData], categoryIndex) => {
                                        const isCategoryPaid = !categoryData.hasUnpaidItems;
                                        const unpaidCount = categoryData.unpaidCount;
                                        const unpaidTotal = categoryData.unpaidTotal;
                                        const isExpanded = expandedCategories[categoryName];

                                        return (
                                            <div
                                                key={categoryName}
                                                className={`category-section ${categoryData.bgColor} border-0 ${isCategoryPaid ? 'paid-category' : 'unpaid-category'} ${isExpanded ? 'expanded' : ''}`}
                                            >
                                                {isCategoryPaid && (
                                                    <div className="watermark">
                                                        <FiCheckCircle className="me-2" />
                                                        LUNAS
                                                    </div>
                                                )}
                                                <div
                                                    className="category-header p-4 cursor-pointer hover:bg-opacity-75 transition-colors position-relative"
                                                    onClick={() => toggleCategory(categoryName)}
                                                >
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <div className={`category-badge ${getBadgeColor(categoryName, categoryIndex)} rounded-pill px-3 py-2 me-3`}>
                                                                <span className="fw-bold d-flex align-items-center">
                                                                    <FiBarChart2 className="me-1" />
                                                                    <span className="sampel-count">{categoryData.itemCount}</span>
                                                                    <span className="badge-text ms-1">Sampel</span>
                                                                </span>
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <h4 className="mb-0 text-dark me-3">{categoryName}</h4>
                                                                {!isCategoryPaid && (
                                                                    <span className="badge bg-warning">
                                                                        <FiAlertTriangle className="me-1" />
                                                                        {unpaidCount} Belum Bayar
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <div className="text-end me-3">
                                                                <div className={`fw-bold ${isCategoryPaid ? 'text-success' : 'text-warning'}`}>
                                                                    {formatCurrency(categoryData.total)}
                                                                </div>
                                                                {!isCategoryPaid && (
                                                                    <small className="text-danger fw-bold">
                                                                        {formatCurrency(unpaidTotal)} Belum Lunas
                                                                    </small>
                                                                )}
                                                            </div>
                                                            {!isCategoryPaid && (
                                                                <button
                                                                    className="btn btn-success btn-sm me-2"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPaymentModal(categoryName);
                                                                    }}
                                                                >
                                                                    <FiCreditCard className="me-1" />
                                                                    Bayar Sekarang
                                                                </button>
                                                            )}
                                                            <FiChevronDown
                                                                className={`transition-transform ${expandedCategories[categoryName] ? 'rotate-180' : ''
                                                                    }`}
                                                                size={20}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {expandedCategories[categoryName] && (
                                                    <div className="category-content px-4 pb-4 position-relative">
                                                        <div className="row">
                                                            {categoryData.items.map((item, index) => (
                                                                <div key={item.id} className="col-md-6 col-lg-4 mb-3 mt-3"> {/* Tambahkan mt-3 di sini */}
                                                                    <div className={`card card-sm hover-shadow ${item.status ? 'border-success paid-item' : 'border-warning unpaid-item'}`}>
                                                                        <div className="card-status ${item.status ? 'bg-success' : 'bg-warning'}"></div>
                                                                        <div className="card-body">
                                                                            <div className="d-flex align-items-start mb-3">
                                                                                <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3 ${getAvatarColor(index, categoryName)}`}>
                                                                                    <span className="fw-bold" style={{ fontSize: '0.75rem' }}>
                                                                                        {index + 1}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex-fill">
                                                                                    <h6 className="fw-bold text-dark mb-1">{item.sampel.name}</h6>
                                                                                    <div className="d-flex align-items-center mb-2">
                                                                                        <span className={`badge ${item.status ? 'bg-success-lt' : 'bg-warning-lt'} text-${item.status ? 'success' : 'warning'} me-2`}>
                                                                                            {item.status ? (
                                                                                                <>
                                                                                                    <FiCheckCircle className="me-1" size={12} />
                                                                                                    LUNAS
                                                                                                </>
                                                                                            ) : (
                                                                                                <>
                                                                                                    <FiClock className="me-1" size={12} />
                                                                                                    BELUM BAYAR
                                                                                                </>
                                                                                            )}
                                                                                        </span>
                                                                                        <div className={`fw-bold ${item.status ? 'text-success' : 'text-warning'}`}>
                                                                                            {formatCurrency(item.price * item.qty)}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-muted small">
                                                                                        <FiPackage className="me-1" />
                                                                                        Qty: {item.qty} × {formatCurrency(item.price)}
                                                                                    </div>
                                                                                    <div className="text-muted small">
                                                                                        <FiCalendar className="me-1" />
                                                                                        {formatDate(item.created_at)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {!item.status && (
                                                                                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                                                                                    <button
                                                                                        className="btn btn-outline-danger btn-sm"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            openDeleteModal(item);
                                                                                        }}
                                                                                        disabled={deletingId === item.id}
                                                                                        title="Hapus sampel"
                                                                                    >
                                                                                        {deletingId === item.id ? (
                                                                                            <FiLoader className="spinner" />
                                                                                        ) : (
                                                                                            <>
                                                                                                <FiTrash2 className="me-1" />
                                                                                                Hapus
                                                                                            </>
                                                                                        )}
                                                                                    </button>
                                                                                    <small className="text-danger fw-bold">
                                                                                        Butuh Pembayaran
                                                                                    </small>
                                                                                </div>
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
                        </div>

                        {Object.keys(groupedData).length > 0 && (
                            <div className="card-footer bg-light">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h5 className="mb-1">
                                            <FiDollarSign className="me-2" />
                                            Total Keseluruhan
                                        </h5>
                                        <p className="text-muted mb-0">
                                            <FiPackage className="me-1" />
                                            {totalSamples} sampel dalam {totalCategories} kategori
                                        </p>
                                        {unpaidTotal > 0 && (
                                            <p className="text-warning mb-0">
                                                <FiAlertTriangle className="me-1" />
                                                <strong>Belum dibayar: {formatCurrency(unpaidTotal)}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-end">
                                        <h3 className="text-primary mb-0">{formatCurrency(grandTotal)}</h3>
                                        <small className="text-muted">Termasuk semua biaya</small>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal dengan Custom CSS */}
            {showDeleteModal && itemToDelete && (
                <>
                    <div
                        className="modal-backdrop-custom fade show"
                        onClick={closeDeleteModal}
                        style={{ zIndex: 1040 }}
                    ></div>

                    <div
                        className="modal-custom fade show"
                        style={{ display: 'block', zIndex: 1050 }}
                        tabIndex="-1"
                    >
                        <div className="modal-dialog modal-lg-custom modal-dialog-centered">
                            <div className="modal-content-custom">
                                <div className="modal-status-custom bg-danger"></div>
                                <div className="modal-header-custom">
                                    <h5 className="modal-title">
                                        <FiAlertTriangle className="me-2 text-danger" />
                                        Konfirmasi Hapus
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close-custom"
                                        onClick={closeDeleteModal}
                                        aria-label="Close"
                                        disabled={deletingId === itemToDelete.id}
                                    ></button>
                                </div>
                                <div className="modal-body-custom text-center py-4">
                                    <FiAlertTriangle size={48} className="text-danger mb-3" />
                                    <h4>Hapus Sampel?</h4>
                                    <div className="text-muted mt-2">
                                        Yakin ingin menghapus sampel <strong>"{itemToDelete.sampel.name}"</strong> dari keranjang?
                                    </div>
                                    <div className="mt-3 p-3 bg-yellow-lt rounded">
                                        <div className="text-start">
                                            <small className="text-muted">
                                                <strong>Detail Sampel:</strong><br />
                                                • Kategori: {itemToDelete.sampel.category.name}<br />
                                                • Quantity: {itemToDelete.qty}<br />
                                                • Harga: {formatCurrency(itemToDelete.price)}<br />
                                                • Total: <strong>{formatCurrency(itemToDelete.price * itemToDelete.qty)}</strong>
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer-custom">
                                    <div className="w-100">
                                        <div className="row g-2">

                                            <button
                                                className="btn btn-outline-danger-custom w-100"
                                                onClick={closeDeleteModal}
                                                disabled={deletingId === itemToDelete.id}
                                                type="button"
                                            >
                                                <FiX className="me-1" />
                                                Batal
                                            </button>
                                            <div className="col">
                                                <button
                                                    className="btn btn-danger w-100"
                                                    onClick={handleDelete}
                                                    disabled={deletingId === itemToDelete.id}
                                                    type="button"
                                                >
                                                    {deletingId === itemToDelete.id ? (
                                                        <>
                                                            <FiLoader className="spinner me-2" />
                                                            Menghapus...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiTrash2 className="me-2" />
                                                            Ya, Hapus
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Payment Confirmation Modal dengan Custom CSS */}
            {showPaymentModal && categoryToPay && (
                <>
                    <div
                        className="modal-backdrop-custom fade show"
                        onClick={closePaymentModal}
                        style={{ zIndex: 1040 }}
                    ></div>

                    <div
                        className="modal-custom fade show"
                        style={{ display: 'block', zIndex: 1050 }}
                        tabIndex="-1"
                    >
                        <div className="modal-dialog modal-xl-custom modal-dialog-centered">
                            <div className="modal-content-custom">
                                <div className="modal-status-custom bg-success"></div>
                                <div className="modal-header-custom">
                                    <h5 className="modal-title">
                                        <FiCreditCard className="me-2 text-success" />
                                        Konfirmasi Pembayaran - {categoryToPay}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close-custom"
                                        onClick={closePaymentModal}
                                        aria-label="Close"
                                        disabled={isProcessingPayment}
                                    ></button>
                                </div>
                                <div className="modal-body-custom">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="card">
                                                <div className="card-header">
                                                    <h6 className="card-title mb-0">
                                                        <FiUser className="me-2" />
                                                        Detail Pelanggan & Item
                                                    </h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row mb-4">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label fw-bold">Nama Pelanggan</label>
                                                                <div className="form-control bg-light">
                                                                    {userData?.name || 'Guest'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <h6 className="mb-3">Item yang akan dibayar:</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-bordered">
                                                            <thead className="bg-light">
                                                                <tr>
                                                                    <th>No</th>
                                                                    <th>Nama Sampel</th>
                                                                    <th className="text-center">Qty</th>
                                                                    <th className="text-end">Harga</th>
                                                                    <th className="text-end">Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {groupedData[categoryToPay].items
                                                                    .filter(item => !item.status)
                                                                    .map((item, index) => (
                                                                        <tr key={item.id}>
                                                                            <td>{index + 1}</td>
                                                                            <td>{item.sampel.name}</td>
                                                                            <td className="text-center">{item.qty}</td>
                                                                            <td className="text-end">{formatCurrency(item.price)}</td>
                                                                            <td className="text-end fw-bold">{formatCurrency(item.price * item.qty)}</td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                            <tfoot className="bg-light">
                                                                <tr>
                                                                    <td colSpan="4" className="text-end fw-bold">Total:</td>
                                                                    <td className="text-end fw-bold text-primary">
                                                                        {formatCurrency(groupedData[categoryToPay].unpaidTotal)}
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="card">
                                                <div className="card-header">
                                                    <h6 className="card-title mb-0">
                                                        <FiDollarSign className="me-2" />
                                                        Informasi Pembayaran
                                                    </h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Total Belanja</label>
                                                        <div className="form-control bg-light fw-bold text-primary">
                                                            {formatCurrency(groupedData[categoryToPay].unpaidTotal)}
                                                        </div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Diskon</label>
                                                        <div className="input-group">
                                                            <span className="input-group-text">Rp</span>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={paymentData.discount}
                                                                onChange={(e) => handlePaymentDataChange('discount', e.target.value)}
                                                                disabled={isProcessingPayment}
                                                                min="0"
                                                                max={groupedData[categoryToPay].unpaidTotal}
                                                            />
                                                        </div>
                                                        <small className="text-muted">
                                                            Maksimal diskon: {formatCurrency(groupedData[categoryToPay].unpaidTotal)}
                                                        </small>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Grand Total</label>
                                                        <div className="form-control bg-success text-white fw-bold">
                                                            {formatCurrency(paymentData.grand_total)}
                                                        </div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Cash</label>
                                                        <div className="input-group">
                                                            <span className="input-group-text">Rp</span>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={paymentData.cash}
                                                                onChange={(e) => handlePaymentDataChange('cash', e.target.value)}
                                                                disabled={isProcessingPayment}
                                                                min={paymentData.grand_total}
                                                            />
                                                        </div>
                                                        <small className="text-muted">
                                                            Minimum cash: {formatCurrency(paymentData.grand_total)}
                                                        </small>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Kembalian</label>
                                                        <div className={`form-control fw-bold ${calculateChange() > 0 ? 'bg-warning' : 'bg-light'
                                                            }`}>
                                                            {formatCurrency(calculateChange())}
                                                        </div>
                                                    </div>

                                                    {calculateChange() < 0 && (
                                                        <div className="alert alert-danger">
                                                            <FiAlertCircle className="me-2" />
                                                            Cash tidak cukup! Tambahkan cash sebesar {formatCurrency(Math.abs(calculateChange()))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer-custom">
                                    <div className="w-100">
                                        <div className="row g-2">
                                            <div className="col">
                                                <button
                                                    className="btn btn-danger w-100 text-white"
                                                    onClick={closePaymentModal}
                                                    disabled={isProcessingPayment}
                                                    type="button"
                                                >
                                                    <FiX className="me-1" />
                                                    Batal
                                                </button>
                                            </div>
                                            <div className="col">
                                                <button
                                                    className="btn btn-success w-100"
                                                    onClick={handlePayment}
                                                    disabled={isProcessingPayment || calculateChange() < 0}
                                                    type="button"
                                                >
                                                    {isProcessingPayment ? (
                                                        <>
                                                            <FiLoader className="spinner me-2" />
                                                            Memproses...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiPrinter className="me-2" />
                                                            Bayar & Cetak Struk
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </LayoutAdmin>
    );
}