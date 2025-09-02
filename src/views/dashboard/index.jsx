import LayoutAdmin from '../../layouts/admin'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// Data statistik (contoh)
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
    return (
        <LayoutAdmin>
            <div className="container-fluid py-4">
                <h2 className="mb-4">Dashboard</h2>

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
                                        <div className="h5 mb-0 font-weight-bold text-gray-800">Rp 15.250.000</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-calendar fa-2x text-gray-300"></i>
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
                                        <div className="h5 mb-0 font-weight-bold text-gray-800">125</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-user-plus fa-2x text-gray-300"></i>
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
                                        <div className="h5 mb-0 font-weight-bold text-gray-800">18</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-shopping-cart fa-2x text-gray-300"></i>
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
                                        <div className="h5 mb-0 font-weight-bold text-gray-800">5</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-exclamation-circle fa-2x text-gray-300"></i>
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
                            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 className="m-0 font-weight-bold text-primary">Grafik Pendapatan & Pengguna</h6>
                            </div>
                            <div className="card-body">
                                <div className="chart-area" style={{ height: '320px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="Pendapatan" fill="#4e73df" />
                                            <Bar dataKey="Pengguna" fill="#1cc88a" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Produk */}
                    <div className="col-xl-4 col-lg-5">
                        <div className="card shadow-sm mb-4">
                            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 className="m-0 font-weight-bold text-primary">Distribusi Produk</h6>
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
                    <div className="card-header py-3">
                        <h6 className="m-0 font-weight-bold text-primary">Aktivitas Terbaru</h6>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-bordered" width="100%" cellSpacing="0">
                                <thead>
                                    <tr>
                                        <th>Nama Pengguna</th>
                                        <th>Aktivitas</th>
                                        <th>Waktu</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Tiger Nixon</td>
                                        <td>Pembelian Produk A</td>
                                        <td>2023-10-01 12:30:45</td>
                                        <td><span className="badge badge-success">Selesai</span></td>
                                    </tr>
                                    <tr>
                                        <td>Garrett Winters</td>
                                        <td>Registrasi Akun</td>
                                        <td>2023-10-01 11:25:30</td>
                                        <td><span className="badge badge-info">Baru</span></td>
                                    </tr>
                                    <tr>
                                        <td>Ashton Cox</td>
                                        <td>Pengajuan Return</td>
                                        <td>2023-10-01 10:15:22</td>
                                        <td><span className="badge badge-warning">Pending</span></td>
                                    </tr>
                                    <tr>
                                        <td>Cedric Kelly</td>
                                        <td>Pembayaran Invoice</td>
                                        <td>2023-10-01 09:45:10</td>
                                        <td><span className="badge badge-success">Lunas</span></td>
                                    </tr>
                                    <tr>
                                        <td>Airi Satou</td>
                                        <td>Update Profil</td>
                                        <td>2023-10-01 08:30:05</td>
                                        <td><span className="badge badge-secondary">Update</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .card {
          border: none;
          border-radius: 0.35rem;
        }
        
        .border-left-primary {
          border-left: 0.25rem solid #4e73df !important;
        }
        
        .border-left-success {
          border-left: 0.25rem solid #1cc88a !important;
        }
        
        .border-left-info {
          border-left: 0.25rem solid #36b9cc !important;
        }
        
        .border-left-warning {
          border-left: 0.25rem solid #f6c23e !important;
        }
        
        .shadow-sm {
          box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15) !important;
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
          color: #fff;
          background-color: #1cc88a;
        }
        
        .badge-info {
          color: #fff;
          background-color: #36b9cc;
        }
        
        .badge-warning {
          color: #fff;
          background-color: #f6c23e;
        }
        
        .badge-secondary {
          color: #fff;
          background-color: #858796;
        }
      `}</style>
        </LayoutAdmin>
    )
}