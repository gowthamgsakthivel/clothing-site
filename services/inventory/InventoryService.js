// This file is a client-safe shim. Server-side code should import
// the server-only implementation at `services/inventory/InventoryService.server.js`.

const throwShim = () => {
  throw new Error('Attempted to import server-only InventoryService from a non-server context. Import from "@/services/inventory/InventoryService.server" on the server instead.');
};

export const createInventoryForVariant = throwShim;
export const updateStock = throwShim;
export const reserveStock = throwShim;
export const releaseReservedStock = throwShim;
export const deductStockAfterShipment = throwShim;
export const getInventoryBySku = throwShim;
export const listInventory = throwShim;
export const bulkUpdateStock = throwShim;
