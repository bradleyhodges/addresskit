"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.printVersion = printVersion;
const version_1 = require("@repo/addresskit-core/version");
const dotenv = __importStar(require("dotenv"));
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