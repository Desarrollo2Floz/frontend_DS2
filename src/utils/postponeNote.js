const POSTPONE_NOTE_KEY = 'postpone_note';

export const setStoredPostponeNote = (note) => {
    if (note && note.trim()) {
        localStorage.setItem(POSTPONE_NOTE_KEY, note.trim());
    } else {
        localStorage.removeItem(POSTPONE_NOTE_KEY);
    }
};

export const getStoredPostponeNote = () => {
    return localStorage.getItem(POSTPONE_NOTE_KEY) || '';
};

export const clearStoredPostponeNote = () => {
    localStorage.removeItem(POSTPONE_NOTE_KEY);
};