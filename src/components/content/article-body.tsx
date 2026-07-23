import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ArticleBlock } from "@/content/articles";

const CALLOUT = {
  info: { icon: Info, box: "border-primary/30 bg-primary/5", tint: "text-primary" },
  warning: { icon: TriangleAlert, box: "border-warning/40 bg-warning/10", tint: "text-warning" },
  success: { icon: CheckCircle2, box: "border-success/40 bg-success/10", tint: "text-success" },
} as const;

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "p":
      return <p className="leading-relaxed text-muted-foreground">{block.text}</p>;
    case "h2":
      return <h2 className="pt-4 text-xl font-semibold tracking-tight">{block.text}</h2>;
    case "h3":
      return <h3 className="pt-2 text-lg font-semibold">{block.text}</h3>;
    case "ul":
      return (
        <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground marker:text-primary">
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="ml-5 list-decimal space-y-1.5 text-muted-foreground marker:font-semibold marker:text-primary">
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      );
    case "callout": {
      const c = CALLOUT[block.tone];
      const Icon = c.icon;
      return (
        <div className={`flex gap-3 rounded-xl border p-4 ${c.box}`}>
          <Icon className={`mt-0.5 size-5 shrink-0 ${c.tint}`} />
          <div>
            {block.title && <p className="font-semibold">{block.title}</p>}
            <p className={`text-sm text-muted-foreground ${block.title ? "mt-0.5" : ""}`}>
              {block.text}
            </p>
          </div>
        </div>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
