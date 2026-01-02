"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLinkOptions = setLinkOptions;
const json_ptr_1 = require("json-ptr");
/**
 * Adds templated link metadata for an operation to the provided Link header.
 *
 * @param {Record<string, any>} op - Swagger operation object.
 * @param {string} url - Route URL for the operation.
 * @param {LinkHeader} linkTemplate - LinkHeader instance to mutate.
 */
function setLinkOptions(
// biome-ignore lint/suspicious/noExplicitAny: swagger operation is untyped
op, url, linkTemplate) {
    // If the operation has parameters, get the query parameters
    if (op.parameters) {
        // Get the parameters and filter for query parameters
        const parameters = op.parameters;
        const queryParameters = parameters.filter((parameter) => parameter.in === "query");
        // Create the link options
        const linkOptions = {
            rel: op["x-root-rel"],
            uri: `${url}{?${queryParameters.map((qp) => qp.name).join(",")}}`,
            title: op.summary,
            type: "application/json",
            "var-base": `/api-docs${(0, json_ptr_1.encodeUriFragmentIdentifier)([
                "paths",
                url,
                "get",
                "parameters",
            ])}`,
        };
        // Set the link options
        linkTemplate.set(linkOptions);
    }
}
//# sourceMappingURL=setLinkOptions.js.map