(function () {
  'use strict';

  const HOST_ID = 'sem-retrospective-charts';
  const host = document.getElementById(HOST_ID);
  if (!host) return;

  const rawLang = (document.documentElement.getAttribute('lang') || 'fr').toLowerCase().slice(0, 2);
  const lang = (rawLang === 'en' || rawLang === 'es') ? rawLang : 'fr';

  const I18N = {
    fr: {
      eyebrow: 'Bilan historique CCE / ELI (1994–2021 · n = 102)',
      title: 'Pourquoi SEM-26-003 compte : 27 ans de données du processus SEM',
      subtitle: 'Analyse rétrospective indépendante préparée par l’Environmental Law Institute pour le Secrétariat de la CCE (novembre 2023).',
      kpis: [
        { val: '102', label: 'Communications déposées', sub: '53 Mexique · 35 Canada* · 16 É.-U.*' },
        { val: '26 %', label: 'Dossiers factuels publiés', sub: '26 / 102 au total (29 % au Canada)' },
        { val: '4 / 75', label: 'Closes « en instance »', sub: 'par le Secrétariat après réponse de l’État' },
        { val: '3 vs 15,3', label: 'Délai moyen (mois, 2019–21)', sub: 'Secrétariat (3 m.) vs Vote du Conseil (15,3 m.)' }
      ],
      c1Title: '1. Issue des communications par pays',
      c1Sub: 'Dossiers factuels publiés vs examens terminés avant publication',
      c1Legend: ['Dossier factuel public', 'Terminé avant dossier factuel', 'En traitement'],
      c1Rows: [
        { label: 'Mexique', vals: [14, 34, 5], total: 53 },
        { label: 'Canada*', vals: [10, 25, 0], total: 35 },
        { label: 'États-Unis*', vals: [2, 13, 1], total: 16 }
      ],
      c2Title: '2. Qui dépose vs qui obtient un dossier factuel',
      c2Sub: 'Les particuliers représentent 21 % des dépôts mais 15 % des dossiers factuels',
      c2Legend: ['Total communications', 'Dossiers factuels constitués'],
      c2Rows: [
        { label: 'ONG professionnelles', vals: [49, 15] },
        { label: 'Particulier(s)', vals: [22, 4] },
        { label: 'ONG + autres', vals: [15, 4] },
        { label: 'Groupes informels', vals: [10, 3] },
        { label: 'Sociétés privées', vals: [6, 0] }
      ],
      c3Title: '3. Délais réels : Secrétariat vs Conseil (en mois)',
      c3Sub: 'Le Secrétariat respecte 60 jours civils depuis 2020 ; le Conseil dépasse souvent 60 jours ouvrables',
      c3Legend: ['Décision Secrétariat (étape 5)', 'Vote du Conseil (étape 6)', 'Cible ~3 mois (60 j.)'],
      c3Periods: ['1995-00', '2001-06', '2007-12', '2013-18', '2019-21'],
      c3Sec: [13.12, 9.2, 14.86, 4.76, 3],
      c3Council: [7.54, 24.21, 7.42, 9.18, 15.3],
      c4Title: '4. Thèmes des communications par pays',
      c4Sub: 'Au Canada, les espèces/habitats (17), la pollution (10) et les substances dangereuses (5) dominent',
      c4Legend: ['Canada*', 'Mexique', 'États-Unis*'],
      c4Rows: [
        { label: 'Espèces & habitat', vals: [17, 6, 6] },
        { label: 'Pollution', vals: [10, 10, 8] },
        { label: 'Substances dangereuses', vals: [5, 17, 1] },
        { label: 'Droits procéduraux (EIE)', vals: [2, 16, 1] },
        { label: 'Aire protégée', vals: [1, 4, 0] }
      ],
      source: 'Source : CCE & Environmental Law Institute (nov. 2023), « Communications sur les questions d’application : quelles leçons retenir? », données 1994–2021 (n = 102). * Les 2 communications conjointes Canada + États-Unis sont incluses dans le total de chaque pays.'
    },
    en: {
      eyebrow: 'CEC / ELI Historical Record (1994–2021 · n = 102)',
      title: 'Why SEM-26-003 Matters: 27 Years of SEM Process Data',
      subtitle: 'Independent retrospective review prepared by the Environmental Law Institute for the CEC Secretariat (November 2023).',
      kpis: [
        { val: '102', label: 'Submissions filed', sub: '53 Mexico · 35 Canada* · 16 U.S.*' },
        { val: '26%', label: 'Factual records published', sub: '26 / 102 overall (29% for Canada)' },
        { val: '4 / 75', label: 'Closed for pending proceedings', sub: 'by the Secretariat after Party response' },
        { val: '3 vs 15.3', label: 'Avg. delay (months, 2019–21)', sub: 'Secretariat (3 mo.) vs Council vote (15.3 mo.)' }
      ],
      c1Title: '1. Submission Outcomes by Country',
      c1Sub: 'Published factual records vs terminated before publication',
      c1Legend: ['Factual record published', 'Terminated prior to record', 'In progress'],
      c1Rows: [
        { label: 'Mexico', vals: [14, 34, 5], total: 53 },
        { label: 'Canada*', vals: [10, 25, 0], total: 35 },
        { label: 'United States*', vals: [2, 13, 1], total: 16 }
      ],
      c2Title: '2. Filings vs Factual Records by Submitter Type',
      c2Sub: 'Individuals account for 21% of filings but only 15% of factual records',
      c2Legend: ['Total submissions', 'Factual records prepared'],
      c2Rows: [
        { label: 'Professional NGOs', vals: [49, 15] },
        { label: 'Individual(s)', vals: [22, 4] },
        { label: 'NGOs + others', vals: [15, 4] },
        { label: 'Informal groups', vals: [10, 3] },
        { label: 'For-profit entities', vals: [6, 0] }
      ],
      c3Title: '3. Actual Timelines: Secretariat vs Council (months)',
      c3Sub: 'Secretariat has met the 60-calendar-day limit since 2020; Council often exceeds 60 working days',
      c3Legend: ['Secretariat decision (Step 5)', 'Council vote (Step 6)', '~3 mo. target (60 days)'],
      c3Periods: ['1995-00', '2001-06', '2007-12', '2013-18', '2019-21'],
      c3Sec: [13.12, 9.2, 14.86, 4.76, 3],
      c3Council: [7.54, 24.21, 7.42, 9.18, 15.3],
      c4Title: '4. Submission Categories by Country',
      c4Sub: 'In Canada, species/habitat (17), pollution (10), and hazardous substances (5) lead filings',
      c4Legend: ['Canada*', 'Mexico', 'United States*'],
      c4Rows: [
        { label: 'Species & habitat', vals: [17, 6, 6] },
        { label: 'Pollution', vals: [10, 10, 8] },
        { label: 'Hazardous substances', vals: [5, 17, 1] },
        { label: 'EIA / Process rights', vals: [2, 16, 1] },
        { label: 'Protected areas', vals: [1, 4, 0] }
      ],
      source: 'Source: CEC & Environmental Law Institute (Nov. 2023), “Submissions on Enforcement Matters: What Have We Learned?”, 1994–2021 data (n = 102). * The 2 joint Canada–U.S. submissions are included in each country’s total.'
    },
    es: {
      eyebrow: 'Balance histórico CCA / ELI (1994–2021 · n = 102)',
      title: 'Por qué importa SEM-26-003: 27 años de datos del proceso SEM',
      subtitle: 'Evaluación retrospectiva independiente preparada por el Environmental Law Institute para el Secretariado de la CCA (noviembre de 2023).',
      kpis: [
        { val: '102', label: 'Peticiones presentadas', sub: '53 México · 35 Canadá* · 16 EE. UU.*' },
        { val: '26 %', label: 'Expedientes de hechos', sub: '26 / 102 en total (29 % en Canadá)' },
        { val: '4 / 75', label: 'Cerradas por procedimiento', sub: 'por el Secretariado tras respuesta de la Parte' },
        { val: '3 vs 15,3', label: 'Plazo medio (meses, 2019–21)', sub: 'Secretariado (3 m.) vs Voto del Consejo (15,3 m.)' }
      ],
      c1Title: '1. Resultado de las peticiones por país',
      c1Sub: 'Expedientes de hechos publicados frente a trámites concluidos antes',
      c1Legend: ['Expediente de hechos público', 'Concluida antes del expediente', 'En trámite'],
      c1Rows: [
        { label: 'México', vals: [14, 34, 5], total: 53 },
        { label: 'Canadá*', vals: [10, 25, 0], total: 35 },
        { label: 'EE. UU.*', vals: [2, 13, 1], total: 16 }
      ],
      c2Title: '2. Peticiones vs Expedientes de hechos por autor',
      c2Sub: 'Los particulares representan el 21 % de las peticiones pero solo el 15 % de los expedientes',
      c2Legend: ['Total de peticiones', 'Expedientes de hechos'],
      c2Rows: [
        { label: 'ONG profesionales', vals: [49, 15] },
        { label: 'Particular(es)', vals: [22, 4] },
        { label: 'ONG + otros', vals: [15, 4] },
        { label: 'Grupos informales', vals: [10, 3] },
        { label: 'Empresas privadas', vals: [6, 0] }
      ],
      c3Title: '3. Plazos reales: Secretariado vs Consejo (meses)',
      c3Sub: 'El Secretariado cumple los 60 días calendario desde 2020; el Consejo suele superar los 60 días hábiles',
      c3Legend: ['Decisión Secretariado (Paso 5)', 'Voto del Consejo (Paso 6)', 'Meta ~3 meses (60 d.)'],
      c3Periods: ['1995-00', '2001-06', '2007-12', '2013-18', '2019-21'],
      c3Sec: [13.12, 9.2, 14.86, 4.76, 3],
      c3Council: [7.54, 24.21, 7.42, 9.18, 15.3],
      c4Title: '4. Temas de las peticiones por país',
      c4Sub: 'En Canadá predominan especies/hábitat (17), contaminación (10) y sustancias peligrosas (5)',
      c4Legend: ['Canadá*', 'México', 'EE. UU.*'],
      c4Rows: [
        { label: 'Especies y hábitat', vals: [17, 6, 6] },
        { label: 'Contaminación', vals: [10, 10, 8] },
        { label: 'Sustancias peligrosas', vals: [5, 17, 1] },
        { label: 'Derechos de EIA / proceso', vals: [2, 16, 1] },
        { label: 'Área protegida', vals: [1, 4, 0] }
      ],
      source: 'Fuente: CCA y Environmental Law Institute (nov. 2023), datos 1994–2021 (n = 102). * Las 2 peticiones conjuntas Canadá + EE. UU. se incluyen en el total de cada país.'
    }
  };

  const t = I18N[lang];

  if (!document.getElementById('sem-charts-styles')) {
    const st = document.createElement('style');
    st.id = 'sem-charts-styles';
    st.textContent = `
      .sem-viz-wrap {
        margin: 28px 0;
        padding: 24px;
        border-radius: 16px;
        border: 1px solid var(--line, rgba(148,163,184,0.28));
        background: var(--bg-card, #ffffff);
        color: var(--text, #0f172a);
        box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
        position: relative;
      }
      [data-theme="dark"] .sem-viz-wrap {
        background: rgba(15, 23, 42, 0.72);
        border-color: rgba(148, 163, 184, 0.22);
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.35);
      }
      .sem-viz-eyebrow {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #059669;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.3);
        padding: 4px 10px;
        border-radius: 9999px;
        margin-bottom: 8px;
      }
      [data-theme="dark"] .sem-viz-eyebrow { color: #34d399; }
      .sem-viz-head h3 {
        margin: 0 0 6px;
        font-size: 1.32rem;
        line-height: 1.25;
        color: var(--text, #0f172a);
      }
      .sem-viz-head p {
        margin: 0 0 18px;
        font-size: 0.92rem;
        color: var(--text-muted, #475569);
      }
      .sem-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .sem-kpi-card {
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--line, rgba(148,163,184,0.25));
        background: rgba(16, 185, 129, 0.04);
      }
      [data-theme="dark"] .sem-kpi-card {
        background: rgba(16, 185, 129, 0.08);
      }
      .sem-kpi-val {
        font-size: 1.45rem;
        font-weight: 800;
        color: #059669;
        line-height: 1.1;
      }
      [data-theme="dark"] .sem-kpi-val { color: #34d399; }
      .sem-kpi-lbl {
        font-size: 0.84rem;
        font-weight: 700;
        margin-top: 4px;
        color: var(--text, #0f172a);
      }
      .sem-kpi-sub {
        font-size: 0.74rem;
        color: var(--text-muted, #64748b);
        margin-top: 2px;
      }
      .sem-charts-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .sem-chart-card {
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--line, rgba(148,163,184,0.25));
        background: var(--bg, rgba(248, 250, 252, 0.6));
        display: flex;
        flex-direction: column;
      }
      [data-theme="dark"] .sem-chart-card {
        background: rgba(2, 6, 23, 0.45);
      }
      .sem-chart-card h4 {
        margin: 0 0 3px;
        font-size: 0.98rem;
        font-weight: 800;
        color: var(--text, #0f172a);
      }
      .sem-chart-sub {
        margin: 0 0 10px;
        font-size: 0.78rem;
        color: var(--text-muted, #64748b);
      }
      .sem-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 10px;
        font-size: 0.75rem;
        color: var(--text-muted, #475569);
      }
      .sem-legend-item {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .sem-legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        display: inline-block;
        flex-shrink: 0;
      }
      .sem-chart-svg {
        width: 100%;
        height: auto;
        overflow: visible;
        font-family: inherit;
      }
      .sem-svg-hit {
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      .sem-svg-hit:hover, .sem-svg-hit:focus {
        opacity: 0.82;
        outline: none;
      }
      .sem-viz-source {
        margin: 16px 0 0;
        font-size: 0.75rem;
        line-height: 1.45;
        color: var(--text-muted, #64748b);
      }
      .sem-chart-tooltip {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        padding: 7px 11px;
        border-radius: 8px;
        background: #0f172a;
        color: #f8fafc;
        font-size: 0.78rem;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        border: 1px solid rgba(52, 211, 153, 0.45);
        display: none;
        max-width: 260px;
      }
      @media (max-width: 860px) {
        .sem-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .sem-charts-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 480px) {
        .sem-viz-wrap { padding: 16px; }
        .sem-kpi-grid { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(st);
  }

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) n.setAttribute(k, String(attrs[k]));
    }
    if (text !== undefined) n.textContent = text;
    return n;
  }

  let tooltip = document.querySelector('.sem-chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'sem-chart-tooltip';
    document.body.appendChild(tooltip);
  }

  function bindTip(node, msg) {
    node.classList.add('sem-svg-hit');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', msg);
    const show = (ev) => {
      tooltip.textContent = msg;
      tooltip.style.display = 'block';
      const x = (ev && ev.clientX) ? ev.clientX : (node.getBoundingClientRect().left + 12);
      const y = (ev && ev.clientY) ? ev.clientY : (node.getBoundingClientRect().top);
      tooltip.style.left = Math.min(window.innerWidth - 270, Math.max(8, x + 12)) + 'px';
      tooltip.style.top = Math.max(8, y - 34) + 'px';
    };
    const hide = () => { tooltip.style.display = 'none'; };
    node.addEventListener('mouseenter', show);
    node.addEventListener('mousemove', show);
    node.addEventListener('focus', () => show(null));
    node.addEventListener('mouseleave', hide);
    node.addEventListener('blur', hide);
  }

  function makeLegend(items, colors) {
    const div = document.createElement('div');
    div.className = 'sem-legend';
    items.forEach((lbl, i) => {
      const item = document.createElement('span');
      item.className = 'sem-legend-item';
      const dot = document.createElement('span');
      dot.className = 'sem-legend-dot';
      dot.style.background = colors[i];
      item.appendChild(dot);
      item.appendChild(document.createTextNode(lbl));
      div.appendChild(item);
    });
    return div;
  }

  function renderStackedBars(rows, colors, legendLabels) {
    const svg = el('svg', { viewBox: '0 0 460 155', class: 'sem-chart-svg', role: 'img' });
    const labelW = 92;
    const maxVal = Math.max(...rows.map(r => r.total));
    const barW = 315;
    rows.forEach((r, idx) => {
      const y = 14 + idx * 46;
      svg.appendChild(el('text', { x: 0, y: y + 17, fill: 'currentColor', 'font-size': '12.5', 'font-weight': '700' }, r.label));
      let xOff = labelW;
      r.vals.forEach((v, j) => {
        if (!v) return;
        const w = (v / maxVal) * barW;
        const rect = el('rect', { x: xOff, y: y, width: Math.max(w, 4), height: 24, rx: j === 0 ? 4 : 0, fill: colors[j] });
        const pct = Math.round((v / r.total) * 100);
        bindTip(rect, `${r.label} · ${legendLabels[j]} : ${v} / ${r.total} (${pct}%)`);
        svg.appendChild(rect);
        if (w >= 20) {
          svg.appendChild(el('text', {
            x: xOff + w / 2, y: y + 16, fill: '#ffffff', 'font-size': '11', 'font-weight': '800', 'text-anchor': 'middle', 'pointer-events': 'none'
          }, String(v)));
        }
        xOff += w;
      });
      svg.appendChild(el('text', { x: xOff + 8, y: y + 16, fill: 'currentColor', 'font-size': '11.5', 'font-weight': '700', opacity: '0.75' }, String(r.total)));
    });
    return svg;
  }

  function renderGroupedBars(rows, colors, legendLabels, maxOverride) {
    const nSeries = rows[0].vals.length;
    const rowH = nSeries === 2 ? 38 : 44;
    const h = 14 + rows.length * rowH;
    const svg = el('svg', { viewBox: `0 0 460 ${h}`, class: 'sem-chart-svg', role: 'img' });
    const labelW = 145;
    const maxVal = maxOverride || Math.max(...rows.flatMap(r => r.vals));
    const barMaxW = 275;
    const barThick = nSeries === 2 ? 12 : 10;

    rows.forEach((r, idx) => {
      const y0 = 10 + idx * rowH;
      svg.appendChild(el('text', {
        x: 0, y: y0 + (nSeries * barThick) / 2 + 4, fill: 'currentColor', 'font-size': '11.8', 'font-weight': '700'
      }, r.label));
      r.vals.forEach((v, j) => {
        const y = y0 + j * (barThick + 3);
        const w = v > 0 ? Math.max((v / maxVal) * barMaxW, 4) : 2;
        const rect = el('rect', { x: labelW, y: y, width: w, height: barThick, rx: 3, fill: colors[j], opacity: v > 0 ? '1' : '0.25' });
        bindTip(rect, `${r.label} · ${legendLabels[j]} : ${v}`);
        svg.appendChild(rect);
        svg.appendChild(el('text', {
          x: labelW + w + 6, y: y + barThick - 1, fill: 'currentColor', 'font-size': '10.5', 'font-weight': '700', opacity: '0.8'
        }, String(v)));
      });
    });
    return svg;
  }

  function renderTimelineChart(periods, secVals, councilVals, legendLabels) {
    const svg = el('svg', { viewBox: '0 0 460 195', class: 'sem-chart-svg', role: 'img' });
    const padL = 38;
    const padR = 20;
    const padT = 16;
    const padB = 30;
    const w = 460 - padL - padR;
    const h = 195 - padT - padB;
    const maxY = 26;

    [0, 6, 12, 18, 24].forEach((tick) => {
      const y = padT + h - (tick / maxY) * h;
      svg.appendChild(el('line', { x1: padL, y1: y, x2: padL + w, y2: y, stroke: 'currentColor', opacity: '0.14', 'stroke-width': '1' }));
      svg.appendChild(el('text', { x: padL - 7, y: y + 4, fill: 'currentColor', opacity: '0.65', 'font-size': '10.5', 'text-anchor': 'end' }, String(tick)));
    });

    // Ligne cible 3 mois (~60 jours ouvrables)
    const targetY = padT + h - (3 / maxY) * h;
    svg.appendChild(el('line', {
      x1: padL, y1: targetY, x2: padL + w, y2: targetY,
      stroke: '#f59e0b', 'stroke-dasharray': '5 4', 'stroke-width': '1.6', opacity: '0.85'
    }));

    const pts = (arr) => arr.map((v, i) => ({
      x: padL + (i / (periods.length - 1)) * w,
      y: padT + h - (v / maxY) * h,
      v,
      p: periods[i]
    }));

    const secPts = pts(secVals);
    const couPts = pts(councilVals);

    const pathD = (arr) => arr.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    svg.appendChild(el('path', { d: pathD(couPts), fill: 'none', stroke: '#ef4444', 'stroke-width': '2.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    svg.appendChild(el('path', { d: pathD(secPts), fill: 'none', stroke: '#10b981', 'stroke-width': '2.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

    periods.forEach((p, i) => {
      const x = padL + (i / (periods.length - 1)) * w;
      svg.appendChild(el('text', { x: x, y: padT + h + 20, fill: 'currentColor', opacity: '0.78', 'font-size': '11', 'font-weight': '700', 'text-anchor': 'middle' }, p));
    });

    const unit = lang === 'en' ? 'mo.' : (lang === 'es' ? 'meses' : 'mois');
    secPts.forEach((pt) => {
      const c = el('circle', { cx: pt.x, cy: pt.y, r: 5, fill: '#10b981', stroke: '#ffffff', 'stroke-width': '1.8' });
      bindTip(c, `${pt.p} · ${legendLabels[0]} : ${pt.v} ${unit}`);
      svg.appendChild(c);
    });
    couPts.forEach((pt) => {
      const c = el('circle', { cx: pt.x, cy: pt.y, r: 5, fill: '#ef4444', stroke: '#ffffff', 'stroke-width': '1.8' });
      bindTip(c, `${pt.p} · ${legendLabels[1]} : ${pt.v} ${unit}`);
      svg.appendChild(c);
    });

    return svg;
  }

  const wrap = document.createElement('section');
  wrap.className = 'sem-viz-wrap';
  wrap.setAttribute('aria-label', t.title);

  const head = document.createElement('div');
  head.className = 'sem-viz-head';
  head.innerHTML = `<span class="sem-viz-eyebrow">${t.eyebrow}</span><h3>${t.title}</h3><p>${t.subtitle}</p>`;
  wrap.appendChild(head);

  const kpiGrid = document.createElement('div');
  kpiGrid.className = 'sem-kpi-grid';
  t.kpis.forEach((k) => {
    const card = document.createElement('div');
    card.className = 'sem-kpi-card';
    card.innerHTML = `<div class="sem-kpi-val">${k.val}</div><div class="sem-kpi-lbl">${k.label}</div><div class="sem-kpi-sub">${k.sub}</div>`;
    kpiGrid.appendChild(card);
  });
  wrap.appendChild(kpiGrid);

  const grid = document.createElement('div');
  grid.className = 'sem-charts-grid';

  function makeCard(title, sub, legendEl, svgEl) {
    const card = document.createElement('div');
    card.className = 'sem-chart-card';
    const h4 = document.createElement('h4');
    h4.textContent = title;
    const p = document.createElement('p');
    p.className = 'sem-chart-sub';
    p.textContent = sub;
    card.appendChild(h4);
    card.appendChild(p);
    card.appendChild(legendEl);
    card.appendChild(svgEl);
    return card;
  }

  const c1Colors = ['#10b981', '#64748b', '#3b82f6'];
  grid.appendChild(makeCard(t.c1Title, t.c1Sub, makeLegend(t.c1Legend, c1Colors), renderStackedBars(t.c1Rows, c1Colors, t.c1Legend)));

  const c2Colors = ['#3b82f6', '#10b981'];
  grid.appendChild(makeCard(t.c2Title, t.c2Sub, makeLegend(t.c2Legend, c2Colors), renderGroupedBars(t.c2Rows, c2Colors, t.c2Legend, 52)));

  const c3Colors = ['#10b981', '#ef4444', '#f59e0b'];
  grid.appendChild(makeCard(t.c3Title, t.c3Sub, makeLegend(t.c3Legend, c3Colors), renderTimelineChart(t.c3Periods, t.c3Sec, t.c3Council, t.c3Legend)));

  const c4Colors = ['#10b981', '#f59e0b', '#3b82f6'];
  grid.appendChild(makeCard(t.c4Title, t.c4Sub, makeLegend(t.c4Legend, c4Colors), renderGroupedBars(t.c4Rows, c4Colors, t.c4Legend, 18)));

  wrap.appendChild(grid);

  const src = document.createElement('p');
  src.className = 'sem-viz-source';
  src.textContent = t.source;
  wrap.appendChild(src);

  host.appendChild(wrap);
})();
