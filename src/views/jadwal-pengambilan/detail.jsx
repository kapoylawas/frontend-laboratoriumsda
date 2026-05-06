import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import LayoutAdmin from '../../layouts/admin';

export default function JadwalPengambilanDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            minimumFractionDigits: 0 
        }).format(value || 0);
    };

    useEffect(() => {
        fetchJadwal();
    }, [id]);

    const fetchJadwal = async () => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const response = await Api.get(`/api/jadwal-pengambilan/${id}`);
                setData(response.data.data);
            } catch (error) {
                console.error('Gagal memuat jadwal pengambilan:', error);
                navigate('/jadwal-pengambilan');
            }
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <LayoutAdmin>
                <div className="page-wrapper">
                    <div className="page-body">
                        <div className="container-xl">
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                <div className="mt-3 text-muted">Memuat detail jadwal...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    if (!data) {
        return (
            <LayoutAdmin>
                <div className="page-wrapper">
                    <div className="page-body">
                        <div className="container-xl">
                            <div className="text-center py-5 text-muted">
                                <h4>Tidak ada data jadwal pengambilan</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAdmin>
        );
    }

    const { transaction_detail: detail } = data;
    const sampel = detail?.sampel || {};
    const transaction = detail?.transaction || {};
    const user = transaction?.user || {};
    const category = sampel?.category || {};
    const hasilList = sampel?.hasil || [];

    return (
        <LayoutAdmin>
            <div className="page-wrapper">
                <div className="page-header d-print-none">
                    <div className="container-xl">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <h2 className="page-title">Detail Jadwal Pengambilan #{data.id}</h2>
                            </div>
                            <div className="col-auto">
                                <button className="btn btn-secondary" onClick={() => navigate('/jadwal-pengambilan')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M5 12l14 0" />
                                        <path d="M5 12l6 6" />
                                        <path d="M5 12l6 -6" />
                                    </svg>
                                    Kembali
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-xl">
                        <div className="row row-cards">
                            {/* Informasi Jadwal */}
                            <div className="col-lg-6">
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <rect x="4" y="5" width="16" height="16" rx="2" />
                                                <line x1="16" y1="3" x2="16" y2="7" />
                                                <line x1="8" y1="3" x2="8" y2="7" />
                                                <line x1="4" y1="11" x2="20" y2="11" />
                                                <line x1="11" y1="15" x2="12" y2="15" />
                                                <line x1="12" y1="15" x2="12" y2="18" />
                                            </svg>
                                            Jadwal Pengambilan
                                        </h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <div className="text-muted small">Tanggal Pengambilan</div>
                                                <div className="fw-bold fs-4 text-primary">{formatDate(data.tanggal_pengambilan)}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Jam Pengambilan</div>
                                                <div className="fw-semibold fs-5">{data.jam_pengambilan || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Lokasi</div>
                                                <div className="fw-semibold">{data.lokasi || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Petugas</div>
                                                <div>{data.petugas || '-'}</div>
                                            </div>
                                            {data.catatan && (
                                                <div className="col-12">
                                                    <div className="text-muted small">Catatan</div>
                                                    <div className="p-2 rounded" style={{ backgroundColor: 'var(--tblr-card-bg, #f8f9fa)' }}>{data.catatan}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Informasi Pemohon */}
                            <div className="col-lg-6">
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <circle cx="12" cy="7" r="4" />
                                                <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                                            </svg>
                                            Informasi Pemohon
                                        </h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="text-muted small">Nama Pemohon</div>
                                                <div className="fw-semibold">{user.name || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">NIK</div>
                                                <div>{user.nik || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Telepon</div>
                                                <div>{user.phone || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="text-muted small">Invoice</div>
                                                <div className="fw-semibold">{transaction.invoice || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Sampel */}
                            <div className="col-12">
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M19.5 15.5v-5l-6 -5.5l-6 5.5v5l6 3z" />
                                                <path d="M13.5 5.5v5.5" />
                                                <path d="M7.5 10.5l6 3l6 -3" />
                                            </svg>
                                            Detail Sampel
                                        </h3>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-vcenter card-table">
                                            <thead>
                                                <tr>
                                                    <th>No</th>
                                                    <th>Parameter</th>
                                                    <th>Kategori</th>
                                                    <th className="text-center">Qty</th>
                                                    <th className="text-end">Harga</th>
                                                    <th className="text-center">Status Bayar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>1</td>
                                                    <td><span className="fw-bold">{sampel.parameter || '-'}</span></td>
                                                    <td><span className="badge bg-info">{category.name || '-'}</span></td>
                                                    <td className="text-center"><span className="badge bg-primary">{detail.qty}</span></td>
                                                    <td className="text-end fw-semibold">{formatCurrency(detail.price)}</td>
                                                    <td className="text-center">
                                                        {detail.status_bayar ? (
                                                            <span className="badge bg-success">Lunas</span>
                                                        ) : (
                                                            <span className="badge bg-danger">Belum Lunas</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Hasil Pemeriksaan */}
                            {hasilList.length > 0 && (
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                    <line x1="9" y1="9" x2="10" y2="9" />
                                                    <line x1="14" y1="9" x2="15" y2="9" />
                                                    <line x1="9" y1="13" x2="10" y2="13" />
                                                    <line x1="14" y1="13" x2="15" y2="13" />
                                                </svg>
                                                Hasil Pemeriksaan
                                            </h3>
                                        </div>
                                        <div className="table-responsive">
                                            <table className="table table-vcenter card-table">
                                                <thead>
                                                    <tr>
                                                        <th>No</th>
                                                        <th>Hasil</th>
                                                        <th>Metode</th>
                                                        <th className="text-center">Status</th>
                                                        <th>Tanggal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {hasilList.map((hasil, index) => (
                                                        <tr key={hasil.id}>
                                                            <td>{index + 1}</td>
                                                            <td><span className="fw-bold">{hasil.hasil || '-'}</span></td>
                                                            <td>{hasil.metode || '-'}</td>
                                                            <td className="text-center">
                                                                {hasil.status ? (
                                                                    <span className="badge bg-success">Selesai</span>
                                                                ) : (
                                                                    <span className="badge bg-warning text-dark">Proses</span>
                                                                )}
                                                            </td>
                                                            <td>{formatDate(hasil.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </LayoutAdmin>
    );
}
