(function (global) {
    const SUPABASE_URL = 'https://pyqznelkiujkmviedlha.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_TqBEuyZvC51pHJDVXAGk3Q_FigwHhN3';

    async function request(path, options) {
        const method = options && options.method ? options.method : 'GET';
        const query = options && options.query ? options.query : null;
        const body = options && Object.prototype.hasOwnProperty.call(options, 'body') ? options.body : undefined;
        const prefer = options && options.prefer ? options.prefer : null;

        const url = query
            ? `${SUPABASE_URL}/rest/v1/${path}?${query.toString()}`
            : `${SUPABASE_URL}/rest/v1/${path}`;

        const headers = {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };

        if (prefer) {
            headers.Prefer = prefer;
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });

        const text = await response.text();
        let payload = null;

        if (text) {
            try {
                payload = JSON.parse(text);
            } catch (error) {
                payload = { message: text };
            }
        }

        if (!response.ok) {
            const errorMessage = payload && payload.message ? payload.message : `Request failed with status ${response.status}`;
            return {
                data: null,
                error: {
                    status: response.status,
                    message: errorMessage,
                    details: payload
                }
            };
        }

        return { data: payload, error: null };
    }

    const db = {
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

            const query = new URLSearchParams({
                select: 'id,email',
                email: `eq.${normalized}`,
                limit: '1'
            });

            const result = await request('users', { query });
            if (result.error) {
                return result;
            }

            return {
                data: Array.isArray(result.data) && result.data.length ? result.data[0] : null,
                error: null
            };
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
            const insert = await request('users', {
                method: 'POST',
                body: [{ email: normalized }],
                prefer: 'return=representation'
            });

            if (insert.error) {
                // Concurrent clients may create the same email in between read and insert.
                if (insert.error.status === 409 || insert.error.status === 400) {
                    return this.getUserByEmail(normalized);
                }

                return insert;
            }

            const row = Array.isArray(insert.data) ? insert.data[0] : null;
            return { data: row, error: null };
        },

        async getTodayEntry(authorId, createdDate) {
            const query = new URLSearchParams({
                select: 'created_date,overall_emotion,entry,author_id',
                author_id: `eq.${authorId}`,
                created_date: `eq.${createdDate}`,
                limit: '1'
            });

            const result = await request('journal_entry', { query });
            if (result.error) {
                return result;
            }

            return {
                data: Array.isArray(result.data) && result.data.length ? result.data[0] : null,
                error: null
            };
        },

        async upsertTodayEntry(authorId, createdDate, entryText, overallEmotion) {
            const query = new URLSearchParams({ on_conflict: 'author_id,created_date' });
            const payload = [{
                author_id: authorId,
                created_date: createdDate,
                entry: entryText,
                overall_emotion: overallEmotion
            }];

            const result = await request('journal_entry', {
                method: 'POST',
                query,
                body: payload,
                prefer: 'resolution=merge-duplicates,return=representation'
            });

            if (result.error) {
                return result;
            }

            return {
                data: Array.isArray(result.data) && result.data.length ? result.data[0] : null,
                error: null
            };
        },

        async getRecentEntries(authorId, limit) {
            const max = Number(limit) > 0 ? Number(limit) : 10;
            const query = new URLSearchParams({
                select: 'created_date,overall_emotion,entry,author_id',
                author_id: `eq.${authorId}`,
                order: 'created_date.desc',
                limit: String(max)
            });

            return request('journal_entry', { query });
        }
    };

    global.DatabaseManager = db;
})(window);