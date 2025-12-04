import { algorithms as defaultAlgorithms } from './algorithms';

const KEYS = {
    PROGRESS: 'codetype_progress',
    CUSTOM_ALGOS: 'codetype_custom_algos',
    STREAK: 'codetype_streak',
    DELETED_DEFAULT: 'codetype_deleted_default',
    FOLDERS: 'codetype_folders'
};

export const getAlgorithms = () => {
    const custom = JSON.parse(localStorage.getItem(KEYS.CUSTOM_ALGOS) || '[]');
    const deletedDefaults = JSON.parse(localStorage.getItem(KEYS.DELETED_DEFAULT) || '[]');

    const activeDefaults = defaultAlgorithms.filter(a => !deletedDefaults.includes(a.id));

    // Merge and return. Note: Defaults don't have 'order' persisted unless we shadow them.
    // For now, we'll assume custom algos have 'order'. Defaults might need a wrapper if we want to reorder them.
    // But user mostly edits custom. Let's assume we can reorder custom. 
    // If we want to reorder defaults, we might need to store a "sort_order" map in localStorage.
    // Let's stick to updating the objects themselves for now.
    return [...activeDefaults, ...custom];
};

export const getFolders = () => {
    return JSON.parse(localStorage.getItem(KEYS.FOLDERS) || '{}');
};

export const saveFolder = (path, markdown = '') => {
    const folders = getFolders();
    folders[path] = { path, markdown };
    localStorage.setItem(KEYS.FOLDERS, JSON.stringify(folders));
};

export const deleteFolder = (path) => {
    const folders = getFolders();
    Object.keys(folders).forEach(k => {
        if (k === path || k.startsWith(path + '/')) {
            delete folders[k];
        }
    });
    localStorage.setItem(KEYS.FOLDERS, JSON.stringify(folders));
};

export const saveCustomAlgorithm = (algo) => {
    const custom = JSON.parse(localStorage.getItem(KEYS.CUSTOM_ALGOS) || '[]');
    // Assign a default order if not present (put at end)
    const maxOrder = custom.reduce((max, a) => Math.max(max, a.order || 0), 0);
    algo.order = maxOrder + 1;

    custom.push(algo);
    localStorage.setItem(KEYS.CUSTOM_ALGOS, JSON.stringify(custom));
};

export const updateAlgorithm = (updatedAlgo) => {
    if (updatedAlgo.id.startsWith('custom-')) {
        const custom = JSON.parse(localStorage.getItem(KEYS.CUSTOM_ALGOS) || '[]');
        const index = custom.findIndex(a => a.id === updatedAlgo.id);
        if (index !== -1) {
            custom[index] = updatedAlgo;
            localStorage.setItem(KEYS.CUSTOM_ALGOS, JSON.stringify(custom));
        }
    }
};

export const bulkUpdateAlgorithms = (updates) => {
    const custom = JSON.parse(localStorage.getItem(KEYS.CUSTOM_ALGOS) || '[]');
    let changed = false;

    updates.forEach(update => {
        if (update.id.startsWith('custom-')) {
            const index = custom.findIndex(a => a.id === update.id);
            if (index !== -1) {
                custom[index] = { ...custom[index], ...update };
                changed = true;
            }
        }
    });

    if (changed) {
        localStorage.setItem(KEYS.CUSTOM_ALGOS, JSON.stringify(custom));
    }
};

export const deleteAlgorithm = (id) => {
    if (id.startsWith('custom-')) {
        const custom = JSON.parse(localStorage.getItem(KEYS.CUSTOM_ALGOS) || '[]');
        const newCustom = custom.filter(a => a.id !== id);
        localStorage.setItem(KEYS.CUSTOM_ALGOS, JSON.stringify(newCustom));
    } else {
        const deleted = JSON.parse(localStorage.getItem(KEYS.DELETED_DEFAULT) || '[]');
        deleted.push(id);
        localStorage.setItem(KEYS.DELETED_DEFAULT, JSON.stringify(deleted));
    }
};

export const getProgress = () => {
    return JSON.parse(localStorage.getItem(KEYS.PROGRESS) || '{}');
};

export const saveProgress = (algoId, data) => {
    const progress = getProgress();
    progress[algoId] = { ...progress[algoId], ...data };
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
    updateStreak();
};

export const saveWpm = (algoId, wpm) => {
    const progress = getProgress();
    const current = progress[algoId] || {};
    const bestWpm = current.bestWpm || 0;

    if (wpm > bestWpm) {
        progress[algoId] = { ...current, bestWpm: wpm };
        localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
        return true;
    }
    return false;
};

export const getStreak = () => {
    const streakData = JSON.parse(localStorage.getItem(KEYS.STREAK) || '{"count": 0, "lastDate": null}');

    if (streakData.lastDate) {
        const last = new Date(streakData.lastDate);
        const now = new Date();
        const isToday = last.toDateString() === now.toDateString();
        const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === last.toDateString();

        if (!isToday && !isYesterday) {
            return { count: 0, lastDate: null };
        }
    }

    return streakData;
};

const updateStreak = () => {
    const streakData = JSON.parse(localStorage.getItem(KEYS.STREAK) || '{"count": 0, "lastDate": null}');
    const now = new Date();
    const todayStr = now.toDateString();

    if (streakData.lastDate) {
        const lastDate = new Date(streakData.lastDate).toDateString();
        if (lastDate !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate === yesterday.toDateString()) {
                streakData.count++;
            } else {
                streakData.count = 1;
            }
            streakData.lastDate = now.toISOString();
        }
    } else {
        streakData.count = 1;
        streakData.lastDate = now.toISOString();
    }

    localStorage.setItem(KEYS.STREAK, JSON.stringify(streakData));
};
