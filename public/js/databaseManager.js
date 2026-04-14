(function (global) {
    const SUPABASE_URL = 'https://pyqznelkiujkmviedlha.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_TqBEuyZvC51pHJDVXAGk3Q_FigwHhN3';

    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
        console.error('Supabase SDK not loaded. Include https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 before databaseManager.js');
        global.DatabaseManager = null;
        return;
    }

    const supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const db = {
        supabase,
        // Canonical format for journal_entry date key.
        getTodayDate() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        async getUserByEmail(email) {
            const normalized = String(email || '').trim().toLowerCase();
            if (!normalized) {
                return { data: null, error: { message: 'Email is required.' } };
            }

            const { data, error } = await this.supabase
                .from('users')
                .select('id,email')
                .eq('email', normalized)
                .maybeSingle();

            return { data: data || null, error };
        },

        async ensureUserByEmail(email) {
            const found = await this.getUserByEmail(email);
            if (found.error) {
                return found;
            }

            if (found.data) {
                return found;
            }

            const normalized = String(email || '').trim().toLowerCase();
            const { data, error } = await this.supabase
                .from('users')
                .insert({ email: normalized })
                .select('id,email')
                .maybeSingle();

            if (error) {
                // Another client may have inserted the same unique email.
                if (String(error.code || '').toUpperCase() === '23505') {
                    return this.getUserByEmail(normalized);
                }

                return { data: null, error };
            }

            return { data: data || null, error: null };
        },

        async getTodayEntry(authorId, createdDate) {
            const { data, error } = await this.supabase
                .from('journal_entry')
                .select('created_date,overall_emotion,entry,author_id')
                .eq('author_id', authorId)
                .eq('created_date', createdDate)
                .maybeSingle();

            return { data: data || null, error };
        },

        async upsertTodayEntry(authorId, createdDate, entryText, overallEmotion) {
            const payload = {
                author_id: authorId,
                created_date: createdDate,
                entry: entryText,
                overall_emotion: overallEmotion
            };

            const { data, error } = await this.supabase
                .from('journal_entry')
                .upsert(payload, { onConflict: 'author_id,created_date' })
                .select('created_date,overall_emotion,entry,author_id')
                .maybeSingle();

            return { data: data || null, error };
        },

        async getRecentEntries(authorId, limit) {
            const max = Number(limit) > 0 ? Number(limit) : 10;
            const { data, error } = await this.supabase
                .from('journal_entry')
                .select('created_date,overall_emotion,entry,author_id')
                .eq('author_id', authorId)
                .order('created_date', { ascending: false })
                .limit(max);

            return { data: Array.isArray(data) ? data : [], error };
        }
    };

    global.DatabaseManager = db;
})(window);