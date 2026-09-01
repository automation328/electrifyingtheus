// An event description, rendered the way it was typed: prose stays a pre-line
// paragraph, a run of "- " lines becomes a real list. See @/lib/event-description
// for what counts as a bullet and why bullets are typed rather than marked up.
//
// It lives here rather than on the detail page because the events list shows the
// same text once a card is expanded, and the two rendered it differently — the
// list left the markers on screen as literal dashes. One component, so a
// description reads the same wherever it is shown.

import { descriptionBlocks } from "@/lib/event-description";
import { styleClass, styleCss, usePageStyle } from "@/components/inline/elem-style";

interface Props {
  text: string;
  /** Applies the typography an editor set on this text. Left off where the page
   *  has no styles of its own — an events card should not inherit the detail
   *  page's description styling. */
  styleKey?: string;
}

const EventDescription = ({ text, styleKey }: Props) => {
  const s = usePageStyle(styleKey ?? "");
  const cls = styleClass(s);
  const css = styleCss(s);

  const body = (
    <>
      {descriptionBlocks(text).map((b, i) =>
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

  // No wrapper unless there is something to put on it, so an unstyled
  // description renders exactly the markup it always did.
  if (!cls && Object.keys(css).length === 0) return body;
  return <div className={cls || undefined} style={css}>{body}</div>;
};

export default EventDescription;
