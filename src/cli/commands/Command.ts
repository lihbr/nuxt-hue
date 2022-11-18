export interface Command {
	name: string;
	description: string;
	usage: string;
	run: (
		args?: string[],
		options?: {
			programmatic?: boolean;
		}
	) => Promise<void> | void;
}
