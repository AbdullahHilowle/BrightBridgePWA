import { createClient} from '@supabase/supabase-js'

const SUPABASE_URL = "https://pyqznelkiujkmviedlha.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_TqBEuyZvC51pHJDVXAGk3Q_FigwHhN3"

//class for managing the database
const db = {

    //date attribute for future operations
    today : new Date(),

    // Create a single supabase client for interacting with your database
    supabase : createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    ),

    getTodayDate: function () {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    //this function gets the user information based on their email
    getUserId: async function(email){
        const { data, error } = await db.supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .single();

        return { data, error };
    },

    async getUserByUuid(uuid) {
        const normalizedUuid = String(uuid || '').trim().toLowerCase();
        if (!normalizedUuid) {
            return { data: null, error: { message: 'UUID is required.' } };
        }

        const { data, error } = await db.supabase
            .from('users')
            .select('uuid,email')
            .eq('uuid', normalizedUuid)
            .maybeSingle();

        return { data: data || null, error };
    },

    async ensureUserByUuid(uuid, email) {
        const normalizedUuid = String(uuid || '').trim().toLowerCase();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedUuid) {
            return { data: null, error: { message: 'UUID is required.' } };
        }

        const found = await db.getUserByUuid(normalizedUuid);
        if (found.error) {
            return found;
        }

        if (found.data) {
            if (normalizedEmail && found.data.email !== normalizedEmail) {
                const { data, error } = await db.supabase
                    .from('users')
                    .update({ email: normalizedEmail })
                    .eq('uuid', normalizedUuid)
                    .select('uuid,email')
                    .maybeSingle();

                if (error) {
                    return { data: null, error };
                }

                return { data: data || null, error: null };
            }

            return found;
        }

        if (!normalizedEmail) {
            return { data: null, error: { message: 'Email is required when creating a new user profile.' } };
        }

        const { data, error } = await db.supabase
            .from('users')
            .insert({ uuid: normalizedUuid, email: normalizedEmail })
            .select('uuid,email')
            .maybeSingle();

        if (error) {
            if (String(error.code || '').toUpperCase() === '23505') {
                return db.getUserByUuid(normalizedUuid);
            }

            return { data: null, error };
        }

        return { data: data || null, error: null };
    },

    //inserts specific data into a database of your choice 
    insertData : async function(database, data){
        const payload = (data && typeof data === 'object' && !Array.isArray(data)) ? data : { id: data };

        const { data: insertedData, error } = await db.supabase
                    .from(database)
                    .insert(payload)
                    .select();

        return { data: insertedData, error };
    },

    async getTodayEntry(uuid, createdDate) {
        const { data, error } = await db.supabase
            .from('journal_entry')
            .select('created_date,overall_emotion,entry,uuid')
            .eq('uuid', uuid)
            .eq('created_date', createdDate)
            .maybeSingle();

        return { data: data || null, error };
    },

    async upsertTodayEntry(uuid, createdDate, entryText, overallEmotion) {
        const payload = {
            uuid,
            created_date: createdDate,
            entry: entryText,
            overall_emotion: overallEmotion
        };

        const { data, error } = await db.supabase
            .from('journal_entry')
            .upsert(payload, { onConflict: 'uuid,created_date' })
            .select('created_date,overall_emotion,entry,uuid')
            .maybeSingle();

        return { data: data || null, error };
    },

    async getRecentEntries(uuid, limit) {
        const max = Number(limit) > 0 ? Number(limit) : 10;
        const { data, error } = await db.supabase
            .from('journal_entry')
            .select('created_date,overall_emotion,entry,uuid')
            .eq('uuid', uuid)
            .order('created_date', { ascending: false })
            .limit(max);

        return { data: Array.isArray(data) ? data : [], error };
    },

}

if (typeof window !== 'undefined') {
    window.DatabaseManager = db;
}

export default db
