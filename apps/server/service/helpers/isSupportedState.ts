/**
 * Check if a state is a valid Australian administrative geographic state.
 *
 * @param state The state to check.
 * @returns True if the state is valid, false otherwise.
 */
export const isSupportedState = (state: string) => {
    return ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].includes(
        state,
    );
};
