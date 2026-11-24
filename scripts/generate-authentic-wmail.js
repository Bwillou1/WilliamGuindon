const fs = require('fs');
const path = require('path');

const rawFile = '/Users/williamguindon/.gemini/antigravity/brain/fd968382-bf27-4d6d-b652-7559a28122df/.user_uploaded/media_1795563158087_84f2f96d.txt';
const rawText = fs.readFileSync(rawFile, 'utf8');

// Parse all 96 messages
const msgRegex = /MESSAGE\s+(\d+)[\s\S]*?(?=MESSAGE\s+\d+|$)/g;
let m;
const rawMessages = [];
while ((m = msgRegex.exec(rawText)) !== null) {
  const block = m[0];
  const num = parseInt(m[1], 10);
  const dateMatch = block.match(/Date\s*:\s*([^\n]+)/);
  const deMatch = block.match(/De\s*:\s*([^\n]+)/);
  const aMatch = block.match(/À\s*:\s*([^\n]+)/);
  const ccMatch = block.match(/Cc\s*:\s*([^\n]+)/);
  const objMatch = block.match(/Objet\s*:\s*([^\n]+)/);
  const filMatch = block.match(/Fil\s*:\s*([a-f0-9]+)/i);
  const idMatch = block.match(/ID\s*:\s*([a-f0-9]+)/i);
  const piecesMatch = block.match(/Pièces\s*:\s*([^\n]+)/i);
  const noteMatch = block.match(/Note\s*:\s*([^\n]+)/i);

  const sepIdx = block.indexOf('--------------------------------------------------------------------------------');
  let body = '';
  if (sepIdx !== -1) {
    body = block.substring(sepIdx + 80).trim();
  }

  rawMessages.push({
    num,
    date: dateMatch ? dateMatch[1].trim() : '',
    de: deMatch ? deMatch[1].trim() : '',
    a: aMatch ? aMatch[1].trim() : '',
    cc: ccMatch ? ccMatch[1].trim() : '',
    objet: objMatch ? objMatch[1].trim() : '(sans objet)',
    fil: filMatch ? filMatch[1].trim() : 'fil_' + num,
    id: idMatch ? idMatch[1].trim() : '',
    pieces: piecesMatch ? piecesMatch[1].trim() : '',
    note: noteMatch ? noteMatch[1].trim() : '',
    body
  });
}

console.log('Parsed total messages:', rawMessages.length);

// Fonction de caviardage
function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/guindonwilliam2@gmail\.com/gi, '<span class="cx" title="Caviardé : Courriel citoyen protégé">contact@williamguindon.me</span>')
    .replace(/guindonwilliam2\+cc@gmail\.com/gi, '<span class="cx" title="Caviardé">contact@williamguindon.me</span>')
    .replace(/williamguindon@icloud\.com/gi, '<span class="cx" title="Caviardé">contact@williamguindon.me</span>')
    .replace(/cathymainville@hotmail\.com/gi, '<span class="cx" title="Caviardé : Représentante légale">représentante légale biffée</span>')
    .replace(/\+1\s*\(?514\)?\s*808-3727/g, '<span class="cx" title="Caviardé : Téléphone personnel">[Téléphone personnel biffé]</span>')
    .replace(/514-808-3727/g, '<span class="cx" title="Caviardé">[Téléphone personnel biffé]</span>');
}

// Fonction pour déterminer la catégorie et le libellé
function categorizeThread(subject, msgs) {
  const combined = (subject + ' ' + msgs.map(x => x.body + ' ' + x.a + ' ' + x.de).join(' ')).toLowerCase();
  if (combined.includes('signalement pénal') || combined.includes('inrp') || combined.includes('infractions') || combined.includes('cnue-neec')) {
    return { cat: 'signalement', label: 'Application de la loi & Pêches', color: '#d93025' };
  }
  if (combined.includes('décret d\'urgence') || combined.includes('article 80') || combined.includes('lep')) {
    return { cat: 'lep', label: 'Espèces en péril (LEP)', color: '#9334e6' };
  }
  if (combined.includes('aiprp') || combined.includes('atip') || combined.includes('renseignements personnels') || combined.includes('p-2026') || combined.includes('praine')) {
    return { cat: 'aiprp', label: 'Accès à l\'information (AIPRP)', color: '#00897a' };
  }
  if (combined.includes('cce') || combined.includes('aceum') || combined.includes('ambassade') || combined.includes('sem-26-003')) {
    return { cat: 'cce', label: 'CCE / ACEUM & International', color: '#188038' };
  }
  if (combined.includes('stablex') || combined.includes('cellule 6')) {
    return { cat: 'stablex', label: 'Stablex & Cellule 6', color: '#e8710a' };
  }
  return { cat: 'eccc', label: 'ECCC & MPO — Ministères', color: '#0b57d0' };
}

// Nettoyer et résumer le corps des courriels si trop technique/répétitif
function formatMessageBody(msg) {
  let text = msg.body;
  const isAutoReply = msg.objet.toLowerCase().includes('automatic reply') || 
                      msg.objet.toLowerCase().includes('accusé de réception') || 
                      msg.de.toLowerCase().includes('postmaster') ||
                      text.includes('automatically generated message') ||
                      text.includes('Ce courriel est envoyé au nom de');

  if (msg.de.includes('postmaster@dfo-mpo.gc.ca')) {
    return `<div class="doc-summary">
      <p><b>⚠️ Avis de non-remise automatique (Système de messagerie MPO) :</b></p>
      <p>L'adresse de destination régionale du ministère n'a pas pu être trouvée ou refuse les courriels externes (code d'erreur 550 5.1.10). Ce constat technique documente les barrières d'accès aux services régionaux compétents.</p>
    </div>`;
  }

  if (isAutoReply && text.length > 500) {
    return `<div class="doc-summary">
      <p><b>📨 Accusé de réception officiel automatique :</b></p>
      <p>Confirmation formelle émise par le système ministériel (${sanitizeText(msg.de)}) attestant de la prise en charge de la correspondance citoyenne et de sa transmission aux équipes du cabinet et aux experts sectoriels.</p>
    </div>`;
  }

  // Caviarder le texte et formater les paragraphes
  text = sanitizeText(text)
    .replace(/={4,}/g, "")
    .replace(/\[TRONQUÉ[^\]]*\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<b>$1</b>");
  // Échapper ou formater proprement
  const paragraphs = text.split('\n\n').map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('*') && p.endsWith('*')) return `<p style="font-style:italic;">${p.slice(1, -1)}</p>`;
    if (p.startsWith('- ')) {
      const items = p.split('\n- ').map(it => `<li>${it.replace(/^- /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return paragraphs || `<p class="faded">(Corps de message vide ou transmis via pièce jointe)</p>`;
}

// Regroupement par Fil Gmail
const threadMap = new Map();

rawMessages.forEach(msg => {
  // Normalisation du fil : si un accusé suit immédiatement un envoi avec le même objet, on les regroupe dans le même fil
  let filKey = msg.fil;
  
  // Regroupements logiques des rebonds et accusés directs
  if (msg.num === 1 || msg.num === 2 || msg.num === 3 || msg.num === 4 || msg.num === 5 || msg.num === 6 || msg.num === 7) {
    filKey = 'thread_01_demande_enquete_lcom_peches';
  } else if (msg.num === 8 || msg.num === 9) {
    filKey = 'thread_02_signalement_enviroinfo';
  } else if (msg.num === 10 || msg.num === 11 || msg.num === 26 || msg.num === 27) {
    filKey = 'thread_03_clarification_stablex';
  } else if (msg.num >= 12 && msg.num <= 24) {
    filKey = 'thread_04_notification_aceum_24_27';
  } else if (msg.num === 25 || msg.num === 28) {
    filKey = 'thread_05_recherche_citoyenne_stablex';
  } else if (msg.num >= 29 && msg.num <= 34) {
    filKey = 'thread_06_dossier_pic_20260615_082854';
  } else if (msg.num === 35 || msg.num === 36) {
    filKey = 'thread_07_depot_soumission_14_ans';
  } else if (msg.num >= 37 && msg.num <= 44) {
    filKey = 'thread_08_cadets_valcartier_min_334658';
  } else if (msg.num === 45 || msg.num === 46 || msg.num === 50 || msg.num === 52 || msg.num === 53 || msg.num === 61) {
    filKey = 'thread_09_signalement_penal_peches_inrp';
  } else if (msg.num === 47 || msg.num === 48 || msg.num === 49 || msg.num === 54 || msg.num === 55) {
    filKey = 'thread_10_decret_urgence_lep_art_80';
  } else if (msg.num === 51) {
    filKey = 'thread_11_appel_experts_15_ans';
  } else if (msg.num === 57 || msg.num === 58 || msg.num === 59 || msg.num === 60 || msg.num === 62 || msg.num === 63) {
    filKey = 'thread_12_decision_cce_ambassades';
  } else if (msg.num === 64 || msg.num === 71 || msg.num === 72 || msg.num === 73 || msg.num === 74 || msg.num === 75 || msg.num === 80 || msg.num === 81 || msg.num === 82 || msg.num === 83 || msg.num === 84 || msg.num === 85 || msg.num === 86 || msg.num === 90) {
    filKey = 'thread_13_aiprp_praine_purolator';
  } else if (msg.num >= 65 && msg.num <= 67) {
    filKey = 'thread_14_enquete_partis_politiques';
  } else if (msg.num >= 68 && msg.num <= 70) {
    filKey = 'thread_15_imagerie_copernicus_cce';
  } else if (msg.num >= 76 && msg.num <= 79) {
    filKey = 'thread_16_reponse_canada_replique_72_rsp';
  } else if (msg.num >= 87 && msg.num <= 89) {
    filKey = 'thread_17_reponses_petition_0546_eccc_mpo';
  } else if (msg.num >= 91 && msg.num <= 93) {
    filKey = 'thread_18_suivi_conjoint_ministres_jeunesse';
  } else if (msg.num >= 94 && msg.num <= 96) {
    filKey = 'thread_19_avis_officiel_petition_blocage';
  }

  if (!threadMap.has(filKey)) {
    threadMap.set(filKey, []);
  }
  threadMap.get(filKey).push(msg);
});

console.log('Mapped to grouped threads:', threadMap.size);

// Préparation des objets threads pour le rendu
const threadList = [];
let tIdx = 1;
for (const [filId, msgs] of threadMap.entries()) {
  const first = msgs[0];
  const last = msgs[msgs.length - 1];
  const subject = first.objet.replace(/^(re:\s*|automatic reply:\s*|fwd:\s*)+/i, '').trim() || first.objet;
  const categoryInfo = categorizeThread(subject, msgs);

  // Déterminer les participants
  const senders = new Set();
  msgs.forEach(m => {
    if (m.de.includes('William')) senders.add('William Guindon');
    else if (m.de.includes('Julie Dabrusin') || m.de.includes('ministre-minister')) senders.add('Julie Dabrusin (ECCC)');
    else if (m.de.includes('DFO') || m.de.includes('Pêches')) senders.add('MPO');
    else if (m.de.includes('Lisa Praine') || m.de.includes('ecatip')) senders.add('AIPRP (Lisa Praine)');
    else if (m.de.includes('Stablex')) senders.add('Stablex Canada');
    else if (m.de.includes('postmaster')) senders.add('postmaster');
    else senders.add(m.de.split('<')[0].trim());
  });

  const participantStr = Array.from(senders).join(', ');
  const isKey = msgs.some(m => [2, 8, 12, 35, 45, 46, 47, 57, 59, 75, 86, 88, 89, 91, 94].includes(m.num));

  // Snippet
  const snippet = msgs.map(m => m.body).join(' ').replace(/\s+/g, ' ').substring(0, 160);

  threadList.push({
    tid: 't' + tIdx,
    filId,
    num: tIdx,
    subject,
    category: categoryInfo.cat,
    catLabel: categoryInfo.label,
    catColor: categoryInfo.color,
    date: last.date.split(' ')[0],
    messagesCount: msgs.length,
    participants: participantStr,
    snippet,
    isKey,
    msgs
  });
  tIdx++;
}

// Rendu HTML des rangées (.row comme dans age.html)
function renderRow(t) {
  return `
    <div class="row" data-tid="${t.tid}" data-cat="${t.category}" data-key="${t.isKey ? '1' : '0'}" role="button" tabindex="0">
      <div class="cb" title="Sélectionner"></div>
      <div class="st ${t.isKey ? 'on' : ''}" title="${t.isKey ? 'Élément clé du dossier' : 'Non étoilé'}">★</div>
      <div class="who" title="${t.participants}">${t.participants} ${t.messagesCount > 1 ? `<span class="count-tag">(${t.messagesCount})</span>` : ''}</div>
      <div class="subj"><span class="pill" style="background:${t.catColor}18;color:${t.catColor};border:1px solid ${t.catColor}40;">${t.catLabel}</span> ${t.subject}</div>
      <div class="snip"> — ${t.snippet}…</div>
      <div class="date">${t.date}</div>
    </div>
  `;
}

// Rendu HTML des vues détaillées (.threadview comme dans age.html)
function renderThreadView(t) {
  return `
    <section class="threadview" id="tv-${t.tid}">
      <div class="tv-top">
        <button class="back" title="Retour à la boîte de réception">
          <svg class="svg" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="tv-subj">
          <h2>${t.subject}</h2>
          <div class="tv-meta">
            <span class="lpill" style="background:${t.catColor}20;color:${t.catColor}">${t.catLabel}</span>
            <span class="nmsg">${t.messagesCount} message${t.messagesCount > 1 ? 's' : ''}</span>
            <button class="allopen">Tout déplier / replier</button>
          </div>
        </div>
      </div>
      ${t.msgs.map((m, idx) => {
        const isMe = m.de.includes('William');
        const isOrg = !isMe;
        const isOpen = t.msgs.length === 1 || idx === t.msgs.length - 1 || [2, 8, 12, 35, 45, 46, 47, 75, 86, 88, 89, 91, 94].includes(m.num);
        return `
          <article class="card ${isOpen ? 'open' : ''}">
            <div class="card-head">
              <div class="avwrap">
                <div class="cava ${isMe ? 'me' : 'org'}">${isMe ? 'WG' : (m.de.includes('MPO') ? 'MPO' : 'ECCC')}</div>
              </div>
              <div class="meta">
                <div class="l1">
                  <span class="fname">${sanitizeText(m.de)}</span>
                  ${m.note ? `<span class="role">(${m.note})</span>` : ''}
                </div>
                <div class="l2">
                  <span>à ${sanitizeText(m.a)}</span>
                  ${m.cc ? ` · <span class="faded">Cc : ${sanitizeText(m.cc)}</span>` : ''}
                </div>
              </div>
              <div class="cdate">${m.date}</div>
              <div class="cacts">
                <span class="msg-num-tag">Msg #${m.num}</span>
                <svg class="svg" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
              </div>
            </div>
            <div class="card-body">
              ${m.pieces ? `
                <div class="attach">
                  <div class="chip" title="Pièce jointe officielle au dossier">
                    <div class="thumb">📎</div>
                    <div class="cinfo">
                      <div class="fn">${m.pieces}</div>
                      <div class="sz">Pièce jointe versée au dossier de correspondance</div>
                    </div>
                  </div>
                </div>
              ` : ''}
              <div class="msg-text-content">
                ${formatMessageBody(m)}
              </div>
            </div>
          </article>
        `;
      }).join('\n')}
    </section>
  `;
}

const fullHtml = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<script>(function(){try{if(!window.history||!window.history.replaceState)return;var s=window.location.search,h=window.location.hash;if(!s&&(!h||h.indexOf('?')===-1))return;var u=new URL(window.location.href);var t=new Set(['fbclid','fbadid','gclid','gbraid','wbraid','_ga','_gl','igshid','twclid','ttclid','msclkid','mc_cid','mc_eid','yclid','dclid','ref_src','gad_source','gclsrc']);var isT=function(k){var l=(k||'').toLowerCase();return l.indexOf('utm_')===0||l.indexOf('fb_')===0||l.indexOf('_aem')===0||t.has(l);};var c=false;if(s){var r=[];u.searchParams.forEach(function(_,k){if(isT(k))r.push(k);});if(r.length){for(var i=0;i<r.length;i++)u.searchParams.delete(r[i]);c=true;}}if(h&&h.indexOf('?')!==-1){var p=u.hash.split('?'),b=p[0],hp=new URLSearchParams(p.slice(1).join('?')),hr=[];hp.forEach(function(_,k){if(isT(k))hr.push(k);});if(hr.length){for(var j=0;j<hr.length;j++)hp.delete(hr[j]);var q=hp.toString();u.hash=b+(q?'?'+q:'');c=true;}}if(c){var ns=u.searchParams.toString();window.history.replaceState(null,'',u.pathname+(ns?'?'+ns:'')+u.hash);}}catch(_){}})();</script>
<script src="assets/js/security-guard.js" defer></script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wmail — Registre des correspondances ministérielles (ECCC & MPO) · William Guindon</title>
<meta name="description" content="Archive interactive et caviardée des 96 correspondances échangées avec Environnement Canada (ECCC), Pêches et Océans Canada (MPO) et la CCE dans le cadre du dossier SEM-26-003.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="fr" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/wmail.html">
<meta property="og:type" content="website">
<meta property="og:title" content="Wmail — Registre des correspondances ministérielles (ECCC & MPO) · William Guindon">
<meta property="og:description" content="Archive publique et caviardée des correspondances, signalements pénaux et demandes d'accès à l'information (dossier SEM-26-003).">
<meta property="og:url" content="https://williamguindon.me/wmail.html">
<meta property="og:image" content="https://williamguindon.me/assets/img/og-image-1200x630.png?v=20261017">

<style>
:root{--canvas:#f6f8fc;--surface:#fff;--text:#1f1f1f;--muted:#5f6368;--blue:#0b57d0;--active:#d3e3fd;--search:#eaf1fb;--line:#e7e9ec;--hover:#edf0f3}
*{box-sizing:border-box}html,body{height:100%;margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--text);background:var(--canvas)}
button,input{font:inherit;color:inherit}button{border:0;background:none;cursor:pointer}
.app{height:100dvh;min-width:320px;overflow:hidden;display:flex;flex-direction:column}
.topbar{height:64px;display:flex;align-items:center;gap:16px;padding:0 16px;background:#fff;box-shadow:0 1px 2px rgba(60,64,67,.1);z-index:5;flex:none}
.brand-area{width:240px;display:flex;align-items:center;gap:12px;flex:none}
.circle-button{width:40px;height:40px;border-radius:50%;display:grid;place-items:center}.circle-button:hover{background:#e6e9ef}
.menu-button{width:48px;height:48px}
.brand{font-size:24px;font-weight:600;letter-spacing:-.6px;color:#3c4043}.brand b{color:#059669}
.brand-sub{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;margin-left:4px}
.search-wrap{height:48px;max-width:720px;flex:1;position:relative;margin:auto}
.search-wrap svg{position:absolute;left:17px;top:14px;color:#444746;width:20px;height:20px}
.search-wrap input{width:100%;height:100%;border:0;outline:0;border-radius:24px;background:var(--search);padding:0 50px;font-size:16px}
.search-wrap input:focus{background:#fff;box-shadow:0 1px 3px 1px rgba(60,64,67,.15)}
.search-clear{position:absolute;right:5px;top:4px}
.top-actions{display:flex;align-items:center;gap:4px}
.avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#059669;color:#fff;font-size:12px;font-weight:700;margin-left:4px;box-shadow:0 0 0 2px #fff}
.workspace{height:calc(100dvh - 64px);display:flex;min-height:0}
.sidebar{width:270px;flex:none;padding-top:13px;overflow:hidden auto;transition:width .2s}
.sidebar.collapsed{width:72px}
.sidebar nav{padding-right:13px}
.nav-item{height:36px;width:100%;border-radius:0 18px 18px 0;display:flex;align-items:center;font-size:13.5px;font-weight:500;color:#444746;cursor:pointer;padding-right:12px;}
.nav-item:hover{background:#e9ebef}.nav-item.active{background:var(--active);font-weight:700;color:#0b57d0}
.nav-icon{width:68px;flex:none;display:grid;place-items:center}
.nav-label{flex:1;text-align:left;white-space:nowrap;overflow:hidden}
.count{font-size:11.5px;padding-left:6px;font-weight:600;flex:none;}
.sidebar.collapsed .nav-label,.sidebar.collapsed .count,.sidebar.collapsed .labels{display:none}
.labels{margin:24px 16px 10px}
.labels-title{display:flex;align-items:center;justify-content:space-between;font-weight:700;margin-bottom:10px;font-size:12px;color:#5f6368;text-transform:uppercase;letter-spacing:.5px}
.label-row{height:32px;width:100%;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:16px;font-size:13px;color:#444746;cursor:pointer;}
.label-row:hover{background:#e9ebef}.label-row.active{background:var(--active);font-weight:700}
.tag{width:14px;height:10px;border-radius:2px 5px 5px 2px;flex:none}
.inbox{min-width:0;flex:1;margin-right:16px;border-radius:16px 16px 0 0;background:var(--surface);overflow:hidden;display:flex;flex-direction:column}
.toolbar{height:48px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 12px;color:#444746;border-bottom:1px solid #f1f3f4}
.toolbar-side{display:flex;align-items:center;gap:2px}
.small-count{font-size:12px;padding:0 10px;font-weight:500}
.tabs{height:56px;flex:none;border-bottom:1px solid #e0e0e0;display:flex}
.tab{position:relative;white-space:nowrap;min-width:115px;max-width:250px;flex:1;display:flex;align-items:center;gap:15px;padding:0 24px;color:#444746;font-size:14px;font-weight:500;cursor:pointer}
.tab:hover{background:#f4f4f4}.tab.active{color:var(--blue)}
.tab.active:after{content:"";position:absolute;height:3px;left:16px;right:16px;bottom:0;border-radius:3px 3px 0 0;background:var(--blue)}
.messages{min-height:0;flex:1;overflow:auto}
.svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

/* ---- liste façon Gmail (.row) ---- */
.row{display:flex;align-items:center;gap:8px;padding:0 14px;height:44px;cursor:pointer;font-size:14px;border-bottom:1px solid #f1f3f4}
.row:hover{background:#f8fafd;box-shadow:inset 1px 0 0 #dadce0,inset -1px 0 0 #dadce0}
.row.sel{background:#c2e7ff}
.row .cb{width:18px;height:18px;border:2px solid #5f6368;border-radius:2px;flex:none;margin:0 4px}
.row.sel .cb{background:#0b57d0;border-color:#0b57d0}
.row .st{color:#dadce0;font-size:17px;flex:none;width:22px;text-align:center}
.row .st.on{color:#f4b400;text-shadow:0 0 1px #f4b400}
.row .who{width:185px;flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:#1e293b}
.count-tag{font-size:11px;font-weight:600;color:#64748b;margin-left:4px}
.row .subj{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:120px;font-weight:600;color:#0f172a}
.row .snip{color:var(--muted);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1.4;min-width:60px}
.row .date{color:var(--muted);font-size:12.5px;flex:none;padding-left:12px;font-weight:500}
.pill{font-size:11px;border-radius:8px;padding:2px 8px;font-weight:700;vertical-align:1px;letter-spacing:.2px;margin-right:6px}

/* ---- vue fil détaillée ---- */
.threadview{display:none;padding:12px 24px 48px;max-width:1120px;margin:0 auto}
.tv-top{display:flex;gap:14px;align-items:flex-start;padding:8px 0 16px;border-bottom:1px solid #e7e9ec;margin-bottom:16px}
.back{width:40px;height:40px;border-radius:50%;flex:none;display:grid;place-items:center}
.back:hover{background:#e6e9ef}
.tv-subj h2{margin:2px 0 8px;font-size:22px;font-weight:600;color:#0f172a;line-height:1.35}
.tv-meta{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.nmsg{color:var(--muted);font-size:13px;font-weight:500}
.lpill{font-size:11.5px;border-radius:10px;padding:2px 10px;font-weight:700}
.allopen{font-size:12.5px;color:var(--blue);border:1px solid #dadce0;border-radius:16px;padding:3px 12px;font-weight:600}
.allopen:hover{background:#f8fafd}

.card{background:#fff;border:1px solid #e7e9ec;border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 1px 3px rgba(60,64,67,.08)}
.card-head{display:flex;gap:14px;padding:12px 18px;cursor:pointer;align-items:flex-start;background:#fafbfc}
.card-head:hover{background:#f1f5f9}
.cava{width:38px;height:38px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff}
.cava.me{background:#059669}
.cava.org{background:#0b57d0}
.card-head .meta{flex:1;min-width:0}
.card-head .l1{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.fname{font-size:14px;font-weight:700;color:#0f172a}
.role{font-size:12.5px;color:var(--muted)}
.l2{font-size:12.5px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-head .cdate{font-size:12.5px;color:var(--muted);flex:none;font-weight:500}
.card-head .cacts{display:flex;align-items:center;gap:8px;margin-left:10px}
.msg-num-tag{font-size:11px;background:#e2e8f0;padding:2px 7px;border-radius:6px;font-weight:700;color:#475569}
.card-body{display:none;padding:18px 24px;font-size:14.5px;line-height:1.65;color:#202124;border-top:1px solid #f1f5f9}
.card.open .card-body{display:block}
.doc-summary{background:#f8fafc;border-left:4px solid #0b57d0;padding:12px 18px;border-radius:0 8px 8px 0;font-size:13.5px;color:#334155}
.note{background:#ecfdf5;border-left:4px solid #059669;padding:12px 16px;border-radius:0 8px 8px 0;margin:14px 0;font-size:13px;color:#065f46}
.attach{margin:14px 0}
.chip{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:12.5px}
.cx{background:#000;color:#000;border-radius:2px;padding:0 4px;line-height:1.3;cursor:help;user-select:text}
.cx::selection{background:#0b57d0;color:#fff}
.faded{color:#64748b}

/* ---- recherche plein texte ---- */
.results{display:none;padding:16px 24px 40px;max-width:840px;margin:0 auto}
.res-head{font-size:13px;color:var(--muted);padding:6px 0 12px;border-bottom:1px solid #f1f3f4;margin-bottom:8px;font-weight:600}
.res{padding:12px;border-bottom:1px solid #f1f3f4;cursor:pointer;border-radius:6px}
.res:hover{background:#f8fafd}
.rtop{display:flex;justify-content:space-between;gap:10px}
.rwho{font-weight:700;font-size:14px;color:#0f172a}
.rdate{color:var(--muted);font-size:12px;flex:none}
.rsubj{color:#3c4043;font-size:13.5px;margin:2px 0;font-weight:600}
.rsnip{color:var(--muted);font-size:13px;line-height:1.5}
.rsnip mark{background:#fff475;color:#202124;border-radius:2px;padding:0 2px}

@media(max-width:768px){
  .sidebar{display:none}
  .inbox{margin-right:0;border-radius:0}
  .row .snip{display:none}
  .row .who{width:130px}
}
</style>
<!-- BRANDKIT:START -->
<link rel="icon" href="/favicon.ico?v=20261017" sizes="any">
<link rel="icon" href="/favicon.svg?v=20261017" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png?v=20261017" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=20261017">
<link rel="mask-icon" href="/assets/img/wg-monogram-mono.svg?v=20261017" color="#22c55e">
<link rel="manifest" href="/manifest.json?v=20261017">
<meta name="theme-color" content="#0b0f0c">
<!-- BRANDKIT:END -->
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand-area">
      <a href="./" class="circle-button" title="Retourner au portail principal" aria-label="Retour au site principal" style="text-decoration:none;display:grid;place-items:center;color:inherit;">
        <svg class="svg" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
      </a>
      <button class="circle-button menu-button" id="menu" aria-label="Menu de navigation">
        <svg class="svg" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <h1 class="brand" style="margin:0;display:inline-flex;align-items:baseline;">
        W<b>mail</b><span class="brand-sub">Ministères</span>
      </h1>
    </div>
    <div class="search-wrap">
      <svg class="svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <input id="search" placeholder="Rechercher dans les correspondances ministérielles (cadmium, déboisement, ECCC, MPO...)" aria-label="Recherche">
      <button class="circle-button search-clear" id="clear" aria-label="Effacer" hidden>
        <svg class="svg" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div class="top-actions">
      <a href="correspondance.html" class="circle-button" title="Politique relative aux communications & Déontologie" aria-label="Politique de correspondance" style="text-decoration:none;display:grid;place-items:center;color:inherit;">
        <svg class="svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </a>
      <div class="avatar" title="William Guindon (Auteur SEM-26-003)">WG</div>
    </div>
  </header>

  <div class="workspace">
    <aside class="sidebar" id="sidebar">
      <nav>
        <button class="nav-item active" data-nav="all">
          <span class="nav-icon"><svg class="svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg></span>
          <span class="nav-label">Boîte de réception</span>
          <span class="count">${threadList.length}</span>
        </button>
        <button class="nav-item" data-nav="starred">
          <span class="nav-icon"><svg class="svg" viewBox="0 0 24 24"><path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8z"/></svg></span>
          <span class="nav-label">Éléments clés</span>
          <span class="count">${threadList.filter(x => x.isKey).length}</span>
        </button>
        <button class="nav-item" data-nav="sent">
          <span class="nav-icon"><svg class="svg" viewBox="0 0 24 24"><path d="m3 3 18 9-18 9 4-9zM7 12h14"/></svg></span>
          <span class="nav-label">Envoyés</span>
          <span class="count">42</span>
        </button>
      </nav>

      <div class="labels">
        <div class="labels-title">
          <span>Catégories</span>
          <span>·</span>
        </div>
        <button class="label-row" data-lab="signalement">
          <i class="tag" style="background:#d93025"></i>
          <span class="nav-label">Application de la loi & Pêches</span>
          <span class="count">${threadList.filter(x => x.category === 'signalement').length}</span>
        </button>
        <button class="label-row" data-lab="eccc">
          <i class="tag" style="background:#0b57d0"></i>
          <span class="nav-label">ECCC & Ministères</span>
          <span class="count">${threadList.filter(x => x.category === 'eccc').length}</span>
        </button>
        <button class="label-row" data-lab="cce">
          <i class="tag" style="background:#188038"></i>
          <span class="nav-label">CCE / ACEUM & Traités</span>
          <span class="count">${threadList.filter(x => x.category === 'cce').length}</span>
        </button>
        <button class="label-row" data-lab="aiprp">
          <i class="tag" style="background:#00897a"></i>
          <span class="nav-label">AIPRP & Accès à l'information</span>
          <span class="count">${threadList.filter(x => x.category === 'aiprp').length}</span>
        </button>
        <button class="label-row" data-lab="lep">
          <i class="tag" style="background:#9334e6"></i>
          <span class="nav-label">Espèces en péril (LEP)</span>
          <span class="count">${threadList.filter(x => x.category === 'lep').length}</span>
        </button>
        <button class="label-row" data-lab="stablex">
          <i class="tag" style="background:#e8710a"></i>
          <span class="nav-label">Stablex & Cellule 6</span>
          <span class="count">${threadList.filter(x => x.category === 'stablex').length}</span>
        </button>
      </div>
    </aside>

    <section class="inbox">
      <div class="toolbar">
        <div class="toolbar-side">
          <span class="small-count" id="counter">${threadList.length} conversations · 96 correspondances</span>
        </div>
        <div class="toolbar-side">
          <button class="circle-button" id="refresh" aria-label="Actualiser" title="Actualiser la liste">
            <svg class="svg" viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M6.1 9a7 7 0 0 1 11.4-2L20 11M4 13l2.5 4a7 7 0 0 0 11.4-2"/></svg>
          </button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="all"><svg class="svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 13h4l2 3h4l2-3h4"/></svg><span>Tous</span></button>
        <button class="tab" data-tab="signalement"><svg class="svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Application de la loi</span></button>
        <button class="tab" data-tab="eccc"><svg class="svg" viewBox="0 0 24 24"><path d="m3 3 18 9-18 9 4-9zM7 12h14"/></svg><span>ECCC & Cabinets</span></button>
        <button class="tab" data-tab="cce"><svg class="svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>CCE & ACEUM</span></button>
        <button class="tab" data-tab="aiprp"><svg class="svg" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg><span>AIPRP & Clé USB</span></button>
      </div>

      <div class="messages" id="messagesArea">
        <div class="msglist" id="msglist">
          ${threadList.map(renderRow).join('\n')}
        </div>

        <div class="results" id="results"></div>

        <div id="threadViewsContainer">
          ${threadList.map(renderThreadView).join('\n')}
        </div>
      </div>
    </section>
  </div>
</div>

<script>
(function(){
  var msglist = document.getElementById('msglist');
  var results = document.getElementById('results');
  var search = document.getElementById('search');
  var clearB = document.getElementById('clear');
  var views = document.querySelectorAll('.threadview');
  var rows = document.querySelectorAll('.row');
  var tabs = document.querySelectorAll('.tab');
  var navItems = document.querySelectorAll('.nav-item');
  var labelRows = document.querySelectorAll('.label-row');
  var menuBtn = document.getElementById('menu');
  var sidebar = document.getElementById('sidebar');

  // Moteur d'indexation locale
  var idx = [];
  views.forEach(function(tv){
    var tid = tv.id.replace('tv-', '');
    var h2 = tv.querySelector('h2') ? tv.querySelector('h2').textContent : '';
    tv.querySelectorAll('.card').forEach(function(card){
      var fname = card.querySelector('.fname') ? card.querySelector('.fname').textContent : '';
      var bdy = card.querySelector('.card-body') ? card.querySelector('.card-body').textContent : '';
      var full = (h2 + ' ' + fname + ' ' + bdy).toLowerCase().replace(/\\s+/g, ' ');
      idx.push({ tid: tid, title: h2, who: fname, text: full, raw: bdy.trim(), card: card });
    });
  });

  function goList(pushHash){
    views.forEach(function(v){ v.style.display = 'none'; });
    results.style.display = 'none';
    msglist.style.display = 'block';
    if(pushHash && history.replaceState) history.replaceState(null, '', '#inbox');
  }

  function openThreadById(tid, pushHash){
    msglist.style.display = 'none';
    results.style.display = 'none';
    views.forEach(function(v){ v.style.display = 'none'; });
    var target = document.getElementById('tv-' + tid);
    if(target){
      target.style.display = 'block';
      document.getElementById('messagesArea').scrollTop = 0;
      if(pushHash && history.replaceState) history.replaceState(null, '', '#' + tid);
    }
  }

  // Clic sur une rangée de la liste
  msglist.addEventListener('click', function(e){
    var r = e.target.closest('.row');
    if(!r) return;
    if(e.target.classList.contains('cb')){
      r.classList.toggle('sel');
      return;
    }
    if(e.target.classList.contains('st')){
      r.querySelector('.st').classList.toggle('on');
      return;
    }
    var tid = r.getAttribute('data-tid');
    if(tid) openThreadById(tid, true);
  });

  // Bouton retour
  document.querySelectorAll('.tv-top .back').forEach(function(btn){
    btn.addEventListener('click', function(){ goList(true); });
  });

  // Déplier / replier cartes
  document.querySelectorAll('.card-head').forEach(function(head){
    head.addEventListener('click', function(){
      var card = head.closest('.card');
      if(card) card.classList.toggle('open');
    });
  });

  // Tout déplier / replier
  document.querySelectorAll('.allopen').forEach(function(btn){
    btn.addEventListener('click', function(){
      var tv = btn.closest('.threadview');
      if(!tv) return;
      var cards = tv.querySelectorAll('.card');
      var allOpen = Array.from(cards).every(function(c){ return c.classList.contains('open'); });
      cards.forEach(function(c){
        if(allOpen) c.classList.remove('open');
        else c.classList.add('open');
      });
      btn.textContent = allOpen ? 'Tout déplier' : 'Tout replier';
    });
  });

  // Recherche plein texte
  function doSearch(val){
    var q = val.trim().toLowerCase();
    clearB.hidden = !q;
    if(q.length < 2){
      results.style.display = 'none';
      msglist.style.display = 'block';
      return;
    }
    var hits = idx.filter(function(item){ return item.text.indexOf(q) !== -1; });
    msglist.style.display = 'none';
    views.forEach(function(v){ v.style.display = 'none'; });
    results.style.display = 'block';

    var html = '<div class="res-head"><b>' + hits.length + '</b> résultat(s) pour « ' + val + ' »</div>';
    if(!hits.length){
      html += '<div style="padding:30px 10px;text-align:center;color:#5f6368;">Aucun courriel ne correspond.</div>';
    } else {
      hits.slice(0, 40).forEach(function(hit){
        var pos = hit.raw.toLowerCase().indexOf(q);
        var s = Math.max(0, pos - 40);
        var e = Math.min(hit.raw.length, pos + q.length + 60);
        var snippet = hit.raw.substring(s, e).replace(new RegExp(q, 'gi'), function(m){ return '<mark>' + m + '</mark>'; });
        html += '<div class="res" data-tid="' + hit.tid + '">' +
          '<div class="rtop"><span class="rwho">' + hit.who + '</span></div>' +
          '<div class="rsubj">' + hit.title + '</div>' +
          '<div class="rsnip">… ' + snippet + ' …</div>' +
        '</div>';
      });
    }
    results.innerHTML = html;
  }

  search.addEventListener('input', function(){ doSearch(search.value); });
  clearB.addEventListener('click', function(){
    search.value = '';
    clearB.hidden = true;
    goList(true);
  });

  results.addEventListener('click', function(e){
    var r = e.target.closest('.res');
    if(!r) return;
    var tid = r.getAttribute('data-tid');
    if(tid) openThreadById(tid, true);
  });

  // Filtres latéraux
  navItems.forEach(function(nav){
    nav.addEventListener('click', function(){
      navItems.forEach(function(x){ x.classList.remove('active'); });
      nav.classList.add('active');
      var filter = nav.getAttribute('data-nav');
      goList(false);
      rows.forEach(function(row){
        if(filter === 'all') row.style.display = 'flex';
        else if(filter === 'starred') row.style.display = row.getAttribute('data-key') === '1' ? 'flex' : 'none';
        else if(filter === 'sent') row.style.display = row.querySelector('.who').textContent.indexOf('William') !== -1 ? 'flex' : 'none';
      });
    });
  });

  // Filtres par étiquette
  labelRows.forEach(function(l){
    l.addEventListener('click', function(){
      labelRows.forEach(function(x){ x.classList.remove('active'); });
      l.classList.add('active');
      var cat = l.getAttribute('data-lab');
      goList(false);
      rows.forEach(function(row){
        row.style.display = row.getAttribute('data-cat') === cat ? 'flex' : 'none';
      });
    });
  });

  // Onglets supérieurs
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(x){ x.classList.remove('active'); });
      tab.classList.add('active');
      var cat = tab.getAttribute('data-tab');
      goList(false);
      rows.forEach(function(row){
        if(cat === 'all') row.style.display = 'flex';
        else row.style.display = row.getAttribute('data-cat') === cat ? 'flex' : 'none';
      });
    });
  });

  // Menu repliable
  if(menuBtn){
    menuBtn.addEventListener('click', function(){
      sidebar.classList.toggle('collapsed');
    });
  }

  // Hash router
  function handleHash(){
    var hash = (window.location.hash || '').replace('#', '').trim();
    if(hash && hash.startsWith('t')){
      openThreadById(hash, false);
    } else {
      goList(false);
    }
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();
})();
</script>
<script defer src="https://cloud.umami.is/script.js" data-website-id="33fe2e14-a15b-46f7-9246-dc61b1ca20a9"></script>
</body>
</html>`;

fs.writeFileSync('/Users/williamguindon/WilliamGuindon/wmail.html', fullHtml, 'utf8');
console.log('✔ wmail.html réécrit avec succès dans le design authentique Gmail/Wmail !');
