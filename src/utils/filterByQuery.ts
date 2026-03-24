export function filterByQuery<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[]
) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return items;

  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      return String(value ?? "").toLowerCase().includes(normalized);
    })
  );
}