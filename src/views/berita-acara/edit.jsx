import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';

export default function BeritaAcaraEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({
        kondisi_sampel: '',
        jumlah_sampel: '',
        catatan: ''
    });

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
                setForm({
                    kondisi_sampel: data.kondisi_sampel || '',
                    jumlah_sampel: data.jumlah_sampel?.toString() || '',
                    catatan: data.catatan || ''
                });
            } catch (error) {
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
                const payload = {};
                if (form.kondisi_sampel) payload.kondisi_sampel = form.kondisi_sampel;
                if (form.jumlah_sampel) payload.jumlah_sampel = parseInt(form.jumlah_sampel);
                if (form.catatan) payload.catatan = form.catatan;

                const response = await Api.put(`/api/berita-acara/${id}`, payload);
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message || 'Berita Acara berhasil diupdate!', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                navigate('/berita-acara');
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal mengupdate Berita Acara!' });
            }
        }
        setIsLoading(false);
    };

    if (fetching) {
        return <div className="page-wrapper"><div className="page-body"><div className="container-xl"><div className="text-center py-5"><div className="spinner-border text-primary"></div></div></div></div></div>;
    }

    return (
        <div className="page-wrapper">
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Edit Berita Acara</h2>
                            <div className="text-muted mt-1">Edit laporan pengambilan sampel</div>
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
                                    <div className="card-header"><h3 className="card-title">Form Edit Berita Acara</h3></div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Kondisi Sampel</label>
                                            <input type="text" className="form-control" name="kondisi_sampel" value={form.kondisi_sampel} onChange={handleChange} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Jumlah Sampel</label>
                                            <input type="number" className="form-control" name="jumlah_sampel" min="1" value={form.jumlah_sampel} onChange={handleChange} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Catatan</label>
                                            <textarea className="form-control" name="catatan" value={form.catatan} onChange={handleChange} rows={3} />
                                        </div>
                                    </div>
                                    <div className="card-footer d-flex justify-content-between">
                                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/berita-acara')}>Batal</button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</> : 'Update Berita Acara'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
