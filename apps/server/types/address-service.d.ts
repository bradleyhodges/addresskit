declare module "../service/address-service" {
    export const getAddress: (...args: any[]) => any;
    export const searchForAddress: (...args: any[]) => any;
    export const loadGnaf: (...args: any[]) => any;
    export const dropIndex: (...args: any[]) => any;
    export const clearAddresses: (...args: any[]) => any;
    export const rebuildAddresses: (...args: any[]) => any;
}
