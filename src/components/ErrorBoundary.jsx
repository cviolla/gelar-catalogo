import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h1 style={{ color: '#ef4444' }}>Ops! Ocorreu um erro.</h1>
                    <p>O aplicativo encontrou um problema inesperado.</p>
                    <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxWidth: '80%', margin: '1rem 0', color: '#cbd5e1', fontSize: '0.8rem' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={this.handleReset}
                        style={{ padding: '10px 20px', background: '#38bdf8', color: '#000', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Resetar Aplicativo (Limpar Dados)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
