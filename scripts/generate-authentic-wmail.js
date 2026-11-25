const fs = require('fs');
const path = require('path');

const rawFile = '/Users/williamguindon/.gemini/antigravity/brain/fd968382-bf27-4d6d-b652-7559a28122df/.user_uploaded/media_1795563158087_84f2f96d.txt';
let rawText = fs.readFileSync(rawFile, 'utf8');

// Scrub journalist names, Marianne Depelteau and transmission cross-references from the entire text source
rawText = rawText
  .replace(/\[Message transcrit intégralement dans Correspondance_Marianne_Depelteau\.txt[^\]]*\]/gi, 
    "[Signalement formel et données d'échantillonnage versés au dossier probatoire citoyen — ID 19fd955011fe288c. Station d'échantillonnage FS-STB-2 (aval cellule n° 6), lacs Fauvel ; cadmium à 4,7× le critère CVAC ; chaîne de possession légale.]")
  .replace(/aussi transcrit intégralement dans l'archive Marianne[^)]*\)/gi,
    "dossier citoyen archivé et documenté")
  .replace(/signalement original complet dans l'archive Marianne[^\]]*\]/gi,
    "signalement officiel complet consigné au registre public]")
  .replace(/marianne\s+d[eé]pelteau[^\s,.<>)]*/gi, "[Nom protégé]")
  .replace(/d[eé]pelteau/gi, "[Protégé]")
  .replace(/marianne/gi, "[Protégé]")
  .replace(/Correspondance_Marianne_Depelteau\.txt/gi, "[Registre de correspondances]")
  .replace(/archive Marianne/gi, "[Dossier probatoire]");

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

// Fonction de caviardage stricte (données personnelles + exclusion journalistes / transmissions)
function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/guindonwilliam2@gmail\.com/gi, '<span class="cx" title="Caviardé : Courriel citoyen protégé">contact@williamguindon.me</span>')
    .replace(/guindonwilliam2\+cc@gmail\.com/gi, '<span class="cx" title="Caviardé">contact@williamguindon.me</span>')
    .replace(/williamguindon@icloud\.com/gi, '<span class="cx" title="Caviardé">contact@williamguindon.me</span>')
    .replace(/cathymainville@hotmail\.com/gi, '<span class="cx" title="Caviardé : Représentante légale">représentante légale biffée</span>')
    .replace(/\+1\s*\(?514\)?\s*808-3727/g, '<span class="cx" title="Caviardé : Téléphone personnel">[Téléphone personnel biffé]</span>')
    .replace(/514-808-3727/g, '<span class="cx" title="Caviardé">[Téléphone personnel biffé]</span>')
    .replace(/marianne\s+d[eé]pelteau[^\s,.<>)]*/gi, '<span class="cx" title="Caviardé : Donnée protégée">[Nom biffé]</span>')
    .replace(/d[eé]pelteau/gi, '<span class="cx" title="Caviardé">[Biffé]</span>')
    .replace(/marianne/gi, '<span class="cx" title="Caviardé">[Biffé]</span>')
    .replace(/journaliste[s]?/gi, 'correspondant civil')
    .replace(/Correspondance_Marianne_Depelteau\.txt/gi, '[Registre de correspondances]')
    .replace(/archive Marianne/gi, '[Dossier probatoire]');
}

// Formatage de dates lisibles en français (ex. "3 juin", "14 juin")
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split(' ')[0].split('-');
  if (parts.length === 3) {
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    return `${d} ${months[m] || ''}`;
  }
  return dateStr;
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
  let filKey = msg.fil;
  
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

  // Snippet assaini
  let snippet = msgs.map(m => m.body).join(' ')
    .replace(/\[Message transcrit intégralement[^\]]*\]/gi, "Signalement et relevés d'échantillonnage FS-STB-2")
    .replace(/Marianne\s*Depelteau/gi, "")
    .replace(/Depelteau/gi, "")
    .replace(/Marianne/gi, "")
    .replace(/journaliste/gi, "correspondant")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 160);

  threadList.push({
    tid: 't' + tIdx,
    filId,
    num: tIdx,
    subject: sanitizeText(subject),
    category: categoryInfo.cat,
    catLabel: categoryInfo.label,
    catColor: categoryInfo.color,
    rawDate: last.date.split(' ')[0],
    shortDate: formatShortDate(last.date.split(' ')[0]),
    messagesCount: msgs.length,
    participants: sanitizeText(participantStr),
    snippet: sanitizeText(snippet),
    isKey,
    msgs
  });
  tIdx++;
}

// Rendu HTML des rangées (.row façon Gmail moderne)
function renderRow(t) {
  return `
    <div class="row" data-tid="${t.tid}" data-cat="${t.category}" data-key="${t.isKey ? '1' : '0'}" role="button" tabindex="0">
      <div class="cb" title="Sélectionner" aria-label="Sélectionner la conversation"></div>
      <div class="st ${t.isKey ? 'on' : ''}" title="${t.isKey ? 'Élément clé du dossier' : 'Ajouter une étoile'}">★</div>
      <div class="who" title="${t.participants}">
        <span class="who-name">${t.participants}</span>
        ${t.messagesCount > 1 ? `<span class="count-tag">(${t.messagesCount})</span>` : ''}
      </div>
      <div class="subj-wrap">
        <span class="pill" style="background:${t.catColor}15;color:${t.catColor};border:1px solid ${t.catColor}35;">${t.catLabel}</span>
        <span class="subj-text" title="${t.subject}">${t.subject}</span>
        <span class="snip"> — ${t.snippet}…</span>
      </div>
      <div class="date">${t.shortDate}</div>
    </div>
  `;
}

// Rendu HTML des vues détaillées (.threadview)
function renderThreadView(t) {
  return `
    <div class="threadview" id="tv-${t.tid}">
      <!-- Barre d'actions supérieure façon Gmail -->
      <div class="tv-action-bar">
        <button class="back-btn" title="Revenir à la boîte de réception" aria-label="Retour à la liste">
          <svg class="svg" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
          <span>Retour à la boîte de réception</span>
        </button>
        <div class="tv-action-right">
          <span class="lpill" style="background:${t.catColor}18;color:${t.catColor};border:1px solid ${t.catColor}40;">${t.catLabel}</span>
          <span class="nmsg">${t.messagesCount} message${t.messagesCount > 1 ? 's' : ''}</span>
          <button class="allopen">Tout déplier / replier</button>
        </div>
      </div>

      <!-- En-tête du fil -->
      <div class="tv-header">
        <h2>${t.subject}</h2>
      </div>

      <!-- Liste des messages du fil -->
      <div class="tv-cards-stack">
        ${t.msgs.map((m, idx) => {
          const isMe = m.de.includes('William');
          const isOpen = t.msgs.length === 1 || idx === t.msgs.length - 1 || [2, 8, 12, 35, 45, 46, 47, 75, 86, 88, 89, 91, 94].includes(m.num);
          let avatarInitial = 'WG';
          let avatarClass = 'me';
          if (!isMe) {
            if (m.de.includes('MPO') || m.de.includes('Pêches')) { avatarInitial = 'MPO'; avatarClass = 'mpo'; }
            else if (m.de.includes('AIPRP') || m.de.includes('Lisa Praine')) { avatarInitial = 'ATIP'; avatarClass = 'atip'; }
            else if (m.de.includes('CCE') || m.de.includes('Secretariat')) { avatarInitial = 'CCE'; avatarClass = 'cce'; }
            else { avatarInitial = 'ECCC'; avatarClass = 'eccc'; }
          }

          return `
            <article class="card ${isOpen ? 'open' : ''}">
              <div class="card-head">
                <div class="avwrap">
                  <div class="cava ${avatarClass}">${avatarInitial}</div>
                </div>
                <div class="meta">
                  <div class="l1">
                    <span class="fname">${sanitizeText(m.de)}</span>
                    ${m.note ? `<span class="role">(${sanitizeText(m.note)})</span>` : ''}
                  </div>
                  <div class="l2">
                    <span>à ${sanitizeText(m.a)}</span>
                    ${m.cc ? ` · <span class="faded">Cc : ${sanitizeText(m.cc)}</span>` : ''}
                  </div>
                </div>
                <div class="cdate">${m.date}</div>
                <div class="cacts">
                  <span class="msg-num-tag">Msg #${m.num}</span>
                  <span class="card-chevron">▾</span>
                </div>
              </div>
              <div class="card-body">
                ${m.pieces ? `
                  <div class="attach">
                    <div class="chip" title="Pièce jointe officielle au dossier">
                      <span class="chip-icon">📎</span>
                      <div class="cinfo">
                        <div class="fn">${m.pieces}</div>
                        <div class="sz">Pièce probatoire versée au dossier de correspondances</div>
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
      </div>
    </div>
  `;
}

const fullHtml = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<script>(function(){try{if(!window.history||!window.history.replaceState)return;var s=window.location.search,h=window.location.hash;if(!s&&(!h||h.indexOf('?')===-1))return;var u=new URL(window.location.href);var t=new Set(['fbclid','fbadid','gclid','gbraid','wbraid','_ga','_gl','igshid','twclid','ttclid','msclkid','mc_cid','mc_eid','yclid','dclid','ref_src','gad_source','gclsrc']);var isT=function(k){var l=(k||'').toLowerCase();return l.indexOf('utm_')===0||l.indexOf('fb_')===0||l.indexOf('_aem')===0||t.has(l);};var c=false;if(s){var r=[];u.searchParams.forEach(function(_,k){if(isT(k))r.push(k);});if(r.length){for(var i=0;i<r.length;i++)u.searchParams.delete(r[i]);c=true;}}if(h&&h.indexOf('?')!==-1){var p=u.hash.split('?'),b=p[0],hp=new URLSearchParams(p.slice(1).join('?')),hr=[];hp.forEach(function(_,k){if(isT(k))hr.push(k);});if(hr.length){for(var j=0;j<hr.length;j++)hp.delete(hr[j]);var q=hp.toString();u.hash=b+(q?'?'+q:'');c=true;}}if(c){var ns=u.searchParams.toString();window.history.replaceState(null,'',u.pathname+(ns?'?'+ns:'')+u.hash);}}catch(_){}})();</script>
<script src="assets/js/security-guard.js" defer></script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wmail — Registre des correspondances &amp; démarches citoyennes · William Guindon</title>
<meta name="description" content="Registre officiel interactif et caviardé des correspondances citoyennes, signalements et requêtes formelles (ECCC, MPO, CCE, AIPRP) dans le cadre du dossier SEM-26-003.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="fr" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/wmail.html">
<meta property="og:type" content="website">
<meta property="og:title" content="Wmail — Registre des correspondances &amp; démarches citoyennes · William Guindon">
<meta property="og:description" content="Registre public et caviardé des correspondances, signalements pénaux et demandes d'accès à l'information (dossier SEM-26-003).">
<meta property="og:url" content="https://williamguindon.me/wmail.html">
<meta property="og:image" content="https://williamguindon.me/assets/media/william-guindon.jpg">

<!-- Intégration du bandeau navbar officiel et des styles de base du site -->
<link rel="stylesheet" href="style.css?v=20261018-v87">
<script src="assets/js/navbar-loader.js" defer></script>

<style>
:root {
  --wmail-canvas: #f6f8fc;
  --wmail-surface: #ffffff;
  --wmail-text: #1f1f1f;
  --wmail-muted: #5f6368;
  --wmail-blue: #0b57d0;
  --wmail-active: #d3e3fd;
  --wmail-search: #eaf1fb;
  --wmail-line: #e2e8f0;
  --wmail-hover: #f1f5f9;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--wmail-canvas);
  color: var(--wmail-text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Application Wmail Container */
.wmail-shell {
  max-width: 1480px;
  width: calc(100% - 24px);
  margin: 14px auto 32px;
  background: var(--wmail-surface);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid var(--wmail-line);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 680px;
  overflow: hidden;
}

/* Wmail Topbar */
.wmail-topbar {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 1px solid #edf2f7;
  flex: none;
  z-index: 10;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 260px;
  flex: none;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #475569;
  transition: background 0.15s ease;
}
.icon-btn:hover { background: #f1f5f9; color: #0f172a; }

.wmail-brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #0f172a;
}
.wmail-logo-mark {
  width: 32px;
  height: 32px;
  background: #059669;
  color: #ffffff;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 16px;
  letter-spacing: -0.5px;
}
.wmail-brand-title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #1e293b;
}
.wmail-brand-title b { color: #059669; }

.search-wrap {
  height: 44px;
  max-width: 680px;
  flex: 1;
  position: relative;
  margin: 0 auto;
}
.search-wrap svg.svg {
  position: absolute;
  left: 16px;
  top: 13px;
  color: #64748b;
  width: 18px;
  height: 18px;
  pointer-events: none;
  fill: none;
  stroke: currentColor;
}
.search-wrap input {
  width: 100%;
  height: 100%;
  border: 1px solid transparent;
  outline: none;
  border-radius: 24px;
  background: var(--wmail-search);
  padding: 0 46px 0 48px;
  font-size: 14.5px;
  color: #0f172a;
  transition: all 0.2s ease;
}
.search-wrap input:focus {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
}
.search-clear {
  position: absolute;
  right: 6px;
  top: 3px;
}

.wmail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.wmail-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #059669;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 0 0 2px #ecfdf5;
}

/* Wmail Workspace */
.wmail-workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  background: #ffffff;
}

/* Sidebar */
.wmail-sidebar {
  width: 280px;
  flex: none;
  padding: 14px 10px 14px 14px;
  background: #f8fafc;
  border-right: 1px solid var(--wmail-line);
  overflow-y: auto;
  transition: width 0.2s ease;
  display: flex;
  flex-direction: column;
}
.wmail-sidebar.collapsed { width: 68px; }

.nav-item {
  height: 38px;
  width: 100%;
  border-radius: 20px;
  display: flex;
  align-items: center;
  font-size: 13.5px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0 14px 0 8px;
  margin-bottom: 2px;
  transition: background 0.15s ease;
}
.nav-item:hover { background: #e2e8f0; color: #0f172a; }
.nav-item.active { background: #dbeafe; color: #1d4ed8; font-weight: 700; }
.nav-icon { width: 36px; display: grid; place-items: center; flex: none; }
.nav-label { flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-count { font-size: 11.5px; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: rgba(0,0,0,0.06); }
.nav-item.active .nav-count { background: #bfdbfe; color: #1e40af; }

.sidebar-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 14px 6px;
}

.labels-header {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  padding: 6px 12px;
}
.label-row {
  height: 34px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 17px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  border: none;
  background: transparent;
  margin-bottom: 2px;
}
.label-row:hover { background: #e2e8f0; }
.label-row.active { background: #e0f2fe; color: #0369a1; font-weight: 700; }
.label-tag { width: 10px; height: 10px; border-radius: 50%; flex: none; }

.sidebar-disclaimer {
  margin-top: auto;
  padding: 12px;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.45;
  border: 1px solid #e2e8f0;
}
.wmail-sidebar.collapsed .nav-label,
.wmail-sidebar.collapsed .nav-count,
.wmail-sidebar.collapsed .labels-header,
.wmail-sidebar.collapsed .sidebar-disclaimer { display: none; }

/* Inbox Main */
.wmail-shell section, .wmail-main, .threadview { padding: 0; border: none; }
.wmail-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #ffffff;
}

/* Tabs Bar combinée avec compteur */
.wmail-tabs-bar {
  height: 52px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  background: #fafbfc;
  padding: 0 12px 0 0;
}
.wmail-tabs-group {
  display: flex;
  height: 100%;
  overflow-x: auto;
}
.wmail-tab {
  position: relative;
  min-width: 95px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  font-weight: 600;
  color: #64748b;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.wmail-tab:hover { background: #f1f5f9; color: #0f172a; }
.wmail-tab.active { color: #0b57d0; background: #ffffff; }
.wmail-tab.active::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 3px;
  background: #0b57d0;
  border-radius: 3px 3px 0 0;
}

.wmail-counter-meta {
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 12.5px;
  font-weight: 600;
}

/* Content Viewport */
.wmail-viewport {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

/* Table Rows */
.row {
  display: flex;
  align-items: center;
  padding: 0 14px;
  height: 46px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13.5px;
  transition: background 0.1s ease;
}
.row:hover {
  background: #f8fafc;
  box-shadow: inset 2px 0 0 #0b57d0;
}
.row.sel { background: #e0f2fe; }

.cb {
  width: 17px;
  height: 17px;
  border: 1.5px solid #94a3b8;
  border-radius: 3px;
  flex: none;
  margin-right: 10px;
}
.row.sel .cb { background: #0b57d0; border-color: #0b57d0; }

.st {
  color: #cbd5e1;
  font-size: 17px;
  flex: none;
  width: 22px;
  text-align: center;
  margin-right: 12px;
  transition: color 0.15s;
}
.st.on, .st:hover { color: #f59e0b; }

.who {
  width: 200px;
  flex: none;
  padding-right: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
}
.who-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  flex: 1;
  min-width: 0;
}
.count-tag {
  font-size: 11px;
  color: #64748b;
  font-weight: 700;
  margin-left: 6px;
  flex: none;
}

.subj-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
}
.pill {
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 8px;
  flex: none;
}
.subj-text {
  font-weight: 600;
  color: #0f172a;
  max-width: 44%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}
.snip {
  color: #64748b;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.date {
  font-size: 12.5px;
  color: #64748b;
  font-weight: 600;
  flex: none;
  width: 72px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  padding-left: 8px;
}

/* Thread View */
.threadview {
  display: none;
  padding: 0;
}

.tv-action-bar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafbfc;
  flex: none;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 18px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  flex: none;
  transition: all 0.15s ease;
}
.back-btn:hover { background: #f1f5f9; border-color: #94a3b8; }
.back-btn svg { width: 16px; height: 16px; }

.tv-action-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tv-header {
  padding: 20px 24px 14px;
  border-bottom: 1px solid #f1f5f9;
}
.tv-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.tv-cards-stack {
  padding: 16px 24px 48px;
  max-width: 1100px;
  margin: 0 auto;
}

.lpill {
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 10px;
}
.nmsg { font-size: 12.5px; color: #64748b; font-weight: 600; }
.allopen {
  font-size: 12px;
  color: #0b57d0;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 14px;
  padding: 3px 12px;
  font-weight: 600;
  cursor: pointer;
}
.allopen:hover { background: #f8fafc; }

/* Message Cards */
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  background: #fafbfc;
  transition: background 0.15s ease;
}
.card-head:hover { background: #f1f5f9; }

.cava {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex: none;
}
.cava.me { background: #059669; }
.cava.eccc { background: #0b57d0; }
.cava.mpo { background: #0284c7; }
.cava.atip { background: #0f766e; }
.cava.cce { background: #15803d; }

.card-head .meta { flex: 1; min-width: 0; }
.card-head .l1 {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 700;
  color: #0f172a;
}
.card-head .role { font-size: 12px; color: #64748b; font-weight: 500; }
.card-head .l2 {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-head .cdate {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  flex: none;
}
.card-head .cacts {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}
.msg-num-tag {
  font-size: 10.5px;
  background: #e2e8f0;
  color: #475569;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.card-chevron {
  color: #64748b;
  font-size: 14px;
  transition: transform 0.2s ease;
}
.card.open .card-chevron { transform: rotate(180deg); }

.card-body {
  display: none;
  padding: 20px 24px;
  font-size: 14px;
  line-height: 1.7;
  color: #1e293b;
  border-top: 1px solid #f1f5f9;
}
.card.open .card-body { display: block; }

.doc-summary {
  background: #f8fafc;
  border-left: 4px solid #0b57d0;
  padding: 12px 18px;
  border-radius: 0 8px 8px 0;
  font-size: 13.5px;
  color: #334155;
  margin: 10px 0;
}

.attach { margin: 12px 0 16px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12.5px;
}
.chip-icon { font-size: 16px; }
.chip .fn { font-weight: 700; color: #0f172a; }
.chip .sz { font-size: 11.5px; color: #64748b; }

.cx {
  background: #000000;
  color: #000000;
  border-radius: 2px;
  padding: 0 4px;
  line-height: 1.3;
  cursor: help;
  user-select: text;
}
.cx::selection { background: #0b57d0; color: #ffffff; }

/* Search Results */
.results {
  display: none;
  padding: 20px 24px 48px;
  max-width: 900px;
  margin: 0 auto;
}
.res-head {
  font-size: 14px;
  color: #475569;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 12px;
}
.res {
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  border-radius: 8px;
}
.res:hover { background: #f8fafc; }
.rtop { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.rwho { font-weight: 700; font-size: 13.5px; color: #0f172a; }
.rdate { color: #64748b; font-size: 12px; }
.rsubj { color: #1e293b; font-weight: 600; font-size: 13.5px; margin-bottom: 4px; }
.rsnip { color: #64748b; font-size: 13px; line-height: 1.5; }
.rsnip mark { background: #fef08a; color: #0f172a; border-radius: 2px; padding: 0 2px; }

.svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 860px) {
  .wmail-sidebar { display: none; }
  .brand-area { width: auto; }
  .wmail-shell { width: 100%; margin: 0; border-radius: 0; height: calc(100vh - 60px); border: none; }
  .who { width: 140px; }
  .snip { display: none; }
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

<!-- Navigation injectée automatiquement par navbar-loader.js -->
<div id="navbar-placeholder"></div>

<main id="main-content" style="flex: 1; display: flex; flex-direction: column;">
  <div class="wmail-shell">
    <!-- Topbar Wmail -->
    <header class="wmail-topbar">
      <div class="brand-area">
        <a href="index.html" class="icon-btn" title="Retourner au portail principal" aria-label="Retour au site principal">
          <svg class="svg" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </a>
        <button class="icon-btn" id="menu" aria-label="Menu latéral">
          <svg class="svg" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <a href="wmail.html" class="wmail-brand-logo">
          <div class="wmail-logo-mark">W</div>
          <span class="wmail-brand-title">W<b>mail</b></span>
        </a>
      </div>

      <div class="search-wrap">
        <svg class="svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <input id="search" placeholder="Rechercher dans les 96 correspondances (ECCC, MPO, CCE, AIPRP, Stablex...)" aria-label="Recherche">
        <button class="icon-btn search-clear" id="clear" aria-label="Effacer" hidden>
          <svg class="svg" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>
        </button>
      </div>

      <div class="wmail-actions">
        <a href="correspondance.html" class="icon-btn" title="Politique relative aux communications &amp; Déontologie" aria-label="Politique de correspondance">
          <svg class="svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </a>
        <a href="registre.html" class="icon-btn" title="Accéder au registre officiel CCE" aria-label="Registre officiel CCE">
          <svg class="svg" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
        </a>
        <div class="wmail-avatar" title="William Guindon (Auteur SEM-26-003)">WG</div>
      </div>
    </header>

    <!-- Workspace Wmail -->
    <div class="wmail-workspace">
      <!-- Sidebar -->
      <aside class="wmail-sidebar" id="sidebar">
        <nav>
          <button class="nav-item active" data-nav="all">
            <span class="nav-icon"><svg class="svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg></span>
            <span class="nav-label">Boîte de réception</span>
            <span class="nav-count">${threadList.length}</span>
          </button>
          <button class="nav-item" data-nav="starred">
            <span class="nav-icon"><svg class="svg" viewBox="0 0 24 24"><path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8z"/></svg></span>
            <span class="nav-label">Éléments clés</span>
            <span class="nav-count">${threadList.filter(x => x.isKey).length}</span>
          </button>
          <button class="nav-item" data-nav="sent">
            <span class="nav-icon"><svg class="svg" viewBox="0 0 24 24"><path d="m3 3 18 9-18 9 4-9zM7 12h14"/></svg></span>
            <span class="nav-label">Envoyés</span>
            <span class="nav-count">42</span>
          </button>
        </nav>

        <div class="sidebar-divider"></div>

        <div class="labels-header">Catégories</div>
        <button class="label-row" data-lab="signalement">
          <i class="label-tag" style="background:#d93025"></i>
          <span class="nav-label">Application de la loi &amp; Pêches</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'signalement').length}</span>
        </button>
        <button class="label-row" data-lab="eccc">
          <i class="label-tag" style="background:#0b57d0"></i>
          <span class="nav-label">ECCC &amp; Ministères</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'eccc').length}</span>
        </button>
        <button class="label-row" data-lab="cce">
          <i class="label-tag" style="background:#188038"></i>
          <span class="nav-label">CCE / ACEUM &amp; Traités</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'cce').length}</span>
        </button>
        <button class="label-row" data-lab="aiprp">
          <i class="label-tag" style="background:#00897a"></i>
          <span class="nav-label">AIPRP &amp; Accès à l'information</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'aiprp').length}</span>
        </button>
        <button class="label-row" data-lab="lep">
          <i class="label-tag" style="background:#9334e6"></i>
          <span class="nav-label">Espèces en péril (LEP)</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'lep').length}</span>
        </button>
        <button class="label-row" data-lab="stablex">
          <i class="label-tag" style="background:#e8710a"></i>
          <span class="nav-label">Stablex &amp; Cellule 6</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'stablex').length}</span>
        </button>

        <div class="sidebar-disclaimer">
          <strong>Registre citoyen SEM-26-003 :</strong> 96 correspondances versées au dossier probatoire public. Renseignements personnels protégés.
        </div>
      </aside>

      <!-- Main Messages Pane -->
      <div class="wmail-main">
        <!-- Barre d'onglets façon Gmail combinée avec compteur -->
        <div class="wmail-tabs-bar" id="inboxTabsBar">
          <div class="wmail-tabs-group">
            <button class="wmail-tab active" data-tab="all"><svg class="svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 13h4l2 3h4l2-3h4"/></svg><span>Tous</span></button>
            <button class="wmail-tab" data-tab="signalement"><svg class="svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Application de la loi</span></button>
            <button class="wmail-tab" data-tab="eccc"><svg class="svg" viewBox="0 0 24 24"><path d="m3 3 18 9-18 9 4-9zM7 12h14"/></svg><span>ECCC &amp; Cabinets</span></button>
            <button class="wmail-tab" data-tab="cce"><svg class="svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg><span>CCE &amp; ACEUM</span></button>
            <button class="wmail-tab" data-tab="aiprp"><svg class="svg" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg><span>AIPRP &amp; Clé USB</span></button>
          </div>
          <div class="wmail-counter-meta">
            <span id="counter">${threadList.length} conversations · 96 courriels</span>
            <button class="icon-btn" id="refresh" aria-label="Actualiser" title="Actualiser la liste">
              <svg class="svg" viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M6.1 9a7 7 0 0 1 11.4-2L20 11M4 13l2.5 4a7 7 0 0 0 11.4-2"/></svg>
            </button>
          </div>
        </div>

        <div class="wmail-viewport" id="messagesArea">
          <div class="msglist" id="msglist">
            ${threadList.map(renderRow).join('\n')}
          </div>

          <div class="results" id="results"></div>

          <div id="threadViewsContainer">
            ${threadList.map(renderThreadView).join('\n')}
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Pied de page officiel du site -->
<footer>
  <div class="wrap">
    <p class="footer-copy">© 2026 William Guindon — Blainville, Québec, Canada · <span lang="en">Official biography</span></p>
    <p class="footer-licence-box">
      Contenu mis à disposition sous licence <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr" target="_blank" rel="license noopener noreferrer">Creative Commons CC BY-NC-ND 4.0</a>. Renseignements personnels protégés.
    </p>

    <div class="footer-social-row">
      <a href="index.html" class="footer-social-link">← Accueil du site officiel</a>
      <a href="registre.html" class="footer-social-link">Registre officiel CCE</a>
      <a href="correspondance.html" class="footer-social-link">Politique de correspondance &amp; Déontologie</a>
      <a href="statut.html" class="footer-social-link" style="font-weight: 700; color: #22c55e;">● État des systèmes &amp; Bogues ↗</a>
    </div>
  </div>
</footer>

<script>
(function(){
  var msglist = document.getElementById('msglist');
  var results = document.getElementById('results');
  var search = document.getElementById('search');
  var clearB = document.getElementById('clear');
  var views = document.querySelectorAll('.threadview');
  var rows = document.querySelectorAll('.row');
  var tabs = document.querySelectorAll('.wmail-tab');
  var navItems = document.querySelectorAll('.nav-item');
  var labelRows = document.querySelectorAll('.label-row');
  var menuBtn = document.getElementById('menu');
  var sidebar = document.getElementById('sidebar');
  var inboxTabsBar = document.getElementById('inboxTabsBar');

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
    if(inboxTabsBar) inboxTabsBar.style.display = 'flex';
    if(pushHash && history.replaceState) history.replaceState(null, '', '#inbox');
  }

  function openThreadById(tid, pushHash){
    msglist.style.display = 'none';
    results.style.display = 'none';
    if(inboxTabsBar) inboxTabsBar.style.display = 'none';
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

  // Bouton retour dans les fils
  document.querySelectorAll('.back-btn').forEach(function(btn){
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
      if(inboxTabsBar) inboxTabsBar.style.display = 'flex';
      return;
    }
    var hits = idx.filter(function(item){ return item.text.indexOf(q) !== -1; });
    msglist.style.display = 'none';
    views.forEach(function(v){ v.style.display = 'none'; });
    if(inboxTabsBar) inboxTabsBar.style.display = 'none';
    results.style.display = 'block';

    var html = '<div class="res-head"><b>' + hits.length + '</b> résultat(s) pour « ' + val + ' »</div>';
    if(!hits.length){
      html += '<div style="padding:30px 10px;text-align:center;color:#64748b;">Aucune correspondance trouvée dans les 96 courriels.</div>';
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
console.log('✔ wmail.html régénéré avec succès !');
