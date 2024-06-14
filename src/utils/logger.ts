import consola from "consola"

export const logger = "withScope" in consola && typeof consola.withScope === "function"
	? consola.withScope("nuxt-hue")
	: consola.withTag("nuxt-hue")
