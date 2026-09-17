# Fundamento en la literatura y recomendaciones para el auditor

> Documento de trabajo. Responde a dos preguntas: (1) ¿el auditor consulta la literatura?, y (2) ¿qué debe contener un assessment "lo mejor posible" según esa literatura, y qué le falta hoy al auditor para exigirlo?
>
> **Estado:** propuesta. Ninguna regla clínica de §6 de `CONTEXTO_AUDITOR_Claude_Code.md` se cambia sin aprobación de Rolando.

---

## 1. Cómo consulta hoy el auditor la literatura: no la consulta

Verificado en el código (`ABA_Assessment_Auditor_v2.html`):

- **Cero herramientas de recuperación.** No hay `web_search`, ni RAG, ni ningún `tools:[...]` en los 10 sitios de llamada a la API. El único tráfico saliente es a `api.anthropic.com/v1/messages` con texto plano.
- **Los estándares se citan por nombre, 10 veces, dentro de los prompts:** "Florida Medicaid Behavior Analysis Services Coverage Policy (December 2024)", "CASP ABA Practice Guidelines 3rd Edition (2024)", "CASP/APBA ASD Assessment Guidelines (March 2026)", "BACB Ethics Code 2020". El modelo responde desde su **memoria de entrenamiento**, no desde el texto de esas fuentes.
- Las reglas deterministas (términos prohibidos, matemática CPT, modificador HN, contraindicaciones de DRL/planned ignoring) son **conocimiento de dominio que Rolando codificó a mano**, no derivado de una lectura de las fuentes.

### Qué implica

| Riesgo | Detalle |
|---|---|
| **Citas no verificables** | El prompt pide "cite the standard in suggested_action". El modelo produce números de sección desde memoria: puede errar el número, la edición, o atribuir a un estándar un requisito que está en otro. Nadie lo comprueba. |
| **Deriva con las actualizaciones** | Florida Medicaid revisa 59G-4.125 periódicamente; CASP publicó la v3.0 en mayo de 2024; estas guías de assessment son de marzo de 2026. Un auditor que cita de memoria envejece sin avisar. |
| **Cobertura desigual** | Lo que Rolando codificó a mano está bien cubierto y es defendible. Lo que nunca se codificó (assent, validez social, fidelidad procedimental, dominios de evaluación) no se audita, y su ausencia no es visible en el reporte. |

**La conclusión no es "añadir búsqueda web al auditor".** Un assessment se audita contra requisitos estables, y una llamada desde el navegador con la clave del usuario no es lugar para recuperación documental. Lo correcto es **fijar los requisitos por escrito en el repositorio, con su fuente**, y que los prompts trabajen contra esa lista explícita. Este documento es el primer paso.

### Estado de verificación de cada fuente

| Fuente | Estado |
|---|---|
| **CASP/APBA, ASD Assessment Guidelines for Behavior Analysts (marzo 2026)** | ✅ **Texto primario leído** (79 pp., PDF aportado por Rolando). Todo lo marcado **[P]** sale de este documento, con capítulo y página. |
| CASP ABA Practice Guidelines v3.0 (2024) | ⚠️ Solo resúmenes de búsqueda **[V]** |
| Florida Medicaid BA Services Coverage Policy (dic. 2024) / 59G-4.125 | ⚠️ Solo resúmenes de búsqueda **[V]** |
| BACB Ethics Code | ⚠️ Solo referencias indirectas **[V]**; los números de sección **no** están verificados |
| Literatura revisada por pares (adecuación técnica FBA/BIP, fidelidad) | ⚠️ Solo resúmenes de búsqueda **[V]** |

El proxy de egreso de la sesión bloqueó la descarga directa de `casproviders.org`, `ahca.myflorida.com`, `bacb.com`, `ncbi.nlm.nih.gov`, `pmc.ncbi.nlm.nih.gov`, `mdpi.com`, `law.cornell.edu` y `neurosciences.ucsd.edu`. Aportar esos PDF como hizo Rolando con el de CASP/APBA es lo que convierte **[V]** en **[P]**.

**Regla de trabajo: solo lo marcado [P] puede convertirse en una regla que marque un documento citando su fuente.** Lo marcado [V] se implementa como pregunta o nota de apoyo, o espera a verificarse.

---

## 2. Lo que exige la fuente primaria (CASP/APBA 2026) — [P]

### 2.1 Evaluación multimodal: ningún instrumento basta por sí solo

> "no single assessment tool or fixed set of instruments can provide all of the information needed to develop an effective treatment plan or evaluate progress for every autistic individual" — consenso NASEM 2025, citado en cap. 3, p. 22.

La evaluación multimodal combina **revisión de registros, entrevistas, observación directa, y evaluaciones formales e informales (estandarizadas y no estandarizadas)**. La lógica declarada: cada modo tiene fortalezas y debilidades, y el enfoque multimodal permite "apoyarse en las fortalezas de una evaluación y resolver sus déficits mediante otra". (cap. 3, p. 22)

**La revisión de registros es uno de los primeros pasos**, y dentro de ella la **evaluación diagnóstica del cliente** es un registro que el analista "debe saber leer y debe priorizar revisar" — típicamente incluye medidas cognitivas, adaptativas, de lenguaje, de logro y/o del desarrollo. (cap. 3)

### 2.2 La observación directa es primaria; lo indirecto suplementa

> "practitioners should prioritize the use of direct observation and measurement—the heart of ABA. This may involve conducting a functional analysis of an interfering behavior to hypothesize the function. **Indirect measures supplement direct measures**" — cap. 3, p. 22.

Las medidas indirectas aportan prioridades del cliente, cuidador e interesados, y sirven para saber si los interesados perciben el progreso que muestran otras medidas. **Pero no sustituyen la medición directa.**

> Consecuencia para el auditor: una función hipotetizada sostenida **solo** en un FAST o un MAS no cumple el estándar. Esto es exactamente lo que hoy no se comprueba.

### 2.3 Cuatro dominios de evaluación

Los dominios primarios (cap. 5, Key Points, p. 54):

- **(a) Características nucleares del TEA** — comunicación social y conductas restringidas
- **(b) Conducta y funcionamiento adaptativo**
- **(c) Bienestar y calidad de vida**
- **(d) Condiciones co-ocurrentes y características asociadas** — salud mental, discapacidad intelectual, trastornos del lenguaje

Con instrumentos estandarizados y no estandarizados, seleccionados según metas centradas en el cliente, comprendiendo alcance, limitaciones y uso apropiado dentro de las guías legales y profesionales.

### 2.4 Advertencia explícita: los criterios diagnósticos no son una lista de objetivos

> "It **warns against using diagnostic criteria as checklists for treatment targets** and instead promotes aligning interventions with outcomes meaningful to the client and their support system." — cap. 5, Key Points, p. 54.

> Esto es directamente auditable y hoy no se audita: metas que reproducen criterios DSM ("déficits en reciprocidad socioemocional") en lugar de resultados significativos para el cliente.

### 2.5 IOA y fidelidad procedimental son cosas distintas — y ambas se exigen

El capítulo 4 se titula "The Reliability and Procedural Fidelity of Assessment Delivery" y las trata por separado.

**IOA** (p. 42) evalúa la fiabilidad de la recolección de datos: dos o más observadores registran independientemente la misma dimensión, comparan y calculan el porcentaje de acuerdo. Sirve para detectar **deriva del observador** y para saber si **las definiciones conductuales o los procedimientos de registro necesitan aclararse**. Ante discrepancias: entrenamiento adicional y revisión de definiciones. Estrategias admitidas para reducir carga: enfocar conductas de baja frecuencia y alta preocupación, acuerdo proporcional vs. exacto, datos resumen del observador primario, muestreo de IOA.

**Fidelidad procedimental** (p. 43):

> "Just as practitioners measure the treatment fidelity of ABA-based services, they should also measure and evaluate the **procedural fidelity of assessment implementation**."

Herramienta: una lista de verificación conductual donde cada paso del protocolo se puntúa "Yes"/"No", produciendo un **porcentaje de adherencia**. Tres propósitos: (a) auto-monitoreo y retroalimentación del clínico, (b) supervisión y seguimiento de competencia, (c) **validación de los datos recolectados**. La meta es **adherencia total**, "especialmente al usar herramientas estandarizadas, donde la fidelidad procedimental afecta directamente la validez de los resultados".

> El auditor hoy solo comprueba IOA, y solo cuando hay 97155. Le falta la fidelidad procedimental **y** la distinción entre ambas.

### 2.6 Consentimiento informado **incluyendo assent del cliente**

> "Informed consent, **including assent from the client being assessed**, must be obtained, with all stakeholders clearly understanding the purpose, procedures, and potential risks of the assessment." — cap. 2, Key Points, p. 18.

No es opcional ni una tendencia: está en los puntos clave del capítulo de ética.

### 2.7 Competencia, calificaciones del editor y alcance de práctica

El analista debe estar entrenado en **administrar, puntuar e interpretar** cada instrumento, y buscar consulta o supervisión cuando haga falta. Debe respetar las **calificaciones exigidas por el editor** del instrumento y las restricciones regulatorias de su alcance de práctica. Si involucra técnicos (donde esté permitido), debe darles entrenamiento y supervisión suficientes. (cap. 2 y cap. 6, Key Points)

### 2.8 Limitaciones documentadas y justificación clínica

> "Clear documentation of **assessment limitations and clinical rationale** is essential to ensure ethical, transparent, and individualized assessment practices." — cap. 3, Key Points, p. 40.

Caso explícito: cuando **la fuente de financiamiento exige un instrumento** que no captura bien las necesidades del cliente, el analista debe comunicar las limitaciones del resultado y **justificar la selección de medidas alternativas** más apropiadas. También debe **declinar respetuosamente** un instrumento cuando su uso sería un gasto innecesario del tiempo del cliente. (cap. 2 y cap. 6, Key Points)

### 2.9 Ambiente natural y línea base

> "evaluations conducted in **natural settings**, when appropriate, provide a **more accurate baseline** and contextual variable critical for effective treatment planning and outcomes." — cap. 6, Key Points, p. 61.

### 2.10 Análisis ecoconductual y determinantes sociales de la salud

El análisis ecoconductual examina **fortalezas y barreras ambientales** que influyen en la conducta, recogidas por observación directa, entrevistas al cuidador e instrumentos de calidad de vida. Componente central: los **determinantes sociales de la salud (SDOH)**, que según la OMS explican **30–55 % de los resultados en salud**. (cap. 3, p. 38 y Apéndice B, p. 78)

Ejemplo del propio documento: *un niño con ausentismo escolar crónico probablemente no se beneficie de una intervención basada en centro a menos que se aborden las barreras de asistencia.* Estresores como relaciones familiares tensas, alta emoción expresada y acceso educativo limitado se asocian con mayor estrés del cuidador y afectan la participación y el éxito del tratamiento.

### 2.11 El vínculo evaluación → metas debe ser explícito

> "A practitioner should **directly link the information gathered from the assessment to protocol design and the rationale for targeting specific behaviors** for treatment." — cap. 6, p. 59.

El proceso descrito: puntuaciones ajustadas demográficamente de instrumentos normativos → identificar áreas de impairment, déficits de habilidades y conductas interferentes → sintetizar con evaluaciones criteriales o basadas en habilidades → derivar metas de corto y largo plazo → **correlacionar esos objetivos con los dominios identificados en la selección inicial de instrumentos**.

---

## 3. Lo que aporta la literatura secundaria — [V]

Pendiente de verificación contra texto primario, pero convergente.

**El emparejamiento función ↔ intervención es el predictor de calidad.** En estudios de adecuación técnica de FBA/BIP en escuelas, los planes reales puntúan solo entre **40 % y 50 %** de los componentes esperados, y se hallaron asociaciones fuertes entre la calidad global del FBA-BIP y (a) la función de la conducta y (b) si las estrategias estaban emparejadas con esa función. Existen instrumentos formales: la TATE, la lista de 11 ítems de Van Acker, y un instrumento de 31 indicadores en 8 dimensiones.

> **Esto valida el módulo más valioso del auditor.** `runFunctionalCoherenceAudit` ataca exactamente la variable que la literatura asocia con la calidad global. Es el módulo a reforzar antes que cualquier otro.

**Calidad de metas.** Una meta medible conecta un resultado socialmente significativo con una respuesta observable, más: línea base actual, condiciones, método de medición, criterio justificado, expectativa de generalización o mantenimiento, y regla de revisión. **Generalización y mantenimiento son distintos**: aplicar la habilidad en otros contextos vs. conservarla en el tiempo.

**Fidelidad de tratamiento**: tres dimensiones que predicen resultados de forma diferenciada — **adherencia** (qué componentes se implementaron), **calidad** (cuán bien) y **exposición** (con qué frecuencia y por cuánto tiempo).

**Dosis (CASP v3.0)**: debe reflejar metas, necesidades y respuesta al tratamiento; rangos de referencia **30–40 h/sem comprehensivo, 10–25 h/sem focalizado**. ⚠️ No verificado contra el texto de CASP v3.0.

---

## 4. Brechas del auditor

Contra `REQUIRED_SECTIONS`, las reglas deterministas y los prompts actuales.

| # | Requisito | Hoy | Brecha |
|---|---|---|---|
| 1 | Función sostenida en medición **directa**, con lo indirecto como suplemento **[P §2.2]** | `SEC_HYPOTHESIZED_FUNCTION` busca palabras clave (`mas`, `fast`, `abc`); el rediseño marca "verificar FAST/MAS" solo si la función fue inferida | **No exige método ni convergencia.** Una función declarada sin origen, o sostenida solo en una escala indirecta, pasa |
| 2 | Emparejamiento función ↔ reemplazo ↔ intervención **[V]** | `runFunctionalCoherenceAudit` | Cubierto; es el módulo más fuerte |
| 3 | Assent del cliente además del consentimiento **[P §2.6]** | `SEC_CONSENT` busca firma del guardián | **Ausente** |
| 4 | Cuatro dominios de evaluación **[P §2.3]** | `SEC_STRENGTHS` opcional, menciona Vineland | **Ausente como requisito.** Bienestar/calidad de vida y condiciones co-ocurrentes no se comprueban |
| 5 | Metas ≠ criterios diagnósticos **[P §2.4]** | — | **Ausente** |
| 6 | Fidelidad procedimental, distinta del IOA **[P §2.5]** | Solo IOA, solo con 97155 | **Ausente**, y se confunden ambos conceptos |
| 7 | Limitaciones del instrumento documentadas **[P §2.8]** | — | **Ausente** |
| 8 | Vínculo explícito evaluación → meta **[P §2.11]** | — | **Ausente.** Nada exige que cada objetivo trace a un hallazgo de la evaluación |
| 9 | Análisis ecoconductual / SDOH / barreras **[P §2.10]** | — | **Ausente** |
| 10 | Línea base en ambiente natural **[P §2.9]** | Convenciones de línea base (sondas 1 h) | No se comprueba dónde se tomó |
| 11 | Línea base y regla de revisión por meta **[V]** | Criterios vagos, punto 11 del prompt | Difuso; no se exige por meta |
| 12 | Generalización y mantenimiento separados **[V]** | `SEC_GENERALIZATION` mezcla ambos | Un plan sin mantenimiento pasa |
| 13 | Dosis justificada por metas/necesidad **[V]** | Matemática CPT y modificador HN | Verifica la aritmética, no la justificación |
| 14 | Reevaluación con el mismo instrumento **[V]** | `SEC_PROGRESS_DATA` / `SEC_PROGRESS_NARRATIVE` | No exige re-administrar el mismo instrumento, que es lo que hace comparable el progreso |

---

## 5. Recomendaciones

Ordenadas por valor/riesgo. Las **[P]** pueden citar su fuente con página; las **[V]** no deben citar sección hasta verificarse.

### Implementables ya, con cita verificable

**R1 — Fuente de la evidencia funcional (`FUNCTION_EVIDENCE_SOURCE`).** Por conducta, exigir que el documento nombre cómo se determinó la función. `warning` si no se nombra ningún método; `warning` elevado a `blocker` en conductas peligrosas si **solo** hay evidencia indirecta (FAST/MAS/entrevista) sin observación directa ni análisis funcional. El canónico ya extrae `functionSource`: la regla puede leerlo sin una pasada de IA nueva. *Cita: CASP/APBA 2026, cap. 3, p. 22.*

**R2 — Assent del cliente (`SEC_ASSENT`).** Sección requerida, separada de `SEC_CONSENT`. Palabras clave: assent, asentimiento, assent withdrawal, señales de disposición. *Cita: cap. 2, Key Points, p. 18.*

**R3 — Dominios de evaluación (`SEC_ASSESSMENT_DOMAINS`).** Comprobar cobertura de los cuatro dominios. Los dos primeros suelen estar; **bienestar/calidad de vida** y **condiciones co-ocurrentes** casi nunca. `warning` por dominio ausente. *Cita: cap. 5, Key Points, p. 54.*

**R4 — Fidelidad procedimental distinta del IOA (`PROCEDURAL_FIDELITY`).** Requisito propio junto al de IOA: instrumento (checklist paso a paso), criterio de adherencia, frecuencia y responsable. Redactar la regla de modo que **no** se dé por satisfecha con una mención de IOA. *Cita: cap. 4, p. 43.*

**R5 — Metas que reproducen criterios diagnósticos (`GOALS_NOT_DSM_CRITERIA`).** Detectable por patrón: metas redactadas con lenguaje de criterio DSM. `warning` con nota de apoyo: reformular hacia resultados significativos para el cliente y su sistema de apoyo. *Cita: cap. 5, Key Points, p. 54.*

**R6 — Vínculo evaluación → meta (`GOAL_ASSESSMENT_LINK`).** Cada meta debe poder trazarse a un hallazgo de la evaluación. Implementable sobre el canónico: metas que no referencian ningún instrumento ni hallazgo → `warning` agregado, no por meta (evitar ruido). *Cita: cap. 6, p. 59.*

**R7 — Limitaciones del instrumento (`ASSESSMENT_LIMITATIONS`).** `notice`: cuando se nombra un instrumento estandarizado, el documento debería declarar sus limitaciones y la justificación clínica de su selección — sobre todo si lo exige el financiador y no captura bien las necesidades. *Cita: cap. 3, Key Points, p. 40; cap. 6, Key Points, p. 61.*

**R8 — Barreras ambientales / SDOH (`ECOBEHAVIORAL_BARRIERS`).** `notice` de apoyo: el documento debería identificar barreras del entorno que puedan condicionar la viabilidad del plan (asistencia, transporte, estrés del cuidador, acceso). Encaja con el tono constructivo del auditor y es defendible ante Medicaid como individualización. *Cita: cap. 3, p. 38; Apéndice B, p. 78.*

### Implementables, sin cita de sección hasta verificar

**R9 — Mantenimiento separado de generalización.** Partir `SEC_GENERALIZATION` en dos. Coste bajo, brecha clara.

**R10 — Línea base por meta.** Cada LTO/STO con línea base, método de medición y criterio de dominio. `warning` por meta sin línea base.

**R11 — Justificación de la dosis.** Además de la aritmética CPT, señalar como **pregunta** cuando las horas no estén vinculadas a metas y necesidad. ⚠️ **No implementar los rangos 30–40 / 10–25 h hasta verificar CASP v3.0**: un falso positivo aquí es caro.

**R12 — Re-administración del mismo instrumento en reassessment.** Para que el progreso sea comparable.

### Estructurales

**R13 — Tabla de requisitos con fuente.** Crear `{id, requisito, fuente, edición, capítulo/página, severidad, estado_verificación}` en el repositorio, y que los prompts trabajen contra ella. Las citas dejan de ser inventables, actualizar una norma es editar una fila, y el reporte puede mostrar la fuente exacta junto al hallazgo. El PDF de CASP/APBA ya permite llenar ~10 filas verificadas.

**R14 — Dejar de pedir números de sección no verificables.** Mientras R13 no exista, suavizar "cite the standard" para que el modelo cite **estándar y edición** (verificable) sin inventar el **número de sección**. Un número equivocado en un documento que va a Medicaid es peor que ningún número.

---

## 6. Qué falta conseguir

Con el PDF de CASP/APBA el bloque **[P]** ya es sólido. Para cerrar el resto hacen falta tres PDF más:

1. **Florida Medicaid BA Services Coverage Policy, diciembre 2024** — la lista literal de elementos requeridos del BASP y los requisitos de reevaluación. Es la fuente con consecuencia económica directa; la que menos margen admite.
2. **CASP ABA Practice Guidelines v3.0 (2024)** — rangos de dosis, necesidad médica, reevaluación con medidas estandarizadas (R11, R12).
3. **BACB Ethics Code (edición vigente)** — números y títulos exactos de los estándares sobre evaluación, consentimiento y assent (R2, R14).

---

## 7. Fuentes

**Primaria, leída en esta sesión:**

- Council of Autism Service Providers & Association of Professional Behavior Analysts (2026). *Autism spectrum disorders assessment guidelines for behavior analysts.* 79 pp. — PDF aportado por Rolando.

**Secundarias, vía búsqueda (no abiertas directamente):**

- CASP — [ABA Practice Guidelines (Version 3.0)](https://www.casproviders.org/asd-guidelines/) · [nota de lanzamiento](https://www.casproviders.org/news/council-of-autism-service-providers-releases-new-practice-guidelines-for-treating-autism)
- Behavioral Health Business — [CASP Revises Practice Guidelines for ABA in Autism Therapy](https://bhbusiness.com/2024/05/22/casp-revises-practice-guidelines-for-aba-in-autism-therapy/)
- CASP/APBA — [Assessment Guidelines](https://www.casproviders.org/assessment-guidelines) · [ASD Assessment Repository](https://www.casproviders.org/asd-assessment-guidelines-and-repository)
- NCBI Bookshelf — [ABA Industry Guidelines and Standards of Care (Comprehensive Autism Care Demonstration)](https://www.ncbi.nlm.nih.gov/books/NBK619293/)
- AHCA Florida — [Behavior Analysis Services Coverage Policy](https://ahca.myflorida.com/medicaid/review/Specific/59G-4.125_BA_Services_Coverage_Policy.pdf) · Cornell LII — [Fla. Admin. Code r. 59G-4.125](https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-r-59G-4-125)
- BACB — [Ethics Code for Behavior Analysts](https://www.bacb.com/wp-content/uploads/2022/01/Ethics-Code-for-Behavior-Analysts-240830-a.pdf)
- MDPI *Behavioral Sciences* — [Are We on Course Yet? FBA and BIP Technical Adequacy in Schools](https://www.mdpi.com/2076-328X/14/6/466) ([PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11200863/))
- *Educational and Psychological Sciences Series* — [Quality indicators in behavior-intervention plans (31 indicadores, 8 dimensiones)](https://journals.aabu.edu.jo/index.php/Edu/article/view/1533)
- PMC — [Functional Assessment of Problem Behavior: Dispelling Myths, Overcoming Implementation Obstacles, and Developing New Lore](https://pmc.ncbi.nlm.nih.gov/articles/PMC3546636/)
- ASAT — [Comparisons of FBA Procedures to the Functional Analysis of Problem Behavior](https://asatonline.org/research-treatment/research-synopses/comparisons-of-functional-behavior-assessment/)
- PMC — [Ensuring Treatment Fidelity in a Multi-site Behavioral Intervention Study (NIH BCC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3198011/)
- ERIC — [Assessing Treatment Integrity in Behavioral Consultation](https://files.eric.ed.gov/fulltext/EJ801232.pdf)
- Finni Health — [Writing Measurable ABA Goals: quality checklist](https://www.finnihealth.com/resources/clinicians/writing-measurable-aba-goals-examples-common-mistakes-and-a-quality-checklist)
