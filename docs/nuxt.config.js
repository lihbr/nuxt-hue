import { withDocus } from 'docus'

export default withDocus({
	generate: {
		fallback: true
	},
	buildModules: [
		[
			'@nuxtjs/ackee',
			{
				server: process.env.ACKEE_ENDPOINT,
				domainId: process.env.ACKEE_ID,
				ignoreLocalhost: true,
				detailed: true
			}
		]
	]
})
