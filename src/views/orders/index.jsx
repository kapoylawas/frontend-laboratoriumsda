import { useEffect, useState } from 'react';
import LayoutAdmin from '../../layouts/admin'
import Cookies from "js-cookie";
import Api from "../../services/api";
import PaginationComponent from "../../components/Pagination";
import {
    IconSearch,
    IconRefresh,
    IconChevronDown,
    IconChevronUp,
    IconCategory,
    IconInfoCircle,
    IconShoppingCart,
    IconCheck,
    IconPackage
} from "@tabler/icons-react";
import { toast } from 'react-toastify';

export default function Orders() {
    const [sampels, setSampel] = useState([]);
    const [groupedSampels, setGroupedSampels] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [categories, setCategories] = useState({});
    const [selectedSampels, setSelectedSampels] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [showOrderModal, setShowOrderModal] = useState(false);

    //state loading
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    //define state "pagination"
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 0,
        total: 0
    });

    const [keywords, setKeywords] = useState("");

    // Daftar warna untuk kategori
    const categoryColors = [
        { bg: '#e3f2fd', text: '#0d47a1', border: '#bbdefb' },
        { bg: '#e8f5e9', text: '#1b5e20', border: '#c8e6c9' },
        { bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
        { bg: '#fce4ec', text: '#880e4f', border: '#f8bbd0' },
        { bg: '#f3e5f5', text: '#4a148c', border: '#e1bee7' },
        { bg: '#e8eaf6', text: '#1a237e', border: '#c5cae9' },
        { bg: '#e0f2f1', text: '#004d40', border: '#b2dfdb' },
        { bg: '#fff8e1', text: '#ff6f00', border: '#ffecb3' },
    ];

    // Kategori dengan tipe paket
    const packageCategories = [39, 40];

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
                sampels: []
            };
        });

        sampelsData.forEach(sampel => {
            const categoryId = sampel.category_id;
            if (groups[categoryId]) {
                groups[categoryId].sampels.push(sampel);
            }
        });

        return groups;
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
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

    // Fungsi untuk memilih semua sampel dalam kategori paket
    const toggleAllSampelsInPackage = (categoryId) => {
        const categorySampels = groupedSampels[categoryId]?.sampels || [];
        const allSelected = categorySampels.every(sampel =>
            selectedSampels.includes(sampel.id)
        );

        if (allSelected) {
            // Hapus semua sampel dari kategori ini
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
            // Tambahkan semua sampel dari kategori ini
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
        if (qty >= 1) {
            setQuantities(prev => ({
                ...prev,
                [sampelId]: qty
            }));
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

    // Hitung total untuk kategori paket
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

    // Cek apakah semua sampel dalam kategori paket sudah dipilih
    const isAllSampelsSelected = (categoryId) => {
        const categorySampels = groupedSampels[categoryId]?.sampels || [];
        if (categorySampels.length === 0) return false;

        return categorySampels.every(sampel =>
            selectedSampels.includes(sampel.id)
        );
    };

    const submitOrder = async () => {
        setIsSubmitting(true);

        try {
            // Format data sesuai dengan yang diharapkan backend
            const orderData = selectedSampels.map(sampelId => ({
                sampel_id: sampelId,
                qty: quantities[sampelId] || 1
            }));

            console.log("Data order:", orderData); // Untuk debugging

            const response = await Api.post("/api/order", {
                items: orderData
            });

            toast.success(`✅ Pesanan berhasil dibuat! Total: ${formatCurrency(calculateOrderSummary().totalPrice)}`, {
                position: "top-right",
                autoClose: 5000,
            });

            setSelectedSampels([]);
            setQuantities({});
            setShowOrderModal(false);

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

    return (
        <LayoutAdmin>
            <div className="page-header">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle text-muted">Pemesanan</div>
                            <h2 className="page-title">Pilih Sampel</h2>
                            <div className="text-muted mt-1">
                                Pilih sampel yang ingin dipesan dari berbagai kategori
                            </div>
                        </div>
                        <div className="col-auto ms-auto">
                            <div className="btn-list">
                                {selectedSampels.length > 0 && (
                                    <button
                                        onClick={() => setShowOrderModal(true)}
                                        className="btn btn-success"
                                    >
                                        <IconShoppingCart size={18} className="me-1" />
                                        Buat Pesanan ({selectedSampels.length})
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

                                <button
                                    onClick={toggleAllCategories}
                                    className="btn btn-outline-secondary"
                                    disabled={isLoading || Object.keys(groupedSampels).length === 0}
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

            <div className="page-body">
                <div className="container-xl">
                    {/* Order Summary Bar */}
                    {selectedSampels.length > 0 && (
                        <div className="alert alert-success d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <strong>{selectedSampels.length} sampel</strong> dipilih •
                                <strong> {orderSummary.totalItems} item</strong> •
                                Total: <strong>{formatCurrency(orderSummary.totalPrice)}</strong>
                            </div>
                            <div className="btn-group">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                        setSelectedSampels([]);
                                        setQuantities({});
                                    }}
                                >
                                    Batalkan
                                </button>
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => setShowOrderModal(true)}
                                >
                                    <IconCheck size={16} className="me-1" />
                                    Pesan Sekarang
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-12 mb-4">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Cari Sampel</h3>
                                </div>
                                <div className="card-body">
                                    <div className="row g-2 align-items-center">
                                        <div className="col">
                                            <label className="form-label">Cari berdasarkan nama sampel</label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <IconSearch size={18} />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={keywords}
                                                    onChange={(e) => setKeywords(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    placeholder="Ketik nama sampel dan tekan Enter..."
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
                                                <button
                                                    onClick={searchHandlder}
                                                    className="btn btn-primary"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? "Mencari..." : "Cari"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 className="card-title">Daftar Sampel Tersedia</h3>
                                            <div className="text-muted">
                                                <IconCategory size={16} className="me-1" />
                                                {Object.keys(groupedSampels).length} kategori • {sampels.length} sampel
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body p-0">
                                    {isLoading ? (
                                        <div className="text-center p-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                            <p className="mt-2">Memuat data sampel...</p>
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

                                                        return (
                                                            <div key={categoryId} className="category-group">
                                                                <div
                                                                    className="category-header p-3 d-flex justify-content-between align-items-center cursor-pointer"
                                                                    onClick={() => toggleCategory(categoryId)}
                                                                    style={{
                                                                        backgroundColor: color.bg,
                                                                        borderLeft: `4px solid ${color.text}`,
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="me-2" style={{ color: color.text }}>
                                                                            {expandedCategories[categoryId] ?
                                                                                <IconChevronUp /> :
                                                                                <IconChevronDown />
                                                                            }
                                                                        </div>
                                                                        <h4
                                                                            className="m-0 fw-semibold"
                                                                            style={{ color: color.text }}
                                                                        >
                                                                            {categoryData.category.name}
                                                                            {isPackage && (
                                                                                <span className="badge bg-azure-lt text-azure ms-2">
                                                                                    <IconPackage size={12} className="me-1" />
                                                                                    Paket
                                                                                </span>
                                                                            )}
                                                                            {hasSampels && (
                                                                                <span
                                                                                    className="badge ms-2"
                                                                                    style={{
                                                                                        backgroundColor: color.text,
                                                                                        color: 'white'
                                                                                    }}
                                                                                >
                                                                                    {categoryData.sampels.length} sampel
                                                                                </span>
                                                                            )}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        {isPackage && hasSampels && packageTotal > 0 && (
                                                                            <div className="me-3 fw-bold" style={{ color: color.text }}>
                                                                                Total: {formatCurrency(packageTotal)}
                                                                            </div>
                                                                        )}
                                                                        <div className="text-muted small">
                                                                            {hasSampels ?
                                                                                `Klik untuk ${expandedCategories[categoryId] ? 'menutup' : 'membuka'}` :
                                                                                'Tidak ada sampel'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {expandedCategories[categoryId] && hasSampels && (
                                                                    <div className="table-responsive">
                                                                        <table className="table table-hover table-mobile-md card-table mb-0">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th width="5%">
                                                                                        {isPackage ? (
                                                                                            <div className="form-check">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    className="form-check-input"
                                                                                                    checked={allSelected}
                                                                                                    onChange={() => toggleAllSampelsInPackage(categoryId)}
                                                                                                />
                                                                                                <label className="form-check-label small">Semua</label>
                                                                                            </div>
                                                                                        ) : (
                                                                                            "Pilih"
                                                                                        )}
                                                                                    </th>
                                                                                    <th width="60%">Nama Parameter</th>
                                                                                    <th width="20%">Harga</th>
                                                                                    <th width="15%">Jumlah</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {categoryData.sampels.map((sampel, index) => (
                                                                                    <tr key={`${categoryId}-${index}`}
                                                                                        className={selectedSampels.includes(sampel.id) ? "table-success" : ""}>
                                                                                        <td data-label="Pilih" className="text-center">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="form-check-input"
                                                                                                checked={selectedSampels.includes(sampel.id)}
                                                                                                onChange={() => toggleSampelSelection(sampel.id)}
                                                                                            />
                                                                                        </td>
                                                                                        <td data-label="Parameter">
                                                                                            <div className="d-flex align-items-center">
                                                                                                <div
                                                                                                    className="flex-fill fw-medium"
                                                                                                    style={{ color: color.text }}
                                                                                                >
                                                                                                    {sampel.parameter || 'Tidak ada parameter'}
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td data-label="Harga">
                                                                                            <div className={sampel.price_sell ? "fw-semibold" : "text-muted"}>
                                                                                                {sampel.price_sell ? formatCurrency(sampel.price_sell) : 'Harga tidak tersedia'}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td data-label="Jumlah">
                                                                                            {selectedSampels.includes(sampel.id) ? (
                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="1"
                                                                                                    className="form-control form-control-sm"
                                                                                                    value={quantities[sampel.id] || 1}
                                                                                                    onChange={(e) => updateQuantity(sampel.id, e.target.value)}
                                                                                                    style={{ width: '80px' }}
                                                                                                />
                                                                                            ) : (
                                                                                                <span className="text-muted">-</span>
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center p-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <div className="bg-azure-lt p-4 rounded-circle mb-3">
                                                            <IconSearch size={32} className="text-azure" />
                                                        </div>
                                                        <h3 className="h5">Data tidak ditemukan</h3>
                                                        <p className="text-muted">
                                                            {keywords
                                                                ? `Tidak ada hasil untuk "${keywords}". Coba dengan kata kunci lain.`
                                                                : "Belum ada data sampel yang tersedia."}
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

            {/* Order Modal */}
            {showOrderModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Konfirmasi Pesanan</h5>
                                <button type="button" className="btn-close" onClick={() => setShowOrderModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info mb-3">
                                    <IconInfoCircle size={18} className="me-2" />
                                    Pastikan data pesanan sudah benar sebelum mengirimkan.
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Nama Sampel</th>
                                                <th>Jumlah</th>
                                                <th>Harga Satuan</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSampels.map(sampelId => {
                                                const sampel = sampels.find(s => s.id === sampelId);
                                                const qty = quantities[sampelId] || 1;
                                                const subtotal = sampel && sampel.price_sell ? qty * sampel.price_sell : 0;

                                                return sampel ? (
                                                    <tr key={sampelId}>
                                                        <td>{sampel.parameter}</td>
                                                        <td>{qty}</td>
                                                        <td>{sampel.price_sell ? formatCurrency(sampel.price_sell) : 'N/A'}</td>
                                                        <td>{formatCurrency(subtotal)}</td>
                                                    </tr>
                                                ) : null;
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan="3" className="text-end">Total:</th>
                                                <th>{formatCurrency(orderSummary.totalPrice)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                                    Kembali
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={submitOrder}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Memproses...
                                        </>
                                    ) : (
                                        'Konfirmasi Pesanan'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .cursor-pointer {
                    cursor: pointer;
                }
                .category-group {
                    transition: all 0.3s ease;
                    border-bottom: 1px solid #e9ecef;
                }
                .category-group:last-child {
                    border-bottom: none;
                }
                .category-header:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .table th {
                    border-top: none;
                    font-weight: 600;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    color: #5c6b7a;
                    background-color: #f8f9fa;
                }
                .table tr:hover {
                    background-color: #f8f9fa;
                }
                .table-success {
                    background-color: rgba(25, 135, 84, 0.1) !important;
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
            `}</style>
        </LayoutAdmin>
    )
}