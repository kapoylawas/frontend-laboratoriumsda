import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Api from "../../services/api";
import { IconPrinter, IconFileSpreadsheet, IconArrowLeft } from "@tabler/icons-react";

export default function StockOpnamePrint() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const periodeQuery = searchParams.get("periode") || "SALDO AWAL 2026";

  const [headerInfo, setHeaderInfo] = useState({
    title: "LAPORAN PENERIMAAN & PENGELUARAN REAGEN & BMHP",
    instansi: "UPTD LABKESDA SIDOARJO",
    upt: "LABKESDA",
    kecamatan: "GEDANGAN",
    kabupaten: "SIDOARJO",
    periode: periodeQuery
  });

  const [reportItems, setReportItems] = useState([]);
  const [stats, setStats] = useState({
    total_item: 0,
    total_stock_awal: 0,
    total_penerimaan: 0,
    total_pemakaian: 0,
    total_sisa_stock: 0,
    total_nilai: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // Fetch Report Data
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      const token = Cookies.get("token");
      if (token) {
        Api.defaults.headers.common["Authorization"] = token;
      }

      try {
        const response = await Api.get(`/api/stock-opname/report?periode=${encodeURIComponent(periodeQuery)}`);
        if (response.data && response.data.success) {
          if (response.data.header) {
            setHeaderInfo(response.data.header);
          }
          setReportItems(response.data.data || []);
          if (response.data.stats) {
            setStats(response.data.stats);
          }
        }
      } catch (error) {
        console.error("Fetch Stock Opname Report Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [periodeQuery]);

  // Format Currency (Rp) with 2 decimals e.g., 1.425.124,00
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return "0,00";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Trigger Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Export Table to Excel (.xls)
  const handleExportExcel = () => {
    const sep = "\t";
    const fileName = `Laporan_Stock_Opname_${(headerInfo.periode || "2026").replace(/\s+/g, "_")}.xls`;

    let content = "\uFEFF"; // UTF-8 BOM for Excel
    content += `${headerInfo.title || 'LAPORAN PENERIMAAN & PENGELUARAN REAGEN & BMHP'}\n`;
    content += `${headerInfo.instansi || 'UPTD LABKESDA SIDOARJO'}\n\n`;
    content += `UPT${sep}: ${headerInfo.upt || 'LABKESDA'}\n`;
    content += `KECAMATAN${sep}: ${headerInfo.kecamatan || 'GEDANGAN'}\n`;
    content += `KABUPATEN${sep}: ${headerInfo.kabupaten || 'SIDOARJO'}\n`;
    content += `PELAPORAN PERIODE${sep}: ${headerInfo.periode || '2026'}\n\n`;

    // 12 Column Headers
    content += `NO${sep}NAMA BMHP & REAGEN${sep}SATUAN${sep}HARGA SATUAN (Rp)${sep}STOCK AWAL${sep}PENERIMAAN${sep}PEMAKAIAN${sep}SISA STOCK${sep}NILAI (Rp)${sep}ED${sep}LOT${sep}LOKASI\n`;
    content += `1${sep}2${sep}3${sep}4${sep}5${sep}7${sep}9${sep}11${sep}12${sep}ED${sep}LOT${sep}LOKASI\n`;

    reportItems.forEach((item, index) => {
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
  };

  return (
    <div className="bg-white min-vh-100 p-4 font-monospace">
      {/* CSS Styles for Print */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .d-print-none {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .table-bordered th, .table-bordered td {
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
          }
          .table-header-bg {
            background-color: #e9ecef !important;
          }
        }
        
        .stock-table th, .stock-table td {
          border: 1px solid #000;
          font-size: 12px;
          vertical-align: middle;
          padding: 4px 6px;
        }

        .header-title {
          text-decoration: underline;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin-bottom: 2px;
        }

        .header-subtitle {
          font-weight: bold;
          font-size: 14px;
          text-align: center;
          margin-bottom: 20px;
        }

        .meta-table td {
          font-size: 12px;
          font-weight: bold;
          padding: 2px 8px 2px 0;
        }
      `}</style>

      {/* Action Toolbar (Hidden during print) */}
      <div className="d-print-none mb-4 d-flex justify-content-between align-items-center bg-light p-3 rounded-3 border">
        <button
          className="btn btn-outline-secondary d-flex align-items-center"
          onClick={() => navigate(-1)}
        >
          <IconArrowLeft size={18} className="me-1" />
          Kembali
        </button>

        <div className="d-flex gap-2">
          <button className="btn btn-success d-flex align-items-center" onClick={handleExportExcel}>
            <IconFileSpreadsheet size={18} className="me-1" />
            Export ke Excel (.xls)
          </button>
          <button className="btn btn-primary d-flex align-items-center" onClick={handlePrint}>
            <IconPrinter size={18} className="me-1" />
            Cetak Dokument
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="print-container">
        {/* Main Document Header */}
        <div className="header-title">{headerInfo.title}</div>
        <div className="header-subtitle">{headerInfo.instansi}</div>

        {/* Metadata Header Block */}
        <table className="meta-table mb-3">
          <tbody>
            <tr>
              <td>UPT</td>
              <td>: {headerInfo.upt}</td>
            </tr>
            <tr>
              <td>KECAMATAN</td>
              <td>: {headerInfo.kecamatan}</td>
            </tr>
            <tr>
              <td>KABUPATEN</td>
              <td>: {headerInfo.kabupaten}</td>
            </tr>
            <tr>
              <td>PELAPORAN PERIODE</td>
              <td>: {headerInfo.periode}</td>
            </tr>
          </tbody>
        </table>

        {/* Stock Opname Official Table */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="mt-2">Memuat dokumen laporan...</div>
          </div>
        ) : (
          <table className="table table-bordered stock-table w-100 mb-4">
            <thead>
              <tr className="table-header-bg text-center fw-bold align-middle">
                <th rowSpan="2" style={{ width: "35px" }}>NO</th>
                <th rowSpan="2">NAMA BMHP & REAGEN</th>
                <th rowSpan="2" style={{ width: "90px" }}>SATUAN</th>
                <th rowSpan="2" style={{ width: "120px" }}>HARGA SATUAN<br />(Rp)</th>
                <th rowSpan="2" style={{ width: "70px" }}>STOCK AWAL</th>
                <th rowSpan="2" style={{ width: "70px" }}>PENERIMAAN</th>
                <th rowSpan="2" style={{ width: "70px" }}>PEMAKAIAN</th>
                <th rowSpan="2" style={{ width: "70px" }}>SISA STOCK</th>
                <th rowSpan="2" style={{ width: "130px" }}>NILAI (Rp)</th>
                <th rowSpan="2" style={{ width: "75px" }}>ED</th>
                <th rowSpan="2" style={{ width: "110px" }}>LOT</th>
                <th rowSpan="2" style={{ width: "65px" }}>LOKASI</th>
              </tr>
              <tr className="table-header-bg text-center fw-bold fs-7">
                {/* Column number index row matching screenshot */}
              </tr>
              <tr className="text-center fw-bold bg-light" style={{ fontSize: "11px" }}>
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td>5</td>
                <td>7</td>
                <td>9</td>
                <td>11</td>
                <td>12</td>
                <td>ED</td>
                <td>LOT</td>
                <td>LOKASI</td>
              </tr>
            </thead>
            <tbody>
              {reportItems.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="text-center">{index + 1}</td>
                  <td>{item.nama_bmhp}</td>
                  <td className="text-center">{item.satuan}</td>
                  <td className="text-end">{formatCurrency(item.harga_satuan)}</td>
                  <td className="text-center">{item.stock_awal}</td>
                  <td className="text-center">{item.penerimaan}</td>
                  <td className="text-center">{item.pemakaian}</td>
                  <td className="text-center fw-bold">{item.sisa_stock}</td>
                  <td className="text-end fw-bold">{formatCurrency(item.nilai)}</td>
                  <td className="text-center">{item.ed || "-"}</td>
                  <td className="text-center">{item.lot || "-"}</td>
                  <td className="text-center">{item.lokasi || "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="fw-bold bg-light">
                <td colSpan="4" className="text-end text-uppercase">TOTAL:</td>
                <td className="text-center">{stats.total_stock_awal}</td>
                <td className="text-center">{stats.total_penerimaan}</td>
                <td className="text-center">{stats.total_pemakaian}</td>
                <td className="text-center fs-6">{stats.total_sisa_stock}</td>
                <td className="text-end fs-6">{formatCurrency(stats.total_nilai)}</td>
                <td colSpan="3"></td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Signature Block at Bottom */}
        <div className="row mt-5 pt-3" style={{ fontSize: "12px", pageBreakInside: "avoid" }}>
          <div className="col-6 text-center">
            <div>Mengetahui,</div>
            <div className="fw-bold">Kepala UPTD Labkesda Sidoarjo</div>
            <div style={{ height: "70px" }}></div>
            <div className="fw-bold text-decoration-underline">(...................................................)</div>
            <div>NIP. ...................................................</div>
          </div>
          <div className="col-6 text-center">
            <div>Sidoarjo, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
            <div className="fw-bold">Pengurus Barang / Pengelola BMHP</div>
            <div style={{ height: "70px" }}></div>
            <div className="fw-bold text-decoration-underline">(...................................................)</div>
            <div>NIP. ...................................................</div>
          </div>
        </div>
      </div>
    </div>
  );
}
