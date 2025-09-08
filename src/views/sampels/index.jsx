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
} from "@tabler/icons-react";
import SampelCreate from './create';
import SampelEdit from './edit';
import DeleteButton from '../../components/DeleteButton';

export default function Sampels() {
    const [sampels, setSampel] = useState([]);
    const [groupedSampels, setGroupedSampels] = useState({});
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

    const fetchData = async (pageNumber, keywords = "") => {
        setIsLoading(true);

        //define variable "page"
        const page = pageNumber ? pageNumber : pagination.currentPage;

        //get token from cookies inside the function to ensure it's up-to-date
        const token = Cookies.get("token");

        if (token) {
            //set authorization header with token
            Api.defaults.headers.common["Authorization"] = token;

            try {
                // Ambil semua kategori terlebih dahulu
                const categoriesResponse = await Api.get('/api/categories');
                const categoriesMap = {};
                categoriesResponse.data.data.forEach(category => {
                    categoriesMap[category.id] = category;
                });
                setCategories(categoriesMap);

                //fetch data sampel dari API dengan Axios
                const response = await Api.get(
                    `/api/sampels?page=${page}&search=${keywords}`
                );

                //assign response data to state "sampel"
                setSampel(response.data.data);

                // Group sampels by category_id - termasuk kategori tanpa sampel
                const grouped = groupSampelsByCategoryId(response.data.data, categoriesMap);
                setGroupedSampels(grouped);

                // Initialize expanded state for categories
                const initialExpandedState = {};
                Object.keys(categoriesMap).forEach(categoryId => {
                    initialExpandedState[categoryId] = true; // Set all categories expanded by default
                });
                setExpandedCategories(initialExpandedState);

                //pagination
                setPagination(() => ({
                    currentPage: response.data.pagination.currentPage,
                    perPage: response.data.pagination.perPage,
                    total: response.data.pagination.total
                }));

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
            groups[categoryId] = {
                category: categoriesMap[categoryId],
                sampels: []
            };
        });

        // Isi dengan sampel yang sesuai
        sampelsData.forEach(sampel => {
            const categoryId = sampel.category_id;
            if (groups[categoryId]) {
                groups[categoryId].sampels.push(sampel);
            } else {
                // Jika kategori tidak ada dalam daftar kategori (seharusnya tidak terjadi)
                groups[categoryId] = {
                    category: { id: categoryId, name: `Kategori ${categoryId}` },
                    sampels: [sampel]
                };
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
        fetchData();
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
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle">HALAMAN</div>
                            <h2 className="page-title">SAMPELS</h2>
                        </div>
                        <div className="col-auto ms-auto">
                            <div className="btn-list">
                                <button
                                    onClick={() => fetchData()}
                                    className="btn btn-outline-primary d-none d-sm-inline-block"
                                    disabled={isLoading}
                                >
                                    <IconRefresh size={18} className="me-1" />
                                    {isLoading ? "Memuat..." : "Refresh"}
                                </button>
                                <SampelCreate fetchData={fetchData} />
                                <button
                                    onClick={toggleAllCategories}
                                    className="btn btn-outline-secondary d-none d-sm-inline-block"
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
                                    <h3 className="card-title">Pencarian & Filter</h3>
                                </div>
                                <div className="card-body">
                                    <div className="row g-2 align-items-center">
                                        <div className="col">
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
                                                    placeholder="Cari berdasarkan nama sampel..."
                                                    disabled={isLoading}
                                                />
                                                {keywords && (
                                                    <button
                                                        onClick={resetSearch}
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        disabled={isLoading}
                                                    >
                                                        Clear
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
                                <div className="card-header bg-transparent border-bottom-0 pb-0">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h3 className="card-title mb-1" style={{
                                                color: '#2c3e50',
                                                fontWeight: 700,
                                                fontSize: '1.4rem'
                                            }}>
                                                Daftar Sampel Berdasarkan Kategori
                                            </h3>
                                            <div className="d-flex align-items-center text-muted">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-category me-1" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M4 4h6v6h-6z" />
                                                    <path d="M14 4h6v6h-6z" />
                                                    <path d="M4 14h6v6h-6z" />
                                                    <path d="M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                                                </svg>
                                                <span style={{ fontSize: '0.9rem' }}>
                                                    {Object.keys(groupedSampels).length} kategori • {sampels.length} sampel
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <hr style={{
                                        borderTop: '2px solid #206bc4',
                                        opacity: 0.3,
                                        margin: 0
                                    }} />
                                </div>
                                <div className="table-responsive">
                                    {isLoading ? (
                                        <div className="text-center p-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                            <p className="mt-2">Memuat data sampel...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {Object.keys(groupedSampels).length > 0 ? (
                                                <div className="category-groups">
                                                    {Object.entries(groupedSampels).map(([categoryId, categoryData]) => (
                                                        <div key={categoryId} className="category-group border-bottom">
                                                            <div
                                                                className="category-header bg-blue-lt p-3 d-flex justify-content-between align-items-center cursor-pointer"
                                                                onClick={() => toggleCategory(categoryId)}
                                                            >
                                                                <h4 className="m-0">
                                                                    {categoryData.category.name}
                                                                    <span className="badge bg-blue ms-2">
                                                                        {categoryData.sampels.length} sampel
                                                                    </span>
                                                                </h4>
                                                                <span>
                                                                    {expandedCategories[categoryId] ?
                                                                        <IconChevronUp /> :
                                                                        <IconChevronDown />
                                                                    }
                                                                </span>
                                                            </div>
                                                            {expandedCategories[categoryId] && (
                                                                <table className="table table-vcenter table-mobile-md card-table mb-0">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Nama Parameter</th>
                                                                            <th>Harga</th>
                                                                            <th className="w-1 text-center">Aksi</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {categoryData.sampels.length > 0 ? (
                                                                            categoryData.sampels.map((sampel, index) => (
                                                                                <tr key={`${categoryId}-${index}`}>
                                                                                    <td data-label="Parameter">
                                                                                        <div className="position-relative d-inline-block">
                                                                                            <span className="badge bg-blue-lt cursor-pointer">
                                                                                                {sampel.parameter || 'Tidak ada parameter'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td data-label="Harga">
                                                                                        <div className="text-muted">
                                                                                            {sampel.price_sell ? formatCurrency(sampel.price_sell) : 'Harga tidak tersedia'}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td>
                                                                                        <div className="btn-list justify-content-center">
                                                                                            {/* Action buttons can be added here */}
                                                                                            <SampelEdit sampelsId={sampel.id} fetchData={fetchData} />
                                                                                            <DeleteButton id={sampel.id} endpoint="/api/sampels" fetchData={fetchData} />
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="3" className="text-center py-4">
                                                                                    <div className="text-muted">
                                                                                        Tidak ada sampel dalam kategori ini
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    ))}
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
                                                                : "Belum ada kategori yang tersedia."}
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
                                    <div className="card-footer d-flex align-items-center">
                                        <PaginationComponent
                                            currentPage={pagination.currentPage}
                                            perPage={pagination.perPage}
                                            total={pagination.total}
                                            onChange={(pageNumber) => fetchData(pageNumber, keywords)}
                                            position="center"
                                        />
                                        <small className="text-muted ms-auto">
                                            Menampilkan {sampels.length} dari {pagination.total} sampel
                                        </small>
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
                }
                .category-header:hover {
                    background-color: #e3f2fd !important;
                }
                
            `}</style>
        </LayoutAdmin>
    )
}