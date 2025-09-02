import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
};

export default withPWA(nextConfig);
