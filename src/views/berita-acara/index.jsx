import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import Api from '../../services/api';
import Pagination from '../../components/Pagination';
import LayoutAdmin from "../../layouts/admin";


export default function BeritaAcara() {
    const [beritaAcara, setBeritaAcara] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [keywords, setKeywords] = useState('');

    const fetchData = async (pageNumber = 1, search = '') => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (token) {
            Api.defaults.headers.common['Authorization'] = token;
            try {
                const queryParams = `page=${pageNumber}&search=${search}`;
                const response = await Api.get(`/api/berita-acara?${queryParams}`);
                setBeritaAcara(response.data.data);
                setPagination(response.data);
            } catch (error) {
                console.error('Error fetching berita acara:', error);
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

    const getStatusBadge = (status) => {
        const statusMap = {
            DRAFT: { class: 'bg-secondary', icon: '📝' },
            FINAL: { class: 'bg-success', icon: '✅' }
        };
        const s = statusMap[status] || { class: 'bg-secondary', icon: '❓' };
        return <span className={`badge ${s.class}`}>{s.icon} {status}</span>;
    };

    return (
        <LayoutAdmin>

            <div className="page-wrapper">
                <div className="page-header d-print-none">
                    <div className="container-xl">
                        <div className="row g-2 align-items-center">
                            <div className="col">
                                <h2 className="page-title">Berita Acara</h2>
                                <div className="text-muted mt-1">Laporan pengambilan sampel</div>
                            </div>
                            <div className="col-auto ms-auto d-print-none">
                                <div className="d-flex">
                                    <Link to="/berita-acara/create" className="btn btn-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                                        Buat Berita Acara
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-xl">
                        <div className="card">
                            <div className="card-header">
                                <div className="row g-2 align-items-center">
                                    <div className="col">
                                        <h3 className="card-title">Daftar Berita Acara</h3>
                                    </div>
                                    <div className="col-auto">
                                        <form onSubmit={handleSearch}>
                                            <div className="input-icon">
                                                <span className="input-icon-addon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Cari berita acara..."
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
                                            <th>No. Berita Acara</th>
                                            <th>Jadwal</th>
                                            <th>Tanggal</th>
                                            <th>Petugas</th>
                                            <th>Status</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
                                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                                    <span className="ms-2">Memuat data...</span>
                                                </td>
                                            </tr>
                                        ) : beritaAcara.length > 0 ? (
                                            beritaAcara.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>{(pagination.current_page - 1) * pagination.per_page + index + 1}</td>
                                                    <td className="fw-semibold">{item.no_berita_acara || `BA-${item.id}`}</td>
                                                    <td>{item.jadwal ? `JDL-${item.jadwal_id}` : '-'}</td>
                                                    <td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                                                    <td>{item.petugas?.name || '-'}</td>
                                                    <td>{getStatusBadge(item.status)}</td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <Link to={`/berita-acara/${item.id}`} className="btn btn-sm btn-outline-primary" title="Detail">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" /></svg>
                                                            </Link>
                                                            <Link to={`/berita-acara/${item.id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.097 2.097 0 0 0 -2.954 -2.954l-8.657 8.657a2 2 0 0 0 -.548 1.02l-.432 2.159l2.159 -.432a2 2 0 0 0 1.02 -.548z" /><path d="M15.536 7.464l2 2" /></svg>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4 text-muted">
                                                    Belum ada data berita acara
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
