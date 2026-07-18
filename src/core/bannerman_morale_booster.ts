/**
 * [17] 군기 사기 부스터 — Bannerman Morale Booster
 *
 * 전장 중심부 군기(깃발) 유닛의 생존 여부 및
 * 격파 시 적 세력 전체의 사기가 즉시 30% 감폭되는 사기 동역학 연산
 */

import type { FactionID, HexCoord } from './types.js';

export interface BannerState {
    bannerUnitId: string;
    factionId: FactionID;
    position: HexCoord;
    isAlive: boolean;
    moraleBonus: number;     // 아군 사기 보너스 (%)
    penaltyOnDestroy: number; // 파괴 시 적 사기 감소 (%)
}

export class BannermanMoraleBooster {
    private banners: Map<FactionID, BannerState> = new Map();

    /**
     * 군기 설치
     */
    deployBanner(
        bannerUnitId: string,
        factionId: FactionID,
        position: HexCoord,
    ): BannerState {
        const state: BannerState = {
            bannerUnitId,
            factionId,
            position,
            isAlive: true,
            moraleBonus: 10,       // 기본 사기 보너스 +10%
            penaltyOnDestroy: 30,  // 파괴 시 적 사기 -30%
        };
        this.banners.set(factionId, state);
        return state;
    }

    /**
     * 군기 생존 여부 확인
     */
    isBannerAlive(factionId: FactionID): boolean {
        const banner = this.banners.get(factionId);
        return banner !== undefined && banner.isAlive;
    }

    /**
     * 군기 파괴 → 적 세력 전체 사기 30% 감소
     */
    onBannerDestroyed(factionId: FactionID): number {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive) return 0;

        banner.isAlive = false;
        return banner.penaltyOnDestroy;
    }

    /**
     * 군기로 인한 아군 사기 보너스 계산
     */
    getMoraleBonus(factionId: FactionID): number {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive) return 0;
        return banner.moraleBonus;
    }

    /**
     * 군기 이동
     */
    moveBanner(factionId: FactionID, newPosition: HexCoord): boolean {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive) return false;
        banner.position = newPosition;
        return true;
    }

    /**
     * 군기 상태 조회
     */
    getBanner(factionId: FactionID): BannerState | null {
        return this.banners.get(factionId) ?? null;
    }

    /**
     * 거리 기반 사기 보너스 계산 (군기와 가까울수록 높은 보너스)
     */
    getDistanceMoraleBonus(factionId: FactionID, unitPosition: HexCoord, maxRange: number): number {
        const banner = this.banners.get(factionId);
        if (!banner || !banner.isAlive) return 0;

        const dq = Math.abs(banner.position.q - unitPosition.q);
        const dr = Math.abs(banner.position.r - unitPosition.r);
        const ds = Math.abs((-banner.position.q - banner.position.r) - (-unitPosition.q - unitPosition.r));
        const distance = Math.max(dq, dr, ds);

        if (distance > maxRange) return 0;
        const falloff = 1 - (distance / maxRange);
        return Math.floor(banner.moraleBonus * falloff);
    }

    getAllBanners(): BannerState[] {
        return Array.from(this.banners.values());
    }

    reset(): void {
        this.banners.clear();
    }
}
