export interface LogEntry {
    id: string;
    method: string;
    endpoint: string;
    status: 'Pending' | 'Success' | 'Error' | 'Timeout';
    startTime: number;
    duration?: number;
    error?: string;
    statusCode?: number;
}

type Listener = (logs: LogEntry[]) => void;

class ApiTrackerService {
    private logs: LogEntry[] = [];
    private failures: LogEntry[] = [];
    private listeners: Listener[] = [];
    private failureListeners: Listener[] = [];
    private nextId = 0;

    addLog(method: string, endpoint: string): string {
        const id = `req-${this.nextId++}`;
        const newLog: LogEntry = {
            id,
            method,
            endpoint,
            status: 'Pending',
            startTime: Date.now(),
        };
        this.logs.unshift(newLog);
        if (this.logs.length > 100) {
            this.logs.pop();
        }
        this.notifyListeners();
        return id;
    }

    updateLog(id: string, updates: Partial<LogEntry>) {
        const logIndex = this.logs.findIndex(log => log.id === id);
        if (logIndex > -1) {
            const originalLog = this.logs[logIndex];
            this.logs[logIndex] = { ...originalLog, ...updates };
            if (!updates.duration) {
                 this.logs[logIndex].duration = Date.now() - originalLog.startTime;
            }
            this.notifyListeners();

            if (updates.status === 'Error' || updates.status === 'Timeout') {
                const failureExists = this.failures.some(f => f.id === id);
                if (!failureExists) {
                    this.failures.unshift(this.logs[logIndex]);
                    this.notifyFailureListeners();
                }
            }
        }
    }

    clearLogs() {
        this.logs = [];
        this.failures = [];
        this.notifyListeners();
        this.notifyFailureListeners();
    }

    clearFailures() {
        this.failures = [];
        this.notifyFailureListeners();
    }

    getLogs(): LogEntry[] {
        return this.logs;
    }
    
    getFailures(): LogEntry[] {
        return this.failures;
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    subscribeToFailures(listener: Listener) {
        this.failureListeners.push(listener);
        return () => {
            this.failureListeners = this.failureListeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        for (const listener of this.listeners) {
            listener([...this.logs]);
        }
    }

    private notifyFailureListeners() {
        for (const listener of this.failureListeners) {
            listener([...this.failures]);
        }
    }
}

export const apiTrackerService = new ApiTrackerService();