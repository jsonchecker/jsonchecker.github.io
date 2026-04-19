/* ═══════════════════════════════════════
   JSON Checker — app.js
   All tools: Validator, Formatter, Minifier, Tree Viewer
═══════════════════════════════════════ */

// ── Analytics Helper ──
function trackEvent(eventName, params = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    const payload = { event: eventName, ...params };
    
    // Debugging: Log the event to console to verify execution
    console.log(`[Analytics] Pushing event: ${eventName}`, params);
    
    window.dataLayer.push(payload);
  } catch (err) {
    console.error('[Analytics] Failed to push to dataLayer', err);
  }
}

// ── AdSense Debugger ──
function debugAds() {
  setTimeout(() => {
    if (window.location.protocol === 'file:') {
      console.error('%c[AdSense Error] You are viewing the page via file:// protocol. AdSense will NOT load ads from a local file. Use a local web server (e.g., Live Server or npx serve).', 'color: #ff4d6a; font-weight: bold;');
      return;
    }

    const ads = document.querySelectorAll('.adsbygoogle');
    console.group('%c[AdSense Status Report]', 'color: #00c896; font-weight: bold; border-left: 3px solid #00c896; padding-left: 8px;');
    ads.forEach((ad, i) => {
      const status = ad.getAttribute('data-ad-status') || 'waiting/not-initialized';
      const slot = ad.getAttribute('data-ad-slot') || 'auto-injected';
      const dim = `${ad.offsetWidth}x${ad.offsetHeight}`;
      console.log(`Slot: ${slot || i} | Status: ${status} | Size: ${dim}`);
      
      if (status === 'unfilled' || (status === 'filled' && ad.offsetHeight === 0)) {
        console.warn(`Slot ${slot} was not filled. Check AdSense dashboard for site approval or demand issues.`);
      }
    });
    console.groupEnd();
  }, 3000); // Wait for scripts to execute
}

// ── AdSense Initialization ──
function initAds() {
  try {
    requestAnimationFrame(() => {
      // Only push to ads that haven't been initialized and are currently visible
      const ads = document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status])');
      if (ads.length > 0) console.log(`[AdSense] Found ${ads.length} new slots to initialize.`);
      ads.forEach(ad => {
        const slotId = ad.getAttribute('data-ad-slot');
        // Ensure slot has width and isn't already being processed by Auto Ads
        if (ad.offsetWidth > 0 && !ad.getAttribute('data-adsbygoogle-status')) {
          console.log(`[AdSense] Initializing visible slot: ${slotId || 'auto'}`);
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      });
    });
  } catch (e) {
    console.error('[AdSense] Safe push failed', e);
  }
}

// ── Year in footer ──
document.getElementById('year').textContent = new Date().getFullYear();

// ── Sample JSON ──
const SAMPLE = {
  name: "JSON Checker",
  version: "1.0.0",
  tools: ["Validator", "Formatter", "Minifier", "Tree Viewer"],
  free: true,
  meta: {
    author: "jsonchecker.github.io",
    tags: ["json", "developer", "tools"],
    stats: { users: 1000, rating: 4.9 }
  }
};
const SAMPLE_STR_PRETTY = JSON.stringify(SAMPLE, null, 2);
const SAMPLE_STR_MINI   = JSON.stringify(SAMPLE);

// ── Theme toggle ──
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let next;
  if (!current || current === 'auto') {
    next = sysDark ? 'light' : 'dark';
  } else {
    next = current === 'dark' ? 'light' : 'dark';
  }
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ── Tab switching ──
function switchTool(tool) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
    btn.setAttribute('aria-selected', btn.dataset.tool === tool);
  });
  document.querySelectorAll('.tool-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === 'tool-' + tool);
  });

  // Track tool selection via Google Tag Manager DataLayer
  trackEvent('tool_switch', { tool_name: tool });

  // Update URL hash without jumping
  if (history.pushState) {
    history.pushState(null, null, '#' + tool);
  } else {
    location.hash = '#' + tool;
  }
}

// ── Handle initial load and back/forward ──
window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '');
  const validTools = ['validator', 'formatter', 'minifier', 'tree'];
  if (validTools.includes(hash)) {
    switchTool(hash);
  }
  
  // Run ad debugger
  debugAds();

  initAds();
});

// Re-check ads on resize (e.g., when sidebars become visible)
window.addEventListener('resize', initAds);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTool(btn.dataset.tool));
});

// ── Helpers ──
function setOutput(elId, html, type = '') {
  const el = document.getElementById(elId);
  el.className = 'output-panel' + (type ? ' output-' + type : '');
  el.innerHTML = html;
}

function copyOutput(textareaId) {
  const el = document.getElementById(textareaId);
  if (!el || !el.value) return;
  navigator.clipboard.writeText(el.value).then(() => {
    // Track successful copy action
    trackEvent('copy_to_clipboard', { 
      tool_id: textareaId.split('-')[0],
      char_count: el.value.length 
    });

    const btn = document.querySelector(`[onclick="copyOutput('${textareaId}')"]`);
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1800); }
  });
}

function loadSample(tool) {
  if (tool === 'validator') document.getElementById('validator-input').value = SAMPLE_STR_PRETTY;
  if (tool === 'formatter') document.getElementById('formatter-input').value = SAMPLE_STR_MINI;
  if (tool === 'minifier')  document.getElementById('minifier-input').value  = SAMPLE_STR_PRETTY;
  if (tool === 'tree')      document.getElementById('tree-input').value      = SAMPLE_STR_PRETTY;
}

function clearTool(tool) {
  if (tool === 'validator') {
    document.getElementById('validator-input').value = '';
    setOutput('validator-output', `
      <div class="output-idle-msg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Your validation result will appear here</span>
      </div>`, 'idle');
  }
  if (tool === 'formatter') {
    document.getElementById('formatter-input').value = '';
    document.getElementById('formatter-output-text').value = '';
  }
  if (tool === 'minifier') {
    document.getElementById('minifier-input').value = '';
    document.getElementById('minifier-output-text').value = '';
    document.getElementById('minifier-savings').textContent = '';
  }
  if (tool === 'tree') {
    document.getElementById('tree-input').value = '';
    document.getElementById('tree-output').innerHTML = `
      <div class="output-idle-msg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h18M3 12h12M3 17h6"/></svg>
        <span>Your JSON tree will appear here</span>
      </div>`;
  }
}

// ── Validator ──
function runValidator() {
  const input = document.getElementById('validator-input').value.trim();
  if (!input) {
    setOutput('validator-output', `
      <div class="output-idle-msg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 16h-1v-4h-1m1-4h.01"/></svg>
        <span>Please paste some JSON to validate</span>
      </div>`, 'idle');
    return;
  }
  try {
    const parsed = JSON.parse(input);
    const isArr = Array.isArray(parsed);
    const isObj = parsed !== null && typeof parsed === 'object' && !isArr;
    const type = isArr ? 'array' : (parsed === null ? 'null' : typeof parsed);
    const keys = isObj ? Object.keys(parsed).length : null;
    setOutput('validator-output', `
      <div class="result-badge ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Valid JSON
      </div>
      <div class="success-detail">
        Type: <strong>${type}</strong>${keys !== null ? ` &nbsp;·&nbsp; Top-level keys: <strong>${keys}</strong>` : ''}
        &nbsp;·&nbsp; Size: <strong>${new Blob([input]).size} bytes</strong>
      </div>`, 'success');
  } catch (e) {
    const msg = e.message;
    // Try to extract line info
    const posMatch = msg.match(/position (\d+)/i);
    let hint = '';
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const before = input.substring(Math.max(0, pos - 20), pos);
      const at = input.substring(pos, pos + 1);
      const after = input.substring(pos + 1, pos + 20);
      hint = `\n\nNear: …${before}<mark>${at || 'EOF'}</mark>${after}…`;
      // Count line number
      const line = input.substring(0, pos).split('\n').length;
      hint = `\nLine ${line}, position ${pos}` + hint;
    }
    setOutput('validator-output', `
      <div class="result-badge err">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        Invalid JSON
      </div>
      <div class="error-detail">${escHtml(msg)}${escHtml(hint)}</div>`, 'error');
  }
}

// ── Formatter ──
function runFormatter() {
  const input = document.getElementById('formatter-input').value.trim();
  const indentRaw = document.getElementById('indent-size').value;
  const indent = indentRaw === 'tab' ? '\t' : parseInt(indentRaw);
  if (!input) { document.getElementById('formatter-output-text').value = ''; return; }
  try {
    const parsed = JSON.parse(input);
    document.getElementById('formatter-output-text').value = JSON.stringify(parsed, null, indent);
  } catch (e) {
    document.getElementById('formatter-output-text').value = '// Error: ' + e.message;
  }
}

// ── Minifier ──
function runMinifier() {
  const input = document.getElementById('minifier-input').value.trim();
  if (!input) { document.getElementById('minifier-output-text').value = ''; return; }
  try {
    const parsed = JSON.parse(input);
    const minified = JSON.stringify(parsed);
    document.getElementById('minifier-output-text').value = minified;
    const orig = new Blob([input]).size;
    const mini = new Blob([minified]).size;
    const saved = Math.round((1 - mini / orig) * 100);
    document.getElementById('minifier-savings').textContent =
      saved > 0 ? `↓ ${saved}% smaller` : 'Already minified';
  } catch (e) {
    document.getElementById('minifier-output-text').value = '// Error: ' + e.message;
    document.getElementById('minifier-savings').textContent = '';
  }
}

// ── Tree Viewer ──
function runTree() {
  const input = document.getElementById('tree-input').value.trim();
  const container = document.getElementById('tree-output');
  if (!input) {
    container.innerHTML = `<div class="output-idle-msg"><span>Please paste JSON first</span></div>`;
    return;
  }
  try {
    const parsed = JSON.parse(input);
    container.innerHTML = '';
    container.appendChild(buildTree(parsed, null, true));
  } catch (e) {
    container.innerHTML = `<div style="color:var(--danger);font-size:0.82rem;">Error: ${escHtml(e.message)}</div>`;
  }
}

function buildTree(value, key, isRoot = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-node';

  if (value !== null && typeof value === 'object') {
    const isArr = Array.isArray(value);
    const entries = isArr ? value : Object.entries(value);
    const count = isArr ? value.length : Object.keys(value).length;
    const open = isArr ? '[' : '{';
    const close = isArr ? ']' : '}';
    const typeLabel = isArr ? `Array(${count})` : `Object(${count})`;

    const line = document.createElement('div');
    const toggle = document.createElement('button');
    toggle.className = 'tree-toggle';
    toggle.textContent = '▼';
    toggle.setAttribute('aria-label', 'Collapse');

    const children = document.createElement('div');
    children.className = 'tree-children';

    toggle.onclick = () => {
      const collapsed = children.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▶' : '▼';
      toggle.setAttribute('aria-label', collapsed ? 'Expand' : 'Collapse');
      summary.style.display = collapsed ? 'inline' : 'none';
    };

    const summary = document.createElement('span');
    summary.className = 'tree-summary';
    summary.textContent = ` ${typeLabel} `;
    summary.style.display = 'none';
    summary.onclick = () => toggle.click();

    if (key !== null) {
      line.innerHTML = `<span class="tree-key">"${escHtml(String(key))}"</span>: `;
    }
    line.appendChild(toggle);
    line.insertAdjacentText('beforeend', ' ' + open);
    line.appendChild(summary);
    wrapper.appendChild(line);

    const childContainer = children;
    if (isArr) {
      value.forEach((item, i) => childContainer.appendChild(buildTree(item, i)));
    } else {
      Object.entries(value).forEach(([k, v]) => childContainer.appendChild(buildTree(v, k)));
    }

    wrapper.appendChild(childContainer);
    wrapper.insertAdjacentHTML('beforeend', `<span style="color:var(--text-3)">${close}</span>`);
  } else {
    const line = document.createElement('div');
    let valHtml = '';
    if (value === null)          valHtml = `<span class="tree-null">null</span>`;
    else if (typeof value === 'boolean') valHtml = `<span class="tree-bool">${value}</span>`;
    else if (typeof value === 'number')  valHtml = `<span class="tree-num">${value}</span>`;
    else                          valHtml = `<span class="tree-str">"${escHtml(String(value))}"</span>`;

    if (key !== null) {
      line.innerHTML = `<span class="tree-key">"${escHtml(String(key))}"</span>: ${valHtml}`;
    } else {
      line.innerHTML = valHtml;
    }
    wrapper.appendChild(line);
  }
  return wrapper;
}

function expandAll() {
  document.querySelectorAll('.tree-children').forEach(el => {
    el.classList.remove('collapsed');
  });
  document.querySelectorAll('.tree-toggle').forEach(btn => {
    btn.textContent = '▼';
    btn.setAttribute('aria-label', 'Collapse');
  });
  document.querySelectorAll('.tree-summary').forEach(el => el.style.display = 'none');
}

function collapseAll() {
  document.querySelectorAll('.tree-children').forEach(el => {
    el.classList.add('collapsed');
  });
  document.querySelectorAll('.tree-toggle').forEach(btn => {
    btn.textContent = '▶';
    btn.setAttribute('aria-label', 'Expand');
  });
  document.querySelectorAll('.tree-summary').forEach(el => el.style.display = 'inline');
}

// ── Keyboard shortcut: Ctrl/Cmd+Enter to run ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const active = document.querySelector('.tool-panel.active');
    if (!active) return;
    const tool = active.id.replace('tool-', '');
    if (tool === 'validator') runValidator();
    if (tool === 'formatter') runFormatter();
    if (tool === 'minifier')  runMinifier();
    if (tool === 'tree')      runTree();
  }
});

// ── Utility ──
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Initialize tool based on URL hash
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  const validTools = ['validator', 'formatter', 'minifier', 'tree'];
  if (validTools.includes(hash)) {
    switchTool(hash);
  }

  debugAds();
  initAds();
});
