/**
 * websocketService.ts
 * Manages WebSocket connection for real-time updates from the backend.
 */

type WebSocketMessageHandler = (data: any) => void;

export class WebSocketService {
    private ws: WebSocket | null = null;
    private url: string;
    private messageHandler: WebSocketMessageHandler | null = null;
    private reconnectIntervalId: NodeJS.Timeout | null = null;
    private reconnectDelay: number = 5000; // Start with 5 seconds delay
    private maxReconnectDelay: number = 30000; // Max delay 30 seconds

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect(): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log("[WS] Already connected.");
            return;
        }

        console.log(`[WS] Attempting to connect to ${this.url}...`);
        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log("[WS] Connection established.");
                this.reconnectDelay = 5000; // Reset reconnect delay on successful connection
                this.clearReconnectInterval();
                // Optionally send a ping or initial message upon connection
                // this.sendMessage({ type: "client_hello" });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // console.log("[WS] Message received:", data); // Log received data
                    if (this.messageHandler) {
                        this.messageHandler(data);
                    } else {
                         console.warn("[WS] Message received but no handler is set.");
                    }
                } catch (e) {
                    console.error("[WS] Failed to parse message:", event.data, e);
                }
            };

            this.ws.onerror = (error) => {
                console.error("[WS] WebSocket error:", error);
                // The onclose event will typically follow an error.
            };

            this.ws.onclose = (event) => {
                console.log(`[WS] Connection closed. Code: ${event.code}, Reason: ${event.reason}. Attempting reconnect...`);
                this.ws = null; // Clear the instance
                this.scheduleReconnect();
            };

        } catch (error) {
             console.error("[WS] Failed to create WebSocket instance:", error);
             this.scheduleReconnect(); // Still schedule reconnect even if constructor fails
        }
    }

    private scheduleReconnect(): void {
        this.clearReconnectInterval(); // Ensure no multiple intervals running

        this.reconnectIntervalId = setTimeout(() => {
            // Exponential backoff for reconnect delay
            this.reconnectDelay = Math.min(this.maxReconnectDelay, this.reconnectDelay * 1.5);
            console.log(`[WS] Retrying connection in ${this.reconnectDelay / 1000} seconds...`);
            this.connect();
        }, this.reconnectDelay);
    }

    private clearReconnectInterval(): void {
        if (this.reconnectIntervalId) {
            clearTimeout(this.reconnectIntervalId);
            this.reconnectIntervalId = null;
        }
    }

    public onMessage(handler: WebSocketMessageHandler): void {
        this.messageHandler = handler;
    }

    public sendMessage(message: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
                console.log("[WS] Message sent:", message);
            } catch (e) {
                console.error("[WS] Failed to send message:", e);
            }
        } else {
            console.warn("[WS] Cannot send message, WebSocket is not open.");
            // Optionally queue the message or handle the error
        }
    }

    public disconnect(): void {
        console.log("[WS] Disconnecting manually...");
        this.clearReconnectInterval(); // Stop trying to reconnect if manually disconnected
        this.messageHandler = null; // Clear handler
        if (this.ws) {
            this.ws.close(1000, "Client initiated disconnect"); // Use standard code 1000
            this.ws = null;
        }
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
