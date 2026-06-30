import { useState } from "react";
import { loginUser } from "../../services/authService";
import supabase from "../../supabase/supabase";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../../assets/eventsphere-logo.png";
import "../../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const emailInput = form.elements.namedItem("email");
    const passwordInput = form.elements.namedItem("password");

    const emailValue =
      (emailInput instanceof HTMLInputElement ? emailInput.value : email).trim();
    const passwordValue =
      passwordInput instanceof HTMLInputElement ? passwordInput.value : password;

    if (!emailValue || !passwordValue) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(emailValue, passwordValue);

      const user = response?.user;

      if (!user) {
        throw new Error("Login failed. Please try again.");
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!data) {
        throw new Error("Profile not found");
      }

      if (data.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/participant-dashboard", { replace: true });
      }
    } catch (err) {
      const message = err.message?.toLowerCase() || "";

      if (message.includes("verify your email") || message.includes("email not confirmed")) {
        toast.error(
          "Please verify your email with the OTP from registration before logging in."
        );
        navigate("/register", {
          replace: true,
          state: { email: emailValue, step: "otp" },
        });
        return;
      }

      toast.error(err.message || "Login failed");
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
          <h1 className="login-card__title">Welcome back</h1>
          <p className="login-card__subtitle">Sign in to your EventSphere account</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-form__field">
            <label className="login-form__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="login-form__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="login-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-form__submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-card__footer">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
