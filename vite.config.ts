import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const DEFAULT_TUNNEL_HOST = "a15504d9f54e.ngrok-free.app";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicAppUrl = process.env.VITE_PUBLIC_APP_URL || env.VITE_PUBLIC_APP_URL;
  const localLlmUrl = env.VITE_LOCAL_LLM_URL;

  const tunnelUrl = publicAppUrl ? new URL(publicAppUrl) : null;
  const tunnelHost = tunnelUrl?.hostname ?? null;
  const tunnelProtocol = tunnelUrl?.protocol ?? null;
  const tunnelPort =
    tunnelUrl?.port && tunnelUrl.port.length > 0
      ? Number(tunnelUrl.port)
      : tunnelProtocol === "https:"
        ? 443
        : tunnelProtocol === "http:"
          ? 80
          : null;

  const allowedHosts = new Set<string>([DEFAULT_TUNNEL_HOST, "localhost", "127.0.0.1"]);
  if (tunnelHost) {
    allowedHosts.add(tunnelHost);
  }

  const hmrConfig =
    tunnelHost || tunnelPort
      ? {
        host: tunnelHost ?? DEFAULT_TUNNEL_HOST,
        ...(tunnelPort ? { clientPort: tunnelPort } : {}),
        protocol: tunnelProtocol === "https:" ? "wss" : "ws",
      }
      : undefined;

  console.log("Proxying /api/llm to:", localLlmUrl || "http://192.168.0.33:1234");

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      ...(allowedHosts.size
        ? {
          allowedHosts: Array.from(allowedHosts),
          origin: publicAppUrl ?? `https://${DEFAULT_TUNNEL_HOST}`,
          // hmr: hmrConfig, // Commented out to fix local dev instability. Uncomment if HMR fails on VR headset.
        }
        : {}),
      proxy: {
        "/api/llm": {
          target: localLlmUrl || "http://192.168.0.33:1234",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/llm/, "/v1"),
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("Sending Request to the Target:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
