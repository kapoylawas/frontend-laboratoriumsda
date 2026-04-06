# 📋 Role Analysis - Implementation Guide

## 🎯 Overview

Role **Analisis** (role_id: 3) telah ditambahkan dengan akses terbatas hanya ke menu **Hasil**.

---

## 👥 Role Permissions Matrix

| Menu/Feature | Admin Labkesda (ID: 2) | Analisis (ID: 3) | Regular User |
|--------------|------------------------|------------------|---------------|
| Dashboard    | ✅                     | ❌               | ❌            |
| Orders       | ✅                     | ❌               | ❌            |
| Cart         | ✅                     | ❌               | ❌            |
| History      | ✅                     | ❌               | ❌            |
| Invoice      | ✅                     | ❌               | ❌            |
| **Hasil**    | ✅                     | ✅               | ❌            |
| Categories   | ✅                     | ❌               | ❌            |
| Sampels      | ✅                     | ❌               | ❌            |
| Users        | ✅                     | ❌               | ❌            |

**Note:** Role Analisis hanya memiliki akses ke menu **Hasil** saja.

---

## 🔧 Implementation Details

### 1. **Role Constant Added** (`/src/constants/roles.js`)

```javascript
export const ROLES = {
  ADMIN_LABKESDA: {
    id: 2,
    name: 'Admin Labkesda',
    description: 'Administrator dengan akses penuh ke semua fitur'
  },
  ANALISIS: {
    id: 3,
    name: 'Analisis',
    description: 'Staff analisis dengan akses ke menu Hasil saja'
  }
};
```

### 2. **Helper Functions**

```javascript
// Check if user is Analisis role
export const isAnalisis = (user) => {
  return hasRoleId(user, ROLES.ANALISIS.id);
};

// Check if user can access Hasil menu (Admin OR Analisis)
export const canAccessHasil = (user) => {
  return isAdmin(user) || isAnalisis(user);
};

// Check if user can access operational menus (Orders, Cart, History)
// Only Admin Labkesda
export const canAccessOperationalMenus = (user) => {
  return isAdmin(user);
};
```

### 3. **Route Protection** (`/src/components/HasilRoute.jsx`)

```javascript
import { canAccessHasil } from '../constants/roles';

export default function HasilRoute({ children }) {
  const { isAuthenticated, user } = useStore();
  
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  if (!canAccessHasil(user)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}
```

### 4. **Route Configuration** (`/src/routes/index.jsx`)

```javascript
{/* Hasil Route - Accessible by Admin Labkesda & Analisis */}
<Route path="/hasil" element={
  <HasilRoute>
    <Hasil />
  </HasilRoute>
} />
```

### 5. **Header Menu Display** (`/src/components/Header.jsx`)

```javascript
const userCanAccessHasil = canAccessHasil(user);
const userCanAccessOperationalMenus = canAccessOperationalMenus(user);

// Menu Hasil - Show for both Admin and Analisis
{userCanAccessHasil && (
  <Link to="/hasil">HASIL</Link>
)}

// Operational Menus - Show for Admin only
{userCanAccessOperationalMenus && (
  <>
    <Link to="/orders">ORDERS</Link>
    <Link to="/cart">CART</Link>
    <Link to="/history">HISTORY</Link>
  </>
)}
```

---

## 💻 Usage Examples

### **Example 1: Check if User is Analisis**

```javascript
import { useStore } from '../stores/user';
import { isAnalisis } from '../constants/roles';

function MyComponent() {
  const { user } = useStore();
  
  if (isAnalisis(user)) {
    // Show analysis-specific features
    console.log('User is Analisis staff');
  }
}
```

### **Example 2: Conditional Rendering Based on Role**

```javascript
import { useStore } from '../stores/user';
import { isAdmin, isAnalisis } from '../constants/roles';

function Sidebar() {
  const { user } = useStore();
  
  return (
    <nav>
      {/* Visible to all authenticated users */}
      <Link to="/dashboard">Dashboard</Link>
      
      {/* Visible only to Admin */}
      {isAdmin(user) && (
        <>
          <Link to="/categories">Categories</Link>
          <Link to="/users">Users</Link>
        </>
      )}
      
      {/* Visible to Admin AND Analisis */}
      {(isAdmin(user) || isAnalisis(user)) && (
        <Link to="/hasil">Hasil</Link>
      )}
    </nav>
  );
}
```

### **Example 3: Using canAccessHasil Helper**

```javascript
import { canAccessHasil } from '../constants/roles';

function HasilButton() {
  const { user } = useStore();
  
  return (
    <div>
      {canAccessHasil(user) ? (
        <Link to="/hasil" className="btn btn-primary">
          View Results
        </Link>
      ) : (
        <p>You don't have permission to view results</p>
      )}
    </div>
  );
}
```

---

## 🧪 Testing Scenarios

### **Test Case 1: Analisis User Login**
1. Login dengan user role_id = 3 (Analisis)
2. ❌ Menu "Dashboard" tidak muncul
3. ❌ Menu "Orders" tidak muncul
4. ❌ Menu "Cart" tidak muncul
5. ❌ Menu "History" tidak muncul
6. ✅ Menu "Hasil" muncul di navigation
7. ✅ Dapat mengakses `/hasil`
8. ❌ Tidak bisa akses `/orders`, `/cart`, `/history`
9. ❌ Tidak bisa akses `/categories`, `/sampels`, `/users`
10. ❌ Menu Master Data tidak muncul

### **Test Case 2: Analisis User Access Control**
```javascript
// Di browser console setelah login sebagai Analisis:
import { useStore } from '../stores/user';
import { isAnalisis, canAccessHasil, isAdmin } from '../constants/roles';

const store = useStore.getState();
const user = store.user;

console.log(user.role_id);           // 3
console.log(user.role.name);         // "Analisis"
console.log(isAnalisis(user));       // true
console.log(isAdmin(user));          // false
console.log(canAccessHasil(user));   // true
console.log(canAccessOperationalMenus(user)); // false
```

### **Test Case 3: Route Protection**
- Akses langsung `/hasil` sebagai Analisis → ✅ Allowed
- Akses langsung `/orders` sebagai Analisis → ❌ Redirect to `/forbidden`
- Akses langsung `/cart` sebagai Analisis → ❌ Redirect to `/forbidden`
- Akses langsung `/history` sebagai Analisis → ❌ Redirect to `/forbidden`
- Akses langsung `/users` sebagai Analisis → ❌ Redirect to `/forbidden`
- Akses langsung `/categories` sebagai Analisis → ❌ Redirect to `/forbidden`

---

## 📊 User Flow Diagram

### **Admin Labkesda Flow:**
```
Login as Admin (role_id: 2)
         ↓
Store Updated with User Data
         ↓
Header Checks:
  - canAccessOperationalMenus(user) = true
  - canAccessHasil(user) = true
         ↓
All Menus Shown in Navigation
         ↓
✅ Full Access to All Features
```

### **Analisis Flow:**
```
Login as Analisis (role_id: 3)
         ↓
Store Updated with User Data
         ↓
Header Checks:
  - canAccessOperationalMenus(user) = false
  - canAccessHasil(user) = true
         ↓
Only "Hasil" Menu Shown
         ↓
User Clicks "Hasil"
         ↓
Route Protected by HasilRoute
         ↓
Check: canAccessHasil(user) = true
         ↓
✅ Access Granted - Show Hasil Page
```

---

## 🔐 Security Notes

1. **Client-side protection** sudah diimplementasikan via:
   - Route protection components
   - Conditional menu rendering
   - Helper functions

2. **Server-side validation** juga harus ada di backend API untuk memastikan keamanan penuh

3. **Token-based authentication** tetap berlaku untuk semua request

---

## 🚀 Adding More Roles in Future

Jika ingin menambahkan role baru dengan akses berbeda:

### Step 1: Add Role Constant
```javascript
// /src/constants/roles.js
export const ROLES = {
  // ... existing roles
  NEW_ROLE: {
    id: 4,
    name: 'New Role Name',
    description: 'Description here'
  }
};
```

### Step 2: Create Helper Function
```javascript
export const isNewRole = (user) => {
  return hasRoleId(user, ROLES.NEW_ROLE.id);
};

export const canAccessFeatureX = (user) => {
  return isAdmin(user) || isNewRole(user);
};
```

### Step 3: Create Route Protection (if needed)
```javascript
// /src/components/NewRoleRoute.jsx
export default function NewRoleRoute({ children }) {
  const { isAuthenticated, user } = useStore();
  
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  if (!canAccessFeatureX(user)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}
```

### Step 4: Update Routes
```javascript
<Route path="/feature-x" element={
  <NewRoleRoute>
    <FeatureXPage />
  </NewRoleRoute>
} />
```

### Step 5: Update Header/Navigation
```javascript
import { canAccessFeatureX } from '../constants/roles';

const userCanAccessFeatureX = canAccessFeatureX(user);

{userCanAccessFeatureX && (
  <Link to="/feature-x">Feature X</Link>
)}
```

---

## 📝 Summary

✅ **Role Analisis (ID: 3)** berhasil ditambahkan  
✅ **Akses terbatas** hanya ke menu Hasil  
✅ **Menu Orders, Cart, History** disembunyikan untuk Analisis  
✅ **Route protection** menggunakan AdminRoute & HasilRoute  
✅ **Menu visibility** otomatis berdasarkan role  
✅ **Helper functions** tersedia untuk conditional rendering  
✅ **Scalable** - mudah menambah role baru di masa depan  

### **Permission Summary:**
- **Admin Labkesda**: Full access ke semua menu
- **Analisis**: Hanya akses menu Hasil saja
- **Operational Menus** (Orders, Cart, History): Admin only  

---

**Last Updated**: April 6, 2026  
**Version**: 1.1.0  
**Added**: Analisis role implementation
