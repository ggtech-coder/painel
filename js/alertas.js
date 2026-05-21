// ===== ALERTAS AUTOMÁTICOS =====

function generateAlerts(){

  const alerts = [];

  _units.forEach(u=>{

    (u.insumos||[]).forEach(i=>{

      if(Number(i.qty)<=Number(i.min || 5)){
        alerts.push({
          type:'estoque',
          text:`Estoque baixo: ${i.nome}`
        });
      }

    });

    (u.computadores||[]).forEach(c=>{

      if(c.status==='offline'){
        alerts.push({
          type:'offline',
          text:`Computador offline: ${c.nome}`
        });
      }

    });

  });

  renderAlerts(alerts);
}

function renderAlerts(alerts){

  const el = document.getElementById('alertsBox');

  if(!el) return;

  el.innerHTML = alerts.map(a=>`
    <div class="alert-card">
      ⚠ ${a.text}
    </div>
  `).join('');

}
