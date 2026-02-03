export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function dedupePreserveOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  items.forEach((item) => {
    if (!seen.has(item)) {
      seen.add(item);
      output.push(item);
    }
  });
  return output;
}
