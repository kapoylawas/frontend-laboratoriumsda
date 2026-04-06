# 🎯 Role-Based Access Control - Quick Start Guide

## 📋 Summary

Data user dan role **sudah tersimpan dengan baik** di Zustand Store (`/src/stores/user.js`) setelah login. Sistem RBAC (Role-Based Access Control) sudah diimplementasikan dengan lengkap.

---

## ✅ Yang Sudah Diimplementasikan

### 1. **User Store dengan Helper Functions** (`/src/stores/user.js`)
```javascript
import { useStore } from '../stores/user';

const { 
  user,              // Data user lengkap termasuk role
  getUserRoleName,   // Get role name
  getUserRoleId,     // Get role ID  
  hasRole,           // Check specific role
  isAuthenticated,   // Check auth status
  getUserInfo        // Get structured user info
} = useStore();
```

### 2. **Role Constants** (`/src/constants/roles.js`)
```javascript
import { isAdmin, ROLES } from '../constants/roles';

// Cek apakah user adalah admin
if (isAdmin(user)) {
  // Show admin features
}

// Akses role constants
console.log(ROLES.ADMIN_LABKESDA); // { id: 2, name: 'Admin Labkesda', ... }
```

### 3. **Route Protection Components**
- **ProtectedRoute**: Membutuhkan authentication
- **AdminRoute**: Membutuhkan role Admin Labkesda

### 4. **Updated Header Component**
Menu navigation otomatis menampilkan/menyembunyikan berdasarkan role user.

---

## 🚀 Cara Penggunaan

### **Di Komponen (Conditional Rendering)**

```javascript
import { useStore } from '../stores/user';
import { isAdmin } from '../constants/roles';

export default function MyComponent() {
  const { user, hasRole } = useStore();
  
  return (
    <div>
      {/* Method 1: Using helper function */}
      {hasRole('Admin Labkesda') && (
        <AdminPanel />
      )}
      
      {/* Method 2: Using constant helper */}
      {isAdmin(user) && (
        <MasterDataMenu />
      )}
      
      {/* Method 3: Direct check (not recommended) */}
      {user?.role_id === 2 && (
        <AdminFeatures />
      )}
    </div>
  );
}
```

### **Di Routes (Route Protection)**

Routes sudah dikonfigurasi di `/src/routes/index.jsx`:

```javascript
// Public route (tidak perlu login)
<Route path="/login" element={<Login />} />

// Protected route (perlu login)
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Admin route (perlu login + admin role)
<Route path="/users" element={
  <AdminRoute>
    <Users />
  </AdminRoute>
} />
```

---

## 📊 Data Flow

```
1. User Login
   ↓
2. API Response → { user: {...role...}, token: "..." }
   ↓
3. Store Updated + Cookies Set
   ↓
4. Data tersedia global via useStore()
   ↓
5. Components access data & render conditionally
```

---

## 💡 Best Practices

### ✅ **DO:**
```javascript
// 1. Gunakan helper functions
const { hasRole, isAuthenticated } = useStore();
if (hasRole('Admin Labkesda')) { ... }

// 2. Gunakan optional chaining
user?.role?.name  // ✅ Safe

// 3. Gunakan route protection components
<Route element={<AdminRoute><AdminPage /></AdminRoute>} />

// 4. Gunakan constants untuk role
import { ROLES, isAdmin } from '../constants/roles';
```

### ❌ **DON'T:**
```javascript
// 1. Jangan hardcode role_id
if (user.role_id === 2) { ... }  // ❌

// 2. Jangan akses nested tanpa checking
user.role.name  // ❌ Bisa error

// 3. Jangan manual check di setiap component
// Gunakan ProtectedRoute/AdminRoute instead
```

---

## 🔍 Testing

### Test User Data Tersimpan:
```javascript
// Di browser console setelah login:
import { useStore } from '../stores/user';
const store = useStore.getState();
console.log(store.user);       // Lihat data user
console.log(store.getUserRoleName());  // "Admin Labkesda"
console.log(store.hasRole('Admin Labkesda'));  // true
```

### Test Route Protection:
1. Login sebagai Admin → Akses semua halaman ✅
2. Login sebagai non-Admin → Coba akses /users → Redirect ke /forbidden ✅
3. Logout → Coba akses /dashboard → Redirect ke / ✅

---

## 📁 File Structure

```
src/
├── stores/
│   └── user.js                    # ✅ User store dengan helpers
├── constants/
│   └── roles.js                   # ✅ Role constants & helpers
├── components/
│   ├── ProtectedRoute.jsx         # ✅ Auth protection
│   ├── AdminRoute.jsx             # ✅ Admin role protection
│   └── Header.jsx                 # ✅ Updated with role checks
├── routes/
│   └── index.jsx                  # ✅ Refactored with protections
└── views/
    └── auth/
        └── login.jsx              # Login form
```

---

## 🎓 Contoh Lengkap

### **Contoh 1: Sidebar Menu dengan Role**
```javascript
import { useStore } from '../stores/user';
import { isAdmin } from '../constants/roles';

export default function Sidebar() {
  const { user } = useStore();
  
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/orders">Orders</Link>
      
      {/* Hanya tampil untuk Admin */}
      {isAdmin(user) && (
        <>
          <Link to="/categories">Categories</Link>
          <Link to="/sampels">Sampels</Link>
          <Link to="/users">Users Management</Link>
        </>
      )}
    </nav>
  );
}
```

### **Contoh 2: Button dengan Permission Check**
```javascript
import { useStore } from '../stores/user';

export default function UserList() {
  const { hasRole } = useStore();
  
  return (
    <div>
      <h1>Users List</h1>
      
      {/* Tombol edit hanya untuk admin */}
      {hasRole('Admin Labkesda') && (
        <button onClick={handleEdit}>Edit User</button>
      )}
    </div>
  );
}
```

### **Contoh 3: Profile Page**
```javascript
import { useStore } from '../stores/user';

export default function Profile() {
  const { getUserInfo } = useStore();
  const user = getUserInfo();
  
  return (
    <div className="profile-card">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Phone: {user.phone}</p>
      <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
    </div>
  );
}
```

---

## 🔧 Maintenance

### Menambah Role Baru:

1. **Update `/src/constants/roles.js`**:
```javascript
export const ROLES = {
  ADMIN_LABKESDA: { id: 2, name: 'Admin Labkesda', ... },
  STAFF: { id: 3, name: 'Staff Labkesda', ... },  // Add new role
};
```

2. **Tambah helper function**:
```javascript
export const isStaff = (user) => {
  return hasRoleId(user, ROLES.STAFF.id);
};
```

3. **Gunakan di komponen**:
```javascript
import { isStaff } from '../constants/roles';

{isStaff(user) && <StaffFeatures />}
```

---

## 📞 Support

Untuk pertanyaan atau issue, silakan:
1. Cek dokumentasi lengkap di `USER_STORE_USAGE.md`
2. Review contoh implementasi di `Header.jsx`
3. Hubungi tim development

---

**Last Updated**: April 6, 2026  
**Version**: 1.0.0
