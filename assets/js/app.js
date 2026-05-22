
const role = 'admin';

function showPage(page){
  document.querySelectorAll('.page').forEach(p=>{
    p.classList.remove('active');
  });

  document.getElementById(page).classList.add('active');
}

if(role !== 'admin'){
  document.querySelectorAll('.admin-only').forEach(el=>{
    el.style.display = 'none';
  });
}
