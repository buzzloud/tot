export function qs<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element as T;
}

export function qsa<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll(selector)) as T[];
}
