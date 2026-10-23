import type { Block, Inline } from "@/lib/nameit/markdown";

// Renders the parsed condition markdown. Citations become small numbered
// links to the source list at the bottom of the page.

export function Inlines({ nodes, numbers }: { nodes: Inline[]; numbers: Record<string, number> }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.type) {
          case "text":
            return <span key={i}>{n.text}</span>;
          case "strong":
            return (
              <strong key={i}>
                <Inlines nodes={n.children} numbers={numbers} />
              </strong>
            );
          case "em":
            return (
              <em key={i}>
                <Inlines nodes={n.children} numbers={numbers} />
              </em>
            );
          case "link":
            return (
              <a key={i} href={n.href} rel="noopener">
                <Inlines nodes={n.children} numbers={numbers} />
              </a>
            );
          case "cite": {
            const nums = n.keys.map((k) => numbers[k]).sort((a, b) => a - b);
            return (
              <sup key={i} className="ni-cite">
                {nums.map((num, j) => (
                  <span key={num}>
                    {j > 0 && ","}
                    <a href={`#source-${num}`} aria-label={`Source ${num}`}>
                      {num}
                    </a>
                  </span>
                ))}
              </sup>
            );
          }
        }
      })}
    </>
  );
}

export function Blocks({ blocks, numbers }: { blocks: Block[]; numbers: Record<string, number> }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i}>
            <Inlines nodes={b.content} numbers={numbers} />
          </p>
        ) : (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Inlines nodes={item} numbers={numbers} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}
