'use strict';

// ── Config ──────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

// ── Router ──────────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');

  const btn = document.querySelector(`.nav-btn[data-page="${name}"]`);
  if (btn) btn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // close mobile menu
  document.getElementById('nav-links-wrapper')?.classList.remove('open');
}

// ── Tag Input Helper ─────────────────────────────────────────────────────────
function createTagManager(inputId, addBtnId, listId) {
  const input  = document.getElementById(inputId);
  const addBtn = document.getElementById(addBtnId);
  const list   = document.getElementById(listId);
  const tags   = [];

  function render() {
    list.innerHTML = '';
    tags.forEach((tag, i) => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.innerHTML = `${escapeHtml(tag)}<button class="tag-remove" aria-label="Remove ${escapeHtml(tag)}">&#x2715;</button>`;
      el.querySelector('.tag-remove').addEventListener('click', () => {
        tags.splice(i, 1);
        render();
      });
      list.appendChild(el);
    });
  }

  function add() {
    const val = input.value.trim();
    if (val && !tags.includes(val)) {
      tags.push(val);
      input.value = '';
      render();
    }
    input.focus();
  }

  addBtn.addEventListener('click', add);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });

  return { get: () => [...tags], clear: () => { tags.length = 0; render(); } };
}

// ── Loading ──────────────────────────────────────────────────────────────────
function setLoading(on, text = 'Analyzing with FDA data + AI…') {
  const overlay = document.getElementById('loading-overlay');
  document.getElementById('loading-text').textContent = text;
  overlay.classList.toggle('hidden', !on);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function severityBadge(sev) {
  const s = (sev || '').toLowerCase();
  if (s === 'high')   return `<span class="badge badge-high">High</span>`;
  if (s === 'medium') return `<span class="badge badge-medium">Medium</span>`;
  if (s === 'low')    return `<span class="badge badge-low">Low</span>`;
  return `<span class="badge badge-info">${escapeHtml(sev || 'Unknown')}</span>`;
}

function similarityBar(score) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 70 ? 'var(--primary)' : pct >= 40 ? 'var(--warning)' : 'var(--gray-400)';
  return `
    <div class="similarity-bar-wrap">
      <div class="similarity-label"><span>Match</span><span>${pct}%</span></div>
      <div class="similarity-bar">
        <div class="similarity-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>`;
}

function showError(containerId, msg) {
  const el = document.getElementById(containerId);
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="card" style="border-color:var(--danger);background:var(--danger-lt)">
      <p style="color:var(--danger);font-weight:600">Error</p>
      <p style="font-size:.88rem;margin-top:4px">${escapeHtml(msg)}</p>
    </div>`;
}

// ── Drug Analysis ────────────────────────────────────────────────────────────
const drugTags    = createTagManager('drug-input',         'drug-add-btn',         'drug-tags');
const drugSymTags = createTagManager('drug-symptom-input', 'drug-symptom-add-btn', 'drug-symptom-tags');

document.getElementById('drug-analyze-btn').addEventListener('click', async () => {
  const medications = drugTags.get();
  const diagnosis   = document.getElementById('drug-diagnosis').value.trim();
  const symptoms    = drugSymTags.get();

  if (!medications.length) { alert('Please add at least one medication.'); return; }
  if (!diagnosis)           { alert('Please enter a diagnosis.'); return; }
  if (!symptoms.length)     { alert('Please add at least one symptom.'); return; }

  setLoading(true, 'Fetching FDA data and running AI analysis…');
  const resultsEl = document.getElementById('drug-results');
  resultsEl.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/analyze-drugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medications, diagnosis, symptoms }),
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    renderDrugResults(data, resultsEl);
  } catch (err) {
    showError('drug-results', err.message || 'Could not connect to the backend. Is it running?');
  } finally {
    setLoading(false);
  }
});

function renderDrugResults(data, container) {
  const { drug_infos = [], basic_conflicts = [], advanced_analysis = {} } = data;
  const adv = advanced_analysis || {};

  let html = '';

  // ── Conflict summary ──
  const allConflicts = [
    ...(basic_conflicts || []),
    ...(adv.advanced_conflicts || []),
  ];

  if (allConflicts.length === 0) {
    html += `<div class="summary-card"><p>✅ No significant drug conflicts detected between the listed medications.</p></div>`;
  }

  // ── Advanced conflicts ──
  if ((adv.advanced_conflicts || []).length) {
    html += `<div class="result-section">
      <div class="result-section-title">AI-Detected Conflicts</div>`;
    adv.advanced_conflicts.forEach(c => {
      const sev = (c.severity || '').toLowerCase();
      const borderClass = sev === 'high' ? '' : sev === 'medium' ? 'warning-type' : 'low-type';
      html += `<div class="conflict-item ${borderClass}">
        <div class="conflict-header">
          <span class="conflict-drugs">${(c.drugs || []).map(escapeHtml).join(' ↔ ')}</span>
          ${severityBadge(c.severity)}
        </div>
        <p class="conflict-desc">${escapeHtml(c.description || c.type || '')}</p>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Basic conflicts ──
  if (basic_conflicts.length) {
    html += `<div class="result-section">
      <div class="result-section-title">FDA Database Conflicts (${basic_conflicts.length})</div>`;
    basic_conflicts.forEach(c => {
      html += `<div class="conflict-item warning-type">
        <div class="conflict-header">
          <span class="conflict-drugs">${escapeHtml(c.drug1)} ↔ ${escapeHtml(c.drug2)}</span>
          <span class="badge badge-info">${escapeHtml(c.type || '')}</span>
        </div>
        ${(c.details || []).slice(0, 2).map(d => `<p class="conflict-desc">${escapeHtml(String(d).slice(0, 300))}…</p>`).join('')}
      </div>`;
    });
    html += `</div>`;
  }

  // ── Diagnosis contradictions ──
  if ((adv.diagnosis_contradictions || []).length) {
    html += `<div class="result-section">
      <div class="result-section-title">Diagnosis Contradictions</div>`;
    adv.diagnosis_contradictions.forEach(c => {
      html += `<div class="conflict-item">
        <div class="conflict-header">
          <span class="conflict-drugs">${escapeHtml(c.drug)}</span>
        </div>
        <p class="conflict-desc">${escapeHtml(c.contradiction)}</p>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Additional warnings ──
  if ((adv.additional_warnings || []).length) {
    html += `<div class="result-section">
      <div class="result-section-title">Additional Warnings</div>`;
    adv.additional_warnings.forEach(w => {
      html += `<div class="conflict-item warning-type">
        <div class="conflict-header">
          <span class="conflict-drugs">${(w.drugs || []).map(escapeHtml).join(', ')}</span>
        </div>
        <p class="conflict-desc">${escapeHtml(w.warning)}</p>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Drug info cards ──
  if (drug_infos.length) {
    html += `<div class="result-section">
      <div class="result-section-title">Drug Information (${drug_infos.length})</div>`;
    drug_infos.forEach((drug, i) => {
      const generic = drug.generic_name ? `<span style="color:var(--gray-400);font-size:.85rem"> — ${escapeHtml(drug.generic_name)}</span>` : '';
      html += `<div class="drug-info-card">
        <div class="drug-info-header" data-idx="${i}" onclick="toggleDrugCard(this)">
          <h4>${escapeHtml(drug.brand_name)}${generic}</h4>
          <span>Show details ▾</span>
        </div>
        <div class="drug-info-body" id="drug-card-body-${i}">
          ${renderDrugBody(drug)}
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;
  container.classList.remove('hidden');
}

window.toggleDrugCard = function(header) {
  const body = header.nextElementSibling;
  const open = body.classList.toggle('open');
  header.querySelector('span').textContent = open ? 'Hide details ▴' : 'Show details ▾';
};

function renderDrugBody(drug) {
  const sections = [
    { label: 'Warnings',         data: drug.warnings },
    { label: 'Contraindications',data: drug.contraindications },
    { label: 'Adverse Reactions',data: drug.adverse_reactions },
    { label: 'Drug Interactions',data: drug.drug_interactions },
    { label: 'Indications',      data: drug.indications_and_usage },
  ];
  return sections.map(s => {
    if (!s.data || !s.data.length) return '';
    const text = s.data.slice(0, 2).map(t => String(t).slice(0, 400)).join(' ').trim();
    if (!text) return '';
    return `<div class="info-section">
      <div class="info-section-label">${s.label}</div>
      <div class="info-section-text">${escapeHtml(text)}${text.length === 400 ? '…' : ''}</div>
    </div>`;
  }).join('');
}

// ── Symptom Analysis ─────────────────────────────────────────────────────────
const symptomTags = createTagManager('symptom-input', 'symptom-add-btn', 'symptom-tags');

document.getElementById('symptom-analyze-btn').addEventListener('click', async () => {
  const symptoms  = symptomTags.get();
  const diagnosis = document.getElementById('symptom-diagnosis').value.trim();

  if (!diagnosis)       { alert('Please enter a diagnosis.'); return; }
  if (!symptoms.length) { alert('Please add at least one symptom.'); return; }

  setLoading(true, 'Generating differential diagnosis…');
  const resultsEl = document.getElementById('symptom-results');
  resultsEl.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/analyze-symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis, symptoms }),
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    renderSymptomResults(data, diagnosis, symptoms, resultsEl);
  } catch (err) {
    showError('symptom-results', err.message || 'Could not connect to the backend.');
  } finally {
    setLoading(false);
  }
});

function renderSymptomResults(data, diagnosis, symptoms, container) {
  if (data.error) {
    showError('symptom-results', data.error);
    return;
  }

  let html = '';

  // Current diagnosis card
  const score = data.diagnosis_similarity || 0;
  html += `<div class="card" style="margin-bottom:1rem">
    <div class="result-section-title">Current Diagnosis</div>
    <strong style="font-size:1.05rem">${escapeHtml(diagnosis)}</strong>
    ${similarityBar(score)}
    ${data.diagnosis_assessment ? `<p style="font-size:.88rem;color:var(--gray-600);margin-top:6px">${escapeHtml(data.diagnosis_assessment)}</p>` : ''}
    ${(data.matching_symptoms || []).length ? `<p style="font-size:.82rem;color:var(--gray-500);margin-top:6px">Matching symptoms: ${data.matching_symptoms.map(escapeHtml).join(', ')}</p>` : ''}
  </div>`;

  const alternatives = data.alternatives || [];
  if (alternatives.length) {
    html += `<div class="result-section-title">Alternative Diagnoses (${alternatives.length})</div>`;
    alternatives
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .forEach(alt => {
        html += `<div class="alt-card">
          <div class="alt-card-header">
            <span class="alt-card-name">${escapeHtml(alt.condition)}</span>
          </div>
          ${similarityBar(alt.similarity_score)}
          ${alt.explanation ? `<p class="alt-explanation">${escapeHtml(alt.explanation)}</p>` : ''}
          ${(alt.matching_symptoms || []).length
            ? `<p class="alt-symptoms" style="margin-top:6px">Matching: ${alt.matching_symptoms.map(escapeHtml).join(', ')}</p>`
            : ''}
        </div>`;
      });
  } else {
    html += `<div class="summary-card"><p>No alternative diagnoses found for these symptoms.</p></div>`;
  }

  container.innerHTML = html;
  container.classList.remove('hidden');
}

// ── Drug Search ───────────────────────────────────────────────────────────────
document.getElementById('search-btn').addEventListener('click', () => doSearch());
document.getElementById('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

async function doSearch() {
  const term = document.getElementById('search-input').value.trim();
  if (!term) { alert('Please enter a drug name to search.'); return; }

  setLoading(true, `Searching FDA database for "${term}"…`);
  const resultsEl = document.getElementById('search-results');
  resultsEl.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/search-drugs?term=${encodeURIComponent(term)}&limit=12`);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    renderSearchResults(data.results || [], term, resultsEl);
  } catch (err) {
    showError('search-results', err.message || 'Could not connect to the backend.');
  } finally {
    setLoading(false);
  }
}

function renderSearchResults(results, term, container) {
  if (!results.length) {
    container.innerHTML = `<div class="summary-card"><p>No drugs found matching "<strong>${escapeHtml(term)}</strong>". Try a different spelling.</p></div>`;
    container.classList.remove('hidden');
    return;
  }

  let html = `<div class="result-section-title">${results.length} result${results.length !== 1 ? 's' : ''} for "${escapeHtml(term)}"</div>`;

  results.forEach(drug => {
    html += `<div class="search-result-card" onclick="loadDrugDetail('${escapeHtml(drug.brand_name)}')">
      <div class="search-result-name">${escapeHtml(drug.brand_name || 'Unknown')}</div>
      <div class="search-result-meta">
        ${drug.generic_name ? `Generic: ${escapeHtml(drug.generic_name)} · ` : ''}
        ${drug.manufacturer ? `${escapeHtml(drug.manufacturer)} · ` : ''}
        ${drug.product_type ? escapeHtml(drug.product_type) : ''}
      </div>
    </div>`;
  });

  html += `<div id="drug-detail-area"></div>`;

  container.innerHTML = html;
  container.classList.remove('hidden');
}

window.loadDrugDetail = async function(name) {
  const area = document.getElementById('drug-detail-area');
  if (!area) return;
  area.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--gray-400)">Loading ${escapeHtml(name)}…</div>`;
  area.scrollIntoView({ behavior: 'smooth' });

  try {
    const res = await fetch(`${API_BASE}/api/drug-info/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`Drug not found (${res.status})`);
    const d = await res.json();

    let html = `<div class="card" style="margin-top:1rem">
      <h3 style="font-size:1.1rem;font-weight:800;color:var(--gray-900)">${escapeHtml(d.brand_name)}</h3>
      <p style="font-size:.82rem;color:var(--gray-400);margin-bottom:1rem">
        ${d.generic_name ? `Generic: ${escapeHtml(d.generic_name)} · ` : ''}
        ${d.manufacturer ? `${escapeHtml(d.manufacturer)} · ` : ''}
        ${d.route ? escapeHtml(d.route) : ''}
      </p>`;

    if (d.enhanced_info) {
      const ei = d.enhanced_info;
      if (ei.summary) html += `<div class="info-section"><div class="info-section-label">Summary</div><div class="info-section-text">${escapeHtml(ei.summary)}</div></div>`;
      if (ei.key_warnings_explanation) html += `<div class="info-section"><div class="info-section-label">Key Warnings (Plain Language)</div><div class="info-section-text">${escapeHtml(ei.key_warnings_explanation)}</div></div>`;
      if (ei.special_considerations) html += `<div class="info-section"><div class="info-section-label">Special Considerations</div><div class="info-section-text">${escapeHtml(ei.special_considerations)}</div></div>`;
    }

    const sections = [
      { label: 'Boxed Warnings',      data: d.boxed_warnings },
      { label: 'Warnings',            data: d.warnings },
      { label: 'Contraindications',   data: d.contraindications },
      { label: 'Adverse Reactions',   data: d.adverse_reactions },
      { label: 'Drug Interactions',   data: d.drug_interactions },
      { label: 'Indications & Usage', data: d.indications_and_usage },
      { label: 'Dosage',              data: d.dosage_and_administration },
    ];

    sections.forEach(s => {
      if (!s.data || !s.data.length) return;
      const text = s.data.slice(0, 2).map(t => String(t).slice(0, 600)).join(' ').trim();
      if (!text) return;
      html += `<div class="info-section"><div class="info-section-label">${s.label}</div><div class="info-section-text">${escapeHtml(text)}${text.length >= 600 ? '…' : ''}</div></div>`;
    });

    html += `</div>`;
    area.innerHTML = html;
  } catch (err) {
    area.innerHTML = `<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">${escapeHtml(err.message)}</p></div>`;
  }
};

// ── Navigation wiring ─────────────────────────────────────────────────────────
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => showPage(el.getAttribute('data-page')));
});

// Mobile hamburger
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
navLinks.id = 'nav-links-wrapper';
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

// Init
showPage('home');
