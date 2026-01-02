"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@repo/addresskit-client/elasticsearch");
const debug_1 = require("debug");
const config_1 = require("../service/config");
const printVersion_1 = require("../service/printVersion");
const waycharterServer_1 = require("./waycharterServer");
const logger = (0, debug_1.default)("api");
/**
 * Connects to Elasticsearch and stores the client on the global namespace for reuse.
 *
 * @returns {Promise<void>} Resolves when the client is available for downstream modules.
 * @throws {Error} When the Elasticsearch client cannot be created.
 */
async function connectElasticSearchClient() {
    // Connect to Elasticsearch
    const esClient = await (0, elasticsearch_1.esConnect)();
    // Set the Elasticsearch client on the global namespace
    global.esClient = esClient;
    if (config_1.VERBOSE)
        logger("es client connected");
}
/**
 * Boots the REST server, establishes shared dependencies, and prints build metadata.
 *
 * @returns {Promise<void>} Resolves when startup routines finish.
 * @throws {Error} When the REST server or Elasticsearch client fails to start.
 */
async function bootstrapServer() {
    // Start the REST server
    if (config_1.VERBOSE)
        logger("starting REST server");
    await (0, waycharterServer_1.startRest2Server)();
    // Connect to Elasticsearch
    if (config_1.VERBOSE)
        logger("connecting es client");
    await connectElasticSearchClient();
    // Print the version and environment
    console.log("=======================");
    console.log("AddressKit - API Server 2");
    console.log("=======================");
    (0, printVersion_1.printVersion)();
}
// Bootstrap the server
void bootstrapServer();
//# sourceMappingURL=server2.js.map