import * as express from "express";
import type { Express } from "express";
/**
 * The swagger middleware type.
 */
type SwaggerMiddleware = {
    swaggerMetadata: () => express.RequestHandler;
    swaggerValidator: (options?: unknown) => express.RequestHandler;
    swaggerRouter: (options?: unknown) => express.RequestHandler;
    swaggerUi: (options?: unknown) => express.RequestHandler;
};
/**
 * The global scope for the swagger middleware.
 */
declare global {
    var swaggerDoc: any;
    var swaggerApp: Express | undefined;
    var swaggerMiddleware: SwaggerMiddleware | undefined;
}
/**
 * Initializes swagger-tools middleware and attaches standard handlers.
 *
 * @returns {Promise<{ app: Express; middleware: SwaggerMiddleware }>} Express app and middleware.
 */
export declare function swaggerInit(): Promise<{
    app: Express;
    middleware: SwaggerMiddleware;
}>;
/**
 * Starts the HTTP server with CORS header configuration.
 *
 * @returns {Promise<string>} Base URL once the server is listening.
 */
export declare function startServer(): Promise<string>;
/**
 * Stops the HTTP server if running.
 */
export declare function stopServer(): void;
export {};
//# sourceMappingURL=swagger.d.ts.map