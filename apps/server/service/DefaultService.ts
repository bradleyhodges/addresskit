import debug from "debug";
import LinkHeader = require("http-link-header");
import { setLinkOptions } from "./setLinkOptions";

/**
 * The logger for the API.
 */
const logger = debug("api");

/**
 * API Root
 * returns a list of available APIs within the `Link` headers.
 *
 * @returns {Promise<{ link: LinkHeader; body: Record<string, unknown>; linkTemplate: LinkHeader }>}
 */
export async function getApiRoot(): Promise<{
    link: LinkHeader;
    body: Record<string, unknown>;
    linkTemplate: LinkHeader;
}> {
    // Get the paths from the swagger document
    const paths = Object.keys(global.swaggerDoc.paths).filter(
        (p) =>
            global.swaggerDoc.paths[p].get !== undefined &&
            global.swaggerDoc.paths[p].get["x-root-rel"] !== undefined,
    );

    // Create a new link header
    const link = new LinkHeader();

    // Loop through the paths
    for (const p of paths) {
        // Get the operation from the path
        const op = global.swaggerDoc.paths[p].get;

        // If the operation has parameters and the parameter is required, skip
        if (
            op.parameters?.find(
                (parameter: { required: boolean }) =>
                    parameter.required === true,
            )
        ) {
            // Skip the operation
        } else {
            // Set the link
            link.set({ rel: op["x-root-rel"], uri: p, title: op.summary });
        }
    }

    // Set the describedby link for HTML documentation
    link.set({
        rel: "describedby",
        uri: "/docs/",
        title: "API Docs",
        type: "text/html",
    });

    // Set the describedby link for JSON documentation
    link.set({
        rel: "describedby",
        uri: "/api-docs",
        title: "API Docs",
        type: "application/json",
    });

    // Create a new link template header
    const linkTemplate = new LinkHeader();

    // Loop through the paths
    for (const url of paths) {
        // Get the operation from the path
        const op = global.swaggerDoc.paths[url].get;

        // Log the operation
        logger(op);

        // Set the link options
        setLinkOptions(op, url, linkTemplate);
    }

    // Return the link, body, and link template
    return { link, body: {}, linkTemplate };
}
