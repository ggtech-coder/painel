
window.generateAlerts = function(){

  try{

    const el = document.getElementById('alertsBox');

    if(!el || !window._units) return;

    const alerts = [];

    _units.forEach(u=>{

      (u.insumos || []).forEach(i=>{

        if(Number(i.qty || 0) <= Number(i.min || 5)){
          alerts.push(`⚠ Estoque baixo: ${i.nome || 'Insumo'}`);
        }

      });

    });

    el.innerHTML = alerts.map(a=>`
      <div style="
        padding:12px;
        margin-bottom:10px;
        border-radius:12px;
        background:rgba(255,140,0,.12);
        border:1px solid rgba(255,140,0,.35);
      ">
        ${a}
      </div>
    `).join('');

  }catch(e){
    console.error(e);
  }

}
