// SILENT CONTRACT — the gala's cast: two targets with timed routines (host DARIO VANE: greeting, terrace, toast under the chandelier,
// nightcap in the study, cellar tasting; broker INES CORVO: terrace bar, cliff lookout, the pier, the boathouse, the gazebo, the
// ballroom), guests in conversation groups, the quartet, waiters on tray runs, kitchen brigade, sommelier, grounds crew, outside
// staff, and security posts and patrols that scale with difficulty.
const PI=Math.PI;
export function makeCast(diff,low){const C=[];let id=0;const add=o=>{o.id=id++;C.push(o);return o;};
 const toward=(x,z,cx,cz)=>Math.atan2(cx-x,cz-z);
 const group=(cx,cz,pts,o={})=>pts.forEach(([x,z],i)=>add({role:'guest',kind:'civ',look:'guest',seed:Math.round(cx*7+cz*13+i*31),x,z,yaw:toward(x,z,cx,cz),act:o.acts?o.acts[i%o.acts.length]:['talk','drink','idle'][i%3],speed:1.2,...o.extra}));
 /* ---- targets */
 const vane=add({role:'target',kind:'civ',look:'vane',name:'DARIO VANE',target:'vane',x:1.5,z:13.6,yaw:PI,speed:1.25,hp:100,routine:[
  {x:1.5,z:13.6,yaw:PI,act:'talk',dur:40,on:'vaneGarden'},{x:-8,z:4.6,yaw:-PI/2,act:'drink',dur:22},
  {x:0,z:-11.1,yaw:0,act:'speech',dur:42,on:'speechStart',off:'speechEnd'},{x:27.5,z:-11.5,yaw:PI/2,act:'idle',dur:26,during:'vaneDrink',off:'vaneDrinkEnd'},
  {x:-23.5,z:-38.6,yaw:PI,act:'drink',dur:32,on:'tasting'},{x:-2,z:-25,yaw:0,act:'talk',dur:14}]});
 const corvo=add({role:'target',kind:'civ',look:'corvo',name:'INES CORVO',target:'corvo',x:22,z:6.2,yaw:PI,speed:1.2,hp:100,routine:[
  {x:22,z:6.2,yaw:PI,act:'drink',dur:36},{x:14,z:29.7,yaw:0,act:'lean',dur:24},{x:55,z:65.7,yaw:0,act:'lean',dur:36,during:'corvoRail',on:'pierArrive'},
  {x:45.6,z:50.2,yaw:-PI/2,act:'talk',dur:18},{x:-30,z:18.3,yaw:0,act:'talk',dur:34},{x:6,z:-14,yaw:-PI/2,act:'drink',dur:26}]});
 /* ---- security (enforcers: gate senior, chief, Vane's bodyguard) */
 const G=(x,z,yaw,o={})=>add({role:'guard',kind:'guard',look:o.look||'guard',seed:Math.round(x*3+z*5),x,z,yaw,speed:1.45,hp:100,act:'idle',...o});
 const pat=(pts,dur=4)=>pts.map(([x,z,yaw])=>({x,z,yaw,act:'look',dur}));
 G(-4.5,-45,PI,{enforcer:true,name:'GATE CAPTAIN'});G(4.5,-45,PI);
 G(4.5,-24,PI);G(23.5,-26.6,PI,{enforcer:true,name:'SECURITY CHIEF'});G(16,-11,-PI/2,{name:'STUDY GUARD'});
 G(51.5,28.6,PI,{look:'sentry'});G(-50,-43.5,PI,{look:'sentry'});
 G(32,49,0,{look:'sentry',routine:pat([[32,49,0],[58,49.5,0],[55,61,0]],5)});
 if(diff>0){G(-10,-36,0,{routine:pat([[-10,-36,0],[26,-36,0],[26,-43,PI]],5)});
  G(15.5,-29,0,{routine:pat([[15.5,-29,0],[15.5,-4,PI],[24,-18.6,PI/2]],4)});
  G(10,15,0,{look:'sentry',routine:pat([[10,15,0],[30,22,0],[46,15,0],[40,27,PI]],5)});
  G(46,-34,0,{look:'sentry',routine:pat([[46,-34,0],[55,-21,0],[39,-21,0]],6)});
  G(-40,-10,0,{look:'sentry',routine:pat([[-40,-10,0],[-40,-40,0],[-56,-30,0]],5)});
  G(0,0,0,{enforcer:true,name:'BODYGUARD',follow:vane.id,x:2.5,z:12});}
 G(-40,15,0,{look:'sentry',routine:pat([[-40,15,0],[-47,24,0],[-20,22,0],[-10,15.5,0]],5)});
 if(diff>1){G(0,6.5,0,{});G(-24,-36,0,{routine:pat([[-24,-36,0],[-18,-42,0],[-30,-42,0]],5)});G(20,3,0,{look:'sentry',follow:corvo.id,x:21,z:8,name:'CORVO\'S DRIVER'});G(-48,-24,0,{look:'sentry'});G(40,-6,0,{routine:pat([[40,-6,0],[56,4,0],[32,4,0]],5)});}
 /* ---- guests */
 group(-6.2,15.6,[[-7.3,14.6],[-5.2,15.2],[-6.6,16.8]]);group(7.2,16,[[6.2,14.8],[8.2,15],[7.8,17]]);group(-20.2,17,[[-21.2,16.2],[-19.1,16],[-20.2,18.1]]);
 group(16,17,[[15,16],[17.1,16.2],[16.4,18.2]]);group(-30,20,[[-31.6,18.6],[-28.5,21.5]]);group(12.6,28.4,[[11.6,29.2],[13.6,28.6]],{acts:['lean','drink']});
 group(-41,17.6,[[-41.8,17.8],[-40.2,18]],{acts:['drink','talk']});group(-19.5,5.2,[[-20.6,4.4],[-18.4,6]]);group(19.6,6.3,[[19.4,6.6]],{acts:['drink']});
 group(-5.6,-8,[[-6.4,-7.4],[-4.8,-8.6]]);group(5.4,-8.2,[[4.4,-7.6],[6.4,-7.6],[5.4,-9.2]]);group(-3,-18.6,[[-3.8,-18],[-2.2,-19.2]]);group(9.6,-27.2,[[9,-26.6],[10.4,-27.6]]);
 if(!low){group(28,-20+40,[[27.4,20.4],[28.6,19.6]]);group(-12,24,[[-12.8,23.6],[-11.2,24.4]]);group(2,-15.6,[[1.2,-15.2],[2.8,-16]]);group(36,2,[[35.2,2.4],[36.8,1.6]]);}
 // wandering couple
 add({role:'guest',kind:'civ',look:'guest',seed:77,x:-14,z:20,yaw:0,speed:1.1,routine:[{x:-14,z:20,act:'talk',dur:20},{x:24,z:24,act:'talk',dur:20},{x:10,z:4.5,act:'drink',dur:16},{x:-6,z:-5,act:'drink',dur:18}]});
 add({role:'guest',kind:'civ',look:'guest',seed:78,x:-13,z:21,yaw:0,speed:1.1,routine:[{x:-13,z:21,act:'drink',dur:20},{x:25,z:24.6,act:'talk',dur:20},{x:11,z:5,act:'talk',dur:16},{x:-5,z:-5.6,act:'talk',dur:18}]});
 // personal assistant (guest-list enforcer): gate, then the ballroom
 add({role:'pa',kind:'civ',look:'pa',name:'LUCIA, VANE\'S ASSISTANT',enforcer:true,x:1.5,z:-44.4,yaw:PI,speed:1.4,act:'clip',routine:[{x:1.5,z:-44.4,yaw:PI,act:'clip',dur:70},{x:-3,z:-12.5,yaw:0,act:'clip',dur:50},{x:8,z:-26,yaw:0,act:'clip',dur:30}]});
 // quartet on the dais
 for(let i=0;i<3;i++)add({role:'musician',kind:'civ',look:'musician',seed:300+i,x:-12.6+i*1.1,z:-19.4+(i%2)*.5,yaw:PI*.5-.3+i*.3,act:'play',yOff:.3,routine:[]});
 /* ---- staff */
 const S=(look,x,z,yaw,act,o={})=>add({role:o.role||'staff',kind:'civ',look,seed:Math.round(x*11+z*7),x,z,yaw,act,speed:1.5,...o});
 S('waiter',-11,-11,PI/2,'tray',{enforcer:true,name:'HEAD WAITER',routine:[]});S('bartender',-13.1,-10,PI/2,'idle',{routine:[]});S('bartender',22,3.1,0,'idle',{routine:[]});S('bartender',-41,15.3,0,'idle',{routine:[]});
 const tray=(pts)=>pts.map(([x,z,dur,yaw])=>({x,z,yaw,act:'tray',dur}));
 S('waiter',-23,-10.5,0,'tray',{routine:tray([[-23,-10.5,6],[-5,-12.5,8],[6,-15.5,8],[-7,-4.5,6],[-15.5,-14,2]])});
 S('waiter',-24,-16.8,0,'tray',{routine:tray([[-24,-16.8,6],[-10,4.6,7],[-6,13.4,8],[12,4.4,7],[-15.5,1,2]])});
 S('waiter',-22,-6,0,'tray',{routine:tray([[-22,-6,6],[16,15,7],[-18,19.4,7],[-40,19,6],[-36,4,3]])});
 S('waiter',-20,-17,0,'tray',{routine:tray([[-20,-17,6],[9,-25.2,7],[2,-27.6,7],[-8,-27,5]])});
 if(!low)S('waiter',-26,-10,0,'tray',{routine:tray([[-26,-10,8],[28,24,8],[20,7.4,7],[4,-6,7]])});
 S('chef',-26,-9.8,0,'use',{enforcer:true,name:'HEAD CHEF',routine:[]});S('chef',-24,-15,0,'use',{routine:[]});S('chef',-22,-11.4,PI,'use',{routine:[{x:-22,z:-11.4,yaw:PI,act:'use',dur:20},{x:-21,z:-28.6,yaw:PI,act:'use',dur:8},{x:-28.4,z:-17,yaw:-PI/2,act:'use',dur:14}]});
 S('somm',-21.8,-38.6,PI,'idle',{enforcer:true,name:'SOMMELIER',routine:[{x:-21.8,z:-38.6,yaw:PI,act:'idle',dur:30},{x:-29,z:-42,yaw:-PI/2,act:'use',dur:12},{x:-19,z:-35.4,yaw:PI,act:'use',dur:12}]});
 S('gardener',-46,-20,0,'idle',{routine:[{x:-46,z:-20,yaw:0,act:'look',dur:10},{x:-53.5,z:-20,yaw:-PI/2,act:'use',dur:12},{x:-40,z:-2,yaw:0,act:'idle',dur:10},{x:-50,z:20,yaw:0,act:'kneel',dur:14}]});
 S('mech',44,49.6,-PI/2,'use',{routine:[{x:44.6,z:49.6,yaw:-PI/2,act:'use',dur:20},{x:55,z:56,yaw:PI/2,act:'look',dur:8},{x:36.4,z:48.6,yaw:PI,act:'use',dur:12}]});
 // outside the walls: a late guest smoking by his car, the catering runner at the van, the valet
 add({role:'guest',kind:'civ',look:'guest',seed:4243,name:'LATE GUEST',x:-37.4,z:-59.4,yaw:-PI/2,act:'smoke',prop:'cig',routine:[]});
 S('waiter',-51.2,-49,PI,'tray',{name:'CATERING RUNNER',routine:[{x:-51.2,z:-49,yaw:PI,act:'use',dur:8},{x:-49.5,z:-44,yaw:0,act:'tray',dur:2},{x:-46,z:-36,yaw:0,act:'tray',dur:4},{x:-49.5,z:-44,yaw:0,act:'tray',dur:1}]});
 S('mech',-6,-50.4,PI,'idle',{name:'VALET',routine:[]});
 return C;}
