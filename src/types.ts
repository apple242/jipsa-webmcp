export type CategoryId = "cakes" | "flowers" | "gifts" | "desserts";

export interface Product {
  id: string;
  name: string;
  basePrice: number;
  sizes: string[];
  servings: number[];
  flavors: string[];
  fillings: string[];
  ingredients: string[];
  creamColors: string[];
  designStyles: string[];
  lettering: boolean;
  extras: Array<{ name: string; price: number }>;
}

export interface Store {
  id: string;
  name: string;
  neighborhood: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  priceRange: [number, number];
  description: string;
  imageIndex: number;
  sameDay: boolean;
  rush: boolean;
  pickupSlots: string[];
  tags: string[];
  product: Product;
}

export interface SearchArgs {
  category?: CategoryId;
  maxDistanceKm?: number;
  maxBudgetKrw?: number;
  pickupDate?: string;
  pickupTime?: string;
  servings?: number;
  flavor?: string;
  filling?: string;
  ingredient?: string;
  creamColor?: string;
  letteringRequired?: boolean;
}

export interface SearchCandidate {
  storeId: string;
  storeName: string;
  distanceKm: number;
  estimatedPriceKrw: number;
  requestedPickupTime: string;
  closestPickupTime: string;
  exactPickupTime: boolean;
  satisfiesAllProductRequirements: boolean;
  unmetRequirements: string[];
  score: number;
  explanation: string;
}

export interface ProductConfiguration {
  storeId: string;
  productId: string;
  size: string;
  servings: number;
  flavor: string;
  filling: string;
  creamColor: string;
  designStyle: string;
  lettering: string;
  pickupDate: string;
  pickupTime: string;
  extras: string[];
}

export interface Quote {
  subtotalKrw: number;
  adjustments: Array<{ label: string; amountKrw: number }>;
  totalKrw: number;
  currency: "KRW";
  validUntil: string;
}

export interface PreparedOrder {
  confirmationToken: string;
  summary: string;
  totalKrw: number;
  expiresAt: string;
}

export interface DemoOrder {
  id: string;
  status: "confirmed" | "ready" | "completed";
  createdAt: string;
  storeName: string;
  configuration: ProductConfiguration;
  quote: Quote;
}

export interface ToolLog {
  id: number;
  timestamp: string;
  toolName: string;
  input: unknown;
  result?: unknown;
  error?: string;
  stateChange?: string;
}

export interface MarketplaceState {
  category: CategoryId;
  searchArgs: SearchArgs | null;
  searchResults: SearchCandidate[];
  selectedStoreId: string | null;
  configuration: ProductConfiguration | null;
  quote: Quote | null;
  preparedOrder: PreparedOrder | null;
  orders: DemoOrder[];
  logs: ToolLog[];
  configPanelOpen: boolean;
  confirmationOpen: boolean;
  lastEvent: string;
}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
}
