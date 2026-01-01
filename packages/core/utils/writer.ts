/**
 * Express-style response instance.
 */
export type JsonResponse = {
    status: (code: number) => JsonResponse;
    setHeader: (name: string, value: string) => JsonResponse;
    json: (body: unknown) => void;
};

/**
 * Structured payload carrying a status code and serialized body.
 */
export class ResponsePayload<T> {
    /**
     * The HTTP status code to return.
     */
    code: number;
    /**
     * The response body to serialize as JSON.
     */
    payload: T;
    /**
     * @param {number} code - HTTP status code to return.
     * @param {T} payload - Response body to serialize as JSON.
     */
    constructor(code: number, payload: T) {
        this.code = code;
        this.payload = payload;
    }
}

/**
 * Builds a structured payload for JSON responses.
 *
 * @template T
 * @param {number} code - HTTP status code to return.
 * @param {T} payload - Response body to serialize as JSON.
 * @returns {ResponsePayload<T>} Structured payload wrapper.
 */
export function respondWithCode<T>(
    code: number,
    payload: T,
): ResponsePayload<T> {
    return new ResponsePayload(code, payload);
}

/**
 * Writes a JSON response to the provided Express response object.
 *
 * @template T
 * @param {JsonResponse} response - Express-style response instance.
 * @param {T | ResponsePayload<T>} bodyOrPayload - Raw body or structured payload wrapper.
 * @param {number | undefined} statusOverride - Optional status code override.
 * @returns {void} Nothing.
 */
export function writeJson<T>(
    response: JsonResponse,
    bodyOrPayload: T | ResponsePayload<T>,
    statusOverride?: number,
): void {
    // If the body or payload is a ResponsePayload, write the payload and code
    if (bodyOrPayload instanceof ResponsePayload) {
        writeJson(response, bodyOrPayload.payload, bodyOrPayload.code);
        return;
    }

    // Derive the status code from the body or payload or default to 200
    const derivedStatus =
        statusOverride ??
        (typeof bodyOrPayload === "number" ? bodyOrPayload : undefined) ??
        200;

    // Derive the payload from the body or payload or default to the body or payload
    const payload =
        statusOverride !== undefined
            ? bodyOrPayload
            : typeof bodyOrPayload === "number"
              ? bodyOrPayload
              : bodyOrPayload;

    // Set the status code and headers
    response.status(derivedStatus);
    response.setHeader("Content-Type", "application/json");

    // Write the payload as JSON
    response.json(payload);
}
