import { IncomingMessage } from "node:http";
import type { DefaultTreeAdapterMap, ParserError } from "parse5";

/**
 * --------------------------- start ---------------------------
 * @link https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/html.ts#L148C1-L152C2
 */
function handleParseError(parserError: ParserError, filePath: string) {
	switch (parserError.code) {
		case "missing-doctype":
			// ignore missing DOCTYPE
			return;
		case "abandoned-head-element-child":
			// Accept elements without closing tag in <head>
			return;
		case "duplicate-attribute":
			// Accept duplicate attributes #9566
			// The first attribute is used, browsers silently ignore duplicates
			return;
		case "non-void-html-element-start-tag-with-trailing-solidus":
			// Allow self closing on non-void elements #10439
			return;
	}
	throw new Error(
		`Unable to parse HTML; ${parserError.code}\n` +
			` at ${filePath}:${parserError.startLine}:${parserError.startCol}\n`,
	);
}
export function nodeIsElement(node: DefaultTreeAdapterMap["node"]): node is DefaultTreeAdapterMap["element"] {
	return node.nodeName[0] !== "#";
}

function traverseNodes(node: DefaultTreeAdapterMap["node"], visitor: (node: DefaultTreeAdapterMap["node"]) => void) {
	visitor(node);
	if (nodeIsElement(node) || node.nodeName === "#document" || node.nodeName === "#document-fragment") {
		node.childNodes.forEach((childNode) => traverseNodes(childNode, visitor));
	}
}

export async function traverseHtml(
	html: string,
	filePath: string,
	visitor: (node: DefaultTreeAdapterMap["node"]) => void,
): Promise<void> {
	// lazy load compiler
	const { parse } = await import("parse5");
	const ast = parse(html, {
		scriptingEnabled: false, // parse inside <noscript>
		sourceCodeLocationInfo: true,
		onParseError: (e: ParserError) => {
			handleParseError(e, filePath);
		},
	});
	traverseNodes(ast, visitor);
}

/**
 * --------------------------- end ---------------------------
 * @link https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/html.ts#L148C1-L152C2
 */

export function getRequestData(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = "";

		req.on("data", (chunk: Buffer) => {
			body += chunk.toString();
		});

		req.on("end", () => {
			resolve(body);
		});

		req.on("error", (error: Error) => {
			reject(error);
		});
	});
}
