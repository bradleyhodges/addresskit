"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@repo/addresskit-client/elasticsearch");
const debug_1 = require("debug");
const printVersion_1 = require("./service/printVersion");
const swagger_1 = require("./swagger");
/**
 * The logger for the API.
 */
const logger = (0, debug_1.default)("api");
/**
 * Boots the HTTP API then connects the shared OpenSearch client.
 *
 * This runs the HTTP server first so health endpoints come up quickly,
 * then establishes the expensive OpenSearch connection and stores it
 * on the global scope for downstream handlers.
 */
async function bootstrap() {
    // Start the server
    await (0, swagger_1.startServer)();
    logger("server started");
    // Connect to the Elasticsearch client
    logger("connecting es client");
    const esClient = await (0, elasticsearch_1.esConnect)();
    // Set the Elasticsearch client on the global scope
    global.esClient = esClient;
    logger("es client connected");
    // Print the version and environment
    console.log("=======================");
    console.log("AddressKit - API Server");
    console.log("=======================");
    (0, printVersion_1.printVersion)();
}
/**
 * Bootstrap the server and catch any errors
 *
 * @param error - The error
 * @returns {Promise<void>}
 */
void bootstrap().catch((error) => {
    logger("server bootstrap failed", error);
    throw error;
});
//# sourceMappingURL=server.js.map