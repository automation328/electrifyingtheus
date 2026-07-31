// Drop-in replacement for <ContentPageLayout> that applies the CMS prose override
// for a page. Pages swap `ContentPageLayout` → `EditableContentPage` and add a
// `path` prop; everything else (icon, hero image, video, galleries, CTAs) stays
// exactly as passed. Only the overridable prose fields are merged.

import ContentPageLayout from "@/components/ContentPageLayout";
import { usePageOverride, mergePageOverride } from "@/lib/page-content";

type LayoutProps = React.ComponentProps<typeof ContentPageLayout>;

const EditableContentPage = ({ path, ...props }: LayoutProps & { path: string }) => {
  const override = usePageOverride(path);
  const merged = mergePageOverride(props, override) as LayoutProps;
  return <ContentPageLayout {...merged} />;
};

export default EditableContentPage;
