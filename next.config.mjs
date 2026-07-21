/** @type {import('next').NextConfig} */
const nextConfig = process.env.NEXT_OUTPUT_EXPORT === "true" ? { output: "export" } : {};

export default nextConfig;

