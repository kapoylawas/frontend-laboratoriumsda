import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Swal from 'sweetalert2';
import LayoutAdmin from '../../layouts/admin';
import SuratPenawaran from '../pengajuan/suratPenawaran';
import {
    IconFileText, IconArrowLeft, IconCheck, IconClock, IconClockX,
    IconBan, IconPackage, IconInfoCircle, IconSquareCheck, IconPrinter,
    IconFileInvoice, IconFlask
} from '@tabler/icons-react';

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
                fetchDetail();
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menyetujui pemohonan' });
            }
        }
    };

    const handleCancel = async () => {
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
                await Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Pemohonan telah dibatalkan', toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
                fetchDetail();
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal membatalkan pemohonan' });
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            PENDING: { bg: '#fef08a', color: '#854d0e', icon: <IconClock size={16} className="me-1" />, label: 'Menunggu' },
            APPROVED: { bg: '#bbf7d0', color: '#166534', icon: <IconCheck size={16} className="me-1" />, label: 'Disetujui' },
            CANCELLED: { bg: '#e2e8f0', color: '#334155', icon: <IconBan size={16} className="me-1" />, label: 'Dibatalkan' },
            EXPIRED: { bg: '#fecdd3', color: '#9f1239', icon: <IconClockX size={16} className="me-1" />, label: 'Kadaluarsa' }
        };
        const s = statusMap[status] || { bg: '#e2e8f0', color: '#334155', icon: null, label: status };

        return (
            <span
                className="badge-3d px-3 py-1 d-inline-flex align-items-center"
                style={{ backgroundColor: s.bg, color: s.color }}
            >
                {s.icon}
                {s.label}
            </span>
        );
    };

    const getJenisBadge = (jenis) => {
        if (jenis === 'PEMESANAN') {
            return (
                <span
                    className="badge-3d px-3 py-1 d-inline-flex align-items-center"
                    style={{ backgroundColor: '#bfdbfe', color: '#1e40af' }}
                >
                    <IconPackage size={16} className="me-1" />
                    Pemesanan
                </span>
            );
        }
        return (
            <span
                className="badge-3d px-3 py-1 d-inline-flex align-items-center"
                style={{ backgroundColor: '#c084fc', color: '#ffffff' }}
            >
                <IconFileText size={16} className="me-1" />
                Surat Penawaran
            </span>
        );
    };

    const calcGrandTotal = (items) => {
        if (!items || items.length === 0) return 0;
        return items.reduce((sum, item) => sum + (item.price || 0), 0);
    };

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="container-xl py-5 text-center">
                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                    <div className="mt-3 text-muted fw-bold">Memuat detail pemohonan...</div>
                </div>
            </LayoutAdmin>
        );
    }

    if (!data) return null;

    const grandTotal = calcGrandTotal(data.items);

    return (
        <LayoutAdmin>
            {/* Custom 3D Styles */}
            <style>{`
                .card-3d {
                    background: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 5px 5px 0px #000000 !important;
                    border-radius: 16px !important;
                    transition: all 0.15s ease-in-out !important;
                }
                .badge-3d {
                    border: 2px solid #000000 !important;
                    box-shadow: 2px 2px 0px #000000 !important;
                    border-radius: 8px !important;
                    font-weight: 800 !important;
                }
                .btn-3d-primary {
                    background: #2563eb !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px 16px;
                    transition: all 0.15s ease-in-out !important;
                    text-decoration: none !important;
                    cursor: pointer;
                }
                .btn-3d-primary:hover {
                    background: #1d4ed8 !important;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .btn-3d-green {
                    background: #10b981 !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 8px 16px;
                    transition: all 0.15s ease-in-out !important;
                    cursor: pointer;
                }
                .btn-3d-green:hover {
                    background: #059669 !important;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .btn-3d-secondary {
                    background: #f1f5f9 !important;
                    color: #0f172a !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px 16px;
                    transition: all 0.15s ease-in-out !important;
                    text-decoration: none !important;
                    cursor: pointer;
                }
                .btn-3d-secondary:hover {
                    background: #e2e8f0 !important;
                    color: #000000 !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
                .btn-3d-danger {
                    background: #ef4444 !important;
                    color: #ffffff !important;
                    border: 2.5px solid #000000 !important;
                    box-shadow: 4px 4px 0px #000000 !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 8px 16px;
                    transition: all 0.15s ease-in-out !important;
                    cursor: pointer;
                }
                .btn-3d-danger:hover {
                    background: #dc2626 !important;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000 !important;
                }
            `}</style>

            <div className="container-xl py-4">
                {/* 3D Header Actions */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            {getJenisBadge(data.jenis)}
                            {getStatusBadge(data.status)}
                        </div>
                        <h2 className="fw-extrabold text-dark mb-0">Detail Penawaran Pemohon #{data.id}</h2>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn-3d-primary" onClick={() => setShowSurat(true)}>
                            <IconFileInvoice size={18} />
                            Preview Surat Resmi
                        </button>
                        <button className="btn-3d-secondary" onClick={() => navigate('/semua-penawaran')}>
                            <IconArrowLeft size={18} />
                            Kembali
                        </button>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        {/* 3D Card: Informasi Pemohonan */}
                        <div className="card-3d p-4 mb-4">
                            <h4 className="fw-extrabold text-primary mb-3 d-flex align-items-center gap-2">
                                <IconInfoCircle size={22} /> Informasi Detail Pengajuan
                            </h4>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="text-muted small fw-bold">ID Pemohonan</div>
                                    <div className="fw-black fs-4 text-dark">#{data.id}</div>
                                </div>
                                <div className="col-md-6">
                                    <div className="text-muted small fw-bold">Jenis Layanan</div>
                                    <div className="mt-1">{getJenisBadge(data.jenis)}</div>
                                </div>
                                <div className="col-md-6">
                                    <div className="text-muted small fw-bold">Nama Pemohon</div>
                                    <div className="fw-extrabold text-dark">{data.user?.name || '-'}</div>
                                </div>
                                <div className="col-md-6">
                                    <div className="text-muted small fw-bold">Email Instansi / User</div>
                                    <div className="fw-semibold">{data.user?.email || '-'}</div>
                                </div>
                                <div className="col-md-6">
                                    <div className="text-muted small fw-bold">No. Telepon / WhatsApp</div>
                                    <div className="fw-semibold">{data.user?.phone || '-'}</div>
                                </div>
                                <div className="col-md-6">
                                    <div className="text-muted small fw-bold">Tanggal Pengajuan</div>
                                    <div className="fw-semibold">{formatDate(data.tanggal_pengajuan)}</div>
                                </div>
                                {data.tanggal_expired && (
                                    <div className="col-md-6">
                                        <div className="text-muted small fw-bold">Masa Berlaku Penawaran</div>
                                        <div className="text-warning fw-extrabold">{formatDate(data.tanggal_expired)}</div>
                                    </div>
                                )}
                                {data.tanggal_action && (
                                    <div className="col-md-6">
                                        <div className="text-muted small fw-bold">Waktu Persetujuan</div>
                                        <div className="fw-semibold">{formatDateTime(data.tanggal_action)}</div>
                                    </div>
                                )}
                                {data.catatan && (
                                    <div className="col-12">
                                        <div className="text-muted small fw-bold">Catatan Pemohon</div>
                                        <div className="p-3 bg-light rounded-3" style={{ border: '2px solid #000' }}>
                                            {data.catatan}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3D Card: Item Sampel */}
                        <div className="card-3d p-4 mb-4">
                            <h4 className="fw-extrabold text-primary mb-3 d-flex align-items-center gap-2">
                                <IconFlask size={22} /> Rincian Item Sampel ({data.items?.length || 0})
                            </h4>
                            <div className="table-responsive rounded-3" style={{ border: '2.5px solid #000' }}>
                                <table className="table table-vcenter mb-0 align-middle">
                                    <thead className="bg-light" style={{ borderBottom: '2.5px solid #000' }}>
                                        <tr>
                                            <th className="text-center">No</th>
                                            <th>Parameter Pengujian</th>
                                            <th>Kategori</th>
                                            <th className="text-center">Qty</th>
                                            <th className="text-end">Harga Satuan</th>
                                            <th className="text-end pe-3">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data.items || []).map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td className="text-center fw-bold text-muted">{index + 1}</td>
                                                <td><span className="fw-extrabold text-dark">{item.sampel?.parameter || '-'}</span></td>
                                                <td><span className="badge-3d px-2 py-0 bg-info text-white" style={{ fontSize: '11px' }}>{item.sampel?.category?.name || '-'}</span></td>
                                                <td className="text-center"><span className="badge-3d px-2 py-1 bg-warning text-dark">{item.qty}</span></td>
                                                <td className="text-end text-muted">{formatCurrency(item.sampel?.price_sell || 0)}</td>
                                                <td className="text-end pe-3 fw-extrabold text-primary">{formatCurrency(item.price || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-light" style={{ borderTop: '2.5px solid #000' }}>
                                        <tr>
                                            <td colSpan="5" className="text-end fw-black fs-5">Grand Total Biaya</td>
                                            <td className="text-end pe-3"><span className="fw-black text-primary fs-4">{formatCurrency(grandTotal)}</span></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        {/* 3D Action Card */}
                        <div className="card-3d p-4 mb-4">
                            <h4 className="fw-extrabold text-dark mb-3">Tindakan Verifikasi Admin</h4>
                            {data.status === 'PENDING' ? (
                                <div className="d-flex flex-column gap-2">
                                    <button className="btn-3d-green w-100 py-2" onClick={handleApprove}>
                                        <IconSquareCheck size={20} /> Setujui Pemohonan (Approve)
                                    </button>
                                    <button className="btn-3d-danger w-100 py-2" onClick={handleCancel}>
                                        <IconBan size={20} /> Batalkan Pemohonan
                                    </button>
                                </div>
                            ) : data.status === 'APPROVED' ? (
                                <div className="p-3 bg-success-subtle text-success rounded-3 text-center" style={{ border: '2px solid #000' }}>
                                    <IconCheck size={32} className="mb-1" />
                                    <div className="fw-bold fs-6">Pemohonan Telah Disetujui</div>
                                    <small className="text-muted d-block mt-1">Order dan lembar hasil laboratorium telah otomatis di-generate.</small>
                                </div>
                            ) : (
                                <div className="p-3 bg-light text-muted rounded-3 text-center" style={{ border: '2px solid #000' }}>
                                    <div className="fw-bold fs-6">Status: {data.status}</div>
                                    <small className="d-block mt-1">Tidak ada tindakan lanjutan yang tersedia.</small>
                                </div>
                            )}
                        </div>

                        {/* Summary Box */}
                        <div className="card-3d p-4" style={{ backgroundColor: '#eff6ff' }}>
                            <div className="text-muted fw-bold fs-8 text-uppercase mb-1">Total Nilai Penawaran</div>
                            <div className="fs-2 fw-black text-primary mb-2">{formatCurrency(grandTotal)}</div>
                            <small className="text-muted d-block">
                                Meliputi {data.items?.length || 0} parameter pengujian sampel laboratorium UPTD Labkesda Sidoarjo.
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal / Preview Surat Penawaran */}
            {showSurat && (
                <SuratPenawaran data={data} onClose={() => setShowSurat(false)} />
            )}
        </LayoutAdmin>
    );
}
