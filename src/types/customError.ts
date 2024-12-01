export class CustomError extends Error {
    statusCode?: number;
    details?: any;
    
    constructor(
        statusCode: number,
        options: { message?: string, details?: any }
    ){
        super(options.message);
        this.statusCode = statusCode;
        this.details = options.details;

        Object.setPrototypeOf(this, CustomError.prototype);
    }

    toJSON() {
        return {
            statusCode: this.statusCode,
            message: this.message,
            details: this.details,
        };
    }
}