"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSynonyms = void 0;
const mapProperty_1 = require("./mapProperty");
/**
 * Builds the synonyms for the given context.
 *
 * @param context - The context to build the synonyms for.
 * @returns {string[]} The synonyms.
 */
const buildSynonyms = (context) => {
    //example synonym format [
    //       'SUPER, super, superannuation',
    //       'SMSF, smsf, self-managed superannuation funds, self managed superannuation funds'
    //     ]
    // Map the authority code tables to synonyms for the street types, flat types, level types, and street suffix types
    const streetTypes = (0, mapProperty_1.mapAuthCodeTableToSynonymList)(context.Authority_Code_STREET_TYPE_AUT_psv);
    const flatTypes = (0, mapProperty_1.mapAuthCodeTableToSynonymList)(context.Authority_Code_FLAT_TYPE_AUT_psv);
    const levelTypes = (0, mapProperty_1.mapAuthCodeTableToSynonymList)(context.Authority_Code_LEVEL_TYPE_AUT_psv);
    const streetSuffixTypes = (0, mapProperty_1.mapAuthCodeTableToSynonymList)(context.Authority_Code_STREET_SUFFIX_AUT_psv);
    // Combine the synonyms into a single array
    const synonyms = [
        ...streetTypes,
        ...flatTypes,
        ...levelTypes,
        ...streetSuffixTypes,
    ];
    // Remove duplicates
    const uniqueSynonyms = [...new Set(synonyms)];
    // Return the unique synonyms
    return uniqueSynonyms;
};
exports.buildSynonyms = buildSynonyms;
//# sourceMappingURL=buildSynonyms.js.map