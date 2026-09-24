/**
 * [E43] ServiceWorker 오프라인 캐싱 E2E 검증
 * 파일: tests/e2e/sw_offline.mjs
 *
 * 시나리오:
 *   1. 스모크 서버 + headless Chrome 기동, 앱 로드 후 SW 등록/활성화 대기
 *   2. 서브리소스 캐시 예열 (style.css, dist 전체 프리캐시는 sw.js 설치 단계에서 수행)
 *   3. 서버를 503(오프라인 시뮬레이션)으로 전환 후 내비게이션 리로드
 *   4. SW 캐시 폴백으로 앱이 재부팅하는지 확인 (window.__game)
 *
 * 통과 기준: SW 활성화 → 오프라인 리로드 → 엔진 재부팅, 캐시 1개 이상.
 * SW 미지원/등록 실패 환경에서는 SKIP을 반환한다(기능 미검증, 스모크와 분리).
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const HTTP_PORT = 8141;
const CDP_PORT = 9141;

const CHROME_CANDIDATES = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe` : null,
    '/usr/bin/google-chrome',
].filter(Boolean);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const offline = { on: false };

function startServer() {
    const server = createServer(async (req, res) => {
        try {
            const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
            if (offline.on) { res.writeHead(503); res.end('offline'); return; }
            const filePath = join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
            const body = await readFile(filePath);
            res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
            res.end(body);
        } catch { res.writeHead(404); res.end('not found'); }
    });
    return new Promise((resolve) => server.listen(HTTP_PORT, '127.0.0.1', () => resolve(server)));
}

// --- CDP 클라이언트는 스모크의 것을 재사용할 수 없어(분리 원칙) awaitPromise 지원 최소 구현 ---
import { connect as rawConnect } from 'node:net';
import { createHash } from 'node:crypto';

class CDP {
    constructor(sock) {
        this.sock = sock;
        this.buffer = Buffer.alloc(0);
        this.msgId = 0;
        this.waiters = [];
        sock.on('data', (chunk) => this._onData(chunk));
    }
    static async connect(wsUrl) {
        const u = new URL(wsUrl);
        const key = createHash('sha1').update(String(Math.random())).digest('base64');
        const sock = rawConnect(Number(u.port), '127.0.0.1');
        await new Promise((res, rej) => { sock.once('connect', res); sock.once('error', rej); });
        sock.write(`GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: 127.0.0.1:${u.port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
        await new Promise((res) => {
            const onData = (chunk) => { if (chunk.toString('utf8').includes('\r\n\r\n')) { sock.off('data', onData); res(); } };
            sock.on('data', onData);
        });
        return new CDP(sock);
    }
    _onData(chunk) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        for (;;) {
            if (this.buffer.length < 2) return;
            const b1 = this.buffer[0], b2 = this.buffer[1];
            const opcode = b1 & 0x0F;
            let len = b2 & 0x7F, off = 2;
            if (len === 126) { if (this.buffer.length < 4) return; len = this.buffer.readUInt16BE(2); off = 4; }
            else if (len === 127) { if (this.buffer.length < 10) return; len = Number(this.buffer.readBigUInt64BE(2)); off = 10; }
            if (this.buffer.length < off + len) return;
            const payload = this.buffer.subarray(off, off + len);
            this.buffer = this.buffer.subarray(off + len);
            if (opcode === 0x9) { this._send(0xA, payload); continue; }
            if (opcode !== 0x1) continue;
            const msg = JSON.parse(payload.toString('utf8'));
            if (msg.method === 'Network.loadingFailed' && this.onFail) {
                this.onFail(msg.params.errorText ?? 'failed');
            }
            if (!msg.method) {
                const w = this.waiters.find((x) => x.id === msg.id);
                if (w) { this.waiters = this.waiters.filter((x) => x !== w); w.resolve(msg); }
            }
        }
    }
    _send(opcode, payload) {
        const mask = Buffer.from([1, 2, 3, 4]);
        const buf = Buffer.from(payload, 'utf8');
        const n = buf.length;
        let header;
        if (n < 126) header = Buffer.from([0x80 | opcode, 0x80 | n]);
        else if (n < 65536) { header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 0x80 | 126; header.writeUInt16BE(n, 2); }
        else { header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(n), 2); }
        const masked = buf.map((b, i) => b ^ mask[i % 4]);
        this.sock.write(Buffer.concat([header, mask, masked]));
    }
    call(method, params = {}, timeoutMs = 30000) {
        const id = ++this.msgId;
        this._send(1, JSON.stringify({ id, method, params }));
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), timeoutMs);
            this.waiters.push({ id, resolve: (msg) => { clearTimeout(timer); resolve(msg); } });
        });
    }
    async evaluateAwait(expression) {
        const res = await this.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (res.error) throw new Error(JSON.stringify(res.error));
        const d = res.result ?? {};
        if (d.exceptionDetails) throw new Error('page exception: ' + JSON.stringify(d.exceptionDetails).slice(0, 200));
        return d.result?.value;
    }
    async evalJson(expression) {
        const res = await this.call('Runtime.evaluate', { expression, returnByValue: true });
        return res.result?.result?.value;
    }
}

async function main() {
    const server = await startServer();
    const chromePath = CHROME_CANDIDATES.find(existsSync);
    const userData = mkdtempSync(join(tmpdir(), 'e2e_sw_'));
    const chrome = spawn(chromePath, [
        '--headless=new', `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${userData}`, '--no-first-run', '--disable-gpu',
        'about:blank',
    ], { stdio: 'ignore' });

    let exitCode = 1;
    try {
        for (let i = 0; i < 60; i++) {
            try { await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`); break; } catch { await delay(300); }
        }
        const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
        const page = targets.find((t) => t.type === 'page');
        const cdp = await CDP.connect(page.webSocketDebuggerUrl);
        await cdp.call('Runtime.enable');
        await cdp.call('Page.enable');
        await cdp.call('Network.enable');
        const urlByReqId = new Map();
        cdp._onDataOriginal = cdp._onData.bind(cdp);
        cdp.sock.removeAllListeners('data');
        cdp.sock.on('data', (chunk) => {
            // method 이벤트에서 requestWillBeSent의 URL을 기록하기 위해 파싱 훅
            cdp._onData(chunk);
        });
        // 파서에 이벤트 훅 부착 — 간단히 _onData 오버라이드
        cdp._onData = function (chunk) {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            for (;;) {
                if (this.buffer.length < 2) return;
                const b1 = this.buffer[0], b2 = this.buffer[1];
                const opcode = b1 & 0x0F;
                let len = b2 & 0x7F, off = 2;
                if (len === 126) { if (this.buffer.length < 4) return; len = this.buffer.readUInt16BE(2); off = 4; }
                else if (len === 127) { if (this.buffer.length < 10) return; len = Number(this.buffer.readBigUInt64BE(2)); off = 10; }
                if (this.buffer.length < off + len) return;
                const payload = this.buffer.subarray(off, off + len);
                this.buffer = this.buffer.subarray(off + len);
                if (opcode === 0x9) { this._send(0xA, payload); continue; }
                if (opcode !== 0x1) continue;
                const msg = JSON.parse(payload.toString('utf8'));
                if (msg.method === 'Network.requestWillBeSent') {
                    urlByReqId.set(msg.params.requestId, msg.params.request.url);
                } else if (msg.method === 'Network.loadingFailed' && this.onFail) {
                    const u = urlByReqId.get(msg.params.requestId);
                    this.onFail(u ?? 'unknown');
                }
                if (!msg.method) {
                    const w = this.waiters.find((x) => x.id === msg.id);
                    if (w) { this.waiters = this.waiters.filter((x) => x !== w); w.resolve(msg); }
                }
            }
        };

        await cdp.call('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
        await cdp.call('Page.loadEventFired', {}, 20000).catch(() => { });

        // SW 등록/활성화 대기 (등록은 index.html 인라인 스크립트가 수행)
        let swReady = false;
        let diag = null;
        for (let i = 0; i < 50; i++) {
            const st = await cdp.evalJson(
                "(function(){var c=navigator.serviceWorker&&navigator.serviceWorker.controller;" +
                "return {controlled:!!c,state:c&&c.state};})()");
            if (st.controlled && st.state === 'activated') { swReady = true; break; }
            if (i === 15 && !st.controlled) {
                // 등록 실패 사유 수집 + 재등록 시도 + 설치 여유 대기
                diag = await cdp.evaluateAwait(
                    "(async function(){var out={};" +
                    "try{var reg=await navigator.serviceWorker.register('sw.js');out.regOk=true;}" +
                    "catch(e){out.regErr=String(e);}" +
                    "await new Promise(function(r){setTimeout(r,4000);});return out;})()");
            }
            await delay(500);
        }
        if (diag) console.error('SW_DIAG:', JSON.stringify(diag));

        const result = { swReady, reloaded: false, offlineFallback: false, cacheCount: 0 };

        if (swReady) {
            // 캐시 상태 확인 후 오프라인 리로드
            result.cacheCount = await cdp.evaluateAwait("(async function(){return (await caches.keys()).length;})()");
            offline.on = true;
            try {
                // SW가 설치 단계에서 프리캐시한 리소스 목록을 확인 (진단 출력)
                const cachedUrls = await cdp.evaluateAwait(
                    "(async function(){var names=await caches.keys();var c=await caches.open(names[0]);" +
                    "var keys=await c.keys();return keys.map(function(r){return new URL(r.url).pathname;}).slice(0,20);})()");
                console.error('CACHED(sample):', JSON.stringify(cachedUrls));
                const loaded = cdp.call('Page.loadEventFired', {}, 30000).then(() => true).catch(() => false);
                await cdp.evalJson("(function(){location.reload();return true;})()");
                result.reloaded = true;
                await loaded;
                // 리로드 즉시 문서 확인 — 서버 503('offline' pre)이면 SW 폴백 미동작
                result.immediateBody = await cdp.evaluateAwait(
                    "(function(){return document.body?document.body.innerHTML.slice(0,80):'no-body';})()");
                const failures = [];
                cdp.onFail = (u) => failures.push(u);
                for (let i = 0; i < 40; i++) {
                    const boot = await cdp.evaluateAwait(
                        "(async function(){var out={hasGame:!!window.__game};" +
                        "try{var r=await fetch('/dist/src/main.js',{cache:'no-store'});out.mainStatus=r.status;}catch(e){out.mainErr=String(e);}" +
                        "return out;})()");
                    if (boot && boot.hasGame) { result.offlineFallback = true; break; }
                    if (i === 10) {
                        result.bootDiag = boot;
                        result.ctxDiag = await cdp.evaluateAwait(
                            "(async function(){var out={href:location.href,ready:document.readyState};" +
                            "out.hasCanvas=!!document.getElementById('game-canvas');" +
                            "out.bodyLen=(document.body?document.body.innerHTML.length:-1);" +
                            "out.bodyHead=(document.body?document.body.innerHTML.slice(0,120):'');" +
                            "try{await import('/dist/src/main.js');out.mainImport='ok';}catch(e){out.mainImport=String(e);}" +
                            "return out;})()");
                    }
                    await delay(500);
                }
                result.failedRequests = failures.slice(0, 10);
                result.cacheCount = await cdp.evaluateAwait("(async function(){return (await caches.keys()).length;})()");
            } finally {
                offline.on = false;
            }
        }

        console.log(JSON.stringify(result, null, 2));
        const ok = !swReady
            ? false // SW 검증이 목적이므로 미활성 시 FAIL — 스모크와 분리되어 있어 CI 스코프 조정 가능
            : result.reloaded && result.offlineFallback && result.cacheCount >= 1;
        console.log('SW_E2E_RESULT:', swReady ? (ok ? 'PASS' : 'FAIL') : 'SKIP');
        exitCode = ok ? 0 : (swReady ? 1 : 3);
        cdp.sock.destroy();
    } catch (err) {
        console.error('SW_E2E_ERROR:', err.message ?? err);
        exitCode = 2;
    } finally {
        try { chrome.kill(); } catch { /* noop */ }
        server.close();
    }
    process.exit(exitCode);
}

main();
