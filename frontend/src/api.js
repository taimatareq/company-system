const API_URL = "http://127.0.0.1:8000/api";

export async function apiFetch(
  endpoint,
  options = {}
) {

  let token =
    localStorage.getItem(
      "access_token"
    );

  let response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        ...(options.headers || {}),

        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",
      },
    }
  );

  if (response.status === 401) {

    const refresh =
      localStorage.getItem(
        "refresh_token"
      );

    const refreshResponse =
      await fetch(
        `${API_URL}/token/refresh/`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            refresh,
          }),
        }
      );

    if (!refreshResponse.ok) {

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );

      window.location.reload();

      return response;
    }

    const refreshData =
      await refreshResponse.json();

    localStorage.setItem(
      "access_token",
      refreshData.access
    );

    token =
      refreshData.access;

    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          ...(options.headers || {}),

          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },
      }
    );
  }

  return response;
}