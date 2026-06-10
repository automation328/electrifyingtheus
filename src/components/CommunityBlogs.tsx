import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import {
  PenLine, Plus, Pencil, Trash2, Calendar, User, LogIn, LogOut, Loader2,
} from "lucide-react";
import { supabase, isSupabaseConfigured, type Blog } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import ShareGate from "@/components/forms/ShareGate";

const GREEN_SHARE_ICON =
  "inline-grid place-items-center w-9 h-9 rounded-full gradient-green text-primary-foreground shadow-sm hover:opacity-90 transition-opacity";

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const md = {
  h1: ({ children }: { children?: ReactNode }) => <h1 className="text-2xl font-bold font-display text-foreground mt-4 mb-2">{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <h2 className="text-xl font-bold font-display text-foreground mt-4 mb-2">{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 className="text-lg font-bold font-display text-foreground mt-3 mb-1.5">{children}</h3>,
  p: ({ children }: { children?: ReactNode }) => <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-3">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-6 space-y-1 text-muted-foreground mb-3">{children}</ol>,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">{children}</a>
  ),
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
};

const CommunityBlogs = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth dialog
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Reader dialog
  const [reader, setReader] = useState<Blog | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    loadBlogs();
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadBlogs = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    setBlogs((data as Blog[]) ?? []);
    setLoading(false);
  };

  const handleAuth = async () => {
    if (!supabase) return;
    setAuthBusy(true);
    setAuthMsg("");
    const fn =
      authMode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error, data } = await fn;
    setAuthBusy(false);
    if (error) {
      setAuthMsg(error.message);
      return;
    }
    if (authMode === "signup" && !data.session) {
      setAuthMsg("Check your email to confirm your account, then sign in.");
      setAuthMode("signin");
      return;
    }
    setAuthOpen(false);
    setEmail("");
    setPassword("");
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setEditorOpen(true);
  };

  const openEdit = (b: Blog) => {
    setEditing(b);
    setTitle(b.title);
    setExcerpt(b.excerpt ?? "");
    setContent(b.content);
    setEditorOpen(true);
  };

  const saveBlog = async () => {
    if (!supabase || !session) return;
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const authorName = session.user.email?.split("@")[0] ?? "Community author";
    if (editing) {
      await supabase
        .from("blogs")
        .update({ title, excerpt, content, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
    } else {
      await supabase.from("blogs").insert({
        title,
        excerpt,
        content,
        author_id: session.user.id,
        author_name: authorName,
      });
    }
    setSaving(false);
    setEditorOpen(false);
    loadBlogs();
  };

  const deleteBlog = async (b: Blog) => {
    if (!supabase) return;
    if (!window.confirm(`Delete "${b.title}"? This can't be undone.`)) return;
    await supabase.from("blogs").delete().eq("id", b.id);
    loadBlogs();
  };

  const isMine = (b: Blog) => session?.user.id === b.author_id;

  return (
    <section className="mb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-3">
            <PenLine className="w-3.5 h-3.5" /> Community Blogs
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground">
            From the <span className="text-gradient-primary">community</span>
          </h2>
          <p className="text-muted-foreground mt-1">Stories and insights written by EV drivers like you.</p>
        </div>

        {isSupabaseConfigured && (
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Button onClick={openNew} variant="hero" className="rounded-xl">
                  <Plus className="w-4 h-4" /> Write a post
                </Button>
                <Button onClick={signOut} variant="outline" size="icon" className="rounded-xl" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => { setAuthMsg(""); setAuthOpen(true); }} variant="default" className="rounded-xl">
                <LogIn className="w-4 h-4" /> Sign in to write
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Not configured notice */}
      {!isSupabaseConfigured ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-foreground font-semibold mb-1">Community blogs aren't connected yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Add your Supabase URL and anon key to <code className="text-primary">.env</code> (VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY) to enable sign-in and editable posts.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading community posts…
        </div>
      ) : blogs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-foreground font-semibold mb-1">No community posts yet</p>
          <p className="text-sm text-muted-foreground">
            {session ? "Be the first — click “Write a post.”" : "Sign in to write the first one."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => (
            <article
              key={b.id}
              className="group rounded-3xl border border-border bg-card shadow-card p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary" /> {b.author_name ?? "Anonymous"}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {fmtDate(b.created_at)}</span>
              </div>
              <h3 className="text-lg font-bold font-display text-foreground mb-2 leading-snug">{b.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{b.excerpt || b.content}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button onClick={() => setReader(b)} className="text-sm font-semibold text-primary hover:underline">
                  Read more
                </button>
                <div className="flex items-center gap-1">
                  <ShareGate
                    url="/news"
                    title={b.title}
                    summary={b.author_name ?? "Community author"}
                    formType="article-share"
                    className={GREEN_SHARE_ICON}
                  />
                  {isMine(b) && (
                    <>
                      <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteBlog(b)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Auth dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{authMode === "signin" ? "Sign in" : "Create an account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cb-email">Email</Label>
              <Input id="cb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="cb-pw">Password</Label>
              <Input id="cb-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()} className="mt-1.5" />
            </div>
            {authMsg && <p className="text-sm text-destructive">{authMsg}</p>}
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={handleAuth} disabled={authBusy} className="w-full gradient-primary text-primary-foreground">
              {authBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : authMode === "signin" ? "Sign in" : "Create account"}
            </Button>
            <button
              onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthMsg(""); }}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {authMode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit post" : "Write a post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cb-title">Title</Label>
              <Input id="cb-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="Your headline" />
            </div>
            <div>
              <Label htmlFor="cb-excerpt">Excerpt</Label>
              <Input id="cb-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-1.5" placeholder="One-line summary (optional)" />
            </div>
            <div>
              <Label htmlFor="cb-content">Content (Markdown supported)</Label>
              <Textarea id="cb-content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="mt-1.5 resize-y"
                placeholder={"Write your post…\n\n## A heading\n\nSome **bold** text and a [link](https://example.com)."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveBlog} disabled={saving || !title.trim() || !content.trim()} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reader dialog */}
      <Dialog open={!!reader} onOpenChange={(o) => !o && setReader(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {reader && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">{reader.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary" /> {reader.author_name ?? "Anonymous"}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {fmtDate(reader.created_at)}</span>
              </div>
              <div className="text-sm">
                <ReactMarkdown components={md}>{reader.content}</ReactMarkdown>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CommunityBlogs;
