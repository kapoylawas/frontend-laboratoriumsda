import { Navigate } from 'react-router-dom';
import { useStore } from '../stores/user';
import { canAccessOperationalMenus } from '../constants/roles';
import PropTypes from 'prop-types';

/**
 * OperationalRoute Component
 * 
 * Wrapper component that protects routes requiring operational access.
 * Allows Admin Labkesda and Pemohon roles.
 * Redirects to forbidden page if user doesn't have required role.
 * Redirects to login page if user is not authenticated.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @returns {React.ReactNode} Protected children or redirect
 */
export default function OperationalRoute({ children }) {
  const { isAuthenticated, user } = useStore();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has operational access (Admin or Pemohon)
  if (!canAccessOperationalMenus(user)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}

OperationalRoute.propTypes = {
  children: PropTypes.node.isRequired
};
