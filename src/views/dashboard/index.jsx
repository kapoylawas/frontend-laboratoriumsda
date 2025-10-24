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

    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return {
                text: "Selamat Pagi",
                icon: (
                    <svg viewBox="0 0 24 24" className="greeting-icon">
                        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM6.34 5.16l-1.42 1.42c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.42-1.42c.39-.39.39-1.02 0-1.41-.38-.39-1.02-.39-1.41 0zm12.02 12.83l1.42 1.42c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.42-1.42c-.39-.39-1.02-.39-1.41 0-.38.39-.38 1.02 0 1.41zm-14.36 0c.39.39 1.02.39 1.41 0l1.42-1.42c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-1.42 1.42c-.38.39-.38 1.02 0 1.41zM18.72 5.16c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.42 1.42c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.42-1.42z" />
                    </svg>
                )
            };
        } else if (hour >= 12 && hour < 15) {
            return {
                text: "Selamat Siang",
                icon: (
                    <svg viewBox="0 0 24 24" className="greeting-icon">
                        <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
                    </svg>
                )
            };
        } else if (hour >= 15 && hour < 19) {
            return {
                text: "Selamat Sore",
                icon: (
                    <svg viewBox="0 0 24 24" className="greeting-icon">
                        <path d="M19.9 3c-.6-1-1.5-1-2.1-.1-1.1 1-1.1 2.7-.1 3.7.6.6 1.4.9 2.2.9.7 0 1.4-.3 2-.9.9-.9.9-2.5-.1-3.6zM20 8h-2.8c-.4-1.2-1.5-2-2.7-2-1.7 0-3 1.3-3 3v.2c-1.4.3-2.5 1.5-2.5 3 0 1.7 1.3 3 3 3h6.5c2.2 0 4-1.8 4-4s-1.8-4-4-4zM12 20H6c-.6 0-1 .4-1 1s.4 1 1 1h6c.6 0 1-.4 1-1s-.4-1-1-1zm6-4H6c-.6 0-1 .4-1 1s.4 1 1 1h12c.6 0 1-.4 1-1s-.4-1-1-1z" />
                    </svg>
                )
            };
        } else {
            return {
                text: "Selamat Malam",
                icon: (
                    <svg viewBox="0 0 24 24" className="greeting-icon">
                        <path d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z" />
                    </svg>
                )
            };
        }
    };

    // Dashboard untuk Pemohon (role_id bukan 2) - VERSI BARU YANG LEBIH BAIK
    const renderPemohonDashboard = () => {
        const greeting = getGreeting();
        console.log(greeting);

        return (
            <>
                {/* Header dengan Desain Modern */}
                <div className="dashboard-container">
                    <div className="professional-header">
                        <div className="header-content">
                            <div className="greeting-section">
                                <div className="greeting-badge">
                                    {greeting.icon}
                                    <span>{greeting.text}</span>
                                </div>
                                <h1 className="greeting-title">
                                    Halo, <span className="user-name">{user?.name || 'User'}</span>
                                </h1>
                                <p className="greeting-subtitle">
                                    Kelola pemeriksaan laboratorium Anda dengan mudah dan efisien
                                </p>
                            </div>
                            <div className="user-profile">
                                <div className="user-avatar">
                                    <svg viewBox="0 0 24 24" className="user-svg">
                                        <defs>
                                            <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#667eea" />
                                                <stop offset="100%" stopColor="#764ba2" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="12" cy="8" r="4" fill="url(#avatarGradient)" />
                                        <path d="M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" fill="url(#avatarGradient)" />
                                    </svg>
                                </div>
                                <div className="user-info">
                                    <span className="user-display-name">{user?.name || 'User'}</span>
                                    <span className="user-role">Pemohon</span>
                                </div>
                            </div>
                        </div>
                        <div className="header-graphic">
                            <svg viewBox="0 0 400 200" className="wave-svg">
                                <defs>
                                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                                        <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                                        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M0,150 C80,120 120,180 200,150 C280,120 320,180 400,150 L400,200 L0,200 Z"
                                    fill="url(#waveGradient)"
                                />
                                <path
                                    d="M0,160 C100,130 150,190 250,160 C350,130 380,190 400,160 L400,200 L0,200 Z"
                                    fill="rgba(255,255,255,0.05)"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Main Workflow */}
                    <div className="workflow-section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <svg viewBox="0 0 24 24" className="title-icon">
                                    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                                </svg>
                                Alur Pemeriksaan
                            </h2>
                            <p className="section-subtitle">Ikuti langkah-langkah untuk melakukan pemeriksaan</p>
                        </div>

                        <div className="workflow-steps">
                            <div className="workflow-step active">
                                <div className="step-indicator">
                                    <div className="step-number">1</div>
                                    <div className="step-line"></div>
                                </div>
                                <div className="step-content">
                                    <div className="step-icon">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                        </svg>
                                    </div>
                                    <div className="step-info">
                                        <h3 className="step-title">Order Pemeriksaan</h3>
                                        <p className="step-desc">Pilih jenis pemeriksaan dari katalog kami</p>
                                    </div>
                                    <button className="step-action btn-primary">
                                        <span>Order Baru</span>
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="workflow-step">
                                <div className="step-indicator">
                                    <div className="step-number">2</div>
                                    <div className="step-line"></div>
                                </div>
                                <div className="step-content">
                                    <div className="step-icon">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                    </div>
                                    <div className="step-info">
                                        <h3 className="step-title">Pembayaran</h3>
                                        <p className="step-desc">Selesaikan pembayaran melalui keranjang</p>
                                    </div>
                                    <button className="step-action btn-secondary">
                                        <span>Lihat Keranjang</span>
                                        <svg viewBox="0 0 24 24">
                                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="workflow-step">
                                <div className="step-indicator">
                                    <div className="step-number">3</div>
                                </div>
                                <div className="step-content">
                                    <div className="step-icon">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                        </svg>
                                    </div>
                                    <div className="step-info">
                                        <h3 className="step-title">Hasil & Invoice</h3>
                                        <p className="step-desc">Akses hasil dan download invoice</p>
                                    </div>
                                    <button className="step-action btn-success">
                                        <span>Riwayat Saya</span>
                                        <svg viewBox="0 0 24 24">
                                            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <style jsx>{`
                    .dashboard-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 0 20px;
                    }
    
                    /* Header Styles */
                    .professional-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 30px;
                        border-radius: 20px;
                        margin: 20px 0 30px 0;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                    }
    
                    .header-content {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        position: relative;
                        z-index: 2;
                    }
    
                    .greeting-badge {
                        background: rgba(255,255,255,0.2);
                        padding: 8px 16px;
                        border-radius: 20px;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                        margin-bottom: 15px;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.3);
                    }
    
                    .sun-icon {
                        width: 16px;
                        height: 16px;
                        fill: currentColor;
                    }
    
                    .greeting-title {
                        font-size: 2.5rem;
                        font-weight: 700;
                        margin: 0 0 10px 0;
                        line-height: 1.2;
                    }
    
                    .user-name {
                        color: #fbbf24;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
    
                    .greeting-subtitle {
                        font-size: 1.1rem;
                        opacity: 0.9;
                        margin: 0;
                        max-width: 500px;
                        line-height: 1.5;
                    }
    
                    .user-profile {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        background: rgba(255,255,255,0.15);
                        padding: 15px 20px;
                        border-radius: 15px;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.2);
                        transition: all 0.3s ease;
                    }
    
                    .user-profile:hover {
                        background: rgba(255,255,255,0.2);
                        transform: translateY(-2px);
                    }
    
                    .user-avatar {
                        width: 60px;
                        height: 60px;
                        background: rgba(255,255,255,0.9);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        border: 3px solid rgba(255,255,255,0.3);
                    }
    
                    .user-svg {
                        width: 32px;
                        height: 32px;
                    }
    
                    .user-info {
                        display: flex;
                        flex-direction: column;
                    }
    
                    .user-display-name {
                        font-weight: 600;
                        font-size: 1.1rem;
                        color: white;
                        margin-bottom: 2px;
                    }
    
                    .user-role {
                        font-size: 0.9rem;
                        opacity: 0.8;
                        background: rgba(255,255,255,0.2);
                        padding: 2px 8px;
                        border-radius: 8px;
                        display: inline-block;
                    }
    
                    .header-graphic {
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        width: 400px;
                        height: 200px;
                        opacity: 0.8;
                    }
    
                    .wave-svg {
                        width: 100%;
                        height: 100%;
                    }
    
                    /* Stats Grid */
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                    }
    
                    .stat-card {
                        background: white;
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        border: 1px solid #e8ecef;
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        position: relative;
                        overflow: hidden;
                    }
    
                    .stat-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 4px;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                    }
    
                    .stat-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    }
    
                    .stat-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }
    
                    .stat-icon {
                        width: 50px;
                        height: 50px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
    
                    .stat-icon svg {
                        width: 24px;
                        height: 24px;
                        fill: white;
                    }
    
                    .stat-icon.pending {
                        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    }
    
                    .stat-icon.process {
                        background: linear-gradient(135deg, #4ecdc4, #44a08d);
                    }
    
                    .stat-icon.completed {
                        background: linear-gradient(135deg, #45b7d1, #96c93d);
                    }
    
                    .stat-icon.total {
                        background: linear-gradient(135deg, #a166ab, #5073b8);
                    }
    
                    .stat-trend {
                        font-size: 12px;
                        font-weight: 600;
                        padding: 4px 8px;
                        border-radius: 6px;
                        background: #e8f5e8;
                        color: #2e7d32;
                    }
    
                    .stat-trend.up {
                        background: #e8f5e8;
                        color: #2e7d32;
                    }
    
                    .stat-number {
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #1a202c;
                        margin-bottom: 5px;
                    }
    
                    .stat-label {
                        color: #718096;
                        font-size: 14px;
                        margin-bottom: 15px;
                    }
    
                    .stat-progress {
                        height: 6px;
                        background: #edf2f7;
                        border-radius: 3px;
                        overflow: hidden;
                    }
    
                    .progress-bar {
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        border-radius: 3px;
                        transition: width 0.3s ease;
                    }
    
                    /* Workflow Section */
                    .workflow-section {
                        background: white;
                        padding: 30px;
                        border-radius: 20px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        margin-bottom: 30px;
                        border: 1px solid #f1f5f9;
                    }
    
                    .section-header {
                        margin-bottom: 30px;
                    }
    
                    .section-title {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #1a202c;
                        margin: 0 0 8px 0;
                    }
    
                    .title-icon {
                        width: 24px;
                        height: 24px;
                        fill: #667eea;
                    }
    
                    .section-subtitle {
                        color: #718096;
                        margin: 0;
                        font-size: 1rem;
                    }
    
                    .workflow-steps {
                        display: flex;
                        flex-direction: column;
                        gap: 25px;
                    }
    
                    .workflow-step {
                        display: flex;
                        gap: 20px;
                        align-items: flex-start;
                    }
    
                    .step-indicator {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        flex-shrink: 0;
                    }
    
                    .step-number {
                        width: 40px;
                        height: 40px;
                        background: #e2e8f0;
                        color: #718096;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 16px;
                        transition: all 0.3s ease;
                        border: 2px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
    
                    .workflow-step.active .step-number {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    }
    
                    .step-line {
                        width: 2px;
                        height: 60px;
                        background: #e2e8f0;
                        margin-top: 10px;
                    }
    
                    .step-content {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        padding: 20px;
                        background: #f8fafc;
                        border-radius: 15px;
                        border: 2px solid transparent;
                        transition: all 0.3s ease;
                    }
    
                    .workflow-step.active .step-content {
                        background: white;
                        border-color: #667eea;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
                    }
    
                    .step-content:hover {
                        transform: translateX(5px);
                        box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    }
    
                    .step-icon {
                        width: 50px;
                        height: 50px;
                        background: white;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    }
    
                    .step-icon svg {
                        width: 24px;
                        height: 24px;
                        fill: #667eea;
                    }
    
                    .step-info {
                        flex: 1;
                    }
    
                    .step-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #1a202c;
                        margin: 0 0 5px 0;
                    }
    
                    .step-desc {
                        color: #718096;
                        margin: 0;
                        font-size: 14px;
                        line-height: 1.5;
                    }
    
                    .step-action {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        flex-shrink: 0;
                        font-size: 14px;
                    }
    
                    .btn-primary {
                        background: #667eea;
                        color: white;
                    }
    
                    .btn-secondary {
                        background: #ed8936;
                        color: white;
                    }
    
                    .btn-success {
                        background: #48bb78;
                        color: white;
                    }
    
                    .step-action:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    }
    
                    .step-action svg {
                        width: 16px;
                        height: 16px;
                        fill: currentColor;
                    }
    
                    /* Bottom Section */
                    .bottom-section {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 40px;
                    }
    
                    .quick-actions,
                    .recent-activity {
                        background: white;
                        padding: 25px;
                        border-radius: 20px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        border: 1px solid #f1f5f9;
                    }
    
                    .actions-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
    
                    .action-btn {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                        padding: 20px;
                        background: #f8fafc;
                        border: 2px solid transparent;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                    }
    
                    .action-btn:hover {
                        background: white;
                        border-color: #667eea;
                        transform: translateY(-3px);
                        box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    }
    
                    .action-icon {
                        width: 50px;
                        height: 50px;
                        background: white;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    }
    
                    .action-icon svg {
                        width: 24px;
                        height: 24px;
                        fill: #667eea;
                    }
    
                    .action-btn span {
                        font-weight: 600;
                        color: #4a5568;
                        font-size: 14px;
                    }
    
                    /* Recent Activity */
                    .recent-activity .section-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
    
                    .view-all {
                        color: #667eea;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 14px;
                        transition: color 0.2s ease;
                    }
    
                    .view-all:hover {
                        color: #5a67d8;
                    }
    
                    .activity-list {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }
    
                    .activity-item {
                        display: flex;
                        gap: 15px;
                        align-items: flex-start;
                        padding: 15px 0;
                        transition: background 0.2s ease;
                        border-radius: 8px;
                        padding: 15px;
                    }
    
                    .activity-item:hover {
                        background: #f8fafc;
                    }
    
                    .activity-item:not(:last-child) {
                        border-bottom: 1px solid #f1f5f9;
                    }
    
                    .activity-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
    
                    .activity-icon svg {
                        width: 18px;
                        height: 18px;
                        fill: white;
                    }
    
                    .activity-icon.success {
                        background: #48bb78;
                    }
    
                    .activity-icon.warning {
                        background: #ed8936;
                    }
    
                    .activity-icon.info {
                        background: #4299e1;
                    }
    
                    .activity-content h4 {
                        margin: 0 0 5px 0;
                        font-size: 1rem;
                        font-weight: 600;
                        color: #1a202c;
                    }
    
                    .activity-content p {
                        margin: 0 0 5px 0;
                        color: #718096;
                        font-size: 14px;
                        line-height: 1.4;
                    }
    
                    .activity-content span {
                        color: #a0aec0;
                        font-size: 12px;
                        font-weight: 500;
                    }
    
                    /* Responsive Design */
                    @media (max-width: 1024px) {
                        .bottom-section {
                            grid-template-columns: 1fr;
                        }
                        
                        .header-content {
                            flex-direction: column;
                            gap: 20px;
                            text-align: center;
                        }
    
                        .user-profile {
                            align-self: center;
                        }
                    }
    
                    @media (max-width: 768px) {
                        .dashboard-container {
                            padding: 0 15px;
                        }
    
                        .professional-header {
                            padding: 30px 20px;
                        }
    
                        .greeting-title {
                            font-size: 2rem;
                        }
    
                        .stats-grid {
                            grid-template-columns: 1fr;
                        }
    
                        .workflow-step {
                            flex-direction: column;
                        }
    
                        .step-indicator {
                            flex-direction: row;
                            gap: 15px;
                            width: 100%;
                        }
    
                        .step-line {
                            width: 60px;
                            height: 2px;
                            margin-top: 0;
                        }
    
                        .step-content {
                            margin-left: 55px;
                            flex-direction: column;
                            align-items: flex-start;
                        }
    
                        .actions-grid {
                            grid-template-columns: 1fr;
                        }
    
                        .user-avatar {
                            width: 50px;
                            height: 50px;
                        }
    
                        .user-svg {
                            width: 28px;
                            height: 28px;
                        }
                    }
    
                    @media (max-width: 480px) {
                        .professional-header {
                            padding: 25px 15px;
                        }
    
                        .greeting-title {
                            font-size: 1.75rem;
                        }
    
                        .user-profile {
                            padding: 12px 15px;
                        }
    
                        .workflow-section,
                        .quick-actions,
                        .recent-activity {
                            padding: 20px;
                        }
                    }
                `}</style>
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