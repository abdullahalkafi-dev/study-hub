const API_URL = process.env.API_URL || "http://localhost:4000";

/** @type {import('next').NextConfig} */
export default {
  output: "standalone",
  // The browser only talks to the web origin; /api is proxied to the Express API (same-origin cookies, no CORS).
  async rewrites() { return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }]; }
};
