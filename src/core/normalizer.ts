export interface NormalizeOptions {
  normalizePunctuation: boolean;
}

const DEFAULT_OPTIONS: NormalizeOptions = {
  normalizePunctuation: true
};

const NBSP_REGEX = /\u00a0/g;
const SOFT_HYPHEN_REGEX = /\u00ad/g;
const QUOTES_REGEX = /[\u2018\u2019\u201c\u201d]/g;
const DASH_REGEX = /[\u2012\u2013\u2014\u2015-]/g;
const SLASH_REGEX = /[\/\\]/g;

export function normalizeText(
  input: string,
  options: NormalizeOptions = DEFAULT_OPTIONS
): string {
  let text = input || "";

  try {
    text = text.normalize("NFKC");
  } catch {
    // Older browsers might not support normalize; proceed without it.
  }

  text = text.replace(NBSP_REGEX, " ");
  text = text.replace(SOFT_HYPHEN_REGEX, "");

  if (options.normalizePunctuation) {
    text = text.replace(QUOTES_REGEX, "'");
    text = text.replace(DASH_REGEX, " ");
    text = text.replace(SLASH_REGEX, " ");
  }

  text = text.toLowerCase();
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
