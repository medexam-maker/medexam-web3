export function generateSlug(titleEn: string | undefined, titleAr: string | undefined, id: string): string {
  if (titleEn && titleEn.trim()) {
    const base = titleEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (base) {
       return `${base}--${id}`;
    }
  }
  if (titleAr && titleAr.trim()) {
    const base = titleAr.trim().replace(/[^\u0621-\u064A0-9a-zA-Z]+/g, '-').replace(/(^-|-$)/g, '');
    if (base) {
      return `${base}--${id}`;
    }
  }
  return id;
}

export function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  const parts = slug.split('--');
  return parts.length > 1 ? parts.pop()! : slug;
}
