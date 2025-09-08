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
    IconInfoCircle
} from "@tabler/icons-react";
import SampelCreate from './create';
import SampelEdit from './edit';
import DeleteButton from '../../components/DeleteButton';

export default function Sampels() {
    const [sampels, setSampel] = useState([]);
    const [groupedSampels, setGroupedSampels] = useState(new Map());
    const [expandedCategories, setExpandedCategories] = useState({});
    const [categories, setCategories] = useState({});

    //state loading
    const [isLoading, setIsLoading] = useState(true);

    //define state "pagination"
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 0,
        total: 0
    });

    const [keywords, setKeywords] = useState("");

    // Daftar warna untuk kategori
    const categoryColors = [
        { bg: '#e3f2fd', text: '#0d47a1', border: '#bbdefb' }, // Biru muda
        { bg: '#e8f5e9', text: '#1b5e20', border: '#c8e6c9' }, // Hijau muda
        { bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' }, // Oranye muda
        { bg: '#fce4ec', text: '#880e4f', border: '#f8bbd0' }, // Merah muda
        { bg: '#f3e5f5', text: '#4a148c', border: '#e1bee7' }, // Ungu muda
        { bg: '#e8eaf6', text: '#1a237e', border: '#c5cae9' }, // Nila muda
        { bg: '#e0f2f1', text: '#004d40', border: '#b2dfdb' }, // Teal muda
        { bg: '#fff8e1', text: '#ff6f00', border: '#ffecb3' }, // Kuning muda
    ];

    const getCategoryColor = (categoryId) => {
        // Generate index warna berdasarkan ID kategori
        const index = parseInt(categoryId) % categoryColors.length;
        return categoryColors[index];
    };

    const fetchData = async (pageNumber, keywords = "") => {
        setIsLoading(true);

        const page = pageNumber ? pageNumber : pagination.currentPage;
        const token = Cookies.get("token");

        if (token) {
            Api.defaults.headers.common["Authorization"] = token;

            try {
                // Ambil semua kategori terlebih dahulu
                const categoriesResponse = await Api.get('/api/categories');
                const categoriesMap = {};
                categoriesResponse.data.data.forEach(category => {
                    categoriesMap[category.id.toString()] = category;
                });

                //fetch data sampel dari API dengan Axios
                const response = await Api.get(
                    `/api/sampels?page=${page}&search=${keywords}`
                );

                // Debug: Log data yang diterima
                console.log('Raw sampels data:', response.data.data);
                console.log('Raw categories data:', categoriesResponse.data.data);

                // Group sampels by category_id
                const grouped = groupSampelsByCategoryId(response.data.data, categoriesMap);

                // Debug: Log grouped data
                console.log('Grouped result:', grouped);

                // PERBAIKAN: Gunate functional update untuk avoid race condition
                setCategories(prev => ({ ...prev, ...categoriesMap }));
                setSampel(response.data.data);
                setGroupedSampels(grouped);

                // Handle expanded state
                setExpandedCategories(prev => {
                    const newExpandedState = { ...prev };

                    Object.keys(categoriesMap).forEach(categoryId => {
                        const idStr = categoryId.toString();
                        if (newExpandedState[idStr] === undefined) {
                            newExpandedState[idStr] = true;
                        }
                    });

                    return newExpandedState;
                });

                setPagination({
                    currentPage: response.data.pagination.currentPage,
                    perPage: response.data.pagination.perPage,
                    total: response.data.pagination.total
                });

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

    // Function to group sampels by category_id - termasuk kategori tanpa sampel
    const groupSampelsByCategoryId = (sampelsData, categoriesMap) => {
        const groups = {};

        // Buat grup untuk semua kategori, termasuk yang tidak memiliki sampel
        Object.keys(categoriesMap).forEach(categoryId => {
            // Pastikan key konsisten (gunakan string)
            const idStr = categoryId.toString();
            groups[idStr] = {
                category: categoriesMap[categoryId],
                sampels: []
            };
        });

        // Isi dengan sampel yang sesuai - pastikan handling konsisten
        sampelsData.forEach(sampel => {
            const categoryId = sampel.category_id?.toString();
            if (categoryId && groups[categoryId]) {
                // Pastikan tidak ada duplikasi sampel dalam kategori yang sama
                const existingSampel = groups[categoryId].sampels.find(
                    s => s.id === sampel.id
                );

                if (!existingSampel) {
                    groups[categoryId].sampels.push(sampel);
                } else {
                    console.warn(`Duplicate sampel detected: ${sampel.id}`);
                }
            } else if (categoryId) {
                console.warn(`Kategori dengan ID ${categoryId} tidak ditemukan dalam categoriesMap`);
            }
        });

        return groups;
    };

    // Toggle expand/collapse for a category
    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    // Toggle expand/collapse all categories
    const toggleAllCategories = () => {
        const allExpanded = Object.values(expandedCategories).every(val => val);
        const newState = {};
        Object.keys(expandedCategories).forEach(categoryId => {
            newState[categoryId] = !allExpanded;
        });
        setExpandedCategories(newState);
    };

    useEffect(() => {
        // Check untuk duplikasi dalam groupedSampels
        const checkForDuplicates = () => {
            Object.entries(groupedSampels).forEach(([categoryId, categoryData]) => {
                const sampelIds = new Set();
                const duplicates = [];

                categoryData.sampels.forEach(sampel => {
                    if (sampelIds.has(sampel.id)) {
                        duplicates.push(sampel.id);
                    }
                    sampelIds.add(sampel.id);
                });

                if (duplicates.length > 0) {
                    console.error(`DUPLICATES FOUND in category ${categoryId}:`, duplicates);
                }
            });
        };

        if (Object.keys(groupedSampels).length > 0) {
            checkForDuplicates();
        }
    }, [groupedSampels]);

    useEffect(() => {
        fetchData();

        // Cleanup function untuk avoid memory leaks
        return () => {
            setGroupedSampels({});
            setExpandedCategories({});
        };
    }, []);

    //function "searchHandler"
    const searchHandlder = () => {
        //call function "fetchDataPost" with params
        fetchData(1, keywords);
    };

    //function "handleKeyDown"
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            searchHandlder();
        }
    };

    //function untuk reset pencarian
    const resetSearch = () => {
        setKeywords("");
        fetchData(1, "");
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <LayoutAdmin>
            <div className="page-header">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle text-muted">Manajemen</div>
                            <h2 className="page-title">Data Sampel</h2>
                            <div className="text-muted mt-1">
                                Kelola data sampel yang dikelompokkan berdasarkan kategori
                            </div>
                        </div>
                        <div className="col-auto ms-auto">
                            <div className="btn-list">
                                <button
                                    onClick={() => fetchData()}
                                    className="btn btn-outline-primary"
                                    disabled={isLoading}
                                >
                                    <IconRefresh size={18} className="me-1" />
                                    {isLoading ? "Memuat..." : "Refresh"}
                                </button>
                                <SampelCreate fetchData={fetchData} />
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
                    <div className="row">
                        <div className="col-12 mb-4">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Pencarian Sampel</h3>
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
                                                    placeholder="Masukkan nama sampel... & Tekan Enter untuk mencari atau gunakan tombol Cari"
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
                                            <h3 className="card-title">Daftar Sampel</h3>
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
                                                        // Pastikan categoryId adalah string untuk konsistensi
                                                        const categoryIdStr = categoryId.toString();
                                                        const color = getCategoryColor(categoryIdStr);
                                                        return (
                                                            <div key={`category-${categoryIdStr}`} className="category-group">
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
                                                                            <span
                                                                                className="badge ms-2"
                                                                                style={{
                                                                                    backgroundColor: color.text,
                                                                                    color: 'white'
                                                                                }}
                                                                            >
                                                                                {categoryData.sampels.length} sampel
                                                                            </span>
                                                                        </h4>
                                                                    </div>
                                                                    <div className="text-muted small">
                                                                        Klik untuk {expandedCategories[categoryId] ? 'menutup' : 'membuka'}
                                                                    </div>
                                                                </div>
                                                                {expandedCategories[categoryId] && (
                                                                    <div className="table-responsive">
                                                                        <table className="table table-hover table-mobile-md card-table mb-0">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th width="60%">Nama Parameter</th>
                                                                                    <th width="30%">Harga</th>
                                                                                    <th width="10%" className="text-center">Aksi</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {categoryData.sampels.length > 0 ? (
                                                                                    categoryData.sampels.map((sampel, index) => (
                                                                                        <tr key={`${categoryId}-${index}`}>
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
                                                                                                    {sampel.price_sell ? formatCurrency(sampel.price_sell) : 'Harga tidak tersedia atau 0'}
                                                                                                </div>
                                                                                            </td>
                                                                                            <td>
                                                                                                <div className="btn-list justify-content-center">
                                                                                                    <SampelEdit sampelsId={sampel.id} fetchData={fetchData} />
                                                                                                    <DeleteButton id={sampel.id} endpoint="/api/sampels" fetchData={fetchData} />
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan="3" className="text-center py-4">
                                                                                            <div className="d-flex flex-column align-items-center text-muted">
                                                                                                <IconInfoCircle size={24} className="mb-2" />
                                                                                                Tidak ada sampel dalam kategori ini
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
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

                                {sampels.length > 0 && (
                                    <div className="card-footer">
                                        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between">
                                            <div className="text-muted mb-2 mb-md-0">
                                                Menampilkan {sampels.length} dari {pagination.total} sampel
                                            </div>
                                            <PaginationComponent
                                                currentPage={pagination.currentPage}
                                                perPage={pagination.perPage}
                                                total={pagination.total}
                                                onChange={(pageNumber) => fetchData(pageNumber, keywords)}
                                                position="end"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
            `}</style>
        </LayoutAdmin>
    )
}