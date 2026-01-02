/**
 * Gets the files from the given directory.
 *
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param currentDir - The current directory.
 * @param baseDir - The base directory.
 *
 * @returns {Promise<string[]>} - A promise that resolves with the files from the given directory.
 */
export declare const getFiles: (currentDir: string, baseDir: string) => Promise<string[]>;
/**
 * Counts the lines in the given file.
 *
 * @alias countFileLines
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param filePath - The path to the file to count the lines of.
 * @returns {Promise<number>} - A promise that resolves with the number of lines in the file.
 */
export declare const countLinesInFile: (filePath: string) => Promise<number>;
/**
 * Checks if the given file exists.
 *
 * @alias fileExists
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param filePath - The path to the file to check if it exists.
 * @returns {Promise<boolean>} - A promise that resolves with true if the file exists, false otherwise.
 */
export declare const fileExists: (filePath: string) => Promise<boolean>;
/**
 * Parses and loads record counts for G-NAF data files from a CSV summary file.
 *
 * @param {string} countsFile - Absolute or relative path to the summary CSV file enumerating all G-NAF constituent files and their record counts.
 *
 * @returns {Promise<Record<string, number>>} - An object (record) where each key is a normalized PSV file path,
 *   and each value is the numeric count of data records for that file, as read from the input CSV.
 * @throws {Error} If the file cannot be read or parsed, or if a row is found with an invalid structure.
 */
export declare const loadFileCounts: (countsFile: string) => Promise<Record<string, number>>;
/**
 * Loads the file contents from the given file.
 *
 * @alias loadFileContents
 * @augments loadFromGnaf - This function is part of the data loading functionality of the service
 *
 * @param filePath - The path to the file to load the contents from.
 *
 * @returns {Promise<string[]>} - A promise that resolves with the file contents.
 */
export declare const readFileContents: (filePath: string) => Promise<string[]>;
//# sourceMappingURL=fs.d.ts.map