"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printVersion = printVersion;
const version_1 = require("@repo/addresskit-core/version");
const dotenv = require("dotenv");
/**
 * Load the environment variables
 */
dotenv.config();
/**
 * Prints version and environment metadata to stdout.
 */
function printVersion() {
    // Get the environment from the process environment variables
    let environment = process.env.NODE_ENV || "development";
    // If the environment is development, add a message to the environment
    if (environment === "development")
        environment = `${environment}|(set NODE_ENV to 'production' in production environments)`;
    // Get the port from the process environment variables
    const port = process.env.PORT || 8080;
    // Print the version, environment, and port
    console.log(`Version: ${version_1.version}`);
    console.log(`NODE_ENV: ${environment}`);
    console.log(`PORT: ${port}`);
}
//# sourceMappingURL=printVersion.js.map