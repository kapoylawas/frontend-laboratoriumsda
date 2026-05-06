import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import html2pdf from 'html2pdf.js';

export default function SuratPenawaran({ data, onClose }) {
    const suratRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!data) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(value || 0);
    };

    const formatDateSurat = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const grandTotal = (data.items || []).reduce((sum, item) => sum + (item.price || 0), 0);

    // Group items by category for the surat format
    const groupedItems = [];
    let no = 1;
    const categoryMap = {};

    (data.items || []).forEach((item) => {
        const catName = item.sampel?.category?.name || 'Lainnya';
        if (!categoryMap[catName]) {
            categoryMap[catName] = {
                no: no++,
                uraian: catName,
                qty: item.qty || 1,
                parameters: [],
                jumlahHarga: 0
            };
            groupedItems.push(categoryMap[catName]);
        } else {
            categoryMap[catName].qty += (item.qty || 1);
        }
        categoryMap[catName].parameters.push({
            category: item.sampel?.category?.name || '-',
            parameter: item.sampel?.parameter || '-',
            hargaSatuan: item.sampel?.price_sell || 0,
            price: item.price || 0
        });
        categoryMap[catName].jumlahHarga += (item.price || 0);
    });

    const handleDownloadPDF = async () => {
        if (!suratRef.current) return;
        setIsGenerating(true);

        try {
            const opt = {
                margin: [5, 8, 5, 8],
                filename: `Surat-Penawaran-${data.id || 'draft'}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await html2pdf().set(opt).from(suratRef.current).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal menggenerate PDF: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const tanggalSurat = formatDateSurat(data.tanggal_pengajuan || new Date().toISOString());
    const pemohon = data.user || {};

    const modalContent = (
        <div id="surat-penawaran-modal">
            <style>{`
                #surat-penawaran-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                }
                .sp-dialog {
                    width: 95vw;
                    max-width: 900px;
                    max-height: 92vh;
                    display: flex;
                    flex-direction: column;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }
                .sp-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                    flex-shrink: 0;
                }
                .sp-header h5 {
                    margin: 0;
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: #1e293b;
                }
                .sp-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    background: #e9ecef;
                }
                .sp-btn-success {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: #2fb344;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .sp-btn-success:hover { background: #279a3a; }
                .sp-btn-success:disabled { opacity: 0.6; cursor: not-allowed; }
                .sp-btn-close {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    cursor: pointer;
                    color: #64748b;
                    font-size: 1.2rem;
                    transition: all 0.2s;
                }
                .sp-btn-close:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
            `}</style>

            <div className="sp-dialog">
                <div className="sp-header">
                    <h5>Preview Surat Penawaran</h5>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            className="sp-btn-success"
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                        <path d="M12 17v-6" />
                                        <path d="M9.5 14.5l2.5 2.5l2.5 -2.5" />
                                    </svg>
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button className="sp-btn-close" onClick={onClose}>✕</button>
                    </div>
                </div>
                <div className="sp-body">
                        {/* Surat Content */}
                        <div
                            ref={suratRef}
                            style={{
                                background: 'white',
                                padding: '10px 50px 40px 50px',
                                fontFamily: "'Times New Roman', Times, serif",
                                fontSize: '12pt',
                                lineHeight: '1.6',
                                color: '#000',
                                maxWidth: '794px',
                                margin: '0 auto',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                        >
                            {/* Header */}
                            <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <img src="/sidoarjo.png" alt="Logo" style={{ width: '100px', height: '100px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                    <div>
                                        <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>PEMERINTAH KABUPATEN SIDOARJO</div>
                                        <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>DINAS KESEHATAN</div>
                                        <div style={{ fontSize: '14pt', fontWeight: 'bold', letterSpacing: '1px' }}>UPTD. LABORATORIUM KESEHATAN DAERAH</div>
                                        <div style={{ fontSize: '9pt' }}>Jalan A. Yani no. 42 Gedangan, Sidoarjo, Jawa Timur 61254</div>
                                        <div style={{ fontSize: '9pt' }}>Telepon (031) 8533726</div>
                                        <div style={{ fontSize: '9pt' }}>Pos-el labkes.sidoarjo@gmail.com</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tanggal */}
                            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                                Sidoarjo, {tanggalSurat}
                            </div>

                            {/* Nomor Surat */}
                            <table style={{ marginBottom: '10px', fontSize: '12pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '80px', verticalAlign: 'top' }}>Nomor</td>
                                        <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                                        <td>600.4.26.2/13/438.5.2.3/2026</td>
                                    </tr>
                                    <tr>
                                        <td style={{ verticalAlign: 'top' }}>Sifat</td>
                                        <td style={{ verticalAlign: 'top' }}>:</td>
                                        <td>Biasa / Terbuka</td>
                                    </tr>
                                    <tr>
                                        <td style={{ verticalAlign: 'top' }}>Lampiran</td>
                                        <td style={{ verticalAlign: 'top' }}>:</td>
                                        <td>-</td>
                                    </tr>
                                    <tr>
                                        <td style={{ verticalAlign: 'top' }}>Hal</td>
                                        <td style={{ verticalAlign: 'top' }}>:</td>
                                        <td style={{ fontWeight: 'bold' }}>Penawaran Harga Pemeriksaan SLHS</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Tujuan */}
                            <div style={{ marginBottom: '10px' }}>
                                <div>Yth. <strong>{pemohon.name || '-'}</strong></div>
                                {pemohon.alamat && <div>{pemohon.alamat}</div>}
                                <div>di</div>
                                <div style={{ marginLeft: '20px' }}>Sidoarjo</div>
                            </div>

                            {/* Isi Surat */}
                            <div style={{ marginBottom: '10px', textAlign: 'justify', textIndent: '40px' }}>
                                Menindaklanjuti permohonan Saudara/i, berikut daftar harga untuk pemeriksaan di
                                Laboratorium Kesehatan Daerah Kabupaten Sidoarjo:
                            </div>

                            {/* Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11pt', pageBreakInside: 'avoid' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>No</th>
                                        <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Uraian</th>
                                        <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Jumlah</th>
                                        <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Parameter</th>
                                        <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Harga Satuan (Rp)</th>
                                        <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Jumlah Harga (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedItems.map((group, gIdx) => (
                                        group.parameters.map((param, pIdx) => (
                                            <tr key={`${gIdx}-${pIdx}`}>
                                                {pIdx === 0 && (
                                                    <>
                                                        <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', verticalAlign: 'top' }} rowSpan={group.parameters.length}>
                                                            {group.no}.
                                                        </td>
                                                        <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'top', fontWeight: 'bold' }} rowSpan={group.parameters.length}>
                                                            {group.uraian}
                                                        </td>
                                                        <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', verticalAlign: 'top' }} rowSpan={group.parameters.length}>
                                                            {group.qty}
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                                                    {pIdx === 0 && <div style={{ fontWeight: 'bold' }}>{param.category}</div>}
                                                    {pIdx > 0 && <div style={{ fontWeight: 'bold' }}>{param.category}</div>}
                                                    <div style={{ fontStyle: 'italic', paddingLeft: '8px' }}>{param.parameter}</div>
                                                </td>
                                                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>
                                                    {formatCurrency(param.hargaSatuan)}
                                                </td>
                                                {pIdx === 0 && (
                                                    <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }} rowSpan={group.parameters.length}>
                                                        {formatCurrency(group.jumlahHarga)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ))}
                                    {/* TOTAL Row */}
                                    <tr>
                                        <td colSpan="5" style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                                            TOTAL
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '12pt' }}>
                                            {formatCurrency(grandTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Penutup */}
                            <div style={{ marginBottom: '30px', textAlign: 'justify', textIndent: '40px', pageBreakAfter: 'avoid' }}>
                                Demikian atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
                            </div>

                            {/* TTD */}
                            <div style={{ textAlign: 'right', marginTop: '10px', pageBreakInside: 'avoid' }}>
                                <div style={{ display: 'inline-block', textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold' }}>Kepala Laboratorium</div>
                                    <div style={{ fontWeight: 'bold' }}>Kesehatan Daerah,</div>
                                    <div style={{ marginTop: '60px', fontWeight: 'bold' }}>MISAD, S.KM</div>
                                    <div>Penata Tk. I / IIId</div>
                                    <div>NIP196909141991021002</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '10px', textAlign: 'center', fontSize: '8pt', color: '#666', fontStyle: 'italic' }}>
                                Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik
                                yang diterbitkan oleh Balai Besar Sertifikasi Elektronik (BSrE), Badan Siber dan Sandi Negara.
                            </div>
                        </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
