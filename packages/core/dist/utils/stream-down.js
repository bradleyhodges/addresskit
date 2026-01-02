"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = streamDown;
const fs = require("node:fs");
const node_https_1 = require("node:https");
const path = require("node:path");
const node_url_1 = require("node:url");
/**
 * Gets the size of an existing file, returning 0 if the file doesn't exist.
 *
 * @param {string} filePath - Path to the file.
 * @returns {number} Size of the file in bytes, or 0 if not found.
 */
function getExistingFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    }
    catch {
        return 0;
    }
}
/**
 * Downloads a remote file to disk with optional progress callbacks.
 *
 * Supports both object-based options and legacy positional arguments.
 * Automatically resumes incomplete downloads when enableResume is true (default).
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
    // Check for existing partial file (resume support)
    const enableResume = opts.enableResume !== false;
    const existingSize = enableResume
        ? getExistingFileSize(resolvedDestination)
        : 0;
    const isResuming = existingSize > 0;
    // Notify about incomplete file detection
    if (isResuming && opts.onIncompleteDetected && opts.expectedSize) {
        opts.onIncompleteDetected(existingSize, opts.expectedSize);
    }
    // Create write stream with append flag if resuming
    const file = fs.createWriteStream(resolvedDestination, {
        flags: isResuming ? "a" : "w",
    });
    // Progress tracking state
    const progressInterval = opts.progressInterval ?? 100;
    return new Promise((resolve, reject) => {
        // Build request options with Range header for resume
        const requestOptions = {};
        if (isResuming) {
            requestOptions.headers = {
                Range: `bytes=${existingSize}-`,
            };
        }
        // Get the response from the URL
        (0, node_https_1.get)(uri.href, requestOptions, (response) => {
            // Handle redirects (3xx status codes)
            if (response.statusCode &&
                response.statusCode >= 300 &&
                response.statusCode < 400 &&
                response.headers.location) {
                // Follow the redirect
                file.close();
                // Only delete if not resuming, otherwise we lose progress
                if (!isResuming) {
                    try {
                        fs.unlinkSync(resolvedDestination);
                    }
                    catch {
                        // File may not exist yet
                    }
                }
                streamDown({
                    ...opts,
                    url: response.headers.location,
                })
                    .then(resolve)
                    .catch(reject);
                return;
            }
            // Check if server supports resume (206 Partial Content)
            const serverSupportsResume = response.statusCode === 206;
            // If we tried to resume but server doesn't support it, restart from beginning
            if (isResuming &&
                !serverSupportsResume &&
                response.statusCode === 200) {
                file.close();
                // Delete the partial file and start fresh
                try {
                    fs.unlinkSync(resolvedDestination);
                }
                catch {
                    // Ignore deletion errors
                }
                // Retry without resume
                streamDown({
                    ...opts,
                    enableResume: false,
                })
                    .then(resolve)
                    .catch(reject);
                return;
            }
            // Get the content length header
            const contentLengthHeader = response.headers["content-length"];
            // Calculate total bytes - for resumed downloads, add existing size
            let totalBytes;
            if (serverSupportsResume && contentLengthHeader !== undefined) {
                // Server returned remaining bytes in content-length
                totalBytes =
                    existingSize + Number.parseInt(contentLengthHeader, 10);
            }
            else if (contentLengthHeader !== undefined) {
                totalBytes = Number.parseInt(contentLengthHeader, 10);
            }
            else {
                totalBytes = opts.expectedSize ?? 0;
            }
            // Progress tracking - start from existing size if resuming
            let bytesDownloaded = serverSupportsResume ? existingSize : 0;
            const bytesDownloadedStart = bytesDownloaded;
            let lastProgressTime = Date.now();
            let lastProgressBytes = bytesDownloaded;
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
                    isResuming: serverSupportsResume && isResuming,
                    resumedFromBytes: serverSupportsResume
                        ? existingSize
                        : undefined,
                });
            };
            // Emit initial progress if resuming
            if (serverSupportsResume && isResuming) {
                emitProgress(true);
            }
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