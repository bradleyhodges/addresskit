import { AddressDetailRow, AddressDetails, AddressGeocode, GeoDefaultRecord, GeoSiteRecord, LocalityRecord, MapPropertyContext, StreetLocalityRecord, StructuredAddress, StructuredLocality, StructuredStreetLocality } from "../types/gnaf-properties";
import { type PropertyCodeToNameContext } from "./propertyCodeToName";
/**
 * Maps a locality object to a structured locality object.
 *
 * @param l - The locality object to map.
 * @param context - The context containing the authority code tables.
 * @returns The structured locality object.
 */
export declare const mapLocality: (l: LocalityRecord, context: PropertyCodeToNameContext) => StructuredLocality;
/**
 * Maps a street locality row into its structured representation.
 *
 * @param l - The street locality record to structure.
 * @param context - The lookup context supplying authority code names.
 * @returns The structured street locality with decoded codes.
 */
export declare const mapStreetLocality: (l: StreetLocalityRecord, context: PropertyCodeToNameContext) => StructuredStreetLocality;
/**
 * Maps geocode rows (site and default) into a structured list of geocodes.
 *
 * @param geoSite - Site geocode records for an address site.
 * @param context - The lookup context supplying authority code names.
 * @param geoDefault - Default geocode records for the address detail.
 * @returns Structured geocode entries with decoded codes.
 * @throws If unsupported geocode attributes are encountered.
 */
export declare const mapGeo: (geoSite: GeoSiteRecord[] | undefined, context: PropertyCodeToNameContext, geoDefault?: GeoDefaultRecord[]) => AddressGeocode[];
/**
 * Joins a formatted local address into a single string.
 *
 * @param fla - The formatted locality address components.
 * @returns The single line address.
 */
export declare const mapToSla: (fla: string[]) => string;
/**
 * Builds the multi-line address representation for an address.
 *
 * @param s - The structured address to format.
 * @returns The multi-line address array.
 * @throws When the formatted address exceeds four lines.
 */
export declare const mapToMla: (s: StructuredAddress) => string[];
/**
 * Builds the short-form multi-line address representation for an address.
 *
 * @param s - The structured address to format.
 * @returns The short-form multi-line address array.
 * @throws When the formatted address exceeds four lines.
 */
export declare const mapToShortMla: (s: StructuredAddress) => string[];
/**
 * Maps a raw address detail row into a fully structured address with geocodes.
 *
 * @param d - The raw address detail row from G-NAF.
 * @param context - The lookup context containing authority codes and indexes.
 * @param i - The current row index for optional progress logging.
 * @param count - Total row count for optional progress logging.
 * @returns The structured address with formatted variants.
 */
export declare const mapAddressDetails: (d: AddressDetailRow, context: MapPropertyContext, i?: number, count?: number) => AddressDetails;
export declare const mapAuthCodeTableToSynonymList: (table: {
    CODE: string;
    NAME: string;
}[]) => string[];
//# sourceMappingURL=mapProperty.d.ts.map