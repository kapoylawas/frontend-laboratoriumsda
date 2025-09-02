//import useState dan useEffect
import { useState, useEffect } from "react";

//import layout admin
import LayoutAdmin from "../../layouts/admin";

//import js cookie
import Cookies from "js-cookie";

//import service api
import Api from "../../services/api";

//import component pagination
import PaginationComponent from "../../components/Pagination";
import CategoryCreate from "./create";

//import icon untuk aksi
import {
    IconSearch,
    IconRefresh
} from "@tabler/icons-react";
import CategoryEdit from "./edit";
import DeleteButton from "../../components/DeleteButton";

export default function CategoriesIndex() {
    //state categories
    const [categories, setCategories] = useState([]);
    //state loading
    const [isLoading, setIsLoading] = useState(true);

    //define state "pagination"
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 0,
        total: 0
    });

    //state keyword
    const [keywords, setKeywords] = useState("");

    //define method "fetchData"
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
                //fetch data from API with Axios
                const response = await Api.get(
                    `/api/categories?page=${page}&search=${keywords}`
                );

                //assign response data to state "categories"
                setCategories(response.data.data);

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

    //call function "fetchData"
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

    return (
        <LayoutAdmin>
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <div className="page-pretitle">HALAMAN</div>
                            <h2 className="page-title">KATEGORI</h2>
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
                                <CategoryCreate fetchData={fetchData} />
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
                                                    placeholder="Cari berdasarkan nama kategori..."
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
                                <div className="card-header">
                                    <h3 className="card-title">Daftar Kategori</h3>
                                </div>
                                <div className="table-responsive">
                                    {isLoading ? (
                                        <div className="text-center p-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                            <p className="mt-2">Memuat data kategori...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <table className="table table-vcenter table-mobile-md card-table">
                                                <thead>
                                                    <tr>
                                                        <th>Nama Kategori</th>
                                                        <th>Jumlah Produk</th>
                                                        <th>Tanggal Dibuat</th>
                                                        <th className="w-1 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categories.length > 0 ? (
                                                        categories.map((category, index) => (
                                                            <tr key={index}>
                                                                <td data-label="Nama Kategori">
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="flex-fill">
                                                                            <div className="font-weight-medium text-reset">
                                                                                {category.name}
                                                                            </div>
                                                                            <div className="text-muted text-h5">
                                                                                {category.slug}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td data-label="Jumlah Produk">
                                                                    <span className="badge bg-blue-lt">
                                                                        {category.products_count || 0} Produk
                                                                    </span>
                                                                </td>
                                                                <td data-label="Tanggal Dibuat">
                                                                    <div className="text-muted">
                                                                        {new Date(category.created_at).toLocaleDateString('id-ID')}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="btn-list justify-content-center">
                                                                        <CategoryEdit categoryId={category.id} fetchData={fetchData} />
                                                                        <DeleteButton id={category.id} endpoint="/api/categories" fetchData={fetchData} />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="text-center py-4">
                                                                <div className="d-flex flex-column align-items-center">
                                                                    <div className="bg-azure-lt p-4 rounded-circle mb-3">
                                                                        <IconSearch size={32} className="text-azure" />
                                                                    </div>
                                                                    <h3 className="h5">Data tidak ditemukan</h3>
                                                                    <p className="text-muted">
                                                                        {keywords
                                                                            ? `Tidak ada hasil untuk "${keywords}". Coba dengan kata kunci lain.`
                                                                            : "Belum ada kategori yang tersedia. Mulai dengan menambahkan kategori pertama."}
                                                                    </p>
                                                                    {keywords ? (
                                                                        <button
                                                                            onClick={resetSearch}
                                                                            className="btn btn-primary"
                                                                        >
                                                                            Tampilkan Semua Kategori
                                                                        </button>
                                                                    ) : (
                                                                        <CategoryCreate fetchData={fetchData} variant="primary" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>

                                            {categories.length > 0 && (
                                                <div className="card-footer d-flex align-items-center">
                                                    <PaginationComponent
                                                        currentPage={pagination.currentPage}
                                                        perPage={pagination.perPage}
                                                        total={pagination.total}
                                                        onChange={(pageNumber) => fetchData(pageNumber, keywords)}
                                                        position="center"
                                                    />
                                                    <small className="text-muted ms-auto">
                                                        Menampilkan {categories.length} dari {pagination.total} kategori
                                                    </small>
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
        </LayoutAdmin>
    );
}