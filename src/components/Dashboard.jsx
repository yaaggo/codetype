import React, { useEffect, useState } from 'react';
import { getStreak } from '../data/storage';

const Dashboard = ({ setView }) => {
    const [streak, setStreak] = useState({ count: 0 });

    useEffect(() => {
        setStreak(getStreak());
    }, []);

    return (
        <div>
            <header style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome back, Coder</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Ready to crush some algorithms today?</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <div style={{
                    background: 'var(--bg-surface)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--bg-surface-hover)'
                }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px' }}>Current Streak</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                        🔥 {streak.count} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>days</span>
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: '20px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '20px' }}>
                <button
                    onClick={() => setView('monkey')}
                    style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '16px 32px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        fontSize: '1.1rem'
                    }}
                >
                    Start Typing Practice
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
