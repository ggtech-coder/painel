// ===== EXPORTAÇÃO JSON/EXCEL =====

window.exportInventory=()=>{

  const data = JSON.stringify(_units,null,2);

  const blob = new Blob([data],{
    type:'application/json'
  });

  const a = document.createElement('a');

  a.href = URL.createObjectURL(blob);
  a.download = 'inventario.json';
  a.click();
};
