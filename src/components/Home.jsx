import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';
import { getAlgorithms, saveCustomAlgorithm, updateAlgorithm, bulkUpdateAlgorithms, deleteAlgorithm, getStreak, getProgress, getFolders, saveFolder, deleteFolder } from '../data/database';
import { Folder, FileCode, Plus, ChevronRight, ChevronDown, Play, Trash2, Flame, Brain, Trophy, Pencil, FolderPlus, FileText, Save, GripVertical, X, BookOpen } from 'lucide-react';
const Home = ({ setView, setTargetAlgo }) => {
    const [algos, setAlgos] = useState([]);
    const [folders, setFolders] = useState({});
    const [progress, setProgress] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editingAlgo, setEditingAlgo] = useState(null);
    const [newAlgo, setNewAlgo] = useState({ title: '', group: '', kind: 'algorithm', code: '' });
    const [expandedPaths, setExpandedPaths] = useState({});
    const [streak, setStreak] = useState({ count: 0 });
    const [dueCount, setDueCount] = useState(0);

    const [editingMarkdownPath, setEditingMarkdownPath] = useState(null);
    const [markdownContent, setMarkdownContent] = useState('');
    const [viewingDocPath, setViewingDocPath] = useState(null); // Path of folder being viewed

    // DnD State
    const [dragOverItem, setDragOverItem] = useState(null); // { id: string, position: 'top' | 'bottom' | 'inside' }

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [algosData, foldersData, streakData, progressData] = await Promise.all([
            getAlgorithms(),
            getFolders(),
            getStreak(),
            getProgress()
        ]);

        setAlgos(algosData);
        setFolders(foldersData);
        setStreak(streakData);
        setProgress(progressData);

        const now = new Date();
        let count = 0;
        Object.values(progressData).forEach(p => {
            if (p.dueDate && new Date(p.dueDate) <= now) count++;
        });
        setDueCount(count);
    };

    const stripCommentsAndSpaces = (code) => {
        let clean = code.replace(/\/\/.*$/gm, '');
        clean = clean.replace(/\/\*[\s\S]*?\*\//g, '');
        return clean
            .split('\n')
            .map(line => line.trimEnd())
            .filter(line => line.trim() !== '')
            .join('\n');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newAlgo.title || !newAlgo.code) return;

        const cleanCode = stripCommentsAndSpaces(newAlgo.code);
        let finalGroup = newAlgo.group.trim();
        if (finalGroup.endsWith('/')) finalGroup = finalGroup.slice(0, -1);

        try {
            if (editingAlgo) {
                const updated = {
                    ...editingAlgo,
                    title: newAlgo.title,
                    group: finalGroup || 'Uncategorized',
                    kind: newAlgo.kind,
                    code: cleanCode
                };
                await updateAlgorithm(updated);
            } else {
                const algo = {
                    id: 'custom-' + Date.now(),
                    type: 'snippet',
                    title: newAlgo.title,
                    group: finalGroup || 'Uncategorized',
                    kind: newAlgo.kind,
                    code: cleanCode,
                    sort_order: 0
                };
                await saveCustomAlgorithm(algo);
            }

            await loadData();
            setShowForm(false);
            setEditingAlgo(null);
            setNewAlgo({ title: '', group: '', kind: 'algorithm', code: '' });
        } catch (error) {
            alert('Error saving algorithm: ' + error.message);
        }
    };

    const handleCreateFolder = async (path) => {
        const name = prompt("Enter folder name:");
        if (name) {
            const newPath = path ? `${path}/${name}` : name;
            await saveFolder(newPath, '');
            await loadData();
            setExpandedPaths(prev => ({ ...prev, [path]: true }));
        }
    };

    const handleEditMarkdown = (path, currentContent) => {
        setEditingMarkdownPath(path);
        setMarkdownContent(currentContent || '');
    };

    const handleSaveMarkdown = async (path) => {
        await saveFolder(path, markdownContent);
        setEditingMarkdownPath(null);
        await loadData();
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (e, id, type = 'algo') => {
        if (type === 'folder') {
            e.dataTransfer.setData('folderPath', id);
        } else {
            e.dataTransfer.setData('algoId', id);
        }
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, targetId, type) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        if (type === 'folder') {
            if (dragOverItem?.id !== targetId || dragOverItem?.position !== 'inside') {
                setDragOverItem({ id: targetId, position: 'inside' });
            }
            e.currentTarget.style.background = 'var(--bg-surface-hover)';
        } else {
            // Item reordering
            const position = y < rect.height / 2 ? 'top' : 'bottom';
            if (dragOverItem?.id !== targetId || dragOverItem?.position !== position) {
                setDragOverItem({ id: targetId, position });
            }
        }
    };

    const handleDragLeave = (e) => {
        // Prevent flickering when dragging over children
        if (e.currentTarget.contains(e.relatedTarget)) return;

        e.currentTarget.style.background = 'transparent';
        setDragOverItem(null);
    };

    const handleDrop = (e, targetId, type, targetPath, siblings = []) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.background = 'transparent';
        setDragOverItem(null);

        const algoId = e.dataTransfer.getData('algoId');
        const folderPath = e.dataTransfer.getData('folderPath');

        // Handle Folder Move
        if (folderPath) {
            if (folderPath === targetPath) return; // Can't drop on itself
            if (targetPath.startsWith(folderPath)) return; // Can't drop parent into child

            const folderName = folderPath.split('/').pop();
            const newPath = targetPath ? `${targetPath}/${folderName}` : folderName;

            if (folderPath === newPath) return;

            moveFolder(folderPath, newPath)
                .then(() => loadData())
                .then(() => {
                    setExpandedPaths(prev => {
                        const next = { ...prev };
                        delete next[folderPath];
                        next[newPath] = true;
                        return next;
                    });
                })
                .catch(err => alert('Error moving folder: ' + err.message));
            return;
        }

        // Handle Algorithm Move
        if (!algoId) return;

        // Prevent dropping on itself
        if (algoId === targetId) return;

        const sourceAlgo = algos.find(a => a.id === algoId);
        if (!sourceAlgo) return;

        if (!sourceAlgo.id.startsWith('custom-')) {
            alert("Cannot move default algorithms.");
            return;
        }

        if (type === 'folder') {
            // Move to folder
            if (sourceAlgo.group !== targetPath) {
                // Call async function without await - don't block UI
                updateAlgorithm({ ...sourceAlgo, group: targetPath })
                    .then(() => loadData())
                    .then(() => {
                        setExpandedPaths(prev => ({ ...prev, [targetPath]: true }));
                    })
                    .catch(err => console.error('Error moving algorithm:', err));
            }
        } else {
            // Reorder
            const targetAlgo = algos.find(a => a.id === targetId);
            if (!targetAlgo) return;

            // Filter siblings to only include those in the same group
            const groupSiblings = siblings.sort((a, b) => (a.order || 0) - (b.order || 0));

            const sourceIndex = groupSiblings.findIndex(a => a.id === algoId);
            let targetIndex = groupSiblings.findIndex(a => a.id === targetId);

            // Remove source from list
            const listWithoutSource = groupSiblings.filter(a => a.id !== algoId);

            // Adjust target index because source was removed
            if (sourceIndex !== -1 && sourceIndex < targetIndex) targetIndex--;

            // Insert at new position
            if (dragOverItem?.position === 'bottom') {
                listWithoutSource.splice(targetIndex + 1, 0, sourceAlgo);
            } else {
                listWithoutSource.splice(targetIndex, 0, sourceAlgo);
            }

            // Update orders
            const updates = listWithoutSource.map((a, index) => ({
                id: a.id,
                order: index,
                group: targetPath // Ensure group matches target
            }));

            // Call async function without await - don't block UI
            bulkUpdateAlgorithms(updates)
                .then(() => loadData())
                .catch(err => console.error('Error reordering algorithms:', err));
        }
    };

    // --- Tree Building Logic ---
    const buildTree = (algorithms, explicitFolders) => {
        const root = { name: 'root', path: '', algorithms: [], subgroups: {}, markdown: '' };

        // 1. Add explicit folders
        Object.keys(explicitFolders).forEach(path => {
            const parts = path.split('/');
            let current = root;
            let currentPath = '';
            parts.forEach(part => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!current.subgroups[part]) {
                    current.subgroups[part] = {
                        name: part,
                        path: currentPath,
                        algorithms: [],
                        subgroups: {},
                        markdown: explicitFolders[currentPath]?.markdown || ''
                    };
                }
                current = current.subgroups[part];
            });
        });

        // 2. Add algorithms
        // Sort by order first
        const sortedAlgos = [...algorithms].sort((a, b) => (a.order || 0) - (b.order || 0));

        sortedAlgos.forEach(algo => {
            const groupParts = (algo.group || 'Uncategorized').split('/').filter(p => p.trim() !== '');
            let current = root;
            let currentPath = '';

            groupParts.forEach(part => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!current.subgroups[part]) {
                    current.subgroups[part] = {
                        name: part,
                        path: currentPath,
                        algorithms: [],
                        subgroups: {},
                        markdown: explicitFolders[currentPath]?.markdown || ''
                    };
                }
                current = current.subgroups[part];
            });

            current.algorithms.push(algo);
        });

        return root;
    };

    const tree = buildTree(algos, folders);

    // --- Recursive Component ---
    const CategoryNode = ({ node, level = 0 }) => {
        const isExpanded = expandedPaths[node.path];
        const hasChildren = Object.keys(node.subgroups).length > 0 || node.algorithms.length > 0;

        const getAllAlgos = (n) => {
            let all = [...n.algorithms];
            Object.values(n.subgroups).forEach(sub => {
                all = [...all, ...getAllAlgos(sub)];
            });
            return all;
        };
        const allChildAlgos = getAllAlgos(node);

        if (level === 0) {
            return (
                <div style={{ display: 'grid', gap: '15px' }}>
                    <div
                        onDragOver={(e) => handleDragOver(e, 'root', 'folder')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'root', 'folder', 'Uncategorized')}
                        style={{
                            padding: '10px',
                            border: '2px dashed var(--bg-surface-hover)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            marginBottom: '10px',
                            background: dragOverItem?.id === 'root' ? 'var(--bg-surface-hover)' : 'transparent'
                        }}
                    >
                        Drop here to move to Uncategorized
                    </div>

                    {Object.values(node.subgroups).map(sub => (
                        <CategoryNode key={sub.path} node={sub} level={level + 1} />
                    ))}
                    {node.algorithms.length > 0 && (
                        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                            {node.algorithms.map(algo => (
                                <AlgorithmItem
                                    key={algo.id}
                                    algo={algo}
                                    siblings={node.algorithms}
                                    groupPath={node.path || 'Uncategorized'}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div
                style={{
                    background: level === 1 ? 'var(--bg-surface)' : 'transparent',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: level === 1 ? '1px solid var(--bg-surface-hover)' : 'none',
                    marginLeft: level > 1 ? '20px' : '0',
                    borderLeft: level > 1 ? '1px solid var(--bg-surface-hover)' : 'none'
                }}
                onDragOver={(e) => handleDragOver(e, node.path, 'folder')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, node.path, 'folder', node.path)}
            >
                <div
                    draggable
                    onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, node.path, 'folder');
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPaths(prev => ({ ...prev, [node.path]: !prev[node.path] }));
                    }}
                    style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'grab',
                        background: dragOverItem?.id === node.path ? 'var(--bg-surface-hover)' : (isExpanded ? 'var(--bg-surface-hover)' : 'transparent'),
                        transition: 'background 0.2s'
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={20} color="var(--text-muted)" /> : <ChevronRight size={20} color="var(--text-muted)" />
                    ) : <div style={{ width: 20 }} />}

                    <Folder size={20} color="var(--color-primary)" />
                    <span style={{ fontWeight: 500, flex: 1 }}>{node.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{allChildAlgos.length} items</span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCreateFolder(node.path); }}
                            title="New Subfolder"
                            style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '4px' }}
                        >
                            <FolderPlus size={16} />
                        </button>
                        {/* Edit Markdown */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEditMarkdown(node.path, node.markdown); }}
                            title="Edit Documentation"
                            style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '4px' }}
                        >
                            <Pencil size={16} />
                        </button>
                        {/* View Documentation */}
                        {node.markdown && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setViewingDocPath(node.path); }}
                                title="View Documentation"
                                style={{ padding: '6px', color: 'var(--color-primary)', borderRadius: '4px' }}
                            >
                                <BookOpen size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div style={{ borderTop: level === 1 ? '1px solid var(--bg-surface-hover)' : 'none' }}>
                        {/* Markdown Editor (Inline) */}
                        {editingMarkdownPath === node.path && (
                            <div style={{ padding: '20px', background: 'var(--bg-app)', borderBottom: '1px solid var(--bg-surface-hover)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <textarea
                                        value={markdownContent}
                                        onChange={e => setMarkdownContent(e.target.value)}
                                        placeholder="Write documentation in Markdown..."
                                        style={{
                                            width: '100%',
                                            minHeight: '150px',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--bg-surface-hover)',
                                            padding: '10px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setEditingMarkdownPath(null)} style={{ color: 'var(--text-muted)' }}>Cancel</button>
                                        <button onClick={() => handleSaveMarkdown(node.path)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-success)', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                                            <Save size={14} /> Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {Object.values(node.subgroups).map(sub => (
                            <CategoryNode key={sub.path} node={sub} level={level + 1} />
                        ))}
                        {node.algorithms.map(algo => (
                            <AlgorithmItem
                                key={algo.id}
                                algo={algo}
                                siblings={node.algorithms}
                                groupPath={node.path}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const AlgorithmItem = ({ algo, siblings, groupPath }) => {
        const p = progress[algo.id] || {};
        const bestWpm = p.bestWpm || 0;

        const isDragOver = dragOverItem?.id === algo.id;
        const dragPos = dragOverItem?.position;

        return (
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, algo.id)}
                onDragOver={(e) => handleDragOver(e, algo.id, 'item')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, algo.id, 'item', groupPath, siblings)}
                style={{
                    padding: '12px 20px 12px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                    paddingLeft: '40px',
                    cursor: 'grab',
                    position: 'relative',
                    borderTop: isDragOver && dragPos === 'top' ? '2px solid var(--color-primary)' : 'none',
                    borderBottom: isDragOver && dragPos === 'bottom' ? '2px solid var(--color-primary)' : '1px solid var(--bg-app)',
                }}
                className="algo-item"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GripVertical size={16} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                    <FileCode size={16} color="var(--text-secondary)" />
                    <span>{algo.title}</span>
                    <span style={{
                        fontSize: '0.75rem',
                        background: 'var(--bg-app)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--bg-surface-hover)'
                    }}>
                        {algo.kind === 'structure' ? 'Structure' : 'Algorithm'}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {bestWpm > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)', fontSize: '0.9rem' }}>
                            <Trophy size={14} />
                            <span>{bestWpm} WPM</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            {algo.code.length} chars
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setTargetAlgo(algo); setView('monkey'); }}
                            title="Practice"
                            style={{
                                padding: '6px',
                                borderRadius: '4px',
                                color: 'var(--color-success)',
                                background: 'rgba(34, 197, 94, 0.1)'
                            }}
                        >
                            <Play size={16} />
                        </button>
                        {algo.id.startsWith('custom-') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAlgo(algo);
                                    setNewAlgo({
                                        title: algo.title,
                                        group: algo.group || '',
                                        kind: algo.kind || 'algorithm',
                                        code: algo.code
                                    });
                                    setShowForm(true);
                                }}
                                title="Edit"
                                style={{
                                    padding: '6px',
                                    borderRadius: '4px',
                                    color: 'var(--color-primary)',
                                    background: 'rgba(99, 102, 241, 0.1)'
                                }}
                            >
                                <Pencil size={16} />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete?')) {
                                    deleteAlgorithm(algo.id);
                                    loadData();
                                }
                            }}
                            title="Delete"
                            style={{
                                padding: '6px',
                                borderRadius: '4px',
                                color: 'var(--color-error)',
                                background: 'rgba(239, 68, 68, 0.1)'
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const getAllPaths = (node) => {
        let paths = node.path ? [node.path] : [];
        Object.values(node.subgroups).forEach(sub => {
            paths = [...paths, ...getAllPaths(sub)];
        });
        return paths;
    };
    const existingGroups = getAllPaths(tree).sort();

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            const lines = value.split('\n');

            // Find start and end lines
            let startLineIndex = 0;
            let charCount = 0;
            for (let i = 0; i < lines.length; i++) {
                if (charCount + lines[i].length + 1 > start) {
                    startLineIndex = i;
                    break;
                }
                charCount += lines[i].length + 1;
            }

            let endLineIndex = 0;
            charCount = 0;
            for (let i = 0; i < lines.length; i++) {
                if (charCount + lines[i].length + 1 >= end) {
                    endLineIndex = i;
                    break;
                }
                charCount += lines[i].length + 1;
            }

            if (e.shiftKey) {
                // Unindent
                const newLines = lines.map((line, i) => {
                    if (i >= startLineIndex && i <= endLineIndex) {
                        return line.startsWith('  ') ? line.slice(2) : line;
                    }
                    return line;
                });

                const newValue = newLines.join('\n');
                setNewAlgo({ ...newAlgo, code: newValue });

                // Restore selection (approximate)
                setTimeout(() => {
                    textarea.selectionStart = start - 2;
                    textarea.selectionEnd = end - 2;
                }, 0);
            } else {
                // Indent
                if (start !== end) {
                    // Multi-line indent
                    const newLines = lines.map((line, i) => {
                        if (i >= startLineIndex && i <= endLineIndex) {
                            return '  ' + line;
                        }
                        return line;
                    });
                    setNewAlgo({ ...newAlgo, code: newLines.join('\n') });
                } else {
                    // Single line indent
                    const newValue = value.substring(0, start) + '  ' + value.substring(end);
                    setNewAlgo({ ...newAlgo, code: newValue });

                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + 2;
                    }, 0);
                }
            }
        }
    };

    return (
        <div>
            {/* Stats Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <div style={{
                    background: 'var(--bg-surface)',
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--bg-surface-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '10px', borderRadius: '50%' }}>
                        <Flame size={24} color="var(--color-warning)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{streak.count}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Day Streak</div>
                    </div>
                </div>


            </div>

            {/* Library Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Library</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => handleCreateFolder('')}
                        style={{
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            padding: '12px 24px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 500,
                            border: '1px solid var(--bg-surface-hover)',
                            transition: 'background 0.2s'
                        }}
                    >
                        <FolderPlus size={20} /> New Folder
                    </button>
                    <button
                        onClick={() => {
                            setEditingAlgo(null);
                            setNewAlgo({ title: '', group: '', kind: 'algorithm', code: '' });
                            setShowForm(!showForm);
                        }}
                        style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 500,
                            transition: 'background 0.2s'
                        }}
                    >
                        <Plus size={20} /> Add Algorithm
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    background: 'var(--bg-surface)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '30px',
                    border: '1px solid var(--bg-surface-hover)'
                }}>
                    <h3 style={{ marginBottom: '20px' }}>{editingAlgo ? 'Edit Algorithm' : 'Add New Algorithm'}</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                            <input
                                type="text"
                                placeholder="Title (e.g. Dijkstra)"
                                value={newAlgo.title}
                                onChange={e => setNewAlgo({ ...newAlgo, title: e.target.value })}
                                style={{ padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--bg-surface-hover)', color: 'white', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                            />
                            <div>
                                <input
                                    type="text"
                                    list="group-options"
                                    placeholder="Group (e.g. Graph/Traversal)"
                                    value={newAlgo.group}
                                    onChange={e => setNewAlgo({ ...newAlgo, group: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--bg-surface-hover)', color: 'white', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                                />
                                <datalist id="group-options">
                                    {existingGroups.map(g => <option key={g} value={g} />)}
                                </datalist>
                            </div>
                            <select
                                value={newAlgo.kind}
                                onChange={e => setNewAlgo({ ...newAlgo, kind: e.target.value })}
                                style={{ padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--bg-surface-hover)', color: 'white', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                            >
                                <option value="algorithm">Algorithm</option>
                                <option value="structure">Data Structure</option>
                            </select>
                        </div>
                        <textarea
                            placeholder="Paste C++ Code here..."
                            value={newAlgo.code}
                            onChange={e => setNewAlgo({ ...newAlgo, code: e.target.value })}
                            onKeyDown={handleKeyDown}
                            style={{
                                padding: '12px',
                                background: 'var(--bg-app)',
                                border: '1px solid var(--bg-surface-hover)',
                                color: 'white',
                                borderRadius: 'var(--radius-sm)',
                                minHeight: '200px',
                                fontFamily: 'var(--font-mono)',
                                outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingAlgo(null);
                                }}
                                style={{ padding: '10px 20px', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{ background: 'var(--color-success)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-sm)' }}
                            >
                                {editingAlgo ? 'Update Algorithm' : 'Save Algorithm'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <CategoryNode node={tree} level={0} />

            {/* Documentation Modal */}
            {viewingDocPath && folders[viewingDocPath] && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setViewingDocPath(null)}>
                    <div style={{
                        background: '#0d1117', // GitHub dark mode bg
                        width: '800px',
                        maxWidth: '90vw',
                        height: '80vh',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        border: '1px solid #30363d',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid #30363d',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#161b22'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#c9d1d9' }}>
                                {viewingDocPath.split('/').pop()} - Documentation
                            </h3>
                            <button
                                onClick={() => setViewingDocPath(null)}
                                style={{ color: '#8b949e', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{
                            padding: '30px',
                            overflowY: 'auto',
                            color: '#c9d1d9',
                            flex: 1
                        }}>
                            <div className="markdown-body" style={{ background: 'transparent' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                    {folders[viewingDocPath].markdown}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
