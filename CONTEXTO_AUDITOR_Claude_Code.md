# ABA Assessment Auditor v2 — Documento de contexto para Claude Code

> **Propósito de este documento:** contexto completo para continuar el desarrollo del auditor en Claude Code. Colócalo en la raíz del proyecto (puede servir como base del `CLAUDE.md`). Contiene la arquitectura, el pipeline, las reglas clínicas embebidas, los invariantes de diseño que NUNCA deben romperse, los bugs históricos ya resueltos (para no reintroducirlos) y el método de validación obligatorio.

---

## 1. Qué es

`ABA_Assessment_Auditor_v2.html` (~5.365 líneas, archivo único HTML+CSS+JS) es una herramienta de auditoría clínica y regulatoria para assessments y reassessments de ABA bajo Florida Medicaid. La usa Rolando (BCBA consultor, Miami) para auditar documentos de analistas antes de su envío. El entregable de cada auditoría es un paquete: reporte completo + resumen ejecutivo (1-2 pág.) + hoja de correcciones + documento Word corregido con control de cambios.

**Estándares que audita:** BACB Ethics Code 2020, CASP ABA Practice Guidelines 3ª ed. (2024), CASP/APBA ASD Assessment Guidelines (marzo 2026), Florida Medicaid Behavior Analysis Services Coverage Policy §59G-4.125 (dic. 2024).

**Estado actual:** fase de prueba, 100% local (se abre el HTML en el navegador). Sin backend. Sin build system. Sin frameworks — vanilla JS.

---

## 1.1 Pagador activo (`PAYER`) — leer antes de tocar prompts

**Molina Healthcare of Florida**, vigente desde julio 2026. Antes el nombre del pagador estaba escrito a mano en **seis** lugares, dos de ellos prompts de IA: al cambiar de aseguradora, el auditor seguía redactando para el pagador anterior **en silencio**. Ahora vive una sola vez, en `const PAYER={nombre,corto}` al inicio del `<script>`.

- `PAYER.nombre` va en prosa y en los prompts; `PAYER.corto` en etiquetas de interfaz.
- Cambiar de pagador = editar dos líneas. **No** volver a escribirlo a mano.
- Se usa en: prompt conceptual (dos sitios), prompt de necesidad médica, marcador del formulario de apelación, y lista de no-traducir del prompt de traducción. Los cuatro están dentro de template literals — verificado ejecutando la página, no por grep.

**Molina NO reemplaza a AHCA.** Su guía se declara *"based in the AHCA BA Services Coverage Policy (December 2024)"*: las reglas de Florida siguen vigentes y la capa de pagador se suma. Ver `FUNDAMENTO_LITERATURA.md` §5.

**Lo que NO se hizo, a propósito:** el texto sugerido de supervisión del 10 % atribuía el requisito a "Sunshine Health requirements". **Ningún documento de Molina menciona el 10 %**, y la fila `BACB_SUPERVISION_10PCT` está marcada `verificacion:'busqueda'`. Cambiar el nombre habría inventado un requisito del pagador nuevo: se quitó la atribución y quedó solo "per BACB guidelines".

---

## 1.2 Bloque de fechas del pagador (`scanPayerDates`) — la regla que lo gobierna

Cinco requisitos de Molina son puramente temporales (FUNDAMENTO §5.3.2). Se implementan sin IA: fechas y aritmética.

**Principio, y no es negociable: solo se comparan fechas que estén AMBAS dentro del documento. Nunca contra la fecha de la auditoría.**

El primer diseño medía la edad del plan contra *hoy*, razonando que el envío ocurre hoy o después y que por tanto la edad de hoy es una cota inferior. **Rolando lo corrigió: en su consulta los analistas mandan el paquete al seguro PRIMERO y lo auditan DESPUÉS.** El envío ya ocurrió. La edad medida hoy es entonces una *sobre*estimación —un plan con 70 días hoy pudo tener 30 al enviarse, y estaba en regla— así que medir contra hoy produciría blockers falsos contra planes correctos.

Comparar fechas internas del documento además hace las reglas **reproducibles**: auditar el mismo documento dentro de un año da los mismos hallazgos. Una regla anclada en "hoy" haría que una auditoría archivada cambiara de significado con el tiempo, justo lo contrario de la trazabilidad que exigen las Practice Parameters de IA.

**Consecuencia aceptada:** si el documento no trae la segunda fecha, la regla **calla**. La de los 60 días solo se evalúa si consta la fecha de envío.

**Ambigüedad de formato (`_molGap`).** `03/04/2026` es 3 de abril o 4 de marzo. Se asume EE. UU. (MM/DD) y esa lectura es la que **dispara**; las demás solo pueden **bajar** severidad, nunca disparar. Si alguna lectura salvaría el umbral, el hallazgo baja de `blocker` a `warning` y lo dice. Así no se avisa sobre un plan correcto solo porque su fecha se pueda leer de dos maneras.

**Diseño vertical de tabla (`_molVerticalSegment`).** Encontrado auditando documentos reales, no sintéticos: los encabezados de esta consulta ponen la etiqueta en un renglón y el valor en el siguiente.

```
Date Of Report

06/29/2026
```

Con el corte por renglón, **las seis reglas de fechas estaban mudas** sobre los documentos de verdad, y `MOL_PLAN_DATE_MISSING` era un falso positivo sobre un documento que sí traía la fecha. El valor se busca ahora en el siguiente renglón no vacío, y el discriminador que impide reabrir el bug de abajo es que **un valor suelto no trae etiqueta**: si el renglón contiene `:` es otro campo y se rechaza; si es largo, es un párrafo y no una celda. Asegurado con cuatro casos de no-regresión.

**Bug histórico, no reintroducir:** el `\s*` final del regex de etiqueta se tragaba el salto de línea, con lo que el corte por renglón quedaba sin nada que cortar y `"Date of plan:"` se llevaba la fecha de nacimiento del renglón siguiente — la misma regresión que `classifyTbdContext`. `_molLabeledDate` y `_molLabeledRange` recortan el espacio final del match antes de rebanar.

Reglas: `MOL_PLAN_DATE_MISSING` · `MOL_PLAN_AGE_60D` · `MOL_REAUTH_WINDOW` · `MOL_DX_ASSESSMENT_24M` · `MOL_REASSESS_INTERVAL` · `MOL_PLAN_COVERS_PERIOD`. Categoría `payer_timelines`.

---

### 1.3 El CDE como documento separado (`scanCdeSeparate`)

Para Molina el **CDE** (Comprehensive Diagnostic Evaluation) y el **behavior assessment** son **dos requisitos separados**. Un CDE, incluso uno que traiga puntuaciones Vineland-3 o BASC-3 dentro de la evaluación diagnóstica, *no* satisface el requisito de AHCA del behavior assessment: hacen falta los informes de puntuación completos administrados y puntuados por el proveedor de BA. *"Both documents are required; one does not replace the other."*

**El principio que gobierna el bloque: el auditor no ve el paquete.** Ve **un** texto extraído —el assessment o la reevaluación—. El CDE es otro archivo, que puede existir perfectamente sin aparecer en este texto. Por eso el bloque **nunca afirma "falta el CDE"**: solo puede afirmar cosas del documento que tiene delante. De ahí dos clases de regla:

- **Concluyentes (`blocker`).** El defecto está **en este texto**. El documento declara que la evaluación diagnóstica cubre el requisito del behavior assessment (`MOL_CDE_SUBSTITUTION`), o apoya el FBA, el BIP o la función de la conducta en el Vineland-3 o el BASC-3 (`MOL_VINELAND_NOT_FBA`), que Molina prohíbe de forma expresa. Aquí no hay nada que el paquete pueda salvar: lo escrito ya es el error.
- **No concluyentes (`warning` / `notice`).** El documento **no menciona** algo. Eso no prueba que falte en el paquete, igual que en `MOL_PLAN_DATE_MISSING` un encabezado no extraído no prueba que falte la fecha. El hallazgo pide **verificar**, y lo dice con esas palabras.

**Lo que NO está aquí a propósito:** auditar el *contenido* del CDE —sus ocho elementos obligatorios, la observación directa, la firma—. Ese documento no es el que se sube. Cuando se auditen paquetes completos, ese es el bloque siguiente.

**Atribución del diagnóstico (`_cdeClientAsd`), y por qué el bloque puede callarse entero.** El fallo más instructivo de todo el proyecto, encontrado auditando un reassessment real: en 167.000 caracteres la **única** mención de *"Autism Spectrum Disorder"* estaba en la historia familiar —**el padre** de la clienta lo tiene— y `MOL_DSM5_SEVERITY_MISSING` la tomó por suya, pidiéndole un nivel de severidad del TEA a una niña cuyo diagnóstico es TDAH (F90.9) y ODD (F91.3).

> **Comprobar que un diagnóstico APARECE no es comprobar que es SUYO.** Es exactamente el fallo de probabilidad que este proyecto existe para evitar, y lo cometí igual.

El patrón familiar es **estrecho a propósito**: `parent` a secas no sirve, porque *"parent training"* y *"family guidance"* están en cada documento de ABA y dejarían el bloque mudo sobre clientes que sí tienen TEA. Exige atribución a un pariente (`her father`, `family history`, `genetic loading`). Y basta **una** mención fuera de contexto familiar: en el otro documento real el cliente tenía TEA **y sus tres hermanos también**, así que algunas menciones son familiares y otras no, y las suyas son las que cuentan. Un código `F84.x` basta por sí solo, porque en una lista de diagnósticos el código es del cliente.

**Alcance: la política del pagador es específica del TEA.** La MCP 482 se titula *"Applied Behavioral Analysis for Autism Spectrum Disorder"* y la sección del CDE también lo es. Si el diagnóstico de la clienta no es del espectro, **las ocho reglas se callan** y en su lugar sale `MOL_POLICY_SCOPE_NOT_ASD` (`notice`), que dice que hay que verificar qué política rige para ese diagnóstico. Decisión de Rolando. Si el diagnóstico **no se puede determinar**, el bloque corre igual y el aviso no sale: callar sobre lo desconocido esconderia hallazgos reales, y afirmar que la política no aplica sería inventar.

**La guarda que evita el falso positivo caro (`MOL_CDE_DX_FROM_TOOL`).** Molina rechaza que una puntuación haga de diagnóstico: *"A clinician must state the diagnosis explicitly."* Pero *"diagnóstico confirmado por la Dra. Pérez con el ADOS-2"* es **correcto**. La regla exige un verbo de atribución entre instrumento y diagnóstico **y** que en la cláusula no haya ningún indicio de persona o institución (`Dr.`, `PhD`, `psychologist`, `hospital`…). Con clínico presente, calla.

**Tensión con R14, comprobada y descartada.** R14 (`GOALS_NOT_DSM_CRITERIA`) advierte contra convertir los criterios del DSM en objetivos de tratamiento; Molina **exige** el nivel de severidad del DSM-5. No se pisan: enunciar el *nivel* no es usar los *criterios* como lista de metas. Verificado en `cde_browser.js`, no supuesto — un documento que dice "DSM-5 Level 2 (requiring substantial support)" no dispara R14 ni pide el nivel de nuevo.

**Umbrales deliberadamente bajos.** `MOL_IMPAIRMENT_ONE_SETTING` solo salta si el documento nombra menos de **dos** de los tres entornos (hogar, escuela, comunidad) en *todo* el texto. Un assessment normal los nombra, así que salta solo en el caso real de un documento que nunca sale de un entorno. `MOL_DSM5_SEVERITY_MISSING` y `MOL_IMPAIRMENT_ONE_SETTING` salen de la lista de *causas de devolución*, no de la de elementos obligatorios: de ahí `warning` y `notice`, nunca `blocker`.

Reglas: `MOL_CDE_SUBSTITUTION` · `MOL_VINELAND_NOT_FBA` · `MOL_CDE_NOT_REFERENCED` · `MOL_CDE_DX_FROM_TOOL` · `MOL_CDE_PRACTITIONER_UNCLEAR` · `MOL_CDE_SCHOOL_LETTER` · `MOL_DSM5_SEVERITY_MISSING` · `MOL_IMPAIRMENT_ONE_SETTING`. Categoría `cde_requirement`.

---

### 1.4 Criterios de alta objetivos (`scanDischargeCriteria`)

Molina, QRG §8: *"A transition and discharge plan must be established at the initiation of BA services not deferred until the member is ready to discharge"* y *"Discharge criteria should be objective and individualized, not vague. 'When clinically appropriate' is not a discharge criterion."* El ejemplo que da el pagador es cuantitativo: **0 instancias de agresión durante 6 meses, cuando el nivel actual es de 50 al día**.

Es la lógica de `PLACEHOLDER_TBD_CONVENTION` aplicada al alta: el campo existe, pero su contenido no compromete a nada. La diferencia es que aquí el placeholder no es la cadena `TBD` sino una **fórmula clínica vaga**, que *parece* contenido y no lo es.

**Tres cosas que el bloque NO hace, a propósito:**

1. **No avisa de que falte la sección.** Ya lo hacen `SEC_TRANSITION` (en `REQUIRED_SECTIONS`) y `dischargePlan` (en `scanAdminRequiredElements`). Sin ancla de alta en el texto, el bloque **calla**. Dos hallazgos para una misma laguna es el ruido que hace que un analista deje de leer el panel.
2. **No reclama los cinco criterios de alta de AHCA** que el pagador reproduce. Esos son los criterios *del pagador* para cuando el alta procede, no una lista que el plan deba copiar: copiarla es justo lo contrario de *"individualized to the specific member"*. De ahí que reproducirla sea un **hallazgo** (`MOL_DISCHARGE_POLICY_BOILERPLATE`) y no un requisito.
3. **No toca la excepción de `TBD` en la FECHA de alta**, que sigue siendo convención válida (`TBD_DATE_CONTEXT` incluye `discharge date`). Un `"Discharge criteria: TBD"` ya produce blocker por la vía existente, así que si hay un TBD en la región el bloque **le cede la palabra**. Las cuatro lecturas de `classifyTbdContext` están aseguradas en `alta_browser.js` como regresión.

**Jerarquía excluyente.** Exactamente **un** hallazgo para "los criterios no son objetivos", el que mejor describa el caso. Se diagnostica en orden —diferido → fórmula vaga → calco de la política → nada medible— y el primero que encaja habla. Sin esto, un plan malo recibiría cuatro tarjetas que dicen lo mismo.

**La región, sin slicer de secciones.** El auditor no tiene uno: `REQUIRED_SECTIONS` solo busca palabras clave en todo el texto. `_altRegions` arranca en el ancla de alta y cierra en el siguiente renglón corto con nombre de otra sección, con tope de 1800 caracteres. Y el reparto de la evidencia es deliberado: la **positiva** (criterio medible, titración de horas) se busca en la **unión** de todas las regiones; la **negativa** (fórmula vaga) por **cláusula**. Así un ancla que caiga en un índice o en una lista de comprobación no puede producir un falso positivo, solo dejar de aportar.

**El medible no es "hay un dígito".** La sección vecina trae horas, fechas y porcentajes de supervisión. Un criterio de alta empareja un número con un porcentaje, un sustantivo de conteo conductual (instancias, episodios, ocurrencias) o una duración sostenida. Asegurado con un caso donde el `10%` y las `12 consecutive weeks` del plan de supervisión **no** salvan a una sección de alta vaga.

**Dos patrones corregidos antes de probar**, los dos falsos positivos sobre documentos correctos: un tercer patrón de aplazamiento marcaba *"el plan se revisará cuando el miembro se acerque al alta"*, que es exactamente lo que el pagador exige (se eliminó; el primer patrón ya cubre el aplazamiento real por su lista de verbos, que excluye `updated` a propósito); y `as needed` disparaba sobre *"el entrenamiento a cuidadores se ajustará según se necesite"* (pasó a un segundo nivel que exige que la cláusula hable del **alta**, no solo de la transición).

Reglas: `MOL_DISCHARGE_DEFERRED` · `MOL_DISCHARGE_VAGUE` · `MOL_DISCHARGE_POLICY_BOILERPLATE` · `MOL_DISCHARGE_NOT_OBJECTIVE` · `MOL_TRANSITION_NO_TITRATION` · `MOL_DISCHARGE_SCHOOL_TRANSITION`. Categoría `discharge_criteria`.

---

### 1.5 Coherencia interna de las horas (`scanHoursConsistency`)

**Decisión de Rolando, y es la correcta:** el auditor **no juzga cuántas horas pedir**. Se piden 30, el seguro las acepta o las reduce, y esa negociación no es asunto del auditor. Lo que sí es un defecto del documento es que en una sección se pidan unas horas y en otra del mismo plan aparezcan otras.

Por eso **no hay aquí ningún umbral**: ni el techo de 40 h de Florida, ni las 25 h directas de MCP 482, ni los rangos de CASP. Solo coherencia interna. Misma forma que `AGE_INCONSISTENCY`: categoría `internal_contradiction`, severidad `warning`, el sistema **alerta** y la decisión es del analista. Sin fila en `AUDIT_REQUIREMENTS`, igual que `AGE_INCONSISTENCY`: la coherencia interna no es un requisito de una fuente externa, y `citationFor` devuelve `null` correctamente.

**El problema real de esta regla son los falsos positivos.** Un plan bien escrito está lleno de cifras de horas distintas y todas correctas: 97153 a 25 h, 97155 a 4 h, 97156 a 2 h, "3 horas por sesión", "hasta 40 h por semana" citando la política, "previamente autorizado a 20 h", "asiste a la escuela 25 h". Comparar toda cifra contra toda cifra avisaría en **cada** plan y el panel dejaría de servir. De ahí la regla que gobierna el bloque:

> **Solo se comparan cifras que AMBAS digan ser la misma magnitud.**

Un total declarado con otro total declarado. Las horas de un código, con la línea de ese mismo código. Nunca un total contra el desglose de una línea, ni una cifra del pasado contra la que se solicita, ni un techo de la política contra lo pedido: no son la misma magnitud. Cada exclusión de `HRS_RE_NOT_TOTAL` es un falso positivo que habría avisado en un plan correcto, y cada una tiene su caso.

**La exclusión que sale de la tensión CASP / pagador** (ver `FUNDAMENTO_LITERATURA.md` §5.2). Un total declarado que no cuadra con la suma de *todas* las líneas puede estar cuadrando con la suma de las **directas**, porque CASP —y MCP 482, que usa la palabra *direct*— definen la intensidad excluyendo supervisión y entrenamiento a cuidadores. Eso no es una incongruencia, **es la otra métrica**. `HOURS_TOTAL_VS_CPT_SUM` solo avisa si el total no cuadra con **ninguna** de las dos lecturas, y el hallazgo nombra las dos sumas para que el analista vea cuál habría cuadrado.

**Bug histórico, tercera vez:** el `\s*` del separador entre etiqueta y cifra cruzaba el salto de línea, así que `"Total weekly hours\n5 goals are targeted"` daba 5 horas. El separador exige ahora forma de campo o de celda (`[ \t]*[:=|][ \t]*` o `[ \t]+`), sin cruzar renglón — la misma disciplina que `_molLabeledDate` y `classifyTbdContext`. Y `total hours` a secas se descartó por genérico ("total hours of caregiver training").

**Guarda de ambigüedad en `HOURS_CODE_CONFLICT`:** si un código trae más de una línea en el canónico (p. ej. `97155` y `97155 HN`), no se puede saber a cuál se refiere la narrativa, así que **el código se descarta**.

Reglas: `HOURS_TOTAL_CONFLICT` · `HOURS_TOTAL_VS_CPT_SUM` · `HOURS_CODE_CONFLICT`. Categoría `internal_contradiction`. Corre en el bloque de `runAudit` que tiene el canónico, junto a `scanFloridaServiceLimits`.

---

### 1.6 Terminología acotada por rol (`termRoleAt`)

**Decisión clínica de Rolando**, tras auditar dos documentos reales en los que **cinco de siete blockers** eran cuatro palabras:

> *"calm, Frustration, self-regulation, Coping Skills nunca debe aparecer como intervenciones o programas de reemplazo o como adquisición de habilidades. Pero suelen referenciarse en los background de los clientes como algo que menciona la familia y en ese momento no es un problema clínico y pueden ser situaciones reales de la vida cotidiana."*

Es la forma de `classifyTbdContext`: la misma palabra, distinto veredicto según el papel que cumple. Y el eje **no** es clínico / no clínico —eso ya lo hace `sectionContextAt`— sino **programa vs antecedentes**:

| rol | veredicto | por qué |
|---|---|---|
| `program` | `blocker` | Escrito como intervención, programa de reemplazo, objetivo de adquisición o **definición operacional**. Ese es el defecto real. |
| `background` | **no se reporta** | Lo que la familia cuenta de la vida diaria no es un problema clínico. |
| `instrument` | **no se reporta** | Es el nombre de una escala del instrumento, no una elección del analista. |
| `unknown` | `warning` | No se puede probar que sea un programa, y afirmarlo con un `blocker` es lo que producía los falsos positivos. |

Solo se aplica a los cuatro términos marcados `roleScoped`. Los demás conceptos fuera del marco ABA (mindfulness, problem solving, yoga) **siguen siendo error en cualquier parte**: son procedimientos, no vocabulario, y Rolando no los puso en discusión.

**La oración pesa más que el encabezado.** Un programa nombrado dentro de los antecedentes sigue siendo un programa, y un *"la madre refiere"* dentro de una sección de metas sigue siendo lo que cuenta la familia. El encabezado es solo el respaldo cuando la oración no dice nada.

**Dos falsos positivos que solo aparecieron con documentos reales:**

1. **La ventana de la "oración" no estaba acotada.** En una tabla del `.docx`/`.pdf` la fila entera cae entre dos saltos, así que una señal de programa en una celda lejana convertía en programa una celda sin relación: un LTO de rutinas diarias hacía `program` a un `calmly` que estaba en otra columna. Hay un **tope duro de 160 caracteres por lado**.

2. **Nombres propios de escalas.** `Relational Frustration` es una escala del **BASC-3 PRQ** y `Coping Skills` un subdominio del **Vineland-3** (bajo Socialización). Van a aparecer en *todos* los assessments de esta consulta. `TERM_SCALE_NAME` más `TERM_SCORE_NEIGHBORHOOD` (dominios hermanos y valores de rango) los identifican, y se comprueban **después** de `program` para que `"Replacement program: Coping Skills"` siga siendo `blocker`. La causa raíz no era la oración sino **el respaldo por encabezado**, que en una tabla de puntuaciones encontraba antes una palabra de programa que una de antecedentes.

**El hallazgo no solo señala: dice dónde está la redacción observable.** Rolando, sobre un caso real:

> *"si lo escribió en el procedimiento lo recomendable es ponerlo en la definición y evitar ambigüedades, es decir que el auditor debe hacer esta sugerencia. He notado mucho que los analistas se complican a la hora de señalar el nombre del programa de reemplazo y usan definiciones con palabras comprometidas y que desbaratan su trabajo clínico."*

El patrón, tal cual apareció en un assessment:

```
N03 Sits and Waits Appropriately During Transitions
Definition: The ability to sit CALMLY and wait during transitions...
Procedure: the RBT will model appropriate sitting and waiting behaviors
           (e.g., SITTING QUIETLY WITH HANDS IN LAP)
```

El analista **ya sabe** qué significa "calmly" en conducta observable: lo escribió en el procedimiento y dejó la etiqueta en la definición. Así que `_termProgramEntry` acota la entrada del programa y `_termObservableElsewhere` busca ahí la redacción observable. Tres desenlaces:

| caso | qué dice el hallazgo |
|---|---|
| la redacción observable está **en otra parte de la entrada** | la cita textual y dice *súbela a la definición*; `suggestedRewrite` = `Definition: <esa redacción>` |
| está **en la misma frase** que la etiqueta | la palabra es **redundante**: bórrala y no hay nada más que reescribir |
| no está en ninguna parte | da el patrón **antecedente → respuesta observable → criterio** y una plantilla |

Y el mensaje dice explícitamente que **el objetivo suele ser legítimo y medible**, y que lo que lo compromete es la etiqueta. Importa: si el hallazgo da a entender que la meta está mal, el analista la borra en vez de reescribirla, y eso sí desbarata el trabajo clínico.

**Dos detalles de implementación que costaron:**

- **La extracción de PDF parte la ligadura `fi`**, así que `Definition:` llega como `De fi nition:`. Sin tolerarlo, el límite de la entrada nunca se encuentra. `TERM_ENTRY_MARK` lo admite.
- **Una reescritura mal formada es peor que ninguna**, porque el generador de documento corregido la escribiría tal cual en un documento clínico. Quitar `calm` de *"Jade is calm and has stopped crying"* dejaba *"Jade **is has** stopped"*. `_termDropLabel` prueba las formas conocidas —incluida `is <etiqueta> and`, donde el verbo siguiente carga la frase— y **valida el resultado**: doble auxiliar, artículo colgando o cópula al aire ⇒ devuelve `null` y no se sugiere nada. La cópula colgante (`"The client is calm"` → `"The client is"`) se colaba y la atrapó una prueba propia.

**Exención previa que no se tocó:** `isExempted` ya suprimía cualquier término citado directamente como reporte del cuidador (`"mother reported …"`), para **todos** los términos y no solo estos cuatro. `termRoleAt` es más amplio y consciente de la sección, pero no sustituye a aquélla.

---

### 1.7 Agregación: una tarjeta por problema, no una por aparición

Los dos casos salieron de auditar documentos reales, y los dos son la misma lección: **dos tarjetas para un mismo defecto es lo que hace que un analista deje de leer el panel.**

**`scanProhibitedInterventions`** hacía `matches.slice(0,2)` y empujaba **dos tarjetas idénticas** a propósito. Sobre los dos documentos reales `"Planned Ignoring"` salía duplicado. Ahora se recogen todas las apariciones de una intervención —en los dos idiomas y todas sus variantes—, se emite **una** tarjeta anclada en la primera, y la descripción dice cuántas veces aparece y con qué grafías, para que el analista las encuentre todas.

**`scanSTOIntegrity`** deduplicaba por el texto coincidente, así que `«STO#2: STO#1:»`, `«STO#3: STO#1:»` y `«STO#4: STO#1:»` contaban como problemas distintos: sobre una reevaluación real salieron **nueve tarjetas para un único defecto de copiado**. Ahora se agrega por regla y sale una, con la cuenta y hasta ocho etiquetas concretas listadas.

**Efecto secundario que conviene conocer:** la deduplicación vieja no solo inflaba unas reglas, también **escondía** otras. `STO_DUP_MEASURE` mostraba una tarjeta porque las repeticiones coincidían en el texto; agregada, revela que son **once** cláusulas de medición repetidas. Misma tarjeta, cuenta correcta.

Los topes de seguridad pasaron de contar *tarjetas* a contar *apariciones* (`cubos.<regla>.n >= 60`), que es lo que ahora crece.

Las tres reglas de STO se agregan por separado, así que un documento con los tres defectos sigue recibiendo tres tarjetas, una por defecto.

---

### 1.8 Negación: mencionar no es prescribir (`_termNegated`)

Encontrado auditando un **tercer** documento real, en un procedimiento de extinción:

> *"Do not reprimand, redirect, give direct eye contact, **soothe**, give affection, or provide any type of attention (even negative) following the behavior."*

El documento estaba haciendo **exactamente lo correcto** —instruir al RBT a NO consolar— y la regla lo marcaba como `blocker` por *"no es una intervención ABA autorizada"*. Es el mismo problema que R6 ya resuelve para la restricción: **mencionar no es prescribir**.

`_termNegated` mira hacia atrás dentro de la cláusula, porque una prohibición suele gobernar una **lista** y el término puede ser el cuarto elemento. Se aplica a los conceptos fuera del marco ABA y a los cuatro términos acotados por rol. Si **todas** las apariciones están negadas, no hay hallazgo; si una sola no lo está, se reporta esa.

**Dos trampas que costaron un rato, las dos encontradas sobre documentos reales:**

1. **El apóstrofo no puede ser opcional.** Escrito `can'?t`, el patrón cazaba la palabra suelta `cant` — y la extracción de PDF parte la ligadura, así que de *"significant"* sale *"signi **fi** cant"*. Una frase sobre religión y espiritualidad quedaba «negada» por un fragmento de *significant*. Las formas sin apóstrofo no hacen falta: `do not` y `does not` ya están. **Es la segunda vez que la partición de ligadura muerde** (la primera fue `De fi nition:` en §1.6): en este proyecto hay que asumir que el PDF fabrica palabras falsas.
2. **`avoid` a secas describe la conducta DEL CLIENTE** mucho más a menudo que una prohibición al equipo — la evitación es una función conductual y aparece en todos estos documentos (*"Abrahan may **avoid** or struggle with asking for help, leading to frustration"*). Solo cuenta como prohibición en forma de instrucción: tras un modal (`will avoid`) o al principio de la cláusula (`Avoid mindfulness…`).

**Cómo se encontraron las dos:** no adivinando. Instrumenté la función real para que imprimiera la cláusula que ve y **qué alternativa del patrón dispara**. Reproducir la lógica a mano me dio primero un resultado contrario al de la función, que es exactamente el error que este método evita.

---

### 1.9 Horas directas: el código no arrastra la cifra de la partida siguiente

Sobre el mismo tercer documento, R20 avisaba de un tratamiento **comprehensivo a 4 h/semana** cuando el plan pedía **30**. El texto es:

> *"**30 hours per week** of direct behavior treatment by protocol (97153), **4 hours** per week … with protocol modification (97155/97155 HN combined)"*

El patrón hacia delante desde el código saltaba el `)` y la coma y se llevaba **el 4 del 97155** como si fueran horas directas. El hueco entre el código y la cifra ya no puede contener `)`, `;` ni `,`: un cierre de paréntesis o una coma significan que la partida de la lista terminó.

Es el mismo error de fondo que el diseño vertical de fechas y que la ventana de tabla en la terminología: **una cifra cerca de la etiqueta equivocada**. Conviene sospechar de cualquier patrón que salte de un rótulo a un número sin acotar qué puede haber en medio.

---

### 1.10 Reforzador sensorial vs intervención sensorial

**Decisión de Rolando:** *"que el reforzador sensorial no se marque como intervención"*. Los dos casos salen del mismo documento real:

| texto | veredicto |
|---|---|
| *"**Reinforcers** varied and included verbal praise, preferred toys, and **sensory items** **delivered** across continuous, fixed ratio…"* | inventario de reforzadores → **no se marca** |
| *"K. Leisure & Play (Sensory) **Definition**: Appropriate sensory seeking is defined as accessing designated **sensory tools** or activities…"* | programa de reemplazo sensorial → **`blocker`** |
| *"**Teach requesting** for **sensory items** (**mand training**)"* | el ítem es el reforzador que se pide → **no se marca** |
| *"**Reinforce engagement with** designated **sensory tools**"* | la herramienta es la conducta reforzada → **`blocker`** |

Solo se aplica a `PROH_SENSORY`, marcada `reinforcerOk:true`. Las demás intervenciones prohibidas (respiración profunda, yoga) no tienen sentido como reforzador.

**El verbo no basta.** La primera versión aceptaba `reinforc\w*`, y con eso *"**Reinforce** engagement with designated sensory tools"* quedaba exenta — pero ahí la herramienta sensorial es la conducta que **se refuerza**, no el reforzador que **se entrega**: eso sí es el programa. `INTV_REINFORCER_CTX` exige señal de **inventario** (`reinforcers` como sustantivo, `preference assessment`, `preferred items`) o de **entrega** (`delivered`, `earned`, `contingent on`, `FR3`, `mand`, `requesting for`).

**Guarda de precedencia:** si la cláusula además nombra un programa (`definition`, `goal`, `replacement`, `target behavior`…), manda el programa. **No** se reutiliza `TERM_ROLE_PROGRAM_SENT` para esto, porque ese patrón incluye `reinforce` — que es justo la señal del reforzador — y se pisarían.

---

### 1.11 La negación, aplicada también a las intervenciones prohibidas

`scanProhibitedInterventions` **no tenía ninguna exención**: ni `isExempted` ni negación. Así que *"do not use deep breathing"* se marcaba igual que prescribirlo. Es el mismo hueco que §1.8 cerró en la función hermana, y se cerró igual.

**`instead of` y `rather than` se retiraron del detector**, y conviene saber por qué. La negación **solo mira hacia atrás**, así que no puede saber de qué lado de la frase está el término:

- *"**Instead of** DRA, the RBT will use sensory strategies"* → eximía justo lo que hay que marcar: **un blocker perdido**.
- *"**Instead of** yoga, use DRA"* → ahora avisa, aunque el documento hace lo correcto.

Se acepta el aviso de más porque **perder un blocker de intervención prohibida es peor**, y porque prescribirla es más frecuente que esa forma de prohibirla. También corregían de menos la cuenta cuando el texto describe un déficit (*"engages in stereotypic behavior instead of accessing designated sensory tools"*).

**✅ RESUELTO — la exención del reporte del cuidador sí se aplica** (decisión de Rolando: *"aplica isExempted a las intervenciones prohibidas"*), pero **solo su bloque 1**, y la distinción importa.

`isExempted` tiene dos bloques. El **1** exime lo **citado o reportado por el cuidador**: eso es lo que se extrajo a `_quotedOrCaregiverReported` y se reutiliza en `scanProhibitedInterventions`. La extracción es **literal**, así que el comportamiento de `isExempted` no cambia en nada para la terminología.

El **bloque 2** se quedó fuera **a propósito**, y no por prudencia genérica: exime por palabras —`physiological arousal`, `emotional regulation`, `anxiety disorder`, `stress-related`— que existen para proteger el **vocabulario de estado emocional** cuando es lenguaje clínico legítimo. Aplicado a las intervenciones eximiría justo lo que hay que marcar, y **no como rareza sino como caso común**: una intervención prohibida se prescribe casi siempre *para* la activación, la regulación emocional o la ansiedad. Comprobado antes de decidirlo — con el `isExempted` completo quedaban exentas las tres:

| texto | con isExempted completo | ahora |
|---|---|---|
| *"Relaxation training will be taught to reduce **physiological arousal**"* | exenta | **`blocker`** |
| *"Sensory strategies will support **emotional regulation** during transitions"* | exenta | **`blocker`** |
| *"Deep breathing will be used given his **anxiety disorder** diagnosis"* | exenta | **`blocker`** |

Tres blockers legítimos que se habrían perdido en silencio. Hay un caso por cada uno en `exem_browser.js`, porque es el riesgo que vigilar si alguien amplía la exención más adelante.

**Limitación conocida:** los patrones del bloque 1 son **solo en inglés** (`mother reported`, `father stated`). Un *"la madre refiere que probó respiración profunda"* no se exime todavía. Añadir las formas en español cambiaría también el comportamiento de la terminología, así que queda pendiente de decidirlo aparte.

**Reparto entre las dos funciones, que conviene tener claro:** `yoga` es un **término** prohibido (`TERM_YOGA`, en `PROHIBITED_TERMS`) y no una intervención, así que lo coge `scanProhibitedTerms`. `scanProhibitedInterventions` no lo conoce. Un caso del harness lo fija, porque probar yoga con la función equivocada da un falso "pasa".

---

## 2. Arquitectura

- **Un solo archivo HTML.** Todo el CSS en `<style>`, todo el JS en un único `<script>`.
- **API de IA:** llamadas directas desde el navegador a `https://api.anthropic.com/v1/messages`, modelo `claude-sonnet-4-6` (10 sitios de llamada), con header `anthropic-dangerous-direct-browser-access: true`. La clave la ingresa el usuario y se guarda en localStorage.
- **Persistencia:**
  - `localStorage` vía helper `LS` (get/set/del con try-catch; `set` devuelve `false` si falla por cuota — SIEMPRE verificar ese retorno).
    - `aud_apikey` — clave API
    - `aud_clients` — lista de clientes
    - `aud_docs_<clientId>` — documentos (texto extraído + metadatos) por cliente
    - `aud_audits_<clientId>` — auditorías por cliente (**una por documento**, la más reciente reemplaza)
    - `aud_last_sel` — última selección {clientId, docId} para restaurar al recargar
  - `IndexedDB` vía helper `IDB` (DB `aud_files`, store `originals`): guarda el **binario .docx original** con clave `orig_<docId>` — imprescindible para el documento corregido con control de cambios. Se limpia en `deleteDoc`.
- **Librerías CDN:** pdf.js 3.11.174 y mammoth 1.6.0 (cargadas en `<head>`); JSZip 3.10.1 y html-docx-js 0.3.1 con **carga perezosa** y fallbacks de CDN (`loadJSZip()`; para html-docx-js usar `dist/html-docx.js`, NO existe `.min.js`).

---

## 3. Modelo de datos

```
client:  { id, clientCode, hint, age, lang, agency, dx, notes }
docObj:  { id, filename, format:'PDF'|'DOCX', text, pageBreaks (PDF: offsets; DOCX: null),
           pageEstimate (DOCX: {charsPerPage, pages, source} desde docProps/app.xml; PDF: null),
           docType, wordCount, uploadedAt, hasOriginal (docx en IDB), canonical (ver §5) }
audit:   { id, docId, findings[], redesigns[], auditedAt, docFilename }
finding: { id, ruleId, severity:'blocker'|'warning'|'notice', category, description (ES),
           matchedText, context {before,matched,after}, position, pageNum, pageApprox,
           suggestedAction (EN), suggestedRewrite (EN), writingNote (ES), autoCorrection,
           aiGenerated, status:'open'|'resolved'|'accepted_with_justification'|'false_positive',
           justification, approvedFix, confidence (0-100), criticVerdict, criticNote (ES),
           carriedOver, errorDetail, createdAt }
redesign:{ behavior, function, inferredFunction, proposed_replacement{name,operational_definition},
           congruent_interventions[], rationale_es, paste_block (EN), approved }
```

---

## 4. Pipeline de auditoría (`runAudit`, línea ~1594)

Orden de ejecución:

1. **Reglas deterministas (regex, sin API):** términos prohibidos con contexto (`scanProhibitedTerms`), intervenciones prohibidas (`scanProhibitedInterventions`), artículos ("a BCBA"→"the BCBA"), secciones requeridas, matemática CPT (unidades = h/sem × 4 × 26), regla del modificador HN (`CPT_HN_MODIFIER_PROVIDER`), STO en conductas peligrosas.
2. **Extracción canónica** (`runCanonicalExtraction`, ~2835): una pasada de IA → estructura {client, documentType, behaviors[{name, topography, function, functionSource, replacements[{name, functionTargeted}], interventions[]}], caregiverGoals, cpt[{code, modifier, provider, hoursPerWeek, units}], supervision}. Presupuesto 12.000 tokens, **reintento a 20.000 si `stop_reason==='max_tokens'`**; parser tolerante `parseCanonicalJSON` que **rescata conductas completas de respuestas truncadas**. Se **cachea en `docObj.canonical`** (no se re-extrae al re-auditar). Si queda parcial (`partial:true`), la coherencia usa texto crudo.
3. **Auditoría conceptual** (`runConceptualAudit`, ~2627): pasada amplia clínica/regulatoria. Contiene el bloque **VALID MEASUREMENT CONVENTIONS — DO NOT FLAG** (ver §6) y el protocolo de **contradicciones: solo alertar, nunca elegir bando**.
4. **Coherencia funcional** (`runFunctionalCoherenceAudit`, ~2984): función ↔ reemplazo ↔ intervención por conducta, con tabla de referencia por función (escape/atención/tangible/automático). Usa el canónico si existe; si es parcial o falta, texto completo. Prefijo `[conducta]` en la descripción.
5. **Solapamiento de topografías** (`runTopographyOverlapAudit`, ~3100): pares tipo Bolting↔Elopement (doble conteo). Solo con ≥2 conductas en el canónico. Conservador por instrucción.
6. **Pasada crítica** (`runCriticPass` + `applyCriticVerdicts`, ~2405/2481): lotes de 14, asigna `confidence` 0-100 + veredicto + razón en ES. **SOLO ANOTA — NUNCA cambia el status** (decisión firme del usuario tras perder confianza en el auto-descarte).
7. **Herencia de decisiones:** al re-auditar el mismo documento, los hallazgos previos con status `false_positive` o `accepted_with_justification` se transfieren al hallazgo nuevo equivalente (clave: `ruleId + '|' + matchedText` normalizado, 80 chars). `resolved` NO se hereda a propósito (si reaparece, sigue presente). Marca visual "decisión previa".
8. **Enriquecimiento de rewrites** (`runRewriteEnrichment`, ~2491): textos listos para pegar (EN). **Excluye contradicciones por patrón `/contradic/i`** (las categorías de IA llegan con espacio O guión bajo — nunca comparar por igualdad exacta). Fallos parciales → solo consola; fallo total → aviso naranja suave (no banner rojo).
9. **Anotación de páginas:** `resolvePage(f, doc)` — exacta para PDF (`pageBreaks` + `getPageForPosition`), **aproximada para DOCX** (estimación `charsPerPage` derivada del `<Pages>` real de `docProps/app.xml`; badge "≈ Pág. N").
10. **Writing quality pass** (`runWritingQualityPass`): apoyo de redacción para hablantes de español L1 (no cumplimiento).

**Infraestructura de llamadas:** `callClaudeMessages(payload, opts)` (~2291) — helper central con: `temperature:0` por defecto (reproducibilidad; respeta valor explícito), reintentos con backoff exponencial 1s/2s/4s + jitter ante `Failed to fetch`/429/5xx/529/respuesta vacía, y clasificación de errores vía `classifyApiError` (auth/rate/credit/server/network/size) que alimenta la "Causa detectada" del banner. `runWithConcurrency(items, worker, 2)` limita a **2 lotes simultáneos** (crítica y enrichment) para no disparar rate limits.

---

## 5. Módulos de corrección (el flujo sostenible)

Barra "Flujo de corrección" en la pestaña de auditoría:

- **📄 Ver hallazgos en el documento** (`renderDocPreview`, ~3813): texto con resaltados por severidad en la posición exacta; clic → salto a la tarjeta (`focusFinding`, tarjetas con `id="card-<fid>"`). Los spans solapados se descartan (se conserva el primero/más severo).
- **✓ Aprobar todas las corregibles** (`approveAllFixable`): aprueba en bloque los hallazgos abiertos con corrección mecánica (`deriveCorrection` → kind `replace`). **Excluye** `category==='system'` y `/contradic/i`.
- **📝 Generar documento corregido** (`generateCorrectedDocx`, ~4795): aplica lo aprobado sobre el **.docx original de IndexedDB** como control de cambios de Word. Motor `_processDocumentXml` (~4706): reconstruye el texto por párrafo concatenando runs, matching tolerante a espacios y mayúsculas (`_normalizeWithMap` con mapa norm→raw), maneja hallazgos que **cruzan runs**, envuelve en `<w:del>` (original, `w:delText`) + `<w:ins>` (reemplazo **con `<w:highlight w:val="yellow"/>`** para visibilidad), preserva `rPr`. Reporta aplicados / no encontrados / manuales — **nunca falla en silencio**. Solo primera ocurrencia por reemplazo. Salta runs ya dentro de `w:ins`/`w:del`.
- **🔧 Rediseñar pares incoherentes** (`runCoherenceRedesign`, ~3876): para conductas con reemplazo desalineado, sin reemplazo, o nombradas en hallazgos de coherencia abiertos → una pasada de IA propone {reemplazo funcionalmente equivalente + definición operacional + intervenciones congruentes + rationale ES + paste_block EN}. Si la función fue inferida → marca roja "verificar FAST/MAS". Aprobación por conducta; persiste en `audit.redesigns`; los aprobados entran a la hoja de correcciones.
- **📋 Hoja de correcciones** (`generateCorrectionSheet`, ~4581): 3 secciones — Rediseños estructurales, Reemplazos directos (tabla buscar→reemplazar), Edición manual. Se genera aunque solo haya rediseños.
- **📰 Resumen ejecutivo (1-2 pág.)** (`generateExecutiveBrief`, ~4498): score+banda, chips, top 18 rojos por confianza (con página), top 8 naranjas, rediseños aprobados, próximos pasos, alerta de IA.
- **🧾 Apelar una denegación** (`toggleAppealLetter` / `generateAppealLetter`): redacta el borrador de la carta de apelación cuando el pagador **ya denegó**. Distinto de **🩺 Necesidad médica (borrador)** (`generateMedicalNecessityBrief`), que escribe la sección *prospectiva* para pegar **dentro** del assessment. Ver §5.1.

- **`extractSentenceAt`** (~4454): expande a la oración completa para el "buscar" de rewrites. **Recorta títulos/encabezados en MAYÚSCULAS** pegados al inicio (regex `/^([A-Z][A-Z0-9\s\-–—:&\/()',]{6,}?)\s*(?=[A-Z][a-z])/`) — bug histórico: borraba "BEHAVIOR ANALYSIS ASSESSMENT" del documento.

**Reportes:** `buildReportHTML` — orden: aviso de IA → Resumen ejecutivo → score (fórmula saturante) → chips (etiquetas EN, `CAT_LABELS` con lookup normalizado espacio/guión bajo) → **hallazgos (rojos primero)** → estructura clínica extraída → justificaciones → apoyo de redacción → declaración del consultor. **TODOS los colores en estilos inline con hex** (Word y el HTML standalone descartan clases CSS). Selector de idioma: bilingüe (default) o "Todo en inglés" (`translateReportToEnglish`). Export docx vía html-docx-js (MHT/altChunk) con `resolveCssVars`.

**Puntuación (fórmula actual, NO volver a la lineal):**
```
weighted = blockers*5 + warnings*1.5 + notices*0.3
score    = max(1, round(100 * 80 / (80 + weighted)))   // saturante, nunca 0
Bandas: ≥90 Listo/casi · ≥72 Ajustes menores · ≥50 Requiere correcciones · <50 Priorizar rojos
```
Es un **indicador de avance** (sube al atender hallazgos), no una calificación del analista. La lineal anterior daba 0/100 con ~20 rojos → humillante e ininformativa.

---

### 5.1 Modo apelación (`generateAppealLetter`) — encuadre del CASP Appeals Guide

Fuente: *The Health Insurance Appeals Guide* (CASP et al., 2021). **No es estándar de práctica ni es específica de Florida: no genera reglas de auditoría.** Aporta encuadre, y el encuadre es lo que este modo implementa.

**1. La denegación tiene tipo, y el tipo decide la estrategia** (`APPEAL_DENIAL_TYPES`). El prompt se ramifica; escribir la carta equivocada para el tipo equivocado quema un nivel de apelación.

| Tipo | Estrategia que impone el prompt |
|---|---|
| **Administrativa** | Corregir el defecto y reenviar. Prohibido argumentar necesidad médica largo: el pagador no discutió la clínica. |
| **De cobertura** | Primero contractual/regulatorio (BA es beneficio cubierto bajo la Regla 59G-4.125, F.A.C.); la clínica es secundaria. No conceder la cuestión de cobertura argumentando solo necesidad médica. |
| **Clínica** | Aquí el assessment **es** la prueba: rebatir punto por punto la razón citada + los cinco elementos de necesidad médica + justificación de intensidad, todo anclado en lo documentado. |

**2. El assessment ya redactado es la prueba** → de ahí `appealPreflight(audit)`, lo único que esta herramienta puede hacer y un redactor genérico no: **antes** de gastar una llamada de IA, mira los hallazgos **abiertos** de la auditoría vigente y avisa sobre qué documento se está apelando. Blockers abiertos = huecos por los que el pagador puede denegar otra vez, citados con su fila de `AUDIT_REQUIREMENTS` cuando está verificada contra texto primario.

- Solo `status==='open'`: lo resuelto o justificado ya lo decidió el analista.
- **Deduplica por `ruleId`**: ocho metas sin fecha de dominio son *un* hueco, no ocho.
- **Avisa, no bloquea.** La decisión de apelar es de Rolando.
- Los huecos entran al prompt como `weaknessBlock` con instrucción explícita de **no mencionarlos en la carta, no disculparse y no inventar contenido para taparlos** — solo para no sobreafirmar. Lo que la carta no pueda sostener va a `gaps`.
- Si hay blockers, el documento generado lleva una caja **"Aviso interno — NO forma parte de la carta"** marcada *"Elimine esta caja antes de enviar"*.

**Lo que el modo NO hace, deliberadamente: no afirma plazos.** El plazo lo fija el aviso de denegación y varía por plan y por nivel; no está verificado contra texto primario en este proyecto. `_appealDaysSince` cuenta **días transcurridos** (aritmética pura, verificable) y a >45 días remite al aviso. El prompt lleva `DEADLINE RULE: do NOT state any filing deadline`.

**Resto de invariantes heredados:** cero fabricación de números; `CITATION RULE` citando solo desde `verifiedSourcesForPrompt()`; red de `firstVetoedOutputTerm` que **muestra** el término vetado en vez de descartar en silencio; sello de `auditTraceLine`; pie que declara borrador con IA y que el BCBA firma y conserva la responsabilidad clínica y legal.

`AUDITOR_RULES_VERSION` **no se incrementa**: este modo no cambia ninguna regla de auditoría ni altera un solo hallazgo.

---

## 6. Reglas clínicas embebidas (dominio — NO alterar sin consultar a Rolando)

- **Terminología prohibida sensible al contexto** (`scanProhibitedTerms` + `sectionContextAt`): palabras de estado emocional (calm, anxious, frustrated…) son error **solo en secciones clínicas** (definiciones, plan, hipótesis, metas, recomendaciones). En secciones **claramente no clínicas** (antecedentes, historia, narrativa familiar — parsimonia para padres) → una sola observación suave agregada. **Contexto desconocido = clínico (se marca)** — regresión histórica: tratar "unknown" como no clínico suprimía errores reales. Conceptos no-ABA (mindfulness, problem solving, social stories, anger management, etc.) son error en cualquier parte, agregados por concepto con conteo.
- **Contradicciones internas: SOLO ALERTA.** Nunca generar rewrite ni auto-aprobar (el sistema no elige bando; el analista decide). Enforcement por `/contradic/i` en enrichment y en `approveAllFixable`.
- **Convenciones de medición VÁLIDAS (no marcar):** (a) sistemas mixtos entre conductas — Task Refusal en **porcentaje** (sobre demandas presentadas) y el resto por **ocurrencias** es correcto; (b) **línea base por sondas de 1 hora** en 2-3 días (ej. 13, 15, 12) con incidencia semanal = promedio × 30 horas semanales — verificar la aritmética con esa convención antes de marcar.
- **"TBD"/"TBA": convención válida SOLO en fechas de servicio** (`classifyTbdContext` + `scanPlaceholders`). Exento (no genera hallazgo, se agrupa en un `notice` único `PLACEHOLDER_TBD_CONVENTION`): inicio de servicios, período de autorización, próxima revisión/reassessment, alta, firma, "upon authorization", "ongoing" — dependen del QIO. **Se marca como `blocker` (`FL_GOAL_ELEMENT_TBD`, categoría `florida_medicaid`)** cuando sustituye un elemento que **FL Medicaid §6.2.2** exige por cada meta u objetivo: línea base / nivel actual, fecha de introducción, fecha estimada de dominio, criterio de dominio, procedimientos de medición, plan de generalización, condiciones. La norma pide un valor *estimado*, así que la incertidumbre no lo justifica — **tampoco en conductas o reemplazos nuevos de un reassessment**. `TBD_NEVER_VALID` (identidad del cliente, función, definición operacional) sigue siendo `blocker` genérico. Las ventanas de contexto se cortan en el salto de línea/oración anterior y en el límite de párrafo a ambos lados. Replicado en el prompt conceptual (convenciones (c) y (c2)) y en la lista de falsos positivos de la crítica.
- **Instrumentos núcleo obligatorios — FL Medicaid §4.2.1** (`scanCoreInstruments`, `FL_CORE_INSTRUMENT_PATTERNS`): la evaluación inicial debe incluir administración, puntuación y reporte de **Vineland-3 Comprehensive Parent Interview Form** (todos los recipients) **+ Maladaptive Behavior Domain** (≥3 años) y **BASC-3 PRQ** (2–18 años), con el reporte completo de puntuaciones en la solicitud de autorización. Ausencia → `blocker` en assessment inicial; `warning` en reassessment (el ciclo es cada 12 meses y el auditor no sabe cuándo se administraron). Chequeos de especificidad en `warning`: edición anterior al Vineland-3, formulario no identificado, BASC-3 sin PRQ (TRS/PRS/SRP no lo sustituyen), y puntuaciones no reportadas. Se omite en monthly/medical_necessity/iep. **La edad** sale del perfil del cliente; si falta, del documento usando **solo los patrones de edad actual de `scanAgeConsistency`** — los patrones sueltos capturan hermanos e hitos del desarrollo. Edades contradictorias → edad desconocida y las reglas con umbral bajan a `warning`.
- **Tabla y gráfico por conducta en reassessment — FL Medicaid §6.2.3** (`scanProgressDataPerBehavior`): "Each behavior under treatment must have its own data table and corresponding graph". **Los gráficos son objetos embebidos y NO están en `docObj.text`** — buscar la palabra "graph" encuentra menciones, no gráficos. La regla abre el **.docx original de IndexedDB** con JSZip y cuenta estructura OOXML real: `<w:tbl>` en `document.xml`, partes `word/charts/chartN.xml` y archivos `word/media/`. **Principio: el déficit es demostrable, la suficiencia no** — los conteos sobreestiman (un `<w:tbl>` puede ser el horario de servicios, una imagen puede ser el logo), nunca subestiman; por eso "menos objetos que conductas" es `blocker` concluyente, y "objetos suficientes" NO afirma cumplimiento. Corre tras la extracción canónica (necesita el conteo de conductas). Sin binario inspeccionable (PDF, o docx subido antes de guardar el original) → `warning` de verificación manual; sin canónico solo detecta la ausencia total.
- **Explicación de falta de progreso — FL Medicaid §6.2.3** (`scanNoProgressExplanation`): si no hubo progreso clínicamente significativo en el período, la norma exige **(a)** por qué y **(b)** qué cambios de tratamiento se harán. La obligación es **condicional** y su antecedente es un juicio clínico, así que **la regla determinista no juzga el progreso**: solo actúa cuando el propio documento lo declara (nulo/mínimo/limitado, "remains at baseline", regresión, meseta, y equivalentes en español) y verifica que estén las dos consecuencias. Falta alguna → `blocker` que nombra cuál. Una sola tarjeta aunque haya varias señales. Aplica a `reassessment` o a documentos que se declaren "continuation of services"/"reauthorization". **El caso en que los datos muestran estancamiento pero el texto no lo dice queda para la pasada conceptual** (añadido al punto H del prompt), que sí puede juzgarlo.
- **Límites de cobertura — FL Medicaid §4.2.2** (`scanFloridaServiceLimits`): **las dos reglas de HORAS son `warning`, no `blocker`, porque la métrica está en disputa.** CASP (*Evidence About ABA Treatment for Young Children with Autism*, p. 11) define la intensidad como horas entregadas **directamente** al paciente y **excluye** manejo de caso, entrenamiento a cuidadores, evaluación de datos y supervisión de protocolos; su nota al pie dice que los pagadores que suman esas horas "no usan la métrica utilizada en la mayoría de los estudios". Florida, en cambio, lista modificación de protocolo y guía a la familia **dentro** de los "BA intervention services" sujetos al techo. Un plan con 35 h directas + 4 de supervisión + 2 de entrenamiento suma 41 y excede según el pagador, pero su intensidad clínica es 35. El auditor no puede resolver esa discrepancia por el analista, así que **informa en vez de bloquear** y la descripción explica ambas lecturas. **Los límites CATEGÓRICOS siguen siendo `blocker`** porque no dependen de cómo se cuenten las horas: **40 h/semana** de servicios de intervención (cifra suelta declarada, y **suma por línea usando el canónico** — sumar cifras del texto contaría dos veces la misma línea entre tabla y narrativa; los códigos de evaluación 97151/97152 se excluyen); **grupo máximo de 6** participantes; **protocol modification (97155/97158) y family guidance (97156) solo Lead Analyst o BCaBA**, nunca RBT. Todos `blocker`. **La atribución al RBT se detecta con patrones direccionales, no por coincidencia**: en una sesión de 97155 el RBT suele estar presente siendo supervisado y eso es correcto — solo se marca cuando el documento dice que el RBT *presta* o *factura* el servicio. Corre tras la extracción canónica, que aporta las horas por línea.
- **Servicios NO cubiertos — FL Medicaid §5.2** (`scanNonCoveredServices`, tabla `FL_NON_COVERED_SERVICES`): reclusión y restricción manual/mecánica/química, acompañamiento 1:1 / cuidado personal / companion / chaperone / shadow, guardería, testing psicológico y psicoterapia y afines, tiempo de viaje, y servicios el mismo día que BHOS/TBOS/therapeutic group care. **Dos guardas contra el falso positivo, que aquí son el riesgo principal:** (1) **negación** — un buen plan de crisis dice que *no* usa restricción, y se comprueba **antes** del término y en su **predicado posterior** ("is prohibited", "is not billed"), acotada a la misma oración y a tres palabras del verbo para no suprimir "restraint may be used when de-escalation **does not** work"; (2) **lenguaje de prestación** (`requiresProvision`) — citar una evaluación psicológica previa en la revisión de registros es correcto y lo piden las guías CASP/APBA, así que esas categorías solo se marcan si el documento **propone prestar** el servicio. **El formato 1:1 de terapia directa SÍ está cubierto** — lo excluido es el rol de acompañante, por eso los patrones exigen la palabra *aide/assistant/paraprofessional*. Una sola tarjeta por categoría. Se omite en `iep`.
- **Nueve elementos por meta — FL Medicaid §6.2.2** (`scanGoalRequiredElements`, tabla `FL_GOAL_ELEMENTS`): definición observable y medible, procedimientos de observación y medición directa, nivel actual (línea base), procedimientos de reducción o adquisición, condiciones y criterio de dominio, fecha de introducción, fecha estimada de dominio, plan de generalización, y reporte de progreso (cumplida / no cumplida / modificada). Las metas de cuidadores añaden **procedimientos de entrenamiento** (solo se exige si hay contenido de entrenamiento a cuidadores). **El razonamiento de R4 se INVIERTE aquí y por eso la regla NO cuenta por meta:** en R4 los conteos sobreestiman (deficit demostrable), pero aquí las etiquetas **sub**estiman — una tabla de metas con una sola fila de cabecera "Baseline" sirve a ocho metas y produce una ocurrencia. Comparar ocurrencias contra el número de metas daría falsos blockers en documentos correctos. **Lo único demostrable es la ausencia total**: si un elemento no aparece en ninguna forma, ninguna meta lo tiene → un único `blocker` que lista los ausentes y **advierte explícitamente que no verifica meta por meta**. La guarda de activación exige señal de **sección** de metas ("TREATMENT GOALS", "Goal 1", tabla de metas), no un término suelto: una carta que diga "no targets" no debe recibir nueve elementos faltantes. Se omite en monthly/medical_necessity/iep.
- **Participación parental — FL Medicaid §4.2.2 y §7.2** (`scanParentParticipation`): tres comprobaciones. **(1) Condicional, como R5**: si el documento declara que la participación fue nula o limitada, §4.2.2 exige documentar **razones + impactos potenciales + cómo se mitigan** → `blocker` que nombra cuáles faltan. La regla **no juzga** si el cuidador participa lo suficiente; actúa sobre lo que el documento declara. **(2)** En continuación (`reassessment` o texto que se declare "continuation of services"/"reauthorization"), §7.2 exige **datos** de participación: sin mención alguna → `blocker`; mención sin cifras (sesiones asistidas sobre ofrecidas, porcentaje, tasa) → `warning`, porque la narrativa podría bastar y no se afirma lo contrario. **(3)** Esfuerzos por acomodar la participación: requisito incondicional de §4.2.2, pero se emite como `warning` — su ausencia es un vacío documental, no prueba de que el proveedor no lo intentara. Reutiliza `FL_EXPLANATION_SIGNALS` de R5 (declarada más abajo en el archivo; segura porque solo se evalúa dentro de `runAudit`). Se omite en monthly/medical_necessity/iep.
- **Elementos administrativos — FL Medicaid §6.2.2 y §7.2** (`scanAdminRequiredElements`, tabla `FL_ADMIN_ELEMENTS`): razón de referencia, historia médica y del desarrollo, medicamentos, historia familiar, entrevista clínica, file review, procedimientos y resultados de la evaluación, entornos de tratamiento, unidades por código, necesidad médica de las unidades, **nombres** de los supervisores autorizados, coordinación de cuidados, y plan de alta. **Solo cubre lo que `REQUIRED_SECTIONS` NO comprueba ya** — crisis, transición, supervisión genérica y consentimiento genérico los cubre `scanCompleteness` y no se repiten aquí; lo que añade es el detalle que esas secciones genéricas no garantizan. Un solo `warning` agregado que **advierte que la detección es por palabra clave** y que el contenido puede estar bajo otro encabezado, igual que hace `scanCompleteness`. Aparte: **firmas** del Lead Analyst **y** del padre o tutor (`warning`, con aviso de que **una firma escaneada no aparece en el texto extraído** y el hallazgo puede ser falso positivo), y **IEP o plan 504** cuando el documento indica prestación en la escuela (§7.2), con la ruta de excepción explicada en la acción sugerida. Se omite en monthly/medical_necessity/iep.
- **Fuente de la evidencia funcional — CASP/APBA cap. 3, p. 22** (`scanFunctionEvidenceSource`): *"practitioners should prioritize the use of **direct observation** and measurement — the heart of ABA… **indirect measures supplement direct measures**"*. Una función sostenida **solo** en FAST, MAS, QABF o entrevista **no cumple el estándar**. Severidades: sin ningún método nombrado → `warning`; solo indirecto → `warning`, y **`blocker` si hay conducta peligrosa** (la intervención depende de una función no verificada). Categoría `clinical_safety`. **La clasificación primaria es por TEXTO, no por el canónico**: la afirmación a nivel de documento es la fiable ("si no se nombra ningún método directo, ninguna conducta lo tiene"), mientras que localizar el método de cada conducta en texto plano es frágil. El detalle **por conducta** sale del canónico, se marca como tal y avisa de que procede de la extracción automática. Las conductas peligrosas se detectan por `DANGEROUS_BEHAVIORS` sobre el canónico, y sobre el texto si no hay canónico. **Se amplió el enum `functionSource`** del prompt de extracción para que pueda expresar evidencia directa (`functional_analysis`, `ABC_direct_observation`, `descriptive_assessment`) — antes solo tenía valores indirectos; **no se fuerza re-extracción**, porque la clasificación por texto funciona igual con canónicos cacheados.
- **Coherencia alcance ↔ intensidad — CASP, *Evidence About ABA Treatment*** (`scanScopeIntensityCoherence`): rangos verificados en la fuente primaria — comprehensivo de alta intensidad **30–40 h/sem durante al menos dos años**; focalizado de alcance estrecho **6–15 h/sem**; focalizado sobre conducta desafiante grave que compromete seguridad o salud **25–40 h/sem**; comprehensivo de baja intensidad, apropiado "en pocos casos" (típicamente mantenimiento con datos que lo respalden). **MÉTRICA: horas de tratamiento DIRECTO (97153/97154), no el total de R9** — la fuente excluye manejo de caso, entrenamiento a cuidadores, evaluación de datos y supervisión de protocolos. Son las dos caras de la misma calibración: R9 usa la métrica del pagador, R11 la clínica, y cada hallazgo lo explica. **Todo `warning`**: la fuente subraya que la intensidad debe reflejar el número, complejidad, amplitud y profundidad de los objetivos y la respuesta al tratamiento — son rangos de evidencia, no límites normativos. **La regla solo actúa si el documento DECLARA su alcance**; inferirlo del número de metas sería adivinar el antecedente. Excepciones que suprimen el hallazgo: **mantenimiento** (comprehensivo de baja intensidad) y **conducta grave con riesgo** (focalizado de alta intensidad). Los patrones de alcance exigen `comprehensive` + palabra de tratamiento, para **no confundir el "Comprehensive Parent Interview Form" del Vineland (R1)** ni "comprehensive assessment" con alcance comprehensivo.
- **Fidelidad procedimental, distinta del IOA — CASP/APBA cap. 4, p. 43** (`scanProceduralFidelity`): *"just as practitioners measure the treatment fidelity of ABA-based services, they should also measure and evaluate the **procedural fidelity of assessment implementation**"*, con lista de verificación paso a paso puntuada Sí/No que produce un **porcentaje de adherencia**, y **adherencia total** como meta — sobre todo con instrumentos estandarizados, donde afecta directamente a la validez. **El capítulo 4 trata IOA (p. 42) y fidelidad (p. 43) en secciones SEPARADAS porque miden cosas distintas**: el IOA evalúa la fiabilidad del *dato* comparando observadores; la fidelidad, si el *procedimiento* se ejecutó como estaba escrito. La regla **no se da por satisfecha con una mención de IOA** y, si el documento sí lo documenta, se lo dice al analista explícitamente. Dos hallazgos `warning`: ausencia de fidelidad, y fidelidad mencionada **sin criterio** de adherencia. Ambos traen `suggestedRewrite` listo para pegar. ⚠️ **Corrección de un defecto preexistente**: `IOA_PROTOCOL_MODIFICATION` aceptaba `treatment integrity` como si acreditara IOA — la misma confusión que la fuente advierte — y dejaba pasar documentos sin IOA; su detector y su descripción se corrigieron, y `\bioa\b` evita que coincida dentro de otra palabra.
- **Cuatro dominios de evaluación — CASP/APBA cap. 5, p. 54** (`scanAssessmentDomains`, tabla `FL_ASSESSMENT_DOMAINS`): **(a)** características nucleares del TEA (comunicación social, conductas restringidas o repetitivas), **(b)** conducta y funcionamiento adaptativo, **(c)** bienestar y calidad de vida, **(d)** condiciones co-ocurrentes y características asociadas (salud mental, discapacidad intelectual, trastornos del lenguaje). Un solo `warning` agregado que nombra los ausentes. **TONO**: la fuente los presenta como el marco de las áreas *más comúnmente evaluadas* y **urge a seleccionar instrumentos alineados con las metas centradas en el cliente** — no exige los cuatro en todo documento. Por eso el hallazgo ofrece la salida honesta: **documentar por qué un dominio no se evaluó también lo resuelve** (`FL_DOMAIN_RATIONALE_RE` lo detecta y suprime la tarjeta). En reassessment añade que el dominio puede haberse cubierto en la evaluación inicial y basta con referirlo. En la práctica (a) y (b) suelen estar — Florida exige el Vineland-3, que acredita (b) — y los que faltan casi siempre son (c) y (d).
- **Metas ≠ criterios diagnósticos — CASP/APBA cap. 5, p. 54** (`scanGoalsNotDsmCriteria`): la fuente *"warns against using diagnostic criteria as checklists for treatment targets"* y promueve alinear las intervenciones con resultados **significativos para el cliente y su sistema de apoyo**. **PRECISIÓN SOBRE COBERTURA — dos condiciones simultáneas:** (1) la frase debe ser **verbatim del DSM-5**, no una descripción clínica común (se excluye a propósito "stereotyped or repetitive motor movements" a secas, porque **la estereotipia SÍ es un objetivo ABA legítimo** cuando está definida operacionalmente; solo entra la cadena completa del criterio); (2) debe aparecer en **contexto de meta**, mirando hacia atrás dentro de la misma oración o línea. Así, **citar el criterio en la sección de diagnóstico no marca** — es correcto y esperable — y solo se dispara cuando el criterio *es* la meta. `warning`, categoría nueva `goal_quality`, una sola tarjeta que cita las frases detectadas y aclara explícitamente que citarlas en el diagnóstico está bien.
- **Assent del cliente — CASP/APBA cap. 2, p. 18** (`scanClientAssent`): *"informed consent, **including assent from the client being assessed**, must be obtained"*. Es del **cliente**, distinto del consentimiento del tutor que ya cubren `SEC_CONSENT` y las firmas de §6.2.2; si el documento recoge consentimiento, el hallazgo **se lo dice explícitamente** para que no lo confunda. `warning`, con `suggestedRewrite` que cubre cómo se buscó, qué señales se tomaron como asentimiento y disentimiento, y qué se hace al retirarse.
- **Vínculo evaluación → meta — CASP/APBA cap. 6, p. 59** (`scanGoalAssessmentLink`): *"directly link the information gathered from the assessment to protocol design and the **rationale for targeting specific behaviors**"*. Solo actúa si hay **metas Y procedimientos de evaluación nombrados**: sin ambas cosas no hay vínculo que exigir. `warning`, categoría `goal_quality`.
- **Limitaciones del instrumento — CASP/APBA cap. 3 p. 40 y cap. 6 p. 61** (`scanAssessmentLimitations`): *"clear documentation of assessment limitations and clinical rationale is essential"*. Gated a documentos que nombren instrumentos estandarizados. **Caso explícito de la fuente**: cuando el financiador **exige** un instrumento que no captura bien las necesidades del cliente, hay que comunicar la limitación y justificar medidas alternativas — en Florida aplica de lleno, porque §4.2.1 impone Vineland-3 y BASC-3 PRQ con independencia de si son los que mejor reflejan a ese cliente. `warning` con rewrite.
- **Barreras ambientales / SDOH — CASP/APBA cap. 3 p. 38 y Apéndice B** (`scanEcobehavioralBarriers`): análisis ecoconductual; los determinantes sociales explican **30–55 %** de los resultados en salud según la OMS. Ejemplo de la propia fuente: un niño con ausentismo escolar crónico no se beneficiará de intervención en centro salvo que se aborden antes las barreras de asistencia. **`notice` de apoyo**: individualiza el plan y anticipa por qué podría no funcionar, pero no es requisito de cobertura.
- **Modificador HN:** 97155 HN / 97156 HN = **BCaBA**; sin HN = BCBA. Misma matemática de unidades; cambia la atribución. Regla de desajuste modificador↔proveedor declarado.
- Planned ignoring: **nunca** para agresión/SIB/elopement/destrucción. Response blocking: 10-15 s. DRL: nunca para conductas peligrosas. RIRD: automático/sensorial. Cuidadores **no** recolectan datos (3 roles: antecedentes/ambiente, apoyo a reemplazos, entrega de reforzamiento). Reemplazo válido solo si es **funcionalmente equivalente** (mismo reforzador).
- **Idiomas:** descripciones y notas al analista en **español**; `suggestedAction`, rewrites y `paste_block` (lo que va al assessment) en **inglés**; citas del documento sin traducir; acrónimos intactos.
- **Alertas de IA:** presentes en leyenda en pantalla y en el reporte ("generada con asistencia de IA… el BCBA verifica y decide"). Mantener siempre.

---

### Tabla de requisitos con fuente (`AUDIT_REQUIREMENTS`)

**Fuente única de verdad** de qué exige cada regla y de dónde sale. Vive como constante en el HTML porque el auditor se abre desde `file://`, donde `fetch()` está bloqueado; `REQUISITOS_AUDITADOS.md` se **genera** de ella con `node gen_requisitos.js` y es solo una copia legible.

Cada fila: `{id, requisito, fuente, edicion, seccion, severidad, verificacion, reglas[], nota?}`.

- **`verificacion` es el campo que importa**: `primaria` (texto original leído, la cita es citable), `busqueda` (solo resúmenes), `convencion` (práctica del consultorio o dominio codificado a mano). Hoy: **19 primarias, 1 solo búsqueda, 3 convención**.
- `citationFor(ruleId)` **devuelve `null` si la fuente no es primaria** — nunca se presenta con apariencia de ley algo que no se leyó.
- `verifiedSourcesForPrompt()` inyecta las fuentes verificadas en el **prompt conceptual**, que ahora ordena citar **desde la lista** y prohíbe inventar sección: *"an incorrect section number in a document that goes to Medicaid is worse than no number at all"*. Sustituye al antiguo "Cite the standard", que hacía al modelo producir secciones desde memoria.
- `buildRequirementsSectionHTML(findings)` añade al reporte una tabla con las fuentes de los requisitos **realmente presentes** en esa auditoría, con su estado de verificación y el aviso de que lo no verificado no debe citarse con número de sección ante un revisor. Colores inline en hex (invariante 5).
- **Hace visible lo frágil**: las reglas de CPT (matemática de unidades y modificador HN) quedan marcadas como convención, porque la coverage policy **no enumera códigos CPT** — los delega al fee schedule (Regla 59G-4.002); y la supervisión del 10 % queda como `busqueda`, pendiente de verificar contra el BACB.

**Al añadir o cambiar una regla: añadir o editar su fila, incrementar `AUDITOR_RULES_VERSION` y regenerar el .md.**

---

### Practice Parameters de IA (CASP/APBA) — gobiernan al auditor, no a los documentos

Tres exigencias implementadas sobre la herramienta misma:

- **Trazabilidad** (`AUDITOR_RULES_VERSION`, `auditTraceLine`, `audit.engine`): *"transparency… provides a pathway for **tracing errors to their source**"*. Cada auditoría se sella con **versión de reglas + modelo + fecha**, y el reporte lo muestra en lugar del antiguo "Versión del motor: 1.0", que era fijo e inútil. **Incrementar `AUDITOR_RULES_VERSION` al cambiar cualquier regla clínica o regulatoria**, o los hallazgos archivados dejan de ser rastreables.
- **Alcance del aviso de IA** (`summarizeAiScope`): *"disclose the **extent** to which AI is being used… offer **non-AI alternatives** as an opt-out"*. El aviso del reporte ya no dice solo "asistida por IA": declara **cuántos hallazgos son deterministas y cuántos vienen de IA**, y nombra la revisión del BCBA como **la vía sin IA** sin la cual no se aplica ningún hallazgo.
- **Canal de reporte de errores** (`reportFindingError`): *"a clear, accessible reporting mechanism enables providers to flag concerns"*. Botón por hallazgo que descarga un JSON estructurado con regla, severidad, si vino de IA, contexto, versión y modelo, más dos campos que el analista rellena. **Distinción clave que el botón explica**: marcar falso positivo solo oculta el hallazgo *en ese documento*; el reporte es lo que permite corregir **la regla**. Usa `alert` y no `showMsg`, porque no hay contenedor de mensajes en esa pestaña y `showMsg` falla en silencio.

---

## 7. Invariantes de diseño (romperlos = regresión)

1. **La crítica anota, nunca descarta.** Ningún hallazgo cambia de status sin decisión del analista.
2. **Contradicciones: alerta, no corrección.**
3. **Camino 3 (reescritura total por IA) NO se construye jamás** — riesgo de deriva de contenido clínico.
4. **`temperature:0`** por defecto en todas las llamadas (reproducibilidad de auditoría).
5. **Colores del reporte SIEMPRE inline hex** — nunca clases/vars CSS en contenido exportable.
6. **Nada falla en silencio:** fallos de IA → banner con causa clasificada (`classifyApiError`); fallos suaves (extracción/enrichment) → aviso naranja, no el banner rojo de "auditoría incompleta"; subida de archivos con 5 guardas y verificación de persistencia.
7. **Categorías de IA se matchean por patrón normalizado** (espacio vs guión bajo), nunca igualdad exacta.
8. **Las decisiones del analista persisten:** auditoría guardada por documento, herencia de decisiones al re-auditar, restauración de sesión al recargar (`aud_last_sel`).
9. Concurrencia de lotes ≤2; reintentos con backoff en toda llamada a la API.
10. El binario original vive en **IndexedDB**, nunca en localStorage.

---

## 8. Método de trabajo y validación (OBLIGATORIO)

- **Validar TODO cambio de JS** extrayendo el script y pasando `node --check`:
  ```bash
  python3 -c "
  import re
  html=open('ABA_Assessment_Auditor_v2.html').read()
  m=re.search(r'<script>(.*)</script>', html, re.S)
  open('app.js','w').write(m.group(1))
  "
  node --check app.js
  ```
  No usar conteo de llaves por regex (falsos negativos). Probar lógica nueva con arneses en Node antes de dar por hecho.
- **Peligro histórico con ediciones tipo str_replace/parche:** varias veces se perdió la **línea de declaración de una función** (`function X(){`) al reemplazar un bloque cuyo old_str la incluía y el new_str no. Tras cada edición, `node --check` inmediato. Rolando prefiere **archivos completos** sobre parches manuales.
- El motor de control de cambios se valida en Node con `jszip` + `@xmldom/xmldom` (en @xmldom usar `onError`, no `errorHandler`). Casos mínimos: run único, swap a mitad de párrafo, "buscar" que cruza dos runs, no encontrado.
- Rolando prueba en vivo y reporta regresiones de inmediato, con ejemplos textuales. Las convenciones clínicas nuevas que él aclare van al bloque "VALID MEASUREMENT CONVENTIONS" del prompt conceptual y a la lista de falsos positivos de la crítica.

---

## 9. Bugs históricos resueltos (no reintroducir)

| Bug | Causa | Fix vigente |
|---|---|---|
| Score 0/100 "humillante" | Penalización lineal | Fórmula saturante §5 |
| Rewrites elegían bando en contradicciones | Comparación `==='internal_contradiction'` vs categoría con espacio | Patrón `/contradic/i` |
| Se borraba el título del documento | `extractSentenceAt` incluía el encabezado sin punto | Regex de recorte de MAYÚSCULAS |
| Términos suprimidos en docs sin encabezados conocidos | "unknown" tratado como no clínico | unknown = clínico |
| Task Refusal % y línea base ×30 marcados como error | Falta de convenciones de dominio | Bloque DO-NOT-FLAG + crítica |
| Auditoría perdida al salir/recargar | No se recargaba desde localStorage | `loadSavedAuditForCurrentDoc` + `aud_last_sel` |
| Falsos "Failed to fetch" masivos | Sin reintentos + burst de lotes en paralelo | Backoff + concurrencia 2 + clasificador de errores |
| Extracción canónica fallaba repetido | Truncamiento a 8k tokens + parse estricto | 12k→20k + `parseCanonicalJSON` con rescate parcial |
| Colores perdidos al exportar | Clases CSS | Inline hex en todo el reporte |
| Auto-descarte de la crítica minó confianza | Crítica cambiaba status | Crítica solo anota |
| "TBD" marcado como blocker en cada aparición | Regex de placeholder sin contexto | `classifyTbdContext`: fechas de servicio exentas; campos de meta de §6.2.2 siguen siendo blocker con cita |

---

## 10. Pendientes / ideas de ruta

- Migrar a backend cuando salga de fase local (patrón preferido de Rolando: Edge Function proxy fina, como en el generador de notas).
- Diff de reassessment vs plan anterior (comparar dos canónicos): promesas cumplidas (say-do), conductas dominadas retiradas.
- Verificador "what-if": evaluar un reemplazo propuesto contra la función antes de redactarlo.
- Highlight amarillo opcional al generar el doc corregido (hoy siempre activo; recordar al usuario limpiarlo: Ctrl+A → resaltado "Sin color" antes de entregar).
- Encabezados de sección propios de sus plantillas para afinar `sectionContextAt` (pedir lista a Rolando).
- Veredicto go/no-go "listo para enviar" ya existe implícito vía score/banda; posible semáforo explícito.
