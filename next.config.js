const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/(.*)",
        has: [{ type: "host", value: "(?<org>.*).portaprosoftware.com" }],
        destination: "/$1",
      },
    ];
  },
};

export default nextConfig;
