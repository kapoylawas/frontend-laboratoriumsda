import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Pagination from '../../components/Pagination';
import LayoutAdmin from "../../layouts/admin";
import Swal from 'sweetalert2';

export default function SemuaPenawaran() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [keywords, setKeywords] = useState('');
    const [expandedRows, setExpandedRows] = useState({});

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const fetchData = async (pageNumber = 1, search = '') => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/pemohonan/all?page=${pageNumber}&search=${search}`);
                setData(response.data.data || []);
                if (response.data.pagination) {
                    setPagination({
                        current_page: response.data.pagination.page || response.data.pagination.currentPage || 1,
                        per_page: response.data.pagination.limit || response.data.pagination.perPage || 10,
                        total: response.data.pagination.total || 0,
                        last_page: response.data.pagination.totalPages || response.data.pagination.last_page || 1,
                    });
                } else if (response.data.current_page) {
                    setPagination(response.data);
                }
            } catch (error) {
                console.error('Error fetching pemohonan:', error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data pemohonan!' });
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData(1, keywords);
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleApprove = async (id) => {
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
                await Api.put(`/api/pemohonan/admin/${id}/approve`);
                Swal.fire('Berhasil!', 'Pemohonan telah disetujui.', 'success');
                fetchData(pagination.current_page || 1, keywords);
            } catch (error) {
                Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
            }
        }
    };

    const handleCancel = async (id) => {
        const result = await Swal.fire({
            title: 'Batalkan Pemohonan?',
            html: `
                <div class="text-start">
                    <p class="text-muted mb-2">Apakah Anda yakin ingin membatalkan pemohonan ini?</p>
                    <label for="alasan-cancel" class="form-label small fw-semibold">Alasan Pembatalan (opsional)</label>
                    <textarea id="alasan-cancel" class="form-control" rows="3" placeholder="Masukkan alasan pembatalan..."></textarea>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d63939',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Batalkan',
            cancelButtonText: 'Tidak',
            focusConfirm: false,
            preConfirm: () => {
                const alasan = document.getElementById('alasan-cancel')?.value || '';
                return { alasan };
            }
        });

        if (!result.isConfirmed) return;

        const { alasan } = result.value;
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const payload = {};
                if (alasan && alasan.trim()) {
                    payload.alasan = alasan.trim();
                }
                await Api.put(`/api/pemohonan/admin/${id}/cancel`, payload);
                Swal.fire('Berhasil!', 'Pemohonan telah dibatalkan.', 'success');
                fetchData(pagination.current_page || 1, keywords);
            } catch (error) {
                Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            PENDING: { class: 'bg-warning text-dark', icon: 'hourglass', label: 'Menunggu' },
            APPROVED: { class: 'bg-success', icon: 'circle-check', label: 'Disetujui' },
            CANCELLED: { class: 'bg-secondary', icon: 'ban', label: 'Dibatalkan' },
            EXPIRED: { class: 'bg-dark', icon: 'clock-x', label: 'Kadaluarsa' }
        };
        const s = statusMap[status] || { class: 'bg-secondary', icon: 'help', label: status };

        const iconPaths = {
            'hourglass': <><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.5 7h11" /><path d="M6.5 17h11" /><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" /></>,
            'circle-check': <><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></>,
            'ban': <><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M5.7 5.7l12.6 12.6" /></>,
            'clock-x': <><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20.926 13.151a9 9 0 1 0 -7.836 7.784" /><path d="M12 7v5l2 2" /><path d="M22 22l-5 -5" /><path d="M17 22l5 -5" /></>,
            'help': <><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 17l0 .01" /><path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" /></>
        };

        return (
            <span className={`badge ${s.class}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}>
                    {iconPaths[s.icon] || iconPaths['help']}
                </svg>
                {s.label}
            </span>
        );
    };

    const getJenisBadge = (jenis) => {
        if (jenis === 'PEMESANAN') {
            return (
                <span className="badge bg-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                        <path d="M12 12l8 -4.5" />
                        <path d="M12 12l0 9" />
                        <path d="M12 12l-8 -4.5" />
                    </svg>
                    Pemesanan
                </span>
            );
        }
        return (
            <span className="badge bg-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}>
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                    <path d="M9 9l1 0" />
                    <path d="M9 13l6 0" />
                    <path d="M9 17l6 0" />
                </svg>
                Surat Penawaran
            </span>
        );
    };

    const calcGrandTotal = (items) => {
        if (!items || items.length === 0) return 0;
        return items.reduce((sum, item) => sum + (item.price || 0), 0);
    };

    return (
        <LayoutAdmin>
        <div className="page-wrapper">
            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">Semua Penawaran</h2>
                            <div className="text-muted mt-1">Daftar semua penawaran dari seluruh pemohon</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="container-xl">
                    <div className="card">
                        <div className="card-header">
                            <div className="row g-2 align-items-center w-100">
                                <div className="col">
                                    <h3 className="card-title">Daftar Semua Pemohonan</h3>
                                </div>
                                <div className="col-auto">
                                    <form onSubmit={handleSearch}>
                                        <div className="input-icon">
                                            <span className="input-icon-addon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Cari pemohonan..."
                                                value={keywords}
                                                onChange={(e) => setKeywords(e.target.value)}
                                            />
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-vcenter card-table table-striped">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Jenis</th>
                                        <th>Pemohon</th>
                                        <th>Item</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Tanggal</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}></div>
                                                <p className="text-muted mb-0">Memuat data pemohonan...</p>
                                            </td>
                                        </tr>
                                    ) : data.length > 0 ? (
                                        data.map((item, index) => {
                                            const rowNumber = pagination.current_page
                                                ? (pagination.current_page - 1) * (pagination.per_page || 10) + index + 1
                                                : index + 1;
                                            const isExpanded = expandedRows[item.id];
                                            const grandTotal = calcGrandTotal(item.items);
                                            return (
                                                <>
                                                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => toggleRow(item.id)}>
                                                        <td className="text-muted fw-semibold">{rowNumber}</td>
                                                        <td>{getJenisBadge(item.jenis)}</td>
                                                        <td>
                                                            <div className="fw-semibold">{item.user?.name || '-'}</div>
                                                            <small className="text-muted">{item.user?.email || '-'}</small>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <span className="badge bg-primary me-1">{item.items?.length || 0} item</span>
                                                                {item.catatan && (
                                                                    <span className="text-muted small">- {item.catatan}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="fw-bold text-primary">{formatCurrency(grandTotal)}</td>
                                                        <td>{getStatusBadge(item.status)}</td>
                                                        <td className="text-muted small">
                                                            {item.tanggal_pengajuan ? (
                                                                <>
                                                                    <div>{new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                    <small>{new Date(item.tanggal_pengajuan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                                                                </>
                                                            ) : '-'}
                                                        </td>
                                                        <td>
                                                            <div className="btn-group" onClick={(e) => e.stopPropagation()}>
                                                                <Link to={`/semua-penawaran/${item.id}`} className="btn btn-sm btn-outline-primary" title="Detail">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg>
                                                                </Link>
                                                                {item.status === 'PENDING' && (
                                                                    <>
                                                                        <button className="btn btn-sm btn-success" onClick={() => handleApprove(item.id)} title="Setujui">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>
                                                                        </button>
                                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(item.id)} title="Batalkan">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M5.7 5.7l12.6 12.6" /></svg>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && item.items && item.items.length > 0 && (
                                                        <tr key={`${item.id}-detail`}>
                                                            <td colSpan="8" style={{ padding: 0 }}>
                                                                <div style={{ backgroundColor: 'var(--tblr-card-bg, #f8f9fa)', padding: '12px 20px' }}>
                                                                    <div className="row g-2">
                                                                        {item.items.map((subItem, subIdx) => (
                                                                            <div key={subItem.id || subIdx} className="col-md-6 col-lg-4">
                                                                                <div className="card card-sm" style={{ border: '1px solid var(--tblr-border-color, #e6e7e9)' }}>
                                                                                    <div className="card-body p-2">
                                                                                        <div className="d-flex justify-content-between align-items-start">
                                                                                            <div>
                                                                                                <div className="fw-bold text-dark">{subItem.sampel?.parameter || '-'}</div>
                                                                                                <span className="badge bg-info mt-1">{subItem.sampel?.category?.name || 'Tanpa Kategori'}</span>
                                                                                            </div>
                                                                                            <span className="badge bg-primary">x{subItem.qty}</span>
                                                                                        </div>
                                                                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                                                                            <small className="text-muted">{formatCurrency(subItem.sampel?.price_sell || 0)} / item</small>
                                                                                            <span className="fw-bold text-primary">{formatCurrency(subItem.price || 0)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {item.catatan && (
                                                                        <div className="mt-2">
                                                                            <small className="text-muted">Catatan: {item.catatan}</small>
                                                                        </div>
                                                                    )}
                                                                    {item.tanggal_expired && (
                                                                        <div className="mt-1">
                                                                            <small className="text-warning">Berlaku hingga: {new Date(item.tanggal_expired).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <div style={{ opacity: 0.4 }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                        <path d="M9 15v-2" />
                                                        <path d="M12 15v-4" />
                                                        <path d="M15 15v-2" />
                                                    </svg>
                                                    <p className="text-muted mb-0">Belum ada data pemohonan</p>
                                                    <small className="text-muted">Tidak ada data penawaran dari pemohon manapun</small>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination.last_page > 1 && (
                            <div className="card-footer d-flex align-items-center">
                                <Pagination pagination={pagination} fetchData={fetchData} keywords={keywords} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </LayoutAdmin>
    );
}