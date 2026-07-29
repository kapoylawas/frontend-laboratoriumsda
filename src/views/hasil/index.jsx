import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LayoutAdmin from "../../layouts/admin";
import PaginationComponent from "../../components/Pagination";
import Cookies from "js-cookie";
import Api from "../../services/api";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";

// Helper: load an image URL to base64 data URL via canvas
const loadImageAsBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

// Helper: generate QR Code canvas data URL with embedded logo in center
const generateQrCodeDataUrl = (logoBase64) =>
  new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Draw realistic QR pattern
    ctx.fillStyle = "#000000";
    const moduleSize = 8;
    const cols = Math.floor(size / moduleSize);

    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        if (r < 8 && c < 8) continue;
        if (r < 8 && c >= cols - 8) continue;
        if (r >= cols - 8 && c < 8) continue;
        if (r >= cols * 0.35 && r <= cols * 0.65 && c >= cols * 0.35 && c <= cols * 0.65) continue;

        if (random() > 0.45) {
          ctx.fillRect(c * moduleSize, r * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    const drawFinderPattern = (x, y) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
      ctx.fillStyle = "#000000";
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
    };

    drawFinderPattern(0, 0);
    drawFinderPattern((cols - 7) * moduleSize, 0);
    drawFinderPattern(0, (cols - 7) * moduleSize);

    // Center logo overlay
    const logoSize = size * 0.28;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

    if (logoBase64) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(canvas.toDataURL("image/png"));
      img.src = logoBase64;
    } else {
      resolve(canvas.toDataURL("image/png"));
    }
  });

const generateReportPdfBlob = async (items) => {
  if (!items || items.length === 0) return null;
  const firstItem = items[0] || {};
  const catName = firstItem.sampel?.category?.name || "PAKET PEMERIKSAAN BERSIH";
  const tanggalCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const tglPengerjaan = firstItem.tanggal_pengerjaan
    ? new Date(firstItem.tanggal_pengerjaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : tanggalCetak;
  const noLaporan = firstItem.nomor_laporan || "600.4.26.2/102/438.5.2.3/2026";
  const permenkes = firstItem.tujuan_permenkes || "PERMENKES RI NO. 2 Tahun 2023";
  const pengambilanLokasi = firstItem.sampel?.pengambilan_lokasi || firstItem.pengambilan_lokasi || "Tim ke Lokasi";
  const petugasPengambil = firstItem.sampel?.petugas_pengambil || firstItem.petugas_pengambil || "-";
  const verifikatorName = firstItem.verifikator?.name || "Admin";
  const pemeriksaName = firstItem.user?.name || "-";
  const pemeriksaNip = firstItem.user?.nip || "-";
  const kepalaName = firstItem.kepala?.name || "Admin";
  const kepalaPangkat = firstItem.kepala?.pangkat || "Penata Tk. I / IIId";
  const kepalaNip = firstItem.kepala?.nip || "196909141991021002";

  // Load logo & generate QR Code with logo
  const logoBase64 = await loadImageAsBase64("/sidoarjo.png");
  const qrImageBase64 = await generateQrCodeDataUrl(logoBase64);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pw = 210;
  const ml = 15;
  const mr = 15;
  const cw = pw - ml - mr;
  let y = 15;

  // ─── KOP SURAT ───────────────────────────────────────────────
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", ml, y - 5, 20, 20);
  }

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("PEMERINTAH KABUPATEN SIDOARJO", pw / 2, y, { align: "center" }); y += 5;
  doc.text("DINAS KESEHATAN", pw / 2, y, { align: "center" }); y += 5;
  doc.setFontSize(13);
  doc.text("UPTD. LABORATORIUM KESEHATAN DAERAH", pw / 2, y, { align: "center" }); y += 5;
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text("Jalan A. Yani no. 42 Gedangan, Sidoarjo, Kode Pos 61254", pw / 2, y, { align: "center" }); y += 4;
  doc.text("Telepon (031) 8533726  |  labkes.sidoarjo@gmail.com", pw / 2, y, { align: "center" }); y += 4;

  doc.setLineWidth(1.0);
  doc.line(ml, y, ml + cw, y); y += 1;
  doc.setLineWidth(0.3);
  doc.line(ml, y, ml + cw, y); y += 3;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh BSrE, Badan Siber dan Sandi Negara", pw / 2, y, { align: "center", maxWidth: cw }); y += 7;
  doc.setTextColor(0, 0, 0);

  // ─── JUDUL ───────────────────────────────────────────────────
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text("LAPORAN HASIL PENGUJIAN", pw / 2, y, { align: "center" });
  const titleW = doc.getTextWidth("LAPORAN HASIL PENGUJIAN");
  doc.setLineWidth(0.3);
  doc.line(pw / 2 - titleW / 2, y + 0.5, pw / 2 + titleW / 2, y + 0.5); y += 5;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`Nomor: ${noLaporan}`, pw / 2, y, { align: "center" }); y += 8;

  // ─── METADATA ────────────────────────────────────────────────
  doc.setFontSize(11);
  const col1 = ml;
  const col2 = ml + 52;
  const col3 = col2 + 5;
  const metaRows = [
    ["Jenis Pemeriksaan", catName],
    ["Pengambilan Lokasi", pengambilanLokasi],
    ["Tanggal Pengerjaan", tglPengerjaan],
    ["Petugas Pengambil Sampel", petugasPengambil],
    ["Verifikator", verifikatorName],
  ];
  for (const [label, val] of metaRows) {
    doc.setFont("times", "normal");
    doc.text(label, col1, y);
    doc.text(":", col2, y);
    doc.text(String(val || "-"), col3, y, { maxWidth: pw - col3 - mr });
    y += 5;
  }
  y += 3;

  // ─── TABEL HASIL ─────────────────────────────────────────────
  const colWidths = [10, 48, 32, 30, 20, 22, 18];
  const headers = ["NO.", "PARAMETER / JENIS SAMPEL", "KODE SAMPEL", "METODE", "SATUAN", "BATAS MAKSIMAL", "HASIL"];
  const rowH = 8;
  const tableLeft = ml;

  doc.setFillColor(248, 249, 250);
  doc.rect(tableLeft, y, cw, rowH, "F");
  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  let cx = tableLeft;
  for (let i = 0; i < headers.length; i++) {
    doc.rect(cx, y, colWidths[i], rowH);
    doc.text(headers[i], cx + colWidths[i] / 2, y + 5, { align: "center", maxWidth: colWidths[i] - 2 });
    cx += colWidths[i];
  }
  y += rowH;

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  items.forEach((item, idx) => {
    const cells = [
      `${idx + 1}.`,
      item.sampel?.parameter || "-",
      item.kode_sampel || "-",
      item.metode || "-",
      item.satuan || "-",
      String(item.kadar_maksimal ?? "-"),
      String(item.hasil ?? "-"),
    ];
    cx = tableLeft;
    for (let i = 0; i < cells.length; i++) {
      doc.rect(cx, y, colWidths[i], rowH);
      const align = i === 1 ? "left" : "center";
      const xText = i === 1 ? cx + 2 : cx + colWidths[i] / 2;
      doc.text(String(cells[i]), xText, y + 5, { align, maxWidth: colWidths[i] - 2 });
      cx += colWidths[i];
    }
    y += rowH;
  });
  y += 5;

  // ─── CATATAN ─────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text("Perhatian: Hasil pemeriksaan ini berlaku untuk sampel/spesimen yang tertera", ml, y); y += 4;
  doc.setFont("times", "bold");
  doc.text(`*)${permenkes}`, ml, y); y += 12;

  // ─── TTD SECTION (Format BSrE Gambar 2) ────────────────────────
  const leftCenterX = ml + 10;
  const rightMarginX = ml + cw * 0.52;

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(`Sidoarjo, ${tanggalCetak}`, rightMarginX, y); y += 5;

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("PEMERIKSA,", leftCenterX, y);
  doc.text("KEPALA LABORATORIUM KESEHATAN", rightMarginX, y); y += 5;
  doc.text("DAERAH,", rightMarginX, y); y += 4;

  const qrStartY = y;
  const qrSize = 24; // 24mm x 24mm

  // Draw QR code with Sidoarjo logo in center
  if (qrImageBase64) {
    doc.addImage(qrImageBase64, "PNG", rightMarginX, qrStartY, qrSize, qrSize);
  }

  // Text on right side of QR code
  const textX = rightMarginX + qrSize + 4;
  let textY = qrStartY + 5;

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.text("Ditandatangani secara elektronik oleh", textX, textY); textY += 6;

  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.text(kepalaName, textX, textY); textY += 5;

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.text("Kepala Laboratorium Kesehatan Daerah", textX, textY);

  // Position for Name & NIP below QR
  y = qrStartY + qrSize + 6;

  // Left side (Pemeriksa)
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  const pNameUpper = pemeriksaName.toUpperCase();
  doc.text(pNameUpper, leftCenterX, y);
  const lw1 = doc.getTextWidth(pNameUpper);
  doc.setLineWidth(0.3);
  doc.line(leftCenterX, y + 0.5, leftCenterX + lw1, y + 0.5);

  // Right side (Kepala)
  const kNameUpper = kepalaName.toUpperCase();
  doc.text(kNameUpper, rightMarginX, y);
  y += 5;

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text(`NIP. ${pemeriksaNip}`, leftCenterX, y);
  doc.text(`NIP ${kepalaNip}`, rightMarginX, y); y += 15;

  // ─── FOOTER ──────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik", pw / 2, y, { align: "center" }); y += 4;
  doc.text("yang diterbitkan oleh Balai Besar Sertifikasi Elektronik (BSrE), Badan Siber dan Sandi Negara", pw / 2, y, { align: "center" });

  return doc.output("blob");
};



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
  const [selectedPrintIds, setSelectedPrintIds] = useState(new Set());
  const [showTteModal, setShowTteModal] = useState(false);
  const [tteUploadFile, setTteUploadFile] = useState(null);
  const [tteUploadNik, setTteUploadNik] = useState("1234567890123452");
  const [tteUploadPassphrase, setTteUploadPassphrase] = useState("Bsre2026.#@");
  const [tteUploading, setTteUploading] = useState(false);
  const navigate = useNavigate();

  const currentUserCookie = Cookies.get("user");
  const currentUser = currentUserCookie ? JSON.parse(currentUserCookie) : {};
  const userRoleId = currentUser?.role_id;
  const canInputHasil = userRoleId === 2 || userRoleId === 3 || userRoleId === 6 || (currentUser?.role?.name && currentUser.role.name.toLowerCase().includes("sanitarian"));

  // ---- PRINT SELECTION HELPERS ----
  const togglePrintSelect = (hasilId) => {
    setSelectedPrintIds((prev) => {
      const next = new Set(prev);
      next.has(hasilId) ? next.delete(hasilId) : next.add(hasilId);
      return next;
    });
  };

  const toggleGroupSelect = (items) => {
    const approvedGroupIds = items.filter((i) => i.status_verifikasi === "DISETUJUI" || i.status).map((i) => i.id);
    if (approvedGroupIds.length === 0) {
      Swal.fire({ icon: "info", title: "Belum Ada TTD", text: "Sampel dalam kelompok ini belum ada yang disetujui TTD oleh Kepala Labkesda.", timer: 2000, showConfirmButton: false });
      return;
    }
    const allSelected = approvedGroupIds.every((id) => selectedPrintIds.has(id));
    setSelectedPrintIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        approvedGroupIds.forEach((id) => next.delete(id));
      } else {
        approvedGroupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleCetakTerpilih = () => {
    if (selectedPrintIds.size === 0) {
      Swal.fire({ icon: "warning", title: "Belum ada sampel dipilih", text: "Centang sampel yang ingin dicetak terlebih dahulu.", timer: 2000, showConfirmButton: false });
      return;
    }
    const ids = [...selectedPrintIds];
    navigate(`/hasil/print/${ids[0]}`, { state: { selectedIds: ids } });
  };

  const getVerifikasiBadge = (statusVerifikasi) => {
    switch (statusVerifikasi) {
      case "MENUNGGU_VERIFIKASI":
        return <span className="badge bg-warning text-dark">⏳ Menunggu Verifikator</span>;
      case "REVISI_ANALIS":
        return <span className="badge bg-danger text-white">⚠️ Revisi Analis</span>;
      case "DIVERIFIKASI":
        return <span className="badge bg-info text-dark">🔍 Diverifikasi (Kepala)</span>;
      case "DISETUJUI":
        return <span className="badge bg-success text-white">✅ Disetujui Kepala</span>;
      case "DRAFT":
      default:
        return <span className="badge bg-secondary text-white">📝 Draft Analis</span>;
    }
  };

  const handleVerifikasiAction = async (hasilId, action) => {
    try {
      let catatan = "";
      let tteData = null;

      if (action === "VERIFY_REJECT" || action === "KEPALA_REJECT") {
        const { value: text } = await Swal.fire({
          title: "Catatan Revisi",
          input: "textarea",
          inputLabel: "Catatan revisi untuk Analis",
          inputPlaceholder: "Tuliskan poin perbaikan...",
          showCancelButton: true,
          confirmButtonText: "Kirim Revisi",
          cancelButtonText: "Batal"
        });
        if (!text) return;
        catatan = text;
      } else if (action === "KEPALA_APPROVE") {
        const { value: formValues, isDismissed } = await Swal.fire({
          title: "🔏 Penandatanganan Elektronik (TTE BSrE)",
          html: `
            <div style="text-align: left; font-size: 13px;">
              <p style="color: #64748b; margin-bottom: 12px;">Persetujuan TTD Kepala Labkesda via API TTE BSrE: <code>10.1.10.9/api/sign/pdf</code></p>
              
              <div style="margin-bottom: 12px;">
                <label style="font-weight: bold; display: block; margin-bottom: 4px;">NIK Penandatangan:</label>
                <input id="swal-nik" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px;" value="1234567890123452" placeholder="Masukkan NIK" />
              </div>

              <div style="margin-bottom: 12px;">
                <label style="font-weight: bold; display: block; margin-bottom: 4px;">Passphrase TTE:</label>
                <input id="swal-passphrase" type="password" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px;" value="Bsre2026.#@" placeholder="Masukkan Passphrase" />
              </div>

              <div style="margin-bottom: 8px;">
                <label style="font-weight: bold; display: block; margin-bottom: 4px;">Tampilan TTE:</label>
                <select id="swal-tampilan" class="swal2-select" style="width: 100%; margin: 0; font-size: 13px;">
                  <option value="invisible" selected>Invisible (Elektronik BSrE + Barcode QR)</option>
                  <option value="visible">Visible (Tampilan TTD Visual)</option>
                </select>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "🔏 TTD & Setujui (TTE BSrE)",
          cancelButtonText: "Batal",
          confirmButtonColor: "#0d6efd",
          preConfirm: () => {
            return {
              nik: document.getElementById("swal-nik").value,
              passphrase: document.getElementById("swal-passphrase").value,
              tampilan: document.getElementById("swal-tampilan").value
            };
          }
        });
        if (isDismissed || !formValues) return;
        tteData = formValues;
      } else {
        const confirmResult = await Swal.fire({
          title: "Konfirmasi Verifikasi",
          text: action === "SUBMIT_VERIFIKASI"
            ? "Kirim hasil pengujian ini ke Verifikator?"
            : "Verifikasi dan teruskan ke Kepala Labkesda?",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#0d6efd",
          confirmButtonText: "Ya, Lanjutkan!",
          cancelButtonText: "Batal"
        });
        if (!confirmResult.isConfirmed) return;
      }

      let pdfWindow = null;
      if (action === "KEPALA_APPROVE" && tteData) {
        try {
          pdfWindow = window.open('about:blank', '_blank');
          if (pdfWindow) {
            pdfWindow.document.write(`
              <html>
                <head><title>Memproses TTE BSrE...</title></head>
                <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b;">
                  <div style="text-align: center; padding: 36px 48px; background: white; border: 2.5px solid #000; box-shadow: 6px 6px 0 #000; border-radius: 16px;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">🔏</div>
                    <h3 style="margin: 0 0 8px 0; font-weight: 800;">Memproses TTD TTE BSrE...</h3>
                    <p style="color: #64748b; margin: 0; font-size: 0.95rem;">Meng-generate PDF Laporan Hasil Pengujian &amp; membubuhi sertifikat elektronik.<br/>Halaman PDF bertanda tangan akan terbuka otomatis...</p>
                  </div>
                </body>
              </html>
            `);
          }
        } catch (e) {}
      }

      Swal.fire({
        title: "Memproses TTE & verifikasi...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const token = Cookies.get("token");
      if (!token) return;
      Api.defaults.headers.common["Authorization"] = token;

      let ttePdfBlobUrl = null;
      if (action === "KEPALA_APPROVE" && tteData) {
        const targetItem = hasils.find((h) => h.id === hasilId) || {};
        const pdfBlob = await generateReportPdfBlob([targetItem]);

        const formData = new FormData();
        if (pdfBlob) {
          formData.append("file", pdfBlob, `Laporan_Hasil_${hasilId}.pdf`);
        }
        formData.append("id", hasilId);
        formData.append("nik", tteData.nik || "1234567890123452");
        formData.append("passphrase", tteData.passphrase || "Bsre2026.#@");
        formData.append("tampilan", tteData.tampilan || "invisible");

        try {
          const resTte = await Api.post("/api/hasils/tte-sign", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            responseType: "arraybuffer"
          });

          // Cek apakah response adalah PDF: content-type header atau magic bytes %PDF
          const resContentType = resTte.headers?.["content-type"] || "";
          const isPdf = resContentType.includes("application/pdf") ||
            (resTte.data instanceof ArrayBuffer &&
              new TextDecoder().decode(new Uint8Array(resTte.data, 0, 4)) === "%PDF");

          if (isPdf && resTte.data) {
            const signedBlob = new Blob([resTte.data], { type: "application/pdf" });
            ttePdfBlobUrl = URL.createObjectURL(signedBlob);
          }
        } catch (errTte) {
          if (pdfWindow && !pdfWindow.closed) pdfWindow.close();
          throw errTte;
        }
      } else {
        await Api.put(`/api/hasils/${hasilId}/verifikasi`, {
          action,
          catatan_revisi: catatan
        });
      }

      Swal.close();

      if (action === "KEPALA_APPROVE") {
        if (ttePdfBlobUrl && pdfWindow && !pdfWindow.closed) {
          pdfWindow.location.href = ttePdfBlobUrl;
          Swal.fire({
            icon: "success",
            title: "✅ TTD TTE BSrE Berhasil!",
            text: "Dokumen PDF bertanda tangan telah dibuka di tab baru.",
            timer: 2000,
            showConfirmButton: false
          });
        } else if (ttePdfBlobUrl) {
          await Swal.fire({
            icon: "success",
            title: "✅ TTD TTE BSrE Berhasil!",
            html: `<p>Laporan Hasil Pengujian berhasil ditandatangani secara elektronik (BSrE TTE) &amp; disetujui!</p>
                   <a href="${ttePdfBlobUrl}" target="_blank" rel="noopener noreferrer"
                      style="display:inline-block;margin-top:10px;padding:10px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                      📄 Buka PDF Bertanda Tangan
                   </a>`,
            confirmButtonText: "Tutup",
            confirmButtonColor: "#6b7280"
          });
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Status verifikasi berjenjang berhasil diperbarui.",
          timer: 2000,
          showConfirmButton: false
        });
      }

      fetchData(pagination.currentPage, search, filterDate);

    } catch (error) {
      console.error("Error verifikasi:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Verifikasi",
        text: error.response?.data?.message || "Terjadi kesalahan"
      });
    }
  };

  const handleBatchVerifikasi = async (items, action) => {
    let targetItems = items;
    if (action === "SUBMIT_VERIFIKASI") {
      targetItems = items.filter((i) => !i.status_verifikasi || i.status_verifikasi === "DRAFT" || i.status_verifikasi === "REVISI_ANALIS");
    } else if (action === "VERIFY_APPROVE" || action === "VERIFY_REJECT") {
      targetItems = items.filter((i) => i.status_verifikasi === "MENUNGGU_VERIFIKASI");
    } else if (action === "KEPALA_APPROVE" || action === "KEPALA_REJECT") {
      targetItems = items.filter((i) => i.status_verifikasi === "DIVERIFIKASI");
    }
    const ids = targetItems.map((i) => i.id);
    if (ids.length === 0) return;

    try {
      let catatan = "";
      let tteData = null;

      if (action === "VERIFY_REJECT" || action === "KEPALA_REJECT") {
        const { value: text } = await Swal.fire({
          title: "Catatan Revisi Kumpulan Sampel",
          input: "textarea",
          inputLabel: "Masukkan alasan/catatan revisi",
          inputPlaceholder: "Tuliskan poin perbaikan...",
          showCancelButton: true,
          confirmButtonText: "Kirim Revisi",
          cancelButtonText: "Batal"
        });
        if (!text) return;
        catatan = text;
      } else if (action === "KEPALA_APPROVE") {
        const { value: formValues, isDismissed } = await Swal.fire({
          title: `🔏 Penandatanganan Elektronik ${ids.length} Sampel (TTE BSrE)`,
          html: `
            <div style="text-align: left; font-size: 13px;">
              <p style="color: #64748b; margin-bottom: 12px;">Persetujuan TTD Kepala Labkesda untuk ${ids.length} parameter sampel sekaligus (BSrE API: <code>10.1.10.9/api/sign/pdf</code>)</p>
              
              <div style="margin-bottom: 12px;">
                <label style="font-weight: bold; display: block; margin-bottom: 4px;">NIK Penandatangan:</label>
                <input id="swal-batch-nik" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px;" value="1234567890123452" placeholder="Masukkan NIK" />
              </div>

              <div style="margin-bottom: 12px;">
                <label style="font-weight: bold; display: block; margin-bottom: 4px;">Passphrase TTE:</label>
                <input id="swal-batch-passphrase" type="password" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px;" value="Bsre2026.#@" placeholder="Masukkan Passphrase" />
              </div>

              <div style="margin-bottom: 8px;">
                <label style="font-weight: bold; display: block; margin-bottom: 4px;">Tampilan TTE:</label>
                <select id="swal-batch-tampilan" class="swal2-select" style="width: 100%; margin: 0; font-size: 13px;">
                  <option value="invisible" selected>Invisible (Elektronik BSrE + Barcode QR)</option>
                  <option value="visible">Visible (Tampilan TTD Visual)</option>
                </select>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "🔏 TTD & Setujui Semua (TTE BSrE)",
          cancelButtonText: "Batal",
          confirmButtonColor: "#0d6efd",
          preConfirm: () => {
            return {
              nik: document.getElementById("swal-batch-nik").value,
              passphrase: document.getElementById("swal-batch-passphrase").value,
              tampilan: document.getElementById("swal-batch-tampilan").value
            };
          }
        });
        if (isDismissed || !formValues) return;
        tteData = formValues;
      } else {
        const confirmResult = await Swal.fire({
          title: "Verifikasi Batch Kumpulan Sampel",
          text: `Apakah Anda yakin ingin memproses status verifikasi untuk ${ids.length} parameter sampel ini sekaligus?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#0d6efd",
          confirmButtonText: "Ya, Verifikasi Semua!",
          cancelButtonText: "Batal"
        });
        if (!confirmResult.isConfirmed) return;
      }

      let pdfWindow = null;
      if (action === "KEPALA_APPROVE" && tteData) {
        try {
          pdfWindow = window.open('about:blank', '_blank');
          if (pdfWindow) {
            pdfWindow.document.write(`
              <html>
                <head><title>Memproses TTE BSrE...</title></head>
                <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b;">
                  <div style="text-align: center; padding: 36px 48px; background: white; border: 2.5px solid #000; box-shadow: 6px 6px 0 #000; border-radius: 16px;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">🔏</div>
                    <h3 style="margin: 0 0 8px 0; font-weight: 800;">Memproses TTD TTE BSrE (${ids.length} Sampel)...</h3>
                    <p style="color: #64748b; margin: 0; font-size: 0.95rem;">Meng-generate PDF Laporan Hasil Pengujian &amp; membubuhi sertifikat elektronik.<br/>Halaman PDF bertanda tangan akan terbuka otomatis...</p>
                  </div>
                </body>
              </html>
            `);
          }
        } catch (e) {}
      }

      Swal.fire({
        title: "Memproses TTE batch...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const token = Cookies.get("token");
      if (!token) return;
      Api.defaults.headers.common["Authorization"] = token;

      let ttePdfBlobUrl = null;
      if (action === "KEPALA_APPROVE" && tteData) {
        const targetItems = hasils.filter((h) => ids.includes(h.id));
        const pdfBlob = await generateReportPdfBlob(targetItems);

        const formData = new FormData();
        if (pdfBlob) {
          formData.append("file", pdfBlob, `Laporan_Hasil_Batch_${ids[0]}.pdf`);
        }
        formData.append("hasil_ids", JSON.stringify(ids));
        formData.append("nik", tteData.nik || "1234567890123452");
        formData.append("passphrase", tteData.passphrase || "Bsre2026.#@");
        formData.append("tampilan", tteData.tampilan || "invisible");

        try {
          const resTte = await Api.post("/api/hasils/tte-sign", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            responseType: "arraybuffer"
          });

          // Cek apakah response adalah PDF: content-type header atau magic bytes %PDF
          const resContentType = resTte.headers?.["content-type"] || "";
          const isPdf = resContentType.includes("application/pdf") ||
            (resTte.data instanceof ArrayBuffer &&
              new TextDecoder().decode(new Uint8Array(resTte.data, 0, 4)) === "%PDF");

          if (isPdf && resTte.data) {
            const signedBlob = new Blob([resTte.data], { type: "application/pdf" });
            ttePdfBlobUrl = URL.createObjectURL(signedBlob);
          }
        } catch (errTte) {
          if (pdfWindow && !pdfWindow.closed) pdfWindow.close();
          throw errTte;
        }
      } else {
        await Api.put(`/api/hasils/${ids[0]}/verifikasi`, {
          action,
          catatan_revisi: catatan,
          hasil_ids: ids
        });
      }

      Swal.close();

      if (action === "KEPALA_APPROVE") {
        if (ttePdfBlobUrl && pdfWindow && !pdfWindow.closed) {
          pdfWindow.location.href = ttePdfBlobUrl;
          Swal.fire({
            icon: "success",
            title: "✅ TTD TTE BSrE Berhasil!",
            text: `Berhasil menandatangani TTE (BSrE) & menyetujui ${ids.length} parameter sampel! Dokumen PDF telah dibuka di tab baru.`,
            timer: 2000,
            showConfirmButton: false
          });
        } else if (ttePdfBlobUrl) {
          await Swal.fire({
            icon: "success",
            title: "✅ TTD TTE BSrE Berhasil!",
            html: `<p>Berhasil menandatangani TTE (BSrE) &amp; menyetujui ${ids.length} parameter sampel!</p>
                   <a href="${ttePdfBlobUrl}" target="_blank" rel="noopener noreferrer"
                      style="display:inline-block;margin-top:10px;padding:10px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                      📄 Buka PDF Bertanda Tangan
                   </a>`,
            confirmButtonText: "Tutup",
            confirmButtonColor: "#6b7280"
          });
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: `Berhasil memproses status verifikasi untuk ${ids.length} parameter sampel!`,
          timer: 2000,
          showConfirmButton: false
        });
      }

      fetchData(pagination.currentPage, search, filterDate);

    } catch (error) {
      console.error("Error batch verifikasi:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Verifikasi",
        text: error.response?.data?.message || "Terjadi kesalahan"
      });
    }
  };

  const handleTteUpload = async () => {
    if (!tteUploadFile) {
      Swal.fire({ icon: "warning", title: "Pilih file PDF terlebih dahulu", timer: 2000, showConfirmButton: false });
      return;
    }
    setTteUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", tteUploadFile, tteUploadFile.name);
      formData.append("nik", tteUploadNik || "1234567890123452");
      formData.append("passphrase", tteUploadPassphrase || "Bsre2026.#@");
      formData.append("tampilan", "invisible");

      const token = Cookies.get("token");
      if (token) Api.defaults.headers.common["Authorization"] = token;

      const res = await Api.post("/api/hasils/tte-sign", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "arraybuffer"
      });

      const contentType = res.headers?.["content-type"] || "";
      const first4Bytes = res.data && res.data.byteLength >= 4 ? new TextDecoder().decode(new Uint8Array(res.data, 0, 4)) : "";
      const isPdf = contentType.includes("application/pdf") || first4Bytes === "%PDF";

      if (isPdf && res.data) {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setShowTteModal(false);
        await Swal.fire({
          icon: "success",
          title: "✅ TTE Berhasil!",
          html: `<p>File berhasil ditandatangani secara elektronik (BSrE).</p>
                 <a href="${url}" target="_blank" rel="noopener noreferrer"
                    style="display:inline-block;margin-top:10px;padding:10px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                    📄 Buka PDF Bertanda Tangan
                 </a>`,
          confirmButtonText: "Tutup",
          confirmButtonColor: "#6b7280"
        });
      } else {
        let errMessage = "Server tidak mengembalikan file PDF.";
        if (res.data instanceof ArrayBuffer) {
          try {
            const jsonText = new TextDecoder().decode(new Uint8Array(res.data));
            const json = JSON.parse(jsonText);
            if (json.message) errMessage = json.message;
          } catch (e) {}
        }
        Swal.fire({ icon: "error", title: "Gagal TTE", text: errMessage });
      }
    } catch (err) {
      console.error("TTE Upload error:", err);
      let errMsg = err.message || "Terjadi kesalahan";
      if (err.response?.data instanceof ArrayBuffer) {
        try {
          const jsonText = new TextDecoder().decode(new Uint8Array(err.response.data));
          const json = JSON.parse(jsonText);
          if (json.message) errMsg = json.message;
        } catch (e) {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      Swal.fire({ icon: "error", title: "Gagal Tanda Tangan", text: errMsg });
    } finally {
      setTteUploading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const fetchData = async (pageNumber, keywords = "", date = "", silent = false) => {
    if (!silent) setIsLoading(true);
    const page = pageNumber ? pageNumber : pagination.currentPage;
    const token = Cookies.get("token");

    if (token) {
      Api.defaults.headers.common["Authorization"] = token;
      try {
        const params = [`page=${page}`];
        if (keywords && keywords.trim()) {
          params.push(`search=${encodeURIComponent(keywords.trim())}`);
        }
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
        if (!silent) {
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "Gagal mengambil data hasil!",
          });
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    } else {
      if (!silent) {
        setIsLoading(false);
        Swal.fire({
          icon: "warning",
          title: "Tidak Ada Token",
          text: "Silahkan login ulang!",
          timer: 2000,
        });
      }
    }
  };

  const searchRef = useRef(search);
  const filterDateRef = useRef(filterDate);
  const currentPageRef = useRef(pagination.currentPage);
  const editingIdRef = useRef(editingId);
  const showEditModalRef = useRef(showEditModal);

  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { filterDateRef.current = filterDate; }, [filterDate]);
  useEffect(() => { currentPageRef.current = pagination.currentPage; }, [pagination.currentPage]);
  useEffect(() => { editingIdRef.current = editingId; }, [editingId]);
  useEffect(() => { showEditModalRef.current = showEditModal; }, [showEditModal]);

  const prevPendingCountRef = useRef(null);

  // Realtime Toast Alert when new pending items arrive
  useEffect(() => {
    let currentPendingCount = 0;
    if (userRoleId === 4) {
      currentPendingCount = hasils.filter((i) => i.status_verifikasi === "MENUNGGU_VERIFIKASI").length;
    } else if (userRoleId === 5) {
      currentPendingCount = hasils.filter((i) => i.status_verifikasi === "DIVERIFIKASI").length;
    }

    if (prevPendingCountRef.current !== null && currentPendingCount > prevPendingCountRef.current) {
      const diff = currentPendingCount - prevPendingCountRef.current;
      const roleText = userRoleId === 4 ? "perlu Anda verifikasi!" : "membutuhkan TTD Anda!";
      
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: "info",
        title: `🔔 Ada ${diff} sampel baru masuk yang ${roleText}`,
      });
    }

    prevPendingCountRef.current = currentPendingCount;
  }, [hasils, userRoleId]);

  useEffect(() => {
    fetchData();

    // Auto-refresh silent polling setiap 3 detik untuk real-time sync lintas komputer
    const interval = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !editingIdRef.current &&
        !showEditModalRef.current &&
        !Swal.isVisible()
      ) {
        fetchData(currentPageRef.current, searchRef.current, filterDateRef.current, true);
      }
    }, 3000);

    const handleFocus = () => {
      if (!editingIdRef.current && !showEditModalRef.current && !Swal.isVisible()) {
        fetchData(currentPageRef.current, searchRef.current, filterDateRef.current, true);
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
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

  const [groupByMode, setGroupByMode] = useState("invoice"); // "invoice" or "category"

  const handleClearFilters = () => {
    setSearch("");
    setFilterDate("");
    fetchData(1, "", "");
  };

  // Group hasils by Transaction ID (unique per transaction) or by Category
  const getGroupedData = () => {
    // Store full meta per group key so we can display it in the header
    const grouped = {};
    const meta = {};

    hasils.forEach((hasil) => {
      let groupKey = "";
      if (groupByMode === "invoice") {
        // Use transaction_id as unique key — different transactions ALWAYS get different cards
        const txId = hasil.transaction_id || hasil.transaction?.id || `user_${hasil.user_id}`;
        groupKey = `INVOICE___${txId}`;

        // Store meta from the first item in this group
        if (!meta[groupKey]) {
          meta[groupKey] = {
            txId,
            invoice: hasil.transaction?.invoice || hasil.nomor_laporan || `INV-${txId}`,
            userName: hasil.transaction?.user?.name || hasil.user?.name || "Pemohon",
            createdAt: hasil.transaction?.created_at || hasil.created_at
          };
        }
      } else {
        const catName = hasil.sampel?.category?.name || "Tanpa Kategori";
        groupKey = `CATEGORY___${catName}`;
        if (!meta[groupKey]) meta[groupKey] = { catName };
      }

      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(hasil);
    });

    return { grouped, meta };
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
    if (userRoleId === 4) return; // Verifikator cannot edit
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
      <style>{`
        .swal2-container {
          z-index: 100000 !important;
        }
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
        .btn-3d-success:hover {
          background: #15803d !important;
          color: #ffffff !important;
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0px #000000 !important;
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
        .toggle-3d-group {
          display: inline-flex;
          align-items: center;
          background: #f1f5f9 !important;
          border: 2.5px solid #000000 !important;
          box-shadow: 4px 4px 0px #000000 !important;
          border-radius: 14px !important;
          padding: 4px !important;
          gap: 4px;
        }
        .toggle-3d-btn {
          border: 1.5px solid transparent !important;
          border-radius: 10px !important;
          padding: 6px 14px !important;
          font-size: 0.85rem !important;
          font-weight: 700 !important;
          color: #475569 !important;
          background: transparent !important;
          transition: all 0.15s ease-in-out !important;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .toggle-3d-btn:hover {
          color: #0f172a !important;
          background: rgba(255, 255, 255, 0.7) !important;
        }
        .toggle-3d-btn.active {
          background: #2563eb !important;
          color: #ffffff !important;
          border: 1.5px solid #000000 !important;
          box-shadow: 2px 2px 0px #000000 !important;
        }
        .modal-content-3d {
          border: 3.5px solid #000000 !important;
          box-shadow: 10px 10px 0px #000000 !important;
          border-radius: 24px !important;
          overflow: hidden;
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
      `}</style>
      <div className="page-wrapper">
        <div className="page-header d-print-none">
          <div className="container-fluid px-3 px-lg-4">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title fw-extrabold text-dark d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                  🧪 Hasil Pemeriksaan Laboratorium
                  <span className="badge bg-success-lt text-success fs-6 border border-success-subtle rounded-pill px-2 py-1 ms-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '8px', height: '8px' }} role="status"></span>
                    Realtime Auto-Sync
                  </span>
                </h2>
                <div className="text-muted mt-1 fw-semibold">Kelola dan atur parameter hasil uji laboratorium</div>
              </div>
              <div className="col-auto ms-auto d-print-none">
                <div className="d-flex align-items-center gap-2">
                  {/* View Mode Toggle: Per Invoice vs Per Kategori */}
                  <div className="toggle-3d-group">
                    <button
                      type="button"
                      className={`toggle-3d-btn ${groupByMode === 'invoice' ? 'active' : ''}`}
                      onClick={() => setGroupByMode('invoice')}
                    >
                      📄 Per Invoice / Pemohon
                    </button>
                    <button
                      type="button"
                      className={`toggle-3d-btn ${groupByMode === 'category' ? 'active' : ''}`}
                      onClick={() => setGroupByMode('category')}
                    >
                      🧪 Per Kategori Sampel
                    </button>
                  </div>
                  {/* Tombol Cetak Terpilih */}
                  {selectedPrintIds.size > 0 && (
                    <button
                      className="btn btn-3d-primary d-flex align-items-center gap-2 fw-bold"
                      onClick={handleCetakTerpilih}
                    >
                      🖨️ Cetak {selectedPrintIds.size} Terpilih
                    </button>
                  )}
                  {selectedPrintIds.size > 0 && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setSelectedPrintIds(new Set())}
                      title="Hapus semua pilihan"
                    >
                      ✕ Hapus Pilihan
                    </button>
                  )}
                  <button className="btn btn-3d-secondary" onClick={handleClearFilters}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2" /><path d="M4 5v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2" /><path d="M20 19v-4h-4" /></svg>
                    Reset Filter
                  </button>
                  <button
                    className="btn btn-3d-primary fw-bold"
                    style={{ background: '#7c3aed !important', borderColor: '#000 !important' }}
                    onClick={() => { setTteUploadFile(null); setShowTteModal(true); }}
                  >
                    🔏 Upload PDF ke TTE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="container-fluid px-3 px-lg-4">
            {/* Realtime Notification Banner per Role */}
            {userRoleId === 4 && (() => {
              const pendingVerifItems = hasils.filter((i) => i.status_verifikasi === "MENUNGGU_VERIFIKASI");
              const count = pendingVerifItems.length;
              return (
                <div className="card mb-4 banner-3d p-3" style={{ background: count > 0 ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: count > 0 ? '#ea580c !important' : '#16a34a !important' }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 text-start">
                    <div className="d-flex align-items-center gap-3">
                      <div className={`badge-3d ${count > 0 ? 'bg-danger' : 'bg-success'} text-white fs-4 d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                        {count > 0 ? '🔔' : '✅'}
                      </div>
                      <div>
                        <h5 className="fw-extrabold mb-1 text-dark" style={{ fontSize: '1.05rem' }}>
                          {count > 0 ? `🔔 ${count} Parameter Hasil Uji MENUNGGU VERIFIKASI Anda!` : '✅ Semua Tugas Verifikasi Hasil Uji Selesai'}
                        </h5>
                        <small className="text-muted fw-semibold">
                          {count > 0
                            ? 'Silakan periksa item hasil uji di bawah ini dan klik tombol Setujui (ACC) atau Revisi.'
                            : 'Tidak ada sampel yang menunggu verifikasi saat ini. Data baru akan otomatis muncul secara realtime.'}
                        </small>
                      </div>
                    </div>
                    {count > 0 && (
                      <button
                        className="btn btn-3d-primary px-3 py-2 fw-bold"
                        onClick={() => handleBatchVerifikasi(pendingVerifItems, "VERIFY_APPROVE")}
                      >
                        ✓ Verifikasi Semua ({count})
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {userRoleId === 5 && (() => {
              const pendingKepalaItems = hasils.filter((i) => i.status_verifikasi === "DIVERIFIKASI");
              const count = pendingKepalaItems.length;
              return (
                <div className="card mb-4 banner-3d p-3" style={{ background: count > 0 ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: count > 0 ? '#2563eb !important' : '#16a34a !important' }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 text-start">
                    <div className="d-flex align-items-center gap-3">
                      <div className={`badge-3d ${count > 0 ? 'bg-primary' : 'bg-success'} text-white fs-4 d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                        {count > 0 ? '🔏' : '✅'}
                      </div>
                      <div>
                        <h5 className="fw-extrabold mb-1 text-dark" style={{ fontSize: '1.05rem' }}>
                          {count > 0 ? `🔏 ${count} Parameter Hasil Uji MENUNGGU TTD & PERSETUJUAN Anda!` : '✅ Semua Persetujuan & TTD Selesai'}
                        </h5>
                        <small className="text-muted fw-semibold">
                          {count > 0
                            ? 'Hasil uji telah lolos verifikasi dan memerlukan persetujuan TTD Kepala Labkesda.'
                            : 'Tidak ada sampel yang menunggu persetujuan TTD saat ini.'}
                        </small>
                      </div>
                    </div>
                    {count > 0 && (
                      <button
                        className="btn btn-3d-success px-3 py-2 fw-bold"
                        onClick={() => handleBatchVerifikasi(pendingKepalaItems, "KEPALA_APPROVE")}
                      >
                        🔏 ACC TTD Semua ({count})
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {(userRoleId !== 4 && userRoleId !== 5) && (
              <div className="card mb-4 banner-3d p-3" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 text-start">
                  <div className="d-flex align-items-center gap-3">
                    <div className="badge-3d bg-success text-white fs-5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                      2
                    </div>
                    <div>
                      <h5 className="fw-extrabold mb-1 text-dark" style={{ fontSize: '1.05rem' }}>Langkah 2 dari 3: Pengisian Hasil Uji Laboratorium</h5>
                      <small className="text-muted fw-semibold">Setelah Penjadwalan Selesai ➜ <strong>Isi Hasil Uji & Satuan</strong> ➜ Lalu lanjut ke Berita Acara</small>
                    </div>
                  </div>
                  <Link to="/berita-acara" className="btn btn-3d-success px-3 py-2">
                    Lanjut ke Langkah 3: Berita Acara ➔
                  </Link>
                </div>
              </div>
            )}

            {/* Mode Indicator Bar */}
            {(() => { const { grouped: _g } = getGroupedData(); return (
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
              <span className="fw-bold text-dark fs-5">
                {groupByMode === 'invoice' ? '📄 Pengelompokan Berdasarkan Invoice / Transaksi' : '🧪 Pengelompokan Berdasarkan Kategori Parameter'}
              </span>
              <span className="badge bg-secondary-lt fw-bold">
                Terkumpul: {Object.keys(_g).length} {groupByMode === 'invoice' ? 'Transaksi' : 'Kategori'}
              </span>
            </div>
            ); })()}

            {/* 3D Search & Filter Card */}
            <div className="card mb-4 card-3d">
              <div className="card-body p-3">
                <form onSubmit={handleSearch}>
                  <div className="row g-2 align-items-center">
                    <div className="col-md">
                      <div className="input-icon">
                        <span className="input-icon-addon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                        </span>
                        <input
                          type="text"
                          className="form-control form-control-3d"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="🔍 Cari invoice, nama pemohon, atau sampel..."
                          style={{ paddingLeft: '42px' }}
                        />
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="input-icon">
                        <span className="input-icon-addon">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h6" /><path d="M4 11h6" /><path d="M4 17h6" /><path d="M14 5l6 0" /><path d="M14 11l6 0" /><path d="M14 17l6 0" /></svg>
                        </span>
                        <input
                          type="date"
                          className="form-control form-control-3d"
                          value={filterDate}
                          onChange={handleDateChange}
                          style={{ minWidth: "180px", paddingLeft: '42px' }}
                        />
                      </div>
                    </div>
                    <div className="col-auto">
                      <button type="submit" className="btn btn-3d-primary px-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                        Cari
                      </button>
                    </div>
                    {filterDate && (
                      <div className="col-auto">
                        <button type="button" className="btn btn-3d-secondary px-3" onClick={() => { setFilterDate(""); fetchData(1, search, ""); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                          Hapus Tanggal
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {isLoading ? (
              <div className="card card-3d">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                  <p className="mt-3 text-muted fw-bold">Memuat data hasil...</p>
                </div>
              </div>
            ) : Object.keys(getGroupedData().grouped).length === 0 ? (
              <div className="card card-3d">
                <div className="card-body text-center py-5">
                  <div style={{ opacity: 0.4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M9 3h6v11l-3 3l-3 -3v-11z" />
                      <path d="M7 21h10" />
                      <path d="M9 14h6v3h-6z" />
                    </svg>
                    <p className="text-muted mb-0 fw-bold">Belum ada data hasil</p>
                    <small className="text-muted">Hasil akan muncul setelah pemohonan disetujui</small>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Grouped Items Loop — per Transaction ID (like Penjadwalan) */}
                {(() => {
                  const { grouped, meta } = getGroupedData();
                  return Object.entries(grouped).map(([groupKey, items]) => {
                  const isInvoiceMode = groupKey.startsWith('INVOICE___');
                  const groupMeta = meta[groupKey] || {};
                  const color = isInvoiceMode ? 'primary' : getCategoryColor(groupMeta.catName || '');
                  const isExpanded = expandedCategories[groupKey] !== false;
                  const completedCount = items.filter((i) => i.status).length;
                  const totalCount = items.length;

                  const displayInvoice = isInvoiceMode
                    ? (groupMeta.invoice || `INV-${groupMeta.txId}`)
                    : (groupMeta.catName || '');
                  const displayUser = isInvoiceMode ? (groupMeta.userName || 'Pemohon') : '';
                  const displayDate = groupMeta.createdAt
                    ? new Date(groupMeta.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '';

                  return (
                    <div className="card mb-4 card-3d" key={groupKey}>
                      <div
                        className="card-header cursor-pointer py-3"
                        onClick={() => toggleCategory(groupKey)}
                        style={{ cursor: "pointer", background: isInvoiceMode ? '#f8fafc' : '#fafafa', borderBottom: '2px solid #000' }}
                      >
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-3">
                            {/* Icon Badge */}
                            <div className={`badge-3d bg-${color} text-white d-flex align-items-center justify-content-center`}
                              style={{ width: '44px', height: '44px', borderRadius: '12px', fontSize: '1.2rem' }}>
                              {isInvoiceMode ? '🧾' : '🧪'}
                            </div>
                            <div>
                              {/* Baris 1: Nomor Invoice / Nama Kategori */}
                              <div className="fw-extrabold text-dark" style={{ fontSize: '1.05rem' }}>
                                {isInvoiceMode ? displayInvoice : displayInvoice}
                              </div>
                              {/* Baris 2: Info pendukung */}
                              <div className="text-muted small d-flex flex-wrap align-items-center gap-2 mt-1">
                                {isInvoiceMode && (
                                  <span className="fw-bold text-dark">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', verticalAlign: 'text-bottom' }}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>
                                    {displayUser}
                                  </span>
                                )}
                                <span className="badge-3d bg-info text-white" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                  {totalCount} Parameter Sampel
                                </span>
                                {displayDate && (
                                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    🕐 {displayDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Tombol Cetak — HANYA MUNCUL JIKA SUDAH DI-TTD (DISETUJUI) */}
                            {(() => {
                              const approvedItemsInGroup = items.filter((i) => i.status_verifikasi === "DISETUJUI" || i.status);
                              if (approvedItemsInGroup.length === 0) return null;

                              const selectedInGroup = approvedItemsInGroup.filter((i) => selectedPrintIds.has(i.id));
                              const printItems = selectedInGroup.length > 0 ? selectedInGroup : approvedItemsInGroup;
                              const printCount = printItems.length;
                              const hasSelection = selectedInGroup.length > 0;
                              return (
                                <button
                                  className={`btn btn-sm d-flex align-items-center gap-1 ${hasSelection ? 'btn-3d-primary fw-bold' : 'btn-3d-outline-dark'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/hasil/print/${isInvoiceMode ? (groupMeta.txId || printItems[0].id) : printItems[0].id}`,
                                      { state: { hasilItems: printItems, selectedIds: printItems.map((i) => i.id) } }
                                    );
                                  }}
                                  title={hasSelection ? `Cetak ${printCount} sampel yang dicentang (Sudah TTD)` : `Cetak ${printCount} sampel yang sudah TTD`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M12 17v-6" /><path d="M9 14l3 3l3 -3" /></svg>
                                  {hasSelection ? `🖨️ Cetak (${printCount})` : `🖨️ Cetak (${printCount})`}
                                </button>
                              );
                            })()}

                            {/* Tombol Batch Verifikasi berdasarkan Role & Status Item */}
                            {canInputHasil && items.some((i) => !i.status_verifikasi || i.status_verifikasi === "DRAFT" || i.status_verifikasi === "REVISI_ANALIS") && (
                              <button
                                className="btn btn-sm btn-warning text-dark fw-bold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBatchVerifikasi(items, "SUBMIT_VERIFIKASI");
                                }}
                              >
                                📤 Kirim Verifikasi All ({items.filter((i) => !i.status_verifikasi || i.status_verifikasi === "DRAFT" || i.status_verifikasi === "REVISI_ANALIS").length})
                              </button>
                            )}

                            {(userRoleId === 2 || userRoleId === 4) && items.some((i) => i.status_verifikasi === "MENUNGGU_VERIFIKASI") && (
                              <button
                                className="btn btn-sm btn-success fw-bold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBatchVerifikasi(items, "VERIFY_APPROVE");
                                }}
                              >
                                ✓ Verifikasi All ({items.filter((i) => i.status_verifikasi === "MENUNGGU_VERIFIKASI").length})
                              </button>
                            )}

                            {(userRoleId === 2 || userRoleId === 5) && items.some((i) => i.status_verifikasi === "DIVERIFIKASI") && (
                              <button
                                className="btn btn-sm btn-success fw-bold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBatchVerifikasi(items, "KEPALA_APPROVE");
                                }}
                              >
                                🔏 ACC TTD All ({items.filter((i) => i.status_verifikasi === "DIVERIFIKASI").length})
                              </button>
                            )}

                            <div className="progress banner-3d" style={{ width: "100px", height: "10px" }}>
                              <div
                                className="progress-bar bg-success"
                                style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
                              ></div>
                            </div>
                            <span className="text-muted small fw-bold">
                              {completedCount}/{totalCount} selesai
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
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
                                <th style={{ width: "40px" }} title="Pilih untuk cetak">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    title="Pilih/Hapus semua dalam grup ini"
                                    checked={items.length > 0 && items.every((i) => selectedPrintIds.has(i.id))}
                                    onChange={() => toggleGroupSelect(items)}
                                  />
                                </th>
                                <th style={{ width: "50px" }}>No</th>
                                <th>Kode Sampel</th>
                                <th>Parameter</th>
                                <th>Hasil</th>
                                <th>Satuan</th>
                                <th>Kadar Maksimal</th>
                                <th>Metode</th>
                                <th className="text-center">Qty</th>
                                <th className="text-end">Harga</th>
                                <th className="text-center">Verifikasi Berjenjang</th>
                                <th>Pemeriksa (Analis)</th>
                                <th className="text-center">Tanggal</th>
                                <th className="text-center" style={{ minWidth: "160px" }}>Aksi & Laporan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((hasil) => {
                                const globalIndex = hasils.indexOf(hasil);
                                const isPrintSelected = selectedPrintIds.has(hasil.id);
                                return (
                                  <tr key={hasil.id} style={{ background: isPrintSelected ? '#eff6ff' : undefined }}>
                                    <td>
                                      {(hasil.status_verifikasi === "DISETUJUI" || hasil.status) ? (
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          checked={isPrintSelected}
                                          onChange={() => togglePrintSelect(hasil.id)}
                                          title="Pilih untuk dicetak"
                                        />
                                      ) : (
                                        <span className="text-muted opacity-50" style={{ fontSize: "0.75rem" }} title="Belum TTD Kepala Labkesda">🔒</span>
                                      )}
                                    </td>
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
                                      {getVerifikasiBadge(hasil.status_verifikasi)}
                                      {hasil.catatan_revisi && (
                                        <div className="text-danger small fst-italic mt-1" title={hasil.catatan_revisi}>
                                          Catatan: {hasil.catatan_revisi.substring(0, 25)}...
                                        </div>
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
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /></svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="d-flex flex-wrap gap-1 justify-content-center">
                                          {/* Edit Hasil Uji (Admin, Analis, & Sanitarian) */}
                                          {canInputHasil && (
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(hasil)} title="Edit Hasil Uji">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.097 2.097 0 0 0 -2.955 -2.955l-8.56 8.56l-1.37 3.89l3.89 -1.37l8.56 -8.56z" /></svg>
                                            </button>
                                          )}

                                          {/* 1. Kirim ke Verifikator (Analis / Sanitarian / Admin) */}
                                          {canInputHasil && (!hasil.status_verifikasi || hasil.status_verifikasi === "DRAFT" || hasil.status_verifikasi === "REVISI_ANALIS") && (
                                            <button
                                              className="btn btn-sm btn-warning text-dark fw-bold"
                                              onClick={() => handleVerifikasiAction(hasil.id, "SUBMIT_VERIFIKASI")}
                                              title="Kirim ke Verifikator"
                                            >
                                              📤 Verifikator
                                            </button>
                                          )}

                                          {/* 2. Tombol Verifikasi (Verifikator / Admin) */}
                                          {(userRoleId === 2 || userRoleId === 4) && hasil.status_verifikasi === "MENUNGGU_VERIFIKASI" && (
                                            <div className="btn-group btn-group-sm">
                                              <button
                                                className="btn btn-success fw-bold"
                                                onClick={() => handleVerifikasiAction(hasil.id, "VERIFY_APPROVE")}
                                                title="Setujui Verifikasi"
                                              >
                                                ✓ ACC
                                              </button>
                                              <button
                                                className="btn btn-danger"
                                                onClick={() => handleVerifikasiAction(hasil.id, "VERIFY_REJECT")}
                                                title="Minta Revisi"
                                              >
                                                ✕ Revisi
                                              </button>
                                            </div>
                                          )}

                                          {/* 3. Tombol Persetujuan Kepala Labkesda (Kepala / Admin) */}
                                          {(userRoleId === 2 || userRoleId === 5) && hasil.status_verifikasi === "DIVERIFIKASI" && (
                                            <div className="btn-group btn-group-sm">
                                              <button
                                                className="btn btn-success fw-bold"
                                                onClick={() => handleVerifikasiAction(hasil.id, "KEPALA_APPROVE")}
                                                title="Persetujuan Kepala & TTD QR"
                                              >
                                                🔏 TTD
                                              </button>
                                              <button
                                                className="btn btn-danger"
                                                onClick={() => handleVerifikasiAction(hasil.id, "KEPALA_REJECT")}
                                                title="Revisi Kepala"
                                              >
                                                ✕ Revisi
                                              </button>
                                            </div>
                                          )}

                                          {/* 4. Cetak Laporan PDF (Hanya muncul jika sudah disetujui / TTD) */}
                                          {(hasil.status_verifikasi === "DISETUJUI" || hasil.status) ? (
                                            <Link
                                              to={`/hasil/print/${hasil.id}`}
                                              className="btn btn-sm btn-outline-dark fw-bold"
                                              title="Cetak Laporan Hasil Pengujian (Sudah Verifikasi & TTD)"
                                            >
                                              🖨️ Cetak
                                            </Link>
                                          ) : (!hasil.status_verifikasi || hasil.status_verifikasi === "DRAFT" || hasil.status_verifikasi === "REVISI_ANALIS") ? (
                                            <span className="badge bg-light text-secondary border border-secondary" title="Cetak belum tersedia (Belum Diverifikasi)">
                                              🔒 Belum Verifikasi
                                            </span>
                                          ) : hasil.status_verifikasi === "MENUNGGU_VERIFIKASI" ? (
                                            <span className="badge bg-warning-subtle text-dark border border-warning" title="Cetak belum tersedia (Menunggu Verifikasi Verifikator)">
                                              ⏳ Menunggu Verifikasi
                                            </span>
                                          ) : (
                                            <span className="badge bg-info-subtle text-dark border border-info" title="Cetak belum tersedia (Sudah Verif, Menunggu TTD Kepala)">
                                              🔒 Menunggu TTD
                                            </span>
                                          )}

                                          {userRoleId === 2 && (
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(hasil.id)} title="Hapus">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /></svg>
                                            </button>
                                          )}
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
                                  Subtotal {displayInvoice}
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
                  });
                })()}

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
            border: '3.5px solid #000000',
            boxShadow: '10px 10px 0px #000000',
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

      {/* ─── MODAL UPLOAD PDF TTE ─────────────────────────────────── */}
      {showTteModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTteModal(false); }}
        >
          <div style={{ background: '#fff', borderRadius: '18px', border: '2.5px solid #000', boxShadow: '8px 8px 0 #000', padding: '32px', width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h5 style={{ fontWeight: 900, margin: 0, fontSize: '1.15rem' }}>🔏 Upload PDF ke TTE BSrE</h5>
              <button onClick={() => setShowTteModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>File PDF</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="form-control"
                style={{ border: '2px solid #000', borderRadius: '8px' }}
                onChange={(e) => setTteUploadFile(e.target.files?.[0] || null)}
              />
              {tteUploadFile && (
                <small style={{ color: '#16a34a', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                  ✅ {tteUploadFile.name} ({(tteUploadFile.size / 1024).toFixed(1)} KB)
                </small>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>NIK</label>
              <input
                type="text"
                className="form-control"
                style={{ border: '2px solid #000', borderRadius: '8px' }}
                value={tteUploadNik}
                onChange={(e) => setTteUploadNik(e.target.value)}
                placeholder="NIK penandatangan"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Passphrase</label>
              <input
                type="password"
                className="form-control"
                style={{ border: '2px solid #000', borderRadius: '8px' }}
                value={tteUploadPassphrase}
                onChange={(e) => setTteUploadPassphrase(e.target.value)}
                placeholder="Passphrase BSrE"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleTteUpload}
                disabled={tteUploading || !tteUploadFile}
                style={{
                  flex: 1, padding: '12px', background: tteUploading ? '#9ca3af' : '#7c3aed',
                  color: '#fff', border: '2px solid #000', boxShadow: '3px 3px 0 #000',
                  borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: tteUploading ? 'not-allowed' : 'pointer'
                }}
              >
                {tteUploading ? '⏳ Memproses...' : '🔏 Tanda Tangani PDF'}
              </button>
              <button
                onClick={() => setShowTteModal(false)}
                style={{ padding: '12px 20px', background: '#f3f4f6', border: '2px solid #000', boxShadow: '3px 3px 0 #000', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </LayoutAdmin>
  );
}
