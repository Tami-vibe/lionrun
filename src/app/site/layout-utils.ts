export function equalWidths(count: number) {
  return Array.from({length: count}, () => 100 / count);
}

export function defaultColumns(id: string) {
  return id === 'solutions' ? 5 : id === 'about' || id === 'proof' || id === 'contact' ? 2 : id === 'faq' ? 1 : 3;
}
