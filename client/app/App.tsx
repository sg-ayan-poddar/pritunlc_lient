/// <reference path="References.d.ts"/>
import * as SourceMap from "source-map";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Blueprint from "@blueprintjs/core";
import Main from "./components/Main";
import * as Alert from "./Alert";
import * as Event from "./Event";
import * as Auth from "./Auth";
import * as Theme from "./Theme";
import * as Constants from "./Constants";
import Config from "./Config";
import * as Errors from "./Errors";
import * as Logger from "./Logger";

let sourceMap: SourceMap.RawSourceMap
let sourceMapPath = (window as any).source_map as string
let unerrCount = 0
let unrejCount = 0

window.onerror = (event, source, line, col, err): void => {
	unerrCount += 1
	if (unerrCount == 100) {
		Logger.errorAlert("Main: Ending unhandled error infinite loop")
		return
	} else if (unerrCount > 100) {
		return
	}

	err = new Errors.UnknownError(err, "Main: Unhandled exception", {
		event: event,
		source: source,
		line: line,
		column: col,
	})
	Logger.errorAlert(err, 0)
}

window.onunhandledrejection = (event): void => {
	unrejCount += 1
	if (unrejCount == 100) {
		Logger.errorAlert("Main: Ending unhandled rejection infinite loop")
		return
	} else if (unrejCount > 100) {
		return
	}

	let message = ""
	let stack = ""

	try {
		message = event.reason.message
	} catch {
		message = event.reason
	}

	try {
		stack = event.reason.stack
	} catch {
	}

	try {
		if (stack && sourceMap) {
			let stackLines = stack.split("\n")

			new SourceMap.SourceMapConsumer(sourceMap).then((consumer) => {
				try {
					let newStack = ""

					for (let line of stackLines) {
						let lines = line.split(":")
						if (lines.length < 3) {
							newStack += line + "\n"
							continue
						}

						let lineNum = parseInt(lines[lines.length-2], 10)
						let colNum = parseInt(lines[lines.length-1], 10)

						let position = consumer.originalPositionFor({
							line: lineNum,
							column: colNum,
						})

						let source = position.source.replace("webpack://pritunl/app/", "")

						if (position.name) {
							newStack += "  " + position.name + " (" + source +
								":" + position.line + ":" + position.column + ")\n"
						} else {
							newStack += "  " + source + ":" +
								position.line + ":" + position.column + "\n"
						}
					}

					let err = new Errors.UnhandledError(
						null, "Main: Unhandled rejection", message, newStack)
					Logger.errorAlert(err, 0)
				} catch {
					let err = new Errors.UnhandledError(
						null, "Main: Unhandled rejection", message, stack)
					Logger.errorAlert(err, 0)
				}
			}, () => {
				let err = new Errors.UnhandledError(
					null, "Main: Unhandled rejection", message, stack)
				Logger.errorAlert(err, 0)
			})

			return
		}
	} catch {
	}

	let err = new Errors.UnhandledError(
		null, "Main: Unhandled rejection", message, stack)
	Logger.errorAlert(err, 0)
}

try {
	let sourceMapReq = new XMLHttpRequest()
	sourceMapReq.open("GET", sourceMapPath)
	sourceMapReq.onreadystatechange = (): void => {
		if (sourceMapReq.readyState === 4) {
			sourceMap = JSON.parse(sourceMapReq.responseText)
		}
	}
	sourceMapReq.send()
} catch (err) {
	err = new Errors.ReadError(err, "Main: Failed to load source map", {
		path: sourceMapPath,
	})
	Logger.error(err)
}

try {
	(SourceMap.SourceMapConsumer as any).initialize({
		"lib/mappings.wasm": "static/mappings.wasm"
	})
} catch (err) {
	err = new Errors.ReadError(err, "Main: Failed to initialize source map", {
		path: sourceMapPath,
	})
	Logger.error(err)
}

Blueprint.FocusStyleManager.onlyShowFocusOnTabs();
Alert.init();

Config.load().then((): void => {
	if (Config.theme) {
		let themeParts = Config.theme.split("-")
		if (themeParts[1] === "5") {
			Theme.themeVer5()
		} else {
			Theme.themeVer3()
		}

		if (themeParts[0] === "light") {
			Theme.light();
		} else {
			Theme.dark();
		}
	} else {
		Theme.dark();
	}

	if (Config.editor_theme) {
		Theme.setEditorTheme(Config.editor_theme);
	}

	Constants.load();
	Auth.load().then((): void => {
		Event.init();

		ReactDOM.render(
			<div><Main/></div>,
			document.getElementById("app"),
		);
	});
});
