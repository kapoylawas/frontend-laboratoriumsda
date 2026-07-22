import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHasil, setSelectedHasil] = useState(null);
  const [editForm, setEditForm] = useState({
    hasil: "",
    metode: "",
    status: false,
    satuan: "",
    kode_sampel: "",
    kadar_maksimal: "",
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

  const presetSatuanList = ['mg/L', 'mg/dL', 'MPN/100ml', 'CFU/ml', '°C', '%', 'NTU', '-'];
  const presetMetodeList = ['SNI 06-6989.11-2004', 'SNI 6989.2:2019', 'APHA 23rd Ed.'];

  const handleOpenEditModal = (hasil) => {
    setSelectedHasil(hasil);
    setEditForm({
      hasil: hasil.hasil || "",
      metode: hasil.metode || "",
      status: hasil.status || false,
      satuan: hasil.satuan || "",
      kode_sampel: hasil.kode_sampel || "",
      kadar_maksimal: hasil.kadar_maksimal || "",
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedHasil(null);
    setEditForm({ hasil: "", metode: "", status: false, satuan: "", kode_sampel: "", kadar_maksimal: "" });
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    if (!selectedHasil) return;

    try {
      if (!editForm.hasil.trim()) {
        Swal.fire({ icon: "warning", title: "Peringatan", text: "Hasil Uji harus diisi!", customClass: { container: 'swal-over-modal' } });
        return;
      }
      if (!editForm.metode.trim()) {
        Swal.fire({ icon: "warning", title: "Peringatan", text: "Metode harus diisi!", customClass: { container: 'swal-over-modal' } });
        return;
      }

      Swal.fire({
        title: "Mengupdate data...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
          // Force Swal above modal overlay (zIndex 9999)
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) swalContainer.style.zIndex = '99999';
        },
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
        satuan: editForm.satuan.trim(),
        kode_sampel: editForm.kode_sampel.trim(),
        kadar_maksimal: editForm.kadar_maksimal.trim(),
        status: editForm.status,
      };

      await Api.put(`/api/hasils/${selectedHasil.id}`, updateData);

      // Tutup modal dulu, lalu tampilkan notif sukses
      handleCloseEditModal();
      await fetchData(pagination.currentPage, search, filterDate);

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data hasil pemeriksaan berhasil disimpan.",
        showConfirmButton: false,
        timer: 2000,
        position: "top-end",
        toast: true,
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) swalContainer.style.zIndex = '99999';
        },
      });

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Gagal mengupdate data!";
      Swal.fire({
        icon: "error", title: "Gagal Update", text: errorMessage,
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) swalContainer.style.zIndex = '99999';
        },
      });
    }
  };

  const handleEdit = (hasil) => {
    handleOpenEditModal(hasil);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ hasil: "", metode: "", status: false, satuan: "", kode_sampel: "", kadar_maksimal: "" });
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
        satuan: editForm.satuan.trim(),
        kode_sampel: editForm.kode_sampel.trim(),
        kadar_maksimal: editForm.kadar_maksimal.trim(),
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
      setEditForm({ hasil: "", metode: "", status: false, satuan: "", kode_sampel: "", kadar_maksimal: "" });
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
          <div className="container-fluid px-3 px-lg-4">
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
          <div className="container-fluid px-3 px-lg-4">
            {/* Workflow Step Banner */}
            <div className="card mb-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', borderLeft: '5px solid #2fb344' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 text-start">
                  <div className="d-flex align-items-center gap-3">
                    <div className="badge bg-success fs-6 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      2
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">Langkah 2 dari 3: Pengisian Hasil Uji Laboratorium</h5>
                      <small className="text-muted">Setelah Penjadwalan Selesai ➜ <strong>Isi Hasil Uji & Satuan</strong> ➜ Lalu lanjut ke Berita Acara</small>
                    </div>
                  </div>
                  <Link to="/berita-acara" className="btn btn-sm btn-success fw-bold text-white px-3 py-2 rounded-pill shadow-sm">
                    Lanjut ke Langkah 3: Berita Acara ➔
                  </Link>
                </div>
              </div>
            </div>

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
                                <th>Kode Sampel</th>
                                <th>Parameter</th>
                                <th>Hasil</th>
                                <th>Satuan</th>
                                <th>Kadar Maksimal</th>
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
                                      {editingId === hasil.id ? (
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          name="kode_sampel"
                                          value={editForm.kode_sampel}
                                          onChange={handleInputChange}
                                          placeholder="Kode Sampel"
                                        />
                                      ) : hasil.kode_sampel ? (
                                        <span className="badge bg-secondary-lt font-monospace">{hasil.kode_sampel}</span>
                                      ) : (
                                        <span className="text-muted fst-italic">-</span>
                                      )}
                                    </td>
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
                                        <span className={hasil.hasil && hasil.hasil !== "-" ? "fw-bold text-dark" : "text-muted fst-italic"}>
                                          {hasil.hasil || "-"}
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {editingId === hasil.id ? (
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          name="satuan"
                                          value={editForm.satuan}
                                          onChange={handleInputChange}
                                          placeholder="Satuan"
                                        />
                                      ) : hasil.satuan ? (
                                        <span className="badge bg-info-lt">{hasil.satuan}</span>
                                      ) : (
                                        <span className="text-muted fst-italic">-</span>
                                      )}
                                    </td>
                                    <td>
                                      {editingId === hasil.id ? (
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          name="kadar_maksimal"
                                          value={editForm.kadar_maksimal}
                                          onChange={handleInputChange}
                                          placeholder="Kadar Maksimal"
                                        />
                                      ) : hasil.kadar_maksimal ? (
                                        <span className="badge bg-warning-lt text-dark">{hasil.kadar_maksimal}</span>
                                      ) : (
                                        <span className="text-muted fst-italic">-</span>
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
                                        <span className="badge bg-purple-lt">{hasil.metode}</span>
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
                                <td colSpan="8" className="text-end fw-bold text-muted">
                                  Subtotal {catName}
                                </td>
                                <td className="text-end">
                                  <span className="fw-bold text-primary">
                                    {formatCurrency(items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0))}
                                  </span>
                                </td>
                                <td colSpan="4"></td>
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

      {/* ================= EDIT HASIL MODAL ================= */}
      {showEditModal && selectedHasil && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseEditModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(10,17,40,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{
            width: '100%', maxWidth: '680px',
            maxHeight: '92vh',
            backgroundColor: '#fff',
            borderRadius: '24px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* ══ HEADER ══ */}
            <div style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)', padding: '22px 24px 18px', flexShrink: 0 }}>
              {/* Title Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="#fff" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 3l6 0"/><path d="M10 9l4 0"/><path d="M10 3v6l-4 11a.7 .7 0 0 0 .5 1h11.5a.7 .7 0 0 0 .5 -1l-4 -11v-6"/></svg>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3, marginBottom: '2px' }}>Input & Edit Hasil Pemeriksaan</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>Laboratorium SDA — Kelola data hasil uji</div>
                  </div>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  type="button"
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.5" stroke="#fff" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Info Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '2px' }}>Parameter Uji</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{selectedHasil.sampel?.parameter || '-'}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '2px' }}>Kategori</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>{selectedHasil.sampel?.category?.name || '-'}</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '2px' }}>Pemohon</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>{selectedHasil.user?.name || '-'}</div>
                </div>
              </div>
            </div>

            {/* ══ BODY ══ */}
            <form onSubmit={handleModalSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px', backgroundColor: '#f8fafc' }}>

                {/* Row 1: Kode Sampel + Hasil Uji */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

                  {/* Kode Sampel */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                      🏷️ Kode Sampel
                    </label>
                    <input
                      type="text"
                      name="kode_sampel"
                      value={editForm.kode_sampel}
                      onChange={handleInputChange}
                      placeholder="Contoh: SMP-001, S-123"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 14px', borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        backgroundColor: '#fff', fontSize: '0.9rem',
                        color: '#1e293b', outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>Kode identifikasi fisik sampel uji</div>
                  </div>

                  {/* Hasil Uji */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                      🧪 Hasil Uji <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="hasil"
                      value={editForm.hasil}
                      onChange={handleInputChange}
                      placeholder="Contoh: 7.2,  < 0.01, Negatif"
                      required
                      autoFocus
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 14px', borderRadius: '10px',
                        border: '2px solid #3b82f6',
                        backgroundColor: '#eff6ff', fontSize: '0.92rem',
                        fontWeight: 700, color: '#1d4ed8', outline: 'none',
                      }}
                    />
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>Nilai hasil pengujian laboratorium</div>
                  </div>
                </div>

                {/* Row 2: Satuan + Kadar Maksimal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

                  {/* Satuan */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                      📏 Satuan
                    </label>
                    <input
                      type="text"
                      name="satuan"
                      value={editForm.satuan}
                      onChange={handleInputChange}
                      placeholder="Contoh: mg/L, MPN/100ml"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 14px', borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        backgroundColor: '#fff', fontSize: '0.9rem',
                        color: '#1e293b', outline: 'none',
                        marginBottom: '8px',
                      }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', marginRight: '2px', fontStyle: 'italic' }}>Pilih cepat:</span>
                      {presetSatuanList.map((unit) => (
                        <button
                          key={unit} type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, satuan: unit }))}
                          style={{
                            fontSize: '0.68rem', padding: '3px 9px', borderRadius: '999px', cursor: 'pointer',
                            border: '1px solid', lineHeight: 1.4,
                            backgroundColor: editForm.satuan === unit ? '#1d4ed8' : '#fff',
                            color: editForm.satuan === unit ? '#fff' : '#475569',
                            borderColor: editForm.satuan === unit ? '#1d4ed8' : '#cbd5e1',
                            fontWeight: editForm.satuan === unit ? 600 : 400,
                          }}
                        >{unit}</button>
                      ))}
                    </div>
                  </div>

                  {/* Kadar Maksimal */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                      ⚠️ Kadar Maksimal / Baku Mutu
                    </label>
                    <input
                      type="text"
                      name="kadar_maksimal"
                      value={editForm.kadar_maksimal}
                      onChange={handleInputChange}
                      placeholder="Contoh: 50 mg/L, 6.0 - 9.0"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 14px', borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        backgroundColor: '#fff', fontSize: '0.9rem',
                        color: '#1e293b', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = '#f59e0b'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>Nilai ambang batas baku mutu resmi</div>
                  </div>
                </div>

                {/* Row 3: Metode full width */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                    📖 Metode Pemeriksaan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="metode"
                    value={editForm.metode}
                    onChange={handleInputChange}
                    placeholder="Contoh: SNI 06-6989.11-2004"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 14px', borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#fff', fontSize: '0.9rem',
                      color: '#1e293b', outline: 'none',
                      marginBottom: '8px',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', marginRight: '2px', fontStyle: 'italic' }}>Pilih cepat:</span>
                    {presetMetodeList.map((met) => (
                      <button
                        key={met} type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, metode: met }))}
                        style={{
                          fontSize: '0.68rem', padding: '3px 9px', borderRadius: '999px', cursor: 'pointer',
                          border: '1px solid', lineHeight: 1.4,
                          backgroundColor: editForm.metode === met ? '#1d4ed8' : '#fff',
                          color: editForm.metode === met ? '#fff' : '#1d4ed8',
                          borderColor: editForm.metode === met ? '#1d4ed8' : '#93c5fd',
                          fontWeight: editForm.metode === met ? 600 : 400,
                        }}
                      >{met}</button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Status */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                    ⚙️ Status Pemeriksaan
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Toggle: Dalam Proses */}
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, status: false }))}
                      style={{
                        flex: 1, padding: '14px', borderRadius: '12px',
                        border: '2px solid', cursor: 'pointer', textAlign: 'center',
                        backgroundColor: !editForm.status ? '#fff7ed' : '#f8fafc',
                        borderColor: !editForm.status ? '#f97316' : '#e2e8f0',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⏳</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: !editForm.status ? '#ea580c' : '#94a3b8' }}>Dalam Proses</div>
                      <div style={{ fontSize: '0.68rem', color: !editForm.status ? '#fb923c' : '#cbd5e1', marginTop: '2px' }}>Belum selesai dianalisa</div>
                    </button>
                    {/* Toggle: Selesai */}
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, status: true }))}
                      style={{
                        flex: 1, padding: '14px', borderRadius: '12px',
                        border: '2px solid', cursor: 'pointer', textAlign: 'center',
                        backgroundColor: editForm.status ? '#f0fdf4' : '#f8fafc',
                        borderColor: editForm.status ? '#16a34a' : '#e2e8f0',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>✅</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: editForm.status ? '#15803d' : '#94a3b8' }}>Selesai</div>
                      <div style={{ fontSize: '0.68rem', color: editForm.status ? '#22c55e' : '#cbd5e1', marginTop: '2px' }}>Hasil sudah final</div>
                    </button>
                  </div>
                  {/* Status controlled via onClick buttons above */}
                </div>

              </div>

              {/* ══ FOOTER ══ */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderTop: '1px solid #f1f5f9',
                backgroundColor: '#fff', flexShrink: 0,
              }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span style={{ color: '#ef4444' }}>*</span> Field wajib diisi
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    style={{
                      padding: '10px 22px', borderRadius: '10px',
                      border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: '#64748b',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 28px', borderRadius: '10px',
                      border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.88rem', color: '#fff',
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
                      boxShadow: '0 4px 12px rgba(29,78,216,0.35)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" strokeWidth="2.5" stroke="#fff" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2"/><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M14 4l0 4l-6 0l0 -4"/></svg>
                    Simpan Hasil
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </LayoutAdmin>
  );
}
