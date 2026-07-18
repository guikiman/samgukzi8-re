import type { OfficerID, RelationType } from "./types";

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly group: string;
  weight: number;
  readonly color: string;
}

export interface GraphEdge {
  readonly source: string;
  readonly target: string;
  readonly type: RelationType;
  readonly affinity: number;
  readonly width: number;
  readonly color: string;
}

export class RelationshipGraphBuilder {
  buildGraph(
    officers: Array<{ id: string; name: string; factionId: string }>,
    relationships: Array<{ source: OfficerID; target: OfficerID; type: RelationType; affinity: number }>,
    centerOfficerId?: string,
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const officerMap = new Map(officers.map((o) => [o.id, o]));
    const nodeMap = new Map<string, GraphNode>();
    const edgeList: GraphEdge[] = [];
    const processed = new Set<string>();

    const edgeColorMap: Record<string, string> = {
      FRIEND: "#27ae60", RIVAL: "#e74c3c", SWORN_BROTHER: "#f39c12",
      NEMESIS: "#c0392b", FAMILY: "#8e44ad", SPOUSE: "#e91e63", SUBORDINATE: "#3498db",
    };

    const edgeWidthMap: Record<string, number> = {
      FRIEND: 1.5, RIVAL: 2, SWORN_BROTHER: 3,
      NEMESIS: 2.5, FAMILY: 2, SPOUSE: 2.5, SUBORDINATE: 1,
    };

    const addNode = (id: string) => {
      if (nodeMap.has(id)) return;
      const officer = officerMap.get(id);
      if (!officer) return;
      nodeMap.set(id, {
        id, label: officer.name,
        group: officer.factionId,
        weight: 5,
        color: this.getFactionColor(officer.factionId),
      });
    };

    const getAffinityColor = (affinity: number): string => {
      if (affinity >= 75) return "#27ae60";
      if (affinity >= 50) return "#2ecc71";
      if (affinity >= 30) return "#f39c12";
      return "#e74c3c";
    };

    if (centerOfficerId) {
      addNode(centerOfficerId);
      const centerOfficer = officerMap.get(centerOfficerId);
      if (centerOfficer) {
        const centerNode = nodeMap.get(centerOfficerId)!;
        centerNode.weight = 10;
      }
    }

    for (const rel of relationships) {
      const key = [rel.source, rel.target].sort().join("_");
      if (processed.has(key)) continue;
      processed.add(key);

      if (centerOfficerId && rel.source !== centerOfficerId && rel.target !== centerOfficerId) continue;

      addNode(rel.source);
      addNode(rel.target);

      edgeList.push({
        source: rel.source,
        target: rel.target,
        type: rel.type,
        affinity: rel.affinity,
        width: edgeWidthMap[rel.type] ?? 1,
        color: edgeColorMap[rel.type] ?? "#95a5a6",
      });
    }

    if (!centerOfficerId) {
      for (const officer of officers) {
        addNode(officer.id);
      }
    }

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }

  private factionColorIndex = 0;
  private readonly factionColors = [
    "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
    "#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b",
  ];

  private getFactionColor(factionId: string): string {
    let hash = 0;
    for (let i = 0; i < factionId.length; i++) {
      hash = ((hash << 5) - hash) + factionId.charCodeAt(i);
    }
    return this.factionColors[Math.abs(hash) % this.factionColors.length];
  }

  generateSVG(nodes: GraphNode[], edges: GraphEdge[], width = 800, height = 600): string {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const angleStep = (2 * Math.PI) / Math.max(1, nodes.length);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background:#f5f0e8;">\n`;

    const positions = nodes.map((node, i) => ({
      id: node.id,
      x: cx + radius * Math.cos(angleStep * i - Math.PI / 2),
      y: cy + radius * Math.sin(angleStep * i - Math.PI / 2),
    }));

    for (const edge of edges) {
      const from = positions.find((p) => p.id === edge.source);
      const to = positions.find((p) => p.id === edge.target);
      if (!from || !to) continue;
      svg += `  <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${edge.color}" stroke-width="${edge.width}" opacity="0.6"/>\n`;
    }

    for (let i = 0; i < nodes.length; i++) {
      const pos = positions[i];
      const node = nodes[i];
      svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="${node.weight}" fill="${node.color}" stroke="#2c3e50" stroke-width="1.5"/>\n`;
      svg += `  <text x="${pos.x}" y="${pos.y + node.weight + 12}" text-anchor="middle" fill="#2c3e50" font-size="10" font-family="sans-serif">${node.label}</text>\n`;
    }

    svg += `</svg>`;
    return svg;
  }
}