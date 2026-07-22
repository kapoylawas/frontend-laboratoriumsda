import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import Api from "../../services/api";
import html2pdf from "html2pdf.js";
import { FaSpinner, FaPrint, FaDownload, FaArrowLeft, FaCheckSquare, FaSquare } from "react-icons/fa";
import LayoutAdmin from "../../layouts/admin";

export default function PrintLaporanHasil() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef();

  const [allHasils, setAllHasils] = useState([]);           // semua data dari API
  const [selectedIds, setSelectedIds] = useState(new Set()); // id yang dipilih user
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportMeta, setReportMeta] = useState({
    nomorLaporan: "600.4.26.2/102/438.5.2.3/2026",
    pengambilanLokasi: "-",
    tanggalPengambilan: "-",
    tanggalPengerjaan: "-",
    petugasPengambil: "Tim Labkesda",
    tujuanPermenkes: "PERMENKES RI NO. 2 Tahun 2023",
    tanggalCetak: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  });

  // ---- FETCH DATA ----
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = Cookies.get("token");
      if (!token) { setIsLoading(false); return; }
      Api.defaults.headers.common["Authorization"] = token;

      try {
        let listData = [];

        // Prioritas 1: data langsung dari router state (dari Cetak per-invoice di menu hasil)
        if (location.state?.hasilItems && location.state.hasilItems.length > 0) {
          listData = location.state.hasilItems;
        } else {
          // Prioritas 2: fetch per transaction_id
          try {
            const invRes = await Api.get(`/api/hasils?transaction_id=${id}&limit=100`);
            if (invRes.data.data?.length > 0) listData = invRes.data.data;
          } catch (_) {}

          // Fallback: single hasil
          if (listData.length === 0) {
            const res = await Api.get(`/api/hasils/${id}`);
            if (res.data.data) listData = [res.data.data];
          }
        }

        setAllHasils(listData);
        // Pre-select: dari state selectedIds, atau semua item yang ada
        const preSelected = location.state?.selectedIds;
        if (preSelected && preSelected.length > 0) {
          setSelectedIds(new Set(preSelected));
        } else {
          setSelectedIds(new Set(listData.map((h) => h.id)));
        }

        if (listData.length > 0) {
          const first = listData[0];
          setReportMeta((prev) => ({
            ...prev,
            nomorLaporan: first.nomor_laporan || prev.nomorLaporan,
            tanggalPengerjaan: first.tanggal_pengerjaan
              ? new Date(first.tanggal_pengerjaan).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
              : prev.tanggalPengerjaan,
            tujuanPermenkes: first.tujuan_permenkes || prev.tujuanPermenkes,
          }));
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ---- SELECTION HANDLERS ----
  const toggleSelect = (hasilId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(hasilId) ? next.delete(hasilId) : next.add(hasilId);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allHasils.map((h) => h.id)));
  const clearAll = () => setSelectedIds(new Set());

  // Sampel yang akan masuk ke laporan
  const selectedHasils = allHasils.filter((h) => selectedIds.has(h.id));

  // Group selected by category for multi-page
  const getGroupedItems = () => {
    if (selectedHasils.length <= 1) return [selectedHasils];
    const groups = {};
    selectedHasils.forEach((item) => {
      const key = item.sampel?.category?.name || item.sampel?.parameter || "Pemeriksaan";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.values(groups);
  };

  // ---- PRINT / PDF ----
  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    const element = reportRef.current;
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Laporan_Hasil_${id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save()
      .then(() => setIsGeneratingPDF(false))
      .catch(() => setIsGeneratingPDF(false));
  };

  // ---- RENDER ONE PAGE ----
  const renderReportPage = (items, pageIdx) => {
    const firstItem = items[0] || {};
    const catName = firstItem.sampel?.category?.name || "Pemeriksaan";

    return (
      <div
        key={pageIdx}
        className="bg-white p-5 shadow-sm border rounded printable-report page-break-after"
        style={{
          width: "100%", maxWidth: "210mm", minHeight: "297mm",
          color: "#000", fontSize: "13px",
          fontFamily: "'Times New Roman', Times, serif",
          lineHeight: "1.4", boxSizing: "border-box",
        }}
      >
        {/* Kop Surat */}
        <div className="text-center mb-2">
          <div className="row align-items-center">
            <div className="col-2 text-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Lambang_Kabupaten_Sidoarjo.png"
                alt="Logo" style={{ width: "80px" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            <div className="col-10 text-center pe-4">
              <h5 className="fw-bold mb-0 text-uppercase" style={{ fontSize: "16px" }}>PEMERINTAH KABUPATEN SIDOARJO</h5>
              <h5 className="fw-bold mb-0 text-uppercase" style={{ fontSize: "16px" }}>DINAS KESEHATAN</h5>
              <h4 className="fw-bold mb-1 text-uppercase" style={{ fontSize: "18px" }}>UPTD. LABORATORIUM KESEHATAN DAERAH</h4>
              <p className="mb-0" style={{ fontSize: "12px" }}>Jalan A. Yani no. 42 Gedangan, Sidoarjo, Kode Pos 61254</p>
              <p className="mb-0" style={{ fontSize: "12px" }}>Telepon (031) 8533726 &nbsp;|&nbsp; labkes.sidoarjo@gmail.com</p>
            </div>
          </div>
          <div style={{ borderTop: "3px solid #000", borderBottom: "1px solid #000", height: "4px", marginTop: "8px" }} />
          <p className="fst-italic text-muted mt-1 mb-3" style={{ fontSize: "10px" }}>
            Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh BSrE, Badan Siber dan Sandi Negara
          </p>
        </div>

        {/* Judul */}
        <div className="text-center my-3">
          <h5 className="fw-bold text-decoration-underline mb-0 text-uppercase" style={{ fontSize: "16px" }}>
            LAPORAN HASIL PENGUJIAN
          </h5>
          <p className="mb-0 fw-semibold" style={{ fontSize: "13px" }}>
            Nomor: {firstItem.nomor_laporan || reportMeta.nomorLaporan}
          </p>
        </div>

        {/* Metadata */}
        <table className="table table-borderless table-sm mb-3" style={{ fontSize: "13px", width: "100%" }}>
          <tbody>
            <tr><td style={{ width: "28%", padding: "2px 0" }}>Jenis Pemeriksaan</td><td style={{ width: "2%", padding: "2px 0" }}>:</td><td style={{ padding: "2px 0" }}>{catName}</td></tr>
            <tr><td style={{ padding: "2px 0", verticalAlign: "top" }}>Pengambilan Lokasi</td><td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td><td style={{ padding: "2px 0", whiteSpace: "pre-line" }}>{reportMeta.pengambilanLokasi}</td></tr>
            <tr><td style={{ padding: "2px 0" }}>Tanggal Pengerjaan</td><td style={{ padding: "2px 0" }}>:</td><td style={{ padding: "2px 0" }}>{reportMeta.tanggalPengerjaan}</td></tr>
            <tr><td style={{ padding: "2px 0" }}>Petugas Pengambil Sampel</td><td style={{ padding: "2px 0" }}>:</td><td style={{ padding: "2px 0" }}>{reportMeta.petugasPengambil}</td></tr>
            <tr><td style={{ padding: "2px 0" }}>Verifikator</td><td style={{ padding: "2px 0" }}>:</td><td style={{ padding: "2px 0" }}>{firstItem.verifikator?.name || "-"}</td></tr>
          </tbody>
        </table>

        {/* Tabel Hasil */}
        <table className="table table-bordered text-center mb-3" style={{ borderColor: "#000", fontSize: "12px", width: "100%" }}>
          <thead style={{ backgroundColor: "#f8f9fa" }}>
            <tr>
              <th style={{ width: "5%", border: "1px solid #000" }}>No.</th>
              <th style={{ border: "1px solid #000" }}>Parameter / Jenis Sampel</th>
              <th style={{ width: "18%", border: "1px solid #000" }}>Kode Sampel</th>
              <th style={{ width: "16%", border: "1px solid #000" }}>Metode</th>
              <th style={{ width: "12%", border: "1px solid #000" }}>Satuan</th>
              <th style={{ width: "15%", border: "1px solid #000" }}>Batas Maksimal</th>
              <th style={{ width: "10%", border: "1px solid #000" }}>Hasil</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={{ border: "1px solid #000" }}>{idx + 1}.</td>
                <td className="text-start" style={{ border: "1px solid #000", whiteSpace: "pre-line" }}>
                  {item.sampel?.parameter || "-"}
                </td>
                <td style={{ border: "1px solid #000" }}>{item.kode_sampel || "-"}</td>
                <td style={{ border: "1px solid #000" }}>{item.metode || "-"}</td>
                <td style={{ border: "1px solid #000" }}>{item.satuan || "-"}</td>
                <td style={{ border: "1px solid #000" }}>{item.kadar_maksimal ?? "-"}</td>
                <td style={{ border: "1px solid #000" }}>{item.hasil ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Catatan */}
        <div className="mb-4">
          <p className="mb-0" style={{ fontSize: "12px" }}>
            Perhatian: Hasil pemeriksaan ini berlaku untuk sampel/spesimen yang tertera
          </p>
          <p className="fw-bold mb-0" style={{ fontSize: "12px" }}>
            *){firstItem.tujuan_permenkes || reportMeta.tujuanPermenkes}
          </p>
        </div>

        {/* TTD */}
        <div className="row mt-4 align-items-end">
          <div className="col-6 text-center">
            <p className="fw-bold mb-5" style={{ fontSize: "13px" }}>PEMERIKSA</p>
            <p className="fw-bold text-decoration-underline mb-0" style={{ fontSize: "13px" }}>
              {firstItem.user?.name || "-"}
            </p>
            <p className="mb-0" style={{ fontSize: "12px" }}>NIP. {firstItem.user?.nip || "-"}</p>
          </div>
          <div className="col-6 text-center">
            <p className="mb-0" style={{ fontSize: "13px" }}>Sidoarjo, {reportMeta.tanggalCetak}</p>
            <p className="fw-bold mb-4" style={{ fontSize: "13px" }}>
              KEPALA LABORATORIUM<br />KESEHATAN DAERAH
            </p>
            <p className="fw-bold text-decoration-underline mb-0" style={{ fontSize: "13px" }}>
              {firstItem.kepala?.name || "-"}
            </p>
            <p className="mb-0" style={{ fontSize: "12px" }}>{firstItem.kepala?.pangkat || "-"}</p>
            <p className="mb-0" style={{ fontSize: "12px" }}>NIP {firstItem.kepala?.nip || "-"}</p>
          </div>
        </div>

        <div className="text-center mt-5 pt-3">
          <p className="fst-italic text-muted mb-0" style={{ fontSize: "10px" }}>
            Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik<br />
            yang diterbitkan oleh Balai Besar Sertifikasi Elektronik (BSrE), Badan Siber dan Sandi Negara
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <LayoutAdmin>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} />
            <p className="fw-bold text-muted">Memuat data laporan...</p>
          </div>
        </div>
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin>
      <div className="container-fluid py-4">

        {/* ====== PANEL ATAS: ACTION BAR ====== */}
        <div className="d-print-none mb-4 d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary d-flex align-items-center gap-2">
            <FaArrowLeft /> Kembali
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary fs-6">{selectedIds.size} / {allHasils.length} sampel dipilih</span>
            <button
              onClick={handlePrint}
              disabled={selectedIds.size === 0}
              className="btn btn-primary d-flex align-items-center gap-2"
            >
              <FaPrint /> Cetak Laporan
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || selectedIds.size === 0}
              className="btn btn-success d-flex align-items-center gap-2"
            >
              {isGeneratingPDF ? <FaSpinner className="spinner-border spinner-border-sm" /> : <FaDownload />}
              Download PDF
            </button>
          </div>
        </div>

        {/* ====== LAYOUT 2 KOLOM ====== */}
        <div className="row g-4">

          {/* ====== KOLOM KIRI: PILIH SAMPEL (Grouped) ====== */}
          <div className="col-lg-4 d-print-none">
            <div className="card shadow-sm sticky-top" style={{ top: "80px" }}>
              <div className="card-header py-3" style={{ background: "#f8fafc", borderBottom: "2px solid #000" }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">🗂️ Pilih Sampel</h5>
                  <div className="d-flex gap-1">
                    <button onClick={selectAll} className="btn btn-sm btn-outline-primary fw-bold">Pilih Semua</button>
                    <button onClick={clearAll} className="btn btn-sm btn-outline-secondary fw-bold">Hapus Semua</button>
                  </div>
                </div>
                <small className="text-muted">Centang sampel/kategori yang akan dicetak</small>
              </div>

              <div className="card-body p-0" style={{ maxHeight: "calc(100vh - 270px)", overflowY: "auto" }}>
                {allHasils.length === 0 ? (
                  <p className="text-muted text-center py-5">Tidak ada data sampel.</p>
                ) : (() => {
                  // Group by category / invoice
                  const groups = {};
                  allHasils.forEach((hasil) => {
                    // Group by transaction invoice first, then category
                    const txKey = hasil.transaction?.invoice || `Pesanan #${hasil.transaction_id || hasil.user_id}`;
                    const catKey = hasil.sampel?.category?.name || "Tanpa Kategori";
                    const groupKey = `${txKey} — ${catKey}`;
                    if (!groups[groupKey]) groups[groupKey] = { label: groupKey, invoice: txKey, category: catKey, items: [] };
                    groups[groupKey].items.push(hasil);
                  });

                  return Object.values(groups).map((group) => {
                    const groupIds = group.items.map((i) => i.id);
                    const allGroupSelected = groupIds.every((gid) => selectedIds.has(gid));
                    const someGroupSelected = groupIds.some((gid) => selectedIds.has(gid));

                    const toggleGroup = () => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (allGroupSelected) {
                          groupIds.forEach((gid) => next.delete(gid));
                        } else {
                          groupIds.forEach((gid) => next.add(gid));
                        }
                        return next;
                      });
                    };

                    return (
                      <div key={group.label} className="border-bottom">
                        {/* Group Header */}
                        <div
                          className={`d-flex align-items-center gap-2 px-3 py-2 fw-bold ${allGroupSelected ? 'bg-primary-lt' : someGroupSelected ? 'bg-warning-lt' : 'bg-light'}`}
                          style={{ cursor: "pointer", borderBottom: "1px solid #e5e7eb" }}
                          onClick={toggleGroup}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={allGroupSelected}
                            ref={(el) => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                            onChange={toggleGroup}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-grow-1">
                            <div style={{ fontSize: "0.8rem" }} className="text-dark fw-bold">
                              {group.invoice !== group.category ? (
                                <span>
                                  <span className="badge bg-primary me-1" style={{ fontSize: "0.68rem" }}>{group.invoice}</span>
                                  <span className="badge bg-info-lt text-dark" style={{ fontSize: "0.68rem" }}>{group.category}</span>
                                </span>
                              ) : (
                                <span className="badge bg-info-lt text-dark" style={{ fontSize: "0.68rem" }}>{group.category}</span>
                              )}
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.72rem" }}>{group.items.length} parameter</div>
                          </div>
                          <span className={`badge ${allGroupSelected ? 'bg-primary' : someGroupSelected ? 'bg-warning text-dark' : 'bg-secondary'}`} style={{ fontSize: "0.68rem" }}>
                            {groupIds.filter((gid) => selectedIds.has(gid)).length}/{groupIds.length}
                          </span>
                        </div>

                        {/* Group Items */}
                        <ul className="list-group list-group-flush">
                          {group.items.map((hasil, idx) => {
                            const isSelected = selectedIds.has(hasil.id);
                            return (
                              <li
                                key={hasil.id}
                                className={`list-group-item list-group-item-action d-flex align-items-start gap-2 py-2 px-4 ${isSelected ? "bg-primary-lt" : ""}`}
                                style={{ cursor: "pointer", fontSize: "0.8rem", transition: "background 0.12s" }}
                                onClick={() => toggleSelect(hasil.id)}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-1"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(hasil.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-grow-1">
                                  <div className="fw-semibold text-dark">
                                    {idx + 1}. {hasil.sampel?.parameter?.split("\n")[0] || `Sampel ${idx + 1}`}
                                  </div>
                                  <div className="d-flex gap-1 mt-1 flex-wrap">
                                    {hasil.kode_sampel && (
                                      <span className="badge bg-secondary-lt" style={{ fontSize: "0.65rem" }}>{hasil.kode_sampel}</span>
                                    )}
                                    {hasil.hasil && (
                                      <span className="badge bg-success-lt text-success" style={{ fontSize: "0.65rem" }}>Hasil: {hasil.hasil}</span>
                                    )}
                                  </div>
                                </div>
                                {isSelected
                                  ? <FaCheckSquare className="text-primary mt-1" size={15} />
                                  : <FaSquare className="text-muted mt-1" size={15} />
                                }
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Footer info */}
              <div className="card-footer py-2 text-center" style={{ background: "#f8fafc" }}>
                <small className="text-muted fw-semibold">
                  {selectedIds.size === 0
                    ? "⚠️ Belum ada sampel dipilih"
                    : `✅ ${selectedIds.size} dari ${allHasils.length} sampel dipilih`
                  }
                </small>
              </div>
            </div>
          </div>

          {/* ====== KOLOM KANAN: PREVIEW LAPORAN ====== */}
          <div className="col-lg-8">
            {selectedHasils.length === 0 ? (
              <div className="card d-print-none text-center py-5">
                <div className="card-body">
                  <p className="fs-1 mb-2">🖨️</p>
                  <h5 className="text-muted fw-bold">Belum ada sampel dipilih</h5>
                  <p className="text-muted">Pilih sampel di panel kiri untuk melihat preview laporan.</p>
                </div>
              </div>
            ) : (
              <div ref={reportRef} className="d-flex flex-column align-items-center gap-4">
                {getGroupedItems().map((groupItems, pageIdx) =>
                  renderReportPage(groupItems, pageIdx)
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-report, .printable-report * { visibility: visible; }
          .printable-report {
            position: relative !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important; max-width: 100% !important;
            box-shadow: none !important; border: none !important;
            padding: 0 !important; margin: 0 0 10px 0 !important;
          }
          .page-break-after { page-break-after: always; break-after: page; }
          .d-print-none { display: none !important; }
        }
      `}</style>
    </LayoutAdmin>
  );
}
