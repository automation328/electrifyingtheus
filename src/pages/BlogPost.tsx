import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Calendar, User, Clock, Pencil, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareGate from "@/components/forms/ShareGate";
import InlinePageEditor from "@/components/inline/InlinePageEditor";
import BlockSlot from "@/components/inline/blocks/BlockSlot";
import EditableText, { PageStylesContext } from "@/components/inline/EditableText";
import EditableImage from "@/components/inline/EditableImage";
import { useInlineEdit } from "@/components/inline/edit-context";
import { usePost, usePosts } from "@/hooks/use-content";

// Where an editor may drop blocks on a post, in the order they appear. Used for
// the Inspector's "Add to" menu and for what move-up/move-down does.
const BLOG_SLOTS = ["blog-top", "blog-end"];

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mt-10 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xl font-bold font-display text-foreground mt-8 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-muted-foreground leading-relaxed mb-5">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 space-y-2 mb-5 text-muted-foreground marker:text-primary">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-6 space-y-2 mb-5 text-muted-foreground marker:text-primary">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary bg-primary/5 rounded-r-2xl pl-5 pr-4 py-3 my-6 text-foreground font-medium">{children}</blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) =>
    href?.startsWith("/") ? (
      <Link to={href} className="text-primary underline font-medium">{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">{children}</a>
    ),
  // GitHub-flavored markdown tables (enabled via remark-gfm).
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm md:text-base border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-muted/60">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left font-semibold text-foreground px-4 py-3 border-b border-border">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="text-muted-foreground px-4 py-3 border-b border-border align-top">{children}</td>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="last:[&>td]:border-b-0">{children}</tr>
  ),
};

/**
 * The article body, editable in place.
 *
 * It edits the MARKDOWN, not the rendered HTML. Making the rendered output
 * contentEditable and converting back would quietly wreck tables, links and
 * nested lists — markdown stays the source of truth, so nothing is lost.
 */
const EditableBody = ({ value, path }: { value: string; path: string }) => {
  const ctx = useInlineEdit();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const rendered = (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{value}</ReactMarkdown>
  );
  if (!ctx?.editing) return rendered;

  return (
    <div className="group relative rounded-xl ring-1 ring-transparent hover:ring-primary/40 transition p-2 -m-2">
      <button
        type="button"
        onClick={() => { setDraft(value); setOpen(true); }}
        className="absolute -top-3 right-2 z-20 hidden group-hover:inline-flex items-center gap-1.5 rounded-lg bg-foreground/90 px-2.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-foreground"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit article text
      </button>
      {rendered}

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-border bg-background p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center">
              <h3 className="font-bold font-display text-foreground">Article text</h3>
              <span className="ml-3 text-xs text-muted-foreground">Markdown — headings, links and tables all work.</span>
              <button onClick={() => setOpen(false)} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck
              className="h-[55vh] w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => { ctx.set(path, draft); setOpen(false); }}
                className="rounded-xl gradient-hero px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Apply
              </button>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                Cancel
              </button>
              <span className="ml-auto text-xs text-muted-foreground">Then Publish to make it live.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading } = usePost(slug);
  const { posts } = usePosts();
  const [progress, setProgress] = useState(0);

  // Scroll to top when navigating between posts.
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  // Reading-progress bar.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  if (!post) {
    // Still resolving dynamic (Supabase) posts — don't flash "not found".
    if (loading) {
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
            <div className="text-muted-foreground">Loading…</div>
          </main>
          <Footer />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-3xl font-bold font-display text-foreground mb-3">Post not found</h1>
            <p className="text-muted-foreground mb-6">That article doesn't exist or may have moved.</p>
            <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to the blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    // Signed-in editors get the same block builder the pages have. Blocks are
    // stored against this post's own path, so the words below stay markdown and
    // a post nobody has built on renders exactly as it always did.
    <InlinePageEditor
      path={`/blog/${post.slug}`}
      label={post.title}
      slots={BLOG_SLOTS}
      // The post's OWN words live in site_blog_posts, so inline edits write
      // back there — the CMS form and the page always agree. A curated post has
      // no row yet, so `adopt` carries the whole post for the first insert.
      fields={{
        table: "site_blog_posts",
        id: post.id,
        adopt: {
          slug: post.slug, title: post.title, excerpt: post.excerpt, category: post.category,
          date: post.date, author: post.author, read_time: post.readTime,
          image: post.image, content: post.content, status: "published",
        },
        invalidate: "site-blog-posts",
      }}
    >
      {(blocks, f, styles) => (
    <PageStylesContext.Provider value={styles}>
    <div className="min-h-screen flex flex-col bg-background">
      <div className="read-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <article className="container px-4 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to the blog
          </Link>

          {/* Header */}
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            {post.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4 leading-tight">
            <EditableText path="fields.title" styleKey="post.title">{f.title ?? post.title}</EditableText>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            <EditableText path="fields.excerpt" styleKey="post.excerpt">{f.excerpt ?? post.excerpt}</EditableText>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readTime}</span>
          </div>

          {/* Share — gates name + email, then social / email / SMS / more */}
          <div className="mb-8">
            <ShareGate
              url={`/blog/${post.slug}`}
              title={post.title}
              summary={post.category}
              description={post.excerpt}
              image={post.image}
              meta={`${post.category} · ${post.author} · ${post.date}`}
              formType="article-share"
              variant="label"
              label="Share this article"
              className="inline-flex items-center gap-1.5 rounded-full gradient-green text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-card hover:opacity-90 transition-opacity"
            />
          </div>

          {/* Cover image — "Change photo" in edit mode, like every other image. */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl mb-10 max-h-[420px]">
            <EditableImage
              path="fields.image"
              src={f.image ?? post.image}
              alt={f.title ?? post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Blocks above the article — a callout, a video, a gallery. */}
          <BlockSlot slot="blog-top" blocks={blocks} />

          {/* Body */}
          <div className="text-base md:text-lg">
            <EditableBody value={f.content ?? post.content} path="fields.content" />
          </div>

          {/* Blocks below the article — a CTA, related links, a sign-up. */}
          <BlockSlot slot="blog-end" blocks={blocks} />
        </article>

        {/* Related posts */}
        <section className="container px-4 max-w-6xl mt-16">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-6">Keep reading</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {related.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="group rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="h-40 overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-5">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                    {p.category}
                  </span>
                  <h3 className="font-bold font-display text-foreground leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              View all articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
    </PageStylesContext.Provider>
      )}
    </InlinePageEditor>
  );
};

export default BlogPost;
