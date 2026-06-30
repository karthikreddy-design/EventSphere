import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import supabase from "../../supabase/supabase";
import { logoutUser } from "../../services/authService";
import logo from "../../assets/eventsphere-logo.png";
import "../../styles/auth.css";

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("confirming");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const finishConfirmation = async () => {
      await logoutUser();

      if (!active) {
        return;
      }

      toast.success("Email confirmed! You can now log in.");
      navigate("/", { replace: true });
    };

    const confirmFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (!active) {
          return;
        }

        if (error) {
          setStatus("error");
          toast.error(error.message);
          return;
        }

        await finishConfirmation();
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await finishConfirmation();
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (event === "SIGNED_IN" && nextSession) {
          await finishConfirmation();
        }
      });

      unsubscribe = () => subscription.unsubscribe();

      window.setTimeout(() => {
        if (active) {
          setStatus("error");
        }
      }, 8000);
    };

    confirmFromUrl();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <img src={logo} alt="EventSphere" className="login-card__logo" />
          <span className="login-card__name">EventSphere</span>
          <h1 className="login-card__title">
            {status === "confirming" ? "Confirming email…" : "Confirmation failed"}
          </h1>
          <p className="login-card__subtitle">
            {status === "confirming"
              ? "Please wait while we verify your email."
              : "Use the 6-digit OTP on the register page instead of the email link."}
          </p>
        </div>
        {status === "error" && (
          <p className="login-card__footer">
            <Link to="/register">Back to register</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
