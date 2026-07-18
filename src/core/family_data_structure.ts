import type { OfficerID } from "./types";

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

export class FamilyDataStructure {
  private members = new Map<string, FamilyMember>();
  private marriages: Array<{ husbandId: string; wifeId: string; marriedAt: number }> = [];

  addMember(member: FamilyMember): void {
    this.members.set(member.id, member);
  }

  getMember(id: string): FamilyMember | undefined {
    return this.members.get(id);
  }

  createMarriage(husbandId: string, wifeId: string, year: number): boolean {
    const husband = this.members.get(husbandId);
    const wife = this.members.get(wifeId);
    if (!husband || !wife) return false;

    this.marriages.push({ husbandId, wifeId, marriedAt: year });
    husband.spouseIds.push(wifeId);
    wife.spouseIds.push(husbandId);
    return true;
  }

  addChild(fatherId: string, motherId: string, childId: string): boolean {
    const father = this.members.get(fatherId);
    const mother = this.members.get(motherId);
    const child = this.members.get(childId);
    if (!father || !mother || !child) return false;

    father.childrenIds.push(childId);
    mother.childrenIds.push(childId);
    return true;
  }

  addSibling(childId: string, siblingId: string): boolean {
    const child = this.members.get(childId);
    const sibling = this.members.get(siblingId);
    if (!child || !sibling) return false;

    if (!child.siblingIds.includes(siblingId)) {
      child.siblingIds.push(siblingId);
    }
    if (!sibling.siblingIds.includes(childId)) {
      sibling.siblingIds.push(childId);
    }
    return true;
  }

  getSpouses(memberId: string): FamilyMember[] {
    const member = this.members.get(memberId);
    if (!member) return [];
    return member.spouseIds.map(id => this.members.get(id)).filter((m): m is FamilyMember => m !== undefined);
  }

  getChildren(memberId: string): FamilyMember[] {
    const member = this.members.get(memberId);
    if (!member) return [];
    return member.childrenIds.map(id => this.members.get(id)).filter((m): m is FamilyMember => m !== undefined);
  }

  getParents(memberId: string): [FamilyMember | null, FamilyMember | null] {
    const member = this.members.get(memberId);
    if (!member) return [null, null];
    const father = member.parentIds[0] ? this.members.get(member.parentIds[0]) ?? null : null;
    const mother = member.parentIds[1] ? this.members.get(member.parentIds[1]) ?? null : null;
    return [father, mother];
  }

  getDescendants(memberId: string, maxDepth = 3): FamilyMember[] {
    const result: FamilyMember[] = [];
    const collect = (id: string, depth: number) => {
      if (depth > maxDepth) return;
      const member = this.members.get(id);
      if (!member) return;
      for (const childId of member.childrenIds) {
        const child = this.members.get(childId);
        if (child) {
          result.push(child);
          collect(childId, depth + 1);
        }
      }
    };
    collect(memberId, 0);
    return result;
  }

  isRelated(a: string, b: string): boolean {
    const ancestors = new Set<string>();
    const collectAncestors = (id: string, depth: number) => {
      if (depth > 3) return;
      const member = this.members.get(id);
      if (!member) return;
      for (const pid of member.parentIds) {
        if (pid) {
          ancestors.add(pid);
          collectAncestors(pid, depth + 1);
        }
      }
    };
    collectAncestors(a, 0);
    const memberB = this.members.get(b);
    if (!memberB) return false;
    for (const pid of memberB.parentIds) {
      if (pid && ancestors.has(pid)) return true;
    }
    return false;
  }

  getAllMembers(): FamilyMember[] {
    return Array.from(this.members.values());
  }

  removeMember(id: string): boolean {
    const member = this.members.get(id);
    if (!member) return false;
    for (const spouseId of member.spouseIds) {
      const spouse = this.members.get(spouseId);
      if (spouse) {
        spouse.spouseIds = spouse.spouseIds.filter(s => s !== id);
      }
    }
    for (const childId of member.childrenIds) {
      const child = this.members.get(childId);
      if (child) {
        child.parentIds = [child.parentIds[0] === id ? null : child.parentIds[0], child.parentIds[1] === id ? null : child.parentIds[1]] as [string | null, string | null];
      }
    }
    return this.members.delete(id);
  }
}