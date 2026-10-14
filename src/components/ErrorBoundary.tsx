import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("Erro não tratado na interface:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <h1 className="text-lg font-bold text-foreground">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">Ocorreu um erro inesperado ao carregar esta página.</p>
            <button
              onClick={() => window.location.reload()}
              className="gradient-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
