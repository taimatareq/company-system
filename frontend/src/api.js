const API_BASE_URL = "http://127.0.0.1:8000/api";

let refreshPromise = null;

const clearSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("selectedSalesInvoice");

  window.location.href = "/";
};

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

const getNewAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    const newToken = await getNewAccessToken();

    if (newToken) {
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };

      response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers: retryHeaders,
        }
      );
    }

    if (response.status === 401 || !newToken) {
      clearSession();
      throw new Error("SESSION_EXPIRED");
    }
  }

  return response;
}

export default apiFetch;