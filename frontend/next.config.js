/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // keep this relative to the frontend folder; '.' is fine here
    root: './'
  },
  compiler: {
    // enables built‑in styled-components support
    styledComponents: true
  }
};

module.exports = nextConfig;