import { Link } from "react-router-dom";
import { ArrowRight, Calendar, User, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePosts } from "@/hooks/use-content";

const PostMeta = ({ date, author, readTime }: { date: string; author: string; readTime?: string }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {date}</span>
    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {author}</span>
    {readTime && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {readTime}</span>}
  </div>
);

const Blog = () => {
  const { posts: allPosts } = usePosts();
  const featured = allPosts.find((p) => p.featured) ?? allPosts[0];
  const posts = allPosts.filter((p) => p.slug !== featured?.slug);

  if (!featured) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
              Insights & <span className="text-gradient-primary">Stories</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              News, guides, and perspectives on the electric mobility transition across America.
            </p>
          </div>

          {/* Featured */}
          <Link
            to={`/blog/${featured.slug}`}
            className="group grid lg:grid-cols-2 gap-8 items-center rounded-3xl border border-border bg-card overflow-hidden shadow-xl mb-14 hover:shadow-2xl transition-shadow animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="h-64 lg:h-full min-h-[280px] overflow-hidden">
              <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-4">
                {featured.category}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              <p className="text-muted-foreground mb-5">{featured.excerpt}</p>
              <PostMeta date={featured.date} author={featured.author} readTime={featured.readTime} />
              <span className="mt-6 inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                Read article <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p, i) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="group rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up"
                style={{ animationDelay: `${0.15 + i * 0.07}s` }}
              >
                <div className="h-48 overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                    {p.category}
                  </span>
                  <h3 className="text-lg font-bold font-display text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.excerpt}</p>
                  <PostMeta date={p.date} author={p.author} readTime={p.readTime} />
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="mt-16 rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">Never miss a story</h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              Get EV news, guides, and event invites delivered to your inbox.
            </p>
            <Link to="/#contact" className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">
              Subscribe <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
