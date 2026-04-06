import * as updateItemsOffline from "./updateItemsOffline.mjs";
import * as CancelBookings from "./CancelBookings.mjs";
import * as CancelBookedCarBookings from "./CancelBookedCarBookings.mjs";
import * as PaymentUpdate from "./PaymentUpdate.mjs";
import * as BookedCarInvoiced from "./BookedCarInvoiced.mjs";

const registry = {
  updateItemsOffline,
  CancelBookings,
  CancelBookedCarBookings,
  PaymentUpdate,
  BookedCarInvoiced
};

/**
 * @param {string} name
 * @param {import('./types.mjs').ProcessorContext} ctx
 */
async function runProcessor(name, ctx) {
  const mod = registry[name];
  if (!mod?.process) {
    throw new Error(`Unknown processor "${name}". Add it to processors/index.mjs`);
  }
  return mod.process(ctx);
}

export { runProcessor };
