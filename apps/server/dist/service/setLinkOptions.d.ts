import LinkHeader = require("http-link-header");
/**
 * Adds templated link metadata for an operation to the provided Link header.
 *
 * @param {Record<string, any>} op - Swagger operation object.
 * @param {string} url - Route URL for the operation.
 * @param {LinkHeader} linkTemplate - LinkHeader instance to mutate.
 */
export declare function setLinkOptions(op: Record<string, any>, url: string, linkTemplate: LinkHeader): void;
//# sourceMappingURL=setLinkOptions.d.ts.map