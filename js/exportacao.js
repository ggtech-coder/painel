
window.exportInventory = function(){

  try{

    const data = JSON.stringify(window._units || [], null, 2);

    const blob = new Blob([data],{
      type:'application/json'
    });

    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.download = 'inventario.json';
    a.click();

  }catch(e){
    console.error(e);
  }

}
