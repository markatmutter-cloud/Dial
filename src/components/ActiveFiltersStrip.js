import React from "react";
import { dismissChip, dismissChipX, clearAllPill } from "../styles";

// Single horizontal strip of × chips representing every active
// filter, plus a trailing "Clear all" pill (Mark feedback
// 2026-05-19 item 4: "list the filters selected with little 'x'
// next to the filter chip and an easier to find clear all
// including finding a way to get this done for search bar as
// well. cohesive design for all tabs/places where there is a
// filter capability").
//
// Each chip removes its own filter when ×'d. Clear-all clears
// every filter (including search). Returns null when no filter
// is active so the strip doesn't reserve vertical space.
//
// Mounted from `listingsGridJSX` (just above the card grid) and
// `watchlistTabJSX_inner` so it appears on every sub-tab inside
// Listings + Saved. Editorial owns its own filter state and gets
// the strip too, threaded through `editorialFilterStripProps`.

// 2026-05-28 design-library pass: these now reference the shared olive
// helpers (was a blue-tint chip + grey clear-all, and a dead
// --brand-tint-25 border ref). Single source of truth in styles.js.
const chipStyle = dismissChip;
const xButtonStyle = dismissChipX;
const clearAllStyle = clearAllPill;

function FilterChip({ label, onRemove }) {
  return (
    <span style={chipStyle}>
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        style={xButtonStyle}
      >×</button>
    </span>
  );
}

export function ActiveFiltersStrip({
  // Multi-selects
  filterSources = [], toggleSource,
  filterBrands  = [], toggleBrand,
  filterModels  = [], toggleModel,
  filterRefs    = [], toggleFilterRef,
  // Search
  search = "", setSearch,
  // Recency
  newDays = 0, setNewDays,
  // Price
  minPriceText = "", setMinPriceText,
  maxPriceText = "", setMaxPriceText,
  // Heart-only
  filterHearted = false, setFilterHearted,
  // Reset-all
  resetFilters,
}) {
  const hasAny = (
    filterSources.length > 0
    || filterBrands.length > 0
    || filterModels.length > 0
    || filterRefs.length > 0
    || !!search
    || newDays > 0
    || !!minPriceText
    || !!maxPriceText
    || filterHearted
  );
  if (!hasAny) return null;

  // Recency-bucket label dictionary mirrors NEW_OPTS in App.js
  // (Today / 3 days / This week). Anything else falls back to "Last
  // N days" so the chip is still removable.
  const recencyLabel = newDays === 1 ? "Today"
    : newDays === 3 ? "Last 3 days"
    : newDays === 7 ? "This week"
    : newDays > 0 ? `Last ${newDays} days`
    : null;

  // Price chip — single chip "$min – $max" so we don't crowd the
  // strip with two when both are set.
  let priceLabel = null;
  if (minPriceText || maxPriceText) {
    const lo = minPriceText ? `$${minPriceText}` : "any";
    const hi = maxPriceText ? `$${maxPriceText}` : "any";
    priceLabel = `${lo} – ${hi}`;
  }
  const removePriceRange = () => {
    if (setMinPriceText) setMinPriceText("");
    if (setMaxPriceText) setMaxPriceText("");
  };

  return (
    <div style={{
      // Tinted band same as the editorial filter row — visually
      // anchors this as part of the filter system, separate from the
      // card grid below.
      display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
      padding: "8px 0 10px",
      // No background of its own — sits inline above the grid.
    }}>
      {filterSources.map(s => (
        <FilterChip key={`src-${s}`} label={s} onRemove={() => toggleSource && toggleSource(s)} />
      ))}
      {filterBrands.map(b => (
        <FilterChip key={`brand-${b}`} label={b} onRemove={() => toggleBrand && toggleBrand(b)} />
      ))}
      {filterModels.map(m => (
        <FilterChip key={`model-${m}`} label={m} onRemove={() => toggleModel && toggleModel(m)} />
      ))}
      {filterRefs.map(r => (
        <FilterChip key={`ref-${r}`} label={`Ref ${r}`} onRemove={() => toggleFilterRef && toggleFilterRef(r)} />
      ))}
      {!!search && (
        <FilterChip
          label={`"${search}"`}
          onRemove={() => setSearch && setSearch("")}
        />
      )}
      {recencyLabel && (
        <FilterChip
          label={recencyLabel}
          onRemove={() => setNewDays && setNewDays(0)}
        />
      )}
      {priceLabel && (
        <FilterChip label={priceLabel} onRemove={removePriceRange} />
      )}
      {filterHearted && (
        <FilterChip
          label="Saved only"
          onRemove={() => setFilterHearted && setFilterHearted(false)}
        />
      )}
      <button type="button" onClick={resetFilters} style={clearAllStyle}>
        Clear all
      </button>
    </div>
  );
}
