/* ============================================================
   SUDMAR ENERGY · Reporte de Pruebas con Carga
   Wizard + generación de PDF (layout idéntico, 2 páginas)
   ============================================================ */

// ---------- DEFINICIÓN DE DATOS ----------
const STEPS = ["Datos","Carga","Motor","C. Súbita","Alarmas","Firmas"];

const CARGA_ROWS = [
  {c:"SIN CARGA (0%)", t:"25"},
  {c:"25% DE CARGA", t:"25"},
  {c:"50% DE CARGA", t:"25"},
  {c:"75% DE CARGA", t:"25"},
  {c:"90% DE CARGA", t:"25"},
  {c:"100% DE CARGA (LTP)", t:"125"},
  {c:"CARGA SÚBITA 0-100%", t:"—", hl:true},
  {c:"RETORNO 75% CARGA", t:"25"},
  {c:"RETORNO 50% CARGA", t:"25"},
  {c:"RETORNO 25% CARGA", t:"25"},
  {c:"SIN CARGA FINAL (0%)", t:"25"},
];

const PARAMS = [
  {n:"Velocidad rotación (RPM)", min:"1764", max:"1836"},
  {n:"Frecuencia generada (Hz)", min:"58.8", max:"61.2"},
  {n:"Voltaje baterías (V DC)", min:"24.0", max:"30.0"},
  {n:"Presión aceite motor (bar)", min:"2.0", max:"6.0"},
  {n:"Temp. agua/refrigerante (°C)", min:"70", max:"95"},
  {n:"Temp. aceite motor (°C)", min:"70", max:"120"},
  {n:"Nivel de combustible (%)", min:"20", max:"100"},
  {n:"Nivel refrigerante", min:"OK", max:"OK"},
  {n:"Nivel aceite motor", min:"OK", max:"OK"},
  {n:"Voltaje carga alternador (V DC)", min:"27.0", max:"29.0"},
];

const SUBITA_ROWS = [
  {c:"Antes de aplicar carga", t:"0"},
  {c:"Caída inmediata de voltaje", t:"1"},
  {c:"Mínimo voltaje transitorio", t:"2"},
  {c:"Recuperación parcial", t:"5"},
  {c:"Recuperación 90%", t:"10"},
  {c:"Estabilización", t:"30"},
  {c:"Régimen estable 100% carga", t:"60"},
  {c:"Retiro carga – sobretensión", t:"—"},
  {c:"Estabilización post-descarga", t:"30"},
];

const ALARMAS = [
  "Sobre-velocidad (>10% nominal)",
  "Baja presión de aceite",
  "Alta temperatura agua/aceite",
  "Bajo nivel refrigerante",
  "Bajo nivel combustible",
  "Sobrecarga generador (>110% LTP)",
  "Paro de emergencia (E-Stop)",
  "Falla de arranque (3 intentos)",
  "Arranque/paro automático (AMF)",
  "Transferencia automática red/GE",
];

const FIRMAS = [
  {k:"comisionador", t:"Técnico Comisionador (Sudmar / Endress)"},
  {k:"cliente", t:"Representante del Cliente"},
  {k:"supervisor", t:"Supervisor de Proyecto"},
];

// ---------- ESTADO ----------
let current = 0;
const state = { dict:{subita:"", final:""} };
const sigPads = {};

// ---------- CONSTRUCCIÓN DINÁMICA ----------
function buildProgress(){
  const p = document.getElementById('progress');
  p.innerHTML = STEPS.map((s,i)=>`<div class="pstep ${i===0?'active':''}" data-p="${i}">${i+1}. ${s}</div>`).join('');
}

function buildCarga(){
  const tb = document.getElementById('carga-body');
  tb.innerHTML = CARGA_ROWS.map((r,i)=>`
    <tr>
      <td class="cond ${r.hl?'hl':''}">${r.c}</td>
      <td class="fijo">${r.t}</td>
      <td><input data-carga="${i}-v" inputmode="decimal"></td>
      <td><input data-carga="${i}-l1" inputmode="decimal"></td>
      <td><input data-carga="${i}-l2" inputmode="decimal"></td>
      <td><input data-carga="${i}-l3" inputmode="decimal"></td>
      <td><input data-carga="${i}-kw" inputmode="decimal"></td>
      <td><input data-carga="${i}-hz" inputmode="decimal"></td>
      <td><input data-carga="${i}-rpm" inputmode="decimal"></td>
      <td><input data-carga="${i}-bar" inputmode="decimal"></td>
      <td><input data-carga="${i}-temp" inputmode="decimal"></td>
      <td><input data-carga="${i}-obs"></td>
    </tr>`).join('');
}

function buildParams(){
  const pb = document.getElementById('param-body');
  pb.innerHTML = PARAMS.map((p,i)=>`
    <div class="param-row">
      <span class="pname">${p.n}</span>
      <span class="lim">${p.min}</span>
      <span class="lim">${p.max}</span>
      <input data-param="${i}-1" inputmode="decimal">
      <input data-param="${i}-2" inputmode="decimal">
      <input data-param="${i}-3" inputmode="decimal">
    </div>`).join('');
}

function buildSubita(){
  const tb = document.getElementById('subita-body');
  tb.innerHTML = SUBITA_ROWS.map((r,i)=>`
    <tr>
      <td class="cond">${r.c}</td>
      <td class="fijo">${r.t}</td>
      <td><input data-sub="${i}-v" inputmode="decimal"></td>
      <td><input data-sub="${i}-hz" inputmode="decimal"></td>
      <td><input data-sub="${i}-a" inputmode="decimal"></td>
      <td><input data-sub="${i}-rpm" inputmode="decimal"></td>
      <td><input data-sub="${i}-obs"></td>
    </tr>`).join('');
}

function buildAlarmas(){
  const ab = document.getElementById('alarma-body');
  ab.innerHTML = ALARMAS.map((a,i)=>`
    <div class="alarma">
      <span class="aname">${a}</span>
      <div>
        <div class="seg-lbl">Config.</div>
        <div class="seg" data-seg="${i}-conf">
          <button data-v="Sí">Sí</button><button data-v="No">No</button>
        </div>
      </div>
      <div>
        <div class="seg-lbl">Probado</div>
        <div class="seg" data-seg="${i}-prob">
          <button data-v="Sí">Sí</button><button data-v="No">No</button>
        </div>
      </div>
      <div>
        <div class="seg-lbl">Result.</div>
        <div class="seg" data-seg="${i}-res">
          <button data-v="OK">OK</button><button data-v="FALLA">FALLA</button>
        </div>
      </div>
    </div>`).join('');
}

function buildFirmas(){
  const f = document.getElementById('firmas');
  f.innerHTML = FIRMAS.map(fa=>`
    <div class="firma-box">
      <div class="ftit">${fa.t}</div>
      <input placeholder="Nombre" data-firma="${fa.k}-nombre" style="margin-bottom:6px">
      <canvas class="sig" data-sig="${fa.k}"></canvas>
      <div class="fbtns"><button onclick="clearSig('${fa.k}')">Borrar firma</button></div>
    </div>`).join('');
  FIRMAS.forEach(fa=>initSig(fa.k));
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
    clear:()=>{ctx.clearRect(0,0,canvas.width,canvas.height);empty=true;}
  };
}
function clearSig(key){sigPads[key].clear();}

// ---------- SEGMENTOS Y DICTÁMENES ----------
document.addEventListener('click',e=>{
  const seg = e.target.closest('.seg button');
  if(seg){
    const parent = seg.parentElement;
    parent.querySelectorAll('button').forEach(b=>b.className='');
    const v = seg.dataset.v;
    const cls = v==='Sí'?'on-si':v==='No'?'on-no':v==='OK'?'on-ok':'on-falla';
    seg.className = cls;
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
const subV = k => val(`[data-sub="${k}"]`);
const segV = k => document.querySelector(`[data-seg="${k}"]`)?.dataset.val||"";
const firmaN = k => val(`[data-firma="${k}-nombre"]`);

// ============================================================
//   GENERACIÓN DEL PDF · Layout idéntico, 2 páginas horizontal
// ============================================================
function generarPDF(){
 try{
  if(!window.jspdf || !window.jspdf.jsPDF){
    alert('La librería del PDF no cargó. Verifica tu conexión a internet e intenta de nuevo (sin recargar pierdes datos: revisa tu señal y vuelve a tocar Generar PDF).');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'landscape', unit:'mm', format:'a4'});
  const W = doc.internal.pageSize.getWidth();   // 297
  const AZUL=[26,59,110], AZUL2=[36,72,122], ROJO=[192,57,43], AMAR=[255,249,230], GRIS=[240,243,247];

  // ---- Encabezado con banda de logos ----
  function encabezado(){
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,20,'F');
    doc.setDrawColor(...AZUL); doc.setLineWidth(0.6); doc.rect(4,3,W-8,16);
    // --- Logo Sudmar (imagen real, fondo azul) ---
    try{
      if(typeof LOGO_SUDMAR!=='undefined' && LOGO_SUDMAR){
        // proporcion 500x137 -> alto 11mm => ancho ~40mm
        doc.addImage(LOGO_SUDMAR,'PNG', 7, 5.5, 40, 11);
      }
    }catch(e){}
    // --- Logo Prettl (centro) ---
    try{
      if(typeof LOGO_PRETTL!=='undefined' && LOGO_PRETTL){
        // proporcion 500x145 -> alto 9mm => ancho ~31mm
        doc.addImage(LOGO_PRETTL,'PNG', W/2-15.5, 6, 31, 9);
      } else {
        doc.setFontSize(13); doc.setTextColor(60,60,60); doc.setFont('helvetica','bold');
        doc.text('PRETTL', W/2-12, 12);
        doc.setFontSize(6); doc.text('energy', W/2-1, 15);
      }
    }catch(e){}
    // --- Logo Endress (imagen real, fondo transparente) ---
    try{
      if(typeof LOGO_ENDRESS!=='undefined' && LOGO_ENDRESS){
        // proporcion 500x73 -> alto 7mm => ancho ~48mm
        doc.addImage(LOGO_ENDRESS,'PNG', W-56, 6.5, 48, 7);
      }
    }catch(e){}
  }

  function bandaTitulo(y,txt,color){
    doc.setFillColor(...(color||AZUL)); doc.rect(4,y,W-8,7,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text(txt, W/2, y+5, {align:'center'});
  }

  // ===================== PÁGINA 1 =====================
  encabezado();
  bandaTitulo(22,'REPORTE DE PRUEBAS DE FUNCIONAMIENTO – GRUPO ELECTRÓGENO');

  // Datos generales (banda + tabla 2 columnas de pares)
  bandaTitulo(30,'DATOS GENERALES DEL EQUIPO',AZUL2);
  const gd = [
    ['Cliente / Sitio:', g('cliente'), 'Frecuencia Nominal (Hz):', g('frecuencia')],
    ['No. de Reporte:', g('reporte'), 'Corriente Nominal Cos 0.8 (A):', g('corriente')],
    ['Fecha de Prueba:', g('fecha'), 'Motor (Marca / Modelo):', g('motor')],
    ['Técnico Responsable:', g('tecnico'), 'Alternador:', g('alternador')],
    ['No. de Serie Generador:', g('serie'), 'Controlador / Panel:', g('controlador')],
    ['Modelo / Tipo:', g('modelo'), 'Interruptor Principal:', g('interruptor')],
    ['Potencia Nominal LTP (KVA/KW):', g('potencia'), 'Orden de Trabajo / OdL:', g('odl')],
    ['Voltaje Nominal (V):', g('voltaje'), 'Observaciones:', g('observaciones')],
  ];
  doc.autoTable({
    startY:38, margin:{left:4,right:4},
    body:gd,
    theme:'grid',
    styles:{fontSize:7.5,cellPadding:1.5,lineColor:[217,222,230],lineWidth:0.1,textColor:[31,41,51]},
    columnStyles:{
      0:{cellWidth:45,fillColor:GRIS,fontStyle:'bold'},
      1:{cellWidth:98},
      2:{cellWidth:52,fillColor:GRIS,fontStyle:'bold'},
      3:{cellWidth:'auto'},
    },
  });

  // Pruebas con carga
  let y = doc.lastAutoTable.finalY + 3;
  doc.setFillColor(...AZUL2); doc.rect(4,y,W-8,6,'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
  doc.text('PRUEBAS CON CARGA – BANCO RESISTIVO (FP=1)  |  Tolerancias: Voltaje ±5% | Frecuencia ±2% | Temp. agua max 95°C | Presión aceite min 2.0 bar', W/2, y+4, {align:'center'});

  const cargaHead = [['CONDICIÓN DE PRUEBA','TIEMPO\nPASO (s)','VOLTAJE\nL-L (V)','CORR.\nL1 (A)','CORR.\nL2 (A)','CORR.\nL3 (A)','POTENCIA\n(kW)','FREC.\n(Hz)','RPM','PRESIÓN\nACEITE (bar)','TEMP.\nAGUA (°C)','OBSERVACIONES']];
  const cargaBody = CARGA_ROWS.map((r,i)=>[
    r.c, r.t, cargaV(`${i}-v`), cargaV(`${i}-l1`), cargaV(`${i}-l2`), cargaV(`${i}-l3`),
    cargaV(`${i}-kw`), cargaV(`${i}-hz`), cargaV(`${i}-rpm`), cargaV(`${i}-bar`), cargaV(`${i}-temp`), cargaV(`${i}-obs`)
  ]);
  doc.autoTable({
    startY:y+7, margin:{left:4,right:4},
    head:cargaHead, body:cargaBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6,fontStyle:'bold',halign:'center',valign:'middle'},
    styles:{fontSize:7,cellPadding:1.5,lineColor:[217,222,230],lineWidth:0.1,halign:'center'},
    columnStyles:{0:{halign:'left',fontStyle:'bold',fillColor:GRIS,cellWidth:42},11:{cellWidth:'auto'}},
    didParseCell:d=>{ if(d.section==='body'&&d.row.index===6){ d.cell.styles.fillColor=AMAR; } }
  });

  // ===================== PÁGINA 2 =====================
  doc.addPage();
  encabezado();

  // --- Columna izquierda: Parámetros de motor ---
  const colL = 4, colLW = 140;
  bandaTitulo(22,'PARÁMETROS DE MOTOR',AZUL2);
  // ajustar banda al ancho de columna izquierda
  doc.setFillColor(255,255,255); doc.rect(4,22,W-8,7,'F'); // limpiar
  doc.setFillColor(...AZUL2); doc.rect(colL,22,colLW,7,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(9);
  doc.text('PARÁMETROS DE MOTOR', colL+colLW/2, 27, {align:'center'});

  const paramHead=[['PARÁMETRO','MÍN','MÁX','LECT. 1','LECT. 2','LECT. 3']];
  const paramBody=PARAMS.map((p,i)=>[p.n,p.min,p.max,paramV(`${i}-1`),paramV(`${i}-2`),paramV(`${i}-3`)]);
  doc.autoTable({
    startY:30, margin:{left:colL}, tableWidth:colLW,
    head:paramHead, body:paramBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6.5,halign:'center'},
    styles:{fontSize:6.8,cellPadding:1.2,lineColor:[217,222,230],lineWidth:0.1,halign:'center'},
    columnStyles:{0:{halign:'left',fontStyle:'bold',cellWidth:52},1:{fillColor:GRIS},2:{fillColor:GRIS}},
  });

  // Alarmas (debajo de parámetros, misma columna)
  let yL = doc.lastAutoTable.finalY + 3;
  doc.setFillColor(...AZUL2); doc.rect(colL,yL,colLW,6,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('VERIFICACIÓN DE ALARMAS Y PROTECCIONES', colL+colLW/2, yL+4, {align:'center'});
  const alHead=[['ALARMA / PROTECCIÓN','CONF.','PROB.','RESULT.']];
  const alBody=ALARMAS.map((a,i)=>[a, segV(`${i}-conf`), segV(`${i}-prob`), segV(`${i}-res`)]);
  doc.autoTable({
    startY:yL+7, margin:{left:colL}, tableWidth:colLW,
    head:alHead, body:alBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6.5,halign:'center'},
    styles:{fontSize:6.8,cellPadding:1.2,lineColor:[217,222,230],lineWidth:0.1,halign:'center'},
    columnStyles:{0:{halign:'left',fontStyle:'bold',cellWidth:70}},
    didParseCell:d=>{ if(d.section==='body'&&d.column.index===3){ if(d.cell.raw==='OK'){d.cell.styles.textColor=[46,125,50];d.cell.styles.fontStyle='bold';} if(d.cell.raw==='FALLA'){d.cell.styles.textColor=ROJO;d.cell.styles.fontStyle='bold';} } }
  });

  // --- Columna derecha: Carga súbita ---
  const colR = colL+colLW+3, colRW = W-colR-4;
  doc.setFillColor(...AZUL2); doc.rect(colR,22,colRW,7,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(9);
  doc.text('PRUEBA DE CARGA SÚBITA (STEP LOAD TEST)', colR+colRW/2, 27, {align:'center'});
  const subHead=[['INSTANTE / CONDICIÓN','T (s)','VOLTAJE\n(V)','FREC.\n(Hz)','CORR.\n(A)','RPM','OBS.']];
  const subBody=SUBITA_ROWS.map((r,i)=>[r.c,r.t,subV(`${i}-v`),subV(`${i}-hz`),subV(`${i}-a`),subV(`${i}-rpm`),subV(`${i}-obs`)]);
  doc.autoTable({
    startY:30, margin:{left:colR}, tableWidth:colRW,
    head:subHead, body:subBody, theme:'grid',
    headStyles:{fillColor:AZUL,textColor:[255,255,255],fontSize:6,halign:'center',valign:'middle'},
    styles:{fontSize:6.8,cellPadding:1.2,lineColor:[217,222,230],lineWidth:0.1,halign:'center'},
    columnStyles:{0:{halign:'left',fontStyle:'bold',cellWidth:42}},
  });

  // Criterios de aceptación
  let yR = doc.lastAutoTable.finalY + 3;
  doc.setFillColor(...ROJO); doc.rect(colR,yR,colRW,5,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7);
  doc.text('CRITERIOS DE ACEPTACIÓN – ISO 8528-5', colR+colRW/2, yR+3.5, {align:'center'});
  const critBody=[
    ['Caída máx. voltaje transitorio:','max -15% del nominal'],
    ['Recuperación de voltaje:','< 3 s al ±3% nominal'],
    ['Caída máx. de frecuencia:','max -10% del nominal'],
    ['Recuperación de frecuencia:','< 5 s al ±1 Hz'],
    ['RESULTADO CARGA SÚBITA:', state.dict.subita||'—'],
  ];
  doc.autoTable({
    startY:yR+6, margin:{left:colR}, tableWidth:colRW,
    body:critBody, theme:'grid',
    styles:{fontSize:6.8,cellPadding:1.2,lineColor:[217,222,230],lineWidth:0.1},
    columnStyles:{0:{fontStyle:'bold',fillColor:GRIS,cellWidth:60},1:{halign:'center'}},
    didParseCell:d=>{ if(d.row.index===4&&d.column.index===1){ d.cell.styles.fontStyle='bold'; d.cell.styles.textColor = d.cell.raw==='APROBADO'?[46,125,50]:ROJO; } }
  });

  // --- Resultado final (banda ancho completo) ---
  let yF = Math.max(doc.lastAutoTable.finalY, yL) + 4;
  const finalTxt = state.dict.final==='APROBADO'
    ? 'RESULTADO FINAL:  ☑ EQUIPO APROBADO PARA OPERACIÓN     ☐ EQUIPO REQUIERE CORRECCIONES'
    : state.dict.final==='CORRECCIONES'
    ? 'RESULTADO FINAL:  ☐ EQUIPO APROBADO PARA OPERACIÓN     ☑ EQUIPO REQUIERE CORRECCIONES'
    : 'RESULTADO FINAL:  ☐ EQUIPO APROBADO PARA OPERACIÓN     ☐ EQUIPO REQUIERE CORRECCIONES';
  doc.setFillColor(...ROJO); doc.rect(4,yF,W-8,6,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text(finalTxt, W/2, yF+4, {align:'center'});

  // --- Firmas ---
  let yS = yF+9;
  doc.setFillColor(...AZUL2); doc.rect(4,yS,W-8,6,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8);
  doc.text('FIRMAS DE CONFORMIDAD', W/2, yS+4, {align:'center'});

  const colW = (W-8)/4;
  const firmaCols = [
    {t:'TÉCNICO COMISIONADOR', k:'comisionador'},
    {t:'REPRESENTANTE DEL CLIENTE', k:'cliente'},
    {t:'SUPERVISOR DE PROYECTO', k:'supervisor'},
    {t:'FECHA Y SELLO', k:null},
  ];
  let yh = yS+6;
  firmaCols.forEach((f,i)=>{
    const x = 4 + i*colW;
    doc.setFillColor(...GRIS); doc.rect(x,yh,colW,5,'F');
    doc.setDrawColor(217,222,230); doc.rect(x,yh,colW,5);
    doc.setTextColor(...AZUL); doc.setFont('helvetica','bold'); doc.setFontSize(6);
    doc.text(f.t, x+colW/2, yh+3.4, {align:'center'});
  });
  // cajas de firma
  const boxY = yh+5, boxH = 26;
  firmaCols.forEach((f,i)=>{
    const x = 4 + i*colW;
    doc.setDrawColor(217,222,230); doc.rect(x,boxY,colW,boxH);
    // imagen de firma
    if(f.k && sigPads[f.k] && !sigPads[f.k].isEmpty()){
      try{ doc.addImage(sigPads[f.k].canvas.toDataURL('image/png'),'PNG',x+2,boxY+1,colW-4,15); }catch(e){}
    }
    doc.setTextColor(80,80,80); doc.setFont('helvetica','normal'); doc.setFontSize(6.5);
    const nombre = f.k ? firmaN(f.k) : (g('fecha')||'');
    doc.setDrawColor(150,150,150); doc.setLineWidth(0.2);
    doc.line(x+3, boxY+19, x+colW-3, boxY+19);
    doc.text(nombre, x+colW/2, boxY+23, {align:'center'});
    doc.setFontSize(5.5); doc.setTextColor(130,130,130);
    doc.text(f.k?'Nombre / Firma':'Fecha y sello', x+colW/2, boxY+25.5, {align:'center'});
  });

  // ---- Guardar / abrir PDF (robusto para móvil) ----
  const nombreArch = `Reporte_Pruebas_Carga_${(g('reporte')||g('cliente')||'Sudmar').replace(/[^\w\-]/g,'_')}.pdf`;
  const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(esMovil){
    // En móvil doc.save() a veces no dispara; abrir el PDF en visor es más confiable
    try{
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download=nombreArch;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>{ window.open(url,'_blank'); }, 300);
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
    }catch(e){
      try{ doc.save(nombreArch); }catch(e2){ alert('No se pudo generar el PDF: '+(e2.message||e2)); }
    }
  }else{
    try{ doc.save(nombreArch); }catch(e){ alert('No se pudo generar el PDF: '+(e.message||e)); }
  }
 }catch(err){
   alert('Error al generar el PDF: '+(err && err.message ? err.message : err)+'\n\nTus datos siguen guardados. Intenta de nuevo.');
   console.error('generarPDF error:', err);
 }
}

// ============================================================
//   AUTOGUARDADO (localStorage) · preserva datos y firmas
// ============================================================
const LS_KEY = 'sudmar_pruebas_carga_v1';
let saveTimer = null;

function recolectarEstado(){
  const data = { campos:{}, segmentos:{}, dict:state.dict, firmas:{} };
  // todos los inputs/textarea/select con id o data-*
  document.querySelectorAll('input,textarea,select').forEach(el=>{
    const key = el.id || el.dataset.carga && ('carga:'+el.dataset.carga)
      || el.dataset.param && ('param:'+el.dataset.param)
      || el.dataset.sub && ('sub:'+el.dataset.sub)
      || el.dataset.firma && ('firma:'+el.dataset.firma);
    if(key) data.campos[key] = el.value;
  });
  // segmentos (alarmas)
  document.querySelectorAll('[data-seg]').forEach(s=>{
    if(s.dataset.val) data.segmentos[s.dataset.seg] = s.dataset.val;
  });
  // firmas dibujadas (dataURL)
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

  // campos
  Object.entries(data.campos||{}).forEach(([key,val])=>{
    let el=null;
    if(key.startsWith('carga:')) el=document.querySelector(`[data-carga="${key.slice(6)}"]`);
    else if(key.startsWith('param:')) el=document.querySelector(`[data-param="${key.slice(6)}"]`);
    else if(key.startsWith('sub:')) el=document.querySelector(`[data-sub="${key.slice(4)}"]`);
    else if(key.startsWith('firma:')) el=document.querySelector(`[data-firma="${key.slice(6)}"]`);
    else el=document.getElementById(key);
    if(el) el.value=val;
  });
  // segmentos
  Object.entries(data.segmentos||{}).forEach(([seg,val])=>{
    const cont=document.querySelector(`[data-seg="${seg}"]`);
    if(cont){
      cont.dataset.val=val;
      const btn=[...cont.querySelectorAll('button')].find(b=>b.dataset.v===val);
      if(btn){ const cls=val==='Sí'?'on-si':val==='No'?'on-no':val==='OK'?'on-ok':'on-falla'; btn.className=cls; }
    }
  });
  // dictamenes
  if(data.dict){
    state.dict = Object.assign(state.dict, data.dict);
    Object.entries(data.dict).forEach(([k,v])=>{
      if(!v) return;
      const parent=document.querySelector(`.dictamen[data-dict="${k}"]`);
      if(parent){ const btn=[...parent.querySelectorAll('button')].find(b=>b.dataset.v===v); if(btn) btn.className=(v==='APROBADO')?'ok':'no'; }
    });
  }
  // firmas dibujadas -> se pintan cuando el canvas ya esté dimensionado
  window._firmasGuardadas = data.firmas||{};
}

// pinta firmas restauradas en canvas ya visibles
function pintarFirmasGuardadas(){
  if(!window._firmasGuardadas) return;
  Object.entries(window._firmasGuardadas).forEach(([k,dataURL])=>{
    const pad=sigPads[k]; if(!pad||!dataURL) return;
    pad.ensureSize&&pad.ensureSize();
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
document.addEventListener('input', guardarDebounced);
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
buildSubita();
buildAlarmas();
buildFirmas();
document.querySelectorAll('.pstep').forEach(p=>p.addEventListener('click',()=>showStep(+p.dataset.p)));
restaurar();
engancharGuardadoFirmas();
showStep(0);
