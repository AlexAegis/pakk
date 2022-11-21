import { cyan, green, red, yellow } from 'kolorist';

export interface Logger {
	log: (message: string) => void;
	error: (message: string) => void;
}
export const createLogger = (options: { prefix: string }): Logger => {
	const colorWithPrefix = (message: string) => cyan(`[${options.prefix}] ${green(message)}`);
	const colorErrorWithPrefix = (message: string) => red(`[${options.prefix}] ${yellow(message)}`);

	return {
		log: (message: string): void => console.log(colorWithPrefix(message)),
		error: (message: string): void => console.log(colorErrorWithPrefix(message)),
	};
};

export const noopLogger: Logger = {
	error: () => false,
	log: () => false,
};
