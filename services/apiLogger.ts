
type ApiLogListener = (title: string, data: object) => void;

let listener: ApiLogListener | null = null;

export const apiLogger = {
  setListener: (newListener: ApiLogListener) => {
    listener = newListener;
  },
  log: (title: string, data: object) => {
    if (listener) {
      // Filter out noisy, repetitive background calls from the modal viewer
      // These will still appear in the console and the API Log dev tool.
      const noisyEndpoints = [
        '/api/users/10755083/live-status',
        '/api/users/10755083/following-live-status',
        '/api/users/10755083/pending-invites',
        '/api/livekit/token', // This is a technical call, not a business logic one.
      ];
      if (!noisyEndpoints.some(endpoint => title.includes(endpoint))) {
        listener(title, data);
      }
    }
  },
};
