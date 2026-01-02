"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelGeocodedCodeToName = exports.geocodeTypeCodeToName = exports.geocodeReliabilityCodeToName = exports.streetSuffixCodeToName = exports.localityClassCodeToName = exports.streetClassCodeToName = exports.streetTypeCodeToName = exports.flatTypeCodeToName = exports.levelTypeCodeToName = exports.clearAuthorityCodeMaps = void 0;
const index_1 = require("../index");
// ---------------------------------------------------------------------------------
// Indexed Authority Code Maps (O(1) Lookup)
// ---------------------------------------------------------------------------------
/**
 * Pre-indexed Map for O(1) lookup of level type codes.
 * Populated lazily on first access via `getLevelTypeMap()`.
 */
let levelTypeMap;
/**
 * Pre-indexed Map for O(1) lookup of flat type codes.
 * Populated lazily on first access via `getFlatTypeMap()`.
 */
let flatTypeMap;
/**
 * Pre-indexed Map for O(1) lookup of street type codes.
 * Populated lazily on first access via `getStreetTypeMap()`.
 */
let streetTypeMap;
/**
 * Pre-indexed Map for O(1) lookup of street class codes.
 * Populated lazily on first access via `getStreetClassMap()`.
 */
let streetClassMap;
/**
 * Pre-indexed Map for O(1) lookup of locality class codes.
 * Populated lazily on first access via `getLocalityClassMap()`.
 */
let localityClassMap;
/**
 * Pre-indexed Map for O(1) lookup of street suffix codes.
 * Populated lazily on first access via `getStreetSuffixMap()`.
 */
let streetSuffixMap;
/**
 * Pre-indexed Map for O(1) lookup of geocode reliability codes.
 * Populated lazily on first access via `getGeocodeReliabilityMap()`.
 */
let geocodeReliabilityMap;
/**
 * Pre-indexed Map for O(1) lookup of geocode type codes.
 * Populated lazily on first access via `getGeocodeTypeMap()`.
 */
let geocodeTypeMap;
/**
 * Pre-indexed Map for O(1) lookup of geocoded level type codes.
 * Populated lazily on first access via `getGeocodedLevelTypeMap()`.
 */
let geocodedLevelTypeMap;
/**
 * Builds a Map from an array of authority code entries for O(1) lookups.
 * This eliminates the O(n) Array.find() cost during address processing.
 *
 * @param entries - Array of authority code entries to index.
 * @returns A Map with CODE as key and NAME as value.
 */
const buildCodeMap = (entries) => {
    // Pre-size the Map with the known entry count for allocation efficiency
    const map = new Map();
    // Populate the Map with all code-to-name mappings
    for (const entry of entries) {
        map.set(entry.CODE, entry.NAME);
    }
    return map;
};
/**
 * Retrieves or lazily initializes the level type lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for level type lookups.
 */
const getLevelTypeMap = (context) => {
    // Lazy initialization - build the Map only on first access
    if (levelTypeMap === undefined) {
        levelTypeMap = buildCodeMap(context.Authority_Code_LEVEL_TYPE_AUT_psv);
    }
    return levelTypeMap;
};
/**
 * Retrieves or lazily initializes the flat type lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for flat type lookups.
 */
const getFlatTypeMap = (context) => {
    if (flatTypeMap === undefined) {
        flatTypeMap = buildCodeMap(context.Authority_Code_FLAT_TYPE_AUT_psv);
    }
    return flatTypeMap;
};
/**
 * Retrieves or lazily initializes the street type lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for street type lookups.
 */
const getStreetTypeMap = (context) => {
    if (streetTypeMap === undefined) {
        streetTypeMap = buildCodeMap(context.Authority_Code_STREET_TYPE_AUT_psv);
    }
    return streetTypeMap;
};
/**
 * Retrieves or lazily initializes the street class lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for street class lookups.
 */
const getStreetClassMap = (context) => {
    if (streetClassMap === undefined) {
        streetClassMap = buildCodeMap(context.Authority_Code_STREET_CLASS_AUT_psv);
    }
    return streetClassMap;
};
/**
 * Retrieves or lazily initializes the locality class lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for locality class lookups.
 */
const getLocalityClassMap = (context) => {
    if (localityClassMap === undefined) {
        localityClassMap = buildCodeMap(context.Authority_Code_LOCALITY_CLASS_AUT_psv);
    }
    return localityClassMap;
};
/**
 * Retrieves or lazily initializes the street suffix lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for street suffix lookups.
 */
const getStreetSuffixMap = (context) => {
    if (streetSuffixMap === undefined) {
        streetSuffixMap = buildCodeMap(context.Authority_Code_STREET_SUFFIX_AUT_psv);
    }
    return streetSuffixMap;
};
/**
 * Retrieves or lazily initializes the geocode reliability lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for geocode reliability lookups.
 */
const getGeocodeReliabilityMap = (context) => {
    if (geocodeReliabilityMap === undefined) {
        geocodeReliabilityMap = buildCodeMap(context.Authority_Code_GEOCODE_RELIABILITY_AUT_psv);
    }
    return geocodeReliabilityMap;
};
/**
 * Retrieves or lazily initializes the geocode type lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for geocode type lookups.
 */
const getGeocodeTypeMap = (context) => {
    if (geocodeTypeMap === undefined) {
        geocodeTypeMap = buildCodeMap(context.Authority_Code_GEOCODE_TYPE_AUT_psv);
    }
    return geocodeTypeMap;
};
/**
 * Retrieves or lazily initializes the geocoded level type lookup Map.
 *
 * @param context - The property code context containing raw authority tables.
 * @returns The indexed Map for geocoded level type lookups.
 */
const getGeocodedLevelTypeMap = (context) => {
    if (geocodedLevelTypeMap === undefined) {
        geocodedLevelTypeMap = buildCodeMap(context.Authority_Code_GEOCODED_LEVEL_TYPE_AUT_psv);
    }
    return geocodedLevelTypeMap;
};
/**
 * Clears all cached authority code Maps.
 * Call this when reloading G-NAF data to ensure fresh lookups.
 */
const clearAuthorityCodeMaps = () => {
    levelTypeMap = undefined;
    flatTypeMap = undefined;
    streetTypeMap = undefined;
    streetClassMap = undefined;
    localityClassMap = undefined;
    streetSuffixMap = undefined;
    geocodeReliabilityMap = undefined;
    geocodeTypeMap = undefined;
    geocodedLevelTypeMap = undefined;
};
exports.clearAuthorityCodeMaps = clearAuthorityCodeMaps;
// ---------------------------------------------------------------------------------
// Code-to-Name Conversion Functions (O(1) Lookup)
// ---------------------------------------------------------------------------------
/**
 * Converts a G-NAF Level Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The level type code to convert (e.g., "L", "FL", "G").
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context.
 * @returns The human-readable name of the level type, or undefined if unknown.
 */
const levelTypeCodeToName = (code, context, address) => {
    // O(1) Map lookup instead of O(n) array scan
    const name = getLevelTypeMap(context).get(code);
    // Return the name if found
    if (name !== undefined)
        return name;
    // Log unknown codes for debugging without throwing to maintain loading resilience
    (0, index_1.error)(`Unknown Level Type Code: '${code}'`);
    (0, index_1.error)({ address });
    return undefined;
};
exports.levelTypeCodeToName = levelTypeCodeToName;
/**
 * Converts a G-NAF Flat Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The flat type code to convert (e.g., "UNIT", "APT", "SUITE").
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context.
 * @returns The human-readable name of the flat type, or undefined if unknown.
 */
const flatTypeCodeToName = (code, context, address) => {
    const name = getFlatTypeMap(context).get(code);
    if (name !== undefined)
        return name;
    (0, index_1.error)(`Unknown Flat Type Code: '${code}'`);
    (0, index_1.error)({ address });
    return undefined;
};
exports.flatTypeCodeToName = flatTypeCodeToName;
/**
 * Converts a G-NAF Street Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The street type code to convert (e.g., "RD", "ST", "AVE").
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context (unused but kept for API consistency).
 * @returns The human-readable name of the street type, or undefined if unknown.
 */
const streetTypeCodeToName = (code, context, address) => {
    const name = getStreetTypeMap(context).get(code);
    if (name !== undefined)
        return name;
    (0, index_1.error)(`Unknown Street Type Code: '${code}'`);
    return undefined;
};
exports.streetTypeCodeToName = streetTypeCodeToName;
/**
 * Converts a G-NAF Street Class code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The street class code to convert (e.g., "C" for confirmed).
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context (unused but kept for API consistency).
 * @returns The human-readable name of the street class, or undefined if unknown.
 */
const streetClassCodeToName = (code, context, address) => {
    const name = getStreetClassMap(context).get(code);
    if (name !== undefined)
        return name;
    (0, index_1.error)(`Unknown Street Class Code: '${code}'`);
    return undefined;
};
exports.streetClassCodeToName = streetClassCodeToName;
/**
 * Converts a G-NAF Locality Class code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The locality class code to convert (e.g., "G" for gazetted).
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the locality class, or undefined if unknown.
 */
const localityClassCodeToName = (code, context) => {
    const name = getLocalityClassMap(context).get(code);
    if (name !== undefined)
        return name;
    (0, index_1.error)(`Unknown Locality Class Code: '${code}'`);
    return undefined;
};
exports.localityClassCodeToName = localityClassCodeToName;
/**
 * Converts a G-NAF Street Suffix code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The street suffix code to convert (e.g., "N", "S", "E", "W").
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the street suffix, or undefined if unknown.
 */
const streetSuffixCodeToName = (code, context) => {
    const name = getStreetSuffixMap(context).get(code);
    if (name !== undefined)
        return name;
    (0, index_1.error)(`Unknown Street Suffix Code: '${code}'`);
    return undefined;
};
exports.streetSuffixCodeToName = streetSuffixCodeToName;
/**
 * Converts a G-NAF Geocode Reliability code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The geocode reliability code to convert (e.g., "1", "2", "3").
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the geocode reliability, or undefined if unknown.
 */
const geocodeReliabilityCodeToName = (code, context) => {
    const name = getGeocodeReliabilityMap(context).get(code);
    if (name !== undefined)
        return name;
    (0, index_1.error)(`Unknown Geocode Reliability Code: '${code}'`);
    return undefined;
};
exports.geocodeReliabilityCodeToName = geocodeReliabilityCodeToName;
/**
 * Converts a G-NAF Geocode Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The geocode type code to convert (e.g., "PC", "FC").
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the geocode type, or undefined if unknown.
 */
const geocodeTypeCodeToName = (code, context) => {
    const name = getGeocodeTypeMap(context).get(code);
    if (name !== undefined)
        return name;
    (0, index_1.error)(`Unknown Geocode Type Code: '${code}'`);
    return undefined;
};
exports.geocodeTypeCodeToName = geocodeTypeCodeToName;
/**
 * Converts a G-NAF Geocoded Level Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The geocoded level type code to convert.
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the geocoded level type, or undefined if unknown.
 */
const levelGeocodedCodeToName = (code, context) => {
    const name = getGeocodedLevelTypeMap(context).get(code);
    if (name !== undefined)
        return name;
    // Provide detailed error context for debugging unknown codes
    (0, index_1.error)(`Unknown Geocoded Level Type Code: '${code}' in:\n${JSON.stringify(context.Authority_Code_GEOCODED_LEVEL_TYPE_AUT_psv, undefined, 2)}`);
    return undefined;
};
exports.levelGeocodedCodeToName = levelGeocodedCodeToName;
//# sourceMappingURL=propertyCodeToName.js.map