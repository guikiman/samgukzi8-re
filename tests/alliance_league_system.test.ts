import { describe, it, expect, beforeEach } from 'vitest';
import { AllianceLeagueManager } from '../src/core/alliance_league_system';

describe('AllianceLeagueManager', () => {
    let manager: AllianceLeagueManager;

    beforeEach(() => {
        manager = new AllianceLeagueManager();
    });

    it('should propose a league', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2', 'faction_3']);
        expect(league.targetFactionId).toBe('faction_5');
        expect(league.memberFactionIds).toContain('faction_1');
        expect(league.memberFactionIds).toContain('faction_2');
        expect(league.isActive).toBe(false);
    });

    it('should activate league with majority approval', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2', 'faction_3']);
        manager.voteOnLeague(league.leagueId, 'faction_1', true);
        manager.voteOnLeague(league.leagueId, 'faction_2', true);
        manager.voteOnLeague(league.leagueId, 'faction_3', false);
        expect(manager.isLeagueActive(league.leagueId)).toBe(true);
    });

    it('should not activate league without majority', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2', 'faction_3']);
        manager.voteOnLeague(league.leagueId, 'faction_1', true);
        manager.voteOnLeague(league.leagueId, 'faction_2', false);
        manager.voteOnLeague(league.leagueId, 'faction_3', false);
        expect(manager.isLeagueActive(league.leagueId)).toBe(false);
    });

    it('should return league members', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2', 'faction_3']);
        const members = manager.getLeagueMembers(league.leagueId);
        expect(members.length).toBe(3);
    });

    it('should dissolve league', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2']);
        manager.voteOnLeague(league.leagueId, 'faction_1', true);
        manager.voteOnLeague(league.leagueId, 'faction_2', true);
        manager.dissolveLeague(league.leagueId);
        expect(manager.isLeagueActive(league.leagueId)).toBe(false);
    });

    it('should find leagues for a faction', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2']);
        manager.voteOnLeague(league.leagueId, 'faction_1', true);
        manager.voteOnLeague(league.leagueId, 'faction_2', true);
        const leagues = manager.getLeaguesForFaction('faction_1');
        expect(leagues.length).toBe(1);
    });

    it('should find leagues targeting a faction', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2']);
        manager.voteOnLeague(league.leagueId, 'faction_1', true);
        manager.voteOnLeague(league.leagueId, 'faction_2', true);
        const leagues = manager.getLeaguesTargetingFaction('faction_5');
        expect(leagues.length).toBe(1);
    });

    it('should check mutual defense', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2']);
        manager.voteOnLeague(league.leagueId, 'faction_1', true);
        manager.voteOnLeague(league.leagueId, 'faction_2', true);
        const defense = manager.isMutualDefenseActive('faction_1', 'faction_5');
        expect(defense).toBe(true);
    });

    it('should auto-dissolve league after expiration', () => {
        const league = manager.proposeLeague('faction_1', 'faction_5', ['faction_2']);
        manager.voteOnLeague(league.leagueId, 'faction_1', true);
        manager.voteOnLeague(league.leagueId, 'faction_2', true);
        // 37턴 경과 (36턴 후 만료)
        for (let i = 0; i < 37; i++) {
            manager.processTurn();
        }
        expect(manager.isLeagueActive(league.leagueId)).toBe(false);
    });

    it('should clear all leagues', () => {
        manager.proposeLeague('faction_1', 'faction_5', ['faction_2']);
        manager.clear();
        expect(manager.getAllActiveLeagues().length).toBe(0);
    });
});
