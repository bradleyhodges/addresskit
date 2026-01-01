import { encodeUriFragmentIdentifier } from "json-ptr";
import LinkHeader = require("http-link-header");

/**
 * Adds templated link metadata for an operation to the provided Link header.
 *
 * @param {Record<string, any>} op - Swagger operation object.
 * @param {string} url - Route URL for the operation.
 * @param {LinkHeader} linkTemplate - LinkHeader instance to mutate.
 */
export function setLinkOptions(
    // biome-ignore lint/suspicious/noExplicitAny: swagger operation is untyped
    op: Record<string, any>,
    url: string,
    linkTemplate: LinkHeader,
): void {
    // If the operation has parameters, get the query parameters
    if (op.parameters) {
        // Get the parameters and filter for query parameters
        const parameters = op.parameters;
        const queryParameters = parameters.filter(
            (parameter: { in: string }) => parameter.in === "query",
        );

        // Create the link options
        const linkOptions = {
            rel: op["x-root-rel"],
            uri: `${url}{?${queryParameters.map((qp: { name: string }) => qp.name).join(",")}}`,
            title: op.summary,
            type: "application/json",
            "var-base": `/api-docs${encodeUriFragmentIdentifier([
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
