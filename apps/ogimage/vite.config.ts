import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		allowedHosts: ["ogimage.internal"],
		port: 3002,
	},
	plugins: [cloudflare({ inspectorPort: 9232 })],
});
