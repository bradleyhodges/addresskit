import type { IncomingMessage } from "node:http";
/**
 * Downloads a remote file to disk while emitting a console progress bar.
 *
 * @param {string} url - Remote URL to download.
 * @param {string | undefined} destinationPath - Optional destination path; defaults to the URL basename.
 * @param {number | undefined} expectedSize - Optional expected size used when the response omits content-length.
 * @returns {Promise<https.IncomingMessage>} Resolves with the response once the file is fully written.
 */
export default function streamDown(url: string, destinationPath?: string, expectedSize?: number): Promise<IncomingMessage>;
//# sourceMappingURL=stream-down.d.ts.map