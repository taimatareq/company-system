import { useState } from "react";

import {
  FaLock,
  FaUser,
  FaBoxOpen,
} from "react-icons/fa";

import toast from "react-hot-toast";

const API_URL = "http://127.0.0.1:8000/api";

function LoginPage({ onLogin }) {

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = () => {

    if (
      username.trim() === "" ||
      password.trim() === ""
    ) {

      toast.error(
        "Please fill all fields"
      );

      return;

    }

    setLoading(true);

    fetch(`${API_URL}/token/`, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
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
            "Invalid username or password"
          );

          setLoading(false);

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
          "Login successful"
        );

        onLogin();

      })
      .catch((err) => {

        console.error(err);

        toast.error(
          "Login failed"
        );

      })
      .finally(() => {

        setLoading(false);

      });

  };

  return (

    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">

          <FaBoxOpen />

        </div>

        <h1 className="login-title">
          ERP System
        </h1>

        <p className="login-subtitle">
          Sign in to continue
        </p>

        {/* USERNAME */}

        <div className="login-input-group">

          <FaUser />

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
          />

        </div>

        {/* PASSWORD */}

        <div className="login-input-group">

          <FaLock />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

        </div>

        {/* BUTTON */}

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >

          {loading
            ? "Signing in..."
            : "Login"}

        </button>

      </div>

    </div>

  );

}

export default LoginPage;