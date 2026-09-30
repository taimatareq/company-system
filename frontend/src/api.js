const API_URL = "http://127.0.0.1:8000/api";

export async function apiFetch(
  endpoint,
  options = {}
) {
  const token =
    localStorage.getItem("access_token");

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

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem(
      "currentUser"
    );

    localStorage.removeItem(
      "selectedSalesInvoice"
    );

    window.location.reload();
  }

  return response;
}