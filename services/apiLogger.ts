

type ApiLogListener = (title: string, data: object) => void;

interface ApiListeners {
    logOnly: ApiLogListener;
    showAndLog: ApiLogListener;
}

let listeners: ApiListeners | null = null;

// A list of noisy, high-frequency paths to exclude from the automatic modal popup.
// These will still be logged to the console and available in the Dev Tools API Log.
const MODAL_BLOCKLIST = [
    '/api/users/\\d+/live-status',
    '/api/users/\\d+/following-live-status',
    '/api/lives/\\d+$', // End of string to not match subpaths like /lives/123/viewers
    '/api/chat/live/\\d+',
    '/api/lives/\\d+/viewers',
    '/api/batalhas-pk/\\d+',
    '/api/pk/invites/status/.+', // Polling for PK invite status
];

const isBlocked = (path: string): boolean => {
    return MODAL_BLOCKLIST.some(pattern => new RegExp(`^${pattern}$`).test(path));
}

export const apiLogger = {
  setListener: (newListeners: ApiListeners | null) => {
    listeners = newListeners;
  },
  log: (title: string, path: string, data: object) => {
    if (listeners) {
      if (isBlocked(path)) {
        listeners.logOnly(title, data);
      } else {
        listeners.showAndLog(title, data);
      }
    }
  },
};