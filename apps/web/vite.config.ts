import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		port: Number(process.env.PORT) || 5173,
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		reactRouter(),
		tsconfigPaths(),
		{
			name: "ignore-specific-paths",
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					const ignorePaths = ["/.well-known", "/sw.js", "/favicon.ico"];

					if (ignorePaths.some(path => req.url?.startsWith(path))) {
						res.statusCode = 404;
						res.end("Not Found");
						return;
					}

					next();
				});
			},
		},
	],
});
