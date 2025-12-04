import React, { useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const DebugStorage = () => {
    useEffect(() => {
        console.log('=== STORAGE DEBUG ===');
        console.log('Custom Algorithms:', localStorage.getItem('codetype_custom_algos'));
        console.log('Progress:', localStorage.getItem('codetype_progress'));
        console.log('Streak:', localStorage.getItem('codetype_streak'));
        console.log('Folders:', localStorage.getItem('codetype_folders'));
        console.log('Deleted Defaults:', localStorage.getItem('codetype_deleted_default'));
        console.log('All codetype keys:', Object.keys(localStorage).filter(k => k.startsWith('codetype')));
    }, []);

    const clearAllData = () => {
        if (window.confirm('Tem certeza que quer limpar TODOS os dados? Isso não pode ser desfeito!')) {
            Object.keys(localStorage).filter(k => k.startsWith('codetype')).forEach(key => {
                localStorage.removeItem(key);
            });
            window.location.reload();
        }
    };

    const exportData = () => {
        const data = {};
        Object.keys(localStorage).filter(k => k.startsWith('codetype')).forEach(key => {
            data[key] = localStorage.getItem(key);
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codetype-backup-${Date.now()}.json`;
        a.click();
    };

    const importData = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                });
                alert('Dados importados com sucesso!');
                window.location.reload();
            } catch (error) {
                alert('Erro ao importar dados: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--bg-surface)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--bg-surface-hover)',
            zIndex: 9999,
            minWidth: '250px'
        }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1rem' }}>🔧 Debug Storage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                    onClick={exportData}
                    style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem'
                    }}
                >
                    📥 Exportar Dados
                </button>

                <label style={{
                    background: 'var(--color-success)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}>
                    📤 Importar Dados
                    <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        style={{ display: 'none' }}
                    />
                </label>

                <button
                    onClick={clearAllData}
                    style={{
                        background: 'var(--color-error)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center'
                    }}
                >
                    <Trash2 size={16} /> Limpar Tudo
                </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                Abra o console (F12) para ver os dados
            </p>
        </div>
    );
};

export default DebugStorage;
