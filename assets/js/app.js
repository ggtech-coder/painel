
import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp({
  apiKey:"AIzaSyB8ttDdzF0LEvaGHQfQ1hiEeK_LTKFYDPw",
  authDomain:"upas-1683a.firebaseapp.com",
  projectId:"upas-1683a",
  storageBucket:"upas-1683a.firebasestorage.app",
  messagingSenderId:"907825271687",
  appId:"1:907825271687:web:737064762036d9a06b3922"
});
const db = getFirestore(app);

/* ══ DADOS PADRÃO ══ */
const DEFAULT_UNITS = [
  {key:'upa_atalaia',name:'UPA ATALAIA',desc:'Unidade de Pronto Atendimento',icon:'🚑',color:'#00e5ff',
   computers:[
     {key:'c1',name:'TRIAGEM 01',anydesk:'',ip:'',serial:'',obs:'Triagem principal'},
     {key:'c2',name:'TRIAGEM 02',anydesk:'',ip:'',serial:'',obs:''},
     {key:'c3',name:'RECEPÇÃO',anydesk:'',ip:'',serial:'',obs:'Balcão de recepção'},
     {key:'c4',name:'FARMÁCIA',anydesk:'',ip:'',serial:'',obs:''},
     {key:'c5',name:'MÉDICO 01',anydesk:'',ip:'',serial:'',obs:'Consultório 1'},
   ],
   insumos:[
     {key:'i1',name:'Toner HP LaserJet',model:'CF226A / 26A',qty:3,min:2,obs:'Impressora triagem'},
     {key:'i2',name:'Toner Samsung',model:'MLT-D101S',qty:1,min:2,obs:'Impressora recepção'},
   ]},
  {key:'upa_caucaia',name:'UPA CAUCAIA',desc:'Unidade de Pronto Atendimento',icon:'🚑',color:'#ff6b2b',
   computers:[
     {key:'c1',name:'TRIAGEM 01',anydesk:'',ip:'',serial:'',obs:''},
     {key:'c2',name:'TRIAGEM 02',anydesk:'',ip:'',serial:'',obs:''},
     {key:'c3',name:'RECEPÇÃO',anydesk:'',ip:'',serial:'',obs:''},
     {key:'c4',name:'MÉDICO 01',anydesk:'',ip:'',serial:'',obs:''},
   ],
   insumos:[{key:'i1',name:'Toner HP LaserJet',model:'CF226A / 26A',qty:0,min:2,obs:'Impressora triagem'}]},
  {key:'pq_sao_jorge',name:'PQ SÃO JORGE',desc:'Pronto atendimento São Jorge',icon:'🏥',color:'#00ff9d',
   computers:[
     {key:'c1',name:'RECEPÇÃO',anydesk:'',ip:'',serial:'',obs:''},
     {key:'c2',name:'CONSULTÓRIO 01',anydesk:'',ip:'',serial:'',obs:''},
   ],
   insumos:[{key:'i1',name:'Toner Canon',model:'CRG-052',qty:2,min:2,obs:''}]},
  {key:'psi',name:'PSI',desc:'Pronto Socorro Infantil',icon:'🧠',color:'#a855f7',
   computers:[
     {key:'c1',name:'RECEPÇÃO',anydesk:'',ip:'',serial:'',obs:''},
     {key:'c2',name:'SALA TI',anydesk:'',ip:'',serial:'',obs:''},
   ],
   insumos:[{key:'i1',name:'Toner Brother',model:'TN-1060',qty:4,min:2,obs:''}]},
];
const DEFAULT_USERS = [{username:'admin',password:'GGtech@2024',role:'admin'}];

/* ══ ESTADO ══ */
let _units=[], _users=[], CU=null;
const openUnits={}, openTabs={};
let _logs=[];
let _currentLogFilter='all';

/* ══ FIRESTORE ══ */
const refUnits = doc(db,'ggtech','units');
const refUsers = doc(db,'ggtech','users');
const refLogs  = doc(db,'ggtech','logs');
const refStock = doc(db,'ggtech','stock');

async function fsLoad(){
  const [su,sus,sl,ss] = await Promise.all([getDoc(refUnits),getDoc(refUsers),getDoc(refLogs),getDoc(refStock)]);
  _units        = su.exists()  ? su.data().list  : null;
  _users        = sus.exists() ? sus.data().list : null;
  _logs         = sl.exists()  ? sl.data().list  : [];
  window.stockItems = ss.exists() ? ss.data().list : [];
}
async function fsSaveUnits(){
  sync('saving','SALVANDO...');
  try{await setDoc(refUnits,{list:_units});sync('ok','ONLINE');}
  catch(e){sync('err','ERRO SYNC');toast('Erro: '+e.message,'❌','t-red');throw e;}
}
async function fsSaveUsers(){
  sync('saving','SALVANDO...');
  try{await setDoc(refUsers,{list:_users});sync('ok','ONLINE');}
  catch(e){sync('err','ERRO SYNC');toast('Erro: '+e.message,'❌','t-red');throw e;}
}
async function fsSaveLogs(){
  try{await setDoc(refLogs,{list:_logs});}catch(e){console.warn('Log save err',e);}
}
async function fsSaveStock(){
  sync('saving','SALVANDO...');
  try{await setDoc(refStock,{list:window.stockItems});sync('ok','ONLINE');}
  catch(e){sync('err','ERRO SYNC');toast('Erro: '+e.message,'❌','t-red');throw e;}
}

function sync(s,t){const el=document.getElementById('syncBadge');el.className='sync-badge s-'+s;document.getElementById('syncText').textContent=t;}

/* ══ LOGS ══ */
function addLog(type,msg,category='edit'){
  const ts=new Date();
  const entry={
    id:'l'+Date.now(),
    type,      // info|warn|danger|success
    category,  // login|edit|stock|alert
    msg,
    user:CU?CU.username:'sistema',
    time:ts.toLocaleString('pt-BR')
  };
  _logs.unshift(entry);
  if(_logs.length>500)_logs=_logs.slice(0,500);
  renderLogs();
  fsSaveLogs();
}
window.filterLogs=(cat,btn)=>{
  _currentLogFilter=cat;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderLogs();
};
function renderLogs(){
  const c=document.getElementById('logsContainer');
  const list=_currentLogFilter==='all'?_logs:_logs.filter(l=>l.category===_currentLogFilter);
  if(!list.length){c.innerHTML='<div class="empty-state"><div class="icon">📋</div>NENHUM LOG ENCONTRADO</div>';return;}
  c.innerHTML=list.map(l=>`
    <div class="log-item log-${l.type}">
      <span class="log-badge lb-${l.type}">${l.category.toUpperCase()}</span>
      <span class="log-msg">${l.msg}<span class="log-user">@${l.user}</span></span>
      <span class="log-time">${l.time}</span>
    </div>`).join('');
}
window.clearLogs=async()=>{
  if(!confirm('Limpar todos os logs?'))return;
  _logs=[];renderLogs();await fsSaveLogs();toast('Logs limpos.','🗑️','t-red');
};

/* ══ BOOT ══ */
async function boot(){
  setLoading('CONECTANDO AO FIREBASE...');
  try{
    await fsLoad();
    if(!_units){setLoading('PRIMEIRA VEZ — INICIALIZANDO...');_units=JSON.parse(JSON.stringify(DEFAULT_UNITS));await fsSaveUnits();}
    if(!_users){_users=JSON.parse(JSON.stringify(DEFAULT_USERS));await fsSaveUsers();}
    onSnapshot(refUnits,snap=>{
      if(!snap.exists()||!CU)return;
      const fresh=snap.data().list;
      if(JSON.stringify(fresh)!==JSON.stringify(_units)){_units=fresh;render();restoreOpen();sync('ok','ONLINE');}
    });
    onSnapshot(refStock,snap=>{
      if(!snap.exists()||!CU)return;
      const fresh=snap.data().list||[];
      if(JSON.stringify(fresh)!==JSON.stringify(window.stockItems)){window.stockItems=fresh;renderStockPage();sync('ok','ONLINE');}
    });
    document.getElementById('loadingScreen').style.display='none';
    document.getElementById('loginScreen').classList.add('show');
  }catch(e){setLoading('ERRO AO CONECTAR: '+e.message);console.error(e);}
}
function setLoading(t){document.getElementById('loadingText').textContent=t;}

/* ══ AUTH ══ */
window.doLogin=()=>{
  const u=document.getElementById('li_user').value.trim();
  const p=document.getElementById('li_pass').value;
  const found=_users.find(x=>x.username===u&&x.password===p);
  if(!found){document.getElementById('li_err').textContent='Usuário ou senha incorretos.';return;}
  CU=found;
  document.getElementById('loginScreen').classList.remove('show');
  document.getElementById('appHeader').classList.add('show');
  document.getElementById('appMain').classList.add('show');
  document.getElementById('h_username').textContent=u.toUpperCase();
  const b=document.getElementById('h_badge');
  b.textContent=found.role==='admin'?'ADMIN':'TÉCNICO';
  b.className='h-badge '+(found.role==='admin'?'badge-admin':'badge-tech');
  // Show toolbars per role
  document.getElementById('adminBar').classList.toggle('hidden',found.role!=='admin');
  document.getElementById('techBar').classList.toggle('hidden',found.role!=='tech');
  addLog('info','Login realizado','login');
  showPage('dashboard');
  render();
};
window.doLogout=()=>{
  addLog('info','Logout realizado','login');
  CU=null;
  document.getElementById('loginScreen').classList.add('show');
  document.getElementById('appHeader').classList.remove('show');
  document.getElementById('appMain').classList.remove('show');
  document.getElementById('li_user').value='';
  document.getElementById('li_pass').value='';
  document.getElementById('li_err').textContent='';
};

/* ══ PAGES ══ */
window.showPage=(page)=>{
  document.querySelectorAll('.page-view').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+page)?.classList.add('active');
  document.getElementById('nav-'+page)?.classList.add('active');
  if(page==='dashboard')updateDashboard();
  if(page==='alerts')renderAlerts();
  if(page==='logs')renderLogs();
};

/* ══ DASHBOARD ══ */
function updateDashboard(){
  const totalUnits=_units.length;
  const totalPCs=_units.reduce((a,u)=>a+(u.computers?.length||0),0);
  const allIns=_units.flatMap(u=>u.insumos||[]);
  const totalIns=allIns.length;
  const totalToners=allIns.reduce((a,i)=>a+(i.qty||0),0);
  const alerts=allIns.filter(i=>i.qty<=i.min);
  const esgotados=allIns.filter(i=>i.qty===0);

  document.getElementById('ds-units').textContent=totalUnits;
  document.getElementById('ds-pcs').textContent=totalPCs;
  document.getElementById('ds-insumos').textContent=totalIns;
  document.getElementById('ds-toners').textContent=totalToners;
  document.getElementById('ds-alerts').textContent=alerts.length;
  document.getElementById('ds-esgotados').textContent=esgotados.length;

  // Alert nav dot
  const dot=document.getElementById('alertNavDot');
  dot.classList.toggle('hidden',alerts.length===0);

  // Mobile banner
  const banner=document.getElementById('mobileAlertBanner');
  if(alerts.length>0){
    banner.classList.add('show');
    document.getElementById('mobileAlertText').textContent=alerts.length+' alerta'+(alerts.length>1?'s':'')+' de estoque';
  } else {
    banner.classList.remove('show');
  }

  // PCs by unit
  document.getElementById('dash-pcs-by-unit').innerHTML=_units.map(u=>`
    <div class="mini-row">
      <span class="mini-label">${u.icon} ${u.name}</span>
      <span class="mini-val" style="color:${u.color}">${u.computers?.length||0} PCs</span>
    </div>`).join('');

  // Toners by unit
  document.getElementById('dash-toners-by-unit').innerHTML=_units.map(u=>{
    const tot=(u.insumos||[]).reduce((a,i)=>a+(i.qty||0),0);
    const low=(u.insumos||[]).filter(i=>i.qty<=i.min).length;
    return `<div class="mini-row">
      <span class="mini-label">${u.icon} ${u.name}</span>
      <span class="mini-val" style="color:${low>0?'var(--yellow)':u.color}">${tot} un${low>0?' ⚠️'+low:''}</span>
    </div>`;
  }).join('');
}

/* ══ ALERTS PAGE ══ */
function renderAlerts(){
  const c=document.getElementById('alertsContainer');
  const items=[];
  _units.forEach(u=>{
    (u.insumos||[]).forEach(i=>{
      if(i.qty===0){
        items.push({cls:'a-red',icon:'🔴',title:`${i.name} — ESGOTADO`,sub:`${u.name} · ${i.model||''}`,time:''});
      } else if(i.qty<=i.min){
        items.push({cls:'a-yellow',icon:'⚠️',title:`${i.name} — ESTOQUE BAIXO (${i.qty} un.)`,sub:`${u.name} · Mínimo: ${i.min} un.`,time:''});
      }
    });
  });
  if(!items.length){c.innerHTML='<div class="empty-state"><div class="icon">✅</div>NENHUM ALERTA ATIVO</div>';return;}
  c.innerHTML=items.map(a=>`
    <div class="alert-item ${a.cls}">
      <span class="alert-icon">${a.icon}</span>
      <div class="alert-text"><div class="alert-title">${a.title}</div><div class="alert-sub">${a.sub}</div></div>
    </div>`).join('');
}

/* ══ RENDER UNITS ══ */
window.render=()=>{
  const c=document.getElementById('unitsContainer');
  c.innerHTML='';
  _units.forEach(u=>c.appendChild(buildUnit(u)));
  updateDashboard();
  renderAlerts();
};

function buildUnit(u){
  const div=document.createElement('div');
  div.className='unit'+(openUnits[u.key]?' open':'');
  div.id='unit_'+u.key;
  const comps=u.computers||[], ins=u.insumos||[];
  const low=ins.filter(i=>i.qty<=i.min).length;
  const isAdmin=CU?.role==='admin';
  const isTech=CU?.role==='tech';
  const canEdit=isAdmin||isTech;
  const tab=openTabs[u.key]||'computers';
  div.innerHTML=`
    <div class="unit-header" onclick="toggleUnit('${u.key}')">
      <div class="unit-color-bar" style="background:${u.color}"></div>
      <div class="unit-icon" style="background:${u.color}18;border:1px solid ${u.color}33">${u.icon}</div>
      <div class="unit-info">
        <div class="unit-name" style="color:${u.color}">${u.name}</div>
        <div class="unit-desc">${u.desc||''}</div>
      </div>
      <div class="unit-stats">
        <div class="stat-pill">🖥️ <span>${comps.length}</span></div>
        <div class="stat-pill" style="${low>0?'border-color:rgba(255,51,85,.35);color:var(--red)':''}">📦 <span>${ins.length}</span>${low>0?' ⚠️'+low:''}</div>
        ${isAdmin?`<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openEditUnit('${u.key}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteUnit('${u.key}')">✕</button>`:''}
      </div>
      <div class="chevron-wrap"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></div>
    </div>
    <div class="unit-body">
      <div class="tabs">
        <div class="tab ${tab==='computers'?'active':''}" onclick="switchTab('${u.key}','computers')">🖥️ COMPUTADORES</div>
        <div class="tab ${tab==='insumos'?'active':''}" onclick="switchTab('${u.key}','insumos')">📦 INSUMOS / TONERS</div>
      </div>
      <div class="tab-content ${tab==='computers'?'active':''}" id="tc_${u.key}_computers">${buildCompsTab(u,comps,canEdit,isAdmin,isTech)}</div>
      <div class="tab-content ${tab==='insumos'?'active':''}" id="tc_${u.key}_insumos">${buildInsTab(u,ins,canEdit,isAdmin,isTech)}</div>
    </div>`;
  return div;
}

function buildCompsTab(u,comps,canEdit,isAdmin,isTech){
  if(!comps.length&&!canEdit)return '<div class="empty-state"><div class="icon">🖥️</div>NENHUM COMPUTADOR CADASTRADO</div>';
  return `<div class="comp-grid">
    ${comps.map(c=>buildCompCard(u,c,canEdit,isAdmin,isTech)).join('')}
    ${canEdit?`<button class="card-add" onclick="openAddComp('${u.key}')"><div class="card-add-icon">＋</div><div class="card-add-label">NOVO COMPUTADOR</div></button>`:''}
  </div>`;
}

function buildCompCard(u,c,canEdit,isAdmin,isTech){
  const hasId=c.anydesk&&c.anydesk.trim();
  return `<div class="comp-card">
    <div class="comp-status"></div>
    <div class="comp-name">${c.name}</div>
    <div class="comp-meta">
      <div class="comp-meta-row"><span class="comp-meta-label">ANYDESK</span>
        <span class="comp-meta-val"><span class="comp-anydesk-id">${hasId?c.anydesk:'—'}</span>
        ${hasId?`<button class="copy-btn" onclick="copyText('${c.anydesk.replace(/\s/g,'')}','ID copiado!')">📋</button>`:''}</span>
      </div>
      ${c.ip?`<div class="comp-meta-row"><span class="comp-meta-label">IP</span><span class="comp-meta-val">${c.ip}<button class="copy-btn" onclick="copyText('${c.ip}','IP copiado!')">📋</button></span></div>`:''}
      ${c.serial?`<div class="comp-meta-row"><span class="comp-meta-label">S/N</span><span class="comp-meta-val">${c.serial}</span></div>`:''}
      ${c.obs?`<div style="font-size:11px;color:var(--text2);margin-top:6px">${c.obs}</div>`:''}
    </div>
    <div class="comp-actions">
      <button class="btn-connect-big" onclick="openConnect('${u.key}','${c.key}')">⚡ CONECTAR</button>
      ${canEdit?`<div class="comp-sub-actions">
        <button class="btn btn-ghost" onclick="openEditComp('${u.key}','${c.key}')">✏️ Editar</button>
        <button class="btn btn-danger" onclick="deleteComp('${u.key}','${c.key}')">✕</button>
      </div>`:''}
    </div>
  </div>`;
}

function buildInsTab(u,ins,canEdit,isAdmin,isTech){
  if(!ins.length&&!canEdit)return '<div class="empty-state"><div class="icon">📦</div>NENHUM INSUMO CADASTRADO</div>';
  return `<div class="insumos-grid">
    ${ins.map(i=>buildInsumoCard(u,i,canEdit,isAdmin,isTech)).join('')}
    ${canEdit?`<button class="card-add" onclick="openAddInsumo('${u.key}')"><div class="card-add-icon">＋</div><div class="card-add-label">NOVO INSUMO/TONER</div></button>`:''}
  </div>`;
}

function buildInsumoCard(u,i,canEdit,isAdmin,isTech){
  const max=Math.max(i.min*3,6),pct=Math.min(100,Math.round((i.qty/max)*100));
  const qc=i.qty===0?'qty-low':i.qty<=i.min?'qty-warn':'qty-ok';
  const bc=i.qty===0?'var(--red)':i.qty<=i.min?'var(--yellow)':'var(--green)';
  return `<div class="insumo-card">
    <div><div class="insumo-name">${i.name}</div>${i.model?`<div class="insumo-model">${i.model}</div>`:''}</div>
    <div class="insumo-qty-wrap"><span class="insumo-qty-label">ESTOQUE</span><span class="insumo-qty ${qc}">${i.qty}</span></div>
    <div class="stock-bar"><div class="stock-fill" style="width:${pct}%;background:${bc}"></div></div>
    <div class="insumo-threshold">Alerta: ≤ ${i.min} un. ${i.qty===0?'🔴 ESGOTADO':i.qty<=i.min?'⚠️ ESTOQUE BAIXO':''}</div>
    ${i.obs?`<div style="font-size:11px;color:var(--text2)">${i.obs}</div>`:''}
    ${canEdit?`<div class="qty-stepper">
      <button class="qty-step-btn" onclick="adjustQty('${u.key}','${i.key}',-1)">−</button>
      <span class="qty-current ${qc}">${i.qty}</span>
      <button class="qty-step-btn" onclick="adjustQty('${u.key}','${i.key}',1)">+</button>
    </div>
    <div class="insumo-edit-row">
      <button class="btn btn-ghost" onclick="openEditInsumo('${u.key}','${i.key}')">✏️ Editar</button>
      <button class="btn btn-danger" onclick="deleteInsumo('${u.key}','${i.key}')">✕</button>
    </div>
    `:''
  }
  </div>`;
}

window.toggleUnit=k=>{openUnits[k]=!openUnits[k];document.getElementById('unit_'+k)?.classList.toggle('open',!!openUnits[k]);};
window.switchTab=(uk,tab)=>{
  openTabs[uk]=tab;openUnits[uk]=true;
  const el=document.getElementById('unit_'+uk);if(!el)return;
  el.classList.add('open');
  el.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===(tab==='computers'?0:1)));
  el.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  el.querySelector('#tc_'+uk+'_'+tab)?.classList.add('active');
};
window.restoreOpen=()=>{
  _units.forEach(u=>{
    const el=document.getElementById('unit_'+u.key);if(!el)return;
    if(openUnits[u.key])el.classList.add('open');
    const tab=openTabs[u.key];
    if(tab){
      el.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===(tab==='computers'?0:1)));
      el.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
      el.querySelector('#tc_'+u.key+'_'+tab)?.classList.add('active');
    }
  });
};

/* ══ CONNECT ══ */
let _cid='';
window.openConnect=(uk,ck)=>{
  const unit=_units.find(u=>u.key===uk),comp=unit?.computers.find(c=>c.key===ck);if(!comp)return;
  document.getElementById('conn_name').textContent=comp.name||'—';
  document.getElementById('conn_unit').textContent=unit.name||'—';
  document.getElementById('conn_ip').textContent=comp.ip||'Não informado';
  document.getElementById('conn_serial').textContent=comp.serial||'Não informado';
  _cid=(comp.anydesk||'').replace(/\s/g,'');
  document.getElementById('conn_id').textContent=comp.anydesk||'— ID não configurado —';
  addLog('info',`Conexão iniciada: ${comp.name} (${unit.name})`,'edit');
  openModal('m_connect');
};
window.doConnect=()=>{if(!_cid){toast('Configure o ID AnyDesk!','⚠️','t-yellow');return;}const a=document.createElement('a');a.href='anydesk:'+_cid;document.body.appendChild(a);a.click();document.body.removeChild(a);toast('Abrindo AnyDesk…','⚡','t-blue');};
window.copyAnyDeskId=()=>{if(!_cid){toast('Nenhum ID!','⚠️','t-yellow');return;}copyText(_cid,'ID AnyDesk copiado!');};

/* ══ COMPUTADORES ══ */
window.openEditComp=(uk,ck)=>{
  const unit=_units.find(u=>u.key===uk),comp=unit?.computers.find(c=>c.key===ck);if(!comp)return;
  document.getElementById('editComp_uk').value=uk;document.getElementById('editComp_ck').value=ck;
  document.getElementById('editComp_title').textContent=comp.name;
  document.getElementById('ec_name').value=comp.name||'';document.getElementById('ec_anydesk').value=comp.anydesk||'';
  document.getElementById('ec_ip').value=comp.ip||'';document.getElementById('ec_serial').value=comp.serial||'';document.getElementById('ec_obs').value=comp.obs||'';
  openModal('m_editComp');
};
window.saveComp=async()=>{
  const uk=document.getElementById('editComp_uk').value,ck=document.getElementById('editComp_ck').value;
  const unit=_units.find(u=>u.key===uk),comp=unit?.computers.find(c=>c.key===ck);if(!comp)return;
  const n=document.getElementById('ec_name').value.trim();
  comp.name=(n||comp.name).toUpperCase();comp.anydesk=document.getElementById('ec_anydesk').value.trim();
  comp.ip=document.getElementById('ec_ip').value.trim();comp.serial=document.getElementById('ec_serial').value.trim();comp.obs=document.getElementById('ec_obs').value.trim();
  addLog('success',`PC editado: ${comp.name} (${unit.name})`,'edit');
  closeModal('m_editComp');render();restoreOpen();
  try{await fsSaveUnits();toast('Salvo!','✅','t-green');}catch{}
};
window.openAddComp=(preUk)=>{
  const sel=document.getElementById('ac_unit');sel.innerHTML=_units.map(u=>`<option value="${u.key}">${u.name}</option>`).join('');
  if(preUk)sel.value=preUk;
  ['ac_name','ac_anydesk','ac_ip','ac_serial','ac_obs'].forEach(id=>document.getElementById(id).value='');
  openModal('m_addComp');
};
window.addComp=async()=>{
  const uk=document.getElementById('ac_unit').value,name=document.getElementById('ac_name').value.trim();
  if(!name){toast('Informe o nome!','⚠️','t-yellow');return;}
  const unit=_units.find(u=>u.key===uk);if(!unit)return;if(!unit.computers)unit.computers=[];
  unit.computers.push({key:'c'+Date.now(),name:name.toUpperCase(),anydesk:document.getElementById('ac_anydesk').value.trim(),ip:document.getElementById('ac_ip').value.trim(),serial:document.getElementById('ac_serial').value.trim(),obs:document.getElementById('ac_obs').value.trim()});
  addLog('success',`PC adicionado: ${name.toUpperCase()} (${unit.name})`,'edit');
  openUnits[uk]=true;openTabs[uk]='computers';closeModal('m_addComp');render();restoreOpen();
  try{await fsSaveUnits();toast('Computador adicionado!','✅','t-green');}catch{}
};
window.deleteComp=async(uk,ck)=>{
  const unit=_units.find(u=>u.key===uk);if(!unit)return;
  const comp=unit.computers.find(c=>c.key===ck);
  if(!confirm(`Remover "${comp?.name}"?`))return;
  addLog('warn',`PC removido: ${comp?.name} (${unit.name})`,'edit');
  unit.computers=unit.computers.filter(c=>c.key!==ck);render();restoreOpen();
  try{await fsSaveUnits();toast('Removido.','🗑️','t-red');}catch{}
};

/* ══ UNIDADES ══ */
window.addUnit=async()=>{
  const name=document.getElementById('au_name').value.trim();if(!name){toast('Informe o nome!','⚠️','t-yellow');return;}
  const key='u'+Date.now();
  _units.push({key,name:name.toUpperCase(),desc:document.getElementById('au_desc').value.trim(),icon:document.getElementById('au_icon').value,color:document.getElementById('au_color').value,computers:[],insumos:[]});
  addLog('success',`Unidade criada: ${name.toUpperCase()}`,'edit');
  closeModal('m_addUnit');document.getElementById('au_name').value='';document.getElementById('au_desc').value='';
  openUnits[key]=true;render();restoreOpen();
  try{await fsSaveUnits();toast('Unidade criada!','✅','t-green');}catch{}
};
window.openEditUnit=(uk)=>{
  const unit=_units.find(u=>u.key===uk);if(!unit)return;
  document.getElementById('eu_key').value=uk;document.getElementById('eu_name').value=unit.name;
  document.getElementById('eu_desc').value=unit.desc||'';document.getElementById('eu_icon').value=unit.icon;document.getElementById('eu_color').value=unit.color;
  openModal('m_editUnit');
};
window.saveUnit=async()=>{
  const uk=document.getElementById('eu_key').value,unit=_units.find(u=>u.key===uk);if(!unit)return;
  const n=document.getElementById('eu_name').value.trim();
  unit.name=(n||unit.name).toUpperCase();unit.desc=document.getElementById('eu_desc').value.trim();
  unit.icon=document.getElementById('eu_icon').value;unit.color=document.getElementById('eu_color').value;
  addLog('info',`Unidade editada: ${unit.name}`,'edit');
  closeModal('m_editUnit');render();restoreOpen();
  try{await fsSaveUnits();toast('Unidade salva!','✅','t-green');}catch{}
};
window.deleteUnit=async(uk)=>{
  const unit=_units.find(u=>u.key===uk);
  if(!confirm(`Remover "${unit?.name}" e todos os dados?`))return;
  addLog('danger',`Unidade removida: ${unit?.name}`,'edit');
  _units=_units.filter(u=>u.key!==uk);render();
  try{await fsSaveUnits();toast('Removida.','🗑️','t-red');}catch{}
};

/* ══ INSUMOS ══ */
window.openAddInsumo=(preUk)=>{
  const sel=document.getElementById('ei_unit');sel.innerHTML=_units.map(u=>`<option value="${u.key}">${u.name}</option>`).join('');
  if(preUk)sel.value=preUk;sel.disabled=false;
  document.getElementById('ei_uk').value='';document.getElementById('ei_ik').value='';
  document.getElementById('ei_title').textContent='Novo Insumo / Toner';
  ['ei_name','ei_model','ei_obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ei_qty').value='0';document.getElementById('ei_min').value='2';
  openModal('m_editInsumo');
};
window.openEditInsumo=(uk,ik)=>{
  const unit=_units.find(u=>u.key===uk),ins=unit?.insumos?.find(i=>i.key===ik);if(!ins)return;
  const sel=document.getElementById('ei_unit');sel.innerHTML=_units.map(u=>`<option value="${u.key}">${u.name}</option>`).join('');
  sel.value=uk;sel.disabled=true;
  document.getElementById('ei_uk').value=uk;document.getElementById('ei_ik').value=ik;
  document.getElementById('ei_title').textContent='Editar: '+ins.name;
  document.getElementById('ei_name').value=ins.name||'';document.getElementById('ei_model').value=ins.model||'';
  document.getElementById('ei_qty').value=ins.qty??0;document.getElementById('ei_min').value=ins.min??2;
  document.getElementById('ei_obs').value=ins.obs||'';
  openModal('m_editInsumo');
};
window.saveInsumo=async()=>{
  const uk=document.getElementById('ei_uk').value,ik=document.getElementById('ei_ik').value;
  const name=document.getElementById('ei_name').value.trim();if(!name){toast('Informe o nome!','⚠️','t-yellow');return;}
  if(ik){
    const unit=_units.find(u=>u.key===uk),ins=unit?.insumos?.find(i=>i.key===ik);if(!ins)return;
    ins.name=name;ins.model=document.getElementById('ei_model').value.trim();
    ins.qty=parseInt(document.getElementById('ei_qty').value)||0;ins.min=parseInt(document.getElementById('ei_min').value)||0;ins.obs=document.getElementById('ei_obs').value.trim();
    addLog('info',`Insumo editado: ${name} (${unit.name})`,'stock');
  }else{
    const selUk=document.getElementById('ei_unit').value,unit=_units.find(u=>u.key===selUk);if(!unit)return;
    if(!unit.insumos)unit.insumos=[];
    unit.insumos.push({key:'i'+Date.now(),name,model:document.getElementById('ei_model').value.trim(),qty:parseInt(document.getElementById('ei_qty').value)||0,min:parseInt(document.getElementById('ei_min').value)||0,obs:document.getElementById('ei_obs').value.trim()});
    openUnits[selUk]=true;openTabs[selUk]='insumos';
    addLog('success',`Insumo adicionado: ${name} (${unit.name})`,'stock');
  }
  closeModal('m_editInsumo');render();restoreOpen();
  try{await fsSaveUnits();toast('Insumo salvo!','✅','t-green');}catch{}
};
window.adjustQty=async(uk,ik,delta)=>{
  const unit=_units.find(u=>u.key===uk),ins=unit?.insumos?.find(i=>i.key===ik);if(!ins)return;
  const old=ins.qty;
  ins.qty=Math.max(0,(ins.qty||0)+delta);render();restoreOpen();
  if(ins.qty===0){
    toast('⚠️ '+ins.name+' ESGOTADO!','🔴','t-red');
    addLog('danger',`ESGOTADO: ${ins.name} (${unit.name})`,'alert');
  } else if(ins.qty<=ins.min&&old>ins.min){
    toast('Estoque baixo: '+ins.name,'⚠️','t-yellow');
    addLog('warn',`Estoque baixo: ${ins.name} → ${ins.qty} un. (${unit.name})`,'alert');
  } else {
    addLog('info',`Estoque ajustado: ${ins.name} → ${ins.qty} un. (${unit.name})`,'stock');
  }
  try{await fsSaveUnits();}catch{}
};
window.deleteInsumo=async(uk,ik)=>{
  const unit=_units.find(u=>u.key===uk);if(!unit)return;
  const ins=unit.insumos.find(i=>i.key===ik);
  if(!confirm(`Remover "${ins?.name}"?`))return;
  addLog('warn',`Insumo removido: ${ins?.name} (${unit.name})`,'stock');
  unit.insumos=unit.insumos.filter(i=>i.key!==ik);render();restoreOpen();
  try{await fsSaveUnits();toast('Removido.','🗑️','t-red');}catch{}
};

/* ══ USUÁRIOS ══ */
window.renderUsers=()=>{
  document.getElementById('usersList').innerHTML=_users.map(u=>`
    <div class="user-row">
      <span class="user-uname">${u.username}</span>
      <span class="h-badge ${u.role==='admin'?'badge-admin':'badge-tech'}">${u.role==='admin'?'ADMIN':'TÉCNICO'}</span>
      <div class="user-actions">
        <button class="btn btn-ghost btn-sm" onclick="openChangePass('${u.username}')">🔑</button>
        ${u.username!=='admin'?`<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.username}')">✕</button>`:''}
      </div>
    </div>`).join('');
};
window.addUser=async()=>{
  const name=document.getElementById('nu_name').value.trim(),pass=document.getElementById('nu_pass').value,role=document.getElementById('nu_role').value;
  if(!name||!pass){toast('Preencha todos os campos!','⚠️','t-yellow');return;}
  if(_users.find(u=>u.username===name)){toast('Usuário já existe!','⚠️','t-yellow');return;}
  _users.push({username:name,password:pass,role});
  document.getElementById('nu_name').value='';document.getElementById('nu_pass').value='';
  addLog('info',`Usuário criado: ${name} (${role})`,'edit');
  renderUsers();
  try{await fsSaveUsers();toast('Usuário criado!','✅','t-green');}catch{}
};
window.deleteUser=async(name)=>{
  if(!confirm(`Remover "${name}"?`))return;
  _users=_users.filter(u=>u.username!==name);
  addLog('warn',`Usuário removido: ${name}`,'edit');
  renderUsers();
  try{await fsSaveUsers();toast('Removido.','🗑️','t-red');}catch{}
};
window.openChangePass=(username)=>{
  document.getElementById('cp_username').value=username;document.getElementById('cp_display').value=username;
  document.getElementById('cp_pass').value='';document.getElementById('cp_pass2').value='';
  openModal('m_changePass');
};
window.doChangePass=async()=>{
  const username=document.getElementById('cp_username').value;
  const p1=document.getElementById('cp_pass').value,p2=document.getElementById('cp_pass2').value;
  if(!p1){toast('Digite a nova senha!','⚠️','t-yellow');return;}
  if(p1!==p2){toast('As senhas não coincidem!','⚠️','t-yellow');return;}
  const u=_users.find(x=>x.username===username);if(!u)return;
  u.password=p1;closeModal('m_changePass');
  addLog('warn',`Senha alterada: ${username}`,'edit');
  try{await fsSaveUsers();toast('Senha alterada!','✅','t-green');}catch{}
};

/* ══ MODAIS ══ */
window.openModal=(id)=>{if(id==='m_users')renderUsers();document.getElementById(id)?.classList.add('show');};
window.closeModal=(id)=>document.getElementById(id)?.classList.remove('show');
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show');}));

/* ══ EXPORT ══ */
window.exportInventory=()=>{
  const rows=[['UNIDADE','TIPO','NOME','MODELO/ID','QTD/IP','SERIAL','STATUS','OBS']];
  _units.forEach(u=>{
    (u.computers||[]).forEach(c=>{
      rows.push([u.name,'COMPUTADOR',c.name,c.anydesk||'',c.ip||'',c.serial||'','ATIVO',c.obs||'']);
    });
    (u.insumos||[]).forEach(i=>{
      const status=i.qty===0?'ESGOTADO':i.qty<=i.min?'ESTOQUE BAIXO':'OK';
      rows.push([u.name,'INSUMO/TONER',i.name,i.model||'',i.qty,'',status,i.obs||'']);
    });
  });
  
  // Adicionar itens de estoque central
  if(window.stockItems && window.stockItems.length > 0){
    rows.push(['','','','','','','','']); // linha vazia
    rows.push(['ESTOQUE CENTRAL','EQUIPAMENTO CENTRAL','','','','','','']);
    window.stockItems.forEach(item=>{
      const unit=_units.find(u=>u.key===item.unit);
      rows.push([unit?unit.name:item.unit,'EQUIPAMENTO',item.name,item.patrimonio||'',item.serial||'',item.ip||'','ATIVO',item.local+' - '+item.obs]);
    });
  }
  
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const bom='\uFEFF';
  const blob=new Blob([bom+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='ggtech_inventario_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  addLog('info','Inventário exportado (CSV)','edit');
  toast('Inventário exportado!','📥','t-green');
};

window.exportInventoryJSON=()=>{
  const data={
    exportedAt:new Date().toISOString(),
    units:_units.map(u=>({
      name:u.name,icon:u.icon,desc:u.desc,
      computers:(u.computers||[]).map(c=>({name:c.name,anydesk:c.anydesk,ip:c.ip,serial:c.serial,obs:c.obs})),
      insumos:(u.insumos||[]).map(i=>({name:i.name,model:i.model,qty:i.qty,min:i.min,status:i.qty===0?'ESGOTADO':i.qty<=i.min?'BAIXO':'OK',obs:i.obs}))
    })),
    estoqueCentral:window.stockItems?window.stockItems.map(item=>{
      const unit=_units.find(u=>u.key===item.unit);
      return {
        id:item.id,
        unidade:unit?unit.name:item.unit,
        nome:item.name,
        patrimonio:item.patrimonio,
        serial:item.serial,
        ip:item.ip,
        local:item.local,
        observacao:item.obs,
        dataAdicao:new Date(parseInt(item.id.replace('stk_',''))).toLocaleString('pt-BR')
      };
    }):[]
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='ggtech_inventario_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  addLog('info','Inventário exportado (JSON)','edit');
  toast('JSON exportado!','📄','t-green');
};

/* ══ UTILS ══ */
window.copyText=(text,msg)=>{
  navigator.clipboard?.writeText(text).then(()=>toast(msg||'Copiado!','📋','t-blue')).catch(()=>fbCopy(text,msg))||fbCopy(text,msg);
};
function fbCopy(text,msg){const el=document.createElement('textarea');el.value=text;el.style.cssText='position:fixed;opacity:0';document.body.appendChild(el);el.focus();el.select();try{document.execCommand('copy');toast(msg||'Copiado!','📋','t-blue');}catch{}document.body.removeChild(el);}
let _tt;
window.toast=(msg,icon,cls)=>{
  const el=document.getElementById('toast');el.className='toast '+(cls||'t-blue');
  document.getElementById('toast_msg').textContent=msg;document.getElementById('toast_icon').textContent=icon||'✅';
  el.classList.add('show');clearTimeout(_tt);_tt=setTimeout(()=>el.classList.remove('show'),3200);
};

boot();


/* ===== MELHORIAS CUSTOM ===== */
const originalLogin = window.doLogin;

window.doLogin = () => {
  originalLogin();

  if(CU && CU.role === 'tech'){
    const navLogs = document.getElementById('nav-logs');
    const navAlerts = document.getElementById('nav-alerts');

    if(navLogs) navLogs.style.display = 'none';
    if(navAlerts) navAlerts.style.display = 'none';
  }

  setupDashboardActions();
};

function setupDashboardActions(){
  const cards = document.querySelectorAll('.dash-stat');

  if(cards[0]) cards[0].onclick = ()=>showPage('units');
  if(cards[1]) cards[1].onclick = ()=>showPage('units');
  if(cards[2]) cards[2].onclick = ()=>showPage('stock');
  if(cards[3]) cards[3].onclick = ()=>showPage('stock');
}

window.addEventListener('resize',()=>{
  document.body.style.zoom = '100%';
});


/* ===== ESTOQUE FUNCIONAL ===== */

// stockItems é carregado pelo fsLoad() no boot — sem localStorage
if(!window.stockItems) window.stockItems = [];

function persistStock(){
  fsSaveStock().catch(e=>console.warn('Stock save err',e));
}

window.openStockModal = function(itemId=null){
  const unitSelect = document.getElementById('stockUnit');
  unitSelect.innerHTML = _units.map(u =>
    `<option value="${u.key}">${u.name}</option>`
  ).join('');

  if(itemId){
    const item = window.stockItems.find(i=>i.id===itemId);
    if(item){
      stockEditId.value = item.id;
      stockUnit.value = item.unit;
      stockName.value = item.name;
      stockPatrimonio.value = item.patrimonio || '';
      stockSerial.value = item.serial || '';
      stockIp.value = item.ip || '';
      stockLocal.value = item.local || '';
      stockObs.value = item.obs || '';
    }
  } else {
    stockEditId.value = '';
    stockName.value = '';
    stockPatrimonio.value = '';
    stockSerial.value = '';
    stockIp.value = '';
    stockLocal.value = '';
    stockObs.value = '';
  }

  openModal('m_stockItem');
};

window.saveStockItem = function(){
  const data = {
    id: stockEditId.value || 'stk_'+Date.now(),
    unit: stockUnit.value,
    name: stockName.value,
    patrimonio: stockPatrimonio.value,
    serial: stockSerial.value,
    ip: stockIp.value,
    local: stockLocal.value,
    obs: stockObs.value
  };

  const idx = window.stockItems.findIndex(i=>i.id===data.id);

  if(idx >= 0){
    window.stockItems[idx] = data;
  } else {
    window.stockItems.push(data);
  }

  persistStock();
  renderStockPage();
  closeModal('m_stockItem');
};

window.deleteStockItem = function(id){
  if(!confirm('Excluir item?')) return;

  window.stockItems = window.stockItems.filter(i=>i.id !== id);

  persistStock();
  renderStockPage();
};

window.renderStockPage = function(){
  const filter = document.getElementById('stockUnitFilter');
  const container = document.getElementById('stockItemsContainer');

  if(!filter || !container) return;

  // Manter o valor selecionado se houver
  const currentValue = filter.value;
  
  filter.innerHTML = '<option value="all">Todas as unidades</option>' +
    _units.map(u=>`<option value="${u.key}">${u.name}</option>`).join('');

  // Restaurar valor selecionado ou usar 'all'
  filter.value = currentValue || 'all';
  
  const selected = filter.value;

  let items = window.stockItems;

  if(selected !== 'all'){
    items = items.filter(i=>i.unit === selected);
  }

  if(items.length === 0){
    container.innerHTML = '<div class="empty-state"><div class="icon">📦</div>Nenhum item encontrado</div>';
    return;
  }

  // Renderizar como tabela compacta
  const tableHTML = `
    <div class="stock-table-wrapper">
      <table class="stock-table">
        <thead>
          <tr>
            <th>ITEM</th>
            <th>PATRIMÔNIO</th>
            <th>SÉRIE</th>
            <th>IP</th>
            <th>LOCAL</th>
            <th>OBS</th>
            <th>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const unit = _units.find(u=>u.key===item.unit);
            return `
              <tr>
                <td class="cell-name">${item.name}</td>
                <td>${item.patrimonio || '-'}</td>
                <td class="cell-serial">${item.serial || '-'}</td>
                <td class="cell-ip">${item.ip || '-'}</td>
                <td>${item.local || '-'}</td>
                <td class="cell-obs">${item.obs || '-'}</td>
                <td class="cell-actions">
                  <button class="btn-icon" onclick="openStockModal('${item.id}')" title="Editar">✏️</button>
                  <button class="btn-icon btn-danger" onclick="deleteStockItem('${item.id}')" title="Excluir">🗑️</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHTML;
};

const oldShowPage = window.showPage;

window.showPage = function(page){
  oldShowPage(page);

  if(page === 'stock'){
    setTimeout(renderStockPage,100);
  }
};
