import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface PlanTocSidebarProps {
  markdown: string;
  activeId?: string;
}

export function extractHeadings(markdown: string): TocItem[] {
  // Only H1 and H2 — top-level sections only
  const headingRegex = /^(#{1,2})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/\*\*/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    items.push({ id, text, level });
  }
  return items;
}

const PlanTocSidebar = ({ markdown, activeId }: PlanTocSidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  };

  const tocContent = (
    <nav className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Table of Contents
      </p>
      {headings.map((h) => (
        <button
          key={h.id}
          onClick={() => handleClick(h.id)}
          className={cn(
            "block w-full text-left text-xs leading-relaxed py-1.5 rounded-sm px-2 transition-colors duration-150",
            h.level === 1 && "font-semibold text-foreground/80",
            h.level === 2 && "pl-3 font-normal",
            activeId === h.id
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          {h.text}
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden print-hidden fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-secondary text-foreground flex items-center justify-center shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 z-40 w-72 bg-secondary p-6 pt-20 overflow-y-auto transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {tocContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block print-hidden w-60 shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          {tocContent}
        </div>
      </aside>
    </>
  );
};

export default PlanTocSidebar;
