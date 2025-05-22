"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorWithStack = void 0;
class ErrorWithStack extends Error {
    constructor(message) {
        super(message);
        this.name = 'ErrorWithStack';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ErrorWithStack = ErrorWithStack;
