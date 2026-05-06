//import react router dom
import { Routes, Route } from "react-router-dom";

//import components
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AdminRoute from '../components/AdminRoute.jsx';
import OperationalRoute from '../components/OperationalRoute.jsx';
import HasilRoute from '../components/HasilRoute.jsx';
import JadwalPengambilanRoute from '../components/JadwalPengambilanRoute.jsx';

//import view login
import Login from "../views/auth/login.jsx";
import Dashboard from "../views/dashboard/index.jsx";
import Register from "../views/auth/register.jsx";
import Categories from "../views/categories/index.jsx";
import Forbidden from "../views/forbidden/index.jsx";
import Aktifasi from "../views/activite/index.jsx";
import Sampels from "../views/sampels/index.jsx";
import Users from "../views/user/index.jsx";
import Profile from "../views/profile/index.jsx";
import Pengajuan from "../views/pengajuan/index.jsx";
import PengajuanCreate from "../views/pengajuan/create.jsx";
import PengajuanDetail from "../views/pengajuan/detail.jsx";
import Orders from "../views/orders/index.jsx";
import Cart from "../views/card/index.jsx";
import History from "../views/history/index.jsx";
import InvoicePrint from "../views/history/invoicePrint.jsx";
import Hasil from "../views/hasil/index.jsx";
import Penjadwalan from "../views/penjadwalan/index.jsx";
import SemuaPenawaran from "../views/penawaran-all/index.jsx";
import SemuaPenawaranDetail from "../views/penawaran-all/detail.jsx";
import JadwalPengambilanHasil from "../views/jadwal-pengambilan/index.jsx";
import JadwalPengambilanDetail from "../views/jadwal-pengambilan/detail.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/aktifasi/:token" element={<Aktifasi />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Protected Routes - Require Authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      {/* Penawaran (Quotation) Routes - Accessible by authenticated users */}
      <Route path="/penawaran" element={
        <ProtectedRoute>
          <Pengajuan />
        </ProtectedRoute>
      } />
      <Route path="/penawaran/create" element={
        <ProtectedRoute>
          <PengajuanCreate />
        </ProtectedRoute>
      } />
      <Route path="/penawaran/:id" element={
        <ProtectedRoute>
          <PengajuanDetail />
        </ProtectedRoute>
      } />

      {/* Operational Routes - Admin & Pemohon (Orders, Cart, History) */}
      <Route path="/orders" element={
        <OperationalRoute>
          <Orders />
        </OperationalRoute>
      } />

      <Route path="/cart" element={
        <OperationalRoute>
          <Cart />
        </OperationalRoute>
      } />

      <Route path="/history" element={
        <OperationalRoute>
          <History />
        </OperationalRoute>
      } />

      <Route path="/invoice/:id" element={
        <OperationalRoute>
          <InvoicePrint />
        </OperationalRoute>
      } />

      {/* Admin Routes - Require Admin Role */}
      <Route path="/categories" element={
        <AdminRoute>
          <Categories />
        </AdminRoute>
      } />

      <Route path="/sampels" element={
        <AdminRoute>
          <Sampels />
        </AdminRoute>
      } />

      <Route path="/users" element={
        <AdminRoute>
          <Users />
        </AdminRoute>
      } />

      {/* Hasil Route - Accessible by Admin Labkesda & Analisis */}
      <Route path="/hasil" element={
        <HasilRoute>
          <Hasil />
        </HasilRoute>
      } />

      {/* Penjadwalan Route - Admin Only */}
      <Route path="/penjadwalan" element={
        <AdminRoute>
          <Penjadwalan />
        </AdminRoute>
      } />

      {/* Semua Penawaran Route - Admin Only */}
      <Route path="/semua-penawaran" element={
        <AdminRoute>
          <SemuaPenawaran />
        </AdminRoute>
      } />
      <Route path="/semua-penawaran/:id" element={
        <AdminRoute>
          <SemuaPenawaranDetail />
        </AdminRoute>
      } />

      {/* Jadwal Pengambilan Hasil Route - Pemohon Only */}
      <Route path="/jadwal-pengambilan" element={
        <JadwalPengambilanRoute>
          <JadwalPengambilanHasil />
        </JadwalPengambilanRoute>
      } />
      <Route path="/jadwal-pengambilan/:id" element={
        <JadwalPengambilanRoute>
          <JadwalPengambilanDetail />
        </JadwalPengambilanRoute>
      } />
    </Routes>
  );
}