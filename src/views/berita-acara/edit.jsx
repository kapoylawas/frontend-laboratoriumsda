import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function BeritaAcaraEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [files, setFiles] = useState({
        foto_pengambilan: null,
        foto_pelabelan: null,
        foto_pengemasan: null
    });

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles && selectedFiles[0]) {
            setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
        }
    };

    const [form, setForm] = useState({
        no_berita_acara: '',
        jenis_sampel: '',
        nama_sampel: '',
        tujuan_pengambilan: [],
        tujuan_lainnya: '',
        titik_pengambilan: '',
        tanggal_pengambilan: '',
        waktu_pengambilan: '',
        tanggal_selesai_estimasi: '',
        wadah_tipe: 'Botol',
        wadah_qty: '',
        wadah_lainnya: '',
        peralatan_pengambilan: [],
        peralatan_pengukur: [],
        peralatan_pendukung: [],
        peralatan_k3: [],
        cara_pengambilan: [],
        pengendalian_mutu: [],
        pengawet: [],
        pengamanan_transportasi: [],
        suhu: '',
        dhl: '',
        ph: '',
        sisa_klor: '',
        tds: '',
        do: '',
        kekeruhan: '',
        petugas_pengambil: '',
        pelanggan_saksi: '',
        foto_pengambilan: '',
        foto_pelabelan: '',
        foto_pengemasan: '',
        status: 'DRAFT'
    });

    const [detailData, setDetailData] = useState(null);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/berita-acara/${id}`);
                const data = response.data.data;
                setDetailData(data);

                // Safe parsing helper
                const safeParse = (val) => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    try {
                        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        return [];
                    }
                };

                const parseObject = (val) => {
                    if (!val) return {};
                    try {
                        return typeof val === 'string' ? JSON.parse(val) : val;
                    } catch (e) {
                        return {};
                    }
                };

                const wadahObj = parseObject(data.jumlah_wadah);
                const hasilObj = parseObject(data.hasil_lapangan);

                setForm({
                    no_berita_acara: data.no_berita_acara || '',
                    jenis_sampel: data.jenis_sampel || '',
                    nama_sampel: data.nama_sampel || '',
                    tujuan_pengambilan: safeParse(data.tujuan_pengambilan),
                    tujuan_lainnya: wadahObj.tujuan_lainnya || '',
                    titik_pengambilan: data.titik_pengambilan || '',
                    tanggal_pengambilan: data.tanggal_pengambilan ? data.tanggal_pengambilan.split('T')[0] : '',
                    waktu_pengambilan: data.waktu_pengambilan || '',
                    tanggal_selesai_estimasi: data.tanggal_selesai_estimasi ? data.tanggal_selesai_estimasi.split('T')[0] : '',
                    wadah_tipe: wadahObj.tipe || 'Botol',
                    wadah_qty: wadahObj.qty || '',
                    wadah_lainnya: wadahObj.lainnya || '',
                    peralatan_pengambilan: safeParse(data.peralatan_pengambilan),
                    peralatan_pengukur: safeParse(data.peralatan_pengukur),
                    peralatan_pendukung: safeParse(data.peralatan_pendukung),
                    peralatan_k3: safeParse(data.peralatan_k3),
                    cara_pengambilan: safeParse(data.cara_pengambilan),
                    pengendalian_mutu: safeParse(data.pengendalian_mutu),
                    pengawet: safeParse(data.pengawet),
                    pengamanan_transportasi: safeParse(data.pengamanan_transportasi),
                    suhu: hasilObj.suhu || '',
                    dhl: hasilObj.dhl || '',
                    ph: hasilObj.ph || '',
                    sisa_klor: hasilObj.sisa_klor || '',
                    tds: hasilObj.tds || '',
                    do: hasilObj.do || '',
                    kekeruhan: hasilObj.kekeruhan || '',
                    petugas_pengambil: data.petugas_pengambil || '',
                    pelanggan_saksi: data.pelanggan_saksi || '',
                    foto_pengambilan: data.foto_pengambilan || '',
                    foto_pelabelan: data.foto_pelabelan || '',
                    foto_pengemasan: data.foto_pengemasan || '',
                    status: data.status || 'DRAFT'
                });
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat data berita acara' });
                navigate('/berita-acara');
            }
        }
        setFetching(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (sectionName, value) => {
        setForm(prev => {
            const currentList = prev[sectionName] || [];
            if (currentList.includes(value)) {
                return { ...prev, [sectionName]: currentList.filter(item => item !== value) };
            } else {
                return { ...prev, [sectionName]: [...currentList, value] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const confirmResult = await Swal.fire({
            title: 'Konfirmasi', text: 'Update Berita Acara ini?',
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#0d6efd', confirmButtonText: 'Ya, Update!', cancelButtonText: 'Batal'
        });
        if (!confirmResult.isConfirmed) return;

        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const formData = new FormData();
                formData.append('no_berita_acara', form.no_berita_acara);
                formData.append('jenis_sampel', form.jenis_sampel);
                formData.append('nama_sampel', form.nama_sampel || '');
                formData.append('tujuan_pengambilan', JSON.stringify(form.tujuan_pengambilan));
                formData.append('titik_pengambilan', form.titik_pengambilan || '');
                formData.append('tanggal_pengambilan', new Date(form.tanggal_pengambilan).toISOString());
                formData.append('waktu_pengambilan', form.waktu_pengambilan || '');
                formData.append('tanggal_selesai_estimasi', form.tanggal_selesai_estimasi ? new Date(form.tanggal_selesai_estimasi).toISOString() : '');
                formData.append('jumlah_wadah', JSON.stringify({
                    tipe: form.wadah_tipe,
                    qty: form.wadah_qty,
                    lainnya: form.wadah_lainnya,
                    tujuan_lainnya: form.tujuan_lainnya
                }));
                formData.append('peralatan_pengambilan', JSON.stringify(form.peralatan_pengambilan));
                formData.append('peralatan_pengukur', JSON.stringify(form.peralatan_pengukur));
                formData.append('peralatan_pendukung', JSON.stringify(form.peralatan_pendukung));
                formData.append('peralatan_k3', JSON.stringify(form.peralatan_k3));
                formData.append('cara_pengambilan', JSON.stringify(form.cara_pengambilan));
                formData.append('pengendalian_mutu', JSON.stringify(form.pengendalian_mutu));
                formData.append('pengawet', JSON.stringify(form.pengawet));
                formData.append('pengamanan_transportasi', JSON.stringify(form.pengamanan_transportasi));
                formData.append('hasil_lapangan', JSON.stringify({
                    suhu: form.suhu,
                    dhl: form.dhl,
                    ph: form.ph,
                    sisa_klor: form.sisa_klor,
                    tds: form.tds,
                    do: form.do,
                    kekeruhan: form.kekeruhan
                }));
                formData.append('petugas_pengambil', form.petugas_pengambil);
                formData.append('pelanggan_saksi', form.pelanggan_saksi || '');
                formData.append('status', form.status);

                if (files.foto_pengambilan) formData.append('foto_pengambilan', files.foto_pengambilan);
                if (files.foto_pelabelan) formData.append('foto_pelabelan', files.foto_pelabelan);
                if (files.foto_pengemasan) formData.append('foto_pengemasan', files.foto_pengemasan);

                const response = await Api.put(`/api/berita-acara/${id}`, formData);
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message || 'Berita Acara berhasil diupdate!', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                navigate('/berita-acara');
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.meta?.message || error.response?.data?.message || 'Gagal mengupdate Berita Acara!' });
            }
        }
        setIsLoading(false);
    };

    if (fetching) {
        return (
            <LayoutAdmin>
                <div className="container py-5 text-center">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3 text-muted">Memuat data...</p>
                </div>
            </LayoutAdmin>
        );
    }

    return (
        <LayoutAdmin>
            <div className="page-wrapper" style={{ minHeight: '100vh', background: '#f8fafc', padding: '30px 0' }}>
                <div className="container-xl">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="fw-bold text-dark m-0">Edit Berita Acara</h2>
                            <p className="text-muted m-0">Sesuaikan data laporan pengambilan sampel lapangan</p>
                        </div>
                        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => navigate('/berita-acara')}>
                            <FaArrowLeft /> Kembali
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Left Column */}
                            <div className="col-lg-8">
                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Informasi Umum</h4></div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            {detailData?.jadwals && detailData.jadwals.length > 0 && (
                                                <div className="col-md-12">
                                                    <label className="form-label fw-semibold">Jadwal Pengambilan Terhubung ({detailData.jadwals.length} Pemeriksaan)</label>
                                                    <div className="p-3 bg-light border rounded-3 d-flex flex-wrap gap-2">
                                                        {detailData.jadwals.map(j => (
                                                            <div key={j.id} className="badge bg-primary fs-6 px-3 py-2">
                                                                JDL-{j.id} | {j.transaction_detail?.sampel?.parameter}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold required">Nomor Berita Acara *</label>
                                                <input type="text" className="form-control" name="no_berita_acara" value={form.no_berita_acara} onChange={handleChange} required />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold required">Jenis Sampel *</label>
                                                <input type="text" className="form-control" name="jenis_sampel" value={form.jenis_sampel} onChange={handleChange} required />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Nama Sampel</label>
                                                <input type="text" className="form-control" name="nama_sampel" value={form.nama_sampel} onChange={handleChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Titik Pengambilan Sampel</label>
                                                <input type="text" className="form-control" name="titik_pengambilan" value={form.titik_pengambilan} onChange={handleChange} />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold required">Tanggal Pengambilan *</label>
                                                <input type="date" className="form-control" name="tanggal_pengambilan" value={form.tanggal_pengambilan} onChange={handleChange} required />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Waktu Pengambilan</label>
                                                <input type="time" className="form-control" name="waktu_pengambilan" value={form.waktu_pengambilan} onChange={handleChange} />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Estimasi Selesai Pengujian</label>
                                                <input type="date" className="form-control" name="tanggal_selesai_estimasi" value={form.tanggal_selesai_estimasi} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Checklist Parameter & Peralatan</h4></div>
                                    <div className="card-body">
                                        {/* Tujuan Pengambilan */}
                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-2">Tujuan Pengambilan Sampel</h5>
                                            <div className="d-flex flex-wrap gap-3">
                                                {['Pemantauan', 'Pengawasan', 'Penelitian', 'Lainnya'].map(item => (
                                                    <label key={item} className="form-check form-check-inline m-0">
                                                        <input className="form-check-input" type="checkbox" checked={form.tujuan_pengambilan.includes(item)} onChange={() => handleCheckboxChange('tujuan_pengambilan', item)} />
                                                        <span className="form-check-label">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {form.tujuan_pengambilan.includes('Lainnya') && (
                                                <input type="text" className="form-control mt-2" name="tujuan_lainnya" value={form.tujuan_lainnya} onChange={handleChange} placeholder="Sebutkan tujuan lainnya..." />
                                            )}
                                        </div>

                                        <hr className="my-4" />

                                        {/* Wadah */}
                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-2">Wadah Sampel</h5>
                                            <div className="row g-3 align-items-center">
                                                <div className="col-auto">
                                                    <select className="form-select" name="wadah_tipe" value={form.wadah_tipe} onChange={handleChange}>
                                                        <option value="Botol">Botol</option>
                                                        <option value="Lainnya">Lainnya</option>
                                                    </select>
                                                </div>
                                                <div className="col-auto">
                                                    <input type="number" className="form-control" name="wadah_qty" value={form.wadah_qty} onChange={handleChange} placeholder="Jumlah buah" style={{ width: '120px' }} />
                                                </div>
                                                {form.wadah_tipe === 'Lainnya' && (
                                                    <div className="col">
                                                        <input type="text" className="form-control" name="wadah_lainnya" value={form.wadah_lainnya} onChange={handleChange} placeholder="Sebutkan wadah lainnya..." />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <hr className="my-4" />

                                        {/* Peralatan Pengambilan */}
                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-2">Peralatan Pengambilan Sampel</h5>
                                            <div className="d-flex flex-wrap gap-3">
                                                {['Botol Pemberat', 'Botol Sampel', 'Gayung Bertangkai Plastik'].map(item => (
                                                    <label key={item} className="form-check form-check-inline m-0">
                                                        <input className="form-check-input" type="checkbox" checked={form.peralatan_pengambilan.includes(item)} onChange={() => handleCheckboxChange('peralatan_pengambilan', item)} />
                                                        <span className="form-check-label">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <hr className="my-4" />

                                        {/* Peralatan Pengukur */}
                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-2">Peralatan Pengukur Lapangan</h5>
                                            <div className="row g-2">
                                                {['Tidak ada', 'TDS Meter', 'Klorin Test', 'pH meter', 'Thermometer', 'DO Meter', 'Turbidimeter', 'Konduktimeter'].map(item => (
                                                    <div key={item} className="col-md-3">
                                                        <label className="form-check m-0">
                                                            <input className="form-check-input" type="checkbox" checked={form.peralatan_pengukur.includes(item)} onChange={() => handleCheckboxChange('peralatan_pengukur', item)} />
                                                            <span className="form-check-label">{item}</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="col-lg-4">
                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Hasil Pengukuran</h4></div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="form-label">Suhu (°C)</label>
                                                <input type="text" className="form-control" name="suhu" value={form.suhu} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">pH</label>
                                                <input type="text" className="form-control" name="ph" value={form.ph} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">TDS (mg/l)</label>
                                                <input type="text" className="form-control" name="tds" value={form.tds} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">Kekeruhan (NTU)</label>
                                                <input type="text" className="form-control" name="kekeruhan" value={form.kekeruhan} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">DHL (µs/cm)</label>
                                                <input type="text" className="form-control" name="dhl" value={form.dhl} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">Sisa Klor (mg/l)</label>
                                                <input type="text" className="form-control" name="sisa_klor" value={form.sisa_klor} onChange={handleChange} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">DO (mg/l)</label>
                                                <input type="text" className="form-control" name="do" value={form.do} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Foto Dokumentasi</h4></div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">1. Foto Dokumentasi Proses Pengambilan Sampel</label>
                                            {form.foto_pengambilan && (
                                                <div className="mb-2">
                                                    <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${form.foto_pengambilan}`} alt="Current Pengambilan" className="img-thumbnail" style={{ maxHeight: '120px' }} />
                                                    <div className="small text-muted">File saat ini: {form.foto_pengambilan}</div>
                                                </div>
                                            )}
                                            <input type="file" className="form-control" name="foto_pengambilan" onChange={handleFileChange} accept="image/*" />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">2. Foto Dokumentasi Pelabelan Sampel</label>
                                            {form.foto_pelabelan && (
                                                <div className="mb-2">
                                                    <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${form.foto_pelabelan}`} alt="Current Pelabelan" className="img-thumbnail" style={{ maxHeight: '120px' }} />
                                                    <div className="small text-muted">File saat ini: {form.foto_pelabelan}</div>
                                                </div>
                                            )}
                                            <input type="file" className="form-control" name="foto_pelabelan" onChange={handleFileChange} accept="image/*" />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">3. Foto Dokumentasi Pengemasan Sampel</label>
                                            {form.foto_pengemasan && (
                                                <div className="mb-2">
                                                    <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${form.foto_pengemasan}`} alt="Current Pengemasan" className="img-thumbnail" style={{ maxHeight: '120px' }} />
                                                    <div className="small text-muted">File saat ini: {form.foto_pengemasan}</div>
                                                </div>
                                            )}
                                            <input type="file" className="form-control" name="foto_pengemasan" onChange={handleFileChange} accept="image/*" />
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Kondisi & Transportasi</h4></div>
                                    <div className="card-body">
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-secondary mb-2">Pengawet yang Digunakan</h6>
                                            <div className="d-flex flex-column gap-2">
                                                {['Ice Pack', 'NaOH', 'H2SO4', '(CH3COO)2Zn', 'HNO3'].map(item => (
                                                    <label key={item} className="form-check m-0">
                                                        <input className="form-check-input" type="checkbox" checked={form.pengawet.includes(item)} onChange={() => handleCheckboxChange('pengawet', item)} />
                                                        <span className="form-check-label">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <hr />

                                        <div className="mb-4">
                                            <h6 className="fw-bold text-secondary mb-2">Peralatan K3</h6>
                                            <div className="d-flex flex-column gap-2">
                                                {['Rompi Sampling', 'Sarung Tangan', 'Masker', 'Helmet & Goggle'].map(item => (
                                                    <label key={item} className="form-check m-0">
                                                        <input className="form-check-input" type="checkbox" checked={form.peralatan_k3.includes(item)} onChange={() => handleCheckboxChange('peralatan_k3', item)} />
                                                        <span className="form-check-label">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <hr />

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold required">Nama Petugas Pengambil *</label>
                                            <input type="text" className="form-control" name="petugas_pengambil" value={form.petugas_pengambil} onChange={handleChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Nama Pelanggan / Saksi</label>
                                            <input type="text" className="form-control" name="pelanggan_saksi" value={form.pelanggan_saksi} onChange={handleChange} />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Status Dokumen</label>
                                            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                                                <option value="DRAFT">DRAFT (Bisa Diedit)</option>
                                                <option value="FINAL">FINAL (Kunci Data)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-white border-0 py-3 text-end">
                                        <button type="submit" className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2" disabled={isLoading}>
                                            <FaSave /> {isLoading ? 'Menyimpan...' : 'Update Berita Acara'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </LayoutAdmin>
    );
}
