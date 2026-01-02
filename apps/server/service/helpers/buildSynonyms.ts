import { mapAuthCodeTableToSynonymList } from "./mapProperty";
import { PropertyCodeToNameContext } from "./propertyCodeToName";

/**
 * Builds the synonyms for the given context.
 *
 * @param context - The context to build the synonyms for.
 * @returns {string[]} The synonyms.
 */
export const buildSynonyms = (context: PropertyCodeToNameContext): string[] => {
    //example synonym format [
    //       'SUPER, super, superannuation',
    //       'SMSF, smsf, self-managed superannuation funds, self managed superannuation funds'
    //     ]
    // Map the authority code tables to synonyms for the street types, flat types, level types, and street suffix types
    const streetTypes = mapAuthCodeTableToSynonymList(
        context.Authority_Code_STREET_TYPE_AUT_psv,
    );
    const flatTypes = mapAuthCodeTableToSynonymList(
        context.Authority_Code_FLAT_TYPE_AUT_psv,
    );
    const levelTypes = mapAuthCodeTableToSynonymList(
        context.Authority_Code_LEVEL_TYPE_AUT_psv,
    );
    const streetSuffixTypes = mapAuthCodeTableToSynonymList(
        context.Authority_Code_STREET_SUFFIX_AUT_psv,
    );

    // Combine the synonyms into a single array
    const synonyms = [
        ...streetTypes,
        ...flatTypes,
        ...levelTypes,
        ...streetSuffixTypes,
    ];

    // Remove duplicates
    const uniqueSynonyms: string[] = [...new Set(synonyms)];

    // Return the unique synonyms
    return uniqueSynonyms;
};
