import { defineConfig } from "vite"
import sdk from "vite-plugin-sdk"

export default defineConfig({
	define: {
		importMetaHot: "import.meta.hot",
	},
	build: {
		lib: {
			entry: ["src/module.ts", "src/plugin.ts", "src/cli.ts"],
		},
		rollupOptions: {
			external: ["#app"],
		},
	},
	plugins: [sdk()],
	test: {
		coverage: {
			reporter: ["lcovonly", "text"],
		},
	},
})
