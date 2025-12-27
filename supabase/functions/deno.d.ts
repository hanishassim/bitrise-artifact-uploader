/**
 * Fallback type definitions for Deno global.
 * This satisfies the TypeScript compiler when Deno-specific type libraries are not available.
 */
declare var Deno: {
    /**
     * Serves an HTTP server.
     * @param handler The request handler function.
     */
    serve(handler: (request: Request) => Response | Promise<Response>): void;

    /**
     * Additional Deno globals can be added here as needed.
     */
    env: {
        get(key: string): string | undefined;
    };
};
