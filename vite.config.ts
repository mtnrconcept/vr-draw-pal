import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const publicAppUrl = process.env.VITE_PUBLIC_APP_URL;
  const tunnelUrl = publicAppUrl ? new URL(publicAppUrl) : null;
  const tunnelHost = tunnelUrl?.hostname ?? null;
  const tunnelProtocol = tunnelUrl?.protocol ?? null;
  const tunnelPort =
    tunnelUrl?.port !== ""
      ? Number(tunnelUrl?.port)
      : tunnelProtocol === "https:"
      ? 443
      : tunnelProtocol === "http:"
      ? 80
      : null;

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      ...(tunnelHost
        ? {
            allowedHosts: [tunnelHost],
            origin: publicAppUrl,
            hmr: {
              host: tunnelHost,
              ...(tunnelPort ? { clientPort: tunnelPort } : {}),
              protocol: tunnelProtocol === "https:" ? "wss" : "ws",
            },
          }
        : {}),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
