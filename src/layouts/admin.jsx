//import component header
import Header from "../components/Header";

export default function admin({ children }) {
    return (
        <div className="page">
            <Header />
            <div className="page-wrapper">
                {children}
            </div>
        </div>
    )
}