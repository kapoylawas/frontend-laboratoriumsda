import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import LayoutAdmin from '../../layouts/admin';

export default function JadwalPengambilanHasil() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const formatDateShort = (dateStr) => {
        if (!dateStr) return { day: '-', month: '-', year: '-', weekday: '-' };
        const date = new Date(dateStr);
        return {
            day: date.toLocaleDateString('id-ID', { day: '2-digit' }),
            month: date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
            year: date.toLocaleDateString('id-ID', { year: 'numeric' }),
            weekday: date.toLocaleDateString('id-ID', { weekday: 'long' })
        };
    };

    const formatDateLong = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(value || 0);
    };

    useEffect(() => {
        fetchJadwal();
    }, []);

    const fetchJadwal = async () => {
        setIsLoading(true);
        const token = Cookies.get('token');
        const userCookie = Cookies.get('user');

        if (token && userCookie) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get('/api/jadwal-pengambilan/user');
                setData(response.data.data || []);
            } catch (error) {
                console.error('Gagal memuat jadwal pengambilan:', error);
            }
        }
        setIsLoading(false);
    };

    // Group by invoice
    const groupByInvoice = (list) => {
        const groups = {};
        list.forEach((jadwal) => {
            const invoice = jadwal?.transaction_detail?.transaction?.invoice || 'UNKNOWN';
            if (!groups[invoice]) {
                groups[invoice] = {
                    invoice,
                    transaction: jadwal?.transaction_detail?.transaction || {},
                    user: jadwal?.transaction_detail?.transaction?.user || {},
                    items: []
                };
            }
            groups[invoice].items.push(jadwal);
        });
        return Object.values(groups);
    };

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="page-wrapper">
                    <div className="page-body">
                        <div className="container-xl">
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                <div className="mt-3 text-muted">Memuat jadwal pengambilan...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    const grouped = groupByInvoice(data);

    return (
        <LayoutAdmin>
            <style>{`
                .page-title-wrap {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 20px;
                    border-radius: 24px;
                    text-align: center;
                    margin-bottom: 32px;
                    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
                }
                .invoice-group {
                    background: white;
                    border-radius: 24px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                    margin-bottom: 32px;
                    border: 1px solid #e2e8f0;
                }
                .invoice-header {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    color: white;
                    padding: 28px 32px;
                    position: relative;
                    overflow: hidden;
                }
                .invoice-header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -10%;
                    width: 300px;
                    height: 300px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                }
                .invoice-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    opacity: 0.7;
                    margin-bottom: 6px;
                }
                .invoice-number {
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    font-family: 'Courier New', monospace;
                }
                .invoice-summary-box {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.15);
                    padding: 14px 18px;
                    border-radius: 14px;
                }
                .pemohon-strip {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    padding: 20px 32px;
                    border-bottom: 1px solid #f3e8c2;
                }
                .pemohon-avatar-small {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
                    flex-shrink: 0;
                }
                .items-body {
                    padding: 24px 32px 32px 32px;
                    background: #f8fafc;
                }
                .section-heading {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #475569;
                    font-weight: 700;
                    font-size: 0.95rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 16px;
                }
                .section-heading-count {
                    background: #667eea;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 50px;
                    font-size: 0.75rem;
                }
                .sample-item {
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 14px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.25s;
                    display: flex;
                    gap: 18px;
                    align-items: stretch;
                }
                .sample-item:hover {
                    border-color: #667eea;
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.1);
                    transform: translateX(3px);
                }
                .date-card-mini {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 14px;
                    border-radius: 12px;
                    text-align: center;
                    min-width: 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    flex-shrink: 0;
                }
                .date-card-mini .month {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 1px;
                    opacity: 0.9;
                }
                .date-card-mini .day {
                    font-size: 1.75rem;
                    font-weight: 800;
                    line-height: 1;
                    margin: 2px 0;
                }
                .date-card-mini .year {
                    font-size: 0.65rem;
                    opacity: 0.8;
                }
                .sample-main {
                    flex-grow: 1;
                    min-width: 0;
                }
                .sample-parameter {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 4px;
                }
                .sample-category {
                    display: inline-block;
                    background: #dbeafe;
                    color: #1e40af;
                    padding: 3px 10px;
                    border-radius: 50px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                .meta-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 14px;
                    color: #64748b;
                    font-size: 0.85rem;
                    margin-bottom: 8px;
                }
                .meta-row .meta-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .meta-row strong {
                    color: #1e293b;
                    font-weight: 600;
                }
                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 50px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .status-pill-success {
                    background: #d1fae5;
                    color: #065f46;
                }
                .status-pill-danger {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .status-pill-warning {
                    background: #fef3c7;
                    color: #92400e;
                }
                .sample-price {
                    text-align: right;
                    min-width: 110px;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    border-left: 1px dashed #cbd5e1;
                    padding-left: 18px;
                }
                .sample-price .label {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }
                .sample-price .price {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #059669;
                }
                .sample-price .qty {
                    font-size: 0.8rem;
                    color: #64748b;
                }
                .hasil-mini {
                    margin-top: 10px;
                    padding: 10px 14px;
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    border-left: 3px solid #10b981;
                    border-radius: 8px;
                    font-size: 0.85rem;
                }
                .hasil-mini .label {
                    font-weight: 700;
                    color: #065f46;
                }
                .catatan-inline {
                    margin-top: 8px;
                    padding: 8px 12px;
                    background: #fef3c7;
                    border-left: 3px solid #f59e0b;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    color: #78350f;
                }
                .total-footer {
                    margin-top: 18px;
                    padding: 16px 20px;
                    background: white;
                    border-radius: 14px;
                    border: 2px dashed #cbd5e1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                @media (max-width: 576px) {
                    .sample-item { flex-direction: column; }
                    .sample-price { border-left: none; border-top: 1px dashed #cbd5e1; padding-left: 0; padding-top: 12px; text-align: left; }
                }
            `}</style>

            <div className="page-wrapper">
                <div className="page-body">
                    <div className="container-xl">
                        {/* Page Header */}
                        <div className="row justify-content-center">
                            <div className="col-12 col-lg-10 col-xl-9">
                                <div className="page-title-wrap">
                                    <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{
                                        width: '72px', height: '72px',
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '20px',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <rect x="4" y="5" width="16" height="16" rx="2" />
                                            <line x1="16" y1="3" x2="16" y2="7" />
                                            <line x1="8" y1="3" x2="8" y2="7" />
                                            <line x1="4" y1="11" x2="20" y2="11" />
                                            <line x1="11" y1="15" x2="12" y2="15" />
                                            <line x1="12" y1="15" x2="12" y2="18" />
                                        </svg>
                                    </div>
                                    <h1 className="mb-2 text-white" style={{ fontSize: '2rem', fontWeight: 700 }}>
                                        Jadwal Pengambilan Hasil
                                    </h1>
                                    <div style={{ opacity: 0.9, fontSize: '1.05rem' }}>
                                        Dikelompokkan berdasarkan nomor invoice
                                    </div>
                                </div>
                            </div>
                        </div>

                        {grouped.length === 0 ? (
                            <div className="row justify-content-center">
                                <div className="col-md-8 col-lg-6">
                                    <div className="card" style={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                                        <div className="card-body text-center py-5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon mb-3 text-muted" width="64" height="64" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <rect x="4" y="5" width="16" height="16" rx="2" />
                                                <line x1="16" y1="3" x2="16" y2="7" />
                                                <line x1="8" y1="3" x2="8" y2="7" />
                                                <line x1="4" y1="11" x2="20" y2="11" />
                                            </svg>
                                            <h3 className="mb-2">Belum Ada Jadwal Pengambilan</h3>
                                            <p className="text-muted mb-0">Jadwal pengambilan hasil akan ditampilkan di sini setelah permohonan Anda dijadwalkan.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="row justify-content-center">
                                <div className="col-12 col-lg-10 col-xl-9">
                                    {grouped.map((group) => {
                                        const initial = (group.user.name || 'U').charAt(0).toUpperCase();
                                        const totalQty = group.items.reduce((acc, j) => acc + (j?.transaction_detail?.qty || 0), 0);

                                        return (
                                            <div className="invoice-group" key={group.invoice}>
                                                {/* Invoice Header */}
                                                <div className="invoice-header">
                                                    <div className="row align-items-center g-3" style={{ position: 'relative', zIndex: 2 }}>
                                                        <div className="col-md-6">
                                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                                    <line x1="9" y1="9" x2="10" y2="9" />
                                                                    <line x1="9" y1="13" x2="15" y2="13" />
                                                                    <line x1="9" y1="17" x2="15" y2="17" />
                                                                </svg>
                                                                <span className="invoice-label mb-0">Nomor Invoice</span>
                                                            </div>
                                                            <div className="invoice-number">{group.invoice}</div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="invoice-summary-box text-center">
                                                                <div className="invoice-label">Total Sampel</div>
                                                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                                                                    {group.items.length} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>({totalQty} qty)</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="invoice-summary-box text-center">
                                                                <div className="invoice-label">Grand Total</div>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#86efac' }}>
                                                                    {formatCurrency(group.transaction.grand_total)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pemohon Strip */}
                                                <div className="pemohon-strip">
                                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                                        <div className="pemohon-avatar-small">{initial}</div>
                                                        <div className="flex-grow-1">
                                                            <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pemohon</div>
                                                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>{group.user.name || '-'}</div>
                                                            <div className="d-flex gap-3 flex-wrap mt-1" style={{ fontSize: '0.85rem', color: '#78350f' }}>
                                                                <span>
                                                                    <strong>NIK:</strong> {group.user.nik || '-'}
                                                                </span>
                                                                <span>
                                                                    <strong>Telp:</strong> {group.user.phone || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Items */}
                                                <div className="items-body">
                                                    <div className="section-heading">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                            <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                                            <path d="M8 4h8l3 5l-6.5 7.5a1 1 0 0 1 -1.4 0l-6.1 -7.5l3 -5" />
                                                            <path d="M8 4l3 5h-8" />
                                                            <path d="M16 4l-3 5h8" />
                                                        </svg>
                                                        Daftar Sampel & Jadwal Pengambilan
                                                        <span className="section-heading-count">{group.items.length}</span>
                                                    </div>

                                                    {group.items.map((jadwal) => {
                                                        const detail = jadwal.transaction_detail || {};
                                                        const sampel = detail?.sampel || {};
                                                        const category = sampel?.category || {};
                                                        const hasilList = sampel?.hasil || [];
                                                        const dateShort = formatDateShort(jadwal.tanggal_pengambilan);

                                                        return (
                                                            <div className="sample-item" key={jadwal.id}>
                                                                {/* Date card */}
                                                                <div className="date-card-mini">
                                                                    <div className="month">{dateShort.month}</div>
                                                                    <div className="day">{dateShort.day}</div>
                                                                    <div className="year">{dateShort.year}</div>
                                                                </div>

                                                                {/* Main content */}
                                                                <div className="sample-main">
                                                                    <div className="sample-parameter">{sampel.parameter || '-'}</div>
                                                                    <div className="sample-category">{category.name || '-'}</div>

                                                                    <div className="meta-row">
                                                                        <span className="meta-item" title={formatDateLong(jadwal.tanggal_pengambilan)}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                                                <circle cx="12" cy="12" r="9" />
                                                                                <polyline points="12 7 12 12 15 15" />
                                                                            </svg>
                                                                            <strong>{jadwal.jam_pengambilan}</strong> WIB
                                                                        </span>
                                                                        <span className="meta-item">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                                                <circle cx="12" cy="11" r="3" />
                                                                                <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
                                                                            </svg>
                                                                            {jadwal.lokasi || '-'}
                                                                        </span>
                                                                        <span className="meta-item">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                                                <circle cx="12" cy="7" r="4" />
                                                                                <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                                                                            </svg>
                                                                            <strong>{jadwal.petugas || '-'}</strong>
                                                                        </span>
                                                                    </div>

                                                                    <div className="d-flex gap-2 flex-wrap">
                                                                        {detail.status_bayar ? (
                                                                            <span className="status-pill status-pill-success">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                                                    <path d="M5 12l5 5l10 -10" />
                                                                                </svg>
                                                                                Lunas
                                                                            </span>
                                                                        ) : (
                                                                            <span className="status-pill status-pill-danger">Belum Lunas</span>
                                                                        )}
                                                                        {hasilList.length > 0 ? (
                                                                            <span className="status-pill status-pill-success">Hasil Tersedia</span>
                                                                        ) : (
                                                                            <span className="status-pill status-pill-warning">Menunggu Hasil</span>
                                                                        )}
                                                                    </div>

                                                                    {jadwal.catatan && (
                                                                        <div className="catatan-inline">
                                                                            <strong>📝 Catatan:</strong> {jadwal.catatan}
                                                                        </div>
                                                                    )}

                                                                    {hasilList.map((hasil) => (
                                                                        <div className="hasil-mini" key={hasil.id}>
                                                                            <span className="label">✓ Hasil:</span> <strong>{hasil.hasil}</strong>
                                                                            {hasil.metode && <span style={{ color: '#065f46' }}> • Metode: {hasil.metode}</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Price */}
                                                                <div className="sample-price">
                                                                    <div className="label">Harga</div>
                                                                    <div className="price">{formatCurrency(detail.price)}</div>
                                                                    <div className="qty">Qty: {detail.qty || 0}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Footer */}
                                                    <div className="total-footer">
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pembayaran</div>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
                                                                {formatCurrency(group.transaction.grand_total)}
                                                            </div>
                                                        </div>
                                                        <div className="text-end">
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tunai / Kembalian</div>
                                                            <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600 }}>
                                                                {formatCurrency(group.transaction.cash)} / {formatCurrency(group.transaction.change)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </LayoutAdmin>
    );
}
