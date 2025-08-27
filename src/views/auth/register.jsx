
import { useState, useEffect } from "react";

//import hook useNavigate from react router dom
import { Link, useNavigate } from "react-router-dom";

//import toats
import toast from "react-hot-toast";

import "./register.css"

//import handler error
import { handleErrors } from "../../utils/handleErrors";
import Api from "../../services/api";
import EmailConfirmationModal from "../../components/EmailConfirmationModal";
import EmailInfoCard from "../../components/EmailInfoCard";

export default function Register() {
  const navigate = useNavigate();
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
      <div className="register-container">
        <div className="register-header text-center mb-5">
          <div className="logo-container">
            <div className="logo-circle">
              <img
                src="/images/laboratory.png"
                alt="Lab Logo"
                className="logo-image"
              />
            </div>
          </div>
          <h1 className="lab-title">
            Laboratorium Kesehatan Daerah <br /> Kabupaten Sidoarjo
          </h1>
          <h2 className="register-title">Pendaftaran Akun Baru</h2>
          <p className="register-subtitle">
            Daftarkan diri Anda untuk mengakses layanan kami
          </p>
        </div>

        <div className="register-card">
          <div className="card-body">
            <form onSubmit={storeRegister} autoComplete="off" noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Nama Lengkap <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    placeholder="Nama Lengkap"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                <div className="form-group email-input-container">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
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
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}

                  {/* Gunakan komponen EmailInfoCard */}
                  {showEmailInfo && <EmailInfoCard />}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    NIK <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.nik ? "is-invalid" : ""}`}
                    placeholder="16 digit NIK"
                    name="nik"
                    value={formData.nik}
                    onChange={handleChange}
                    maxLength="16"
                  />
                  {errors.nik && (
                    <div className="invalid-feedback">{errors.nik}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    No. Telepon <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    placeholder="081234567890"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength="13"
                  />
                  {errors.phone && (
                    <div className="invalid-feedback">{errors.phone}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Jenis Kelamin <span className="text-danger">*</span>
                  </label>
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
                  {errors.gender && (
                    <div className="invalid-feedback">{errors.gender}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Alamat Lengkap <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.alamat ? "is-invalid" : ""}`}
                    placeholder="Alamat Lengkap"
                    rows="3"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                  ></textarea>
                  {errors.alamat && (
                    <div className="invalid-feedback">{errors.alamat}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    placeholder="Minimal 8 karakter"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {/* list persyatan pwd */}
                  <div className="password-feedback-wrapper">
                    <div className="password-feedback">
                      <div className="password-rules">
                        <h6 className="rules-title mb-2">
                          Persyaratan Password:
                        </h6>
                        <ul className="rules-list">
                          <li
                            className={`rule-item ${formData.password.length >= 8 ? "valid" : "invalid"}`}
                          >
                            <span className="rule-icon">
                              {formData.password.length >= 8 ? (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M20 6L9 17l-5-5"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M18 6L6 18M6 6l12 12"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            Minimal 8 karakter
                          </li>
                          <li
                            className={`rule-item ${/[A-Z]/.test(formData.password) ? "valid" : "invalid"}`}
                          >
                            <span className="rule-icon">
                              {/[A-Z]/.test(formData.password) ? (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M20 6L9 17l-5-5"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M18 6L6 18M6 6l12 12"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            Huruf besar (A-Z)
                          </li>
                          <li
                            className={`rule-item ${/[0-9]/.test(formData.password) ? "valid" : "invalid"}`}
                          >
                            <span className="rule-icon">
                              {/[0-9]/.test(formData.password) ? (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M20 6L9 17l-5-5"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M18 6L6 18M6 6l12 12"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            Angka (0-9)
                          </li>
                          <li
                            className={`rule-item ${/[^A-Za-z0-9]/.test(formData.password) ? "valid" : "invalid"}`}
                          >
                            <span className="rule-icon">
                              {/[^A-Za-z0-9]/.test(formData.password) ? (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M20 6L9 17l-5-5"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M18 6L6 18M6 6l12 12"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
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

                <div className="form-group">
                  <label className="form-label">
                    Konfirmasi Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                    placeholder="Ulangi password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary btn-register"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Memproses...
                    </>
                  ) : (
                    "Daftar Sekarang"
                  )}
                </button>
              </div>

              <div className="form-footer">
                <p className="text-muted">
                  Sudah punya akun?{" "}
                  <Link to={"/"} className="login-link">
                    Masuk disini
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Konfirmasi Email */}
        <EmailConfirmationModal
          isOpen={showEmailModal}
          onClose={handleCloseModal}
          email={registeredEmail}
        />

      </div>
    </>
  );
}
