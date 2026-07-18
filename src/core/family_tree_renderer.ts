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

export class FamilyTreeRenderer {
  private readonly NODE_WIDTH = 120;
  private readonly NODE_HEIGHT = 40;
  private readonly GENERATION_GAP = 120;
  private readonly SPOUSE_GAP = 140;

  buildTree(members: FamilyMember[], rootMemberId?: string): { nodes: FamilyTreeNode[]; edges: FamilyTreeEdge[] } {
    const nodes: FamilyTreeNode[] = [];
    const edges: FamilyTreeEdge[] = [];
    const candidates = rootMemberId
      ? this.getSubTree(members, rootMemberId)
      : members;

    const generationMap = this.assignGenerations(candidates, rootMemberId);
    const generationGroups = this.groupByGeneration(candidates, generationMap);

    for (const [gen, genMembers] of generationGroups) {
      genMembers.forEach((member, idx) => {
        nodes.push({
          id: member.id,
          name: member.name,
          gender: member.gender,
          generation: gen,
          spouseIds: member.spouseIds,
          childrenIds: member.childrenIds,
          isAlive: member.isAlive,
          x: idx * this.SPOUSE_GAP + this.NODE_WIDTH / 2,
          y: gen * this.GENERATION_GAP + this.NODE_HEIGHT / 2,
        });
      });
    }

    for (const member of candidates) {
      for (const spouseId of member.spouseIds) {
        if (member.id < spouseId) {
          edges.push({ from: member.id, to: spouseId, type: "marriage" });
        }
      }
      for (const childId of member.childrenIds) {
        edges.push({ from: member.id, to: childId, type: "parent_child" });
      }
    }

    return { nodes, edges };
  }

  renderSVG(nodes: FamilyTreeNode[], edges: FamilyTreeEdge[]): string {
    const svgWidth = Math.max(800, (nodes.length + 1) * this.SPOUSE_GAP);
    const maxGen = Math.max(...nodes.map(n => n.generation), 1);
    const svgHeight = (maxGen + 2) * this.GENERATION_GAP;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background:#f5f0e8;font-family:serif;">\n`;

    for (const edge of edges) {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) continue;
      const color = edge.type === "marriage" ? "#c0392b" : edge.type === "parent_child" ? "#2c3e50" : "#7f8c8d";
      svg += `  <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${color}" stroke-width="2" opacity="0.6"/>\n`;
    }

    for (const node of nodes) {
      const fill = node.gender === "M" ? "#3498db" : "#e91e63";
      const opacity = node.isAlive ? "1" : "0.4";
      svg += `  <rect x="${node.x - this.NODE_WIDTH / 2}" y="${node.y - this.NODE_HEIGHT / 2}" width="${this.NODE_WIDTH}" height="${this.NODE_HEIGHT}" rx="6" fill="${fill}" opacity="${opacity}" stroke="#2c3e50" stroke-width="1"/>\n`;
      svg += `  <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${node.name}</text>\n`;
    }

    svg += `</svg>`;
    return svg;
  }

  private getSubTree(members: FamilyMember[], rootId: string): FamilyMember[] {
    const result: FamilyMember[] = [];
    const visited = new Set<string>();
    const queue = [rootId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const member = members.find(m => m.id === id);
      if (!member) continue;
      result.push(member);
      queue.push(...member.spouseIds, ...member.childrenIds);
    }
    return result;
  }

  private assignGenerations(members: FamilyMember[], rootId?: string): Map<string, number> {
    const genMap = new Map<string, number>();
    const queue: Array<{ id: string; gen: number }> = [];

    if (rootId) {
      queue.push({ id: rootId, gen: 0 });
    } else {
      const oldest = members.reduce((a, b) => a.birthYear < b.birthYear ? a : b);
      queue.push({ id: oldest.id, gen: 0 });
    }

    while (queue.length > 0) {
      const { id, gen } = queue.shift()!;
      if (genMap.has(id)) continue;
      genMap.set(id, gen);
      const member = members.find(m => m.id === id);
      if (!member) continue;
      for (const childId of member.childrenIds) {
        queue.push({ id: childId, gen: gen + 1 });
      }
    }
    return genMap;
  }

  private groupByGeneration(members: FamilyMember[], genMap: Map<string, number>): Map<number, FamilyMember[]> {
    const groups = new Map<number, FamilyMember[]>();
    for (const member of members) {
      const gen = genMap.get(member.id) ?? 0;
      if (!groups.has(gen)) groups.set(gen, []);
      groups.get(gen)!.push(member);
    }
    return groups;
  }
}