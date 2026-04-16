/** Split long pasted text into bounded chunks for citation and LLM context. */
export function chunkSourceText(
  text: string,
  opts?: { maxChunks?: number; maxChars?: number },
): string[] {
  const maxChunks = opts?.maxChunks ?? 48;
  const maxChars = opts?.maxChars ?? 2800;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t) out.push(t);
    buf = "";
  };

  for (const p of paragraphs) {
    if (buf.length + p.length + 2 <= maxChars) {
      buf = buf ? `${buf}\n\n${p}` : p;
    } else {
      flush();
      if (p.length <= maxChars) {
        buf = p;
      } else {
        for (let i = 0; i < p.length; i += maxChars) {
          out.push(p.slice(i, i + maxChars));
          if (out.length >= maxChunks) return out;
        }
      }
    }
    if (out.length >= maxChunks) return out;
  }
  flush();
  return out.slice(0, maxChunks);
}
