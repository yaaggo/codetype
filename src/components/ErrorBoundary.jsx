import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'var(--bg-app)',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        padding: '40px',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '500px',
                        textAlign: 'center',
                        border: '1px solid var(--bg-surface-hover)'
                    }}>
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '20px',
                            borderRadius: '50%',
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={40} color="var(--color-error)" />
                        </div>
                        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
                            Oops! Something went wrong
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
