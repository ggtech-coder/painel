
window.logAction = async function(action){

  try{

    const log = {
      action,
      user: window.CU?.username || 'desconhecido',
      role: window.CU?.role || 'unknown',
      createdAt: new Date().toISOString()
    };

    console.log('[LOG]',log);

    if(window.db && window.collection && window.setDoc && window.doc){

      const id = 'l'+crypto.randomUUID();

      await setDoc(
        doc(db,'logs',id),
        {
          key:id,
          ...log
        }
      );

    }

  }catch(e){
    console.error(e);
  }

}
