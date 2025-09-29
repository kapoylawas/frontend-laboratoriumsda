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
    FiArrowRight
} from "react-icons/fi";

export default function Cart() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

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

    // Fungsi untuk handle pembayaran
    const handlePayment = async (categoryName) => {
        const token = Cookies.get("token");
        try {
            // Ambil semua item dalam kategori yang statusnya false
            const unpaidItems = groupedData[categoryName].items.filter(item => !item.status);

            // Lakukan pembayaran untuk semua item dalam kategori
            for (const item of unpaidItems) {
                await Api.patch(`/api/carts/${item.id}`, { status: true });
            }

            // Refresh data
            fetchData();
            alert(`Pembayaran untuk kategori ${categoryName} berhasil!`);
        } catch (error) {
            console.error("There was an error processing payment!", error);
            alert("Gagal memproses pembayaran. Silakan coba lagi.");
        }
    };

    // Warna gradient untuk kategori
    const getCategoryColor = (categoryName) => {
        const colors = [
            'from-pink-500 to-pink-600',
            'from-blue-500 to-blue-600',
            'from-emerald-500 to-emerald-600',
            'from-violet-500 to-violet-600',
            'from-amber-500 to-amber-600',
            'from-rose-500 to-rose-600',
            'from-cyan-500 to-cyan-600',
            'from-indigo-500 to-indigo-600'
        ];
        const index = categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    // Warna background untuk kategori
    const getCategoryBgColor = (categoryName) => {
        const colors = [
            'bg-pink-50 border-pink-200',
            'bg-blue-50 border-blue-200',
            'bg-emerald-50 border-emerald-200',
            'bg-violet-50 border-violet-200',
            'bg-amber-50 border-amber-200',
            'bg-rose-50 border-rose-200',
            'bg-cyan-50 border-cyan-200',
            'bg-indigo-50 border-indigo-200'
        ];
        const index = categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    // Warna untuk avatar/nomor sampel
    const getAvatarColor = (index, categoryName) => {
        const colors = [
            'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
            'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
            'bg-gradient-to-r from-green-500 to-green-600 text-white',
            'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
            'bg-gradient-to-r from-red-500 to-red-600 text-white',
            'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
            'bg-gradient-to-r from-pink-500 to-pink-600 text-white',
            'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
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
                                    {Object.entries(groupedData).map(([categoryName, categoryData]) => {
                                        const isCategoryPaid = !categoryData.hasUnpaidItems;
                                        const unpaidCount = categoryData.unpaidCount;
                                        const unpaidTotal = categoryData.unpaidTotal;

                                        return (
                                            <div key={categoryName} className={`category-section ${categoryData.bgColor} border-0 ${isCategoryPaid ? 'paid-category' : 'unpaid-category'}`}>
                                                {isCategoryPaid && (
                                                    <div className="watermark">
                                                        <FiCheckCircle className="me-2" />
                                                        SUDAH LUNAS
                                                    </div>
                                                )}
                                                <div
                                                    className="category-header p-4 cursor-pointer hover:bg-opacity-75 transition-colors position-relative"
                                                    onClick={() => toggleCategory(categoryName)}
                                                >
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <div className={`category-badge bg-gradient-to-r ${categoryData.color} text-white rounded-pill px-3 py-1 me-3`}>
                                                                <span className="fw-bold">
                                                                    <FiBarChart2 className="me-1" />
                                                                    {categoryData.itemCount} Sampel
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
                                                                        handlePayment(categoryName);
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
                                                                <div key={item.id} className="col-md-6 col-lg-4 mb-3">
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && itemToDelete && (
                <>
                    <div
                        className="modal-backdrop fade show"
                        onClick={closeDeleteModal}
                        style={{ zIndex: 1040 }}
                    ></div>

                    <div
                        className="modal fade show"
                        style={{ display: 'block', zIndex: 1050 }}
                        tabIndex="-1"
                    >
                        <div className="modal-dialog modal-sm modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-status bg-danger"></div>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <FiAlertTriangle className="me-2 text-danger" />
                                        Konfirmasi Hapus
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={closeDeleteModal}
                                        aria-label="Close"
                                        disabled={deletingId === itemToDelete.id}
                                    ></button>
                                </div>
                                <div className="modal-body text-center py-4">
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
                                <div className="modal-footer">
                                    <div className="w-100">
                                        <div className="row g-2">
                                            <div className="col">
                                                <button
                                                    className="btn btn-outline-secondary w-100"
                                                    onClick={closeDeleteModal}
                                                    disabled={deletingId === itemToDelete.id}
                                                    type="button"
                                                >
                                                    <FiX className="me-1" />
                                                    Batal
                                                </button>
                                            </div>
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

            <style jsx>{`
                .category-badge {
                    font-size: 0.75rem;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .hover-shadow:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                    transition: box-shadow 0.15s ease-in-out;
                }
                .rotate-180 {
                    transform: rotate(180deg);
                }
                .category-section {
                    border-left: 4px solid;
                    border-left-color: inherit;
                    position: relative;
                    overflow: hidden;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                }
                .paid-category {
                    position: relative;
                    opacity: 0.8;
                }
                .unpaid-category {
                    border-left-color: #f59e0b;
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                }
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: rgba(0, 128, 0, 0.1);
                    z-index: 1;
                    pointer-events: none;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                }
                .avatar {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                    font-weight: 600;
                }
                .avatar-sm {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.75rem;
                }
                .bg-pink-lt { background-color: #fdf2f8; color: #be185d; }
                .bg-blue-lt { background-color: #eff6ff; color: #1d4ed8; }
                .bg-green-lt { background-color: #f0fdf4; color: #15803d; }
                .bg-orange-lt { background-color: #fff7ed; color: #c2410c; }
                .bg-red-lt { background-color: #fef2f2; color: #dc2626; }
                .bg-yellow-lt { background-color: #fefce8; color: #ca8a04; }
                .bg-warning-lt { background-color: #fffbeb; color: #d97706; border: 1px solid #fed7aa; }
                .bg-success-lt { background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

                /* Gradient colors untuk avatar */
                .bg-gradient-to-r.from-purple-500.to-purple-600 { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
                .bg-gradient-to-r.from-blue-500.to-blue-600 { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .bg-gradient-to-r.from-green-500.to-green-600 { background: linear-gradient(135deg, #10b981, #059669); }
                .bg-gradient-to-r.from-yellow-500.to-yellow-600 { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .bg-gradient-to-r.from-red-500.to-red-600 { background: linear-gradient(135deg, #ef4444, #dc2626); }
                .bg-gradient-to-r.from-indigo-500.to-indigo-600 { background: linear-gradient(135deg, #6366f1, #4f46e5); }
                .bg-gradient-to-r.from-pink-500.to-pink-600 { background: linear-gradient(135deg, #ec4899, #db2777); }
                .bg-gradient-to-r.from-teal-500.to-teal-600 { background: linear-gradient(135deg, #14b8a6, #0d9488); }

                .category-section {
                    transition: all 0.3s ease;
                }

                .category-header {
                    transition: background-color 0.2s ease;
                    position: relative;
                    z-index: 2;
                    border-radius: 0.5rem 0.5rem 0 0;
                }

                .category-header:hover {
                    background-color: rgba(0, 0, 0, 0.03);
                }

                .category-content {
                    position: relative;
                    z-index: 2;
                }

                .card-sm {
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .card-sm:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .unpaid-item {
                    border: 2px solid #fbbf24;
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%);
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
                }

                .unpaid-item:hover {
                    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
                    border-color: #f59e0b;
                }

                .paid-item {
                    border: 1px solid #10b981;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%);
                }

                .card-status {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                }

                .bg-gradient-to-r {
                    background-image: linear-gradient(to right, var(--tw-gradient-stops));
                }

                .empty {
                    padding: 3rem 1rem;
                    text-align: center;
                }

                .empty-img {
                    margin-bottom: 1rem;
                }

                .empty-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .empty-subtitle {
                    font-size: 0.875rem;
                }

                /* Modal Styles */
                .modal {
                    background-color: rgba(0, 0, 0, 0.5);
                }

                .modal.show {
                    display: block;
                }

                .modal-status {
                    height: 4px;
                    border-radius: 4px 4px 0 0;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Summary card improvements */
                .card-sm .avatar {
                    width: 3rem;
                    height: 3rem;
                }

                .card-sm .icon {
                    width: 1.5rem;
                    height: 1.5rem;
                }

                /* Alert improvements */
                .alert {
                    border: 1px solid;
                    border-left: 4px solid;
                }

                .alert-warning {
                    border-color: #fed7aa;
                    border-left-color: #f59e0b;
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .category-header .d-flex {
                        flex-direction: column;
                        align-items: flex-start !important;
                    }
                    
                    .category-header .d-flex > div {
                        width: 100%;
                        justify-content: space-between;
                        margin-bottom: 0.5rem;
                    }
                    
                    .card-sm .d-flex {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .card-sm .d-flex > div {
                        margin-bottom: 0.5rem;
                    }

                    .card-sm .btn {
                        margin-top: 0.5rem;
                    }

                    .modal-dialog {
                        margin: 1rem;
                    }

                    .watermark {
                        font-size: 1.5rem;
                    }

                    .summary-cards .col-sm-6 {
                        margin-bottom: 1rem;
                    }
                }

                /* Fix untuk modal backdrop */
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: #000;
                    opacity: 0.5;
                }

                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-dialog {
                    margin: 0 auto;
                }

                /* Improved typography */
                .font-weight-medium {
                    font-weight: 500;
                }

                /* Enhanced card shadows */
                .card {
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }

                .card-sm {
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }

                /* Pulsing animation for unpaid items */
                @keyframes pulse-warning {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 6px rgba(245, 158, 11, 0);
                    }
                }

                .unpaid-item {
                    animation: pulse-warning 2s infinite;
                }
            `}</style>
        </LayoutAdmin>
    );
}