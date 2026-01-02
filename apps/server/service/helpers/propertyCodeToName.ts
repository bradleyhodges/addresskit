import { error } from "../index";

export type PropertyCodeToNameContext = {
    Authority_Code_LEVEL_TYPE_AUT_psv: { CODE: string; NAME: string }[];
    Authority_Code_FLAT_TYPE_AUT_psv: { CODE: string; NAME: string }[];
    Authority_Code_STREET_TYPE_AUT_psv: { CODE: string; NAME: string }[];
    Authority_Code_STREET_CLASS_AUT_psv: { CODE: string; NAME: string }[];
    Authority_Code_LOCALITY_CLASS_AUT_psv: { CODE: string; NAME: string }[];
    Authority_Code_STREET_SUFFIX_AUT_psv: { CODE: string; NAME: string }[];
    Authority_Code_GEOCODE_RELIABILITY_AUT_psv: {
        CODE: string;
        NAME: string;
    }[];
    Authority_Code_GEOCODE_TYPE_AUT_psv: { CODE: string; NAME: string }[];
    Authority_Code_GEOCODED_LEVEL_TYPE_AUT_psv: {
        CODE: string;
        NAME: string;
    }[];
};

/**
 * Converts a G-NAF Level Type code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @param address - The address object containing the address details.
 * @returns The human readable name of the level type.
 * @throws An error if the level type code is unknown.
 */
export const levelTypeCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
    address: unknown,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_LEVEL_TYPE_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Level Type Code: '${code}'`);
    error({ address });
    return;
};

/**
 * Converts a G-NAF Flat Type code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @param address - The address object containing the address details.
 * @returns The human readable name of the flat type.
 * @throws An error if the flat type code is unknown.
 */
export const flatTypeCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
    address: unknown,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_FLAT_TYPE_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Flat Type Code: '${code}'`);
    error({ address });
    return;
};

/**
 * Converts a G-NAF Street Type code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @param address - The address object containing the address details.
 * @returns The human readable name of the street type.
 * @throws An error if the street type code is unknown.
 */
export const streetTypeCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
    address: unknown,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_STREET_TYPE_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Street Type Code: '${code}'`);
    return;
};

/**
 * Converts a G-NAF Street Class code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @param address - The address object containing the address details.
 * @returns The human readable name of the street class.
 * @throws An error if the street class code is unknown.
 */
export const streetClassCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
    address: unknown,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_STREET_CLASS_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Street Class Code: '${code}'`);
    return;
};

/**
 * Converts a G-NAF Locality Class code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @returns The human readable name of the locality class.
 * @throws An error if the locality class code is unknown.
 */
export const localityClassCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_LOCALITY_CLASS_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Locality Class Code: '${code}'`);
    return;
};

/**
 * Converts a G-NAF Street Suffix code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @returns The human readable name of the street suffix.
 * @throws An error if the street suffix code is unknown.
 */
export const streetSuffixCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_STREET_SUFFIX_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Street Suffix Code: '${code}'`);
    return;
};

/**
 * Converts a G-NAF Geocode Reliability code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @returns The human readable name of the geocode reliability.
 * @throws An error if the geocode reliability code is unknown.
 */
export const geocodeReliabilityCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_GEOCODE_RELIABILITY_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Geocode Reliability Code: '${code}'`);
    return;
};

/**
 * Converts a G-NAF Geocode Type code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @returns The human readable name of the geocode type.
 * @throws An error if the geocode type code is unknown.
 */
export const geocodeTypeCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_GEOCODE_TYPE_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(`Unknown Geocode Type Code: '${code}'`);
    return;
};

/**
 * Converts a G-NAF Geocoded Level Type code to it's human readable name.
 *
 * @param code - The code to convert to a name.
 * @param context - The context containing the authority code tables.
 * @returns The human readable name of the geocoded level type.
 * @throws An error if the geocoded level type code is unknown.
 */
export const levelGeocodedCodeToName = (
    code: string,
    context: PropertyCodeToNameContext,
) => {
    // Find the entry in the authority code table
    const found = context.Authority_Code_GEOCODED_LEVEL_TYPE_AUT_psv.find(
        (entry) => entry.CODE === code,
    );

    // If the entry is found, return the name
    if (found) return found.NAME;

    // Otherwise, log the error and return undefined
    error(
        `Unknown Geocoded Level Type Code: '${code}' in:\n${JSON.stringify(
            context.Authority_Code_GEOCODED_LEVEL_TYPE_AUT_psv,
            undefined,
            2,
        )}`,
    );
    return;
};
