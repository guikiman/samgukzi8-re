/**
 * [Task 92] D3.js/Canvas 하이브리드 인맥 그래프 뷰어 — RelationshipGraphViewer
 *
 * 관계 그래프를 Canvas에 렌더링하고 SVG로 내보내는 뷰어.
 */

import type { OfficerID, RelationshipEdge } from "./types.js";

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly group: string;
  readonly radius: number;
  readonly color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GraphLink {
  readonly source: string;
  readonly target: string;
  readonly type: string;
  readonly affinity: number;
  readonly color: string;
  readonly width: number;
}

export interface GraphLayout {
  readonly nodes: GraphNode[];
  readonly links: GraphLink[];
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export class RelationshipGraphViewer {
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private viewport: Viewport = { x: 0, y: 0, zoom: 1 };
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;

  private readonly edgeColors: Record<string, string> = {
    FRIEND: "#27ae60", RIVAL: "#e74c3c", SWORN_BROTHER: "#f39c12",
    NEMESIS: "#c0392b", FAMILY: "#8e44ad", SPOUSE: "#e91e63", SUBORDINATE: "#3498db",
  };

  private readonly edgeWidths: Record<string, number> = {
    FRIEND: 1.5, RIVAL: 2, SWORN_BROTHER: 3,
    NEMESIS: 2.5, FAMILY: 2, SPOUSE: 2.5, SUBORDINATE: 1,
  };

  private readonly factionColors = [
    "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
    "#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b",
  ];

  buildGraph(
    officers: Array<{ id: string; name: string; factionId: string }>,
    relationships: RelationshipEdge[],
    centerOfficerId?: string,
  ): GraphLayout {
    const nodeMap = new Map<string, GraphNode>();
    const linkList: GraphLink[] = [];

    const getColor = (factionId: string): string => {
      let hash = 0;
      for (let i = 0; i < factionId.length; i++) {
        hash = ((hash << 5) - hash) + factionId.charCodeAt(i);
      }
      return this.factionColors[Math.abs(hash) % this.factionColors.length];
    };

    const addNode = (id: string) => {
      if (nodeMap.has(id)) return;
      const officer = officers.find((o) => o.id === id);
      if (!officer) return;
      nodeMap.set(id, {
        id, label: officer.name, group: officer.factionId,
        radius: 8, color: getColor(officer.factionId),
        x: 0, y: 0, vx: 0, vy: 0,
      });
    };

    for (const rel of relationships) {
      if (centerOfficerId && rel.source !== centerOfficerId && rel.target !== centerOfficerId) continue;
      addNode(rel.source);
      addNode(rel.target);
      linkList.push({
        source: rel.source, target: rel.target, type: rel.type,
        affinity: rel.affinity,
        color: this.edgeColors[rel.type] ?? "#95a5a6",
        width: this.edgeWidths[rel.type] ?? 1,
      });
    }

    if (!centerOfficerId) {
      for (const o of officers) addNode(o.id);
    }

    return { nodes: Array.from(nodeMap.values()), links: linkList };
  }

  layoutGraph(graph: GraphLayout, width: number, height: number): GraphLayout {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const angleStep = (2 * Math.PI) / Math.max(1, graph.nodes.length);

    const nodes = graph.nodes.map((node, i) => ({
      ...node,
      x: cx + radius * Math.cos(angleStep * i - Math.PI / 2),
      y: cy + radius * Math.sin(angleStep * i - Math.PI / 2),
    }));

    return { nodes, links: graph.links };
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  render(graph: GraphLayout): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(this.viewport.x, this.viewport.y);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);

    for (const link of graph.links) {
      const source = graph.nodes.find((n) => n.id === link.source);
      const target = graph.nodes.find((n) => n.id === link.target);
      if (!source || !target) continue;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = link.color;
      ctx.lineWidth = link.width;
      ctx.stroke();
    }

    for (const node of graph.nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#2c3e50";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + node.radius + 12);
    }

    ctx.restore();
  }

  startAutoRender(graph: GraphLayout, fps = 30): void {
    const interval = 1000 / fps;
    const loop = () => {
      this.render(graph);
      this.animationId = window.setTimeout(loop, interval);
    };
    loop();
  }

  stopAutoRender(): void {
    if (this.animationId !== null) {
      clearTimeout(this.animationId);
      this.animationId = null;
    }
  }

  setViewport(v: Partial<Viewport>): void {
    this.viewport = { ...this.viewport, ...v };
  }

  exportSVG(graph: GraphLayout, width = 800, height = 600): string {
    const layout = this.layoutGraph(graph, width, height);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background:#f5f0e8;">\n`;
    for (const link of layout.links) {
      const s = layout.nodes.find((n) => n.id === link.source);
      const t = layout.nodes.find((n) => n.id === link.target);
      if (!s || !t) continue;
      svg += `  <line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="${link.color}" stroke-width="${link.width}" opacity="0.6"/>\n`;
    }
    for (const node of layout.nodes) {
      svg += `  <circle cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${node.color}" stroke="#2c3e50" stroke-width="1.5"/>\n`;
      svg += `  <text x="${node.x}" y="${node.y + node.radius + 12}" text-anchor="middle" fill="#2c3e50" font-size="10" font-family="sans-serif">${node.label}</text>\n`;
    }
    svg += `</svg>`;
    return svg;
  }
}
