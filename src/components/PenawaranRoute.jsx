import { Navigate } from 'react-router-dom';
import { useStore } from '../stores/user';
import { canAccessPenawaran } from '../constants/roles';
import PropTypes from 'prop-types';

/**
 * PenawaranRoute Component
 * 
 * Wrapper component that protects Penawaran routes.
 * Accessible by all roles except Verifikator.
 */
export default function PenawaranRoute({ children }) {
  const { isAuthenticated, user } = useStore();
  
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  if (!canAccessPenawaran(user)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}

PenawaranRoute.propTypes = {
  children: PropTypes.node.isRequired
};
