/// <reference path="./References.d.ts"/>

export class BaseError extends Error {
	name: string
	message: string
	stack: string

	constructor(name: string, wrapErr: Error, message: string,
		args?: {[key: string]: any}) {

		super()

		if (args) {
			for (let key in args) {
				message += " " + key + "=" + args[key]
			}
		}

		if (wrapErr) {
			message += '\n' + wrapErr
		}

		this.name = name
		this.message = message
		if (wrapErr) {
			this.stack = wrapErr.stack
		}
	}
}

export class ReadError extends BaseError {
	constructor(wrapErr: Error, message: string, args?: {[key: string]: any}) {
		super("ReadError", wrapErr, message, args)
	}
}

export class WriteError extends BaseError {
	constructor(wrapErr: Error, message: string, args?: {[key: string]: any}) {
		super("WriteError", wrapErr, message, args)
	}
}

export class ParseError extends BaseError {
	constructor(wrapErr: Error, message: string, args?: {[key: string]: any}) {
		super("ParseError", wrapErr, message, args)
	}
}

export class RequestError extends BaseError {
	constructor(wrapErr: Error, message: string, args?: {[key: string]: any}) {
		super("RequestError", wrapErr, message, args)
	}
}

export class ExecError extends BaseError {
	constructor(wrapErr: Error, message: string, args?: {[key: string]: any}) {
		super("ExecError", wrapErr, message, args)
	}
}

export class UnknownError extends BaseError {
	constructor(wrapErr: Error, message: string, args?: {[key: string]: any}) {
		super("UnknownError", wrapErr, message, args)
	}
}

export class UnhandledError extends BaseError {
	constructor(wrapErr: Error, message: string, origMessage: string,
		origStack: string) {

		super("UnhandledError", wrapErr, message, {
			message: origMessage,
			stack: origStack,
		})
		this.stack = origStack
	}
}
