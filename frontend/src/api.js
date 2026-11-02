const API_BASE_URL = "http://127.0.0.1:8000/api";


const clearSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("selectedSalesInvoice");
};


const redirectToLogin = () => {
  clearSession();

  window.location.href = "/";
};


const refreshAccessToken = async () => {
  const refreshToken =
    localStorage.getItem("refresh_token");

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

    const newAccessToken =
      data.access;


    if (!newAccessToken) {
      return null;
    }


    localStorage.setItem(
      "access_token",
      newAccessToken
    );


    return newAccessToken;

  } catch (error) {
    console.error(
      "Token refresh failed:",
      error
    );

    return null;
  }
};


const buildHeaders = (
  options,
  token
) => {
  const isFormData =
    options.body instanceof FormData;


  const headers = {
    ...(options.headers || {}),
  };


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  if (!isFormData) {
    headers["Content-Type"] =
      "application/json";
  }


  return headers;
};


export async function apiFetch(
  endpoint,
  options = {}
) {
  let token =
    localStorage.getItem(
      "access_token"
    );


  let headers =
    buildHeaders(
      options,
      token
    );


  let response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );


  if (response.status !== 401) {
    return response;
  }


  const newAccessToken =
    await refreshAccessToken();


  if (!newAccessToken) {
    redirectToLogin();

    throw new Error(
      "SESSION_EXPIRED"
    );
  }


  token =
    newAccessToken;


  headers =
    buildHeaders(
      options,
      token
    );


  response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );


  if (response.status === 401) {
    redirectToLogin();

    throw new Error(
      "SESSION_EXPIRED"
    );
  }


  return response;
}