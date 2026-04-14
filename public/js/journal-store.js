(function (global) {
  function isEmail(value) {
    return typeof value === 'string' && value.includes('@');
  }

  function toDateLabel(dateValue) {
    if (!dateValue) {
      return '';
    }

    const date = new Date(`${dateValue}T00:00:00`);
    return date.toLocaleDateString();
  }

  function moodToBit(mood) {
    if (mood === 'happy') {
      return '1';
    }

    if (mood === 'sad') {
      return '0';
    }

    return null;
  }

  function bitToMood(value) {
    if (value === null || value === undefined) {
      return 'neutral';
    }

    if (value === true || value === 1 || value === '1' || value === 't' || value === 'true') {
      return 'happy';
    }

    if (value === false || value === 0 || value === '0' || value === 'f' || value === 'false') {
      return 'sad';
    }

    return 'neutral';
  }

  function mapRowToEntry(row, userKey) {
    if (!row) {
      return null;
    }

    return {
      userKey,
      content: row.entry || '',
      mood: bitToMood(row.overall_emotion),
      timestamp: row.created_date ? `${row.created_date}T00:00:00.000Z` : null,
      date: toDateLabel(row.created_date)
    };
  }

  async function resolveUserKey(user) {
    // Keep user key as email because DB schema links journal_entry.author_id -> users.id via users.email lookup.
    if (user && isEmail(user.email)) {
      return user.email.trim().toLowerCase();
    }

    const stored = (localStorage.getItem('brightbridge_username') || '').trim().toLowerCase();
    return isEmail(stored) ? stored : null;
  }

  async function resolveAuthorId(userKey) {
    if (!global.DatabaseManager || typeof global.DatabaseManager.ensureUserByEmail !== 'function') {
      console.error('DatabaseManager is not available.');
      return null;
    }

    if (!isEmail(userKey)) {
      return null;
    }

    const result = await global.DatabaseManager.ensureUserByEmail(userKey);
    if (result.error || !result.data || !result.data.id) {
      console.error('Unable to resolve user from email.', result.error);
      return null;
    }

    return result.data.id;
  }

  async function getTodayEntry(userKey) {
    const authorId = await resolveAuthorId(userKey);
    if (!authorId) {
      return null;
    }

    const today = global.DatabaseManager.getTodayDate();
    const result = await global.DatabaseManager.getTodayEntry(authorId, today);
    if (result.error) {
      console.error('Error loading today journal entry.', result.error);
      return null;
    }

    return mapRowToEntry(result.data, userKey);
  }

  async function saveOrUpdateTodayEntry(userKey, content, mood) {
    const trimmed = (content || '').trim();
    if (!trimmed && !mood) {
      return null;
    }

    const authorId = await resolveAuthorId(userKey);
    if (!authorId) {
      return null;
    }

    const createdDate = global.DatabaseManager.getTodayDate();
    const current = await global.DatabaseManager.getTodayEntry(authorId, createdDate);
    const currentRow = current && current.data ? current.data : null;

    const nextContent = trimmed || (currentRow && currentRow.entry) || null;
    const nextEmotion = mood
      ? moodToBit(mood)
      : (currentRow ? currentRow.overall_emotion : null);

    const upsert = await global.DatabaseManager.upsertTodayEntry(
      authorId,
      createdDate,
      nextContent,
      nextEmotion
    );

    if (upsert.error) {
      console.error('Error saving journal entry.', upsert.error);
      return null;
    }

    return mapRowToEntry(upsert.data, userKey);
  }

  async function saveJournalEntry(userKey, content, mood) {
    return saveOrUpdateTodayEntry(userKey, content, mood);
  }

  async function saveMood(userKey, mood) {
    if (!mood) {
      return null;
    }

    return saveOrUpdateTodayEntry(userKey, '', mood);
  }

  async function getLastJournalEntries(userKey, limit) {
    const authorId = await resolveAuthorId(userKey);
    if (!authorId) {
      return [];
    }

    const result = await global.DatabaseManager.getRecentEntries(authorId, limit);
    if (result.error || !Array.isArray(result.data)) {
      console.error('Error loading recent journal entries.', result.error);
      return [];
    }

    return result.data.map((row) => mapRowToEntry(row, userKey)).filter(Boolean);
  }

  global.JournalStore = {
    resolveUserKey,
    saveMood,
    saveJournalEntry,
    getTodayEntry,
    saveOrUpdateTodayEntry,
    getLastJournalEntries
  };
})(window);
