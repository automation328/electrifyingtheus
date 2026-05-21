import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowRight, Calendar, User, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS, getPostBySlug } from "@/data/blog-posts";

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-2xl font-bold font-display text-foreground mt-8 mb-3">{children}</h2>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 space-y-1.5 mb-4 text-muted-foreground">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
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
  const post = slug ? getPostBySlug(slug) : undefined;

  // Scroll to top when navigating between posts.
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!post) {
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

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readTime}</span>
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
          <h2 className="text-2xl font-bold font-display text-foreground mb-6">Keep reading</h2>
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
