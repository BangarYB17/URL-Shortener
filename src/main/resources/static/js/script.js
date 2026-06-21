const shortened = [];
  const clicks = {};

  function fmt(url) { return url.length > 30 ? url.slice(0, 27) + '…' : url; }
  function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function totalClicks() { return Object.keys(clicks).filter(k => !k.endsWith('_time')).reduce((a, k) => a + clicks[k], 0); }

  function renderShortened() {
    const body = document.getElementById('shortenedBody');
    document.getElementById('shortCount').textContent = shortened.length;
    if (!shortened.length) {
      body.innerHTML = '<tr class="tbl-empty"><td colspan="3">No URLs shortened yet</td></tr>';
      return;
    }
    body.innerHTML = '';
    [...shortened].reverse().forEach(({ original, short }) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:#666;font-size:12px;" title="${original}">${fmt(original)}</td>
        <td><a href="${short}" target="_blank" onclick="trackClick('${short}')"
          style="color:#534AB7;font-size:12px;text-decoration:none;font-weight:500;">${fmt(short)}</a></td>
        <td>
          <button class="copy-mini" onclick="copyText('${short}', this)">
            <i class="ti ti-copy" style="font-size:11px;"></i> copy
          </button>
        </td>`;
      body.appendChild(tr);
    });
  }

  function renderClicks() {
    const body = document.getElementById('clickBody');
    document.getElementById('clickCount').textContent = totalClicks() + ' click' + (totalClicks() !== 1 ? 's' : '');
    const keys = Object.keys(clicks).filter(k => !k.endsWith('_time'));
    if (!keys.length) {
      body.innerHTML = '<tr class="tbl-empty"><td colspan="3">No clicks recorded yet</td></tr>';
      return;
    }
    body.innerHTML = '';
    keys.slice().reverse().forEach(short => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><a href="${short}" target="_blank" onclick="trackClick('${short}')"
          style="color:#0F6E56;font-size:12px;text-decoration:none;font-weight:500;">${fmt(short)}</a></td>
        <td style="text-align:center;"><span class="click-pill">${clicks[short]}</span></td>
        <td style="color:#888;font-size:12px;">${clicks[short + '_time'] || '—'}</td>`;
      body.appendChild(tr);
    });
  }

  function trackClick(short) {
    clicks[short] = (clicks[short] || 0) + 1;
    clicks[short + '_time'] = now();
    renderClicks();
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.innerHTML = '<i class="ti ti-check" style="font-size:11px;color:#0F6E56;"></i> done';
      setTimeout(() => { btn.innerHTML = '<i class="ti ti-copy" style="font-size:11px;"></i> copy'; }, 1500);
    });
  }

  async function shortenUrl() {
    const url = document.getElementById('urlInput').value.trim();
    const errDiv = document.getElementById('error');
    const resultBar = document.getElementById('resultBar');
    errDiv.style.display = 'none';
    resultBar.style.display = 'none';

    if (!url) return showErr('Please enter a URL.');
    try { new URL(url); } catch (_) { return showErr('Invalid URL — make sure to include https://'); }

    const btn = document.getElementById('shortenBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ti ti-loader-2" style="font-size:15px;animation:spin 1s linear infinite;color:#534AB7;"></i><span style="color:#534AB7;"> Shortening…</span>';

    try {
      const res = await fetch('/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: url })
      });
      if (!res.ok) throw new Error(await res.text() || 'Server error');
      const shortUrl = await res.text();
      const link = document.getElementById('shortLink');
      link.href = shortUrl;
      link.textContent = shortUrl;
      resultBar.style.display = 'block';
      document.getElementById('copyLabel').textContent = 'Copy';
      shortened.push({ original: url, short: shortUrl });
      renderShortened();
      renderClicks();
    } catch (err) {
      showErr('Error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-scissors" style="font-size:15px;color:#534AB7;"></i><span style="color:#534AB7;"> Shorten</span>';
    }
  }

  function showErr(msg) {
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('error').style.display = 'flex';
  }

  function copyLink() {
    const text = document.getElementById('shortLink').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const l = document.getElementById('copyLabel');
      l.textContent = 'Copied!';
      setTimeout(() => l.textContent = 'Copy', 2000);
    });
  }

  function resetForm() {
    document.getElementById('urlInput').value = '';
    document.getElementById('resultBar').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('urlInput').focus();
  }