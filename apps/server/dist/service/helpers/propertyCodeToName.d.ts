/**
 * Raw authority code entry as parsed from G-NAF PSV files.
 * Maps a short code to its human-readable name.
 */
export type AuthorityCodeEntry = {
    /** The short code (e.g., "RD", "ST", "UNIT") */
    CODE: string;
    /** The full human-readable name (e.g., "ROAD", "STREET", "UNIT") */
    NAME: string;
};
/**
 * Context containing raw authority code tables loaded from G-NAF PSV files.
 * These arrays are parsed directly from the Authority Code files and indexed
 * by their filename (minus extension).
 */
export type PropertyCodeToNameContext = {
    Authority_Code_LEVEL_TYPE_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_FLAT_TYPE_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_STREET_TYPE_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_STREET_CLASS_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_LOCALITY_CLASS_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_STREET_SUFFIX_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_GEOCODE_RELIABILITY_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_GEOCODE_TYPE_AUT_psv: AuthorityCodeEntry[];
    Authority_Code_GEOCODED_LEVEL_TYPE_AUT_psv: AuthorityCodeEntry[];
};
/**
 * Clears all cached authority code Maps.
 * Call this when reloading G-NAF data to ensure fresh lookups.
 */
export declare const clearAuthorityCodeMaps: () => void;
/**
 * Converts a G-NAF Level Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The level type code to convert (e.g., "L", "FL", "G").
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context.
 * @returns The human-readable name of the level type, or undefined if unknown.
 */
export declare const levelTypeCodeToName: (code: string, context: PropertyCodeToNameContext, address: unknown) => string | undefined;
/**
 * Converts a G-NAF Flat Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The flat type code to convert (e.g., "UNIT", "APT", "SUITE").
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context.
 * @returns The human-readable name of the flat type, or undefined if unknown.
 */
export declare const flatTypeCodeToName: (code: string, context: PropertyCodeToNameContext, address: unknown) => string | undefined;
/**
 * Converts a G-NAF Street Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The street type code to convert (e.g., "RD", "ST", "AVE").
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context (unused but kept for API consistency).
 * @returns The human-readable name of the street type, or undefined if unknown.
 */
export declare const streetTypeCodeToName: (code: string, context: PropertyCodeToNameContext, address: unknown) => string | undefined;
/**
 * Converts a G-NAF Street Class code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The street class code to convert (e.g., "C" for confirmed).
 * @param context - The context containing the authority code tables.
 * @param address - The address object for error logging context (unused but kept for API consistency).
 * @returns The human-readable name of the street class, or undefined if unknown.
 */
export declare const streetClassCodeToName: (code: string, context: PropertyCodeToNameContext, address: unknown) => string | undefined;
/**
 * Converts a G-NAF Locality Class code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The locality class code to convert (e.g., "G" for gazetted).
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the locality class, or undefined if unknown.
 */
export declare const localityClassCodeToName: (code: string, context: PropertyCodeToNameContext) => string | undefined;
/**
 * Converts a G-NAF Street Suffix code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The street suffix code to convert (e.g., "N", "S", "E", "W").
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the street suffix, or undefined if unknown.
 */
export declare const streetSuffixCodeToName: (code: string, context: PropertyCodeToNameContext) => string | undefined;
/**
 * Converts a G-NAF Geocode Reliability code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The geocode reliability code to convert (e.g., "1", "2", "3").
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the geocode reliability, or undefined if unknown.
 */
export declare const geocodeReliabilityCodeToName: (code: string, context: PropertyCodeToNameContext) => string | undefined;
/**
 * Converts a G-NAF Geocode Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The geocode type code to convert (e.g., "PC", "FC").
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the geocode type, or undefined if unknown.
 */
export declare const geocodeTypeCodeToName: (code: string, context: PropertyCodeToNameContext) => string | undefined;
/**
 * Converts a G-NAF Geocoded Level Type code to its human-readable name.
 * Uses O(1) Map lookup for optimal performance during bulk loading.
 *
 * @param code - The geocoded level type code to convert.
 * @param context - The context containing the authority code tables.
 * @returns The human-readable name of the geocoded level type, or undefined if unknown.
 */
export declare const levelGeocodedCodeToName: (code: string, context: PropertyCodeToNameContext) => string | undefined;
//# sourceMappingURL=propertyCodeToName.d.ts.map