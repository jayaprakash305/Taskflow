const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname.includes("ngrok")
    ? "" // On ngrok, use the same domain (Vite will proxy /api to the backend)
    : "http://localhost:5000"
);

export default API_URL;
