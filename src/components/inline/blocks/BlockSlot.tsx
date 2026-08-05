// An insertion point between page sections. Renders any blocks assigned to this
// slot, and (in edit mode) an "Add block" palette to insert a new one here.

import type { PageBlock } from "@/lib/page-content";
import { useInlineEdit } from "@/components/inline/edit-context";
import BlockView from "@/components/inline/blocks/BlockView";
import AddBlock from "@/components/inline/blocks/AddBlock";

const BlockSlot = ({ slot, blocks }: { slot: string; blocks?: PageBlock[] }) => {
  const ctx = useInlineEdit();
  const mine = (blocks ?? []).filter((b) => b.slot === slot);
  if (!ctx?.editing && mine.length === 0) return null;

  return (
    <div className="my-6 space-y-2">
      {mine.map((b) => <BlockView key={b.id} block={b} />)}
      {ctx?.editing && <AddBlock slot={slot} />}
    </div>
  );
};

export default BlockSlot;
