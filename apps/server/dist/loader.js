"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@repo/addresskit-client/elasticsearch");
const debug_1 = require("debug");
const service_1 = require("./service");
const config_1 = require("./service/config");
const printVersion_1 = require("./service/printVersion");
/**
 * The logger for the API.
 */
const logger = (0, debug_1.default)("api");
/**
 * The logger for errors.
 */
const error = (0, debug_1.default)("error");
/**
 * If the DEBUG environment variable is not set, enable the API and error loggers
 */
if (process.env.DEBUG === undefined) {
    debug_1.default.enable("api,error");
}
/**
 * Loads G-NAF data into OpenSearch, measuring execution time.
 */
async function runLoader() {
    // Get the start time
    const start = process.hrtime();
    // Connect to the Elasticsearch client
    await (0, elasticsearch_1.esConnect)();
    if (config_1.VERBOSE)
        logger("es client connected");
    // Print the version and environment
    console.log("======================");
    console.log("AddressKit - Data Loader");
    console.log("=======================");
    (0, printVersion_1.printVersion)();
    // Load the G-NAF data
    await service_1.default.load();
    if (config_1.VERBOSE)
        logger("data loaded");
    // Get the end time
    const end = process.hrtime(start);
    if (config_1.VERBOSE)
        logger(`Execution time: ${end[0]}s ${end[1] / 1_000_000}ms`);
    if (config_1.VERBOSE)
        logger("Fin");
}
/**
 * Run the loader and catch any errors
 *
 * @param error_ - The error
 * @returns {Promise<void>}
 */
void runLoader().catch((error_) => {
    error("error loading data", error_);
    throw error_;
});
//# sourceMappingURL=loader.js.map