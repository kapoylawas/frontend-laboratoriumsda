import { Navigate } from 'react-router-dom';
import { useStore } from '../stores/user';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute Component
 * 
 * Wrapper component that protects routes requiring authentication.
 * Redirects to login page if user is not authenticated.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} Protected children or redirect to login
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useStore();
  
  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};
