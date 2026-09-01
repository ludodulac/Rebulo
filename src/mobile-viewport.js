const root=document.documentElement;
const body=document.body;
const viewport=window.visualViewport;

function updateViewport(){
  const height=viewport?.height||window.innerHeight;
  root.style.setProperty('--app-vh',`${Math.round(height)}px`);
  const keyboardOpen=Boolean(viewport&&window.innerHeight-height>120);
  body.classList.toggle('keyboard-open',keyboardOpen);
}

updateViewport();
viewport?.addEventListener('resize',updateViewport,{passive:true});
viewport?.addEventListener('scroll',updateViewport,{passive:true});
window.addEventListener('resize',updateViewport,{passive:true});

document.addEventListener('focusin',event=>{
  if(event.target.matches('input,select,textarea'))window.setTimeout(updateViewport,40);
});
document.addEventListener('focusout',()=>window.setTimeout(updateViewport,120));
