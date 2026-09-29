import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		allowedHosts: ["ogimage.internal"],
	},
	plugins: [cloudflare()],
});
