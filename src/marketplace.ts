import { cakeStores, categorySchemas, getStore } from "./data";
import type {
  DemoOrder,
  MarketplaceState,
  PreparedOrder,
  ProductConfiguration,
  Quote,
  SearchArgs,
  SearchCandidate,
  ToolLog,
} from "./types";

const listeners = new Set<() => void>();
let logSequence = 0;

function nextSaturday() {
  const date = new Date();
  const days = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadOrders(): DemoOrder[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("nearmade-demo-orders") || "[]") as DemoOrder[];
  } catch {
    return [];
  }
}

const initialState = (): MarketplaceState => ({
  category: "cakes",
  searchArgs: null,
  searchResults: [],
  selectedStoreId: null,
  configuration: null,
  quote: null,
  preparedOrder: null,
  orders: loadOrders(),
  logs: [],
  configPanelOpen: false,
  confirmationOpen: false,
  lastEvent: "Marketplace ready",
});

let state = initialState();

function emit() {
  listeners.forEach((listener) => listener());
}

function update(patch: Partial<MarketplaceState>) {
  state = { ...state, ...patch };
  emit();
}

export const marketplaceStore = {
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  update,
  reset() {
    const orders = loadOrders();
    state = { ...initialState(), orders, lastEvent: "Demo reset" };
    emit();
  },
  clearLogs() {
    update({ logs: [] });
  },
};

function toolError(code: string, message: string, nextAction: string) {
  return { ok: false, error: { code, message, recoverable: true, nextAction } };
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function closestSlot(slots: string[], requested: string) {
  return [...slots].sort((a, b) => Math.abs(minutes(a) - minutes(requested)) - Math.abs(minutes(b) - minutes(requested)))[0];
}

function estimatedPrice(storeId: string, args: SearchArgs) {
  const store = getStore(storeId);
  if (!store) return Number.POSITIVE_INFINITY;
  let price = store.product.basePrice;
  if (normalize(args.filling).includes("strawberry") || normalize(args.ingredient).includes("strawberry")) price += 4000;
  if (args.letteringRequired) price += 2000;
  return price;
}

function defaultConfiguration(storeId: string): ProductConfiguration | null {
  const store = getStore(storeId);
  if (!store) return null;
  return {
    storeId,
    productId: store.product.id,
    size: "Small · serves 4",
    servings: 4,
    flavor: "Vanilla",
    filling: store.product.fillings.includes("Fresh strawberry") ? "Fresh strawberry" : store.product.fillings[0],
    creamColor: store.product.creamColors.includes("White") ? "White" : store.product.creamColors[0],
    designStyle: store.product.designStyles[0],
    lettering: "",
    pickupDate: nextSaturday(),
    pickupTime: store.pickupSlots.includes("16:00") ? "16:00" : store.pickupSlots[0],
    extras: [],
  };
}

export function searchStores(args: SearchArgs): SearchCandidate[] {
  const requestedTime = args.pickupTime || "16:00";
  const candidates = cakeStores.map((store) => {
    const unmet: string[] = [];
    const product = store.product;
    const price = estimatedPrice(store.id, args);
    const closestPickupTime = closestSlot(store.pickupSlots, requestedTime);
    const exactPickupTime = closestPickupTime === requestedTime;

    if (args.maxDistanceKm !== undefined && store.distanceKm > args.maxDistanceKm) unmet.push(`Distance is ${store.distanceKm} km`);
    if (args.maxBudgetKrw !== undefined && price > args.maxBudgetKrw) unmet.push(`Estimated price is ₩${price.toLocaleString("en-US")}`);
    if (args.servings !== undefined && !product.servings.includes(args.servings)) unmet.push(`Does not offer exactly ${args.servings} servings`);
    if (args.flavor && !product.flavors.some((item) => normalize(item).includes(normalize(args.flavor)))) unmet.push(`${args.flavor} flavor unavailable`);
    if (args.filling && !product.fillings.some((item) => normalize(item).includes(normalize(args.filling)))) unmet.push(`${args.filling} filling unavailable`);
    if (args.ingredient && !product.ingredients.some((item) => normalize(item).includes(normalize(args.ingredient))) && !product.fillings.some((item) => normalize(item).includes(normalize(args.ingredient)))) unmet.push(`${args.ingredient} unavailable`);
    if (args.creamColor && !product.creamColors.some((item) => normalize(item) === normalize(args.creamColor))) unmet.push(`${args.creamColor} cream unavailable`);
    if (args.letteringRequired && !product.lettering) unmet.push("Custom lettering unavailable");

    const slotDelta = Math.abs(minutes(closestPickupTime) - minutes(requestedTime));
    const satisfiesAllProductRequirements = unmet.length === 0;
    const score = Math.round(100 - store.distanceKm * 5 - slotDelta / 3 - Math.max(0, price - 40000) / 1000 - unmet.length * 22);
    const explanation = exactPickupTime && satisfiesAllProductRequirements
      ? `${store.name} satisfies every requested condition with an exact ${formatTime(requestedTime)} pickup slot.`
      : `${store.name} matches the product requirements${exactPickupTime ? "" : `; the closest pickup is ${formatTime(closestPickupTime)}`}${unmet.length ? `; ${unmet[0]}` : ""}.`;

    return {
      storeId: store.id,
      storeName: store.name,
      distanceKm: store.distanceKm,
      estimatedPriceKrw: price,
      requestedPickupTime: requestedTime,
      closestPickupTime,
      exactPickupTime,
      satisfiesAllProductRequirements,
      unmetRequirements: unmet,
      score,
      explanation,
    };
  });

  return candidates
    .filter((candidate) => candidate.unmetRequirements.length === 0 || (candidate.storeId === "dear-cake" || candidate.storeId === "cake-forest"))
    .sort((a, b) => Number(b.exactPickupTime) - Number(a.exactPickupTime) || Number(b.satisfiesAllProductRequirements) - Number(a.satisfiesAllProductRequirements) || b.score - a.score)
    .slice(0, 6);
}

export function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function calculateQuote(configuration: ProductConfiguration): Quote {
  const store = getStore(configuration.storeId);
  if (!store) throw new Error("The selected store no longer exists.");
  const adjustments: Quote["adjustments"] = [];
  const sizeIndex = store.product.sizes.indexOf(configuration.size);
  if (sizeIndex > 1) adjustments.push({ label: configuration.size, amountKrw: (sizeIndex - 1) * 9000 });
  if (normalize(configuration.filling).includes("strawberry")) adjustments.push({ label: "Fresh strawberry filling", amountKrw: 4000 });
  if (configuration.lettering.trim()) adjustments.push({ label: "Hand lettering", amountKrw: 2000 });
  for (const extra of configuration.extras) {
    const option = store.product.extras.find((item) => item.name === extra);
    if (option) adjustments.push({ label: option.name, amountKrw: option.price });
  }
  const totalKrw = store.product.basePrice + adjustments.reduce((sum, item) => sum + item.amountKrw, 0);
  return {
    subtotalKrw: store.product.basePrice,
    adjustments,
    totalKrw,
    currency: "KRW",
    validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

function createLog(toolName: string, input: unknown): ToolLog {
  return { id: ++logSequence, timestamp: new Date().toISOString(), toolName, input };
}

export async function executeMarketplaceTool(toolName: string, input: Record<string, unknown>) {
  const log = createLog(toolName, input);
  let stateChange = "No visible state change";
  let result: unknown;
  try {
    switch (toolName) {
      case "search_local_stores": {
        const args = input as SearchArgs;
        if (args.category && args.category !== "cakes") {
          result = toolError("CATEGORY_NOT_AVAILABLE", "The deep agent ordering demo currently supports the cakes category.", "Use category=cakes. Flowers, gifts, and desserts are included as schema-driven expansion previews.");
          break;
        }
        if (args.maxDistanceKm !== undefined && (Number(args.maxDistanceKm) <= 0 || Number(args.maxDistanceKm) > 50)) {
          result = toolError("INVALID_DISTANCE", "maxDistanceKm must be between 0 and 50.", "Retry with a realistic local search radius.");
          break;
        }
        if (args.maxBudgetKrw !== undefined && Number(args.maxBudgetKrw) < 10000) {
          result = toolError("INVALID_BUDGET", "maxBudgetKrw must be at least 10000.", "Retry with a budget in Korean won.");
          break;
        }
        const results = searchStores(args);
        update({ searchArgs: args, searchResults: results, category: args.category || "cakes", lastEvent: `${results.length} stores compared` });
        stateChange = `Search results updated with ${results.length} ranked candidates`;
        result = {
          ok: true,
          query: args,
          exactMatches: results.filter((item) => item.exactPickupTime && item.satisfiesAllProductRequirements),
          nearMatches: results.filter((item) => !item.exactPickupTime || !item.satisfiesAllProductRequirements),
          bestMatch: results[0],
          reasoning: results[0]?.explanation || "No matching stores were found.",
        };
        break;
      }
      case "get_store_details": {
        const store = getStore(String(input.storeId || ""));
        if (!store) {
          result = toolError("STORE_NOT_FOUND", "No store exists with that storeId.", "Use search_local_stores and choose a returned storeId.");
          break;
        }
        const configuration = state.configuration?.storeId === store.id ? state.configuration : defaultConfiguration(store.id);
        update({ selectedStoreId: store.id, configuration, quote: null, preparedOrder: null, configPanelOpen: true, lastEvent: `${store.name} selected` });
        stateChange = `Selected ${store.name} and opened its product panel`;
        result = { ok: true, store, currentConfiguration: configuration };
        break;
      }
      case "search_products": {
        const text = normalize(input.query);
        const storeId = input.storeId ? String(input.storeId) : undefined;
        const products = cakeStores
          .filter((store) => !storeId || store.id === storeId)
          .filter((store) => !text || normalize(`${store.name} ${store.product.name} ${store.product.flavors.join(" ")} ${store.product.fillings.join(" ")}`).includes(text))
          .map((store) => ({ storeId: store.id, storeName: store.name, ...store.product }));
        result = { ok: true, count: products.length, products };
        break;
      }
      case "get_product_options": {
        const store = getStore(String(input.storeId || state.selectedStoreId || ""));
        if (!store || (input.productId && store.product.id !== input.productId)) {
          result = toolError("PRODUCT_NOT_FOUND", "The requested product was not found.", "Call search_products to retrieve valid product and store identifiers.");
          break;
        }
        result = { ok: true, productId: store.product.id, options: store.product, categorySchema: categorySchemas.cakes };
        break;
      }
      case "check_availability": {
        const store = getStore(String(input.storeId || state.selectedStoreId || ""));
        const pickupTime = String(input.pickupTime || "16:00");
        if (!store) {
          result = toolError("STORE_NOT_FOUND", "A valid storeId is required to check availability.", "Choose a store returned by search_local_stores.");
          break;
        }
        const closest = closestSlot(store.pickupSlots, pickupTime);
        result = {
          ok: true,
          storeId: store.id,
          pickupDate: String(input.pickupDate || nextSaturday()),
          requestedTime: pickupTime,
          available: store.pickupSlots.includes(pickupTime),
          closestAvailableTime: closest,
          alternatives: store.pickupSlots,
        };
        break;
      }
      case "configure_product": {
        const storeId = String(input.storeId || state.selectedStoreId || "");
        const store = getStore(storeId);
        if (!store) {
          result = toolError("STORE_NOT_SELECTED", "Select a valid store before configuring a product.", "Call get_store_details with a storeId.");
          break;
        }
        const current = state.configuration?.storeId === storeId ? state.configuration : defaultConfiguration(storeId);
        if (!current) throw new Error("Could not initialize the product configuration.");
        const proposed = { ...current };
        const optionChecks: Array<[keyof ProductConfiguration, string[]]> = [
          ["size", store.product.sizes],
          ["flavor", store.product.flavors],
          ["filling", store.product.fillings],
          ["creamColor", store.product.creamColors],
          ["designStyle", store.product.designStyles],
        ];
        for (const [key, options] of optionChecks) {
          if (input[key] !== undefined) {
            const requested = String(input[key]);
            const canonical = options.find((option) => normalize(option) === normalize(requested));
            if (!canonical) {
              result = toolError("OPTION_UNAVAILABLE", `${String(key)} does not support “${requested}”.`, `Choose one of: ${options.join(", ")}.`);
              break;
            }
            (proposed as unknown as Record<string, unknown>)[key] = canonical;
          }
        }
        if (result) break;
        if (input.size !== undefined && input.servings === undefined) {
          const servingMatch = proposed.size.match(/serves\s+(\d+)/i);
          if (servingMatch) proposed.servings = Number(servingMatch[1]);
        }
        if (input.servings !== undefined) {
          const servings = Number(input.servings);
          if (!store.product.servings.includes(servings)) {
            result = toolError("SERVINGS_UNAVAILABLE", `${servings} servings is unavailable.`, `Choose one of: ${store.product.servings.join(", ")}.`);
            break;
          }
          proposed.servings = servings;
          const size = store.product.sizes.find((item) => item.includes(`serves ${servings}`));
          if (size) proposed.size = size;
        }
        if (input.lettering !== undefined) {
          const lettering = String(input.lettering).trim();
          if (!store.product.lettering && lettering) {
            result = toolError("LETTERING_UNAVAILABLE", "This store does not offer custom lettering.", "Choose a store whose product options include lettering.");
            break;
          }
          if (lettering.length > 40) {
            result = toolError("LETTERING_TOO_LONG", "Lettering must be 40 characters or fewer.", "Shorten the message and retry.");
            break;
          }
          proposed.lettering = lettering;
        }
        if (input.pickupTime !== undefined) {
          const time = String(input.pickupTime);
          if (!store.pickupSlots.includes(time)) {
            result = toolError("PICKUP_TIME_UNAVAILABLE", `${formatTime(time)} is not available at ${store.name}.`, `Choose one of: ${store.pickupSlots.map(formatTime).join(", ")}.`);
            break;
          }
          proposed.pickupTime = time;
        }
        if (input.pickupDate !== undefined) proposed.pickupDate = String(input.pickupDate);
        if (Array.isArray(input.extras)) {
          const extras = input.extras.map(String);
          const invalid = extras.find((extra) => !store.product.extras.some((option) => option.name === extra));
          if (invalid) {
            result = toolError("EXTRA_UNAVAILABLE", `The extra “${invalid}” is unavailable.`, `Choose from: ${store.product.extras.map((item) => item.name).join(", ")}.`);
            break;
          }
          proposed.extras = extras;
        }
        update({ configuration: proposed, selectedStoreId: storeId, quote: null, preparedOrder: null, configPanelOpen: true, lastEvent: `Cake updated: ${proposed.creamColor}` });
        stateChange = `Product configuration updated; unspecified options were preserved`;
        result = { ok: true, configuration: proposed, visualStateUpdated: true, nextRecommendedTool: "get_quote" };
        break;
      }
      case "get_quote": {
        if (!state.configuration) {
          result = toolError("CONFIGURATION_REQUIRED", "There is no configured product to quote.", "Select a store and call configure_product first.");
          break;
        }
        const quote = calculateQuote(state.configuration);
        update({ quote, preparedOrder: null, lastEvent: `Quote ready: ₩${quote.totalKrw.toLocaleString("en-US")}` });
        stateChange = `Quote card updated to ₩${quote.totalKrw.toLocaleString("en-US")}`;
        result = { ok: true, configuration: state.configuration, quote, nextRecommendedTool: "prepare_order" };
        break;
      }
      case "prepare_order": {
        if (!state.configuration || !state.quote) {
          result = toolError("QUOTE_REQUIRED", "A current configuration and quote are required.", "Call get_quote before preparing the order.");
          break;
        }
        const store = getStore(state.configuration.storeId);
        if (!store) throw new Error("The configured store no longer exists.");
        const confirmationToken = `confirm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        const prepared: PreparedOrder = {
          confirmationToken,
          summary: `${state.configuration.size} ${state.configuration.flavor.toLowerCase()} cake from ${store.name}, ${state.configuration.creamColor.toLowerCase()} cream, “${state.configuration.lettering || "No lettering"}”, pickup ${state.configuration.pickupDate} at ${formatTime(state.configuration.pickupTime)}.`,
          totalKrw: state.quote.totalKrw,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };
        update({ preparedOrder: prepared, confirmationOpen: true, lastEvent: "Waiting for final confirmation" });
        stateChange = "Final confirmation dialog opened; no order was created";
        result = { ok: true, preparedOrder: prepared, orderCreated: false, userConfirmationRequired: true, nextRecommendedTool: "place_order" };
        break;
      }
      case "place_order": {
        const token = String(input.confirmationToken || "");
        if (!state.preparedOrder || token !== state.preparedOrder.confirmationToken) {
          result = toolError("INVALID_CONFIRMATION", "The confirmation token is missing, expired, or does not match the prepared order.", "Call prepare_order and present its exact summary to the user.");
          break;
        }
        if (input.confirmed !== true) {
          result = toolError("CONFIRMATION_REQUIRED", "The order was not placed because explicit user confirmation is required.", "Ask the user to confirm the displayed total, pickup time, and order summary.");
          break;
        }
        if (!state.configuration || !state.quote) throw new Error("The prepared order is incomplete.");
        const store = getStore(state.configuration.storeId);
        if (!store) throw new Error("The prepared store no longer exists.");
        const order: DemoOrder = {
          id: `NM-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${String(state.orders.length + 1).padStart(3, "0")}`,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          storeName: store.name,
          configuration: state.configuration,
          quote: state.quote,
        };
        const orders = [order, ...state.orders];
        if (typeof localStorage !== "undefined") localStorage.setItem("nearmade-demo-orders", JSON.stringify(orders));
        update({ orders, preparedOrder: null, confirmationOpen: false, lastEvent: `Order ${order.id} confirmed` });
        stateChange = `Persisted demo order ${order.id}`;
        result = { ok: true, order, message: `Order ${order.id} is confirmed for pickup at ${formatTime(order.configuration.pickupTime)}.` };
        break;
      }
      case "get_order_status": {
        const orderId = String(input.orderId || state.orders[0]?.id || "");
        const order = state.orders.find((item) => item.id === orderId);
        result = order
          ? { ok: true, orderId: order.id, status: order.status, storeName: order.storeName, pickupDate: order.configuration.pickupDate, pickupTime: order.configuration.pickupTime }
          : toolError("ORDER_NOT_FOUND", "No demo order exists with that orderId.", "Use the orderId returned by place_order.");
        break;
      }
      default:
        result = toolError("TOOL_NOT_FOUND", `Unknown tool: ${toolName}`, "Discover the currently registered WebMCP tools and retry.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected tool failure.";
    const failedLog = { ...log, error: message, stateChange };
    update({ logs: [failedLog, ...state.logs].slice(0, 80), lastEvent: `${toolName} failed` });
    return toolError("INTERNAL_ERROR", message, "Retry the tool or inspect the developer audit log.");
  }

  const completedLog = { ...log, result, stateChange };
  update({ logs: [completedLog, ...state.logs].slice(0, 80) });
  return result;
}

export function selectStoreForHuman(storeId: string) {
  void executeMarketplaceTool("get_store_details", { storeId });
}

export function configureForHuman(patch: Record<string, unknown>) {
  void executeMarketplaceTool("configure_product", patch);
}
