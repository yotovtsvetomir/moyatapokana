import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: false,
	images: {
	    remotePatterns: [
	      {
	        protocol: 'http',
	        hostname: 'localhost',
	        port: '9000',
	        pathname: '/moyatapokana/**',
	      },
	    ],
	},
};

export default nextConfig;
