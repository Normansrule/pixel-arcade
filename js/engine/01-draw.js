/* PIXEL ARCADE engine · Draw helpers: HD-aware rect/circle/line/poly, cached backdrops, bitmap font. */
(function(){
'use strict';
const A=window.A,E=A._e,{W,H,K}=A;

/* ---------- drawing ---------- */
const bgC=new Map();E.bgC=bgC;
function mkBg(col,def){try{const s=A.scale||2,cv=document.createElement('canvas');cv.width=W*s;cv.height=H*s;const x=cv.getContext('2d');x.scale(s,s);const n=parseInt(col.slice(1),16),r=n>>16,gg=(n>>8)&255,b=n&255,la=(f,a)=>{const m=v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0;return'rgba('+m(r)+','+m(gg)+','+m(b)+','+a+')';};
 let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,E.lift(col,1.2));gr.addColorStop(.55,col);gr.addColorStop(1,E.lift(col,.66));x.fillStyle=gr;x.fillRect(0,0,W,H);
 gr=x.createRadialGradient(W/2,-30,10,W/2,-30,250);gr.addColorStop(0,la(1.55,.32));gr.addColorStop(1,la(1.55,0));x.fillStyle=gr;x.fillRect(0,0,W,H);
 if(def){x.fillStyle='rgba(255,255,255,.045)';for(let yy=8;yy<H;yy+=16)for(let xx=8;xx<W;xx+=16)x.fillRect(xx-.5,yy-.5,1,1);}
 gr=x.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*1.05);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.32)');x.fillStyle=gr;x.fillRect(0,0,W,H);return{cv,s};}catch(e){return null;}}
A.cls=col=>{col=col||K.bg;const c=A.c;if(A.hd&&A.gfx!=='off'&&col[0]==='#'&&col.length===7&&c.drawImage&&typeof document!=='undefined'){let b=bgC.get(col);if(!b||b.s!==A.scale){b=mkBg(col,col===K.bg);if(bgC.size>10)bgC.clear();bgC.set(col,b);}if(b){c.drawImage(b.cv,0,0,W,H);return;}}
 if(A.hdOn&&col[0]==='#'&&col.length===7&&c.createLinearGradient){const g=c.createLinearGradient(0,0,0,H);if(g&&g.addColorStop){g.addColorStop(0,E.lift(col,1.18));g.addColorStop(1,E.lift(col,.72));c.fillStyle=g;}else c.fillStyle=col;}else c.fillStyle=col;c.fillRect(0,0,W,H);};
A.rect=(x,y,w,h,col)=>{const c=A.c;x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);c.fillStyle=col;c.fillRect(x,y,w,h);if(A.hdOn&&w>=5&&h>=5&&w<=110&&h<=110&&typeof col==='string'&&col[0]==='#'&&col.length===7){c.fillStyle=E.lift(col,1.4);c.fillRect(x,y,w,1);c.fillRect(x,y,1,h);c.fillStyle=E.lift(col,.6);c.fillRect(x,y+h-1,w,1);c.fillRect(x+w-1,y,1,h);}};
A.box=(x,y,w,h,col)=>{A.rect(x,y,w,1,col);A.rect(x,y+h-1,w,1,col);A.rect(x,y,1,h,col);A.rect(x+w-1,y,1,h,col);};
const gcache=new Map();const lift0=(h,f)=>{const n=parseInt(h.slice(1),16);const r=n>>16,g=(n>>8)&255,b=n&255;const m=v=>Math.max(0,Math.min(255,f>1?v+(255-v)*(f-1):v*f))|0;return`rgb(${m(r)},${m(g)},${m(b)})`;};
A.circ=(x,y,r,col)=>{const c=A.c;r=Math.max(r,.5);if(A.hdOn&&r>=3&&typeof col==='string'&&col[0]==='#'&&col.length===7&&c.createRadialGradient){const gr=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);if(gr&&gr.addColorStop){gr.addColorStop(0,E.lift(col,1.45));gr.addColorStop(.55,col);gr.addColorStop(1,E.lift(col,.55));c.fillStyle=gr;}else c.fillStyle=col;}else c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.2832);c.fill();};
A.ring=(x,y,r,col)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.arc(x,y,Math.max(r,.5),0,6.2832);c.stroke();};
A.line=(x1,y1,x2,y2,col,w)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=w||1;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
A.poly=(pts,col,fill)=>{const c=A.c;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=col;c.fill();}else{c.strokeStyle=col;c.lineWidth=1;c.stroke();}};
const FONT={A:'25755',B:'65656',C:'34443',D:'65556',E:'74647',F:'74644',G:'34553',H:'55755',I:'72227',J:'11152',K:'55655',L:'44447',M:'57755',N:'65555',O:'75557',P:'65644',Q:'25563',R:'65655',S:'34216',T:'72222',U:'55557',V:'55552',W:'55775',X:'55255',Y:'55222',Z:'71247','0':'25552','1':'26227','2':'61247','3':'61216','4':'55711','5':'74616','6':'34757','7':'71222','8':'75757','9':'75716','.':'00002',':':'02020','-':'00700','!':'22202','?':'61202','/':'11244','+':'02720','>':'42124','<':'12421',',':'00024',"'":'22000','(':'24442',')':'21112','%':'51245','=':'07070','*':'05250','$':'37276','#':'57575','_':'00007'};
const G={};for(const k in FONT){G[k]=[];for(let r=0;r<5;r++){const b=+FONT[k][r];for(let c=0;c<3;c++)if(b&(4>>c))G[k].push([c,r]);}}
A.text=(s,x,y,col,sc,al,noSh)=>{s=String(s).toUpperCase();sc=sc||1;const w=s.length*4*sc-sc;if(al==='c')x-=w/2;else if(al==='r')x-=w;x=Math.round(x);y=Math.round(y);if(!noSh&&sc>=2){A.c.fillStyle='rgba(0,0,0,.55)';let xx=x;for(const ch of s){const g=G[ch];if(g)for(const p of g)A.c.fillRect(xx+p[0]*sc+sc/2,y+p[1]*sc+sc/2,sc,sc);xx+=4*sc;}}A.c.fillStyle=col||K.w;for(const ch of s){const g=G[ch];if(g)for(const p of g)A.c.fillRect(x+p[0]*sc,y+p[1]*sc,sc,sc);x+=4*sc;}};
A.hud2=(a,b)=>{A.text(A.nm(0)+' '+a,6,4,K.c,2);A.text(b+' '+A.nm(1),W-6,4,K.p,2,'r');};
})();
