import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaLock, FaUser } from "react-icons/fa";

import loginBackground from "../assets/login-background.png";
import emesaLogo from "../assets/emesa-log.png";

import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

const API_URL = "http://127.0.0.1:8000/api";

function LoginPage({ onLogin }) {
  const { t, i18n } = useTranslation();

  const isArabic = i18n.language?.startsWith("ar");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // CHANGE LANGUAGE
  // =========================

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? "en" : "ar");
  };

  // =========================
  // NORMAL LOGIN
  // =========================

  const handleLogin = () => {
    if (
      username.trim() === "" ||
      password.trim() === ""
    ) {
      toast.error(t("please_fill_all_fields"));
      return;
    }

    setLoading(true);

    fetch(`${API_URL}/token/`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.access) {
          toast.error(
            t("invalid_username_or_password")
          );

          return;
        }

        localStorage.setItem(
          "access_token",
          data.access
        );

        localStorage.setItem(
          "refresh_token",
          data.refresh
        );

        toast.success(
          t("login_successful")
        );

        onLogin();
      })
      .catch((err) => {
        console.error(err);

        toast.error(
          t("login_failed")
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // =========================
  // GOOGLE LOGIN
  // =========================

  const handleGoogleLogin = async (
    credentialResponse
  ) => {
    console.log(
      "GOOGLE SUCCESS",
      credentialResponse
    );

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/users/google-login/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            credential:
              credentialResponse.credential,
          }),
        }
      );

      console.log(
        "GOOGLE BACKEND STATUS:",
        response.status
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Google backend error:",
          data
        );

        toast.error(
          data.detail ||
            t("google_login_failed")
        );

        return;
      }

      localStorage.setItem(
        "access_token",
        data.access
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh
      );

      toast.success(
        t("login_successful")
      );

      onLogin();

    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      toast.error(
        t("google_login_failed")
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{
        backgroundImage:
          `url(${loginBackground})`,
      }}
    >
      {/* LANGUAGE */}

      <button
        type="button"
        className="login-language-btn"
        onClick={toggleLanguage}
      >
        {isArabic ? "EN" : "العربية"}
      </button>

      {/* LOGIN FORM */}

      <form
        className="login-card"
        dir={isArabic ? "rtl" : "ltr"}
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        {/* LOGO + TITLE */}

        <div className="login-brand">
          <img
            src={emesaLogo}
            alt="EMESA Analytica"
            className="login-emesa-logo"
          />

          <h1 className="login-title">
            {t("welcome_back")}
          </h1>

          <p className="login-subtitle">
            {t("sign_in_to_continue")}
          </p>
        </div>

        {/* USERNAME */}

        <fieldset className="login-input-group">
          <legend>
            {t("username")}
          </legend>

          <FaUser />

          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />
        </fieldset>

        {/* PASSWORD */}

        <fieldset className="login-input-group">
          <legend>
            {t("password")}
          </legend>

          <FaLock />

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </fieldset>

        {/* LOGIN BUTTON */}

        <button
          type="submit"
          className="login-btn"
          disabled={loading}
        >
          {loading
            ? t("signing_in")
            : t("login")}
        </button>

        {/* OR */}

        <div className="login-divider">
          <span>{t("or")}</span>
        </div>

        {/* GOOGLE LOGIN */}

        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            console.log(
              "GOOGLE LOGIN ERROR"
            );

            toast.error(
              t("google_login_failed")
            );
          }}
        />
      </form>
    </div>
  );
}

export default LoginPage;