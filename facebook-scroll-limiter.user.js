// ==UserScript==
// @name         Facebook Scroll Limiter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Limit your scrolling on facebook.com main pages; reset after idle, block when limit reached.
// @author       Diana Täht (dianx93)
// @match        https://www.facebook.com/*
// @grant        none
// ==/UserScript==
/* eslint-disable no-multi-spaces */

(function() {
    'use strict';

    // ─── CONFIG ─────────────────────────────────────────────
    const SCROLL_LIMIT      = 150;     // Maximum scroll events
    const IDLE_RESET_M      = 10;      // Reset when idle for X minutes
    const BLOCK_DURATION_M  = 15;      // Block duration

    // Keys for localStorage
    const KEY_COUNT     = 'fbScrollCount';
    const KEY_LAST_ACT  = 'fbLastActivity';
    const KEY_BLOCK_UNT = 'fbBlockUntil';
    const KEY_FIRST_VIS = 'fbFirstScrollTime';

    // Config helpers
    const IDLE_RESET_MS      = IDLE_RESET_M * 60e3;
    const BLOCK_DURATION_MS  = BLOCK_DURATION_M * 60e3;

    // Only run on main feed or chronology view
    const isMainPage = (
        location.pathname === '/' &&
        (location.search === '' || location.search.includes('sk=h_chr'))
    );
    if (!isMainPage) return;

    // ─── UTILITIES ──────────────────────────────────────────
    const now = () => Date.now();
    const get = (k,d=0) => parseInt(localStorage.getItem(k)) || d;
    const set = (k,v) => localStorage.setItem(k, String(v));
    const rem = k => localStorage.removeItem(k);
    let lastScrollCountTime = 0;

    // helper wrappers for session storage
    function getSession(key, def=0) {
        const v = sessionStorage.getItem(key);
        return v === null ? def : parseInt(v, 10);
    }
    function setSession(key, val) {
        sessionStorage.setItem(key, String(val));
    }
    function remSession(key) {
        sessionStorage.removeItem(key);
    }


    // ─── IDLE RESET ─────────────────────────────────────────
    function resetIfIdle() {
        if (now() - getSession(KEY_LAST_ACT,0) >= IDLE_RESET_MS) {
            remSession(KEY_COUNT)
            remSession(KEY_FIRST_VIS);
            setSession('fbFirstScrollTime', now());
            showProgressBar(0, SCROLL_LIMIT);
        }
    }
    setInterval(resetIfIdle, 60e3);

    // ─── PROGRESS BAR WIDGET ───────────────────────────────
    function showProgressBar() {
        const current = getSession(KEY_COUNT, 0)

        let bar = document.getElementById('fb-scroll-limit-bar'),
            timeEl, countEl, fill;
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'fb-scroll-limit-bar';
            Object.assign(bar.style, {
                position: 'fixed',
                bottom: '1em',
                left:   '1em',
                background: '#222',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'sans-serif',
                padding: '0.5em 1em',
                borderRadius: '10px',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                zIndex: 999999,
                opacity: 0.9
            });

            timeEl = document.createElement('div');
            timeEl.id = 'fb-scroll-time';
            bar.appendChild(timeEl);

            countEl = document.createElement('div');
            countEl.id = 'fb-scroll-counter';
            bar.appendChild(countEl);

            const inner = document.createElement('div');
            inner.id = 'fb-scroll-progress';
            Object.assign(inner.style, {
                background: '#444',
                borderRadius: '5px',
                overflow: 'hidden',
                marginTop: '0.4em'
            });

            fill = document.createElement('div');
            fill.id = 'fb-scroll-fill';
            Object.assign(fill.style, {
                height: '6px',
                width: '0%',
                background: '#4caf50',
                transition: 'width 0.3s'
            });

            inner.appendChild(fill);
            bar.appendChild(inner);
            document.body.appendChild(bar);

            // update time spent every second
            setInterval(() => {
                // first scroll timestamp in this session
                let first = getSession(KEY_FIRST_VIS);
                if (!first) {
                    first = now();
                    setSession(KEY_FIRST_VIS, first);
                } else first = parseInt(first);
                const diff = now() - first;
                const mins = Math.floor(diff/60000);
                const secs = Math.floor((diff%60000)/1000);
                timeEl.textContent = `⏱ Time wasted: ${mins}m ${secs.toString().padStart(2,'0')}s`;
            }, 1000);
        } else {
            timeEl = document.getElementById('fb-scroll-time');
            countEl = document.getElementById('fb-scroll-counter');
            fill    = document.getElementById('fb-scroll-fill');
        }

        // update counter + bar
        countEl.textContent = `📊 ${current} / ${SCROLL_LIMIT} scrolls`;
        const pct = Math.min(100, Math.floor((current/SCROLL_LIMIT)*100));
        fill.style.width = pct + '%';
    }

    function removeProgressBar() {
        const bar = document.getElementById('fb-scroll-limit-bar');
        if (bar) bar.remove();
    }

    // ─── BLOCK SCREEN ───────────────────────────────────────
    function showBlockPage(until) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                document.querySelectorAll('video,audio').forEach(el => {
                    el.muted = true; el.volume = 0; el.pause();
                });
            }
        });
        document.querySelectorAll('video,audio').forEach(el => {
            el.muted = true; el.volume = 0; el.pause();
        });

        document.head.innerHTML = '';
        document.body.innerHTML = `
        <div id="fb-scroll-block" style="
            all: initial;
            background: #111;
            color: #f1f1f1;
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            height: 100vh;
            padding: 2em;
        ">
            <h1 style="font-size:2em; margin-bottom:0.5em;">⛔ Scroll limit reached</h1>
            <p style="font-size:1.2em;">Please take a break and come back later ✨</p>
            <p id="scroll-timer" style="margin-top:1em; font-size:1.5em;"></p>
        </div>`;
        const timerEl = document.getElementById('scroll-timer');
        function update() {
            const rem = until - now();
            if (rem <= 0) return location.reload();
            const m = Math.floor(rem/60000),
                  s = Math.floor((rem%60000)/1000);
            timerEl.textContent = `⏳ ${m}:${s.toString().padStart(2,'0')} remaining`;
        }
        update();
        setInterval(update, 1000);
    }

    let blockUntilCache = 0;  // in‑memory fallback

    function getBlockUntil() {
        const nowTime = Date.now();

        const tryParse = (val, source) => {
            const parsed = parseInt(val, 10);
            if (!isNaN(parsed) && parsed > nowTime) {
                console.log(`[ScrollLimit] blockUntil from ${source}: ${parsed}`);
                return parsed;
            }
            return 0;
        };

        // 1) try localStorage
        const fromLocal = tryParse(localStorage.getItem(KEY_BLOCK_UNT), 'localStorage');
        if (fromLocal) return fromLocal;

        // 2) try sessionStorage
        const fromSess  = tryParse(sessionStorage.getItem(KEY_BLOCK_UNT), 'sessionStorage');
        if (fromSess) return fromSess;

        // 3) memory cache
        if (blockUntilCache > nowTime) {
            console.warn(`[ScrollLimit] Restoring blockUntil from in-memory cache: ${blockUntilCache}`);
            return blockUntilCache;
        }

        return 0;
    }

    function setBlockUntil(ts) {
        blockUntilCache = ts;
        localStorage.setItem(KEY_BLOCK_UNT, String(ts));
        sessionStorage.setItem(KEY_BLOCK_UNT, String(ts));
    }


    // ─── INIT & LISTENERS ──────────────────────────────────
    const blockTs = getBlockUntil()
    if (now() < blockTs) {
        showBlockPage(blockTs);
        return;
    } else if (blockTs) {
        // block expired
        rem(KEY_BLOCK_UNT);
        remSession(KEY_COUNT)
        remSession(KEY_FIRST_VIS);
    }

    // record activity
    function record() { setSession(KEY_LAST_ACT, now()); }
    ['scroll','mousemove','keydown'].forEach(ev =>
                                             window.addEventListener(ev, record, {passive:true}));

    // handle scrolls
    window.addEventListener('scroll', () => {
        // if still blocked, do nothing
        if (now() < getBlockUntil()) return;

        const t = now();
        // only count if it's been more than 300ms since last count
        if (t - lastScrollCountTime < 300) return;
        lastScrollCountTime = t;

        // — your existing code below —
        record();  // update last-activity
        let c = getSession(KEY_COUNT, 0) + 1;
        setSession(KEY_COUNT, c);
        showProgressBar();

        if (c > SCROLL_LIMIT) {
            const until = now() + BLOCK_DURATION_MS;
            setBlockUntil(until);
            showBlockPage(until);
        }
    }, { passive: true });

    // initialize progress bar (if not blocked)
    showProgressBar();

})();
