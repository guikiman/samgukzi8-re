import type { FamilyMember } from "./family_data_structure";
export interface FamilyTreeNode {
    readonly id: string;
    readonly name: string;
    readonly gender: "M" | "F";
    readonly generation: number;
    readonly spouseIds: string[];
    readonly childrenIds: string[];
    readonly isAlive: boolean;
    readonly x: number;
    readonly y: number;
}
export interface FamilyTreeEdge {
    readonly from: string;
    readonly to: string;
    readonly type: "marriage" | "parent_child" | "sibling";
}
export declare class FamilyTreeRenderer {
    private readonly NODE_WIDTH;
    private readonly NODE_HEIGHT;
    private readonly GENERATION_GAP;
    private readonly SPOUSE_GAP;
    buildTree(members: FamilyMember[], rootMemberId?: string): {
        nodes: FamilyTreeNode[];
        edges: FamilyTreeEdge[];
    };
    renderSVG(nodes: FamilyTreeNode[], edges: FamilyTreeEdge[]): string;
    private getSubTree;
    private assignGenerations;
    private groupByGeneration;
}
//# sourceMappingURL=family_tree_renderer.d.ts.map