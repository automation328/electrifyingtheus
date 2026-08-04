// Renders a CMS-created custom page (a site_pages row whose path isn't a coded
// route). Reached via the catch-all route: if a page exists for this path it
// renders through EditableContentPage (so editors get the same on-page block
// builder); otherwise it falls through to the 404 page.

import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import EditableContentPage from "@/components/EditableContentPage";
import NotFound from "@/pages/NotFound";
import { fetchPageOverride, type PageOverride } from "@/lib/page-content";
import { useEditorAuth } from "@/lib/auth";
import { listRows } from "@/lib/admin-api";

const normalize = (p: string) => (p.replace(/\/+$/, "") || "/");

interface Row { title?: string; status?: string; content: PageOverride }

const CustomPage = () => {
  const path = normalize(useLocation().pathname);
  const auth = useEditorAuth();
  const isEditor = auth.status === "editor";

  const q = useQuery({
    queryKey: ["custom-page", path, isEditor],
    queryFn: async (): Promise<Row | null> => {
      if (isEditor) {
        const rows = await listRows<{ path: string; title?: string; status?: string; content: PageOverride }>("site_pages");
        const r = rows.find((x) => x.path === path);
        return r ? { title: r.title, status: r.status, content: r.content } : null;
      }
      const content = await fetchPageOverride(path);
      return content ? { content } : null;
    },
    staleTime: 30_000,
  });

  if (q.isLoading || auth.status === "loading") {
    return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!q.data) return <NotFound />;

  const content = q.data.content ?? {};
  const title = content.title || q.data.title || "Page";

  return (
    <EditableContentPage
      path={path}
      label={title}
      badge=""
      title={title}
      highlight=""
      intro={content.intro ?? ""}
      icon={FileText}
      sections={[]}
      hideMeta
      hideCta
    />
  );
};

export default CustomPage;
