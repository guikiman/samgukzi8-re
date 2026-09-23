// graphProbe 식만 단독 실행 — 페이지 로드 후 바로 (시나리오 없이)
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const HTTP_PORT = 8138, CDP_PORT = 9224;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, 'http://x');        let p = decodeURIComponent(url.pathname).replace(/^\//, '');
        if (!p || p === '/') p = 'index.html';
        const fp = join(PROJECT_ROOT, p);
        if (!fp.startsWith(PROJECT_ROOT) || !existsSync(fp)) { res.writeHead(404); res.end(); return; }
        const data = await readFile(fp);
        res.writeHead(200, { 'Content-Type': MIME[extname(fp)] ?? 'application/octet-stream' });
        res.end(data);
    } catch { res.writeHead(500); res.end(); }
});
await new Promise(r => server.listen(HTTP_PORT, r));

const CHROME_CANDIDATES = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
];
const chromePath = CHROME_CANDIDATES.find(c => existsSync(c));
const userData = mkdtempSync(join(tmpdir(), 'e2e_chrome_'));
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${userData}`, '--no-first-run', '--disable-gpu', '--disable-features=HttpsUpgrades', '--window-size=1600,1000', 'about:blank'], { stdio: 'ignore' });

const deadline = Date.now() + 30000;
while (Date.now() < deadline) { try { await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`); break; } catch { await delay(300); } }

const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
const page = targets.find(t => t.type === 'page');

// 최소 CDP (브라우저 내장 WebSocket 사용)
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const call = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
    const t = setTimeout(() => { throw new Error('EVAL TIMEOUT: ' + expr.slice(0, 80)); }, 8000);
    const r = await call('Runtime.evaluate', { expression: expr, returnByValue: true });
    clearTimeout(t);
    if (r.error) throw new Error('EVAL ERR: ' + JSON.stringify(r.error));
    return r.result?.result?.value;
};

await call('Runtime.enable');
await call('Page.enable');
await call('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
let booted = false;
for (let i = 0; i < 60; i++) { if (await evaluate('!!(window.__game && window.__game.getEngine())')) { booted = true; break; } await delay(500); }
console.log('booted:', booted);

// 시나리오 시작 후 3턴 진행 → graphProbe 단독
await evaluate("window.__game.startScenario('05', 0)");
await delay(2500);
await evaluate("document.getElementById('btn-next-month').click()");
await delay(2500);

console.log('btn-graph exists:', await evaluate("!!document.getElementById('btn-graph')"));
console.log('btn-graph disabled:', await evaluate("document.getElementById('btn-graph').disabled"));
console.log('graphProbe start');
const g = await evaluate("(function(){var b=document.getElementById('btn-graph');b.click();" +
    "var panel=document.getElementById('graph-panel');var canvas=document.getElementById('gp-canvas');" +
    "var detail=document.getElementById('gp-detail').textContent;" +
    "var out={open:panel.style.display,cw:canvas.width,rows:detail.split('gp-rel-row').length-1," +
    "hint:detail.includes('인맥')||detail.includes('노드')};" +
    "b.click();out.closed=panel.style.display==='none';return out;})()");
console.log('graphProbe full result:', JSON.stringify(g));
chrome.kill(); server.close(); process.exit(0);
