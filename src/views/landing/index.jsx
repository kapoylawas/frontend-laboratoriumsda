import React, { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore as useUserStore } from "../../stores/user";
import { useStore as useThemeStore } from "../../stores/theme";
import Swal from "sweetalert2";
import {
  IconSun,
  IconMoon,
  IconFlask,
  IconDroplet,
  IconPaperBag,
  IconWind,
  IconLeaf,
  IconActivity,
  IconBiohazard,
  IconAward,
  IconShieldCheck,
  IconLayoutDashboard,
  IconLogin,
  IconUserPlus,
  IconMapPin,
  IconPhone,
  IconMail,
  IconClock,
  IconExternalLink,
  IconRefresh,
  IconMaximize,
  IconMinimize,
  IconStar,
  IconCheck,
  IconHeart,
  IconSparkles,
  IconArrowRight,
  IconLock,
  IconSend,
  IconHelpCircle,
  IconMessageReport
} from "@tabler/icons-react";
import "./landing.css";

// Sample test data for the services catalog
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
  const { isAuthenticated } = useUserStore();
  const { theme, changeTheme } = useThemeStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");

  // Pengaduan Form State
  const [pengaduanForm, setPengaduanForm] = useState({
    nama: "",
    phone: "",
    email: "",
    kategori: "Pelayanan Sampel & Pengujian",
    pesan: ""
  });

  const handlePengaduanChange = (e) => {
    const { name, value } = e.target;
    setPengaduanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePengaduanSubmit = (e) => {
    e.preventDefault();
    if (!pengaduanForm.nama.trim() || !pengaduanForm.pesan.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Form Belum Lengkap",
        text: "Mohon isi Nama Pelapor dan Rincian Pengaduan Anda.",
        confirmButtonColor: "#e50914"
      });
      return;
    }
    Swal.fire({
      icon: "success",
      title: "Pengaduan Terkirim!",
      text: "Terima kasih. Pengaduan Anda untuk UPTD Labkesda Kab. Sidoarjo telah tercatat dan akan segera ditindaklanjuti.",
      confirmButtonColor: "#10b981"
    });
    setPengaduanForm({
      nama: "",
      phone: "",
      email: "",
      kategori: "Pelayanan Sampel & Pengujian",
      pesan: ""
    });
  };

  const IKM_URL = "https://ikm.sidoarjokab.go.id/opd/50018292";

  // Iframe states & controls
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);

  // Refresh iframe content
  const refreshIframe = () => {
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  // Toggle fullscreen mode for iframe
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Filter logic for services
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

  // Open IKM official page in a centered Popup window (bypasses X-Frame-Options SAMEORIGIN block)
  const openIKMPopup = () => {
    const width = 880;
    const height = 760;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(
      IKM_URL,
      "IKM_Sidoarjo_Portal",
      `width=${width},height=${height},top=${top > 0 ? top : 0},left=${left > 0 ? left : 0},scrollbars=yes,resizable=yes,status=yes`
    );
  };

  // State to toggle iframe fallback mode
  const [showIframe, setShowIframe] = useState(false);

  // Scroll smoothly to IKM Iframe section
  const scrollToIKM = () => {
    const el = document.getElementById("survei-ikm");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={`landing-wrapper ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      {/* Permanent Sticky Navbar at top of landing page */}
      <nav className="navbar navbar-expand-lg landing-navbar-transparent">
        <div className="container">
          <Link to="/" className="navbar-brand text-dark d-flex align-items-center gap-2">
            <div className="brand-logo-wrapper">
              <img
                src="/sidoarjo.png"
                onError={(e) => { e.target.src = "/images/laboratory.png"; }}
                width="38"
                height="44"
                alt="Logo Kab Sidoarjo"
              />
            </div>
            <div className="lh-1">
              <span className="brand-title-main">Labkesda Sidoarjo</span>
              <span className="brand-title-sub">UPT LABORATORIUM KESEHATAN DAERAH</span>
            </div>
          </Link>

          <button
            className="navbar-toggler border-dark"
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
                <a className="nav-link red-nav-link" href="#beranda">Beranda</a>
              </li>
              <li className="nav-item">
                <a className="nav-link red-nav-link fw-bold text-danger" href="#survei-ikm">
                  ⭐ Survei IKM
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link red-nav-link" href="#layanan">Layanan Uji</a>
              </li>
              <li className="nav-item">
                <a className="nav-link red-nav-link fw-bold text-danger" href="#pengaduan">
                  📢 Form Pengaduan
                </a>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={changeTheme}
                className="btn btn-red-icon"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <IconSun size={26} className="text-warning" /> : <IconMoon size={26} className="text-dark" />}
              </button>

              {isAuthenticated() ? (
                <Link to="/dashboard" className="btn btn-trakteer-white d-flex align-items-center gap-2">
                  <IconLayoutDashboard size={18} />
                  <span>Ke Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-trakteer-outline d-flex align-items-center gap-1">
                    <IconLogin size={18} />
                    <span>Masuk</span>
                  </Link>
                  <Link to="/register" className="btn btn-trakteer-white d-flex align-items-center gap-1">
                    <IconUserPlus size={18} />
                    <span>Daftar</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Trakteer Red Header Container */}
      <div className="trakteer-hero-container">
        {/* Background Dot Grid */}
        <div className="trakteer-dots-overlay"></div>

        {/* Hero Content inside Red Banner */}
        <section id="beranda" className="hero-red-content">
          <div className="container">
            <div className="row align-items-center py-4 py-md-5">
              {/* Left Column Text & Action */}
              <div className="col-lg-7 text-white mb-5 mb-lg-0">
                <div className="hero-tag-badge">
                  <IconSparkles size={16} className="text-warning me-1" />
                  <span>Survei Kepuasan Masyarakat (IKM) Sidoarjo</span>
                </div>

                <h1 className="hero-main-heading">
                  Suara &amp; Kepuasan Anda<br />
                  <span className="hero-highlight-yellow">Prioritas Utama Kami!</span>
                </h1>

                <p className="hero-main-subtext">
                  Bantu kami meningkatkan kualitas pelayanan laboratorium kesehatan daerah Kabupaten Sidoarjo. Pengisian survei IKM sangat cepat, transparan, dan langsung terhubung dengan portal resmi Pemkab Sidoarjo. Gak ribet!
                </p>

                {/* Main Action Buttons */}
                <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                  <button onClick={openIKMPopup} className="btn-trakteer-green">
                    <span>Isi Survei IKM Sekarang</span>
                    <IconExternalLink size={20} />
                  </button>

                  <a href="#cara-isi" className="btn-trakteer-glass">
                    <IconHelpCircle size={18} />
                    <span>Panduan Pengisian</span>
                  </a>
                </div>

                {/* Quick Info Badges */}
                <div className="hero-quick-stats mt-4 pt-3 border-top border-white-20 d-flex flex-wrap gap-4">
                  <div className="d-flex align-items-center gap-2">
                    <IconShieldCheck size={22} className="text-warning-glow" />
                    <div>
                      <div className="fw-bold fs-6">100% Resmi OPD</div>
                      <div className="small text-white fw-semibold">Pemkab Sidoarjo</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <IconAward size={22} className="text-warning-glow" />
                    <div>
                      <div className="fw-bold fs-6">Akreditasi KAN</div>
                      <div className="small text-white fw-semibold">ISO/IEC 17025</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <IconClock size={22} className="text-warning-glow" />
                    <div>
                      <div className="fw-bold fs-6">Hanya 2 Menit</div>
                      <div className="small text-white fw-semibold">Pengisian Mudah</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Floating Graphics (Trakteer style widget showcase) */}
              <div className="col-lg-5">
                <div className="trakteer-hero-widget-stack">
                  {/* Floating Top Badge */}
                  <div className="floating-sticker sticker-top">
                    <IconHeart className="text-danger fill-danger" size={18} />
                    <span>97.28 Sangat Baik!</span>
                  </div>

                  {/* Main Mascot / Card Box */}
                  <div className="trakteer-mascot-card">
                    <div className="mascot-card-top text-center">
                      <div className="mascot-avatar-circle">
                        <IconFlask size={38} className="text-white" />
                      </div>
                      <h3 className="mascot-card-title">IKM Labkesda Sidoarjo</h3>
                      <p className="mascot-card-sub">OPD Kode: 50018292</p>

                      <div className="rating-stars-wrapper mb-2">
                        {[...Array(5)].map((_, i) => (
                          <IconStar key={i} size={20} className="star-icon fill-gold text-gold" />
                        ))}
                      </div>

                      <div className="score-badge-large">
                        <span className="score-number">97.28</span>
                        <span className="score-label">Mutu A (Sangat Baik)</span>
                      </div>
                    </div>

                    <div className="mascot-card-bottom">
                      <div className="d-flex justify-content-between align-items-center small text-secondary">
                        <span>Total Responden:</span>
                        <strong className="text-body fw-bold">78 Responden</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center small text-secondary mt-2">
                        <span>Status UPT Lab:</span>
                        <strong className="text-success d-flex align-items-center gap-1">
                          <IconCheck size={16} /> Aktif &amp; Terbuka
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Floating Bottom Badge */}
                  <div className="floating-sticker sticker-bottom">
                    <IconCheck size={18} className="text-success" />
                    <span>Resmi ikm.sidoarjokab.go.id</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curve / Wave bottom divider */}
        <div className="trakteer-hero-curve">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 0C240 80 480 120 720 120C960 120 1200 80 1440 0V120H0V0Z"
              fill="var(--bg-main)"
            />
          </svg>
        </div>
      </div>

      {/* Main White Body Content */}
      <main className="trakteer-main-content">
        {/* Core Embedded Iframe / Portal Launcher for IKM (Survei Kepuasan Masyarakat) */}
        <section id="survei-ikm" className={`ikm-iframe-section py-5 ${isFullscreen ? "fullscreen-mode" : ""}`}>
          <div className="container">
            <div className="ikm-section-header text-center mb-4">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger-subtle text-danger fw-semibold small mb-2">
                <IconSend size={16} />
                <span>Formulir Kepuasan Pelanggan &amp; Masyarakat</span>
              </div>
              <h2 className="fw-black fs-2 text-body">
                Isi Indeks Kepuasan Masyarakat (IKM)
              </h2>
              <p className="text-secondary max-w-650 mx-auto">
                Silakan isi formulir survei resmi OPD Kabupaten Sidoarjo di bawah ini. Pendapat Anda berpengaruh langsung pada peningkatan mutu layanan kami.
              </p>
            </div>

            {/* Iframe Window Container */}
            <div className="ikm-window-card">
              {/* Window Header Bar */}
              <div className="ikm-window-header">
                <div className="window-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>

                <div className="window-url-bar d-none d-md-flex align-items-center gap-2">
                  <IconLock size={14} className="text-success" />
                  <span className="url-text">{IKM_URL}</span>
                </div>

                <div className="window-actions d-flex align-items-center gap-2">
                  <button
                    onClick={refreshIframe}
                    className="btn btn-window-action"
                    title="Muat Ulang Form"
                  >
                    <IconRefresh size={16} />
                    <span className="d-none d-sm-inline ms-1">Segarkan</span>
                  </button>

                  <button
                    onClick={openIKMPopup}
                    className="btn btn-window-action highlight-btn"
                    title="Buka Jendela Pop-up IKM"
                  >
                    <IconExternalLink size={16} />
                    <span className="ms-1">Pop-up</span>
                  </button>

                  <a
                    href={IKM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-window-action"
                    title="Buka di Tab Baru"
                  >
                    <IconExternalLink size={16} />
                    <span className="d-none d-sm-inline ms-1">Tab Baru</span>
                  </a>
                </div>
              </div>

              {/* Window Body - Direct Proxied Iframe Rendering */}
              <div className="ikm-window-body">
                {iframeLoading && (
                  <div className="iframe-loader-overlay">
                    <div className="text-center p-4">
                      <div className="spinner-border text-danger mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <h4 className="fw-bold text-body">Memuat Formulir IKM Sidoarjo...</h4>
                      <p className="text-secondary small">Menghubungkan ke ikm.sidoarjokab.go.id</p>
                    </div>
                  </div>
                )}

                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src="/ikm-proxy/opd/50018292"
                  title="Formulir Survei Indeks Kepuasan Masyarakat (IKM) OPD 50018292"
                  className="ikm-iframe-element"
                  onLoad={() => setIframeLoading(false)}
                  allow="geolocation; microphone; camera"
                ></iframe>
              </div>

              {/* Window Footer Notice */}
              <div className="ikm-window-footer d-flex flex-wrap justify-content-between align-items-center p-3 border-top bg-body-tertiary">
                <div className="d-flex align-items-center gap-2 small text-secondary">
                  <IconShieldCheck size={18} className="text-success" />
                  <span>Diselenggarakan oleh Pemkab Sidoarjo &amp; UPT Labkesda</span>
                </div>
                <div className="small text-secondary">
                  Kendala pengisian? <button onClick={openIKMPopup} className="btn btn-link p-0 text-danger fw-semibold text-decoration-none">Klik di sini untuk buka Pop-up</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Cara Pengisian Guide */}
        <section id="cara-isi" className="py-5 bg-body-tertiary">
          <div className="container py-3">
            <div className="text-center max-w-700 mx-auto mb-5">
              <span className="trakteer-subheading-tag">Mudah &amp; Cepat</span>
              <h2 className="trakteer-section-title">Tahapan Pengisian Survei IKM</h2>
              <p className="trakteer-section-desc">
                Cukup 4 langkah mudah untuk menyampaikan apresiasi dan masukan Anda bagi Labkesda Sidoarjo.
              </p>
            </div>

            <div className="row g-4">
              <div className="col-lg-3 col-md-6">
                <div className="guide-card">
                  <div className="guide-number">1</div>
                  <h3 className="guide-title">Tinjau Formulir</h3>
                  <p className="guide-desc">
                    Lihat formulir IKM Sidoarjo yang telah dimuat pada kotak area di atas.
                  </p>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="guide-card">
                  <div className="guide-number">2</div>
                  <h3 className="guide-title">Isi Data Pelanggan</h3>
                  <p className="guide-desc">
                    Isi profil singkat pemohon/masyarakat dan jenis layanan yang telah Anda terima.
                  </p>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="guide-card">
                  <div className="guide-number">3</div>
                  <h3 className="guide-title">Beri Penilaian</h3>
                  <p className="guide-desc">
                    Berikan skor penilaian kepuasan terhadap keramahan, kecepatan, serta transparansi biaya.
                  </p>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="guide-card">
                  <div className="guide-number">4</div>
                  <h3 className="guide-title">Kirimkan Survei</h3>
                  <p className="guide-desc">
                    Klik tombol kirim. Masukan Anda akan langsung tersimpan di database IKM Pemkab Sidoarjo!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Explore Services Catalog Grid */}
        <section id="layanan" className="explore-section py-5">
          <div className="container py-2">
            <div className="text-center max-w-700 mx-auto mb-5">
              <span className="trakteer-subheading-tag">Fasilitas Uji Lengkap</span>
              <h2 className="trakteer-section-title">Kategori Layanan Laboratorium</h2>
              <p className="trakteer-section-desc">
                Kami melayani pengujian laboratorium kesehatan air, makanan, udara, tanah, dan pemeriksaan medis klinis.
              </p>
            </div>

            {/* Interactive filter tabs */}
            <div className="filter-tabs-container mb-4">
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
                Makanan &amp; Minuman
              </button>
              <button
                className={`filter-pill-btn ${selectedCategory === "lingkungan" ? "active" : ""}`}
                onClick={() => setSelectedCategory("lingkungan")}
              >
                Udara &amp; Lingkungan
              </button>
              <button
                className={`filter-pill-btn ${selectedCategory === "tanah" ? "active" : ""}`}
                onClick={() => setSelectedCategory("tanah")}
              >
                Tanah &amp; Pupuk
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
                      <div className="service-card h-100">
                        <div className="service-card-header">
                          <div className="service-icon-wrapper">
                            <IconComponent size={24} />
                          </div>
                          <div>
                            <h3 className="service-card-title">{service.title}</h3>
                          </div>
                          <span className="service-card-tag">{service.badge}</span>
                        </div>
                        <div className="service-card-body d-flex flex-column justify-content-between">
                          <div>
                            <p className="service-card-desc">{service.description}</p>

                            <div className="mb-4">
                              <h4 className="service-parameters-title">Parameter Uji Utama</h4>
                              <ul className="service-parameters-list">
                                {service.parameters.map((p, index) => (
                                  <li key={index}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="service-price-wrapper pt-3 border-top">
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
                    className="btn btn-outline-danger rounded-pill px-4 mt-2"
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

        {/* Section: Formulir Pengaduan Pelayanan UPTD. Labkesda Kab. Sidoarjo (Google Form Embedded) */}
        <section id="pengaduan" className="pengaduan-section py-5 bg-body-tertiary">
          <div className="container py-3">
            <div className="max-w-900 mx-auto">
              <div className="section-title-wrapper text-center mb-4">
                <span className="trakteer-subheading-tag bg-danger text-white border-dark">Aspirasi &amp; Pengaduan</span>
                <h2 className="trakteer-section-title text-dark fw-black fs-2 mt-2">
                  Formulir Pengaduan Pelayanan UPTD. Labkesda Kab. Sidoarjo
                </h2>
                <p className="text-secondary small max-w-650 mx-auto mt-2">
                  Sampaikan masukan, keluhan, maupun aspirasi Anda mengenai pelayanan kami melalui formulir resmi Google Form di bawah ini atau kanal pengaduan langsung.
                </p>
              </div>

              <div className="row g-4 align-items-stretch">
                {/* Embedded Google Form Column */}
                <div className="col-lg-8">
                  <div className="ikm-window-card h-100 d-flex flex-column">
                    {/* Window Header Bar */}
                    <div className="ikm-window-header d-flex align-items-center justify-content-between">
                      <div className="window-dots d-flex align-items-center gap-2">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                        <span className="window-title-text ms-2 font-monospace small text-white-50">
                          Formulir Pengaduan Labkesda (Google Forms)
                        </span>
                      </div>
                      <div className="window-controls d-flex align-items-center gap-2">
                        <a
                          href="https://docs.google.com/forms/d/e/1FAIpQLSf3J233A4QgoMfg2VBSJj3kzxIZ2BoYAYDKE5htsputkO-lrA/viewform?pli=1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-window-action"
                          title="Buka Form di Tab Baru"
                        >
                          <IconExternalLink size={16} />
                          <span className="d-none d-sm-inline ms-1 small fw-bold">Tab Baru</span>
                        </a>
                      </div>
                    </div>

                    {/* Window Body (Iframe) */}
                    <div className="ikm-window-body flex-grow-1 position-relative bg-white" style={{ minHeight: "720px" }}>
                      <iframe
                        src="https://docs.google.com/forms/d/e/1FAIpQLSf3J233A4QgoMfg2VBSJj3kzxIZ2BoYAYDKE5htsputkO-lrA/viewform?embedded=true"
                        width="100%"
                        height="100%"
                        style={{ border: 0, minHeight: "720px", width: "100%" }}
                        title="Formulir Pengaduan Pelayanan UPTD Labkesda Sidoarjo"
                        allowFullScreen
                      >
                        Memuat Formulir Pengaduan...
                      </iframe>
                    </div>

                    {/* Window Footer */}
                    <div className="ikm-window-footer d-flex align-items-center justify-content-between p-3 bg-dark text-white border-top border-dark">
                      <div className="d-flex align-items-center gap-2 small text-white-50">
                        <IconLock size={16} className="text-warning" />
                        <span>Koneksi Aman Google Forms (256-bit SSL)</span>
                      </div>
                      <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSf3J233A4QgoMfg2VBSJj3kzxIZ2BoYAYDKE5htsputkO-lrA/viewform?pli=1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-warning fw-bold border-dark"
                      >
                        Buka di Google Forms ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Direct Call & SP4N LAPOR Info Column */}
                <div className="col-lg-4">
                  <div className="d-flex flex-column gap-3 h-100">
                    <div className="card-3d p-4 bg-white">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="icon-badge-3d bg-success text-white">
                          <IconPhone size={24} />
                        </div>
                        <div>
                          <h6 className="fw-black text-dark mb-0">CS WA Pengaduan</h6>
                          <span className="small text-secondary">Respon Cepat Jam Kerja</span>
                        </div>
                      </div>
                      <p className="small text-secondary mb-3">
                        Layanan pengaduan langsung melalui Customer Service WhatsApp UPTD Labkesda Sidoarjo:
                      </p>
                      <a
                        href="https://wa.me/6281234567890?text=Halo%20Admin%20Labkesda%20Sidoarjo,%20saya%20ingin%20mengajukan%20pengaduan%20pelayanan"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-pop-green w-100 text-decoration-none"
                      >
                        <span>💬 Chat WhatsApp CS</span>
                      </a>
                    </div>

                    <div className="card-3d p-4 bg-white">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="icon-badge-3d bg-warning text-dark">
                          <IconShieldCheck size={24} />
                        </div>
                        <div>
                          <h6 className="fw-black text-dark mb-0">SP4N-LAPOR!</h6>
                          <span className="small text-secondary">Portal Pengaduan RI</span>
                        </div>
                      </div>
                      <p className="small text-secondary mb-3">
                        Aspirasi dan pengaduan resmi terintegrasi dengan Kementerian PANRB.
                      </p>
                      <a
                        href="https://www.lapor.go.id"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-pop-yellow w-100 text-decoration-none"
                      >
                        <span>🌐 Buka SP4N-LAPOR! ↗</span>
                      </a>
                    </div>

                    <div className="card-3d p-3 bg-white text-center mt-auto">
                      <span className="small text-secondary d-block fw-bold mb-1">📍 Tatap Muka:</span>
                      <span className="small text-dark font-monospace d-block">
                        Jl. Pasir Lingkar Timur, Bluru Kidul, Sidoarjo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer bg-dark text-white py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="footer-brand d-flex align-items-center gap-2 mb-3">
                <img
                  src="/sidoarjo.png"
                  onError={(e) => { e.target.src = "/images/laboratory.png"; }}
                  width="36"
                  height="42"
                  alt="Logo Kab Sidoarjo"
                />
                <div>
                  <span className="fs-5 fw-bold text-white d-block">Labkesda Sidoarjo</span>
                  <span className="small text-white-50">UPT Labkesda Kabupaten Sidoarjo</span>
                </div>
              </div>
              <p className="footer-desc text-white-75 small">
                Laboratorium Kesehatan Daerah (Labkesda) Kabupaten Sidoarjo memberikan pelayanan pengujian laboratorium yang profesional, presisi, dan terpercaya bagi masyarakat dan instansi industri.
              </p>
            </div>

            <div className="col-lg-2 col-md-6 col-6">
              <h3 className="footer-section-title text-white fs-6 mb-3">Layanan</h3>
              <ul className="footer-links list-unstyled small">
                <li className="mb-2"><button className="btn btn-link p-0 text-white-75 text-decoration-none" onClick={() => setSelectedCategory("air")}>Uji Air Clean Water</button></li>
                <li className="mb-2"><button className="btn btn-link p-0 text-white-75 text-decoration-none" onClick={() => setSelectedCategory("makanan")}>Uji Pangan &amp; Gizi</button></li>
                <li className="mb-2"><button className="btn btn-link p-0 text-white-75 text-decoration-none" onClick={() => setSelectedCategory("lingkungan")}>Uji Kualitas Udara</button></li>
                <li className="mb-2"><button className="btn btn-link p-0 text-white-75 text-decoration-none" onClick={() => setSelectedCategory("medis")}>Pemeriksaan Medis</button></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-6 col-6">
              <h3 className="footer-section-title text-white fs-6 mb-3">Navigasi</h3>
              <ul className="footer-links list-unstyled small">
                <li className="mb-2"><a href="#beranda" className="text-white-75 text-decoration-none">Beranda</a></li>
                <li className="mb-2"><a href="#survei-ikm" className="text-warning text-decoration-none fw-bold">Survei IKM</a></li>
                <li className="mb-2"><a href="#layanan" className="text-white-75 text-decoration-none">Layanan Uji</a></li>
                <li className="mb-2"><a href="#akreditasi" className="text-white-75 text-decoration-none">Akreditasi</a></li>
              </ul>
            </div>

            <div className="col-lg-4 col-md-6">
              <h3 className="footer-section-title text-white fs-6 mb-3">Kontak &amp; Lokasi</h3>
              <ul className="footer-links list-unstyled small text-white-75">
                <li className="d-flex align-items-start gap-2 mb-2">
                  <IconMapPin size={18} className="text-danger flex-shrink-0 mt-1" />
                  <span>Jl. Raya Magersari No. 12, Sidoarjo, Jawa Timur, Indonesia</span>
                </li>
                <li className="d-flex align-items-center gap-2 mb-2">
                  <IconPhone size={18} className="text-danger flex-shrink-0" />
                  <span>(031) 894-1234 / 894-5678</span>
                </li>
                <li className="d-flex align-items-center gap-2 mb-2">
                  <IconMail size={18} className="text-danger flex-shrink-0" />
                  <span>info@labkesda.sidoarjokab.go.id</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <IconClock size={18} className="text-danger flex-shrink-0" />
                  <span>Senin - Jumat: 08:00 - 15:00 WIB</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom text-center pt-4 mt-4 border-top border-white-10 text-white-50 small">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} UPT Laboratorium Kesehatan Daerah Kabupaten Sidoarjo. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
