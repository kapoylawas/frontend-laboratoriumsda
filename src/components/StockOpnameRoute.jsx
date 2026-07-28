import { Navigate } from 'react-router-dom';
import { useStore as useUserStore } from '../stores/user';
import { canAccessStockOpname } from '../constants/roles';

export default function StockOpnameRoute({ children }) {
    const { user } = useUserStore();

    if (!canAccessStockOpname(user)) {
        return <Navigate to="/forbidden" replace />;
    }

    return children;
}
