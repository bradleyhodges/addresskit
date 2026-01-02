// Type definitions for directory-exists
// Project: directory-exists
// Definitions by: Bradley Hodges <github.com/bradleyhodges>

declare module "directory-exists" {
    /**
     * Asynchronously determines whether the given path exists and is a directory.
     *
     * If `callback` is omitted, a Promise is returned.
     * If `callback` is provided, the function returns void and invokes the callback.
     *
     * The implementation resolves the path via `path.resolve(directory)` before checking.
     *
     * @param directory A non-empty string path to test.
     * @returns A Promise resolving to `true` if the resolved path exists and is a directory; otherwise `false`.
     *
     * @throws {TypeError} If `directory` is not a non-empty string.
     */
    function directoryExists(directory: string): Promise<boolean>;

    /**
     * Asynchronously determines whether the given path exists and is a directory (callback style).
     *
     * Note: per the library implementation, the error argument is always `null`
     * and filesystem errors are represented as `exists = false`.
     *
     * @param directory A non-empty string path to test.
     * @param callback Callback invoked with `(null, exists)`.
     *
     * @throws {TypeError} If `directory` is not a non-empty string.
     */
    function directoryExists(
        directory: string,
        callback: (error: null, exists: boolean) => void,
    ): void;

    namespace directoryExists {
        /**
         * Synchronously determines whether the given path exists and is a directory.
         *
         * The implementation resolves the path via `path.resolve(directory)` before checking.
         *
         * @param directory A non-empty string path to test.
         * @returns `true` if the resolved path exists and is a directory; otherwise `false`.
         *
         * @throws {TypeError} If `directory` is not a non-empty string.
         */
        function sync(directory: string): boolean;
    }

    export = directoryExists;
}
