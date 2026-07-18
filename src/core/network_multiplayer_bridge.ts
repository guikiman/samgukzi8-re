/**
 * [Task 46] 네트워크 멀티플레이어 마운트 인프라
 *
 * 로컬 턴 연산을 넘어서 명령 패킷을 웹소켓 서버로 보내
 * 검증받은 뒤 동일 프레임 단위로 수집·반영.
 */

export interface NetworkPacket {
  readonly factionId: string;
  readonly turnNumber: number;
  readonly commands: unknown[];
  readonly signature: string;
}

export interface NetworkMultiplayerBridge {
  connect(url: string): Promise<void>;
  disconnect(): void;
  sendPacket(packet: NetworkPacket): Promise<void>;
  onReceive(callback: (packet: NetworkPacket) => void): void;
}

export class WebSocketMultiplayerBridge implements NetworkMultiplayerBridge {
  private socket: WebSocket | null = null;
  private receiveCallback: ((packet: NetworkPacket) => void) | null = null;
  private packetQueue: NetworkPacket[] = [];

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);
      this.socket.onopen = () => resolve();
      this.socket.onerror = (e) => reject(e);
      this.socket.onmessage = (event) => {
        const packet: NetworkPacket = JSON.parse(event.data);
        if (this.receiveCallback) {
          this.receiveCallback(packet);
        } else {
          this.packetQueue.push(packet);
        }
      };
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  async sendPacket(packet: NetworkPacket): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.socket.send(JSON.stringify(packet));
  }

  onReceive(callback: (packet: NetworkPacket) => void): void {
    this.receiveCallback = callback;
    for (const p of this.packetQueue) callback(p);
    this.packetQueue = [];
  }
}
