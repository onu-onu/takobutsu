declare const process: {
  env: {
    NODE_ENV: string;
  };
};

export class Logging {
    constructor() {

    }
    public debug(message: any) {
        if (process.env.NODE_ENV == 'development')
            console.debug(message);
    }
    public info(message: any) {
        console.log(message);
    }
    public error(message: any) {
        console.error(message);
    }
}