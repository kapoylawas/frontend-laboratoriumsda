import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Api from "../../services/api";
import LayoutAdmin from "../../layouts/admin.jsx";
import toast from "react-hot-toast";

// Icon imports
import {
  IconFileSpreadsheet,
  IconPrinter,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconFlask,
  IconCheck,
  IconBuilding,
  IconFileText,
  IconChevronDown,
  IconChecklist
} from "@tabler/icons-react";

export default function Laporan() {
  const navigate = useNavigate();

  // Filter States
  const [filterMode, setFilterMode] = useState("month"); // "month" or "range"
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Data & Selection States
  const [laporanData, setLaporanData] = useState([]);
  const [selectedPrintIds, setSelectedPrintIds] = useState(new Set());
  const [stats, setStats] = useState({
    total_sampel: 0,
    total_parameter: 0,
    total_pelanggan: 0,
    total_selesai: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Month Names in Indonesian
  const monthsList = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" }
  ];

  // Fetch report data from API
  const fetchLaporan = async () => {
    setIsLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login");
      return;
    }
    Api.defaults.headers.common["Authorization"] = token;

    try {
      let queryParams = [];
      if (filterMode === "month") {
        queryParams.push(`month=${selectedMonth}`);
        queryParams.push(`year=${selectedYear}`);
      } else if (filterMode === "range" && startDate && endDate) {
        queryParams.push(`startDate=${startDate}`);
        queryParams.push(`endDate=${endDate}`);
      }
      if (searchKeyword) {
        queryParams.push(`search=${encodeURIComponent(searchKeyword)}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await Api.get(`/api/reports${queryString}`);

      if (response.data) {
        setLaporanData(response.data.data || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error) {
      console.error("Fetch Laporan Error:", error);
      toast.error("Gagal mengambil data laporan rekapitulasi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
    setSelectedPrintIds(new Set());
  }, [filterMode, selectedMonth, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLaporan();
  };

  // --- SELECTION & MULTI-SAMPLE PRINT HELPERS ---
  const togglePrintSelect = (id) => {
    setSelectedPrintIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPrintIds.size === laporanData.length && laporanData.length > 0) {
      setSelectedPrintIds(new Set());
    } else {
      const allIds = new Set(laporanData.map((item) => item.id));
      setSelectedPrintIds(allIds);
    }
  };

  const handleCetakTerpilih = () => {
    if (selectedPrintIds.size === 0) {
      toast.error("Centang minimal 1 sampel yang ingin dicetak");
      return;
    }
    const ids = Array.from(selectedPrintIds);
    navigate(`/hasil/print/${ids[0]}`, { state: { selectedIds: ids } });
  };

  // Find all sample items belonging to the same customer/transaction
  const getCustomerSampleItems = (item) => {
    if (!item || !laporanData.length) return [item];
    return laporanData.filter((d) =>
      (item.transaction_id && d.transaction_id === item.transaction_id) ||
      (d.nama_pelanggan === item.nama_pelanggan && d.tanggal_pengambilan === item.tanggal_pengambilan)
    );
  };

  const handleCetakSpecificSample = (targetId, allIds = null) => {
    if (allIds && allIds.length > 0) {
      navigate(`/hasil/print/${targetId}`, { state: { selectedIds: allIds } });
    } else {
      navigate(`/hasil/print/${targetId}`, { state: { selectedIds: [targetId] } });
    }
  };

  // Helper badge color for Jenis Sampel matching 3D theme
  const getJenisSampelBadge = (jenis) => {
    const j = (jenis || "").toLowerCase();
    if (j.includes("air minum")) return "bg-warning text-dark";
    if (j.includes("air bersih")) return "bg-info text-white";
    if (j.includes("makanan")) return "bg-danger text-white";
    if (j.includes("usap alat")) return "bg-success text-white";
    if (j.includes("usap dubur")) return "bg-dark text-white";
    return "bg-primary text-white";
  };

  // Helper date formatter
  const formatDateString = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Export to Excel / CSV Function
  const exportToExcel = () => {
    if (laporanData.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const headers = [
      "Tr",
      "Nomor Sampel",
      "Tanggal Pengambilan Sampel",
      "Nama Pelanggan",
      "Alamat",
      "Nomor HP",
      "Jenis Sampel",
      "Parameter",
      "Jumlah Sampel",
      "Titik Pengambilan Sampel",
      "Kondisi Sampel Saat Diterima",
      "Petugas",
      "Hasil"
    ];

    const cleanField = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, " ");
      return `"${str}"`;
    };

    const rows = laporanData.map((item, idx) => [
      idx + 1,
      cleanField(item.nomor_sampel),
      cleanField(formatDateString(item.tanggal_pengambilan)),
      cleanField(item.nama_pelanggan),
      cleanField(item.alamat),
      cleanField(item.phone),
      cleanField(item.jenis_sampel),
      cleanField(item.parameter),
      item.jumlah_sampel || 1,
      cleanField(item.titik_pengambilan),
      cleanField(item.kondisi_sampel),
      cleanField(item.petugas),
      cleanField(item.hasil)
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.map((h) => `"${h}"`).join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Rekapitulasi_Labkesda_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File Excel / CSV Laporan berhasil diunduh");
  };

  // Print Laporan Function
  const handlePrintLaporan = () => {
    window.print();
  };

  return (
    <LayoutAdmin>
      {/* 3D Theme Custom Styles */}
      <style>{`
        .card-3d {
            background: #ffffff !important;
            border: 2.5px solid #000000 !important;
            box-shadow: 6px 6px 0px #000000 !important;
            border-radius: 18px !important;
            overflow: hidden !important;
            transition: all 0.15s ease-in-out !important;
        }
        .card-3d:hover {
            box-shadow: 8px 8px 0px #000000 !important;
            transform: translateY(-2px);
        }
        .badge-3d {
            border: 1.5px solid #000000 !important;
            box-shadow: 2px 2px 0px #000000 !important;
            border-radius: 8px !important;
            font-weight: 800 !important;
        }
        .btn-3d-primary {
            background: #2563eb !important;
            color: #ffffff !important;
            border: 2px solid #000000 !important;
            box-shadow: 3px 3px 0px #000000 !important;
            border-radius: 10px !important;
            font-weight: 800 !important;
            transition: all 0.1s ease-in-out !important;
        }
        .btn-3d-primary:hover {
            background: #1d4ed8 !important;
            color: #ffffff !important;
            transform: translate(-1px, -1px);
            box-shadow: 4px 4px 0px #000000 !important;
        }
        .btn-3d-success {
            background: #16a34a !important;
            color: #ffffff !important;
            border: 2px solid #000000 !important;
            box-shadow: 3px 3px 0px #000000 !important;
            border-radius: 10px !important;
            font-weight: 800 !important;
            transition: all 0.1s ease-in-out !important;
        }
        .btn-3d-warning {
            background: #eab308 !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
            box-shadow: 3px 3px 0px #000000 !important;
            border-radius: 10px !important;
            font-weight: 800 !important;
            transition: all 0.1s ease-in-out !important;
        }
        .btn-3d-danger {
            background: #dc2626 !important;
            color: #ffffff !important;
            border: 2px solid #000000 !important;
            box-shadow: 3px 3px 0px #000000 !important;
            border-radius: 10px !important;
            font-weight: 800 !important;
            transition: all 0.1s ease-in-out !important;
        }
        .btn-3d-secondary {
            background: #f1f5f9 !important;
            color: #334155 !important;
            border: 2px solid #000000 !important;
            box-shadow: 3px 3px 0px #000000 !important;
            border-radius: 10px !important;
            font-weight: 700 !important;
        }
        .banner-3d {
            border: 2.5px solid #000000 !important;
            box-shadow: 6px 6px 0px #000000 !important;
            border-radius: 18px !important;
            background: #ffffff !important;
        }
        .form-control-3d {
            border: 2px solid #000000 !important;
            box-shadow: 3px 3px 0px #000000 !important;
            border-radius: 10px !important;
            font-weight: 600;
        }
        .form-control-3d:focus {
            box-shadow: 5px 5px 0px #000000 !important;
            background-color: #fffdf0 !important;
            outline: none;
        }
        .table-3d-container {
            border: 2.5px solid #000000 !important;
            box-shadow: 6px 6px 0px #000000 !important;
            border-radius: 18px !important;
            overflow: hidden !important;
            background: #ffffff !important;
        }
        .checkbox-3d {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #dc2626;
        }
      `}</style>

      <div className="page-wrapper">
        {/* Page Header */}
        <div className="page-header d-print-none">
          <div className="container-fluid px-3 px-lg-4">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title fw-extrabold text-dark" style={{ fontSize: "1.8rem", letterSpacing: "-0.5px" }}>
                  ✨ Laporan Rekapitulasi Pengujian
                </h2>
                <div className="text-muted mt-1 fw-semibold">
                  Kelola dan cetak rekapitulasi data hasil pengujian sampel laboratorium UPT Labkesda Kabupaten Sidoarjo
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="container-fluid px-3 px-lg-4">
            {/* 3D Workflow Banner */}
            <div className="card mb-4 banner-3d p-3" style={{ background: "linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)" }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 text-start">
                <div className="d-flex align-items-center gap-3">
                  <div className="badge-3d bg-danger text-white fs-5 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px", borderRadius: "14px" }}>
                    📊
                  </div>
                  <div>
                    <h5 className="fw-extrabold mb-1 text-dark" style={{ fontSize: "1.05rem" }}>
                      Rekapitulasi Pengujian Sampel Terpadu
                    </h5>
                    <small className="text-muted fw-semibold">
                      Gunakan filter <strong>Per Bulan</strong> / <strong>Per Tanggal</strong>, centang sampel yang ingin dicetak (bisa 1, 2, atau semua), lalu unduh Excel atau Cetak PDF.
                    </small>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap align-items-center">
                  {selectedPrintIds.size > 0 && (
                    <button onClick={handleCetakTerpilih} className="btn btn-3d-warning px-3 py-2 d-flex align-items-center gap-2 animate__animated animate__fadeIn">
                      <IconChecklist size={18} />
                      <span>Cetak Terpilih ({selectedPrintIds.size} Sampel)</span>
                    </button>
                  )}
                  <button onClick={exportToExcel} className="btn btn-3d-success px-3 py-2 d-flex align-items-center gap-2">
                    <IconFileSpreadsheet size={18} />
                    <span>Export Excel (.csv)</span>
                  </button>
                  <button onClick={handlePrintLaporan} className="btn btn-3d-primary px-3 py-2 d-flex align-items-center gap-2">
                    <IconPrinter size={18} />
                    <span>Cetak Laporan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3D Summary Cards */}
            <div className="row row-cards mb-4">
              <div className="col-md-3">
                <div className="card card-3d p-2">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="badge-3d bg-primary text-white me-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                        <IconFlask size={24} />
                      </div>
                      <div>
                        <div className="text-muted small fw-bold uppercase">Total Sampel</div>
                        <div className="fs-2 fw-extrabold text-dark">{stats.total_sampel}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card card-3d p-2">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="badge-3d bg-warning text-dark me-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                        <IconFileText size={24} />
                      </div>
                      <div>
                        <div className="text-muted small fw-bold uppercase">Total Parameter</div>
                        <div className="fs-2 fw-extrabold text-dark">{stats.total_parameter}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card card-3d p-2">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="badge-3d bg-info text-white me-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                        <IconBuilding size={24} />
                      </div>
                      <div>
                        <div className="text-muted small fw-bold uppercase">Total Pelanggan</div>
                        <div className="fs-2 fw-extrabold text-dark">{stats.total_pelanggan}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card card-3d p-2">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="badge-3d bg-success text-white me-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                        <IconCheck size={24} />
                      </div>
                      <div>
                        <div className="text-muted small fw-bold uppercase">Hasil Disetujui</div>
                        <div className="fs-2 fw-extrabold text-success">{stats.total_selesai}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Filter Control Card */}
            <div className="card card-3d p-3 mb-4">
              <div className="row g-3 align-items-center">
                {/* Filter Mode Buttons */}
                <div className="col-lg-3 col-md-4">
                  <label className="form-label small fw-bold text-dark mb-1">
                    <IconFilter size={16} className="me-1" /> Tipe Filter
                  </label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn w-50 ${filterMode === "month" ? "btn-3d-danger" : "btn-3d-secondary"}`}
                      onClick={() => setFilterMode("month")}
                    >
                      Per Bulan
                    </button>
                    <button
                      type="button"
                      className={`btn w-50 ${filterMode === "range" ? "btn-3d-danger" : "btn-3d-secondary"}`}
                      onClick={() => setFilterMode("range")}
                    >
                      Per Tanggal
                    </button>
                  </div>
                </div>

                {/* Monthly Inputs */}
                {filterMode === "month" ? (
                  <>
                    <div className="col-lg-3 col-md-4">
                      <label className="form-label small fw-bold text-dark mb-1">Pilih Bulan</label>
                      <select
                        className="form-select form-control-3d fw-bold"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        {monthsList.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-lg-2 col-md-4">
                      <label className="form-label small fw-bold text-dark mb-1">Tahun</label>
                      <input
                        type="number"
                        className="form-control form-control-3d fw-bold"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  /* Date Range Inputs */
                  <>
                    <div className="col-lg-3 col-md-4">
                      <label className="form-label small fw-bold text-dark mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        className="form-control form-control-3d fw-bold"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-lg-3 col-md-4">
                      <label className="form-label small fw-bold text-dark mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        className="form-control form-control-3d fw-bold"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Search Box */}
                <div className="col-lg-4 col-md-6 ms-auto">
                  <label className="form-label small fw-bold text-dark mb-1">Cari Data</label>
                  <form onSubmit={handleSearchSubmit}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-3d"
                        placeholder="Cari sampel, pelanggan, parameter..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                      <button className="btn btn-3d-danger" type="submit">
                        <IconSearch size={18} />
                      </button>
                      <button className="btn btn-3d-secondary ms-1" type="button" onClick={fetchLaporan}>
                        <IconRefresh size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* 3D Spreadsheet Table Card */}
            <div className="table-3d-container mb-4">
              <div className="py-3 px-4 bg-dark text-white d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderBottom: "2.5px solid #000" }}>
                <div className="d-flex align-items-center gap-3">
                  <h5 className="fw-extrabold mb-0 text-white d-flex align-items-center gap-2">
                    <IconFileSpreadsheet size={22} className="text-warning" />
                    <span>Tabel Rekapitulasi Pengujian Sampel (13 Kolom)</span>
                  </h5>
                  {selectedPrintIds.size > 0 && (
                    <span className="badge-3d bg-warning text-dark px-3 py-1">
                      {selectedPrintIds.size} Sampel Tercentang
                    </span>
                  )}
                </div>
                <span className="badge-3d bg-secondary text-white px-3 py-1">Total: {laporanData.length} Data</span>
              </div>

              <div className="table-responsive">
                <table className="table table-vcenter table-bordered card-table text-nowrap mb-0" style={{ fontSize: "0.88rem" }}>
                  <thead className="table-dark text-center align-middle" style={{ borderBottom: "2.5px solid #000" }}>
                    <tr>
                      <th style={{ width: "40px" }} className="no-print">
                        <input
                          type="checkbox"
                          className="checkbox-3d"
                          checked={laporanData.length > 0 && selectedPrintIds.size === laporanData.length}
                          onChange={toggleSelectAll}
                          title="Pilih Semua Sampel"
                        />
                      </th>
                      <th style={{ width: "45px" }}>Tr</th>
                      <th>Nomor Sampel</th>
                      <th>Tanggal Pengambilan</th>
                      <th>Nama Pelanggan</th>
                      <th>Alamat</th>
                      <th>Nomor HP</th>
                      <th>Jenis Sampel</th>
                      <th>Parameter</th>
                      <th>Qty</th>
                      <th>Titik Pengambilan</th>
                      <th>Kondisi Sampel</th>
                      <th>Petugas</th>
                      <th>Hasil</th>
                      <th className="no-print">File Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="15" className="text-center py-5">
                          <div className="spinner-border text-danger" role="status" style={{ width: "3rem", height: "3rem" }}></div>
                          <p className="fw-bold text-dark mt-3 mb-0">Memuat data laporan pengujian...</p>
                        </td>
                      </tr>
                    ) : laporanData.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="text-center py-5">
                          <div style={{ opacity: 0.5 }}>
                            <IconFileText size={48} className="mb-2 text-secondary" />
                            <p className="fw-bold text-dark mb-0">Tidak ada data laporan untuk periode yang dipilih</p>
                            <small className="text-muted">Coba ganti filter bulan atau tanggal pencarian</small>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      laporanData.map((item, index) => {
                        const customerSamples = getCustomerSampleItems(item);
                        const hasMultipleCustomerSamples = customerSamples.length > 1;
                        const allCustomerSampleIds = customerSamples.map((s) => s.id);

                        return (
                          <tr key={item.id || index} className={selectedPrintIds.has(item.id) ? "table-warning" : ""}>
                            <td className="text-center no-print">
                              <input
                                type="checkbox"
                                className="checkbox-3d"
                                checked={selectedPrintIds.has(item.id)}
                                onChange={() => togglePrintSelect(item.id)}
                              />
                            </td>
                            <td className="text-center fw-extrabold text-secondary">{index + 1}</td>
                            <td className="fw-extrabold text-dark font-monospace">{item.nomor_sampel}</td>
                            <td className="fw-semibold">{formatDateString(item.tanggal_pengambilan)}</td>
                            <td>
                              <strong className="text-dark d-block fw-extrabold">{item.nama_pelanggan}</strong>
                            </td>
                            <td className="text-wrap max-w-200 fw-semibold">{item.alamat}</td>
                            <td className="font-monospace fw-semibold">{item.phone}</td>
                            <td>
                              <span className={`badge-3d ${getJenisSampelBadge(item.jenis_sampel)} px-2 py-1`}>
                                {item.jenis_sampel}
                              </span>
                            </td>
                            <td className="fw-extrabold text-dark">{item.parameter}</td>
                            <td className="text-center fw-extrabold">{item.jumlah_sampel}</td>
                            <td className="text-wrap max-w-180 fw-semibold">{item.titik_pengambilan}</td>
                            <td className="text-wrap max-w-200 small fw-semibold">{item.kondisi_sampel}</td>
                            <td>
                              <span className="badge-3d bg-light text-dark px-2 py-1">
                                {item.petugas}
                              </span>
                            </td>
                            <td className="fw-extrabold text-primary text-wrap max-w-200">{item.hasil}</td>
                            <td className="text-center no-print">
                              {(item.status_verifikasi === "DISETUJUI" || item.status) ? (
                                hasMultipleCustomerSamples ? (
                                  /* Multi-Sample Selection Dropdown / Group for Customers with 2+ Samples */
                                  <div className="btn-group">
                                    <button
                                      type="button"
                                      onClick={() => handleCetakSpecificSample(item.id, [item.id])}
                                      className="btn btn-3d-primary btn-sm d-inline-flex align-items-center gap-1"
                                      title="Cetak Laporan Sampel Ini"
                                    >
                                      <IconPrinter size={14} />
                                      <span>Cetak PDF</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-3d-primary btn-sm dropdown-toggle dropdown-toggle-split"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <IconChevronDown size={14} />
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-lg rounded-3 p-2">
                                      <li className="dropdown-header fw-bold text-dark border-bottom mb-1 pb-1">
                                        Pilihan Sampel ({customerSamples.length} Sampel):
                                      </li>
                                      {customerSamples.map((cs, idxSample) => (
                                        <li key={cs.id}>
                                          <button
                                            className="dropdown-item rounded-2 py-1 text-wrap text-start"
                                            onClick={() => handleCetakSpecificSample(cs.id, [cs.id])}
                                          >
                                            📄 <strong>Sampel #{idxSample + 1}:</strong> {cs.parameter} ({cs.nomor_sampel})
                                          </button>
                                        </li>
                                      ))}
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button
                                          className="dropdown-item rounded-2 py-1 text-success fw-bold text-start"
                                          onClick={() => handleCetakSpecificSample(item.id, allCustomerSampleIds)}
                                        >
                                          📑 <strong>Cetak Gabungan (Semua {customerSamples.length} Sampel)</strong>
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                ) : (
                                  /* Single Sample Direct PDF Print */
                                  <button
                                    type="button"
                                    onClick={() => handleCetakSpecificSample(item.id, [item.id])}
                                    className="btn btn-3d-primary btn-sm d-inline-flex align-items-center gap-1"
                                  >
                                    <IconPrinter size={14} />
                                    <span>Cetak PDF</span>
                                  </button>
                                )
                              ) : (
                                <span className="badge bg-light text-muted border border-secondary py-2 px-3" title="Laporan hanya dapat dicetak setelah ACC TTD Kepala">
                                  🔒 Belum ACC TTD
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutAdmin>
  );
}
