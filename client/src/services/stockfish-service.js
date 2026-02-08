

class StockfishService {
    constructor() {

        if (StockfishService.instance) {
            return StockfishService.instance;
        }

        this.engine = null;
        this.isReady = false;
        this.isInitializing = false;
        this.messageQueue = [];
        this.messageQueueMaxSize = 100;
        this.activeRequests = new Map();
        this.requestIdCounter = 0;
        this.currentCallback = null;

        StockfishService.instance = this;
    }

    async init() {

        if (this.isReady) return;

        if (this.isInitializing) {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.isReady) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }

        this.isInitializing = true;

        return new Promise((resolve, reject) => {
            try {

                const stockfishUrl = `${window.location.origin}/stockfish.js`;
                const wasmUrl = `${window.location.origin}/stockfish.wasm`;

                const workerCode = `
                    // Pre-define Module to configure WASM loading
                    var Module = {
                        locateFile: function(path) {
                            if (path.endsWith('.wasm')) {
                                return '${wasmUrl}';
                            }
                            return path;
                        },
                        onRuntimeInitialized: function() {
                            postMessage('worker-ready');
                        },
                        print: function(text) {
                            postMessage(text);
                        },
                        printErr: function(text) {
                            postMessage('error: ' + text);
                        }
                    };

                    // Import Stockfish WASM from local file (must use absolute URL in blob worker)
                    importScripts('${stockfishUrl}');

                    // Hook into engine communication
                    // If Stockfish defines a global onmessage, we might need to wrap it or it handles everything
                    // Usually Stockfish.js assigns onmessage = function(e) { ... }

                    // We need to send 'worker-ready' if onRuntimeInitialized didn't fire (older versions)
                    if (Module.calledRun) {
                         postMessage('worker-ready');
                    }
                `;

                const blob = new Blob([workerCode], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);

                this.engine = new Worker(workerUrl);

                let initTimeout = null;
                let initRejected = false;
                let workerReady = false;

                const cleanupOnError = (error) => {
                    if (initRejected) return;
                    initRejected = true;

                    if (initTimeout) clearTimeout(initTimeout);
                    this.isInitializing = false;

                    if (this.engine) {
                        try {
                            this.engine.terminate();
                        } catch (e) {
                            console.warn('Error terminating worker during cleanup:', e);
                        }
                        this.engine = null;
                    }
                    if (workerUrl) URL.revokeObjectURL(workerUrl);
                    reject(error);
                };

                initTimeout = setTimeout(() => {
                    if (!this.isReady && !initRejected) {
                        cleanupOnError(new Error('Stockfish initialization timeout after 15 seconds'));
                    }
                }, 15000);

                this.engine.onmessage = (event) => {
                    if (!event || event.data === undefined || event.data === null) {
                        return;
                    }

                    const message = event.data;

                    if (message === 'worker-ready') {
                        workerReady = true;

                        this.engine.postMessage('uci');
                        return;
                    }

                    if (typeof message === 'string' && message.startsWith('error:')) {
                        cleanupOnError(new Error(message.substring(7)));
                        return;
                    }

                    this.handleMessage(message);

                    if (typeof message === 'string' && message.includes('uciok') && !initRejected) {
                        clearTimeout(initTimeout);
                        this.isReady = true;
                        this.isInitializing = false;
                        URL.revokeObjectURL(workerUrl);
                        console.log('✅ Stockfish engine ready (local WASM)');
                        resolve();
                    }
                };

                this.engine.onerror = (error) => {
                    console.error('Stockfish Worker error:', error);
                    cleanupOnError(new Error(`Worker error: ${error.message || 'Unknown error'}`));
                };

            } catch (error) {
                console.error('Failed to initialize Stockfish:', error);
                console.error('Error stack:', error.stack);
                this.isInitializing = false;
                reject(error);
            }
        });
    }

    sendCommand(command) {
        if (!this.engine) {
            console.error('Engine not initialized');
            return;
        }

        if (!command || command === '' || typeof command !== 'string') {
            console.error('Invalid command:', command);
            return;
        }

        console.log('Stockfish command:', command);
        this.engine.postMessage(command);
    }

    handleMessage(message) {
        const msg = typeof message === 'string' ? message : String(message);

        if (this.currentCallback) {
            this.currentCallback(msg);
        }

        for (const [requestId, request] of this.activeRequests.entries()) {
            if (request.callback) {
                request.callback(msg);
            }
        }

        this.messageQueue.push(msg);
        if (this.messageQueue.length > this.messageQueueMaxSize) {
            this.messageQueue.shift();
        }
    }

    async analyzePosition(fen, depth = 15, timeout = 100000) {
        if (!this.isReady) {
            await this.init();
        }

        if (!fen || typeof fen !== 'string') {
            throw new Error('Invalid FEN position');
        }

        return new Promise((resolve, reject) => {
            const requestId = ++this.requestIdCounter;
            let score = 0;
            let bestMove = '';
            let isMate = false;
            let mateIn = 0;
            let resolved = false;

            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    this.activeRequests.delete(requestId);
                    this.stop();
                    reject(new Error(`Analysis timeout after ${timeout}ms`));
                }
            }, timeout);

            const callback = (msg) => {
                if (resolved) return;

                if (msg.includes('score cp')) {
                    const match = msg.match(/score cp (-?\d+)/);
                    if (match) {
                        score = parseInt(match[1]);
                    }
                }

                if (msg.includes('score mate')) {
                    const match = msg.match(/score mate (-?\d+)/);
                    if (match) {
                        isMate = true;
                        mateIn = parseInt(match[1]);
                        score = mateIn > 0 ? 10000 : -10000;
                    }
                }

                if (msg.includes('bestmove')) {
                    const match = msg.match(/bestmove (\w+)/);
                    if (match) {
                        bestMove = match[1];
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            this.activeRequests.delete(requestId);
                            resolve({ score, bestMove, isMate, mateIn });
                        }
                    }
                }
            };

            this.activeRequests.set(requestId, { callback, timeoutId });

            try {

                this.sendCommand(`position fen ${fen}`);
                this.sendCommand(`go depth ${depth}`);
            } catch (error) {
                clearTimeout(timeoutId);
                this.activeRequests.delete(requestId);
                reject(error);
            }
        });
    }

    async getBestMove(fen, depth = 15) {
        const result = await this.analyzePosition(fen, depth);
        return result.bestMove;
    }

    stop() {
        if (this.engine) {
            try {
                this.sendCommand('stop');
            } catch (error) {

            }
        }

        for (const [requestId, request] of this.activeRequests.entries()) {
            if (request.timeoutId) clearTimeout(request.timeoutId);
            this.activeRequests.delete(requestId);
        }
    }

    quit() {

        this.stop();

        if (this.engine) {
            try {
                this.sendCommand('quit');
            } catch (e) {
                console.warn('Error sending quit command:', e);
            }

            try {
                this.engine.terminate();
            } catch (e) {
                console.warn('Error terminating worker:', e);
            }

            this.engine = null;
        }

        this.isReady = false;
        this.isInitializing = false;
        this.messageQueue = [];
        this.activeRequests.clear();
        console.log('Stockfish service quit completely');
    }

    async restart() {
        console.log('Restarting Stockfish engine...');
        this.quit();
        return this.init();
    }
}

const stockfishService = new StockfishService();
export default stockfishService;
