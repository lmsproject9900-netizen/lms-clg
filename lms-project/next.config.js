/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.3.194', 'localhost', '*.local-origin.dev'],
  reactStrictMode: true,
};

module.exports = nextConfig;