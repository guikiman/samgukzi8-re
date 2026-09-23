/**
 * [Task 92] D3.js/Canvas 하이브리드 인맥 그래프 뷰어 — RelationshipGraphViewer
 *
 * 관계 그래프를 Canvas에 렌더링하고 SVG로 내보내는 뷰어.
 */
export class RelationshipGraphViewer {
    constructor() {
        this.nodes = [];
        this.links = [];
        this.viewport = { x: 0, y: 0, zoom: 1 };
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.edgeColors = {
            FRIEND: "#27ae60", RIVAL: "#e74c3c", SWORN_BROTHER: "#f39c12",
            NEMESIS: "#c0392b", FAMILY: "#8e44ad", SPOUSE: "#e91e63", SUBORDINATE: "#3498db",
        };
        this.edgeWidths = {
            FRIEND: 1.5, RIVAL: 2, SWORN_BROTHER: 3,
            NEMESIS: 2.5, FAMILY: 2, SPOUSE: 2.5, SUBORDINATE: 1,
        };
        this.factionColors = [
            "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
            "#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b",
        ];
        /**
         * [269 성능] 노드 id → 인덱스 Map. render/exportSVG에서 링크별 nodes.find() O(N·E)
         * 스캔을 O(1) 조회로 대체 — 1,000노드·5,000엣지에서 프레임당 수백만 번의 선형 스캔 제거.
         */
        this.nodeIndex = new Map();
    }
    buildGraph(officers, relationships, centerOfficerId) {
        const nodeMap = new Map();
        const linkList = [];
        const getColor = (factionId) => {
            let hash = 0;
            for (let i = 0; i < factionId.length; i++) {
                hash = ((hash << 5) - hash) + factionId.charCodeAt(i);
            }
            return this.factionColors[Math.abs(hash) % this.factionColors.length];
        };
        const addNode = (id) => {
            if (nodeMap.has(id))
                return;
            const officer = officers.find((o) => o.id === id);
            if (!officer)
                return;
            nodeMap.set(id, {
                id, label: officer.name, group: officer.factionId,
                radius: 8, color: getColor(officer.factionId),
                x: 0, y: 0, vx: 0, vy: 0,
            });
        };
        for (const rel of relationships) {
            if (centerOfficerId && rel.source !== centerOfficerId && rel.target !== centerOfficerId)
                continue;
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
            for (const o of officers)
                addNode(o.id);
        }
        return { nodes: Array.from(nodeMap.values()), links: linkList };
    }
    layoutGraph(graph, width, height) {
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
    attachCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }
    rebuildNodeIndex(nodes) {
        this.nodeIndex = new Map();
        for (let i = 0; i < nodes.length; i++)
            this.nodeIndex.set(nodes[i].id, i);
    }
    render(graph) {
        if (!this.ctx || !this.canvas)
            return;
        const ctx = this.ctx;
        const canvas = this.canvas;
        this.rebuildNodeIndex(graph.nodes);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(this.viewport.x, this.viewport.y);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);
        for (const link of graph.links) {
            const si = this.nodeIndex.get(link.source);
            const ti = this.nodeIndex.get(link.target);
            if (si === undefined || ti === undefined)
                continue;
            const source = graph.nodes[si];
            const target = graph.nodes[ti];
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
    startAutoRender(graph, fps = 30) {
        const interval = 1000 / fps;
        const loop = () => {
            this.render(graph);
            this.animationId = window.setTimeout(loop, interval);
        };
        loop();
    }
    stopAutoRender() {
        if (this.animationId !== null) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }
    setViewport(v) {
        this.viewport = { ...this.viewport, ...v };
    }
    exportSVG(graph, width = 800, height = 600) {
        const layout = this.layoutGraph(graph, width, height);
        // [269 성능] 동일 O(N·E) 병목을 Map 인덱스로 해소
        const index = new Map();
        for (const n of layout.nodes)
            index.set(n.id, n);
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background:#f5f0e8;">\n`;
        for (const link of layout.links) {
            const s = index.get(link.source);
            const t = index.get(link.target);
            if (!s || !t)
                continue;
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
//# sourceMappingURL=relationship_graph_viewer.js.map