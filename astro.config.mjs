import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [formsPlugin()],
			// Sandboxed plugins (e.g. webhookNotifier), the Worker Loader runtime, and
			// the EmDash marketplace integration all require Workers Paid. Disabled for
			// the Free tier; restore by re-adding `sandboxed`, `sandboxRunner: sandbox()`,
			// and `marketplace: "https://marketplace.emdashcms.com"`.
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
	vite: {
		optimizeDeps: {
			exclude: ["workers-og"],
		},
	},
});
