import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function BeritaAcaraCreate() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [jadwals, setJadwals] = useState([]);
    const [fetchingJadwals, setFetchingJadwals] = useState(true);
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
        jadwal_id: '',
        no_berita_acara: '',
        jenis_sampel: 'Air Bersih',
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
        peralatan_pengukur: ['Tidak ada'],
        peralatan_pendukung: [],
        peralatan_k3: [],
        cara_pengambilan: ['Sesaat'],
        pengendalian_mutu: [],
        pengawet: [],
        pengamanan_transportasi: ['Pengemasan Sampel', 'Pelabelan Sampel'],
        suhu: '',
        dhl: '',
        ph: '',
        sisa_klor: '',
        tds: '',
        do: '',
        kekeruhan: '',
        petugas_pengambil: '',
        pelanggan_saksi: '',
        status: 'DRAFT'
    });

    useEffect(() => {
        fetchJadwals();
    }, []);

    const fetchJadwals = async () => {
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get('/api/jadwal-pengambilan');
                // Filter schedules that don't have a berita_acara yet
                const filtered = (response.data.data || []).filter(j => !j.berita_acara);
                setJadwals(filtered);
            } catch (error) {
                console.error('Error fetching schedules:', error);
            }
        }
        setFetchingJadwals(false);
    };

    const handleJadwalChange = (e) => {
        const id = e.target.value;
        if (!id) {
            setForm(prev => ({ ...prev, jadwal_id: '' }));
            return;
        }

        const selected = jadwals.find(j => j.id === parseInt(id));
        if (selected) {
            const customerName = selected.transaction_detail?.transaction?.user?.name || '';
            const officerName = selected.petugas || '';
            const scheduleDate = selected.tanggal_pengambilan ? selected.tanggal_pengambilan.split('T')[0] : '';
            const time = selected.jam_pengambilan || '';
            const parameter = selected.transaction_detail?.sampel?.parameter || '';

            // Generate invoice-based BA number: e.g. BA/506/AB/2026
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const generatedNo = `BA/${selected.transaction_detail?.transaction?.invoice}/${randomSuffix}`;

            setForm(prev => ({
                ...prev,
                jadwal_id: id,
                no_berita_acara: generatedNo,
                petugas_pengambil: officerName,
                pelanggan_saksi: customerName,
                tanggal_pengambilan: scheduleDate,
                waktu_pengambilan: time,
                jenis_sampel: parameter.toLowerCase().includes('makanan') ? 'Makanan' : 'Air Bersih'
            }));
        }
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

        if (!form.jadwal_id || !form.no_berita_acara || !form.jenis_sampel || !form.tanggal_pengambilan || !form.petugas_pengambil) {
            Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Lengkapi field wajib yang bertanda bintang (*)' });
            return;
        }

        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                // Construct FormData for multipart upload
                const formData = new FormData();
                formData.append('jadwal_id', parseInt(form.jadwal_id));
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

                const response = await Api.post('/api/berita-acara', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message || 'Berita Acara berhasil dibuat!', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                navigate('/berita-acara');
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal membuat Berita Acara!' });
            }
        }
        setIsLoading(false);
    };

    return (
        <LayoutAdmin>
            <div className="page-wrapper" style={{ minHeight: '100vh', background: '#f8fafc', padding: '30px 0' }}>
                <div className="container-xl">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="fw-bold text-dark m-0">Buat Berita Acara Baru</h2>
                            <p className="text-muted m-0">Isi lengkap berita acara pengambilan sampel lapangan</p>
                        </div>
                        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => navigate('/berita-acara')}>
                            <FaArrowLeft /> Kembali
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Left Column: General & Fields */}
                            <div className="col-lg-8">
                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Informasi Umum</h4></div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-12">
                                                <label className="form-label fw-semibold required">Pilih Jadwal Pengambilan *</label>
                                                <select className="form-select" name="jadwal_id" value={form.jadwal_id} onChange={handleJadwalChange} required>
                                                    <option value="">Pilih Jadwal...</option>
                                                    {jadwals.map(j => (
                                                        <option key={j.id} value={j.id}>
                                                            JDL-{j.id} - Invoice {j.transaction_detail?.transaction?.invoice} | {j.transaction_detail?.sampel?.parameter} ({new Date(j.tanggal_pengambilan).toLocaleDateString('id-ID')})
                                                        </option>
                                                    ))}
                                                </select>
                                                {fetchingJadwals && <div className="form-hint mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Memuat jadwal...</div>}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold required">Nomor Berita Acara *</label>
                                                <input type="text" className="form-control" name="no_berita_acara" value={form.no_berita_acara} onChange={handleChange} required />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold required">Jenis Sampel *</label>
                                                <input type="text" className="form-control" name="jenis_sampel" value={form.jenis_sampel} onChange={handleChange} required />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Nama Sampel (Opsional)</label>
                                                <input type="text" className="form-control" name="nama_sampel" value={form.nama_sampel} onChange={handleChange} placeholder="cth: Air Kran Utama" />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Titik Pengambilan Sampel</label>
                                                <input type="text" className="form-control" name="titik_pengambilan" value={form.titik_pengambilan} onChange={handleChange} placeholder="cth: Kamar Mandi Utama" />
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

                                {/* Checkbox Checklist sections */}
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

                            {/* Right Column: Other Checklists & Measurement results */}
                            <div className="col-lg-4">
                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Hasil Pengukuran</h4></div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="form-label">Suhu (°C)</label>
                                                <input type="text" className="form-control" name="suhu" value={form.suhu} onChange={handleChange} placeholder="Suhu" />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">pH</label>
                                                <input type="text" className="form-control" name="ph" value={form.ph} onChange={handleChange} placeholder="pH" />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">TDS (mg/l)</label>
                                                <input type="text" className="form-control" name="tds" value={form.tds} onChange={handleChange} placeholder="TDS" />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">Kekeruhan (NTU)</label>
                                                <input type="text" className="form-control" name="kekeruhan" value={form.kekeruhan} onChange={handleChange} placeholder="Kekeruhan" />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">DHL (µs/cm)</label>
                                                <input type="text" className="form-control" name="dhl" value={form.dhl} onChange={handleChange} placeholder="DHL" />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label">Sisa Klor (mg/l)</label>
                                                <input type="text" className="form-control" name="sisa_klor" value={form.sisa_klor} onChange={handleChange} placeholder="Sisa Klor" />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label">DO (mg/l)</label>
                                                <input type="text" className="form-control" name="do" value={form.do} onChange={handleChange} placeholder="Dissolved Oxygen" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Foto Dokumentasi</h4></div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">1. Foto Dokumentasi Proses Pengambilan Sampel</label>
                                            <input type="file" className="form-control" name="foto_pengambilan" onChange={handleFileChange} accept="image/*" />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">2. Foto Dokumentasi Pelabelan Sampel</label>
                                            <input type="file" className="form-control" name="foto_pelabelan" onChange={handleFileChange} accept="image/*" />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">3. Foto Dokumentasi Pengemasan Sampel</label>
                                            <input type="file" className="form-control" name="foto_pengemasan" onChange={handleFileChange} accept="image/*" />
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3"><h4 className="fw-bold m-0 text-primary">Kondisi & Transportasi</h4></div>
                                    <div className="card-body">
                                        {/* Pengawet */}
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-secondary mb-2">Pengawet yang Digunakan</h6>
                                            <div className="d-flex flex-column gap-2">
                                                {['Ice Pack', 'H2SO4', 'HNO3', 'NaOH', '(CH3COO)2Zn'].map(item => (
                                                    <label key={item} className="form-check m-0">
                                                        <input className="form-check-input" type="checkbox" checked={form.pengawet.includes(item)} onChange={() => handleCheckboxChange('pengawet', item)} />
                                                        <span className="form-check-label">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <hr />

                                        {/* K3 */}
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

                                        {/* Petugas & Saksi */}
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
                                            <FaSave /> {isLoading ? 'Menyimpan...' : 'Simpan Berita Acara'}
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
