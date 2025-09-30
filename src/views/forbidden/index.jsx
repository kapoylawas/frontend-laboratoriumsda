import { useNavigate } from "react-router-dom";
import { FaLock, FaArrowLeft, FaHome } from "react-icons/fa";
import "./forbidden.css"; // File CSS terpisah

const Forbidden = () => {
    const navigate = useNavigate();

    return (
        <div className="forbidden-container">
            <div className="forbidden-card">
                {/* Header */}
                <div className="forbidden-header">
                    <div className="forbidden-icon-wrapper">
                        <FaLock className="forbidden-icon" />
                    </div>
                    <h1>Access Restricted</h1>
                    <p>Error 403 - Forbidden</p>
                </div>

                {/* Content */}
                <div className="forbidden-content">
                    <p className="forbidden-message">
                        You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
                    </p>

                    <div className="forbidden-buttons">
                        <button
                            onClick={() => navigate(-1)}
                            className="forbidden-btn back-btn"
                        >
                            <FaArrowLeft className="btn-icon" />
                            Go Back
                        </button>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="forbidden-btn home-btn"
                        >
                            <FaHome className="btn-icon" />
                            Dashboard
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="forbidden-footer">
                    <a href="#">Help Center</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Contact Support</a>
                </div>
            </div>
        </div>
    );
};

export default Forbidden;