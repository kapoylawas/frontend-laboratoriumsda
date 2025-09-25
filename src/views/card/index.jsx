import { useState, useEffect } from "react";
import LayoutAdmin from "../../layouts/admin";
import Cookies from "js-cookie";
import Api from "../../services/api";

export default function Cart() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});

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
                    bgColor: getCategoryBgColor(categoryName)
                };
            }
            acc[categoryName].items.push(item);
            acc[categoryName].total += item.price * item.qty;
            acc[categoryName].itemCount += item.qty;
            return acc;
        }, {});
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
                            <div className="page-pretitle text-muted">History Pemesanan</div>
                            <h2 className="page-title">Sampel Yang Dipesan</h2>
                        </div>
                        <div className="col-auto">
                            <div className="btn-list">
                                <span className="badge bg-blue-lt">Total Kategori: {totalCategories}</span>
                                <span className="badge bg-green-lt">Total Sampel: {totalSamples}</span>
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
                                            <span className="bg-primary text-white avatar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                    <path d="M9 17h6" />
                                                    <path d="M9 13h6" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Total Kategori</div>
                                            <div className="text-muted">{totalCategories} Kategori</div>
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
                                            <span className="bg-green text-white avatar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152a3 3 0 0 1 -2.966 2.544h-6.852a3 3 0 0 1 -2.965 -2.544l-1.255 -8.152a2 2 0 0 1 1.977 -2.304z" />
                                                    <path d="M9 11v-5a3 3 0 0 1 6 0v5" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Total Sampel</div>
                                            <div className="text-muted">{totalSamples} Item</div>
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
                                            <span className="bg-orange text-white avatar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 -3 3v6a3 3 0 0 0 3 3h4a3 3 0 0 0 3 -3v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1h2a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-2a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h2a1 1 0 0 0 1 -1z" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Total Items</div>
                                            <div className="text-muted">{totalItems} Pemesanan</div>
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
                                            <span className="bg-red text-white avatar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                                    <path d="M9 12l2 2l4 -4" />
                                                    <path d="M12 3v9" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="col">
                                            <div className="font-weight-medium">Total Biaya</div>
                                            <div className="text-muted">{formatCurrency(grandTotal)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="card">
                        <div className="card-body p-0">
                            {Object.keys(groupedData).length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="empty">
                                        <div className="empty-img">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-shopping-cart-off" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                                <path d="M17 17a2 2 0 1 0 2 2" />
                                                <path d="M17 17h-11v-11" />
                                                <path d="M9.239 5.231l10.761 .769l-1 7h-2m-4 0h-7" />
                                                <path d="M3 3l18 18" />
                                            </svg>
                                        </div>
                                        <p className="empty-title">Tidak ada sampel/parameter yang dipesan</p>
                                        <p className="empty-subtitle text-muted">
                                            Belum ada sampel/parameter yang ditambahkan ke dalam keranjang pemesanan.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {Object.entries(groupedData).map(([categoryName, categoryData]) => (
                                        <div key={categoryName} className={`category-section ${categoryData.bgColor} border-0`}>
                                            <div
                                                className="category-header p-4 cursor-pointer hover:bg-opacity-75 transition-colors"
                                                onClick={() => toggleCategory(categoryName)}
                                            >
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <div className={`category-badge bg-gradient-to-r ${categoryData.color} text-white rounded-pill px-3 py-1 me-3`}>
                                                            <span className="fw-bold">{categoryData.itemCount} Sampel</span>
                                                        </div>
                                                        <h4 className="mb-0 text-dark">{categoryName}</h4>
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <span className="text-muted me-3 fw-bold">
                                                            {formatCurrency(categoryData.total)}
                                                        </span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className={`icon icon-tabler icon-tabler-chevron-down transition-transform ${expandedCategories[categoryName] ? 'rotate-180' : ''
                                                                }`}
                                                            width="24"
                                                            height="24"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                            <path d="M6 9l6 6l6 -6" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedCategories[categoryName] && (
                                                <div className="category-content px-4 pb-4">
                                                    <div className="row">
                                                        {categoryData.items.map((item, index) => (
                                                            <div key={item.id} className="col-md-6 col-lg-4 mb-3">
                                                                <div className="card card-sm hover-shadow">
                                                                    <div className="card-body">
                                                                        <div className="d-flex align-items-center">
                                                                            <span className={`avatar avatar-sm rounded me-3 bg-${getCategoryColor(categoryName).split('-')[1]}-lt`}>
                                                                                {index + 1}
                                                                            </span>
                                                                            <div className="flex-fill">
                                                                                <div className="fw-bold">{item.sampel.name}</div>
                                                                                <div className="text-muted small">
                                                                                    Qty: {item.qty} × {formatCurrency(item.price)}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-end">
                                                                                <div className="fw-bold text-primary">
                                                                                    {formatCurrency(item.price * item.qty)}
                                                                                </div>
                                                                                <div className="text-muted small">
                                                                                    {formatDate(item.created_at)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {Object.keys(groupedData).length > 0 && (
                            <div className="card-footer">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h5 className="mb-1">Total Keseluruhan</h5>
                                        <p className="text-muted mb-0">{totalSamples} sampel dalam {totalCategories} kategori</p>
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
                }
                .avatar {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    font-weight: 600;
                }
                .avatar-sm {
                    width: 1.5rem;
                    height: 1.5rem;
                    font-size: 0.75rem;
                }
                .bg-pink-lt { background-color: #fdf2f8; color: #be185d; }
                .bg-blue-lt { background-color: #eff6ff; color: #1d4ed8; }
                .bg-green-lt { background-color: #f0fdf4; color: #15803d; }
                .bg-orange-lt { background-color: #fff7ed; color: #c2410c; }
                .bg-red-lt { background-color: #fef2f2; color: #dc2626; }

                .category-section {
                    transition: all 0.3s ease;
                }

                .category-section:not(:last-child) {
                    margin-bottom: 1rem;
                }

                .category-header {
                    transition: background-color 0.2s ease;
                }

                .category-header:hover {
                    background-color: rgba(0, 0, 0, 0.02);
                }

                .card-sm {
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
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

                .empty-img svg {
                    width: 4rem;
                    height: 4rem;
                    opacity: 0.5;
                }

                .empty-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .empty-subtitle {
                    font-size: 0.875rem;
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
                }   
            `}</style>
        </LayoutAdmin>
    );
}