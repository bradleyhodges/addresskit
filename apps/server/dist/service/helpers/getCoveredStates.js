"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoveredStates = void 0;
const isSupportedState_1 = require("./isSupportedState");
/**
 * Get the covered, supported Australian states from the environment variables.
 *
 * @returns The covered, supported Australian states.
 */
const getCoveredStates = () => {
    // Get the covered states from the environment variables.
    const covered = process.env.COVERED_STATES || "";
    // If there are no covered states, return an empty array.
    if (covered === "")
        return [];
    // Split the covered states by commas and return the array.
    const states = covered.split(",");
    // If the states are not supported, return an empty array.
    if (states.some((state) => !(0, isSupportedState_1.isSupportedState)(state)))
        return [];
    // Return the covered states.
    return states;
};
exports.getCoveredStates = getCoveredStates;
//# sourceMappingURL=getCoveredStates.js.map