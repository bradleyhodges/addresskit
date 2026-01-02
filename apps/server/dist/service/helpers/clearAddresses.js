"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAddresses = void 0;
const elasticsearch_1 = require("@repo/addresskit-client/elasticsearch");
/**
 * Clears the addresses index.
 *
 * @returns {Promise<void>} Resolves after the index is cleared.
 */
const clearAddresses = async () => {
    await (0, elasticsearch_1.initIndex)(global.esClient, true);
};
exports.clearAddresses = clearAddresses;
//# sourceMappingURL=clearAddresses.js.map