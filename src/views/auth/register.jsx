import { useState, useEffect, useRef } from "react"; // Tambahkan useRef

//import hook useNavigate from react router dom
import { Link, useNavigate } from "react-router-dom";

//import toats
import toast from "react-hot-toast";

//import handler error
import { handleErrors } from "../../utils/handleErrors";
import Api from "../../services/api";
import EmailConfirmationModal from "../../components/EmailConfirmationModal";
import EmailInfoCard from "../../components/EmailInfoCard";

export default function Register() {
  const navigate = useNavigate();

  // Tambahkan ref untuk canvas background
  const bgCanvasRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "text-muted",
  });

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showEmailInfo, setShowEmailInfo] = useState(false);

  //state
  const [formData, setFormData] = useState({
    user_type: "individu",
    nama_perusahaan: "",
    name: "",
    email: "",
    nik: "",
    phone: "",
    gender: "",
    alamat: "",
    password: "",
    confirmPassword: "",
  });

  // Blue-themed background animation - sama seperti di login
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;
    let animationFrame;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    // Soft Elegant Red color palette
    const redShades = [
      { primary: "#b91c1c", secondary: "#f43f5e" },
      { primary: "#9f1239", secondary: "#fb7185" },
      { primary: "#881337", secondary: "#fde047" },
      { primary: "#e11d48", secondary: "#f472b6" },
    ];

    class RedParticle {
      constructor() {
        this.colorSet =
          redShades[Math.floor(Math.random() * redShades.length)];
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 50 + 25;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.001;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.01;
        this.opacity = Math.random() * 0.08 + 0.03;
        this.shape = Math.floor(Math.random() * 3);
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        this.pulse += this.pulseSpeed;

        if (this.x < -100) this.x = width + 100;
        if (this.x > width + 100) this.x = -100;
        if (this.y < -100) this.y = height + 100;
        if (this.y > height + 100) this.y = -100;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const scale = 1 + Math.sin(this.pulse) * 0.1;
        const gradient = ctx.createLinearGradient(
          -this.size / 2,
          -this.size / 2,
          this.size / 2,
          this.size / 2,
        );
        gradient.addColorStop(0, this.colorSet.primary);
        gradient.addColorStop(1, this.colorSet.secondary);

        ctx.globalAlpha = this.opacity * (0.8 + Math.sin(this.pulse) * 0.2);
        ctx.fillStyle = gradient;

        switch (this.shape) {
          case 0: // Circle
            ctx.beginPath();
            ctx.arc(0, 0, (this.size * scale) / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 1: // Square (rounded)
            ctx.beginPath();
            ctx.roundRect(
              (-this.size * scale) / 2,
              (-this.size * scale) / 2,
              this.size * scale,
              this.size * scale,
              15,
            );
            ctx.fill();
            break;
          case 2: // Triangle
            ctx.beginPath();
            ctx.moveTo(0, (-this.size * scale) / 2);
            ctx.lineTo((this.size * scale) / 2, (this.size * scale) / 2);
            ctx.lineTo((-this.size * scale) / 2, (this.size * scale) / 2);
            ctx.closePath();
            ctx.fill();
            break;
        }

        ctx.restore();
      }
    }

    // Create particles
    const particles = [];
    const PARTICLE_COUNT = 20;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new RedParticle());
    }

    // Animation loop
    const animate = () => {
      // Soft Elegant Deep Crimson Red Gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#991b1b");
      gradient.addColorStop(0.5, "#881337");
      gradient.addColorStop(1, "#4c0519");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw floating particles
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // Draw subtle sparkles
      ctx.save();
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(Date.now() * 0.001 + i) * 50 + i * 70) % width;
        const y = (Math.cos(Date.now() * 0.001 + i) * 30 + i * 40) % height;
        ctx.fillStyle = i % 2 === 0 ? "#ffe600" : "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Check password strength
  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({
        score: 0,
        message: "",
        color: "text-muted",
      });
    }
  }, [formData.password]);

  const checkPasswordStrength = (password) => {
    let score = 0;

    // Check length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) score++;

    // Check for numbers
    if (/[0-9]/.test(password)) score++;

    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let message = "";
    let color = "";

    if (score === 0) {
      message = "";
    } else if (score <= 2) {
      message = "Lemah";
      color = "text-danger";
    } else if (score <= 3) {
      message = "Sedang";
      color = "text-warning";
    } else {
      message = "Kuat";
      color = "text-success";
    }

    return { score, message, color };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,13}$/;
    const nikRegex = /^[0-9]{16}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (formData.user_type === "perusahaan" && !formData.nama_perusahaan.trim()) {
      newErrors.nama_perusahaan = "Nama Perusahaan / Instansi wajib diisi";
    }
    if (!formData.name.trim()) newErrors.name = "Nama lengkap wajib diisi";
    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    if (!formData.nik) {
      newErrors.nik = "NIK wajib diisi";
    } else if (!nikRegex.test(formData.nik)) {
      newErrors.nik = "NIK harus 16 digit angka";
    }
    if (!formData.phone) {
      newErrors.phone = "Nomor telepon wajib diisi";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Nomor telepon harus 10-13 digit angka";
    }
    if (!formData.gender) {
      newErrors.gender = "Jenis kelamin wajib dipilih";
    } else if (!["male", "female"].includes(formData.gender)) {
      newErrors.gender = "Pilih jenis kelamin yang valid";
    }
    if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";
    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password harus mengandung huruf besar, angka, dan simbol";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //function "storeUser"
  const storeRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Pastikan gender dikirim dalam format yang benar (uppercase/lowercase)
      const payload = {
        user_type: formData.user_type,
        nama_perusahaan:
          formData.user_type === "perusahaan" ? formData.nama_perusahaan : null,
        name: formData.name,
        email: formData.email,
        nik: formData.nik,
        phone: formData.phone,
        gender: formData.gender,
        alamat: formData.alamat,
        password: formData.password,
      };

      const response = await Api.post("/api/register", payload);

      // Show success toast
      toast.success(`${response.data.meta.message}`, {
        duration: 8000,
        position: "top-center",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });

      // Simpan email yang didaftarkan dan tampilkan modal
      setRegisteredEmail(formData.email);

      // Reset form
      setFormData({
        user_type: "individu",
        nama_perusahaan: "",
        name: "",
        email: "",
        nik: "",
        phone: "",
        gender: "",
        alamat: "",
        password: "",
        confirmPassword: "",
      });

      // Tampilkan modal setelah state diupdate
      setTimeout(() => {
        setShowEmailModal(true);
      }, 100);
    } catch (error) {
      if (error.response) {
        // Handle 422 Unprocessable Entity khusus
        if (error.response.status === 422) {
          // Jika backend mengembalikan error validasi
          if (error.response.data.errors) {
            setErrors(error.response.data.errors);
          } else {
            // Format error default
            handleErrors(error.response.data, setErrors);
          }
        } else {
          // Handle error lainnya
          handleErrors(error.response.data, setErrors);
        }
      } else if (error.request) {
        // Request dikirim tapi tidak ada response
        toast.error("Tidak ada respon dari server");
      } else {
        // Error lainnya
        toast.error("Terjadi kesalahan jaringan");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowEmailModal(false);
    navigate("/");
  };

  return (
    <>
      {/* Trakteer Red Animated Canvas Background */}
      <canvas
        ref={bgCanvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Dot grid overlay matching landing page */}
      <div className="login-dots-overlay"></div>

      <div className="register-wrapper">
        {/* Back to Landing Page Button */}
        <div className="top-nav-bar">
          <Link to="/" className="btn-back-home">
            <span>← Ke Beranda</span>
          </Link>
        </div>

        <div className="register-header text-center mb-4 position-relative">
          <div className="logo-wrapper mx-auto">
            <div className="logo-inner">
              <img
                src="/sidoarjo.png"
                onError={(e) => { e.target.src = "/images/laboratory.png"; }}
                width="44"
                height="52"
                alt="Logo Kab Sidoarjo"
              />
            </div>
          </div>
          <h2 className="lab-title fw-black text-white text-shadow-heavy mt-3 mb-1">
            Laboratorium Kesehatan Daerah <br /> (UPT Labkesda Kab. Sidoarjo)
          </h2>
          <div className="badge-3d-title mb-2">
            <span>✨ Form Pendaftaran Masyarakat ✨</span>
          </div>
          <p className="register-subtitle text-warning-glow fw-bold small">
            Lengkapi data diri Anda di bawah ini untuk membuat akun baru
          </p>
        </div>

        <div className="card-wrapper">
          <div className="card register-card">
            <div className="card-body p-4 p-md-5">
              <form onSubmit={storeRegister} noValidate>
                <div className="form-grid">
                  {/* Tipe Pemohon */}
                  <div className="form-group full-width mb-3">
                    <label className="form-label blue-text">
                      Tipe Pemohon <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-3 mt-1">
                      <div className={`p-3 rounded border flex-fill cursor-pointer transition-all ${formData.user_type === "individu" ? "bg-primary text-white border-primary shadow-sm" : "bg-light text-dark border-secondary opacity-75"}`}
                           onClick={() => handleChange({ target: { name: "user_type", value: "individu" } })}>
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="user_type"
                            id="typeIndividu"
                            value="individu"
                            checked={formData.user_type === "individu"}
                            onChange={handleChange}
                          />
                          <label className="form-check-label fw-bold cursor-pointer ms-1" htmlFor="typeIndividu">
                            👤 Individu (Perorangan)
                          </label>
                        </div>
                      </div>
                      <div className={`p-3 rounded border flex-fill cursor-pointer transition-all ${formData.user_type === "perusahaan" ? "bg-primary text-white border-primary shadow-sm" : "bg-light text-dark border-secondary opacity-75"}`}
                           onClick={() => handleChange({ target: { name: "user_type", value: "perusahaan" } })}>
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="user_type"
                            id="typePerusahaan"
                            value="perusahaan"
                            checked={formData.user_type === "perusahaan"}
                            onChange={handleChange}
                          />
                          <label className="form-check-label fw-bold cursor-pointer ms-1" htmlFor="typePerusahaan">
                            🏢 Perusahaan / Instansi
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nama Perusahaan (jika Tipe Pemohon = Perusahaan) */}
                  {formData.user_type === "perusahaan" && (
                    <div className="form-group full-width">
                      <label className="form-label blue-text">
                        Nama Perusahaan / Instansi <span className="text-danger">*</span>
                      </label>
                      <div className="input-wrapper">
                        <div className="input-icon-wrapper">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#e50914"
                            strokeWidth="2"
                          >
                            <path d="M3 21h18" />
                            <path d="M5 21V7l8-4v18" />
                            <path d="M19 21V11l-6-3" />
                            <path d="M9 9v.01" />
                            <path d="M9 12v.01" />
                            <path d="M9 15v.01" />
                            <path d="M9 18v.01" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          className={`form-control ${errors.nama_perusahaan ? "is-invalid" : ""}`}
                          placeholder="Contoh: PT Sukses Mandiri / Dinas Kesehatan"
                          name="nama_perusahaan"
                          value={formData.nama_perusahaan}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.nama_perusahaan && (
                        <div className="invalid-feedback d-block">{errors.nama_perusahaan}</div>
                      )}
                    </div>
                  )}
                  {/* Nama Lengkap */}
                  <div className="form-group">
                    <label className="form-label blue-text">
                      Nama Lengkap <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon-wrapper">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        placeholder="Nama Lengkap"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-group email-input-container">
                    <label className="form-label blue-text">
                      Email <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon-wrapper">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        placeholder="your@email.com"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setShowEmailInfo(true)}
                        onBlur={() => setShowEmailInfo(false)}
                      />
                    </div>
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                    {showEmailInfo && <EmailInfoCard />}
                  </div>

                  {/* NIK */}
                  <div className="form-group">
                    <label className="form-label blue-text">
                      NIK <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon-wrapper">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className={`form-control ${errors.nik ? "is-invalid" : ""}`}
                        placeholder="16 digit NIK"
                        name="nik"
                        value={formData.nik}
                        onChange={handleChange}
                        maxLength="16"
                      />
                    </div>
                    {errors.nik && (
                      <div className="invalid-feedback">{errors.nik}</div>
                    )}
                  </div>

                  {/* No. Telepon */}
                  <div className="form-group">
                    <label className="form-label blue-text">
                      No. Telepon <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon-wrapper">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                        placeholder="081234567890"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength="13"
                      />
                    </div>
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>

                  {/* Jenis Kelamin */}
                  <div className="form-group">
                    <label className="form-label blue-text">
                      Jenis Kelamin <span className="text-danger">*</span>
                    </label>
                    <div className="select-wrapper">
                      <div className="input-icon-wrapper">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="4" />
                          <path d="M20 8v12M4 8v12M12 22v-6" />
                        </svg>
                      </div>
                      <select
                        className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                      </select>
                    </div>
                    {errors.gender && (
                      <div className="invalid-feedback">{errors.gender}</div>
                    )}
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="form-group full-width">
                    <label className="form-label blue-text">
                      Alamat Lengkap <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div
                        className="input-icon-wrapper"
                        style={{ top: "20px" }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <textarea
                        className={`form-control ${errors.alamat ? "is-invalid" : ""}`}
                        placeholder="Alamat Lengkap"
                        rows="3"
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleChange}
                      ></textarea>
                    </div>
                    {errors.alamat && (
                      <div className="invalid-feedback">{errors.alamat}</div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label blue-text">
                      Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon-wrapper">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        placeholder="Minimal 8 karakter"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Password Rules */}
                    <div className="password-feedback-wrapper mt-3">
                      <div className="password-feedback">
                        <div className="password-rules">
                          <h6 className="rules-title blue-text">
                            Persyaratan Password:
                          </h6>
                          <ul className="rules-list">
                            <li
                              className={`rule-item ${formData.password.length >= 8 ? "valid" : "invalid"}`}
                            >
                              <span className="rule-icon">
                                {formData.password.length >= 8 ? "✓" : "✗"}
                              </span>
                              Minimal 8 karakter
                            </li>
                            <li
                              className={`rule-item ${/[A-Z]/.test(formData.password) ? "valid" : "invalid"}`}
                            >
                              <span className="rule-icon">
                                {/[A-Z]/.test(formData.password) ? "✓" : "✗"}
                              </span>
                              Huruf besar (A-Z)
                            </li>
                            <li
                              className={`rule-item ${/[0-9]/.test(formData.password) ? "valid" : "invalid"}`}
                            >
                              <span className="rule-icon">
                                {/[0-9]/.test(formData.password) ? "✓" : "✗"}
                              </span>
                              Angka (0-9)
                            </li>
                            <li
                              className={`rule-item ${/[^A-Za-z0-9]/.test(formData.password) ? "valid" : "invalid"}`}
                            >
                              <span className="rule-icon">
                                {/[^A-Za-z0-9]/.test(formData.password)
                                  ? "✓"
                                  : "✗"}
                              </span>
                              Simbol (@$!%*?&)
                            </li>
                          </ul>
                        </div>

                        {formData.password && (
                          <div
                            className={`password-strength-indicator ${passwordStrength.color.replace("text-", "")}`}
                          >
                            <div className="strength-meter">
                              <div
                                className={`strength-bar ${passwordStrength.score >= 1 ? "active" : ""}`}
                              ></div>
                              <div
                                className={`strength-bar ${passwordStrength.score >= 2 ? "active" : ""}`}
                              ></div>
                              <div
                                className={`strength-bar ${passwordStrength.score >= 3 ? "active" : ""}`}
                              ></div>
                              <div
                                className={`strength-bar ${passwordStrength.score >= 4 ? "active" : ""}`}
                              ></div>
                            </div>
                            <span className="strength-text">
                              Kekuatan password:{" "}
                              <strong>{passwordStrength.message}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {errors.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>

                  {/* Konfirmasi Password */}
                  <div className="form-group">
                    <label className="form-label blue-text">
                      Konfirmasi Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon-wrapper">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          <path d="M12 16v2" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                        placeholder="Ulangi password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <div className="invalid-feedback">
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <span className="me-1">🌊</span>
                        Daftar Sekarang
                      </>
                    )}
                  </button>
                </div>

                {/* Login Link */}
                <div className="form-footer text-center mt-4 d-flex align-items-center justify-content-center flex-wrap gap-2">
                  <span className="text-muted small">Sudah punya akun? </span>
                  <Link to="/" className="login-link">
                    Masuk disini ➔
                  </Link>
                </div>

                {/* Decorative Waves */}
                <div className="decorative-waves">
                  <div className="wave wave-1"></div>
                  <div className="wave wave-2"></div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Modal Konfirmasi Email */}
        <EmailConfirmationModal
          isOpen={showEmailModal}
          onClose={handleCloseModal}
          email={registeredEmail}
        />
      </div>

      <style>{`
        /* Canvas Background */
        canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        /* Blue Decorative Shapes */
        .decoration {
          position: fixed;
          border-radius: 50%;
          filter: blur(60px);
          z-index: 0;
          animation: float 20s infinite ease-in-out;
        }

        .decoration-1 {
          width: 300px;
          height: 300px;
          background: rgba(74, 144, 226, 0.2);
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }

        .decoration-2 {
          width: 400px;
          height: 400px;
          background: rgba(44, 107, 158, 0.2);
          bottom: -150px;
          left: -150px;
          animation-delay: -5s;
        }

        .decoration-3 {
          width: 200px;
          height: 200px;
          background: rgba(125, 201, 255, 0.2);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -10s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(50px, 50px) rotate(5deg);
          }
          50% {
            transform: translate(0, 100px) rotate(10deg);
          }
          75% {
            transform: translate(-50px, 50px) rotate(5deg);
          }
        }

        .register-wrapper {
          min-height: 100vh;
          padding: 2rem 1.5rem;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .top-nav-bar {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 10;
        }

        .btn-back-home {
          background: #67e8f9;
          color: #000000 !important;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 8px 16px;
          border-radius: 12px;
          border: 2.5px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none !important;
          transition: all 0.15s ease-in-out;
        }

        .btn-back-home:hover {
          background: #22d3ee;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #000000;
        }

        .logo-wrapper {
          width: 84px;
          height: 84px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .logo-inner {
          width: 84px;
          height: 84px;
          background: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-shadow-heavy {
          text-shadow: 0 3px 8px rgba(0, 0, 0, 0.6);
        }

        .badge-3d-title {
          display: inline-flex;
          align-items: center;
          background: #fee2e2;
          color: #e50914;
          font-weight: 800;
          font-size: 0.85rem;
          padding: 5px 16px;
          border: 2px solid #000000;
          box-shadow: 3px 3px 0px #000000;
          border-radius: 10px;
        }

        .card-wrapper {
          width: 100%;
          max-width: 900px;
          position: relative;
          z-index: 2;
        }

        /* 3D Neubrutalism Card */
        .register-card {
          border: 3px solid #000000;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 8px 8px 0px #000000;
          overflow: hidden;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        .blue-text {
          color: #0f172a;
          font-weight: 800;
          font-size: 0.88rem;
          margin-bottom: 0.4rem;
        }

        .input-wrapper,
        .select-wrapper {
          position: relative;
        }

        .input-icon-wrapper {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-control,
        .form-select {
          height: 48px;
          border-radius: 12px;
          border: 2.5px solid #000000;
          box-shadow: 3px 3px 0px #000000;
          background: #ffffff;
          font-size: 0.92rem;
          font-weight: 600;
          padding-left: 45px;
          transition: all 0.15s ease-in-out;
          width: 100%;
        }

        textarea.form-control {
          height: auto;
          padding-top: 12px;
          padding-bottom: 12px;
        }

        .form-control:focus,
        .form-select:focus {
          background: #fffdf0;
          border-color: #000000;
          box-shadow: 5px 5px 0px #000000;
          outline: none;
        }

        .form-control.is-invalid,
        .form-select.is-invalid {
          border-color: #dc3545;
        }

        .invalid-feedback {
          color: #dc3545;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 0.3rem;
        }

        .password-feedback-wrapper {
          margin-top: 1.25rem;
        }

        .password-feedback {
          background: #f8fafc;
          border-radius: 14px;
          padding: 1.2rem;
          border: 2.5px solid #000000;
          box-shadow: 3px 3px 0px #000000;
        }

        /* 3D Submit Button */
        .btn-submit {
          width: 100%;
          height: 54px;
          border: 3px solid #000000;
          border-radius: 14px;
          background: #10b981;
          color: white;
          font-weight: 900;
          font-size: 1.05rem;
          cursor: pointer;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 5px 5px 0px #000000;
          transition: all 0.15s ease-in-out;
          outline: none;
        }

        .btn-submit:hover:not(:disabled) {
          background: #059669;
          transform: translate(-2px, -2px);
          box-shadow: 7px 7px 0px #000000;
        }

        .btn-submit:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #000000;
        }

        .btn-submit:disabled {
          background: #94a3b8;
          opacity: 0.8;
          cursor: not-allowed;
        }

        /* 3D Login Link Button */
        .login-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          background: #fbbf24;
          color: #000000 !important;
          border: 2.5px solid #000000;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none !important;
          box-shadow: 4px 4px 0px #000000;
          transition: all 0.15s ease-in-out;
          cursor: pointer;
        }

        .login-link:hover {
          background: #f59e0b;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #000000;
        }

        .login-link:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #000000;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-group.full-width {
            grid-column: span 1;
          }

          .register-wrapper {
            padding: 4rem 1rem 2rem 1rem;
          }

          .top-nav-bar {
            top: 12px;
            left: 12px;
          }
        }
      `}</style>
    </>
  );
}
