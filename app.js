/* ============================================================
   SUDMAR ENERGY · Reporte de Pruebas con Carga
   Wizard + generación de PDF (layout idéntico, 2 páginas)
   ============================================================ */

// ---------- DEFINICIÓN DE DATOS ----------
const STEPS = ["Datos","Carga","Carga continua","Alarmas","Firmas"];

const CARGA_ROWS = [
  {k:"c0", c:"SIN CARGA (0%)", t:""},
  {k:"c25", c:"25% DE CARGA", t:""},
  {k:"c50", c:"50% DE CARGA", t:""},
  {k:"c75", c:"75% DE CARGA", t:""},
  {k:"c90", c:"90% DE CARGA", t:""},
  {k:"c100", c:"100% DE CARGA NOMINAL", t:""},
  {k:"ret75", c:"RETORNO 75% CARGA", t:""},
  {k:"ret50", c:"RETORNO 50% CARGA", t:""},
  {k:"ret25", c:"RETORNO 25% CARGA", t:""},
  {k:"final0", c:"SIN CARGA FINAL (0%)", t:""},
];

const PARAMS = [
  {k:"rpm", n:"Velocidad rotación (RPM)"},
  {k:"hz", n:"Frecuencia generada (Hz)"},
  {k:"batt", n:"Voltaje baterías (V DC)"},
  {k:"oilpress", n:"Presión aceite motor (bar)"},
  {k:"coolanttemp", n:"Temp. agua/refrigerante (°C)"},
  {k:"oiltemp", n:"Temp. aceite motor (°C)"},
  {k:"chargev", n:"Voltaje carga alternador (V DC)"},
];

const CHECKS = [
  {k:"fuel", n:"Nivel de combustible (%)", type:"number", placeholder:"0–100"},
  {k:"coolant", n:"Nivel de refrigerante", type:"status"},
  {k:"oil", n:"Nivel de aceite motor", type:"status"},
];

const ALARMAS = [
  "Sobrevelocidad",
  "Baja presión de aceite",
  "Alta temperatura agua/aceite",
  "Bajo nivel refrigerante",
  "Bajo nivel combustible",
  "Sobrecarga del generador / protección de sobrecarga",
  "Paro de emergencia (E-Stop)",
  "Falla de arranque",
  "Arranque/paro automático (AMF) [si aplica]",
  "Transferencia automática red/GE [si aplica]",
];

const FIRMAS = [
  {k:"comisionador", t:"Técnico Sudmar / Endress"},
  {k:"cliente", t:"Representante del Cliente"},
  {k:"endress", t:"Representante de Marca Endress", optional:true},
];

// ---------- ESTADO ----------
let current = 0;
const state = { dict:{final:""} };
const sigPads = {};

// ---------- CONSTRUCCIÓN DINÁMICA ----------
function buildProgress(){
  const p = document.getElementById('progress');
  p.innerHTML = STEPS.map((s,i)=>`<div class="pstep ${i===0?'active':''}" data-p="${i}">${i+1}. ${s}</div>`).join('');
}

function buildCarga(){
  const tb = document.getElementById('carga-body');
  tb.innerHTML = CARGA_ROWS.map(r=>`
    <tr>
      <td class="cond">${r.c}</td>
      <td><input data-carga="${r.k}-t" value="${r.t}" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-v" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-l1" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-l2" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-l3" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-kw" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-hz" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-rpm" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-bar" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-temp" inputmode="decimal"></td>
      <td><input data-carga="${r.k}-obs"></td>
    </tr>`).join('');
}

function buildParams(){
  const pb = document.getElementById('param-body');
  pb.innerHTML = PARAMS.map(p=>`
    <div class="param-row">
      <span class="pname">${p.n}</span>
      <input data-param="${p.k}-1" type="number" step="any" inputmode="decimal" placeholder="Inicial">
      <input data-param="${p.k}-3" type="number" step="any" inputmode="decimal" placeholder="≥30 min">
      <span class="param-delta" data-paramdelta="${p.k}">—</span>
    </div>`).join('');
  updateParamDeltas();
}

function updateParamDeltas(){
  PARAMS.forEach(p=>{
    const a=parseFloat(paramV(`${p.k}-1`));
    const b=parseFloat(paramV(`${p.k}-3`));
    const out=document.querySelector(`[data-paramdelta="${p.k}"]`);
    if(!out) return;
    if(Number.isFinite(a)&&Number.isFinite(b)){
      const d=b-a;
      const decimals=Math.abs(d)<10 ? 2 : 1;
      out.textContent=(d>0?'+':'')+d.toFixed(decimals);
    }else out.textContent='—';
  });
}

function buildChecks(){
  const cb = document.getElementById('check-body');
  cb.innerHTML = '<div class="check-head"><span>Verificación</span><span>Valor / Estado</span><span>Observaciones</span></div>' +
    CHECKS.map(c=>{
      const control = c.type==='status'
        ? `<select data-check="${c.k}-v"><option value="">Seleccionar</option><option value="OK">OK</option><option value="BAJO">Bajo</option><option value="NO VERIFICADO">No verificado</option><option value="N/A">N/A</option></select>`
        : `<input data-check="${c.k}-v" inputmode="decimal" placeholder="${c.placeholder||''}">`;
      return `<div class="check-row"><strong>${c.n}</strong>${control}<input data-check="${c.k}-obs" placeholder="Observaciones"></div>`;
    }).join('');
}

function buildAlarmas(){
  const ab = document.getElementById('alarma-body');
  ab.innerHTML = ALARMAS.map((a,i)=>`
    <div class="alarma">
      <span class="aname">${a}</span>
      <div>
        <div class="seg-lbl">Resultado</div>
        <div class="seg" data-seg="${i}-res">
          <button data-v="OK">OK</button><button data-v="FALLA">FALLA</button><button data-v="N/A">N/A</button>
        </div>
      </div>
    </div>`).join('');
}

function buildFirmas(){
  const f = document.getElementById('firmas');
  f.innerHTML = FIRMAS.map(fa=>`
    <div class="firma-box" data-firma-box="${fa.k}"${fa.optional?' style="display:none"':''}>
      <div class="ftit">${fa.t}</div>
      <input placeholder="Nombre" data-firma="${fa.k}-nombre" style="margin-bottom:6px">
      <canvas class="sig" data-sig="${fa.k}"></canvas>
      <div class="fbtns"><button onclick="clearSig('${fa.k}')">Borrar firma</button></div>
    </div>`).join('');
  FIRMAS.forEach(fa=>initSig(fa.k));
  updateFirmaVisibility();
}

// ---------- FIRMAS (canvas) ----------
function initSig(key){
  const canvas = document.querySelector(`canvas[data-sig="${key}"]`);
  const ctx = canvas.getContext('2d');
  let drawing=false, empty=true, sized=false, lastX=0, lastY=0;

  // Dimensiona el canvas SOLO cuando ya es visible (ancho > 0).
  // Preserva el trazo existente al redimensionar.
  function ensureSize(){
    const rect = canvas.getBoundingClientRect();
    if(rect.width===0) return false;            // aún oculto
    const ratio = window.devicePixelRatio||1;
    const targetW = Math.round(rect.width*ratio);
    const targetH = Math.round(130*ratio);
    if(canvas.width===targetW && canvas.height===targetH) return true; // ya dimensionado
    let prev=null;
    if(sized){ try{ prev = canvas.toDataURL('image/png'); }catch(e){} }
    canvas.width = targetW; canvas.height = targetH;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(ratio,ratio);
    ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#1a3b6e';
    if(prev){ const img=new Image(); img.onload=()=>ctx.drawImage(img,0,0,rect.width,130); img.src=prev; }
    sized=true;
    return true;
  }

  const pos = e=>{
    const r=canvas.getBoundingClientRect();
    const t=(e.touches&&e.touches[0])||(e.changedTouches&&e.changedTouches[0])||e;
    return {x:t.clientX-r.left, y:t.clientY-r.top};
  };
  const start=e=>{
    if(!ensureSize()) return;
    drawing=true; empty=false;
    const p=pos(e); lastX=p.x; lastY=p.y;
    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+0.1,p.y+0.1); ctx.stroke();
    e.preventDefault();
  };
  const move=e=>{
    if(!drawing) return;
    const p=pos(e);
    ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
    lastX=p.x; lastY=p.y;
    e.preventDefault();
  };
  const end=e=>{ if(drawing){drawing=false; if(e)e.preventDefault();} };

  canvas.addEventListener('mousedown',start);
  canvas.addEventListener('mousemove',move);
  canvas.addEventListener('mouseup',end);
  canvas.addEventListener('mouseleave',end);
  canvas.addEventListener('touchstart',start,{passive:false});
  canvas.addEventListener('touchmove',move,{passive:false});
  canvas.addEventListener('touchend',end,{passive:false});
  canvas.addEventListener('touchcancel',end,{passive:false});

  sigPads[key]={
    canvas,
    isEmpty:()=>empty,
    ensureSize,
    markFilled:()=>{empty=false;},
    clear:()=>{ctx.clearRect(0,0,canvas.width,canvas.height);empty=true;}
  };
}
function clearSig(key){ if(sigPads[key]) sigPads[key].clear(); }

function updateFirmaVisibility(){
  const incluir = (document.getElementById('firmaEndress')?.value||'no') === 'si';
  const box = document.querySelector('[data-firma-box="endress"]');
  const cont = document.getElementById('firmas');
  if(box) box.style.display = incluir ? 'block' : 'none';
  if(cont) cont.classList.toggle('three', incluir);
  if(incluir) setTimeout(()=>sigPads.endress?.ensureSize?.(), 60);
}

function segClass(v){
  if(v==='Sí') return 'on-si';
  if(v==='No') return 'on-no';
  if(v==='OK') return 'on-ok';
  if(v==='FALLA') return 'on-falla';
  if(v==='N/A') return 'on-na';
  return '';
}

const HELP = {
  general:{
    title:'Ayuda · Reporte de pruebas con carga',
    body:`
      <div class="help-item"><b>Objetivo del reporte.</b> Documentar condiciones de prueba, valores eléctricos y mecánicos, protecciones y firmas de conformidad.</div>
      <div class="help-item"><b>Regla principal.</b> Los límites del fabricante, la ficha técnica, el plan de pruebas y el criterio contractual prevalecen sobre valores genéricos del formato.</div>
      <div class="help-item"><b>Datos reales.</b> Registra los tiempos y valores realmente observados; el formato no impone una duración universal para cada escalón.</div>
      <div class="help-item"><b>Siglas frecuentes.</b> PRP/LTP/ESP/COP describen ratings de potencia; FP o cosφ es factor de potencia; L-L significa tensión línea a línea; AMF es arranque por falla de red y ATS es transferencia automática.</div>
    `
  },
  datos:{
    title:'Ayuda · Datos generales',
    body:`
      <div class="help-item"><b>Potencia nominal.</b> Captura la potencia indicada en placa o ficha técnica, expresada en kVA/kW, y revisa qué clasificación declara el fabricante.</div>
      <div class="help-item"><b>PRP · Prime Power.</b> Potencia para carga variable durante un número ilimitado de horas, bajo las condiciones y límites de carga promedio definidos por norma/fabricante.</div>
      <div class="help-item"><b>LTP · Limited-Time Power.</b> Potencia de funcionamiento limitado; normalmente se especifica para hasta 500 h/año bajo las condiciones declaradas.</div>
      <div class="help-item"><b>ESP · Emergency Standby Power.</b> Potencia de emergencia para falla de red o pruebas; normalmente se especifica para hasta 200 h/año bajo las condiciones declaradas.</div>
      <div class="help-item"><b>COP · Continuous Power.</b> Potencia continua para carga esencialmente constante durante horas ilimitadas.</div>
      <div class="help-item"><b>kVA / kW / FP.</b> kVA es potencia aparente; kW es potencia activa; FP o cosφ relaciona ambas. Un banco resistivo trabaja aproximadamente con FP=1.</div>
      <div class="help-item"><b>Corriente nominal.</b> Captura la corriente indicada en placa o ficha técnica. No la confundas con la corriente observada durante un escalón de kW en un banco resistivo.</div>
      <div class="help-item"><b>Controlador / Panel.</b> Módulo electrónico que gestiona arranque, paro, alarmas, protecciones y mediciones.</div>
      <div class="help-item"><b>Interruptor principal.</b> Protección de salida del generador (MCCB/ACB u otro interruptor principal).</div>
      <div class="help-item"><b>OdL.</b> Orden de trabajo u orden de servicio asociada a la intervención.</div>
    `
  },
  carga:{
    title:'Ayuda · Pruebas con carga',
    body:`
      <div class="help-item"><b>Tiempo de paso.</b> Tiempo real que se mantiene cada escalón de carga antes de registrar o cambiar la condición. El valor se puede editar.</div>
      <div class="help-item"><b>Voltaje L-L.</b> Tensión medida entre fases. Si existe desbalance relevante, anótalo en observaciones.</div>
      <div class="help-item"><b>Corriente L1/L2/L3.</b> Corriente por fase. Ayuda a detectar desbalance de carga.</div>
      <div class="help-item"><b>Potencia kW.</b> Potencia activa entregada durante el escalón de prueba.</div>
      <div class="help-item"><b>Frecuencia / RPM.</b> Permiten observar la respuesta del gobernador y la estabilidad del conjunto motor-generador.</div>
      <div class="help-item"><b>Presión de aceite / temperatura.</b> Deben compararse contra los límites específicos del motor, no únicamente contra referencias genéricas.</div>
    `
  },
  motor:{
    title:'Ayuda · Motor con carga continua',
    body:`
      <div class="help-item"><b>Objetivo.</b> Comparar el comportamiento del motor al iniciar una carga sostenida y después de 30 minutos o más, en lugar de repetir lecturas sin contexto.</div>
      <div class="help-item"><b>Carga continua aplicada.</b> Registra el porcentaje real de carga que se mantuvo durante el periodo de observación.</div>
      <div class="help-item"><b>Corriente y potencia.</b> Registra el amperaje y los kW reales sostenidos durante la prueba para relacionar cualquier cambio del motor con el esfuerzo aplicado.</div>
      <div class="help-item"><b>Tiempo bajo carga.</b> Captura los minutos reales transcurridos. Para esta comparación se busca una permanencia de 30 min o más.</div>
      <div class="help-item"><b>Inicio / después de ≥30 min.</b> Registra las lecturas reales del mismo parámetro en ambos momentos para poder observar tendencia.</div>
      <div class="help-item"><b>Δ Cambio.</b> Se calcula automáticamente como lectura final menos lectura inicial. Es una comparación, no un criterio automático de aprobación.</div>
      <div class="help-item"><b>Evaluación.</b> Interpreta los cambios con la carga aplicada, las condiciones ambientales y los límites específicos del fabricante del motor.</div>
      <div class="help-item"><b>Verificación final.</b> Después del periodo sostenido revisa combustible, refrigerante y aceite y documenta cualquier anomalía visible.</div>
    `
  },
  alarmas:{
    title:'Ayuda · Alarmas y protecciones',
    body:`
      <div class="help-item"><b>Captura rápida.</b> Solo se registra un resultado por alarma o protección para evitar llenar campos repetitivos en campo.</div>
      <div class="help-item"><b>OK.</b> La función o protección fue verificada y respondió correctamente.</div>
      <div class="help-item"><b>FALLA.</b> La función se verificó y no respondió como corresponde, o se detectó una condición incorrecta.</div>
      <div class="help-item"><b>N/A.</b> No aplica a la configuración del equipo o no forma parte del alcance de esta prueba.</div>
      <div class="help-item"><b>AMF.</b> Automatic Mains Failure: lógica de arranque automático ante pérdida o falla de red.</div>
      <div class="help-item"><b>ATS / Transferencia.</b> Automatic Transfer Switch: tablero o sistema que transfiere la carga entre red y generador cuando aplica.</div>
    `
  },
  firmas:{
    title:'Ayuda · Resultado y firmas',
    body:`
      <div class="help-item"><b>Aprobado.</b> El resultado se mostrará en verde.</div>
      <div class="help-item"><b>Requiere correcciones / Rechazado.</b> El resultado se mostrará en rojo.</div>
      <div class="help-item"><b>Firmas base.</b> El formato solicita técnico Sudmar y representante del cliente.</div>
      <div class="help-item"><b>Representante Endress.</b> La tercera firma se activa únicamente cuando un representante de marca participa en la prueba.</div>
    `
  }
};

function setupHelp(){
  if(document.getElementById('helpModal')) return;
  const modal = document.createElement('div');
  modal.id='helpModal';
  modal.className='help-modal';
  modal.innerHTML=`
    <div class="help-card" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
      <div class="help-head">
        <h3 id="helpTitle">Ayuda</h3>
        <button class="help-close" onclick="closeHelp()" aria-label="Cerrar">×</button>
      </div>
      <div class="help-body" id="helpBody"></div>
    </div>`;
  modal.addEventListener('click',e=>{ if(e.target===modal) closeHelp(); });
  document.body.appendChild(modal);

  const topicByStep = {0:'datos',1:'carga',2:'motor',3:'alarmas',4:'firmas'};
  document.querySelectorAll('.step').forEach(step=>{
    const h=step.querySelector('h2.sec');
    if(!h) return;
    const b=document.createElement('button');
    b.type='button';
    b.className='help-inline';
    b.textContent='? Ayuda de esta sección';
    b.onclick=()=>openHelp(topicByStep[+step.dataset.step]||'general');
    h.insertAdjacentElement('afterend',b);
  });
}

function openHelp(topic='general'){
  const data=HELP[topic]||HELP.general;
  const modal=document.getElementById('helpModal');
  if(!modal){ setupHelp(); return openHelp(topic); }
  document.getElementById('helpTitle').textContent=data.title;
  document.getElementById('helpBody').innerHTML=data.body;
  modal.classList.add('open');
}
function closeHelp(){ document.getElementById('helpModal')?.classList.remove('open'); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeHelp(); });

// ---------- SEGMENTOS Y DICTÁMENES ----------
document.addEventListener('click',e=>{
  const seg = e.target.closest('.seg button');
  if(seg){
    const parent = seg.parentElement;
    parent.querySelectorAll('button').forEach(b=>b.className='');
    const v = seg.dataset.v;
    seg.className = segClass(v);
    parent.dataset.val = v;
  }
  const dict = e.target.closest('.dictamen button');
  if(dict){
    const parent = dict.closest('.dictamen');
    parent.querySelectorAll('button').forEach(b=>b.className='');
    const v = dict.dataset.v;
    dict.className = (v==='APROBADO')?'ok':'no';
    state.dict[parent.dataset.dict] = v;
  }
});

// ---------- NAVEGACIÓN ----------
function showStep(n){
  document.querySelectorAll('.step').forEach(s=>s.classList.toggle('active', +s.dataset.step===n));
  document.querySelectorAll('.pstep').forEach((p,i)=>{
    p.classList.toggle('active', i===n);
    p.classList.toggle('done', i<n);
  });
  document.getElementById('btnPrev').style.visibility = n===0?'hidden':'visible';
  const next = document.getElementById('btnNext');
  if(n===STEPS.length-1){ next.textContent='Generar PDF'; next.className='btn-next btn-pdf'; }
  else { next.textContent='Siguiente'; next.className='btn-next'; }
  window.scrollTo({top:0,behavior:'smooth'});
  current=n;
  // Al entrar al paso de firmas, dimensiona los canvas (ya visibles)
  if(n===STEPS.length-1){
    setTimeout(()=>{
      Object.values(sigPads).forEach(p=>p.ensureSize&&p.ensureSize());
      pintarFirmasGuardadas();
    }, 120);
  }
}
function next(){ if(current<STEPS.length-1) showStep(current+1); else generarPDF(); }
function prev(){ if(current>0) showStep(current-1); }

// ---------- HELPERS ----------
const val = sel => (document.querySelector(sel)?.value||"").trim();
const g = id => val('#'+id);
const cargaV = k => val(`[data-carga="${k}"]`);
const paramV = k => val(`[data-param="${k}"]`);
const checkV = k => val(`[data-check="${k}"]`);
const segV = k => document.querySelector(`[data-seg="${k}"]`)?.dataset.val||"";
const firmaN = k => val(`[data-firma="${k}-nombre"]`);

// ============================================================
//   GENERACIÓN DEL PDF · Layout adaptable (2 páginas; 3 si falta espacio)
// ============================================================
function generarPDF(){
 try{
  if(!g('firmaEndress')){
    alert('Antes de generar el PDF indica si participa un representante de marca Endress.');
    showStep(STEPS.length-1);
    setTimeout(()=>document.getElementById('firmaEndress')?.focus(),150);
    return;
  }
  if(!window.jspdf || !window.jspdf.jsPDF){
    alert('La librería del PDF no cargó. Verifica tu conexión a internet e intenta de nuevo. Tus datos siguen guardados.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'landscape', unit:'mm', format:'a4'});
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const AZUL=[26,59,110], AZUL2=[36,72,122], ROJO=[192,57,43], VERDE=[46,125,50], NEUTRO=[96,125,139], GRIS=[240,243,247];

  function encabezado(){
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,20,'F');
    doc.setDrawColor(...AZUL); doc.setLineWidth(0.6); doc.rect(4,3,W-8,16);
    try{ if(typeof LOGO_SUDMAR!=='undefined' && LOGO_SUDMAR) doc.addImage(LOGO_SUDMAR,'PNG',7,5.5,40,11); }catch(e){}
    try{
      if(typeof LOGO_PRETTL!=='undefined' && LOGO_PRETTL) doc.addImage(LOGO_PRETTL,'PNG',W/2-15.5,6,31,9);
      else { doc.setFontSize(13);doc.setTextColor(60,60,60);doc.setFont('helvetica','bold');doc.text('PRETTL',W/2-12,12); }
    }catch(e){}
    try{ if(typeof LOGO_ENDRESS!=='undefined' && LOGO_ENDRESS) doc.addImage(LOGO_ENDRESS,'PNG',W-56,6.5,48,7); }catch(e){}
  }

  function bandaTitulo(y,txt,color,x=4,w=W-8,fs=11){
    doc.setFillColor(...(color||AZUL)); doc.rect(x,y,w,7,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(fs);
    doc.text(txt, x+w/2, y+5, {align:'center'});
  }

  // ===================== PÁGINA 1 =====================
  encabezado();
  bandaTitulo(22,'REPORTE DE PRUEBAS DE FUNCIONAMIENTO – GRUPO ELECTRÓGENO');

  bandaTitulo(30,'DATOS GENERALES DEL EQUIPO',AZUL2);
  const gd = [
    ['Cliente / Sitio:', g('cliente'), 'Frecuencia Nominal (Hz):', g('frecuencia')],
    ['No. de Reporte:', g('reporte'), 'Corriente Nominal (A):', g('corriente')],
    ['Fecha de Prueba:', g('fecha'), 'Motor (Marca / Modelo):', g('motor')],
    ['Técnico Responsable:', g('tecnico'), 'Alternador:', g('alternador')],
    ['No. de Serie Generador:', g('serie'), 'Controlador / Panel:', g('controlador')],
    ['Modelo / Tipo:', g('modelo'), 'Interruptor Principal:', g('interruptor')],
    ['Potencia Nominal (kVA/kW):', g('potencia'), 'Orden de Trabajo / OdL:', g('odl')],
    ['Voltaje Nominal (V):', g('voltaje'), 'Observaciones:', g('observaciones')],
  ];
  doc.autoTable({
    startY:38, margin:{left:4,right:4}, body:gd, theme:'grid',
    styles:{fontSize:7.5,cellPadding:1.5,lineColor:[217,222,230],lineWidth:0.1,textColor:[31,41,51]},
    columnStyles:{0:{cellWidth:45,fillColor:GRIS,fontStyle:'bold'},1:{cellWidth:98},2:{cellWidth:52,fillColor:GRIS,fontStyle:'bold'},3:{cellWidth:'auto'}}
  });

  let y = doc.lastAutoTable.finalY + 3;
  doc.setFillColor(...AZUL2); doc.rect(4,y,W-8,6,'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.3);
  doc.text('PRUEBAS CON CARGA – BANCO RESISTIVO (FP≈1)  |  Registrar valores y tiempos reales · Límites según fabricante / criterio aprobado', W/2, y+4, {align:'center'});

  const cargaHead = [['CONDICIÓN DE PRUEBA','TIEMPO\nREAL (s)','VOLTAJE\nL-L (V)','CORR.\nL1 (A)','CORR.\nL2 (A)','CORR.\nL3 (A)','POTENCIA\n(kW)','FREC.\n(Hz)','RPM','PRESIÓN\nACEITE (bar)','TEMP.\nAGUA (°C)','OBSERVACIONES']];
  const cargaBody = CARGA_ROWS.map(r=>[
    r.c, cargaV(`${r.k}-t`), cargaV(`${r.k}-v`), cargaV(`${r.k}-l1`), cargaV(`${r.k}-l2`), cargaV(`${r.k}-l3`),
    cargaV(`${r.k}-kw`), cargaV(`${r.k}-hz`), cargaV(`${r.k}-rpm`), cargaV(`${r.k}-bar`), cargaV(`${r.k}-temp`), cargaV(`${r.k}-obs`)
  ]);
  doc.autoTable({
    startY:y+7, margin:{left:4,right:4}, head:cargaHead, body:cargaBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6,fontStyle:'bold',halign:'center',valign:'middle'},
    styles:{fontSize:7,cellPadding:1.45,lineColor:[217,222,230],lineWidth:0.1,halign:'center'},
    columnStyles:{0:{halign:'left',fontStyle:'bold',fillColor:GRIS,cellWidth:42},11:{cellWidth:'auto'}}
  });

  // ===================== PÁGINA 2 =====================
  doc.addPage(); encabezado();
  const colL=4, colLW=W-8;

  bandaTitulo(22,'PARÁMETROS DE MOTOR CON CARGA CONTINUA',AZUL2,colL,colLW,9);
  const cargaContPct=g('cargaContinuaPct')||'—';
  const cargaContA=g('cargaContinuaA')||'—';
  const cargaContKw=g('cargaContinuaKw')||'—';
  const cargaContMin=g('cargaContinuaMin')||'—';
  doc.autoTable({
    startY:30, margin:{left:colL,right:4}, tableWidth:colLW,
    body:[
      ['Carga continua aplicada:',cargaContPct+' %','Corriente sostenida:',cargaContA+' A'],
      ['Potencia sostenida:',cargaContKw+' kW','Tiempo bajo carga:',cargaContMin+' min']
    ],
    theme:'grid',
    styles:{fontSize:7,cellPadding:1.2,lineColor:[217,222,230],lineWidth:0.1},
    columnStyles:{0:{fontStyle:'bold',fillColor:GRIS,cellWidth:52},1:{halign:'center',cellWidth:40},2:{fontStyle:'bold',fillColor:GRIS,cellWidth:52},3:{halign:'center'}}
  });

  const deltaTxt=p=>{
    const ini=parseFloat(paramV(`${p.k}-1`));
    const fin=parseFloat(paramV(`${p.k}-3`));
    if(!Number.isFinite(ini)||!Number.isFinite(fin)) return '—';
    const d=fin-ini;
    return (d>0?'+':'')+d.toFixed(Math.abs(d)<10?2:1);
  };
  const paramHead=[['PARÁMETRO','INICIO CARGA CONTINUA','DESPUÉS DE ≥30 MIN','Δ CAMBIO']];
  const paramBody=PARAMS.map(p=>[p.n,paramV(`${p.k}-1`),paramV(`${p.k}-3`),deltaTxt(p)]);
  doc.autoTable({
    startY:doc.lastAutoTable.finalY+2, margin:{left:colL,right:4}, tableWidth:colLW, head:paramHead, body:paramBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6.6,halign:'center'},
    styles:{fontSize:6.8,cellPadding:1.1,lineColor:[217,222,230],lineWidth:0.1,halign:'center'},
    columnStyles:{0:{halign:'left',fontStyle:'bold',cellWidth:95},3:{fillColor:GRIS,fontStyle:'bold'}}
  });
  let leftY=doc.lastAutoTable.finalY+3;

  bandaTitulo(leftY,'VERIFICACIÓN AL FINALIZAR CARGA CONTINUA',AZUL2,colL,colLW,8);
  const checkBody=CHECKS.map(c=>[c.n,checkV(`${c.k}-v`),checkV(`${c.k}-obs`)]);
  doc.autoTable({
    startY:leftY+8, margin:{left:colL,right:4}, tableWidth:colLW,
    head:[['VERIFICACIÓN','VALOR / ESTADO','OBSERVACIONES']], body:checkBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6.4,halign:'center'},
    styles:{fontSize:6.8,cellPadding:1.1,lineColor:[217,222,230],lineWidth:0.1},
    columnStyles:{0:{fontStyle:'bold',cellWidth:80},1:{halign:'center',cellWidth:55}}
  });
  leftY=doc.lastAutoTable.finalY+3;

  bandaTitulo(leftY,'VERIFICACIÓN DE ALARMAS Y PROTECCIONES',AZUL2,colL,colLW,8);
  const alBody=ALARMAS.map((a,i)=>[a,segV(`${i}-res`)]);
  doc.autoTable({
    startY:leftY+8, margin:{left:colL,right:4}, tableWidth:colLW,
    head:[['ALARMA / PROTECCIÓN','RESULTADO']], body:alBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6.4,halign:'center'},
    styles:{fontSize:6.8,cellPadding:1.1,lineColor:[217,222,230],lineWidth:0.1,halign:'center'},
    columnStyles:{0:{halign:'left',fontStyle:'bold'},1:{cellWidth:55}},
    didParseCell:d=>{
      if(d.section==='body'&&d.column.index===1){
        if(d.cell.raw==='OK'){d.cell.styles.textColor=VERDE;d.cell.styles.fontStyle='bold';}
        if(d.cell.raw==='FALLA'){d.cell.styles.textColor=ROJO;d.cell.styles.fontStyle='bold';}
        if(d.cell.raw==='N/A'){d.cell.styles.textColor=NEUTRO;d.cell.styles.fontStyle='bold';}
      }
    }
  });
  const alarmEnd=doc.lastAutoTable.finalY;

  let yF=alarmEnd+4;
  const firmasActivas=FIRMAS.filter(f=>!f.optional || g('firmaEndress')==='si');
  const resultColor=state.dict.final==='APROBADO'?VERDE:state.dict.final==='CORRECCIONES'?ROJO:NEUTRO;
  const finalTxt=state.dict.final==='APROBADO'
    ? 'RESULTADO FINAL:     [ X ] EQUIPO APROBADO PARA OPERACIÓN        [   ] EQUIPO REQUIERE CORRECCIONES'
    : state.dict.final==='CORRECCIONES'
    ? 'RESULTADO FINAL:     [   ] EQUIPO APROBADO PARA OPERACIÓN        [ X ] EQUIPO REQUIERE CORRECCIONES'
    : 'RESULTADO FINAL:     [   ] EQUIPO APROBADO PARA OPERACIÓN        [   ] EQUIPO REQUIERE CORRECCIONES';

  // Si la segunda hoja ya no tiene espacio suficiente, resultado y firmas pasan limpios a una tercera.
  const requiredH=53;
  if(yF+requiredH>H-4){ doc.addPage();encabezado();yF=22; }

  doc.setFillColor(...resultColor); doc.rect(4,yF,W-8,7,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text(finalTxt,W/2,yF+4.6,{align:'center'});

  let yS=yF+10;
  bandaTitulo(yS,'FIRMAS DE CONFORMIDAD',AZUL2,4,W-8,8);
  const colW=(W-8)/firmasActivas.length;
  const yh=yS+7;
  firmasActivas.forEach((f,i)=>{
    const x=4+i*colW;
    doc.setFillColor(...GRIS);doc.rect(x,yh,colW,6,'F');
    doc.setDrawColor(217,222,230);doc.rect(x,yh,colW,6);
    doc.setTextColor(...AZUL);doc.setFont('helvetica','bold');doc.setFontSize(6.5);
    doc.text(f.t.toUpperCase(),x+colW/2,yh+4,{align:'center'});
  });

  const boxY=yh+6, boxH=32;
  firmasActivas.forEach((f,i)=>{
    const x=4+i*colW;
    doc.setDrawColor(217,222,230);doc.rect(x,boxY,colW,boxH);
    let sigData=null;
    const pad=sigPads[f.k];
    if(pad && !pad.isEmpty()){ try{sigData=pad.canvas.toDataURL('image/png');}catch(e){} }
    if(!sigData && window._firmasGuardadas?.[f.k]) sigData=window._firmasGuardadas[f.k];
    if(!sigData){
      try{const ls=JSON.parse(localStorage.getItem(LS_KEY)||'{}');if(ls.firmas?.[f.k]) sigData=ls.firmas[f.k];}catch(e){}
    }
    if(sigData){ try{doc.addImage(sigData,'PNG',x+4,boxY+2,colW-8,20);}catch(e){} }
    doc.setDrawColor(150,150,150);doc.setLineWidth(0.2);doc.line(x+8,boxY+24,x+colW-8,boxY+24);
    doc.setTextColor(80,80,80);doc.setFont('helvetica','normal');doc.setFontSize(7);
    doc.text(firmaN(f.k),x+colW/2,boxY+28,{align:'center'});
    doc.setFontSize(5.7);doc.setTextColor(130,130,130);doc.text('Nombre / Firma',x+colW/2,boxY+31,{align:'center'});
  });

  const nombreArch=`Reporte_Pruebas_Carga_${(g('reporte')||g('cliente')||'Sudmar').replace(/[^\w\-]/g,'_')}.pdf`;
  const esMovil=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(esMovil){
    try{
      const blob=doc.output('blob');const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=nombreArch;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>window.open(url,'_blank'),300);setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){ try{doc.save(nombreArch);}catch(e2){alert('No se pudo generar el PDF: '+(e2.message||e2));} }
  }else{
    try{doc.save(nombreArch);}catch(e){alert('No se pudo generar el PDF: '+(e.message||e));}
  }
 }catch(err){
   alert('Error al generar el PDF: '+(err?.message||err)+'\n\nTus datos siguen guardados. Intenta de nuevo.');
   console.error('generarPDF error:',err);
 }
}

// ============================================================
//   AUTOGUARDADO (localStorage) · preserva datos y firmas
// ============================================================
const LS_KEY = 'sudmar_pruebas_carga_v1';
let saveTimer = null;

function recolectarEstado(){
  const data = { campos:{}, segmentos:{}, dict:state.dict, firmas:{} };
  document.querySelectorAll('input,textarea,select').forEach(el=>{
    const key = el.id || el.dataset.carga && ('carga:'+el.dataset.carga)
      || el.dataset.param && ('param:'+el.dataset.param)
      || el.dataset.check && ('check:'+el.dataset.check)
      || el.dataset.sub && ('sub:'+el.dataset.sub)
      || el.dataset.firma && ('firma:'+el.dataset.firma);
    if(key) data.campos[key] = el.value;
  });
  document.querySelectorAll('[data-seg]').forEach(s=>{ if(s.dataset.val) data.segmentos[s.dataset.seg] = s.dataset.val; });
  Object.keys(sigPads).forEach(k=>{
    if(sigPads[k] && !sigPads[k].isEmpty()){
      try{ data.firmas[k] = sigPads[k].canvas.toDataURL('image/png'); }catch(e){}
    }
  });
  return data;
}

function guardar(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(recolectarEstado()));
    mostrarGuardado();
  }catch(e){}
}
function mostrarGuardado(){
  let ind=document.getElementById('saveInd');
  if(!ind){
    ind=document.createElement('div');
    ind.id='saveInd';
    ind.style.cssText='position:fixed;bottom:96px;right:16px;background:#2e7d32;color:#fff;font-size:11px;font-weight:600;padding:6px 12px;border-radius:20px;z-index:70;opacity:0;transition:opacity .3s;box-shadow:0 2px 6px rgba(0,0,0,.2)';
    ind.textContent='✓ Guardado';
    document.body.appendChild(ind);
  }
  ind.style.opacity='1';
  clearTimeout(ind._t);
  ind._t=setTimeout(()=>{ind.style.opacity='0';},1200);
}
function guardarDebounced(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(guardar, 400);
}

function restaurar(){
  let raw;
  try{ raw = localStorage.getItem(LS_KEY); }catch(e){ return; }
  if(!raw) return;
  let data; try{ data = JSON.parse(raw); }catch(e){ return; }

  const legacyCarga={0:'c0',1:'c25',2:'c50',3:'c75',4:'c90',5:'c100',7:'ret75',8:'ret50',9:'ret25',10:'final0'};
  const legacyParam={0:'rpm',1:'hz',2:'batt',3:'oilpress',4:'coolanttemp',5:'oiltemp',9:'chargev'};

  Object.entries(data.campos||{}).forEach(([key,value])=>{
    let el=null;
    if(key.startsWith('carga:')){
      const rawKey=key.slice(6);
      el=document.querySelector(`[data-carga="${rawKey}"]`);
      if(!el){
        const m=rawKey.match(/^(\d+)-(.+)$/);
        if(m && legacyCarga[m[1]]!==undefined) el=document.querySelector(`[data-carga="${legacyCarga[m[1]]}-${m[2]}"]`);
      }
    }else if(key.startsWith('param:')){
      const rawKey=key.slice(6);
      el=document.querySelector(`[data-param="${rawKey}"]`);
      if(!el){
        const m=rawKey.match(/^(\d+)-(\d+)$/);
        if(m && legacyParam[m[1]]) el=document.querySelector(`[data-param="${legacyParam[m[1]]}-${m[2]}"]`);
        else if(m && m[2]==='1' && m[1]==='6') el=document.querySelector('[data-check="fuel-v"]');
        else if(m && m[2]==='1' && m[1]==='7') el=document.querySelector('[data-check="coolant-v"]');
        else if(m && m[2]==='1' && m[1]==='8') el=document.querySelector('[data-check="oil-v"]');
      }
    }else if(key.startsWith('check:')) el=document.querySelector(`[data-check="${key.slice(6)}"]`);
    else if(key.startsWith('firma:')) el=document.querySelector(`[data-firma="${key.slice(6)}"]`);
    else el=document.getElementById(key);
    if(el) el.value=value;
  });

  Object.entries(data.segmentos||{}).forEach(([seg,value])=>{
    const cont=document.querySelector(`[data-seg="${seg}"]`);
    if(cont){
      cont.dataset.val=value;
      const btn=[...cont.querySelectorAll('button')].find(b=>b.dataset.v===value);
      if(btn) btn.className=segClass(value);
    }
  });

  if(data.dict){
    state.dict=Object.assign(state.dict,data.dict);
    Object.entries(data.dict).forEach(([k,value])=>{
      if(!value) return;
      const parent=document.querySelector(`.dictamen[data-dict="${k}"]`);
      if(parent){
        const btn=[...parent.querySelectorAll('button')].find(b=>b.dataset.v===value);
        if(btn) btn.className=(value==='APROBADO')?'ok':'no';
      }
    });
  }

  window._firmasGuardadas=data.firmas||{};
  updateFirmaVisibility();
  updateParamDeltas();
}

// pinta firmas restauradas en canvas ya visibles
function pintarFirmasGuardadas(){
  if(!window._firmasGuardadas) return;
  Object.entries(window._firmasGuardadas).forEach(([k,dataURL])=>{
    const pad=sigPads[k]; if(!pad||!dataURL) return;
    pad.ensureSize&&pad.ensureSize();
    pad.markFilled&&pad.markFilled();   // cuenta como no vacía para el PDF
    const ctx=pad.canvas.getContext('2d');
    const img=new Image();
    img.onload=()=>{
      const ratio=window.devicePixelRatio||1;
      ctx.drawImage(img,0,0,pad.canvas.width/ratio,pad.canvas.height/ratio);
      pad._restored=true;
    };
    img.src=dataURL;
  });
}

function nuevoReporte(){
  if(!confirm('¿Iniciar un nuevo reporte? Se borrarán todos los datos actuales.')) return;
  try{ localStorage.removeItem(LS_KEY); }catch(e){}
  location.reload();
}

// engancha autoguardado a toda interacción
document.addEventListener('input', e=>{
  if(e.target.matches('[data-param]')) updateParamDeltas();
  guardarDebounced();
});
document.addEventListener('click', e=>{
  if(e.target.closest('.seg button')||e.target.closest('.dictamen button')) guardarDebounced();
});

// guarda firma al terminar cada trazo
function engancharGuardadoFirmas(){
  Object.values(sigPads).forEach(pad=>{
    pad.canvas.addEventListener('mouseup', guardarDebounced);
    pad.canvas.addEventListener('touchend', guardarDebounced);
  });
}

// ---------- INIT ----------
buildProgress();
buildCarga();
buildParams();
buildChecks();
buildAlarmas();
buildFirmas();
setupHelp();
document.querySelectorAll('.pstep').forEach(p=>p.addEventListener('click',()=>showStep(+p.dataset.p)));
document.getElementById('firmaEndress')?.addEventListener('change',()=>{updateFirmaVisibility();guardarDebounced();});
restaurar();
engancharGuardadoFirmas();
showStep(0);
