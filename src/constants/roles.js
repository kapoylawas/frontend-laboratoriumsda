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
  }
};

/**
 * Helper function to check if user has specific role by ID
 * @param {Object} user - User object from store
 * @param {Number} roleId - Role ID to check
 * @returns {Boolean}
 */
export const hasRoleId = (user, roleId) => {
  return user?.role_id === roleId;
};

/**
 * Helper function to check if user has specific role by name
 * @param {Object} user - User object from store
 * @param {String} roleName - Role name to check
 * @returns {Boolean}
 */
export const hasRoleName = (user, roleName) => {
  return user?.role?.name === roleName;
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
  return hasRoleId(user, ROLES.ADMIN_LABKESDA.id);
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

/**
 * Helper function to check if user can access Hasil menu
 * (Admin Labkesda, Analisis, Verifikator, or Kepala role)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessHasil = (user) => {
  return isAdmin(user) || isAnalisis(user) || isVerifikator(user) || isKepala(user);
};

/**
 * Helper function to check if user can access Penjadwalan menu
 * (Admin Labkesda only)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessPenjadwalan = (user) => {
  return isAdmin(user);
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
 * (Orders, Cart, History) - Admin Labkesda and Pemohon
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessOperationalMenus = (user) => {
  return isAdmin(user) || isPemohon(user);
};

/**
 * Helper function to check if user can access Penawaran menu
 * (Admin, Pemohon, Analis - NOT Verifikator or Kepala)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessPenawaran = (user) => {
  return !isVerifikator(user) && !isKepala(user);
};

/**
 * Helper function to check if user can access Berita Acara menu
 * (Admin, Pemohon, Analis, Kepala - NOT Verifikator)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessBeritaAcara = (user) => {
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
