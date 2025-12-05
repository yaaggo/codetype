import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getAlgorithms, saveWpm, getProgress } from '../data/database';
import { getSyntaxHighlights } from '../utils/syntax';
import { Shuffle, List, RotateCcw, ArrowRight, CheckCircle2, Trophy } from 'lucide-react';

const MonkeyMode = ({ targetAlgo }) => {
    const [algos, setAlgos] = useState([]);
    const [mode, setMode] = useState(targetAlgo ? 'select' : 'random');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [currentAlgo, setCurrentAlgo] = useState(targetAlgo || null);
    const [bestWpm, setBestWpm] = useState(0);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const [input, setInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [stats, setStats] = useState({ wpm: 0, accuracy: 100 });

    const inputRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            const all = await getAlgorithms();
            setAlgos(all);

            if (!currentAlgo && all.length > 0) {
                const random = all[Math.floor(Math.random() * all.length)];
                setCurrentAlgo(random);
            }
        };
        loadData();

        // Auto-focus on mount
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        const loadProgress = async () => {
            if (currentAlgo) {
                const progress = await getProgress();
                const p = progress[currentAlgo.id] || {};
                setBestWpm(p.bestWpm || 0);
            }
        };
        loadProgress();

        // Focus when algo changes
        if (inputRef.current) inputRef.current.focus();
    }, [currentAlgo]);

    useEffect(() => {
        if (completed) return;
        if (currentAlgo && input.length === currentAlgo.code.length) {
            finishTest();
        }
    }, [input, currentAlgo]);

    useEffect(() => {
        if (!completed) return;

        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                reset();
            } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Only trigger if no modifiers (other than shift, maybe? 'r' usually implies lowercase, but let's be safe)
                // Actually user said 'r', so let's check for 'r' or 'R'.
                if (mode === 'random') {
                    nextRandom();
                } else {
                    reset();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [completed, mode, algos]); // Depend on mode and algos for nextRandom

    const syntaxStyles = useMemo(() => {
        if (!currentAlgo) return [];
        return getSyntaxHighlights(currentAlgo.code);
    }, [currentAlgo]);

    const groups = algos.reduce((acc, algo) => {
        const group = algo.group || 'Uncategorized';
        if (!acc[group]) acc[group] = [];
        acc[group].push(algo);
        return acc;
    }, {});

    const handleKeyDown = (e) => {
        if (completed) return;

        if (!startTime) {
            setStartTime(Date.now());
        }

        // Handle special keys that might not trigger onChange or need specific behavior
        if (e.key === 'Backspace') {
            setInput(prev => prev.slice(0, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault(); // Prevent textarea newline
            let nextInput = input + '\n';

            // Auto-indent: check if the next line in the original code starts with spaces
            if (nextInput.length < currentAlgo.code.length) {
                const targetSlice = currentAlgo.code.slice(nextInput.length);
                const match = targetSlice.match(/^ +/);
                if (match) {
                    nextInput += match[0];
                }
            }

            setInput(nextInput);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                reset();
            } else {
                setInput(prev => prev + '    ');
            }
        }
        // Note: Normal characters are handled by onChange to support mobile virtual keyboards better
    };

    const handleChange = (e) => {
        if (completed) return;

        if (!startTime) {
            setStartTime(Date.now());
        }

        const value = e.target.value;
        // We only care about the last character added if it's an addition
        // But since we control the value, we can just check the difference
        // However, for simplicity in this specific "typing test" context where we track exact string:

        // Actually, simpler approach for mobile:
        // The textarea is hidden and empty? No, if we keep it empty, backspace is hard.
        // Let's try to just capture the input data.

        const nativeEvent = e.nativeEvent;
        if (nativeEvent.inputType === 'insertText' && nativeEvent.data) {
            setInput(prev => prev + nativeEvent.data);
        }

        // Reset textarea value to keep it clean for next input
        e.target.value = '';
    };

    const finishTest = async () => {
        setCompleted(true);
        const timeInMinutes = (Date.now() - startTime) / 60000;
        const words = currentAlgo.code.length / 5;
        const wpm = Math.round(words / timeInMinutes);

        let errors = 0;
        for (let i = 0; i < currentAlgo.code.length; i++) {
            if (input[i] !== currentAlgo.code[i]) errors++;
        }
        const accuracy = Math.round(((currentAlgo.code.length - errors) / currentAlgo.code.length) * 100);

        setStats({ wpm, accuracy });

        // Save WPM
        const isRecord = await saveWpm(currentAlgo.id, wpm);
        setIsNewRecord(isRecord);
        if (isRecord) setBestWpm(wpm);
    };

    const reset = () => {
        setInput('');
        setStartTime(null);
        setCompleted(false);
        setStats({ wpm: 0, accuracy: 100 });
        setIsNewRecord(false);
        if (inputRef.current) inputRef.current.focus();
    };

    const nextRandom = () => {
        const random = algos[Math.floor(Math.random() * algos.length)];
        setCurrentAlgo(random);
        reset();
    };

    const selectAlgo = (algo) => {
        setCurrentAlgo(algo);
        reset();
    };

    if (!currentAlgo) return <div>Loading...</div>;

    const lines = currentAlgo.code.split('\n');
    const inputLines = input.split('\n');
    const currentLineIndex = inputLines.length - 1;

    const VISIBLE_LINES = 12;
    const SCROLL_OFFSET = 4;

    let startLine = 0;
    if (currentLineIndex > SCROLL_OFFSET) {
        startLine = currentLineIndex - SCROLL_OFFSET;
    }
    if (startLine + VISIBLE_LINES > lines.length) {
        startLine = Math.max(0, lines.length - VISIBLE_LINES);
    }

    const visibleLines = lines.slice(startLine, startLine + VISIBLE_LINES);
    const remainingLines = Math.max(0, lines.length - (startLine + VISIBLE_LINES));

    return (
        <div style={{ outline: 'none', position: 'relative' }}>
            <textarea
                ref={inputRef}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    top: 0,
                    left: 0,
                    height: '1px',
                    width: '1px',
                    zIndex: -1,
                    pointerEvents: 'none',
                    resize: 'none'
                }}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
            />

            {/* Header Controls */}
            <div className="monkey-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                background: 'var(--bg-surface)',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--bg-surface-hover)'
            }}>
                <div className="monkey-controls-left" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                        <button
                            onClick={() => setMode('random')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-sm)',
                                background: mode === 'random' ? 'var(--bg-surface-hover)' : 'transparent',
                                color: mode === 'random' ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Shuffle size={16} /> Random
                        </button>
                        <button
                            onClick={() => setMode('select')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-sm)',
                                background: mode === 'select' ? 'var(--bg-surface-hover)' : 'transparent',
                                color: mode === 'select' ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontSize: '0.9rem'
                            }}
                        >
                            <List size={16} /> Select
                        </button>
                    </div>

                    {mode === 'select' && (
                        <div className="monkey-select-group" style={{ display: 'flex', gap: '10px' }}>
                            <select
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                value={selectedGroup || ''}
                                style={{
                                    background: 'var(--bg-app)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--bg-surface-hover)',
                                    padding: '8px',
                                    borderRadius: 'var(--radius-sm)'
                                }}
                            >
                                <option value="">Select Group...</option>
                                {Object.keys(groups).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>

                            {selectedGroup && (
                                <select
                                    onChange={(e) => selectAlgo(algos.find(a => a.id === e.target.value))}
                                    value={currentAlgo.id}
                                    style={{
                                        background: 'var(--bg-app)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--bg-surface-hover)',
                                        padding: '8px',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                >
                                    {groups[selectedGroup].map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                <div className="monkey-controls-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {bestWpm > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', fontWeight: 'bold' }}>
                            <Trophy size={20} />
                            <span>Best: {bestWpm} WPM</span>
                        </div>
                    )}

                    {mode === 'random' && (
                        <button
                            onClick={nextRandom}
                            style={{
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 500
                            }}
                        >
                            Next Random <ArrowRight size={16} />
                        </button>
                    )}

                    <button
                        onClick={reset}
                        title="Retry (Shift + Tab)"
                        style={{
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 500,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.background = 'var(--bg-surface-hover)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {currentAlgo.title}
                    <span style={{
                        fontSize: '0.8rem',
                        background: 'var(--bg-surface-hover)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        fontWeight: 'normal'
                    }}>
                        {currentAlgo.group}
                    </span>
                </h2>
            </div>

            {/* Code Viewport */}
            <div className="code-viewport" style={{
                position: 'relative',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.2rem',
                lineHeight: '1.6',
                background: 'var(--bg-surface)',
                padding: '40px',
                borderRadius: 'var(--radius-lg)',
                minHeight: '400px',
                whiteSpace: 'pre',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                cursor: 'text',
                border: isFocused ? '1px solid var(--color-primary)' : '1px solid transparent',
                transition: 'border 0.2s'
            }}
                onClick={() => inputRef.current && inputRef.current.focus()}
            >
                {visibleLines.map((line, relativeIndex) => {
                    const absoluteIndex = startLine + relativeIndex;

                    let globalCharIndex = 0;
                    for (let i = 0; i < absoluteIndex; i++) {
                        globalCharIndex += lines[i].length + 1;
                    }

                    return (
                        <div key={absoluteIndex} style={{ height: '1.6em', position: 'relative' }}>
                            {line.split('').map((char, charIndex) => {
                                const currentIndex = globalCharIndex + charIndex;
                                let color = 'var(--text-muted)';
                                let bg = 'transparent';
                                let isCursor = false;

                                const syntaxColor = syntaxStyles[currentIndex]?.color || '#d4d4d4';

                                if (currentIndex < input.length) {
                                    if (input[currentIndex] === char) {
                                        color = syntaxColor;
                                    } else {
                                        color = 'var(--color-error)';
                                        bg = 'rgba(239, 68, 68, 0.2)';
                                    }
                                } else if (currentIndex === input.length) {
                                    isCursor = true;
                                }

                                return (
                                    <span key={charIndex} style={{
                                        color,
                                        backgroundColor: bg,
                                        position: 'relative'
                                    }}>
                                        {char}
                                        {isCursor && isFocused && (
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '2px',
                                                background: 'var(--color-primary)',
                                                animation: 'blink 1s step-end infinite'
                                            }} />
                                        )}
                                    </span>
                                );
                            })}
                            {input.length === globalCharIndex + line.length && (
                                <span style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    height: '1.2em',
                                    verticalAlign: 'middle',
                                    width: '1ch'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '2px',
                                        background: 'var(--color-primary)',
                                        animation: 'blink 1s step-end infinite'
                                    }} />
                                </span>
                            )}
                        </div>
                    );
                })}

                {remainingLines > 0 && (
                    <div style={{
                        marginTop: '20px',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        borderTop: '1px solid var(--bg-surface-hover)',
                        paddingTop: '10px'
                    }}>
                        ... {remainingLines} more lines ...
                    </div>
                )}
            </div>

            <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

            {completed && (
                <div style={{
                    marginTop: '20px',
                    padding: '24px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-success)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div style={{ background: 'var(--color-success)', padding: '12px', borderRadius: '50%' }}>
                            <CheckCircle2 color="white" size={24} />
                        </div>
                        <div>
                            <h3 style={{ color: 'var(--color-success)', fontSize: '1.2rem', marginBottom: '4px' }}>
                                {isNewRecord ? '🏆 New Personal Best!' : 'Test Completed!'}
                            </h3>
                            <p style={{ color: 'var(--text-primary)' }}>
                                <span style={{ fontWeight: 'bold' }}>{stats.wpm}</span> WPM
                                <span style={{ margin: '0 10px', color: 'var(--text-muted)' }}>|</span>
                                <span style={{ fontWeight: 'bold' }}>{stats.accuracy}%</span> Accuracy
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={reset}
                            style={{
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                padding: '12px 24px',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: '1px solid var(--bg-surface-hover)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                        >
                            <RotateCcw size={16} /> Retry
                        </button>
                        <button
                            onClick={mode === 'random' ? nextRandom : reset}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
                        >
                            Next <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonkeyMode;
