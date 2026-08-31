'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary genérico para capturar erros em componentes filhos.
 * Previne que um erro em um componente quebre toda a aplicação.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    console.error('[ErrorBoundary] Erro capturado:', error.message, errorInfo.componentStack)
    this.props.onError?.(error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg text-center">
            <p className="text-red-700 font-semibold mb-2">Algo deu errado</p>
            <p className="text-red-500 text-sm mb-4">
              {this.state.error?.message ?? 'Erro inesperado ao carregar este componente.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}