import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Carbon Twin ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('carbontwin_database_v2');
      localStorage.removeItem('carbontwin_user');
      localStorage.removeItem('carbontwin_token');
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#061814',
          color: '#f8fafc',
          padding: '2rem',
          fontFamily: 'Inter, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            background: '#0a231d',
            border: '1px solid #13382f',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <AlertTriangle size={32} color="#f87171" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#ffffff' }}>
              Carbon Twin Runtime Notice
            </h2>

            <p style={{ fontSize: '0.925rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              An unexpected render issue occurred. The platform state can be restored automatically.
            </p>

            {this.state.error?.message && (
              <div style={{
                background: '#04110e',
                border: '1px solid #13382f',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.8rem',
                color: '#fca5a5',
                fontFamily: 'JetBrains Mono, monospace',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.75rem'
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> Reload Platform
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} /> Reset Local Cache
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
