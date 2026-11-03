// Copiar texto para a área de transferência. O navigator.clipboard só existe em contexto seguro (HTTPS ou localhost):
// no Jira Viewer servido por http://IP, ele não existe e a cópia falhava. A alternativa usa um campo de texto
// temporário e o comando de cópia do navegador, que funciona também em HTTP.

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto)
      return true
    }
  } catch { /* tenta a alternativa abaixo */ }
  try {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    Object.assign(area.style, { position: 'fixed', top: '0', left: '0', opacity: '0', pointerEvents: 'none' })
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, texto.length)
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}
