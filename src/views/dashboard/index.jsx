import LayoutAdmin from '../../layouts/admin'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import Cookies from "js-cookie";

// Data statistik (contoh) untuk admin
const statsData = [
    { name: 'Jan', Pendapatan: 4000, Pengguna: 2400 },
    { name: 'Feb', Pendapatan: 3000, Pengguna: 1398 },
    { name: 'Mar', Pendapatan: 2000, Pengguna: 9800 },
    { name: 'Apr', Pendapatan: 2780, Pengguna: 3908 },
    { name: 'Mei', Pendapatan: 1890, Pengguna: 4800 },
    { name: 'Jun', Pendapatan: 2390, Pengguna: 3800 },
];

const pieData = [
    { name: 'Produk A', value: 400 },
    { name: 'Produk B', value: 300 },
    { name: 'Produk C', value: 300 },
    { name: 'Produk D', value: 200 },
];

const COLORS = ['#1e40af', '#059669', '#d97706', '#dc2626'];

// Data untuk dashboard pemohon
const pemohonData = [
    { name: 'Jan', Pengajuan: 4, Disetujui: 3 },
    { name: 'Feb', Pengajuan: 3, Disetujui: 2 },
    { name: 'Mar', Pengajuan: 6, Disetujui: 5 },
    { name: 'Apr', Pengajuan: 2, Disetujui: 1 },
    { name: 'Mei', Pengajuan: 5, Disetujui: 4 },
    { name: 'Jun', Pengajuan: 3, Disetujui: 3 },
];

const statusData = [
    { name: 'Disetujui', value: 18, color: '#059669' },
    { name: 'Pending', value: 5, color: '#d97706' },
    { name: 'Ditolak', value: 2, color: '#dc2626' },
];

// Data riwayat pengajuan terbaru
const riwayatData = [
    { id: 1, jenis: 'Izin Usaha', tanggal: '2023-10-01', status: 'Disetujui', statusColor: 'success' },
    { id: 2, jenis: 'Izin Mendirikan Bangunan', tanggal: '2023-09-28', status: 'Pending', statusColor: 'warning' },
    { id: 3, jenis: 'Izin Gangguan', tanggal: '2023-09-25', status: 'Disetujui', statusColor: 'success' },
    { id: 4, jenis: 'Izin Reklame', tanggal: '2023-09-20', status: 'Ditolak', statusColor: 'danger' },
    { id: 5, jenis: 'Izin Lingkungan', tanggal: '2023-09-15', status: 'Disetujui', statusColor: 'success' },
];

export default function Dashboard() {
    const userCookie = Cookies.get("user");
    const user = userCookie ? JSON.parse(userCookie) : null;
    const isAdmin = user && user.role_id === 2;

    // Dashboard untuk Admin (role_id = 2)
    const renderAdminDashboard = () => {
        return (
            <>
                <h2 className="mb-4 text-gray-800">Dashboard Admin</h2>

                {/* Statistik Ringkas */}
                <div className="row mb-4">
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-primary shadow-sm h-100 py-2">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Pendapatan
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold text-gray-900">Rp 15.250.000</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-calendar fa-2x text-gray-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-success shadow-sm h-100 py-2">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Pengguna Baru
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold text-gray-900">125</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-user-plus fa-2x text-gray-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-info shadow-sm h-100 py-2">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Pesanan Baru
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold text-gray-900">18</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-shopping-cart fa-2x text-gray-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-warning shadow-sm h-100 py-2">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Perlu Tindakan
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold text-gray-900">5</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-exclamation-circle fa-2x text-gray-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grafik dan Chart */}
                <div className="row mb-4">
                    {/* Grafik Pendapatan */}
                    <div className="col-xl-8 col-lg-7">
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 className="m-0 font-weight-bold text-gray-800">Grafik Pendapatan & Pengguna</h6>
                            </div>
                            <div className="card-body">
                                <div className="chart-area" style={{ height: '320px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="name" stroke="#374151" />
                                            <YAxis stroke="#374151" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1f2937',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: '#f9fafb'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="Pendapatan" fill="#1e40af" name="Pendapatan (Rp)" />
                                            <Bar dataKey="Pengguna" fill="#059669" name="Jumlah Pengguna" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Produk */}
                    <div className="col-xl-4 col-lg-5">
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 className="m-0 font-weight-bold text-gray-800">Distribusi Produk</h6>
                            </div>
                            <div className="card-body">
                                <div className="chart-pie pt-4 pb-2" style={{ height: '320px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 text-center small">
                                    {pieData.map((entry, index) => (
                                        <span key={index} className="mr-3">
                                            <i className="fas fa-circle" style={{ color: COLORS[index % COLORS.length] }}></i> {entry.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Aktivitas Terbaru */}
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                        <h6 className="m-0 font-weight-bold text-gray-800">Aktivitas Terbaru</h6>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-bordered" width="100%" cellSpacing="0">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-gray-700">Nama Pengguna</th>
                                        <th className="text-gray-700">Aktivitas</th>
                                        <th className="text-gray-700">Waktu</th>
                                        <th className="text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="text-gray-900">Tiger Nixon</td>
                                        <td className="text-gray-900">Pembelian Produk A</td>
                                        <td className="text-gray-900">2023-10-01 12:30:45</td>
                                        <td><span className="badge badge-success text-white">Selesai</span></td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-900">Garrett Winters</td>
                                        <td className="text-gray-900">Registrasi Akun</td>
                                        <td className="text-gray-900">2023-10-01 11:25:30</td>
                                        <td><span className="badge badge-info text-white">Baru</span></td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-900">Ashton Cox</td>
                                        <td className="text-gray-900">Pengajuan Return</td>
                                        <td className="text-gray-900">2023-10-01 10:15:22</td>
                                        <td><span className="badge badge-warning text-white">Pending</span></td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-900">Cedric Kelly</td>
                                        <td className="text-gray-900">Pembayaran Invoice</td>
                                        <td className="text-gray-900">2023-10-01 09:45:10</td>
                                        <td><span className="badge badge-success text-white">Lunas</span></td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-900">Airi Satou</td>
                                        <td className="text-gray-900">Update Profil</td>
                                        <td className="text-gray-900">2023-10-01 08:30:05</td>
                                        <td><span className="badge badge-secondary text-white">Update</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // Dashboard untuk Pemohon (role_id bukan 2) - VERSI BARU YANG LEBIH BAIK
    const renderPemohonDashboard = () => {
        return (
            <>
                {/* Header Welcome */}
                <div className="welcome-section mb-4">
                    <div className="row align-items-center">
                        <div className="col">
                            <h1 className="h3 mb-2 text-white">Selamat Datang, {user?.name || 'User'}! 👋</h1>
                            <p className="text-white-80">Berikut adalah ringkasan pengajuan perizinan Anda</p>
                        </div>
                        <div className="col-auto">
                            <div className="bg-white-20 text-white rounded-pill px-4 py-2">
                                <small className="fw-bold">PEMOHON</small>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <LayoutAdmin>
            <div className="container-fluid py-4">
                {isAdmin ? renderAdminDashboard() : renderPemohonDashboard()}
            </div>

            <style jsx>{`
                .welcome-section {
                    background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
                    color: white;
                    padding: 2rem;
                    border-radius: 1rem;
                    margin-bottom: 2rem;
                }
                
                .text-white-80 {
                    color: rgba(255, 255, 255, 0.9) !important;
                }
                
                .text-white-60 {
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                
                .bg-white-20 {
                    background: rgba(255, 255, 255, 0.2) !important;
                }
                
                .stat-card {
                    transition: transform 0.2s ease-in-out;
                    height: 100%;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                }
                
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
                }
                
                .bg-gradient-success {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                }
                
                .bg-gradient-warning {
                    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                }
                
                .bg-gradient-danger {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                }
                
                .rounded-lg {
                    border-radius: 1rem !important;
                }
                
                .stat-icon {
                    opacity: 0.8;
                }
                
                .table-hover tbody tr:hover {
                    background-color: #f8fafc;
                }
                
                .border-0 {
                    border: none !important;
                }
                
                .shadow-sm {
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
                }

                .card {
                    border: none;
                    border-radius: 0.5rem;
                }
                
                .border-left-primary {
                    border-left: 0.25rem solid #1e40af !important;
                }
                
                .border-left-success {
                    border-left: 0.25rem solid #059669 !important;
                }
                
                .border-left-info {
                    border-left: 0.25rem solid #0891b2 !important;
                }
                
                .border-left-warning {
                    border-left: 0.25rem solid #d97706 !important;
                }
                
                .border-left-danger {
                    border-left: 0.25rem solid #dc2626 !important;
                }
                
                .text-xs {
                    font-size: 0.7rem;
                }
                
                .badge {
                    padding: 0.35em 0.5em;
                    font-size: 75%;
                    font-weight: 700;
                    line-height: 1;
                    text-align: center;
                    white-space: nowrap;
                    border-radius: 0.35rem;
                }
                
                .badge-success {
                    color: #fff !important;
                    background-color: #059669;
                }
                
                .badge-info {
                    color: #fff !important;
                    background-color: #0891b2;
                }
                
                .badge-warning {
                    color: #fff !important;
                    background-color: #d97706;
                }
                
                .badge-danger {
                    color: #fff !important;
                    background-color: #dc2626;
                }
                
                .badge-secondary {
                    color: #fff !important;
                    background-color: #6b7280;
                }

                /* Additional styles for the new design */
                .bg-green-100 {
                    background-color: #dcfce7 !important;
                }
                
                .bg-yellow-100 {
                    background-color: #fef3c7 !important;
                }
                
                .bg-red-100 {
                    background-color: #fee2e2 !important;
                }
                
                .text-green-800 {
                    color: #166534 !important;
                }
                
                .text-yellow-800 {
                    color: #92400e !important;
                }
                
                .text-red-800 {
                    color: #991b1b !important;
                }
                
                .text-blue-600 {
                    color: #2563eb !important;
                }
                
                .bg-gray-50 {
                    background-color: #f9fafb !important;
                }
                
                .text-gray-700 {
                    color: #374151 !important;
                }
                
                .text-gray-800 {
                    color: #1f2937 !important;
                }
                
                .text-gray-900 {
                    color: #111827 !important;
                }
                
                .btn-outline-gray {
                    border-color: #d1d5db;
                    color: #6b7280;
                }
                
                .btn-outline-gray:hover {
                    background-color: #f3f4f6;
                    border-color: #9ca3af;
                }
            `}</style>
        </LayoutAdmin>
    )
}