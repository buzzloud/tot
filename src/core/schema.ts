export type SchemaMatch = "JSON-LD" | "Microdata" | "RDFa";

function hasJsonLd(html: string): boolean {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi);
  if (!scripts) {
    return false;
  }
  return scripts.some((script) => /"@context"\s*:|"@type"\s*:/i.test(script));
}

function hasMicrodata(html: string): boolean {
  const hasItemscope = /itemscope\b/i.test(html);
  const hasItemtype = /itemtype\s*=\s*["']https?:\/\/schema\.org\//i.test(html) || /itemtype\s*=/i.test(html);
  const hasItemprop = /itemprop\s*=/i.test(html);
  return hasItemscope && (hasItemtype || hasItemprop);
}

function hasRdfa(html: string): boolean {
  const hasVocab = /vocab\s*=\s*["']https?:\/\/schema\.org/i.test(html);
  const hasTypeof = /typeof\s*=/i.test(html);
  const hasProperty = /property\s*=/i.test(html);
  return hasVocab || (hasTypeof && hasProperty);
}

export function detectSchema(html: string): { present: boolean; matches: SchemaMatch[] } {
  const matches: SchemaMatch[] = [];

  if (hasJsonLd(html)) {
    matches.push("JSON-LD");
  }
  if (hasMicrodata(html)) {
    matches.push("Microdata");
  }
  if (hasRdfa(html)) {
    matches.push("RDFa");
  }

  return {
    present: matches.length > 0,
    matches
  };
}
