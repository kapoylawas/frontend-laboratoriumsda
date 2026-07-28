import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Api from "../../services/api";
import LayoutAdmin from "../../layouts/admin.jsx";
import toast from "react-hot-toast";

// Icons
import {
  IconPlus,
  IconPrinter,
  IconSearch,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconBox,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconCheck,
  IconFilter,
  IconBuildingWarehouse,
  IconFileSpreadsheet,
  IconInfoCircle,
  IconClipboardCheck,
  IconX
} from "@tabler/icons-react";

export default function StockOpname() {
  const navigate = useNavigate();

  // State Management
  const [stockData, setStockData] = useState([]);
  const [stats, setStats] = useState({
    total_item: 0,
    total_stock_awal: 0,
    total_penerimaan: 0,
    total_pemakaian: 0,
    total_sisa_stock: 0,
    total_nilai: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthNamesIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const getCurrentPeriode = () => {
    const now = new Date();
    return `${monthNamesIndo[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("SALDO AWAL 2026");
  const [selectedLokasi, setSelectedLokasi] = useState("");

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama_bmhp: "",
    satuan: "pcs",
    harga_satuan: 0,
    stock_awal: 0,
    penerimaan: 0,
    pemakaian: 0,
    ed: "-",
    lot: "-",
    lokasi: "H",
    periode: getCurrentPeriode(),
    upt: "LABKESDA",
    kecamatan: "GEDANGAN",
    kabupaten: "SIDOARJO",
    catatan: ""
  });

  // Calculate live preview in modal
  const liveSisaStock = (Number(formData.stock_awal) || 0) + (Number(formData.penerimaan) || 0) - (Number(formData.pemakaian) || 0);
  const liveNilai = liveSisaStock * (Number(formData.harga_satuan) || 0);

  // Fetch Stock Opname data from backend API
  const fetchStockOpname = async () => {
    setIsLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login");
      return;
    }
    Api.defaults.headers.common["Authorization"] = token;

    try {
      let queryParams = [];
      if (searchKeyword) queryParams.push(`search=${encodeURIComponent(searchKeyword)}`);
      if (selectedPeriode) queryParams.push(`periode=${encodeURIComponent(selectedPeriode)}`);
      if (selectedLokasi) queryParams.push(`lokasi=${encodeURIComponent(selectedLokasi)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await Api.get(`/api/stock-opname${queryString}`);

      if (response.data && response.data.success) {
        setStockData(response.data.data || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error) {
      console.error("Fetch Stock Opname Error:", error);
      toast.error("Gagal mengambil data stock opname");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockOpname();
  }, [selectedPeriode, selectedLokasi]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStockOpname();
  };

  const handleResetFilter = () => {
    setSearchKeyword("");
    setSelectedPeriode("SALDO AWAL 2026");
    setSelectedLokasi("");
  };

  // Trigger Seeding initial 46 items
  const handleSeedData = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mengisi/me-reset 46 data sampel Reagen & BMHP resmi?")) {
      return;
    }

    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;
    setIsLoading(true);

    try {
      const response = await Api.post("/api/stock-opname/seed", { forceReset: false });
      if (response.data && response.data.success) {
        toast.success(response.data.message || "Berhasil me-seed data sampel!");
        fetchStockOpname();
      }
    } catch (error) {
      console.error("Seed Error:", error);
      toast.error("Gagal me-seed data sampel");
    } finally {
      setIsLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedItemId(null);
    setFormData({
      nama_bmhp: "",
      satuan: "Pcs",
      harga_satuan: 0,
      stock_awal: 0,
      penerimaan: 0,
      pemakaian: 0,
      ed: "-",
      lot: "-",
      lokasi: "H",
      periode: selectedPeriode || "SALDO AWAL 2026",
      upt: "LABKESDA",
      kecamatan: "GEDANGAN",
      kabupaten: "SIDOARJO",
      catatan: ""
    });
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setModalMode("edit");
    setSelectedItemId(item.id);
    setFormData({
      nama_bmhp: item.nama_bmhp || "",
      satuan: item.satuan || "Pcs",
      harga_satuan: item.harga_satuan || 0,
      stock_awal: item.stock_awal || 0,
      penerimaan: item.penerimaan || 0,
      pemakaian: item.pemakaian || 0,
      ed: item.ed || "-",
      lot: item.lot || "-",
      lokasi: item.lokasi || "H",
      periode: item.periode || "SALDO AWAL 2026",
      upt: item.upt || "LABKESDA",
      kecamatan: item.kecamatan || "GEDANGAN",
      kabupaten: item.kabupaten || "SIDOARJO",
      catatan: item.catatan || ""
    });
    setShowFormModal(true);
  };

  // Submit Create / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_bmhp.trim()) {
      toast.error("Nama BMHP & Reagen wajib diisi");
      return;
    }

    setIsSubmitting(true);
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    try {
      if (modalMode === "create") {
        const response = await Api.post("/api/stock-opname", formData);
        if (response.data && response.data.success) {
          toast.success("Berhasil menambahkan item stock opname baru");
          setShowFormModal(false);
          fetchStockOpname();
        }
      } else {
        const response = await Api.put(`/api/stock-opname/${selectedItemId}`, formData);
        if (response.data && response.data.success) {
          toast.success("Berhasil memperbarui data stock opname");
          setShowFormModal(false);
          fetchStockOpname();
        }
      }
    } catch (error) {
      console.error("Form Submit Error:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Confirm Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    const token = Cookies.get("token");
    Api.defaults.headers.common["Authorization"] = token;

    try {
      const response = await Api.delete(`/api/stock-opname/${itemToDelete.id}`);
      if (response.data && response.data.success) {
        toast.success("Berhasil menghapus item stock opname");
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchStockOpname();
      }
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Gagal menghapus item stock opname");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse string like "Jan-26" or "2026-01-31" into "YYYY-MM-DD" for date input
  const parseDateInput = (edStr) => {
    if (!edStr || edStr === "-") return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(edStr)) return edStr;
    if (/^\d{4}-\d{2}$/.test(edStr)) return `${edStr}-01`;

    const monthMap = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", mei: "05",
      jun: "06", jul: "07", aug: "08", agu: "08", sep: "09", oct: "10",
      okt: "10", nov: "11", dec: "12", des: "12"
    };

    const parts = edStr.split("-");
    if (parts.length === 2) {
      const month = monthMap[parts[0].toLowerCase()];
      let year = parts[1];
      if (year && year.length === 2) year = "20" + year;
      if (month && year) return `${year}-${month}-01`;
    }

    const parsed = new Date(edStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return "";
  };

  // Convert "YYYY-MM-DD" to "Jan-26" format
  const formatDateToED = (dateVal) => {
    if (!dateVal) return "-";
    const parts = dateVal.split("-");
    if (parts.length < 2) return dateVal;
    
    const year = parts[0].slice(-2);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]}-${year}`;
    }
    return dateVal;
  };

  // Currency Formatter
  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  // Export Table to Excel (.xls) without HTML tag clutter
  const handleExportExcel = () => {
    if (!stockData || stockData.length === 0) {
      toast.error("Tidak ada data stock opname untuk di-export");
      return;
    }

    const sep = "\t";
    const fileName = `Laporan_Stock_Opname_${(selectedPeriode || "2026").replace(/\s+/g, "_")}.xls`;

    let content = "\uFEFF"; // UTF-8 BOM for Excel column auto-parsing
    content += `LAPORAN PENERIMAAN & PENGELUARAN REAGEN & BMHP\n`;
    content += `UPTD LABKESDA SIDOARJO\n\n`;
    content += `UPT${sep}: LABKESDA\n`;
    content += `KECAMATAN${sep}: GEDANGAN\n`;
    content += `KABUPATEN${sep}: SIDOARJO\n`;
    content += `PELAPORAN PERIODE${sep}: ${selectedPeriode}\n\n`;

    // 12 Column Headers
    content += `NO${sep}NAMA BMHP & REAGEN${sep}SATUAN${sep}HARGA SATUAN (Rp)${sep}STOCK AWAL${sep}PENERIMAAN${sep}PEMAKAIAN${sep}SISA STOCK${sep}NILAI (Rp)${sep}ED${sep}LOT${sep}LOKASI\n`;
    content += `1${sep}2${sep}3${sep}4${sep}5${sep}7${sep}9${sep}11${sep}12${sep}ED${sep}LOT${sep}LOKASI\n`;

    stockData.forEach((item, index) => {
      const nama = (item.nama_bmhp || '').replace(/[\t\n\r]/g, ' ');
      const satuan = (item.satuan || '').replace(/[\t\n\r]/g, ' ');
      const ed = item.ed || '-';
      const lot = item.lot || '-';
      const lokasi = item.lokasi || '-';

      content += `${index + 1}${sep}${nama}${sep}${satuan}${sep}${item.harga_satuan || 0}${sep}${item.stock_awal || 0}${sep}${item.penerimaan || 0}${sep}${item.pemakaian || 0}${sep}${item.sisa_stock || 0}${sep}${item.nilai || 0}${sep}${ed}${sep}${lot}${sep}${lokasi}\n`;
    });

    content += `TOTAL${sep}${sep}${sep}${sep}${stats.total_stock_awal || 0}${sep}${stats.total_penerimaan || 0}${sep}${stats.total_pemakaian || 0}${sep}${stats.total_sisa_stock || 0}${sep}${stats.total_nilai || 0}${sep}${sep}${sep}\n`;

    const blob = new Blob([content], { type: "application/vnd.ms-excel;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengunduh laporan Excel!");
  };

  return (
    <LayoutAdmin>
      <div className="container-xl py-4">
        {/* Page Header */}
        <div className="page-header d-print-none mb-4">
          <div className="row align-items-center">
            <div className="col">
              <div className="page-pretitle text-muted text-uppercase fw-bold">
                Manajemen Logistik & Reagen
              </div>
              <h2 className="page-title text-primary fw-bold display-6">
                <IconBuildingWarehouse className="me-2" size={32} />
                Stock Opname BMHP & Reagen
              </h2>
              <p className="text-muted mb-0">
                UPTD LABKESDA SIDOARJO — Pencatatan Penerimaan, Pemakaian, dan Sisa Stok Reagen
              </p>
            </div>
            <div className="col-auto ms-auto d-flex gap-2 flex-wrap">
              <button
                className="btn btn-outline-secondary d-flex align-items-center"
                onClick={handleSeedData}
                title="Isi data sampel 46 reagen resmi"
              >
                <IconRefresh className="me-1" size={18} />
                Seed Initial Data
              </button>
              <button
                className="btn btn-success d-flex align-items-center"
                onClick={handleExportExcel}
              >
                <IconFileSpreadsheet className="me-1" size={18} />
                Export Excel
              </button>
              <Link
                to={`/stock-opname/print?periode=${encodeURIComponent(selectedPeriode)}`}
                className="btn btn-outline-primary d-flex align-items-center"
                target="_blank"
              >
                <IconPrinter className="me-1" size={18} />
                Cetak Laporan Resmi
              </Link>
              <button
                className="btn btn-primary d-flex align-items-center shadow-sm"
                onClick={handleOpenCreate}
              >
                <IconPlus className="me-1" size={18} />
                Tambah Reagen / BMHP
              </button>
            </div>
          </div>
        </div>

        {/* Stats KPI Cards */}
        <div className="row row-cards mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="card card-sm border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="bg-primary text-white avatar rounded-3">
                      <IconBox size={24} />
                    </span>
                  </div>
                  <div className="col">
                    <div className="font-weight-medium text-muted">Total Item Reagen</div>
                    <div className="h2 mb-0 fw-bold">{stats.total_item} Item</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card card-sm border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="bg-info text-white avatar rounded-3">
                      <IconBuildingWarehouse size={24} />
                    </span>
                  </div>
                  <div className="col">
                    <div className="font-weight-medium text-muted">Total Sisa Stok</div>
                    <div className="h2 mb-0 fw-bold">{stats.total_sisa_stock.toLocaleString("id-ID")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card card-sm border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="bg-success text-white avatar rounded-3">
                      <IconCurrencyDollar size={24} />
                    </span>
                  </div>
                  <div className="col">
                    <div className="font-weight-medium text-muted">Total Nilai Stok (Rp)</div>
                    <div className="h3 mb-0 fw-bold text-success">
                      {formatRupiah(stats.total_nilai)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card card-sm border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="bg-warning text-white avatar rounded-3">
                      <IconAlertTriangle size={24} />
                    </span>
                  </div>
                  <div className="col">
                    <div className="font-weight-medium text-muted">Pelaporan Periode</div>
                    <div className="h4 mb-0 fw-bold text-truncate" title={selectedPeriode}>
                      {selectedPeriode}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-body">
            <form onSubmit={handleSearchSubmit}>
              <div className="row g-3 align-items-center">
                <div className="col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <IconSearch size={18} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Cari Nama BMHP, LOT, atau Lokasi..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={selectedPeriode}
                    onChange={(e) => setSelectedPeriode(e.target.value)}
                  >
                    <option value={getCurrentPeriode()}>{getCurrentPeriode()} (Bulan Ini)</option>
                    <option value="SALDO AWAL 2026">SALDO AWAL 2026</option>
                    {monthNamesIndo.map((m) => {
                      const pStr = `${m} ${new Date().getFullYear()}`;
                      return (
                        <option key={m} value={pStr}>
                          {pStr}
                        </option>
                      );
                    })}
                    <option value={`TAHUN ${new Date().getFullYear()}`}>TAHUN {new Date().getFullYear()}</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={selectedLokasi}
                    onChange={(e) => setSelectedLokasi(e.target.value)}
                  >
                    <option value="">Semua Lokasi</option>
                    <option value="E">Lokasi E</option>
                    <option value="H">Lokasi H</option>
                    <option value="B">Lokasi B</option>
                    <option value="A">Lokasi A</option>
                  </select>
                </div>
                <div className="col-md-2 d-flex gap-2">
                  <button type="submit" className="btn btn-primary w-100">
                    Filter
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleResetFilter}
                    title="Reset Filter"
                  >
                    <IconRefresh size={18} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h3 className="card-title fw-bold text-dark mb-0">
              Daftar Stock Opname ({stockData.length} Item)
            </h3>
            <span className="badge bg-primary-subtle text-primary fs-6 px-3 py-2">
              Periode: {selectedPeriode}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-vcenter table-hover card-table align-middle">
              <thead className="bg-light">
                <tr className="text-uppercase text-secondary fs-7 fw-bold">
                  <th className="w-1 text-center">NO</th>
                  <th>NAMA BMHP & REAGEN</th>
                  <th>SATUAN</th>
                  <th className="text-end">HARGA SATUAN</th>
                  <th className="text-center">STOK AWAL</th>
                  <th className="text-center">TERIMA</th>
                  <th className="text-center">PAKAI</th>
                  <th className="text-center">SISA STOK</th>
                  <th className="text-end">NILAI (RP)</th>
                  <th className="text-center">ED</th>
                  <th className="text-center">LOT</th>
                  <th className="text-center">LOKASI</th>
                  <th className="text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="13" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                      <div className="text-muted mt-2">Memuat data Stock Opname...</div>
                    </td>
                  </tr>
                ) : stockData.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="text-center py-5">
                      <IconBox className="text-muted mb-2" size={48} />
                      <div className="h4 text-muted">Belum ada data stock opname</div>
                      <p className="text-muted fs-7">
                        Klik <strong>"Tambah Reagen / BMHP"</strong> atau <strong>"Seed Initial Data"</strong> untuk mengisi data awal.
                      </p>
                      <button className="btn btn-primary btn-sm mt-2" onClick={handleSeedData}>
                        <IconRefresh size={16} className="me-1" />
                        Seed Data Sekarang
                      </button>
                    </td>
                  </tr>
                ) : (
                  stockData.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center text-muted fw-bold">{index + 1}</td>
                      <td>
                        <div className="fw-bold text-dark">{item.nama_bmhp}</div>
                        {item.catatan && <small className="text-muted">{item.catatan}</small>}
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          {item.satuan}
                        </span>
                      </td>
                      <td className="text-end fw-semibold text-dark">
                        {formatRupiah(item.harga_satuan)}
                      </td>
                      <td className="text-center fw-bold">{item.stock_awal}</td>
                      <td className="text-center text-success fw-bold">
                        {item.penerimaan > 0 ? `+${item.penerimaan}` : "0"}
                      </td>
                      <td className="text-center text-danger fw-bold">
                        {item.pemakaian > 0 ? `-${item.pemakaian}` : "0"}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge fs-6 px-3 py-2 ${
                            item.sisa_stock <= 0
                              ? "bg-danger"
                              : item.sisa_stock <= 5
                              ? "bg-warning text-dark"
                              : "bg-success"
                          }`}
                        >
                          {item.sisa_stock}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-success">
                        {formatRupiah(item.nilai)}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark border">
                          {item.ed || "-"}
                        </span>
                      </td>
                      <td className="text-center">
                        <code className="text-dark bg-light px-2 py-1 rounded fs-7">
                          {item.lot || "-"}
                        </code>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-info-subtle text-info fw-bold fs-7">
                          {item.lokasi || "-"}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit / Adjust Stock"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleOpenDelete(item)}
                            title="Hapus Item"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {stockData.length > 0 && (
                <tfoot className="bg-light fw-bold border-top-2">
                  <tr>
                    <td colSpan="4" className="text-end text-uppercase">
                      GRAND TOTAL ({stats.total_item} ITEM):
                    </td>
                    <td className="text-center">{stats.total_stock_awal}</td>
                    <td className="text-center text-success">+{stats.total_penerimaan}</td>
                    <td className="text-center text-danger">-{stats.total_pemakaian}</td>
                    <td className="text-center bg-primary-subtle text-primary fs-6">
                      {stats.total_sisa_stock}
                    </td>
                    <td className="text-end text-success fs-6 fw-bold">
                      {formatRupiah(stats.total_nilai)}
                    </td>
                    <td colSpan="4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* FORM MODAL (CREATE / EDIT) - Custom Scoped & Collision Free */}
      {showFormModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            overflowY: "auto"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFormModal(false);
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg border-0 overflow-hidden"
            style={{
              maxWidth: "850px",
              width: "100%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              animation: "soModalFadeIn 0.2s ease-out"
            }}
          >
            {/* Modal Header */}
            <div
              className="px-4 py-3 text-white d-flex align-items-center justify-content-between"
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    width: "42px",
                    height: "42px",
                    flexShrink: 0
                  }}
                >
                  <IconBox size={22} color="#ffffff" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold fs-5 text-white">
                    {modalMode === "create" ? "Tambah Item Reagen / BMHP Baru" : "Edit & Penyesuaian Stok BMHP"}
                  </h5>
                  <small style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                    Masukan detail item, mutasi stok, serta nomor LOT & lokasi penyimpanan.
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"}
                title="Tutup Modal"
              >
                <IconX size={20} color="#ffffff" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="p-4" style={{ overflowY: "auto", flex: 1 }}>
                
                {/* Section 1: Informasi Utama Item */}
                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                  <div className="fw-bold text-uppercase fs-7 text-primary mb-3 d-flex align-items-center">
                    <IconInfoCircle size={18} className="me-1" /> 1. Informasi Utama Item
                  </div>
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label required fw-semibold text-dark fs-7">Nama BMHP & Reagen</label>
                      <input
                        type="text"
                        className="form-control form-control-md"
                        placeholder="Contoh: Air Pepton, Alkohol 96%, Borax Test..."
                        value={formData.nama_bmhp}
                        onChange={(e) => setFormData({ ...formData, nama_bmhp: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label required fw-semibold text-dark fs-7">Satuan</label>
                      <input
                        type="text"
                        className="form-control form-control-md"
                        placeholder="500 gr, 1 L, Kotak, Pcs, Kit..."
                        value={formData.satuan}
                        onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label required fw-semibold text-dark fs-7">Harga Satuan (Rp)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white fw-bold text-secondary">Rp</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-control form-control-md fw-semibold"
                          min="0"
                          step="any"
                          placeholder="Masukkan angka harga (contoh: 1425124)"
                          value={formData.harga_satuan === 0 ? "" : formData.harga_satuan}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, harga_satuan: val === "" ? 0 : parseFloat(val) || 0 });
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark fs-7">Pelaporan Periode</label>
                      <select
                        className="form-select form-select-md"
                        value={formData.periode}
                        onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                      >
                        <option value={getCurrentPeriode()}>{getCurrentPeriode()} (Bulan Ini)</option>
                        <option value="SALDO AWAL 2026">SALDO AWAL 2026</option>
                        {monthNamesIndo.map((m) => {
                          const pStr = `${m} ${new Date().getFullYear()}`;
                          return (
                            <option key={m} value={pStr}>
                              {pStr}
                            </option>
                          );
                        })}
                        <option value={`TAHUN ${new Date().getFullYear()}`}>TAHUN {new Date().getFullYear()}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Rincian Stok & Mutasi Reagen */}
                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                  <div className="fw-bold text-uppercase fs-7 text-success mb-3 d-flex align-items-center">
                    <IconBuildingWarehouse size={18} className="me-1" /> 2. Rincian Stok & Mutasi Reagen
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark fs-7">Stok Awal</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white text-secondary"><IconBuildingWarehouse size={16} /></span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-control fw-bold"
                          min="0"
                          placeholder="0"
                          value={formData.stock_awal === 0 ? "" : formData.stock_awal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, stock_awal: val === "" ? 0 : parseInt(val, 10) || 0 });
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-success fs-7">Penerimaan (+)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-success-subtle text-success border-success fw-bold">+</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-control border-success fw-bold text-success"
                          min="0"
                          placeholder="0"
                          value={formData.penerimaan === 0 ? "" : formData.penerimaan}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, penerimaan: val === "" ? 0 : parseInt(val, 10) || 0 });
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-danger fs-7">Pemakaian (-)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-danger-subtle text-danger border-danger fw-bold">-</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="form-control border-danger fw-bold text-danger"
                          min="0"
                          placeholder="0"
                          value={formData.pemakaian === 0 ? "" : formData.pemakaian}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, pemakaian: val === "" ? 0 : parseInt(val, 10) || 0 });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Calculation Banner */}
                  <div
                    className="p-3 rounded-3 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
                      color: "#ffffff"
                    }}
                  >
                    <div className="row align-items-center">
                      <div className="col-6 border-end border-white border-opacity-25">
                        <small className="text-white-50 text-uppercase fw-semibold d-block fs-8">Hasil Sisa Stok</small>
                        <span className="fs-3 fw-bold">{liveSisaStock}</span>
                        <span className="ms-1 fs-7 text-white-50">{formData.satuan || 'Unit'}</span>
                      </div>
                      <div className="col-6 ps-4">
                        <small className="text-white-50 text-uppercase fw-semibold d-block fs-8">Estimasi Total Nilai (Rp)</small>
                        <span className="fs-3 fw-bold">{formatRupiah(liveNilai)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Data Batch & Penyimpanan */}
                <div className="card border-0 bg-light rounded-3 p-3">
                  <div className="fw-bold text-uppercase fs-7 text-info mb-3 d-flex align-items-center">
                    <IconClipboardCheck size={18} className="me-1" /> 3. Data Batch, Kadaluarsa & Penyimpanan
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark fs-7">Expired Date (ED)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={parseDateInput(formData.ed)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            ed: val ? formatDateToED(val) : "-"
                          });
                        }}
                      />
                      {formData.ed && formData.ed !== "-" && (
                        <small className="text-muted fs-8 mt-1 d-block">
                          Format Laporan: <strong>{formData.ed}</strong>
                        </small>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark fs-7">Nomor LOT / Batch</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: VM955028 103"
                        value={formData.lot}
                        onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark fs-7">Lokasi Penyimpanan</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: E, H, B, A"
                        value={formData.lokasi}
                        onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-4 py-3 bg-light border-top d-flex align-items-center justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={() => setShowFormModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary px-4 shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <IconCheck size={18} className="me-1" />
                      Simpan Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL CONFIRMATION - Scoped Overlay */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteModal(false);
          }}
        >
          <div className="bg-white rounded-4 shadow-lg border-0 p-4 text-center" style={{ maxWidth: "420px", width: "100%" }}>
            <div className="rounded-circle mx-auto p-3 d-inline-flex mb-3" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
              <IconAlertTriangle size={36} />
            </div>
            <h4 className="fw-bold text-dark mb-2">Konfirmasi Hapus Item</h4>
            <p className="text-muted mb-4 fs-7">
              Apakah Anda yakin ingin menghapus item <strong className="text-dark">"{itemToDelete?.nama_bmhp}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="d-flex gap-2">
              <button
                className="btn btn-light border w-100"
                onClick={() => setShowDeleteModal(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-danger w-100"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutAdmin>
  );
}
