import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../../assets/eventsphere-logo.png";
import { registerUser, logoutUser } from "../../services/authService";
import { validateRegistrationEmail } from "../../utils/emailValidation";
import "../../styles/auth.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

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
      await logoutUser();
      toast.success("Registration successful! You can now log in.");
      navigate("/", { replace: true });
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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <img src={logo} alt="EventSphere" className="login-card__logo" />
          <span className="login-card__name">EventSphere</span>
          <h1 className="login-card__title">Create account</h1>
          <p className="login-card__subtitle">
            Register with your real email to join EventSphere
          </p>
        </div>

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
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="login-card__footer">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
