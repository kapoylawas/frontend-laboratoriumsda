import { Navigate } from 'react-router-dom';
import { useStore } from '../stores/user';
import PropTypes from 'prop-types';

/**
 * AdminRoute Component
 * 
 * Wrapper component that protects routes requiring admin role.
 * Redirects to forbidden page if user doesn't have admin role.
 * Redirects to login page if user is not authenticated.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @returns {React.ReactNode} Protected children or redirect
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, hasRole } = useStore();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has admin role
  if (!hasRole('Admin Labkesda')) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};
