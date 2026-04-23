import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';


export default function BeritaAcaraCreate() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [jadwals, setJadwals] = useState([]);
    const [fetchingJadwals, setFetchingJadwals] = useState(true);
    const [form, setForm] = useState({
        jadwal_id: '',
        kondisi_sampel: '',
        jumlah_sampel: '',
        catatan: ''
    });

    useEffect(() => {
        fetchJadwals();
    }, []);

    const fetchJadwals = async () => {
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get('/api/jadwal');
                setJadwals(response.data.data || []);
            } catch (error) {
                console.error('Error fetching jadwal:', error);
            }
        }
        setFetchingJadwals(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.jadwal_id || !form.kondisi_sampel || !form.jumlah_sampel) {
            Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Lengkapi semua field yang wajib diisi!' });
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Konfirmasi', text: 'Buat Berita Acara pengambilan sampel?',
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#0d6efd', confirmButtonText: 'Ya, Buat!', cancelButtonText: 'Batal'
        });
        if (!confirmResult.isConfirmed) return;

        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const payload = {
                    jadwal_id: parseInt(form.jadwal_id),
                    kondisi_sampel: form.kondisi_sampel,
                    jumlah_sampel: parseInt(form.jumlah_sampel),
                    catatan: form.catatan
                };
                const response = await Api.post('/api/berita-acara', payload);
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message || 'Berita Acara berhasil dibuat!', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                navigate('/berita-acara');
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal membuat Berita Acara!' });
            }
        }
        setIsLoading(false);
    };

    return (
        <LayoutAdmin>
        <div className="page-wrapper">
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Buat Berita Acara</h2>
                            <div className="text-muted mt-1">Laporan pengambilan sampel</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="page-body">
                <div className="container-xl">
                    <div className="row row-cards justify-content-center">
                        <div className="col-lg-8">
                            <form onSubmit={handleSubmit}>
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Form Berita Acara</h3></div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label required">Jadwal Pengambilan</label>
                                            <select className="form-select" name="jadwal_id" value={form.jadwal_id} onChange={handleChange} required>
                                                <option value="">Pilih Jadwal...</option>
                                                {jadwals.map(j => (
                                                    <option key={j.id} value={j.id}>
                                                        JDL-{j.id} - {j.order?.no_order || `ORD-${j.order_id}`} ({new Date(j.tanggal).toLocaleDateString('id-ID')})
                                                    </option>
                                                ))}
                                            </select>
                                            {fetchingJadwals && <div className="form-hint"><span className="spinner-border spinner-border-sm me-1"></span>Memuat jadwal...</div>}
                                            <div className="form-hint">Hanya jadwal yang sudah ada dan order berstatus APPROVED (paid) yang bisa dibuatkan Berita Acara.</div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label required">Kondisi Sampel</label>
                                            <input type="text" className="form-control" name="kondisi_sampel" value={form.kondisi_sampel} onChange={handleChange} placeholder="Deskripsi kondisi sampel saat diterima" required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label required">Jumlah Sampel</label>
                                            <input type="number" className="form-control" name="jumlah_sampel" min="1" value={form.jumlah_sampel} onChange={handleChange} placeholder="Jumlah sampel yang diterima" required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Catatan</label>
                                            <textarea className="form-control" name="catatan" value={form.catatan} onChange={handleChange} rows={3} placeholder="Catatan tambahan (opsional)" />
                                        </div>
                                    </div>
                                    <div className="card-footer d-flex justify-content-between">
                                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/berita-acara')}>Batal</button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</> : 'Buat Berita Acara'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </LayoutAdmin>
    );
}
