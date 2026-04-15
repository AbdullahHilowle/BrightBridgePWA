(function (global) {
  let lastErrorMessage = '';

  function setLastError(message) {
    lastErrorMessage = message ? String(message) : '';
  }

  function hashToBase36(input) {
    const text = String(input || '');
    let h1 = 2166136261;
    let h2 = 16777619;

    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 16777619);
      h2 ^= code + i;
      h2 = Math.imul(h2, 2246822519);
    }

    const part1 = (h1 >>> 0).toString(36);
    const part2 = (h2 >>> 0).toString(36);
    return `${part1}${part2}`;
  }

  function toUserIdentifier(rawValue) {
    const raw = String(rawValue || '').trim().toLowerCase();
    if (!raw) {
      return null;
    }

    if (raw.length <= 25) {
      return raw;
    }

    const hashed = hashToBase36(raw).slice(0, 21);
    return `uid_${hashed}`;
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
      return '01';
    }

    if (mood === 'sad') {
      return '00';
    }

    return null;
  }

  function bitToMood(value) {
    if (value === null || value === undefined) {
      return 'neutral';
    }

    if (value === true || value === 1 || value === '1' || value === '01' || value === '11' || value === 't' || value === 'true') {
      return 'happy';
    }

    if (value === false || value === 0 || value === '0' || value === '00' || value === '10' || value === 'f' || value === 'false') {
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
    if (user && user.id) {
      return toUserIdentifier(user.id);
    }

    if (user && user.email) {
      return toUserIdentifier(user.email);
    }

    const storedUserRaw = localStorage.getItem('brightbridge.user');
    if (storedUserRaw) {
      try {
        const storedUser = JSON.parse(storedUserRaw);
        if (storedUser && storedUser.id) {
          return toUserIdentifier(storedUser.id);
        }
      } catch (error) {
        // Ignore malformed cache and continue with other fallbacks.
      }
    }

    const fallbackName = (localStorage.getItem('brightbridge_username') || '').trim();
    return toUserIdentifier(fallbackName);
  }

  async function resolveAuthorId(userKey) {
    setLastError('');

    if (!global.DatabaseManager || typeof global.DatabaseManager.ensureUserByEmail !== 'function') {
      const message = 'DatabaseManager is not available.';
      setLastError(message);
      console.error(message);
      return null;
    }

    if (!userKey) {
      const message = 'No authenticated user identifier is available.';
      setLastError(message);
      return null;
    }

    const result = await global.DatabaseManager.ensureUserByEmail(userKey);
    if (result.error || !result.data || !result.data.id) {
      const message = result && result.error && result.error.message
        ? result.error.message
        : 'Unable to resolve database user id.';
      setLastError(message);
      console.error('Unable to resolve user identifier in database.', result.error);
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
      setLastError(result.error.message || 'Error loading today journal entry.');
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
      setLastError(upsert.error.message || 'Error saving journal entry.');
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
      setLastError((result && result.error && result.error.message) || 'Error loading recent journal entries.');
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
    getLastJournalEntries,
    getLastError: function () {
      return lastErrorMessage;
    }
  };
})(window);
