"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = streamDown;
const fs = require("node:fs");
const node_https_1 = require("node:https");
const path = require("node:path");
const node_url_1 = require("node:url");
// biome-ignore lint/suspicious/noExplicitAny: progress does not ship types
const ProgressBar = require("progress");
/**
 * Downloads a remote file to disk while emitting a console progress bar.
 *
 * @param {string} url - Remote URL to download.
 * @param {string | undefined} destinationPath - Optional destination path; defaults to the URL basename.
 * @param {number | undefined} expectedSize - Optional expected size used when the response omits content-length.
 * @returns {Promise<https.IncomingMessage>} Resolves with the response once the file is fully written.
 */
function streamDown(url, destinationPath, expectedSize) {
    const uri = (0, node_url_1.parse)(url);
    const resolvedDestination = destinationPath ?? path.basename(uri.path ?? url);
    const file = fs.createWriteStream(resolvedDestination);
    return new Promise((resolve, reject) => {
        (0, node_https_1.get)(uri.href, (response) => {
            const contentLengthHeader = response.headers["content-length"];
            const totalBytes = contentLengthHeader !== undefined
                ? Number.parseInt(contentLengthHeader, 10)
                : (expectedSize ?? 0);
            const progressBar = new ProgressBar("  downloading [:bar] :rate/bps :percent :etas", {
                complete: "=",
                incomplete: " ",
                width: 20,
                total: totalBytes,
            });
            response.on("data", (chunk) => {
                file.write(chunk);
                progressBar.tick(chunk.length);
            });
            response.on("end", () => {
                file.end();
                console.log(`\n${uri.path} downloaded to: ${resolvedDestination}`);
                resolve(response);
            });
            response.on("error", (error) => {
                reject(error);
            });
        });
    });
}
//# sourceMappingURL=stream-down.js.map