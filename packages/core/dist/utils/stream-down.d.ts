import type { IncomingMessage } from "node:http";
/**
 * Progress information provided during download.
 */
export interface DownloadProgress {
    /** Bytes downloaded so far */
    bytesDownloaded: number;
    /** Total bytes to download (may be 0 if unknown) */
    totalBytes: number;
    /** Download speed in bytes per second */
    bytesPerSecond: number;
    /** Estimated time remaining in seconds */
    etaSeconds: number;
    /** Percentage complete (0-100) */
    percentComplete: number;
}
/**
 * Options for the streamDown function.
 */
export interface StreamDownOptions {
    /** Remote URL to download */
    url: string;
    /** Optional destination path; defaults to the URL basename */
    destinationPath?: string;
    /** Optional expected size used when the response omits content-length */
    expectedSize?: number;
    /** Optional callback invoked on each progress update */
    onProgress?: (progress: DownloadProgress) => void;
    /** Progress update interval in milliseconds (default: 100ms) */
    progressInterval?: number;
}
/**
 * Downloads a remote file to disk with optional progress callbacks.
 *
 * @param {StreamDownOptions} options - Download options including URL and callbacks.
 * @returns {Promise<IncomingMessage>} Resolves with the response once the file is fully written.
 */
export default function streamDown(options: StreamDownOptions): Promise<IncomingMessage>;
/**
 * Downloads a remote file to disk (legacy signature).
 *
 * @param {string} url - Remote URL to download.
 * @param {string | undefined} destinationPath - Optional destination path; defaults to the URL basename.
 * @param {number | undefined} expectedSize - Optional expected size used when the response omits content-length.
 * @param {(progress: DownloadProgress) => void} onProgress - Optional progress callback.
 * @returns {Promise<IncomingMessage>} Resolves with the response once the file is fully written.
 */
export default function streamDown(url: string, destinationPath?: string, expectedSize?: number, onProgress?: (progress: DownloadProgress) => void): Promise<IncomingMessage>;
//# sourceMappingURL=stream-down.d.ts.map