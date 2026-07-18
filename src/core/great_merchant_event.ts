/**
 * [37] 거상 방문 및 암시장 — GreatMerchantEvent
 * 
 * 목적: 희귀 아이템 경매.
 */
export class GreatMerchantEvent {
    public auction(item: any): void {
        console.log(`[Merchant] ${item.name} 경매 시작.`);
    }
}
