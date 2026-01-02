"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = streamDown;
const fs = require("node:fs");
const node_https_1 = require("node:https");
const path = require("node:path");
const node_url_1 = require("node:url");
/**
 * Downloads a remote file to disk with optional progress callbacks.
 *
 * Supports both object-based options and legacy positional arguments.
 *
 * @param {StreamDownOptions | string} optionsOrUrl - Options object or URL string.
 * @param {string} destinationPath - Optional destination path (legacy).
 * @param {number} expectedSize - Optional expected size (legacy).
 * @param {(progress: DownloadProgress) => void} onProgress - Optional progress callback (legacy).
 * @returns {Promise<IncomingMessage>} Resolves with the response once the file is fully written.
 */
function streamDown(optionsOrUrl, destinationPath, expectedSize, onProgress) {
    // Normalize arguments to options object
    const opts = typeof optionsOrUrl === "string"
        ? {
            url: optionsOrUrl,
            destinationPath,
            expectedSize,
            onProgress,
        }
        : optionsOrUrl;
    // Parse the URL using the modern WHATWG URL API
    const uri = new node_url_1.URL(opts.url);
    // Resolve the destination path to a file name
    const resolvedDestination = opts.destinationPath ?? path.basename(uri.pathname ?? opts.url);
    // Create a write stream to the resolved destination
    const file = fs.createWriteStream(resolvedDestination);
    // Progress tracking state
    const progressInterval = opts.progressInterval ?? 100;
    return new Promise((resolve, reject) => {
        // Get the response from the URL
        (0, node_https_1.get)(uri.href, (response) => {
            // Handle redirects (3xx status codes)
            if (response.statusCode &&
                response.statusCode >= 300 &&
                response.statusCode < 400 &&
                response.headers.location) {
                // Follow the redirect
                file.close();
                fs.unlinkSync(resolvedDestination);
                streamDown({
                    ...opts,
                    url: response.headers.location,
                })
                    .then(resolve)
                    .catch(reject);
                return;
            }
            // Get the content length header
            const contentLengthHeader = response.headers["content-length"];
            // Calculate the total bytes to download
            const totalBytes = contentLengthHeader !== undefined
                ? Number.parseInt(contentLengthHeader, 10)
                : (opts.expectedSize ?? 0);
            // Progress tracking
            let bytesDownloaded = 0;
            let lastProgressTime = Date.now();
            let lastProgressBytes = 0;
            let bytesPerSecond = 0;
            // Throttle progress updates
            let lastEmitTime = 0;
            /**
             * Emits a progress update to the callback if provided.
             *
             * @param {boolean} force - Whether to force emit regardless of throttle.
             */
            const emitProgress = (force = false) => {
                if (!opts.onProgress)
                    return;
                const now = Date.now();
                if (!force && now - lastEmitTime < progressInterval)
                    return;
                lastEmitTime = now;
                // Calculate speed (bytes per second)
                const timeDelta = now - lastProgressTime;
                if (timeDelta > 0) {
                    const bytesDelta = bytesDownloaded - lastProgressBytes;
                    bytesPerSecond = Math.round((bytesDelta / timeDelta) * 1000);
                    lastProgressTime = now;
                    lastProgressBytes = bytesDownloaded;
                }
                // Calculate ETA
                const remainingBytes = totalBytes - bytesDownloaded;
                const etaSeconds = bytesPerSecond > 0
                    ? Math.round(remainingBytes / bytesPerSecond)
                    : 0;
                // Calculate percentage
                const percentComplete = totalBytes > 0
                    ? Math.min(100, (bytesDownloaded / totalBytes) * 100)
                    : 0;
                opts.onProgress({
                    bytesDownloaded,
                    totalBytes,
                    bytesPerSecond,
                    etaSeconds,
                    percentComplete,
                });
            };
            // Write the data to the file
            response.on("data", (chunk) => {
                file.write(chunk);
                bytesDownloaded += chunk.length;
                emitProgress();
            });
            // End the file
            response.on("end", () => {
                file.end();
                // Emit final progress
                emitProgress(true);
                resolve(response);
            });
            // Handle errors
            response.on("error", (error) => {
                file.close();
                reject(error);
            });
        }).on("error", (error) => {
            file.close();
            reject(error);
        });
    });
}
//# sourceMappingURL=stream-down.js.map