
window.generateAlerts = function(){

  try{

    if(!window._units) return;

    const alertsBox = document.getElementById('alertsBox');

    if(!alertsBox) return;

    const alerts = [];

    _units.forEach(u=>{

      (u.insumos || []).forEach(i=>{

        if(Number(i.qty || 0) <= Number(i.min || 5)){
          alerts.push(`⚠ Estoque baixo: ${i.nome}`);
        }

      });

    });

    alertsBox.innerHTML = alerts.map(a=>`
      <div class="alert-card">${a}</div>
    `).join('');

    const alertCount = document.getElementById('dashAlerts');

    if(alertCount){
      alertCount.innerText = alerts.length;
    }

  }catch(e){
    console.error(e);
  }

}

window.updateDashboard = function(){

  try{

    if(!window._units) return;

    const totalUnits = _units.length;

    let totalPCs = 0;

    _units.forEach(u=>{
      totalPCs += (u.computadores || []).length;
    });

    const unitsEl = document.getElementById('dashUnits');
    const pcsEl = document.getElementById('dashPCs');

    if(unitsEl){
      unitsEl.innerText = totalUnits;
    }

    if(pcsEl){
      pcsEl.innerText = totalPCs;
    }

  }catch(e){
    console.error(e);
  }

}

window.exportInventory = function(){

  try{

    if(!window._units || !_units.length){
      alert('Nenhum inventário carregado.');
      return;
    }

    const blob = new Blob(
      [JSON.stringify(_units,null,2)],
      {type:'application/json'}
    );

    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.download = 'inventario.json';
    a.click();

  }catch(e){
    console.error(e);
  }

}

window.addEventListener('load',()=>{

  setTimeout(()=>{

    if(window.generateAlerts){
      generateAlerts();
    }

    if(window.updateDashboard){
      updateDashboard();
    }

  },1500);

});
