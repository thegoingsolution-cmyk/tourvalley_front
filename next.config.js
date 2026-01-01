/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API 프록시 설정 (개발 환경)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

