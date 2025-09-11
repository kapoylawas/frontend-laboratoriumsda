//import react router dom
import { Routes, Route, Navigate } from "react-router-dom";

//import store
import { useStore } from '../stores/user.js';

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
import Orders from "../views/orders/index.jsx";

export default function AppRoutes() {

  //destruct state "token" from store
  const { token, user } = useStore();

  return (
    <Routes>

      <Route path="/" element={
        token ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      {/* route "/register" */}
      <Route path="/register" element={
        <Register />
      } />

      {/* route "/aktifasi" */}
      <Route path="/aktifasi/:token" element={
        <Aktifasi />
      } />

      {/* route "/dashboard" */}
      <Route path="/dashboard" element={
        token ? <Dashboard /> : <Navigate to="/" replace />
      } />

      {/* route "/profile" */}
      <Route path="/profile" element={
        token ? <Profile /> : <Navigate to="/" replace />
      } />

      {/* route "/orders" */}
      <Route path="/orders" element={
        token ? <Orders /> : <Navigate to="/" replace />
      } />

      {/* route "/categories" */}
      <Route path="/categories" element={
        token ? (
          user?.role_id === 2 ? (
            <Categories />
          ) : (
            <Forbidden /> // atau <Navigate to="/dashboard" replace />
          )
        ) : (
          <Navigate to="/" replace />
        )
      } />

      {/* route "/sampels" */}
      <Route path="/sampels" element={
        token ? (
          user?.role_id === 2 ? (
            <Sampels />
          ) : (
            <Forbidden /> // atau <Navigate to="/dashboard" replace />
          )
        ) : (
          <Navigate to="/" replace />
        )
      } />

      {/* route "/users" */}
      <Route path="/users" element={
        token ? (
          user?.role_id === 2 ? (
            <Users />
          ) : (
            <Forbidden /> // atau <Navigate to="/dashboard" replace />
          )
        ) : (
          <Navigate to="/" replace />
        )
      } />

      {/* Tambahkan route untuk halaman forbidden jika diperlukan */}
      <Route path="/forbidden" element={<Forbidden />} />

    </Routes>
  );
}