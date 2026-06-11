import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowRight, Calendar, User, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareGate from "@/components/forms/ShareGate";
import { usePost, usePosts } from "@/hooks/use-content";

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
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>
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

          {/* Hero image */}
          <div className="rounded-3xl overflow-hidden shadow-xl mb-10 max-h-[420px]">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>

          {/* Body */}
          <div className="text-base md:text-lg">
            <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>
          </div>
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
  );
};

export default BlogPost;
