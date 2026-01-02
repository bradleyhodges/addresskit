"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@repo/addresskit-client/elasticsearch");
const debug_1 = __importDefault(require("debug"));
const config_1 = require("./service/config");
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
    if (config_1.VERBOSE)
        logger("server started");
    // Connect to the Elasticsearch client
    if (config_1.VERBOSE)
        logger("connecting es client");
    const esClient = await (0, elasticsearch_1.esConnect)();
    // Set the Elasticsearch client on the global scope
    global.esClient = esClient;
    if (config_1.VERBOSE)
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
    if (config_1.VERBOSE)
        logger("server bootstrap failed", error);
    throw error;
});
//# sourceMappingURL=server.js.map