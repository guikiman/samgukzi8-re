import { Officer } from './types.js';

export function sanitizeAndValidateOfficer(raw: any): Officer | null {
    if (typeof raw.id !== 'string' || !raw.id.startsWith('KOEI_')) return null;
    if (typeof raw.name !== 'string') return null;
    if (typeof raw.affinity !== 'number' || raw.affinity < 0 || raw.affinity > 149) return null;

    if (!raw.stats || typeof raw.stats !== 'object') return null;
    const reqStats = ['leadership', 'might', 'intelligence', 'politics', 'charisma'];
    if (!reqStats.every(k => typeof raw.stats[k] === 'number')) return null;

    const processed: Officer = {
        ...raw,
        runtime: raw.runtime ?? {
            isAlive: true,
            factionId: null,
            locationId: "CITY_01",
            loyalty: 100
        },
        relations: {
            parents: raw.relations?.parents ?? [],
            spouse: raw.relations?.spouse ?? [],
            children: raw.relations?.children ?? [],
            swornBrothers: raw.relations?.swornBrothers ?? [],
            rivals: raw.relations?.rivals ?? [],
            mentor: raw.relations?.mentor ?? null,
            protege: raw.relations?.protege ?? []
        },
        skills: raw.skills ?? [],
        aptitudes: raw.aptitudes ?? {
            infantry: 'C', cavalry: 'C', archery: 'C', siege: 'C', navy: 'C'
        },
        lifetimeEvents: raw.lifetimeEvents ?? [],
        originClanId: raw.originClanId ?? 'CLAN_NONE',
        appearancePoolId: raw.appearancePoolId ?? 'DEFAULT'
    };

    return processed;
}
