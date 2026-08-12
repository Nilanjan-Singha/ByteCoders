export function slugifyText(value:string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "chapter";
}

export function normalizePageText(text:string) {
  return text
    .replace(/\u00AD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
