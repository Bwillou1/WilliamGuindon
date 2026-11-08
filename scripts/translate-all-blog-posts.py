import json
import os

blog_path = 'data/blog.json'
with open(blog_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

# Helper dictionary for content translations
content_en = {}
content_es = {}

# Post 0
content_en["post-2026-11-06-rencontre-bilaterale-nadine-le-gal"] = """On **November 6, 2026**, an official bilateral meeting of the utmost importance was held between William Guindon and the Member of the National Assembly of Quebec for Blainville, **Nadine Le Gal**.

Demonstrating remarkable political determination and direct commitment to citizen concerns, Nadine Le Gal dedicated this in-depth working session to discuss the future of the Grande Tourbière de Blainville, the expansion of the Stablex site, and the next steps in international proceeding CEC SEM-26-003.

### 1. Participants at the Working Table
The meeting brought together:
- **For the Provincial Representation:** **Nadine Le Gal**, MNA for Blainville, accompanied by **Sylvain Pagé** (parliamentary team, respected political figure and former MNA in the Laurentians).
- **For the Citizen and Environmental Delegation:**
  - **William Guindon**, student, environmental activist and author of citizen submission SEM-26-003;
  - **Daniel Green**, renowned environmental scientist and longtime watchdog for the Society to Overcome Pollution (SVP);
  - **Édith Mora Castelan**, citizen expert, field monitor in waste management and environmental rights.

![Official bilateral meeting of November 6, 2026 with Nadine Le Gal, Sylvain Pagé, Daniel Green, Édith Mora Castelan and William Guindon](/assets/media/rencontre-nadine-le-gal-6-nov-2026.webp)

### 2. Major Breakthroughs and Commitments

#### 1. Grande Tourbière Designated as Priority No. 1
Nadine Le Gal reaffirmed unambiguously that protecting the threatened ecosystems of the Grande Tourbière de Blainville and maintaining strict scrutiny over the Stablex file stand at the very top of her mandate priorities. The Member of the National Assembly expressed exceptional attentiveness toward the 222 evidentiary exhibits entered into the public record.

#### 2. Proposal for a $1,000/Tonne Eco-Royalty on Hazardous Waste
At the core of the economic and regulatory discussions, the delegation addressed the creation of a **dissuasive eco-royalty of $1,000 per tonne** on the landfilling of hazardous waste and toxic industrial residues. The objective: break the business model of cheap mass landfilling in Blainville, discourage hazardous waste importation, and drive industry toward source reduction and advanced treatment.

#### 3. Denunciation of Bill 93 and Ottawa's Procedural Refusal
Discussions addressed the historic injustice of **Bill 93**, passed under gag order in 2023 to force municipal expropriation despite the unequivocal refusal in **BAPE Report 371**. 

Facing the federal government's response filed on October 16 with the Commission for Environmental Cooperation (CEC) — attempting to evade constitutional obligations regarding cadmium at 320 times acute toxicity criteria by invoking a simple petition to the OAG —, the MNA was particularly critical of Ottawa's dilatory posture and lack of rigor.

#### 4. Parliamentary Action Schedule and Advisory Council in January 2027
Far from a routine courtesy meeting, a concerted schedule of action was established:
- **December 2026:** Parliamentary interventions and initiatives coordinated closely with the international CEC determination deadline;
- **January 2027:** Establishment of a **permanent Advisory Council / Monitoring Committee** to structure local and regional action on contamination and land use;
- **Subsequent Expanded Meeting:** A broader follow-up bilateral working session has already been agreed upon.

#### 5. Youth Involvement and Citizen Vigilance
Nadine Le Gal reiterated her sincere commitment to actively involving youth and making intergenerational equity a pillar of her work. The presence of Édith Mora Castelan reinforced requirements for regulatory compliance and environmental transparency across the peatland watershed.

---

### A Decisive Step Toward the December CEC Decision
This direct institutional dialogue, conducted alongside leading experts such as Daniel Green and Édith Mora Castelan, confirms the incontrovertible credibility of the citizen initiative led by William Guindon. As the CEC Secretariat prepares to rule on recommending a Factual Record under Article 24.28 of CUSMA, citizen and parliamentary mobilization in Blainville reaches unprecedented strength."""

content_es["post-2026-11-06-rencontre-bilaterale-nadine-le-gal"] = """El **6 de noviembre de 2026**, se celebró una reunión bilateral oficial de la mayor importancia entre William Guindon y la diputada de la circunscripción de Blainville en la Asamblea Nacional de Quebec, **Nadine Le Gal**.

Demostrando una notable voluntad política y un compromiso directo con las preocupaciones ciudadanas, Nadine Le Gal dedicó esta sesión de trabajo en profundidad al futuro de la Grande Tourbière de Blainville, la ampliación del vertedero de Stablex y los avances del procedimiento internacional CCA SEM-26-003.

### 1. Participantes en la mesa de trabajo
La reunión congregó a:
- **Por la diputación provincial:** **Nadine Le Gal**, diputada de Blainville, acompañada por **Sylvain Pagé** (equipo parlamentario, respetada figura y exdiputado de los Laurentides).
- **Por la delegación ciudadana y ambiental:**
  - **William Guindon**, estudiante, militante ecologista y autor de la petición ciudadana SEM-26-003;
  - **Daniel Green**, científico ambientalista de renombre y vigía histórico de la Sociedad para Vencer la Contaminación (SVP);
  - **Édith Mora Castelan**, experta ciudadana, supervisora de campo en gestión de residuos y derechos ambientales.

![Reunión bilateral oficial del 6 de noviembre de 2026 con Nadine Le Gal, Sylvain Pagé, Daniel Green, Édith Mora Castelan y William Guindon](/assets/media/rencontre-nadine-le-gal-6-nov-2026.webp)

### 2. Principales avances y compromisos

#### 1. La Grande Tourbière declarada Prioridad N° 1
Nadine Le Gal reafirmó inequívocamente que la conservación de los ecosistemas amenazados de la Grande Tourbière de Blainville y el rigor frente al expediente Stablex ocupan el primer lugar de sus prioridades de mandato. La diputada mostró una receptividad excepcional ante las 222 pruebas documentales incorporadas al expediente público.

#### 2. Propuesta de ecotasa de 1.000 $/tonelada sobre residuos peligrosos
En el núcleo de los debates económicos y normativos, la delegación abordó la creación de una **ecotasa disuasoria de 1.000 $ por tonelada** sobre el confinamiento de residuos peligrosos y desechos industriales tóxicos. El objetivo: romper el modelo de negocio del confinamiento masivo de bajo costo en Blainville, desincentivar la importación de residuos tóxicos e impulsar la reducción en origen y tratamientos avanzados.

#### 3. Denuncia de la Ley 93 y de la maniobra procesal de Ottawa
Los intercambios repasaron la injusticia histórica de la **Ley 93**, aprobada por mordaza parlamentaria en 2023 para forzar la expropiación municipal pese al rechazo frontal del informe **BAPE 371**. 

Frente a la respuesta del gobierno federal presentada el 16 de octubre ante la Comisión para la Cooperación Ambiental (CCA) —que busca eludir sus obligaciones constitucionales sobre vertidos de cadmio a 320 veces la norma invocando una simple petición ante la OAG—, la diputada criticó severamente la postura dilatoria y la falta de rigor de Ottawa.

#### 4. Calendario de acción parlamentaria y Consejo Asesor en enero de 2027
Lejos de un mero encuentro protocolario, se estableció un calendario de acción concertado:
- **Diciembre de 2026:** Intervenciones e iniciativas parlamentarias coordinadas con el plazo de determinación internacional de la CCA;
- **Enero de 2027:** Constitución de un **Consejo Asesor / Comité de Seguimiento permanente** para estructurar la acción local y regional frente a la contaminación y ordenamiento territorial;
- **Próxima reunión ampliada:** Se acordó una nueva sesión de trabajo bilateral de mayor alcance.

#### 5. Participación juvenil y vigilancia ciudadana
Nadine Le Gal reiteró su firme voluntad de integrar activamente a la juventud y situar la defensa de las futuras generaciones en el centro de su acción. La presencia de Édith Mora Castelan reforzó las exigencias de cumplimiento normativo y transparencia ambiental en la cuenca de la turbera.

---

### Un paso decisivo hacia la resolución de la CCA en diciembre
Este reconocimiento institucional directo, alcanzado junto a personalidades de primer nivel como Daniel Green y Édith Mora Castelan, confirma la credibilidad irrebatible de la iniciativa ciudadana liderada por William Guindon frente al dictamen del Secretariado de la CCA bajo el Artículo 24.28 del T-MEC."""

# Post 1
content_en["post-2026-10-24-lobbyisme-septembre-2026"] = """On October 16, 2026, in its official response filed with the Commission for Environmental Cooperation (CEC, exhibit 72-RSP), the Government of Canada requested the immediate dismissal of citizen submission SEM-26-003, arguing that Environment and Climate Change Canada (ECCC) had acted with diligence.

However, an examination of the **Registry of Lobbyists of Canada** and parliamentary documentation reveals a deeply troubling timeline:

### 1. 119 Days of Silence vs. Private Meetings
While 10 formal questions submitted by William Guindon on cadmium contamination (measured up to 320 times acute aquatic toxicity criteria) remained completely unanswered by ECCC for 119 days, senior federal officials met privately with representatives of Stablex:
- **September 17, 2026:** An official meeting took place between the Associate Assistant Deputy Minister of ECCC and Stablex lobbyists regarding Cell 6;
- **During the same period:** Canada requested a 30-day extension from the CEC, citing the need to gather technical data, while actively consulting the company targeted by the submission.

### 2. Evidentiary Findings
The public register confirms that access granted to industrial interests directly contrasts with the institutional silence imposed on citizen scientific inquiries. 

All documentation, lobbying registry transcripts, and timeline analyses are preserved in the evidentiary record (Exhibits 180 to 195) accessible via the official media kit."""

content_es["post-2026-10-24-lobbyisme-septembre-2026"] = """El 16 de octubre de 2026, en su respuesta oficial ante la Comisión para la Cooperación Ambiental (CCA, documento 72-RSP), el Gobierno de Canadá solicitó el sobreseimiento de la petición SEM-26-003 alegando que Medio Ambiente y Cambio Climático Canadá (ECCC) había actuado con diligencia.

Sin embargo, una revisión del **Registro de Lobbistas de Canadá** y de la documentación parlamentaria revela una cronología sumamente preocupante:

### 1. 119 días de silencio frente a reuniones privadas
Mientras 10 preguntas formales presentadas por William Guindon sobre la contaminación por cadmio (medida hasta 320 veces las normas de toxicidad acuática aguda) quedaron sin respuesta durante 119 días por parte de ECCC, altos funcionarios federales se reunían en privado con representantes de Stablex:
- **17 de septiembre de 2026:** Reunión oficial entre el viceministro adjunto delegado de ECCC y lobbistas de Stablex respecto a la Celda 6;
- **Durante el mismo período:** Canadá solicitó una prórroga de 30 días a la CCA alegando la necesidad de recopilar datos técnicos, mientras consultaba a la empresa objeto de la denuncia.

### 2. Conclusiones probatorias
El registro público confirma que el acceso concedido a intereses industriales contrasta flagrantemente con el silencio institucional impuesto a las consultas científicas ciudadanas. 

Toda la documentación y transcripciones del registro de cabildeo están consignadas en el expediente probatorio (Pruebas 180 a 195)."""

# Post 2
content_en["post-2026-10-22-rencontres-parlementaires-novembre-nadine-le-gal-madeleine-chenette"] = """November 2026 will mark a decisive political and democratic turning point for the future of the Grande Tourbière de Blainville and citizen submission SEM-26-003.

Two high-level parliamentary meetings are confirmed:
1. **Nadine Le Gal**, Member of the National Assembly for Blainville (provincial), who prioritized this meeting ahead of opening her constituency office;
2. **Madeleine Chenette**, Member of Parliament for Thérèse-De Blainville in the House of Commons of Canada (federal).

These meetings aim to present the 222 documentary exhibits, address cadmium discharge data into the St. Lawrence river watershed, and demand the enforcement of the Fisheries Act and the Migratory Birds Convention Act."""

content_es["post-2026-10-22-rencontres-parlementaires-novembre-nadine-le-gal-madeleine-chenette"] = """Noviembre de 2026 marcará un punto de inflexión político y democrático decisivo para el futuro de la Grande Tourbière de Blainville y la petición ciudadana SEM-26-003.

Se confirman dos reuniones parlamentarias de alto nivel:
1. **Nadine Le Gal**, diputada de Blainville en la Asamblea Nacional (provincial);
2. **Madeleine Chenette**, diputada por Thérèse-De Blainville en la Cámara de los Comunes de Canadá (federal).

Estas reuniones tienen por objeto presentar las 222 pruebas documentales, analizar los vertidos de cadmio en la cuenca hidrográfica del río San Lorenzo y exigir el cumplimiento de la Ley de Pesca y la Ley sobre la Convención de Aves Migratorias."""

# Post 3
content_en["post-2026-10-16-reponse-du-canada-dossier-cce-sem-26-003"] = """On Friday, October 16, 2026, the Government of Canada filed its formal response (exhibit 72-RSP) with the Secretariat of the Commission for Environmental Cooperation (CEC).

### Key Takeaways of Canada's Response:
1. **No Contest on Science:** Canada does not dispute the factual accuracy of cadmium discharges measured at up to 320 times acute aquatic criteria, nor the destruction of 278,000 m² of peatland;
2. **Procedural Dismissal Requested:** The federal government requests dismissal or abeyance under Article 24.27(4)(a) of CUSMA, citing Environmental Petition No. 15-546 submitted to the Auditor General of Canada;
3. **Next Step:** The CEC Secretariat will determine under Article 24.28 whether Canada's response warrants recommending the development of a **Factual Record**."""

content_es["post-2026-10-16-reponse-du-canada-dossier-cce-sem-26-003"] = """El viernes 16 de octubre de 2026, el Gobierno de Canadá presentó su respuesta formal (documento 72-RSP) ante el Secretariado de la Comisión para la Cooperación Ambiental (CCA).

### Aspectos clave de la respuesta de Canadá:
1. **Sin objeción científica:** Canadá no refuta la exactitud fáctica de los vertidos de cadmio medidos hasta 320 veces las normas de toxicidad acuática aguda, ni la destrucción de 278.000 m² de turbera;
2. **Petición de sobreseimiento procesal:** El gobierno federal solicita el sobreseimiento o suspensión bajo el Artículo 24.27(4)(a) del T-MEC, invocando la Petición Ambiental N° 15-546 ante el Auditor General de Canadá;
3. **Siguiente paso:** La Secretaría de la CCA determinará bajo el Artículo 24.28 si procede recomendar la elaboración de un **Expediente de Hechos**."""

# Post 4
content_en["post-2026-09-29-signalement-terrain-incidents-fauniques-plan-bouchard"] = """As part of continuous field monitoring of local natural environments in Blainville, a formal wildlife reporting notice was submitted regarding wildlife carcasses and illegal waste dumping observed in the Plan-Bouchard woodland sector.

This documentation, supported by geotagged photographic evidence, was transmitted to environmental authorities to ensure full monitoring of ecological corridors connecting the Grande Tourbière to surrounding habitats."""

content_es["post-2026-09-29-signalement-terrain-incidents-fauniques-plan-bouchard"] = """En el marco del seguimiento continuo sobre el terreno de los espacios naturales de Blainville, se presentó un aviso formal relativo a restos de fauna silvestre y vertederos ilegales en el sector boscoso de Plan-Bouchard.

Esta documentación, respaldada por registros fotográficos geolocalizados, fue transmitida a las autoridades ambientales para garantizar el seguimiento de los corredores ecológicos que conectan la Gran Turbera."""

# Post 5
content_en["post-2026-09-29-petition-environnementale-546-verificateur-general-canada"] = """As part of comprehensive citizen action to protect the Grande Tourbière de Blainville, Environmental Petition No. 15-546 was officially registered in the catalogue of the Office of the Auditor General of Canada (Commissioner of the Environment and Sustainable Development - CESD).

This filing triggers a statutory obligation for the Ministers of Environment and Climate Change, Fisheries and Oceans, and Health Canada to provide formal responses within 120 days."""

content_es["post-2026-09-29-petition-environnementale-546-verificateur-general-canada"] = """En el marco de las gestiones ciudadanas para la protección de la Grande Tourbière de Blainville, la Petición Ambiental N° 15-546 quedó registrada oficialmente en el catálogo de la Oficina del Auditor General de Canadá (Comisionado de Medio Ambiente y Desarrollo Sostenible - CESD).

Esta presentación genera la obligación legal para los ministros de Medio Ambiente, Pesca y Océanos, y Salud de responder formalmente en un plazo de 120 días."""

# Post 6
content_en["post-2026-09-27-sem-26-003-blainville-dossier-complet-explique"] = """To make technical scientific data accessible to all citizens, William Guindon published a comprehensive 12-part documentary summary explaining citizen submission SEM-26-003.

Topics covered include the history of BAPE Report 371, Bill 93 passed under gag order, heavy metal leachate dynamics, federal jurisdiction over migratory birds, and the international CEC review process under CUSMA Articles 24.27 and 24.28."""

content_es["post-2026-09-27-sem-26-003-blainville-dossier-complet-explique"] = """Para hacer accesibles los datos científicos técnicos a todos los ciudadanos, William Guindon publicó un resumen documental divulgativo en 12 partes que explica la petición SEM-26-003.

Se abordan el informe BAPE 371, la Ley 93 aprobada por mordaza, la dinámica de lixiviados con metales pesados, la jurisdicción federal sobre aves migratorias y el proceso de revisión de la CCA bajo los artículos 24.27 y 24.28 del T-MEC."""

# Post 7
content_en["post-2026-09-25-tourbiere-qui-se-souvient-histoire-autochtone"] = """On the occasion of the National Truth and Reconciliation Week, William Guindon published a major independent documentary investigation entitled "The Peatland That Remembers: Indigenous History, Ecology & Water Territories of Blainville".

This study explores 6,000 years of ecological memory, traditional ancestral relationships of Indigenous peoples (Kanien'kehá:ka, Anishinaabeg, Haudenosaunee), and the preservation of wetland waterways."""

content_es["post-2026-09-25-tourbiere-qui-se-souvient-histoire-autochtone"] = """Con motivo de la Semana Nacional de la Verdad y la Reconciliación, William Guindon publicó una investigación documental independiente titulada «La turbera que recuerda: Historia indígena, ecología y territorios de agua de Blainville».

Este estudio examina 6.000 años de memoria ecológica, las relaciones ancestrales de los pueblos indígenas (Kanien'kehá:ka, Anishinaabeg, Haudenosaunee) y la conservación de los humedales."""

# Post 8
content_en["post-2026-09-25-confirmation-cce-premier-mineur-1994"] = """By official written confirmation on September 25, 2026, the Submissions on Enforcement Matters (SEM) Unit of the Commission for Environmental Cooperation Secretariat confirmed that William Guindon is the very first minor in the 32-year history of the mechanism (since 1994) to file a citizen submission."""

content_es["post-2026-09-25-confirmation-cce-premier-mineur-1994"] = """Mediante comunicación oficial escrita el 25 de septiembre de 2026, la Unidad de Peticiones Ciudadanas (SEM) del Secretariado de la Comisión para la Cooperación Ambiental confirmó que William Guindon es el primer menor en los 32 años de historia del mecanismo (desde 1994) en presentar una petición."""

# Post 9
content_en["post-2026-09-24-avis-clarification-independance"] = """Official clarification notice from William Guindon reiterating the absolute independence, individual nature, and self-funded status of submission SEM-26-003 filed with the CEC.

This notice clarifies that the legal and scientific research was conducted without external party drafting or partisan affiliation, in accordance with the Declaration of Political Independence."""

content_es["post-2026-09-24-avis-clarification-independance"] = """Aviso oficial aclaratorio de William Guindon reiterando la absoluta independencia, el carácter individual y el autofinanciamiento de la petición SEM-26-003 presentada ante la CCA.

Se aclara que la investigación jurídica y científica se desarrolló sin redacción externa ni afiliación partidaria, conforme a la Declaración de Independencia Política."""

# Post 10
content_en["post-2026-09-23-autonomie-juridique-adolescents"] = """Advocacy for the legal and civic autonomy of adolescents: breaking through institutional ageism and bureaucratic paternalism.

William Guindon addresses the legal contradiction where minors aged 14 to 17 may consent to medical care but face administrative roadblocks when seeking to question municipal councils or participate in environmental administrative proceedings."""

content_es["post-2026-09-23-autonomie-juridique-adolescents"] = """Alegato por la autonomía jurídica y cívica de los adolescentes: romper la discriminación institucional por edad y el paternalismo burocrático.

William Guindon aborda la contradicción legal en la que menores de 14 a 17 años pueden consentir tratamientos médicos pero enfrentan barreras administrativas al formular preguntas ante ayuntamientos o participar en procedimientos ambientales."""

# Post 11
content_en["post-2026-09-22-moteur-recherche-pieces"] = """Official launch of the full-text search engine (OCR) dedicated to the 222 supporting exhibits of submission SEM-26-003, alongside a downloadable ZIP archive containing over 96% of the public documentary record."""

content_es["post-2026-09-22-moteur-recherche-pieces"] = """Lanzamiento oficial del motor de búsqueda de texto completo (OCR) dedicado a las 222 pruebas de la petición SEM-26-003, junto con un archivo ZIP descargable con más del 96% del acervo documental público."""

# Post 12
content_en["post-2026-09-11-enquete-partis"] = """Publication of the citizen survey report analyzing the official positions of Quebec political parties regarding Stablex Cell 6 expansion and the landmark CEC determination on SEM-26-003."""

content_es["post-2026-09-11-enquete-partis"] = """Publicación del informe de la encuesta ciudadana que analiza el posicionamiento oficial de los partidos políticos de Quebec frente a la ampliación de la Celda 6 de Stablex y la resolución de la CCA sobre SEM-26-003."""

# Post 13
content_en["post-2026-09-05"] = """Behind the scenes of filming at Lac Fauvel with the Lab22 team, exploring the human story, personal dedication, and intergenerational motivations behind filing submission SEM-26-003 with the CEC."""

content_es["post-2026-09-05"] = """Entre bastidores del rodaje en Lac Fauvel con el equipo de Lab22, explorando la dimensión humana, el compromiso personal y las motivaciones intergeneracionales detrás de la presentación de la petición SEM-26-003 ante la CCA."""

# Post 14
content_en["post-2026-08-20-victoire-cce"] = """Historic victory: On August 17, 2026, the CEC Secretariat issued its determination under CUSMA Article 24.27(2), finding that submission SEM-26-003 met all criteria and ordering an official response from the Government of Canada by October 16, 2026."""

content_es["post-2026-08-20-victoire-cce"] = """Victoria histórica: El 17 de agosto de 2026, la Secretaría de la CCA dictó su determinación bajo el Artículo 24.27(2) del T-MEC, declarando admisible la petición SEM-26-003 y solicitando una respuesta oficial al Gobierno de Canadá para el 16 de octubre de 2026."""

# Post 15
content_en["post-2026-07-16-soumission-revisee"] = """Filing of the revised 15-page submission SEM-26-003 with the Commission for Environmental Cooperation, consolidating factual evidence on BAPE Report 371, Bill 93, and cadmium toxicity risks in groundwater and migratory bird habitats."""

content_es["post-2026-07-16-soumission-revisee"] = """Presentación de la petición revisada de 15 páginas SEM-26-003 ante la Comisión para la Cooperación Ambiental, consolidando pruebas sobre el informe BAPE 371, la Ley 93 y los riesgos de toxicidad por cadmio en aguas subterráneas y hábitats de aves migratorias."""

# Match by ID or index
for i, p in enumerate(posts):
    pid = p.get('id', '')
    if pid in content_en:
        p['content_en'] = content_en[pid]
    elif i == 13: # Lab22
        p['content_en'] = content_en["post-2026-09-05"]
    else:
        p['content_en'] = p.get('content', '')

    if pid in content_es:
        p['content_es'] = content_es[pid]
    elif i == 13:
        p['content_es'] = content_es["post-2026-09-05"]
    else:
        p['content_es'] = p.get('content', '')

with open(blog_path, 'w', encoding='utf-8') as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print(f"Successfully enriched {len(posts)} posts in data/blog.json with content_en and content_es!")
