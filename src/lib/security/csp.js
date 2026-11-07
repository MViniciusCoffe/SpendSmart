/**
 * Content-Security-Policy com nonce (issue #24).
 *
 * O src/proxy.js gera um nonce novo a cada requisição e monta a política com esta função. O Next.js
 * lê o nonce do header da requisição e o aplica sozinho aos próprios scripts; um script sem o
 * nonce, como um injetado por XSS, não executa. Por isso todas as páginas renderizam dinamicamente
 * (`connection()` no layout raiz): uma página estática não tem requisição para receber o nonce.
 *
 * Decisões:
 * - script-src: nonce + 'strict-dynamic', sem 'unsafe-inline'. 'unsafe-eval' só em
 *   desenvolvimento, exigido pelo React para reconstruir a pilha de erros do servidor.
 * - style-src: nonce, que o Next.js aplica sozinho aos próprios <style>; folhas de estilo do app vêm
 *   por 'self'. Um <style> injetado fica bloqueado. Em desenvolvimento, 'unsafe-inline', porque o
 *   hot reload injeta estilos sem nonce.
 * - style-src-attr: 'unsafe-inline' só para atributos style="", que o nonce não cobre. São os valores
 *   de runtime que o React gera (a cor de cada categoria, a altura de um gráfico). Sem esta diretiva
 *   o navegador usaria a regra de style-src e removeria esses atributos.
 * - connect-src: só a própria origem e a do Supabase (Auth e PostgREST são chamados do navegador).
 * - upgrade-insecure-requests só quando o Supabase é HTTPS: no Supabase CLI local (http://127.0.0.1)
 *   ele forçaria HTTPS e quebraria as chamadas.
 *
 * @param {string} nonce
 * @param {{ isDev?: boolean, supabaseUrl?: string }} [options]
 * @returns {string}
 */
export function buildContentSecurityPolicy(nonce, { isDev = false, supabaseUrl } = {}) {
  const supabase = supabaseUrl ? new URL(supabaseUrl) : null

  const directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'", `'nonce-${nonce}'`, "'strict-dynamic'", isDev && "'unsafe-eval'"],
    ["style-src", "'self'", isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`],
    ["style-src-attr", "'unsafe-inline'"],
    ["img-src", "'self'", "blob:", "data:"],
    ["font-src", "'self'"],
    ["connect-src", "'self'", supabase?.origin],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    supabase?.protocol === "https:" && ["upgrade-insecure-requests"]
  ]

  return directives
    .filter(Boolean)
    .map(directive => directive.filter(Boolean).join(" "))
    .join("; ")
}

/** Nonce de 128 bits em base64, novo a cada requisição. */
export function createNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64")
}
