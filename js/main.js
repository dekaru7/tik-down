// ===== Elemen DOM =====
const urlInput  = document.getElementById('url');
const goBtn     = document.getElementById('goBtn');
const pasteBtn  = document.getElementById('pasteBtn');
const statusEl  = document.getElementById('status');
const resultBox = document.getElementById('result');
const scanbar   = document.getElementById('scanbar');

let isRunning = false;

function esc(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function setStatus(msg, cls) {
  statusEl.textContent = msg || '';
  statusEl.className = 'mono' + (cls ? ' ' + cls : '');
}

async function fetchAsBlob(url, timeoutMs = 9000) {
  const attempts = [
    u => u,
    u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
  ];
  for (const wrap of attempts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(wrap(url), { signal: controller.signal });
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob && blob.size > 500) return blob;
    } catch (e) {

    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function saveBlob(blob, filename) {
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
}

async function downloadSingle(url, filename, btn) {
  const original = btn ? btn.textContent : null;
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  const blob = await fetchAsBlob(url);
  if (blob) {
    saveBlob(blob, filename);
  } else {
    window.open(url, '_blank');
  }
  if (btn) { btn.disabled = false; btn.textContent = original; }
}

async function downloadAllPhotos(images, baseName, btn) {
  if (typeof JSZip === 'undefined') {
    setStatus('Fitur ZIP tidak tersedia, unduh foto satu per satu di bawah.', 'error');
    return;
  }
  const original = btn.textContent;
  btn.disabled = true;
  const zip = new JSZip();
  let ok = 0;

  for (let i = 0; i < images.length; i++) {
    btn.textContent = `MENGEMAS ${i + 1}/${images.length}`;
    const blob = await fetchAsBlob(images[i]);
    if (blob) {
      zip.file(`${baseName}-${String(i + 1).padStart(2, '0')}.jpg`, blob);
      ok++;
    }
  }

  if (ok === 0) {
    setStatus('Gagal mengunduh foto — coba unduh satu per satu.', 'error');
  } else {
    btn.textContent = 'MEMBUAT ZIP…';
    const content = await zip.generateAsync({ type: 'blob' });
    saveBlob(content, `${baseName}.zip`);
  }

  btn.disabled = false;
  btn.textContent = original;
}

function renderPhotoResult(d, author, linkRow) {
  const btnAll = document.createElement('button');
  btnAll.className = 'dl-btn pink';
  btnAll.textContent = `UNDUH SEMUA (${d.images.length}) .ZIP`;
  btnAll.onclick = () => downloadAllPhotos(d.images, `${author}-foto-tiktok`, btnAll);
  linkRow.appendChild(btnAll);

  if (d.music) {
    const btnAudio = document.createElement('button');
    btnAudio.className = 'dl-btn alt';
    btnAudio.textContent = 'UNDUH AUDIO';
    btnAudio.onclick = () => downloadSingle(d.music, `${author}-audio.mp3`, btnAudio);
    linkRow.appendChild(btnAudio);
  }

  const grid = document.getElementById('photoGrid');
  d.images.forEach((img, i) => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `
      <img src="${img}" alt="foto ${i + 1}">
      <span class="num mono">${i + 1}</span>
      <button class="savebtn" title="Unduh foto ini" aria-label="Unduh foto ${i + 1}">↓</button>
    `;
    item.querySelector('.savebtn').onclick = (e) => {
      downloadSingle(img, `${author}-foto-${i + 1}.jpg`, e.currentTarget);
    };
    grid.appendChild(item);
  });
}

function renderVideoResult(d, author, linkRow) {
  const btnSd = document.createElement('button');
  btnSd.className = 'dl-btn';
  btnSd.textContent = 'UNDUH VIDEO';
  btnSd.onclick = () => downloadSingle(d.play, `${author}-video.mp4`, btnSd);
  linkRow.appendChild(btnSd);

  if (d.hdplay) {
    const btnHd = document.createElement('button');
    btnHd.className = 'dl-btn alt';
    btnHd.textContent = 'VERSI HD';
    btnHd.onclick = () => downloadSingle(d.hdplay, `${author}-video-hd.mp4`, btnHd);
    linkRow.appendChild(btnHd);
  }

  if (d.music) {
    const btnAudio = document.createElement('button');
    btnAudio.className = 'dl-btn alt';
    btnAudio.textContent = 'UNDUH AUDIO';
    btnAudio.onclick = () => downloadSingle(d.music, `${author}-audio.mp3`, btnAudio);
    linkRow.appendChild(btnAudio);
  }
}

async function handleRun() {
  if (isRunning) return;

  const link = urlInput.value.trim();
  if (!link) { setStatus('Tempel tautan TikTok terlebih dahulu.', 'error'); return; }
  if (!/tiktok\.com/i.test(link)) {
    setStatus('Tautan tidak dikenali. Pastikan itu tautan TikTok yang valid.', 'error');
    return;
  }

  isRunning = true;
  goBtn.disabled = true;
  urlInput.disabled = true;
  scanbar.classList.add('on');
  setStatus('Menghubungi TikTok…');
  resultBox.innerHTML = '';

  try {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(link)}&hd=1`;
    const res = await fetch(api);
    if (!res.ok) throw new Error('net');
    const json = await res.json();
    if (json.code !== 0 || !json.data) throw new Error('parse');

    const d = json.data;
    const author = esc(d.author?.unique_id || 'tiktok');
    const title = esc(d.title || (d.images ? 'Postingan Foto TikTok' : 'Video TikTok'));
    const isPhotoPost = Boolean(d.images && d.images.length);

    let html = `<div class="clip">
      <img class="thumb" src="${d.cover || d.origin_cover || ''}" alt="cover">
      <div class="meta">
        <div class="title">${title}</div>
        <div class="author">@${author}</div>
        <div class="dl-links" id="linkRow"></div>
      </div>

    </div>`;

    if (isPhotoPost) {
      html += `<div class="photo-grid" id="photoGrid"></div>`;
    }

    resultBox.innerHTML = html;
    const linkRow = document.getElementById('linkRow');

    if (isPhotoPost) {
      renderPhotoResult(d, author, linkRow);
    } else {
      renderVideoResult(d, author, linkRow);
    }

    setStatus('Berhasil diambil. Pilih format unduhan di bawah.', 'ok');

  } catch (err) {
    setStatus('Gagal memproses tautan. Pastikan tautan valid dan publik, lalu coba lagi.', 'error');
  } finally {
    goBtn.disabled = false;
    urlInput.disabled = false;
    scanbar.classList.remove('on');
    isRunning = false;
  }
}

pasteBtn.addEventListener('click', async () => {
  try {
    urlInput.value = await navigator.clipboard.readText();
  } catch (e) {
    urlInput.focus();
  }
});

goBtn.addEventListener('click', handleRun);
urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleRun();
});
