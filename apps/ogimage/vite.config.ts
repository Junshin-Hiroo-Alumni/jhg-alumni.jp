import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		allowedHosts: ["ogimage.internal"],
		port: 3001,
	},
	plugins: [cloudflare()],
});
