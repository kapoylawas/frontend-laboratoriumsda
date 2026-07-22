import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';
import { 
    FaSave, 
    FaArrowLeft, 
    FaInfoCircle, 
    FaClipboardList, 
    FaFlask, 
    FaCamera, 
    FaUserCheck,
    FaCheck,
    FaEdit
} from 'react-icons/fa';
import SignaturePad from '../../components/SignaturePad';

export default function BeritaAcaraEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [errors, setErrors] = useState({});

    const [ttdPetugas, setTtdPetugas] = useState('');
    const [ttdPelanggan, setTtdPelanggan] = useState('');

    const [files, setFiles] = useState({
        foto_pengambilan: null,
        foto_pelabelan: null,
        foto_pengemasan: null
    });

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles && selectedFiles[0]) {
            const file = selectedFiles[0];

            if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
                const errorMsg = 'Format file harus berupa gambar (JPG, JPEG, PNG, WEBP)';
                setErrors(prev => ({ ...prev, [name]: errorMsg }));
                setFiles(prev => ({ ...prev, [name]: null }));
                e.target.value = '';
                Swal.fire({
                    icon: 'warning',
                    title: 'Format File Salah',
                    text: errorMsg
                });
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
                const errorMsg = `Ukuran file (${fileSizeMb} MB) melebihi batas maksimal 5 MB`;
                setErrors(prev => ({ ...prev, [name]: errorMsg }));
                setFiles(prev => ({ ...prev, [name]: null }));
                e.target.value = '';
                Swal.fire({
                    icon: 'warning',
                    title: 'File Terlalu Besar',
                    text: errorMsg
                });
                return;
            }

            setErrors(prev => ({ ...prev, [name]: null }));
            setFiles(prev => ({ ...prev, [name]: file }));
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

                setTtdPetugas(hasilObj.ttd_petugas || '');
                setTtdPelanggan(hasilObj.ttd_pelanggan || '');

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
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
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

    const validateForm = () => {
        const newErrors = {};

        if (!form.no_berita_acara || !form.no_berita_acara.trim()) {
            newErrors.no_berita_acara = 'Nomor Berita Acara wajib diisi.';
        }
        if (!form.jenis_sampel || !form.jenis_sampel.trim()) {
            newErrors.jenis_sampel = 'Jenis Sampel wajib diisi.';
        }
        if (!form.tanggal_pengambilan) {
            newErrors.tanggal_pengambilan = 'Tanggal Pengambilan wajib diisi.';
        }
        if (!form.petugas_pengambil || !form.petugas_pengambil.trim()) {
            newErrors.petugas_pengambil = 'Nama Petugas Pengambil wajib diisi.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Form Belum Lengkap', 
                text: 'Silakan periksa kembali dan lengkapi field wajib bertanda bintang (*).' 
            });
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Konfirmasi Update', text: 'Perbarui data Berita Acara ini?',
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#1d4ed8', confirmButtonText: 'Ya, Update!', cancelButtonText: 'Batal'
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
                    kekeruhan: form.kekeruhan,
                    ttd_petugas: ttdPetugas,
                    ttd_pelanggan: ttdPelanggan
                }));
                formData.append('petugas_pengambil', form.petugas_pengambil);
                formData.append('pelanggan_saksi', form.pelanggan_saksi || '');
                formData.append('status', form.status);

                if (files.foto_pengambilan) formData.append('foto_pengambilan', files.foto_pengambilan);
                if (files.foto_pelabelan) formData.append('foto_pelabelan', files.foto_pelabelan);
                if (files.foto_pengemasan) formData.append('foto_pengemasan', files.foto_pengemasan);

                const response = await Api.put(`/api/berita-acara/${id}`, formData);
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message || 'Berita Acara berhasil diperbarui!', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                navigate('/berita-acara');
            } catch (error) {
                console.error(error);
                if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                    const apiErrors = {};
                    error.response.data.errors.forEach(err => {
                        const key = err.path || err.param;
                        if (key) apiErrors[key] = err.msg;
                    });
                    setErrors(prev => ({ ...prev, ...apiErrors }));
                    Swal.fire({ 
                        icon: 'error', 
                        title: 'Validasi Server Gagal', 
                        text: 'Terdapat kesalahan input. Periksa pesan error di bawah bidang yang sesuai.' 
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.meta?.message || error.response?.data?.message || 'Gagal memperbarui Berita Acara!' });
                }
            }
        }
        setIsLoading(false);
    };

    if (fetching) {
        return (
            <LayoutAdmin>
                <div className="page-wrapper text-center py-5">
                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="mt-3 text-muted">Memuat data berita acara...</p>
                </div>
            </LayoutAdmin>
        );
    }

    return (
        <LayoutAdmin>
            <div className="page-wrapper" style={{ minHeight: '100vh', background: '#f1f5f9', padding: '24px 0 80px 0' }}>
                <div className="container-xl">
                    {/* Header Banner */}
                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #991b1b 0%, #881337 50%, #4c0519 100%)', color: 'white' }}>
                        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '54px', height: '54px', flexShrink: 0 }}>
                                    <FaEdit style={{ fontSize: '26px', color: '#991b1b' }} />
                                </div>
                                <div>
                                    <h2 className="fw-bold m-0 text-white" style={{ fontSize: '1.45rem', letterSpacing: '-0.3px' }}>Edit Berita Acara #{id}</h2>
                                    <p className="m-0 small mt-1" style={{ color: 'rgba(255, 255, 255, 0.88)' }}>Perbarui rincian berita acara dan tanda tangan digital</p>
                                </div>
                            </div>
                            <button className="btn btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 rounded-3 shadow-sm" style={{ background: '#ffffff', color: '#991b1b', border: 'none' }} onClick={() => navigate('/berita-acara')}>
                                <FaArrowLeft /> Kembali ke Daftar
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row g-4">
                            {/* Left Column */}
                            <div className="col-12 col-lg-7 col-xl-8">
                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3 px-4 d-flex align-items-center gap-2 border-bottom-0">
                                        <span className="badge bg-primary-lt p-2 rounded-3">
                                            <FaInfoCircle className="fs-5 text-primary" />
                                        </span>
                                        <h4 className="fw-bold m-0 text-dark">Informasi Umum</h4>
                                    </div>
                                    <div className="card-body px-4 pt-2 pb-4">
                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-semibold required">Nomor Berita Acara *</label>
                                                <input 
                                                    type="text" 
                                                    className={`form-control ${errors.no_berita_acara ? 'is-invalid' : ''}`} 
                                                    name="no_berita_acara" 
                                                    value={form.no_berita_acara} 
                                                    onChange={handleChange} 
                                                />
                                                {errors.no_berita_acara && <div className="invalid-feedback">{errors.no_berita_acara}</div>}
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-semibold required">Jenis Sampel *</label>
                                                <input 
                                                    type="text" 
                                                    className={`form-control ${errors.jenis_sampel ? 'is-invalid' : ''}`} 
                                                    name="jenis_sampel" 
                                                    value={form.jenis_sampel} 
                                                    onChange={handleChange} 
                                                />
                                                {errors.jenis_sampel && <div className="invalid-feedback">{errors.jenis_sampel}</div>}
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-semibold">Nama Sampel (Opsional)</label>
                                                <input type="text" className="form-control" name="nama_sampel" value={form.nama_sampel} onChange={handleChange} />
                                            </div>

                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-semibold">Titik Pengambilan Sampel</label>
                                                <input type="text" className="form-control" name="titik_pengambilan" value={form.titik_pengambilan} onChange={handleChange} />
                                            </div>

                                            <div className="col-12 col-sm-6 col-md-4">
                                                <label className="form-label fw-semibold required">Tanggal Pengambilan *</label>
                                                <input 
                                                    type="date" 
                                                    className={`form-control ${errors.tanggal_pengambilan ? 'is-invalid' : ''}`} 
                                                    name="tanggal_pengambilan" 
                                                    value={form.tanggal_pengambilan} 
                                                    onChange={handleChange} 
                                                />
                                                {errors.tanggal_pengambilan && <div className="invalid-feedback">{errors.tanggal_pengambilan}</div>}
                                            </div>

                                            <div className="col-12 col-sm-6 col-md-4">
                                                <label className="form-label fw-semibold">Waktu Pengambilan</label>
                                                <input type="time" className="form-control" name="waktu_pengambilan" value={form.waktu_pengambilan} onChange={handleChange} />
                                            </div>

                                            <div className="col-12 col-sm-6 col-md-4">
                                                <label className="form-label fw-semibold">Estimasi Selesai Pengujian</label>
                                                <input type="date" className="form-control" name="tanggal_selesai_estimasi" value={form.tanggal_selesai_estimasi} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3 px-4 d-flex align-items-center gap-2 border-bottom-0">
                                        <span className="badge bg-success-lt p-2 rounded-3">
                                            <FaClipboardList className="fs-5 text-success" />
                                        </span>
                                        <h4 className="fw-bold m-0 text-dark">Checklist Parameter & Peralatan Lapangan</h4>
                                    </div>
                                    <div className="card-body px-4 pt-2 pb-4">
                                        {/* Tujuan Pengambilan */}
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-dark mb-2">Tujuan Pengambilan Sampel</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {['Pemantauan', 'Pengawasan', 'Penelitian', 'Lainnya'].map(item => {
                                                    const isChecked = form.tujuan_pengambilan.includes(item);
                                                    return (
                                                        <label key={item} className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-outline-secondary'} rounded-pill px-3 transition-all`} style={{ cursor: 'pointer' }}>
                                                            <input className="d-none" type="checkbox" checked={isChecked} onChange={() => handleCheckboxChange('tujuan_pengambilan', item)} />
                                                            {isChecked && <FaCheck className="me-1" />} {item}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {form.tujuan_pengambilan.includes('Lainnya') && (
                                                <input type="text" className="form-control mt-2" name="tujuan_lainnya" value={form.tujuan_lainnya} onChange={handleChange} placeholder="Sebutkan tujuan lainnya..." />
                                            )}
                                        </div>

                                        <hr className="my-3 text-muted opacity-25" />

                                        {/* Wadah Sampel */}
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-dark mb-2">Wadah Sampel</h6>
                                            <div className="row g-2 align-items-center">
                                                <div className="col-6 col-sm-auto">
                                                    <select className="form-select" name="wadah_tipe" value={form.wadah_tipe} onChange={handleChange}>
                                                        <option value="Botol">Botol</option>
                                                        <option value="Lainnya">Lainnya</option>
                                                    </select>
                                                </div>
                                                <div className="col-6 col-sm-auto">
                                                    <input type="number" className="form-control" name="wadah_qty" value={form.wadah_qty} onChange={handleChange} placeholder="Jumlah buah" style={{ minWidth: '110px' }} />
                                                </div>
                                                {form.wadah_tipe === 'Lainnya' && (
                                                    <div className="col-12 col-sm">
                                                        <input type="text" className="form-control" name="wadah_lainnya" value={form.wadah_lainnya} onChange={handleChange} placeholder="Sebutkan wadah lainnya..." />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <hr className="my-3 text-muted opacity-25" />

                                        {/* Peralatan Pengambilan */}
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-dark mb-2">Peralatan Pengambilan Sampel</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {['Botol Pemberat', 'Botol Sampel', 'Gayung Bertangkai Plastik'].map(item => {
                                                    const isChecked = form.peralatan_pengambilan.includes(item);
                                                    return (
                                                        <label key={item} className={`btn btn-sm ${isChecked ? 'btn-success' : 'btn-outline-secondary'} rounded-pill px-3 transition-all`} style={{ cursor: 'pointer' }}>
                                                            <input className="d-none" type="checkbox" checked={isChecked} onChange={() => handleCheckboxChange('peralatan_pengambilan', item)} />
                                                            {isChecked && <FaCheck className="me-1" />} {item}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <hr className="my-3 text-muted opacity-25" />

                                        {/* Peralatan Pengukur */}
                                        <div>
                                            <h6 className="fw-bold text-dark mb-2">Peralatan Pengukur Lapangan</h6>
                                            <div className="row g-2">
                                                {['Tidak ada', 'TDS Meter', 'Klorin Test', 'pH meter', 'Thermometer', 'DO Meter', 'Turbidimeter', 'Konduktimeter'].map(item => {
                                                    const isChecked = form.peralatan_pengukur.includes(item);
                                                    return (
                                                        <div key={item} className="col-6 col-sm-4 col-md-3">
                                                            <label className={`form-check p-2 border rounded-3 bg-white w-100 ${isChecked ? 'border-primary bg-primary-subtle' : ''}`} style={{ cursor: 'pointer' }}>
                                                                <input className="form-check-input ms-1 me-2" type="checkbox" checked={isChecked} onChange={() => handleCheckboxChange('peralatan_pengukur', item)} />
                                                                <span className="form-check-label small fw-medium">{item}</span>
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="col-12 col-lg-5 col-xl-4">
                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom-0">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge bg-purple-lt p-2 rounded-3" style={{ color: '#7c3aed', backgroundColor: '#f3e8ff' }}>
                                                <FaFlask className="fs-5" />
                                            </span>
                                            <h4 className="fw-bold m-0 text-dark">Hasil Pengukuran</h4>
                                        </div>
                                        <span className="badge bg-secondary-subtle text-secondary fw-normal">Opsional</span>
                                    </div>
                                    <div className="card-body px-4 pt-0 pb-4">
                                        <div className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
                                            Boleh dikosongkan jika tidak ada pengukuran parameter lapangan.
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <label className="form-label small fw-semibold">Suhu (°C)</label>
                                                <input type="text" className="form-control form-control-sm" name="suhu" value={form.suhu} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small fw-semibold">pH</label>
                                                <input type="text" className="form-control form-control-sm" name="ph" value={form.ph} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small fw-semibold">TDS (mg/l)</label>
                                                <input type="text" className="form-control form-control-sm" name="tds" value={form.tds} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small fw-semibold">Kekeruhan (NTU)</label>
                                                <input type="text" className="form-control form-control-sm" name="kekeruhan" value={form.kekeruhan} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small fw-semibold">DHL (µs/cm)</label>
                                                <input type="text" className="form-control form-control-sm" name="dhl" value={form.dhl} onChange={handleChange} />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small fw-semibold">Sisa Klor (mg/l)</label>
                                                <input type="text" className="form-control form-control-sm" name="sisa_klor" value={form.sisa_klor} onChange={handleChange} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold">DO (mg/l)</label>
                                                <input type="text" className="form-control form-control-sm" name="do" value={form.do} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3 px-4 d-flex align-items-center gap-2 border-bottom-0">
                                        <span className="badge bg-warning-lt p-2 rounded-3">
                                            <FaCamera className="fs-5 text-warning" />
                                        </span>
                                        <h4 className="fw-bold m-0 text-dark">Foto Dokumentasi</h4>
                                    </div>
                                    <div className="card-body px-4 pt-0 pb-4">
                                        <div className="alert alert-info py-2 px-3 mb-3 rounded-3" style={{ fontSize: '0.78rem' }}>
                                            <strong>📌 Ketentuan Upload Foto:</strong>
                                            <ul className="mb-0 ps-3 mt-1">
                                                <li>Format file: <strong>JPG, JPEG, PNG, WEBP</strong></li>
                                                <li>Ukuran maksimal: <strong>5 MB</strong> per foto</li>
                                            </ul>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small">1. Foto Pengambilan Sampel</label>
                                            {form.foto_pengambilan && (
                                                <div className="mb-2">
                                                    <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${form.foto_pengambilan}`} alt="Current Pengambilan" className="img-thumbnail rounded-3" style={{ maxHeight: '110px' }} />
                                                    <div className="small text-muted" style={{ fontSize: '0.75rem' }}>File saat ini: {form.foto_pengambilan}</div>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                className={`form-control form-control-sm ${errors.foto_pengambilan ? 'is-invalid' : ''}`} 
                                                name="foto_pengambilan" 
                                                onChange={handleFileChange} 
                                                accept="image/jpeg,image/png,image/jpg,image/webp" 
                                            />
                                            {files.foto_pengambilan && (
                                                <small className="text-success fw-semibold d-block mt-1" style={{ fontSize: '0.75rem' }}>
                                                    ✓ File baru: {files.foto_pengambilan.name} ({(files.foto_pengambilan.size / (1024 * 1024)).toFixed(2)} MB)
                                                </small>
                                            )}
                                            {errors.foto_pengambilan && <div className="text-danger small mt-1">⚠️ {errors.foto_pengambilan}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small">2. Foto Pelabelan Sampel</label>
                                            {form.foto_pelabelan && (
                                                <div className="mb-2">
                                                    <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${form.foto_pelabelan}`} alt="Current Pelabelan" className="img-thumbnail rounded-3" style={{ maxHeight: '110px' }} />
                                                    <div className="small text-muted" style={{ fontSize: '0.75rem' }}>File saat ini: {form.foto_pelabelan}</div>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                className={`form-control form-control-sm ${errors.foto_pelabelan ? 'is-invalid' : ''}`} 
                                                name="foto_pelabelan" 
                                                onChange={handleFileChange} 
                                                accept="image/jpeg,image/png,image/jpg,image/webp" 
                                            />
                                            {files.foto_pelabelan && (
                                                <small className="text-success fw-semibold d-block mt-1" style={{ fontSize: '0.75rem' }}>
                                                    ✓ File baru: {files.foto_pelabelan.name} ({(files.foto_pelabelan.size / (1024 * 1024)).toFixed(2)} MB)
                                                </small>
                                            )}
                                            {errors.foto_pelabelan && <div className="text-danger small mt-1">⚠️ {errors.foto_pelabelan}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small">3. Foto Pengemasan Sampel</label>
                                            {form.foto_pengemasan && (
                                                <div className="mb-2">
                                                    <img src={`${import.meta.env.VITE_APP_BASEURL}/uploads/${form.foto_pengemasan}`} alt="Current Pengemasan" className="img-thumbnail rounded-3" style={{ maxHeight: '110px' }} />
                                                    <div className="small text-muted" style={{ fontSize: '0.75rem' }}>File saat ini: {form.foto_pengemasan}</div>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                className={`form-control form-control-sm ${errors.foto_pengemasan ? 'is-invalid' : ''}`} 
                                                name="foto_pengemasan" 
                                                onChange={handleFileChange} 
                                                accept="image/jpeg,image/png,image/jpg,image/webp" 
                                            />
                                            {files.foto_pengemasan && (
                                                <small className="text-success fw-semibold d-block mt-1" style={{ fontSize: '0.75rem' }}>
                                                    ✓ File baru: {files.foto_pengemasan.name} ({(files.foto_pengemasan.size / (1024 * 1024)).toFixed(2)} MB)
                                                </small>
                                            )}
                                            {errors.foto_pengemasan && <div className="text-danger small mt-1">⚠️ {errors.foto_pengemasan}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
                                    <div className="card-header bg-white py-3 px-4 d-flex align-items-center gap-2 border-bottom-0">
                                        <span className="badge bg-info-lt p-2 rounded-3">
                                            <FaUserCheck className="fs-5 text-info" />
                                        </span>
                                        <h4 className="fw-bold m-0 text-dark">Petugas, Saksi & TTD Digital</h4>
                                    </div>
                                    <div className="card-body px-4 pt-0 pb-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold required small">Nama Petugas Pengambil *</label>
                                            <input 
                                                type="text" 
                                                className={`form-control ${errors.petugas_pengambil ? 'is-invalid' : ''}`} 
                                                name="petugas_pengambil" 
                                                value={form.petugas_pengambil} 
                                                onChange={handleChange} 
                                            />
                                            {errors.petugas_pengambil && <div className="invalid-feedback">{errors.petugas_pengambil}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small">Nama Pelanggan / Saksi</label>
                                            <input type="text" className="form-control" name="pelanggan_saksi" value={form.pelanggan_saksi} onChange={handleChange} placeholder="Nama pelanggan atau saksi" />
                                        </div>

                                        <hr className="my-3 text-muted opacity-25" />

                                        {/* Tanda Tangan Digital */}
                                        <SignaturePad 
                                            label="1. TTD Petugas Pengambil" 
                                            value={ttdPetugas} 
                                            onChange={setTtdPetugas} 
                                            placeholderName={form.petugas_pengambil || 'Petugas'} 
                                        />
                                        
                                        <SignaturePad 
                                            label="2. TTD Pelanggan / Saksi" 
                                            value={ttdPelanggan} 
                                            onChange={setTtdPelanggan} 
                                            placeholderName={form.pelanggan_saksi || 'Pelanggan/Saksi'} 
                                        />

                                        <hr className="my-3 text-muted opacity-25" />

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold small">Status Dokumen</label>
                                            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                                                <option value="DRAFT">DRAFT (Bisa Diedit)</option>
                                                <option value="FINAL">FINAL (Kunci Data)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-white border-0 py-3 px-4 text-end">
                                        <button type="submit" className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm" disabled={isLoading}>
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
