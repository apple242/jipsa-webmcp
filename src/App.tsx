import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  ClipboardCheck,
  Gift,
  Heart,
  LocateFixed,
  MapPin,
  Menu,
  PackageCheck,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store as StoreIcon,
  TerminalSquare,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cakeStores, categories, getStore, imageIndexForColor, imagePosition } from "./data";
import { configureForHuman, formatTime, marketplaceStore, selectStoreForHuman } from "./marketplace";
import type { MarketplaceState, SearchCandidate, Store } from "./types";
import { invokeTool, registerWebMcpTools } from "./webmcp";

type AgentMessage = {
  role: "user" | "agent" | "tool";
  text: string;
  tool?: string;
};

const DEMO_PROMPT = "Find a custom cake within 3 km, under ₩50,000, for four people, with strawberry, white cream, custom lettering, and pickup this Saturday at 4 PM.";

function formatKrw(value: number) {
  return `₩${value.toLocaleString("en-US")}`;
}

function todayToNextSaturday() {
  const date = new Date();
  const days = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function CakeImage({ index, className = "", label }: { index: number; className?: string; label: string }) {
  return (
    <div
      className={`cake-image ${className}`}
      role="img"
      aria-label={label}
      style={{ backgroundPosition: imagePosition(index) }}
    />
  );
}

function useMarketplace() {
  return useSyncExternalStore(marketplaceStore.subscribe, marketplaceStore.getState, marketplaceStore.getState);
}

function Logo() {
  return (
    <a href="#top" className="logo" aria-label="Jipsa home">
      <span className="logo-mark">J</span>
      <span>jipsa</span>
    </a>
  );
}

function Header({ onOpenAgent, onOpenOrders }: { onOpenAgent: () => void; onOpenOrders: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <div className="announcement-bar"><span>Made to order by independent local makers</span><span>Free pickup coordination on every order</span></div>
      <header className="site-header" id="top">
        <div className="header-inner">
          <Logo />
          <nav className={mobileOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
            <a href="#marketplace">Shop</a>
            <a href="#marketplace">Custom cakes</a>
            <a href="#categories">Flowers & gifts</a>
            <a href="#how-it-works">How it works</a>
          </nav>
          <div className="header-actions">
            <button className="location-button" type="button">
              <MapPin size={16} strokeWidth={2} />
              <span>Seongsu</span>
              <ChevronDown size={14} />
            </button>
            <button className="icon-button order-button" type="button" onClick={onOpenOrders} title="View orders">
              <ShoppingBag size={19} />
            </button>
            <button className="agent-button" type="button" onClick={onOpenAgent}>
              <Sparkles size={16} />
              Order with ChatGPT
            </button>
            <button className="icon-button mobile-menu" type="button" onClick={() => setMobileOpen((value) => !value)} title="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function Hero({ onOpenAgent }: { onOpenAgent: () => void }) {
  return (
    <section className="hero shell">
      <div className="hero-copy">
        <p className="eyebrow"><LocateFixed size={14} /> Custom-made in your neighborhood</p>
        <h1>A cake that feels<br /><em>made for them.</em></h1>
        <p className="hero-intro">Shop celebration cakes from trusted local bakers. Choose every detail online and pick up exactly when you need it.</p>
        <div className="hero-actions">
          <a className="primary-link" href="#marketplace">Shop custom cakes <ArrowRight size={17} /></a>
          <button className="text-button" type="button" onClick={onOpenAgent}><Sparkles size={16} /> Order with ChatGPT</button>
        </div>
        <div className="hero-proof"><span><CircleCheck size={14} /> Real-time pickup slots</span><span><CircleCheck size={14} /> Clear custom pricing</span></div>
      </div>
      <div className="hero-visual" aria-label="Featured custom cakes">
        <CakeImage index={0} label="White strawberry cake from Mellow Cake" className="hero-main-image" />
        <div className="maker-note">
          <span className="avatar">MC</span>
          <span><strong>Mellow Cake</strong><small>1.2 km away · Ready Saturday</small></span>
          <Heart size={17} />
        </div>
        <div className="hero-thumbnail"><CakeImage index={1} label="Lavender vintage heart cake" /></div>
      </div>
    </section>
  );
}

function CategoryTabs({ active, onChange }: { active: string; onChange: (id: MarketplaceState["category"]) => void }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Marketplace categories">
      {categories.map((category) => (
        <button
          type="button"
          role="tab"
          aria-selected={active === category.id}
          className={active === category.id ? "category-tab active" : "category-tab"}
          key={category.id}
          onClick={() => onChange(category.id)}
        >
          {category.label}<span>{category.count}</span>
        </button>
      ))}
    </div>
  );
}

function SearchBar({ onAgentSearch }: { onAgentSearch: () => void }) {
  return (
    <div className="market-search">
      <Search size={18} />
      <input aria-label="Search products and makers" placeholder="Search strawberry cakes, lettering, or a maker" />
      <span className="search-divider" />
      <button type="button" onClick={onAgentSearch}><Sparkles size={16} /> Describe what you need</button>
    </div>
  );
}

function StoreCard({ store, rank, candidate }: { store: Store; rank?: number; candidate?: SearchCandidate }) {
  return (
    <article className={rank === 1 ? "store-card best-card" : "store-card"}>
      <button className="card-image-button" type="button" onClick={() => selectStoreForHuman(store.id)} aria-label={`View ${store.name}`}>
        <CakeImage index={store.imageIndex} label={store.product.name} />
        <span className="favorite"><Heart size={17} /></span>
        {rank === 1 && <span className="best-label"><Sparkles size={13} /> Top pick</span>}
        {store.sameDay && !rank && <span className="availability-label">Same-day</span>}
      </button>
      <div className="card-body">
        <div className="card-title-row">
          <div>
            <h3>{store.name}</h3>
            <p>{store.description}</p>
          </div>
          <span className="rating"><Star size={13} fill="currentColor" /> {store.rating}</span>
        </div>
        {candidate && (
          <div className="match-reason">
            <CircleCheck size={15} />
            <span>{candidate.exactPickupTime ? `Exact ${formatTime(candidate.closestPickupTime)} pickup` : `Closest pickup ${formatTime(candidate.closestPickupTime)}`}</span>
          </div>
        )}
        <div className="card-meta">
          <span><MapPin size={14} /> {store.distanceKm} km</span>
          <span>From {formatKrw(store.priceRange[0])}</span>
        </div>
      </div>
    </article>
  );
}

function NonCakeCategory({ category }: { category: MarketplaceState["category"] }) {
  const item = categories.find((entry) => entry.id === category)!;
  return (
    <div className={`category-preview category-${category}`}>
      <div className="category-preview-copy">
        <p className="eyebrow"><Gift size={14} /> Curated local collection</p>
        <h3>{item.label} for every kind of occasion.</h3>
        <p>{item.description}. Browse thoughtful pieces from independent studios, with clear lead times and customization options.</p>
        <div className="sample-makers">
          {item.sampleShops.slice(0, 5).map((shop) => <span key={shop}>{shop}</span>)}
        </div>
        <button type="button" onClick={() => marketplaceStore.update({ category: "cakes" })}>Shop custom cakes <ArrowRight size={16} /></button>
      </div>
      <div className="category-art" aria-hidden="true">
        <span className="shape-one" />
        <span className="shape-two" />
        <span className="shape-three" />
        <Gift size={56} />
      </div>
    </div>
  );
}

function Marketplace({ state, onOpenAgent }: { state: MarketplaceState; onOpenAgent: () => void }) {
  const featured = cakeStores.slice(0, 8);
  const searchStores = state.searchResults
    .map((result) => ({ store: getStore(result.storeId), result }))
    .filter((item): item is { store: Store; result: SearchCandidate } => Boolean(item.store));
  const showingSearch = state.category === "cakes" && searchStores.length > 0;

  return (
    <section className="marketplace-section" id="marketplace">
      <div className="shell">
        <div className="marketplace-heading">
          <div>
            <p className="section-kicker">Handmade near Seongsu</p>
            <h2>{showingSearch ? "Picked for your occasion" : "Custom cakes, ready when you are"}</h2>
            <p className="section-subtitle">Compare designs, prices, and live pickup times from local bakeries.</p>
          </div>
          {showingSearch && <button className="reset-search" type="button" onClick={() => marketplaceStore.update({ searchResults: [], searchArgs: null })}><RotateCcw size={15} /> Clear recommendations</button>}
        </div>
        <SearchBar onAgentSearch={onOpenAgent} />
        <CategoryTabs active={state.category} onChange={(category) => marketplaceStore.update({ category, searchResults: [] })} />

        {state.category !== "cakes" ? (
          <NonCakeCategory category={state.category} />
        ) : (
          <>
            {showingSearch && (
              <div className="best-match-summary">
                <div className="summary-icon"><Sparkles size={19} /></div>
                <div>
                  <span>Recommended for you</span>
                  <strong>{state.searchResults[0].explanation}</strong>
                </div>
                <button type="button" onClick={() => selectStoreForHuman(state.searchResults[0].storeId)}>Customize <ArrowRight size={15} /></button>
              </div>
            )}
            <div className="store-grid">
              {(showingSearch ? searchStores : featured.map((store) => ({ store, result: undefined }))).map((item, index) => (
                <StoreCard key={item.store.id} store={item.store} rank={showingSearch ? index + 1 : undefined} candidate={item.result} />
              ))}
            </div>
            {!showingSearch && (
              <button className="show-more" type="button" onClick={() => marketplaceStore.update({ searchResults: cakeStores.slice(0, 12).map((store, index) => ({
                storeId: store.id, storeName: store.name, distanceKm: store.distanceKm, estimatedPriceKrw: store.product.basePrice,
                requestedPickupTime: "16:00", closestPickupTime: store.pickupSlots[0], exactPickupTime: store.pickupSlots.includes("16:00"),
                satisfiesAllProductRequirements: true, unmetRequirements: [], score: 100 - index,
                explanation: `${store.name} is available nearby.`,
              })) })}>Show more cakes <ChevronDown size={16} /></button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown size={15} />
    </label>
  );
}

function Configurator({ state, onClose, onOpenAgent }: { state: MarketplaceState; onClose: () => void; onOpenAgent: () => void }) {
  const store = state.selectedStoreId ? getStore(state.selectedStoreId) : undefined;
  const config = state.configuration;
  if (!state.configPanelOpen || !store || !config) return null;
  const previewIndex = imageIndexForColor(config.creamColor, store.imageIndex);
  const patch = (value: Record<string, unknown>) => configureForHuman({ storeId: store.id, ...value });

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close customization" />
      <aside className="config-drawer" role="dialog" aria-modal="true" aria-label={`Customize ${store.product.name}`}>
        <div className="drawer-header">
          <button className="icon-button" type="button" onClick={onClose} title="Close"><X size={20} /></button>
          <span>Build your cake</span>
          <button className="icon-button" type="button" title="Save favorite"><Heart size={19} /></button>
        </div>
        <div className="config-layout">
          <div className="config-preview">
            <CakeImage index={previewIndex} label={`${config.creamColor} ${store.product.name}`} />
            {config.lettering && <div className="cake-lettering">{config.lettering}</div>}
            <div className="preview-change"><Sparkles size={14} /> Preview updates with your choices</div>
          </div>
          <div className="config-form">
            <div className="maker-mini"><span>{store.name}</span><span><Star size={12} fill="currentColor" /> {store.rating} · {store.distanceKm} km</span></div>
            <h2>{store.product.name}</h2>
            <p>{store.description}. Every cake is finished to order in {store.neighborhood}.</p>
            <button className="assistant-nudge" type="button" onClick={onOpenAgent}><Sparkles size={16} /><span><strong>Not sure what to choose?</strong><small>Tell ChatGPT the occasion and budget.</small></span><ArrowRight size={16} /></button>
            <div className="form-grid">
              <SelectField label="Size" value={config.size} options={store.product.sizes} onChange={(size) => patch({ size })} />
              <SelectField label="Flavor" value={config.flavor} options={store.product.flavors} onChange={(flavor) => patch({ flavor })} />
              <SelectField label="Filling" value={config.filling} options={store.product.fillings} onChange={(filling) => patch({ filling })} />
              <SelectField label="Design" value={config.designStyle} options={store.product.designStyles} onChange={(designStyle) => patch({ designStyle })} />
            </div>
            <fieldset className="color-options">
              <legend>Cream color <span>{config.creamColor}</span></legend>
              <div>
                {store.product.creamColors.map((color) => (
                  <button
                    className={config.creamColor === color ? "color-choice active" : "color-choice"}
                    type="button"
                    key={color}
                    onClick={() => patch({ creamColor: color })}
                    aria-label={color}
                    title={color}
                  >
                    <span style={{ background: color === "White" ? "#fffdf8" : color === "Lavender" ? "#b9a4cf" : color === "Light pink" ? "#edb7bd" : "#f1d57a" }} />
                    {config.creamColor === color && <Check size={13} />}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="lettering-field">
              <span>Lettering <small>Up to 40 characters</small></span>
              <input value={config.lettering} maxLength={40} placeholder="Happy Birthday Mina" onChange={(event) => patch({ lettering: event.target.value })} />
              <em>{config.lettering.length}/40</em>
            </label>
            <div className="pickup-row">
              <label><span>Pickup date</span><input type="date" value={config.pickupDate} onChange={(event) => patch({ pickupDate: event.target.value })} /></label>
              <label><span>Pickup time</span><select value={config.pickupTime} onChange={(event) => patch({ pickupTime: event.target.value })}>{store.pickupSlots.map((slot) => <option value={slot} key={slot}>{formatTime(slot)}</option>)}</select></label>
            </div>
            {state.quote && (
              <div className="quote-breakdown">
                <div><span>Base cake</span><span>{formatKrw(state.quote.subtotalKrw)}</span></div>
                {state.quote.adjustments.map((adjustment) => <div key={adjustment.label}><span>{adjustment.label}</span><span>+{formatKrw(adjustment.amountKrw)}</span></div>)}
                <div className="quote-total"><span>Total</span><strong>{formatKrw(state.quote.totalKrw)}</strong></div>
              </div>
            )}
            <div className="config-cta">
              <div><small>{state.quote ? "Current total" : "Starting from"}</small><strong>{formatKrw(state.quote?.totalKrw || store.product.basePrice)}</strong></div>
              <button type="button" onClick={async () => {
                if (!state.quote) await invokeTool("get_quote", {});
                else await invokeTool("prepare_order", {});
              }}>{state.quote ? "Review order" : "Calculate total"} <ArrowRight size={17} /></button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ChatGptShopper({ state, open, onClose, supported }: { state: MarketplaceState; open: boolean; onClose: () => void; supported: boolean }) {
  const [prompt, setPrompt] = useState(DEMO_PROMPT);
  const [messages, setMessages] = useState<AgentMessage[]>([
    { role: "agent", text: "Tell me the occasion, date, budget, and any must-haves. I’ll compare nearby makers and prepare the best option for you." },
  ]);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<"start" | "searched" | "configured" | "corrected" | "quoted">("start");
  const [auditOpen, setAuditOpen] = useState(false);

  const addMessage = (message: AgentMessage) => setMessages((items) => [...items, message]);
  const runSearch = async () => {
    setRunning(true);
    addMessage({ role: "user", text: prompt });
    const result = await invokeTool("search_local_stores", {
      category: "cakes",
      maxDistanceKm: 3,
      maxBudgetKrw: 50000,
      pickupDate: todayToNextSaturday(),
      pickupTime: "16:00",
      servings: 4,
      ingredient: "Strawberry",
      creamColor: "White",
      letteringRequired: true,
    }) as { bestMatch?: SearchCandidate; exactMatches?: SearchCandidate[]; nearMatches?: SearchCandidate[] };
    addMessage({ role: "tool", tool: "search_local_stores", text: `${(result.exactMatches?.length || 0) + (result.nearMatches?.length || 0)} candidates compared across distance, price, options, and pickup inventory.` });
    addMessage({ role: "agent", text: result.bestMatch?.explanation || "I could not find an exact match." });
    setStage("searched");
    setRunning(false);
  };
  const configureBest = async () => {
    setRunning(true);
    addMessage({ role: "user", text: "Use the best one. Make the cream lavender and write “Happy Birthday Mina”." });
    await invokeTool("get_store_details", { storeId: "mellow-cake" });
    await invokeTool("check_availability", { storeId: "mellow-cake", productId: "mellow-cake-signature", pickupDate: todayToNextSaturday(), pickupTime: "16:00" });
    await invokeTool("configure_product", {
      storeId: "mellow-cake", productId: "mellow-cake-signature", servings: 4, flavor: "Vanilla", filling: "Fresh strawberry",
      creamColor: "Lavender", lettering: "Happy Birthday Mina", pickupDate: todayToNextSaturday(), pickupTime: "16:00",
    });
    addMessage({ role: "tool", tool: "configure_product", text: "Mellow Cake selected. The lavender preview, lettering, and 4 PM pickup are now live on the page." });
    setStage("configured");
    setRunning(false);
  };
  const correctColor = async () => {
    setRunning(true);
    addMessage({ role: "user", text: "Actually, make the cream light pink." });
    await invokeTool("configure_product", { storeId: "mellow-cake", creamColor: "Light pink" });
    addMessage({ role: "tool", tool: "configure_product", text: "Cream changed to light pink. Every other option was preserved." });
    setStage("corrected");
    setRunning(false);
  };
  const quoteAndPrepare = async () => {
    setRunning(true);
    const quoteResult = await invokeTool("get_quote", {}) as { quote?: { totalKrw: number } };
    await invokeTool("prepare_order", {});
    addMessage({ role: "tool", tool: "get_quote → prepare_order", text: `Itemized total: ${formatKrw(quoteResult.quote?.totalKrw || 0)}. A confirmation token is ready; no order has been created.` });
    addMessage({ role: "agent", text: `Your total is ${formatKrw(quoteResult.quote?.totalKrw || 0)}. Pickup is Saturday at 4:00 PM. Please review the summary and confirm to place the order.` });
    setStage("quoted");
    setRunning(false);
  };

  if (!open) return null;
  return (
    <div className="studio-layer">
      <button className="studio-backdrop" type="button" onClick={onClose} aria-label="Close ChatGPT shopping assistant" />
      <aside className="agent-studio" role="dialog" aria-modal="true" aria-label="Shop with ChatGPT">
        <div className="studio-header">
          <div className="studio-title"><span><Sparkles size={18} /></span><div><strong>Shop with ChatGPT</strong><small>Your Jipsa shopping assistant</small></div></div>
          <div className="connection-status"><span className={supported ? "status-dot live" : "status-dot"} />Catalog connected</div>
          <button className="icon-button" type="button" onClick={onClose} title="Close"><X size={20} /></button>
        </div>
        <div className="studio-context">
          <span>Shopping now</span>
          <strong>Custom cakes near Seongsu</strong>
          <small>{cakeStores.length} local makers · live prices and pickup slots</small>
        </div>
        <div className="message-list">
          {messages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
              {message.tool && <span className="tool-call"><CircleCheck size={12} /> Catalog checked</span>}
              <p>{message.text}</p>
            </div>
          ))}
          {state.searchResults.length > 0 && stage === "searched" && (
            <div className="agent-results">
              {state.searchResults.slice(0, 3).map((candidate, index) => (
                <div key={candidate.storeId} className={index === 0 ? "agent-result best" : "agent-result"}>
                  <span>{index + 1}</span><div><strong>{candidate.storeName}</strong><small>{candidate.distanceKm} km · {formatKrw(candidate.estimatedPriceKrw)} · {formatTime(candidate.closestPickupTime)}</small></div>{index === 0 && <em>Best</em>}
                </div>
              ))}
            </div>
          )}
          {running && <div className="thinking"><span /><span /><span /></div>}
        </div>
        <div className="studio-actions">
          {stage === "start" && <button type="button" disabled={running} onClick={runSearch}><Search size={16} /> Find matching cakes</button>}
          {stage === "searched" && <button type="button" disabled={running} onClick={configureBest}><Sparkles size={16} /> Customize the top pick</button>}
          {stage === "configured" && <button type="button" disabled={running} onClick={correctColor}><SlidersHorizontal size={16} /> Change to light pink</button>}
          {stage === "corrected" && <button type="button" disabled={running} onClick={quoteAndPrepare}><ClipboardCheck size={16} /> Review price & pickup</button>}
          {stage === "quoted" && <span className="confirmation-hint"><CircleCheck size={16} /> Ready for your final review</span>}
        </div>
        <div className="studio-composer">
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Agent request" rows={3} />
          <button type="button" onClick={stage === "start" ? runSearch : undefined} disabled={running || stage !== "start"} title="Send request"><ArrowRight size={18} /></button>
        </div>
        <button className="audit-toggle" type="button" onClick={() => setAuditOpen((value) => !value)}><TerminalSquare size={15} /> Technical details <span>{state.logs.length}</span><ChevronDown size={14} /></button>
        {auditOpen && <AuditLog state={state} />}
      </aside>
    </div>
  );
}

function AuditLog({ state }: { state: MarketplaceState }) {
  return (
    <div className="audit-log">
      <div className="audit-log-head"><span>Latest tool activity</span><button type="button" onClick={() => marketplaceStore.clearLogs()}>Clear</button></div>
      {state.logs.length === 0 ? <p>No tool calls yet.</p> : state.logs.slice(0, 12).map((log) => (
        <details key={log.id}>
          <summary><span className={log.error ? "log-dot error" : "log-dot"} /><code>{log.toolName}</code><time>{new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}</time></summary>
          <pre>{JSON.stringify({ input: log.input, result: log.result, error: log.error, stateChange: log.stateChange }, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}

function ConfirmationDialog({ state }: { state: MarketplaceState }) {
  const [placing, setPlacing] = useState(false);
  const [placedId, setPlacedId] = useState<string | null>(null);
  if (!state.confirmationOpen && !placedId) return null;
  if (placedId) {
    return (
      <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Order confirmed">
        <div className="modal-card success-card">
          <div className="success-icon"><PackageCheck size={30} /></div>
          <p className="eyebrow">Order confirmed</p>
          <h2>Your cake is in good hands.</h2>
          <p>Mellow Cake has received order <strong>{placedId}</strong>. You can find the confirmation in Your orders.</p>
          <small className="prototype-note">Prototype checkout — no payment was processed.</small>
          <button type="button" onClick={() => setPlacedId(null)}>Continue browsing</button>
        </div>
      </div>
    );
  }
  const prepared = state.preparedOrder;
  if (!prepared) return null;
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Confirm order">
      <div className="modal-card confirm-card">
        <div className="modal-head"><div><p className="eyebrow">Final confirmation</p><h2>Review before placing</h2></div><button className="icon-button" type="button" onClick={() => marketplaceStore.update({ confirmationOpen: false })} title="Close"><X size={20} /></button></div>
        <div className="order-summary"><CakeImage index={imageIndexForColor(state.configuration?.creamColor || "White", 0)} label="Configured cake" /><div><strong>Mellow Cake</strong><p>{prepared.summary}</p></div></div>
        <div className="confirmation-total"><span>Total</span><strong>{formatKrw(prepared.totalKrw)}</strong></div>
        <div className="confirmation-note"><CircleCheck size={17} /><p>Nothing is submitted until you press the button below. This prototype does not process a payment.</p></div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => marketplaceStore.update({ confirmationOpen: false })}>Keep editing</button><button type="button" className="confirm-button" disabled={placing} onClick={async () => {
          setPlacing(true);
          const result = await invokeTool("place_order", { confirmationToken: prepared.confirmationToken, confirmed: true }) as { order?: { id: string } };
          setPlacing(false);
          if (result.order?.id) setPlacedId(result.order.id);
        }}>{placing ? "Placing…" : "Confirm & place order"} <ArrowRight size={17} /></button></div>
      </div>
    </div>
  );
}

function OrdersPanel({ state, open, onClose }: { state: MarketplaceState; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="drawer-layer"><button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close orders" /><aside className="orders-panel" role="dialog" aria-label="Orders">
      <div className="drawer-header"><button className="icon-button" type="button" onClick={onClose} title="Close"><ArrowLeft size={20} /></button><span>Your orders</span><span /></div>
      <div className="orders-content">
        <ShoppingBag size={26} />
        <h2>Your orders</h2>
        <p>Confirmed orders and pickup details will appear here. Prototype orders are saved on this device.</p>
        {state.orders.length === 0 ? <div className="empty-orders">No orders yet. Choose a cake or let ChatGPT help you find one.</div> : state.orders.map((order) => <div className="order-row" key={order.id}><CircleCheck size={18} /><div><strong>{order.storeName}</strong><span>{order.id} · {order.status}</span></div><em>{formatKrw(order.quote.totalKrw)}</em></div>)}
      </div>
    </aside></div>
  );
}

function HowJipsaWorks({ onOpenAgent }: { onOpenAgent: () => void }) {
  return (
    <section className="story-section" id="how-it-works">
      <div className="shell story-grid">
        <div className="story-copy">
          <p className="section-kicker">Less back-and-forth</p>
          <h2>Your custom order,<br />sorted in minutes.</h2>
          <p>Every option, price, and pickup slot is clear before you place the order. Prefer to skip the browsing? ChatGPT can compare the same catalog for you.</p>
          <button type="button" onClick={onOpenAgent}>Try shopping with ChatGPT <ArrowRight size={16} /></button>
        </div>
        <div className="story-flow">
          <div className="flow-column human-flow"><span>Shop your way</span><div><StoreIcon size={18} /><strong>Discover local favorites</strong><small>Browse designs from independent makers</small></div><div><SlidersHorizontal size={18} /><strong>Personalize every detail</strong><small>Size, flavor, color, lettering, and date</small></div></div>
          <div className="flow-bridge"><span /><Sparkles size={22} /><span /></div>
          <div className="flow-column agent-flow"><span>Or ask ChatGPT</span><div><Search size={18} /><strong>Compare the whole catalog</strong><small>One request checks prices, options, and distance</small></div><div><ClipboardCheck size={18} /><strong>You approve the final order</strong><small>Review the exact total before anything is placed</small></div></div>
        </div>
      </div>
    </section>
  );
}

function BroaderCategories() {
  return (
    <section className="broader-section" id="categories">
      <div className="shell">
        <p className="section-kicker">For every thoughtful gesture</p>
        <div className="broader-heading"><h2>More ways to make it personal.</h2><p>Shop custom flowers, gifts, and desserts from small studios around your neighborhood.</p></div>
        <div className="broader-grid">
          {categories.map((category, index) => <button type="button" key={category.id} onClick={() => { marketplaceStore.update({ category: category.id, searchResults: [] }); document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" }); }}><span>0{index + 1}</span><strong>{category.label}</strong><p>{category.description}</p><ArrowRight size={17} /></button>)}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer><div className="shell footer-inner"><div className="footer-brand"><Logo /><p>Custom goods from the best makers near you.</p></div><div className="footer-links"><div><strong>Shop</strong><a href="#marketplace">Custom cakes</a><a href="#categories">Flowers & gifts</a></div><div><strong>Help</strong><a href="#how-it-works">How it works</a><button type="button">Pickup guide</button></div><div><strong>Jipsa</strong><button type="button">Partner with us</button><a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noreferrer">Built with WebMCP</a></div></div><small className="demo-disclosure">© 2026 Jipsa · Seoul, Korea · Made with local makers</small></div></footer>
  );
}

export default function App() {
  const state = useMarketplace();
  const [agentOpen, setAgentOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [webMcpStatus, setWebMcpStatus] = useState({ supported: false, registered: 0 });

  useEffect(() => {
    registerWebMcpTools().then(setWebMcpStatus).catch(() => setWebMcpStatus({ supported: false, registered: 0 }));
  }, []);

  return (
    <>
      <Header onOpenAgent={() => setAgentOpen(true)} onOpenOrders={() => setOrdersOpen(true)} />
      <main>
        <Hero onOpenAgent={() => setAgentOpen(true)} />
        <Marketplace state={state} onOpenAgent={() => setAgentOpen(true)} />
        <HowJipsaWorks onOpenAgent={() => setAgentOpen(true)} />
        <BroaderCategories />
      </main>
      <Footer />
      <Configurator state={state} onClose={() => marketplaceStore.update({ configPanelOpen: false })} onOpenAgent={() => setAgentOpen(true)} />
      <ChatGptShopper state={state} open={agentOpen} onClose={() => setAgentOpen(false)} supported={webMcpStatus.supported} />
      <ConfirmationDialog state={state} />
      <OrdersPanel state={state} open={ordersOpen} onClose={() => setOrdersOpen(false)} />
    </>
  );
}
