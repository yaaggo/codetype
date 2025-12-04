import React, { useState } from 'react';
import { Home, Keyboard, Code2, Menu, X } from 'lucide-react';

const Layout = ({ children, currentView, setView }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'monkey', label: 'Typing Mode', icon: Keyboard },
    ];

    const handleNavClick = (id) => {
        setView(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', position: 'relative' }}>
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                    display: 'none',
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 1001,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-surface-hover)',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                }}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        display: 'none',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999
                    }}
                />
            )}

            <aside
                className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
                style={{
                    width: '260px',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid var(--bg-surface-hover)',
                    position: 'relative',
                    zIndex: 1000
                }}
            >
                <div style={{
                    marginBottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 12px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Code2 size={24} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.5px'
                    }}>
                        CodeType
                    </h1>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                style={{
                                    textAlign: 'left',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                                    color: isActive ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                <Icon size={20} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
