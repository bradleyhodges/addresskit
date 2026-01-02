import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { Agent as HttpsAgent } from "node:https";
import * as stream from "node:stream";
import { dropIndex, initIndex } from "@repo/addressr-client/elasticsearch";
import download from "@repo/addressr-core/utils/stream-down";
import debug from "debug";
import * as directoryExists from "directory-exists";
import * as glob from "glob-promise";
import * as got from "got";
import * as LinkHeader from "http-link-header";
import * as Keyv from "keyv";
import { KeyvFile } from "keyv-file";
import * as Papa from "papaparse";
import * as unzip from "unzip-stream";
import { setLinkOptions } from "./setLinkOptions";
import {
    getCoveredStates,
    clearAddresses,
    levelTypeCodeToName,
    flatTypeCodeToName,
    streetTypeCodeToName,
    streetClassCodeToName,
    localityClassCodeToName,
    streetSuffixCodeToName,
    geocodeReliabilityCodeToName,
    geocodeTypeCodeToName,
    levelGeocodedCodeToName,
    mapAddressDetails,
    mapToMla,
    mapToSla,
    mapAuthCodeTableToSynonymList,
    mapToShortMla,
    mapLocality,
    mapStreetLocality,
    mapGeo,
    buildSynonyms,
    type AddressDetails,
    type MapPropertyContext,
    type StructuredAddress,
    type StructuredLocality,
    type StructuredStreetLocality,
    type AddressDetailRow,
} from "./helpers";
import {
    getFiles,
    countLinesInFile,
    fileExists,
    loadFileCounts,
    readFileContents,
} from "./helpers/fs";
import {
    PAGE_SIZE,
    COVERED_STATES,
    ONE_DAY_S,
    ONE_DAY_MS,
    THIRTY_DAYS_MS,
    ES_INDEX_NAME,
    GNAF_PACKAGE_URL,
    GNAF_DIR,
} from "./conf";
import { SearchResponse } from "@opensearch-project/opensearch/api/types";
import type {
    ApiResponse,
    Client as OpensearchClient,
} from "@opensearch-project/opensearch";
import { esConnect } from "@repo/addressr-client/elasticsearch";

// TODO: move types to their own file
type BulkIndexBody = Array<Record<string, unknown>>;
type IndexableAddress = {
    links: { self: { href: string } };
    sla?: unknown;
    ssla?: unknown;
    confidence?: number;
    structurted: {
        structurted?: { confidence?: number };
        confidence?: number;
        [key: string]: unknown;
    };
};

/**
 * Make the file system promises available globally.
 */
export const fsp = fs.promises;
export const { readdir } = fsp;

/**
 * Loggers for the API.
 */
export const logger = debug("api");
export const error = debug("error");

/**
 * The cache for the API.
 */
const cache = new Keyv({
    store: new KeyvFile({ filename: "target/keyv-file.msgpack" }),
});

/**
 * Persistent HTTP cache for Got requests to avoid re-downloading unchanged payloads.
 */
const gnafHttpCache = new Keyv({
    store: new KeyvFile({ filename: "target/gnaf-http-cache.msgpack" }),
    namespace: "gnaf-http-cache",
});

/**
 * Shared keep-alive HTTPS agent to reuse sockets across fetches.
 */
const keepAliveAgent = new HttpsAgent({
    keepAlive: true,
    maxSockets: 10,
});

/**
 * Got client configured for persistent HTTP cache reuse and keep-alive sockets.
 */
const gotClient = got.extend({
    cache: gnafHttpCache,
    agent: { http: keepAliveAgent, https: keepAliveAgent },
});

// ---------------------------------------------------------------------------------
// TODO: create these functions
const loadFromGnaf = async () => {};
const autoCompleteAddress = async (searchString: string) => {};
const serviceCommands = {
    loadFromGnaf,
    autoCompleteAddress,
};

/**
 * Sets the addresses in the index.
 *
 * @param addr - The addresses to set.
 */
const setAddresses = async (addr: IndexableAddress[]) => {
    // Clear the addresses index
    await clearAddresses();

    // Create the indexing body
    const indexingBody: BulkIndexBody = [];

    // Loop through the addresses
    for (const row of addr) {
        // Add the index operation to the body
        indexingBody.push({
            index: {
                _index: ES_INDEX_NAME,
                _id: row.links.self.href,
            },
        });

        // Add the address details to the body
        const { sla, ssla, ...structurted } = row;
        const confidence =
            structurted.structurted?.confidence ?? structurted.confidence;

        // Add the address details to the body
        indexingBody.push({
            sla,
            ssla,
            structurted,
            ...(confidence !== undefined && { confidence }),
        });
    }

    // If there are addresses to index, send the index request
    if (indexingBody.length > 0) {
        // Send the index request
        await sendIndexRequest(indexingBody);
    }
};

/**
 * Fetches the GNAF package data from the cache (if fresh enough content exists) or from the network.
 *
 * @alias fetchPackageData
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @returns {Promise<got.Response<string>>} The GNAF package data.
 * @throws {Error} If the GNAF package data cannot be fetched.
 */
const fetchGNAFPackageData = async (): Promise<got.Response<string>> => {
    // Get the GNAF package URL
    const packageUrl = GNAF_PACKAGE_URL;

    // See if we have the value in cache
    const cachedResponse = await cache.get(packageUrl);
    logger("cached gnaf package data", cachedResponse);

    // Get the age of the cached response
    let age = 0;
    if (cachedResponse !== undefined) {
        // Set the cache header to HIT
        cachedResponse.headers["x-cache"] = "HIT";

        // Get the created date from the cache headers
        const created =
            cachedResponse.cachedAt !== undefined
                ? new Date(cachedResponse.cachedAt)
                : new Date(cachedResponse.headers.date);
        logger("created", created);

        // Calculate the age of the cached response
        age = Date.now() - created.getTime();

        // If the age is less than or equal to one day, return the cached response
        if (age <= ONE_DAY_MS) {
            return cachedResponse as unknown as got.Response<string>;
        }
    }

    // cached value was older than one day, so go fetch
    try {
        // Fetch the GNAF package data
        const response = await gotClient.get(packageUrl);
        logger("response.isFromCache", response.fromCache);
        logger("fresh gnaf package data", {
            body: response.body,
            headers: response.headers,
        });

        // Set the cache response
        await cache.set(packageUrl, {
            body: response.body,
            headers: response.headers,
            cachedAt: Date.now(),
        });

        // Set the cache header to MISS
        response.headers["x-cache"] = response.fromCache ? "HIT" : "MISS";

        // Return the response
        return response as got.Response<string>;
    } catch (error_) {
        // We were unable to fetch. If we have cached value that isn't stale, return in
        if (cachedResponse !== undefined) {
            // If the age is less than 30 days, return the cached response
            if (age < THIRTY_DAYS_MS) {
                // Set the cache header to STALE
                cachedResponse.headers.warning =
                    '110	custom/1.0 "Response is Stale"';
                return cachedResponse;
            }
        }

        // Otherwise, throw the original network error
        throw error_;
    }
};

/**
 * Fetches the GNAF file from the cache (if fresh enough content exists), or if it is not fresh or doesn't
 * exist, downloads it from the internet.
 *
 * @alias fetchGnafFile
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @returns {Promise<string>} The path to the GNAF file.
 * @throws {Error} If the GNAF file cannot be fetched.
 */
const fetchGNAFArchive = async (): Promise<string> => {
    // Fetch the GNAF package data
    const response = await fetchGNAFPackageData();

    // Parse the GNAF package data
    const pack = JSON.parse(response.body);

    // Find the data resource for the GNAF file
    const dataResource = pack.result.resources.find(
        (r: { state: string; mimetype: string }) =>
            r.state === "active" && r.mimetype === "application/zip",
    );

    // Log the data resource (id as of 16/07/2019 for zip is 4b084096-65e4-4c8e-abbe-5e54ff85f42f)
    logger("dataResource", JSON.stringify(dataResource, undefined, 2));
    logger("url", dataResource.url);
    logger("headers", JSON.stringify(response.headers, undefined, 2));

    // Get the basename of the GNAF file
    const basename = path.basename(dataResource.url);
    logger("basename", basename);

    // Get the complete and incomplete paths for the GNAF file
    const complete_path = GNAF_DIR;
    const incomplete_path = `${complete_path}/incomplete`;

    // Create the incomplete path
    await new Promise((resolve, reject) => {
        fs.mkdir(incomplete_path, { recursive: true }, (error_) => {
            // If there is an error, reject the promise
            if (error_) reject(error_);
            // Otherwise, if there is no error, resolve the promise
            else resolve(void 0);
        });
    });

    // Get the destination path for the GNAF file
    const destination = `${complete_path}/${basename}`;

    // Create the complete path
    await new Promise((resolve, reject) => {
        fs.mkdir(incomplete_path, { recursive: true }, (error_) => {
            // If there is an error, reject the promise
            if (error_) reject(error_);
            // Otherwise, if there is no error, resolve the promise
            else resolve(void 0);
        });
    });

    // Try to access the destination file
    try {
        await new Promise((resolve, reject) => {
            fs.access(destination, fs.constants.R_OK, (error_) => {
                // If there is an error, reject the promise
                if (error_) reject(error_);
                // Otherwise, if there is no error, resolve the promise
                else resolve(void 0);
            });
        });

        // The destination file exists, so don't bother trying to download it again
        return destination;
    } catch {
        // The destination file does not exist, so we need to download it.
        logger("Starting G-NAF download");
        try {
            // Download the GNAF file
            await download(
                dataResource.url,
                `${incomplete_path}/${basename}`,
                dataResource.size,
            );

            // Rename the GNAF file
            await fsp.rename(`${incomplete_path}/${basename}`, destination);
            logger("Finished downloading G-NAF", destination);

            // Return the destination path
            return destination;
        } catch (error_) {
            // Log the error
            error("Error downloading G-NAF", error_);

            // Throw the error
            throw error_;
        }
    }
};

/**
 * Unzips the GNAF archive file.
 *
 * @alias unzipFile
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param file - The path to the GNAF archive file.
 *
 * @returns {Promise<string>} The path to the unzipped GNAF file.
 * @throws {Error} If the GNAF archive file cannot be unzipped.
 */
const unzipGNAFArchive = async (file: string): Promise<string> => {
    // Get the extension and basename of the GNAF archive file
    const extname = path.extname(file);
    const basenameWithoutExtention = path.basename(file, extname);

    // Get the incomplete and complete paths for the GNAF file
    const incomplete_path = `${GNAF_DIR}/incomplete/${basenameWithoutExtention}`;
    const complete_path = `${GNAF_DIR}/${basenameWithoutExtention}`;

    // See if the complete path exists
    const exists = await directoryExists(complete_path);

    // If the complete path exists, skip the extraction
    if (exists) {
        logger("directory exits. Skipping extract", complete_path);
        return complete_path;
    }

    // Create the incomplete path
    await new Promise((resolve, reject) => {
        fs.mkdir(incomplete_path, { recursive: true }, (error_) => {
            // If there is an error, reject the promise
            if (error_) reject(error_);
            // Otherwise, if there is no error, resolve the promise
            else resolve(void 0);
        });
    });

    // Create a read stream from the GNAF archive file
    const readStream = fs.createReadStream(file);
    logger("before pipe");

    // Create a promise to extract the GNAF archive file
    const prom = new Promise<void>((resolve, reject) => {
        readStream
            // Parse the GNAF archive file
            .pipe(unzip.Parse())
            // Transform the GNAF archive file
            .pipe(
                new stream.Transform({
                    objectMode: true,
                    transform: (entry, encoding, callback) => {
                        // Get the path to the entry
                        const entryPath = `${incomplete_path}/${entry.path}`;

                        // If the entry is a directory, create the directory
                        if (entry.isDirectory) {
                            // Create the directory
                            fs.mkdir(
                                entryPath,
                                { recursive: true },
                                (error_) => {
                                    // If there is an error, reject the promise
                                    if (error_) {
                                        // Drain the entry
                                        entry.autodrain();
                                        callback(error_);
                                    } else {
                                        // Drain the entry
                                        entry.autodrain();

                                        // Otherwise, if there is no error, resolve the promise
                                        callback();
                                    }
                                },
                            );
                        } else {
                            // Get the directory name of the entry
                            const dirname = path.dirname(entryPath);
                            // Create the directory
                            fs.mkdir(dirname, { recursive: true }, (error_) => {
                                // If there is an error, reject the promise
                                if (error_) {
                                    // Drain the entry
                                    entry.autodrain();
                                    callback(error_);
                                } else {
                                    // Stat the entry
                                    fs.stat(entryPath, (error_, stats) => {
                                        // If there is an error, reject the promise
                                        if (
                                            error_ &&
                                            error_.code !== "ENOENT"
                                        ) {
                                            // Log the error
                                            logger(
                                                "error statting file",
                                                error_,
                                            );

                                            // Drain the entry
                                            entry.autodrain();

                                            // Call the callback with the error
                                            callback(error_);
                                            return;
                                        }

                                        // If the size of the entry is the same as the size of the file, skip the extraction
                                        if (
                                            stats !== undefined &&
                                            stats.size === entry.size
                                        ) {
                                            // No need to extract again. Skip
                                            logger(
                                                "skipping extract for",
                                                entryPath,
                                            );
                                            entry.autodrain();
                                            callback();
                                        } else {
                                            // The size of the entry is different from the size of the file, so we need to extract
                                            // the file. Pipe the entry to the write stream
                                            logger("extracting", entryPath);
                                            entry
                                                .pipe(
                                                    fs.createWriteStream(
                                                        entryPath,
                                                    ),
                                                )
                                                // On finish, log the message and call the callback
                                                .on("finish", () => {
                                                    logger(
                                                        "finished extracting",
                                                        entryPath,
                                                    );
                                                    callback();
                                                })
                                                // On error, log the message and call the callback
                                                .on("error", (error: Error) => {
                                                    logger(
                                                        "error unzipping entry",
                                                        error,
                                                    );
                                                    callback(error);
                                                });
                                        }
                                    });
                                }
                            });
                        }
                    },
                }),
            )
            // On finish, log the message and call the callback
            .on("finish", () => {
                logger("finish");
                resolve();
            })
            // On error, log the message and call the callback
            .on("error", (error_) => {
                logger("error unzipping data file", error_);
                reject(error_);
            });
    });

    // Wait for the promise to resolve
    await prom;

    // Rename the incomplete path to the complete path
    return await new Promise((resolve, reject) => {
        fs.rename(incomplete_path, complete_path, (error_) => {
            if (error_) reject(error_);
            else resolve(complete_path);
        });
    });
};

/**
 * Loads the GNAF address details into the index.
 *
 * @alias loadAddressDetails
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param file - The path to the GNAF file.
 * @param expectedCount - The expected number of rows in the GNAF file.
 * @param context - The context containing the authority code tables.
 * @param refresh - Whether to refresh the index.
 *
 * @returns {Promise<void>} - A promise that resolves when the GNAF address details are loaded into the index.
 */
const loadGNAFAddress = async (
    file: string,
    expectedCount: number,
    context: MapPropertyContext,
    { refresh = false } = {},
): Promise<void> => {
    // Initialize the actual count
    let actualCount = 0;

    // Create a promise to load the GNAF address details into the index
    await new Promise<void>((resolve, reject) => {
        // Parse the GNAF file
        Papa.parse(fs.createReadStream(file), {
            header: true,
            skipEmptyLines: true,
            chunkSize:
                Number.parseInt(
                    process.env.ADDRESSR_LOADING_CHUNK_SIZE || "10",
                ) *
                1024 *
                1024,
            chunk: (
                chunk: Papa.ParseResult<AddressDetailRow>,
                parser: Papa.Parser,
            ) => {
                // Pause the parser
                parser.pause();

                // Create a list to store the items
                const items: AddressDetails[] = [];

                // If there are errors, log the errors
                if (chunk.errors.length > 0) {
                    error(`Errors reading '${file}': ${chunk.errors}`);
                    error({ errors: chunk.errors });
                }

                // Create a list to store the indexing body
                const indexingBody: BulkIndexBody = [];
                for (const row of chunk.data) {
                    // Map the row to a structured address
                    const item = mapAddressDetails(
                        row,
                        context,
                        actualCount,
                        expectedCount,
                    );

                    // Add the item to the list of items
                    items.push(item);

                    // Increment the actual count
                    actualCount += 1;

                    // Add the index operation to the indexing body
                    indexingBody.push({
                        index: {
                            _index: ES_INDEX_NAME,
                            _id: `/addresses/${item.pid}`,
                        },
                    });

                    // Add the address details to the indexing body
                    const { sla, ssla, ...structured } = item;
                    indexingBody.push({
                        sla,
                        ssla,
                        structured,
                        confidence: structured.structured.confidence,
                    });
                }

                // If there are items to process, send the index request
                if (indexingBody.length > 0) {
                    sendIndexRequest(indexingBody, undefined, { refresh })
                        .then(() => {
                            parser.resume();
                            return;
                        })
                        // On error, log the error and throw it
                        .catch((error_: Error) => {
                            error("error sending index request", error_);
                            throw error_;
                        });
                } else {
                    // nothing to process. Have reached end of file.
                    parser.resume();
                }
            },
            // On complete, log the message and call the callback
            complete: () => {
                logger(
                    "Address details loaded",
                    context.state,
                    expectedCount || "",
                );
                resolve();
            },
            error: (_error, file) => {
                error(_error, file);
                reject();
            },
        });
    });

    // If the expected count is not undefined and the actual count is not equal to the expected count, log the error
    if (expectedCount !== undefined && actualCount !== expectedCount) {
        // Log the error
        error(
            `Error loading '${file}'. Expected '${expectedCount}' rows, got '${actualCount}'`,
        );
    } else {
        // Log the message
        logger(`loaded '${actualCount}' rows from '${file}'`);
    }
};

/**
 * Sends an request to the OpenSearch database to bulk index the addresses.
 *
 * @alias sendIndexRequest
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param indexingBody - The indexing body.
 * @param initialBackoff
 * @param refresh - Whether to refresh the index.
 *
 * @returns {Promise<void>} - A promise that resolves when the index request is sent.
 * @throws {Error} If the index request cannot be sent.
 */
const sendIndexRequest = async (
    indexingBody: BulkIndexBody,
    initialBackoff: number = Number.parseInt(
        process.env.ADDRESSR_INDEX_BACKOFF || "30000",
    ),
    { refresh = false }: { refresh?: boolean } = {},
): Promise<void> => {
    // Initialize the backoff
    let backoff = initialBackoff;

    // Loop until the index request is sent
    // biome-ignore lint/correctness/noConstantCondition: This is a loop that will run until it succeeds
    for (let count = 0; true; count++) {
        try {
            // Send the index request
            const resp = (await (global.esClient as OpensearchClient).bulk({
                refresh,
                body: indexingBody,
                timeout: process.env.ADDRESSR_INDEX_TIMEOUT || "300s",
            })) as ApiResponse<Record<string, unknown>, unknown> & {
                errors?: boolean | undefined;
            };

            // If there are errors, throw the response
            if (resp?.errors || resp.body?.errors) throw resp;
            return;
        } catch (error_) {
            // If there is an error, log the error and throw it
            error("Indexing error", JSON.stringify(error_, undefined, 2));

            // Back off for the next request
            error(`backing off for ${backoff}ms`);
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(void 0);
                }, backoff);
            });

            // Increment the backoff
            backoff += Number.parseInt(
                process.env.ADDRESSR_INDEX_BACKOFF_INCREMENT || "30000",
            );

            // Set the backoff to the minimum of the maximum backoff and the current backoff
            backoff = Math.min(
                Number.parseInt(
                    process.env.ADDRESSR_INDEX_BACKOFF_MAX || "600000",
                ),
                backoff,
            );

            // Log the next backoff
            error(`next backoff: ${backoff}ms`);
            error(`count: ${count}`);
        }
    }
};

/**
 * Searches for an address in the index.
 *
 * @augments autoCompleteAddress - This function is part of the autocomplete (searching) functionality of the service
 *
 * @param searchString - The search string.
 * @param p - The page number.
 * @param pageSize - The page size.
 * @returns {Promise<ApiResponse<SearchResponse<unknown>, unknown>>} - A promise that resolves when the address is searched for.
 */
const searchForAddress = async (
    searchString: string,
    p: number,
    pageSize: number = PAGE_SIZE,
): Promise<ApiResponse<SearchResponse<unknown>, unknown>> => {
    // Search the index for the address
    const searchResp = (await (global.esClient as OpensearchClient).search({
        index: ES_INDEX_NAME,
        body: {
            from: (p - 1 || 0) * pageSize,
            size: pageSize,
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
    })) as ApiResponse<SearchResponse<unknown>, unknown>;

    // Log the hits
    logger("hits", JSON.stringify(searchResp.body.hits, undefined, 2));
    return searchResp;
};

/**
 * Gets the state name from the given file.
 *
 * @alias getStateName
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param abbr - The abbreviation of the state.
 * @param file - The path to the file to parse the state name from.
 *
 * @returns {Promise<string>} - A promise that resolves with the state name.
 * @throws {Error} If the state name cannot be found or the file cannot be parsed.
 */
const getStateName = async (abbr: string, file: string): Promise<string> => {
    // Parse the file
    return await new Promise<string>((resolve, reject) => {
        Papa.parse(fs.createReadStream(file), {
            header: true,
            delimiter: "|",
            // On complete, resolve the promise with the state name
            complete: (results: Papa.ParseResult<{ STATE_NAME: string }>) => {
                // If the results are empty, reject the promise
                if (results.data.length === 0) {
                    reject(new Error(`No state name found in file '${file}'`));
                }

                // Resolve the promise with the state name
                resolve(results.data[0].STATE_NAME);
            },
            // On error, log the error and reject the promise
            error: (error, file) => {
                console.log(
                    "[getStateName] error getting state name",
                    error,
                    file,
                );
                reject(error);
            },
        });
    });
};
