import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const thisFilePath = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFilePath);

const nextConfig: NextConfig = {
  turbopack: {
    root: thisDir
  }
};

export default nextConfig;
