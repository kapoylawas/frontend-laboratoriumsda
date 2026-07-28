import { Navigate } from 'react-router-dom';
import { useStore } from '../stores/user';
import { isAdmin } from '../constants/roles';
import PropTypes from 'prop-types';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useStore();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has admin role
  if (!isAdmin(user)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};
