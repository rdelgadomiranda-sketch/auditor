// Genera REQUISITOS_AUDITADOS.md DESDE la constante del HTML, que es la fuente
// unica de verdad. Reejecutar tras cambiar AUDIT_REQUIREMENTS.
const fs=require('fs');
const html=fs.readFileSync('/home/user/auditor/ABA_Assessment_Auditor_v2.html','utf8');
const m=html.match(/<script>([\s\S]*)<\/script>/);
const src=m[1];
const s=src.indexOf('const AUDIT_REQUIREMENTS=[');
const e=src.indexOf('\n];',s)+3;
const T=new Function(src.slice(s,e)+'\n return AUDIT_REQUIREMENTS;')();

const etiqueta={primaria:'✅ Texto primario leído',busqueda:'⚠️ Solo búsqueda — sin verificar',convencion:'📋 Convención clínica — no normativa'};
const grupos={};
T.forEach(r=>{(grupos[r.verificacion]=grupos[r.verificacion]||[]).push(r)});

let out=`# Requisitos auditados y sus fuentes

> **Archivo generado.** La fuente única de verdad es la constante \`AUDIT_REQUIREMENTS\` de \`ABA_Assessment_Auditor_v2.html\`. El auditor se abre desde \`file://\`, donde \`fetch()\` está bloqueado, así que la tabla no puede vivir en un JSON externo. Para regenerar este archivo: \`node gen_requisitos.js\`.
>
> **Para qué sirve.** Antes, el prompt pedía "cite the standard" y el modelo producía números de sección desde su memoria de entrenamiento, sin que nadie los comprobara. Ahora las fuentes verificadas se inyectan en el prompt desde esta tabla, actualizar una norma es editar una fila, y el reporte muestra junto a cada hallazgo la fuente en que se apoya.
>
> **La columna de verificación es el punto.** Una regla marcada como "solo búsqueda" o "convención clínica" **no debe citarse ante un revisor con número de sección**.

`;
for(const k of ['primaria','busqueda','convencion']){
  if(!grupos[k])continue;
  out+=`\n## ${etiqueta[k]}\n\n`;
  grupos[k].forEach(r=>{
    out+=`### \`${r.id}\`\n\n`;
    out+=`**Fuente:** ${r.fuente}`;
    if(r.edicion&&r.edicion!=='-')out+=` — ${r.edicion}`;
    if(r.seccion&&r.seccion!=='-')out+=`, ${r.seccion}`;
    out+=`  \n**Severidad:** ${r.severidad}  \n**Reglas que lo aplican:** ${(r.reglas||[]).map(x=>x.startsWith('(')?x:'`'+x+'`').join(', ')}\n\n`;
    out+=`${r.requisito}\n\n`;
    if(r.nota)out+=`> ⚠️ ${r.nota}\n\n`;
  });
}
out+=`\n---\n\n**Totales:** ${T.length} requisitos · ${(grupos.primaria||[]).length} verificados contra texto primario · ${(grupos.busqueda||[]).length} solo por búsqueda · ${(grupos.convencion||[]).length} convención clínica.\n`;
fs.writeFileSync('/home/user/auditor/REQUISITOS_AUDITADOS.md',out);
console.log('generado:',T.length,'requisitos');
