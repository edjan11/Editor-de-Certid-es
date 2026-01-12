// Explorer Selos CRC - Integrado no Electron
// Adaptado do UserScript v5.0 para funcionar no webview

(function () {
  'use strict';

  // ---------- CONFIG BACKEND LOCAL ----------
  const BACKEND_URL = 'http://localhost:3100'; // MUDOU: porta 3100 agora
  const BACKEND_NS  = 'selos_crc';

  // Substituindo GM_xmlhttpRequest por fetch normal
  async function kvRequest(method, path, body) {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : null
      });
      return await res.json();
    } catch (err) {
      console.error('Erro backend:', err);
      return null;
    }
  }

  async function kvSet(namespace, key, value) {
    try {
      const data = await kvRequest('POST', '/kv/set', { namespace, key, value });
      return data;
    } catch (err) {
      console.error('Erro ao salvar no backend:', err);
      return { ok: false, error: String(err) };
    }
  }

  async function kvGet(namespace, key) {
    try {
      const q = `?namespace=${encodeURIComponent(namespace)}&key=${encodeURIComponent(key)}`;
      const data = await kvRequest('GET', '/kv/get' + q);
      if (!data || !data.ok) return null;
      return data.value;
    } catch (err) {
      console.error('Erro ao ler do backend:', err);
      return null;
    }
  }

  // ---------- STORAGE ----------
  const STORAGE_KEY = 'indexJSONsCRC_cache';
  const USED_KEY = 'indexJSONsCRC_usados';

  let indexadosCache = [];

  async function syncIndexadosFromBackend() {
    try {
      const remoto = await kvGet(BACKEND_NS, 'index');
      if (Array.isArray(remoto)) {
        indexadosCache = remoto;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remoto)); } catch {}
        return;
      }
    } catch (e) {
      console.error('Falha ao sincronizar com backend:', e);
    }

    try {
      indexadosCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      indexadosCache = [];
    }
  }

  function getIndexados() { return indexadosCache; }
  function setIndexados(arr) {
    indexadosCache = Array.isArray(arr) ? arr : [];
    kvSet(BACKEND_NS, 'index', indexadosCache).catch(err =>
      console.error('Erro ao salvar index no backend:', err)
    );
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(indexadosCache)); } catch {}
  }

  function getUsados() {
    try { return JSON.parse(localStorage.getItem(USED_KEY) || '[]'); } catch { return []; }
  }
  function setUsados(arr) {
    try { localStorage.setItem(USED_KEY, JSON.stringify(arr || [])); } catch {}
  }

  // ---------- UTILITIES ----------
  function normalize(s) {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function scoreNome(a, b) {
    const pa = normalize(a).split(' ');
    const pb = normalize(b).split(' ');
    let c = 0;
    pa.forEach(p1 => { if (pb.includes(p1)) c++; });
    return c;
  }

  function similaridadeLevenshtein(a, b) {
    a = normalize(a); b = normalize(b);
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] = (b.charAt(i-1) === a.charAt(j-1))
          ? m[i-1][j-1]
          : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
      }
    }
    const d = m[b.length][a.length];
    const l = Math.max(a.length, b.length) || 1;
    return 1 - d / l;
  }

  function showToast(msg) {
    let el = document.getElementById('toastCopyCRC');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toastCopyCRC';
      el.style = 'position:fixed;bottom:18px;right:18px;padding:7px 20px;background:#168d60;color:#fff;border-radius:6px;z-index:999999;font-size:13px;font-weight:500;opacity:0;pointer-events:none;transition:opacity 0.2s;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = 1;
    setTimeout(()=>{el.style.opacity=0;},800);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('Copiado!');
  }

  // ===== PAINEL VISUAL =====
  let painel, usadosExpandido = false;

  function montaPainel() {
    if (document.getElementById('painelSeloFuzzy')) return;

    let pos;
    try { pos = JSON.parse(localStorage.getItem('posPainelSeloFuzzy') || '{"left":40,"top":44}'); }
    catch { pos = { left: 40, top: 44 }; }

    painel = document.createElement('div');
    painel.id = 'painelSeloFuzzy';
    painel.style.cssText = `position:fixed;left:${pos.left}px;top:${pos.top}px;background:#23272fec;color:#f3f3f3;padding:8px;z-index:99999;border-radius:8px;width:530px;font-size:12px;box-shadow:2px 2px 15px #000a;user-select:none;border:1px solid #232323;`;

    painel.innerHTML = `
      <div id="headerPainelFuzzy" style="cursor:move;background:#191a22e3;padding:5px 0 4px 8px;border-radius:8px 8px 0 0;font-weight:bold;font-size:14px;">
        <span id="btnRetratil" style="cursor:pointer;margin-right:9px;" title="Ocultar painel">&#9776;</span>
        <span style="color:#ffe25c;">🔍 Explorer Selos</span>
        <span style="float:right;cursor:pointer;font-size:16px;margin-right:8px;" id="btnFecharPainel" title="Fechar painel">&times;</span>
      </div>
      <div id="corpoPainelFuzzy" style="display:block;max-height:410px;overflow-y:auto;">
        <div style="display:flex;gap:5px;margin:9px 0 4px 0;">
          <button id="btnImportar" title="Importar JSON" style="flex:1;background:#b8a928;color:#222;font-weight:600;border:none;border-radius:4px;padding:4px 0;font-size:11.5px;cursor:pointer;">⭳ Importar JSON</button>
          <input id="inputImportar" type="file" accept="application/json" style="display:none">
        </div>
        <div style="display:flex;gap:5px;margin:4px 0 6px 0;">
          <button id="btnChecarPendentes" title="Gera TXT com pendentes" style="flex:1;background:#2b6abb;color:#fff;font-weight:600;border:none;border-radius:4px;padding:4px 0;font-size:11.5px;cursor:pointer;">📋 Checar pendentes</button>
        </div>
        <div style="font-size:11px;color:#b1ad8c;margin:0 0 4px 0;padding:1px 6px;">
          Dados do backend (porta 3100). Importar JSON é plano B.
        </div>
        <div id="contadoresSelo" style="color:#ffe25c;margin-bottom:2px;font-size:12px;padding-left:3px;"></div>
        <div id="listaIndexados"></div>
        <hr style="border:none;border-top:1px solid #232323;margin:8px 0 4px 0">
        <div id="tituloUsados" style="font-size:11.6px;font-weight:bold;margin:3px 0 0 0;cursor:pointer;padding-left:3px;">
          Usados hoje <span style="font-size:13px;">${usadosExpandido ? '▼' : '►'}</span>
        </div>
        <div id="listaUsados" style="display:${usadosExpandido ? 'block':'none'};padding-left:2px;margin-top:2px;"></div>
        <div style="margin:3px 0 2px 0;padding-left:2px;text-align:right;">
          <button id="btnLimparUsados" style="background:#b45151;color:#fff;padding:2px 9px;border:none;border-radius:3px;cursor:pointer;font-size:10.7px;">Limpar usados</button>
        </div>
      </div>
    `;
    document.body.appendChild(painel);

    // Event handlers
    document.getElementById('btnImportar').onclick = () => document.getElementById('inputImportar').click();
    document.getElementById('inputImportar').onchange = importarJSON;
    document.getElementById('btnChecarPendentes').onclick = checarTodosPendentes;
    document.getElementById('btnLimparUsados').onclick = () => {
      if (confirm('Limpar usados?')) { setUsados([]); atualizaLista(); }
    };
    document.getElementById('btnFecharPainel').onclick = () => { painel.style.display = 'none'; };
    document.getElementById('btnRetratil').onclick = () => {
      const corpo = document.getElementById('corpoPainelFuzzy');
      corpo.style.display = corpo.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('tituloUsados').onclick = () => {
      usadosExpandido = !usadosExpandido;
      atualizaLista();
    };

    enableSmartDrag(painel);
    atualizaLista();
  }

  function enableSmartDrag(el) {
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

    el.addEventListener('mousedown', (ev) => {
      if (['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(ev.target.tagName)) return;
      dragging = true;
      startX = ev.clientX;
      startY = ev.clientY;
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      el.style.left = (startLeft + dx) + 'px';
      el.style.top = (startTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      const pos = { left: parseInt(el.style.left), top: parseInt(el.style.top) };
      try { localStorage.setItem('posPainelSeloFuzzy', JSON.stringify(pos)); } catch {}
    });
  }

  async function atualizaLista() {
    await syncIndexadosFromBackend();
    const arr = getIndexados();
    const usados = getUsados();
    const disponiveis = arr.filter(item =>
      !usados.some(u => u.selo === item.selo && u.codigo === item.codigo)
    );

    const contEl = document.getElementById('contadoresSelo');
    if (contEl) {
      contEl.innerHTML = `Total: <b>${arr.length}</b> | Disp.: <b>${disponiveis.length}</b> | Usados: <b>${usados.length}</b>`;
    }

    const listaEl = document.getElementById('listaIndexados');
    if (!listaEl) return;

    if (!disponiveis.length) {
      listaEl.innerHTML = '<span style="color:#888">Nenhum registro disponível</span>';
      return;
    }

    let html = `<table style="width:99%;border-collapse:collapse;font-size:10px;"><thead><tr style="background:#202430;">
      <th style="padding:2px;">Tipo</th><th style="padding:2px;">Nome</th><th style="padding:2px;">Nasc.</th>
      <th style="padding:2px;">Selo</th><th style="padding:2px;">Código</th><th style="padding:2px;">Ações</th>
    </tr></thead><tbody>`;

    disponiveis.forEach((item, idx) => {
      const realIdx = arr.indexOf(item);
      html += `<tr style="border-bottom:1px solid #2e2e2e;">
        <td style="padding:1px;color:#ffe25c;text-align:center;">${item.tipo === 'CASAMENTO' ? 'C' : 'N'}</td>
        <td style="padding:1px;color:#fff;font-size:10px;">${item.nome || '-'}</td>
        <td style="padding:1px;color:#c5c5c5;">${item.nascimento || '-'}</td>
        <td style="padding:1px;text-align:center;">
          <span class="copySelo" data-val="${item.selo}" style="cursor:pointer;text-decoration:underline;color:#18e9c6;font-family:monospace;">${item.selo}</span>
          <button data-idx="${realIdx}" class="btnManual" style="background:#b8961c;color:#fff;border:none;padding:2px 4px;border-radius:3px;font-size:9px;cursor:pointer;margin-top:2px;">Manual</button>
        </td>
        <td style="padding:1px;text-align:center;">
          <span class="copyCodigo" data-val="${item.codigo}" style="cursor:pointer;text-decoration:underline;color:#ffe55c;font-family:monospace;">${item.codigo}</span>
          <button data-idx="${realIdx}" class="btnBuscar" style="background:#2b6abb;color:#fff;border:none;padding:2px 4px;border-radius:3px;font-size:9px;cursor:pointer;margin-top:2px;">Buscar</button>
        </td>
        <td style="text-align:center;">
          <button data-idx="${realIdx}" class="btnRemover" style="background:#c32e2e;border:none;color:#fff;border-radius:3px;padding:2px 4px;cursor:pointer;">🗑</button>
        </td>
      </tr>`;
    });

    html += `</tbody></table>`;
    listaEl.innerHTML = html;

    // Event bindings
    document.querySelectorAll('.copySelo').forEach(el => el.onclick = () => copyToClipboard(el.dataset.val));
    document.querySelectorAll('.copyCodigo').forEach(el => el.onclick = () => copyToClipboard(el.dataset.val));
    document.querySelectorAll('.btnManual').forEach(btn => btn.onclick = () => preencherManual(Number(btn.dataset.idx)));
    document.querySelectorAll('.btnBuscar').forEach(btn => btn.onclick = () => localizarRegistro(Number(btn.dataset.idx)));
    document.querySelectorAll('.btnRemover').forEach(btn => btn.onclick = () => {
      const arr2 = getIndexados();
      arr2.splice(Number(btn.dataset.idx), 1);
      setIndexados(arr2);
      atualizaLista();
    });

    // Usados
    const usadosEl = document.getElementById('listaUsados');
    const titulo = document.getElementById('tituloUsados');
    if (usadosEl && titulo) {
      titulo.innerHTML = `Usados hoje <span style="font-size:13px;">${usadosExpandido ? '▼' : '►'}</span>`;
      if (usadosExpandido && usados.length) {
        let htmlUsados = '<table style="width:99%;border-collapse:collapse;font-size:10.7px;"><tbody>';
        usados.slice().reverse().forEach(u => {
          htmlUsados += `<tr style="border-bottom:1px solid #232323;">
            <td style="color:#38e6b8;">${u.selo}</td>
            <td style="color:#ffe55c;">${u.codigo}</td>
            <td style="color:#bbb;">${u.nome || ''}</td>
          </tr>`;
        });
        htmlUsados += '</tbody></table>';
        usadosEl.innerHTML = htmlUsados;
      } else {
        usadosEl.innerHTML = usadosExpandido ? '<span style="color:#888">Nenhum usado</span>' : '';
      }
      usadosEl.style.display = usadosExpandido ? 'block' : 'none';
    }
  }

  function preencherManual(idx) {
    if (!/certidoes2aViaIniciar\.cfm/.test(location.pathname)) {
      alert('Só funciona na tela de emissão!');
      return;
    }

    const arr = getIndexados();
    const item = arr[idx];
    if (!(item && item.selo && item.codigo && item.nome)) {
      alert('Registro incompleto.');
      return;
    }

    const campoSelo = document.getElementById('num_selo_rec');
    const campoCod = document.getElementById('cod_selo_rec');
    if (campoSelo && campoCod) {
      campoSelo.value = item.selo;
      campoCod.value = item.codigo;
      const usados = getUsados();
      usados.push({ selo: item.selo, codigo: item.codigo, nome: item.nome });
      setUsados(usados);
      atualizaLista();
      showToast('Preenchido!');
    } else {
      alert('Campos não encontrados!');
    }
  }

  function localizarRegistro(idx) {
    const arr = getIndexados();
    const item = arr[idx];
    if (!item) return;

    let nomeBuscado = (item.nome || '').split('/')[0].trim();
    if (!nomeBuscado) {
      alert('Nome não preenchido!');
      return;
    }

    const trs = Array.from(document.querySelectorAll('table tr'))
      .filter(tr => tr.querySelectorAll('td').length > 3);

    const candidatos = [];
    trs.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      let nomeTabela = (tds[4]?.innerText || '').replace(/\(.*?\)/g, '').trim();
      let simLev = similaridadeLevenshtein(nomeTabela, nomeBuscado);
      let scPalavras = scoreNome(nomeTabela, nomeBuscado);
      let scoreFinal = (scPalavras / (nomeBuscado.split(' ').length)) * 0.7 + simLev * 0.3;
      if (simLev >= 0.4) {
        candidatos.push({ tr, score: scoreFinal, nomeTabela });
      }
    });

    if (!candidatos.length) {
      alert(`Nenhum registro encontrado para "${nomeBuscado}".`);
      return;
    }

    candidatos.sort((a, b) => b.score - a.score);
    const m = candidatos[0];

    const ok = confirm(
      `Nome buscado: "${nomeBuscado}"\n` +
      `Nome encontrado: "${m.nomeTabela}"\n` +
      `Similaridade: ${(m.score * 100).toFixed(1)}%\n\n` +
      `Abrir pedido?`
    );

    if (ok) {
      const link = m.tr.querySelector('a[href*="certidoes2aViaIniciar.cfm"]');
      if (link) {
        localStorage.setItem('registroSelecionadoCRC', JSON.stringify(item));
        sessionStorage.setItem('registroSelecionado', nomeBuscado);
        link.click();
      }
    }
  }

  function checarTodosPendentes() {
    alert('Checagem de pendentes - função simplificada no Electron');
  }

  function importarJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const novos = JSON.parse(event.target.result);
        if (!Array.isArray(novos)) throw new Error('Formato inválido');
        const atuais = getIndexados();
        novos.forEach(n => {
          if (!atuais.some(a => a.selo === n.selo && a.codigo === n.codigo)) {
            atuais.push(n);
          }
        });
        setIndexados(atuais);
        atualizaLista();
        alert('Importado com sucesso!');
      } catch (err) {
        alert('Erro: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ATALHOS DE TECLADO
  window.addEventListener('keydown', (e) => {
    // Shift+S → toggle painel
    if (e.shiftKey && e.key.toLowerCase() === 's') {
      let p = document.getElementById('painelSeloFuzzy');
      if (!p) {
        montaPainel();
      } else {
        p.style.display = p.style.display === 'none' ? 'block' : 'none';
      }
    }

    // Ctrl+Q → buscar primeiro
    if (e.ctrlKey && e.key.toLowerCase() === 'q') {
      e.preventDefault();
      const btn = document.querySelector('.btnBuscar');
      if (btn) btn.click();
    }

    // Ctrl+B → abrir busca
    if (e.ctrlKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      window.open('https://sistema.registrocivil.org.br/buscas/buscaRegistros.cfm', '_blank', 'width=600,height=520');
    }
  });

  // INIT
  (async () => {
    await syncIndexadosFromBackend();
    montaPainel();
    setInterval(() => atualizaLista().catch(() => {}), 3000);
  })();

})();
