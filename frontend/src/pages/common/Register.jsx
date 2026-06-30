import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  registerUser,
  resendSignupOtp,
  verifySignupOtp,
  logoutUser,
} from "../../services/authService";
import { validateRegistrationEmail } from "../../utils/emailValidation";

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
      toast.success("OTP sent to your email. Enter it below to complete registration.");
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

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp}>
        <h1>Verify your email</h1>
        <p>Enter the 6-digit OTP sent to {form.email}</p>

        <input
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={loading}
          maxLength={6}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify & complete registration"}
        </button>

        <button type="button" onClick={handleResendOtp} disabled={loading || resending}>
          {resending ? "Resending..." : "Resend OTP"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("form");
            setOtp("");
          }}
          disabled={loading}
        >
          Change email
        </button>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister}>
      <h1>Register</h1>

      <input
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        disabled={loading}
      />

      <input
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        disabled={loading}
      />

      <input
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        disabled={loading}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Sending OTP..." : "Register"}
      </button>

      <p>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </form>
  );
}

export default Register;
