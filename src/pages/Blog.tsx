import { Link } from "react-router-dom";
import { ArrowRight, Calendar, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBg from "@/assets/reduced-emissions.jpg";
import evCharging from "@/assets/ev-charging.jpg";
import evSavings from "@/assets/ev-savings.jpg";
import workforce from "@/assets/workforce.jpg";
import micromobility from "@/assets/micromobility.jpg";
import evWinter from "@/assets/ev-winter.jpg";
import evFamily from "@/assets/ev-family.jpg";

interface Post {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  image: string;
}

const featured: Post = {
  title: "Why 2026 Is the Tipping Point for EV Adoption in America",
  excerpt:
    "With more than 8 million EVs on U.S. roads, falling battery costs, and a fast-growing charging network, the shift to electric is moving from early adopters to the mainstream. Here's what's driving the momentum.",
  category: "Policy & Trends",
  date: "May 18, 2026",
  author: "Electrifying the US Team",
  image: heroBg,
};

const posts: Post[] = [
  {
    title: "Charging 101: Level 1 vs. Level 2 vs. DC Fast",
    excerpt: "Which charger fits your life? A plain-English guide to speeds, connectors, and costs.",
    category: "EV 101",
    date: "May 12, 2026",
    author: "Maya Chen",
    image: evCharging,
  },
  {
    title: "The Real Cost of Going Electric: A Savings Breakdown",
    excerpt: "Fuel, maintenance, and incentives add up. See where EV owners actually save money.",
    category: "Savings",
    date: "May 5, 2026",
    author: "Darnell Price",
    image: evSavings,
  },
  {
    title: "Electrifying Communities: Clean-Energy Workforce Opportunities",
    excerpt: "The EV transition is creating hundreds of thousands of jobs — and pathways into them.",
    category: "Workforce",
    date: "Apr 28, 2026",
    author: "Jordan Ellis",
    image: workforce,
  },
  {
    title: "Beyond Cars: E-Bikes, Buses & the Multimodal Future",
    excerpt: "Zero-emission mobility is bigger than cars. Explore the full electric ecosystem.",
    category: "Multimodal",
    date: "Apr 20, 2026",
    author: "Sofia Reyes",
    image: micromobility,
  },
  {
    title: "EVs in Winter: Myths vs. Reality",
    excerpt: "Cold weather affects range — but preconditioning and planning keep you moving.",
    category: "EV 101",
    date: "Apr 9, 2026",
    author: "Maya Chen",
    image: evWinter,
  },
  {
    title: "Cleaner Air, Healthier Neighborhoods",
    excerpt: "How replacing tailpipes with plugs improves public health where we live.",
    category: "Health",
    date: "Mar 30, 2026",
    author: "Dr. Aisha Bello",
    image: evFamily,
  },
];

const PostMeta = ({ date, author }: { date: string; author: string }) => (
  <div className="flex items-center gap-4 text-xs text-muted-foreground">
    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {date}</span>
    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {author}</span>
  </div>
);

const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
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
          <article className="grid lg:grid-cols-2 gap-8 items-center rounded-3xl border border-border bg-card overflow-hidden shadow-xl mb-14">
            <div className="h-64 lg:h-full min-h-[280px]">
              <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8">
              <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-4">
                {featured.category}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-3 leading-snug">
                {featured.title}
              </h2>
              <p className="text-muted-foreground mb-5">{featured.excerpt}</p>
              <PostMeta date={featured.date} author={featured.author} />
              <button className="mt-6 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                Read article <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p) => (
              <article key={p.title} className="rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="h-48 overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                    {p.category}
                  </span>
                  <h3 className="text-lg font-bold font-display text-foreground mb-2 leading-snug">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{p.excerpt}</p>
                  <PostMeta date={p.date} author={p.author} />
                </div>
              </article>
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
