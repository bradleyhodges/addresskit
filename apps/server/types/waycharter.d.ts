declare module "@mountainpass/waycharter" {
    import type { Router } from "express";

    type LoaderResult = {
        body: unknown;
        headers?: Record<string, string>;
        status?: number;
        hasMore?: boolean;
        links?: unknown;
    };

    type LoaderParams = Record<string, string | number | undefined>;

    export class WayCharter {
        router: Router;
        registerCollection(config: {
            itemPath: string;
            itemLoader: (params: LoaderParams) => Promise<LoaderResult>;
            collectionPath: string;
            collectionLoader: (params: LoaderParams) => Promise<LoaderResult>;
            filters?: Array<{ rel: string; parameters: string[] }>;
        }): {
            additionalPaths: unknown;
        };
        registerResourceType(config: {
            path: string;
            loader: (params?: LoaderParams) => Promise<LoaderResult>;
        }): void;
    }
}
