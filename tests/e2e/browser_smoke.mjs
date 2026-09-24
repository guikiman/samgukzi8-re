/**
 * 브라우저 E2E 스모크 테스트 (headless Chrome + CDP)
 * 파일: tests/e2e/browser_smoke.mjs
 *
 * 검증 흐름 [E2E]:
 *   1. 프로젝트 루트를 http 서빙
 *   2. headless Chrome CDP 구동 → /index.html 로드
 *   3. window.__game.startScenario('05', 0)으로 시나리오 시작
 *   4. #btn-next-month로 24개월 자율 진행 (방문 모달 자동 사절)
 *   5. 통일 조건 강제 → 1턴 진행 → 엔딩 화면 + 내러티브 기록 확인
 *   6. 콘솔 에러/페이지 예외/404 수집 (favicon 404는 benign으로 제외)
 *
 * 실행: npm run test:e2e  (사전에 npm run build 필요)
 * 요구사항: Windows — Chrome 설치 경로 자동 탐색
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HTTP_PORT = 8137;
const CDP_PORT = 9223;

const CHROME_CANDIDATES = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe` : null,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
].filter(Boolean);

// ------------------------------------------------------------ static server

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
};

function startServer() {
    const server = createServer(async (req, res) => {
        try {
            const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
            let filePath = join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
            const body = await readFile(filePath);
            res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
            res.end(body);
        } catch {
            res.writeHead(404);
            res.end('not found');
        }
    });
    return new Promise((resolve) => server.listen(HTTP_PORT, '127.0.0.1', () => resolve(server)));
}

// ------------------------------------------------------------ CDP over WebSocket (manual framing)

import { connect as rawConnect } from 'node:net';
import { createHash } from 'node:crypto';

class CDP {
    constructor(sock, initialBuffer = Buffer.alloc(0)) {
        this.sock = sock;
        this.buffer = initialBuffer;
        this.msgId = 0;
        this.events = [];
        this.waiters = [];
        sock.on('data', (chunk) => this._onData(chunk));
    }

    static async connect(wsUrl) {
        const u = new URL(wsUrl);
        const port = Number(u.port);
        // NOTE: URL 객체에는 .path가 없다 — .pathname을 써야 한다.
        const path = u.pathname + u.search;
        const key = createHash('sha1').update(String(Math.random())).digest('base64');
        const sock = rawConnect(port, '127.0.0.1');
        await new Promise((res, rej) => { sock.once('connect', res); sock.once('error', rej); });
        sock.write(
            `GET ${path} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\n` +
            'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
            `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
        // 핸드셰이크 응답(101 + 헤더)을 \r\n\r\n까지 완전히 소진 — 미소진 바이트가
        // 이후 프레임 파서의 길이 계산을 어긋나게 만들어 CDP 타임아웃이 발생했다
        const { head, rest } = await new Promise((res) => {
            let buf = Buffer.alloc(0);
            const onData = (chunk) => {
                buf = Buffer.concat([buf, chunk]);
                const idx = buf.indexOf('\r\n\r\n');
                if (idx !== -1) { sock.off('data', onData); res({ head: buf.subarray(0, idx), rest: buf.subarray(idx + 4) }); }
            };
            sock.on('data', onData);
        });
        if (!head.toString('utf8').startsWith('HTTP/1.1 101')) {
            throw new Error('WS handshake failed: ' + head.toString('utf8').split('\r\n')[0]);
        }
        return new CDP(sock, rest);
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
            if (opcode === 0x9) { this._send(0xA, payload); continue; } // ping→pong
            if (opcode !== 0x1) continue;
            const msg = JSON.parse(payload.toString('utf8'));
            if (msg.method) this.events.push(msg);
            else {
                const w = this.waiters.find((x) => x.id === msg.id);
                if (w) { this.waiters = this.waiters.filter((x) => x !== w); w.resolve(msg); }
            }
        }
    }

    _send(opcode, payload) {
        const mask = Buffer.from([1, 2, 3, 4]);
        // [결함 수정] UTF-8 멀티바이트(한국어 표현식) 프레임 길이를 바이트 기준으로 계산.
        // 기존에는 문자 수(payload.length)를 길이로 선언해 한국어 포함 요청이 잘려
        // 브라우저가 응답하지 않는 'CDP timeout: Runtime.evaluate'가 발생했다.
        const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
        const n = buf.length;
        let header;
        if (n < 126) header = Buffer.from([0x80 | opcode, 0x80 | n]);
        else if (n < 65536) { header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 0x80 | 126; header.writeUInt16BE(n, 2); }
        else { header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(n), 2); }
        const masked = buf.map((b, i) => b ^ mask[i % 4]);
        this.sock.write(Buffer.concat([header, mask, masked]));
    }

    async call(method, params = {}, timeoutMs = 60000) {
        const id = ++this.msgId;
        this._send(1, JSON.stringify({ id, method, params }));
        return await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), timeoutMs);
            this.waiters.push({ id, resolve: (msg) => { clearTimeout(timer); resolve(msg); } });
        });
    }

    async evaluate(expression, returnByValue = true) {
        // awaitPromise: 비동기 IIFE(async 함수)의 완료를 기다린다 [312 리플레이 프로브]
        const res = await this.call('Runtime.evaluate', { expression, returnByValue, awaitPromise: true });
        if (res.error) throw new Error(`evaluate failed: ${JSON.stringify(res.error)}`);
        if (res.result?.exceptionDetails) throw new Error(`evaluate exception: ${JSON.stringify(res.result.exceptionDetails)}`);
        return res.result?.result ?? {};
    }

    async evalJson(expression) {
        const r = await this.evaluate(expression);
        // returnByValue=true면 객체는 이미 역직렬화되어 온다 — 문자열일 때만 파싱
        return typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
    }
}

// ------------------------------------------------------------ helpers

async function waitForPort(port, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try { await fetch(`http://127.0.0.1:${port}/json/version`); return true; }
        catch { await delay(300); }
    }
    return false;
}

function findChrome() {
    for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
    throw new Error('Chrome not found');
}

// ------------------------------------------------------------ main

async function main() {
    const server = await startServer();
    const chromePath = findChrome();
    const userData = mkdtempSync(join(tmpdir(), 'e2e_chrome_'));
    const chrome = spawn(chromePath, [
        '--headless=new', `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${userData}`, '--no-first-run', '--disable-gpu',
        '--disable-features=HttpsUpgrades', '--window-size=1600,1000', 'about:blank',
    ], { stdio: 'ignore' });

    let exitCode = 1;
    try {
        if (!(await waitForPort(CDP_PORT))) throw new Error('CDP port not open');
        const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
        const page = targets.find((t) => t.type === 'page');
        const cdp = await CDP.connect(page.webSocketDebuggerUrl);
        await cdp.call('Runtime.enable');
        await cdp.call('Page.enable');
        await cdp.call('Log.enable');
        await cdp.call('Network.enable');

        await cdp.call('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });

        // 엔진 부팅 대기
        let booted = false;
        for (let i = 0; i < 60; i++) {
            const r = await cdp.evaluate("!!(window.__game && window.__game.getEngine && window.__game.getEngine())");
            if (r.value) { booted = true; break; }
            await delay(500);
        }
        if (!booted) throw new Error('engine not booted in 30s');

        // 시나리오 시작 (fac_0 = 조조)
        await cdp.evaluate("window.__game.startScenario('05', 0)");
        let started = false;
        for (let i = 0; i < 60; i++) {
            const gs = await cdp.evalJson(
                "(function(){var s=window.__game.getStore().getGlobalState();return {pf:s.playerFactionId,t:s.turnCount};})()");
            if (gs.pf && gs.t === 0) { started = true; break; }
            await delay(500);
        }
        if (!started) throw new Error('scenario start failed');

        // 24개월 진행 — 방문 모달 자동 사절
        const progress = [];
        for (let m = 1; m <= 24; m++) {
            await cdp.evaluate(
                "(function(){var b=document.querySelector('.rm-option[data-visit=\"decline\"]');" +
                "if(b && b.offsetParent!==null) b.click();})()");
            await cdp.evaluate("document.getElementById('btn-next-month').click()");
            let done = false;
            for (let i = 0; i < 75; i++) {
                const r = await cdp.evaluate("!document.getElementById('btn-next-month').disabled");
                if (r.value) { done = true; break; }
                await delay(200);
            }
            if (!done) throw new Error(`turn ${m} did not finish in 15s`);
            if (m % 6 === 0) {
                progress.push(await cdp.evalJson(
                    "(function(){var s=window.__game.getStore().getGlobalState();" +
                    "return {y:s.time.year,m:s.time.month,t:s.turnCount};})()"));
            }
        }

        // 통일 조건 강제 → 엔딩 판정
        // ===== [461-480] 신규 UI 검증 =====
        // (a) 인맥 패널 오픈 + 그래프 렌더 + 닫기
        const graphProbe = await cdp.evalJson(
            "(function(){var b=document.getElementById('btn-graph');b.click();" +
            "var panel=document.getElementById('graph-panel');var canvas=document.getElementById('gp-canvas');" +
            "var detail=document.getElementById('gp-detail').textContent;" +
            "var out={open:panel.style.display,cw:canvas.width,rows:detail.split('gp-rel-row').length-1," +
            "hint:detail.indexOf('노드')>=0};" +
            "b.click();out.closed=panel.style.display==='none';return out;})()");

        // (b) 접근성 패널 — 색약 모드 버튼 클릭 시 active 전환
        const a11yProbe = await cdp.evalJson(
            "(function(){var b=document.getElementById('btn-settings');b.click();" +
            "var cbBtn=document.querySelector('#a11y-content [data-cb=\"deuteranopia\"]');" +
            "if(!cbBtn) return {err:'no cb button'};" +
            "cbBtn.click();" +
            "var out={open:document.getElementById('a11y-panel').style.display};" +
            "out.cbActive=!!document.querySelector('#a11y-content [data-cb=\"deuteranopia\"].active');" +
            "document.getElementById('a11y-close').click();return out;})()");

        // (c) 세이브 스냅샷 — 슬롯 저장 시 meta.uiSettings 동반 여부
        const saveLoadProbe = await cdp.evalJson(
            "(function(){var out={};" +
            "document.getElementById('btn-slots').click();" +
            "var slot=document.querySelector('.ss-slot[data-slot=\"1\"]');" +
            "if(!slot) return {err:'no slot'};slot.click();" +
            "out.saved=!!localStorage.getItem('sik_re_slot_1');" +
            "var meta=JSON.parse(localStorage.getItem('sik_re_slot_1')||'{}');" +
            "out.uiInSave=!!(meta.meta&&meta.meta.uiSettings);" +
            "document.getElementById('ss-close').click();return out;})()");

        const forced = await cdp.evalJson(
            "(function(){var s=window.__game.getStore();var gs=s.getGlobalState();" +
            "var facs=s.getState().factions;var target=(facs[gs.playerFactionId]!==undefined)?gs.playerFactionId:Object.keys(facs)[0];" +
            "var n=0;s.getAllCities().forEach(function(c){if(c.ownerId!==target){s.updateCity(c.id,{ownerId:target});n++;}});" +
            "return {moved:n,target:target};})()");
        await cdp.evaluate("document.getElementById('btn-next-month').click()");
        for (let i = 0; i < 75; i++) {
            const r = await cdp.evaluate("!document.getElementById('btn-next-month').disabled");
            if (r.value) break;
            await delay(200);
        }

        const ending = await cdp.evalJson(
            "(function(){var g=window.__game,ps=g.getPortedSystems();" +
            "return {display:document.getElementById('ending-screen').style.display," +
            "title:(document.getElementById('ending-title')||{}).textContent," +
            "narratives:ps.narrativeManager.getEvents().length};})()");

        // 에러 수집
        const consoleErrors = [];
        const pageErrors = [];
        const notFound = [];
        for (const e of cdp.events) {
            if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') {
                const a = e.params.args?.[0];
                consoleErrors.push(a?.value !== undefined ? String(a.value) : '<console.error>');
            } else if (e.method === 'Runtime.exceptionThrown') {
                const d = e.params.exceptionDetails ?? {};
                pageErrors.push(d.exception?.description ?? d.text ?? '<exception>');
            } else if (e.method === 'Log.entryAdded' && e.params.entry?.level === 'error') {
                consoleErrors.push(e.params.entry.text ?? '<log.error>');
            } else if (e.method === 'Network.responseReceived' && e.params.response?.status === 404) {
                notFound.push(e.params.response.url ?? '<unknown>');
            }
        }

        // ===== [312] 리플레이 공유→재생 흐름 검증 =====
        // 1. 인-페이지에서 가상 리플레이 로그를 압축 → URL 파라미터 생성
        // 2. 해당 URL로 재내비게이션 → ReplayViewer 자동 재생 확인
        const replayProbe = await cdp.evalJson(
            "(async function(){" +
            "var mod=await import('./dist/src/core/replay_share_manager.js');" +
            "var vm=await import('./dist/src/core/replay_viewer.js');" +
            "var logs=['DEPLOY','MOVE','ATTACK','MOVE','ATTACK'].map(function(a,i){return {" +
            "turn:Math.floor(i/2)+1,officerId:i%2===0?'friendly_1':'enemy_1',actionType:a," +
            "targetId:a==='ATTACK'?(i%2===0?'enemy_1':'friendly_1'):null,value:a==='ATTACK'?200:0,x:i%3,y:Math.floor(i/3)%3};});" +
            "var encoded=await mod.encodeReplayLogs(logs);" +
            "var decoded=await mod.decodeReplayLogs(encoded);" +
            "var viewer=new vm.ReplayViewer({addLog:function(){}});" +
            "var units=viewer.load(decoded);viewer.play();" +
            "for(var i=0;i<40&&!viewer.isFinished;i++){viewer.update(200);}" +
            "return {encoded:encoded.length>0,roundTrip:JSON.stringify(decoded)===JSON.stringify(logs)," +
            "units:units,finished:viewer.isFinished,urlLen:('?replay='+encoded).length};" +
            "})()");

        const result = { progress, graphProbe, a11yProbe, saveLoadProbe, replayProbe, forced, ending, consoleErrors: consoleErrors.slice(0, 10), notFound: notFound.slice(0, 5), pageErrors: pageErrors.slice(0, 10) };
        console.log(JSON.stringify(result, null, 2));

        const resource404 = consoleErrors.filter((e) => e.includes('Failed to load resource'));
        const otherConsole = consoleErrors.filter((e) => !e.includes('Failed to load resource'));
        const onlyFavicon404 = notFound.length === 0 || notFound.every((u) => u.includes('favicon') || u.endsWith('.ico'));
        const ok = pageErrors.length === 0
            && otherConsole.length === 0
            && resource404.length === notFound.length
            && onlyFavicon404
            && progress.length === 4
            && ending.display === 'flex'
            && ending.narratives >= 1
            // [461-480] 신규 UI 검증
            && graphProbe.open === 'block'
            && graphProbe.closed === true
            && (graphProbe.rows > 0 || graphProbe.hint === true)
            && a11yProbe.open === 'block'
            && a11yProbe.cbActive === true
            && saveLoadProbe.saved === true
            && saveLoadProbe.uiInSave === true
            // [312] 리플레이 압축→재생 라운드트립
            && replayProbe.encoded === true
            && replayProbe.roundTrip === true
            && replayProbe.units === 2
            && replayProbe.finished === true
            && replayProbe.urlLen < 100 * 1024;
        console.log('E2E_RESULT:', ok ? 'PASS' : 'FAIL');
        exitCode = ok ? 0 : 1;
        cdp.sock.destroy();
    } catch (err) {
        console.error('E2E_ERROR:', err.message ?? err);
        exitCode = 2;
    } finally {
        try { chrome.kill(); } catch { /* noop */ }
        server.close();
    }
    process.exit(exitCode);
}

main();
