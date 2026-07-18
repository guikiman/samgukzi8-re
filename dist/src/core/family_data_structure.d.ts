export interface FamilyMember {
    readonly id: string;
    readonly name: string;
    readonly gender: "M" | "F";
    readonly generation: number;
    parentIds: [string | null, string | null];
    spouseIds: string[];
    readonly childrenIds: string[];
    siblingIds: string[];
    readonly isAlive: boolean;
    readonly birthYear: number;
    readonly deathYear: number | null;
}
export declare class FamilyDataStructure {
    private members;
    private marriages;
    addMember(member: FamilyMember): void;
    getMember(id: string): FamilyMember | undefined;
    createMarriage(husbandId: string, wifeId: string, year: number): boolean;
    addChild(fatherId: string, motherId: string, childId: string): boolean;
    addSibling(childId: string, siblingId: string): boolean;
    getSpouses(memberId: string): FamilyMember[];
    getChildren(memberId: string): FamilyMember[];
    getParents(memberId: string): [FamilyMember | null, FamilyMember | null];
    getDescendants(memberId: string, maxDepth?: number): FamilyMember[];
    isRelated(a: string, b: string): boolean;
    getAllMembers(): FamilyMember[];
    removeMember(id: string): boolean;
}
//# sourceMappingURL=family_data_structure.d.ts.map