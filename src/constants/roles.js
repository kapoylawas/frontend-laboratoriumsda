/**
 * User Role Constants
 * 
 * Centralized role definitions for consistent role-based access control
 * throughout the application.
 */

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
  // Tambahkan role lainnya di sini jika ada
  // Example:
  // STAFF: {
  //   id: 4,
  //   name: 'Staff Labkesda',
  //   description: 'Staff dengan akses terbatas'
  // }
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

/**
 * Helper function to check if user can access Hasil menu
 * (Admin Labkesda or Analisis role)
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessHasil = (user) => {
  return isAdmin(user) || isAnalisis(user);
};

/**
 * Helper function to check if user can access operational menus
 * (Orders, Cart, History) - Only Admin Labkesda
 * @param {Object} user - User object from store
 * @returns {Boolean}
 */
export const canAccessOperationalMenus = (user) => {
  return isAdmin(user);
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
