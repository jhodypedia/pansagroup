// init socket.io
const socket = io();

// CSRF helper
let CSRF = null;
function getCsrf(){
  if (CSRF) return CSRF;
  const m = document.querySelector('meta[name="csrf-token"]');
  CSRF = m ? m.getAttribute("content") : null;
  return CSRF;
}

// Global AJAX form handler
document.addEventListener("submit", async (e)=>{
  const f=e.target;
  if(!f.dataset.ajax) return;
  e.preventDefault();

  const fd=new FormData(f);
  const res=await fetch(f.action,{
    method: f.method || "POST",
    headers: { "x-csrf-token": getCsrf() || "" },
    body: fd
  });
  let j={success:false,message:"Gagal"};
  try{ j=await res.json(); }catch{}
  showAlert(j.success?"success":"danger", j.message||"OK");
  if(j.redirect) setTimeout(()=>location.href=j.redirect, 700);
  if(j.refresh)  setTimeout(()=>location.reload(), 500);
});

// Inline alerts
function showAlert(type,msg, containerId){
  const wrap = document.getElementById(containerId||"alerts") 
    || document.getElementById("videoStatus") 
    || document.getElementById("liveStatus") 
    || document.body;
  const d=document.createElement("div");
  d.className=`alert alert-${type} mb-2`;
  d.innerHTML=`<i class="fa fa-info-circle"></i> ${msg}`;
  wrap.prepend(d);
  setTimeout(()=>d.remove(),6000);
}

// ========== SOCKET EVENTS ==========

// Video upload status
socket.on("video_status", d=>{
  showAlert(
    d.status==="uploaded"?"success":"danger",
    `Video ${d.title||""}: ${d.status}${d.youtubeId?` (${d.youtubeId})`:""}`
  );
});

// Live status
socket.on("live_status", d=>{
  showAlert("info",`Live "${d.title||""}" status: ${d.status}`);
});

// ========== WHATSAPP (Admin) ==========

// WA QR code render via QRCode.js (CDN)
const waQRBox   = document.getElementById("wa-qr-img");
const waCodeBox = document.getElementById("wa-pairing-code");

socket.on("wa_qr", qr=>{
  if(waQRBox){
    waQRBox.innerHTML = ""; // reset
    new QRCode(waQRBox, {
      text: qr,
      width: 260,
      height: 260,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }
  showAlert("info","QR WhatsApp diterima. Scan via WhatsApp di HP.", "admin-wa-alerts");
});

socket.on("wa_pairing", code=>{
  if(waCodeBox){
    waCodeBox.textContent = code;
    waCodeBox.classList.remove("text-muted");
  }
  showAlert("info","Pairing code diterima.", "admin-wa-alerts");
});

socket.on("wa_ready", u=>{
  showAlert("success","WhatsApp tersambung: "+(u?.user?.id||""), "admin-wa-alerts");
});

socket.on("wa_logout", ()=>{
  showAlert("danger","WhatsApp logout", "admin-wa-alerts");
});
