import { useState, useEffect } from "react";
import LayoutAdmin from "../../layouts/admin";
import PaginationComponent from "../../components/Pagination";
import Cookies from "js-cookie";
import Api from "../../services/api";
import Swal from "sweetalert2";

// Import icons yang benar dari react-icons
import {
  BiCheckCircle,
  BiHourglass,
  BiSearch,
  BiRefresh,
  BiPencil,
  BiTrash,
  BiCheck,
  BiX,
  BiFolderOpen,
  BiUserCircle,
} from "react-icons/bi";

export default function HasilIndex() {
  const [hasils, setHasils] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    hasil: "",
    metode: "",
    price: "",
    qty: "",
    status: false,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchData = async (pageNumber, keywords = "") => {
    setIsLoading(true);
    const page = pageNumber ? pageNumber : pagination.currentPage;
    const token = Cookies.get("token");

    if (token) {
      Api.defaults.headers.common["Authorization"] = token;

      try {
        const response = await Api.get(
          `/api/hasils?page=${page}&search=${keywords}`,
        );

        console.log("API Response:", response.data);

        setHasils(response.data.data);

        if (response.data.pagination) {
          setPagination({
            currentPage: response.data.pagination.page || 1,
            perPage: response.data.pagination.limit || 10,
            total: response.data.pagination.total || 0,
            totalPages: response.data.pagination.totalPages || 1,
          });
        }
      } catch (error) {
        console.error("There was an error fetching the data!", error);

        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Gagal mengambil data!",
          footer: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error("Token is not available!");
      setIsLoading(false);

      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Token",
        text: "Silahkan login ulang!",
        timer: 2000,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(1, search);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status) => {
    return status ? (
      <span className="badge-selesai">
        <BiCheckCircle className="me-1" /> Selesai
      </span>
    ) : (
      <span className="badge-proses">
        <BiHourglass className="me-1" /> Proses
      </span>
    );
  };

  // Handle edit button click
  const handleEdit = (hasil) => {
    console.log("Editing item:", hasil); // Debugging

    setEditingId(hasil.id);
    setEditForm({
      hasil: hasil.hasil || "",
      metode: hasil.metode || "",
      price: hasil.price?.toString() || "0",
      qty: hasil.qty?.toString() || "1",
      status: hasil.status || false,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      hasil: "",
      metode: "",
      price: "",
      qty: "",
      status: false,
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    console.log("Input changed:", name, type === "checkbox" ? checked : value); // Debugging

    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle save/update dengan SweetAlert
  const handleSave = async (id) => {
    try {
      // Validasi data sebelum save
      if (!editForm.hasil.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Peringatan",
          text: "Hasil harus diisi!",
          timer: 2000,
          showConfirmButton: true,
        });
        return;
      }

      if (!editForm.metode.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Peringatan",
          text: "Metode harus diisi!",
          timer: 2000,
          showConfirmButton: true,
        });
        return;
      }

      // Konfirmasi sebelum update
      const confirmResult = await Swal.fire({
        title: "Konfirmasi Update",
        text: "Apakah Anda yakin ingin mengupdate data ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#0d6efd",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, Update!",
        cancelButtonText: "Batal",
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      // Tampilkan loading
      Swal.fire({
        title: "Mengupdate data...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const token = Cookies.get("token");
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Token tidak ditemukan! Silahkan login ulang.",
        });
        return;
      }

      // Set token
      Api.defaults.headers.common["Authorization"] = token;

      // Siapkan data untuk dikirim - Mengirim hasil, metode, dan status
      const updateData = {
        hasil: editForm.hasil.trim(),
        metode: editForm.metode.trim(),
        status: editForm.status, // Kirim status (boolean)
      };

      console.log("Sending update data to /api/hasils/" + id + ":", updateData);

      // Kirim request PUT
      const response = await Api.put(`/api/hasils/${id}`, updateData);

      console.log("Update response:", response.data);

      // Tampilkan notifikasi sukses di top center
      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: response.data.message || "Data berhasil diupdate!",
        showConfirmButton: false,
        timer: 1500,
        position: "top",
        toast: true,
      });

      // Refresh data
      await fetchData(pagination.currentPage, search);

      // Reset edit mode
      setEditingId(null);
      setEditForm({
        hasil: "",
        metode: "",
        price: "",
        qty: "",
        status: false,
      });
    } catch (error) {
      console.error("Error updating data:", error);

      // Tampilkan pesan error
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal mengupdate data!";

      Swal.fire({
        icon: "error",
        title: "Gagal Update",
        text: errorMessage,
        confirmButtonColor: "#dc3545",
      });
    }
  };

  // Handle delete dengan SweetAlert
  const handleDelete = async (id) => {
    try {
      // Konfirmasi sebelum delete
      const confirmResult = await Swal.fire({
        title: "Konfirmasi Hapus",
        text: "Apakah Anda yakin ingin menghapus data ini? Data yang dihapus tidak dapat dikembalikan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      });

      if (!confirmResult.isConfirmed) {
        return;
      }

      // Tampilkan loading
      Swal.fire({
        title: "Menghapus data...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const token = Cookies.get("token");
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Token tidak ditemukan! Silahkan login ulang.",
        });
        return;
      }

      Api.defaults.headers.common["Authorization"] = token;

      const response = await Api.delete(`/api/hasils/${id}`);

      console.log("Delete response:", response.data);

      // Tampilkan notifikasi sukses
      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: response.data.message || "Data berhasil dihapus!",
        showConfirmButton: false,
        timer: 1500,
        position: "top",
        toast: true,
      });

      // Refresh data
      await fetchData(pagination.currentPage, search);
    } catch (error) {
      console.error("Error deleting data:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal menghapus data!";

      Swal.fire({
        icon: "error",
        title: "Gagal Hapus",
        text: errorMessage,
        confirmButtonColor: "#dc3545",
      });
    }
  };

  // Handle refresh dengan SweetAlert
  const handleRefresh = () => {
    Swal.fire({
      title: "Memuat ulang data...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        fetchData(1, "");
        Swal.close();
      },
    });
  };

  // Hitung nomor urut dengan aman
  const getRowNumber = (index) => {
    if (!pagination || !pagination.currentPage || !pagination.perPage) {
      return index + 1;
    }
    return (pagination.currentPage - 1) * pagination.perPage + index + 1;
  };

  // Hitung range tampil data
  const getDisplayRange = () => {
    if (!pagination || pagination.total === 0) {
      return { start: 0, end: 0 };
    }

    const start = (pagination.currentPage - 1) * pagination.perPage + 1;
    const end = Math.min(
      pagination.currentPage * pagination.perPage,
      pagination.total,
    );

    return { start, end };
  };

  const displayRange = getDisplayRange();

  return (
    <LayoutAdmin>
      <div className="container-custom">
        {/* Search Bar */}
        <div className="search-section">
          <div>
            <button className="btn-refresh" onClick={handleRefresh}>
              <BiRefresh className="me-2" /> Refresh
            </button>
          </div>
          <div className="search-wrapper">
            <form onSubmit={handleSearch}>
              <div className="search-input-group">
                <span className="search-icon">
                  <BiSearch />
                </span>
                <input
                  type="text"
                  className="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                />
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          {isLoading ? (
            <div className="loading-wrapper">
              <div className="spinner"></div>
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th className="text-center">No</th>
                      <th>Hasil</th>
                      <th>Metode</th>
                      <th>Parameter</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Harga</th>
                      <th className="text-end">Total</th>
                      <th className="text-center">Status</th>
                      <th>User</th>
                      <th className="text-center">Tanggal</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasils.length > 0 ? (
                      hasils.map((hasil, index) => (
                        <tr key={hasil.id}>
                          <td className="text-center fw-bold">
                            {getRowNumber(index)}
                          </td>

                          {/* Hasil Column */}
                          <td>
                            {editingId === hasil.id ? (
                              <input
                                type="text"
                                className="edit-input"
                                name="hasil"
                                value={editForm.hasil}
                                onChange={handleInputChange}
                                placeholder="Masukkan hasil"
                                autoFocus
                              />
                            ) : (
                              <span className="hasil-text">
                                {hasil.hasil || "-"}
                              </span>
                            )}
                          </td>

                          {/* Metode Column */}
                          <td>
                            {editingId === hasil.id ? (
                              <input
                                type="text"
                                className="edit-input"
                                name="metode"
                                value={editForm.metode}
                                onChange={handleInputChange}
                                placeholder="Masukkan metode"
                              />
                            ) : (
                              hasil.metode || "-"
                            )}
                          </td>

                          {/* Parameter Column - TIDAK BISA DIEDIT */}
                          <td>
                            <span className="parameter-badge">
                              {hasil.sampel?.parameter || "-"}
                            </span>
                          </td>

                          {/* Qty Column - TIDAK BISA DIEDIT (READONLY) */}
                          <td className="text-center">
                            {editingId === hasil.id ? (
                              <input
                                type="number"
                                className="edit-input text-center"
                                value={hasil.qty || 0}
                                readOnly
                                disabled
                                style={{
                                  backgroundColor: "#f5f5f5",
                                  cursor: "not-allowed",
                                }}
                              />
                            ) : (
                              <span className="qty-text">{hasil.qty || 0}</span>
                            )}
                          </td>

                          {/* Price Column - TIDAK BISA DIEDIT (READONLY) */}
                          <td className="text-end">
                            {editingId === hasil.id ? (
                              <input
                                type="text"
                                className="edit-input text-end"
                                value={formatCurrency(hasil.price || 0)}
                                readOnly
                                disabled
                                style={{
                                  backgroundColor: "#f5f5f5",
                                  cursor: "not-allowed",
                                }}
                              />
                            ) : (
                              formatCurrency(hasil.price || 0)
                            )}
                          </td>

                          {/* Total Column - OTOMATIS */}
                          <td className="text-end total-price">
                            {formatCurrency(
                              (hasil.price || 0) * (hasil.qty || 0),
                            )}
                          </td>

                          {/* Status Column - BISA DIEDIT SEKARANG */}
                          <td className="text-center">
                            {editingId === hasil.id ? (
                              <div className="switch-wrapper">
                                <label className="switch-label-status">
                                  <input
                                    className="switch-input"
                                    type="checkbox"
                                    name="status"
                                    checked={editForm.status}
                                    onChange={handleInputChange}
                                  />
                                  <span
                                    className={`switch-status-text ${editForm.status ? "text-selesai" : "text-proses"}`}
                                  >
                                    {editForm.status ? "Selesai" : "Proses"}
                                  </span>
                                </label>
                              </div>
                            ) : (
                              getStatusBadge(hasil.status)
                            )}
                          </td>

                          {/* User Column */}
                          <td>
                            <div className="user-info">
                              <BiUserCircle />
                              {hasil.user?.name || "-"}
                            </div>
                          </td>

                          {/* Date Column */}
                          <td className="text-center">
                            <span className="date-text">
                              {hasil.created_at
                                ? new Date(hasil.created_at).toLocaleDateString(
                                    "id-ID",
                                  )
                                : "-"}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="text-center">
                            {editingId === hasil.id ? (
                              <div className="action-buttons">
                                <button
                                  className="btn-save"
                                  onClick={() => handleSave(hasil.id)}
                                  title="Simpan"
                                >
                                  <BiCheck />
                                </button>
                                <button
                                  className="btn-cancel"
                                  onClick={handleCancelEdit}
                                  title="Batal"
                                >
                                  <BiX />
                                </button>
                              </div>
                            ) : (
                              <div className="action-buttons">
                                <button
                                  className="btn-edit"
                                  onClick={() => handleEdit(hasil)}
                                  title="Edit Hasil, Metode & Status"
                                >
                                  <BiPencil />
                                </button>
                                <button
                                  className="btn-delete"
                                  title="Hapus"
                                  onClick={() => handleDelete(hasil.id)}
                                >
                                  <BiTrash />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Empty State
                      <tr>
                        <td colSpan="11" className="empty-state">
                          <BiFolderOpen />
                          <h5>Tidak ada data</h5>
                          <p>Belum ada data hasil yang tersedia.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Info */}
              {pagination.total > 0 && (
                <div className="pagination-wrapper">
                  <div className="pagination-info">
                    Menampilkan {displayRange.start} - {displayRange.end} dari{" "}
                    {pagination.total} hasil
                  </div>
                  <PaginationComponent
                    currentPage={pagination.currentPage}
                    perPage={pagination.perPage}
                    total={pagination.total}
                    onChange={(pageNumber) => fetchData(pageNumber, search)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .container-custom {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        /* Header Styles */
        .header-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e9ecef;
        }

        .logo-wrapper {
          background: linear-gradient(135deg, #0d6efd, #0b5ed7);
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(13, 110, 253, 0.25);
        }

        .logo-wrapper i {
          font-size: 1.5rem;
          color: white;
        }

        .title {
          font-weight: 700;
          color: #0d6efd;
          margin: 0;
          font-size: 1.8rem;
          letter-spacing: -0.5px;
        }

        .subtitle {
          color: #6c757d;
          margin: 0;
          font-size: 0.9rem;
        }

        /* Navigation Tabs */
        .nav-tabs-custom {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          padding: 0;
          list-style: none;
          flex-wrap: wrap;
        }

        .nav-tabs-custom li {
          margin: 0;
        }

        .nav-tabs-custom .nav-link {
          display: block;
          padding: 0.6rem 1.2rem;
          color: #495057;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
          background: transparent;
        }

        .nav-tabs-custom .nav-link:hover {
          background: #f8f9fa;
          color: #0d6efd;
        }

        .nav-tabs-custom .nav-link.active {
          background: #0d6efd;
          color: white;
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
        }

        /* Page Title */
        .page-title {
          margin-bottom: 2rem;
        }

        .page-title h3 {
          font-weight: 700;
          color: #212529;
          margin-bottom: 0.25rem;
          font-size: 1.75rem;
        }

        .page-title p {
          color: #6c757d;
          margin: 0;
        }

        /* Search Section */
        .search-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .btn-refresh {
          padding: 0.6rem 1.2rem;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          color: #495057;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .btn-refresh:hover {
          background: #f8f9fa;
          border-color: #0d6efd;
          color: #0d6efd;
        }

        .search-wrapper {
          width: 300px;
        }

        .search-input-group {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .search-input-group:focus-within {
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
        }

        .search-icon {
          padding: 0.6rem 0 0.6rem 1rem;
          color: #adb5bd;
          display: flex;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 0.6rem 1rem 0.6rem 0.5rem;
          border: none;
          outline: none;
          background: transparent;
        }

        /* Table Container */
        .table-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .table-custom {
          width: 100%;
          border-collapse: collapse;
        }

        .table-custom th {
          background: #f8f9fa;
          padding: 1rem 0.75rem;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          white-space: nowrap;
        }

        .table-custom td {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid #e9ecef;
          color: #212529;
        }

        .table-custom tbody tr:hover {
          background: #f8f9fa;
        }

        /* Badge Styles */
        .badge-selesai {
          display: inline-flex;
          align-items: center;
          padding: 0.4rem 1rem;
          background: #d1e7dd;
          color: #0f5132;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .badge-proses {
          display: inline-flex;
          align-items: center;
          padding: 0.4rem 1rem;
          background: #fff3cd;
          color: #856404;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .parameter-badge {
          display: inline-block;
          padding: 0.3rem 1rem;
          background: #e7f1ff;
          color: #0d6efd;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* Text Styles */
        .hasil-text {
          font-weight: 500;
          color: #212529;
        }

        .qty-text {
          font-weight: 600;
          color: #0d6efd;
        }

        .total-price {
          font-weight: 700;
          color: #0d6efd;
        }

        .date-text {
          color: #6c757d;
          font-size: 0.9rem;
        }

        /* User Info */
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #495057;
        }

        .user-info svg {
          color: #adb5bd;
          font-size: 1.1rem;
        }

        /* Edit Input */
        .edit-input {
          width: 100%;
          padding: 0.4rem 0.75rem;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          outline: none;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .edit-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
        }

        /* Switch Toggle untuk Status */
        .switch-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .switch-label-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .switch-input {
          width: 40px;
          height: 20px;
          cursor: pointer;
        }

        .switch-status-text {
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .text-selesai {
          color: #198754;
          background: #d1e7dd;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .text-proses {
          color: #856404;
          background: #fff3cd;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 0.4rem;
          justify-content: center;
        }

        .btn-edit,
        .btn-delete,
        .btn-save,
        .btn-cancel {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-edit {
          background: #e7f1ff;
          color: #0d6efd;
        }

        .btn-edit:hover {
          background: #0d6efd;
          color: white;
        }

        .btn-delete {
          background: #f8d7da;
          color: #dc3545;
        }

        .btn-delete:hover {
          background: #dc3545;
          color: white;
        }

        .btn-save {
          background: #d1e7dd;
          color: #198754;
        }

        .btn-save:hover {
          background: #198754;
          color: white;
        }

        .btn-cancel {
          background: #e9ecef;
          color: #6c757d;
        }

        .btn-cancel:hover {
          background: #6c757d;
          color: white;
        }

        /* Loading Spinner */
        .loading-wrapper {
          padding: 4rem;
          text-align: center;
        }

        .spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 3px solid #e9ecef;
          border-top-color: #0d6efd;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem !important;
          color: #6c757d;
        }

        .empty-state svg {
          font-size: 3rem;
          color: #dee2e6;
          margin-bottom: 1rem;
        }

        .empty-state h5 {
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #adb5bd;
          margin: 0;
        }

        /* Pagination */
        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }

        .pagination-info {
          color: #6c757d;
          font-size: 0.9rem;
        }

        /* Utility */
        .me-1 {
          margin-right: 0.25rem;
        }

        .me-2 {
          margin-right: 0.5rem;
        }

        .mt-3 {
          margin-top: 1rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .search-section {
            flex-direction: column;
            gap: 1rem;
          }

          .search-wrapper {
            width: 100%;
          }

          .pagination-wrapper {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .nav-tabs-custom {
            justify-content: center;
          }
        }
      `}</style>
    </LayoutAdmin>
  );
}
