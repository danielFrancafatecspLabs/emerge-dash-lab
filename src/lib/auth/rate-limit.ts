// Limite de tentativas em memória (por instância do servidor), usado no login contra força bruta.

interface Janela {
  falhas: number
  inicio: number
}

export class FailureLimiter {
  private readonly janelas = new Map<string, Janela>()

  constructor(private readonly maxFalhas: number, private readonly janelaMs: number) {}

  /** Segundos até liberar, ou 0 se a chave pode tentar agora. */
  bloqueadoPor(chave: string, agora = Date.now()): number {
    const j = this.janelas.get(chave)
    if (!j) return 0
    if (agora - j.inicio >= this.janelaMs) {
      this.janelas.delete(chave)
      return 0
    }
    return j.falhas >= this.maxFalhas ? Math.ceil((j.inicio + this.janelaMs - agora) / 1000) : 0
  }

  registrarFalha(chave: string, agora = Date.now()): void {
    const j = this.janelas.get(chave)
    if (!j || agora - j.inicio >= this.janelaMs) this.janelas.set(chave, { falhas: 1, inicio: agora })
    else j.falhas++
    if (this.janelas.size > 10_000) this.limpar(agora)
  }

  limparChave(chave: string): void {
    this.janelas.delete(chave)
  }

  private limpar(agora: number) {
    for (const [k, j] of this.janelas) if (agora - j.inicio >= this.janelaMs) this.janelas.delete(k)
  }
}
