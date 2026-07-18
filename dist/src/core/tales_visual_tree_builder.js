/**
 * [2] 연의전 가시화 트리 빌더 — TalesVisualTreeBuilder
 *
 * 목적: 유저에게 현재 진행 및 분기 가능한 연의전 목록을 UI 구조로 노출하기 위한 트리 구조 생성.
 *
 * 핵심 로직:
 *   1. 이벤트 ID 간의 부모-자식 관계 기반 트리 생성
 *   2. 이벤트 상태(진행중, 완료, 잠김)에 따른 트리 노드 속성 계산
 */
export class TalesVisualTreeBuilder {
    /**
     * 이벤트 리스트와 관계 정의를 받아 트리 구조 생성
     * @param eventList 모든 이벤트 목록
     * @param dependencies 부모-자식 관계 맵 (childId -> parentId)
     * @param completedEvents 완료된 이벤트 목록
     */
    buildTree(eventList, dependencies, completedEvents) {
        const nodes = new Map();
        // 1. 초기 노드 생성
        for (const event of eventList) {
            const status = completedEvents.has(event.id) ? 'COMPLETED' : 'LOCKED';
            nodes.set(event.id, { id: event.id, name: event.name, status, children: [] });
        }
        // 2. 부모-자식 관계 구성 및 상태 업데이트
        const rootNodes = [];
        for (const event of eventList) {
            const parentId = dependencies.get(event.id);
            if (parentId) {
                const parentNode = nodes.get(parentId);
                if (parentNode) {
                    parentNode.children.push(nodes.get(event.id));
                    // 부모가 완료되었으면 자식은 AVAILABLE로
                    if (parentNode.status === 'COMPLETED' && nodes.get(event.id).status === 'LOCKED') {
                        nodes.get(event.id).status = 'AVAILABLE';
                    }
                }
            }
            else {
                rootNodes.push(nodes.get(event.id));
                // 루트는 기본 AVAILABLE
                if (nodes.get(event.id).status === 'LOCKED') {
                    nodes.get(event.id).status = 'AVAILABLE';
                }
            }
        }
        return rootNodes;
    }
}
//# sourceMappingURL=tales_visual_tree_builder.js.map