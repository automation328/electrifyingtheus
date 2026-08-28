import { Link, useParams } from "react-router-dom";
import {
  CalendarDays, Clock, MapPin, ArrowLeft, Ticket, CalendarPlus, Tag, Loader2, Megaphone,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InlinePageEditor from "@/components/inline/InlinePageEditor";
import BlockSlot from "@/components/inline/blocks/BlockSlot";
import EditableText, { PageStylesContext } from "@/components/inline/EditableText";
import EditableImage from "@/components/inline/EditableImage";
import LinkPicker from "@/components/inline/LinkPicker";
import { useInlineEdit } from "@/components/inline/edit-context";
import { descriptionBlocks } from "@/lib/event-description";
import { eventAdoptRow } from "@/lib/content";
import { safeHref } from "@/lib/safe-href";
import ShareGate from "@/components/forms/ShareGate";
import EventActionGate from "@/components/forms/EventActionGate";
import EventDisclaimer from "@/components/EventDisclaimer";
import { gcalLink, eventFullDate, eventDisplayTitle, eventLocationText, type EventItem } from "@/data/events";
import { useEvents, useDraftEvent } from "@/hooks/use-content";
import { useExternalEvents } from "@/hooks/use-external-events";

// Where blocks may be dropped on an event page, in page order.
const EVENT_SLOTS = ["event-top", "event-end"];

/**
 * Shows a visitor the DERIVED display text, but hands an editor the RAW stored
 * value to edit.
 *
 * This matters more than it looks. eventDisplayTitle appends " - City" to a
 * title that lacks it, and eventLocationText substitutes a map pin when the
 * location is blank. Editing those strings would write the derived form back
 * into the column — and the title is part of the event's dedupe key, which
 * decides its slug, which is its URL. Saving the pretty version could move the
 * page out from under its own link.
 */
const RawEditable = ({ path, raw, display, editable }: { path: string; raw: string; display: string; editable: boolean }) => {
  const ctx = useInlineEdit();
  if (!editable || !ctx?.editing) return <>{display}</>;
  return <EditableText path={path}>{raw}</EditableText>;
};

/**
 * A plain field, editable only when there is somewhere to save it.
 *
 * Without the `editable` gate an external feed event still looked editable:
 * typing worked, Publish reported success, and the change was dropped on the
 * floor because that event has no field target. Better to not offer it.
 */
const Field = ({ path, value, editable }: { path: string; value: string; editable: boolean }) => {
  const ctx = useInlineEdit();
  if (!editable || !ctx?.editing) return <>{value}</>;
  return <EditableText path={path}>{value}</EditableText>;
};

/**
 * The event description. Bullet lines an editor typed come out as a real list;
 * see @/lib/event-description for what counts as one and why.
 *
 * While editing, none of that applies: the editor gets the raw stored string in
 * one box, because that is the thing being saved. Parsed output is for readers.
 */
const Description = ({ path, value, editable }: { path: string; value: string; editable: boolean }) => {
  const ctx = useInlineEdit();
  if (editable && ctx?.editing) {
    return <p className="whitespace-pre-line"><EditableText path={path}>{value}</EditableText></p>;
  }
  return (
    <>
      {descriptionBlocks(value).map((b, i) =>
        b.kind === "ul" ? (
          <ul key={i} className="list-disc pl-5 space-y-1 my-2">
            {b.items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">{b.lines.join("\n")}</p>
        ),
      )}
    </>
  );
};

/** Built-in wording for the two Register buttons, used when the event sets none. */
const REGISTER_LABEL = "Register";
const REGISTER_CTA_LABEL = "Register now";

/**
 * A Register button whose words and destination an editor can change on the page.
 *
 * While editing, the button itself is INERT — a span wearing the button's
 * classes — with a label box and a link picker beneath it. A live one cannot be
 * edited in place: the click that puts the caret in it also opens the
 * lead-capture dialog. The builder's Button block settled this the same way.
 *
 * Both buttons commit to the SAME link (fields.register_url). An event has one
 * registration page, and two boxes that can disagree about it is a bug waiting
 * for someone to hit it. The LABELS are separate columns, because the two
 * buttons read differently where they sit.
 */
const RegisterCta = ({ event, url, label, labelPath, fallbackLabel, editable, className }: {
  event: EventItem;
  /** Raw link — the pending edit when there is one, else the event's stored value. */
  url: string;
  /** Raw label; "" when the event has none of its own. */
  label: string;
  /** Draft path this button's own label commits to. */
  labelPath: string;
  /** Shown, and saved as nothing, when the label is blank. */
  fallbackLabel: string;
  editable: boolean;
  className: string;
}) => {
  const ctx = useInlineEdit();
  const icon = <Ticket className="w-5 h-5" />;
  const text = label || fallbackLabel;

  if (editable && ctx?.editing) {
    return (
      <div className="inline-flex flex-col items-start gap-2 text-left">
        <span className={className}>{icon}{text}</span>
        {/* Its own card: these controls sit on a white row in one place and on
            the coloured band in the other, and muted text on that gradient is
            unreadable. */}
        <div className="w-full min-w-[17rem] max-w-sm rounded-xl border border-border bg-card p-2.5 shadow-sm">
          <label className="block text-[11px] font-semibold text-muted-foreground">
            Button text
            <input
              value={label}
              onChange={(e) => ctx.set(labelPath, e.target.value)}
              placeholder={fallbackLabel}
              className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-normal text-foreground"
            />
          </label>
          <p className="mt-2 mb-1 text-[11px] font-semibold text-muted-foreground">Register link</p>
          <LinkPicker
            value={url}
            onChange={(v) => ctx.set("fields.register_url", v)}
            placeholder="https://… or /page"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Both Register buttons use this link. Leave it blank and they send people to Contact us.
          </p>
        </div>
      </div>
    );
  }

  // The link came from an editor's keyboard and is handed to window.open, so a
  // javascript:/data: URL is treated as no link at all rather than opened.
  const href = safeHref(url);
  if (href !== "#") {
    return (
      <EventActionGate
        href={href}
        formType="event-register"
        title={event.title}
        summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
        label={text}
        icon={icon}
        className={className}
      />
    );
  }
  return <Link to="/contact-us" className={className}>{icon} {text}</Link>;
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 pt-28 pb-16">{children}</main>
    <Footer />
  </div>
);

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { events, loading } = useEvents();
  const { events: externalEvents, loading: extLoading } = useExternalEvents();
  const published = events.find((e) => e.slug === slug);
  // A draft is invisible to the public site by design, so an editor who clicked
  // "Edit on page" from the CMS used to land here and get the AGGREGATED FEED's
  // copy of the same event instead — which is not ours and therefore has no
  // editable fields. Only looked up when the published lookup missed, and only
  // for a signed-in editor.
  const { event: draft, loading: draftLoading } = useDraftEvent(slug, !published);
  // Ours first (published, then a draft an editor is working on), and only then
  // the aggregated US-wide feed.
  const event = published ?? draft ?? externalEvents.find((e) => e.slug === slug);

  if (!event) {
    // Supabase + feed events resolve async — show a loader before "not found".
    if (loading || extLoading || draftLoading) {
      return (
        <Shell>
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading event…
          </div>
        </Shell>
      );
    }
    return (
      <Shell>
        <div className="container px-4 max-w-3xl text-center py-16">
          <h1 className="text-3xl font-bold font-display text-foreground mb-3">Event not found</h1>
          <p className="text-muted-foreground mb-6">That event doesn't exist or may have ended.</p>
          <Link to="/events" className="inline-flex items-center gap-2 text-primary font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Link>
        </div>
      </Shell>
    );
  }

  // Events pulled from an external feed are not ours: no field target, and no
  // editable fields either, so nobody types into a box that discards the text.
  const ownEvent = !event.external;

  return (
    // Same builder the blog posts have. `event.slug` here is already resolved
    // by mergeEvents, so a curated event stores its blocks under the same path
    // its page actually lives at.
    <InlinePageEditor
      path={`/events/${event.slug}`}
      label={event.title}
      slots={EVENT_SLOTS}
      // The event's own words live in site_events. External feed events get no
      // field target at all — they are someone else's data, and adopting one on
      // a stray click would quietly copy it into our table.
      fields={ownEvent ? {
        table: "site_events",
        id: event.id,
        adopt: eventAdoptRow(event),
        invalidate: "site-events",
      } : undefined}
    >
      {(blocks, f, styles) => (
    <PageStylesContext.Provider value={styles}>
    <Shell>
      <div className="container px-4 max-w-5xl">
        <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
        <BlockSlot slot="event-top" blocks={blocks} />

        {/* One flowing column with the poster floated beside it, NOT a two-column
            grid. A grid gives both columns the same height, so whichever side is
            shorter leaves dead space: a long description stayed trapped in a
            half-width column with a tall empty gap beside it, and a short one
            left the gap on the other side instead. Floating lets the text run
            beside the poster and then continue at full width underneath it, so
            the section fills either way and no event needs special handling.

            The width is calc(50% - half the gutter), which is exactly what
            grid-cols-2 with gap-12 produced, so the top of the page is
            unchanged. flow-root contains the float so the disclaimer band below
            cannot ride up into it. */}
        <div className="lg:flow-root">
          {/* Poster */}
          {/* z-10 is load-bearing, not decoration. The details block below is a
              later sibling carrying animate-fade-up, whose `forwards` fill mode
              leaves transform: translateY(0) on the element for good — a no-op
              visually, but any transform other than `none` makes a stacking
              context. That put the details block on its own layer above this
              floated one, and its box is the FULL container width (the float
              only shortens line boxes, never the block box), so the description
              paragraph lay invisibly across the poster and swallowed the clicks
              for every CTA underneath it: Add to calendar, Share, Register, List
              Your Event and View more events were all dead. Lifting the poster
              puts the buttons back on top. Do not drop this without either
              removing the animation below or clearing its transform. */}
          <div className="relative z-10 animate-fade-up mb-8 lg:float-left lg:w-[calc(50%-1.5rem)] lg:mr-12">
            {/* Fixed 4:3 frame so every event's poster is the same size. The whole
                flyer shows (object-contain), with a soft blurred fill of itself
                behind so mismatched aspect ratios don't leave flat bars. */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-elevated ring-1 ring-border bg-muted">
              <img src={f.image ?? event.image} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50" />
              {ownEvent ? (
                <EditableImage
                  path="fields.image"
                  src={f.image ?? event.image}
                  alt={event.title}
                  className="relative w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <img src={f.image ?? event.image} alt={event.title} className="relative w-full h-full object-contain" loading="lazy" />
              )}
            </div>
            <div className="absolute -top-4 -left-4 w-20 rounded-2xl bg-white text-center shadow-lg overflow-hidden">
              <div className="bg-secondary text-primary-foreground text-[11px] font-bold tracking-wider py-1">{event.month}</div>
              <div className="text-foreground text-3xl font-bold font-display leading-none py-2">{event.day}</div>
            </div>

            {/* CTAs — below the image. Each captures the visitor's first name + email. */}
            <div className="flex flex-wrap items-center gap-2.5 mt-6">
              <EventActionGate
                href={gcalLink(event)}
                formType="event-calendar"
                title={event.title}
                summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                label="Add to calendar"
                icon={<CalendarPlus className="w-5 h-5" />}
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition"
              />
              <ShareGate
                url={`/events/${event.slug}`}
                title={event.title}
                summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                description={event.description}
                image={event.image}
                meta={`${event.type} · ${event.location} · ${event.month} ${event.day}, ${event.year} · ${event.time}`}
                formType="event-share"
                variant="label"
                label="Share"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition"
              />
              <RegisterCta
                event={event}
                url={f.register_url ?? event.registerUrl ?? ""}
                label={f.register_label ?? event.registerLabel ?? ""}
                labelPath="fields.register_label"
                fallbackLabel={REGISTER_LABEL}
                editable={ownEvent}
                className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl shadow-card hover:opacity-90 transition"
              />
              <Link to="/list-your-event"
                className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-5 py-3 rounded-xl shadow-card hover:bg-green-700 transition">
                <Megaphone className="w-5 h-5" /> List Your Event
              </Link>
              <Link to="/events"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition">
                <CalendarDays className="w-5 h-5" /> View more events
              </Link>
            </div>
          </div>

          {/* Details — flows beside the floated poster, then under it. */}
          <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              <Tag className="w-4 h-4" /> {event.type}
            </span>

            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground leading-tight mb-4">
              <RawEditable path="fields.title" raw={f.title ?? event.title} display={eventDisplayTitle(event)} editable={ownEvent} />
            </h1>

            <div className="flex flex-col gap-2 text-foreground mb-5">
              {/* Not editable here: the dates are stored as event_date/end_date
                  and shown split, and the start decides the event's slug. They
                  stay in the CMS form where they are real date fields.
                  eventFullDate gives "Thursday, AUG 27, 2026" for a single day
                  and "SEP 11 – OCT 12, 2026" when the event spans a range. */}
              <span className="flex items-center gap-2.5"><CalendarDays className="w-5 h-5 text-primary shrink-0" /> {eventFullDate(event)}</span>
              <span className="flex items-center gap-2.5"><Clock className="w-5 h-5 text-primary shrink-0" /> <Field path="fields.time" value={f.time ?? event.time} editable={ownEvent} /></span>
              <span className="flex items-center gap-2.5"><MapPin className="w-5 h-5 text-primary shrink-0" /> <RawEditable path="fields.location" raw={f.location ?? event.location} display={eventLocationText(event)} editable={ownEvent} /></span>
            </div>

            {/* clear-left drops the description below the poster instead of
                letting it start in the half-width channel beside it and then
                jump to full width partway through a sentence. The badge, title
                and the date/time/location block still sit beside the poster —
                they are short and fixed-height, so they read as a column. Prose
                is not: it changed measure mid-paragraph, which looked like two
                unrelated blocks of text, and a bullet list would have been
                worse — the same list rendered at two different widths. Below
                the float it has one measure, whatever the event writes. */}
            <div className="text-foreground leading-relaxed lg:clear-left lg:pt-6">
              <Description path="fields.description" value={f.description ?? event.description} editable={ownEvent} />
            </div>
          </div>
        </div>

        {/* Event disclaimers — above the register band */}
        <EventDisclaimer className="mt-10" />

        {/* Register band */}
        <div className="mt-8 rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">Save your spot</h2>
          <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
            {event.time} · {event.location}. Register and we'll make sure you have the details.
          </p>
          <RegisterCta
            event={event}
            url={f.register_url ?? event.registerUrl ?? ""}
            label={f.register_cta_label ?? event.registerCtaLabel ?? ""}
            labelPath="fields.register_cta_label"
            fallbackLabel={REGISTER_CTA_LABEL}
            editable={ownEvent}
            className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-bold px-7 py-3.5 rounded-2xl hover:opacity-90 transition"
          />
        </div>
        <BlockSlot slot="event-end" blocks={blocks} />
      </div>
    </Shell>
    </PageStylesContext.Provider>
      )}
    </InlinePageEditor>
  );
};

export default EventDetail;
