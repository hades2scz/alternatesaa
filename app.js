/**
 * LuaProt Gateway - 2-Tab Controller (Dashboard Login/Overview & Shop)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Base backend API URL (configured in config.js or relative for same-host)
  const API_BASE = (window.API_BASE_URL || '').replace(/\/$/, '');

  // Navigation elements (Dashboard and Shop)
  const bottomDock = document.getElementById('bottomDock');
  const dockIndicator = document.getElementById('dockIndicator');
  const dockTabs = document.querySelectorAll('.dock-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Dashboard Login / Lock Elements
  const dashLockedView = document.getElementById('dashLockedView');
  const dashUnlockedView = document.getElementById('dashUnlockedView');
  const keyInput = document.getElementById('keyInput');
  const submitKeyBtn = document.getElementById('submitKeyBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const feedbackMsg = document.getElementById('feedbackMsg');
  const lockDashboardBtn = document.getElementById('lockDashboardBtn');

  // Dashboard Unlocked Fields (Loadstring, Key Info, HWID Reset, Hub Info)
  const loadstringCode = document.getElementById('loadstringCode');
  const copyLoadstringBtn = document.getElementById('copyLoadstringBtn');

  const dashKeyBadge = document.getElementById('dashKeyBadge');
  const dashKeyVal = document.getElementById('dashKeyVal');
  const dashKeyExpire = document.getElementById('dashKeyExpire');
  const dashKeyExecs = document.getElementById('dashKeyExecs');
  const dashKeyHwid = document.getElementById('dashKeyHwid');
  const dashKeyDiscord = document.getElementById('dashKeyDiscord');

  const dashHwidBoundValue = document.getElementById('dashHwidBoundValue');
  const dashResetHwidBtn = document.getElementById('dashResetHwidBtn');
  const dashHwidMsg = document.getElementById('dashHwidMsg');

  const dashHubName = document.getElementById('dashHubName');
  const dashHubId = document.getElementById('dashHubId');
  const dashScriptsList = document.getElementById('dashScriptsList');
  const dashRefreshHubBtn = document.getElementById('dashRefreshHubBtn');

  let activeKeyData = null;

  // -----------------------------------------------------------------
  // 1. DOCK & TAB NAVIGATION (DASHBOARD & SHOP)
  // -----------------------------------------------------------------
  function updateDockIndicator(targetTab) {
    if (!targetTab || !dockIndicator || !bottomDock) return;
    const tabRect = targetTab.getBoundingClientRect();
    const dockRect = bottomDock.getBoundingClientRect();

    const left = tabRect.left - dockRect.left;
    const width = tabRect.width;

    dockIndicator.style.transform = `translateX(${left}px)`;
    dockIndicator.style.width = `${width}px`;
  }

  function switchTab(tabId) {
    dockTabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
        updateDockIndicator(tab);
      } else {
        tab.classList.remove('active');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === `pane-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  dockTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  const initialActiveTab = document.querySelector('.dock-tab.active');
  if (initialActiveTab) {
    setTimeout(() => updateDockIndicator(initialActiveTab), 50);
  }

  window.addEventListener('resize', () => {
    const currentActive = document.querySelector('.dock-tab.active');
    if (currentActive) updateDockIndicator(currentActive);
  });

  // -----------------------------------------------------------------
  // 2. INPUT ACTIONS (CLEAR / PASTE)
  // -----------------------------------------------------------------
  function toggleClearButton() {
    if (keyInput.value.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  keyInput.addEventListener('input', toggleClearButton);

  clearBtn.addEventListener('click', () => {
    keyInput.value = '';
    toggleClearButton();
    keyInput.focus();
    hideFeedback();
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        keyInput.value = text.trim();
        toggleClearButton();
        keyInput.focus();
      }
    } catch (e) {
      showFeedback('Clipboard access denied. Please paste manually.', 'error');
    }
  });

  // -----------------------------------------------------------------
  // 3. AUTHENTICATE KEY & UNLOCK DASHBOARD
  // -----------------------------------------------------------------
  function showFeedback(text, type = 'error') {
    feedbackMsg.textContent = text;
    feedbackMsg.className = `feedback-msg ${type}`;
    feedbackMsg.classList.remove('hidden');
  }

  function hideFeedback() {
    feedbackMsg.classList.add('hidden');
  }

  async function loginWithKey() {
    const key = keyInput.value.trim();

    if (!key) {
      showFeedback('Please enter your license key to authenticate.', 'error');
      keyInput.focus();
      return;
    }

    hideFeedback();
    submitKeyBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    submitKeyBtn.querySelector('.btn-text').textContent = 'Validating Key...';

    try {
      const res = await fetch(`${API_BASE}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      const data = await res.json();

      if (res.ok && data.success && data.key) {
        activeKeyData = data.key;
        unlockDashboard(data.key);
      } else {
        showFeedback(data.message || 'Invalid key or subscription expired.', 'error');
      }
    } catch (err) {
      showFeedback('Failed to contact backend API: ' + err.message, 'error');
    } finally {
      submitKeyBtn.disabled = false;
      btnSpinner.classList.add('hidden');
      submitKeyBtn.querySelector('.btn-text').textContent = 'Authenticate Key';
    }
  }

  submitKeyBtn.addEventListener('click', loginWithKey);
  keyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loginWithKey();
    }
  });

  // -----------------------------------------------------------------
  // 4. UNLOCK & POPULATE DASHBOARD
  // -----------------------------------------------------------------
  function unlockDashboard(k) {
    dashLockedView.classList.add('hidden');
    dashUnlockedView.classList.remove('hidden');

    // 1. Embed key into script loadstring
    const snippet = `loadstring(game:HttpGet("https://luaprot.net/api/v1/scripts/load?key=${k.key}"))()`;
    loadstringCode.textContent = snippet;

    // 2. Key Info
    dashKeyVal.textContent = k.key || 'N/A';
    if (k.blacklisted) {
      dashKeyBadge.className = 'key-status-badge blacklisted';
      dashKeyBadge.textContent = 'BLACKLISTED';
    } else if (k.expire && k.expire * 1000 < Date.now()) {
      dashKeyBadge.className = 'key-status-badge blacklisted';
      dashKeyBadge.textContent = 'EXPIRED';
    } else {
      dashKeyBadge.className = 'key-status-badge';
      dashKeyBadge.textContent = 'ACTIVE';
    }

    if (!k.expire) {
      dashKeyExpire.textContent = 'Lifetime (Permanent)';
    } else {
      const expDate = new Date(k.expire * 1000);
      const diffDays = Math.ceil((expDate - Date.now()) / (1000 * 60 * 60 * 24));
      dashKeyExpire.textContent = diffDays <= 0 ? 'Expired' : `${diffDays} Day(s) remaining`;
    }

    dashKeyExecs.textContent = `${k.executionCount ?? 0} executions`;
    dashKeyHwid.textContent = k.hwid ? `${k.hwid.slice(0, 16)}...` : 'Unbound (Ready)';

    if (k.discordData && (k.discordData.global_name || k.discordData.username)) {
      dashKeyDiscord.textContent = '@' + (k.discordData.global_name || k.discordData.username);
    } else if (k.discordId) {
      dashKeyDiscord.textContent = `ID: ${k.discordId}`;
    } else {
      dashKeyDiscord.textContent = 'Not Linked';
    }

    // 3. HWID status
    dashHwidBoundValue.textContent = k.hwid ? `${k.hwid.slice(0, 18)}...` : 'Unbound (Ready for Binding)';
    if (dashHwidMsg) dashHwidMsg.classList.add('hidden');

    // 4. Hub Info
    dashHubName.textContent = k.hubName || 'Apex Hub';
    dashHubId.textContent = k.hubId || '40511091490620200512';

    fetchHubs();
  }

  function logOutDashboard() {
    activeKeyData = null;
    dashUnlockedView.classList.add('hidden');
    dashLockedView.classList.remove('hidden');
    keyInput.value = '';
    toggleClearButton();
    hideFeedback();
    keyInput.focus();
  }

  lockDashboardBtn.addEventListener('click', logOutDashboard);

  // -----------------------------------------------------------------
  // 5. COPY LOADSTRING ACTION
  // -----------------------------------------------------------------
  copyLoadstringBtn.addEventListener('click', async () => {
    const text = loadstringCode.textContent;
    try {
      await navigator.clipboard.writeText(text);
      const span = copyLoadstringBtn.querySelector('span');
      const prev = span.textContent;
      span.textContent = 'Copied to Clipboard!';
      setTimeout(() => span.textContent = prev, 2000);
    } catch (e) {
      alert('Could not copy automatically. Please copy the code manually.');
    }
  });

  // -----------------------------------------------------------------
  // 6. RESET HWID ACTION
  // -----------------------------------------------------------------
  dashResetHwidBtn.addEventListener('click', async () => {
    if (!activeKeyData || !activeKeyData.key) return;

    dashResetHwidBtn.disabled = true;
    const originalText = dashResetHwidBtn.innerHTML;
    dashResetHwidBtn.innerHTML = '<span>Resetting HWID...</span>';

    try {
      const res = await fetch(`${API_BASE}/api/reset-hwid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activeKeyData.key, hubId: activeKeyData.hubId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        dashHwidMsg.textContent = data.message || 'HWID reset successfully! Key is unbound and ready.';
        dashHwidMsg.className = 'feedback-msg success';
        dashHwidMsg.classList.remove('hidden');
        dashKeyHwid.textContent = 'Unbound (Reset)';
        dashHwidBoundValue.textContent = 'Unbound (Ready for Binding)';
      } else {
        dashHwidMsg.textContent = data.message || 'Failed to reset HWID.';
        dashHwidMsg.className = 'feedback-msg error';
        dashHwidMsg.classList.remove('hidden');
      }
    } catch (e) {
      dashHwidMsg.textContent = 'HWID Reset failed: ' + e.message;
      dashHwidMsg.className = 'feedback-msg error';
      dashHwidMsg.classList.remove('hidden');
    } finally {
      dashResetHwidBtn.disabled = false;
      dashResetHwidBtn.innerHTML = originalText;
    }
  });

  // -----------------------------------------------------------------
  // 7. FETCH & RENDER HUB INFO (Dashboard)
  // -----------------------------------------------------------------
  async function fetchHubs() {
    if (dashRefreshHubBtn) {
      dashRefreshHubBtn.disabled = true;
      dashRefreshHubBtn.querySelector('span').textContent = 'Loading...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/hubs`);
      const data = await res.json();

      if (res.ok && data.hubs && Array.isArray(data.hubs) && data.hubs.length > 0) {
        const hub = data.hubs[0];
        dashHubName.textContent = hub.name || 'Apex Hub';
        dashHubId.textContent = hub.id || 'N/A';

        dashScriptsList.innerHTML = '';
        if (hub.scripts && hub.scripts.length > 0) {
          hub.scripts.forEach(script => {
            const item = document.createElement('div');
            item.className = 'dash-script-item';
            item.innerHTML = `
              <span class="s-name">${escapeHtml(script.name || 'Script')}</span>
              <span class="s-badge">v${script.version || '1.0'}</span>
            `;
            dashScriptsList.appendChild(item);
          });
        }
      }
    } catch (e) {
      console.error('Failed to load hubs', e);
    } finally {
      if (dashRefreshHubBtn) {
        dashRefreshHubBtn.disabled = false;
        dashRefreshHubBtn.querySelector('span').textContent = 'Refresh';
      }
    }
  }

  if (dashRefreshHubBtn) {
    dashRefreshHubBtn.addEventListener('click', fetchHubs);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
