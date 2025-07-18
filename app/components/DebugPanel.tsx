'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error';
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any[];
}

export function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addLog = (level: LogEntry['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
        details: args.length > 1 ? args.slice(1) : undefined
      }].slice(-50)); // Keep last 50 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      if (args[0]?.toString().includes('[ConversationFlow]')) {
        addLog('log', args);
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    // Restore on cleanup
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
      >
        Show Debug Logs
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-white font-bold">Debug Console</h2>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white text-2xl"
        >
          ×
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-gray-400">No logs yet...</p>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`mb-2 p-2 rounded ${
                log.level === 'error' ? 'bg-red-900/50 text-red-200' :
                log.level === 'warn' ? 'bg-yellow-900/50 text-yellow-200' :
                'bg-gray-800 text-gray-200'
              }`}
            >
              <div className="flex gap-2">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className="font-bold">{log.level.toUpperCase()}</span>
              </div>
              <pre className="whitespace-pre-wrap break-all mt-1">{log.message}</pre>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => setLogs([])}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}