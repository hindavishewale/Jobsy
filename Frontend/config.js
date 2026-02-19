const isBrowser = typeof window !== "undefined";

const isLocalhost = isBrowser
  ? (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1")
  : true;

const API_BASE_URL = isLocalhost
  ? "${BACKEND_URL}"
  : "https://final-year-project-rk87.onrender.com";

if (isBrowser) {
  window.backend_URL = API_BASE_URL;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { backend_URL: API_BASE_URL };
}
