// One incentive program card, shared by the category grids and the utility grid
// on /rebates-incentives.
//
// This markup used to be written out twice on that page. Inline editing has to
// behave identically in both places — an editor should not find that the utility
// cards silently discard their text — so the two copies are now one component.
//
// A card in edit mode writes into the page draft at `fields.<key>.<column>`,
// where <key> identifies the program's bucket and its CURRENT name. See
// lib/incentive-edit.ts for why the name is load-bearing.

import { ExternalLink } from "lucide-react";
import ShareGate from "@/components/forms/ShareGate";
import EditableText from "@/components/inline/EditableText";
import { useInlineEdit } from "@/components/inline/edit-context";
import { incentiveKey, locateIncentive } from "@/lib/incentive-edit";
import type { Incentive } from "@/data/incentives";
import { INCENTIVES_DISCLAIMER } from "@/lib/disclaimers";

/** Pending per-card edits from the page editor's draft, keyed by incentiveKey. */
export type IncentiveEdits = Record<string, Record<string, string>>;

const IncentiveCard = ({ item, edits }: { item: Incentive; edits?: IncentiveEdits }) => {
  const ctx = useInlineEdit();
  const target = locateIncentive(item);
  // No key means the program is not in a bucket we can write back to (it was
  // built on the fly, or the curated set moved). It stays read-only rather than
  // offering an edit that would go nowhere — the failure that bit the external
  // feed events, where typing looked like it worked and the text was dropped.
  const key = target ? incentiveKey(target) : "";
  const editing = !!ctx?.editing && key !== "";
  const pending = (key && edits?.[key]) || {};
  const v = (col: string, fallback: string) => pending[col] ?? fallback;

  const name = v("name", item.name);
  const jurisdiction = v("jurisdiction", item.jurisdiction);
  const amount = v("amount", item.amount ?? "");
  const desc = v("description", item.desc);
  const link = v("link", item.link);

  const shareMeta = [jurisdiction, amount].filter(Boolean).join(" · ");

  return (
    <article className="rounded-2xl border border-border bg-card shadow-card p-5 flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all">
      <div className="mb-1">
        <h3 className="font-bold font-display text-foreground leading-snug">
          {editing ? <EditableText path={`fields.${key}.name`}>{name}</EditableText> : name}
        </h3>
        <p className="text-xs text-muted-foreground">
          — {editing ? <EditableText path={`fields.${key}.jurisdiction`}>{jurisdiction}</EditableText> : jurisdiction}
        </p>
      </div>

      {/* In edit mode the amount row is always present, so an amount can be
          ADDED to a program that has none. A visitor still only sees it when
          there is something to show. */}
      {(editing || amount || item.income || item.used) && (
        <div className="flex flex-wrap items-center gap-2 mt-2 mb-1">
          {editing ? (
            <span className={amount ? "text-lg font-bold text-gradient-primary" : "text-lg font-bold text-muted-foreground"}>
              <EditableText
                path={`fields.${key}.amount`}
                // An empty contentEditable collapses to nothing and cannot be
                // clicked, so a blank amount gets a visible target instead.
                className={amount ? undefined : "inline-block min-w-[7rem] rounded border border-dashed border-primary/50"}
              >
                {amount}
              </EditableText>
            </span>
          ) : (
            amount && <span className="text-lg font-bold text-gradient-primary">{amount}</span>
          )}
          {item.income && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
              Income Requirement
            </span>
          )}
          {item.used && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Used Car Eligible
            </span>
          )}
        </div>
      )}

      <hr className="border-border/70 my-3" />
      {/* A div, not a p: the description editor is a block element (so Enter
          starts a new line instead of committing), and a div inside a p makes
          the browser close the paragraph early and wreck the card. */}
      <div className="text-sm text-muted-foreground leading-relaxed flex-1">
        {editing ? <EditableText path={`fields.${key}.description`} as="div">{desc}</EditableText> : desc}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
        >
          Learn More and Apply Here <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <ShareGate
          url="/rebates-incentives"
          title={name}
          summary={shareMeta}
          description={desc}
          image="/og/incentives.jpg"
          meta={shareMeta}
          formType="incentive-share"
          variant="label"
          label="Share"
          disclaimer={INCENTIVES_DISCLAIMER}
        />
      </div>

      {/* The card shows a fixed label, never the URL, so the destination is only
          reachable while editing. Program URLs go stale often enough to be worth
          fixing here rather than only in the CMS. */}
      {editing && (
        <p className="mt-2 text-[11px] text-muted-foreground break-all">
          <span className="font-semibold">Link: </span>
          <EditableText path={`fields.${key}.link`} className="underline decoration-dotted">{link}</EditableText>
        </p>
      )}
    </article>
  );
};

export default IncentiveCard;
