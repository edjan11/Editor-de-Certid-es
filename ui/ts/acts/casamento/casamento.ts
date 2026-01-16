// @ts-nocheck
import { mapperHtmlToJson } from './mapperHtmlToJson.js';
import { normalizeDate, validateDateDetailed } from '../../shared/validators/date.js';
import { normalizeCpf, isValidCpf } from '../../shared/validators/cpf.js';
import { validateName } from '../../shared/validators/name.js';
import { getFieldState, applyFieldState } from '../../shared/ui/fieldState.js';
import { applyDateMask } from '../../shared/ui/mask.js';
import { setupDrawer } from '../../shared/ui/drawer.js';
import { collectInvalidFields } from '../../shared/ui/debug.js';
import { buildMatriculaBase30, calcDv2Digits, buildMatriculaFinal } from '../../shared/matricula/cnj.js';
import { setupPrimaryShortcut, setupNameCopy, setupAutoNationality, setupCasamentoDates } from '../../shared/productivity/index.js';
import { setupAdminPanel } from '../../shared/ui/admin.js';
import { createNameValidator } from '../../nameValidator.js';

const NAME_MODE_KEY = 'ui.nameValidationMode';
let nameValidationMode = localStorage.getItem(NAME_MODE_KEY) || 'input';
const PANEL_INLINE_KEY = 'ui.panelInline';

// wire settings save/apply buttons (drawer position and prefs)
function setupSettingsPanelCasamento() {
  const select = document.getElementById('settings-drawer-position');
  const cbCpf = document.getElementById('settings-enable-cpf');
  const cbName = document.getElementById('settings-enable-name');
  const saveBtn = document.getElementById('settings-save');
  const applyBtn = document.getElementById('settings-apply');

  const pos = localStorage.getItem('ui.drawerPosition') || 'bottom-right';
  const enableCpf = localStorage.getItem('ui.enableCpfValidation') !== 'false';
  const enableName = localStorage.getItem('ui.enableNameValidation') !== 'false';

  if (select) select.value = pos;
  if (cbCpf) cbCpf.checked = !!enableCpf;
  if (cbName) cbName.checked = !!enableName;

  saveBtn?.addEventListener('click', () => {
    const newPos = select?.value || 'bottom-right';
    const newCpf = cbCpf?.checked ? 'true' : 'false';
    const newName = cbName?.checked ? 'true' : 'false';
    const newInline = (document.getElementById('settings-panel-inline')?.checked) ? 'true' : 'false';
    localStorage.setItem('ui.drawerPosition', newPos);
    localStorage.setItem('ui.enableCpfValidation', newCpf);
    localStorage.setItem('ui.enableNameValidation', newName);
    localStorage.setItem(PANEL_INLINE_KEY, newInline);
    setStatus('Preferências salvas. Atualizando...', false);
    setTimeout(() => window.location.reload(), 300);
  });

  applyBtn?.addEventListener('click', () => {
    const newPos = select?.value || 'bottom-right';
    applyDrawerPosition(newPos);
    setStatus('Posição aplicada (não salva)', false);
  });
}

function setStatus(text, isError) {
  const el = document.getElementById('statusText');
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? '#dc2626' : '#64748b';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.textContent = 'Pronto';
    el.style.color = '#64748b';
  }, 2000);
}

function formatCpfInput(value) {
  const digits = normalizeCpf(value).slice(0, 11);
  if (!digits) return '';
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 9);
  const p4 = digits.slice(9, 11);
  let out = p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toXml(obj, nodeName, indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return `${pad}<${nodeName}></${nodeName}>`;
  if (typeof obj !== 'object') return `${pad}<${nodeName}>${escapeXml(obj)}</${nodeName}>`;
  if (Array.isArray(obj)) return obj.map((item) => toXml(item, nodeName, indent)).join('\n');
  const children = Object.keys(obj).map((key) => toXml(obj[key], key, indent + 1)).join('\n');
  return `${pad}<${nodeName}>\n${children}\n${pad}</${nodeName}>`;
}

function downloadFile(name, content, mime) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function makeTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function buildFileName(ext) {
  return `CASAMENTO_${makeTimestamp()}.${ext}`;
}

function generateJson() {
  if (!canProceed()) return;
  const data = mapperHtmlToJson(document);
  const json = JSON.stringify(data, null, 2);
  const out = document.getElementById('json-output');
  if (out) out.value = json;
  const name = buildFileName('json');
  if (downloadFile(name, json, 'application/json')) setStatus(`JSON baixado: ${name}`);
  else setStatus('Falha ao gerar JSON', true);
}

function generateXml() {
  if (!canProceed()) return;
  const data = mapperHtmlToJson(document);
  const xml = toXml(data, 'certidao_casamento', 0);
  const name = buildFileName('xml');
  if (downloadFile(name, xml, 'application/xml')) setStatus(`XML baixado: ${name}`);
  else setStatus('Falha ao gerar XML', true);
}

function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, 2000);
}

function setupConfigPanel() {
  const radios = document.querySelectorAll('input[name="name-validation-mode"]');
  radios.forEach((radio) => {
    radio.checked = radio.value === nameValidationMode;
  });
  const cbInline = document.getElementById('settings-panel-inline');
  const panelInlineStored = localStorage.getItem(PANEL_INLINE_KEY);
  // default: floating drawer is primary (unchecked)
  if (cbInline) cbInline.checked = panelInlineStored === null ? false : panelInlineStored === 'true';

  document.getElementById('config-save')?.addEventListener('click', () => {
    const selected = document.querySelector('input[name="name-validation-mode"]:checked');
    if (selected && selected.value) {
      nameValidationMode = selected.value;
      localStorage.setItem(NAME_MODE_KEY, nameValidationMode);
    }
    const newInline = (document.getElementById('settings-panel-inline')?.checked) ? 'true' : 'false';
    localStorage.setItem(PANEL_INLINE_KEY, newInline);
  });
  setupAdminPanel();
}

function setFieldHint(field, message) {
  if (!field) return;
  let hint = field.querySelector('.hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'hint';
    field.appendChild(hint);
  }
  if (message) {
    hint.innerHTML = '';
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = '⚠';
    icon.setAttribute('aria-hidden', 'true');
    hint.appendChild(icon);
    const txt = document.createElement('span');
    txt.className = 'hint-text';
    txt.textContent = message;
    hint.appendChild(txt);
    hint.classList.add('visible');
    let aria = document.getElementById('aria-live-errors');
    if (!aria) {
      aria = document.createElement('div');
      aria.id = 'aria-live-errors';
      aria.className = 'sr-only';
      aria.setAttribute('aria-live', 'assertive');
      aria.setAttribute('role', 'status');
      document.body.appendChild(aria);
    }
    aria.textContent = message;
  } else {
    hint.innerHTML = '';
    hint.classList.remove('visible');
  }
}

function clearFieldHint(field) { setFieldHint(field, ''); }

function setupFocusEmphasis() {
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (['INPUT','SELECT','TEXTAREA'].includes(el.tagName)) {
      try { el.scrollIntoView({behavior:'smooth', block:'center'}); } catch {}
      el.classList.add('focus-emphasis');
    }
  });
  document.addEventListener('focusout', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (['INPUT','SELECT','TEXTAREA'].includes(el.tagName)) el.classList.remove('focus-emphasis');
  });
}

function setupActSelect() {
  const select = document.getElementById('ato-select');
  if (!select) return;
  select.value = 'casamento';
  select.addEventListener('change', () => {
    const map = {
      nascimento: './Nascimento2Via.html',
      casamento: './Casamento2Via.html',
      obito: './Obito2Via.html'
    };
    const next = map[select.value];
    if (next) window.location.href = next;
  });
}

function yearFromDate(value) {
  const normalized = normalizeDate(value);
  const match = (normalized || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? match[3] : '';
}

function dateToTime(value) {
  const normalized = normalizeDate(value);
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt.getTime();
}

function updateDebug(data) {
  const cns = document.querySelector('input[name="certidao.cartorio_cns"]')?.value || '';
  const ano = yearFromDate(document.querySelector('input[name="dataTermo"]')?.value || '');
  const tipo = document.querySelector('select[name="tipoCasamento"]')?.value || '';
  const tipoAto = tipo === 'R' ? '3' : tipo === 'C' ? '2' : '';
  const livro = document.querySelector('input[name="livro"]')?.value || '';
  const folha = document.querySelector('input[name="folha"]')?.value || '';
  const termo = document.querySelector('input[name="termo"]')?.value || '';
  const base = buildMatriculaBase30({
    cns6: cns,
    ano,
    tipoAto,
    acervo: '01',
    servico: '55',
    livro,
    folha,
    termo
  });
  const dv = base ? calcDv2Digits(base) : '';
  const final = base && dv ? base + dv : buildMatriculaFinal({ cns6: cns, ano, tipoAto, livro, folha, termo });

  const baseEl = document.getElementById('debug-matricula-base');
  if (baseEl) baseEl.value = base || '';
  const dvEl = document.getElementById('debug-matricula-dv');
  if (dvEl) dvEl.value = dv || '';
  const finalEl = document.getElementById('debug-matricula-final');
  if (finalEl) finalEl.value = final || '';

  const invalids = collectInvalidFields(document);
  const invalidEl = document.getElementById('debug-invalid');
  if (invalidEl) invalidEl.value = invalids.join('\n');

  const alerts = [];
  const termoDate = dateToTime(data?.registro?.data_registro || '');
  const casamentoDate = dateToTime(data?.registro?.data_celebracao || '');
  if (termoDate && casamentoDate && termoDate < casamentoDate) {
    alerts.push('Data do termo menor que data do casamento.');
  }
  const alertsEl = document.getElementById('debug-alerts');
  if (alertsEl) alertsEl.value = alerts.join('\n');
}

function updateOutputs() {
  const data = mapperHtmlToJson(document);
  const jsonEl = document.getElementById('json-output');
  if (jsonEl) jsonEl.value = JSON.stringify(data, null, 2);
  const xmlEl = document.getElementById('xml-output');
  if (xmlEl) xmlEl.value = toXml(data, 'certidao_casamento', 0);
  updateDebug(data);
}

function setupLiveOutputs() {
  const form = document.getElementById('form-casamento');
  const drawer = document.getElementById('drawer');
  const handler = () => updateOutputs();
  form?.addEventListener('input', handler);
  form?.addEventListener('change', handler);
  drawer?.addEventListener('input', handler);
  drawer?.addEventListener('change', handler);
  updateOutputs();
}

function setupNameValidation() {
  const validator = createNameValidator();
  const fields = document.querySelectorAll('[data-name-validate]');
  const timers = new Map();

  fields.forEach((input) => {
    const field = input.closest('.campo');
    if (field) field.classList.add('name-field');
    let hint = field ? field.querySelector('.name-suggest') : null;
    if (field && !hint) {
      hint = document.createElement('button');
      hint.type = 'button';
      hint.className = 'name-suggest';
      hint.textContent = 'Parece incorreto - adicionar ao dicionario?';
      field.appendChild(hint);
    }
    if (hint) {
      hint.addEventListener('click', (e) => {
        e.preventDefault();
        const value = input.value;
        if (!value) return;
        validator.repo.addException(value);
        input.classList.remove('invalid');
        if (field) field.classList.remove('name-suspect');
        const t = timers.get(input);
        if (t) clearInterval(t);
        timers.delete(input);
      });
    }

    const runCheck = () => {
      const value = input.value || '';
      const result = validator.check(value);
      const suspect = !!result.suspicious;
      input.classList.toggle('invalid', suspect);
      if (field) field.classList.toggle('name-suspect', suspect);
      if (suspect) {
        showToast('Nome possivelmente incorreto');
        if (!timers.has(input)) {
          const id = setInterval(() => {
            if (input.classList.contains('invalid')) showToast('Nome possivelmente incorreto');
          }, 180000);
          timers.set(input, id);
        }
      } else {
        const t = timers.get(input);
        if (t) clearInterval(t);
        timers.delete(input);
      }
    };

    input.addEventListener('input', () => {
      if (nameValidationMode === 'input') runCheck();
    });
    input.addEventListener('blur', () => {
      if (nameValidationMode === 'blur' || nameValidationMode === 'input') runCheck();
    });
  });

  validator.ready.then(() => {
    fields.forEach((input) => {
      const field = input.closest('.campo');
      if (field) field.classList.remove('name-suspect');
      const value = input.value || '';
      if (value) {
        const result = validator.check(value);
        const suspect = !!result.suspicious;
        input.classList.toggle('invalid', suspect);
        if (field) field.classList.toggle('name-suspect', suspect);
      }
    });
  });
}

function setup() {
  document.getElementById('btn-json')?.addEventListener('click', (e) => {
    e.preventDefault();
    generateJson();
  });
  document.getElementById('btn-xml')?.addEventListener('click', (e) => {
    e.preventDefault();
    generateXml();
  });
  setupValidation();
  setupNameValidation();
  setupConfigPanel();
  setupDrawer({ defaultTab: 'tab-config' });
  setupSettingsPanelCasamento();
  // arrange the panel (inline vs drawer) according to saved preference
  (function(){
    const panelInlineStored = localStorage.getItem(PANEL_INLINE_KEY);
    // default to floating drawer as primary (false) unless user previously chose inline
    const useInline = panelInlineStored === null ? false : panelInlineStored === 'true';
    const inline = document.getElementById('panel-inline');
    const drawer = document.getElementById('drawer');
    const body = drawer?.querySelector('.drawer-body');
    if (!inline) return;
    if (useInline) {
      if (body) while (body.firstChild) inline.appendChild(body.firstChild);
      const toggle = document.getElementById('drawer-toggle'); if (toggle) toggle.style.display = 'none';
    } else {
      // ensure drawer has body area and toggle visible
      const toggle = document.getElementById('drawer-toggle'); if (toggle) toggle.style.display = 'inline-flex';
    }
    // wire toggle button
    const btn = document.getElementById('drawer-toggle');
    if (btn) btn.addEventListener('click', () => {
      const d = document.getElementById('drawer'); if (!d) return; d.classList.toggle('open');
    });
  })();
  setupActSelect();
  setupPrimaryShortcut(() => document.getElementById('btn-json') || document.getElementById('btn-xml'));
  setupNameCopy('input[name="nomeSolteiro"]', 'input[name="nomeCasado"]');
  setupNameCopy('input[name="nomeSolteira"]', 'input[name="nomeCasada"]');
  setupAutoNationality('input[name="nacionalidadeNoivo"]', 'BRASILEIRO');
  setupAutoNationality('input[name="nacionalidadeNoiva"]', 'BRASILEIRA');
  setupCasamentoDates();
  setupFocusEmphasis();
  setupLiveOutputs();
  // action buttons reflect invalid state
  updateActionButtons();
  document.getElementById('form-casamento')?.addEventListener('input', updateActionButtons);
  document.getElementById('form-casamento')?.addEventListener('change', updateActionButtons);
}

function setupValidation() {
  document.querySelectorAll('input[data-date]').forEach((input) => {
    const field = input.closest('.campo');
    const required = input.hasAttribute('data-required');
    const onInput = () => {
      applyDateMask(input);
      clearFieldHint(field);
      const normalized = normalizeDate(input.value);
      const isValid = !input.value || !!normalized;
      const state = getFieldState({ required, value: input.value, isValid });
      applyFieldState(field, state);
    };
    const onBlur = () => {
      applyDateMask(input);
      const raw = input.value || '';
      const res = validateDateDetailed(raw);
      const isValid = res.ok;
      const state = getFieldState({ required, value: raw, isValid });
      applyFieldState(field, state);
      if (!isValid && raw) setFieldHint(field, res.message || 'Data inválida');
      else clearFieldHint(field);
    };
    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);
    onInput();
  });

  document.querySelectorAll('[data-name-validate]').forEach((input) => {
    const field = input.closest('.campo');
    const required = input.hasAttribute('data-required');
    const handler = () => {
      const res = validateName(input.value, { minWords: 2 });
      const state = getFieldState({
        required,
        value: input.value,
        isValid: !res.invalid,
        warn: res.warn
      });
      applyFieldState(field, state);
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', handler);
    handler();
  });

  document.querySelectorAll('input[data-cpf]').forEach((input) => {
    const field = input.closest('.campo');
    const required = input.hasAttribute('data-required');
    const handler = () => {
      input.value = formatCpfInput(input.value);
      const digits = normalizeCpf(input.value);
      const isValid = !digits || isValidCpf(digits);
      const state = getFieldState({ required, value: digits ? input.value : '', isValid });
      applyFieldState(field, state);
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', () => {
      handler();
      const digits = normalizeCpf(input.value);
      if (input.value && (!digits || !isValidCpf(digits))) setFieldHint(field, 'CPF inválido');
      else clearFieldHint(field);
    });
    handler();
  });
}

// helper to prevent actions when there are invalid fields
function canProceed() {
  const invalids = collectInvalidFields(document);
  if (!invalids || invalids.length === 0) return true;
  setStatus(`${invalids.length} campo(s) inválido(s). Corrija antes de prosseguir.`, true);
  showToast('Existem campos inválidos — corrija antes de prosseguir');
  const invalidEl = document.getElementById('debug-invalid');
  if (invalidEl) invalidEl.value = invalids.join('\n');
  return false;
}

function updateActionButtons() {
  const invalids = collectInvalidFields(document);
  const disabled = !!(invalids && invalids.length > 0);
  const btnJson = document.getElementById('btn-json'); if (btnJson) btnJson.disabled = disabled;
  const btnXml = document.getElementById('btn-xml'); if (btnXml) btnXml.disabled = disabled;
  const statusEl = document.getElementById('statusText'); if (statusEl && !disabled) statusEl.textContent = 'Pronto';

  let summary = document.getElementById('form-error-summary');
  if (!summary) {
    summary = document.createElement('div');
    summary.id = 'form-error-summary';
    summary.style.margin = '8px 0';
    summary.style.padding = '8px';
    summary.style.borderRadius = '8px';
    summary.style.background = '#fff5f5';
    summary.style.border = '1px solid #fecaca';
    summary.style.color = '#7f1d1d';
    const container = document.querySelector('.container');
    if (container && container.firstElementChild) container.insertBefore(summary, container.firstElementChild.nextSibling);
  }
  if (disabled) {
    summary.textContent = `Campos inválidos: ${invalids.join(', ')}`;
    summary.style.display = 'block';
  } else if (summary) {
    summary.style.display = 'none';
  }
  // aria-live region for assistive tech
  let aria = document.getElementById('aria-live-errors');
  if (!aria) {
    aria = document.createElement('div');
    aria.id = 'aria-live-errors';
    aria.className = 'sr-only';
    aria.setAttribute('aria-live', 'assertive');
    aria.setAttribute('role', 'status');
    document.body.appendChild(aria);
  }
  aria.textContent = disabled ? `Existem ${invalids.length} campos inválidos: ${invalids.join(', ')}` : '';
}

// update matricula preview when tipoCasamento changes
const tipoSelect = document.querySelector('select[name="tipoCasamento"]');
if (tipoSelect) {
  tipoSelect.addEventListener('change', () => {
    // trigger outputs update which recomputes matricula
    updateOutputs();
  });
}

setup();
