class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        Object.setPrototypeOf(this, ApiError.prototype);
        
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = true; 

        Error.captureStackTrace(this, this.constructor);
    }
    
    static badRequest(message) {
        return new ApiError(400, message || 'Bad Request');
    }
    
    static unauthorized(message) {
        return new ApiError(401, message || 'Unauthorized');
    }
    
    static forbidden(message) {
        return new ApiError(403, message || 'Forbidden');
    }
    
    static notFound(message) {
        return new ApiError(404, message || 'Not Found');
    }
    
    static internalServerError(message) {
        return new ApiError(500, message || 'Internal Server Error');
    }
    
    toJSON() {
        return {
            statusCode: this.statusCode,
            message: this.message,
        };
    }
}

export { ApiError };