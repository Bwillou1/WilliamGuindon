/**
 * Générateur de la page wmail.html (Archive des correspondances ministérielles ECCC / MPO)
 * Fork vierge de l'interface Wmail, caviardé et adapté au dossier SEM-26-003.
 */

const fs = require('fs');
const path = require('path');

const wmailHtmlPath = path.join(__dirname, '..', 'wmail.html');

// Données structurées des 20 conversations (regroupant l'intégralité des 96 messages ECCC & MPO)
const threads = [
  {
    id: "t1",
    num: "1",
    subject: "Demande formelle d'enquête – Violations présumées LCOM et Loi sur les pêches au site Stablex (Blainville)",
    category: "signalement",
    catLabel: "Application de la loi & Pêches",
    catColor: "#d93025",
    date: "3 juin 2026",
    messagesCount: 5,
    preview: "Demande d'ouverture d'enquête sur des violations présumées de la LCOM (déboisement) et de l'art. 36(3) de la Loi sur les pêches (cadmium jusqu'à 340x les normes).",
    starred: true,
    messages: [
      {
        msgNum: 1,
        sender: "William Guindon",
        senderRole: "Citoyen soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "Julie Dabrusin (ministre-minister@ec.gc.ca, Julie.Dabrusin@parl.gc.ca)",
        cc: "vincent.pretty@ec.gc.ca",
        date: "3 juin 2026, 09:17 HAE",
        bodyHtml: `<div class="doc-summary"><p><b>Envoi initial :</b> Demande formelle d'enquête relative aux violations présumées de la Loi de 1994 sur la convention concernant les oiseaux migrateurs (LCOM) et de la Loi sur les pêches au site Stablex à Blainville. Envoi technique suivi immédiatement du mémoire détaillé (Message 2).</p></div>`
      },
      {
        msgNum: 2,
        sender: "William Guindon",
        senderRole: "Citoyen soumetteur (14 ans)",
        senderAvatar: "WG",
        recipient: "Julie Dabrusin (ministre-minister@ec.gc.ca, Julie.Dabrusin@parl.gc.ca)",
        cc: "vincent.pretty@ec.gc.ca, DFO.Minister-Ministre.MPO@dfo-mpo.gc.ca",
        date: "3 juin 2026, 09:38 HAE",
        attach: "aperçu.png (194 Ko)",
        bodyHtml: `<p><b>Madame la Ministre,</b></p>
<p>Je suis William Guindon résident de Blainville, et j'ai 14 ans. Je vous écris pour demander formellement l'ouverture d'une enquête sur des violations présumées des lois fédérales suivantes au site d'enfouissement de déchets dangereux de Stablex Canada Inc. à Blainville :</p>
<ul>
  <li><b>Loi de 1994 sur la convention concernant les oiseaux migrateurs (LCOM)</b>, article 5.1(1), et Règlement sur les oiseaux migrateurs, 2022, article 5 — Destruction ou perturbation de nids et d'habitat durant la période de nidification (travaux de déboisement réalisés en avril 2025, juste avant l'entrée en vigueur renforcée des protections le 15 avril).</li>
  <li><b>Loi sur les pêches</b>, article 36(3) — Rejet de substances nocives (notamment cadmium) dans des eaux fréquentées par le poisson.</li>
</ul>
<p>Des analyses indépendantes réalisées par des citoyens (avec l'appui de Mères au Front, du biologiste Daniel Green et de la Société pour vaincre la pollution) ont révélé des concentrations de cadmium jusqu'à 320 à 340 fois supérieures aux normes dans les fossés et cours d'eau adjacents au site (ruisseau Lockhead et milieux humides de la Grande Tourbière de Blainville). Ces eaux constituent de l'habitat pour le poisson et des oiseaux migrateurs protégés.</p>
<div class="note"><b>Note probatoire :</b> Première sommation écrite formelle transmise aux ministères fédéraux ECCC et MPO dès l'admission initiale de la soumission CCE.</div>`
      },
      {
        msgNum: 3,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet de Julie Dabrusin",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "3 juin 2026, 13:17 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé de réception automatique ministériel (ECCC) :</b> Confirmation de réception du cabinet de l'honorable Julie Dabrusin. Mention standard indiquant que le message « sera examiné avec soin » par l'Unité de la correspondance ministérielle.</p></div>`
      },
      {
        msgNum: 4,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet ministériel",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "3 juin 2026, 13:39 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé de réception automatique (ECCC) :</b> Confirmation standard relative au second envoi avec pièce jointe.</p></div>`
      },
      {
        msgNum: 5,
        sender: "Minister / Ministre (DFO/MPO)",
        senderRole: "Cabinet Pêches et Océans Canada",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "3 juin 2026, 13:39 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé de réception automatique (MPO) :</b> Confirmation de réception au nom de la ministre des Pêches et Océans (Hon. Joanne Thompson / Unité de la correspondance ministérielle).</p></div>`
      }
    ]
  },
  {
    id: "t2",
    num: "2",
    subject: "Suivi formel et demande de numéro de suivi officiel d'enquête ECCC",
    category: "eccc",
    catLabel: "ECCC — Correspondance",
    catColor: "#0b57d0",
    date: "10 juin 2026",
    messagesCount: 2,
    preview: "Demande du numéro de suivi d'enquête officiel et du nom de la direction générale chargée de l'analyse des pièces jointes.",
    messages: [
      {
        msgNum: 6,
        sender: "William Guindon",
        senderRole: "Citoyen soumetteur (14 ans)",
        senderAvatar: "WG",
        recipient: "ministre-minister@ec.gc.ca, Julie.Dabrusin@parl.gc.ca",
        date: "10 juin 2026, 12:02 HAE",
        bodyHtml: `<p>Bonjour,</p>
<p>J'ai bien reçu votre accusé de réception automatique. Le dossier étant directement lié à une soumission internationale urgente auprès de la CCE (SEM-26-003), pourriez-vous me <b>confirmer le numéro de suivi officiel</b> attribué à ma demande ainsi que le <b>nom de la direction générale</b> qui procède actuellement à l'analyse de mes pièces jointes ?</p>
<p>Cordialement,<br><b>William Guindon (14 ans)</b></p>`
      },
      {
        msgNum: 7,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet ministériel",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "10 juin 2026, 16:03 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Réponse automatique standard :</b> Nouvel accusé de réception automatique du cabinet ministériel réitérant la prise en charge sans communiquer de numéro de suivi ni de direction d'enquête.</p></div>`
      }
    ]
  },
  {
    id: "t3",
    num: "3",
    subject: "Signalement formel d'infractions environnementales fédérales — Projet Stablex à Blainville",
    category: "signalement",
    catLabel: "Application de la loi & Pêches",
    catColor: "#d93025",
    date: "14 juin 2026",
    messagesCount: 2,
    preview: "Transmission officielle à Enviroinfo avec copie à la Division de l'application de la loi (enforcement-applicationloi@ec.gc.ca) et à la CCE.",
    starred: true,
    messages: [
      {
        msgNum: 8,
        sender: "William Guindon",
        senderRole: "Auteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "enviroinfo@ec.gc.ca",
        cc: "notification@ec.gc.ca, enforcement-applicationloi@ec.gc.ca, dmd-gmd@ec.gc.ca, sem@cec.org, psolano@cec.org",
        date: "14 juin 2026, 11:14 HAE",
        bodyHtml: `<p><b>NOTE À L'ATTENTION DU SECRÉTARIAT DE LA CCE (Dossier SEM-26-003) :</b> Ce courriel est mis en copie conforme (CC) uniquement pour prouver l'envoi de la notification écrite obligatoire aux autorités compétentes. Ce message ne constitue pas mon dépôt de communication révisée finale, lequel vous sera transmis officiellement avant la date limite du 3 août 2026.</p>
<hr>
<p><b>Madame, Monsieur le Ministre de l'Environnement du Canada,</b></p>
<p>Par la présente, je vous signale formellement des omissions majeures dans l'application effective des lois environnementales fédérales concernant les activités d'excavation et d'enfouissement de déchets dangereux de l'entreprise Stablex dans la Grande Tourbière de Blainville et le secteur des lacs Fauvel.</p>
<p>En tant que citoyen canadien de 14 ans, je vous soumets les infractions suivantes :</p>
<ul>
  <li><b>Loi de 1994 sur la convention concernant les oiseaux migrateurs (LCOM — art. 5 et 6)</b> et son Règlement de 2022 : les activités d'excavation se déroulent en pleine période de nidification d'oiseaux migrateurs, détruisant des nids actifs contenant des oiseaux vivants ou des œufs viables dans la Grande Tourbière.</li>
  <li><b>Loi sur les espèces en péril (LEP)</b> : destruction d'habitats essentiels abritant des espèces vulnérables ou menacées recensées.</li>
</ul>`
      },
      {
        msgNum: 9,
        sender: "Enviroinfo (ECCC)",
        senderRole: "Centre de renseignements à la population",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "14 juin 2026, 15:14 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé de réception EnviroInfo :</b> Accusé de réception standard d'ECCC mentionnant la transmission aux services compétents (délai de réponse habituel de 10 à 15 jours ouvrables).</p></div>`
      }
    ]
  },
  {
    id: "t4",
    num: "4",
    subject: "Demande formelle de clarification à Stablex avec notification à l'Application de la loi (ECCC)",
    category: "stablex",
    catLabel: "Stablex & Application",
    catColor: "#e8710a",
    date: "16–26 juin 2026",
    messagesCount: 4,
    preview: "Questions écrites sur la cellule 6 avec copie à ec.enforcement-applicationdelaloi.ec@canada.ca, et constat de rebonds sur adresses régionales DFO.",
    messages: [
      {
        msgNum: 10,
        sender: "William Guindon",
        senderRole: "Auteur SEM-26-003 (14 ans)",
        senderAvatar: "WG",
        recipient: "info@stablex.com, receivable.stablex@stablex.com, labo@stablex.com, comite.consultatif@stablex.com",
        cc: "ATIP-AIPRP@ec.gc.ca, ec.enforcement-applicationdelaloi.ec@canada.ca, info@cqde.org, DFO.Quebec@dfo-mpo.gc.ca",
        date: "16 juin 2026, 15:35 HAE",
        attach: "IMG_0411.jpeg (607 Ko), 36-DET_fr.pdf (2,6 Mo)",
        bodyHtml: `<p><b>À l'attention du responsable légal et du service environnement de Stablex Canada Inc.</b></p>
<p>Je suis William Guindon, âgé de 14 ans, résident de Blainville. Je m'engage activement pour la protection de l'environnement et de la biodiversité locale. Je suis l'auteur de la communication citoyenne SEM-26-003 déposée le 4 mai 2026 auprès de la Commission de coopération environnementale (CCE) dans le cadre de l'ACEUM.</p>
<p>Cette communication porte sur l'omission présumée du Canada d'appliquer efficacement ses lois fédérales (LEP, Loi sur les pêches et LCPE) concernant les activités d'enfouissement de matières dangereuses à Blainville, particulièrement dans la cellule 6.</p>
<p>Afin de permettre au Secrétariat de la CCE d'évaluer correctement la version révisée, je vous adresse une série de demandes de précisions sur la gestion des eaux de lixiviat et l'absence d'autorisations en vertu de la Loi sur les pêches.</p>`
      },
      {
        msgNum: 11,
        sender: "postmaster@dfo-mpo.gc.ca",
        senderRole: "Système de messagerie DFO",
        senderAvatar: "SYS",
        recipient: "<span class='cx' title='Caviardé : Courriel citoyen'>contact@williamguindon.me</span>",
        date: "16 juin 2026, 15:39 HAE",
        bodyHtml: `<div class="doc-summary"><p><b>Rapport de non-remise (Rebond technique) :</b> L'adresse générique régionale <code>DFO.Quebec@dfo-mpo.gc.ca</code> n'existe pas ou rejette les courriels externes (code 550 5.1.10). Démontre les difficultés structurelles d'accès aux canaux régionaux du MPO.</p></div>`
      },
      {
        msgNum: 26,
        sender: "William Guindon",
        senderRole: "Auteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "info@stablex.com",
        cc: "ec.enforcement-applicationdelaloi.ec@canada.ca",
        date: "26 juin 2026, 11:15 HAE",
        bodyHtml: `<p>Messieurs,</p>
<p>Je me permets de revenir vers vous concernant ma demande de clarification envoyée le 16 juin dernier, pour laquelle notre échéance commune était fixée au 30 juin. À l'approche de cette date et en vue de la finalisation de ma soumission révisée pour le Secrétariat de la CCE, je réitère ma demande de réponse écrite sur vos autorisations fédérales.</p>`
      },
      {
        msgNum: 27,
        sender: "postmaster@dfo-mpo.gc.ca",
        senderRole: "Système de messagerie DFO",
        senderAvatar: "SYS",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        date: "26 juin 2026, 11:15 HAE",
        bodyHtml: `<div class="doc-summary"><p><b>Rebond technique récurrent :</b> Rejet automatisé de l'adresse régionale MPO.</p></div>`
      }
    ]
  },
  {
    id: "t5",
    num: "5",
    subject: "Notification écrite préalable obligatoire (ACEUM art. 24.27(2)(e)) — Dossier CCE SEM-26-003",
    category: "cce",
    catLabel: "CCE & Traités internationaux",
    catColor: "#188038",
    date: "19–20 juin 2026",
    messagesCount: 8,
    preview: "Notification légale transmise à la CCE et simultanément à l'ensemble des autorités fédérales compétentes ECCC et MPO pour satisfaire les critères de recevabilité de l'accord commercial.",
    starred: true,
    messages: [
      {
        msgNum: 12,
        sender: "William Guindon",
        senderRole: "Citoyen soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "sem@cec.org",
        cc: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span> (CCI transmise à l'ensemble des directions ECCC et MPO)",
        date: "19 juin 2026, 14:12 HAE",
        bodyHtml: `<p><b>NOTE À L'ATTENTION DU SECRÉTARIAT DE LA CCE (Dossier SEM-26-003) :</b></p>
<p>Ce courriel est transmis en copie conforme invisible (CCI) simultanément à l'ensemble des ministères, directions générales, services de protection de la faune et de l'habitat, ainsi qu'aux bureaux d'enquête d'Environnement Canada et de Pêches et Océans Canada concernés par ce dossier. L'intégralité des autorités fédérales compétentes est officiellement notifiée par le présent envoi, lequel est certifié légalement.</p>
<p><i>Ce message constitue la preuve de notification écrite obligatoire (art. 24.27(2)e) de l'ACEUM) et ne remplace pas mon dépôt de communication révisée finale, lequel sera transmis au Secrétariat de la CCE par un envoi distinct avant la date limite du 3 août 2026.</i></p>
<hr>
<p><b>Madame la Ministre, Monsieur le Ministre,</b></p>
<p>Je vous adresse la présente notification afin de porter officiellement à votre attention des faits documentés de non-conformité avec les lois environnementales fédérales sur le site de l'entreprise Stablex Canada Inc., à Blainville (Québec), notamment dans le secteur de la Grande Tourbière et des milieux humides adjacents.</p>`
      },
      {
        msgNum: 13,
        sender: "postmaster@dfo-mpo.gc.ca",
        senderRole: "Système de rebond DFO",
        senderAvatar: "SYS",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        date: "19–20 juin 2026",
        bodyHtml: `<div class="doc-summary"><p><b>Synthèse des avis de non-remise techniques (Messages 13 à 17, 22 et 23) :</b> Défaillance de routage sur plusieurs adresses régionales internes de Pêches et Océans Canada (<code>DFO.MPO.Quebec@dfo-mpo.gc.ca</code>, <code>dfoquebec@dfo-mpo.gc.ca</code>, <code>DFO.SpeciesatRisk-Especesenperil.MPO@dfo-mpo.gc.ca</code>, <code>FormulairesPE-PhEForms.XQUE@dfo-mpo.gc.ca</code>, <code>XQUEHabitat@dfo-mpo.gc.ca</code>, <code>lep-sar.quebec@dfo-mpo.gc.ca</code>). Seuls les cabinets ministériels et les répondeurs centraux ont reçu la notification.</p></div>`
      },
      {
        msgNum: 18,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet ministériel",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "19 juin 2026, 18:12 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé officiel ECCC :</b> Le cabinet de la ministre Julie Dabrusin accuse réception de la notification écrite préalable ACEUM.</p></div>`
      },
      {
        msgNum: 19,
        sender: "Enviroinfo (ECCC)",
        senderRole: "Direction de l'information",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "19 juin 2026, 18:12 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé EnviroInfo :</b> Accusé automatique confirmant la réception de la notification.</p></div>`
      },
      {
        msgNum: 20,
        sender: "Minister / Ministre (DFO/MPO)",
        senderRole: "Cabinet ministériel",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "19 juin 2026, 18:12 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé officiel MPO :</b> Le cabinet ministériel de Pêches et Océans Canada accuse réception de la notification préalable.</p></div>`
      }
    ]
  },
  {
    id: "t6",
    num: "6",
    subject: "Demande d'information publique concernant l'agrandissement de Stablex",
    category: "eccc",
    catLabel: "ECCC — Correspondance",
    catColor: "#0b57d0",
    date: "26 juin 2026",
    messagesCount: 2,
    preview: "Demande de transmission des données et registres publics disponibles auprès d'Enviroinfo.",
    messages: [
      {
        msgNum: 25,
        sender: "William Guindon",
        senderRole: "Chercheur citoyen",
        senderAvatar: "WG",
        recipient: "enviroinfo@ec.gc.ca",
        date: "26 juin 2026, 11:08 HAE",
        bodyHtml: `<p>Bonjour,</p>
<p>Dans le cadre de recherches citoyennes concernant le projet d'agrandissement de Stablex à Blainville, je sollicite votre aide pour obtenir une information publique relative aux avis environnementaux émis par le ministère fédéral.</p>`
      },
      {
        msgNum: 28,
        sender: "Enviroinfo (ECCC)",
        senderRole: "Centre d'information ECCC",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "26 juin 2026, 15:09 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé de réception automatique EnviroInfo</b>.</p></div>`
      }
    ]
  },
  {
    id: "t7",
    num: "7",
    subject: "Dossier PIC-20260615-082854 — Demande formelle de rencontre citoyenne ou de réponse écrite",
    category: "eccc",
    catLabel: "ECCC — Correspondance",
    catColor: "#0b57d0",
    date: "28–29 juin 2026",
    messagesCount: 5,
    preview: "Attribution du numéro officiel ECCC PIC-20260615-082854. Transmission confirmée au bureau de Julie Dabrusin et aux experts du programme, début des 119 jours de silence.",
    starred: true,
    messages: [
      {
        msgNum: 29,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "enviroinfo@ec.gc.ca",
        cc: "ec.enviroinfo.ec@canada.ca",
        date: "28 juin 2026, 20:37 HAE",
        bodyHtml: `<p>Bonjour,</p>
<p>Je vous écris à titre de soumetteur individuel dans le cadre de la communication SEM-26-003 déposée auprès de la Commission de coopération environnementale, en vertu de l'article 24.27 de l'ACEUM, concernant le dossier Stablex à Blainville, Québec.</p>
<p>Je sollicite une courte rencontre en visioconférence ou une réponse écrite détaillée afin de clarifier les compétences de surveillance exercées sur le terrain par vos inspecteurs.</p>`
      },
      {
        msgNum: 31,
        sender: "Habitat Quebec (DFO/MPO)",
        senderRole: "Protection du poisson et de son habitat",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "29 juin 2026, 00:38 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé du Programme de protection de l'habitat (MPO) :</b> Confirmation de réception par la Direction régionale de la gestion des écosystèmes (adresse dfo.habitatquebec.mpo@dfo-mpo.gc.ca).</p></div>`
      },
      {
        msgNum: 34,
        sender: "Enviroinfo (ECCC)",
        senderRole: "Direction de l'information ministérielle",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "29 juin 2026, 18:32 UTC",
        bodyHtml: `<p>Bonjour William Guindon,</p>
<p>Merci d'avoir contacté Environnement et Changement climatique Canada (ECCC).</p>
<p><b>Nous accusons réception des courriels que vous avez acheminés à ECCC (Dossier officiel : PIC-20260615-082854).</b> Pour votre information, l'ensemble de vos correspondances a été formellement transmis au bureau de la ministre Julie Dabrusin ainsi qu'aux experts du programme pour analyse.</p>`
      },
      {
        msgNum: 33,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "Enviroinfo (ECCC), julie.dabrusin@parl.gc.ca",
        date: "29 juin 2026, 15:15 HAE",
        attach: "18_juin_fuite_CCBC6S_4.jpg, 10mars_CCBC6S_2.jpg, 8_oct_fuite_CCBC6S.jpg",
        bodyHtml: `<p>Bonjour,</p>
<p>J'ai pris note de votre courriel du 29 juin 2026, dans lequel vous indiquez que « les courriels » que j'ai acheminés à ECCC ont été transmis au bureau de la ministre Julie Dabrusin et aux experts du programme.</p>
<p>Je note que votre courriel constitue, à ce jour, la seule réponse directe émanant de vos services. Je joins au dossier trois photographies documentant des déversements et des fuites constatées sur la cellule 6.</p>
<div class="note"><b>Point tournant :</b> Cet accusé officiel d'ECCC marque le début des <b>119 jours de silence radio</b> du gouvernement fédéral envers le citoyen, pendant que les lobbyistes de Stablex étaient reçus en privé au ministère.</div>`
      }
    ]
  },
  {
    id: "t8",
    num: "8",
    subject: "Dépôt de la soumission SEM-26-003 : Le travail d'un citoyen de 14 ans face au silence de l'État",
    category: "cce",
    catLabel: "CCE & Traités internationaux",
    catColor: "#188038",
    date: "15 juillet 2026",
    messagesCount: 2,
    preview: "Lettre officielle à ECCC, MPO, MELCCFP et Stablex annonçant le dépôt de 35 000 mots et 281 heures de recherche citoyenne bénévole.",
    starred: true,
    messages: [
      {
        msgNum: 35,
        sender: "William Guindon",
        senderRole: "Citoyen de 14 ans, Blainville",
        senderAvatar: "WG",
        recipient: "Enviroinfo (ECCC), Julie.Dabrusin@parl.gc.ca, info@stablex.com",
        cc: "DFO.Minister-Ministre.MPO@dfo-mpo.gc.ca, services.clientele@mffp.gouv.qc.ca",
        date: "15 juillet 2026, 16:25 HAE",
        bodyHtml: `<p><b>Aux représentants d'Environnement et Changement climatique Canada, du Ministère de l'Environnement, de la Lutte contre les changements climatiques, de la Faune et des Parcs, et de la direction de Stablex,</b></p>
<p>Je vous écris aujourd'hui pour vous informer qu'en tant qu'auteur de la soumission SEM-26-003 concernant les activités dans la Grande Tourbière de Blainville, je déposerai formellement mon dossier complet ce vendredi auprès de la Commission de coopération environnementale (CCE).</p>
<p>Ce dossier contient plus de 35 000 mots, des données scientifiques indépendantes et documente l'omission d'appliquer de manière effective plusieurs lois environnementales.</p>
<p>Mais au-delà des faits techniques et juridiques, <b>je veux que vous sachiez qu'il y a un humain derrière ce dossier. Un jeune de 14 ans.</b></p>
<p>Pour monter cette soumission, j'ai dû passer plus de 281 heures seul. J'ai dû faire des recherches exhaustives, me rendre sur le terrain, observer les déversements et multiplier les demandes d'accès à l'information face au silence de vos institutions.</p>
<p>La réalité, c'est que ce n'était pas à moi de faire ce travail. C'était le vôtre. Un adolescent ne devrait pas avoir à sacrifier des centaines d'heures pour pallier le manque d'action des instances censées protéger l'environnement et l'avenir de sa génération.</p>
<p>Je vous invite à prendre connaissance de ce dossier lorsqu'il sera public en gardant cette réflexion en tête : le progrès ne se mesure pas au nombre de profits qu'on génère, mais au nombre de contaminants qu'on refuse de laisser à nos enfants.</p>
<p>Encore une fois, ne sous-estimez JAMAIS la jeunesse, c'est notre demain.</p>
<p>Salutations,</p>
<p><b>William Guindon</b><br>Citoyen de 14 ans, Blainville<br>Auteur de la communication SEM-26-003</p>`
      },
      {
        msgNum: 36,
        sender: "Minister / Ministre (DFO/MPO)",
        senderRole: "Cabinet ministériel",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "15 juillet 2026, 20:26 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique MPO</b>.</p></div>`
      }
    ]
  },
  {
    id: "t9",
    num: "9",
    subject: "Avis d'absence (Camp de cadets de Valcartier) et Accusé ministériel signé (MIN-334658)",
    category: "eccc",
    catLabel: "ECCC — Correspondance",
    catColor: "#0b57d0",
    date: "20–27 juillet 2026",
    messagesCount: 6,
    preview: "Transmission de l'avis d'absence de William (camp de cadets / 15e anniversaire) et réception d'un accusé officiel signé par le cabinet de Julie Dabrusin (MIN-334658).",
    messages: [
      {
        msgNum: 37,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "ministre-minister@ec.gc.ca",
        date: "20 juillet 2026, 08:03 HAP",
        bodyHtml: `<p>Bonjour, Merci pour votre message. Je suis actuellement absent et je ne pourrai pas répondre immédiatement.</p>
<p>Période d'absence : du 19 juillet 2026 au 13 août 2026 (camp de cadets à Valcartier + vacances). Ma soumission SEM-26-003 auprès de la CCE sera transmise pendant cette période. Mon 15e anniversaire aura lieu le 3 août 2026.</p>`
      },
      {
        msgNum: 38,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet de Julie Dabrusin",
        senderAvatar: "ECCC",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        cc: "petitions@oag-bvg.gc.ca",
        date: "20 juillet 2026, 15:03 UTC",
        attach: "ACCUSÉ DE RÉCEPTION SIGNÉ - Guindon - MIN 334658.pdf (58 Ko)",
        bodyHtml: `<p>Ce courriel est envoyé au nom de l'honorable Julie Dabrusin, ministre de l'Environnement, du Changement climatique et de la Nature.</p>
<p>Veuillez trouver ci-joint l'accusé de réception signé officiel pour le dossier <b>MIN 334658</b> (Pétition environnementale 0546 au BVG transmise aux ministères).</p>`
      },
      {
        msgNum: 40,
        sender: "Minister / Ministre (DFO/MPO)",
        senderRole: "Cabinet Pêches et Océans",
        senderAvatar: "MPO",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        cc: "petitions@oag-bvg.gc.ca",
        date: "22 juillet 2026, 17:40 UTC",
        attach: "2026-001-02117.pdf (154 Ko)",
        bodyHtml: `<p>Veuillez trouver ci-joint la réponse signée à votre correspondance adressée à la Ministre des Pêches (Dossier 2026-001-02117).</p>`
      },
      {
        msgNum: 41,
        sender: "William Guindon",
        senderRole: "Cdt Guindon (Valcartier)",
        senderAvatar: "WG",
        recipient: "info@stablex.com, enviroinfo@ec.gc.ca, dfo-mpo.gc.ca",
        date: "25 juillet 2026, 21:54 HAE",
        bodyHtml: `<p>Seulement pour vous aviser que ma soumission révisée est désormais disponible sur le registre officiel de la CCE.</p>
<p>Du membre équipe exp, cdt, Valcartier — Cdt Guindon.</p>`
      }
    ]
  },
  {
    id: "t10",
    num: "10",
    subject: "🚨 SIGNALEMENT PÉNAL FORMEL — Article 36(3) Loi sur les pêches & Incohérences INRP (Site Stablex / Lacs Fauvel)",
    category: "signalement",
    catLabel: "Application de la loi & Pêches",
    catColor: "#d93025",
    date: "6–20 août 2026",
    messagesCount: 6,
    preview: "Dépôt pénal à la Division de l'application de la loi (CNUE-NEEC) : cadmium à 4,7x la norme CVAC, poissons protégés, et fausses déclarations historiques à l'INRP (0 kg de rejet dans l'eau pendant 26 ans).",
    starred: true,
    messages: [
      {
        msgNum: 45,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "cnue-neec@ec.gc.ca (Division de l'application de la loi sur l'environnement, ECCC)",
        cc: "enviroinfo@ec.gc.ca, Esteban Salcedo (CCE)",
        date: "6 août 2026, 19:07 HAE",
        attach: "IMG_1843.jpeg, H05_Des_poissons_proteges_LeDevoir.pdf (2,4 Mo), F01_2026-06-10_Stablex_Rapport-WaterShed-1.pdf (3,2 Mo)",
        bodyHtml: `<p><b>À l'attention du Directeur de la Division de l'application de la loi sur l'environnement (ECCC),</b></p>
<p>Je vous soumets par la présente un signalement pénal formel visant des faits constitutifs d'une infraction continue à l'article 36(3) de la <i>Loi sur les pêches</i> (L.R.C. 1985, c. F-14) sur le site d'exploitation de la cellule n° 6 de Stablex Canada Inc. à Blainville (Lot 6 695 053, cadastre du Québec).</p>
<p><b>1. CADRE JURIDIQUE ET FAITS ALLÉGUÉS :</b><br>
Les activités de drainage et les rejets du site s'effectuent en l'absence de toute autorisation fédérale ou permis d'immersion délivré sous le régime de la <i>Loi sur les pêches</i>, confirmation obtenue auprès de Pêches et Océans Canada (MPO). Les faits documentés établissent le rejet et le risque de rejet de substances nocives dans des eaux fréquentées par le poisson ou dans des milieux hydriques raccordés au ruisseau Lockehead et aux lacs Fauvel.</p>
<p><b>2. PREUVES SCIENTIFIQUES ET MATÉRIELLES VERSÉES AU DOSSIER :</b></p>
<ul>
  <li>Rapport d'analyse WaterShed Monitoring du 10 juin 2026 : station d'échantillonnage FS-STB-2 (aval immédiat de la cellule n° 6), démontrant du cadmium à <b>4,7 fois le critère de toxicité chronique pour la vie aquatique (CVAC)</b>.</li>
  <li>Présence documentée d'espèces de poissons vulnérables et protégées dans le bassin hydrique du lac Fauvel et de la rivière aux Chiens.</li>
  <li>Chaîne de possession légale des échantillons certifiée par laboratoire accrédité.</li>
</ul>`
      },
      {
        msgNum: 46,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "cnue-neec@ec.gc.ca (Division de l'application de la loi)",
        date: "6 août 2026, 21:02 HAE",
        bodyHtml: `<p><b>COMPLÉMENT D'URGENCE – Soupçons de fausses déclarations à l'INRP et infractions cumulatives (Fiche CCE SEM-26-003)</b></p>
<p>À l'attention du Directeur de la Division de l'application de la loi sur l'environnement,</p>
<p>Je verse immédiatement au dossier de signalement pénal un élément critique démontrant de fortes probabilités de <b>fausses déclarations corporatives récurrentes</b> sous le régime de la <i>Loi canadienne sur la protection de l'environnement (1999)</i> :</p>
<p>Depuis environ 26 ans, Stablex Canada Inc. déclare historiquement à l'Inventaire national des rejets de polluants (INRP) une moyenne annuelle d'environ 40 kg de matières métalliques rejetées exclusivement dans l'<i>air</i>, tout en maintenant de manière systématique des déclarations de <b>0 kg dans les sols</b> et <b>0 kg dans l'eau</b>.</p>
<p>Or, cette modélisation de « zéro rejet hydrique et terrestre » est physiquement et biologiquement intenable compte tenu des cellules d'enfouissement à ciel ouvert et du ruissellement documenté vers les cours d'eau récepteurs.</p>`
      },
      {
        msgNum: 50,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "cnue-neec@ec.gc.ca",
        cc: "enviroinfo@ec.gc.ca",
        date: "8 août 2026, 10:06 HAE",
        bodyHtml: `<p><b>RELANCE : COMPLÉMENT D'URGENCE – Signalement pénal et INRP</b></p>
<p>À ce jour, je n'ai pas reçu d'accusé de réception ou de confirmation que ces informations ont été intégrées au dossier d'enquête. Compte tenu de la gravité des faits allégués (contradiction entre les déclarations à l'INRP et les mesures de terrain, risques de contamination persistante), je vous réitère ma demande formelle d'ordonner une vérification approfondie des registres internes de Stablex Canada Inc.</p>
<p>William T. L. T. Guindon<br>Soumetteur SEM-26-003 / ACEUM Art. 24.27<br><span class="cx" title="Caviardé : Coordonnées privées">[Téléphone personnel biffé]</span></p>`
      },
      {
        msgNum: 53,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "Enviroinfo (ECCC), DFO.HabitatQuebec.MPO@dfo-mpo.gc.ca",
        date: "9 août 2026, 11:57 HAE",
        attach: "IMG_1843.jpeg, H05_Des_poissons_proteges_LeDevoir.pdf, F01_2026-06-10_Stablex_Rapport-WaterShed-1.pdf",
        bodyHtml: `<div class="doc-summary"><p><b>Transmission d'urgence aux bureaux régionaux :</b> Transmission formelle de l'intégralité du mémoire pénal et des rapports scientifiques aux unités opérationnelles de protection des habitats aquatiques.</p></div>`
      },
      {
        msgNum: 61,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "ec.ue-e2.ec@canada.ca, ue-qc-e2@ec.gc.ca, ue-e2@ec.gc.ca",
        date: "20 août 2026, 11:26 HAE",
        bodyHtml: `<p>Le 17 août 2026, la CCE a jugé ma communication SEM-26-003 admissible. J'attends toujours une réponse à mes signalements du 6 et 9 août 2026. La CCE confirme que mes allégations méritent une réponse officielle du Canada.</p>`
      }
    ]
  },
  {
    id: "t11",
    num: "11",
    subject: "Demande formelle de recommandation de Décret d'urgence (Article 80 de la LEP) — Grande Tourbière de Blainville",
    category: "lep",
    catLabel: "Espèces en péril (LEP)",
    catColor: "#9334e6",
    date: "7–10 août 2026",
    messagesCount: 4,
    preview: "Requête statutaire à la ministre Julie Dabrusin demandant l'interruption des travaux de la cellule 6 en raison de menaces imminentes sur des espèces inscrites à l'Annexe 1.",
    starred: true,
    messages: [
      {
        msgNum: 47,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "ministre-minister@ec.gc.ca, Julie.Dabrusin@parl.gc.ca",
        cc: "ec.faune-wildlife.ec@canada.ca, min@dfo-mpo.gc.ca, petitions@oag-bvg.gc.ca, sem@cec.org",
        date: "7 août 2026, 13:59 HAE",
        bodyHtml: `<p><b>Madame la Ministre,</b></p>
<p>Je vous adresse la présente requête formelle afin de solliciter l'exercice immédiat de votre pouvoir statutaire prévu à l'<b>article 80 de la Loi sur les espèces en péril</b> (L.C. 2002, ch. 29) [LEP], requérant votre recommandation au gouverneur en conseil en vue d'émettre un <b>Décret d'urgence</b> pour la protection des espèces en péril et de leurs habitats dans le périmètre de la Grande Tourbière de Blainville.</p>
<p>La présente démarche vise à interrompre immédiatement les travaux d'aménagement, d'excavation, de drainage et de déboisement liés au projet de la cellule nº 6 de l'entreprise Stablex Canada Inc. (situé sur le lot 6 695 053 du cadastre du Québec), en raison de la <b>menace imminente</b> que ces activités font peser sur la survie et le rétablissement de plusieurs espèces inscrites à l'Annexe 1 de la LEP (notamment la petite chauve-souris brune, la chauve-souris nordique et la pipistrelle de l'Est).</p>`
      },
      {
        msgNum: 48,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet ministériel",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "7 août 2026, 18:00 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique ECCC</b>.</p></div>`
      },
      {
        msgNum: 49,
        sender: "Minister / Ministre (DFO/MPO)",
        senderRole: "Cabinet MPO",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "7 août 2026, 18:00 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique MPO</b>.</p></div>`
      },
      {
        msgNum: 55,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Departmental Correspondence Unit",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "10 août 2026, 14:55 UTC",
        bodyHtml: `<p>Good morning,</p>
<p>This is to confirm receipt of your email, along with the three attachments.</p>
<p>Regards,<br><b>Departmental Correspondence Unit — Environment and Climate Change Canada</b></p>
<div class="note"><b>Preuve capitale :</b> Confirmation formelle par écrit de la réception de la demande de Décret d'urgence LEP le 10 août 2026. Dès le lendemain (11 août 2026), l'Unité émettait la consigne interne d'ignorer William Guindon.</div>`
      }
    ]
  },
  {
    id: "t12",
    num: "12",
    subject: "Lettre ouverte trilatérale : J'ai 15 ans et j'ai besoin de vous (Appel à la communauté scientifique)",
    category: "cce",
    catLabel: "CCE & Traités internationaux",
    catColor: "#188038",
    date: "8 août 2026",
    messagesCount: 1,
    preview: "Appel citoyen trilingue mobilisant des experts universitaires du Canada, des États-Unis et du Mexique pour soutenir la soumission SEM-26-003 face aux blocages politiques de la Loi 93.",
    messages: [
      {
        msgNum: 51,
        sender: "William Guindon",
        senderRole: "Auteur citoyen (15 ans)",
        senderAvatar: "WG",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span> (Diffusion experts et universitaires)",
        date: "8 août 2026, 11:31 HAE",
        bodyHtml: `<p><b>[English below / Español abajo]</b></p>
<p>Bonjour,</p>
<p>Je m'appelle William Guindon, j'ai 15 ans, et je suis l'auteur de la communication SEM-26-003 déposée devant la CCE, l'organisme trilatéral du Canada, des États-Unis et du Mexique chargé de faire respecter le chapitre environnemental de l'ACEUM.</p>
<p>Le dossier concerne l'enfouissement de matières dangereuses par Stablex près de la Grande Tourbière de Blainville, du cadmium signalé dans l'eau à des niveaux très élevés, des oiseaux migrateurs pendant leur nidification, et les limites aux recours judiciaires du Projet de loi nº 93.</p>
<p>Je ne suis pas un parti politique, ni une grande organisation. Je suis un citoyen de 15 ans qui a utilisé le seul mécanisme international à ma disposition. Mais une voix seule, aussi documentée soit-elle, est facile à ignorer. Des appuis d'expert·e·s des trois pays de l'ACEUM transforment un enjeu local en question de coopération environnementale nord-américaine.</p>`
      }
    ]
  },
  {
    id: "t13",
    num: "13",
    subject: "Notification officielle de la décision de recevabilité CCE et Avis aux Ambassades (USA & Mexique)",
    category: "cce",
    catLabel: "CCE & Traités internationaux",
    catColor: "#188038",
    date: "17–21 août 2026",
    messagesCount: 5,
    preview: "Transmission de la décision positive du Secrétariat de la CCE (26-2-DET2) sommant le Canada de répondre d'ici le 16 octobre, et notification diplomatique aux ambassades.",
    starred: true,
    messages: [
      {
        msgNum: 57,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "info@stablex.com",
        cc: "renseignements.faune@environnement.gouv.qc.ca, Julie Dabrusin <ministre-minister@ec.gc.ca>",
        date: "17 août 2026, 11:53 HAE",
        attach: "62-DET2_fr.pdf (554 Ko)",
        bodyHtml: `<p>Madame, Monsieur,</p>
<p>Par la présente, je vous informe officiellement que le Secrétariat de la Commission de coopération environnementale (CCE) a rendu sa décision datée du 17 août 2026 concernant la soumission <b>SEM-26-003</b> relative à l'application de la législation environnementale dans le cadre du projet d'enfouissement de matières dangereuses à Blainville (site Stablex).</p>
<p>Le Secrétariat a déterminé que la communication satisfait à l'ensemble des critères d'admissibilité formels et de fond de l'article 24.27 de l'ACEUM, et qu'elle <b>mérite une réponse officielle du gouvernement du Canada avant le 16 octobre 2026</b>.</p>`
      },
      {
        msgNum: 59,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "Ottawa-Press@state.gov, infocan@sre.gob.mx",
        cc: "SEM Unit <SEM@cec.org>, Julie Dabrusin <ministre-minister@ec.gc.ca>",
        date: "19 août 2026, 17:19 HAE",
        attach: "26-2-det2_fr.pdf (559 Ko), 26-3-rsub_fr_redacted.pdf (5,0 Mo)",
        bodyHtml: `<p><b>À l'attention de Leurs Excellences les Ambassadeurs des États-Unis d'Amérique et des États-Unis mexicains au Canada,</b></p>
<p>Je suis William Guindon, citoyen canadien de Blainville (Québec) et auteur de la communication SEM-26-003. Je vous transmets officiellement la décision de recevabilité rendue par le Secrétariat de la CCE dans le cadre du Chapitre 24 de l'Accord Canada–États-Unis–Mexique (ACEUM).</p>`
      },
      {
        msgNum: 60,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "Ottawa-Press@state.gov, infocan@sre.gob.mx",
        date: "19 août 2026, 17:26 HAE",
        attach: "AMBASSADE.pdf (21 Ko)",
        bodyHtml: `<p>Transmission complémentaire des lettres officielles adressées à Leurs Excellences en versions anglaise et espagnole.</p>`
      }
    ]
  },
  {
    id: "t14",
    num: "14",
    subject: "Demandes d'accès à l'information et renseignements personnels (AIPRP P-2026-00017 / P-2026-00033) — Lisa Praine & Purolator",
    category: "aiprp",
    catLabel: "Accès à l'information (AIPRP)",
    catColor: "#00897a",
    date: "3 sept. – 18 nov. 2026",
    messagesCount: 11,
    preview: "Dossier d'accès ayant permis d'obtenir les preuves du blocage d'ECCC. Prorogation, attribution à l'analyste Lisa Praine et expédition d'une clé USB par Purolator (suivi 335962510558).",
    starred: true,
    messages: [
      {
        msgNum: 64,
        sender: "ecatip-ecaiprp@ec.gc.ca (Secrétariat AIPRP, ECCC)",
        senderRole: "Secrétariat de l'AIPRP",
        senderAvatar: "AIPRP",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        date: "3 sept. 2026, 14:39 UTC",
        attach: "AckAccept P-file - FR.pdf (154 Ko)",
        bodyHtml: `<p><b>Dossier ECCC : P-2026-00017</b></p>
<p>Accusé de réception officiel pour votre demande en vertu de la <i>Loi sur la protection des renseignements personnels</i> visant l'ensemble des communications internes d'ECCC relatives à William Guindon et au dossier SEM-26-003.</p>`
      },
      {
        msgNum: 71,
        sender: "William Guindon",
        senderRole: "Demandeur citoyen",
        senderAvatar: "WG",
        recipient: "ecatip-ecaiprp@ec.gc.ca",
        date: "29 sept. 2026, 11:51 HAE",
        bodyHtml: `<p>Mme Lachance,</p>
<p>J'accuse réception de votre avis de prorogation de 30 jours pour le dossier P-2026-00017. Je prends note que l'analyse des 18 points de ma demande requiert un délai exceptionnel de la part de l'institution. J'ajuste immédiatement mon calendrier de travail en conséquence.</p>`
      },
      {
        msgNum: 73,
        sender: "William Guindon",
        senderRole: "Demandeur mineur",
        senderAvatar: "WG",
        recipient: "ecatip-ecaiprp@ec.gc.ca",
        date: "9 oct. 2026, 12:23 HAE",
        bodyHtml: `<p>Bonjour Mme Lachance,</p>
<p>Dans le cadre du traitement de ma demande sous prorogation, je sollicite une <b>divulgation par étapes (communication partielle intérimaire)</b>, conformément aux directives du Secrétariat du Conseil du Trésor. En raison de l'échéance du 16 octobre fixée par la CCE et de mon statut de demandeur mineur, je demande la communication prioritaire des consignes internes émises à mon sujet.</p>`
      },
      {
        msgNum: 75,
        sender: "Praine,Lisa (elle | she, her) (ECCC)",
        senderRole: "Consultante AIPRP, Secrétariat Ministériel",
        senderAvatar: "AIPRP",
        recipient: "William Guindon",
        date: "13 oct. 2026, 18:16 UTC",
        bodyHtml: `<p>Bonjour William Guindon,</p>
<p>Je suis la nouvelle analyste qui a été assigné votre demande. Nous avons importé les documents dans notre système afin que je puisse les réviser. Soyez assuré que je traite cette demande comme l'un de mes dossiers prioritaires.</p>
<p>Lisa Praine<br>Consultante — Accès à l'information et protection des renseignements personnels, ECCC</p>`
      },
      {
        msgNum: 80,
        sender: "AIPRP / ATIP (ECCC)",
        senderRole: "Secrétariat AIPRP",
        senderAvatar: "AIPRP",
        recipient: "William Guindon",
        date: "23 oct. 2026, 19:11 UTC",
        bodyHtml: `<p><b>Dossier P-2026-00033 (Clarification demandée) :</b> Portant sur les échanges Teams/SMS, notes de breffage et courriels internes du 1er mai 2026 à ce jour concernant William Guindon et la pétition 0546.</p>`
      },
      {
        msgNum: 83,
        sender: "William Guindon",
        senderRole: "Demandeur citoyen",
        senderAvatar: "WG",
        recipient: "Lisa.Praine@ec.gc.ca",
        date: "28 oct. 2026, 13:04 HAE",
        bodyHtml: `<p>Bonjour Mme Praine,</p>
<p>Je vous remercie de m'avoir informé de l'envoi des documents par Purolator. Compte tenu de l'importance des échéances liées à mon dossier à la CCE, pourriez-vous me transmettre le numéro de suivi de cet envoi ?</p>`
      },
      {
        msgNum: 85,
        sender: "Praine,Lisa (ECCC)",
        senderRole: "Consultante AIPRP",
        senderAvatar: "AIPRP",
        recipient: "William Guindon",
        date: "28 oct. 2026, 16:54 UTC",
        bodyHtml: `<p>Bonjour Monsieur Guindon,</p>
<p>Malheureusement, les dossiers étaient trop volumineux pour vous être envoyés par courriel. C'est pourquoi nous les avons envoyés sur une clé USB par messagerie.</p>`
      },
      {
        msgNum: 86,
        sender: "Praine,Lisa (ECCC)",
        senderRole: "Consultante AIPRP",
        senderAvatar: "AIPRP",
        recipient: "William Guindon",
        date: "28 oct. 2026, 17:23 UTC",
        bodyHtml: `<p>Bonjour Monsieur Guindon,</p>
<p>Voici l'information pour PUROLATOR, numéro de suivi : <b>335962510558</b>.<br>Bonne journée !</p>
<div class="note"><b>Preuve matérielle :</b> Réception de la clé USB contenant les courriels internes révélant l'ordre du 11 août 2026 de bloquer William Guindon et la fermeture des dossiers du 31 août.</div>`
      }
    ]
  },
  {
    id: "t15",
    num: "15",
    subject: "Enquête citoyenne auprès des formations politiques québécoises et canadiennes",
    category: "consultation",
    catLabel: "Enquête & Consultations",
    catColor: "#5f6368",
    date: "7–11 sept. 2026",
    messagesCount: 3,
    preview: "Questionnaire formel transmis aux partis politiques sur leur position face à la décision d'admissibilité de la CCE et à la Loi 93.",
    messages: [
      {
        msgNum: 65,
        sender: "William Guindon",
        senderRole: "Auteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "Formations politiques (CCI)",
        date: "7 sept. 2026, 15:54 HAE",
        bodyHtml: `<p>Madame, Monsieur,</p>
<p>Je m'adresse à votre formation politique en ma qualité de citoyen engagé, auteur de la soumission SEM-26-003 (Grande Tourbière de Blainville) auprès de la CCE. Le 17 août 2026, la CCE a rendu une décision historique concernant mon dossier. Il est impératif que les citoyens connaissent vos engagements environnementaux.</p>`
      },
      {
        msgNum: 67,
        sender: "William Guindon",
        senderRole: "Auteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "contact@williamguindon.me (Abonnés et médias)",
        date: "11 sept. 2026, 19:19 HAE",
        bodyHtml: `<p>Publication intégrale et transparente des résultats de l'enquête citoyenne sur le site officiel et les réseaux sociaux.</p>`
      }
    ]
  },
  {
    id: "t16",
    num: "16",
    subject: "Dépôt d'éléments d'information complémentaires à la CCE (Imagerie satellitaire Copernicus)",
    category: "cce",
    catLabel: "CCE & Traités internationaux",
    catColor: "#188038",
    date: "13 sept. 2026",
    messagesCount: 3,
    preview: "Transmission au Secrétariat de la CCE d'analyses spectrales Sentinel-2 démontrant des travaux de terrassement récents sur le site de la cellule 6.",
    messages: [
      {
        msgNum: 68,
        sender: "William Guindon",
        senderRole: "Soumetteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "SEM Unit <sem@cec.org>",
        cc: "info@dfo-mpo.gc.ca, enviroinfo@ec.gc.ca, information@iaac-aeic.gc.ca, info@stablex.com",
        date: "13 sept. 2026, 14:56 HAE",
        attach: "Complement_information_SEM-26-003.pdf (224 Ko), Annexe_Pieces_Justificatives.pdf",
        bodyHtml: `<p><b>À l'attention du Secrétariat du mécanisme SEM (Chapitre 24 de l'ACEUM)</b></p>
<p>Faisant suite à la décision du Secrétariat du 17 août 2026 de transmettre la communication SEM-26-003 au gouvernement du Canada pour réponse, je sollicite le versement au dossier des éléments d'information complémentaires joints aux présentes.</p>
<p>Faits nouveaux : les données techniques présentées (extractions spectrales et imagerie Copernicus Sentinel-2 documentant les travaux de terrassement et d'arasement jusqu'au 11 septembre 2026) n'existaient pas lors du dépôt initial.</p>`
      },
      {
        msgNum: 69,
        sender: "Info / Info (DFO/MPO)",
        senderRole: "Pêches et Océans Canada",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "13 sept. 2026, 19:00 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique MPO</b>.</p></div>`
      },
      {
        msgNum: 70,
        sender: "Enviroinfo (ECCC)",
        senderRole: "Environnement Canada",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "13 sept. 2026, 19:00 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique ECCC</b>.</p></div>`
      }
    ]
  },
  {
    id: "t17",
    num: "17",
    subject: "Réponse officielle du Canada (72-RSP) et Réplique juridique immédiate de l'auteur à la CCE",
    category: "cce",
    catLabel: "CCE & Traités internationaux",
    catColor: "#188038",
    date: "17–19 oct. 2026",
    messagesCount: 4,
    preview: "Dépôt de la réponse d'Ottawa tentant d'invoquer la pétition 0546 comme procédure pendante. Réplique immédiate de William réfutant la fin de non-recevoir.",
    starred: true,
    messages: [
      {
        msgNum: 76,
        sender: "William Guindon",
        senderRole: "Auteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        cc: "Julie Dabrusin <ministre-minister@ec.gc.ca>, experts, ONGs alliées",
        date: "17 oct. 2026, 09:40 HAE",
        attach: "Observations_SEM-26-003_17-10-2026.pdf (121 Ko), 72-RSP_fr public.pdf, 73-REC_fr.pdf",
        bodyHtml: `<p>Bonjour à toutes et à tous,</p>
<p>Hier soir, le 16 octobre 2026 à 20 h 09, à l'expiration du délai impératif fixé par la CCE, le gouvernement du Canada a déposé sa réponse officielle (72-RSP).</p>
<p><b>Le constat est frappant :</b></p>
<ol>
  <li><b>Aucune réponse sur le fond scientifique et légal :</b> alors que le Secrétariat exigeait des explications sur 17 dispositions fédérales, Ottawa ne conteste aucun chiffre de contamination au cadmium ni la destruction de la tourbière.</li>
  <li><b>Échappatoire procédurale :</b> le Canada tente d'invoquer ma propre pétition citoyenne au BVG pour demander la fin de l'examen.</li>
</ol>
<p>J'ai déposé dès ce matin mes observations formelles pour réfuter cette interprétation : une pétition parlementaire au BVG n'a jamais constitué une procédure judiciaire sous l'ACEUM.</p>`
      },
      {
        msgNum: 77,
        sender: "William Guindon",
        senderRole: "Auteur SEM-26-003",
        senderAvatar: "WG",
        recipient: "Julie Dabrusin <ministre-minister@ec.gc.ca>",
        date: "18 oct. 2026 (Brouillon d'archive)",
        bodyHtml: `<div class="doc-summary"><p><b>Brouillon d'analyse historique :</b> Rappel des alertes citoyennes reçues par le ministère depuis près d'une décennie (dossiers ministériels MIN-214895 de 2016 et MIN-2022) démontrant que les faits ne sont nullement nouveaux pour ECCC.</p></div>`
      },
      {
        msgNum: 78,
        sender: "Edith Mora Castelan",
        senderRole: "Eau Secours / CADT",
        senderAvatar: "CADT",
        recipient: "William Guindon",
        date: "19 oct. 2026, 18:52 HAE",
        bodyHtml: `<p>Bonjour William,</p>
<p>Merci beaucoup de ce suivi et de tout le travail que tu as fait. Bravo, on continue !</p>`
      }
    ]
  },
  {
    id: "t18",
    num: "18",
    subject: "Réponses ministérielles officielles à la Pétition environnementale 0546 (BVG / CEDD)",
    category: "eccc",
    catLabel: "ECCC & MPO — Réponses officielles",
    catColor: "#0b57d0",
    date: "10 nov. 2026",
    messagesCount: 2,
    preview: "Dépôt des réponses formelles d'ECCC (MIN-334658) et du MPO confirmant l'absence totale d'inspections de terrain et d'échantillonnages indépendants pour la cellule 6.",
    starred: true,
    messages: [
      {
        msgNum: 88,
        sender: "NCR Petitions / Pétitions RCN (DFO/MPO)",
        senderRole: "Pêches et Océans Canada",
        senderAvatar: "MPO",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        cc: "petitions@oag-bvg.gc.ca, psolano@cec.org, sem@cec.org",
        date: "10 nov. 2026, 19:44 UTC",
        attach: "Réponse MPO Pétition 546.pdf (409 Ko)",
        bodyHtml: `<p>Veuillez trouver ci-joint la réponse de Pêches et Océans Canada à votre pétition environnementale no 546 portant sur l'application des lois environnementales fédérales au site Stablex à Blainville.</p>
<div class="note"><b>Aveu officiel du MPO :</b> Confirmation qu'aucune autorisation en vertu des art. 34.4 ou 35 de la Loi sur les pêches n'a été délivrée pour la cellule 6 et qu'aucune inspection sur place n'a été menée par le MPO.</div>`
      },
      {
        msgNum: 89,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet de Julie Dabrusin",
        senderAvatar: "ECCC",
        recipient: "<span class='cx' title='Caviardé'>contact@williamguindon.me</span>",
        cc: "petitions@oag-bvg.gc.ca, psolano@cec.org, sem@cec.org, dfo.minister-ministre.mpo@dfo-mpo.gc.ca",
        date: "10 nov. 2026, 21:39 UTC",
        attach: "RÉPONSE SIGNÉE - Guindon - MIN-334658.pdf, Réponse à la pétition.pdf",
        bodyHtml: `<p>Veuillez trouver ci-joint la réponse signée de l'honorable Julie Dabrusin, ministre de l'Environnement, du Changement climatique et de la Nature à votre pétition en matière d'environnement (no 0546).</p>
<div class="note"><b>Aveu officiel d'ECCC :</b> ECCC confirme n'avoir mené aucune inspection indépendante sur le terrain ni aucun échantillonnage d'eau ou de sédiment pour la cellule 6. Le motif d'attente d'Ottawa s'éteint ce jour-là.</div>`
      }
    ]
  },
  {
    id: "t19",
    num: "19",
    subject: "Suivi conjoint aux ministres Julie Dabrusin et Diane Lebouthillier — Démocratie, écoute des jeunes et pétition e-7834",
    category: "eccc",
    catLabel: "ECCC & MPO — Correspondance",
    catColor: "#0b57d0",
    date: "19 nov. 2026",
    messagesCount: 3,
    preview: "Lettre conjointe sommant les ministres d'assumer leurs responsabilités face à la jeunesse et dénonçant l'esquive des réponses à la pétition 0546.",
    starred: true,
    messages: [
      {
        msgNum: 91,
        sender: "William Guindon",
        senderRole: "Citoyen de 15 ans, Blainville",
        senderAvatar: "WG",
        recipient: "Enviroinfo (ECCC), Julie Dabrusin <ministre-minister@ec.gc.ca>, DFO.Minister-Ministre.MPO@dfo-mpo.gc.ca, contact@williamguindon.me",
        cc: "dgalunitedebreffageebbriefingunit@ec.gc.ca, SEM Unit <sem@cec.org>, mark.carney@parl.gc.ca",
        date: "19 nov. 2026, 15:58 HNE",
        attach: "dossier-atip-sem-26-003-can-int.pdf (3,7 Mo)",
        bodyHtml: `<p><b>Madame la Ministre de l'Environnement et du Changement climatique,</b><br>
<b>Madame la Ministre des Pêches,</b><br>
<b>Mesdames, Messieurs,</b></p>
<p>J'accuse réception de vos réponses transmises le 10 novembre 2026 dans le cadre de la pétition environnementale n° 0546 concernant le site de Stablex à Blainville. Je vous écris aujourd'hui conjointement, non seulement comme auteur de la communication SEM-26-003, mais surtout comme un jeune citoyen de 15 ans qui voit son milieu de vie et son avenir climatique se jouer dans ce dossier.</p>
<p>On répète sans cesse aux jeunes de croire en la démocratie, de passer par les voies légales et de faire confiance aux institutions. J'ai pris vos institutions au mot : seul, à 15 ans, sans budget ni équipe, j'ai respecté chaque règle et chaque procédure. En retour, je me heurte à des portes fermées, à des données retenues et à des réponses qui esquivent l'essentiel. Ce que vous envoyez comme message à toute une génération, c'est que les règles démocratiques ne s'appliquent que tant qu'elles ne dérangent personne.</p>
<p>De plus, ce manque d'écoute dépasse ce seul dossier. J'ai également initié une pétition à la Chambre des communes (pétition électronique e-7834) pour faire reconnaître les droits de participation des mineurs, qui a elle aussi été ignorée par le pouvoir politique.</p>`
      },
      {
        msgNum: 92,
        sender: "Minister / Ministre (DFO/MPO)",
        senderRole: "Cabinet MPO",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "19 nov. 2026, 21:00 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique MPO</b>.</p></div>`
      },
      {
        msgNum: 93,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet ECCC",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "19 nov. 2026, 21:00 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique ECCC</b>.</p></div>`
      }
    ]
  },
  {
    id: "t20",
    num: "20",
    subject: "Avis officiel au Premier ministre et aux ministres — Lancement de la pétition contre le blocage interne d'ECCC",
    category: "signalement",
    catLabel: "Mobilisation & Transparence",
    catColor: "#d93025",
    date: "22 nov. 2026",
    messagesCount: 3,
    preview: "Avis formel au Premier ministre, aux ministres et à la députée de Thérèse-De Blainville sur le lancement de la pétition Change.org dénonçant les directives internes de censure et les rencontres de lobbyistes.",
    starred: true,
    messages: [
      {
        msgNum: 94,
        sender: "William Guindon",
        senderRole: "Citoyen de 15 ans, Blainville",
        senderAvatar: "WG",
        recipient: "mark.carney@parl.gc.ca, Madeleine Chenette <madeleine.chenette@parl.gc.ca>, Michael.Bonser@ec.gc.ca, DFO.Minister-Ministre.MPO@dfo-mpo.gc.ca, Julie Dabrusin <ministre-minister@ec.gc.ca>",
        cc: "presse-et-medias-wguindon@googlegroups.com",
        date: "22 nov. 2026, 12:23 HNE",
        bodyHtml: `<p><b>Monsieur le Premier ministre,</b><br>
<b>Madame la Ministre de l'Environnement, du Changement climatique et de la Nature,</b><br>
<b>Madame la Ministre des Pêches, des Océans et de la Garde côtière canadienne,</b><br>
<b>Madame la Députée de Thérèse-De Blainville,</b><br>
<b>Monsieur le Sous-ministre adjoint délégué,</b></p>
<p>Je vous transmets par la présente un avis officiel concernant le lancement d'une pétition citoyenne demandant au gouvernement du Canada, à Environnement et Changement climatique Canada (ECCC) ainsi qu'à Pêches et Océans Canada (MPO) de <b>lever la directive interne bloquant mes correspondances et de rétablir la transparence</b> dans le dossier environnemental entourant le site de Stablex, près de la Grande Tourbière de Blainville.</p>
<p>Des documents officiels d'ECCC obtenus en vertu de la <i>Loi sur la protection des renseignements personnels</i> démontrent que l'Unité de correspondance ministérielle a émis, le 11 août 2026, une consigne ordonnant aux équipes du ministère (dont EnviroInfo et le Centre national des urgences environnementales) de ne plus me répondre, avant de fermer l'ensemble de mes dossiers le 31 août.</p>
<p>Dix-sept jours plus tard, le Registre officiel des lobbyistes indique que des représentants de Stablex ont rencontré de hauts dirigeants d'ECCC — dont le sous-ministre adjoint délégué Michael Bonser — concernant la gestion des matières dangereuses résiduelles et les travaux de la cellule 6.</p>
<p>Face à ce déni démocratique, la pétition exige la levée immédiate de ce blocage et la pleine reddition de comptes.</p>`
      },
      {
        msgNum: 95,
        sender: "Minister / Ministre (DFO/MPO)",
        senderRole: "Cabinet MPO",
        senderAvatar: "MPO",
        recipient: "William Guindon",
        date: "22 nov. 2026, 17:29 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique MPO</b>.</p></div>`
      },
      {
        msgNum: 96,
        sender: "Ministre / Minister (ECCC)",
        senderRole: "Cabinet ECCC",
        senderAvatar: "ECCC",
        recipient: "William Guindon",
        date: "22 nov. 2026, 17:29 UTC",
        bodyHtml: `<div class="doc-summary"><p><b>Accusé automatique ECCC</b>.</p></div>`
      }
    ]
  }
];

// Génération de la liste HTML des messages
function generateMessageListHtml() {
  return threads.map(t => `
    <article class="msg" data-tid="${t.id}" data-cat="${t.category}" data-starred="${t.starred ? '1' : '0'}">
      <div class="msg-side">
        <button class="star-btn ${t.starred ? 'active' : ''}" title="${t.starred ? 'Élément clé' : 'Marquer comme important'}" aria-label="Étoile">
          <svg class="svg" viewBox="0 0 24 24"><path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8z"/></svg>
        </button>
        <span class="m-cat-tag" style="background:${t.catColor}20;color:${t.catColor};border:1px solid ${t.catColor}40;">${t.catLabel}</span>
      </div>
      <div class="msg-content">
        <div class="msg-line1">
          <span class="m-sender">William Guindon ↔ ${t.catLabel.split('—')[0].trim()}</span>
          <span class="m-badge">${t.messagesCount} msg</span>
          <time class="m-date">${t.date}</time>
        </div>
        <div class="msg-line2">
          <span class="m-subject">${t.subject}</span>
          <span class="m-preview"> — ${t.preview}</span>
        </div>
      </div>
    </article>
  `).join('\n');
}

// Génération des vues de fils (threadviews)
function generateThreadViewsHtml() {
  return threads.map(t => `
    <section class="threadview" id="tv-${t.id}">
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
      ${t.messages.map((m, idx) => `
        <article class="card ${idx === t.messages.length - 1 || m.msgNum === 2 || m.msgNum === 8 || m.msgNum === 10 || m.msgNum === 12 || m.msgNum === 35 || m.msgNum === 45 || m.msgNum === 46 || m.msgNum === 47 || m.msgNum === 86 || m.msgNum === 88 || m.msgNum === 89 || m.msgNum === 91 || m.msgNum === 94 ? 'open' : ''}">
          <div class="card-head">
            <div class="avwrap"><div class="cava ${m.senderAvatar === 'WG' ? 'me' : 'org'}">${m.senderAvatar}</div></div>
            <div class="meta">
              <div class="l1"><span class="fname">${m.sender}</span> <span class="role">${m.senderRole}</span></div>
              <div class="l2">à ${m.recipient}${m.cc ? ` · <span class="faded">Cc : ${m.cc}</span>` : ''}</div>
            </div>
            <div class="cdate">${m.date}</div>
            <div class="cacts">
              <span class="msg-num-tag">#${m.msgNum}</span>
              <svg class="svg" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
            </div>
          </div>
          <div class="card-body">
            ${m.attach ? `
              <div class="attach">
                <div class="chip" title="Pièce jointe officielle au dossier">
                  <div class="thumb">📎</div>
                  <div class="cinfo">
                    <div class="fn">${m.attach}</div>
                    <div class="sz">Versée au dossier probatoire</div>
                  </div>
                </div>
              </div>` : ''}
            <div class="msg-rendered-body">
              ${m.bodyHtml}
            </div>
          </div>
        </article>
      `).join('\n')}
    </section>
  `).join('\n');
}

const wmailPageTemplate = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<script>(function(){try{if(!window.history||!window.history.replaceState)return;var s=window.location.search,h=window.location.hash;if(!s&&(!h||h.indexOf('?')===-1))return;var u=new URL(window.location.href);var t=new Set(['fbclid','fbadid','gclid','gbraid','wbraid','_ga','_gl','igshid','twclid','ttclid','msclkid','mc_cid','mc_eid','yclid','dclid','ref_src','gad_source','gclsrc']);var isT=function(k){var l=(k||'').toLowerCase();return l.indexOf('utm_')===0||l.indexOf('fb_')===0||l.indexOf('_aem')===0||t.has(l);};var c=false;if(s){var r=[];u.searchParams.forEach(function(_,k){if(isT(k))r.push(k);});if(r.length){for(var i=0;i<r.length;i++)u.searchParams.delete(r[i]);c=true;}}if(h&&h.indexOf('?')!==-1){var p=u.hash.split('?'),b=p[0],hp=new URLSearchParams(p.slice(1).join('?')),hr=[];hp.forEach(function(_,k){if(isT(k))hr.push(k);});if(hr.length){for(var j=0;j<hr.length;j++)hp.delete(hr[j]);var q=hp.toString();u.hash=b+(q?'?'+q:'');c=true;}}if(c){var ns=u.searchParams.toString();window.history.replaceState(null,'',u.pathname+(ns?'?'+ns:'')+u.hash);}}catch(_){}})();</script>
<script src="assets/js/security-guard.js" defer></script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wmail — Registre des correspondances ministérielles (ECCC & MPO) · William Guindon</title>
<meta name="description" content="Archive interactive et caviardée des 96 correspondances échangées avec Environnement Canada (ECCC), Pêches et Océans (MPO) et la CCE dans le cadre du dossier SEM-26-003.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="fr" href="https://williamguindon.me/wmail.html">
<link rel="alternate" hreflang="x-default" href="https://williamguindon.me/wmail.html">
<meta property="og:type" content="website">
<meta property="og:title" content="Wmail — Registre des correspondances ministérielles (ECCC & MPO) · William Guindon">
<meta property="og:description" content="Archive publique et caviardée des correspondances, signalements pénaux et demandes d'accès à l'information (dossier SEM-26-003).">
<meta property="og:url" content="https://williamguindon.me/wmail.html">
<meta property="og:image" content="https://williamguindon.me/assets/img/og-image-1200x630.png?v=20261017">
<link rel="stylesheet" href="style.css?v=20261018-v87">
<style>
:root{--canvas:#f6f8fc;--surface:#fff;--text:#1f1f1f;--muted:#5f6368;--blue:#0b57d0;--active:#d3e3fd;--search:#eaf1fb;--line:#e7e9ec;--hover:#edf0f3}
*{box-sizing:border-box}html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--text);background:var(--canvas)}
button,input{font:inherit;color:inherit}button{border:0;background:none;cursor:pointer}
.app{height:100dvh;min-width:320px;overflow:hidden;display:flex;flex-direction:column}
.topbar{height:64px;display:flex;align-items:center;gap:16px;padding:0 16px;background:#fff;box-shadow:0 1px 2px rgba(60,64,67,.1);z-index:5;flex:none}
.brand-area{width:260px;display:flex;align-items:center;gap:12px;flex:none}
.circle-button{width:40px;height:40px;border-radius:50%;display:grid;place-items:center}.circle-button:hover{background:#e6e9ef}
.brand{font-size:22px;font-weight:700;letter-spacing:-.5px;color:#1e293b}
.brand b{color:#059669}
.brand-sub{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-left:4px}
.search-wrap{height:46px;max-width:680px;flex:1;position:relative;margin:auto}
.search-wrap svg{position:absolute;left:16px;top:13px;width:20px;height:20px;color:#5f6368}
.search-wrap input{width:100%;height:100%;border:0;outline:0;border-radius:24px;background:var(--search);padding:0 48px;font-size:15px}
.search-wrap input:focus{background:#fff;box-shadow:0 1px 3px 1px rgba(60,64,67,.18)}
.search-clear{position:absolute;right:6px;top:3px}
.top-actions{display:flex;align-items:center;gap:6px}
.avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#059669;color:#fff;font-size:12px;font-weight:700;margin-left:6px}
.workspace{height:calc(100dvh - 64px);display:flex;min-height:0}
.sidebar{width:270px;flex:none;padding:12px 0;background:#fff;border-right:1px solid var(--line);overflow:hidden auto;transition:width .2s}
.sidebar.collapsed{width:72px}
.sidebar nav{padding-right:10px}
.nav-item{height:38px;width:100%;border-radius:0 19px 19px 0;display:flex;align-items:center;font-size:13.5px;font-weight:500;color:#444746;padding-left:14px;gap:12px;transition:background .15s}
.nav-item:hover{background:#e9ebef}.nav-item.active{background:var(--active);color:#0b57d0;font-weight:700}
.nav-icon{width:22px;flex:none;display:grid;place-items:center}
.nav-label{flex:1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.count{font-size:11.5px;padding-right:14px;color:#5f6368;font-weight:600}
.labels{margin:20px 14px 10px;border-top:1px solid #f1f3f4;padding-top:14px}
.labels-title{display:flex;align-items:center;justify-content:space-between;font-weight:700;margin-bottom:8px;font-size:12px;color:#5f6368;text-transform:uppercase;letter-spacing:.5px}
.label-row{height:32px;width:100%;display:flex;align-items:center;gap:12px;padding:0 8px;border-radius:16px;font-size:13px;color:#444746}
.label-row:hover{background:#f1f3f4}
.tag-dot{width:9px;height:9px;border-radius:50%;flex:none}
.inbox{flex:1;display:flex;flex-direction:column;min-width:0;background:#fff}
.toolbar{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid var(--line);background:#fff;flex:none}
.toolbar-side{display:flex;align-items:center;gap:4px}
.small-count{font-size:12px;color:#5f6368;font-weight:500;margin-right:10px}
.tabs{height:46px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid var(--line);background:#fafbfc;overflow-x:auto}
.tab{height:34px;padding:0 14px;border-radius:8px;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#5f6368;white-space:nowrap}
.tab:hover{background:#eef1f6}
.tab.active{background:#e8f0fe;color:#0b57d0}
.messages{flex:1;overflow-y:auto;position:relative}
.msglist{display:flex;flex-direction:column}
.msg{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid #f1f3f4;cursor:pointer;transition:background .15s}
.msg:hover{background:#f8fafd;box-shadow:inset 3px 0 0 #0b57d0}
.msg-side{display:flex;align-items:center;gap:8px;flex:none}
.star-btn{color:#c4c7c5;width:28px;height:28px;display:grid;place-items:center;border-radius:50%}
.star-btn:hover{background:#f1f3f4}
.star-btn.active{color:#f59e0b}
.m-cat-tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;white-space:nowrap}
.msg-content{flex:1;min-width:0}
.msg-line1{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px}
.m-sender{font-size:13.5px;font-weight:700;color:#1e293b}
.m-badge{font-size:11px;background:#e2e8f0;color:#475569;font-weight:700;padding:1px 6px;border-radius:10px}
.m-date{font-size:12px;color:#64748b}
.msg-line2{font-size:13px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-subject{font-weight:600;color:#0f172a}
.m-preview{color:#64748b}
.threadview{display:none;padding:16px 24px 48px;max-width:1040px;margin:0 auto}
.tv-top{display:flex;align-items:flex-start;gap:16px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.tv-top .back{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#f1f3f4}
.tv-top .back:hover{background:#e2e8f0}
.tv-subj h2{margin:0 0 8px;font-size:19px;font-weight:700;color:#0f172a;line-height:1.35}
.tv-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.lpill{font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:14px}
.nmsg{font-size:12px;color:#64748b;font-weight:600}
.allopen{font-size:12px;color:#0b57d0;font-weight:600;text-decoration:underline}
.card{background:#fff;border:1px solid var(--line);border-radius:10px;margin-bottom:14px;overflow:hidden}
.card-head{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;background:#fafbfc}
.card-head:hover{background:#f1f5f9}
.avwrap .cava{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700}
.cava.me{background:#059669;color:#fff}
.cava.org{background:#0b57d0;color:#fff}
.card-head .meta{flex:1;min-width:0}
.card-head .l1{font-size:13.5px;font-weight:700;color:#0f172a}
.card-head .role{font-size:11.5px;font-weight:500;color:#64748b;margin-left:4px}
.card-head .l2{font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-head .cdate{font-size:12px;color:#64748b;flex:none}
.card-head .cacts{display:flex;align-items:center;gap:8px;margin-left:10px}
.msg-num-tag{font-size:11px;background:#e2e8f0;padding:2px 6px;border-radius:6px;font-weight:700;color:#475569}
.card-body{display:none;padding:16px 20px;font-size:14px;line-height:1.6;color:#1e293b;border-top:1px solid #f1f5f9}
.card.open .card-body{display:block}
.doc-summary{background:#f8fafc;border-left:4px solid #0b57d0;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13.5px}
.note{background:#ecfdf5;border-left:4px solid #059669;padding:10px 14px;border-radius:0 6px 6px 0;margin:14px 0;font-size:13px;color:#065f46}
.attach{margin:12px 0}
.chip{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;font-size:12px}
.cx{background:#e2e8f0;padding:1px 6px;border-radius:4px;font-family:monospace;font-size:12px;border:1px dashed #94a3b8}
.res-box{display:none;padding:20px;max-width:800px;margin:0 auto}
.res-item{padding:12px;border-bottom:1px solid #f1f3f4;cursor:pointer}
.res-item:hover{background:#f8fafc}
.res-item mark{background:#fef08a;font-weight:700;padding:0 2px}
.btn-share{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1}
.btn-share:hover{background:#e2e8f0}
@media (max-width:768px){
  .sidebar{position:fixed;left:-280px;top:64px;bottom:0;z-index:20;box-shadow:4px 0 16px rgba(0,0,0,.15)}
  .sidebar.mobile-open{left:0}
  .sidebar-backdrop{display:none;position:fixed;inset:64px 0 0 0;background:rgba(0,0,0,.35);z-index:15}
  .sidebar-backdrop.active{display:block}
}
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand-area">
      <a href="./" class="circle-button" title="Retourner au portail d'accueil" aria-label="Retour au site principal" style="text-decoration:none;display:grid;place-items:center;color:inherit;">
        <svg class="svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </a>
      <button class="circle-button menu-button" id="menuBtn" aria-label="Menu de navigation">
        <svg class="svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <h1 class="brand" style="margin:0;display:inline-flex;align-items:baseline;">
        W<b>mail</b><span class="brand-sub">Ministères</span>
      </h1>
    </div>
    <div class="search-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <input id="searchInput" placeholder="Rechercher dans les 96 correspondances (cadmium, signalement, décret, Julie Dabrusin...)" aria-label="Recherche">
      <button class="circle-button search-clear" id="searchClear" aria-label="Effacer" hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div class="top-actions">
      <a href="correspondance.html" class="circle-button" title="Politique de correspondance & Caviardage" aria-label="Politique de correspondance" style="text-decoration:none;display:grid;place-items:center;color:inherit;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </a>
      <div class="avatar" title="Compte citoyen officiel : William Guindon">WG</div>
    </div>
  </header>

  <div class="workspace">
    <aside class="sidebar" id="sidebar">
      <nav>
        <button class="nav-item active" data-filter="all">
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg></span>
          <span class="nav-label">Boîte de réception (Tous)</span>
          <span class="count">96</span>
        </button>
        <button class="nav-item" data-filter="starred">
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8z"/></svg></span>
          <span class="nav-label">Éléments clés & Preuves</span>
          <span class="count">10</span>
        </button>
        <button class="nav-item" data-filter="sent">
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></span>
          <span class="nav-label">Envoyés (William Guindon)</span>
          <span class="count">42</span>
        </button>
        <button class="nav-item" data-filter="in">
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></span>
          <span class="nav-label">Reçus (Ministères ECCC & MPO)</span>
          <span class="count">51</span>
        </button>
      </nav>

      <div class="labels">
        <div class="labels-title">
          <span>Catégories</span>
          <span>SEM-26-003</span>
        </div>
        <button class="label-row" data-cat="signalement">
          <span class="tag-dot" style="background:#d93025"></span>
          <span class="nav-label">Application de la loi & Pêches</span>
          <span class="count">5</span>
        </button>
        <button class="label-row" data-cat="eccc">
          <span class="tag-dot" style="background:#0b57d0"></span>
          <span class="nav-label">ECCC & Cabinets ministériels</span>
          <span class="count">6</span>
        </button>
        <button class="label-row" data-cat="cce">
          <span class="tag-dot" style="background:#188038"></span>
          <span class="nav-label">CCE & Traités internationaux</span>
          <span class="count">5</span>
        </button>
        <button class="label-row" data-cat="aiprp">
          <span class="tag-dot" style="background:#00897a"></span>
          <span class="nav-label">AIPRP & Accès à l'information</span>
          <span class="count">2</span>
        </button>
        <button class="label-row" data-cat="lep">
          <span class="tag-dot" style="background:#9334e6"></span>
          <span class="nav-label">Espèces en péril (LEP)</span>
          <span class="count">1</span>
        </button>
        <button class="label-row" data-cat="stablex">
          <span class="tag-dot" style="background:#e8710a"></span>
          <span class="nav-label">Clarifications Stablex</span>
          <span class="count">1</span>
        </button>
      </div>
    </aside>

    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

    <section class="inbox">
      <div class="toolbar">
        <div class="toolbar-side">
          <span class="small-count" id="counter">20 conversations · 96 correspondances</span>
        </div>
        <div class="toolbar-side">
          <button class="circle-button" id="refreshBtn" title="Actualiser la liste">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6v5h-5M4 18v-5h5M6.1 9a7 7 0 0 1 11.4-2L20 11M4 13l2.5 4a7 7 0 0 0 11.4-2"/></svg>
          </button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="all">Tous (20 fils)</button>
        <button class="tab" data-tab="signalement">🚨 Application de la loi</button>
        <button class="tab" data-tab="eccc">🏛️ ECCC & Ministre</button>
        <button class="tab" data-tab="cce">🌐 CCE / ACEUM</button>
        <button class="tab" data-tab="aiprp">🔑 AIPRP (Accès info)</button>
      </div>

      <div class="messages" id="messagesArea">
        <div class="msglist" id="msgList">
          ${generateMessageListHtml()}
        </div>

        <div class="res-box" id="resBox"></div>

        <div id="threadViewsContainer">
          ${generateThreadViewsHtml()}
        </div>
      </div>
    </section>
  </div>
</div>

<script>
(function(){
  const msgList = document.getElementById('msgList');
  const resBox = document.getElementById('resBox');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const threadViews = document.querySelectorAll('.threadview');
  const navItems = document.querySelectorAll('.nav-item');
  const labelRows = document.querySelectorAll('.label-row');
  const tabs = document.querySelectorAll('.tab');
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  // Index de recherche plein texte
  const searchIndex = [];
  document.querySelectorAll('.threadview').forEach(tv => {
    const tid = tv.id.replace('tv-', '');
    const title = tv.querySelector('h2') ? tv.querySelector('h2').textContent : '';
    tv.querySelectorAll('.card').forEach(card => {
      const sender = card.querySelector('.fname') ? card.querySelector('.fname').textContent : '';
      const text = card.querySelector('.card-body') ? card.querySelector('.card-body').textContent : '';
      searchIndex.push({
        tid: tid,
        title: title,
        sender: sender,
        text: (title + ' ' + sender + ' ' + text).toLowerCase(),
        rawText: text.trim()
      });
    });
  });

  // Gestion de la vue active
  function showInbox() {
    threadViews.forEach(v => v.style.display = 'none');
    resBox.style.display = 'none';
    msgList.style.display = 'flex';
    if(history.replaceState) history.replaceState(null, '', '#inbox');
  }

  function openThread(tid, pushHash) {
    msgList.style.display = 'none';
    resBox.style.display = 'none';
    threadViews.forEach(v => v.style.display = 'none');
    const target = document.getElementById('tv-' + tid);
    if(target) {
      target.style.display = 'block';
      document.getElementById('messagesArea').scrollTop = 0;
      if(pushHash && history.replaceState) history.replaceState(null, '', '#' + tid);
    }
  }

  // Clic sur un message
  msgList.addEventListener('click', e => {
    const msgEl = e.target.closest('.msg');
    if(!msgEl) return;
    const starBtn = e.target.closest('.star-btn');
    if(starBtn) {
      e.stopPropagation();
      starBtn.classList.toggle('active');
      return;
    }
    const tid = msgEl.getAttribute('data-tid');
    if(tid) openThread(tid, true);
  });

  // Bouton retour
  document.querySelectorAll('.tv-top .back').forEach(btn => {
    btn.addEventListener('click', showInbox);
  });

  // Déplier / replier cartes de messages
  document.querySelectorAll('.card-head').forEach(head => {
    head.addEventListener('click', () => {
      const card = head.closest('.card');
      if(card) card.classList.toggle('open');
    });
  });

  // Tout déplier / replier
  document.querySelectorAll('.allopen').forEach(btn => {
    btn.addEventListener('click', () => {
      const tv = btn.closest('.threadview');
      if(!tv) return;
      const cards = tv.querySelectorAll('.card');
      const allOpen = Array.from(cards).every(c => c.classList.contains('open'));
      cards.forEach(c => {
        if(allOpen) c.classList.remove('open');
        else c.classList.add('open');
      });
      btn.textContent = allOpen ? 'Tout déplier' : 'Tout replier';
    });
  });

  // Recherche plein texte
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    searchClear.hidden = !q;
    if(q.length < 2) {
      resBox.style.display = 'none';
      msgList.style.display = 'flex';
      return;
    }
    const hits = searchIndex.filter(item => item.text.includes(q));
    msgList.style.display = 'none';
    threadViews.forEach(v => v.style.display = 'none');
    resBox.style.display = 'block';

    if(!hits.length) {
      resBox.innerHTML = '<div style="padding:24px;color:#64748b;text-align:center;">Aucune correspondance trouvée.</div>';
      return;
    }

    resBox.innerHTML = '<div style="margin-bottom:12px;font-size:13px;font-weight:700;color:#0b57d0;">' + hits.length + ' résultat(s) pour « ' + q + ' »</div>' +
      hits.slice(0, 30).map(hit => {
        const idx = hit.rawText.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(hit.rawText.length, idx + q.length + 60);
        const snippet = hit.rawText.substring(start, end).replace(new RegExp(q, 'gi'), m => '<mark>' + m + '</mark>');
        return '<div class="res-item" data-tid="' + hit.tid + '">' +
          '<div style="font-weight:700;font-size:13.5px;color:#0f172a;">' + hit.title + '</div>' +
          '<div style="font-size:12px;color:#64748b;margin-bottom:4px;">Par ' + hit.sender + '</div>' +
          '<div style="font-size:13px;color:#334155;">… ' + snippet + ' …</div>' +
        '</div>';
      }).join('');
  });

  resBox.addEventListener('click', e => {
    const item = e.target.closest('.res-item');
    if(!item) return;
    const tid = item.getAttribute('data-tid');
    if(tid) openThread(tid, true);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    showInbox();
  });

  // Filtres latéraux
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      showInbox();
      document.querySelectorAll('.msg').forEach(m => {
        if(filter === 'all') m.style.display = 'flex';
        else if(filter === 'starred') m.style.display = m.getAttribute('data-starred') === '1' ? 'flex' : 'none';
        else if(filter === 'sent') m.style.display = m.textContent.includes('William Guindon') ? 'flex' : 'none';
        else if(filter === 'in') m.style.display = 'flex';
      });
    });
  });

  // Filtres par étiquette
  labelRows.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      showInbox();
      document.querySelectorAll('.msg').forEach(m => {
        m.style.display = m.getAttribute('data-cat') === cat ? 'flex' : 'none';
      });
    });
  });

  // Filtres par onglet supérieur
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetCat = tab.getAttribute('data-tab');
      showInbox();
      document.querySelectorAll('.msg').forEach(m => {
        if(targetCat === 'all') m.style.display = 'flex';
        else m.style.display = m.getAttribute('data-cat') === targetCat ? 'flex' : 'none';
      });
    });
  });

  // Navigation par ancre (#t1, #t10, etc.)
  function handleHash() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if(hash && hash.startsWith('t')) {
      openThread(hash, false);
    } else {
      showInbox();
    }
  }

  // Tiroir mobile
  if(menuBtn) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      sidebarBackdrop.classList.toggle('active');
    });
  }
  if(sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      sidebarBackdrop.classList.remove('active');
    });
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();
})();
</script>
<script defer src="https://cloud.umami.is/script.js" data-website-id="33fe2e14-a15b-46f7-9246-dc61b1ca20a9"></script>
</body>
</html>`;

fs.writeFileSync(wmailHtmlPath, wmailPageTemplate, 'utf8');
console.log('✔ wmail.html généré avec succès !');
