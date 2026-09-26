# Fundamento en la literatura y recomendaciones para el auditor

> Documento de trabajo. Responde a dos preguntas: (1) ¿el auditor consulta la literatura?, y (2) ¿qué debe contener un assessment "lo mejor posible" según las fuentes vinculantes, y qué le falta hoy al auditor para exigirlo?
>
> **Estado:** propuesta. Ninguna regla clínica de §6 de `CONTEXTO_AUDITOR_Claude_Code.md` se cambia sin aprobación de Rolando.

---

## 1. Cómo consulta hoy el auditor la literatura: no la consulta

Verificado en el código (`ABA_Assessment_Auditor_v2.html`):

- **Cero herramientas de recuperación.** No hay `web_search`, ni RAG, ni ningún `tools:[...]` en los 10 sitios de llamada a la API. El único tráfico saliente es a `api.anthropic.com/v1/messages` con texto plano.
- **Los estándares se citan por nombre, 10 veces, dentro de los prompts.** El modelo responde desde su **memoria de entrenamiento**, no desde el texto de esas fuentes.
- Las reglas deterministas son **conocimiento de dominio que Rolando codificó a mano**, no derivado de una lectura de las fuentes.

Riesgos: citas de sección no verificables; deriva silenciosa cuando las normas se actualizan; y cobertura desigual — lo que nunca se codificó a mano no se audita, y su ausencia no es visible en el reporte.

**La conclusión no es "añadir búsqueda web al auditor".** Un assessment se audita contra requisitos estables, y una llamada desde el navegador con la clave del usuario no es lugar para recuperación documental. Lo correcto es **fijar los requisitos por escrito en el repositorio, con su fuente**, y que los prompts trabajen contra esa lista. Este documento es el primer paso.

### Estado de verificación

| Fuente | Estado |
|---|---|
| **Florida Medicaid, Behavior Analysis Services Coverage Policy, diciembre 2024** (incorporada por referencia en la Regla 59G-4.125, F.A.C.) | ✅ **Texto primario leído** (12 pp.) |
| **CASP/APBA, ASD Assessment Guidelines for Behavior Analysts (marzo 2026)** | ✅ **Texto primario leído** (79 pp.) |
| CASP ABA Practice Guidelines v3.0 (2024) | ⚠️ Solo resúmenes de búsqueda |
| BACB Ethics Code | ⚠️ Solo referencias indirectas; números de sección **no** verificados |
| Literatura revisada por pares | ⚠️ Solo resúmenes de búsqueda |

**[P]** = fuente primaria leída, citable. **[V]** = solo búsqueda; no debe citarse sección hasta verificarse.

> **Hallazgo transversal:** la política de Florida Medicaid establece que "**All services must be delivered in accordance with the current practice standards as published by the Council of Autism Service Providers**" (§4.2, dic. 2024). Es decir, **las guías de CASP son vinculantes por incorporación**, no meramente recomendables. Eso da respaldo regulatorio directo a las reglas basadas en CASP.

---

## 2. ✅ Conflicto de TBD — resuelto: exención estrechada

El cambio que implementamos esta sesión exime de marcar los "TBD" de fechas y de conductas/reemplazos nuevos. La política de Florida Medicaid, §6.2.2, **exige literalmente**, para **cada** target, goal u objective:

> ▪ Definition in observable, measurable terms · ▪ Direct observation and measurement procedures · ▪ Current level (baseline) · ▪ Behavior reduction or acquisition procedures · ▪ Condition(s) under which behavior is to be demonstrated and mastery criteria · ▪ **Date of introduction** · ▪ **Estimated date of mastery** · ▪ Plan for generalization · ▪ Timely reporting of progress…

Y repite **date of introduction** y **estimated date of mastery** para las metas de entrenamiento a cuidadores.

**Lo que esto significa:**

| Uso de TBD | Veredicto |
|---|---|
| Fecha de inicio de servicios, período de autorización, próxima revisión — dependen del QIO | **Tu criterio se sostiene.** No hay requisito que obligue a fijarlas antes de la aprobación |
| **`Date of introduction` o `Estimated date of mastery` de una meta** | **Es un elemento requerido faltante.** La norma pide una fecha *estimada* — precisamente porque no se exige certeza, el "TBD" no queda justificado |
| Línea base ("current level") de una conducta nueva | **También es elemento requerido.** §6.2.2 lo exige por meta, sin excepción por novedad |

Mi implementación actual clasifica como válido un TBD junto a `baseline`, `mastery`, `criteri`, `goal` u `objective` en un reassessment — es decir, **exime justo los campos que la norma exige**. Un revisor del QIO puede denegar por eso.

**Resuelto** (aprobado por Rolando): la exención se estrechó a fechas de **servicio y autorización**. Los campos de meta de §6.2.2 vuelven a marcarse, ahora como `FL_GOAL_ELEMENT_TBD` — `blocker` de categoría `florida_medicaid` que cita la sección y explica que la norma pide un valor estimado. Se eliminó por completo la vía de exención por "conducta o reemplazo nuevo". *Fuente: FL Medicaid §6.2.2, p. 7–8.* **[P]**

---

## 3. Florida Medicaid (vinculante) — requisitos literales **[P]**

### 3.1 Instrumentos estandarizados obligatorios — §4.2.1

La evaluación inicial **debe** incluir administración, puntuación y reporte de **dos instrumentos núcleo**:

- **Vineland-3 Comprehensive Parent Interview Form** — para **todos** los recipients, **más el Maladaptive Behavior Domain** para 3 años en adelante
- **BASC-3 PRQ** (Parenting Relationship Questionnaire) — para edades de 2 a 18 años

> "The **complete scoring report, including outcome measure scores, must be submitted** with service prior authorization requests."

Instrumentos adicionales quedan a discreción del Lead Analyst. **En reassessments, los instrumentos núcleo deben incluirse cada 12 meses.**

> Hoy el auditor tiene "vineland" como una palabra clave dentro de una sección **opcional**. Esto es un requisito duro con consecuencia de denegación.

### 3.2 Elementos requeridos del assessment y el behavior plan — §6.2.2

Debe estar **firmado por el Lead Analyst y por el padre o tutor**, e incluir:

Patient information · Reason for referral · **Medical and developmental history, incluyendo medicamentos prescritos para atenuar conductas** · Relevant family history · Clinical interview · **Review of recent assessments/reports (file review)** · Assessment procedures and results · Behavior plan · Treatment setting(s) · Proposed treatment targets/goals/objectives · **[los 9 elementos por meta de §2 arriba]** · Parent/guardian/caregiver training (con targets, **training procedures**, date of introduction, estimated date of mastery) · **Number of units requested** (por código de procedimiento **y la necesidad médica de las unidades solicitadas**) · **Supervision plan, incluyendo el nombre de los supervisores autorizados** · **Care coordination** con padres/cuidadores, escuelas, programas estatales de discapacidad · Transition (fading) plan · Crisis management plan · Discharge plan.

### 3.3 Reassessment — §6.2.3

Además de todo lo anterior:

- **Datos de progreso de todas las conductas tratadas. "Each behavior under treatment must have its own data table and corresponding graph."**
- **Narrativa de progreso + justificación de continuación al nivel de intensidad solicitado**
- Si no hubo progreso clínicamente significativo en el período: **explicar por qué y qué cambios de tratamiento se harán**

Frecuencia: reassessment y plan actualizado **al menos cada 6 meses**; instrumentos núcleo cada 12 meses. **Evaluaciones más frecuentes son obligatorias cuando** (a) emerge una conducta nueva que interfiere con una actividad vital mayor y (b) servicios adicionales son médicamente necesarios para abordarla. Un cambio de estatus del practicante (p. ej. RBT que se certifica como BCaBA) **no** es motivo para reassessment.

### 3.4 Límites cuantitativos y de proveedor — §4.2.2

- **Hasta 40 horas semanales** de servicios de intervención BA
- **Grupo: máximo 6 participantes**
- **Adaptive behavior treatment with protocol modification: solo Lead Analyst o BCaBA** (no RBT) — igual para la modalidad grupal
- Family adaptive behavior treatment guidance: Lead Analyst o BCaBA
- El Lead Analyst puede dar **hasta 2 h/semana** de entrenamiento a padres por telemedicina
- **Autorización del QIO antes de iniciar y al menos cada 180 días**

### 3.5 Participación de padres — §4.2.2 y §7.2

> "The provider **must make every effort to accommodate parental participation and must document those efforts in treatment plan updates**. If parent or guardian participation is not possible, the treatment plan and session notes must document the reasons for non-participation. Documentation should also explain **potential impacts of non-participation and how potential impacts are being mitigated**."

Y: "Authorization requests for service continuation **must include data about parental guardian participation** in services."

### 3.6 Servicios NO cubiertos — §5.2

Auditable como bandera roja si aparecen en el plan:

- **Cualquier procedimiento o técnica de manejo de crisis que implique reclusión o restricción manual, mecánica o química**
- Supervisión del recipient, asistencia personal (1:1 aide), companion, chaperone o shadow, en cualquier actividad o entorno
- Servicios de cuidador o guardería
- **Psychological testing, neuropsychology, psychotherapy, cognitive therapy, sex therapy, psychoanalysis, hypnotherapy, long-term counseling**
- Servicios el mismo día que behavioral health overlay / therapeutic behavioral on-site / therapeutic group care
- Servicios simultáneos de más de un proveedor BA, salvo necesidad médica + autorización previa + constancia en el plan aprobado
- **Travel time**

### 3.7 Alta — §4.2.4

Se considera el alta cuando: el recipient deja de ser elegible; deja de cumplir necesidad médica (Regla 59G-1.010); ya no presenta conductas maladaptativas; **los datos indican que la frecuencia y severidad o el nivel de deterioro funcional ya no es barrera** para funcionar en su ambiente; el deterioro funcional ya no justifica continuar; o **el padre o tutor retira el consentimiento**.

### 3.8 Servicios en escuela — §7.2

La solicitud debe incluir el **IEP**. Sin IEP, o si el IEP no contiene servicios BA: documentación que justifique los servicios **y un tiempo estimado de cuándo se completará o actualizará el IEP**. Si la escuela no hace IEP, sirve un plan 504; si no hace ninguno, documentación con el nombre de la escuela y la explicación.

---

## 4. CASP/APBA, ASD Assessment Guidelines (marzo 2026) — **[P]**

Vinculantes por incorporación (ver §1).

**4.1 Evaluación multimodal.** "No single assessment tool or fixed set of instruments can provide all of the information needed" (consenso NASEM 2025; cap. 3, p. 22). Combina revisión de registros, entrevistas, observación directa, y evaluaciones formales e informales. La **revisión de registros** es de los primeros pasos, y la **evaluación diagnóstica** es un registro que el analista debe saber leer y priorizar.

**4.2 La observación directa es primaria.** "Practitioners should prioritize the use of **direct observation and measurement—the heart of ABA**… **Indirect measures supplement direct measures**" (cap. 3, p. 22). Una función sostenida solo en un FAST o un MAS no cumple el estándar.

**4.3 Cuatro dominios de evaluación** (cap. 5, Key Points, p. 54): (a) características nucleares del TEA — comunicación social y conductas restringidas; (b) conducta y funcionamiento adaptativo; (c) **bienestar y calidad de vida**; (d) **condiciones co-ocurrentes y características asociadas** — salud mental, discapacidad intelectual, trastornos del lenguaje.

**4.4 Los criterios diagnósticos no son una lista de objetivos.** "It warns against **using diagnostic criteria as checklists for treatment targets** and instead promotes aligning interventions with outcomes meaningful to the client and their support system" (cap. 5, p. 54).

**4.5 IOA y fidelidad procedimental son distintos, y se exigen ambos** (cap. 4). IOA evalúa fiabilidad del dato y detecta **deriva del observador** y definiciones que necesitan aclararse. La **fidelidad procedimental** — "just as practitioners measure the treatment fidelity of ABA-based services, they should also measure and evaluate the **procedural fidelity of assessment implementation**" — se mide con una lista paso a paso puntuada Sí/No que produce un **porcentaje de adherencia**, y sirve para (a) auto-monitoreo, (b) supervisión y competencia, (c) **validación de los datos**. Meta: adherencia total, "especialmente al usar herramientas estandarizadas, donde la fidelidad procedimental afecta directamente la validez de los resultados" (p. 43).

**4.6 Consentimiento informado incluyendo assent del cliente.** "Informed consent, **including assent from the client being assessed**, must be obtained, with all stakeholders clearly understanding the purpose, procedures, and potential risks" (cap. 2, Key Points, p. 18).

**4.7 Competencia y calificaciones.** Entrenamiento en administrar, puntuar e interpretar; respetar las calificaciones exigidas por el editor del instrumento y el alcance regulatorio de práctica.

**4.8 Limitaciones documentadas.** "Clear documentation of **assessment limitations and clinical rationale** is essential" (cap. 3, p. 40). Caso explícito: cuando el financiador exige un instrumento que no captura bien las necesidades, hay que comunicar las limitaciones y justificar medidas alternativas. *(Nota: en Florida esto aplica directamente al Vineland-3/BASC-3 exigidos por §4.2.1.)*

**4.9 Ambiente natural.** Las evaluaciones en entornos naturales, cuando es apropiado, dan "**a more accurate baseline**" y variables contextuales críticas (cap. 6, p. 61).

**4.10 Análisis ecoconductual y SDOH.** Fortalezas y barreras ambientales; los determinantes sociales de la salud explican **30–55 %** de los resultados en salud (OMS). Ejemplo del propio documento: un niño con ausentismo escolar crónico no se beneficiará de intervención en centro salvo que se aborden las barreras de asistencia (cap. 3, p. 38; Apéndice B).

**4.11 Vínculo evaluación → meta.** "A practitioner should **directly link the information gathered from the assessment to protocol design and the rationale for targeting specific behaviors**" (cap. 6, p. 59).

---

## 5. Molina Healthcare — capa de pagador (vigente julio 2026) **[P]**

> **Molina no reemplaza a AHCA: se apila encima.** La guía de Florida declara en portada *"Based in: AHCA BA Services Coverage Policy (December 2024)"*. Las reglas de §3 siguen vigentes; lo que cambia es que ahora hay exigencias de pagador que se suman.

**Documentos leídos** (los cinco, texto primario):

| Documento | Fecha | Qué es | Peso |
|---|---|---|---|
| **MHFL Comprehensive BA QRG** v1.0, 20 pp. | efectiva **julio 2026** | Guía de autorización y documentación de Molina Florida | **Principal.** Es lo que aplica el revisor |
| **Molina Clinical Policy No. 482** | aprob. **06/10/2026**, revisión jun. 2027 | Criterios de necesidad médica: iniciación, continuación, alta | **Crítico.** Aquí están los umbrales |
| ABA documentation requirements, 2 pp. | s.f. | Checklist de plan inicial y continuado | Concreto y verificable |
| BA Quick Reference Guide 2026 | rev. 02/05/2026 | Facturación, códigos, contactos | Casi todo administrativo |
| Marketplace BID — Autism Spectrum Disorder | 2024 | Planes comerciales, 15 estados | Marginal: no es Medicaid |

### 5.1 Lo que CONFIRMA — cinco reglas suben de rango

Pasan de "inferidas de CASP" a **exigidas contractualmente por el pagador**. Eso cambia su fuerza en una apelación.

| Regla nuestra | Texto de Molina |
|---|---|
| **R4** tabla + gráfico por conducta | *"Each behavior under treatment must have its own data table and corresponding graph for reauthorization requests"* (QRG §2) — idéntico |
| **R1** instrumentos núcleo | Repetido literal: Vineland-3 Comprehensive Parent Interview Form **todos** los miembros, Maladaptive Behavior Domain **≥3 años**, BASC-3 PRQ **2–18**, *"complete scoring report including outcome measure scores"*, cada 12 meses (QRG §4A) |
| **R7** participación parental | *"If a parent or guardian cannot participate, this must be documented with explanation and a plan to mitigate impacts"* (QRG §2) — idéntico |
| **R10** fuente de evidencia de la función | Molina va **más lejos**: *"Naming the function of a behavior (attention, escape, sensory, tangible) is not sufficient by itself"* y *"Vineland-3 and BASC-3 scores alone do not constitute an FBA… they are never used to construct the FBA or BIP"* (QRG §2 y §4B) |
| **R20** alcance ↔ intensidad | *"comprehensive (multiple developmental domains) vs. focused (specific skills or behaviors); comprehensive treatment typically requires greater intensity"* (QRG §5) |

### 5.2 Lo que RESUELVE — la métrica de intensidad, y un umbral nuevo

R9 se bajó a `warning` porque la métrica estaba en disputa: CASP define intensidad como horas **directas** (excluye entrenamiento a cuidadores, supervisión y manejo de caso), pero Florida no lo precisaba. Ver `CASP_INTENSITY_METRIC`.

**Molina zanja la MÉTRICA, no el techo.** MCP 482 fija el disparador en **"25 direct hours per week"** — usa explícitamente *direct*. Es la métrica de CASP, ahora en boca del pagador, y está en el cuerpo nacional de la política (no en un añadido estatal: verificado).

> ⚠️ **Corrección a una versión anterior de esta sección, que decía "Molina lo zanja" a secas.** Zanja *qué cuenta el número*, no *cuál es el techo*. El 40 h de AHCA (§4.2.2) sigue siendo un **total de líneas de intervención** —la propia política enumera *protocol modification* y *family guidance* entre ellas— y MCP 482 no deroga una regla estatal; su propio disclaimer dice que los requisitos legales del estado pueden mandar. **En Florida corren los dos medidores a la vez, y un mismo plan puede estar por encima de uno y por debajo del otro.** 30 h de 97153 + 8 h de 97155 + 4 h de 97156 = 42 totales (excede el techo de Florida) pero 30 directas (dentro del rango comprehensivo de CASP).

> ⚠️ **El umbral de "15 hours" que aparece junto al criterio 5 NO es de Molina ni de Florida.** Es del *South Carolina Department of Health and Human Services, ASD Services Provider Manual*, citado como nota superpuesta: MCP 482 tal como está emitido trae siete anotaciones de Carolina del Sur y **cero** menciones a Florida. Una regla construida sobre ese 15 estaría importando el manual de Medicaid de otro estado.

> ⚠️ **El quinto documento (`bid_asd`) es de Marketplace, no de Medicaid.** Es un *Marketplace National Regional Benefit Interpretation Document*; lista Florida entre sus estados, pero rige planes de intercambio. Su cifra —*"at least 20 hours per week over a six-month period"*— es además un **piso** para el nivel intensivo, no un techo: va en dirección contraria a todo lo demás. Solo aplica si algún cliente está en un plan Marketplace de Molina en vez de Medicaid.

Por encima de 25 h directas exige **todo** lo siguiente (MCP 482, criterio 5 en iniciación y criterio 11 en continuación):

- Impairment funcional evidenciado por **uno** de: deficiencias significativas en múltiples dominios · conductas persistentes que amenazan la seguridad e interfieren con el progreso
- Por qué esa intensidad es necesaria para los impairments específicos
- **Por qué las metas no se pueden alcanzar con menos horas o modelos alternativos** (solo en continuación)
- Período de tratamiento definido, con plazo de reevaluación **≥ cada 6 meses** y **tapering planificado**
- Revisión continua de comorbilidades

> **Para Molina el umbral operativo no es 40 h, es 25 h directas.** El techo de 40 h de Florida (§4.2.2) sigue siendo el máximo absoluto; 25 h es donde empieza la carga probatoria.

### 5.3 Lo que AÑADE — requisitos que hoy no auditamos

**5.3.1 El CDE es un documento separado — causa #1 de denegación según ellos mismos.**

Molina lo dice dos veces, en §1 y en las FAQ: *"a CDE (even one that includes Vineland-3 or BASC-3 scores within the diagnostic evaluation) does not satisfy the separate AHCA requirement for a behavior assessment… Both documents are required; one does not replace the other."*

El **Comprehensive Diagnostic Evaluation** tiene lista cerrada de quién puede hacerlo (PCP con especialidad en familia/interna/pediatría · pediatra del desarrollo o neurodesarrollo, neurología pediátrica, psiquiatría · psicólogo infantil PhD/PsyD · psicólogo escolar **licenciado** —*"an unlicensed school psychologist may not conduct a CDE"*— o equipo multidisciplinario liderado por uno de ellos) y ocho elementos obligatorios:

diagnóstico formal **declarado por el clínico** (*"not just a score from a screening tool such as CARS or ADOS"*) · antecedentes y motivo de consulta · **observación directa documentada** · testing diagnóstico con puntuación, interpretación y significación clínica (*"School accommodation letters alone are not sufficient"*) · instrumentos alineados al estándar de cuidado · recomendaciones de tratamiento individualizadas (*"Generic recommendations are insufficient"*) · **firma y fecha del practicante** · **input de padre/tutor** reflejado en los hallazgos.

Y tres marcadores de CDE sólido: diagnóstico **mapeado a criterios DSM-5** con ejemplos de este niño · **nivel de severidad DSM-5 (1, 2 o 3)** con necesidades de apoyo descritas · **impairment funcional documentado en más de un entorno** (*"A diagnosis without documented functional impairment does not by itself establish the need for intensive services"*).

**5.3.2 Fechas — aritmética pura, cero ambigüedad.** El bloque más barato de implementar y el que más devoluciones causa.

| Requisito | Umbral | Fuente |
|---|---|---|
| Plan escrito o actualizado antes de enviar a reautorización | **60 días** | checklist de documentación |
| Reautorización | al menos cada **180 días**; enviar entre 30 días antes y **no menos de 10 días** antes del vencimiento | QRG, Coverage & PA Basics + FAQ |
| Evaluación diagnóstica estandarizada antigua | **> 24 meses** → exige documentación actualizada de síntomas ASD e impacto funcional | MCP 482, 1.g.ii |
| Reassessments | **≥ cada 6 meses** | MCP 482, 4.l |
| El behavior plan debe cubrir | **todo el período solicitado (hasta 6 meses)** | QRG §2 y §3 |

**5.3.3 Transición y alta — conecta directo con el trabajo de TBD.**

*"A transition and discharge plan must be established at the initiation of BA services, not deferred until the member is ready to discharge"* (QRG §8). Y el criterio explícito, que es exactamente la lógica de `PLACEHOLDER_TBD_CONVENTION` aplicada al alta:

> ***"Discharge criteria should be objective and individualized, not vague. 'When clinically appropriate' is not a discharge criterion."***

El ejemplo que dan es cuantitativo: *0 instancias de agresión durante 6 meses, cuando el nivel actual es 50 instancias/día*.

**5.3.4 Resto de bloques nuevos:**

- **Referral del PCP** firmado, de un PCP calificado para evaluar y diagnosticar, y que **especifique servicios ABA** (QRG §3)
- **Coordinación de cuidado**: listar todos los servicios y proveedores actuales y describir *"how BA services complement rather than duplicate other services"* (QRG §7)
- **Horas vs. disponibilidad real**: *"hours requested cannot exceed hours the member is actually available"*; si exceden, exige rationale escrito, plan de coordinación y evidencia de intentos de acomodar el horario (QRG §5)
- **IEP**: tabla de cuatro situaciones (existe e incluye BA · existe sin BA · 504 en su lugar · la escuela no hace ninguno · no matriculado), cada una con documentación distinta (QRG §7). Más granular que nuestra regla actual
- **Contenido obligatorio de FBA**: consentimiento informado y rationale · metodología **directa e indirecta** · definiciones operacionales con datos del miembro de frecuencia, tasa, duración e intensidad (*"The function alone is not an assessment"*) · funciones hipotetizadas con antecedentes y consecuencias · reemplazos funcionalmente equivalentes (QRG §4C)
- **Contenido obligatorio de BIP**: consentimiento informado · **fecha de inicio y de todas las revisiones** · individualizado al miembro, al implementador y al entorno · **capacidad del stakeholder de implementarlo** · reemplazos en la sección de adquisición. *"must be updated as often as necessary… not just at reassessment"*
- **Suficiencia de metas frente a unidades**: *"there should be enough goals considering the intensity of behaviors and the requested units"* (checklist)
- **Telehealth**: limitado a entrenamiento a cuidadores, coaching, supervisión y componentes indirectos; *"not used solely for convenience, access, geographic distance, or provider preference"* (MCP 482)
- **Notas de sesión**: fecha, hora, lugar y duración · conductas maladaptativas **anotadas explícitamente aunque no hayan ocurrido** · respuesta del miembro individualizada · modificaciones de protocolo · **presencia del padre, con razón documentada si está ausente** · participantes. *"Session notes that are templated, copied forward, or missing individualized clinical detail do not meet documentation requirements"* (QRG §6)
- **97151 NO requiere autorización previa**; 97153, 97154, 97155 y 97156 sí (QRG §9)

### 5.4 Una tensión que hay que acotar

**R14** (`CASP_NOT_DSM_CHECKLIST`) marca como problema que las metas copien criterios DSM verbatim. Molina, en cambio, **exige** que el CDE mapee el diagnóstico a criterios DSM-5 con ejemplos del niño.

No es contradicción —son documentos distintos— pero si se audita un paquete que incluye el CDE, R14 produciría un falso positivo sobre él. **Acción: acotar R14 al plan de tratamiento, excluyendo secciones de evaluación diagnóstica.**

### 5.5 Nota para el modo apelación

Molina restringe el peer-to-peer de forma que afecta a `APPEAL_LEVELS`:

- Solo entre el **clínico tratante** y un Medical Director. *"They are not intended for CEOs, business owners, UM staff, or other non-treating representatives"*
- *"They may not be recorded or transcribed, including by AI tools"*
- Molina hace **reconsideración o peer review, no ambas**
- **Una vez presentada la apelación, ya no se puede pedir P2P** sobre ese caso

### 5.6 Filas propuestas para `AUDIT_REQUIREMENTS`

Ninguna implementada. Todas con `verificacion:'primaria'` — texto primario leído.

| id propuesto | Requisito | Severidad sugerida |
|---|---|---|
| `MOL_CDE_REQUIRED` | CDE con los 8 elementos, por practicante de la lista calificada | blocker |
| `MOL_CDE_VS_BEHAVIOR_ASSESSMENT` | El CDE no satisface el behavior assessment; ambos requeridos | blocker |
| `MOL_PCP_REFERRAL` | Referral firmado del PCP que especifique ABA | blocker |
| `MOL_PLAN_60_DAYS` | Plan escrito o actualizado dentro de 60 días del envío | blocker |
| `MOL_REAUTH_WINDOW` | Envío entre 30 y 10 días antes del vencimiento; reauth ≤180 días | warning |
| `MOL_DX_ASSESSMENT_24M` | Evaluación diagnóstica >24 meses exige actualización documentada | warning |
| `MOL_PLAN_COVERS_PERIOD` | El behavior plan cubre todo el período solicitado (hasta 6 meses) | blocker |
| `MOL_TRANSITION_AT_INIT` | Plan de transición establecido en la iniciación, no diferido | blocker |
| `MOL_DISCHARGE_OBJECTIVE` | Criterios de alta objetivos; "when clinically appropriate" no es criterio | blocker |
| `MOL_HIGH_INTENSITY_25H` | >25 h directas/sem dispara cinco requisitos documentales | blocker |
| `MOL_FBA_CONTENT` | Contenido obligatorio del FBA, con datos del miembro | blocker |
| `MOL_BIP_CONTENT` | Contenido obligatorio del BIP, con fechas de revisión | blocker |
| `MOL_DATA_TABLE_GRAPH` | Tabla y gráfico por conducta (refuerza R4 con fuente de pagador) | blocker |
| `MOL_CARE_COORDINATION` | Servicios listados + cómo BA complementa sin duplicar | warning |
| `MOL_HOURS_VS_AVAILABILITY` | Horas solicitadas ≤ disponibilidad documentada del miembro | warning |
| `MOL_GOALS_VS_UNITS` | Metas suficientes frente a las unidades solicitadas | warning |
| `MOL_IEP_SITUATIONS` | Documentación de IEP/504 según las cuatro situaciones | warning |
| `MOL_TELEHEALTH_SCOPE` | Telehealth solo indirecto; nunca por conveniencia | warning |
| `MOL_SESSION_NOTES` | Elementos de nota de sesión; no plantillas | warning |
| `MOL_97151_NO_PA` | 97151 no requiere autorización previa; el resto sí | n/a (informativo) |

### 5.7 Orden recomendado

1. **✅ IMPLEMENTADO — Sustituir el pagador codificado a mano.** "Sunshine Health" estaba escrito en seis lugares, incluidos dos prompts de IA. Ver `PAYER`.
2. **✅ IMPLEMENTADO — Bloque de fechas** (5.3.2) como `scanPayerDates`, seis reglas, categoría `payer_timelines`. **Solo compara fechas internas del documento**, nunca contra la fecha de la auditoría: los analistas envían el paquete antes de auditarlo, así que el reloj de hoy sobreestima la edad al enviar. Ver `CONTEXTO_AUDITOR_Claude_Code.md` §1.2
3. **✅ IMPLEMENTADO — CDE como documento separado** (5.3.1) como `scanCdeSeparate`, ocho reglas, categoría `cde_requirement`. Distingue lo **concluyente** (el documento declara que el CDE cubre el requisito del behavior assessment, o apoya el FBA en el Vineland/BASC → `blocker`) de lo **no concluyente** (el documento no menciona la procedencia del diagnóstico → `warning` que pide verificar, porque el auditor ve un solo archivo y no el paquete). No audita el contenido del CDE: ese documento no es el que se sube. Ver `CONTEXTO_AUDITOR_Claude_Code.md` §1.3
4. **✅ IMPLEMENTADO — Criterios de alta objetivos** (5.3.3) como `scanDischargeCriteria`, seis reglas, categoría `discharge_criteria`. El parentesco con TBD se confirmó: es el mismo defecto —el campo existe y su contenido no compromete a nada— salvo que el placeholder es una **fórmula clínica vaga** en vez de la cadena `TBD`. Las cuatro reglas de objetividad son **excluyentes**: un solo hallazgo, el que mejor describa el caso. No reporta la ausencia de la sección (ya lo hacen `SEC_TRANSITION` y `dischargePlan`) ni reclama los cinco criterios de AHCA, que copiados son un hallazgo y no un requisito. Ver `CONTEXTO_AUDITOR_Claude_Code.md` §1.4
5. **✅ RESUELTO — R9 se queda como está, por decisión de Rolando.** Nada de umbrales: *"en el caso de las horas sería mencionar solo si hay incongruencias claras entre las horas solicitadas en el plan; por lo general se piden 30 horas y el seguro las acepta o las reduce. Pero a veces pasa que en una sección se piden una cantidad de horas y en otra del mismo plan aparecen otras."* Cuántas horas pedir lo negocia el analista con el seguro y no es asunto del auditor. Lo que sí es un defecto del documento es la **incongruencia interna**, implementada como `scanHoursConsistency` (tres reglas, categoría `internal_contradiction`, alerta sin juicio). No se añadió la regla de 25 h directas ni el blocker de 97153 > 40. Ver `CONTEXTO_AUDITOR_Claude_Code.md` §1.5
6. **Acotar R14** (5.4) antes de auditar paquetes que incluyan el CDE — **la tensión se comprobó al implementar el punto 3 y no se materializa** sobre el assessment: R14 no salta por enunciar el nivel de severidad del DSM-5 (verificado en `cde_browser.js`). Sigue pendiente solo para el día en que se audite el texto del CDE mismo, que sí mapea criterios.

---

## 6. Literatura secundaria — **[V]**

**El emparejamiento función ↔ intervención es el predictor de calidad.** En estudios de adecuación técnica de FBA/BIP escolares, los planes reales puntúan solo **40–50 %** de los componentes esperados, con asociaciones fuertes entre la calidad global y (a) la función identificada y (b) si las estrategias estaban emparejadas con ella. Instrumentos formales: TATE, lista de 11 ítems de Van Acker, instrumento de 31 indicadores en 8 dimensiones.

> **Esto valida el módulo más valioso del auditor.** `runFunctionalCoherenceAudit` ataca exactamente esa variable. Es el módulo a reforzar antes que cualquier otro.

**Fidelidad de tratamiento:** tres dimensiones que predicen resultados de forma diferenciada — adherencia, calidad y exposición.

**Dosis (CASP v3.0):** rangos de referencia 30–40 h/sem comprehensivo, 10–25 h/sem focalizado. ⚠️ No verificado. *Nota: Florida Medicaid fija el techo duro en **40 h/sem** (§4.2.2, verificado).*

---

## 7. Brechas del auditor

| # | Requisito | Fuente | Hoy | Brecha |
|---|---|---|---|---|
| 1 | Vineland-3 (+ Maladaptive Domain ≥3 a.) y BASC-3 PRQ (2–18 a.), con reporte de puntuaciones | FL §4.2.1 **[P]** | "vineland" como keyword en sección **opcional** | **Requisito duro tratado como opcional.** Causa de denegación |
| 2 | 9 elementos por cada meta, incl. fecha de introducción y fecha estimada de dominio | FL §6.2.2 **[P]** | Criterios vagos (punto 11 del prompt) | **Ausente como lista verificable**; y la exención de TBD de hoy los exime justamente |
| 3 | Tabla de datos **y gráfico** por cada conducta tratada | FL §6.2.3 **[P]** | `SEC_PROGRESS_DATA` busca 'graph' entre otras | No exige **una por conducta** |
| 4 | Explicación obligatoria si no hubo progreso significativo | FL §6.2.3 **[P]** | — | **Ausente** |
| 5 | Firma del Lead Analyst **y** del padre/tutor | FL §6.2.2 **[P]** | `SEC_CONSENT` genérico | No distingue las dos firmas |
| 6 | Esfuerzos de participación parental documentados; impactos y mitigación si no participa | FL §4.2.2, §7.2 **[P]** | Parent training sí; esto no | **Ausente** |
| 7 | Unidades por código **+ necesidad médica de las unidades** | FL §6.2.2 **[P]** | Matemática CPT correcta | Verifica aritmética, no la justificación |
| 8 | Nombres de los supervisores autorizados | FL §6.2.2 **[P]** | `SEC_SUPERVISION` genérico | No exige nombres |
| 9 | Care coordination con escuela/programas estatales | FL §6.2.2 **[P]** | — | **Ausente** |
| 10 | Historia médica **con medicamentos para atenuar conductas** | FL §6.2.2 **[P]** | — | **Ausente** |
| 11 | File review de evaluaciones recientes | FL §6.2.2 **[P]**, CASP cap. 3 | — | **Ausente** |
| 12 | Reclusión/restricción, 1:1 aide, psicoterapia, travel time = no cubiertos | FL §5.2 **[P]** | Lista de intervenciones prohibidas clínicas | **No cubre los no-cubiertos de Medicaid** |
| 13 | Máx. 40 h/sem; grupo máx. 6; protocol modification solo Lead/BCaBA | FL §4.2.2 **[P]** | Modificador HN | Parcial |
| 14 | IEP (o 504, o justificación) en servicios escolares | FL §7.2 **[P]** | — | **Ausente** |
| 15 | Función sostenida en medición directa | CASP 4.2 **[P]** | Keywords; "verificar FAST/MAS" solo si fue inferida | **No exige método ni convergencia** |
| 16 | Cuatro dominios de evaluación | CASP 4.3 **[P]** | `SEC_STRENGTHS` opcional | **Ausente**; calidad de vida y co-ocurrentes nunca se comprueban |
| 17 | Metas ≠ criterios diagnósticos | CASP 4.4 **[P]** | — | **Ausente** |
| 18 | Fidelidad procedimental distinta del IOA | CASP 4.5 **[P]** | Solo IOA, solo con 97155 | **Ausente** y conceptos confundidos |
| 19 | Assent del cliente | CASP 4.6 **[P]** | Firma del guardián | **Ausente** |
| 20 | Limitaciones del instrumento documentadas | CASP 4.8 **[P]** | — | **Ausente** |
| 21 | Barreras ambientales / SDOH | CASP 4.10 **[P]** | — | **Ausente** |
| 22 | Vínculo explícito evaluación → meta | CASP 4.11 **[P]** | — | **Ausente** |
| 23 | Emparejamiento función ↔ reemplazo ↔ intervención | Literatura **[V]** | `runFunctionalCoherenceAudit` | Cubierto; el módulo más fuerte |

---

## 8. Recomendaciones, por prioridad

### Bloque A — riesgo de denegación de reclamación (hacer primero)

Todas citan Florida Medicaid, texto verificado.

**R1 — Instrumentos núcleo obligatorios (`FL_CORE_INSTRUMENTS`). ✅ IMPLEMENTADO** como `scanCoreInstruments`. `blocker` si falta Vineland-3 en un assessment inicial; `blocker` si falta el Maladaptive Behavior Domain con edad ≥3; `blocker` si falta BASC-3 PRQ con edad 2–18. La edad ya está en el perfil del cliente, así que la regla puede ser determinista. `warning` si se nombran pero no hay reporte de puntuaciones. En reassessment: `warning` si han pasado ≥12 meses sin los instrumentos núcleo. *§4.2.1.*

**R2 — Lista de 9 elementos por meta (`FL_GOAL_ELEMENTS`). ✅ IMPLEMENTADO** como `scanGoalRequiredElements`, por ausencia total en vez de conteo por meta. Sobre el canónico, comprobar por meta: definición observable, procedimientos de observación y medición directa, línea base, procedimientos de reducción/adquisición, condiciones y criterio de dominio, **fecha de introducción**, **fecha estimada de dominio**, plan de generalización, reporte de progreso. Agregado por elemento faltante (no una tarjeta por meta) para no inundar. *§6.2.2.*

**R3 — Revisar la exención de TBD.** Ver §2. Estrechar a fechas de servicio/autorización.

**R4 — Tabla y gráfico por conducta en reassessment (`FL_DATA_PER_BEHAVIOR`). ✅ IMPLEMENTADO** como `scanProgressDataPerBehavior`, por inspección del .docx original. `blocker`: cada conducta tratada necesita su propia tabla **y** su gráfico. *§6.2.3.*

**R5 — Explicación de falta de progreso (`FL_NO_PROGRESS_EXPLANATION`). ✅ IMPLEMENTADO** como `scanNoProgressExplanation` más cobertura en el prompt conceptual para el caso de juicio. Si el reassessment no evidencia progreso significativo, debe explicar por qué y qué cambia. *§6.2.3.*

**R6 — Servicios no cubiertos (`FL_NON_COVERED`). ✅ IMPLEMENTADO** como `scanNonCoveredServices`. Añadir a las reglas deterministas: reclusión y restricción manual/mecánica/química, 1:1 aide / shadow / companion, psicoterapia y testing psicológico, travel time, servicios simultáneos sin autorización. `blocker`. *§5.2.* **Nota clínica:** esto se solapa parcialmente con la lista de intervenciones prohibidas que ya existe, pero el fundamento es distinto — allí es "no es ABA", aquí es "Medicaid no lo paga". Conviene que el hallazgo lo diga.

**R7 — Participación parental documentada (`FL_PARENT_PARTICIPATION`). ✅ IMPLEMENTADO** como `scanParentParticipation`. Esfuerzos documentados; si no participa, razones + impactos + mitigación; y en continuación, datos de participación. *§4.2.2, §7.2.*

**R8 — Elementos administrativos faltantes. ✅ IMPLEMENTADO** como `scanAdminRequiredElements`. Firmas (Lead Analyst **y** tutor), nombres de supervisores, care coordination, historia médica con medicamentos, file review, número de unidades por código con su necesidad médica, IEP/504 en servicios escolares. Un bloque de completitud, severidad `warning`, agregado. *§6.2.2, §7.2.*

**R9 — Techos duros. ✅ IMPLEMENTADO** como `scanFloridaServiceLimits`, **recalibrado**: las reglas de horas son `warning` porque la métrica de intensidad está en disputa entre CASP y el pagador; tamaño de grupo y proveedor autorizado siguen en `blocker`. >40 h/sem, grupo >6, protocol modification atribuido a RBT. `blocker`. *§4.2.2.*

### Bloque B — calidad clínica, con cita verificable

**R10 — Fuente de la evidencia funcional (`FUNCTION_EVIDENCE_SOURCE`). ✅ IMPLEMENTADO** como `scanFunctionEvidenceSource`. Exigir que se nombre el método; `blocker` en conductas peligrosas si solo hay evidencia indirecta. El canónico ya extrae `functionSource`. *CASP cap. 3, p. 22.*

**R11 — Fidelidad procedimental distinta del IOA (`PROCEDURAL_FIDELITY`). ✅ IMPLEMENTADO** como `scanProceduralFidelity`, con corrección del detector de `IOA_PROTOCOL_MODIFICATION`, que aceptaba "treatment integrity" como si acreditara IOA. Requisito propio; que no se dé por satisfecho con una mención de IOA. *CASP cap. 4, p. 43.*

**R12 — Cuatro dominios de evaluación (`SEC_ASSESSMENT_DOMAINS`). ✅ IMPLEMENTADO** como `scanAssessmentDomains`. Los dos primeros suelen estar; calidad de vida y condiciones co-ocurrentes casi nunca. *CASP cap. 5, p. 54.*

**R13 — Assent del cliente (`SEC_ASSENT`). ✅ IMPLEMENTADO** como `scanClientAssent`. Separado del consentimiento del tutor. *CASP cap. 2, p. 18.*

**R14 — Metas que reproducen criterios diagnósticos (`GOALS_NOT_DSM_CRITERIA`). ✅ IMPLEMENTADO** como `scanGoalsNotDsmCriteria`. *CASP cap. 5, p. 54.*

**R15 — Vínculo evaluación → meta (`GOAL_ASSESSMENT_LINK`). ✅ IMPLEMENTADO** como `scanGoalAssessmentLink`. *CASP cap. 6, p. 59.*

**R16 — Limitaciones del instrumento (`ASSESSMENT_LIMITATIONS`). ✅ IMPLEMENTADO** como `scanAssessmentLimitations`. Especialmente pertinente en Florida, donde el financiador impone Vineland-3 y BASC-3. *CASP cap. 3, p. 40.*

**R20 — Coherencia alcance ↔ intensidad (`scanScopeIntensityCoherence`). ✅ IMPLEMENTADO.** Desciende de la recomendación de "justificación de la dosis" de la primera versión de este documento, que quedó sin número al reescribirlo con Florida Medicaid como ancla. Toma la forma de coherencia entre alcance e intensidad, no de un rango fijo de horas, que es lo que la evidencia sostiene. Rangos ya **verificados contra la fuente primaria**: comprehensivo de alta intensidad 30–40 h/sem durante al menos dos años; focalizado de alcance estrecho 6–15 h/sem; focalizado sobre conducta grave 25–40 h/sem; comprehensivo de baja intensidad, apropiado en pocos casos. Usa horas de tratamiento **directo**, no el total de R9. Todo `warning`. *CASP, Evidence About ABA Treatment for Young Children with Autism, p. 11–13.* **[P]**

**R17 — Barreras ambientales / SDOH (`ECOBEHAVIORAL_BARRIERS`). ✅ IMPLEMENTADO** como `scanEcobehavioralBarriers`. `notice` de apoyo. *CASP cap. 3, p. 38; Apéndice B.*

### Bloque C — estructural

**R18 — Tabla de requisitos con fuente. ✅ IMPLEMENTADO** como `AUDIT_REQUIREMENTS` (23 filas: 19 primarias, 1 búsqueda, 3 convención), con `citationFor`, `verifiedSourcesForPrompt`, sección en el reporte y `REQUISITOS_AUDITADOS.md` generado. **Cubre también R19**: el prompt ya no pide citar de memoria. `{id, requisito, fuente, edición, sección/página, severidad, estado_verificación}` en el repositorio; los prompts trabajan contra ella. Con los dos PDF leídos ya se pueden llenar ~35 filas verificadas. Las citas dejan de ser inventables y actualizar una norma es editar una fila.

**R19 — Dejar de pedir números de sección no verificables.** Mientras R18 no exista, que el modelo cite **estándar y edición** sin inventar el **número de sección**.

---

## 9. Qué falta conseguir

Con los dos PDF aportados, el bloque vinculante está cubierto. Quedan:

1. **CASP ABA Practice Guidelines v3.0 (2024)** — vinculante por incorporación (§4.2 de FL Medicaid), y es la fuente de los rangos de dosis y de las razones de supervisión. **Es ahora la más importante de las que faltan.**
2. **BACB Ethics Code (edición vigente)** — números y títulos exactos para R13 y R19.

---

## 10. Fuentes

**Primarias, leídas en esta sesión:**

- Florida Agency for Health Care Administration (diciembre 2024). *Florida Medicaid Behavior Analysis Services Coverage Policy.* 12 pp. Incorporada por referencia en la Regla 59G-4.125, F.A.C.
- Council of Autism Service Providers & Association of Professional Behavior Analysts (2026). *Autism spectrum disorders assessment guidelines for behavior analysts.* 79 pp.

**Primarias, leídas en esta sesión (aportadas por Rolando):**

- Council of Autism Service Providers (s.f.). *Evidence About ABA Treatment for Young Children with Autism: The Impact of Treatment Intensity on Outcomes.* 46 pp. — **Define la intensidad como horas directas al paciente, excluyendo manejo de caso, entrenamiento a cuidadores, evaluación de datos y supervisión de protocolos** (p. 11). Rangos verificados: comprehensivo de alta intensidad **30–40 h/sem durante al menos dos años**; focalizado de alcance estrecho **6–15 h/sem**; focalizado sobre conducta desafiante grave **25–40 h/sem**; comprehensivo de baja intensidad, apropiado "en pocos casos" (típicamente mantenimiento). **Sustituye los rangos no verificados de §5 y motivó la recalibración de R9 a `warning`.** Habilita además una regla de **coherencia alcance ↔ intensidad**, mejor que "horas fuera de rango".
- Council of Autism Service Providers & Association of Professional Behavior Analysts (s.f.). *Practice Parameters for Artificial Intelligence Use in Applied Behavior Analysis.* 25 pp. — **Gobierna al auditor mismo, no a los documentos que audita.** Exige transparencia (explicabilidad e interpretabilidad), trazabilidad de errores hasta su origen, revelar **el alcance** del uso de IA y **ofrecer alternativas sin IA como opt-out**, monitoreo de deriva con responsable y umbrales definidos, auditoría periódica, y un canal estructurado de reporte de errores. Advierte que los pagadores pueden no permitir ni reembolsar todo uso de IA. Resume el invariante del proyecto: *"AI should serve as a tool to support clinical work, not supplant it."*
- Council of Autism Service Providers et al. (2021). *The Health Insurance Appeals Guide: A Consumer Guide for Filing Autism Appeals.* 79 pp. — Guía de consumidor, no estándar de práctica ni específica de Florida: **menor valor para generar reglas**. Clasifica las denegaciones en administrativas, de cobertura y clínicas. Su aporte es de encuadre: el assessment es la prueba en una apelación futura, lo que sugiere reforzar el resumen ejecutivo y la declaración del consultor antes que añadir blockers. **✅ IMPLEMENTADO como modo apelación** (`generateAppealLetter`, §5.1 del contexto): la taxonomía de denegaciones ramifica la estrategia del prompt, y de "el assessment es la prueba" sale `appealPreflight`, que antes de redactar avisa qué blockers abiertos tiene el documento sobre el que se va a apelar. No añadió ninguna regla de auditoría, según lo previsto.

**Molina Healthcare — capa de pagador, leídas en esta sesión (aportadas por Rolando):**

- Molina Healthcare of Florida (julio 2026). *Behavioral Analysis Services: Authorization & Documentation Guide — Comprehensive Provider Quick Reference Guide*, v1.0, 20 pp. Declara estar basada en la AHCA BA Services Coverage Policy (diciembre 2024). **Documento operativo principal**: CDE, snags comunes, checklists por tipo de solicitud, behavior assessment, intensidad, notas de sesión, coordinación, alta, facturación, P2P.
- Molina Healthcare (aprob. 06/10/2026). *Molina Clinical Policy No. 482 — Applied Behavioral Analysis for Autism Spectrum Disorder*, 11 pp. Criterios de necesidad médica para iniciación, continuación y alta. **Fija el disparador de alta intensidad en 25 horas DIRECTAS por semana**, lo que resuelve la disputa de métrica que motivó bajar R9 a `warning`.
- Molina Healthcare (s.f.). *Applied Behavior Analysis (ABA) documentation requirements for initial and continued treatment plans*, 2 pp. Checklist. Fuente de la regla de **60 días** y de la suficiencia de metas frente a unidades.
- Molina Healthcare (rev. 02/05/2026). *Behavior Analysis (BA) Quick Reference Guide 2026*, 4 pp. Facturación, regla de 8 minutos, supervisión, contactos.
- Molina Healthcare (2024). *Marketplace National Regional Benefit Interpretation Document — Autism Spectrum Disorder*, 15 estados. **No es Medicaid**: aplica a planes comerciales. Aporte marginal.

**Secundarias, vía búsqueda:**

- CASP — [ABA Practice Guidelines (Version 3.0)](https://www.casproviders.org/asd-guidelines/) · [nota de lanzamiento](https://www.casproviders.org/news/council-of-autism-service-providers-releases-new-practice-guidelines-for-treating-autism)
- Behavioral Health Business — [CASP Revises Practice Guidelines for ABA in Autism Therapy](https://bhbusiness.com/2024/05/22/casp-revises-practice-guidelines-for-aba-in-autism-therapy/)
- NCBI Bookshelf — [ABA Industry Guidelines and Standards of Care](https://www.ncbi.nlm.nih.gov/books/NBK619293/)
- BACB — [Ethics Code for Behavior Analysts](https://www.bacb.com/wp-content/uploads/2022/01/Ethics-Code-for-Behavior-Analysts-240830-a.pdf)
- MDPI *Behavioral Sciences* — [Are We on Course Yet? FBA and BIP Technical Adequacy in Schools](https://www.mdpi.com/2076-328X/14/6/466) ([PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11200863/))
- *Educational and Psychological Sciences Series* — [Quality indicators in behavior-intervention plans](https://journals.aabu.edu.jo/index.php/Edu/article/view/1533)
- PMC — [Functional Assessment of Problem Behavior: Dispelling Myths…](https://pmc.ncbi.nlm.nih.gov/articles/PMC3546636/)
- ASAT — [Comparisons of FBA Procedures to the Functional Analysis of Problem Behavior](https://asatonline.org/research-treatment/research-synopses/comparisons-of-functional-behavior-assessment/)
- PMC — [Ensuring Treatment Fidelity in a Multi-site Behavioral Intervention Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3198011/)
- ERIC — [Assessing Treatment Integrity in Behavioral Consultation](https://files.eric.ed.gov/fulltext/EJ801232.pdf)
