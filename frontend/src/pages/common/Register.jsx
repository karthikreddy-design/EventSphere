import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../../assets/eventsphere-logo.png";
import {
  registerUser,
  resendSignupOtp,
  verifySignupOtp,
  logoutUser,
} from "../../services/authService";
import { validateRegistrationEmail } from "../../utils/emailValidation";
import "../../styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const resumeEmail = location.state?.email?.trim().toLowerCase() || "";
  const resumeStep = location.state?.step === "otp" && resumeEmail ? "otp" : "form";

  const [step, setStep] = useState(resumeStep);
  const [form, setForm] = useState({
    name: "",
    email: resumeEmail,
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resumeStep === "otp" && resumeEmail) {
      toast.info("Enter the OTP sent to your email to finish registration.");
    }
  }, [resumeEmail, resumeStep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const nameValue = form.name.trim();
    const passwordValue = form.password;
    const emailCheck = validateRegistrationEmail(form.email);

    if (!nameValue || !passwordValue) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!emailCheck.valid) {
      toast.error(emailCheck.message);
      return;
    }

    if (passwordValue.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await registerUser(nameValue, emailCheck.email, passwordValue);
      setForm((prev) => ({ ...prev, email: emailCheck.email }));
      setStep("otp");
      toast.success(
        "Verification email sent. Enter the 6-digit code on this page (do not use the email link on mobile)."
      );
    } catch (err) {
      const message = err.message?.toLowerCase() || "";

      if (message.includes("invalid") && message.includes("email")) {
        toast.error("Email does not exist");
      } else if (message.includes("already registered")) {
        toast.error("This email is already registered. Please log in instead.");
      } else if (message.includes("rate limit") || message.includes("seconds")) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else {
        toast.error(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const code = otp.trim();

    if (!/^\d{6}$/.test(code)) {
      toast.error("Please enter the 6-digit OTP from your email");
      return;
    }

    setLoading(true);

    try {
      await verifySignupOtp(form.email, code);
      await logoutUser();
      toast.success("Registration confirmed! You can now log in.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);

    try {
      await resendSignupOtp(form.email);
      toast.success("A new OTP has been sent to your email");
    } catch (err) {
      toast.error(err.message || "Could not resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <img src={logo} alt="EventSphere" className="login-card__logo" />
          <span className="login-card__name">EventSphere</span>
          <h1 className="login-card__title">
            {step === "form" ? "Create account" : "Verify your email"}
          </h1>
          <p className="login-card__subtitle">
            {step === "form"
              ? "Register with your real email to join EventSphere"
              : `Enter the 6-digit code from your email for ${form.email}. Stay on this page — do not tap the email link.`}
          </p>
        </div>

        {step === "form" ? (
          <form className="login-form" onSubmit={handleRegister}>
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="register-name">
                Full name
              </label>
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="login-form__input"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="login-form__field">
              <label className="login-form__label" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                className="login-form__input"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="login-form__field">
              <label className="login-form__label" htmlFor="register-password">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                className="login-form__input"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-form__submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Register"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleVerifyOtp}>
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="register-otp">
                OTP code
              </label>
              <input
                id="register-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit OTP"
                className="login-form__input login-form__input--otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                maxLength={6}
              />
            </div>

            <button type="submit" className="login-form__submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify & complete registration"}
            </button>

            <button
              type="button"
              className="login-form__secondary"
              onClick={handleResendOtp}
              disabled={loading || resending}
            >
              {resending ? "Resending..." : "Resend OTP"}
            </button>

            <button
              type="button"
              className="login-form__link-btn"
              onClick={() => {
                setStep("form");
                setOtp("");
              }}
              disabled={loading}
            >
              Change email
            </button>
          </form>
        )}

        <p className="login-card__footer">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
