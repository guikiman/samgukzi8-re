/**
 * [E45] E2E 시나리오 테스트
 *
 * E2E scenarios for Samgukzi 8 Remake
 * This file contains high-level E2E scenario definitions.
 * Actual Playwright tests are expected to be run separately.
 *
 * Supported scenarios:
 *  1. Game init -> title screen -> new game
 *  2. City management flow
 *  3. Faction diplomacy flow
 *  4. Battle flow
 *  5. Officer Recruitment flow
 */

export interface E2EScenario {
    readonly name: string;
    readonly description: string;
    readonly steps: readonly string[];
    readonly expectedOutcome: string;
}

export const E2EScenarios: E2EScenario[] = [
    {
        name: 'new-game-initialization',
        description: '게임 초기화 flow',
        steps: [
            'Launch game',
            'Verify title screen displayed',
            'Select new game',
            'Select scenario',
            'Select faction',
            'Verify World Map loads',
        ],
        expectedOutcome: 'World map is displayed with faction officers',
    },
    {
        name: 'city-management',
        description: '도시 관리 flow',
        steps: [
            'Enter World Map',
            'Click on a city',
            'Verify city detail panel',
            'Perform city develop action',
            'Verify development increase',
        ],
        expectedOutcome: 'City development value increased and reflects visually',
    },
    {
        name: 'faction-diplomacy',
        description: '세력 외교 flow',
        steps: [
            'Open diplomacy screen',
            'Select a target faction',
            'Send an envoy',
            'Propose alliance',
            'Wait for result',
        ],
        expectedOutcome: 'Alliance status correctly updated',
    },
    {
        name: 'combat-battle',
        description: '전투 flow',
        steps: [
            'Initiate combat',
            'Verify deployment screen',
            'Select attack target',
            'Execute turn',
            'Check battle results',
        ],
        expectedOutcome: 'Battle outcome correctly calculated',
    },
    {
        name: 'officer-recruitment',
        description: '무장 등용 flow',
        steps: [
            'Select recruiter',
            'Pick target officer',
            'Attempt recruitment',
            'Handle success/failure',
            'Update roster',
        ],
        expectedOutcome: 'Officer roster correctly updated',
    },
];
