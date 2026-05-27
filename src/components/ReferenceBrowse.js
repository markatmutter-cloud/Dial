import React, { useEffect, useState, useCallback } from "react";
import { ReferencePage } from "./ReferencePage";
import { Breadcrumb } from "./Breadcrumb";
import {
  buildReferenceTree,
  REFERENCE_NODES_BY_ID,
  isLiveNode,
} from "../data/referencePages";

// Reference browse surface (Collecting ▸ References). The navigable spine over
// the reference nodes: References landing → Brand → Model line → Reference leaf,
// with breadcrumbs. Self-contained nav (its own URL params: ref / rbrand /
// rmodel) so it adds NO hooks to App.js's top level (React #310 safety). Live
// nodes open the full ReferencePage; coming_soon stubs open a teaser with a
// "subscribe to unlock" demand smoke test. See docs/REFERENCE_STRUCTURE_PLAN.md.

const MY_PARAMS = ["ref", "rbrand", "rmodel"];

const listGrid = { display: "flex", flexDirection: "column", gap: 8 };
const tileGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 10,
};
const purpose = {
  fontSize: 13,
  color: "var(--text2)",
  lineHeight: 1.5,
  margin: "0 0 16px",
};
const comingBadge = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: "var(--text3)",
  border: "0.5px solid var(--border)",
  borderRadius: 999,
  padding: "1px 7px",
};

function viewFromSearch(search) {
  const p = new URLSearchParams(search || "");
  const ref = p.get("ref");
  if (ref) return { level: "node", nodeId: ref };
  const brand = p.get("rbrand");
  const modelLine = p.get("rmodel");
  if (brand && modelLine) return { level: "model", brand, modelLine };
  if (brand) return { level: "brand", brand };
  return { level: "home" };
}

// Build a URL from the CURRENT location, replacing only MY_PARAMS — preserves
// the app's ?tab=/?sub= params so the References sub-tab stays selected.
function urlForView(view) {
  const p = new URLSearchParams(window.location.search);
  MY_PARAMS.forEach((k) => p.delete(k));
  if (view.level === "node") p.set("ref", view.nodeId);
  else if (view.level === "model") {
    p.set("rbrand", view.brand);
    p.set("rmodel", view.modelLine);
  } else if (view.level === "brand") {
    p.set("rbrand", view.brand);
  }
  const qs = p.toString();
  return qs ? "?" + qs : window.location.pathname;
}

export function ReferenceBrowse(props) {
  const { isMobile } = props;
  const [view, setView] = useState(() =>
    viewFromSearch(window.location.search)
  );

  useEffect(() => {
    const onPop = () => setView(viewFromSearch(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Drill-in pushes (browser-back walks the tree); see CLAUDE.md nav rules.
  const go = useCallback((next) => {
    window.history.pushState({}, "", urlForView(next));
    setView(next);
  }, []);

  const tree = buildReferenceTree();

  // ── Reference leaf ──────────────────────────────────────────────
  if (view.level === "node") {
    const node = REFERENCE_NODES_BY_ID[view.nodeId];
    if (!node) return <NotFound onHome={() => go({ level: "home" })} />;
    const crumbs = [
      { label: "References", onClick: () => go({ level: "home" }) },
      {
        label: node.brand,
        onClick: () => go({ level: "brand", brand: node.brand }),
      },
      {
        label: node.modelLine,
        onClick: () =>
          go({ level: "model", brand: node.brand, modelLine: node.modelLine }),
      },
      { label: node.group || (node.refs || []).join(" / ") },
    ];
    return (
      <div style={{ paddingTop: 4 }}>
        <Breadcrumb items={crumbs} />
        {isLiveNode(node) ? (
          <ReferencePage
            node={node}
            items={props.items || []}
            isMobile={isMobile}
            watchlist={props.watchlist}
            handleWish={props.handleWish}
            openCollectionPicker={props.openCollectionPicker}
            handleShare={props.handleShare}
            hidden={props.hidden}
            primaryCurrency={props.primaryCurrency}
            compact={props.compact}
            user={props.user}
            onClickListing={props.onClickListing}
            onViewAll={props.onViewAll}
          />
        ) : (
          <ComingSoon node={node} />
        )}
      </div>
    );
  }

  // ── Model-line page ─────────────────────────────────────────────
  if (view.level === "model") {
    const brandEntry = tree.find((b) => b.brand === view.brand);
    const lineEntry =
      brandEntry &&
      brandEntry.modelLines.find((l) => l.modelLine === view.modelLine);
    const nodes = (lineEntry && lineEntry.nodes) || [];
    return (
      <div style={{ paddingTop: 4 }}>
        <Breadcrumb
          items={[
            { label: "References", onClick: () => go({ level: "home" }) },
            {
              label: view.brand,
              onClick: () => go({ level: "brand", brand: view.brand }),
            },
            { label: view.modelLine },
          ]}
        />
        <H1>
          {view.brand} {view.modelLine}
        </H1>
        <div style={listGrid}>
          {nodes.map((n) => (
            <ReferenceCard
              key={n.id}
              node={n}
              onClick={() => go({ level: "node", nodeId: n.id })}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Brand page ──────────────────────────────────────────────────
  if (view.level === "brand") {
    const brandEntry = tree.find((b) => b.brand === view.brand);
    const lines = (brandEntry && brandEntry.modelLines) || [];
    return (
      <div style={{ paddingTop: 4 }}>
        <Breadcrumb
          items={[
            { label: "References", onClick: () => go({ level: "home" }) },
            { label: view.brand },
          ]}
        />
        <H1>{view.brand}</H1>
        <div style={listGrid}>
          {lines.map((l) => (
            <RowCard
              key={l.modelLine}
              title={l.modelLine}
              meta={`${l.nodes.length} reference${
                l.nodes.length === 1 ? "" : "s"
              }`}
              onClick={() =>
                go({
                  level: "model",
                  brand: view.brand,
                  modelLine: l.modelLine,
                })
              }
            />
          ))}
        </div>
      </div>
    );
  }

  // ── References landing (home) ───────────────────────────────────
  return (
    <div style={{ paddingTop: 4 }}>
      <Breadcrumb items={[{ label: "References" }]} />
      <H1>References</H1>
      <p style={purpose}>
        Deep-dive guides to individual watch references — what they are, how to
        look at them, and the market around them. Start with a brand.
      </p>
      <div style={tileGrid}>
        {tree.map((b) => {
          const refCount = b.modelLines.reduce((a, l) => a + l.nodes.length, 0);
          return (
            <BrandTile
              key={b.brand}
              brand={b.brand}
              meta={`${b.modelLines.length} model line${
                b.modelLines.length === 1 ? "" : "s"
              } · ${refCount} reference${refCount === 1 ? "" : "s"}`}
              onClick={() => go({ level: "brand", brand: b.brand })}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Presentational helpers ────────────────────────────────────────
function H1({ children }) {
  return (
    <h1
      style={{
        fontSize: 20,
        fontWeight: 600,
        color: "var(--text1)",
        margin: "0 0 10px",
      }}
    >
      {children}
    </h1>
  );
}

function BrandTile({ brand, meta, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        background: "transparent",
        border: "0.5px solid var(--border)",
        borderRadius: 10,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text1)" }}>
        {brand}
      </span>
      <span style={{ fontSize: 12, color: "var(--text3)" }}>{meta}</span>
      <span style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
        Browse →
      </span>
    </button>
  );
}

function RowCard({ title, meta, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        background: "transparent",
        border: "0.5px solid var(--border)",
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)" }}>
        {title}
      </span>
      <span style={{ fontSize: 12, color: "var(--text3)" }}>{meta} ›</span>
    </button>
  );
}

function ReferenceCard({ node, onClick }) {
  const coming = !isLiveNode(node);
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        background: "transparent",
        border: "0.5px solid var(--border)",
        borderRadius: 10,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text1)" }}>
          {node.group || (node.refs || []).join(" / ")}
        </span>
        {coming && <span style={comingBadge}>Coming soon</span>}
      </span>
      {node.definer && (
        <span style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4 }}>
          {node.definer}
        </span>
      )}
    </button>
  );
}

function ComingSoon({ node }) {
  // Demand smoke test. MVP records interest in local state only; persisting it
  // (a small reference_interest table) is the immediate follow-up.
  const [noted, setNoted] = useState(false);
  return (
    <div style={{ maxWidth: 560 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text1)",
          margin: "0 0 4px",
        }}
      >
        {node.brand} {node.modelLine}
      </h1>
      <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 12 }}>
        {node.group || (node.refs || []).join(" / ")}
        {node.definer ? ` · ${node.definer}` : ""}
      </div>
      {node.teaser && (
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>
          {node.teaser}
        </p>
      )}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: "0.5px dashed var(--border)",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text1)",
            marginBottom: 6,
          }}
        >
          Full guide coming soon
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
          Want this reference guide unlocked sooner? Let us know you're
          interested.
        </div>
        {noted ? (
          <div style={{ fontSize: 13, color: "var(--text1)", fontWeight: 600 }}>
            ✓ Thanks — we'll let you know when it's live.
          </div>
        ) : (
          <button
            onClick={() => setNoted(true)}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "var(--brand-olive, #4a5240)",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
            }}
          >
            Subscribe to unlock
          </button>
        )}
      </div>
    </div>
  );
}

function NotFound({ onHome }) {
  return (
    <div style={{ paddingTop: 4 }}>
      <p style={{ fontSize: 14, color: "var(--text2)" }}>
        That reference isn't available.
      </p>
      <button
        onClick={onHome}
        style={{
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
          color: "var(--text2)",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        ← Back to references
      </button>
    </div>
  );
}
