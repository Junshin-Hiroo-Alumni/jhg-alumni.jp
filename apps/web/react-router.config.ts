import type { Config } from "@react-router/dev/config";

export default {
	ssr: true,
	// React Router v8 への先行オプトイン一式（公式 Cloudflare テンプレート準拠）。
	// v8_viteEnvironmentApi が @cloudflare/vite-plugin のビルド統合に必須。
	// フラグ名は v8_ 固定のため命名規則 lint を各行で抑制する。
	future: {
		// biome-ignore lint/style/useNamingConvention: React Router future flag
		v8_middleware: true,
		// biome-ignore lint/style/useNamingConvention: React Router future flag
		v8_passThroughRequests: true,
		// biome-ignore lint/style/useNamingConvention: React Router future flag
		v8_splitRouteModules: true,
		// biome-ignore lint/style/useNamingConvention: React Router future flag
		v8_trailingSlashAwareDataRequests: true,
		// biome-ignore lint/style/useNamingConvention: React Router future flag
		v8_viteEnvironmentApi: true,
	},
} satisfies Config;
