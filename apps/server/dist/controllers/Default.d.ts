import type { Request, Response } from "express";
/**
 * Extended Express Request with Swagger-tools augmentation.
 */
type SwaggerRequest = Request & {
    swagger: unknown;
};
/**
 * Returns API root link relations as Link headers.
 *
 * This endpoint provides HATEOAS entry point for API discoverability,
 * returning available API operations and documentation links in the
 * Link and Link-Template response headers.
 *
 * @param request - Express request augmented with Swagger metadata.
 * @param res - Express response.
 *
 * @example
 * GET /
 *
 * Response Headers:
 * Link: </addresses>; rel="addresses", </docs/>; rel="describedby"
 * Link-Template: </addresses{?q,p}>; rel="addresses"
 *
 * Response Body:
 * {}
 */
export declare function getApiRoot(request: SwaggerRequest, res: Response): void;
export {};
//# sourceMappingURL=Default.d.ts.map