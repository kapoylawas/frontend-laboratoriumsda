# 📚 Panduan Penggunaan User Store & Role-Based Access Control

## 🎯 Overview

Store Zustand di `/src/stores/user.js` menyimpan data user lengkap termasuk role setelah login. Data ini dapat diakses dari komponen mana pun untuk menampilkan menu berdasarkan hak akses.

---

## 📦 Struktur Data User

Setelah login, data user disimpan dengan struktur berikut:

```javascript
{
  id: 1,
  name: "Admin",
  nik: "1234567890123456",
  phone: "081234567890",
  gender: "male",
  alamat: "Jl. Admin No. 1",
  email: "admin@gmail.com",
  is_active: true,
  role_id: 2,
  role: {
    id: 2,
    name: "Admin Labkesda"
  }
}
```

---

## 🔧 Helper Functions yang Tersedia

### 1. **getUserRoleName()** - Mendapatkan nama role
```javascript
import { useStore } from '../../stores/user';

function MyComponent() {
  const { getUserRoleName } = useStore();
  const roleName = getUserRoleName(); // "Admin Labkesda"
  
  return <div>Role: {roleName}</div>;
}
```

### 2. **getUserRoleId()** - Mendapatkan ID role
```javascript
const { getUserRoleId } = useStore();
const roleId = getUserRoleId(); // 2
```

### 3. **hasRole(roleName)** - Cek apakah user memiliki role tertentu
```javascript
const { hasRole } = useStore();

// Cek apakah user adalah Admin Labkesda
if (hasRole('Admin Labkesda')) {
  // Tampilkan menu admin
}
```

### 4. **isAuthenticated()** - Cek apakah user sudah login
```javascript
const { isAuthenticated } = useStore();

if (isAuthenticated()) {
  // User sudah login
} else {
  // Redirect ke halaman login
}
```

### 5. **getUserInfo()** - Mendapatkan informasi user yang terstruktur
```javascript
const { getUserInfo } = useStore();
const userInfo = getUserInfo();

console.log(userInfo);
// {
//   id: 1,
//   name: "Admin",
//   email: "admin@gmail.com",
//   role: "Admin Labkesda",
//   roleId: 2,
//   nik: "1234567890123456",
//   phone: "081234567890",
//   gender: "male",
//   alamat: "Jl. Admin No. 1",
//   isActive: true
// }
```

---

## 💡 Contoh Penggunaan di Komponen

### **Contoh 1: Menampilkan Menu Berdasarkan Role (seperti di Header.jsx)**

```javascript
import { useStore } from '../stores/user';

export default function Header() {
  const { user } = useStore();
  
  return (
    <nav>
      {/* Menu untuk semua user */}
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/orders">Orders</Link>
      
      {/* Menu khusus Admin Labkesda (role_id = 2) */}
      {user?.role_id === 2 && (
        <>
          <Link to="/hasil">Hasil</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/sampels">Sampels</Link>
          <Link to="/users">Users</Link>
        </>
      )}
    </nav>
  );
}
```

### **Contoh 2: Menggunakan Helper Function hasRole()**

```javascript
import { useStore } from '../stores/user';

export default function Sidebar() {
  const { hasRole } = useStore();
  
  return (
    <aside>
      {hasRole('Admin Labkesda') && (
        <div className="admin-menu">
          <h3>Master Data</h3>
          <ul>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/sampels">Sampels</Link></li>
            <li><Link to="/users">Users</Link></li>
          </ul>
        </div>
      )}
    </aside>
  );
}
```

### **Contoh 3: Proteksi Route/Private Component**

```javascript
import { useStore } from '../stores/user';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const { isAuthenticated, hasRole } = useStore();
  
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  if (!hasRole('Admin Labkesda')) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}
```

### **Contoh 4: Menampilkan Informasi User di Profile**

```javascript
import { useStore } from '../stores/user';

export default function ProfilePage() {
  const { getUserInfo } = useStore();
  const user = getUserInfo();
  
  return (
    <div className="profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>NIK: {user.nik}</p>
      <p>Phone: {user.phone}</p>
      <p>Gender: {user.gender}</p>
      <p>Alamat: {user.alamat}</p>
      <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
    </div>
  );
}
```

---

## 🛡️ Best Practices

### ✅ **DO:**
1. **Selalu gunakan optional chaining (`?.`)** saat mengakses properti user
   ```javascript
   user?.role_id  // ✅ Aman
   user.role_id   // ❌ Bisa error jika user undefined
   ```

2. **Gunakan helper functions** untuk kode yang lebih clean
   ```javascript
   // ✅ Lebih readable
   if (hasRole('Admin Labkesda')) { ... }
   
   // ❌ Kurang readable
   if (user?.role?.name === 'Admin Labkesda') { ... }
   ```

3. **Cek authentication** sebelum render komponen protected
   ```javascript
   if (!isAuthenticated()) {
     return <Navigate to="/" />;
   }
   ```

### ❌ **DON'T:**
1. **Jangan langsung akses nested properties tanpa checking**
   ```javascript
   // ❌ Berisiko error
   const roleName = user.role.name;
   
   // ✅ Aman
   const roleName = user?.role?.name;
   ```

2. **Jangan simpan data sensitif di localStorage** (gunakan Cookies seperti yang sudah ada)

3. **Jangan hardcode role_id**, gunakan helper atau constant
   ```javascript
   // ❌ Hardcoded
   if (user?.role_id === 2) { ... }
   
   // ✅ Lebih maintainable
   const ADMIN_ROLE_ID = 2;
   if (user?.role_id === ADMIN_ROLE_ID) { ... }
   
   // ✅ Paling baik
   if (hasRole('Admin Labkesda')) { ... }
   ```

---

## 🔄 Cara Kerja Data Flow

```
Login Form (login.jsx)
       ↓
useStore.login(credentials)
       ↓
API Call → /api/login
       ↓
Response: { user: {...}, token: "..." }
       ↓
Store State Updated + Cookies Set
       ↓
Data tersedia di seluruh aplikasi via useStore()
```

---

## 📝 Notes

1. **Data Persistence**: Data user dan token disimpan di Cookies, jadi tetap ada meskipun browser di-refresh
2. **Auto Logout**: Jika token expired (401), API interceptor akan otomatis logout dan redirect ke login page
3. **Reactive**: Setiap perubahan state user akan otomatis mengupdate semua komponen yang menggunakan `useStore()`

---

## 🚀 Quick Reference

```javascript
import { useStore } from '../stores/user';

function MyComponent() {
  const { 
    user,              // Object user lengkap
    token,             // JWT token
    logout,            // Function logout
    getUserRoleName,   // Get role name
    getUserRoleId,     // Get role ID
    hasRole,           // Check specific role
    isAuthenticated,   // Check auth status
    getUserInfo        // Get structured user info
  } = useStore();
  
  // Usage examples
  const isAdmin = hasRole('Admin Labkesda');
  const isLoggedIn = isAuthenticated();
  const roleName = getUserRoleName();
}
```

---

## 📞 Support

Jika ada pertanyaan atau issue terkait implementasi role-based access control, silakan hubungi tim development.
