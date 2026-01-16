// @ts-nocheck
import '../../events.js';
import { mapperHtmlToJson } from '../obito/mapperHtmlToJson.js';
import { normalizeDate, validateDateDetailed } from '../../shared/validators/date.js';
import { normalizeTime } from '../../shared/validators/time.js';
import { normalizeCpf, isValidCpf } from '../../shared/validators/cpf.js';
import { validateName } from '../../shared/validators/name.js';
import { getFieldState, applyFieldState } from '../../shared/ui/fieldState.js';
import { applyDateMask, applyTimeMask } from '../../shared/ui/mask.js';
import { collectInvalidFields } from '../../shared/ui/debug.js';
import { buildMatriculaBase30, calcDv2Digits, buildMatriculaFinal } from '../../shared/matricula/cnj.js';
import { setupPrimaryShortcut, setupNameCopy, setupAutoNationality } from '../../shared/productivity/index.js';
import { setupAdminPanel } from '../../shared/ui/admin.js';

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

function resolveField(input) {
	return input.closest('td') || input.closest('.campo') || input.closest('.field') || input.parentElement;
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

function toXml(obj, nodeName, indent = 0) {
	const pad = '  '.repeat(indent);
	if (obj === null || obj === undefined) return `${pad}<${nodeName}></${nodeName}>`;
	if (typeof obj !== 'object') return `${pad}<${nodeName}>${String(obj || '')}</${nodeName}>`;
	if (Array.isArray(obj)) return obj.map((item) => toXml(item, nodeName, indent)).join('\n');
	const children = Object.keys(obj).map((key) => toXml(obj[key], key, indent + 1)).join('\n');
	return `${pad}<${nodeName}>\n${children}\n${pad}</${nodeName}>`;
}

function updateDebug(data) {
	const cns = document.querySelector('input[data-bind="certidao.cartorio_cns"]')?.value || '';
	const ano = (document.getElementById('data-reg')?.value || '').slice(-4);
	const livro = document.getElementById('matricula-livro')?.value || '';
	const folha = document.getElementById('matricula-folha')?.value || '';
	const termo = document.getElementById('matricula-termo')?.value || '';
	const base = buildMatriculaBase30({ cns6: cns, ano, tipoAto: '1', acervo: '01', servico: '55', livro, folha, termo });
	const dv = base ? calcDv2Digits(base) : '';
	const final = base && dv ? base + dv : buildMatriculaFinal({ cns6: cns, ano, tipoAto: '1', livro, folha, termo });
	const baseEl = document.getElementById('debug-matricula-base'); if (baseEl) baseEl.value = base || '';
	const dvEl = document.getElementById('debug-matricula-dv'); if (dvEl) dvEl.value = dv || '';
	const finalEl = document.getElementById('debug-matricula-final'); if (finalEl) finalEl.value = final || '';
	const invalids = collectInvalidFields(document);
	const invalidEl = document.getElementById('debug-invalid'); if (invalidEl) invalidEl.value = invalids.join('\n');
}

function updateOutputs() {
	const data = mapperHtmlToJson(document);
	const jsonEl = document.getElementById('json-output'); if (jsonEl) jsonEl.value = JSON.stringify(data, null, 2);
	const xmlEl = document.getElementById('xml-output'); if (xmlEl) xmlEl.value = toXml(data, 'certidao_nascimento', 0);
	updateDebug(data);
}

function canProceed() {
	const invalids = collectInvalidFields(document);
	if (!invalids || invalids.length === 0) return true;
	setStatus(`${invalids.length} campo(s) inválido(s). Corrija antes de prosseguir.`, true);
	showToast('Existem campos inválidos — corrija antes de prosseguir');
	const invalidEl = document.getElementById('debug-invalid'); if (invalidEl) invalidEl.value = invalids.join('\n');
	return false;
}

function updateActionButtons() {
  const invalids = collectInvalidFields(document);
  const disabled = !!(invalids && invalids.length > 0);
  const btnJson = document.getElementById('btn-json'); if (btnJson) btnJson.disabled = disabled;
  const btnXml = document.getElementById('btn-xml'); if (btnXml) btnXml.disabled = disabled;
  const btnSave = document.getElementById('btn-save'); if (btnSave) btnSave.disabled = disabled;
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
		// update aria-live for assistive tech
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

function generateJson() {
	if (!canProceed()) return;
	const data = mapperHtmlToJson(document);
	const json = JSON.stringify(data, null, 2);
	const out = document.getElementById('json-output'); if (out) out.value = json;
	const name = `NASCIMENTO_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'')}.json`;
	try { const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); setStatus(`JSON baixado: ${name}`); } catch { setStatus('Falha ao gerar JSON', true); }
}

function generateXml() {
	if (!canProceed()) return;
	const data = mapperHtmlToJson(document);
	const xml = toXml(data, 'certidao_nascimento', 0);
	const out = document.getElementById('xml-output'); if (out) out.value = xml;
	const name = `NASCIMENTO_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'')}.xml`;
	try { const blob = new Blob([xml], { type: 'application/xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); setStatus(`XML baixado: ${name}`); } catch { setStatus('Falha ao gerar XML', true); }
}

function setupValidation() {
	// date fields (.w-date)
	document.querySelectorAll('input.w-date').forEach((input) => {
		const field = resolveField(input);
		const required = input.hasAttribute('data-required') || input.classList.contains('required');
		const onInput = () => { applyDateMask(input); clearFieldHint(field); const normalized = normalizeDate(input.value); const isValid = !input.value || !!normalized; const state = getFieldState({ required, value: input.value, isValid }); applyFieldState(field, state); };
		const onBlur = () => { applyDateMask(input); const raw = input.value || ''; const res = validateDateDetailed(raw); const isValid = res.ok; const state = getFieldState({ required, value: raw, isValid }); applyFieldState(field, state); if (!isValid && raw) setFieldHint(field, res.message || 'Data inválida'); else clearFieldHint(field); };
		input.addEventListener('input', onInput); input.addEventListener('blur', onBlur); onInput();
	});

	// time fields (.w-time)
	document.querySelectorAll('input.w-time').forEach((input) => {
		const field = resolveField(input);
		const required = input.hasAttribute('data-required');
		const handler = () => { applyTimeMask(input); const normalized = normalizeTime(input.value); const isValid = !input.value || !!normalized; const state = getFieldState({ required, value: input.value, isValid }); applyFieldState(field, state); };
		input.addEventListener('input', handler); input.addEventListener('blur', handler); handler();
	});

	// CPF (id cpf)
	const cpfInput = document.getElementById('cpf');
	if (cpfInput) {
		const field = resolveField(cpfInput);
		const handler = () => { cpfInput.value = formatCpfInput(cpfInput.value); const digits = normalizeCpf(cpfInput.value); const isValid = !digits || isValidCpf(digits); const state = getFieldState({ required: false, value: digits ? cpfInput.value : '', isValid }); applyFieldState(field, state); };
		cpfInput.addEventListener('input', handler);
		cpfInput.addEventListener('blur', () => { handler(); const digits = normalizeCpf(cpfInput.value); if (cpfInput.value && (!digits || !isValidCpf(digits))) setFieldHint(field, 'CPF inválido'); else clearFieldHint(field); });
		handler();
	}

	// name validation
	const enableName = localStorage.getItem('ui.enableNameValidation') !== 'false';
	if (enableName) {
		document.querySelectorAll('[data-name-validate]').forEach((input) => {
			const field = resolveField(input);
			const required = input.hasAttribute('data-required');
			const handler = () => { const res = validateName(input.value || '', { minWords: 2 }); const state = getFieldState({ required, value: input.value, isValid: !res.invalid, warn: res.warn }); applyFieldState(field, state); };
			input.addEventListener('input', handler); input.addEventListener('blur', handler); handler();
		});
	}
}

function setupLiveOutputs() {
	const form = document.querySelector('.container');
	const handler = () => updateOutputs();
	document.addEventListener('input', handler);
	document.addEventListener('change', handler);
	updateOutputs();
}

function setup() {
	document.getElementById('btn-json')?.addEventListener('click', (e) => { e.preventDefault(); generateJson(); });
	document.getElementById('btn-xml')?.addEventListener('click', (e) => { e.preventDefault(); generateXml(); });
	setupValidation();
	setupFocusEmphasis();
	setupAdminPanel();
	setupNameCopy('input[data-bind="ui.mae_nome"]','input[data-bind="ui.pai_nome"]');
	setupAutoNationality('input[name="nacionalidadeNoivo"]','BRASILEIRO');
	setupLiveOutputs();
	// wire action button state
	updateActionButtons();
	document.addEventListener('input', updateActionButtons);
	document.addEventListener('change', updateActionButtons);
}

setup();

