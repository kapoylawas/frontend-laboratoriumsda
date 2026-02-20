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

    // Blue color palette
    const blueShades = [
      { primary: "#4A90E2", secondary: "#7DC9FF" },
      { primary: "#2C3E50", secondary: "#3498DB" },
      { primary: "#1B4F8B", secondary: "#5D9BEC" },
      { primary: "#0F4C81", secondary: "#6AB0FF" },
      { primary: "#2874A6", secondary: "#85C1E9" },
      { primary: "#1A5276", secondary: "#5DADE2" },
    ];

    class BlueParticle {
      constructor() {
        this.colorSet =
          blueShades[Math.floor(Math.random() * blueShades.length)];
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
        this.opacity = Math.random() * 0.1 + 0.05;
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
      particles.push(new BlueParticle());
    }

    // Animation loop
    const animate = () => {
      // Create blue gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0B2F5C");
      gradient.addColorStop(0.5, "#1B4F8B");
      gradient.addColorStop(1, "#2C6B9E");
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
        ctx.fillStyle = i % 2 === 0 ? "#7DC9FF" : "#4A90E2";
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
      {/* Blue Animated Background */}
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

      {/* Blue Decorative Shapes */}
      <div className="decoration decoration-1"></div>
      <div className="decoration decoration-2"></div>
      <div className="decoration decoration-3"></div>

      <div className="register-wrapper">
        <div className="register-header text-center mb-4">
          <div className="logo-wrapper mx-auto">
            <div className="logo-glow"></div>
            <div className="logo-inner">
              <img
                src="/images/laboratory.png"
                alt="Lab Logo"
                className="logo-image"
              />
            </div>
          </div>
          <h2 className="lab-title">
            Laboratorium Kesehatan Daerah <br /> Kabupaten Sidoarjo
          </h2>
          <h3 className="register-title">🌊 Pendaftaran Akun Baru 🌊</h3>
          <p className="register-subtitle">
            Daftarkan diri Anda untuk mengakses layanan kami
          </p>
        </div>

        <div className="card-wrapper">
          <div className="card register-card">
            <div className="card-body p-4">
              <form onSubmit={storeRegister} noValidate>
                <div className="form-grid">
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
                          stroke="#4A90E2"
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
                          stroke="#4A90E2"
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
                          stroke="#4A90E2"
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
                          stroke="#4A90E2"
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
                          stroke="#4A90E2"
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
                          stroke="#4A90E2"
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
                          stroke="#4A90E2"
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
                    <div className="password-feedback-wrapper">
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
                          stroke="#4A90E2"
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
                <div className="form-footer text-center mt-4">
                  <span className="text-muted small">Sudah punya akun? </span>
                  <Link to="/" className="login-link">
                    Masuk disini 🌊
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

      <style jsx>{`
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

        /* Main Wrapper */
        .register-wrapper {
          min-height: 100vh;
          padding: 2rem 1.5rem;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Logo */
        .logo-wrapper {
          width: 90px;
          height: 90px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .logo-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #4a90e2, #2c6b9e);
          filter: blur(15px);
          opacity: 0.7;
          animation: glowPulse 3s infinite;
        }

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .logo-inner {
          width: 70px;
          height: 70px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 1;
        }

        .logo-image {
          height: 40px;
          width: auto;
        }

        /* Header Text */
        .lab-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .register-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #4a90e2, #2c6b9e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .register-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        /* Card */
        .card-wrapper {
          width: 100%;
          max-width: 900px;
          position: relative;
          z-index: 2;
        }

        .register-card {
          border: none;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.2),
            0 0 0 2px rgba(74, 144, 226, 0.1) inset;
          animation: cardFloat 0.8s ease-out;
        }

        @keyframes cardFloat {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Form Grid */
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
          color: #4a90e2;
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 0.3rem;
        }

        /* Input Wrapper */
        .input-wrapper,
        .select-wrapper {
          position: relative;
        }

        .input-icon-wrapper {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-control,
        .form-select {
          height: 45px;
          border-radius: 12px;
          border: 2px solid #e0f0ff;
          background: white;
          font-size: 0.9rem;
          padding-left: 45px;
          transition: all 0.3s;
          width: 100%;
        }

        textarea.form-control {
          height: auto;
          padding-top: 12px;
          padding-bottom: 12px;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #4a90e2;
          box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.1);
          outline: none;
        }

        .form-control.is-invalid,
        .form-select.is-invalid {
          border-color: #dc3545;
        }

        .invalid-feedback {
          color: #dc3545;
          font-size: 0.8rem;
          margin-top: 0.3rem;
        }

        /* Password Rules */
        .password-feedback-wrapper {
          margin-top: 0.5rem;
        }

        .password-feedback {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1rem;
          border: 2px solid #e0f0ff;
        }

        .rules-title {
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.8rem;
        }

        .rules-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem 0;
        }

        .rule-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          margin-bottom: 0.3rem;
          padding: 0.2rem 0;
        }

        .rule-item.valid {
          color: #28a745;
        }

        .rule-item.invalid {
          color: #6c757d;
        }

        .rule-icon {
          font-size: 1rem;
        }

        /* Password Strength Indicator */
        .password-strength-indicator {
          margin-top: 0.5rem;
        }

        .strength-meter {
          display: flex;
          gap: 0.3rem;
          margin-bottom: 0.3rem;
        }

        .strength-bar {
          height: 4px;
          flex: 1;
          background: #e9ecef;
          border-radius: 2px;
          transition: all 0.3s;
        }

        .strength-bar.active {
          background: currentColor;
        }

        .password-strength-indicator.danger .strength-bar.active {
          background: #dc3545;
        }

        .password-strength-indicator.warning .strength-bar.active {
          background: #ffc107;
        }

        .password-strength-indicator.success .strength-bar.active {
          background: #28a745;
        }

        .strength-text {
          font-size: 0.8rem;
          color: #6c757d;
        }

        /* Submit Button */
        .btn-submit {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 25px;
          background: linear-gradient(135deg, #4a90e2, #2c6b9e);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .btn-submit::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transform: rotate(45deg);
          animation: btnShine 3s infinite;
        }

        @keyframes btnShine {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          20%,
          100% {
            transform: translateX(100%) rotate(45deg);
          }
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(74, 144, 226, 0.4);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          background: linear-gradient(135deg, #a0c0e0, #8098b0);
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Login Link */
        .login-link {
          color: #4a90e2;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }

        .login-link:hover {
          color: #2c6b9e;
          text-decoration: underline;
        }

        /* Decorative Waves */
        .decorative-waves {
          position: relative;
          margin-top: 20px;
          height: 20px;
        }

        .wave {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4a90e2, transparent);
        }

        .wave-1 {
          width: 100%;
          top: 0;
          animation: waveMove 3s infinite;
        }

        .wave-2 {
          width: 70%;
          left: 15%;
          top: 10px;
          animation: waveMove 3s infinite reverse;
        }

        @keyframes waveMove {
          0% {
            opacity: 0.3;
            width: 0;
          }
          50% {
            opacity: 1;
            width: 100%;
          }
          100% {
            opacity: 0.3;
            width: 0;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-group.full-width {
            grid-column: span 1;
          }

          .register-wrapper {
            padding: 1.5rem 1rem;
          }

          .lab-title {
            font-size: 1rem;
          }

          .register-title {
            font-size: 1.3rem;
          }

          .decoration {
            filter: blur(40px);
          }

          .decoration-1 {
            width: 200px;
            height: 200px;
          }

          .decoration-2 {
            width: 300px;
            height: 300px;
          }
        }
      `}</style>
    </>
  );
}
