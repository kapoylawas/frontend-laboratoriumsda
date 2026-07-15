import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore as useUserStore } from "../../stores/user";
import { useStore as useThemeStore } from "../../stores/theme";
import {
  IconSearch,
  IconSun,
  IconMoon,
  IconFlask,
  IconDroplet,
  IconPaperBag,
  IconWind,
  IconLeaf,
  IconActivity,
  IconBiohazard,
  IconCalendar,
  IconAward,
  IconShieldCheck,
  IconDownload,
  IconLayoutDashboard,
  IconLogin,
  IconUserPlus,
  IconMapPin,
  IconPhone,
  IconMail,
  IconClock
} from "@tabler/icons-react";
import "./landing.css";

// Sample test data for the grid
const SERVICES_DATA = [
  {
    id: 1,
    category: "air",
    title: "Uji Kualitas Air",
    description: "Pengujian parameter fisika, kimia, dan biologi untuk kualitas air bersih, air minum, maupun air limbah industri.",
    parameters: ["Kandungan pH", "Total Dissolved Solids (TDS)", "Kadar Logam (Fe, Mn, Pb)", "Bakteri E. Coli"],
    price: "Rp 150.000 - Rp 450.000",
    badge: "Terakreditasi KAN",
    icon: IconDroplet
  },
  {
    id: 2,
    category: "makanan",
    title: "Uji Makanan & Minuman",
    description: "Uji kelayakan konsumsi, nilai gizi, cemaran mikroba, serta keberadaan bahan pengawet berbahaya.",
    parameters: ["Uji Boraks & Formalin", "Nilai Karbohidrat & Protein", "Uji Bakteri Salmonella", "Uji Angka Lempeng Total"],
    price: "Rp 200.000 - Rp 600.000",
    badge: "Terpopuler",
    icon: IconPaperBag
  },
  {
    id: 3,
    category: "lingkungan",
    title: "Uji Udara & Kebisingan",
    description: "Pemeriksaan kualitas udara ambien, emisi gas buang, tingkat kebisingan, serta getaran lingkungan industri.",
    parameters: ["Kadar CO, SO2, NO2", "Partikulat (PM2.5 / PM10)", "Tingkat Desibel Kebisingan", "Emisi Cerobong Pabrik"],
    price: "Rp 350.000 - Rp 950.000",
    badge: "Sertifikasi Industri",
    icon: IconWind
  },
  {
    id: 4,
    category: "tanah",
    title: "Uji Kesuburan Tanah",
    description: "Analisis hara makro dan mikro tanah untuk pertanian, serta deteksi cemaran logam berat pada area tambang.",
    parameters: ["Kadar Nitrogen, Fosfor, Kalium", "Kandungan Organik & pH", "Logam Berat (Cd, Hg)", "Tekstur & Struktur Tanah"],
    price: "Rp 180.000 - Rp 400.000",
    badge: "Rekomendasi Petani",
    icon: IconLeaf
  },
  {
    id: 5,
    category: "medis",
    title: "Pemeriksaan Medis/Klinis",
    description: "Pemeriksaan sampel klinis urine, darah, parasitologi, imunologi untuk penegakan diagnosis kesehatan umum.",
    parameters: ["Profil Lipid (Kolesterol)", "Kadar Gula Darah", "Analisis Urine Lengkap", "Deteksi Antigen & Antibodi"],
    price: "Rp 50.000 - Rp 250.000",
    badge: "Klinik & Umum",
    icon: IconActivity
  },
  {
    id: 6,
    category: "toksikologi",
    title: "Uji Toksikologi & Residu",
    description: "Deteksi residu pestisida pada produk pertanian, logam berat pada biota air, serta skrining zat psikotropika.",
    parameters: ["Residu Organofosfat", "Residu Logam Merkuri", "Skrining Narkoba (5 Parameter)", "Uji Toksisitas Akut"],
    price: "Rp 300.000 - Rp 800.000",
    badge: "Keamanan Pangan",
    icon: IconBiohazard
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  
  // Stores
  const { isAuthenticated, user } = useUserStore();
  const { theme, changeTheme } = useThemeStore();
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");

  // Handle Tag click
  const handleTagClick = (tagText) => {
    setSearchQuery(tagText);
    setSelectedCategory("semua");
  };

  // Filter logic
  const filteredServices = useMemo(() => {
    return SERVICES_DATA.filter((service) => {
      const matchesCategory = selectedCategory === "semua" || service.category === selectedCategory;
      const matchesSearch =
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.parameters.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Action helper when user clicks 'Ajukan Uji'
  const handleActionClick = () => {
    if (isAuthenticated()) {
      navigate("/penawaran/create");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="landing-wrapper">
      {/* Background Animated Particles */}
      <div className="particles-bg">
        <div className="particle p-1"></div>
        <div className="particle p-2"></div>
        <div className="particle p-3"></div>
        <div className="particle p-4"></div>
      </div>

      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg sticky-top landing-navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <div className="navbar-brand-logo-wrapper">
              <img
                src="/images/laboratory.png"
                width="34"
                height="34"
                alt="Logo Labkesda"
              />
              <div className="navbar-logo-glow"></div>
            </div>
            <div>
              <span className="brand-text-main">Labkesda</span>
              <span className="brand-text-sub">Kabupaten Sidoarjo</span>
            </div>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#landingNavbarContent"
            aria-controls="landingNavbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="landingNavbarContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link landing-nav-link" href="#beranda">Beranda</a>
              </li>
              <li className="nav-item">
                <a className="nav-link landing-nav-link" href="#layanan">Layanan Uji</a>
              </li>
              <li className="nav-item">
                <a className="nav-link landing-nav-link" href="#cara-kerja">Cara Kerja</a>
              </li>
              <li className="nav-item">
                <a className="nav-link landing-nav-link" href="#akreditasi">Akreditasi</a>
              </li>
            </ul>

            <div className="d-flex align-items-center">
              {/* Theme Toggle Button */}
              <button
                onClick={changeTheme}
                className="btn btn-link text-decoration-none me-3 p-1 text-secondary"
                title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                style={{ border: "none", background: "none" }}
              >
                {theme === "dark" ? <IconSun size={22} className="text-warning" /> : <IconMoon size={22} className="text-primary" />}
              </button>

              {isAuthenticated() ? (
                <Link to="/dashboard" className="btn btn-nav-dashboard d-flex align-items-center gap-2">
                  <IconLayoutDashboard size={18} />
                  <span>Ke Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-nav-login d-flex align-items-center gap-2">
                    <IconLogin size={18} />
                    <span>Masuk</span>
                  </Link>
                  <Link to="/register" className="btn btn-nav-register d-flex align-items-center gap-2">
                    <IconUserPlus size={18} />
                    <span>Daftar</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            {/* Left Info Text */}
            <div className="col-lg-6 mb-5 mb-lg-0">
              <h1 className="hero-title">
                <span className="hero-title-gradient">Uji Sampel Laboratorium</span>
                <br />Secara Cepat, Transparan & Akurat
              </h1>
              <p className="hero-description">
                Selamat datang di platform digital resmi Labkesda Sidoarjo. Kami menyediakan berbagai jenis layanan pengujian mutu air, pangan, udara, tanah, dan uji klinis dengan standar KAN ISO/IEC 17025. Ajukan penawaran, atur jadwal, dan pantau status sampel Anda secara realtime.
              </p>

              {/* Trakteer-style search bar */}
              <div className="hero-search-container">
                <div className="hero-search-wrapper">
                  <div className="hero-search-icon">
                    <IconSearch size={22} />
                  </div>
                  <input
                    type="text"
                    className="hero-search-input"
                    placeholder="Cari jenis pengujian (misal: Air Bersih, Logam, Bakteri)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="hero-search-button">Cari Uji</button>
                </div>
                <div className="hero-search-popular mt-2">
                  <span>Populer:</span>
                  <button className="btn btn-link p-0 popular-tag" onClick={() => handleTagClick("Air Bersih")}>Uji Air Bersih</button>
                  <button className="btn btn-link p-0 popular-tag" onClick={() => handleTagClick("Formalin")}>Uji Formalin</button>
                  <button className="btn btn-link p-0 popular-tag" onClick={() => handleTagClick("Narkoba")}>Skrining Narkoba</button>
                </div>
              </div>
            </div>

            {/* Right Graphic Section */}
            <div className="col-lg-6 hero-graphic-wrapper">
              <div className="hero-graphic-circle"></div>
              {/* Lab card illustration */}
              <div className="glass-lab-card">
                <div className="lab-card-header">
                  <div className="d-flex align-items-center gap-2">
                    <IconFlask className="text-primary" size={24} />
                    <span className="lab-card-title">Status Uji Aktif</span>
                  </div>
                  <span className="lab-card-badge">Proses Pengujian</span>
                </div>
                <div className="mb-3">
                  <label className="text-secondary small d-block">ID Pengajuan</label>
                  <strong className="text-body">LKS-2026-0715001</strong>
                </div>
                <div className="mb-4">
                  <label className="text-secondary small d-block">Estimasi Selesai</label>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <IconClock size={16} className="text-info" />
                    <span className="fw-semibold text-body">17 Juli 2026 (2 Hari)</span>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-end pt-3 border-top border-light-subtle">
                  <div>
                    <span className="text-secondary small d-block">Akurasi Mutu</span>
                    <strong className="text-success text-opacity-75">✓ 99.9% Terkalibrasi</strong>
                  </div>
                  <div className="text-end">
                    <span className="text-secondary small d-block">Sertifikasi</span>
                    <strong className="text-body">ISO/IEC 17025</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Summary Section */}
      <section className="stats-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-3 col-sm-6">
              <div className="stat-box">
                <div className="stat-icon">
                  <IconFlask />
                </div>
                <div className="stat-number">12.500+</div>
                <div className="stat-label">Sampel Teruji</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-box">
                <div className="stat-icon">
                  <IconAward />
                </div>
                <div className="stat-number">60+</div>
                <div className="stat-label">Parameter Uji</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-box">
                <div className="stat-icon">
                  <IconShieldCheck />
                </div>
                <div className="stat-number">100%</div>
                <div className="stat-label">Terakreditasi KAN</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-box">
                <div className="stat-icon">
                  <IconClock />
                </div>
                <div className="stat-number">24-48 Jam</div>
                <div className="stat-label">Proses Rata-rata</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="cara-kerja" className="steps-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-tagline">Prosedur Digital</span>
            <h2 className="section-title">Cara Kerja Pengajuan Layanan</h2>
          </div>

          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <div className="step-card">
                <div className="step-badge">1</div>
                <div className="step-icon-box">
                  <IconUserPlus />
                </div>
                <h3 className="step-title">Ajukan Penawaran</h3>
                <p className="step-desc">
                  Daftar akun pemohon, pilih kategori uji, tentukan jumlah sampel, dan ajukan penawaran harga secara online.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="step-card">
                <div className="step-badge">2</div>
                <div className="step-icon-box">
                  <IconCalendar />
                </div>
                <h3 className="step-title">Kirimkan Sampel</h3>
                <p className="step-desc">
                  Kirim sampel fisik Anda ke kantor kami atau jadwalkan pengambilan sampel oleh kurir resmi laboratorium kami.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="step-card">
                <div className="step-badge">3</div>
                <div className="step-icon-box">
                  <IconFlask />
                </div>
                <h3 className="step-title">Analisis Lab</h3>
                <p className="step-desc">
                  Sampel diuji oleh analis ahli kami menggunakan instrumen mutakhir dengan kepatuhan kalibrasi tinggi.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="step-card">
                <div className="step-badge">4</div>
                <div className="step-icon-box">
                  <IconDownload />
                </div>
                <h3 className="step-title">Dapatkan Hasil</h3>
                <p className="step-desc">
                  Unduh Berita Acara hasil pengujian, tanda tangan digital resmi, dan sertifikat laporan langsung di dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Services Grid with Category Filter Tabs (Trakteer style filter) */}
      <section id="layanan" className="explore-section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-tagline">Katalog Layanan</span>
            <h2 className="section-title">Kategori Layanan Laboratorium</h2>
          </div>

          {/* Interactive filter tabs */}
          <div className="filter-tabs-container">
            <button
              className={`filter-pill-btn ${selectedCategory === "semua" ? "active" : ""}`}
              onClick={() => setSelectedCategory("semua")}
            >
              Semua Layanan
            </button>
            <button
              className={`filter-pill-btn ${selectedCategory === "air" ? "active" : ""}`}
              onClick={() => setSelectedCategory("air")}
            >
              Uji Air
            </button>
            <button
              className={`filter-pill-btn ${selectedCategory === "makanan" ? "active" : ""}`}
              onClick={() => setSelectedCategory("makanan")}
            >
              Makanan & Minuman
            </button>
            <button
              className={`filter-pill-btn ${selectedCategory === "lingkungan" ? "active" : ""}`}
              onClick={() => setSelectedCategory("lingkungan")}
            >
              Udara & Lingkungan
            </button>
            <button
              className={`filter-pill-btn ${selectedCategory === "tanah" ? "active" : ""}`}
              onClick={() => setSelectedCategory("tanah")}
            >
              Tanah & Pupuk
            </button>
            <button
              className={`filter-pill-btn ${selectedCategory === "medis" ? "active" : ""}`}
              onClick={() => setSelectedCategory("medis")}
            >
              Pemeriksaan Klinis
            </button>
            <button
              className={`filter-pill-btn ${selectedCategory === "toksikologi" ? "active" : ""}`}
              onClick={() => setSelectedCategory("toksikologi")}
            >
              Toksikologi
            </button>
          </div>

          {/* Grid display */}
          <div className="row g-4">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div className="col-lg-4 col-md-6" key={service.id}>
                    <div className="service-card">
                      <div className="service-card-header">
                        <div className="service-icon-wrapper">
                          <IconComponent size={24} />
                        </div>
                        <div>
                          <h3 className="service-card-title">{service.title}</h3>
                        </div>
                        <span className="service-card-tag">{service.badge}</span>
                      </div>
                      <div className="service-card-body">
                        <p className="service-card-desc">{service.description}</p>

                        <div className="mb-4">
                          <h4 className="service-parameters-title">Parameter Uji Utama</h4>
                          <ul className="service-parameters-list">
                            {service.parameters.map((p, index) => (
                              <li key={index}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="service-price-wrapper">
                          <div>
                            <span className="service-price-label">Estimasi Biaya</span>
                            <span className="service-price-amount">{service.price}</span>
                          </div>
                          <button
                            onClick={handleActionClick}
                            className="btn btn-service-action d-flex align-items-center gap-1"
                          >
                            <span>Ajukan Uji</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12 text-center py-5">
                <IconFlask size={48} className="text-secondary opacity-50 mb-3" />
                <p className="text-secondary fs-5">Layanan pengujian tidak ditemukan.</p>
                <button
                  className="btn btn-outline-primary rounded-pill px-4 mt-2"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("semua");
                  }}
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Accreditation Badge & Assurance Section */}
      <section id="akreditasi" className="accreditation-section text-center">
        <div className="container">
          <div className="accreditation-card">
            <div className="section-title-wrapper mb-4">
              <span className="section-tagline">Jaminan Mutu</span>
              <h2 className="section-title">Akreditasi & Standarisasi Internasional</h2>
            </div>
            
            <div className="accreditation-logo-wrapper">
              <div className="accreditation-logo-container">
                <strong className="fs-4 text-danger">KAN</strong>
              </div>
              <div className="accreditation-logo-container">
                <span className="fs-5 fw-bold text-primary">LP-1234-IDN</span>
              </div>
              <div className="accreditation-logo-container">
                <span className="fs-5 fw-semibold text-secondary">ISO/IEC 17025</span>
              </div>
            </div>

            <p className="accreditation-text">
              Seluruh pengujian laboratorium di Labkesda Kabupaten Sidoarjo dikerjakan oleh analis profesional yang tersertifikasi secara nasional. Sistem manajemen mutu kami telah terakreditasi oleh Komite Akreditasi Nasional (KAN) untuk memastikan setiap hasil pengujian valid, dapat dipertanggungjawabkan secara hukum, dan diterima secara internasional.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Block */}
      <section className="cta-bottom-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-box-glow"></div>
            <h2 className="cta-title">Siap Menguji Sampel Anda?</h2>
            <p className="cta-desc">
              Daftar akun pemohon Anda sekarang untuk menikmati kemudahan pengajuan dokumen penawaran digital, pelacakan proses sampel otomatis, dan pengambilan hasil uji secara praktis.
            </p>
            <button onClick={handleActionClick} className="btn-cta-bottom">
              {isAuthenticated() ? "Buat Pengajuan Sekarang" : "Daftar Akun Labkesda"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="footer-brand d-flex align-items-center gap-2 mb-3">
                <img
                  src="/images/laboratory.png"
                  width="36"
                  height="36"
                  alt="Logo Labkesda"
                />
                <span className="fs-5 fw-bold text-body">Labkesda Sidoarjo</span>
              </div>
              <p className="footer-desc">
                Laboratorium Kesehatan Daerah (Labkesda) Kabupaten Sidoarjo berkomitmen memberikan pelayanan pengujian laboratorium yang profesional, akurat, dan terpercaya bagi masyarakat umum maupun instansi industri.
              </p>
            </div>

            <div className="col-lg-2 col-md-6 col-6">
              <h3 className="footer-section-title">Layanan</h3>
              <ul className="footer-links">
                <li><button className="btn btn-link p-0 text-start" onClick={() => setSelectedCategory("air")}>Uji Air Bersih</button></li>
                <li><button className="btn btn-link p-0 text-start" onClick={() => setSelectedCategory("makanan")}>Uji Pangan & Gizi</button></li>
                <li><button className="btn btn-link p-0 text-start" onClick={() => setSelectedCategory("lingkungan")}>Uji Kualitas Udara</button></li>
                <li><button className="btn btn-link p-0 text-start" onClick={() => setSelectedCategory("medis")}>Pemeriksaan Medis</button></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-6 col-6">
              <h3 className="footer-section-title">Navigasi</h3>
              <ul className="footer-links">
                <li><a href="#beranda">Beranda</a></li>
                <li><a href="#layanan">Layanan Uji</a></li>
                <li><a href="#cara-kerja">Cara Kerja</a></li>
                <li><a href="#akreditasi">Akreditasi</a></li>
              </ul>
            </div>

            <div className="col-lg-4 col-md-6">
              <h3 className="footer-section-title">Kontak & Lokasi</h3>
              <ul className="footer-links">
                <li className="d-flex align-items-start gap-2">
                  <IconMapPin size={20} className="text-primary mt-1" />
                  <span>Jl. Raya Magersari No. 12, Sidoarjo, Jawa Timur, Indonesia</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <IconPhone size={18} className="text-primary" />
                  <span>(031) 894-1234 / 894-5678</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <IconMail size={18} className="text-primary" />
                  <span>info@labkesda.sidoarjokab.go.id</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <IconClock size={18} className="text-primary" />
                  <span>Senin - Jumat: 08:00 - 15:00 WIB</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom text-center">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Unit Pelaksana Teknis Laboratorium Kesehatan Daerah Kabupaten Sidoarjo. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
