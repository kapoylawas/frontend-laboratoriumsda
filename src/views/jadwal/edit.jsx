import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';

export default function JadwalEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({
        tanggal_pengambilan: '',
        lokasi: '',
        keterangan: '',
        status: ''
    });

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/jadwal/${id}`);
                const data = response.data.data;
                const dt = data.tanggal_pengambilan ? new Date(data.tanggal_pengambilan) : null;
                setForm({
                    tanggal_pengambilan: dt ? dt.toISOString().slice(0, 16) : '',
                    lokasi: data.lokasi || '',
                    keterangan: data.keterangan || '',
                    status: data.status || ''
                });
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat data jadwal' });
                navigate('/jadwal');
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
            title: 'Konfirmasi', text: 'Update jadwal ini?',
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
                if (form.tanggal_pengambilan) payload.tanggal_pengambilan = new Date(form.tanggal_pengambilan).toISOString();
                if (form.lokasi) payload.lokasi = form.lokasi;
                if (form.keterangan) payload.keterangan = form.keterangan;
                if (form.status) payload.status = form.status;

                const response = await Api.put(`/api/jadwal/${id}`, payload);
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message || 'Jadwal berhasil diupdate!', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                navigate('/jadwal');
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal mengupdate jadwal!' });
            }
        }
        setIsLoading(false);
    };

    if (fetching) {
        return <div className="page-wrapper"><div className="page-body"><div className="container-xl"><div className="text-center py-5"><div className="spinner-border text-primary"></div></div></div></div></div>;
    }

    return (
        <LayoutAdmin>

            <div className="page-wrapper">
                <div className="page-header d-print-none">
                    <div className="container-xl">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <h2 className="page-title">Edit Jadwal</h2>
                                <div className="text-muted mt-1">Edit jadwal pengambilan sampel</div>
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
                                        <div className="card-header"><h3 className="card-title">Form Edit Jadwal</h3></div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label className="form-label">Tanggal Pengambilan</label>
                                                <input type="datetime-local" className="form-control" name="tanggal_pengambilan" value={form.tanggal_pengambilan} onChange={handleChange} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Lokasi</label>
                                                <input type="text" className="form-control" name="lokasi" value={form.lokasi} onChange={handleChange} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Keterangan</label>
                                                <textarea className="form-control" name="keterangan" value={form.keterangan} onChange={handleChange} rows={3} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Status</label>
                                                <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                                                    <option value="">-- Tidak Diubah --</option>
                                                    <option value="SCHEDULED">📅 SCHEDULED</option>
                                                    <option value="COMPLETED">✅ COMPLETED</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="card-footer d-flex justify-content-between">
                                            <button type="button" className="btn btn-secondary" onClick={() => navigate('/jadwal')}>Batal</button>
                                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</> : 'Update Jadwal'}
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
