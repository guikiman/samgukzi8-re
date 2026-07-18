/**
 * [Task 46] 네트워크 멀티플레이어 마운트 인프라
 *
 * 로컬 턴 연산을 넘어서 명령 패킷을 웹소켓 서버로 보내
 * 검증받은 뒤 동일 프레임 단위로 수집·반영.
 */
export class WebSocketMultiplayerBridge {
    constructor() {
        this.socket = null;
        this.receiveCallback = null;
        this.packetQueue = [];
    }
    async connect(url) {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(url);
            this.socket.onopen = () => resolve();
            this.socket.onerror = (e) => reject(e);
            this.socket.onmessage = (event) => {
                const packet = JSON.parse(event.data);
                if (this.receiveCallback) {
                    this.receiveCallback(packet);
                }
                else {
                    this.packetQueue.push(packet);
                }
            };
        });
    }
    disconnect() {
        this.socket?.close();
        this.socket = null;
    }
    async sendPacket(packet) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket not connected");
        }
        this.socket.send(JSON.stringify(packet));
    }
    onReceive(callback) {
        this.receiveCallback = callback;
        for (const p of this.packetQueue)
            callback(p);
        this.packetQueue = [];
    }
}
//# sourceMappingURL=network_multiplayer_bridge.js.map