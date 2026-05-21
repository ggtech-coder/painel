// ===== LOGS DE AUDITORIA =====

async function logAction(action){
  try{

    const log = {
      action,
      user: CU?.username || 'desconhecido',
      role: CU?.role || 'unknown',
      createdAt: new Date().toISOString()
    };

    const snap = await getDocs(collection(db,'logs'));
    const id = 'l'+crypto.randomUUID();

    await setDoc(doc(db,'logs',id),{
      key:id,
      ...log
    });

  }catch(e){
    console.error('Erro log:',e);
  }
}

// EXEMPLOS:

// await logAction('Computador removido');
// await logAction('Estoque alterado');
// await logAction('Usuário criou insumo');
