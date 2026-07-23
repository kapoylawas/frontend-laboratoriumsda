import { Navigate } from 'react-router-dom';
import { useStore } from '../stores/user';
import { canAccessBeritaAcara } from '../constants/roles';
import PropTypes from 'prop-types';

/**
 * BeritaAcaraRoute Component
 * 
 * Wrapper component that protects Berita Acara routes.
 * Accessible by all roles except Verifikator.
 */
export default function BeritaAcaraRoute({ children }) {
  const { isAuthenticated, user } = useStore();
  
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  if (!canAccessBeritaAcara(user)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}

BeritaAcaraRoute.propTypes = {
  children: PropTypes.node.isRequired
};
