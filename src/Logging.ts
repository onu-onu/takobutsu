declare const process: {
	env: {
		NODE_ENV: string;
	};
};

export class Logging {
	private mode: string;
	constructor() {
		this.mode = process.env.NODE_ENV;
	}
	public debug(...message: any[]) {
		if (this.mode == 'development')
			console.log(message);
	}
	public info(...message: any[]) {
		console.log(message);
	}
	public error(...message: any[]) {
		console.error(message);
	}
}