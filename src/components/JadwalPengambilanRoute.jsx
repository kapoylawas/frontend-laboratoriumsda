import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useStore } from '../stores/user';
import { canAccessJadwalPengambilan } from '../constants/roles';

export default function JadwalPengambilanRoute({ children }) {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessJadwalPengambilan(user)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}

JadwalPengambilanRoute.propTypes = {
  children: PropTypes.node.isRequired
};
