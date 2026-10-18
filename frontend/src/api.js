const API_BASE_URL = "http://127.0.0.1:8000/api";

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return null;
    }

    const data = await response.json();

    if (data.access) {
      localStorage.setItem("access_token", data.access);
      return data.access;
    }

    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};


const apiFetch = async (endpoint, options = {}) => {
  let accessToken = localStorage.getItem("access_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (
    response.status === 401 &&
    localStorage.getItem("refresh_token")
  ) {
    accessToken = await refreshAccessToken();

    if (accessToken) {
      const retryHeaders = {
        ...(options.headers || {}),
      };

      if (
        options.body &&
        !retryHeaders["Content-Type"]
      ) {
        retryHeaders["Content-Type"] =
          "application/json";
      }

      retryHeaders.Authorization =
        `Bearer ${accessToken}`;

      response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers: retryHeaders,
        }
      );
    }
  }

  return response;
};


export { apiFetch };
export default apiFetch;