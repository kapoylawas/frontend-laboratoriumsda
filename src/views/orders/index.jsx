import { useEffect, useState } from 'react';
import LayoutAdmin from '../../layouts/admin';
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
    IconFlask,
    IconSparkles
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
    const [isSummaryMinimized, setIsSummaryMinimized] = useState(false);

    const categoryColors = [
        { bg: '#eff6ff', text: '#1d4ed8', border: '#000000' },
        { bg: '#f0fdf4', text: '#15803d', border: '#000000' },
        { bg: '#fffbeb', text: '#b45309', border: '#000000' },
        { bg: '#fdf2f8', text: '#be185d', border: '#000000' },
        { bg: '#faf5ff', text: '#6b21a8', border: '#000000' },
        { bg: '#ecfdf5', text: '#047857', border: '#000000' },
    ];

    const packageCategories = [1, 2];

    const getCategoryColor = (categoryId) => {
        const index = parseInt(categoryId) % categoryColors.length;
        return categoryColors[index];
    };

    const isPackageCategory = (categoryId) => {
        return packageCategories.includes(parseInt(categoryId));
    };

    const fetchData = async (pageNumber, searchKw = "") => {
        setIsLoading(true);
        const page = pageNumber ? pageNumber : pagination.currentPage;
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;
            try {
                const categoriesResponse = await Api.get('/api/categories');
                const categoriesMap = {};
                (categoriesResponse.data.data || []).forEach(category => {
                    categoriesMap[category.id] = category;
                });
                setCategories(categoriesMap);

                const response = await Api.get(
                    `/api/sampels?page=${page}&search=${searchKw}`
                );

                const sampelsData = response.data.data || [];
                setSampel(sampelsData);
                const grouped = groupSampelsByCategoryId(sampelsData, categoriesMap);
                setGroupedSampels(grouped);

                const initialExpandedState = {};
                Object.keys(categoriesMap).forEach(categoryId => {
                    initialExpandedState[categoryId] = true;
                });
                setExpandedCategories(initialExpandedState);

                if (response.data.pagination) {
                    setPagination(() => ({
                        currentPage: response.data.pagination.currentPage || response.data.pagination.page || 1,
                        perPage: response.data.pagination.perPage || response.data.pagination.limit || 10,
                        total: response.data.pagination.total || 0
                    }));
                }

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

    const toggleSampelSelection = (sampelId) => {
        setSelectedSampels(prev => {
            if (prev.includes(sampelId)) {
                const newQuantities = { ...quantities };
                delete newQuantities[sampelId];
                setQuantities(newQuantities);
                return prev.filter(id => id !== sampelId);
            } else {
                setQuantities(q => ({ ...q, [sampelId]: q[sampelId] || 1 }));
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

            await Api.post("/api/order", {
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
        }).format(amount || 0);
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
        navigate('/cart');
    };

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
                .category-card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 5px 5px 0px #000000 !important;
                    border-radius: 16px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .category-card-3d:hover {
                    box-shadow: 7px 7px 0px #000000 !important;
                }
                .sampel-card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 16px !important;
                    transition: all 0.15s ease-in-out !important;
                    height: 100%;
                }
                .sampel-card-3d:hover {
                    box-shadow: 6px 6px 0px #000000 !important;
                    transform: translateY(-2px);
                }
                .sampel-card-3d.selected {
                    background: #f0fdf4 !important;
                    border-color: #16a34a !important;
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
                    text-decoration: none !important;
                }
                .btn-3d-secondary:hover {
                    background: #e2e8f0 !important;
                    color: #000000 !important;
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
                .btn-3d-danger {
                    background: #ef4444 !important;
                    color: #ffffff !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    border-radius: 10px !important;
                    font-weight: 800 !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .btn-3d-danger:hover {
                    background: #dc2626 !important;
                    color: #ffffff !important;
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0px #000000 !important;
                }
                .floating-summary-3d {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1040;
                    width: 90%;
                    max-width: 820px;
                    background: #ffffff !important;
                    border: 3px solid #000000 !important;
                    box-shadow: 8px 8px 0px #000000 !important;
                    border-radius: 20px !important;
                }
                .input-3d {
                    border: 2.5px solid #000000 !important;
                    border-radius: 12px !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    font-weight: 600 !important;
                }

                /* Modals Styling */
                .custom-order-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.6) !important;
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    z-index: 1050;
                    backdrop-filter: blur(5px);
                }
                .custom-order-modal-dialog {
                    width: 95%;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .custom-order-modal-content {
                    background: white !important;
                    border: 3px solid #000000 !important;
                    border-radius: 20px !important;
                    box-shadow: 10px 10px 0px #000000 !important;
                    overflow: hidden;
                }
                .custom-order-modal-header {
                    background: linear-gradient(135deg, #1e293b, #0f172a) !important;
                    color: white;
                    padding: 1.5rem 2rem;
                    border-bottom: 2.5px solid #000;
                }
                .custom-order-modal-body {
                    background: white !important;
                    padding: 2rem;
                    max-height: 70vh;
                    overflow-y: auto;
                    color: #333 !important;
                }
                .custom-order-modal-footer {
                    background: white !important;
                    border-top: 2px solid #000;
                    padding: 1.5rem 2rem;
                }
            `}</style>

            <div className="page-wrapper py-3" style={{ paddingBottom: selectedSampels.length > 0 && !isSummaryMinimized ? '160px' : '40px' }}>
                <div className="container-xl">
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
                                            Pemesanan Sampel & Parameter
                                        </h2>
                                        <div className="text-white-50 small">
                                            Pilih sampel pengujian laboratorium yang Anda butuhkan dari katalog resmi
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    <span className="badge badge-3d bg-warning text-dark">
                                        <IconSparkles size={14} className="me-1" /> Katalog Aktif
                                    </span>
                                    <span className="badge badge-3d bg-info text-dark">
                                        <IconFlask size={14} className="me-1" /> {sampels.length} Sampel Tersedia
                                    </span>
                                    <span className="badge badge-3d bg-success text-white">
                                        <IconListCheck size={14} className="me-1" /> {selectedSampels.length} Dipilih
                                    </span>
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end">
                                <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                                    {selectedSampels.length > 0 && (
                                        <button
                                            onClick={() => setShowOrderModal(true)}
                                            className="btn btn-3d-green py-2 px-3"
                                        >
                                            <IconShoppingCart size={20} />
                                            Buat Pesanan ({selectedSampels.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={() => fetchData()}
                                        className="btn btn-3d-secondary py-2 px-3"
                                        disabled={isLoading}
                                    >
                                        <IconRefresh size={18} />
                                        {isLoading ? "Memuat..." : "Refresh"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Order Summary 3D */}
                    {selectedSampels.length > 0 && (
                        isSummaryMinimized ? (
                            <div 
                                className="floating-summary-3d p-2 px-3 text-center cursor-pointer"
                                onClick={() => setIsSummaryMinimized(false)}
                                style={{ maxWidth: '420px', cursor: 'pointer' }}
                                title="Klik untuk membuka ringkasan pesanan"
                            >
                                <div className="d-flex align-items-center justify-content-between gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge badge-3d bg-success text-white">
                                            {selectedSampels.length} Sampel
                                        </span>
                                        <span className="fw-black text-primary small">
                                            {formatCurrency(orderSummary.totalPrice)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-3d-green py-1 px-3 btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowOrderModal(true);
                                        }}
                                    >
                                        <IconCheck size={16} /> Pesan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="floating-summary-3d p-3">
                                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="p-2 bg-success text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                            <IconListCheck size={24} />
                                        </div>
                                        <div>
                                            <div className="fw-black text-dark fs-5">
                                                {selectedSampels.length} Sampel Dipilih
                                            </div>
                                            <div className="text-muted small">
                                                Total {orderSummary.totalItems} item • <strong className="text-primary fs-6">{formatCurrency(orderSummary.totalPrice)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-3d-danger py-2 px-3"
                                            onClick={() => {
                                                setSelectedSampels([]);
                                                setQuantities({});
                                            }}
                                        >
                                            Batalkan
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-3d-green py-2 px-4"
                                            onClick={() => setShowOrderModal(true)}
                                        >
                                            <IconCheck size={18} /> Pesan Sekarang
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light border border-2 border-dark ms-1 p-1 px-2 fw-bold"
                                            onClick={() => setIsSummaryMinimized(true)}
                                            title="Sembunyikan Ringkasan"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* Search Section 3D */}
                    <div className="card-3d p-4 mb-4">
                        <label className="form-label fw-black text-dark mb-2 fs-5">Cari Sampel & Parameter</label>
                        <div className="d-flex align-items-center bg-white p-1" style={{ border: '2.5px solid #000', boxShadow: '4px 4px 0px #000', borderRadius: '14px' }}>
                            <div className="ps-3 pe-2 text-muted d-flex align-items-center">
                                <IconSearch size={20} />
                            </div>
                            <input
                                type="text"
                                className="form-control border-0 shadow-none bg-transparent py-2 fw-semibold"
                                style={{ fontSize: '0.95rem' }}
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ketik nama sampel atau parameter yang dicari..."
                                disabled={isLoading}
                            />
                            {keywords && (
                                <button
                                    onClick={resetSearch}
                                    className="btn btn-sm btn-light border-0 text-muted me-2 fw-bold rounded-circle px-2"
                                    type="button"
                                    disabled={isLoading}
                                    title="Reset Pencarian"
                                >
                                    ✕
                                </button>
                            )}
                            <button
                                onClick={searchHandlder}
                                className="btn btn-primary fw-bold py-2 px-4 me-1"
                                style={{ border: '2px solid #000', boxShadow: 'none', borderRadius: '10px' }}
                                disabled={isLoading}
                            >
                                {isLoading ? "Mencari..." : "Cari Sampel"}
                            </button>
                        </div>
                    </div>

                    {/* Categories Navigation Bar 3D */}
                    {Object.keys(groupedSampels).length > 0 && (
                        <div className="card-3d p-3 mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="p-2 bg-primary text-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                        <IconCategory size={20} />
                                    </div>
                                    <span className="fw-black text-dark">Kategori Sampel Laboratorium</span>
                                </div>
                                <button
                                    onClick={toggleAllCategories}
                                    className="btn btn-3d-secondary py-1 px-3"
                                    disabled={isLoading}
                                >
                                    {Object.values(expandedCategories).every(val => val)
                                        ? "Tutup Semua"
                                        : "Buka Semua"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sampels List 3D */}
                    <div className="card-3d p-4" style={{ marginBottom: selectedSampels.length > 0 ? '180px' : '0px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-2 border-dark">
                            <div className="d-flex align-items-center gap-2">
                                <div className="p-2 bg-warning text-dark rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000' }}>
                                    <IconListCheck size={20} />
                                </div>
                                <h3 className="fw-black text-dark mb-0">Daftar Sampel Tersedia</h3>
                            </div>
                            <span className="badge badge-3d bg-primary text-white fs-6 px-3 py-1">
                                {sampels.length} Sampel
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                                <p className="mt-3 text-muted fw-bold">Memuat data sampel laboratorium...</p>
                            </div>
                        ) : (
                            <>
                                {Object.keys(groupedSampels).length > 0 ? (
                                    <div className="d-flex flex-column gap-4">
                                        {Object.entries(groupedSampels).map(([categoryId, categoryData]) => {
                                            const color = getCategoryColor(categoryId);
                                            const hasSampels = categoryData.sampels.length > 0;
                                            const isPackage = isPackageCategory(categoryId);
                                            const packageTotal = isPackage ? calculatePackageTotal(categoryId) : 0;
                                            const allSelected = isPackage ? isAllSampelsSelected(categoryId) : false;
                                            const isExpanded = expandedCategories[categoryId];

                                            return (
                                                <div key={categoryId} className="category-card-3d overflow-hidden">
                                                    <div
                                                        className="p-3 d-flex justify-content-between align-items-center cursor-pointer"
                                                        onClick={() => toggleCategory(categoryId)}
                                                        style={{
                                                            backgroundColor: color.bg,
                                                            borderBottom: isExpanded ? '2.5px solid #000' : 'none',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="p-2 bg-white rounded-3 border border-2 border-dark" style={{ boxShadow: '2px 2px 0px #000', color: color.text }}>
                                                                {isExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                                                            </div>
                                                            <div>
                                                                <h4 className="m-0 fw-black" style={{ color: color.text }}>
                                                                    {categoryData.category.name}
                                                                    {isPackage && (
                                                                        <span className="badge badge-3d bg-warning text-dark ms-2">
                                                                            <IconPackage size={12} className="me-1" /> Paket
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <div className="text-muted small mt-1 fw-semibold">
                                                                    {hasSampels
                                                                        ? `${categoryData.sampels.length} sampel tersedia`
                                                                        : 'Sampel belum tersedia'
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            {isPackage && hasSampels && packageTotal > 0 && (
                                                                <div className="fw-black fs-5 text-primary">
                                                                    {formatCurrency(packageTotal)}
                                                                </div>
                                                            )}
                                                            {isPackage && hasSampels && (
                                                                <button
                                                                    className="btn btn-3d-secondary py-1 px-3 text-dark"
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
                                                        <div className="p-3 bg-light">
                                                            {hasSampels ? (
                                                                <div className="row g-3">
                                                                    {categoryData.sampels.map((sampel) => {
                                                                        const isSelected = selectedSampels.includes(sampel.id);
                                                                        return (
                                                                            <div key={sampel.id} className="col-lg-6 col-xl-4">
                                                                                <div className={`sampel-card-3d p-3 ${isSelected ? 'selected' : ''}`}>
                                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                        <div className="form-check">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="form-check-input border-2 border-dark"
                                                                                                checked={isSelected}
                                                                                                onChange={() => toggleSampelSelection(sampel.id)}
                                                                                                id={`sampel-${sampel.id}`}
                                                                                                style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                                                                                            />
                                                                                            <label className="form-check-label fw-bold text-dark ms-2" htmlFor={`sampel-${sampel.id}`} style={{ cursor: 'pointer' }}>
                                                                                                {sampel.parameter || 'Tidak ada parameter'}
                                                                                            </label>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                                                                                        <div className="text-primary fw-black fs-5">
                                                                                            {sampel.price_sell ? formatCurrency(sampel.price_sell) : 'Gratis'}
                                                                                        </div>

                                                                                        {isSelected ? (
                                                                                            <div className="d-flex align-items-center gap-1">
                                                                                                <button
                                                                                                    className="btn btn-3d-secondary py-1 px-2"
                                                                                                    type="button"
                                                                                                    onClick={() => decrementQuantity(sampel.id)}
                                                                                                >
                                                                                                    <IconMinus size={14} />
                                                                                                </button>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    className="form-control input-3d text-center py-1"
                                                                                                    style={{ width: '55px' }}
                                                                                                    value={quantities[sampel.id] || 1}
                                                                                                    onChange={(e) => updateQuantity(sampel.id, e.target.value)}
                                                                                                    min="1"
                                                                                                    max="999"
                                                                                                />
                                                                                                <button
                                                                                                    className="btn btn-3d-primary py-1 px-2"
                                                                                                    type="button"
                                                                                                    onClick={() => incrementQuantity(sampel.id)}
                                                                                                >
                                                                                                    <IconPlus size={14} />
                                                                                                </button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <button
                                                                                                className="btn btn-3d-primary py-1 px-3"
                                                                                                onClick={() => toggleSampelSelection(sampel.id)}
                                                                                            >
                                                                                                Pilih
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center p-4 text-muted">
                                                                    <IconInfoCircle size={36} className="mb-2 opacity-50" />
                                                                    <h5 className="mb-1">Sampel Belum Tersedia</h5>
                                                                    <p className="small mb-0">Untuk kategori {categoryData.category.name} saat ini belum ada sampel yang tersedia.</p>
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
                                        <IconSearch size={48} className="text-muted mb-3 opacity-50" />
                                        <h3 className="fw-black text-dark mb-2">Data sampel tidak ditemukan</h3>
                                        <p className="text-muted mb-4">
                                            {keywords
                                                ? `Tidak ada hasil untuk "${keywords}". Coba dengan kata kunci lain.`
                                                : "Belum ada data kategori sampel yang tersedia."}
                                        </p>
                                        {keywords && (
                                            <button
                                                onClick={resetSearch}
                                                className="btn btn-3d-primary py-2 px-4"
                                            >
                                                Tampilkan Semua Sampel
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
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
        </LayoutAdmin>
    );
}