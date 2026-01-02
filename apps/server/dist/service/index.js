"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchForAddress = exports.setAddresses = exports.mapToSearchAddressResponse = exports.getAddresses = exports.getAddress = exports.gotClient = exports.keepAliveAgent = exports.gnafHttpCache = exports.cache = exports.error = exports.logger = exports.readdir = exports.fsp = void 0;
const crypto = require("node:crypto");
const fs = require("node:fs");
const node_https_1 = require("node:https");
const debug_1 = require("debug");
const got = require("got");
const LinkHeader = require("http-link-header");
const Keyv = require("keyv");
const keyv_file_1 = require("keyv-file");
const load_1 = require("./commands/load");
const conf_1 = require("./conf");
const helpers_1 = require("./helpers");
const setLinkOptions_1 = require("./setLinkOptions");
/**
 * Make the file system promises available globally.
 */
exports.fsp = fs.promises;
exports.readdir = exports.fsp.readdir;
/**
 * Loggers for the API.
 */
exports.logger = (0, debug_1.default)("api");
exports.error = (0, debug_1.default)("error");
/**
 * The cache for the API.
 */
exports.cache = new Keyv({
    store: new keyv_file_1.KeyvFile({ filename: "target/keyv-file.msgpack" }),
});
/**
 * Persistent HTTP cache for Got requests to avoid re-downloading unchanged payloads.
 */
exports.gnafHttpCache = new Keyv({
    store: new keyv_file_1.KeyvFile({ filename: "target/gnaf-http-cache.msgpack" }),
    namespace: "gnaf-http-cache",
});
/**
 * Shared keep-alive HTTPS agent to reuse sockets across fetches.
 */
exports.keepAliveAgent = new node_https_1.Agent({
    keepAlive: true,
    maxSockets: 10,
});
/**
 * Got client configured for persistent HTTP cache reuse and keep-alive sockets.
 */
exports.gotClient = got.extend({
    cache: exports.gnafHttpCache,
    agent: { http: exports.keepAliveAgent, https: exports.keepAliveAgent },
});
// ---------------------------------------------------------------------------------
/**
 * Sets the addresses in the index.
 *
 * @param addr - The addresses to set.
 */
const setAddresses = async (addr) => {
    // Clear the addresses index
    await (0, helpers_1.clearAddresses)();
    // Create the indexing body
    const indexingBody = [];
    // Loop through the addresses and build index operations
    for (const row of addr) {
        // Add the index operation header
        indexingBody.push({
            index: {
                _index: conf_1.ES_INDEX_NAME,
                _id: row.links.self.href,
            },
        });
        // Destructure address components for the document body
        const { sla, ssla, ...structured } = row;
        // Extract confidence from nested structure or top-level (backwards compatible)
        const confidence = structured.structured?.confidence ?? structured.confidence;
        // Add the address document body
        indexingBody.push({
            sla,
            ssla,
            structured,
            ...(confidence !== undefined && { confidence }),
        });
    }
    // If there are addresses to index, send the index request
    if (indexingBody.length > 0) {
        // Send the index request
        await (0, load_1.sendIndexRequest)(indexingBody);
    }
};
exports.setAddresses = setAddresses;
/**
 * Validates and normalizes search pagination parameters.
 *
 * @param page - Raw page number (may be negative, zero, or too large).
 * @param size - Raw page size (may be zero, negative, or too large).
 * @returns Validated and clamped pagination parameters.
 */
const validatePaginationParams = (page, size) => {
    // Ensure page is at least 1 and at most MAX_PAGE_NUMBER
    const validPage = Math.max(1, Math.min(page, conf_1.MAX_PAGE_NUMBER));
    // Ensure size is at least 1 and at most MAX_PAGE_SIZE
    const validSize = Math.max(1, Math.min(size, conf_1.MAX_PAGE_SIZE));
    return { validPage, validSize };
};
/**
 * Searches for an address in the index with fuzzy matching.
 *
 * This function performs a multi-match query against the SLA and SSLA fields
 * with both bool_prefix and phrase_prefix matching for optimal autocomplete behavior.
 *
 * @augments autoCompleteAddress - This function is part of the autocomplete functionality
 *
 * @param searchString - The search string to match against addresses.
 * @param p - The page number (1-indexed, will be validated and clamped).
 * @param pageSize - The page size (will be validated and clamped to MAX_PAGE_SIZE).
 * @returns A promise resolving to the OpenSearch search response.
 */
const searchForAddress = async (searchString, p, pageSize = conf_1.PAGE_SIZE) => {
    // Validate and clamp pagination parameters to prevent abuse
    const { validPage, validSize } = validatePaginationParams(p, pageSize);
    // Calculate the offset for OpenSearch (0-indexed)
    const from = (validPage - 1) * validSize;
    // Search the index for the address
    const searchResp = (await global.esClient.search({
        index: conf_1.ES_INDEX_NAME,
        body: {
            from,
            size: validSize,
            query: {
                bool: {
                    // If the search string is not empty, add the search string to the query using a multi match query to
                    // search against the `sla` and `ssla` fields
                    ...(searchString && {
                        should: [
                            {
                                multi_match: {
                                    fields: ["sla", "ssla"],
                                    query: searchString,
                                    // Fuzziness is set to AUTO to allow for typos and variations in the search string
                                    fuzziness: "AUTO",
                                    // Type is set to bool_prefix to allow for partial matching of the search string
                                    type: "bool_prefix",
                                    // Lenient is set to true to allow for partial matching of the search string
                                    lenient: true,
                                    // Auto generate synonyms phrase query is set to false to prevent the generation of synonyms phrase queries
                                    auto_generate_synonyms_phrase_query: false,
                                    operator: "AND",
                                },
                            },
                            {
                                multi_match: {
                                    fields: ["sla", "ssla"],
                                    query: searchString,
                                    // Type is set to phrase_prefix to allow for partial matching of the search string
                                    type: "phrase_prefix",
                                    // Lenient is set to true to allow for partial matching of the search string
                                    lenient: true,
                                    // Auto generate synonyms phrase query is set to false to prevent the generation of synonyms phrase queries
                                    auto_generate_synonyms_phrase_query: false,
                                    operator: "AND",
                                },
                            },
                        ],
                    }),
                },
            },
            sort: [
                "_score",
                { confidence: { order: "desc" } },
                { "ssla.raw": { order: "asc" } },
                { "sla.raw": { order: "asc" } },
            ],
            highlight: {
                fields: {
                    sla: {},
                    ssla: {},
                },
            },
        },
    }));
    // Log the hits
    (0, exports.logger)("hits", JSON.stringify(searchResp.body.hits, undefined, 2));
    return searchResp;
};
exports.searchForAddress = searchForAddress;
/**
 * Retrieves detailed information about a specific address by its ID.
 *
 * This function queries OpenSearch for the address document, constructs the
 * response with proper HATEOAS links, and generates an ETag hash for caching.
 *
 * @param {string} addressId - The unique identifier for the address (G-NAF PID).
 * @returns {Promise<Types.GetAddressResponse>} A promise resolving to either:
 *   - Success: `{ link, json, hash }` containing the address data and navigation links
 *   - Error: `{ statusCode, json }` with appropriate HTTP status and error message
 */
const getAddress = async (addressId) => {
    try {
        // Query OpenSearch for the address document by its canonical path ID
        const jsonX = await global.esClient.get({
            index: conf_1.ES_INDEX_NAME,
            id: `/addresses/${addressId}`,
        });
        (0, exports.logger)("jsonX", jsonX);
        // Extract and merge the structured address data with the SLA string
        const json = {
            ...jsonX.body._source.structured,
            sla: jsonX.body._source.sla,
        };
        (0, exports.logger)("json", json);
        // Remove internal OpenSearch ID field from response payload
        delete json._id;
        // Construct HATEOAS self-link for the address resource
        const link = new LinkHeader();
        link.set({
            rel: "self",
            uri: `/addresses/${addressId}`,
        });
        // Generate MD5 hash of the address data for ETag/caching support
        // TODO: Consider pre-computing and storing hash during indexing for performance
        const hash = crypto
            .createHash("md5")
            .update(JSON.stringify(json))
            .digest("hex");
        return { link, json, hash };
    }
    catch (error_) {
        // Cast to OpenSearch error type for proper error handling
        const osError = error_;
        (0, exports.error)("error getting record from elastic search", osError);
        // Handle document not found (404)
        if (osError.body?.found === false) {
            return { statusCode: 404, json: { error: "not found" } };
        }
        // Handle index not ready/available (503)
        if (osError.body?.error?.type === "index_not_found_exception") {
            return { statusCode: 503, json: { error: "service unavailable" } };
        }
        // Fallback for unexpected errors (500)
        return { statusCode: 500, json: { error: "unexpected error" } };
    }
};
exports.getAddress = getAddress;
/**
 * Searches for addresses matching a query string with pagination support.
 *
 * This function performs a fuzzy search against the address index, constructing
 * proper HATEOAS pagination links and API discovery templates in the response.
 *
 * @param {string} url - The base URL for the addresses endpoint (used for link construction).
 * @param {Types.SwaggerContext} swagger - Swagger/OpenAPI context for API documentation linkage.
 * @param {string} [q] - The search query string for address matching.
 * @param {number} [p=1] - The page number for pagination (1-indexed).
 * @returns {Promise<Types.GetAddressesResponse>} A promise resolving to either:
 *   - Success: `{ link, json, linkTemplate }` containing search results and navigation
 *   - Error: `{ statusCode, json }` with appropriate HTTP status and error message
 */
const getAddresses = async (url, swagger, q, p = 1) => {
    try {
        // Execute the address search query against the index
        const foundAddresses = await searchForAddress(q ?? "", p);
        (0, exports.logger)("foundAddresses", foundAddresses);
        // Initialize the Link header for HATEOAS navigation
        const link = new LinkHeader();
        // Add link to API documentation for this operation
        link.set({
            rel: "describedby",
            uri: `/docs/#operations-${swagger.path.get["x-swagger-router-controller"].toLowerCase()}-${swagger.path.get.operationId}`,
            title: `${swagger.path.get.operationId} API Docs`,
            type: "text/html",
        });
        // Build query string for the current request (self link)
        const sp = new URLSearchParams({
            ...(q !== undefined && { q }),
            ...(p !== 1 && { p: String(p) }),
        });
        const spString = sp.toString();
        // Add self-referential link for the current page
        link.set({
            rel: "self",
            uri: `${url}${spString === "" ? "" : "?"}${spString}`,
        });
        // Add link to the first page of results
        link.set({
            rel: "first",
            uri: `${url}${q === undefined ? "" : "?"}${new URLSearchParams({
                ...(q !== undefined && { q }),
            }).toString()}`,
        });
        // Add previous page link if not on the first page
        if (p > 1) {
            link.set({
                rel: "prev",
                uri: `${url}${q === undefined && p === 2 ? "" : "?"}${new URLSearchParams({
                    ...(q !== undefined && { q }),
                    ...(p > 2 && { p: String(p - 1) }),
                }).toString()}`,
            });
        }
        // Extract the total hit count for pagination calculations
        // OpenSearch returns total as either a number or a { value, relation } object
        const rawTotal = foundAddresses.body.hits.total;
        const totalHits = typeof rawTotal === "number" ? rawTotal : rawTotal.value;
        (0, exports.logger)("TOTAL", totalHits);
        (0, exports.logger)("PAGE_SIZE * p", conf_1.PAGE_SIZE * p);
        // Determine if there are more pages available
        const hasNextPage = totalHits > conf_1.PAGE_SIZE * p;
        (0, exports.logger)("next?", hasNextPage);
        // Add next page link if more results exist
        if (hasNextPage) {
            link.set({
                rel: "next",
                uri: `${url}?${new URLSearchParams({
                    ...(q !== undefined && { q }),
                    p: String(p + 1),
                }).toString()}`,
            });
        }
        // Transform OpenSearch hits into the API response format
        const responseBody = mapToSearchAddressResponse(foundAddresses);
        (0, exports.logger)("responseBody", JSON.stringify(responseBody, undefined, 2));
        // Construct Link-Template header for API discoverability (RFC 6570)
        const linkTemplate = new LinkHeader();
        const op = swagger.path.get;
        (0, setLinkOptions_1.setLinkOptions)(op, url, linkTemplate);
        return { link, json: responseBody, linkTemplate };
    }
    catch (error_) {
        // Cast to OpenSearch error type for proper error handling
        const osError = error_;
        (0, exports.error)("error querying elastic search", osError);
        // Handle index not ready/available (503)
        if (osError.body?.error?.type === "index_not_found_exception") {
            return { statusCode: 503, json: { error: "service unavailable" } };
        }
        // Handle OpenSearch request timeout (504)
        if (osError.displayName === "RequestTimeout") {
            return { statusCode: 504, json: { error: "gateway timeout" } };
        }
        // Fallback for unexpected errors (500)
        return { statusCode: 500, json: { error: "unexpected error" } };
    }
};
exports.getAddresses = getAddresses;
/**
 * Transforms raw OpenSearch search hits into the standardised API response format.
 *
 * This function maps the internal OpenSearch document structure to a clean,
 * client-facing response containing the address SLA, relevance score, and
 * HATEOAS self-links for each result.
 *
 * @param {Types.OpensearchApiResponse<Types.OpensearchSearchResponse<unknown>, unknown>} foundAddresses -
 *   The raw OpenSearch search response containing hits.
 * @returns {Types.AddressSearchResult[]} An array of address results formatted for the API.
 */
const mapToSearchAddressResponse = (foundAddresses) => {
    // Map each hit to the API response format, extracting relevant fields
    return foundAddresses.body.hits.hits.map((h) => {
        // Cast hit to the expected structure for type-safe access
        const hit = h;
        return {
            sla: hit._source.sla,
            score: hit._score,
            links: {
                self: {
                    href: hit._id,
                },
            },
        };
    });
};
exports.mapToSearchAddressResponse = mapToSearchAddressResponse;
/**
 * The default export for the service. These are the commands that can be used to interact with the service.
 */
exports.default = {
    load: load_1.loadCommandEntry,
    autocomplete: getAddresses,
    lookup: getAddress,
};
//# sourceMappingURL=index.js.map