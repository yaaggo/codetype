import React, { useState, useEffect } from 'react';
import { getAlgorithms, saveCustomAlgorithm } from '../data/storage';
import { Folder, FileCode, Plus, ChevronRight, ChevronDown } from 'lucide-react';

const Library = () => {
    const [algos, setAlgos] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newAlgo, setNewAlgo] = useState({ title: '', group: '', code: '' });
    const [expandedGroups, setExpandedGroups] = useState({});

    useEffect(() => {
        setAlgos(getAlgorithms());
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newAlgo.title || !newAlgo.code) return;

        const algo = {
            id: 'custom-' + Date.now(),
            type: 'snippet',
            ...newAlgo
        };

        saveCustomAlgorithm(algo);
        setAlgos(getAlgorithms());
        setShowForm(false);
        setNewAlgo({ title: '', group: '', code: '' });
    };

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    // Group algorithms
    const groups = algos.reduce((acc, algo) => {
        const group = algo.group || 'Uncategorized';
        if (!acc[group]) acc[group] = [];
        acc[group].push(algo);
        return acc;
    }, {});

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Library</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 500
                    }}
                >
                    <Plus size={20} /> Add Algorithm
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    background: 'var(--bg-surface)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '30px',
                    border: '1px solid var(--bg-surface-hover)'
                }}>
                    <h3 style={{ marginBottom: '20px' }}>Add New Algorithm</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <input
                                type="text"
                                placeholder="Title (e.g. Dijkstra)"
                                value={newAlgo.title}
                                onChange={e => setNewAlgo({ ...newAlgo, title: e.target.value })}
                                style={{ padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--bg-surface-hover)', color: 'white', borderRadius: 'var(--radius-sm)' }}
                            />
                            <input
                                type="text"
                                placeholder="Group / Category (e.g. Graph)"
                                value={newAlgo.group}
                                onChange={e => setNewAlgo({ ...newAlgo, group: e.target.value })}
                                style={{ padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--bg-surface-hover)', color: 'white', borderRadius: 'var(--radius-sm)' }}
                            />
                        </div>
                        <textarea
                            placeholder="Paste C++ Code here..."
                            value={newAlgo.code}
                            onChange={e => setNewAlgo({ ...newAlgo, code: e.target.value })}
                            style={{
                                padding: '12px',
                                background: 'var(--bg-app)',
                                border: '1px solid var(--bg-surface-hover)',
                                color: 'white',
                                borderRadius: 'var(--radius-sm)',
                                minHeight: '200px',
                                fontFamily: 'var(--font-mono)'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={{ padding: '10px 20px', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{ background: 'var(--color-success)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-sm)' }}
                            >
                                Save Algorithm
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div style={{ display: 'grid', gap: '15px' }}>
                {Object.entries(groups).map(([groupName, items]) => (
                    <div key={groupName} style={{
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--bg-surface-hover)'
                    }}>
                        <div
                            onClick={() => toggleGroup(groupName)}
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                background: expandedGroups[groupName] ? 'var(--bg-surface-hover)' : 'transparent',
                                transition: 'background 0.2s'
                            }}
                        >
                            {expandedGroups[groupName] ? <ChevronDown size={20} color="var(--text-muted)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                            <Folder size={20} color="var(--color-primary)" />
                            <span style={{ fontWeight: 500, flex: 1 }}>{groupName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{items.length} items</span>
                        </div>

                        {expandedGroups[groupName] && (
                            <div style={{ borderTop: '1px solid var(--bg-surface-hover)' }}>
                                {items.map(algo => (
                                    <div key={algo.id} style={{
                                        padding: '12px 20px 12px 52px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: '1px solid var(--bg-app)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FileCode size={16} color="var(--text-secondary)" />
                                            <span>{algo.title}</span>
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                            {algo.code.length} chars
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Library;
