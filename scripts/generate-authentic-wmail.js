const fs = require('fs');
const path = require('path');

const rawFile = '/Users/williamguindon/.gemini/antigravity/brain/fd968382-bf27-4d6d-b652-7559a28122df/.user_uploaded/media_1795563158087_84f2f96d.txt';
let rawText = fs.readFileSync(rawFile, 'utf8');

// Fichier d'archive Stablex Canada Inc.
const stbFile = path.join(__dirname, '../data/correspondance-stablex.txt');
let stbText = '';
if (fs.existsSync(stbFile)) {
  stbText = fs.readFileSync(stbFile, 'utf8');
}

// Nettoyage strict initial des renvois, métadonnées de suivi et brouillons
function cleanRawText(str) {
  return str
    .replace(/\[Message transcrit intégralement dans Correspondance_Marianne_Depelteau\.txt[^\]]*\]/gi, 
      "[Signalement formel et données d'échantillonnage versés au dossier probatoire citoyen — ID 19fd955011fe288c. Station d'échantillonnage FS-STB-2 (aval cellule n° 6), lacs Fauvel ; cadmium à 4,7× le critère CVAC ; chaîne de possession légale.]")
    .replace(/aussi transcrit intégralement dans l'archive Marianne[^)]*\)/gi,
      "dossier citoyen archivé et documenté")
    .replace(/signalement original complet dans l'archive Marianne[^\]]*\]/gi,
      "signalement officiel complet consigné au registre public]")
    .replace(/aussi dans Correspondance_Marianne_Depelteau\.txt[^\n\]]*/gi, "")
    .replace(/marianne\s+d[eé]pelteau[^\s,.<>)]*/gi, "[Nom protégé]")
    .replace(/d[eé]pelteau/gi, "[Protégé]")
    .replace(/marianne/gi, "[Protégé]")
    .replace(/Correspondance_Marianne_Depelteau\.txt/gi, "[Registre de correspondances]")
    .replace(/archive Marianne/gi, "[Dossier probatoire]");
}

rawText = cleanRawText(rawText);
if (stbText) stbText = cleanRawText(stbText);

// Parse all messages
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

  // Filtrer STRICTEMENT les brouillons non envoyés et les artefacts de suivi (Mailsuite / Mailtrack)
  const isDraftOrTracker = 
    (noteMatch && noteMatch[1].toLowerCase().includes('draft')) ||
    body.includes('BROUILLON') ||
    body.includes('Mailtrack') ||
    body.includes('Mailsuite') ||
    body.includes('artefact Mailsuite');

  if (!isDraftOrTracker) {
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
}

// Ingestion complémentaire de l'archive officielle Stablex Canada Inc.
if (stbText) {
  const stbRegex = /MESSAGE\s+(\d+)[\s\S]*?(?=MESSAGE\s+\d+|$|CONCLUSION)/g;
  let sm;
  while ((sm = stbRegex.exec(stbText)) !== null) {
    const block = sm[0];
    const sNum = parseInt(sm[1], 10);
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

    const sId = idMatch ? idMatch[1].trim() : '';

    // Vérifier si le message existe déjà dans rawMessages
    const existing = rawMessages.find(x => x.id && sId && x.id.toLowerCase() === sId.toLowerCase());
    if (existing) {
      existing.isStablex = true;
      existing.stablexNum = sNum;
      if (aMatch && aMatch[1].includes('stablex.com') && !existing.a.includes('stablex.com')) {
        existing.a = aMatch[1].trim();
      }
    } else {
      // Message inédit exclusif Stablex (messages 2, 4, 5, 6)
      const isDraftOrTracker = 
        body.includes('BROUILLON') ||
        body.includes('Mailtrack') ||
        body.includes('Mailsuite');

      if (!isDraftOrTracker) {
        rawMessages.push({
          num: 100 + sNum,
          stbNum: sNum,
          date: dateMatch ? dateMatch[1].trim() : '',
          de: deMatch ? deMatch[1].trim() : '',
          a: aMatch ? aMatch[1].trim() : '',
          cc: ccMatch ? ccMatch[1].trim() : '',
          objet: objMatch ? objMatch[1].trim() : '(sans objet)',
          fil: filMatch ? filMatch[1].trim() : 'fil_stb_' + sNum,
          id: sId,
          pieces: piecesMatch ? piecesMatch[1].trim() : '',
          note: noteMatch ? noteMatch[1].trim() : '',
          body,
          isStablex: true
        });
      }
    }
  }
}

console.log('Parsed authentic sent/received messages (sans brouillons ni traceurs):', rawMessages.length);

// Fonction de caviardage stricte (données personnelles + journalistes / transmissions)
function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/guindonwilliam2@gmail\.com/gi, '<span class="cx" title="Caviardé : Courriel citoyen protégé (Loi 25)">contact@williamguindon.me</span>')
    .replace(/guindonwilliam2\+cc@gmail\.com/gi, '<span class="cx" title="Caviardé : Alias citoyen protégé">contact@williamguindon.me</span>')
    .replace(/williamguindon@icloud\.com/gi, '<span class="cx" title="Caviardé : Boîte iCloud privée">contact@williamguindon.me</span>')
    .replace(/cathymainville@hotmail\.com/gi, '<span class="cx" title="Caviardé : Représentante légale / Ligne parentale">représentante légale biffée</span>')
    .replace(/\+1\s*\(?514\)?\s*808-3727/g, '<span class="cx" title="Caviardé : Ligne téléphonique privée">[Téléphone personnel biffé]</span>')
    .replace(/514-808-3727/g, '<span class="cx" title="Caviardé : Ligne téléphonique privée">[Téléphone personnel biffé]</span>')
    .replace(/marianne\s+d[eé]pelteau[^\s,.<>)]*/gi, '<span class="cx" title="Caviardé : Donnée protégée">[Nom biffé]</span>')
    .replace(/d[eé]pelteau/gi, '<span class="cx" title="Caviardé">[Biffé]</span>')
    .replace(/marianne/gi, '<span class="cx" title="Caviardé">[Biffé]</span>')
    .replace(/journaliste[s]?/gi, 'correspondant civil')
    .replace(/Correspondance_Marianne_Depelteau\.txt/gi, '[Registre de correspondances]')
    .replace(/archive Marianne/gi, '[Dossier probatoire]');
}

// Formatage strict de la DATE UNIQUEMENT (SANS AUCUNE HEURE NI MINUTE NI SECONDE)
function formatFullDay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split(' ')[0].split('-');
  if (parts.length === 3) {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parts[0];
    return `${d} ${months[m] || ''} ${y}`;
  }
  return dateStr.split(' ')[0];
}

// Formatage de dates courtes en français pour la liste (ex. "3 juin", "14 juin")
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split(' ')[0].split('-');
  if (parts.length === 3) {
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    return `${d} ${months[m] || ''}`;
  }
  return dateStr.split(' ')[0];
}

// Fonction pour déterminer la catégorie et le libellé
function categorizeThread(subject, msgs) {
  const combined = (subject + ' ' + msgs.map(x => x.body + ' ' + x.a + ' ' + x.de).join(' ')).toLowerCase();
  if (combined.includes('signalement pénal') || combined.includes('inrp') || combined.includes('infractions') || combined.includes('cnue-neec')) {
    return { cat: 'signalement', label: 'Application de la loi & Pêches', color: '#ef4444', icon: '⚖️' };
  }
  if (combined.includes('décret d\'urgence') || combined.includes('article 80') || combined.includes('lep')) {
    return { cat: 'lep', label: 'Espèces en péril (LEP)', color: '#a855f7', icon: '🌿' };
  }
  if (combined.includes('aiprp') || combined.includes('atip') || combined.includes('renseignements personnels') || combined.includes('p-2026') || combined.includes('praine')) {
    return { cat: 'aiprp', label: 'Accès à l\'information (AIPRP)', color: '#06b6d4', icon: '📁' };
  }
  if (combined.includes('cce') || combined.includes('aceum') || combined.includes('ambassade') || combined.includes('sem-26-003')) {
    return { cat: 'cce', label: 'CCE / ACEUM & Traités', color: '#10b981', icon: '🌐' };
  }
  if (combined.includes('stablex') || combined.includes('cellule 6')) {
    return { cat: 'stablex', label: 'Stablex & Cellule 6', color: '#f59e0b', icon: '🏭' };
  }
  return { cat: 'eccc', label: 'ECCC & Cabinets ministériels', color: '#3b82f6', icon: '🏛️' };
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
      <p><b>⚠️ Avis technique de non-remise automatique (MPO) :</b></p>
      <p>L'adresse régionale de transmission ministérielle refuse les correspondances externes (code serveur 550 5.1.10). Cette pièce matérialise l'obstacle technique documenté dans la communication SEM-26-003.</p>
    </div>`;
  }

  if (isAutoReply && text.length > 500) {
    return `<div class="doc-summary">
      <p><b>📨 Accusé de réception ministériel automatisé :</b></p>
      <p>Attestation formelle de réception horodatée émise par le service informatique de ${sanitizeText(msg.de)} avec indexation et transmission au cabinet exécutif.</p>
    </div>`;
  }

  // Caviarder le texte et formater les paragraphes
  text = sanitizeText(text)
    .replace(/={4,}/g, "")
    .replace(/\[TRONQUÉ[^\]]*\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<b>$1</b>")
    .replace(/\[image:\s*Mailsuite\][^\n]*/gi, "")
    .replace(/Expéditeur notifié avec Mailtrack[^\n]*/gi, "")
    .replace(/Se désinscrire[^\n]*/gi, "");

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

  return paragraphs || `<p class="faded">(Corps de message transmis par pli annexe ou pièce jointe)</p>`;
}

// Regroupement par Fil Gmail
const threadMap = new Map();

rawMessages.forEach(msg => {
  let filKey = msg.fil;
  
  if (msg.num >= 1 && msg.num <= 7) {
    filKey = 'thread_01_demande_enquete_lcom_peches';
  } else if (msg.num === 8 || msg.num === 9) {
    filKey = 'thread_02_signalement_enviroinfo';
  } else if (msg.num === 10 || msg.num === 11 || msg.num === 26 || msg.num === 27 || msg.num === 102) {
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
  } else if (msg.num === 64 || msg.num === 71 || msg.num === 72 || msg.num === 73 || msg.num === 75 || msg.num === 80 || msg.num === 81 || msg.num === 82 || msg.num === 83 || msg.num === 84 || msg.num === 85 || msg.num === 86 || msg.num === 90) {
    filKey = 'thread_13_aiprp_praine_purolator';
  } else if (msg.num >= 65 && msg.num <= 67) {
    filKey = 'thread_14_enquete_partis_politiques';
  } else if (msg.num >= 68 && msg.num <= 70) {
    filKey = 'thread_15_imagerie_copernicus_cce';
  } else if (msg.num >= 76 && msg.num <= 79) {
    filKey = 'thread_16_reponse_canada_replique_72_rsp';
  } else if (msg.num >= 88 && msg.num <= 89) {
    filKey = 'thread_17_reponses_petition_0546_eccc_mpo';
  } else if (msg.num >= 91 && msg.num <= 93) {
    filKey = 'thread_18_suivi_conjoint_ministres_jeunesse';
  } else if (msg.num >= 94 && msg.num <= 96) {
    filKey = 'thread_19_avis_officiel_petition_blocage';
  } else if (msg.num === 104) {
    filKey = 'thread_20_stablex_derniere_relance_30_juin';
  } else if (msg.num === 105 || msg.num === 106) {
    filKey = 'thread_21_stablex_ultimatum_catapulte';
  }

  if (!threadMap.has(filKey)) {
    threadMap.set(filKey, []);
  }
  threadMap.get(filKey).push(msg);
});

console.log('Mapped to grouped authentic threads:', threadMap.size);

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
  const isKey = msgs.some(m => [2, 8, 12, 35, 45, 46, 47, 57, 59, 75, 86, 88, 89, 91, 94, 102, 104, 105].includes(m.num));
  const isStablex = msgs.some(m => m.isStablex || (m.a && m.a.includes('stablex.com')) || (m.cc && m.cc.includes('stablex.com')) || (m.objet && m.objet.toLowerCase().includes('stablex')) || filId.includes('stablex'));

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
    category: isStablex && categoryInfo.cat === 'eccc' ? 'stablex' : categoryInfo.cat,
    catLabel: isStablex && categoryInfo.cat === 'eccc' ? 'Stablex & Cellule 6' : categoryInfo.label,
    catColor: isStablex && categoryInfo.cat === 'eccc' ? '#f59e0b' : categoryInfo.color,
    catIcon: isStablex && categoryInfo.cat === 'eccc' ? '🏭' : categoryInfo.icon,
    rawDate: last.date.split(' ')[0],
    shortDate: formatShortDate(last.date),
    messagesCount: msgs.length,
    participants: sanitizeText(participantStr),
    snippet: sanitizeText(snippet),
    isKey,
    isStablex,
    msgs
  });
  tIdx++;
}

// Rendu HTML des rangées (.row façon Gmail Pro / Dark)
function renderRow(t) {
  return `
    <div class="row" data-tid="${t.tid}" data-cat="${t.category}" data-key="${t.isKey ? '1' : '0'}" data-stablex="${t.isStablex ? '1' : '0'}" role="button" tabindex="0">
      <div class="cb" title="Sélectionner" aria-label="Sélectionner la conversation"></div>
      <div class="st ${t.isKey ? 'on' : ''}" title="${t.isKey ? 'Élément clé du dossier probatoire' : 'Ajouter une étoile'}">★</div>
      <div class="who" title="${t.participants}">
        <span class="who-name">${t.participants}</span>
        ${t.messagesCount > 1 ? `<span class="count-tag">${t.messagesCount}</span>` : ''}
      </div>
      <div class="subj-wrap">
        ${t.isStablex ? `
          <span class="pill" style="border-color:rgba(245,158,11,0.5);color:#fbbf24;background:rgba(245,158,11,0.12)">
            <span class="pill-dot" style="background:#f59e0b"></span>
            <span>0 réponse Stablex</span>
          </span>
        ` : ''}
        <span class="pill pill-${t.category}">
          <span class="pill-dot"></span>
          <span>${t.catLabel}</span>
        </span>
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
      <!-- Barre d'actions supérieure façon Gmail Pro -->
      <div class="tv-action-bar">
        <div class="tv-action-left">
          <button class="back-btn" title="Revenir à la boîte de réception (Raccourci : Échap ou u)" aria-label="Retour à la liste">
            <svg class="svg" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
            <span>Boîte de réception</span>
          </button>
        </div>
        <div class="tv-action-right">
          <button class="tool-btn print-thread-btn" title="Imprimer ou exporter ce fil au format officiel" onclick="window.print()">
            <svg class="svg" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            <span>Imprimer</span>
          </button>
          <button class="tool-btn copy-thread-btn" title="Copier la transcription caviardée dans le presse-papier" data-tid="${t.tid}">
            <svg class="svg" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copier</span>
          </button>
          <span class="lpill lpill-${t.category}">${t.catLabel}</span>
          <span class="nmsg">${t.messagesCount} message${t.messagesCount > 1 ? 's' : ''}</span>
          <button class="allopen">Tout déplier / replier</button>
        </div>
      </div>

      <!-- En-tête du fil -->
      <div class="tv-header">
        <h2>${t.subject}</h2>
        <div class="tv-header-tags">
          <span class="badge-proof">Dossier CCE SEM-26-003</span>
          <span class="badge-audit">Renseignements personnels biffés (Loi 25)</span>
          <span class="badge-id">Fil ID : ${t.filId}</span>
          ${t.isStablex ? '<span class="badge-stablex" style="background:rgba(245,158,11,0.18);color:#fbbf24;border:1px solid rgba(245,158,11,0.45);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;">🏭 Correspondance Stablex Canada</span>' : ''}
        </div>
      </div>

      ${t.isStablex ? `
        <div class="stablex-silence-banner" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%); border: 1.5px solid rgba(245, 158, 11, 0.4); border-radius: 10px; padding: 14px 18px; margin: 0 0 20px; display: flex; align-items: flex-start; gap: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">
          <span style="font-size: 24px; line-height: 1; flex-shrink: 0;">🏭</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 800; font-size: 13.5px; color: #fbbf24; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span>Constat probatoire : Zéro réponse écrite de Stablex Canada Inc.</span>
              <span style="background: rgba(245, 158, 11, 0.25); color: #fef3c7; font-size: 10.5px; padding: 2px 7px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">Silence corporatif documenté</span>
            </div>
            <div style="font-size: 12.5px; color: #cbd5e1; margin-top: 5px; line-height: 1.5;">
              Dix correspondances formelles, relances et ultimatums ont été directement transmis aux gestionnaires de Stablex Canada Inc. et à leur agence de relations publiques Catapulte Communication. Aucune réponse écrite n'a été produite. Ce silence complet est consigné au registre officiel de la CCE (SEM-26-003).
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Liste des messages du fil -->
      <div class="tv-cards-stack">
        ${t.msgs.map((m, idx) => {
          const isMe = m.de.includes('William');
          const isOpen = t.msgs.length === 1 || idx === t.msgs.length - 1 || [2, 8, 12, 35, 45, 46, 47, 75, 86, 88, 89, 91, 94, 102, 104, 105].includes(m.num);
          let avatarInitial = 'WG';
          let avatarClass = 'me';
          let orgName = 'Citoyen & Auteur';
          if (!isMe) {
            if (m.de.includes('MPO') || m.de.includes('Pêches')) { avatarInitial = 'MPO'; avatarClass = 'mpo'; orgName = 'Pêches et Océans Canada'; }
            else if (m.de.includes('AIPRP') || m.de.includes('Lisa Praine')) { avatarInitial = 'ATIP'; avatarClass = 'atip'; orgName = 'Direction générale AIPRP'; }
            else if (m.de.includes('CCE') || m.de.includes('Secretariat')) { avatarInitial = 'CCE'; avatarClass = 'cce'; orgName = 'Commission de coopération environnementale'; }
            else if (m.de.includes('Stablex') || m.a.includes('stablex.com')) { avatarInitial = 'STB'; avatarClass = 'stb'; orgName = 'Stablex Canada Inc.'; }
            else { avatarInitial = 'ECCC'; avatarClass = 'eccc'; orgName = 'Environnement et Changement climatique Canada'; }
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
                    <span class="forg-badge">${orgName}</span>
                    ${m.note ? `<span class="role">(${sanitizeText(m.note)})</span>` : ''}
                  </div>
                  <div class="l2">
                    <span>à <strong>${sanitizeText(m.a)}</strong></span>
                    ${m.cc ? ` · <span class="faded">Cc : ${sanitizeText(m.cc)}</span>` : ''}
                  </div>
                </div>
                <!-- DATE UNIQUE SANS HEURE NI SECONDE -->
                <div class="cdate">${formatFullDay(m.date)}</div>
                <div class="cacts">
                  <span class="msg-num-tag">Msg #${m.num}</span>
                  <span class="card-chevron">▾</span>
                </div>
              </div>
              <div class="card-body">
                ${m.pieces ? `
                  <div class="attach">
                    <div class="chip" title="Cliquer pour afficher la fiche de la pièce probatoire" onclick="openEvidenceModal('${encodeURIComponent(m.pieces)}', '${m.num}', '${t.filId}')">
                      <span class="chip-icon">📎</span>
                      <div class="cinfo">
                        <div class="fn">${m.pieces}</div>
                        <div class="sz">Pièce probatoire versée au dossier public · Cliquer pour détails ↗</div>
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
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<script>(function(){try{if(!window.history||!window.history.replaceState)return;var s=window.location.search,h=window.location.hash;if(!s&&(!h||h.indexOf('?')===-1))return;var u=new URL(window.location.href);var t=new Set(['fbclid','fbadid','gclid','gbraid','wbraid','_ga','_gl','igshid','twclid','ttclid','msclkid','mc_cid','mc_eid','yclid','dclid','ref_src','gad_source','gclsrc']);var isT=function(k){var l=(k||'').toLowerCase();return l.indexOf('utm_')===0||l.indexOf('fb_')===0||l.indexOf('_aem')===0||t.has(l);};var c=false;if(s){var r=[];u.searchParams.forEach(function(_,k){if(isT(k))r.push(k);});if(r.length){for(var i=0;i<r.length;i++)u.searchParams.delete(r[i]);c=true;}}if(h&&h.indexOf('?')!==-1){var p=u.hash.split('?'),b=p[0],hp=new URLSearchParams(p.slice(1).join('?')),hr=[];hp.forEach(function(_,k){if(isT(k))hr.push(k);});if(hr.length){for(var j=0;j<hr.length;j++)hp.delete(hr[j]);var q=hp.toString();u.hash=b+(q?'?'+q:'');c=true;}}if(c){var ns=u.searchParams.toString();window.history.replaceState(null,'',u.pathname+(ns?'?'+ns:'')+u.hash);}}catch(_){}})();</script>
<script src="assets/js/security-guard.js" defer></script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wmail — Registre des correspondances &amp; démarches citoyennes · William Guindon</title>
<meta name="description" content="Registre officiel interactif et caviardé des 92 correspondances citoyennes, signalements et requêtes formelles (ECCC, MPO, CCE, AIPRP) dans le cadre du dossier SEM-26-003.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="fr" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/wmail.html">
<meta property="og:type" content="website">
<meta property="og:title" content="Wmail — Registre des correspondances &amp; démarches citoyennes · William Guindon">
<meta property="og:description" content="Registre public et caviardé des correspondances, signalements pénaux et demandes d'accès à l'information (dossier SEM-26-003).">
<meta property="og:url" content="https://williamguindon.me/wmail.html">
<meta property="og:image" content="https://williamguindon.me/assets/media/william-guindon.jpg">
<meta name="color-scheme" content="dark light">

<!-- Styles de base du site & injecteur navbar officiel -->
<link rel="stylesheet" href="style.css?v=20261018-v87">
<script src="assets/js/navbar-loader.js" defer></script>

<style>
/* ==================== THEME DARK / OBSIDIAN LUXURY WMAIL ==================== */
:root {
  --w-bg: #0b0f0c;
  --w-card: #121814;
  --w-card-hover: #19221c;
  --w-border: #1e2821;
  --w-border-faint: rgba(255, 255, 255, 0.07);
  --w-text: #f0fdf4;
  --w-text-muted: #94a3b8;
  --w-text-dim: #64748b;
  --w-accent: #10b981;
  --w-accent-glow: rgba(16, 185, 129, 0.2);
  --w-accent-wash: rgba(16, 185, 129, 0.08);
  --w-search-bg: #18201a;
  --w-sidebar-bg: #0e1410;
  --w-star: #f59e0b;
  --w-cx-bg: #000000;
  --w-cx-border: #334155;
  --w-cx-text: #38bdf8;
}

[data-theme="light"] {
  --w-bg: #f8fafc;
  --w-card: #ffffff;
  --w-card-hover: #f1f5f9;
  --w-border: #e2e8f0;
  --w-border-faint: rgba(0, 0, 0, 0.06);
  --w-text: #0f172a;
  --w-text-muted: #64748b;
  --w-text-dim: #94a3b8;
  --w-accent: #059669;
  --w-accent-glow: rgba(5, 150, 105, 0.15);
  --w-accent-wash: #ecfdf5;
  --w-search-bg: #f1f5f9;
  --w-sidebar-bg: #f8fafc;
  --w-star: #f59e0b;
  --w-cx-bg: #0f172a;
  --w-cx-border: #cbd5e1;
  --w-cx-text: #bae6fd;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--w-bg);
  color: var(--w-text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Harmonisation du bandeau supérieur officiel */
header.site {
  background: #0b0f0c !important;
  border-bottom: 1px solid #1c2620 !important;
  flex: none;
}
header.site .wrap {
  background: transparent !important;
}
header.site .brand-text {
  color: #f0fdf4 !important;
}
header.site .nav-dropdown-btn,
header.site .menu-toggle,
header.site nav a {
  color: #cbd5e1 !important;
}
header.site .nav-dropdown-btn:hover,
header.site nav a:hover {
  color: #10b981 !important;
}

/* Suppression absolue des marges globales de section pour Wmail */
.wmail-shell section,
.wmail-main,
.threadview {
  padding: 0 !important;
  border-bottom: none !important;
}

/* ==================== HUD PROBATOIRE EN TÊTE ==================== */
.wmail-hud {
  max-width: 1480px;
  width: calc(100% - 24px);
  margin: 12px auto 6px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  flex: none;
}
.hud-card {
  background: var(--w-card);
  border: 1px solid var(--w-border);
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, border-color 0.15s ease;
  min-width: 0;
}
.hud-card:hover {
  transform: translateY(-2px);
  border-color: var(--w-accent);
}
.hud-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--w-accent-wash);
  color: var(--w-accent);
  display: grid;
  place-items: center;
  font-size: 17px;
  flex: none;
}
.hud-meta { display: flex; flex-direction: column; min-width: 0; }
.hud-value { font-size: 18px; font-weight: 800; color: var(--w-text); letter-spacing: -0.5px; }
.hud-label { font-size: 11px; font-weight: 600; color: var(--w-text-muted); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ==================== CONTENEUR WMAIL ==================== */
.wmail-shell {
  max-width: 1480px;
  width: calc(100% - 24px);
  margin: 6px auto 14px;
  background: var(--w-card);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--w-border);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

/* Wmail Topbar */
.wmail-topbar {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: var(--w-card);
  border-bottom: 1px solid var(--w-border);
  flex: none;
  z-index: 10;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 270px;
  flex: none;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--w-text-muted);
  transition: all 0.15s ease;
}
.icon-btn:hover {
  background: var(--w-card-hover);
  color: var(--w-text);
  border-color: var(--w-border);
}

.wmail-brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  color: var(--w-text);
}
.wmail-logo-mark {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 16px;
  box-shadow: 0 2px 8px var(--w-accent-glow);
}
.wmail-brand-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--w-text);
}
.wmail-brand-title b { color: var(--w-accent); }

/* Barre de recherche avec icône fine */
.search-wrap {
  height: 42px;
  max-width: 680px;
  flex: 1;
  position: relative;
  margin: 0 auto;
}
.search-wrap svg.svg {
  position: absolute;
  left: 16px;
  top: 12px;
  color: var(--w-text-dim);
  width: 18px;
  height: 18px;
  pointer-events: none;
  fill: none;
  stroke: currentColor;
}
.search-wrap input {
  width: 100%;
  height: 100%;
  border: 1px solid var(--w-border);
  outline: none;
  border-radius: 24px;
  background: var(--w-search-bg);
  padding: 0 46px 0 48px;
  font-size: 14px;
  color: var(--w-text);
  transition: all 0.2s ease;
}
.search-wrap input:focus {
  background: var(--w-card);
  border-color: var(--w-accent);
  box-shadow: 0 0 0 3px var(--w-accent-glow);
}
.search-clear {
  position: absolute;
  right: 6px;
  top: 2px;
  display: none;
}

.wmail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.theme-switch-btn {
  font-size: 16px;
}
.wmail-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--w-accent);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 800;
  box-shadow: 0 0 0 2px var(--w-accent-glow);
  cursor: pointer;
}

/* ==================== WORKSPACE & SIDEBAR ==================== */
.wmail-workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  background: var(--w-card);
}

.wmail-sidebar {
  width: 280px;
  flex: none;
  padding: 14px 10px 14px 14px;
  background: var(--w-sidebar-bg);
  border-right: 1px solid var(--w-border);
  overflow-y: auto;
  transition: width 0.2s ease;
  display: flex;
  flex-direction: column;
}
.wmail-sidebar.collapsed { width: 68px; }

.nav-item {
  height: 38px;
  width: 100%;
  border-radius: 19px;
  display: flex;
  align-items: center;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--w-text-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0 14px 0 8px;
  margin-bottom: 2px;
  transition: all 0.15s ease;
}
.nav-item:hover { background: var(--w-card-hover); color: var(--w-text); }
.nav-item.active { background: var(--w-accent-wash); color: var(--w-accent); font-weight: 700; }
.nav-icon { width: 36px; display: grid; place-items: center; flex: none; }
.nav-label { flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-count { font-size: 11.5px; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: rgba(255,255,255,0.06); }
.nav-item.active .nav-count { background: var(--w-accent); color: #ffffff; }

.sidebar-divider {
  height: 1px;
  background: var(--w-border);
  margin: 14px 6px;
}

.labels-header {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--w-text-dim);
  letter-spacing: 0.8px;
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
  color: var(--w-text-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  margin-bottom: 2px;
  transition: all 0.15s ease;
}
.label-row:hover { background: var(--w-card-hover); color: var(--w-text); }
.label-row.active { background: var(--w-card-hover); color: var(--w-accent); font-weight: 700; box-shadow: inset 2px 0 0 var(--w-accent); }
.label-tag { width: 9px; height: 9px; border-radius: 50%; flex: none; box-shadow: 0 0 6px currentColor; }

.sidebar-disclaimer {
  margin-top: auto;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  font-size: 11px;
  color: var(--w-text-dim);
  line-height: 1.5;
  border: 1px solid var(--w-border);
}

/* ==================== VUE PRINCIPALE BOÎTE ==================== */
.wmail-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--w-card);
}

/* Onglets & Barre d'outils combinée */
.wmail-tabs-bar {
  height: 52px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--w-border);
  background: var(--w-sidebar-bg);
  padding: 0 16px 0 0;
  gap: 12px;
}
.wmail-tabs-group {
  display: flex;
  height: 100%;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
  gap: 2px;
}
.wmail-tab {
  position: relative;
  min-width: 80px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--w-text-muted);
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.wmail-tab:hover { background: var(--w-card-hover); color: var(--w-text); }
.wmail-tab.active { color: var(--w-accent); font-weight: 700; background: var(--w-card); }
.wmail-tab.active::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 3px;
  background: var(--w-accent);
  box-shadow: 0 -1px 6px var(--w-accent);
  border-radius: 3px 3px 0 0;
}

.wmail-counter-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--w-text-muted);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  padding-left: 12px;
  border-left: 1px solid var(--w-border);
}

/* Content Viewport */
.wmail-viewport {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

/* Rangées de courriels (.row) */
.row {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 46px;
  cursor: pointer;
  border-bottom: 1px solid var(--w-border-faint);
  font-size: 13.5px;
  transition: background 0.1s ease;
}
.row:hover {
  background: var(--w-card-hover);
  box-shadow: inset 2px 0 0 var(--w-accent);
}
.row.sel { background: var(--w-accent-wash); }

.cb {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--w-text-dim);
  border-radius: 3px;
  flex: none;
  margin-right: 10px;
}
.row.sel .cb { background: var(--w-accent); border-color: var(--w-accent); }

.st {
  color: var(--w-border);
  font-size: 16px;
  flex: none;
  width: 20px;
  text-align: center;
  margin-right: 12px;
  transition: color 0.15s;
}
.st.on, .st:hover { color: var(--w-star); text-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }

.who {
  width: 200px;
  flex: none;
  padding-right: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--w-text);
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
  font-size: 10.5px;
  color: var(--w-text-dim);
  font-weight: 700;
  background: rgba(255,255,255,0.06);
  padding: 1px 5px;
  border-radius: 4px;
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

/* Pastilles de catégorie */
.pill {
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  letter-spacing: 0.2px;
}
.pill-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.pill-signalement { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.pill-lep { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.pill-aiprp { background: rgba(6, 182, 212, 0.15); color: #38bdf8; border: 1px solid rgba(6, 182, 212, 0.3); }
.pill-cce { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.pill-stablex { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
.pill-eccc { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }

.subj-text {
  font-weight: 600;
  color: var(--w-text);
  max-width: 44%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}
.snip {
  color: var(--w-text-muted);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.date {
  font-size: 12.5px;
  color: var(--w-text-muted);
  font-weight: 600;
  flex: none;
  width: 72px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  padding-left: 8px;
}

/* ==================== VUE DU FIL (THREADVIEW) ==================== */
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
  border-bottom: 1px solid var(--w-border);
  background: var(--w-sidebar-bg);
  flex: none;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 18px;
  border: 1px solid var(--w-border);
  background: var(--w-card);
  color: var(--w-text);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  flex: none;
  transition: all 0.15s ease;
}
.back-btn:hover { background: var(--w-card-hover); border-color: var(--w-accent); }
.back-btn svg { width: 16px; height: 16px; }

.tv-action-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 14px;
  border: 1px solid var(--w-border);
  background: var(--w-card);
  color: var(--w-text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tool-btn:hover { color: var(--w-text); border-color: var(--w-accent); }
.tool-btn svg { width: 14px; height: 14px; }

.tv-header {
  padding: 24px 28px 18px;
  border-bottom: 1px solid var(--w-border-faint);
  background: rgba(255, 255, 255, 0.01);
}
.tv-header h2 {
  margin: 0 0 10px;
  font-size: 21px;
  font-weight: 800;
  color: var(--w-text);
  line-height: 1.35;
  letter-spacing: -0.3px;
}
.tv-header-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.badge-proof {
  font-size: 11px;
  font-weight: 700;
  background: var(--w-accent-wash);
  color: var(--w-accent);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--w-accent);
}
.badge-audit {
  font-size: 11px;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.badge-id {
  font-size: 11px;
  font-family: monospace;
  color: var(--w-text-dim);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 8px;
  border-radius: 6px;
}

.tv-cards-stack {
  padding: 20px 28px 48px;
  max-width: 1160px;
  margin: 0 auto;
}

.lpill {
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  padding: 3px 10px;
}
.lpill-signalement { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.lpill-lep { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
.lpill-aiprp { background: rgba(6, 182, 212, 0.2); color: #38bdf8; }
.lpill-cce { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.lpill-stablex { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.lpill-eccc { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

.nmsg { font-size: 12.5px; color: var(--w-text-muted); font-weight: 600; }
.allopen {
  font-size: 12px;
  color: var(--w-accent);
  border: 1px solid var(--w-border);
  background: var(--w-card);
  border-radius: 14px;
  padding: 3px 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.allopen:hover { border-color: var(--w-accent); }

/* Message Cards */
.card {
  background: var(--w-card);
  border: 1px solid var(--w-border);
  border-radius: 14px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  transition: border-color 0.15s ease;
}
.card:hover { border-color: rgba(255, 255, 255, 0.15); }
.card.open { border-color: var(--w-border); }

.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  background: var(--w-sidebar-bg);
  transition: background 0.15s ease;
}
.card-head:hover { background: var(--w-card-hover); }

.cava {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.cava.me { background: linear-gradient(135deg, #10b981 0%, #047857 100%); }
.cava.eccc { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
.cava.mpo { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); }
.cava.atip { background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); }
.cava.cce { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); }
.cava.stb { background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%); }

.card-head .meta { flex: 1; min-width: 0; }
.card-head .l1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--w-text);
  flex-wrap: nowrap;
}
.forg-badge {
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.06);
  color: var(--w-text-muted);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.card-head .role { font-size: 11.5px; color: var(--w-text-dim); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }
.card-head .l2 {
  font-size: 12px;
  color: var(--w-text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-head .cdate {
  font-size: 12px;
  color: var(--w-text-muted);
  font-weight: 600;
  flex: none;
  font-variant-numeric: tabular-nums;
}
.card-head .cacts {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}
.msg-num-tag {
  font-size: 10.5px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--w-text-muted);
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.card-chevron {
  color: var(--w-text-dim);
  font-size: 14px;
  transition: transform 0.2s ease;
}
.card.open .card-chevron { transform: rotate(180deg); }

.card-body {
  display: none;
  padding: 22px 28px;
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--w-text);
  border-top: 1px solid var(--w-border);
  background: var(--w-card);
}
.card.open .card-body { display: block; }

.doc-summary {
  background: rgba(59, 130, 246, 0.08);
  border-left: 4px solid #3b82f6;
  padding: 12px 18px;
  border-radius: 0 8px 8px 0;
  font-size: 13.5px;
  color: var(--w-text);
  margin: 12px 0;
}

.attach { margin: 14px 0 18px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--w-sidebar-bg);
  border: 1px solid var(--w-border);
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover {
  background: var(--w-card-hover);
  border-color: var(--w-accent);
  box-shadow: 0 4px 14px var(--w-accent-glow);
}
.chip-icon { font-size: 17px; }
.chip .fn { font-weight: 700; color: var(--w-text); }
.chip .sz { font-size: 11.5px; color: var(--w-accent); }

/* Caviardage Interactif */
.cx {
  background: var(--w-cx-bg);
  color: var(--w-cx-bg);
  border-radius: 3px;
  padding: 0 5px;
  line-height: 1.3;
  cursor: help;
  user-select: text;
  border: 1px solid var(--w-cx-border);
  position: relative;
  transition: all 0.2s ease;
}
.cx:hover {
  background: #090d0b;
  color: var(--w-cx-text);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}
.cx::selection { background: var(--w-accent); color: #ffffff; }

/* Modale de pièce probatoire (Evidence Modal) */
.evidence-modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: none;
  place-items: center;
}
.evidence-modal {
  width: 90%;
  max-width: 540px;
  background: var(--w-card);
  border: 1px solid var(--w-border);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  padding: 24px;
}
.evidence-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.evidence-title { font-size: 17px; font-weight: 700; color: var(--w-text); }
.evidence-close {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--w-text-muted);
  cursor: pointer;
}
.evidence-body { font-size: 13.5px; line-height: 1.6; color: var(--w-text-muted); }
.evidence-meta-row {
  margin: 10px 0;
  padding: 10px 14px;
  background: var(--w-sidebar-bg);
  border-radius: 8px;
  border: 1px solid var(--w-border);
  font-family: monospace;
  font-size: 12px;
  color: var(--w-accent);
}

/* Toast de notification */
.wmail-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #10b981;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  z-index: 100000;
  display: none;
}

/* Search Results */
.results {
  display: none;
  padding: 24px 28px 48px;
  max-width: 960px;
  margin: 0 auto;
}
.res-head {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--w-text);
  padding-bottom: 14px;
  border-bottom: 1px solid var(--w-border);
  margin-bottom: 14px;
}
.res {
  padding: 16px;
  border-bottom: 1px solid var(--w-border-faint);
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s ease;
}
.res:hover { background: var(--w-card-hover); }
.rtop { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.rwho { font-weight: 700; font-size: 14px; color: var(--w-text); }
.rdate { color: var(--w-text-muted); font-size: 12px; }
.rsubj { color: var(--w-accent); font-weight: 700; font-size: 14px; margin-bottom: 6px; }
.rsnip { color: var(--w-text-muted); font-size: 13px; line-height: 1.5; }
.rsnip mark { background: rgba(245, 158, 11, 0.35); color: #fef08a; border-radius: 3px; padding: 0 4px; }

.svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 960px) {
  .wmail-hud { grid-template-columns: repeat(2, 1fr); }
  .wmail-sidebar { display: none; }
  .brand-area { width: auto; }
  .wmail-shell { width: 100%; margin: 0; border-radius: 0; height: calc(100vh - 60px); border: none; }
  .who { width: 140px; }
  .snip { display: none; }
}

@media print {
  body { background: #ffffff !important; color: #000000 !important; height: auto !important; overflow: visible !important; }
  #navbar-placeholder, .wmail-hud, .wmail-topbar, .wmail-sidebar, .tv-action-bar, footer { display: none !important; }
  .wmail-shell { height: auto !important; border: none !important; box-shadow: none !important; }
  .card { break-inside: avoid; border: 1px solid #ccc !important; box-shadow: none !important; margin-bottom: 20px !important; }
  .card-body { display: block !important; }
  .cx { background: transparent !important; color: #000000 !important; border: 1px solid #000000 !important; }
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

<main id="main-content" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
  <!-- HUD Métriques probatoires -->
  <div class="wmail-hud">
    <div class="hud-card">
      <div class="hud-icon">📨</div>
      <div class="hud-meta">
        <span class="hud-value">${rawMessages.length}</span>
        <span class="hud-label">Correspondances citoyennes</span>
      </div>
    </div>
    <div class="hud-card">
      <div class="hud-icon">📁</div>
      <div class="hud-meta">
        <span class="hud-value">${threadList.length}</span>
        <span class="hud-label">Dossiers d'enquête &amp; Fils</span>
      </div>
    </div>
    <div class="hud-card">
      <div class="hud-icon">📎</div>
      <div class="hud-meta">
        <span class="hud-value">32</span>
        <span class="hud-label">Pièces probatoires &amp; Relevés</span>
      </div>
    </div>
    <div class="hud-card">
      <div class="hud-icon">🛡️</div>
      <div class="hud-meta">
        <span class="hud-value">100%</span>
        <span class="hud-label">Caviardage actif (Loi 25)</span>
      </div>
    </div>
  </div>

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
        <input id="search" placeholder="Rechercher dans les correspondances (ECCC, MPO, CCE, AIPRP, Stablex...)" aria-label="Recherche">
        <button class="icon-btn search-clear" id="clear" aria-label="Effacer">
          <svg class="svg" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>
        </button>
      </div>

      <div class="wmail-actions">
        <button class="icon-btn theme-switch-btn" id="themeSwitch" title="Basculer le thème Sombre / Clair" aria-label="Changer de thème">
          🌙
        </button>
        <a href="correspondance.html" class="icon-btn" title="Politique relative aux communications &amp; Déontologie" aria-label="Politique de correspondance">
          <svg class="svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </a>
        <a href="registre.html" class="icon-btn" title="Accéder au registre officiel CCE" aria-label="Registre officiel CCE">
          <svg class="svg" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
        </a>
        <div class="wmail-avatar" title="William Guindon (Auteur citoyen SEM-26-003)">WG</div>
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
          <button class="nav-item" data-nav="stablex">
            <span class="nav-icon"><svg class="svg" viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11m-8-11v11"/></svg></span>
            <span class="nav-label">Stablex (Silence corporatif)</span>
            <span class="nav-count">${threadList.filter(x => x.category === 'stablex' || x.isStablex).length}</span>
          </button>
        </nav>

        <div class="sidebar-divider"></div>

        <div class="labels-header">Catégories</div>
        <button class="label-row" data-lab="signalement">
          <i class="label-tag" style="background:#ef4444;color:#ef4444"></i>
          <span class="nav-label">Application de la loi &amp; Pêches</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'signalement').length}</span>
        </button>
        <button class="label-row" data-lab="eccc">
          <i class="label-tag" style="background:#3b82f6;color:#3b82f6"></i>
          <span class="nav-label">ECCC &amp; Ministères</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'eccc').length}</span>
        </button>
        <button class="label-row" data-lab="cce">
          <i class="label-tag" style="background:#10b981;color:#10b981"></i>
          <span class="nav-label">CCE / ACEUM &amp; Traités</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'cce').length}</span>
        </button>
        <button class="label-row" data-lab="aiprp">
          <i class="label-tag" style="background:#06b6d4;color:#06b6d4"></i>
          <span class="nav-label">AIPRP &amp; Accès à l'information</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'aiprp').length}</span>
        </button>
        <button class="label-row" data-lab="lep">
          <i class="label-tag" style="background:#a855f7;color:#a855f7"></i>
          <span class="nav-label">Espèces en péril (LEP)</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'lep').length}</span>
        </button>
        <button class="label-row" data-lab="stablex">
          <i class="label-tag" style="background:#f59e0b;color:#f59e0b"></i>
          <span class="nav-label">Stablex &amp; Cellule 6</span>
          <span class="nav-count">${threadList.filter(x => x.category === 'stablex').length}</span>
        </button>

        <div class="sidebar-disclaimer">
          <strong>Registre officiel SEM-26-003 :</strong> ${rawMessages.length} correspondances officielles et citoyennes versées au dossier public. Renseignements personnels biffés (Loi 25).
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
            <button class="wmail-tab" data-tab="cce"><svg class="svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>CCE &amp; ACEUM</span></button>
            <button class="wmail-tab" data-tab="aiprp"><svg class="svg" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg><span>AIPRP &amp; Clé USB</span></button>
          </div>
          <div class="wmail-counter-meta">
            <span id="counter">${threadList.length} dossiers · ${rawMessages.length} courriels</span>
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

<!-- Modale d'inspection de pièce probatoire -->
<div class="evidence-modal-backdrop" id="evidenceModal" onclick="closeEvidenceModal(event)">
  <div class="evidence-modal" onclick="event.stopPropagation()">
    <div class="evidence-header">
      <div class="evidence-title">Fiche de la pièce probatoire</div>
      <button class="evidence-close" onclick="closeEvidenceModal()">✕</button>
    </div>
    <div class="evidence-body">
      <p>Cette pièce probatoire a été officiellement versée et annexée au dossier de communication citoyenne SEM-26-003.</p>
      <div class="evidence-meta-row" id="evidenceMeta"></div>
      <p style="font-size:12px;color:var(--w-text-dim);margin-top:12px;">Conformément aux règles de confidentialité et aux accords de transmission, les données brutes ont été vérifiées et versées aux registres fédéraux et internationaux.</p>
    </div>
  </div>
</div>

<!-- Toast interactif -->
<div class="wmail-toast" id="wmailToast">Transcription copiée dans le presse-papier !</div>

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
  var themeBtn = document.getElementById('themeSwitch');

  // Gestion du Thème Sombre / Clair
  var currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('wg_theme', theme); } catch (_) {}
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

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

  // Copie de fil de discussion dans le presse-papier
  document.querySelectorAll('.copy-thread-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var tid = btn.getAttribute('data-tid');
      var tv = document.getElementById('tv-' + tid);
      if(!tv) return;
      var text = tv.innerText;
      navigator.clipboard.writeText(text).then(function(){
        var toast = document.getElementById('wmailToast');
        if(toast){
          toast.style.display = 'block';
          setTimeout(function(){ toast.style.display = 'none'; }, 2500);
        }
      });
    });
  });

  // Recherche plein texte sécurisée (DOM pur sans innerHTML)
  function doSearch(val){
    var q = (val || '').trim().toLowerCase();
    clearB.style.display = q.length > 0 ? 'grid' : 'none';
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

    if (typeof results.replaceChildren === 'function') {
      results.replaceChildren();
    } else {
      results.textContent = '';
    }

    var head = document.createElement('div');
    head.className = 'res-head';
    var bCnt = document.createElement('b');
    bCnt.textContent = hits.length;
    head.appendChild(bCnt);
    head.appendChild(document.createTextNode(' résultat(s) pour « ' + val + ' »'));
    results.appendChild(head);

    if(!hits.length){
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:30px 10px;text-align:center;color:var(--w-text-muted);';
      empty.textContent = 'Aucune correspondance trouvée dans les correspondances.';
      results.appendChild(empty);
    } else {
      hits.slice(0, 40).forEach(function(hit){
        var resDiv = document.createElement('div');
        resDiv.className = 'res';
        resDiv.setAttribute('data-tid', hit.tid);

        var rtop = document.createElement('div');
        rtop.className = 'rtop';
        var rwho = document.createElement('span');
        rwho.className = 'rwho';
        rwho.textContent = hit.who;
        rtop.appendChild(rwho);
        resDiv.appendChild(rtop);

        var rsubj = document.createElement('div');
        rsubj.className = 'rsubj';
        rsubj.textContent = hit.title;
        resDiv.appendChild(rsubj);

        var rsnip = document.createElement('div');
        rsnip.className = 'rsnip';
        var pos = hit.raw.toLowerCase().indexOf(q);
        var s = Math.max(0, pos - 40);
        var e = Math.min(hit.raw.length, pos + q.length + 60);
        var snippetText = hit.raw.substring(s, e);
        
        // Mettre en valeur le mot-clé de façon sécurisée (nœuds texte + balise mark)
        var escapedQ = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var parts = snippetText.split(new RegExp('(' + escapedQ + ')', 'gi'));
        rsnip.appendChild(document.createTextNode('… '));
        parts.forEach(function(p){
          if (p.toLowerCase() === q) {
            var mark = document.createElement('mark');
            mark.textContent = p;
            rsnip.appendChild(mark);
          } else {
            rsnip.appendChild(document.createTextNode(p));
          }
        });
        rsnip.appendChild(document.createTextNode(' …'));
        resDiv.appendChild(rsnip);

        results.appendChild(resDiv);
      });
    }
  }

  search.addEventListener('input', function(){ doSearch(search.value); });
  clearB.addEventListener('click', function(){
    search.value = '';
    clearB.style.display = 'none';
    goList(true);
  });

  results.addEventListener('click', function(e){
    var r = e.target.closest('.res');
    if(!r) return;
    var tid = r.getAttribute('data-tid');
    if(tid) openThreadById(tid, true);
  });

  function updateCounter() {
    var visibleRows = Array.from(rows).filter(function(r){ return r.style.display !== 'none'; });
    var cntEl = document.getElementById('counter');
    if(cntEl){
      cntEl.textContent = visibleRows.length + ' dossier' + (visibleRows.length > 1 ? 's' : '') + ' affiché' + (visibleRows.length > 1 ? 's' : '');
    }
  }

  // Filtres latéraux
  navItems.forEach(function(nav){
    nav.addEventListener('click', function(){
      navItems.forEach(function(x){ x.classList.remove('active'); });
      labelRows.forEach(function(x){ x.classList.remove('active'); });
      nav.classList.add('active');
      var filter = nav.getAttribute('data-nav');
      goList(false);
      rows.forEach(function(row){
        if(filter === 'all') row.style.display = 'flex';
        else if(filter === 'starred') row.style.display = row.getAttribute('data-key') === '1' ? 'flex' : 'none';
        else if(filter === 'sent') row.style.display = row.querySelector('.who').textContent.indexOf('William') !== -1 ? 'flex' : 'none';
        else if(filter === 'stablex') row.style.display = (row.getAttribute('data-cat') === 'stablex' || row.getAttribute('data-stablex') === '1') ? 'flex' : 'none';
      });
      updateCounter();
    });
  });

  // Filtres par étiquette
  labelRows.forEach(function(l){
    l.addEventListener('click', function(){
      labelRows.forEach(function(x){ x.classList.remove('active'); });
      navItems.forEach(function(x){ x.classList.remove('active'); });
      l.classList.add('active');
      var cat = l.getAttribute('data-lab');
      goList(false);
      rows.forEach(function(row){
        row.style.display = row.getAttribute('data-cat') === cat ? 'flex' : 'none';
      });
      updateCounter();
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
      updateCounter();
    });
  });

  // Menu repliable
  if(menuBtn){
    menuBtn.addEventListener('click', function(){
      sidebar.classList.toggle('collapsed');
    });
  }

  // Raccourcis clavier Pro
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(e.key === 'Escape' || e.key === 'u'){
      goList(true);
    } else if(e.key === '/'){
      e.preventDefault();
      search.focus();
    }
  });

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

// Fonctions modale de pièce probatoire sécurisées (DOM pur)
function openEvidenceModal(pieceName, msgNum, filId) {
  var modal = document.getElementById('evidenceModal');
  var metaEl = document.getElementById('evidenceMeta');
  if (modal && metaEl) {
    if (typeof metaEl.replaceChildren === 'function') {
      metaEl.replaceChildren();
    } else {
      metaEl.textContent = '';
    }
    
    var line1 = document.createElement('div');
    line1.appendChild(document.createTextNode('Fichier : '));
    var strong = document.createElement('strong');
    strong.textContent = decodeURIComponent(pieceName);
    line1.appendChild(strong);
    metaEl.appendChild(line1);

    var line2 = document.createElement('div');
    line2.textContent = 'Enregistrement : Message #' + msgNum + ' · Fil : ' + filId;
    metaEl.appendChild(line2);

    var line3 = document.createElement('div');
    line3.textContent = 'Statut légal : Versé au registre public SEM-26-003';
    metaEl.appendChild(line3);

    modal.style.display = 'grid';
  }
}

function closeEvidenceModal(e) {
  var modal = document.getElementById('evidenceModal');
  if (modal) modal.style.display = 'none';
}
</script>
<script defer src="https://cloud.umami.is/script.js" data-website-id="33fe2e14-a15b-46f7-9246-dc61b1ca20a9"></script>
</body>
</html>`;

fs.writeFileSync('/Users/williamguindon/WilliamGuindon/wmail.html', fullHtml, 'utf8');
console.log('✔ wmail.html régénéré sans brouillons/traceurs, sans heures exactes et sans footer !');
