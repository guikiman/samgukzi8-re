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
export declare class WebSocketMultiplayerBridge implements NetworkMultiplayerBridge {
    private socket;
    private receiveCallback;
    private packetQueue;
    connect(url: string): Promise<void>;
    disconnect(): void;
    sendPacket(packet: NetworkPacket): Promise<void>;
    onReceive(callback: (packet: NetworkPacket) => void): void;
}
//# sourceMappingURL=network_multiplayer_bridge.d.ts.map