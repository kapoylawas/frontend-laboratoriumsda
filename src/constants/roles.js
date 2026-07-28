/**
 * User Role Constants
 * 
 * Centralized role definitions for consistent role-based access control
 * throughout the application.
 */

export const ROLES = {
  PEMOHON: {
    id: 1,
    name: 'Pemohon',
    description: 'User pemohon yang mengajukan permintaan pengujian'
  },
  ADMIN_LABKESDA: {
    id: 2,
    name: 'Admin Labkesda',
    description: 'Administrator dengan akses penuh ke semua fitur'
  },
  ANALISIS: {
    id: 3,
    name: 'Analisis',
    description: 'Staff analisis dengan akses ke menu Hasil'
  },
  VERIFIKATOR: {
    id: 4,
    name: 'Verifikator',
    description: 'Verifikator hasil laboratorium'
  },
  KEPALA_LABKESDA: {
    id: 5,
    name: 'Kepala Labkesda',
    description: 'Kepala Labkesda untuk persetujuan akhir & TTD elektronik'
  },
  SANITARIAN: {
    id: 6,
    name: 'Sanitarian',
    description: 'Petugas Sanitarian dengan akses ke menu Hasil untuk input & kirim verifikasi'
  },
  ADMIN_STOCK: {
    id: 7,
    name: 'admin-stock',
    description: 'Petugas Pengelola Stok Reagen & BMHP'
  }
};

/**
 * Helper function to check if user has specific role by ID
 * @param {Object} user - User object from store
 * @param {Number} roleId - Role ID to check
 * @returns {Boolean}
 */
export const hasRoleId = (user, roleId) => {
  return user?.role_id === roleId || user?.role?.id === roleId;
};

/**
 * Helper function to check if user has specific role by name
 * @param {Object} user - User object from store
 * @param {String} roleName - Role name to check
 * @returns {Boolean}
 */
export const hasRoleName = (user, roleName) => {
  return user?.role?.name === roleName || user?.role_name === roleName;
};

/**
 * Helper function to check if user is pemohon
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const isPemohon = (user) => {
  return hasRoleId(user, ROLES.PEMOHON.id);
};

/**
 * Helper function to check if user is admin
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const isAdmin = (user) => {
  return hasRoleId(user, ROLES.ADMIN_LABKESDA.id) ||
         hasRoleName(user, 'Admin Labkesda');
};

/**
 * Helper function to check if user is analysis staff
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const isAnalisis = (user) => {
  return hasRoleId(user, ROLES.ANALISIS.id);
};

export const isVerifikator = (user) => {
  return hasRoleId(user, ROLES.VERIFIKATOR.id);
};

export const isKepala = (user) => {
  return hasRoleId(user, ROLES.KEPALA_LABKESDA.id);
};

export const isSanitarian = (user) => {
  return hasRoleId(user, ROLES.SANITARIAN.id) || hasRoleName(user, 'Sanitarian') || user?.role?.name?.toLowerCase()?.includes('sanitarian');
};

export const isAdminStock = (user) => {
  return hasRoleId(user, ROLES.ADMIN_STOCK.id) ||
         hasRoleName(user, 'admin-stock') ||
         hasRoleName(user, 'Admin Stock') ||
         user?.role?.name?.toLowerCase()?.includes('stock');
};

/**
 * Helper function to check if user can access Stock Opname menu
 * (Admin Stock, Admin Labkesda, Analisis, or Kepala role)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessStockOpname = (user) => {
  return isAdminStock(user) || isAdmin(user) || isAnalisis(user) || isKepala(user);
};

/**
 * Helper function to check if user can access Hasil menu
 * (Admin Labkesda, Analisis, Verifikator, Kepala, or Sanitarian role - NOT Admin Stock)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessHasil = (user) => {
  if (isAdminStock(user)) return false;
  return isAdmin(user) || isAnalisis(user) || isVerifikator(user) || isKepala(user) || isSanitarian(user);
};

/**
 * Helper function to check if user can access Penjadwalan menu
 * (Admin Labkesda only)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessPenjadwalan = (user) => {
  return isAdmin(user) && !isAdminStock(user);
};

/**
 * Helper function to check if user can access Jadwal Pengambilan Hasil menu
 * (Pemohon only)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessJadwalPengambilan = (user) => {
  return isPemohon(user);
};

/**
 * Helper function to check if user can access operational menus
 * (Orders, Cart, History) - Admin Labkesda and Pemohon (NOT Admin Stock)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessOperationalMenus = (user) => {
  if (isAdminStock(user)) return false;
  return isAdmin(user) || isPemohon(user);
};

/**
 * Helper function to check if user can access Penawaran menu
 * (Admin Labkesda, Pemohon, Analis - NOT Verifikator, Kepala, or Admin Stock)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessPenawaran = (user) => {
  if (isAdminStock(user)) return false;
  return !isVerifikator(user) && !isKepala(user);
};

/**
 * Helper function to check if user can access Berita Acara menu
 * (Admin Labkesda, Pemohon, Analis, Kepala - NOT Verifikator or Admin Stock)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessBeritaAcara = (user) => {
  if (isAdminStock(user)) return false;
  return !isVerifikator(user);
};

/**
 * Get all available roles as array
 * @returns {Array} Array of role objects
 */
export const getAllRoles = () => {
  return Object.values(ROLES);
};

/**
 * Get role by ID
 * @param {Number} roleId - Role ID
 * @returns {Object|undefined} Role object or undefined
 */
export const getRoleById = (roleId) => {
  return Object.values(ROLES).find(role => role.id === roleId);
};

/**
 * Get role by name
 * @param {String} roleName - Role name
 * @returns {Object|undefined} Role object or undefined
 */
export const getRoleByName = (roleName) => {
  return Object.values(ROLES).find(role => role.name === roleName);
};
