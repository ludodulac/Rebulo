const QRCODE_ESM_URL='https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm';

export const SESSION_QR_OPTIONS={errorCorrectionLevel:'M',margin:2,width:280,color:{dark:'#24123f',light:'#ffffff'}};

async function loadQrCode(){const module=await import(QRCODE_ESM_URL);const qr=module.default||module;if(typeof qr?.toCanvas!=='function')throw new Error('qrcode_unavailable');return qr;}

export async function renderSessionQr(canvas,url,encoder=null){
  const value=String(url||'');
  if(!canvas||!value)throw new Error('missing_session_qr');
  const qr=encoder||await loadQrCode();
  if(typeof qr?.toCanvas!=='function')throw new Error('qrcode_unavailable');
  await qr.toCanvas(canvas,value,SESSION_QR_OPTIONS);
  return value;
}
