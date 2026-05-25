/** Este archivo guarda funciones pequenas que ayudan a mostrar errores y texto de forma segura. */

export function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

export function extractErrorLine(error) {
  if (!error) return null;
  const message = formatError(error);
  const match = message.match(/L[ií]nea aproximada:\s*(\d+)/i) || message.match(/linea aproximada:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
