import { useEffect, useState } from 'react';
import LayoutAdmin from '../../layouts/admin'
import Cookies from "js-cookie";
import Api from "../../services/api";
import {
    IconSearch,
    IconRefresh,
    IconChevronDown,
    IconChevronUp,
    IconCategory,
    IconInfoCircle,
    IconShoppingCart,
    IconCheck,
    IconPackage,
    IconPlus,
    IconMinus,
    IconListCheck,
} from "@tabler/icons-react";
import { toast } from 'react-toastify';
import OrderConfirmationModal from './orderConfirmationModal';
import OrderSuccessModal from './orderSuccessModal';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
    const [sampels, setSampel] = useState([]);
    const [groupedSampels, setGroupedSampels] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [categories, setCategories] = useState({});
    const [selectedSampels, setSelectedSampels] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderDetails, setOrderDetails] = useState([]);
    const [orderTotal, setOrderTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 0,
        total: 0
    });
    const [keywords, setKeywords] = useState("");
    const [activeCategory, setActiveCategory] = useState(null);

    // Warna yang lebih soft dan professional
    const categoryColors = [
        { bg: '#f0f7ff', text: '#1e40af', border: '#dbeafe', light: '#3b82f6' },
        { bg: '#f0fdf4', text: '#166534', border: '#dcfce7', light: '#22c55e' },
        { bg: '#fffbeb', text: '#92400e', border: '#fef3c7', light: '#f59e0b' },
        { bg: '#fdf2f8', text: '#be185d', border: '#fce7f3', light: '#ec4899' },
        { bg: '#faf5ff', text: '#7c3aed', border: '#f3e8ff', light: '#a855f7' },
        { bg: '#eff6ff', text: '#3730a3', border: '#e0e7ff', light: '#6366f1' },
        { bg: '#ecfdf5', text: '#047857', border: '#d1fae5', light: '#10b981' },
        { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5', light: '#f97316' },
    ];

    const packageCategories = [1, 2];

    const getCategoryColor = (categoryId) => {
        const index = parseInt(categoryId) % categoryColors.length;
        return categoryColors[index];
    };

    const isPackageCategory = (categoryId) => {
        return packageCategories.includes(parseInt(categoryId));
    };

    const fetchData = async (pageNumber, keywords = "") => {
        setIsLoading(true);
        const page = pageNumber ? pageNumber : pagination.currentPage;
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const categoriesResponse = await Api.get('/api/categories');
                const categoriesMap = {};
                categoriesResponse.data.data.forEach(category => {
                    categoriesMap[category.id] = category;
                });
                setCategories(categoriesMap);

                const response = await Api.get(
                    `/api/sampels?page=${page}&search=${keywords}`
                );

                setSampel(response.data.data);
                const grouped = groupSampelsByCategoryId(response.data.data, categoriesMap);
                setGroupedSampels(grouped);

                const initialExpandedState = {};
                Object.keys(categoriesMap).forEach(categoryId => {
                    initialExpandedState[categoryId] = true;
                });
                setExpandedCategories(initialExpandedState);

                setPagination(() => ({
                    currentPage: response.data.pagination.currentPage,
                    perPage: response.data.pagination.perPage,
                    total: response.data.pagination.total
                }));

            } catch (error) {
                console.error("There was an error fetching the data!", error);
                toast.error("Gagal memuat data sampel");
            } finally {
                setIsLoading(false);
            }
        } else {
            console.error("Token is not available!");
            setIsLoading(false);
        }
    };

    const groupSampelsByCategoryId = (sampelsData, categoriesMap) => {
        const groups = {};
        Object.keys(categoriesMap).forEach(categoryId => {
            groups[categoryId] = {
                category: categoriesMap[categoryId],
                sampels: sampelsData.filter(sampel => sampel.category_id == categoryId)
            };
        });
        return groups;
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
        setActiveCategory(activeCategory === categoryId ? null : categoryId);
    };

    const toggleAllCategories = () => {
        const allExpanded = Object.values(expandedCategories).every(val => val);
        const newState = {};
        Object.keys(expandedCategories).forEach(categoryId => {
            newState[categoryId] = !allExpanded;
        });
        setExpandedCategories(newState);
    };

    const toggleSampelSelection = (sampelId, categoryId = null) => {
        setSelectedSampels(prev => {
            if (prev.includes(sampelId)) {
                const newQuantities = { ...quantities };
                delete newQuantities[sampelId];
                setQuantities(newQuantities);
                return prev.filter(id => id !== sampelId);
            } else {
                return [...prev, sampelId];
            }
        });
    };

    const toggleAllSampelsInPackage = (categoryId) => {
        const categorySampels = groupedSampels[categoryId]?.sampels || [];
        const allSelected = categorySampels.every(sampel =>
            selectedSampels.includes(sampel.id)
        );

        if (allSelected) {
            const newSelectedSampels = selectedSampels.filter(id => {
                const sampel = sampels.find(s => s.id === id);
                return sampel?.category_id !== parseInt(categoryId);
            });
            const newQuantities = { ...quantities };
            categorySampels.forEach(sampel => {
                delete newQuantities[sampel.id];
            });
            setSelectedSampels(newSelectedSampels);
            setQuantities(newQuantities);
        } else {
            const newSelectedSampels = [...selectedSampels];
            const newQuantities = { ...quantities };
            categorySampels.forEach(sampel => {
                if (!newSelectedSampels.includes(sampel.id)) {
                    newSelectedSampels.push(sampel.id);
                    newQuantities[sampel.id] = 1;
                }
            });
            setSelectedSampels(newSelectedSampels);
            setQuantities(newQuantities);
        }
    };

    const updateQuantity = (sampelId, quantity) => {
        const qty = parseInt(quantity) || 1;
        if (qty >= 1 && qty <= 999) {
            setQuantities(prev => ({
                ...prev,
                [sampelId]: qty
            }));
        }
    };

    const incrementQuantity = (sampelId) => {
        const currentQty = quantities[sampelId] || 1;
        if (currentQty < 999) {
            updateQuantity(sampelId, currentQty + 1);
        }
    };

    const decrementQuantity = (sampelId) => {
        const currentQty = quantities[sampelId] || 1;
        if (currentQty > 1) {
            updateQuantity(sampelId, currentQty - 1);
        }
    };

    const calculateOrderSummary = () => {
        let totalItems = 0;
        let totalPrice = 0;

        selectedSampels.forEach(sampelId => {
            const sampel = sampels.find(s => s.id === sampelId);
            const qty = quantities[sampelId] || 1;

            if (sampel && sampel.price_sell) {
                totalItems += qty;
                totalPrice += qty * sampel.price_sell;
            }
        });

        return { totalItems, totalPrice };
    };

    const calculatePackageTotal = (categoryId) => {
        const categorySampels = groupedSampels[categoryId]?.sampels || [];
        let total = 0;
        categorySampels.forEach(sampel => {
            if (selectedSampels.includes(sampel.id) && sampel.price_sell) {
                const qty = quantities[sampel.id] || 1;
                total += qty * sampel.price_sell;
            }
        });
        return total;
    };

    const isAllSampelsSelected = (categoryId) => {
        const categorySampels = groupedSampels[categoryId]?.sampels || [];
        if (categorySampels.length === 0) return false;
        return categorySampels.every(sampel => selectedSampels.includes(sampel.id));
    };

    const prepareOrderDetails = () => {
        const details = selectedSampels.map(sampelId => {
            const sampel = sampels.find(s => s.id === sampelId);
            const qty = quantities[sampelId] || 1;
            const subtotal = sampel && sampel.price_sell ? qty * sampel.price_sell : 0;

            return {
                id: sampelId,
                parameter: sampel?.parameter || 'Tidak ada parameter',
                quantity: qty,
                price: sampel?.price_sell || 0,
                subtotal: subtotal
            };
        });

        const total = details.reduce((sum, item) => sum + item.subtotal, 0);
        return { details, total };
    };

    const submitOrder = async () => {
        setIsSubmitting(true);
        try {
            const orderData = selectedSampels.map(sampelId => ({
                sampel_id: sampelId,
                qty: quantities[sampelId] || 1
            }));

            const response = await Api.post("/api/order", {
                items: orderData
            });

            const { details, total } = prepareOrderDetails();
            setOrderDetails(details);
            setOrderTotal(total);

            setShowOrderModal(false);
            setShowSuccessModal(true);
            setSelectedSampels([]);
            setQuantities({});

            toast.success(`✅ Pesanan berhasil dibuat!`, {
                position: "top-right",
                autoClose: 3000,
            });

        } catch (error) {
            console.error("Error creating order:", error);
            if (error.response?.data?.errors) {
                toast.error(`❌ ${error.response.data.errors[0].msg}`);
            } else {
                toast.error("❌ Terjadi kesalahan saat membuat pesanan");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        setOrderDetails([]);
        setOrderTotal(0);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const searchHandlder = () => {
        fetchData(1, keywords);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            searchHandlder();
        }
    };

    const resetSearch = () => {
        setKeywords("");
        fetchData(1, "");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const orderSummary = calculateOrderSummary();

    const handlePrint = () => {
        window.print();
    };

    const handleOrderAgain = () => {
        setShowSuccessModal(false);
        setOrderDetails([]);
        setOrderTotal(0);
    };

    const navigate = useNavigate();

    const handleViewOrders = () => {
        // Navigasi ke halaman daftar pesanan
        navigate('/cart');
    };

    return (
        <LayoutAdmin>
            <div className="page-header">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle text-muted">Pemesanan</div>
                            <h2 className="page-title">Pilih Sampel untuk Dipesan</h2>
                            <div className="text-muted mt-1">
                                Pilih sampel yang Anda butuhkan dari berbagai kategori yang tersedia
                            </div>
                        </div>
                        <div className="col-auto ms-auto">
                            <div className="btn-list">
                                {selectedSampels.length > 0 && (
                                    <button
                                        onClick={() => setShowOrderModal(true)}
                                        className="btn btn-success btn-lg"
                                    >
                                        <IconShoppingCart size={20} className="me-2" />
                                        Buat Pesanan ({selectedSampels.length})
                                        <div className="small fw-normal">Total: {formatCurrency(orderSummary.totalPrice)}</div>
                                    </button>
                                )}
                                <button
                                    onClick={() => fetchData()}
                                    className="btn btn-outline-primary"
                                    disabled={isLoading}
                                >
                                    <IconRefresh size={18} className="me-1" />
                                    {isLoading ? "Memuat..." : "Refresh"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="container-xl">
                    {/* Floating Order Summary */}
                    {selectedSampels.length > 0 && (
                        <div className="floating-order-summary">
                            <div className="card shadow-lg border-0">
                                <div className="card-body p-3">
                                    <div className="row align-items-center">
                                        <div className="col">
                                            <div className="d-flex align-items-center">
                                                <IconListCheck size={24} className="text-success me-3" />
                                                <div>
                                                    <div className="fw-bold">{selectedSampels.length} sampel dipilih</div>
                                                    <div className="text-muted small">
                                                        {orderSummary.totalItems} item • {formatCurrency(orderSummary.totalPrice)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-auto">
                                            <div className="btn-group">
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => {
                                                        setSelectedSampels([]);
                                                        setQuantities({});
                                                    }}
                                                >
                                                    Batalkan
                                                </button>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => setShowOrderModal(true)}
                                                >
                                                    <IconCheck size={16} className="me-1" />
                                                    Pesan Sekarang
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Section */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="row g-3 align-items-center">
                                        <div className="col-md-8">
                                            <label className="form-label fw-semibold">Cari Sampel</label>
                                            <div className="input-group input-group-lg">
                                                <span className="input-group-text bg-light border-end-0">
                                                    <IconSearch size={20} />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0"
                                                    value={keywords}
                                                    onChange={(e) => setKeywords(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    placeholder="Ketik nama sampel yang dicari..."
                                                    disabled={isLoading}
                                                />
                                                {keywords && (
                                                    <button
                                                        onClick={resetSearch}
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        disabled={isLoading}
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">&nbsp;</label>
                                            <div className="d-grid gap-2">
                                                <button
                                                    onClick={searchHandlder}
                                                    className="btn btn-primary btn-lg"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? "Mencari..." : "Cari Sampel"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Categories Navigation */}
                    {Object.keys(groupedSampels).length > 0 && (
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card shadow-sm">
                                    <div className="card-body py-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <IconCategory size={20} className="text-primary me-2" />
                                                <span className="fw-semibold">Kategori Sampel:</span>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button
                                                    onClick={toggleAllCategories}
                                                    className="btn btn-outline-primary btn-sm"
                                                    disabled={isLoading}
                                                >
                                                    {Object.values(expandedCategories).every(val => val)
                                                        ? "Tutup Semua"
                                                        : "Buka Semua"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sampels List */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card shadow-sm">
                                <div className="card-header bg-light">
                                    <h3 className="card-title mb-0">
                                        <IconListCheck size={20} className="me-2" />
                                        Daftar Sampel Tersedia
                                        <span className="badge bg-primary ms-2">{sampels.length}</span>
                                    </h3>
                                </div>

                                <div className="card-body p-0">
                                    {isLoading ? (
                                        <div className="text-center p-5">
                                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                                            <p className="mt-3 text-muted">Memuat data sampel...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {Object.keys(groupedSampels).length > 0 ? (
                                                <div className="category-groups">
                                                    {Object.entries(groupedSampels).map(([categoryId, categoryData]) => {
                                                        const color = getCategoryColor(categoryId);
                                                        const hasSampels = categoryData.sampels.length > 0;
                                                        const isPackage = isPackageCategory(categoryId);
                                                        const packageTotal = isPackage ? calculatePackageTotal(categoryId) : 0;
                                                        const allSelected = isPackage ? isAllSampelsSelected(categoryId) : false;
                                                        const isExpanded = expandedCategories[categoryId];

                                                        return (
                                                            <div key={categoryId} className="category-group border-bottom">
                                                                <div
                                                                    className="category-header p-4 d-flex justify-content-between align-items-center cursor-pointer"
                                                                    onClick={() => toggleCategory(categoryId)}
                                                                    style={{
                                                                        backgroundColor: isExpanded ? color.bg : '#f8f9fa',
                                                                        borderLeft: `4px solid ${color.text}`,
                                                                        transition: 'all 0.3s ease'
                                                                    }}
                                                                >
                                                                    <div className="d-flex align-items-center flex-fill">
                                                                        <div className="me-3" style={{ color: color.text }}>
                                                                            {isExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                                                                        </div>
                                                                        <div className="flex-fill">
                                                                            <h4 className="m-0 fw-semibold" style={{ color: color.text }}>
                                                                                {categoryData.category.name}
                                                                                {isPackage && (
                                                                                    <span className="badge bg-warning text-dark ms-2">
                                                                                        <IconPackage size={12} className="me-1" />
                                                                                        Paket
                                                                                    </span>
                                                                                )}
                                                                            </h4>
                                                                            <div className="text-muted small mt-1">
                                                                                {hasSampels
                                                                                    ? `${categoryData.sampels.length} sampel tersedia`
                                                                                    : 'Sampel belum tersedia'
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        {isPackage && hasSampels && packageTotal > 0 && (
                                                                            <div className="fw-bold fs-5" style={{ color: color.text }}>
                                                                                {formatCurrency(packageTotal)}
                                                                            </div>
                                                                        )}
                                                                        {isPackage && hasSampels && (
                                                                            <button
                                                                                className="btn btn-outline-primary btn-sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    toggleAllSampelsInPackage(categoryId);
                                                                                }}
                                                                            >
                                                                                {allSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {isExpanded && (
                                                                    <div className="p-3">
                                                                        {hasSampels ? (
                                                                            <div className="row g-3">
                                                                                {categoryData.sampels.map((sampel) => (
                                                                                    <div key={sampel.id} className="col-lg-6 col-xl-4">
                                                                                        <div className={`card sampel-card ${selectedSampels.includes(sampel.id) ? 'border-success' : ''}`}>
                                                                                            <div className="card-body">
                                                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                                    <div className="form-check">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            className="form-check-input"
                                                                                                            checked={selectedSampels.includes(sampel.id)}
                                                                                                            onChange={() => toggleSampelSelection(sampel.id)}
                                                                                                            id={`sampel-${sampel.id}`}
                                                                                                        />
                                                                                                        <label className="form-check-label fw-medium" htmlFor={`sampel-${sampel.id}`}>
                                                                                                            {sampel.parameter || 'Tidak ada parameter'}
                                                                                                        </label>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="d-flex justify-content-between align-items-center mt-3">
                                                                                                    <div className="text-success fw-bold fs-5">
                                                                                                        {sampel.price_sell ? formatCurrency(sampel.price_sell) : 'Gratis'}
                                                                                                    </div>

                                                                                                    {selectedSampels.includes(sampel.id) ? (
                                                                                                        <div className="quantity-controls">
                                                                                                            <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                                                                                                <button
                                                                                                                    className="btn btn-outline-secondary"
                                                                                                                    type="button"
                                                                                                                    onClick={() => decrementQuantity(sampel.id)}
                                                                                                                >
                                                                                                                    <IconMinus size={14} />
                                                                                                                </button>
                                                                                                                <input
                                                                                                                    type="number"
                                                                                                                    className="form-control text-center"
                                                                                                                    value={quantities[sampel.id] || 1}
                                                                                                                    onChange={(e) => updateQuantity(sampel.id, e.target.value)}
                                                                                                                    min="1"
                                                                                                                    max="999"
                                                                                                                />
                                                                                                                <button
                                                                                                                    className="btn btn-outline-secondary"
                                                                                                                    type="button"
                                                                                                                    onClick={() => incrementQuantity(sampel.id)}
                                                                                                                >
                                                                                                                    <IconPlus size={14} />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <button
                                                                                                            className="btn btn-outline-primary btn-sm"
                                                                                                            onClick={() => toggleSampelSelection(sampel.id)}
                                                                                                        >
                                                                                                            Pilih
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center p-5">
                                                                                <div className="d-flex flex-column align-items-center">
                                                                                    <div className="bg-light p-4 rounded-circle mb-3">
                                                                                        <IconInfoCircle size={48} className="text-muted" />
                                                                                    </div>
                                                                                    <h4 className="h5 text-muted">Sampel Belum Tersedia</h4>
                                                                                    <p className="text-muted mb-0">
                                                                                        Untuk kategori {categoryData.category.name} saat ini belum ada sampel yang tersedia.
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center p-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <div className="bg-light p-4 rounded-circle mb-3">
                                                            <IconSearch size={48} className="text-muted" />
                                                        </div>
                                                        <h3 className="h4 text-muted">Data tidak ditemukan</h3>
                                                        <p className="text-muted mb-4">
                                                            {keywords
                                                                ? `Tidak ada hasil untuk "${keywords}". Coba dengan kata kunci lain.`
                                                                : "Belum ada data kategori sampel yang tersedia."}
                                                        </p>
                                                        {keywords && (
                                                            <button
                                                                onClick={resetSearch}
                                                                className="btn btn-primary"
                                                            >
                                                                Tampilkan Semua Sampel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Components */}
            <OrderConfirmationModal
                show={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                selectedSampels={selectedSampels}
                sampels={sampels}
                quantities={quantities}
                categories={categories}
                formatCurrency={formatCurrency}
                orderSummary={orderSummary}
                isSubmitting={isSubmitting}
                onSubmit={submitOrder}
                onBackToEdit={() => setShowOrderModal(false)}
            />

            <OrderSuccessModal
                show={showSuccessModal}
                onClose={handleSuccessModalClose}
                orderDetails={orderDetails}
                orderTotal={orderTotal}
                formatCurrency={formatCurrency}
                onPrint={handlePrint}
                onOrderAgain={handleOrderAgain}
                onViewOrders={handleViewOrders}
            />

            <style jsx>{`
                /* ===== FIX UNTUK FONT ===== */
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                                'Oxygen', 'Ubuntu', 'Cantarell', sans-serif !important;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                /* ===== CUSTOM MODAL ORDER - FIXED ===== */
                .custom-order-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.6) !important; /* Lebih gelap */
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    z-index: 1050;
                    backdrop-filter: blur(5px); /* Efek blur background */
                }

                .custom-order-modal-dialog {
                    width: 95%;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .custom-order-modal-content {
                    background: white !important; /* Pastikan background putih */
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    animation: customModalSlideIn 0.3s ease-out;
                    overflow: hidden;
                }

                .custom-order-modal-header {
                    background: linear-gradient(135deg, #198754, #157347) !important;
                    color: white;
                    border-radius: 12px 12px 0 0;
                    padding: 1.5rem 2rem;
                    border-bottom: none;
                }

                .custom-order-modal-body {
                    background: white !important;
                    padding: 2rem;
                    max-height: 70vh;
                    overflow-y: auto;
                    color: #333 !important; /* Pastikan warna teks gelap */
                }

                .custom-order-modal-footer {
                    background: white !important;
                    border-top: 1px solid #e9ecef;
                    padding: 1.5rem 2rem;
                    border-radius: 0 0 12px 12px;
                }

                .custom-order-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white !important;
                }

                .custom-order-table th {
                    background-color: #f8f9fa !important;
                    font-weight: 600;
                    padding: 1rem;
                    border-bottom: 2px solid #dee2e6;
                    color: #333 !important;
                }

                .custom-order-table td {
                    background: white !important;
                    padding: 1rem;
                    border-bottom: 1px solid #dee2e6;
                    vertical-align: middle;
                    color: #333 !important;
                }

                .custom-order-table tfoot th {
                    background-color: #f8f9fa !important;
                    font-size: 1.1em;
                    color: #333 !important;
                }

                /* Pastikan semua teks visible */
                .custom-order-modal-body * {
                    color: #333 !important;
                }

                .modal-title {
                    color: white !important;
                    font-weight: 600;
                }

                /* Animasi */
                @keyframes customModalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-50px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .custom-order-modal-dialog {
                        width: 98%;
                        margin: 10px;
                    }
                    
                    .custom-order-modal-body {
                        padding: 1rem;
                        max-height: 80vh;
                    }
                    
                    .custom-order-table {
                        font-size: 0.9em;
                    }
                    
                    .custom-order-table th,
                    .custom-order-table td {
                        padding: 0.5rem;
                    }
                }

                /* ===== STYLE EXISTING ===== */
                .cursor-pointer {
                    cursor: pointer;
                }
                .category-group {
                    transition: all 0.3s ease;
                }
                .category-header:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .sampel-card {
                    transition: all 0.3s ease;
                    height: 100%;
                }
                .sampel-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .sampel-card.border-success {
                    border-width: 2px !important;
                }
                .quantity-controls .input-group {
                    width: 120px;
                }
                .quantity-controls input {
                    text-align: center;
                    font-family: inherit !important;
                }
                .floating-order-summary {
                    position: sticky;
                    top: 20px;
                    z-index: 1000;
                    margin-bottom: 20px;
                }
                .form-check-input {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                .form-check-input:checked {
                    background-color: #198754;
                    border-color: #198754;
                }
                .form-check-label {
                    cursor: pointer;
                    user-select: none;
                    font-family: inherit !important;
                }
            `}</style>
        </LayoutAdmin>
    )
}