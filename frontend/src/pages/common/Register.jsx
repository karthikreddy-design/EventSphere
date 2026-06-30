import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import { toast } from "react-toastify";

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    const nameInput = formElement.elements.namedItem("name");
    const emailInput = formElement.elements.namedItem("email");
    const passwordInput = formElement.elements.namedItem("password");

    const nameValue =
      (nameInput instanceof HTMLInputElement ? nameInput.value : form.name).trim();
    const emailValue =
      (emailInput instanceof HTMLInputElement ? emailInput.value : form.email).trim();
    const passwordValue =
      passwordInput instanceof HTMLInputElement ? passwordInput.value : form.password;

    if (!nameValue || !emailValue || !passwordValue) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await registerUser(nameValue, emailValue, passwordValue);

      toast.success("Account created successfully");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
        {loading ? "Registering..." : "Register"}
      </button>

      <p>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </form>
  );
}

export default Register;
