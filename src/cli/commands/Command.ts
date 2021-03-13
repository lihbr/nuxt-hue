export interface Command {
  name: string;
  description: string;
  usage: string;
  run: (args?: string[]) => Promise<void> | void;
}
