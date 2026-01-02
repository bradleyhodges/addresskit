/**
 * Starts the REST server and registers hypermedia resources.
 *
 * @returns {Promise<string>} The base URL where the server is listening.
 * @throws {Error} When server creation or listener binding fails.
 */
export declare function startRest2Server(): Promise<string>;
/**
 * Stops the HTTP server if it has been started.
 *
 * @returns {void} Nothing is returned; server state is updated in place.
 */
export declare function stopServer(): void;
//# sourceMappingURL=waycharterServer.d.ts.map