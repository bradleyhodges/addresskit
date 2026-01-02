import { initIndex } from "@repo/addressr-client/elasticsearch";
import { type Client } from "@opensearch-project/opensearch";

/**
 * Clears the addresses index.
 *
 * @returns {Promise<void>} Resolves after the index is cleared.
 */
export const clearAddresses = async (): Promise<void> => {
    await initIndex(global.esClient as Client, true);
};
