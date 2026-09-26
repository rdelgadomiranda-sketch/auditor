# Requisitos auditados y sus fuentes

> **Archivo generado.** La fuente única de verdad es la constante `AUDIT_REQUIREMENTS` de `ABA_Assessment_Auditor_v2.html`. El auditor se abre desde `file://`, donde `fetch()` está bloqueado, así que la tabla no puede vivir en un JSON externo. Para regenerar este archivo: `node gen_requisitos.js`.
>
> **Para qué sirve.** Antes, el prompt pedía "cite the standard" y el modelo producía números de sección desde su memoria de entrenamiento, sin que nadie los comprobara. Ahora las fuentes verificadas se inyectan en el prompt desde esta tabla, actualizar una norma es editar una fila, y el reporte muestra junto a cada hallazgo la fuente en que se apoya.
>
> **La columna de verificación es el punto.** Una regla marcada como "solo búsqueda" o "convención clínica" **no debe citarse ante un revisor con número de sección**.


## ✅ Texto primario leído

### `FL_4_2_1_CORE_INSTRUMENTS`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 4.2.1  
**Severidad:** blocker  
**Reglas que lo aplican:** `FL_CORE_VINELAND`, `FL_CORE_VINELAND_EDITION`, `FL_CORE_VINELAND_FORM`, `FL_CORE_MALADAPTIVE_DOMAIN`, `FL_CORE_BASC_PRQ`, `FL_CORE_BASC_PRQ_FORM`, `FL_CORE_SCORING_REPORT`

La evaluacion inicial debe incluir administracion, puntuacion y reporte del Vineland-3 Comprehensive Parent Interview Form (todos los recipients) mas el Maladaptive Behavior Domain desde los 3 anos, y del BASC-3 PRQ de 2 a 18 anos, con el reporte completo de puntuaciones en la solicitud de autorizacion. En reassessment, cada 12 meses.

### `FL_4_2_2_LIMITS`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 4.2.2  
**Severidad:** blocker/warning  
**Reglas que lo aplican:** `FL_LIMIT_WEEKLY_HOURS`, `FL_LIMIT_WEEKLY_HOURS_TOTAL`, `FL_LIMIT_GROUP_SIZE`, `FL_LIMIT_PROTOCOL_MOD_PROVIDER`, `FL_LIMIT_FAMILY_GUIDANCE_PROVIDER`

Hasta 40 horas semanales de servicios de intervencion BA; tamano maximo de grupo de seis participantes; adaptive behavior treatment with protocol modification y family adaptive behavior treatment guidance solo por Lead Analyst o BCaBA.

> ⚠️ Las reglas de horas son warning y no blocker: la metrica de intensidad esta en disputa entre CASP y el pagador. Ver CASP_INTENSITY_METRIC.

### `FL_4_2_2_PARENT`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 4.2.2  
**Severidad:** blocker  
**Reglas que lo aplican:** `FL_PARENT_NONPARTICIPATION_DOC`, `FL_PARENT_ACCOMMODATION_EFFORTS`

El proveedor debe hacer todo esfuerzo por acomodar la participacion parental y documentarlo en las actualizaciones del plan. Si no es posible, deben documentarse las razones, los impactos potenciales y como se mitigan.

### `FL_5_2_NON_COVERED`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 5.2  
**Severidad:** blocker/warning  
**Reglas que lo aplican:** `FL_EXCLUDED_RESTRAINT`, `FL_EXCLUDED_ONE_TO_ONE_AIDE`, `FL_EXCLUDED_CHILDCARE`, `FL_EXCLUDED_OTHER_THERAPIES`, `FL_EXCLUDED_TRAVEL_TIME`, `FL_EXCLUDED_SAME_DAY_SERVICE`

No cubiertos: reclusion y restriccion manual, mecanica o quimica; supervision del recipient, cuidado personal, acompanamiento 1:1, companion, chaperone y shadow; cuidador y guarderia; testing psicologico, neuropsicologia, psicoterapia, terapia cognitiva, psicoanalisis, hipnoterapia y consejeria a largo plazo; tiempo de viaje; y servicios el mismo dia que BHOS, TBOS o therapeutic group care.

### `FL_6_2_2_GOAL_ELEMENTS`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 6.2.2  
**Severidad:** blocker  
**Reglas que lo aplican:** `FL_GOAL_REQUIRED_ELEMENTS`, `FL_GOAL_ELEMENT_TBD`, `PLACEHOLDER_TBD_CONVENTION`

Cada target, goal u objective debe contener: definicion observable y medible; procedimientos de observacion y medicion directa; nivel actual (linea base); procedimientos de reduccion o adquisicion; condiciones y criterio de dominio; fecha de introduccion; fecha estimada de dominio; plan de generalizacion; y reporte de progreso indicando si se cumplio, no se cumplio o se modifico. Las metas de cuidadores anaden los procedimientos de entrenamiento.

> ⚠️ La norma pide una fecha y un valor ESTIMADOS, de modo que la incertidumbre no justifica dejar estos campos en TBD.

### `FL_6_2_2_ADMIN`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 6.2.2  
**Severidad:** warning  
**Reglas que lo aplican:** `FL_ADMIN_REQUIRED_ELEMENTS`, `FL_ADMIN_SIGNATURES`

El assessment y el plan deben estar firmados por el Lead Analyst y por el padre o tutor, e incluir informacion del paciente, razon de referencia, historia medica y del desarrollo con los medicamentos prescritos para atenuar conductas, historia familiar, entrevista clinica, file review, procedimientos y resultados de la evaluacion, entornos de tratamiento, unidades por codigo con su necesidad medica, plan de supervision con los nombres de los supervisores autorizados, coordinacion de cuidados, plan de transicion, plan de crisis y plan de alta.

### `FL_6_2_3_REASSESS`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 6.2.3  
**Severidad:** blocker  
**Reglas que lo aplican:** `FL_DATA_PER_BEHAVIOR_TABLES`, `FL_DATA_PER_BEHAVIOR_GRAPHS`, `FL_DATA_PER_BEHAVIOR_MANUAL`, `FL_NO_PROGRESS_EXPLANATION`

El reassessment debe traer datos de progreso de todas las conductas tratadas, y cada conducta bajo tratamiento debe tener su propia tabla de datos y su grafico correspondiente. Si no hubo progreso clinicamente significativo, debe explicarse por que y que cambios de tratamiento se haran.

### `FL_7_2_AUTH`

**Fuente:** Florida Medicaid BA Services Coverage Policy — diciembre 2024, 7.2  
**Severidad:** blocker/warning  
**Reglas que lo aplican:** `FL_PARENT_PARTICIPATION_DATA`, `FL_ADMIN_SCHOOL_IEP`

Las solicitudes de continuacion deben incluir datos sobre la participacion del padre o tutor. Las solicitudes para servicios escolares deben incluir el IEP; sin IEP, documentacion que justifique los servicios y el plazo estimado del IEP; un plan 504 puede sustituirlo.

### `CASP_DIRECT_OBSERVATION`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 3, p. 22  
**Severidad:** blocker/warning  
**Reglas que lo aplican:** `FUNCTION_EVIDENCE_SOURCE`, `FUNCTION_EVIDENCE_SOURCE_PER_BEHAVIOR`

La observacion directa y la medicion son primarias, el corazon del ABA; las medidas indirectas solo las SUPLEMENTAN. Una funcion sostenida unicamente en una escala o entrevista no cumple el estandar.

### `CASP_IOA`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 4, p. 42  
**Severidad:** notice  
**Reglas que lo aplican:** `IOA_PROTOCOL_MODIFICATION`

El IOA evalua la fiabilidad del dato comparando observadores independientes, revela deriva del observador y senala definiciones que necesitan aclararse.

### `CASP_PROCEDURAL_FIDELITY`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 4, p. 43  
**Severidad:** warning  
**Reglas que lo aplican:** `PROCEDURAL_FIDELITY`, `PROCEDURAL_FIDELITY_CRITERION`

La fidelidad procedimental de la implementacion debe medirse y evaluarse, con lista paso a paso puntuada Si/No que produce un porcentaje de adherencia y adherencia total como meta. Es un requisito SEPARADO del IOA.

### `CASP_DOMAINS`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 5, p. 54  
**Severidad:** warning  
**Reglas que lo aplican:** `SEC_ASSESSMENT_DOMAINS`

Cuatro dominios primarios de evaluacion: caracteristicas nucleares del TEA, conducta y funcionamiento adaptativo, bienestar y calidad de vida, y condiciones co-ocurrentes y caracteristicas asociadas.

### `CASP_NOT_DSM_CHECKLIST`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 5, p. 54  
**Severidad:** warning  
**Reglas que lo aplican:** `GOALS_NOT_DSM_CRITERIA`

Advierte contra usar los criterios diagnosticos como lista de objetivos de tratamiento; las intervenciones deben alinearse con resultados significativos para el cliente y su sistema de apoyo.

### `CASP_ASSENT`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 2, p. 18  
**Severidad:** warning  
**Reglas que lo aplican:** `SEC_ASSENT`

El consentimiento informado debe incluir el assent del cliente que esta siendo evaluado, con todos los interesados comprendiendo proposito, procedimientos y riesgos.

### `CASP_GOAL_LINK`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 6, p. 59  
**Severidad:** warning  
**Reglas que lo aplican:** `GOAL_ASSESSMENT_LINK`

La informacion recogida en la evaluacion debe enlazarse directamente con el diseno del protocolo y con la justificacion de por que se eligieron esas conductas como objetivo.

### `CASP_LIMITATIONS`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 3 p. 40 y cap. 6 p. 61  
**Severidad:** warning  
**Reglas que lo aplican:** `ASSESSMENT_LIMITATIONS`

La documentacion de las limitaciones del instrumento y de la justificacion clinica es esencial; cuando el financiador exige un instrumento que no captura bien las necesidades del cliente, hay que comunicar la limitacion y justificar medidas alternativas.

### `CASP_ECOBEHAVIORAL`

**Fuente:** CASP/APBA ASD Assessment Guidelines for Behavior Analysts — marzo 2026, cap. 3 p. 38 y Apendice B  
**Severidad:** notice  
**Reglas que lo aplican:** `ECOBEHAVIORAL_BARRIERS`

El analisis ecoconductual examina fortalezas y barreras ambientales; los determinantes sociales de la salud explican entre el 30 y el 55 % de los resultados en salud.

### `CASP_INTENSITY_METRIC`

**Fuente:** CASP, Evidence About ABA Treatment for Young Children with Autism — s.f., p. 11-13  
**Severidad:** warning  
**Reglas que lo aplican:** `SCOPE_INTENSITY_COMPREHENSIVE_LOW`, `SCOPE_INTENSITY_FOCUSED_HIGH`

La intensidad son las horas entregadas DIRECTAMENTE al paciente, excluyendo manejo del caso, entrenamiento a cuidadores, evaluacion de datos y supervision de protocolos. Comprehensivo de alta intensidad 30-40 h/sem durante al menos dos anos; focalizado de alcance estrecho 6-15 h/sem; focalizado sobre conducta grave 25-40 h/sem; comprehensivo de baja intensidad, apropiado en pocos casos.

> ⚠️ La propia fuente senala que los pagadores que suman las horas no directas no usan la metrica de los estudios. De ahi que FL_4_2_2_LIMITS informe en vez de bloquear.

### `CASP_AI_PARAMETERS`

**Fuente:** CASP/APBA Practice Parameters for Artificial Intelligence Use in Applied Behavior Analysis — s.f., Transparencia, Monitoreo y auditoria, Reporte de errores  
**Severidad:** n/a  
**Reglas que lo aplican:** (herramienta: AUDITOR_RULES_VERSION, summarizeAiScope, reportFindingError)

Gobierna a esta herramienta, no a los documentos auditados: trazabilidad para rastrear errores hasta su origen, revelacion del alcance del uso de IA con alternativa sin IA, y canal estructurado de reporte de errores.

### `MOL_PLAN_DATE_60D`

**Fuente:** Molina Healthcare, ABA documentation requirements — julio 2026, Initial treatment plan  
**Severidad:** blocker/warning  
**Reglas que lo aplican:** `MOL_PLAN_DATE_MISSING`, `MOL_PLAN_AGE_60D`

El plan debe haberse escrito o actualizado dentro de los 60 dias previos al envio para reautorizacion, y la fecha de redaccion debe constar en el documento.

> ⚠️ Solo se evalua si el documento declara TAMBIEN la fecha de envio. No se mide contra la fecha de la auditoria: en esta consulta el paquete se manda al seguro antes de auditarlo, de modo que la edad medida hoy sobreestima la edad al enviar y produciria blockers falsos.

### `MOL_REAUTH_WINDOW`

**Fuente:** Molina Healthcare of Florida, Comprehensive BA QRG — julio 2026, Coverage & Prior Authorization Basics  
**Severidad:** warning  
**Reglas que lo aplican:** `MOL_REAUTH_WINDOW`

Reautorizacion al menos cada 180 dias. El envio se acepta desde 30 dias antes del vencimiento y no mas tarde de 10 dias antes.

### `MOL_DX_ASSESSMENT_24M`

**Fuente:** Molina Clinical Policy No. 482 — 06/10/2026, 1.g.ii  
**Severidad:** warning  
**Reglas que lo aplican:** `MOL_DX_ASSESSMENT_24M`

Si la evaluacion diagnostica estandarizada tiene mas de 24 meses, debe acompanarse de documentacion actualizada que describa los sintomas de ASD y el impacto funcional actuales.

> ⚠️ El CDE no caduca para miembros de Medicaid; lo que se exige es la actualizacion, no una evaluacion nueva.

### `MOL_REASSESS_INTERVAL`

**Fuente:** Molina Clinical Policy No. 482 — 06/10/2026, 4.l  
**Severidad:** warning  
**Reglas que lo aplican:** `MOL_REASSESS_INTERVAL`

Las reevaluaciones deben ocurrir al menos cada 6 meses.

### `MOL_PLAN_COVERS_PERIOD`

**Fuente:** Molina Healthcare of Florida, Comprehensive BA QRG — julio 2026, 2 y 3  
**Severidad:** blocker  
**Reglas que lo aplican:** `MOL_PLAN_COVERS_PERIOD`

El behavior plan debe cubrir todo el periodo de autorizacion solicitado, hasta seis meses.


## ⚠️ Solo búsqueda — sin verificar

### `BACB_SUPERVISION_10PCT`

**Fuente:** BACB — sin verificar, sin verificar  
**Severidad:** warning  
**Reglas que lo aplican:** `SUPERVISION_10PCT`

Supervision minima del 10 % de las horas de servicio directo del RBT.

> ⚠️ Pendiente de verificar contra el texto vigente del BACB antes de citar una seccion.


## 📋 Convención clínica — no normativa

### `CPT_UNIT_MATH`

**Fuente:** Convencion del consultorio y fee schedule de Florida  
**Severidad:** blocker  
**Reglas que lo aplican:** `CPT_UNITS_MATH`

Unidades = horas por semana x 4 unidades por hora x 26 semanas para un periodo de autorizacion de seis meses.

> ⚠️ La policy confirma el periodo de hasta seis meses (4.2.1) pero NO enumera codigos CPT ni la aritmetica de unidades: los delega al fee schedule (Regla 59G-4.002). Verificar contra el fee schedule antes de citar seccion.

### `CPT_HN_MODIFIER`

**Fuente:** Convencion del consultorio y fee schedule de Florida  
**Severidad:** warning  
**Reglas que lo aplican:** `CPT_HN_MODIFIER_PROVIDER`

El modificador HN en 97155 y 97156 designa al BCaBA como proveedor; sin HN, al BCBA.

> ⚠️ No aparece en el texto de la coverage policy leido. La policy si restringe protocol modification y family guidance al Lead Analyst o BCaBA (4.2.2), que es el requisito verificable.

### `ABA_PROHIBITED_PROCEDURES`

**Fuente:** Dominio clinico codificado a mano (BACB, CASP)  
**Severidad:** blocker  
**Reglas que lo aplican:** `DRL_DANGEROUS`, `PROH_PLANNED_IGNORING_AGGRESSION`, `RESPONSE_BLOCKING_DURATION`, (terminos e intervenciones prohibidas)

Planned ignoring nunca para agresion, SIB, elopement o destruccion; response blocking con limite de 10-15 s; DRL nunca para conductas peligrosas; RIRD para automatico/sensorial; los cuidadores no recolectan datos; un reemplazo es valido solo si es funcionalmente equivalente.

> ⚠️ Reglas clinicas de Rolando. No derivadas de una lectura automatizada de las fuentes; no citar seccion.


---

**Totales:** 28 requisitos · 24 verificados contra texto primario · 1 solo por búsqueda · 3 convención clínica.
