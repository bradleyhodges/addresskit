"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupportedState = void 0;
/**
 * Check if a state is a valid Australian administrative geographic state.
 *
 * @param state The state to check.
 * @returns True if the state is valid, false otherwise.
 */
const isSupportedState = (state) => {
    return ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].includes(state);
};
exports.isSupportedState = isSupportedState;
//# sourceMappingURL=isSupportedState.js.map