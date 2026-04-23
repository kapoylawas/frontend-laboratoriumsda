import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';

export default function JadwalCreate() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [fetchingOrders, setFetchingOrders] = useState(true);
    const [form, setForm] = useState({
        order_id: '',
        tanggal_pengambilan: '',
        lokasi: '',
        keterangan: ''
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get('/api/orders?status=APPROVED');
                setOrders(response.data.data || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        }
        setFetchingOrders(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.order_id || !form.tanggal_pengambilan || !form.lokasi) {
            Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Lengkapi semua field yang wajib diisi!' });
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Konfirmasi', text: 'Buat jadwal pengambilan sampel?',
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
                    order_id: parseInt(form.order_id),
                    tanggal_pengambilan: new Date(form.tanggal_pengambilan).toISOString(),
                    lokasi: form.lokasi,
                    keterangan: form.keterangan
                };
                const response = await Api.post('/api/jadwal', payload);
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: response.data.message || 'Jadwal berhasil dibuat!', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                navigate('/jadwal');
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal membuat jadwal!' });
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
                                <h2 className="page-title">Buat Jadwal Pengambilan</h2>
                                <div className="text-muted mt-1">Jadwalkan pengambilan sampel oleh Sanitarian</div>
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
                                        <div className="card-header"><h3 className="card-title">Form Jadwal</h3></div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label className="form-label required">Order (Sudah Approve)</label>
                                                <select className="form-select" name="order_id" value={form.order_id} onChange={handleChange} required>
                                                    <option value="">Pilih Order...</option>
                                                    {orders.map(order => (
                                                        <option key={order.id} value={order.id}>
                                                            ORD-{order.id} - {order.user?.name || 'Unknown'}
                                                        </option>
                                                    ))}
                                                </select>
                                                {fetchingOrders && <div className="form-hint"><span className="spinner-border spinner-border-sm me-1"></span>Memuat orders...</div>}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label required">Tanggal Pengambilan</label>
                                                <input type="datetime-local" className="form-control" name="tanggal_pengambilan" value={form.tanggal_pengambilan} onChange={handleChange} required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label required">Lokasi</label>
                                                <input type="text" className="form-control" name="lokasi" value={form.lokasi} onChange={handleChange} placeholder="Alamat lokasi pengambilan" required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Keterangan</label>
                                                <textarea className="form-control" name="keterangan" value={form.keterangan} onChange={handleChange} rows={3} placeholder="Catatan tambahan (opsional)" />
                                            </div>
                                        </div>
                                        <div className="card-footer d-flex justify-content-between">
                                            <button type="button" className="btn btn-secondary" onClick={() => navigate('/jadwal')}>Batal</button>
                                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</> : 'Buat Jadwal'}
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
