const nextConfig = {
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai'
      },
      {
        protocol: 'https',
        hostname: 'example.com'
      }
    ]
  }
}

export default nextConfig
