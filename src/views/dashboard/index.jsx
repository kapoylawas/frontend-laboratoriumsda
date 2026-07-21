import { useState, useEffect } from 'react';
import LayoutAdmin from '../../layouts/admin';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import Api from '../../services/api';
import {
    IconFlask, IconAward, IconCheck, IconClock, IconShoppingCart,
    IconFileText, IconSparkles, IconChartBar, IconCalendar, IconUserCheck,
    IconRefresh, IconUser
} from "@tabler/icons-react";

const COLORS = ['#e50914', '#10b981', '#fbbf24', '#38bdf8', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
    const userCookie = Cookies.get("user");
    const user = userCookie ? JSON.parse(userCookie) : null;
    const isAdmin = user && (user.role_id === 2 || user.role_id === '2');

    // State untuk data API real
    const [isLoading, setIsLoading] = useState(true);
    const [adminData, setAdminData] = useState({
        totalPendapatan: 0,
        totalPemohonan: 0,
        pengujianSelesai: 0,
        pendingTindakan: 0,
        totalUsers: 0,
        chartMonthlyData: [],
        chartKategoriData: [],
        recentActivities: []
    });

    const [pemohonData, setPemohonData] = useState({
        totalOrder: 0,
        pendingOrder: 0,
        approvedOrder: 0,
        selesaiOrder: 0,
        recentOrders: [],
        jadwalList: []
    });

    const formatRupiah = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            return { text: "Selamat Pagi", badgeBg: "#fef08a", color: "#854d0e" };
        } else if (hour >= 12 && hour < 15) {
            return { text: "Selamat Siang", badgeBg: "#fed7aa", color: "#9a3412" };
        } else if (hour >= 15 && hour < 19) {
            return { text: "Selamat Sore", badgeBg: "#fbcfe8", color: "#9d174d" };
        } else {
            return { text: "Selamat Malam", badgeBg: "#e0e7ff", color: "#3730a3" };
        }
    };

    const greeting = getGreeting();

    // Fetch real API data dari Backend Node.js
    const fetchBackendData = async () => {
        setIsLoading(true);
        const token = Cookies.get('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        Api.defaults.headers.common['Authorization'] = token;

        try {
            if (isAdmin) {
                // Endpoint Admin BE: /api/pemohonan/all, /api/users, /api/transactions, /api/berita-acara, /api/categories
                const [resPemohonan, resUsers, resTransactions, resBA, resCategories] = await Promise.allSettled([
                    Api.get('/api/pemohonan/all?limit=200'),
                    Api.get('/api/users'),
                    Api.get('/api/transactions'),
                    Api.get('/api/berita-acara'),
                    Api.get('/api/categories')
                ]);

                const pemohonanList = resPemohonan.status === 'fulfilled' ? (resPemohonan.value.data.data || resPemohonan.value.data || []) : [];
                const usersList = resUsers.status === 'fulfilled' ? (resUsers.value.data.data || resUsers.value.data || []) : [];
                const transactionsList = resTransactions.status === 'fulfilled' ? (resTransactions.value.data.data || resTransactions.value.data || []) : [];
                const baList = resBA.status === 'fulfilled' ? (resBA.value.data.data || resBA.value.data || []) : [];
                const categoriesList = resCategories.status === 'fulfilled' ? (resCategories.value.data.data || resCategories.value.data || []) : [];

                // 1. Total Pendapatan Real Backend
                let totalIncome = 0;
                transactionsList.forEach(t => {
                    if (t.status === 'paid' || t.status === 'LUNAS' || t.is_paid || t.payment_status === 'paid') {
                        totalIncome += Number(t.grand_total || t.total || t.amount || 0);
                    }
                });

                // Jika data transaksi nominal belum terisi, akumulasi dari pemohonan approved
                if (totalIncome === 0) {
                    pemohonanList.forEach(p => {
                        if (p.status === 'APPROVED' || p.status === 'DISETUJUI') {
                            totalIncome += Number(p.total_biaya || p.total || p.biaya || 0);
                        }
                    });
                }

                // 2. Status Counts
                const pendingCount = pemohonanList.filter(p => p.status === 'SUBMITTED' || p.status === 'PENDING' || p.status === 'MENUNGGU').length;
                const completedCount = baList.length || pemohonanList.filter(p => p.status === 'APPROVED' || p.status === 'SELESAI' || p.status === 'COMPLETED').length;

                // 3. Olah data bulanan dari timestamp riil BE
                const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const monthlyStatsMap = {};
                monthsArr.forEach(m => { monthlyStatsMap[m] = 0; });

                pemohonanList.forEach(item => {
                    const dateStr = item.createdAt || item.created_at || item.tanggal;
                    if (dateStr) {
                        const d = new Date(dateStr);
                        const monthName = monthsArr[d.getMonth()];
                        if (monthName) {
                            monthlyStatsMap[monthName] = (monthlyStatsMap[monthName] || 0) + 1;
                        }
                    }
                });

                const monthlyChartData = Object.keys(monthlyStatsMap).map(m => ({
                    name: m,
                    Pengujian: monthlyStatsMap[m]
                }));

                // 4. Olah data distribusi kategori riil dari BE
                const categoryCountMap = {};
                pemohonanList.forEach(p => {
                    const catName = p.category?.name || p.sampel?.category?.name || p.jenis_layanan || 'Layanan Laboratorium';
                    categoryCountMap[catName] = (categoryCountMap[catName] || 0) + 1;
                });

                let categoryChartData = Object.keys(categoryCountMap).map(cat => ({
                    name: cat,
                    value: categoryCountMap[cat]
                }));

                // Jika pemohonan belum punya relasi kategori, gunakan master data kategori BE
                if (categoryChartData.length === 0 && categoriesList.length > 0) {
                    categoryChartData = categoriesList.map(c => ({
                        name: c.name || c.nama_kategori,
                        value: 1
                    }));
                }

                setAdminData({
                    totalPendapatan: totalIncome,
                    totalPemohonan: pemohonanList.length,
                    pengujianSelesai: completedCount,
                    pendingTindakan: pendingCount,
                    totalUsers: usersList.length,
                    chartMonthlyData: monthlyChartData,
                    chartKategoriData: categoryChartData,
                    recentActivities: pemohonanList.slice(0, 7)
                });
            } else {
                // Endpoint Pemohon BE: /api/pemohonan, /api/transaction-by-user/:id, /api/jadwal-pengambilan/user
                const [resPemohonanUser, resJadwal, resTransUser] = await Promise.allSettled([
                    Api.get('/api/pemohonan'),
                    Api.get('/api/jadwal-pengambilan/user'),
                    user ? Api.get(`/api/transaction-by-user/${user.id}`) : Promise.resolve({ data: [] })
                ]);

                const userPemohonan = resPemohonanUser.status === 'fulfilled' ? (resPemohonanUser.value.data.data || resPemohonanUser.value.data || []) : [];
                const userJadwal = resJadwal.status === 'fulfilled' ? (resJadwal.value.data.data || resJadwal.value.data || []) : [];

                const pendingCount = userPemohonan.filter(p => p.status === 'SUBMITTED' || p.status === 'PENDING').length;
                const approvedCount = userPemohonan.filter(p => p.status === 'APPROVED' || p.status === 'DISETUJUI').length;
                const selesaiCount = userPemohonan.filter(p => p.status === 'COMPLETED' || p.status === 'SELESAI').length;

                setPemohonData({
                    totalOrder: userPemohonan.length,
                    pendingOrder: pendingCount,
                    approvedOrder: approvedCount,
                    selesaiOrder: selesaiCount,
                    recentOrders: userPemohonan.slice(0, 5),
                    jadwalList: userJadwal
                });
            }
        } catch (err) {
            console.error("Gagal memuat data API backend:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBackendData();
    }, [isAdmin]);

    // Render Admin Dashboard UI
    const renderAdminDashboard = () => {
        return (
            <div className="dashboard-3d-wrapper">
                {/* 3D Header Banner */}
                <div className="dash-hero-card mb-4">
                    <div className="dash-hero-overlay"></div>
                    <div className="row align-items-center position-relative z-2">
                        <div className="col-lg-8 text-white mb-3 mb-lg-0">
                            <div className="greeting-pill mb-2">
                                <IconSparkles size={16} className="text-warning me-1" />
                                <span>{greeting.text}, Administrator</span>
                            </div>
                            <h1 className="fw-black fs-2 text-white mb-2">
                                Panel Utama Admin Labkesda Sidoarjo
                            </h1>
                            <p className="text-white-80 small max-w-650 mb-0">
                                Data terhubung langsung secara real-time dari API Backend UPT Laboratorium Kesehatan Daerah Sidoarjo (OPD 50018292).
                            </p>
                        </div>

                        <div className="col-lg-4 text-lg-end">
                            <div className="ikm-score-card-3d d-inline-block text-start p-3 bg-white text-dark rounded-4">
                                <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                    <div className="d-flex align-items-center gap-1">
                                        <IconAward size={20} className="text-danger" />
                                        <span className="fw-bold small">Indeks IKM Sidoarjo</span>
                                    </div>
                                    <button onClick={fetchBackendData} className="btn btn-sm btn-link p-0 text-dark" title="Segarkan Data BE">
                                        <IconRefresh size={16} className={isLoading ? "spin-icon" : ""} />
                                    </button>
                                </div>
                                <div className="d-flex align-items-baseline gap-2">
                                    <span className="fw-black fs-2 text-danger">97.28</span>
                                    <span className="badge bg-success-subtle text-success fw-bold">Mutu A (Sangat Baik)</span>
                                </div>
                                <span className="small text-secondary d-block mt-1">
                                    Survey Responden Pemkab Sidoarjo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3D Stats Cards Grid */}
                <div className="row g-4 mb-4">
                    <div className="col-xl-3 col-md-6">
                        <div className="stat-card-3d p-3 p-md-4 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="stat-icon-3d bg-danger text-white">
                                    <IconFileText size={24} />
                                </div>
                                <span className="badge bg-danger-subtle text-danger fw-bold">API BE</span>
                            </div>
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Total Permohonan</h6>
                            <h3 className="fw-black text-dark mb-0">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : `${adminData.totalPemohonan} Order`}
                            </h3>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <div className="stat-card-3d p-3 p-md-4 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="stat-icon-3d bg-success text-white">
                                    <IconCheck size={24} />
                                </div>
                                <span className="badge bg-success-subtle text-success fw-bold">Transaksi BE</span>
                            </div>
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Total Pendapatan</h6>
                            <h3 className="fw-black text-dark mb-0 fs-5">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : formatRupiah(adminData.totalPendapatan)}
                            </h3>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <div className="stat-card-3d p-3 p-md-4 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="stat-icon-3d bg-warning text-white">
                                    <IconClock size={24} />
                                </div>
                                <span className="badge bg-warning-subtle text-warning-emphasis fw-bold">Verifikasi BE</span>
                            </div>
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Perlu Tindakan</h6>
                            <h3 className="fw-black text-dark mb-0">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : `${adminData.pendingTindakan} Pending`}
                            </h3>
                        </div>
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <div className="stat-card-3d p-3 p-md-4 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="stat-icon-3d bg-info text-white">
                                    <IconUserCheck size={24} />
                                </div>
                                <span className="badge bg-info-subtle text-info fw-bold">User BE</span>
                            </div>
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Pengguna Terdaftar</h6>
                            <h3 className="fw-black text-dark mb-0">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : `${adminData.totalUsers} User`}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="row g-4 mb-4">
                    <div className="col-xl-8">
                        <div className="card-3d p-4 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-black text-dark mb-0 d-flex align-items-center gap-2">
                                    <IconChartBar size={22} className="text-danger" />
                                    <span>Grafik Permohonan Masuk per Bulan (Data API)</span>
                                </h5>
                                <span className="badge bg-light text-dark border border-dark fw-bold">BE Synchronized</span>
                            </div>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={adminData.chartMonthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" stroke="#475569" />
                                        <YAxis stroke="#475569" allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '2px solid #000',
                                                borderRadius: '12px',
                                                boxShadow: '4px 4px 0px #000',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="Pengujian" fill="#e50914" name="Jumlah Permohonan (BE)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-4">
                        <div className="card-3d p-4 bg-white h-100">
                            <h5 className="fw-black text-dark mb-4 d-flex align-items-center gap-2">
                                <IconFlask size={22} className="text-danger" />
                                <span>Distribusi Kategori Uji</span>
                            </h5>
                            <div style={{ height: '220px' }}>
                                {adminData.chartKategoriData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={adminData.chartKategoriData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={75}
                                                dataKey="value"
                                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                            >
                                                {adminData.chartKategoriData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100 text-secondary small">
                                        Memuat data kategori...
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 text-center small">
                                {adminData.chartKategoriData.map((entry, index) => (
                                    <span key={index} className="d-inline-block me-3 mb-1 fw-bold">
                                        <span className="d-inline-block rounded-circle me-1" style={{ width: 10, height: 10, backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        {entry.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities Table */}
                <div className="card-3d p-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-black text-dark mb-0">Tabel Permohonan Uji Sampel Real Backend</h5>
                        <Link to="/semua-penawaran" className="btn btn-sm btn-pop-yellow fw-bold">
                            Kelola Semua Permohonan ➔
                        </Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-pop align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>ID Order</th>
                                    <th>Pemohon / Lembaga</th>
                                    <th>Tanggal Masuk BE</th>
                                    <th>Status Verifikasi</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminData.recentActivities.length > 0 ? (
                                    adminData.recentActivities.map((item) => (
                                        <tr key={item.id}>
                                            <td className="fw-bold">ORD-{item.id}</td>
                                            <td className="fw-semibold">
                                                {item.user?.name || item.nama_pemohon || item.nomor_surat || 'Masyarakat Umum'}
                                            </td>
                                            <td>
                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </td>
                                            <td>
                                                <span className={`badge-3d ${item.status === 'APPROVED' || item.status === 'DISETUJUI' ? 'bg-success text-white' : item.status === 'REJECTED' || item.status === 'DITOLAK' ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                                                    {item.status || 'SUBMITTED'}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/semua-penawaran/${item.id}`} className="btn btn-sm btn-pop-blue py-1 px-2 text-decoration-none">
                                                    Detail ↗
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-secondary">
                                            {isLoading ? "Menghubungkan ke API Backend..." : "Belum ada transaksi permohonan tersimpan di database."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // Render Pemohon Dashboard UI
    const renderPemohonDashboard = () => {
        return (
            <div className="dashboard-3d-wrapper">
                {/* 3D Header Banner Pemohon */}
                <div className="dash-hero-card mb-4">
                    <div className="dash-hero-overlay"></div>
                    <div className="row align-items-center position-relative z-2">
                        <div className="col-lg-8 text-white mb-3 mb-lg-0">
                            <div className="greeting-pill mb-2" style={{ backgroundColor: greeting.badgeBg, color: greeting.color }}>
                                <IconSparkles size={16} className="me-1" />
                                <span>{greeting.text}, {user?.name || 'Pemohon'}</span>
                            </div>
                            <h1 className="fw-black fs-2 text-white mb-2">
                                Portal Layanan UPT Labkesda Sidoarjo
                            </h1>
                            <p className="text-white-80 small max-w-650 mb-0">
                                Pengujian laboratorium sampel air, makanan, dan mikrobiologi dengan standar sertifikasi ISO/IEC 17025.
                            </p>
                        </div>

                        <div className="col-lg-4 text-lg-end">
                            <div className="user-card-3d d-inline-flex align-items-center gap-3 p-3 bg-white text-dark rounded-4">
                                <div className="user-avatar-3d">
                                    <IconUser size={28} className="text-danger" />
                                </div>
                                <div className="text-start">
                                    <div className="fw-black fs-6">{user?.name || 'User Pemohon'}</div>
                                    <span className="badge bg-danger-subtle text-danger fw-bold">Pemohon Resmi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Stats for Pemohon from API */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <div className="stat-card-3d p-3 bg-white text-center">
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Total Order Saya</h6>
                            <h3 className="fw-black text-dark mb-0">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : `${pemohonData.totalOrder} Order`}
                            </h3>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card-3d p-3 bg-white text-center">
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Proses Verifikasi</h6>
                            <h3 className="fw-black text-warning mb-0">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : `${pemohonData.pendingOrder} Pending`}
                            </h3>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card-3d p-3 bg-white text-center">
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Order Disetujui</h6>
                            <h3 className="fw-black text-success mb-0">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : `${pemohonData.approvedOrder} Approved`}
                            </h3>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card-3d p-3 bg-white text-center">
                            <h6 className="text-secondary fw-bold small text-uppercase mb-1">Jadwal Pengambilan</h6>
                            <h3 className="fw-black text-info mb-0">
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : `${pemohonData.jadwalList.length} Jadwal`}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* 3D Workflow Step Cards */}
                <div className="card-3d p-4 bg-white mb-4">
                    <div className="mb-4">
                        <div className="d-inline-block badge-3d bg-danger text-white mb-2">
                            Alur Pengujian Sampel
                        </div>
                        <h3 className="fw-black text-dark fs-3 mb-1">Tahapan Pengujian Laboratorium</h3>
                        <p className="text-secondary small mb-0">
                          Ikuti 3 langkah mudah di bawah ini untuk mengajukan dan mengambil hasil uji sampel Anda.
                        </p>
                    </div>

                    <div className="row g-4">
                        {/* Step 1 */}
                        <div className="col-md-4">
                            <div className="workflow-step-3d p-4 h-100 d-flex flex-column justify-content-between">
                                <div>
                                    <div className="step-badge-3d bg-danger text-white mb-3">
                                        Langkah 1
                                    </div>
                                    <div className="step-icon-glow mb-3">
                                        <IconFlask size={32} className="text-danger" />
                                    </div>
                                    <h4 className="fw-bold text-dark fs-5 mb-2">1. Ajukan Penawaran Sampel</h4>
                                    <p className="text-secondary small">
                                        Pilih parameter dan spesifikasi jenis uji laboratorium yang Anda butuhkan.
                                    </p>
                                </div>
                                <div className="mt-3 pt-3 border-top">
                                    <Link to="/penawaran/create" className="btn btn-pop-green w-100">
                                        <span>Buat Order Baru ➔</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="col-md-4">
                            <div className="workflow-step-3d p-4 h-100 d-flex flex-column justify-content-between">
                                <div>
                                    <div className="step-badge-3d bg-warning text-dark mb-3">
                                        Langkah 2
                                    </div>
                                    <div className="step-icon-glow mb-3">
                                        <IconShoppingCart size={32} className="text-warning" />
                                    </div>
                                    <h4 className="fw-bold text-dark fs-5 mb-2">2. Keranjang &amp; Bayar</h4>
                                    <p className="text-secondary small">
                                        Selesaikan pembayaran transaksi sampel melalui sistem keranjang belanja Anda.
                                    </p>
                                </div>
                                <div className="mt-3 pt-3 border-top">
                                    <Link to="/cart" className="btn btn-pop-yellow w-100">
                                        <span>Buka Keranjang ➔</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="col-md-4">
                            <div className="workflow-step-3d p-4 h-100 d-flex flex-column justify-content-between">
                                <div>
                                    <div className="step-badge-3d bg-info text-white mb-3">
                                        Langkah 3
                                    </div>
                                    <div className="step-icon-glow mb-3">
                                        <IconFileText size={32} className="text-info" />
                                    </div>
                                    <h4 className="fw-bold text-dark fs-5 mb-2">3. Cetak Hasil &amp; Invoice</h4>
                                    <p className="text-secondary small">
                                        Pantau status pengujian laboratorium dan unduh hasil sertifikat uji resmi.
                                    </p>
                                </div>
                                <div className="mt-3 pt-3 border-top">
                                    <Link to="/history" className="btn btn-pop-blue w-100">
                                        <span>Lihat Riwayat &amp; Hasil ➔</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Real Table for Pemohon */}
                <div className="card-3d p-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-black text-dark mb-0">Daftar Order Pengujian Sampel Saya (Backend Real)</h5>
                        <Link to="/penawaran" className="btn btn-sm btn-pop-yellow fw-bold">
                            Lihat Semua Penawaran ➔
                        </Link>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-pop align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>ID Order</th>
                                    <th>Tanggal Pengajuan</th>
                                    <th>Status Verifikasi BE</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pemohonData.recentOrders.length > 0 ? (
                                    pemohonData.recentOrders.map((item) => (
                                        <tr key={item.id}>
                                            <td className="fw-bold">ORD-{item.id}</td>
                                            <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                                            <td>
                                                <span className={`badge-3d ${item.status === 'APPROVED' || item.status === 'DISETUJUI' ? 'bg-success text-white' : item.status === 'REJECTED' || item.status === 'DITOLAK' ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                                                    {item.status || 'SUBMITTED'}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/penawaran/${item.id}`} className="btn btn-sm btn-pop-blue py-1 px-2 text-decoration-none">
                                                    Detail ↗
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-secondary">
                                            {isLoading ? "Mengambil data order Anda dari server..." : "Anda belum memiliki permohonan pengujian aktif."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <LayoutAdmin>
            <div className="container-fluid py-4">
                {isAdmin ? renderAdminDashboard() : renderPemohonDashboard()}
            </div>

            <style>{`
                .dashboard-3d-wrapper {
                    position: relative;
                }

                .dash-hero-card {
                    background: linear-gradient(135deg, #991b1b 0%, #881337 50%, #4c0519 100%);
                    border: 3px solid #000000;
                    box-shadow: 8px 8px 0px #000000;
                    border-radius: 24px;
                    padding: 2rem;
                    position: relative;
                    overflow: hidden;
                }

                .dash-hero-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px);
                    background-size: 24px 24px;
                    pointer-events: none;
                }

                .greeting-pill {
                    display: inline-flex;
                    align-items: center;
                    background: #fef08a;
                    color: #854d0e;
                    font-weight: 800;
                    font-size: 0.85rem;
                    padding: 6px 16px;
                    border: 2px solid #000000;
                    box-shadow: 3px 3px 0px #000000;
                    border-radius: 12px;
                }

                .ikm-score-card-3d,
                .user-card-3d {
                    border: 2.5px solid #000000;
                    box-shadow: 5px 5px 0px #000000;
                }

                .user-avatar-3d {
                    width: 48px;
                    height: 48px;
                    background: #fee2e2;
                    border: 2px solid #000000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 2px 2px 0px #000000;
                }

                .stat-card-3d {
                    border: 3px solid #000000;
                    box-shadow: 6px 6px 0px #000000;
                    border-radius: 20px;
                    transition: all 0.15s ease-in-out;
                }

                .stat-card-3d:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 8px 8px 0px #000000;
                }

                .stat-icon-3d {
                    width: 48px;
                    height: 48px;
                    border: 2.5px solid #000000;
                    box-shadow: 3px 3px 0px #000000;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .card-3d {
                    border: 3px solid #000000;
                    box-shadow: 8px 8px 0px #000000;
                    border-radius: 22px;
                }

                .workflow-step-3d {
                    border: 2.5px solid #000000;
                    box-shadow: 5px 5px 0px #000000;
                    border-radius: 18px;
                    background: #f8fafc;
                    transition: all 0.2s ease;
                }

                .workflow-step-3d:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 7px 7px 0px #000000;
                    background: #ffffff;
                }

                .step-badge-3d {
                    font-weight: 800;
                    font-size: 0.8rem;
                    padding: 4px 12px;
                    border: 2px solid #000000;
                    box-shadow: 2px 2px 0px #000000;
                    border-radius: 8px;
                    display: inline-block;
                }

                .step-icon-glow {
                    width: 56px;
                    height: 56px;
                    background: #ffffff;
                    border: 2.5px solid #000000;
                    box-shadow: 3px 3px 0px #000000;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .badge-3d {
                    font-weight: 800;
                    font-size: 0.78rem;
                    padding: 5px 12px;
                    border: 2px solid #000000;
                    box-shadow: 2px 2px 0px #000000;
                    border-radius: 8px;
                }

                .btn-pop-green {
                    background: #10b981;
                    color: #ffffff !important;
                    font-weight: 800;
                    font-size: 0.9rem;
                    padding: 10px 18px;
                    border: 2.5px solid #000000;
                    box-shadow: 4px 4px 0px #000000;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    text-decoration: none !important;
                    transition: all 0.15s ease-in-out;
                }
                .btn-pop-green:hover {
                    background: #059669;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000;
                }

                .btn-pop-yellow {
                    background: #fbbf24;
                    color: #000000 !important;
                    font-weight: 800;
                    font-size: 0.9rem;
                    padding: 10px 18px;
                    border: 2.5px solid #000000;
                    box-shadow: 4px 4px 0px #000000;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    text-decoration: none !important;
                    transition: all 0.15s ease-in-out;
                }
                .btn-pop-yellow:hover {
                    background: #f59e0b;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000;
                }

                .btn-pop-blue {
                    background: #38bdf8;
                    color: #000000 !important;
                    font-weight: 800;
                    font-size: 0.9rem;
                    padding: 10px 18px;
                    border: 2.5px solid #000000;
                    box-shadow: 4px 4px 0px #000000;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    text-decoration: none !important;
                    transition: all 0.15s ease-in-out;
                }
                .btn-pop-blue:hover {
                    background: #0284c7;
                    color: #ffffff !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px #000000;
                }

                .table-pop {
                    border-collapse: separate;
                    border-spacing: 0;
                }
                .table-pop th {
                    background: #f1f5f9;
                    border-bottom: 2.5px solid #000000;
                    font-weight: 800;
                    color: #0f172a;
                    padding: 12px 16px;
                }
                .table-pop td {
                    padding: 12px 16px;
                    border-bottom: 1.5px solid #e2e8f0;
                }

                .spin-icon {
                    animation: spinFast 1s linear infinite;
                }

                @keyframes spinFast {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </LayoutAdmin>
    );
}