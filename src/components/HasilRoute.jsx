import { Navigate } from 'react-router-dom';
import { useStore } from '../stores/user';
import { canAccessHasil } from '../constants/roles';
import PropTypes from 'prop-types';

/**
 * HasilRoute Component
 * 
 * Wrapper component that protects routes requiring access to Hasil menu.
 * Accessible by Admin Labkesda (role_id: 2) and Analisis (role_id: 3).
 * Redirects to forbidden page if user doesn't have required role.
 * Redirects to login page if user is not authenticated.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @returns {React.ReactNode} Protected children or redirect
 */
export default function HasilRoute({ children }) {
  const { isAuthenticated, user } = useStore();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user can access Hasil (Admin or Analisis)
  if (!canAccessHasil(user)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}

HasilRoute.propTypes = {
  children: PropTypes.node.isRequired
};
