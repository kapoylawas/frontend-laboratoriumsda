import { useState, useEffect } from "react";
import LayoutAdmin from "../../layouts/admin";
import PaginationComponent from "../../components/Pagination";
import Cookies from "js-cookie";
import Api from "../../services/api";
import Swal from "sweetalert2";

export default function HasilIndex() {
  const [hasils, setHasils] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    hasil: "",
    metode: "",
    status: false,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
  });
  const [expandedCategories, setExpandedCategories] = useState({});

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const fetchData = async (pageNumber, keywords = "", date = "") => {
    setIsLoading(true);
    const page = pageNumber ? pageNumber : pagination.currentPage;
    const token = Cookies.get("token");

    if (token) {
      Api.defaults.headers.common["Authorization"] = token;
      try {
        const params = [`page=${page}`, `search=${keywords}`];
        if (date) params.push(`date=${date}`);
        const response = await Api.get(`/api/hasils?${params.join("&")}`);
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
        console.error("Error fetching data:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Gagal mengambil data hasil!",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
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
    fetchData(1, search, filterDate);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setFilterDate(newDate);
    fetchData(1, search, newDate);
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterDate("");
    fetchData(1, "", "");
  };

  // Group hasils by category
  const getGroupedByCategory = () => {
    const grouped = {};
    hasils.forEach((hasil) => {
      const catName = hasil.sampel?.category?.name || "Tanpa Kategori";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(hasil);
    });
    return grouped;
  };

  const toggleCategory = (catName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const getRowNumber = (globalIndex) => {
    if (!pagination || !pagination.currentPage || !pagination.perPage) {
      return globalIndex + 1;
    }
    return (pagination.currentPage - 1) * pagination.perPage + globalIndex + 1;
  };

  const handleEdit = (hasil) => {
    setEditingId(hasil.id);
    setEditForm({
      hasil: hasil.hasil || "",
      metode: hasil.metode || "",
      status: hasil.status || false,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ hasil: "", metode: "", status: false });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (id) => {
    try {
      if (!editForm.hasil.trim()) {
        Swal.fire({ icon: "warning", title: "Peringatan", text: "Hasil harus diisi!" });
        return;
      }
      if (!editForm.metode.trim()) {
        Swal.fire({ icon: "warning", title: "Peringatan", text: "Metode harus diisi!" });
        return;
      }

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
      if (!confirmResult.isConfirmed) return;

      Swal.fire({
        title: "Mengupdate data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const token = Cookies.get("token");
      if (!token) {
        Swal.fire({ icon: "error", title: "Error", text: "Token tidak ditemukan!" });
        return;
      }

      Api.defaults.headers.common["Authorization"] = token;
      const updateData = {
        hasil: editForm.hasil.trim(),
        metode: editForm.metode.trim(),
        status: editForm.status,
      };

      await Api.put(`/api/hasils/${id}`, updateData);

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data berhasil diupdate!",
        showConfirmButton: false,
        timer: 1500,
        position: "top",
        toast: true,
      });

      await fetchData(pagination.currentPage, search, filterDate);
      setEditingId(null);
      setEditForm({ hasil: "", metode: "", status: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Gagal mengupdate data!";
      Swal.fire({ icon: "error", title: "Gagal Update", text: errorMessage });
    }
  };

  const handleDelete = async (id) => {
    const confirmResult = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus data ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });
    if (!confirmResult.isConfirmed) return;

    Swal.fire({
      title: "Menghapus data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const token = Cookies.get("token");
    if (!token) {
      Swal.fire({ icon: "error", title: "Error", text: "Token tidak ditemukan!" });
      return;
    }

    Api.defaults.headers.common["Authorization"] = token;
    try {
      await Api.delete(`/api/hasils/${id}`);
      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data berhasil dihapus!",
        showConfirmButton: false,
        timer: 1500,
        position: "top",
        toast: true,
      });
      await fetchData(pagination.currentPage, search, filterDate);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Gagal menghapus data!";
      Swal.fire({ icon: "error", title: "Gagal Hapus", text: errorMessage });
    }
  };

  const getStatusBadge = (status) => {
    if (status) {
      return (
        <span className="badge bg-success">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", verticalAlign: "text-bottom" }}>
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" />
          </svg>
          Selesai
        </span>
      );
    }
    return (
      <span className="badge bg-warning text-dark">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", verticalAlign: "text-bottom" }}>
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.5 7h11" /><path d="M6.5 17h11" /><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" />
        </svg>
        Proses
      </span>
    );
  };

  const getCategoryColor = (catName) => {
    const colors = {
      "Kimia": "primary",
      "Mikrobiologi": "success",
      "Fisika": "info",
      "Biologi": "warning",
      "Tanpa Kategori": "secondary",
    };
    return colors[catName] || "primary";
  };

  const displayRange = () => {
    if (!pagination || pagination.total === 0) return { start: 0, end: 0 };
    const start = (pagination.currentPage - 1) * pagination.perPage + 1;
    const end = Math.min(pagination.currentPage * pagination.perPage, pagination.total);
    return { start, end };
  };

  const range = displayRange();

  return (
    <LayoutAdmin>
      <div className="page-wrapper">
        <div className="page-header d-print-none">
          <div className="container-xl">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title">Hasil Pemeriksaan</h2>
                <div className="text-muted mt-1">Kelola hasil pemeriksaan laboratorium</div>
              </div>
              <div className="col-auto ms-auto d-print-none">
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={handleClearFilters}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2" /><path d="M4 5v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2" /><path d="M20 19v-4h-4" /></svg>
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="container-xl">
            {/* Search Card */}
            <div className="card mb-3">
              <div className="card-body">
                <form onSubmit={handleSearch}>
                  <div className="row g-2 align-items-center">
                    <div className="col-md">
                      <div className="input-icon">
                        <span className="input-icon-addon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Cari hasil pemeriksaan..."
                        />
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="input-icon">
                        <span className="input-icon-addon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                        </span>
                        <input
                          type="date"
                          className="form-control"
                          value={filterDate}
                          onChange={handleDateChange}
                          style={{ minWidth: "180px" }}
                        />
                      </div>
                    </div>
                    <div className="col-auto">
                      <button type="submit" className="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                        Cari
                      </button>
                    </div>
                    {filterDate && (
                      <div className="col-auto">
                        <button type="button" className="btn btn-outline-warning" onClick={() => { setFilterDate(""); fetchData(1, search, ""); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                          Hapus Tanggal
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {isLoading ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
                  <p className="mt-3 text-muted">Memuat data hasil...</p>
                </div>
              </div>
            ) : hasils.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <div style={{ opacity: 0.4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M9 3h6v11l-3 3l-3 -3v-11z" />
                      <path d="M7 21h10" />
                      <path d="M9 14h6v3h-6z" />
                    </svg>
                    <p className="text-muted mb-0">Belum ada data hasil</p>
                    <small className="text-muted">Hasil akan muncul setelah pemohonan disetujui</small>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Grouped by Category */}
                {Object.entries(getGroupedByCategory()).map(([catName, items]) => {
                  const color = getCategoryColor(catName);
                  const isExpanded = expandedCategories[catName] !== false;
                  const completedCount = items.filter((i) => i.status).length;
                  const totalCount = items.length;

                  return (
                    <div className="card mb-3" key={catName}>
                      <div
                        className="card-header cursor-pointer"
                        onClick={() => toggleCategory(catName)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge bg-${color} me-2`} style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", verticalAlign: "text-bottom" }}>
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M9 3h6v11l-3 3l-3 -3v-11z" />
                                <path d="M7 21h10" />
                                <path d="M9 14h6v3h-6z" />
                              </svg>
                              {catName}
                            </span>
                            <span className="text-muted small">{totalCount} parameter</span>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <div className="progress" style={{ width: "120px", height: "6px" }}>
                              <div
                                className="progress-bar bg-success"
                                style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
                              ></div>
                            </div>
                            <span className="text-muted small">
                              {completedCount}/{totalCount} selesai
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                            >
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M6 9l6 6l6 -6" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="table-responsive">
                          <table className="table table-vcenter card-table">
                            <thead>
                              <tr>
                                <th style={{ width: "50px" }}>No</th>
                                <th>Parameter</th>
                                <th>Hasil</th>
                                <th>Metode</th>
                                <th className="text-center">Qty</th>
                                <th className="text-end">Harga</th>
                                <th className="text-center">Status</th>
                                <th>Pemohon</th>
                                <th className="text-center">Tanggal</th>
                                <th className="text-center" style={{ width: "120px" }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((hasil) => {
                                const globalIndex = hasils.indexOf(hasil);
                                return (
                                  <tr key={hasil.id}>
                                    <td className="text-muted">{getRowNumber(globalIndex)}</td>
                                    <td>
                                      <span className="badge bg-primary-lt">{hasil.sampel?.parameter || "-"}</span>
                                    </td>
                                    <td>
                                      {editingId === hasil.id ? (
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          name="hasil"
                                          value={editForm.hasil}
                                          onChange={handleInputChange}
                                          placeholder="Masukkan hasil"
                                          autoFocus
                                        />
                                      ) : (
                                        <span className={hasil.hasil && hasil.hasil !== "-" ? "fw-semibold" : "text-muted fst-italic"}>
                                          {hasil.hasil || "-"}
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {editingId === hasil.id ? (
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          name="metode"
                                          value={editForm.metode}
                                          onChange={handleInputChange}
                                          placeholder="Masukkan metode"
                                        />
                                      ) : hasil.metode && hasil.metode !== "-" ? (
                                        <span className="badge bg-info-lt">{hasil.metode}</span>
                                      ) : (
                                        <span className="text-muted fst-italic">-</span>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      <span className="badge bg-primary">{hasil.qty || 0}</span>
                                    </td>
                                    <td className="text-end fw-semibold">{formatCurrency(hasil.price || 0)}</td>
                                    <td className="text-center">
                                      {editingId === hasil.id ? (
                                        <label className="form-check form-switch d-inline-block">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="status"
                                            checked={editForm.status}
                                            onChange={handleInputChange}
                                          />
                                          <span className={`ms-2 small fw-semibold ${editForm.status ? "text-success" : "text-warning"}`}>
                                            {editForm.status ? "Selesai" : "Proses"}
                                          </span>
                                        </label>
                                      ) : (
                                        getStatusBadge(hasil.status)
                                      )}
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="avatar avatar-sm me-2" style={{ backgroundColor: "var(--tblr-success)", color: "white", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600" }}>
                                          {hasil.user?.name ? hasil.user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                                        </div>
                                        <span className="small">{hasil.user?.name || "-"}</span>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <span className="text-muted small">
                                        {hasil.created_at
                                          ? new Date(hasil.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                                          : "-"}
                                      </span>
                                      {hasil.created_at && (
                                        <br />
                                      )}
                                      {hasil.created_at && (
                                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                          {new Date(hasil.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      {editingId === hasil.id ? (
                                        <div className="btn-group">
                                          <button className="btn btn-sm btn-success" onClick={() => handleSave(hasil.id)} title="Simpan">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>
                                          </button>
                                          <button className="btn btn-sm btn-secondary" onClick={handleCancelEdit} title="Batal">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="btn-group">
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(hasil)} title="Edit">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.097 2.097 0 0 0 -2.955 -2.955l-8.56 8.56l-1.37 3.89l3.89 -1.37l8.56 -8.56z" /><path d="M16 4l4 4" /></svg>
                                          </button>
                                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(hasil.id)} title="Hapus">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan="5" className="text-end fw-bold text-muted">
                                  Subtotal {catName}
                                </td>
                                <td className="text-end">
                                  <span className="fw-bold text-primary">
                                    {formatCurrency(items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0))}
                                  </span>
                                </td>
                                <td colSpan="3"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Grand Total Card */}
                <div className="card mb-3">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted me-2">Grand Total:</span>
                      <span className="fs-3 fw-bold text-primary">
                        {formatCurrency(hasils.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0))}
                      </span>
                    </div>
                    <span className="badge bg-secondary">
                      {hasils.reduce((sum, i) => sum + (i.qty || 0), 0)} total qty
                    </span>
                  </div>
                </div>

                {/* Pagination */}
                {pagination.total > 0 && (
                  <div className="card">
                    <div className="card-footer d-flex justify-content-between align-items-center">
                      <span className="text-muted small">
                        Menampilkan {range.start} - {range.end} dari {pagination.total} hasil
                      </span>
                      <PaginationComponent
                        currentPage={pagination.currentPage}
                        perPage={pagination.perPage}
                        total={pagination.total}
                        onChange={(pageNumber) => fetchData(pageNumber, search, filterDate)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </LayoutAdmin>
  );
}
