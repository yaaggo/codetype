import { supabase } from '../lib/supabase.js';

// ========================================
// ALGORITHMS
// ========================================

export const getAlgorithms = async () => {
    try {
        const { data, error } = await supabase
            .from('algorithms')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching algorithms:', error);
        return [];
    }
};

export const saveCustomAlgorithm = async (algo) => {
    try {
        const { data, error } = await supabase
            .from('algorithms')
            .insert([algo])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving algorithm:', error);
        throw error;
    }
};

export const updateAlgorithm = async (updatedAlgo) => {
    try {
        const { data, error } = await supabase
            .from('algorithms')
            .update({
                title: updatedAlgo.title,
                group_path: updatedAlgo.group,
                kind: updatedAlgo.kind,
                code: updatedAlgo.code,
                updated_at: new Date().toISOString()
            })
            .eq('id', updatedAlgo.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating algorithm:', error);
        throw error;
    }
};

export const deleteAlgorithm = async (id) => {
    try {
        const { error } = await supabase
            .from('algorithms')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting algorithm:', error);
        throw error;
    }
};

export const bulkUpdateAlgorithms = async (updates) => {
    try {
        const promises = updates.map(update =>
            supabase
                .from('algorithms')
                .update({
                    group_path: update.group,
                    sort_order: update.order,
                    updated_at: new Date().toISOString()
                })
                .eq('id', update.id)
        );

        await Promise.all(promises);
    } catch (error) {
        console.error('Error bulk updating algorithms:', error);
        throw error;
    }
};

// ========================================
// FOLDERS
// ========================================

export const getFolders = async () => {
    try {
        const { data, error } = await supabase
            .from('folders')
            .select('*');

        if (error) throw error;

        // Convert array to object with path as key
        const foldersObj = {};
        data?.forEach(folder => {
            foldersObj[folder.path] = folder;
        });
        return foldersObj;
    } catch (error) {
        console.error('Error fetching folders:', error);
        return {};
    }
};

export const saveFolder = async (path, markdown = '') => {
    try {
        const { data, error } = await supabase
            .from('folders')
            .upsert({
                path,
                markdown,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving folder:', error);
        throw error;
    }
};

export const deleteFolder = async (path) => {
    try {
        // Delete folder and all subfolders
        const { error } = await supabase
            .from('folders')
            .delete()
            .or(`path.eq.${path},path.like.${path}/%`);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
    }
};

// ========================================
// USER PROGRESS
// ========================================

export const getProgress = async () => {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*');

        if (error) throw error;

        // Convert array to object with algorithm_id as key
        const progressObj = {};
        data?.forEach(p => {
            progressObj[p.algorithm_id] = {
                bestWpm: p.best_wpm,
                interval: p.interval,
                dueDate: p.due_date,
                lastReviewed: p.last_reviewed
            };
        });
        return progressObj;
    } catch (error) {
        console.error('Error fetching progress:', error);
        return {};
    }
};

export const saveProgress = async (algoId, data) => {
    try {
        const updateData = {
            algorithm_id: algoId,
            updated_at: new Date().toISOString()
        };

        if (data.interval !== undefined) updateData.interval = data.interval;
        if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
        if (data.lastReviewed !== undefined) updateData.last_reviewed = data.lastReviewed;

        const { error } = await supabase
            .from('user_progress')
            .upsert(updateData);

        if (error) throw error;

        // Update streak
        await updateStreak();
    } catch (error) {
        console.error('Error saving progress:', error);
        throw error;
    }
};

export const saveWpm = async (algoId, wpm) => {
    try {
        // Get current best WPM
        const { data: current } = await supabase
            .from('user_progress')
            .select('best_wpm')
            .eq('algorithm_id', algoId)
            .single();

        const currentBest = current?.best_wpm || 0;

        if (wpm > currentBest) {
            const { error } = await supabase
                .from('user_progress')
                .upsert({
                    algorithm_id: algoId,
                    best_wpm: wpm,
                    last_practiced: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving WPM:', error);
        return false;
    }
};

// ========================================
// STREAK & SETTINGS
// ========================================

export const getStreak = async () => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'streak')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No streak found, return default
                return { count: 0, lastDate: null };
            }
            throw error;
        }

        const streak = data?.value || { count: 0, lastDate: null };

        if (streak.lastDate) {
            const last = new Date(streak.lastDate);
            const now = new Date();
            const isToday = last.toDateString() === now.toDateString();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday = last.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday) {
                return { count: 0, lastDate: null };
            }
        }

        return streak;
    } catch (error) {
        console.error('Error fetching streak:', error);
        return { count: 0, lastDate: null };
    }
};

const updateStreak = async () => {
    try {
        const currentStreak = await getStreak();
        const now = new Date();
        const todayStr = now.toDateString();

        let newStreak = { ...currentStreak };

        if (currentStreak.lastDate) {
            const lastDate = new Date(currentStreak.lastDate).toDateString();
            if (lastDate !== todayStr) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastDate === yesterday.toDateString()) {
                    newStreak.count++;
                } else {
                    newStreak.count = 1;
                }
                newStreak.lastDate = now.toISOString();
            }
        } else {
            newStreak = { count: 1, lastDate: now.toISOString() };
        }

        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'streak',
                value: newStreak,
                updated_at: now.toISOString()
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error updating streak:', error);
    }
};
