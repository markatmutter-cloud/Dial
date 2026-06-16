import React from "react";
import LumeLead from "./LumeLead";
import LumeModule from "./LumeModule";

// LumeHome — the guided session: a light personal line, ONE "Start here" lead
// hero (with visible evidence), then curated supporting shelves (Worth your
// attention / Useful comps / Rabbit holes). Not a greeting over equal tiles.
// The canvas builds the lead + shelf configs (items, framing, renderers, CTAs).
export default function LumeHome({ greeting, lead, shelves = [], onLeadPrimary, onLeadSecondary, onOpenItem, isMobile }) {
  const { hello = "" } = greeting || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 28 : 38 }}>
      {hello && <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text2)" }}>{hello}</div>}

      <LumeLead lead={lead} onPrimary={onLeadPrimary} onSecondary={onLeadSecondary} onOpenItem={onOpenItem} isMobile={isMobile} />

      {shelves.map((s) => (
        <LumeModule
          key={s.key}
          eyebrow={s.eyebrow}
          heading={s.heading}
          dek={s.dek}
          count={s.count}
          items={s.items}
          renderCard={s.renderCard}
          ctaLabel={s.ctaLabel}
          onCta={s.onCta}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}
