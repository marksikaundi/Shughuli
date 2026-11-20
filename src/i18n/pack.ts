export function pack(source: string): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    messages[trimmed.slice(0, index)] = trimmed.slice(index + 1).replace(/\\n/g, '\n');
  }
  return messages;
}
