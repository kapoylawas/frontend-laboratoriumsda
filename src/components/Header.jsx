import { useState, useEffect } from 'react';
import { useStore as useThemeStore } from '../stores/theme';
import { useStore as useUserStore } from '../stores/user';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAdmin, canAccessHasil, canAccessOperationalMenus, canAccessPenjadwalan, canAccessJadwalPengambilan } from '../constants/roles';
import "./Header.css";

export default function Header() {
    const { theme, changeTheme } = useThemeStore();
    const { user, logout } = useUserStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);

    // Check user roles using helper functions
    const userIsAdmin = isAdmin(user);
    const userCanAccessHasil = canAccessHasil(user);
    const userCanAccessOperationalMenus = canAccessOperationalMenus(user);
    const userCanAccessPenjadwalan = canAccessPenjadwalan(user);
    const userCanAccessJadwalPengambilan = canAccessJadwalPengambilan(user);

    const logoutHandler = () => {
        logout();
        navigate('/');
    };

    const isActivePath = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
        setIsMasterDataOpen(false);
    };

    const toggleMasterData = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMasterDataOpen(!isMasterDataOpen);
    };

    // Detect screen size changes
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        closeMobileMenu();
    }, [location]);

    return (
        <div className="sticky-top header-cashier">
            {/* Top Header Bar */}
            <header className="navbar navbar-expand-md navbar-cashier-main">
                <div className="container-xl">
                    {/* Brand Logo & Name */}
                    <div className="navbar-brand-wrapper">
                        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
                            <div className="brand-content">
                                <div className="logo-container">
                                    <img
                                        src="/images/laboratory.png"
                                        width="44"
                                        height="44"
                                        alt="Labkesda"
                                        className="brand-logo"
                                    />
                                    <div className="logo-glow"></div>
                                </div>
                                <div className="brand-text">
                                    <span className="brand-name">Labkesda</span>
                                    <span className="brand-tagline">Laboratorium Kesehatan Daerah</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    {isMobileView && (
                        <button
                            className={`navbar-toggler cashier-toggler ${isMobileMenuOpen ? 'active' : ''}`}
                            type="button"
                            onClick={toggleMobileMenu}
                        >
                            <span className="toggler-icon"></span>
                            <span className="toggler-icon"></span>
                            <span className="toggler-icon"></span>
                        </button>
                    )}

                    {/* Desktop Actions */}
                    {!isMobileView && (
                        <div className="navbar-actions desktop-actions">
                            {/* Theme Toggle */}
                            <div className="theme-toggle-wrapper">
                                <button
                                    onClick={changeTheme}
                                    className="theme-toggle-btn cashier-theme-toggle"
                                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    <div className="theme-icon">
                                        {theme === 'dark' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            </div>

                            {/* User Profile Dropdown */}
                            <div className="user-profile-dropdown">
                                <div className="dropdown">
                                    <button
                                        className="user-profile-btn cashier-profile-btn"
                                        data-bs-toggle="dropdown"
                                    >
                                        <div className="user-avatar">
                                            <img
                                                src="/images/boy.png"
                                                alt={user?.name}
                                                className="avatar-img"
                                            />
                                            <div className="online-indicator"></div>
                                        </div>
                                        <div className="user-info">
                                            <div className="user-name">{user?.name}</div>
                                            <div className="user-role">{user?.email}</div>
                                        </div>
                                        <div className="dropdown-arrow">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </button>
                                    <div className="dropdown-menu dropdown-menu-end cashier-dropdown">
                                        <Link to="/profile" className="dropdown-item">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                                            </svg>
                                            Profile
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button onClick={logoutHandler} className="dropdown-item logout-item">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .41.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                                                <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileView && isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
            )}

            {/* Mobile Sidebar Menu */}
            {isMobileView && (
                <div className={`mobile-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
                    <div className="mobile-sidebar-header">
                        <div className="mobile-user-info">
                            <div className="user-avatar">
                                <img
                                    src="/images/boy.png"
                                    alt={user?.name}
                                    className="avatar-img"
                                />
                                <div className="online-indicator"></div>
                            </div>
                            <div className="user-details">
                                <div className="user-name">{user?.name}</div>
                                <div className="user-email">{user?.email}</div>
                            </div>
                        </div>
                        <button className="mobile-close-btn" onClick={closeMobileMenu}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="mobile-sidebar-content">
                        {/* Mobile Search */}
                        {/* <div className="mobile-search">
                            <div className="search-wrapper cashier-search">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                                    <path d="M21 21l-6 -6" />
                                </svg>
                                <input
                                    type="text"
                                    className="search-input cashier-search-input"
                                    placeholder="Search…"
                                    aria-label="Search in website"
                                />
                            </div>
                        </div> */}

                        {/* Mobile Navigation */}
                        <nav className="mobile-nav">
                            <ul className="mobile-nav-list">
                                <li className={`mobile-nav-item ${isActivePath('/dashboard') ? 'active' : ''}`}>
                                    <Link className="mobile-nav-link" to="/dashboard" onClick={closeMobileMenu}>
                                        <div className="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                                                <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                                                <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
                                            </svg>
                                        </div>
                                        <span className="nav-label">HOME</span>
                                    </Link>
                                </li>

                                {/* Penawaran Menu - All authenticated users */}
                                <li className={`mobile-nav-item ${isActivePath('/penawaran') ? 'active' : ''}`}>
                                    <Link className="mobile-nav-link" to="/penawaran" onClick={closeMobileMenu}>
                                        <div className="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                <path d="M9 9l1 0" />
                                                <path d="M9 13l6 0" />
                                                <path d="M9 17l6 0" />
                                            </svg>
                                        </div>
                                        <span className="nav-label">PENAWARAN</span>
                                    </Link>
                                </li>

                                {/* Orders Menu - Admin Only */}
                                {userCanAccessOperationalMenus && (
                                    <li className={`mobile-nav-item ${isActivePath('/orders') ? 'active' : ''}`}>
                                        <Link className="mobile-nav-link" to="/orders" onClick={closeMobileMenu}>
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M15 19l-6 -2l-6 2v-10a6 6 0 1 1 12 0v10" />
                                                    <path d="M9 8h6" />
                                                    <path d="M9 12h6" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">ORDER</span>
                                        </Link>
                                    </li>
                                )}

                                {/* Cart Menu - Admin Only */}
                                {userCanAccessOperationalMenus && (
                                    <li className={`mobile-nav-item ${isActivePath('/cart') ? 'active' : ''}`}>
                                        <Link className="mobile-nav-link" to="/cart" onClick={closeMobileMenu}>
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                                    <path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                                    <path d="M17 17h-11v-14h-2" />
                                                    <path d="M6 5l14 1l-1 7h-13" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">CART</span>
                                        </Link>
                                    </li>
                                )}

                                {/* History Menu - Admin Only */}
                                {userCanAccessOperationalMenus && (
                                    <li className={`mobile-nav-item ${isActivePath('/history') ? 'active' : ''}`}>
                                        <Link className="mobile-nav-link" to="/history" onClick={closeMobileMenu}>
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M12 8l0 4l2 2" />
                                                    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">HISTORY</span>
                                        </Link>
                                    </li>
                                )}

                                {/* Hasil Menu - Accessible by Admin & Analisis */}
                                {userCanAccessHasil && (
                                    <li className={`mobile-nav-item ${isActivePath('/hasil') ? 'active' : ''}`}>
                                        <Link className="mobile-nav-link" to="/hasil" onClick={closeMobileMenu}>
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                    <path d="M9 15h6" />
                                                    <path d="M9 11h6" />
                                                    <path d="M9 7h4" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">HASIL</span>
                                        </Link>
                                    </li>
                                )}

                                {/* Penjadwalan Menu - Admin Only */}
                                {userCanAccessPenjadwalan && (
                                    <li className={`mobile-nav-item ${isActivePath('/penjadwalan') ? 'active' : ''}`}>
                                        <Link className="mobile-nav-link" to="/penjadwalan" onClick={closeMobileMenu}>
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M4 5h6" />
                                                    <path d="M4 11h6" />
                                                    <path d="M4 17h6" />
                                                    <path d="M14 5l6 0" />
                                                    <path d="M14 11l6 0" />
                                                    <path d="M14 17l6 0" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">JADWAL</span>
                                        </Link>
                                    </li>
                                )}

                                {/* Jadwal Pengambilan Hasil Menu - Pemohon Only */}
                                {userCanAccessJadwalPengambilan && (
                                    <li className={`mobile-nav-item ${isActivePath('/jadwal-pengambilan') ? 'active' : ''}`}>
                                        <Link className="mobile-nav-link" to="/jadwal-pengambilan" onClick={closeMobileMenu}>
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <rect x="4" y="5" width="16" height="16" rx="2" />
                                                    <line x1="16" y1="3" x2="16" y2="7" />
                                                    <line x1="8" y1="3" x2="8" y2="7" />
                                                    <line x1="4" y1="11" x2="20" y2="11" />
                                                    <line x1="11" y1="15" x2="12" y2="15" />
                                                    <line x1="12" y1="15" x2="12" y2="18" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">JADWAL PENGAMBILAN HASIL</span>
                                        </Link>
                                    </li>
                                )}


                                {userIsAdmin && (
                                    <li className={`mobile-nav-item mobile-nav-dropdown ${isMasterDataOpen ? 'open' : ''} ${isActivePath('/categories') || isActivePath('/sampels') || isActivePath('/users') ? 'active' : ''}`}>
                                        <div
                                            className="mobile-nav-link dropdown-toggle"
                                            onClick={toggleMasterData}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                                                    <path d="M12 12l8 -4.5" />
                                                    <path d="M12 12l0 9" />
                                                    <path d="M12 12l-8 -4.5" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">MASTER DATA</span>

                                        </div>
                                        <ul className={`mobile-submenu ${isMasterDataOpen ? 'active' : ''}`}>
                                            <li>
                                                <Link to="/categories" className="mobile-submenu-link" onClick={closeMobileMenu}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ marginRight: '8px' }}>
                                                        <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75zm4.196 5.954a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                    </svg>
                                                    Categories
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/sampels" className="mobile-submenu-link" onClick={closeMobileMenu}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ marginRight: '8px' }}>
                                                        <path d="M3.196 12.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.483-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 12.87z" />
                                                        <path d="M3.196 8.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.483-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 8.87z" />
                                                        <path d="M10.38 1.103a.75.75 0 00-.76 0l-7.25 4.25a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.76 0l7.25-4.25a.75.75 0 000-1.294l-7.25-4.25z" />
                                                    </svg>
                                                    Sampel
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/users" className="mobile-submenu-link" onClick={closeMobileMenu}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ marginRight: '8px' }}>
                                                        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                                                    </svg>
                                                    User
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                )}

                                {/* Mobile Actions */}
                                <li className="mobile-nav-item mobile-actions">
                                    <button onClick={changeTheme} className="mobile-action-btn">
                                        <div className="nav-icon">
                                            {theme === 'dark' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="nav-label">
                                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                        </span>
                                    </button>
                                </li>

                                <li className="mobile-nav-item">
                                    <button onClick={logoutHandler} className="mobile-nav-link logout-btn">
                                        <div className="nav-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .41.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                                                <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="nav-label">LOGOUT</span>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            {/* Desktop Navigation Menu */}
            {!isMobileView && (
                <nav className="navbar navbar-expand-md navbar-cashier-nav desktop-nav">
                    <div className="container-xl">
                        <div className="collapse navbar-collapse show">
                            <div className="navbar-nav-wrapper">
                                <ul className="navbar-nav">
                                    <li className={`nav-item ${isActivePath('/dashboard') ? 'active' : ''}`}>
                                        <Link className="nav-link cashier-nav-link" to="/dashboard">
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                                                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                                                    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">HOME</span>
                                        </Link>
                                    </li>

                                    {/* Penawaran Menu - All authenticated users */}
                                    <li className={`nav-item ${isActivePath('/penawaran') ? 'active' : ''}`}>
                                        <Link className="nav-link cashier-nav-link" to="/penawaran">
                                            <div className="nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                    <path d="M9 9l1 0" />
                                                    <path d="M9 13l6 0" />
                                                    <path d="M9 17l6 0" />
                                                </svg>
                                            </div>
                                            <span className="nav-label">PENAWARAN</span>
                                        </Link>
                                    </li>

                                    {/* Orders Menu - Admin Only */}
                                    {userCanAccessOperationalMenus && (
                                        <li className={`nav-item ${isActivePath('/orders') ? 'active' : ''}`}>
                                            <Link className="nav-link cashier-nav-link" to="/orders">
                                                <div className="nav-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path d="M15 19l-6 -2l-6 2v-10a6 6 0 1 1 12 0v10" />
                                                        <path d="M9 8h6" />
                                                        <path d="M9 12h6" />
                                                    </svg>
                                                </div>
                                                <span className="nav-label">ORDER</span>
                                            </Link>
                                        </li>
                                    )}

                                    {/* Cart Menu - Admin Only */}
                                    {userCanAccessOperationalMenus && (
                                        <li className={`nav-item ${isActivePath('/cart') ? 'active' : ''}`}>
                                            <Link className="nav-link cashier-nav-link" to="/cart">
                                                <div className="nav-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                                        <path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                                        <path d="M17 17h-11v-14h-2" />
                                                        <path d="M6 5l14 1l-1 7h-13" />
                                                    </svg>
                                                </div>
                                                <span className="nav-label">CART</span>
                                            </Link>
                                        </li>
                                    )}

                                    {/* History Menu - Admin Only */}
                                    {userCanAccessOperationalMenus && (
                                        <li className={`nav-item ${isActivePath('/history') ? 'active' : ''}`}>
                                            <Link className="nav-link cashier-nav-link" to="/history">
                                                <div className="nav-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path d="M12 8l0 4l2 2" />
                                                        <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                                                    </svg>
                                                </div>
                                                <span className="nav-label">HISTORY</span>
                                            </Link>
                                        </li>
                                    )}

                                    {/* Hasil Menu - Accessible by Admin & Analisis */}
                                    {userCanAccessHasil && (
                                        <li className={`nav-item ${isActivePath('/hasil') ? 'active' : ''}`}>
                                            <Link className="nav-link cashier-nav-link" to="/hasil">
                                                <div className="nav-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                                        <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                                        <path d="M9 15h6" />
                                                        <path d="M9 11h6" />
                                                        <path d="M9 7h4" />
                                                    </svg>
                                                </div>
                                                <span className="nav-label">HASIL</span>
                                            </Link>
                                        </li>
                                    )}

                                    {/* Penjadwalan Menu - Admin Only */}
                                    {userCanAccessPenjadwalan && (
                                        <li className={`nav-item ${isActivePath('/penjadwalan') ? 'active' : ''}`}>
                                            <Link className="nav-link cashier-nav-link" to="/penjadwalan">
                                                <div className="nav-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path d="M4 5h6" />
                                                        <path d="M4 11h6" />
                                                        <path d="M4 17h6" />
                                                        <path d="M14 5l6 0" />
                                                        <path d="M14 11l6 0" />
                                                        <path d="M14 17l6 0" />
                                                    </svg>
                                                </div>
                                                <span className="nav-label">JADWAL</span>
                                            </Link>
                                        </li>
                                    )}

                                    {/* Jadwal Pengambilan Hasil Menu - Pemohon Only */}
                                    {userCanAccessJadwalPengambilan && (
                                        <li className={`nav-item ${isActivePath('/jadwal-pengambilan') ? 'active' : ''}`}>
                                            <Link className="nav-link cashier-nav-link" to="/jadwal-pengambilan">
                                                <div className="nav-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <rect x="4" y="5" width="16" height="16" rx="2" />
                                                        <line x1="16" y1="3" x2="16" y2="7" />
                                                        <line x1="8" y1="3" x2="8" y2="7" />
                                                        <line x1="4" y1="11" x2="20" y2="11" />
                                                        <line x1="11" y1="15" x2="12" y2="15" />
                                                        <line x1="12" y1="15" x2="12" y2="18" />
                                                    </svg>
                                                </div>
                                                <span className="nav-label">JADWAL PENGAMBILAN HASIL</span>
                                            </Link>
                                        </li>
                                    )}

                                    {/* Master Data Dropdown - Admin Only */}
                                    {userIsAdmin && (
                                        <li className={`nav-item dropdown ${isActivePath('/categories') || isActivePath('/sampels') || isActivePath('/users') ? 'active' : ''}`}>
                                            <button className="nav-link cashier-nav-link dropdown-toggle" data-bs-toggle="dropdown">
                                                <div className="nav-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                                                        <path d="M12 12l8 -4.5" />
                                                        <path d="M12 12l0 9" />
                                                        <path d="M12 12l-8 -4.5" />
                                                    </svg>
                                                </div>
                                                <span className="nav-label">MASTER</span>
                                            </button>
                                            <div className="dropdown-menu cashier-dropdown">
                                                <Link className="dropdown-item" to="/categories">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75zm4.196 5.954a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                    </svg>
                                                    Categories
                                                </Link>
                                                <Link className="dropdown-item" to="/sampels">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M3.196 12.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.483-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 12.87z" />
                                                        <path d="M3.196 8.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.483-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 8.87z" />
                                                        <path d="M10.38 1.103a.75.75 0 00-.76 0l-7.25 4.25a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.76 0l7.25-4.25a.75.75 0 000-1.294l-7.25-4.25z" />
                                                    </svg>
                                                    Sampel
                                                </Link>
                                                <Link className="dropdown-item" to="/users">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                                                    </svg>
                                                    User
                                                </Link>
                                                <div className="dropdown-divider"></div>
                                                <Link className="dropdown-item" to="/semua-penawaran">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                    Semua Penawaran
                                                </Link>
                                            </div>
                                        </li>
                                    )}
                                </ul>

                                {/* Desktop Search */}
                                {/* <div className="nav-search">
                                    <div className="search-wrapper cashier-search">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                                            <path d="M21 21l-6 -6" />
                                        </svg>
                                        <input
                                            type="text"
                                            className="search-input cashier-search-input"
                                            placeholder="Search…"
                                            aria-label="Search in website"
                                        />
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </nav>
            )}
        </div>
    );
}