// Form submissions — every enquiry, signup, application and share the site has
// received, and the full detail of any one of them.
//
// READ-ONLY BY DESIGN. The website writes these through api/_submissions.ts when
// a form is submitted; nothing here writes. That is why this is a purpose-built
// screen rather than a CollectionConfig: CollectionManager is a CRUD editor and
// would bring insert/update/delete affordances to a table of other people's
// personal data.
//
// GoHighLevel remains the CRM — the place a person is worked as a lead. This is
// the record of the EVENT: on this day, from this page, this is what they typed.

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox, Loader2, AlertCircle, X, Search, Mail, Phone, MapPin, Globe,
  Building2, MessageSquare, ExternalLink, Copy, Check, CloudOff,
} from "lucide-react";
import { listSubmissions, getSubmission, type SubmissionRow } from "@/lib/admin-api";
import PageHeader from "@/components/admin/PageHeader";

const PAGE = 50;

/** Friendly names for the formType values api/lead.ts sends. Anything not
 *  listed falls back to the raw key, so a new form shows up rather than
 *  disappearing behind a blank label. */
const TYPE_LABEL: Record<string, string> = {
  "homepage-contact": "Homepage contact",
  "contact-us": "Contact us",
  "newsletter": "Newsletter",
  "list-event": "Event submission",
  "post-job": "Job posting",
  "event-alerts": "Event alerts",
  "career-alerts": "Career alerts",
  "job-apply": "Job application",
  "evan-chat": "EVan chat",
  "calculator-share": "Calculator share",
  "calculator-unlock": "Calculator unlock",
  "photo-share": "Photo share",
  "article-share": "Article share",
  "incentive-share": "Incentive share",
  "event-share": "Event share",
  "event-register": "Event registration",
  "event-calendar": "Add to calendar",
  "job-share": "Job share",
  "charger-share": "Charger share",
};
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t;

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const personOf = (r: SubmissionRow) =>
  [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || r.email || r.phone || "Anonymous";

const SubmissionsManager = () => {
  const [formType, setFormType] = useState("");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-submissions", formType, term, page],
    queryFn: () => listSubmissions({ formType, q: term, limit: PAGE, offset: page * PAGE }),
    retry: false,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const counts = data?.counts ?? {};
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const types = useMemo(
    () => Object.entries(counts).sort((a, b) => b[1] - a[1]),
    [counts],
  );

  const search = (e: React.FormEvent) => { e.preventDefault(); setTerm(q.trim()); setPage(0); };
  const pick = (t: string) => { setFormType(t); setPage(0); };

  return (
    <div className="max-w-5xl">
      <PageHeader
        icon={Inbox}
        title="Submissions"
        count={total || undefined}
        subtitle="Every form the site has received. Read-only — GoHighLevel remains the CRM; this is the record of what was actually sent."
      />

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error instanceof Error ? error.message : "Couldn't load submissions right now — try refreshing in a moment."}</span>
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form onSubmit={search} className="relative flex-1 min-w-[14rem]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, company or message…"
            aria-label="Search submissions"
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm"
          />
        </form>
        {term && (
          <button type="button" onClick={() => { setQ(""); setTerm(""); setPage(0); }}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1">
            Clear search
          </button>
        )}
      </div>

      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button type="button" onClick={() => pick("")}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
              formType === "" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
            All <span className="tabular-nums opacity-70">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
          </button>
          {types.map(([t, n]) => (
            <button key={t} type="button" onClick={() => pick(t)}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                formType === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
              {typeLabel(t)} <span className="tabular-nums opacity-70">{n}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Inbox className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground mb-1">
            {term || formType ? "Nothing matches that filter." : "No submissions recorded yet."}
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {term || formType
              ? "Try a different search, or clear the filters."
              : "Submissions are stored from the moment this feature went live — anything sent before that lives only in GoHighLevel."}
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => setOpenId(r.id)}
                className="w-full text-left flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground truncate">{personOf(r)}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                      {typeLabel(r.form_type)}
                    </span>
                    {r.crm_delivery === "failed" && (
                      <span className="text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 bg-destructive/10 text-destructive inline-flex items-center gap-1">
                        <CloudOff className="w-3 h-3" /> not in CRM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {[r.email, r.company, r.subject || r.message].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0" title={new Date(r.created_at).toLocaleString()}>
                  {timeAgo(r.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-5 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
          <span className="text-muted-foreground tabular-nums">Page {page + 1} of {pages}</span>
          <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
        </div>
      )}

      {openId && <DetailDrawer id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
};

/* ── detail ─────────────────────────────────────────────────────────────── */

const Field = ({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value?: string | null }) =>
  value ? (
    <div className="flex gap-3 py-2 border-b border-border/70 last:border-0">
      <span className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">{label}</span>
      <span className="text-sm text-foreground break-words min-w-0 flex items-start gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />}
        <span className="whitespace-pre-wrap">{value}</span>
      </span>
    </div>
  ) : null;

const DetailDrawer = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const { data: row, isLoading, error } = useQuery({
    queryKey: ["admin-submission", id],
    queryFn: () => getSubmission(id),
    retry: false,
  });

  const copyEmail = () => {
    if (!row?.email) return;
    navigator.clipboard.writeText(row.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => { /* clipboard blocked — not worth an error state */ });
  };

  const extras = Object.entries(row?.payload ?? {});

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl h-full surface border-l border-border shadow-elevated flex flex-col"
        onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Submission detail">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-hero grid place-items-center text-white shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold font-display text-foreground truncate leading-tight">
              {row ? (row.form_label || typeLabel(row.form_type)) : "Submission"}
            </h2>
            {row && <p className="text-[11px] text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>}
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-lg text-muted-foreground hover:bg-muted" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : error || !row ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error instanceof Error ? error.message : "Couldn't load this submission."}</span>
            </div>
          ) : (
            <>
              {row.crm_delivery === "failed" && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 text-destructive px-4 py-3 text-sm mb-4 flex items-start gap-2">
                  <CloudOff className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>This one never reached GoHighLevel — the CRM upsert failed. Follow it up by hand.</span>
                </div>
              )}

              <section className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Who</h3>
                <Field label="Name" value={[row.first_name, row.last_name].filter(Boolean).join(" ")} />
                <Field icon={Mail} label="Email" value={row.email} />
                <Field icon={Phone} label="Phone" value={row.phone} />
                <Field icon={Building2} label="Company" value={row.company} />
                <Field icon={MapPin} label="Location" value={[row.city, row.zip].filter(Boolean).join(" ")} />
              </section>

              {(row.subject || row.message) && (
                <section className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">What they said</h3>
                  <Field icon={MessageSquare} label="Subject" value={row.subject} />
                  <Field label="Message" value={row.message} />
                </section>
              )}

              {extras.length > 0 && (
                <section className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Form details</h3>
                  {extras.map(([k, v]) => (
                    <Field key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} value={v} />
                  ))}
                </section>
              )}

              <section className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Where it came from</h3>
                <Field icon={Globe} label="Page" value={row.page_path} />
                <Field label="Referrer" value={row.referrer} />
                <Field icon={MapPin} label="Approx. location" value={[row.geo_city, row.geo_region, row.geo_country].filter(Boolean).join(", ")} />
                <Field label="IP" value={row.ip} />
                <Field label="Browser" value={row.user_agent} />
              </section>

              <div className="flex flex-wrap gap-2">
                {row.email && (
                  <>
                    <a href={`mailto:${row.email}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted">
                      <Mail className="w-4 h-4" /> Reply
                    </a>
                    <button type="button" onClick={copyEmail}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted">
                      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy email"}
                    </button>
                  </>
                )}
                {row.ghl_contact_id && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                    <ExternalLink className="w-4 h-4" /> CRM contact {row.ghl_contact_id.slice(0, 8)}…
                  </span>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed">
                This record contains a person's personal data. Treat it as confidential, and don't paste it
                into anywhere it doesn't belong. GoHighLevel remains the system of record for the contact.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsManager;
