# ABA Assessment Auditor v2 — Documento de contexto para Claude Code

> **Propósito de este documento:** contexto completo para continuar el desarrollo del auditor en Claude Code. Colócalo en la raíz del proyecto (puede servir como base del `CLAUDE.md`). Contiene la arquitectura, el pipeline, las reglas clínicas embebidas, los invariantes de diseño que NUNCA deben romperse, los bugs históricos ya resueltos (para no reintroducirlos) y el método de validación obligatorio.

---

## 1. Qué es

`ABA_Assessment_Auditor_v2.html` (~5.365 líneas, archivo único HTML+CSS+JS) es una herramienta de auditoría clínica y regulatoria para assessments y reassessments de ABA bajo Florida Medicaid. La usa Rolando (BCBA consultor, Miami) para auditar documentos de analistas antes de su envío. El entregable de cada auditoría es un paquete: reporte completo + resumen ejecutivo (1-2 pág.) + hoja de correcciones + documento Word corregido con control de cambios.

**Estándares que audita:** BACB Ethics Code 2020, CASP ABA Practice Guidelines 3ª ed. (2024), CASP/APBA ASD Assessment Guidelines (marzo 2026), Florida Medicaid Behavior Analysis Services Coverage Policy §59G-4.125 (dic. 2024).

**Estado actual:** fase de prueba, 100% local (se abre el HTML en el navegador). Sin backend. Sin build system. Sin frameworks — vanilla JS.

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

## 6. Reglas clínicas embebidas (dominio — NO alterar sin consultar a Rolando)

- **Terminología prohibida sensible al contexto** (`scanProhibitedTerms` + `sectionContextAt`): palabras de estado emocional (calm, anxious, frustrated…) son error **solo en secciones clínicas** (definiciones, plan, hipótesis, metas, recomendaciones). En secciones **claramente no clínicas** (antecedentes, historia, narrativa familiar — parsimonia para padres) → una sola observación suave agregada. **Contexto desconocido = clínico (se marca)** — regresión histórica: tratar "unknown" como no clínico suprimía errores reales. Conceptos no-ABA (mindfulness, problem solving, social stories, anger management, etc.) son error en cualquier parte, agregados por concepto con conteo.
- **Contradicciones internas: SOLO ALERTA.** Nunca generar rewrite ni auto-aprobar (el sistema no elige bando; el analista decide). Enforcement por `/contradic/i` en enrichment y en `approveAllFixable`.
- **Convenciones de medición VÁLIDAS (no marcar):** (a) sistemas mixtos entre conductas — Task Refusal en **porcentaje** (sobre demandas presentadas) y el resto por **ocurrencias** es correcto; (b) **línea base por sondas de 1 hora** en 2-3 días (ej. 13, 15, 12) con incidencia semanal = promedio × 30 horas semanales — verificar la aritmética con esa convención antes de marcar.
- **"TBD"/"TBA": convención válida SOLO en fechas de servicio** (`classifyTbdContext` + `scanPlaceholders`). Exento (no genera hallazgo, se agrupa en un `notice` único `PLACEHOLDER_TBD_CONVENTION`): inicio de servicios, período de autorización, próxima revisión/reassessment, alta, firma, "upon authorization", "ongoing" — dependen del QIO. **Se marca como `blocker` (`FL_GOAL_ELEMENT_TBD`, categoría `florida_medicaid`)** cuando sustituye un elemento que **FL Medicaid §6.2.2** exige por cada meta u objetivo: línea base / nivel actual, fecha de introducción, fecha estimada de dominio, criterio de dominio, procedimientos de medición, plan de generalización, condiciones. La norma pide un valor *estimado*, así que la incertidumbre no lo justifica — **tampoco en conductas o reemplazos nuevos de un reassessment**. `TBD_NEVER_VALID` (identidad del cliente, función, definición operacional) sigue siendo `blocker` genérico. Las ventanas de contexto se cortan en el salto de línea/oración anterior y en el límite de párrafo a ambos lados. Replicado en el prompt conceptual (convenciones (c) y (c2)) y en la lista de falsos positivos de la crítica.
- **Modificador HN:** 97155 HN / 97156 HN = **BCaBA**; sin HN = BCBA. Misma matemática de unidades; cambia la atribución. Regla de desajuste modificador↔proveedor declarado.
- Planned ignoring: **nunca** para agresión/SIB/elopement/destrucción. Response blocking: 10-15 s. DRL: nunca para conductas peligrosas. RIRD: automático/sensorial. Cuidadores **no** recolectan datos (3 roles: antecedentes/ambiente, apoyo a reemplazos, entrega de reforzamiento). Reemplazo válido solo si es **funcionalmente equivalente** (mismo reforzador).
- **Idiomas:** descripciones y notas al analista en **español**; `suggestedAction`, rewrites y `paste_block` (lo que va al assessment) en **inglés**; citas del documento sin traducir; acrónimos intactos.
- **Alertas de IA:** presentes en leyenda en pantalla y en el reporte ("generada con asistencia de IA… el BCBA verifica y decide"). Mantener siempre.

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
