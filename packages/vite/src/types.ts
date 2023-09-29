export type { FakeRoute, IncomingMessage, ServerResponse, HttpMethodType } from "faker-schema-server";

import type { FakerSchemaServerOptions } from "faker-schema-server";

export interface VitePluginFakerOptions extends Omit<FakerSchemaServerOptions, "include"> {
	include?: string;
	enable?: boolean;
}