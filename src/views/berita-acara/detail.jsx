import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import LayoutAdmin from '../../layouts/admin';
import { FaPrint, FaArrowLeft, FaEdit, FaFilePdf } from 'react-icons/fa';
import html2pdf from 'html2pdf.js';

export default function BeritaAcaraDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const userCookie = Cookies.get("user");
    const loggedInUser = userCookie ? JSON.parse(userCookie) : {};

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/berita-acara/${id}`);
                setData(response.data.data);
            } catch (error) {
                console.error('Gagal memuat detail berita acara:', error);
            }
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="container py-5 text-center">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3 text-muted">Memuat detail Berita Acara...</p>
                </div>
            </LayoutAdmin>
        );
    }

    if (!data) {
        return (
            <LayoutAdmin>
                <div className="container py-5 text-center">
                    <h3 className="text-danger">Berita Acara Tidak Ditemukan</h3>
                    <button className="btn btn-primary mt-3" onClick={() => navigate('/berita-acara')}>Kembali</button>
                </div>
            </LayoutAdmin>
        );
    }

    // Helper functions to check item presence in array/JSON lists
    const isChecked = (list, item) => {
        if (!list) return false;
        if (Array.isArray(list)) {
            return list.includes(item);
        }
        try {
            const parsed = typeof list === 'string' ? JSON.parse(list) : list;
            if (Array.isArray(parsed)) return parsed.includes(item);
        } catch (e) {}
        return false;
    };

    const getHasilValue = (key) => {
        if (!data.hasil_lapangan) return '';
        try {
            const parsed = typeof data.hasil_lapangan === 'string' ? JSON.parse(data.hasil_lapangan) : data.hasil_lapangan;
            return parsed[key] || '';
        } catch (e) {
            return '';
        }
    };

    const getWadahValue = (key) => {
        if (!data.jumlah_wadah) return '';
        try {
            const parsed = typeof data.jumlah_wadah === 'string' ? JSON.parse(data.jumlah_wadah) : data.jumlah_wadah;
            return parsed[key] || '';
        } catch (e) {
            return '';
        }
    };

    const formatDateLong = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const parameterParam = data.jadwal?.transaction_detail?.sampel?.parameter || '';
    const isParameterChecked = (paramName) => {
        return parameterParam.toLowerCase().includes(paramName.toLowerCase());
    };

    const handleDownloadPDF = () => {
        const element = document.querySelector('.ba-paper');
        if (!element) return;

        // Temporarily remove border and box shadow to prevent border lines in the PDF
        const originalBorder = element.style.border;
        const originalShadow = element.style.boxShadow;
        
        element.style.border = 'none';
        element.style.boxShadow = 'none';

        const options = {
            margin: 0, // Set margin to 0 so 210mm paper width fits A4 width exactly
            filename: `Berita-Acara-${data.no_berita_acara.replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Avoid breaking inside rows/images
        };

        html2pdf()
            .set(options)
            .from(element)
            .save()
            .then(() => {
                // Restore original styles
                element.style.border = originalBorder;
                element.style.boxShadow = originalShadow;
            })
            .catch((err) => {
                console.error('PDF generation error:', err);
                element.style.border = originalBorder;
                element.style.boxShadow = originalShadow;
            });
    };

    return (
        <LayoutAdmin>
            <div className="container py-4 d-print-none">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => navigate('/berita-acara')}>
                        <FaArrowLeft /> Kembali
                    </button>
                    <div className="d-flex gap-2">
                        {loggedInUser.role_id !== 1 && data.status === 'DRAFT' && (
                            <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => navigate(`/berita-acara/${data.id}/edit`)}>
                                <FaEdit /> Edit Berita Acara
                            </button>
                        )}
                        <button className="btn btn-success d-flex align-items-center gap-2" onClick={handleDownloadPDF}>
                            <FaFilePdf /> Unduh PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Official Print Layout */}
            <div className="print-area">
                <div className="ba-paper">
                    {/* Header */}
                    <div className="ba-header-container">
                        <img src="/sidoarjo.png" alt="Logo Sidoarjo" className="logo-pemkab" />
                        <div className="ba-header-text">
                            <h4 className="m-0">PEMERINTAH KABUPATEN SIDOARJO</h4>
                            <h4 className="m-0 font-weight-bold">DINAS KESEHATAN</h4>
                            <h3 className="m-0 font-weight-bold">UPTD. LABORATORIUM KESEHATAN DAERAH</h3>
                            <p className="m-0 small">Jalan A. Yani no. 42 Gedangan, Sidoarjo, Kode Pos 61254</p>
                            <p className="m-0 small">Telepon (031) 8533726 | Pos-el: labkes.sidoarjo@gmail.com</p>
                        </div>
                    </div>
                    <div className="double-line"></div>

                    {/* Title */}
                    <div className="text-center my-4">
                        <h4 className="font-weight-bold mb-1 text-decoration-underline" style={{ letterSpacing: '1px' }}>BERITA ACARA PENGAMBILAN SAMPEL</h4>
                    </div>

                    {/* Table-based fields to match the image */}
                    <table className="table-ba-form">
                        <tbody>
                            <tr>
                                <td style={{ width: '230px' }}>Nomor Sampel</td>
                                <td style={{ width: '15px' }}>:</td>
                                <td className="font-weight-bold">{data.no_berita_acara}</td>
                            </tr>
                            <tr>
                                <td>Jenis Sampel</td>
                                <td>:</td>
                                <td>{data.jenis_sampel}</td>
                            </tr>
                            <tr>
                                <td>Nama Sampel</td>
                                <td>:</td>
                                <td>{data.nama_sampel || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Tujuan Pengambilan Sampel</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid">
                                        <div className="chk-item"><span className={`box ${isChecked(data.tujuan_pengambilan, 'Pemantauan') ? 'checked' : ''}`}></span> Pemantauan</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.tujuan_pengambilan, 'Penelitian') ? 'checked' : ''}`}></span> Penelitian</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.tujuan_pengambilan, 'Pengawasan') ? 'checked' : ''}`}></span> Pengawasan</div>
                                        <div className="chk-item">
                                            <span className={`box ${isChecked(data.tujuan_pengambilan, 'Lainnya') ? 'checked' : ''}`}></span> Lainnya: {getWadahValue('tujuan_lainnya') || '.....'}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Parameter</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid-3">
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Coliform') ? 'checked' : ''}`}></span> Mikrobiologi Air - Coliform</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Fe') ? 'checked' : ''}`}></span> Kimia Air - Fe</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('E. coli') ? 'checked' : ''}`}></span> Mikrobiologi Air - E. coli</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Fluoride') || isParameterChecked(' F ') ? 'checked' : ''}`}></span> Kimia Air - F</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('TDS') ? 'checked' : ''}`}></span> Fisika Air - TDS</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Pb') ? 'checked' : ''}`}></span> Kimia Air - Pb</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Kekeruhan') ? 'checked' : ''}`}></span> Fisika Air - Kekeruhan</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Cd') ? 'checked' : ''}`}></span> Kimia Air - Cd</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Suhu') ? 'checked' : ''}`}></span> Fisika Air - Suhu</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Makanan') ? 'checked' : ''}`}></span> Mikrobiologi Makanan</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Warna') ? 'checked' : ''}`}></span> Fisika Air - Warna</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Boraks') ? 'checked' : ''}`}></span> Kimia Makanan - Boraks</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Bau') ? 'checked' : ''}`}></span> Fisika Air - Bau</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Formalin') ? 'checked' : ''}`}></span> Kimia Makanan - Formalin</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('pH') ? 'checked' : ''}`}></span> Kimia Air - pH</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Methanil') ? 'checked' : ''}`}></span> Kimia Makanan - Methanil Y.</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Nitrat') ? 'checked' : ''}`}></span> Kimia Air - Nitrat</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Rhodamin') ? 'checked' : ''}`}></span> Kimia Makanan - Rhodamin</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Nitrit') ? 'checked' : ''}`}></span> Kimia Air - Nitrit</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Usap Alat') ? 'checked' : ''}`}></span> Mikrobiologi Usap Alat Masak</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Mn') ? 'checked' : ''}`}></span> Kimia Air - Mn</div>
                                        <div className="chk-item"><span className={`box ${isParameterChecked('Usap Dubur') ? 'checked' : ''}`}></span> Mikrobiologi Usap Dubur</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>Nama Pelanggan / Perusahaan</td>
                                <td>:</td>
                                <td>{data.jadwal?.transaction_detail?.transaction?.user?.name || '-'}</td>
                            </tr>
                            <tr>
                                <td>Alamat</td>
                                <td>:</td>
                                <td>{data.jadwal?.transaction_detail?.transaction?.user?.alamat || '-'}</td>
                            </tr>
                            <tr>
                                <td>No. Telp / Faks / E-mail</td>
                                <td>:</td>
                                <td>{data.jadwal?.transaction_detail?.transaction?.user?.phone || '-'} / {data.jadwal?.transaction_detail?.transaction?.user?.email || '-'}</td>
                            </tr>
                            <tr>
                                <td>Nama Personil Penghubung</td>
                                <td>:</td>
                                <td>{data.pelanggan_saksi || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Nama Pengambil Sampel</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>{data.petugas_pengambil}</td>
                            </tr>
                            <tr>
                                <td>Titik Pengambilan Sampel</td>
                                <td>:</td>
                                <td>{data.titik_pengambilan || '.....'}</td>
                            </tr>
                            <tr>
                                <td>Tanggal Pengambilan Sampel</td>
                                <td>:</td>
                                <td>{formatDateLong(data.tanggal_pengambilan)}</td>
                            </tr>
                            <tr>
                                <td>Waktu Pengambilan Sampel</td>
                                <td>:</td>
                                <td>{data.waktu_pengambilan ? `${data.waktu_pengambilan} WIB` : '.....'}</td>
                            </tr>
                            <tr>
                                <td>Tanggal Perkiraan Selesai Pengujian</td>
                                <td>:</td>
                                <td>{formatDateLong(data.tanggal_selesai_estimasi)}</td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Jumlah Wadah Sampel</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid">
                                        <div className="chk-item">
                                            <span className={`box ${getWadahValue('tipe') === 'Botol' ? 'checked' : ''}`}></span> Botol: {getWadahValue('tipe') === 'Botol' ? `${getWadahValue('qty')} buah` : '..... buah'}
                                        </div>
                                        <div className="chk-item">
                                            <span className={`box ${getWadahValue('tipe') === 'Lainnya' ? 'checked' : ''}`}></span> Lainnya: {getWadahValue('tipe') === 'Lainnya' ? `${getWadahValue('lainnya')} buah` : '.....'}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Peralatan Pengambilan Sampel</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid">
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengambilan, 'Botol Pemberat') ? 'checked' : ''}`}></span> Botol Pemberat</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengambilan, 'Gayung Bertangkai Plastik') ? 'checked' : ''}`}></span> Gayung Bertangkai Plastik</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengambilan, 'Botol Sampel') ? 'checked' : ''}`}></span> Botol Sampel</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Peralatan Pengukur Lapangan</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid-3">
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'Tidak ada') ? 'checked' : ''}`}></span> Tidak ada</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'Thermometer') ? 'checked' : ''}`}></span> Thermometer</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'TDS Meter') ? 'checked' : ''}`}></span> TDS Meter</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'DO Meter') ? 'checked' : ''}`}></span> DO Meter</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'Klorin Test') ? 'checked' : ''}`}></span> Klorin Test</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'Turbidimeter') ? 'checked' : ''}`}></span> Turbidimeter</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'pH meter') ? 'checked' : ''}`}></span> pH meter</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pengukur, 'Konduktimeter') ? 'checked' : ''}`}></span> Konduktimeter</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Peralatan Pendukung</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid-3">
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Berita Acara') ? 'checked' : ''}`}></span> Berita Acara</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Kertas Saring') ? 'checked' : ''}`}></span> Kertas Saring</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'FPPL') ? 'checked' : ''}`}></span> FPPL</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Tissue') ? 'checked' : ''}`}></span> Tissue</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Map') ? 'checked' : ''}`}></span> Map</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Parafilm') ? 'checked' : ''}`}></span> Parafilm</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Bulpoin') ? 'checked' : ''}`}></span> Bulpoin</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Kertas Label') ? 'checked' : ''}`}></span> Kertas Label</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Selotip') ? 'checked' : ''}`}></span> Selotip</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Corong Kaca') ? 'checked' : ''}`}></span> Corong Kaca</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Spidol') ? 'checked' : ''}`}></span> Spidol</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Coolbox & Icepack') ? 'checked' : ''}`}></span> Coolbox & Icepack</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Korek Api') ? 'checked' : ''}`}></span> Korek Api</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Bunsen') ? 'checked' : ''}`}></span> Bunsen</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Plastik Klip') ? 'checked' : ''}`}></span> Plastik Klip</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Beaker Glass & Erlenmeyer') ? 'checked' : ''}`}></span> Beaker Glass</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Gunting') ? 'checked' : ''}`}></span> Gunting</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Spatula') ? 'checked' : ''}`}></span> Spatula</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Cotton Swab') ? 'checked' : ''}`}></span> Cotton Swab</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Larutan Buffer') ? 'checked' : ''}`}></span> Larutan Buffer</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Alcohol Swab') ? 'checked' : ''}`}></span> Alcohol Swab</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_pendukung, 'Larutan HNO3') ? 'checked' : ''}`}></span> Larutan HNO3</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Peralatan K3</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid">
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_k3, 'Rompi Sampling') ? 'checked' : ''}`}></span> Rompi Sampling</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_k3, 'Masker') ? 'checked' : ''}`}></span> Masker</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_k3, 'Sarung Tangan') ? 'checked' : ''}`}></span> Sarung Tangan</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.peralatan_k3, 'Helmet & Goggle') ? 'checked' : ''}`}></span> Helmet & Goggles</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Cara Pengambilan Sampel</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid-3">
                                        <div className="chk-item"><span className={`box ${isChecked(data.cara_pengambilan, 'Sesaat') ? 'checked' : ''}`}></span> Sesaat</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.cara_pengambilan, 'Gabungan Waktu') ? 'checked' : ''}`}></span> Gabungan Waktu</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.cara_pengambilan, 'Gabungan Tempat') ? 'checked' : ''}`}></span> Gabungan Tempat</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.cara_pengambilan, 'Gabungan Waktu & Tempat') ? 'checked' : ''}`}></span> Gabungan Waktu & Tempat</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.cara_pengambilan, 'Gabungan Kedalaman') ? 'checked' : ''}`}></span> Gabungan Kedalaman</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.cara_pengambilan, 'Lainnya') ? 'checked' : ''}`}></span> Lainnya</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Pengendalian Mutu Lapangan</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid">
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengendalian_mutu, 'Blanko Peralatan') ? 'checked' : ''}`}></span> Blanko Peralatan</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengendalian_mutu, 'Blanko Penyaringan') ? 'checked' : ''}`}></span> Blanko Penyaringan</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengendalian_mutu, 'Blanko Wadah') ? 'checked' : ''}`}></span> Blanko Wadah</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengendalian_mutu, 'Duplicate Sampel') ? 'checked' : ''}`}></span> Duplicate Sampel</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Pengawet</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid-3">
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengawet, 'Ice Pack') ? 'checked' : ''}`}></span> Ice Pack</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengawet, 'NaOH') ? 'checked' : ''}`}></span> NaOH</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengawet, 'H2SO4') ? 'checked' : ''}`}></span> H2SO4</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengawet, '(CH3COO)2Zn') ? 'checked' : ''}`}></span> (CH3COO)2Zn</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengawet, 'HNO3') ? 'checked' : ''}`}></span> HNO3</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>Pengamanan dan Transportasi Sampel</td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="checkbox-grid">
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengamanan_transportasi, 'Pengemasan Sampel') ? 'checked' : ''}`}></span> Pengemasan Sampel</div>
                                        <div className="chk-item"><span className={`box ${isChecked(data.pengamanan_transportasi, 'Pelabelan Sampel') ? 'checked' : ''}`}></span> Pelabelan Sampel</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ verticalAlign: 'top' }}>
                                    Hasil Pengukuran Parameter Lapangan dan Rincian dari Kondisi Lingkungan Pengambilan Sampel
                                </td>
                                <td style={{ verticalAlign: 'top' }}>:</td>
                                <td>
                                    <div className="field-grid">
                                        <div className="field-item">Suhu = {getHasilValue('suhu') || '.....'} °C</div>
                                        <div className="field-item">DHL = {getHasilValue('dhl') || '.....'} µs/cm</div>
                                        <div className="field-item">pH = {getHasilValue('ph') || '.....'}</div>
                                        <div className="field-item">Sisa Klor = {getHasilValue('sisa_klor') || '.....'} mg/l</div>
                                        <div className="field-item">TDS = {getHasilValue('tds') || '.....'} mg/l</div>
                                        <div className="field-item">DO = {getHasilValue('do') || '.....'} mg/l</div>
                                        <div className="field-item">Kekeruhan = {getHasilValue('kekeruhan') || '.....'} NTU</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="ba-signature-section page-break html2pdf__page-break">
                        <div className="date-place">
                            Sidoarjo, {formatDateLong(data.sidoarjo_date || data.tanggal_pengambilan)}
                        </div>
                        <div className="signatures-row">
                            <div className="sig-col">
                                <p className="mb-5">Mengetahui,<br /><strong>Petugas Pengambil Sampel</strong></p>
                                <div className="signature-line"></div>
                                <p className="font-weight-bold">{data.petugas_pengambil}</p>
                            </div>
                            <div className="sig-col">
                                <p className="mb-5"><br /><strong>Pelanggan/Saksi</strong></p>
                                <div className="signature-line"></div>
                                <p className="font-weight-bold">{data.pelanggan_saksi || '...................................'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Photo Documentation Section */}
                    {(data.foto_pengambilan || data.foto_pelabelan || data.foto_pengemasan) && (
                        <div className="ba-photo-documentation page-break html2pdf__page-break">
                            <hr className="my-4 d-print-none" />
                            <div className="text-center mb-4">
                                <h4 className="fw-bold m-0 font-weight-bold" style={{ textAlign: 'center', fontSize: '16px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
                                    LAMPIRAN FOTO DOKUMENTASI
                                </h4>
                            </div>
                            <div className="photo-grid">
                                {data.foto_pengambilan && (
                                    <div className="photo-item">
                                        <p className="font-weight-bold mb-2">1. Dokumentasi Proses Pengambilan Sampel</p>
                                        <div className="photo-wrapper">
                                            <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${data.foto_pengambilan}`} alt="Foto Pengambilan" />
                                        </div>
                                    </div>
                                )}
                                {data.foto_pelabelan && (
                                    <div className="photo-item">
                                        <p className="font-weight-bold mb-2">2. Dokumentasi Pelabelan Sampel</p>
                                        <div className="photo-wrapper">
                                            <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${data.foto_pelabelan}`} alt="Foto Pelabelan" />
                                        </div>
                                    </div>
                                )}
                                {data.foto_pengemasan && (
                                    <div className="photo-item">
                                        <p className="font-weight-bold mb-2">3. Dokumentasi Pengemasan Sampel</p>
                                        <div className="photo-wrapper">
                                            <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${data.foto_pengemasan}`} alt="Foto Pengemasan" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .font-weight-bold { font-weight: bold; }
                .text-decoration-underline { text-decoration: underline; }
                
                /* Paper Styling */
                .ba-paper {
                    box-sizing: border-box;
                    background: white;
                    color: black;
                    padding: 50px 60px;
                    width: 210mm;
                    min-height: 297mm;
                    margin: 0 auto;
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 13.5px;
                    line-height: 1.5;
                    border: 1px solid #ccc;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }

                .ba-header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .logo-pemkab {
                    width: 75px;
                    height: auto;
                    margin-right: 25px;
                }

                .ba-header-text {
                    flex-grow: 1;
                    text-align: center;
                }

                .ba-header-text h3 {
                    font-size: 19px;
                    font-weight: 900;
                    margin: 2px 0;
                }

                .ba-header-text h4 {
                    font-size: 15px;
                    font-weight: 700;
                    margin: 2px 0;
                }

                .double-line {
                    border-top: 3px solid black;
                    border-bottom: 1px solid black;
                    height: 4px;
                    margin-bottom: 20px;
                }

                .table-ba-form {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-top: 1px solid #888;
                    border-left: 1px solid #888;
                }

                .table-ba-form td {
                    padding: 6px 8px;
                    vertical-align: middle;
                    border-right: 1px solid #888;
                    border-bottom: 1px solid #888;
                }

                .table-ba-form tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }

                /* Checkboxes simulation */
                .checkbox-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }

                .checkbox-grid-3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 6px;
                }

                .chk-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    font-size: 12.5px;
                    line-height: 1.3;
                }

                .chk-item .box {
                    display: inline-block;
                    width: 13px;
                    height: 13px;
                    border: 1.5px solid black;
                    border-radius: 2px;
                    position: relative;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .chk-item .box.checked::after {
                    content: '✓';
                    position: absolute;
                    top: -4px;
                    left: 1px;
                    font-size: 13px;
                    font-weight: bold;
                }

                .field-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .field-item {
                    font-weight: 500;
                }

                .ba-signature-section {
                    margin-top: 40px;
                    text-align: right;
                }

                .date-place {
                    margin-bottom: 15px;
                    font-size: 14px;
                    padding-right: 40px;
                }

                .signatures-row {
                    display: flex;
                    justify-content: space-between;
                    text-align: center;
                }

                .sig-col {
                    width: 45%;
                }

                .signature-line {
                    width: 80%;
                    border-bottom: 1px solid black;
                    margin: 0 auto 5px;
                }

                .ba-photo-documentation {
                    margin-top: 40px;
                }

                .photo-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-top: 15px;
                }

                .photo-item {
                    border: 1px solid #ddd;
                    padding: 8px;
                    border-radius: 6px;
                    background: #fafafa;
                    text-align: center;
                }

                .photo-wrapper {
                    height: 180px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border-radius: 4px;
                    background: #eee;
                    border: 1px solid #eee;
                }

                .photo-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* Print optimizations */
                @media print {
                    .page-break {
                        page-break-before: always;
                        margin-top: 0px;
                        padding-top: 20px;
                    }
                    body {
                        background: white !important;
                    }
                    .d-print-none {
                        display: none !important;
                    }
                    .print-area {
                        padding: 0 !important;
                    }
                    .ba-paper {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        width: 100% !important;
                        min-height: auto !important;
                        margin: 0 !important;
                    }
                    .table-ba-form {
                        border-top: 1px solid black !important;
                        border-left: 1px solid black !important;
                    }
                    .table-ba-form td {
                        border-right: 1px solid black !important;
                        border-bottom: 1px solid black !important;
                        border-top: none !important;
                        border-left: none !important;
                    }
                }
            `}</style>
        </LayoutAdmin>
    );
}
