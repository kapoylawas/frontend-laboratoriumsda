//import component header
import Header from "../components/Header";
import "../responsive.css";

export default function admin({ children }) {
    return (
        <div className="page" style={{ minWidth: 0, overflowX: 'hidden' }}>
            <Header />
            <div className="page-wrapper" style={{ overflowX: 'hidden', minWidth: 0 }}>
                {children}
            </div>
        </div>
    )
}