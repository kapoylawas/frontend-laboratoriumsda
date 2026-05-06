import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';
import SuratPenawaran from '../pengajuan/suratPenawaran';

export default function SemuaPenawaranDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [approveResult, setApproveResult] = useState(null);
    const [showSurat, setShowSurat] = useState(false);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchDetail = async () => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/pemohonan/admin/${id}`);
                setData(response.data.data);
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat detail pemohonan' });
                navigate('/semua-penawaran');
            }
        }
        setIsLoading(false);
    };

    const handleApprove = async () => {
        const confirmResult = await Swal.fire({
            title: 'Setujui Pemohonan?',
            html: `
                <div class="text-start">
                    <p>Pemohonan yang disetujui akan membuat:</p>
                    <ul class="text-start">
                        <li><strong>Order</strong> untuk setiap item sampel</li>
                        <li><strong>Hasil pemeriksaan</strong> yang perlu diisi nanti</li>
                    </ul>
                    <p class="text-muted small">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2fb344',
            confirmButtonText: 'Ya, Setujui!',
            cancelButtonText: 'Batal'
        });
        if (!confirmResult.isConfirmed) return;

        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.put(`/api/pemohonan/admin/${id}/approve`);
                const resultData = response.data.data;
                setData(resultData.pemohonan);
                setApproveResult(resultData);

                const orderCount = resultData.orders?.length || 0;
                const hasilCount = resultData.hasils?.length || 0;

                await Swal.fire({
                    icon: 'success',
                    title: 'Pemohonan Disetujui!',
                    html: `
                        <div class="text-center">
                            <p>Pemohonan telah berhasil disetujui.</p>
                            <div class="d-flex justify-content-center gap-3 mt-3">
                                <div class="text-center">
                                    <div class="fs-2 fw-bold text-primary">${orderCount}</div>
                                    <div class="text-muted small">Order dibuat</div>
                                </div>
                                <div class="text-center">
                                    <div class="fs-2 fw-bold text-success">${hasilCount}</div>
                                    <div class="text-muted small">Hasil dibuat</div>
                                </div>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menyetujui pemohonan' });
            }
        }
    };

    const handleCancel = async () => {
        const confirmResult = await Swal.fire({
            title: 'Batalkan Pemohonan?',
            html: `
                <div class="text-start">
                    <p class="text-muted mb-2">Pemohonan yang dibatalkan tidak dapat dikembalikan.</p>
                    <label for="alasan-cancel" class="form-label small fw-semibold">Alasan Pembatalan (opsional)</label>
                    <textarea id="alasan-cancel" class="form-control" rows="3" placeholder="Masukkan alasan pembatalan..."></textarea>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d63939',
            confirmButtonText: 'Ya, Batalkan!',
            cancelButtonText: 'Kembali',
            focusConfirm: false,
            preConfirm: () => {
                const alasan = document.getElementById('alasan-cancel')?.value || '';
                return { alasan };
            }
        });
        if (!confirmResult.isConfirmed) return;

        const { alasan } = confirmResult.value;
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const payload = {};
                if (alasan && alasan.trim()) {
                    payload.alasan = alasan.trim();
                }
                await Api.put(`/api/pemohonan/admin/${id}/cancel`, payload);
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pemohonan telah dibatalkan', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                fetchDetail();
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal membatalkan pemohonan' });
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            PENDING: { class: 'bg-warning text-dark', label: 'Menunggu' },
            APPROVED: { class: 'bg-success', label: 'Disetujui' },
            CANCELLED: { class: 'bg-secondary', label: 'Dibatalkan' },
            EXPIRED: { class: 'bg-dark', label: 'Kadaluarsa' }
        };
        const s = statusMap[status] || { class: 'bg-secondary', label: status };
        return <span className={`badge ${s.class}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>{s.label}</span>;
    };

    const getJenisBadge = (jenis) => {
        if (jenis === 'PEMESANAN') {
            return <span className="badge bg-primary" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>Pemesanan</span>;
        }
        return <span className="badge bg-info" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>Surat Penawaran</span>;
    };

    const calcGrandTotal = (items) => {
        if (!items || items.length === 0) return 0;
        return items.reduce((sum, item) => sum + (item.price || 0), 0);
    };

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="page-wrapper">
                    <div className="page-body">
                        <div className="container-xl">
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                <div className="mt-3 text-muted">Memuat detail pemohonan...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    if (!data) return null;

    const grandTotal = calcGrandTotal(data.items);

    return (
        <LayoutAdmin>
            <div className="page-wrapper">
                <div className="page-header d-print-none">
                    <div className="container-xl">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <h2 className="page-title">Detail Pemohonan #{data.id}</h2>
                                <div className="text-muted mt-1">
                                    {getJenisBadge(data.jenis)} {' '} {getStatusBadge(data.status)}
                                </div>
                            </div>
                            <div className="col-auto d-flex gap-2">
                                <button className="btn btn-info" onClick={() => setShowSurat(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></svg>
                                    Preview Surat
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/semua-penawaran')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
                                    Kembali
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-xl">
                        <div className="row row-cards">
                            <div className="col-lg-8">
                                {/* Informasi Pemohonan */}
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h3 className="card-title">Informasi Pemohonan</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="text-muted small">ID Pemohonan</div>
                                                <div className="fw-bold fs-4">#{data.id}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Jenis</div>
                                                <div className="mt-1">{getJenisBadge(data.jenis)}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Pemohon</div>
                                                <div className="fw-semibold">{data.user?.name || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Email</div>
                                                <div>{data.user?.email || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Telepon</div>
                                                <div>{data.user?.phone || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">NIK</div>
                                                <div>{data.user?.nik || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Tanggal Pengajuan</div>
                                                <div>{formatDate(data.tanggal_pengajuan)}</div>
                                            </div>
                                            {data.tanggal_expired && (
                                                <div className="col-md-6">
                                                    <div className="text-muted small">Berlaku Sampai</div>
                                                    <div className="text-warning fw-semibold">{formatDate(data.tanggal_expired)}</div>
                                                </div>
                                            )}
                                            {data.tanggal_action && (
                                                <div className="col-md-6">
                                                    <div className="text-muted small">Tanggal Aksi</div>
                                                    <div className="fw-semibold">{formatDateTime(data.tanggal_action)}</div>
                                                </div>
                                            )}
                                            {data.catatan && (
                                                <div className="col-12">
                                                    <div className="text-muted small">Catatan</div>
                                                    <div className="p-2 rounded" style={{ backgroundColor: 'var(--tblr-card-bg, #f8f9fa)' }}>{data.catatan}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Item Sampel */}
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h3 className="card-title">Item Sampel ({data.items?.length || 0})</h3>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-vcenter card-table">
                                            <thead>
                                                <tr>
                                                    <th>No</th>
                                                    <th>Parameter</th>
                                                    <th>Kategori</th>
                                                    <th className="text-center">Qty</th>
                                                    <th className="text-end">Harga Satuan</th>
                                                    <th className="text-end">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(data.items || []).map((item, index) => (
                                                    <tr key={item.id || index}>
                                                        <td className="text-muted">{index + 1}</td>
                                                        <td><span className="fw-bold text-dark">{item.sampel?.parameter || '-'}</span></td>
                                                        <td><span className="badge bg-info">{item.sampel?.category?.name || '-'}</span></td>
                                                        <td className="text-center"><span className="badge bg-primary">{item.qty}</span></td>
                                                        <td className="text-end text-muted">{formatCurrency(item.sampel?.price_sell || 0)}</td>
                                                        <td className="text-end fw-bold">{formatCurrency(item.price || 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="5" className="text-end fw-bold" style={{ fontSize: '1.1rem' }}>Grand Total</td>
                                                    <td className="text-end"><span className="fw-bold text-primary" style={{ fontSize: '1.2rem' }}>{formatCurrency(grandTotal)}</span></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-4">
                                {/* Status & Aksi */}
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h3 className="card-title">Status & Aksi</h3>
                                    </div>
                                    <div className="card-body text-center">
                                        <div className="mb-3">
                                            <div className="text-muted small mb-2">Status Saat Ini</div>
                                            {getStatusBadge(data.status)}
                                        </div>

                                        {data.tanggal_action && (
                                            <div className="mb-3">
                                                <div className="text-muted small">Tanggal Aksi</div>
                                                <div className="fw-semibold">{formatDateTime(data.tanggal_action)}</div>
                                            </div>
                                        )}

                                        <hr />

                                        {data.status === 'PENDING' && (
                                            <div className="d-grid gap-2">
                                                <button className="btn btn-success" onClick={handleApprove}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                                                    Setujui Pemohonan
                                                </button>
                                                <button className="btn btn-outline-danger" onClick={handleCancel}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M5.7 5.7l12.6 12.6" /></svg>
                                                    Batalkan
                                                </button>
                                            </div>
                                        )}

                                        {data.status === 'APPROVED' && (
                                            <div>
                                                {approveResult && (
                                                    <div className="mb-3">
                                                        <div className="row g-2">
                                                            <div className="col-6">
                                                                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(32, 107, 196, 0.1)' }}>
                                                                    <div className="fs-3 fw-bold text-primary">{approveResult.orders?.length || 0}</div>
                                                                    <div className="text-muted small">Order</div>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="p-2 rounded" style={{ backgroundColor: 'rgba(47, 179, 68, 0.1)' }}>
                                                                    <div className="fs-3 fw-bold text-success">{approveResult.hasils?.length || 0}</div>
                                                                    <div className="text-muted small">Hasil</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="text-muted small">Pemohonan telah disetujui</div>
                                                <Link to="/hasil" className="btn btn-sm btn-outline-success mt-2">
                                                    Lihat Hasil
                                                </Link>
                                            </div>
                                        )}

                                        {data.status === 'CANCELLED' && (
                                            <div className="text-muted small">Pemohonan telah dibatalkan</div>
                                        )}

                                        {data.status === 'EXPIRED' && (
                                            <div className="text-muted small">Pemohonan telah kadaluarsa</div>
                                        )}
                                    </div>
                                </div>

                                {/* Ringkasan */}
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Ringkasan</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Jenis</span>
                                            <span>{data.jenis === 'PEMESANAN' ? 'Pemesanan' : 'Surat Penawaran'}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Jumlah Item</span>
                                            <span className="fw-semibold">{data.items?.length || 0}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Total Qty</span>
                                            <span className="fw-semibold">{(data.items || []).reduce((sum, item) => sum + (item.qty || 0), 0)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-bold">Grand Total</span>
                                            <span className="fw-bold text-primary fs-4">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showSurat && (
                <SuratPenawaran data={data} onClose={() => setShowSurat(false)} />
            )}
        </LayoutAdmin>
    );
}
