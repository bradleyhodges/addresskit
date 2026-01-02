import { isSupportedState } from "./isSupportedState";

/**
 * Get the covered, supported Australian states from the environment variables.
 *
 * @returns The covered, supported Australian states.
 */
export const getCoveredStates = () => {
    // Get the covered states from the environment variables.
    const covered = process.env.COVERED_STATES || "";

    // If there are no covered states, return an empty array.
    if (covered === "") return [];

    // Split the covered states by commas and return the array.
    const states = covered.split(",");

    // If the states are not supported, return an empty array.
    if (states.some((state) => !isSupportedState(state))) return [];

    // Return the covered states.
    return states;
};
