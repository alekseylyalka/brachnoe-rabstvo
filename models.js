"use strict";

window.WeddingModels = (() => {
  const tau = 2*Math.PI;
  const circle = n => Array.from({length:n}, (_,i) => [Math.cos(tau*i/n),Math.sin(tau*i/n)]);
  const rings = new Map([5,6,7,8,10,12].map(n => [n,circle(n)]));
  const sum = (a,b) => a.map((v,i) => v+b[i]);
  const sub = (a,b) => a.map((v,i) => v-b[i]);
  const mul = (a,n) => a.map(v => v*n);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit = a => mul(a,1/(Math.hypot(...a)||1));
  const blend = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
  const shades = new Map();

  function poseTransform(yaw,scale,tilt) {
    const c=Math.cos(yaw), s=Math.sin(yaw);
    const ct=Math.cos(tilt), st=Math.sin(tilt);
    const [sx,sy,sz]=typeof scale==="number" ? [scale,scale,scale] : scale;
    return ([x,y,z]) => {
      x*=sx;
      y*=sy;
      z*=sz;
      const lx=x*ct-y*st, ly=x*st+y*ct;
      return [lx*c+z*s,ly,z*c-lx*s];
    };
  }

  function shade(color, light) {
    if (!shades.has(color)) {
      const rgb = color.match(/.{2}/g).map(c => parseInt(c,16));
      shades.set(color,Array.from({length:21},(_,i) => {
        const channels = rgb.map((c,j) => Math.min(255,Math.round(c*(.53+i*.035)+(j===2?9:4))));
        return "rgb("+channels.join(",")+")";
      }));
    }
    return shades.get(color)[Math.max(0,Math.min(20,Math.round(light*20)))];
  }

  class Mesh {
    constructor() {
      this.faces = [];
    }

    connect(a,b,color) {
      for (let i=0;i<a.length;i++) {
        const k=(i+1)%a.length;
        this.faces.push([[a[i],b[i],b[k],a[k]],Array.isArray(color)?color[i%color.length]:color]);
      }
    }

    lathe(x,z,profile,color,sides=8,close=true) {
      let a;
      let base;
      for (const [y,rx,rz] of profile) {
        const b = rings.get(sides).map(([u,v]) => [x+u*rx,y,z+v*rz]);
        if (a) this.connect(a,b,color);
        else base=b;
        a=b;
      }
      if (close) {
        const cap=Array.isArray(color)?color[0]:color;
        this.faces.push([base,cap],[a.slice().reverse(),cap]);
      }
    }

    egg(x,y,z,rx,ry,rz,color,sides=8) {
      this.lathe(x,z,[
        [y-ry,rx*.025,rz*.025],[y-ry*.72,rx*.70,rz*.70],[y-ry*.22,rx*.99,rz*.99],
        [y+ry*.38,rx*.93,rz*.93],[y+ry*.79,rx*.61,rz*.61],[y+ry,rx*.025,rz*.025]
      ],color,sides,false);
    }

    tube(a,b,r1,r2,color,sides=6) {
      const direction=unit(sub(b,a));
      const tangent=unit(cross(direction,Math.abs(direction[2])>.85?[1,0,0]:[0,0,1]));
      const perpendicular=cross(tangent,direction);
      const ring=(center,r) => rings.get(sides).map(([u,v]) => sum(center,sum(mul(tangent,u*r),mul(perpendicular,v*r))));
      const lower=ring(a,r1), upper=ring(b,r2);
      this.connect(lower,upper,color);
      this.faces.push([lower,color],[upper.slice().reverse(),color]);
    }

    box(x,y,z,w,h,d,color) {
      const a=[x-w/2,y-h/2,z-d/2], b=[x+w/2,y+h/2,z+d/2];
      const lower=[[b[0],a[1],b[2]],[a[0],a[1],b[2]],[a[0],a[1],a[2]],[b[0],a[1],a[2]]];
      const upper=lower.map(([vx,,vz])=>[vx,b[1],vz]);
      this.connect(lower,upper,color);
      this.faces.push([lower,color],[upper.slice().reverse(),color]);
    }

    add(source,transform) {
      const vertices=new Map();
      for (const [face,color] of source.faces) {
        this.faces.push([face.map(point => {
          if (!vertices.has(point)) vertices.set(point,transform(point));
          return vertices.get(point);
        }),color]);
      }
    }

    render(scene,x,y,z,yaw=0,scale=1,tilt=0) {
      const visible=[];
      this.collectFaces(scene,x,y,z,yaw,scale,tilt,visible);
      visible.sort((a,b) => b.depth-a.depth);
      for (const {points,fill} of visible) {
        if (typeof fill==="string") scene.poly(points,fill);
        else scene.sticker(points,fill);
      }
    }

    collectFaces(scene,x,y,z,yaw,scale,tilt,visible,sortHeight=.18) {
      const pose=poseTransform(yaw,scale,tilt);
      const vertices=new Map();
      const transform=vertex => {
        if (vertices.has(vertex)) return vertices.get(vertex);
        const [vx,vy,vz]=pose(vertex);
        const world=[x+vx,y+vy,z+vz];
        const result={world,screen:scene.project(...world)};
        vertices.set(vertex,result);
        return result;
      };
      for (const [face,material] of this.faces) {
        const a=transform(face[0]), b=transform(face[1]), d=transform(face[2]);
        const signed=(b.screen[0]-a.screen[0])*(d.screen[1]-a.screen[1])-(b.screen[1]-a.screen[1])*(d.screen[0]-a.screen[0]);
        if (signed <= .065) continue;
        const points=[a.screen,b.screen,d.screen];
        let depth=a.world[2]-sortHeight*a.world[1]+b.world[2]-sortHeight*b.world[1]+d.world[2]-sortHeight*d.world[1];
        for (let i=3;i<face.length;i++) {
          const p=transform(face[i]);
          points.push(p.screen);
          depth+=p.world[2]-sortHeight*p.world[1];
        }
        let fill=material;
        if (typeof material==="string") {
          const ux=b.world[0]-a.world[0], uy=b.world[1]-a.world[1], uz=b.world[2]-a.world[2];
          const vx=d.world[0]-a.world[0], vy=d.world[1]-a.world[1], vz=d.world[2]-a.world[2];
          const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
          const light=Math.max(0,(-.48*nx+.78*ny-.39*nz)/(Math.hypot(nx,ny,nz)||1));
          fill=shade(material,.32+light*.68);
        }
        visible.push({depth:depth/face.length,points,fill});
      }
    }
  }

  const heelHeight = .15;
  const airborneFootLift = .20;
  const soleOffset = .122;
  const soleThickness = .047;
  const jumpSoleHeight = heelHeight+airborneFootLift-soleOffset-soleThickness/2;

  function runner(time,{airborne=false,shield=false,slide=0,mount=0,lean=0,jump=null,landing=0,
    kuzy=false,magnetHeld=false,throwAge=Infinity,walk=false,resist=0}={}) {
    const m=new Mesh();
    const body=new Mesh();
    const headMesh=resist ? new Mesh() : body;
    const brace=Math.abs(resist);
    const gait=Math.sin(time*15);
    const bounce=(airborne?0:Math.abs(gait)*(walk?.027:.063))*(1-slide)*(1-mount);
    const skin=kuzy?"87543d":"d3a07d", shirt=kuzy?"fffefa":"f8e6ce";
    const hair=kuzy?"30232a":"262a38", jeans=kuzy?"554f67":"344e62";
    const compression=landing*(1-slide)*(1-mount);
    const hipHeight=.83+bounce-.59*slide-.15*mount-.12*compression;
    const hipZ=.04*mount+.02*slide;
    const angle=-1.07*slide+.30*mount-.173*brace+(jump ? .17*jump.lift-.28*jump.descent : .24*compression);
    const headAngle=angle+.36*slide-.15*mount-.08*brace;
    const glance = kuzy ? 1.17+.17*Math.sin(time*3.4) : 0;
    const headCos=Math.cos(glance), headSin=Math.sin(glance);
    const posePoint=([x,y,z]) => {
      const torso=Math.min(y,1.56)-.83;
      const head=Math.max(0,y-1.56);
      const a=head>0?headAngle:angle;
      if (kuzy && head>0) [x,z]=[x*headCos+z*headSin,z*headCos-x*headSin];
      return [
        x+lean*(y-.66)*.16*(1-slide),
        hipHeight+torso*Math.cos(angle)+head*Math.cos(headAngle)-z*Math.sin(a),
        hipZ+torso*Math.sin(angle)+head*Math.sin(headAngle)+z*Math.cos(a)
      ];
    };
    if (kuzy) {
      body.lathe(0,0,[[1.22,.30,.19],[1.36,.325,.196],[1.46,.242,.15]],skin);
      body.lathe(0,0,[[.81,.23,.165],[.99,.316,.204],[1.26,.326,.222],[1.325,.312,.207]],shirt);
      for (const side of [-1,1]) {
        for (const edge of [-1,1]) {
          body.tube([side*.218,1.276,edge*.143],[side*.197,1.426,edge*.118],.071,.065,shirt,5);
        }
      }
    } else {
      body.lathe(0,0,[[.81,.23,.16],[.99,.31,.19],[1.39,.34,.22],[1.47,.24,.16]],shirt);
    }
    body.lathe(0,0,[[.75,.22,.15],[.94,.265,.17]],"26374b");
    body.tube([0,1.40,0],[0,1.59,0],.13,.13,skin);
    headMesh.egg(0,1.78,-.055,.285,.327,.255,hair,10);
    headMesh.egg(0,1.76,.060,.238,.284,.218,skin,10);
    headMesh.egg(-.075,1.96,kuzy?.025:.06,.225,.16,.228,hair,8);
    headMesh.egg(0,1.725,.278,.061,.049,.045,kuzy?"a57056":"dda881",6);
    if (brace) headMesh.egg(.009,1.617,.247,.074,.017+.029*brace,.016,"693b3e",8);
    else headMesh.box(0,1.62,.237,.125,.026,.014,kuzy?"5e3736":"785755");
    if (!kuzy) {
      headMesh.box(0,1.98,.253,.31,.047,.055,"54687c");
      headMesh.box(0,1.98,.286,.122,.042,.033,"c5bfad");
    }
    for (const side of [-1,1]) {
      const stride=side*gait;
      const tuck=jump ? jump.tuck*(1-slide) : 0;
      const step=airborne ? .16+side*(.10+.15*tuck) : stride*(walk?.28:.34);
      const lift=airborne ? airborneFootLift+(side>0?.23*tuck:0) : Math.max(0,stride)*(walk?.10:.19);
      const hip=posePoint([side*.133,.83,0]);
      const knee=blend(blend([side*.143,.48+bounce+lift*.4,step*.70+.094],
        [side*.155,side>0?.37:.225,side>0?.35:.42],slide),[side*.37,.51,.37],mount);
      const heel=blend(blend([side*.15,heelHeight+lift,step-.053],
        [side*.165,.14,side>0?.60:.81],slide),[side*.341,.215,.30],mount);
      m.tube(hip,knee,.118,.101,jeans);
      m.tube(knee,heel,.101,.082,jeans);
      m.egg(heel[0],heel[1]-.039,heel[2]+.061,.113,.102,.205,"8c563d",7);
      m.box(heel[0],heel[1]-soleOffset,heel[2]+.067,.178,soleThickness,.29,"493137");
      m.box(heel[0],heel[1]-.014,heel[2]+.176,.130,.035,.055,"4b7955");
      const shoulder=posePoint([side*.282,1.36,0]);
      const swing=jump ? (.30*jump.lift+.27*jump.tuck-.23*jump.descent)*(1-slide) : 0;
      const upper=blend(blend([side*(.39+.12*swing),1.23+bounce+swing*.35,-stride*.105],
        [side*.37,.41,-.37],slide),[side*.36,1.02,.24],mount);
      const elbow=blend(blend([side*(.42+.35*swing),1.05+bounce+swing*.41,-stride*.30+swing*.24],
        [side*.45,side>0?.33:.21,-.36],slide),[side*.33,.80,.36],mount);
      const hand=blend(blend([side*(.408+.42*swing),(walk?.88:1.14)+bounce+(airborne?.11:0)+swing*.61,(walk?.02:.15)-stride*.30+swing*.27],
        [side*.45,side>0?.40:.103,side>0?.10:-.15],slide),[side*.145,.60,.71],mount);
      if (brace) {
        const nearSide=side*Math.sign(resist);
        upper[2]+=.064*brace;
        elbow[0]+=side*.062*brace;
        elbow[1]+=.087*brace;
        elbow[2]+=.136*brace;
        hand[0]+=(side*.315-hand[0])*brace;
        hand[1]+=(1.32+.045*nearSide-hand[1])*brace;
        hand[2]+=(.337-.095*nearSide-hand[2])*brace;
      }
      if (side===1 && (magnetHeld || throwAge<.38)) {
        const flick=Math.sin(Math.PI*Math.min(1,throwAge/.38));
        if (!magnetHeld) {
          elbow[0]+=.15*flick;
          hand[0]+=.34*flick;
          hand[1]+=.14*flick;
        }
        const grip=[hand[0]+.13,hand[1]+.145,hand[2]-.095];
        m.magnetGrip=grip;
        if (magnetHeld) {
          const hold=poseTransform(.18+.16*gait,.63,-.27);
          m.add(items.magnet,vertex=>sum(grip,hold(vertex)));
        }
      }
      if (kuzy && side===1) {
        elbow[0]+=.045;
        hand[0]+=.21;
        hand[1]+=.13;
        const grip=[hand[0]+.066,hand[1]-.045,hand[2]-.025];
        const hold=poseTransform(.20,.95,-.29+.20*gait);
        m.add(items.waterPipe,vertex=>sum(grip,hold(vertex)));
      }
      m.tube(shoulder,upper,.13,.105,kuzy?skin:shirt);
      m.tube(upper,elbow,.088,.071,skin);
      m.tube(elbow,hand,.072,.064,skin);
      m.egg(...hand,.078,.068,.075-.026*brace,skin,6);
      if (brace) {
        for (let finger=0;finger<4;finger++) {
          const x=hand[0]+(finger-1.5)*.030;
          const length=(.081-.011*Math.abs(finger-1.6))*brace;
          m.egg(x,hand[1]+.044+length*.41,hand[2]+.016,.016,.020+length*.50,.021,skin,6);
        }
        m.egg(hand[0]-side*.068,hand[1]+.027,hand[2]+.028,.028,.045,.030,skin,6);
      }
      headMesh.egg(side*.118,1.79,.247,.073,.048+.012*brace,.034,"f7e8d4",7);
      headMesh.egg(side*.112-.019*resist,1.79-.003*brace,.272,.030,.034,.018,"47393a",6);
      if (brace) headMesh.tube([side*.066,1.873,.260],[side*.164,1.852,.244],.021,.017,hair,6);
      if (!kuzy) {
        headMesh.egg(side*.241,1.56,-.122,.109,.355,.125,hair,7);
        headMesh.egg(side*.285,1.57,.029,.053,.295,.092,"354052",6);
      }
    }
    if (kuzy) {
      const locks=["29202a","382933","48323a"];
      for (let i=0;i<9;i++) {
        const angle=-1.83+i*.46;
        const side=Math.sin(angle), back=Math.cos(angle);
        const sway=.047*Math.sin(time*12+i);
        const root=[side*.191,2.027,-.053-back*.142];
        const middle=[side*.299+sway*.36,1.847,-.053-back*.261];
        const tip=[side*.338+sway,1.57+(i%3)*.058,-.079-back*.288];
        body.tube(root,middle,.054,.052,locks[i%3],5);
        body.tube(middle,tip,.052,.036,locks[i%3],5);
      }
      body.box(0,1.799,.274,.391,.035,.035,"282a34");
      for (const side of [-1,1]) {
        body.box(side*.104,1.789,.279,.155,.082,.018,"55474e");
        body.tube([side*.145,1.411,.194],[side*.065,1.347,.214],.010,.010,"eddcba",5);
        body.tube([side*.065,1.347,.214],[0,1.334,.223],.010,.010,"eddcba",5);
      }
    } else {
      body.box(0,1.205,.204,.29,.177,.035,"354650");
      body.box(0,1.191,.226,.129,.157,.045,"c88244");
    }
    if (shield) {
      body.lathe(0,-.07,[[1.52,.25,.20],[1.72,.31,.25],[1.94,.28,.24],[2.07,.20,.17],[2.125,.035,.044]],"45394f",10);
      body.egg(0,1.79,.126,.223,.261,.159,skin,10);
      body.egg(-.05,1.978,.18,.14,.097,.115,hair,6);
      for (const side of [-1,1]) body.egg(side*.10,1.81,.256,.037,.029,.019,"493a3c",6);
    }
    m.add(body,posePoint);
    if (resist) {
      const c=Math.cos(1.03*resist),s=Math.sin(1.03*resist);
      m.add(headMesh,([x,y,z])=>posePoint([x*c+z*s,y+.033*brace,z*c-x*s]));
    }
    if (mount>0) {
      const bottleScale=.27+1.24*mount;
      const onBottle=([x,y,z]) => [
        x*bottleScale,.365+bottleScale*(y*.155-z*.988),.15*mount+bottleScale*(y*1.24+z*.155)
      ];
      m.add(items.bottle,onBottle);
      m.add(flightBottleLabel,onBottle);
    }
    return m;
  }

  const walkPoses = [];
  function walker(distance=0) {
    const frames = 24;
    const step = Math.floor(Math.max(0,distance)*frames/1.25)%frames;
    return walkPoses[step] ??= runner(step*(2*Math.PI/15)/frames,{walk:true});
  }

  function bride(time,{rush=0,kiss=0}={}) {
    const m=new Mesh();
    const posed=rush>0 || kiss>0;
    const dress=posed ? new Mesh() : m;
    const upper=posed ? new Mesh() : m;
    const cycle=time*13.4, pace=Math.sin(cycle);
    const bob=posed ? Math.abs(pace)*.074*rush : Math.abs(pace)*.050;
    const hair="38262d", skin="dbab91";
    const skirt=["f1ddc2","fff3e0","dbbea0","f5dfc8","fff8e8","e7c8ac"];
    dress.lathe(0,-.06,[[.022,.76,.50],[.14,.76,.49],[.39,.66,.45],[.67,.55,.39],[.87,.45,.344],[1.06+bob,.35,.29]],skirt,12);
    dress.lathe(0,-.060,[[.067,.771,.508],[.102,.773,.507],[.13,.764,.497]],"f1e4ca",12,false);
    upper.lathe(0,.02,[[.96+bob,.353,.295],[1.10+bob,.390,.318],[1.26+bob,.368,.277],[1.40+bob,.268,.20]],"f0d7bf",10);
    upper.lathe(0,.018,[[1.008+bob,.375,.308],[1.05+bob,.389,.319]],"e5b899",10,false);
    upper.tube([0,1.36+bob,0],[0,1.54+bob,0],.111,.104,skin);
    upper.egg(0,1.625+bob,-.050,.218,.259,.186,hair,8);
    upper.egg(0,1.62+bob,.048,.196,.214,.175,skin,8);
    upper.egg(-.06,1.77+bob,.025,.149,.103,.155,hair,8);
    upper.egg(0,1.44+bob,-.145,.176,.37,.127,"3f2c32",10);
    for (const side of [-1,1]) {
      const step=side*pace;
      const swing=step*(posed ? -.29*rush : .20);
      const elbow=blend([side*(.45-.055*rush),1.12+bob+.10*rush,swing],
        [side*.40,1.27,.19],kiss);
      const hand=blend([side*(.457-.075*rush),1.00+bob+.23*rush,.176+swing*1.39],
        [side*.34,1.33+side*.05,.46],kiss);
      if (!posed) hand[2]=.176+swing;
      upper.tube([side*.267,1.355+bob,.01],elbow,.104,.072,skin);
      upper.tube(elbow,hand,.072,.049,skin);
      upper.egg(...hand,.066,.063,.054,skin,6);
      upper.egg(side*.195,1.485+bob,-.012,.057,.244,.108,hair,7);
      upper.egg(side*.075,1.656+bob,.211,.026,.019*(1-.84*kiss),.016,"4a3638",6);
      upper.egg(side*.207,1.55+bob,-.018,.026,.029,.026,"ffdab1",5);
      if (posed) {
        const ground=Math.max(0,side*Math.cos(cycle))*.18*rush;
        const reach=.36*step*rush, x=side*.16;
        m.tube([x,.47+ground*.49,reach*.48],[x,.09+ground,reach],.079,.058,skin,8);
        m.egg(x,.061+ground,reach+.10,.086,.053,.149,"e6c5a4",8);
      }
    }
    upper.egg(0,1.546+bob,.200+.012*kiss,.048-.018*kiss,.018+.005*kiss,.024,"a06669",6);
    if (posed) {
      const lean=.18*rush+.32*kiss;
      const c=Math.cos(lean), s=Math.sin(lean);
      m.add(dress,([x,y,z])=>{
        const hem=Math.max(0,1-y/1.09)**2;
        const edge=Math.sin(cycle-.56+Math.atan2(x,z)*1.7);
        return [x+hem*edge*.095*rush,y+hem*rush*(.085+Math.max(0,z)*.26+.072*edge),
          z+hem*rush*(-.13+.045*edge)];
      });
      m.add(upper,([x,y,z])=>{
        const neck=Math.max(0,Math.min(1,(y-1.38)/.16));
        return [
          x+.045*pace*rush*Math.max(0,y-1)-.10*kiss*Math.max(0,y-1.39),
          1.02+(y-1.02)*c-z*s+(.052*neck-.023)*kiss,
          (y-1.02)*s+z*c+.13*neck*kiss
        ];
      });
    }
    return m;
  }

  function boot(m,x,z,height,color) {
    m.lathe(x,z-.036,[[height,.155,.281],[height+.042,.174,.295],[height+.087,.169,.298]],"e1cbb1",10);
    m.lathe(x,z-.036,[[height+.084,.154,.274],[height+.15,.151,.27],[height+.23,.14,.21],[height+.429,.126,.145]],color,10);
    m.lathe(x,z+.028,[[height+.364,.135,.145],[height+.427,.140,.142],[height+.444,.115,.114]],"c9a48c",10);
    m.egg(x,height+.128,z-.153,.146,.075,.152,"f3ddbd",8);
    for (let i=0;i<4;i++) m.box(x,height+.196+i*.052,z-.145+i*.028,.176,.017,.045,"f7dfc1");
  }

  const items={};
  {
    const m=new Mesh();
    m.lathe(0,0,[[-.31,.169,.144],[-.265,.173,.149],[-.19,.153,.133],[-.039,.086,.075],
      [.075,.059,.059],[.39,.060,.060]],["61c8c2","84e4dd","509caa","a9f4eb"],8);
    m.lathe(0,0,[[.375,.068,.068],[.419,.070,.070],[.437,.056,.056]],"aae9df",8);
    m.lathe(0,0,[[-.273,.175,.151],[-.226,.160,.139]],"278f9b",8,false);
    m.tube([.089,-.160,.015],[.230,.100,.042],.039,.035,"90dbcc",6);
    m.lathe(.230,.042,[[.075,.057,.052],[.125,.081,.069],[.154,.075,.065]],"b5deca",7);
    m.lathe(.230,.042,[[.155,.062,.052],[.162,.068,.058]],"475562",7);
    items.waterPipe=m;
  }
  const flightBottleLabel=new Mesh();
  {
    const m=new Mesh();
    m.lathe(0,0,[[-.47,.14,.14],[-.4,.233,.193],[.12,.236,.194],[.22,.19,.167],[.32,.103,.099],[.44,.098,.092]],"633326",10);
    m.lathe(0,0,[[-.289,.239,.2],[.02,.241,.2],[.104,.239,.199]],["a9313f","d14d3b","c8403c","a9313f","d64e38"],10,false);
    m.lathe(0,0,[[-.105,.24,.201],[-.061,.242,.202]],"e79f57",10,false);
    m.lathe(0,0,[[.398,.115,.108],[.49,.119,.113],[.523,.107,.105]],"e2b467",10);
    items.bottle=m;

    const image=document.createElement("canvas");
    image.width=256;
    image.height=120;
    const g=image.getContext("2d");
    g.fillStyle="#792528";
    g.fillRect(0,0,256,120);
    g.fillStyle="#b93831";
    g.fillRect(5,6,246,108);
    g.strokeStyle="#f0bd77";
    g.lineWidth=4;
    g.strokeRect(7,11,242,98);
    g.textAlign="center";
    g.textBaseline="middle";
    g.font="900 68px system-ui, sans-serif";
    g.strokeStyle="#652327";
    g.lineWidth=5;
    g.strokeText("ОХОТА",128,64,222);
    g.fillStyle="#ffe8af";
    g.fillText("ОХОТА",128,64,222);
    // The decal wraps around the three upper facets exposed behind the rider.
    const facets=[[-.193,-.133],[-.074,-.194],[.074,-.194],[.193,-.133]];
    for (let i=0;i<facets.length-1;i++) {
      const [left,lz]=facets[i], [right,rz]=facets[i+1];
      const start=(left-facets[0][0])/.386*image.width;
      const width=(right-left)/.386*image.width;
      flightBottleLabel.faces.push([[[left,-.128,lz],[right,-.128,rz],
        [right,-.395,rz],[left,-.395,lz]],{image,start,width}]);
    }
  }
  {
    const m=new Mesh();
    m.box(0,0,0,.67,.67,.082,"424e92");
    m.box(0,0,0,.58,.58,.12,"35417d");
    for (const face of [-1,1]) {
      m.egg(0,0,face*.052,.246,.241,.037,"606bb0",8);
      m.box(0,0,face*.085,.322,.065,.010,"e8e5eb");
      for (let i=0;i<8;i++) {
        m.box(-.285+i*.081,.306,face*.042,.045,.029,.020,"a6abd2");
        m.box(-.285+i*.081,-.306,face*.042,.045,.029,.020,"7d88b7");
      }
    }
    items.hood=m;
  }
  {
    const m=new Mesh();
    boot(m,-.173,.104,-.265,"65453c");
    boot(m,.175,-.106,-.242,"79574a");
    items.boots=m;
  }
  for (const [factor,enamel,ribbon] of [[2,"783149","c47781"],[5,"384b6c","8b9ccd"]]) {
    const m=new Mesh();
    // A wedding favour with a raised enamel seal and a tied ribbon.
    m.tube([0,0,-.13],[0,0,.13],.51,.51,"ac7036",12);
    m.tube([0,0,-.22],[0,0,-.13],.465,.51,"efba62",12);
    m.tube([0,0,-.25],[0,0,-.22],.396,.445,enamel,12);
    for (const side of [-1,1]) {
      m.tube([side*.035,.48,0],[side*.24,.62,.012],.061,.114,ribbon,7);
      m.tube([side*.025,.47,0],[side*.16,.34,.005],.047,.064,ribbon,6);
    }
    m.egg(0,.49,-.025,.092,.089,.095,"ffe4a7",8);
    items[`multiplier${factor}`]=m;
  }

  {
    const m=new Mesh();
    const arc=Array.from({length:9},(_,i)=>[.29*Math.cos(Math.PI+i*Math.PI/8),.29*Math.sin(Math.PI+i*Math.PI/8)-.035,0]);
    for (let i=0;i<8;i++) m.tube(arc[i],arc[i+1],.115,.115,i<4?"de5163":"4e8ec5",8);
    for (const side of [-1,1]) {
      m.box(side*.29,.104,0,.23,.29,.19,side<0?"e44b57":"4e90cd");
      m.box(side*.29,.302,0,.231,.126,.195,"e9e4db");
    }
    items.magnet=m;
  }
  {
    const m=new Mesh();
    m.tube([-.36,-.035,0],[.35,.035,0],.13,.13,"d57747",10);
    m.egg(-.34,-.035,0,.137,.129,.129,"dd8b54",8);
    m.egg(.33,.035,0,.138,.131,.131,"df8050",8);
    m.egg(-.485,-.045,0,.056,.050,.048,"a34e41",6);
    m.egg(.485,.05,0,.054,.048,.045,"a34e41",6);
    for (const x of [-.21,0,.21]) m.tube([x,.130,-.037],[x+.061,.105,-.097],.015,.013,"a94d3b",5);
    items.sausage=m;
  }

  const icons={};
  {
    const image=document.createElement("canvas");
    image.width=image.height=144;
    const g=image.getContext("2d");
    g.lineWidth=24;
    for (const [edge,tip,color] of [[37,Math.PI/2,"#e95162"],[107,0,"#4f9dd1"]]) {
      g.strokeStyle=color;
      g.beginPath();
      g.moveTo(edge,38);
      g.lineTo(edge,79);
      g.stroke();
      g.beginPath();
      g.arc(72,79,35,tip,tip+Math.PI/2);
      g.stroke();
      g.fillStyle="#f0e7d7";
      g.fillRect(edge-12,24,24,21);
      g.fillStyle="#ffffffad";
      g.fillRect(edge-9,27,5,39);
    }
    icons.magnet=image;
  }
  {
    const leaf=document.createElement("canvas");
    leaf.width=leaf.height=72;
    const g=leaf.getContext("2d");
    g.translate(36,50);
    g.strokeStyle="#709c51";
    g.lineWidth=2.5;
    g.beginPath();
    g.moveTo(0,-2);
    g.lineTo(3,13);
    g.stroke();
    for (const [angle,length,width] of [[-1.47,23,5],[-1.04,33,6],[-.51,42,7],[0,46,7.2],
      [.51,42,7],[1.04,33,6],[1.47,23,5]]) {
      g.save();
      g.rotate(angle);
      g.beginPath();
      g.moveTo(0,3);
      for (const side of [-1,1]) {
        for (let i=0;i<=12;i++) {
          const f=(side<0?i:12-i)/12;
          g.lineTo(side*width*Math.sin(f*Math.PI)*(i%2?1:.69),-f*length);
        }
      }
      g.closePath();
      const tint=g.createLinearGradient(0,0,0,-length);
      tint.addColorStop(0,"#247c53");
      tint.addColorStop(1,"#98cd6c");
      g.fillStyle=tint;
      g.fill();
      g.strokeStyle="#b5d27a";
      g.lineWidth=.65;
      g.stroke(new Path2D(`M 0,0 L 0,${-length*.87}`));
      g.restore();
    }
    const image=document.createElement("canvas");
    image.width=image.height=144;
    const badge=image.getContext("2d");
    badge.drawImage(leaf,0,0,144,144);
    badge.lineCap="round";
    const cross=new Path2D("M 35,37 L 109,111 M 109,37 L 35,111");
    badge.lineWidth=15;
    badge.strokeStyle="#6e2738";
    badge.stroke(cross);
    badge.lineWidth=9;
    badge.strokeStyle="#ff615a";
    badge.stroke(cross);
    icons.leaf=image;
  }

  const policeDimensions={
    skoda:{length:4.18,halfWidth:.91,height:1.07},
    haval:{length:4.42,halfWidth:1.00,height:1.68},
    jeep:{length:3.94,halfWidth:1.04,height:1.88},
    bus:{length:11.8,halfWidth:1.08,height:2.36,ramp:7.4}
  };

  function vehicleRing([y,r,front,back]) {
    const cut=.17;
    return [[r-cut,back],[-r+cut,back],[-r,back-cut],[-r,front+cut],
      [-r+cut,front],[r-cut,front],[r,front+cut],[r,back-cut]].map(([x,z])=>[x,y,z]);
  }

  function vehicleShell(mesh, sections, color) {
    const rings=sections.map(vehicleRing);
    for (let i=1;i<rings.length;i++) mesh.connect(rings[i-1],rings[i],color);
    mesh.faces.push([rings[0],color],[rings.at(-1).slice().reverse(),color]);
  }

  function truckWheel(mesh,side,x,z,radius) {
    mesh.tube([x-side*.25,radius,z],[x+side*.15,radius,z],radius,radius,"292c34",12);
    mesh.tube([x+side*.15,radius,z],[x+side*.165,radius,z],radius*.57,radius*.57,"a0a5af",10);
    mesh.tube([x+side*.166,radius,z],[x+side*.20,radius,z],radius*.24,radius*.24,"272833",8);
  }

  function crystalBody(mesh,sections,y) {
    const facets=["9db6cc","dfeaff","7391a9","b1c5df","c9e1ed","849ab8"];
    const shape=sections.map(([z,radius],index)=>rings.get(12).map(([u,v])=>
      [u*radius,y+v*radius,z+(index%2)*u*.16]));
    for (let i=1;i<shape.length;i++) {
      const offset=i%3;
      mesh.connect(shape[i],shape[i-1],facets.slice(offset).concat(facets.slice(0,offset)));
    }
    // The rings wind toward +Z. The nose and tail caps face opposite directions.
    mesh.faces.push([shape[0].slice().reverse(),"aabfd1"]);
    const rim=shape.at(-1);
    const center=[0,y,sections.at(-1)[0]+.09];
    const table=rim.map(point=>blend(center,point,.64));
    for (let i=0;i<rim.length;i++) {
      const next=(i+1)%rim.length;
      mesh.faces.push([[rim[i],rim[next],table[next],table[i]],facets[i%facets.length]],
        [[center,table[i],table[next]],i<6?"acbfd4":"9bb1ca"]);
    }
  }

  function weddingRings(mesh,side,depth) {
    const segments=circle(16);
    for (const direction of [-1,1]) {
      const x=side*(direction===1 ? 1.269 : 1.259);
      const z=depth+direction*.117;
      const band=radius=>segments.map(([u,v])=>[x,1.70+v*radius*.90,z+u*radius]);
      const inner=band(.156), outer=band(.205);
      const colors=["e7b867","c7934e","edbf68","fedc94"];
      if (side<0) mesh.connect(inner,outer,colors);
      else mesh.connect(outer,inner,colors);
    }
  }

  function makeLimousineCoach(mesh,cargo,front,rear) {
    const base=.92, top=base+cargo.height+.0245;
    const sections=[
      [base,1.10,.12,cargo.paint],[1.10,1.25,0,"c8c1b5"],[1.30,1.25,0,cargo.paint],
      [1.34,1.25,0,"cf9e50"],[2.08,1.25,0,cargo.paint],[2.13,1.25,0,"cbc6be"],
      [2.95,1.25,0,"glass"],[3.11,1.25,0,"reflection"],[3.17,1.25,0,"d6d0c7"],
      [3.42,1.23,.036,cargo.paint],[top-.074,1.11,.121,cargo.roof],[top,1.00,.24,cargo.roof]
    ];
    const outline=sections.map(([y,r,corner])=>vehicleRing([y,r,front+corner,rear-corner]));
    const dividers=[0,.022,.159,.172,.263,.275,.422,.434,.562,.574,.703,.715,.843,.855,.978,1];
    const windows=["424750","2c3b4b","474654","334453","2a3c50","364759","45444b"];
    const highlights=["68707b","4f677c","5b6777","4d687f","425769","546a7e","646674"];
    function panel(low,high,edge,from,to,color) {
      const next=(edge+1)%low.length;
      const at=(ring,point)=>blend(ring[edge],ring[next],point);
      mesh.faces.push([[at(low,from),at(high,from),at(high,to),at(low,to)],color]);
    }
    for (let i=1;i<outline.length;i++) {
      const low=outline[i-1], high=outline[i];
      const material=sections[i][3];
      const glazed=material==="glass" || material==="reflection";
      const colors=material==="glass" ? windows : highlights;
      for (let edge=0;edge<low.length;edge++) {
        if (edge===2 || edge===6) {
          for (let j=1;j<dividers.length;j++) {
            const a=dividers[j-1], b=dividers[j];
            const color=glazed ? (j%2 ? "dfd8ce" : colors[j/2-1]) : material;
            panel(low,high,edge,edge===6?a:1-b,edge===6?b:1-a,color);
          }
        } else if (edge===0 && glazed) {
          panel(low,high,edge,0,.09,cargo.paint);
          panel(low,high,edge,.09,.91,material==="glass" ? "34465a" : "526478");
          panel(low,high,edge,.91,1,cargo.paint);
        } else {
          panel(low,high,edge,0,1,glazed ? cargo.paint : material);
        }
      }
    }
    mesh.faces.push([outline[0],cargo.paint],[outline.at(-1).slice().reverse(),cargo.roof]);

    const doorFront=front+.17+(rear-front-.34)*dividers[3];
    const doorRear=front+.17+(rear-front-.34)*dividers[4];
    mesh.box(1.255,1.74,doorFront,.012,.68,.015,"afaba5");
    mesh.box(1.255,1.74,doorRear,.012,.68,.015,"afaba5");
    mesh.box(1.260,1.96,doorRear-.13,.035,.052,.198,"a3a7af");
    mesh.box(0,.79,rear+.0975,2.24,.16,.12,"adb1b6");
    for (const side of [-1,1]) {
      mesh.box(side*1.071,1.19,rear+.012,.143,.48,.045,"773a43");
      mesh.box(side*1.071,1.30,rear+.036,.093,.23,.018,"e2545a");
      mesh.box(side*1.071,1.025,rear+.038,.093,.090,.014,"d49755");
      weddingRings(mesh,side,rear-1.22);
    }
  }

  function makeParkedTrailer({cargo,gem,floral,rust,limousine}) {
    const mesh=new Mesh();
    const front=3.54, rear=12.36, length=rear-front;
    const mid=(front+rear)/2, halfWidth=1.25;
    mesh.box(0,.66,mid,1.78,.24,length,"333742");
    mesh.box(0,.62,front-.15,.56,.16,1.04,"464857");
    for (const side of [-1,1]) {
      for (const z of limousine ? [10.61,11.62] : [9.53,10.61,11.62]) {
        truckWheel(mesh,side,side*1.11,z,.51);
      }
      mesh.box(side*1.24,.88,mid,.044,.056,length-.16,cargo.trim);
      for (const z of [5.8,8.4,11.4]) mesh.box(side*1.27,.94,z,.028,.070,.142,"bc7949");
      mesh.box(side*.95,.81,rear+.045,.36,.13,.12,"aa4347");
    }
    if (limousine) {
      makeLimousineCoach(mesh,cargo,front,rear);
      return mesh;
    }
    if (gem) {
      crystalBody(mesh,[[front,.76],[front+.64,1.09],[front+1.42,1.18],
        [rear-1.05,1.10],[rear-.44,.92],[rear,.74]],1.98);
      for (const z of [front+.98,rear-1.18]) {
        mesh.box(0,.86,z,1.85,.23,.59,"53657a");
        for (const side of [-1,1]) {
          mesh.tube([side*.66,.89,z],[side*.82,1.39,z],.092,.066,"8094a7",6);
        }
      }
      return mesh;
    }
    const bottom=.92, height=cargo.height;
    const center=bottom+height/2;
    mesh.box(0,center,mid,2*halfWidth,height,length,cargo.paint);
    mesh.box(0,bottom+height+.012,mid,2.45,.025,length-.13,cargo.roof);
    mesh.box(0,center,rear+.020,2.40,height-.11,.065,cargo.trim);
    for (const side of [-1,1]) {
      mesh.box(side*.594,center,rear+.062,1.145,height-.192,.042,cargo.paint);
      const lower=bottom+.14, upper=bottom+height-.14;
      mesh.tube([side*.38,lower,rear+.103],[side*.38,upper,rear+.103],.028,.028,cargo.roof,6);
      for (const y of [lower+.16,upper-.16]) {
        mesh.box(side*1.09,y,rear+.101,.212,.115,.070,cargo.rib);
        mesh.box(side*.38,y,rear+.104,.104,.078,.056,cargo.rib);
      }
      mesh.box(side*.269,lower+.44,rear+.127,.245,.045,.061,cargo.roof);
      const edge=side*(halfWidth+.014);
      for (let z=front+.22;z<rear-.14;z+=cargo.pitch) {
        mesh.box(edge,center,z,.041,height-.092,.068,cargo.rib);
      }
      if (rust) {
        for (let y=bottom+.32;y<bottom+height-.18;y+=.33) {
          mesh.box(edge,y,mid,.045,.035,length-.18,cargo.trim);
        }
      }
      if (floral) {
        for (let i=0;i<19;i++) {
          const z=front+.43+i*.42;
          const y=bottom+.39+Math.sin(i*1.36)*.22+(i%3)*.18;
          const color=["b97995","cea367","9786ac"][i%3];
          mesh.box(edge+side*.024,y-.073,z+.052,.026,.052,.167,"709580");
          mesh.egg(edge+side*.031,y,z,.025,.091,.099,color,5);
        }
      }
    }
    return mesh;
  }

  function makeHighwayCab(mesh,paint) {
    const cut = .19;
    const profiles = [[1.48,1.24,-1.45,2.38],[1.91,1.26,-1.35,2.35],[2.99,1.25,-1.21,2.28],
      [3.25,1.23,-.97,2.25],[3.56,1.10,-.72,2.11],[3.69,.94,-.53,1.95]];
    const outline = profiles.map(([y,r,front,back])=>[[r-cut,back],[-r+cut,back],[-r,back-cut],[-r,front+cut],
      [-r+cut,front],[r-cut,front],[r,front+cut],[r,back-cut]].map(([x,z])=>[x,y,z]));
    const trim = "782a37", dark = "1f2e3d", glass = "485e72";
    function panel(low,high,edge,left,right,color,inset=0) {
      const next = (edge+1)%8;
      const point = (ring,u)=>{
        const [x,y,z] = blend(ring[edge],ring[next],u);
        return [x-Math.sign(x)*inset,y,z];
      };
      mesh.faces.push([[point(low,left),point(high,left),point(high,right),point(low,right)],color]);
    }
    for (let i=1;i<outline.length;i++) {
      const low = outline[i-1], high = outline[i];
      for (let side=0;side<8;side++) {
        if (i===2 && (side===2 || side===6)) {
          const [left,right] = side===6 ? [.075,.565] : [.435,.925];
          panel(low,high,side,0,left,paint);
          panel(low,high,side,right,1,paint);
          panel(low,high,side,left,right,side===6 ? dark : glass,side===6 ? .26 : 0);
        } else {
          panel(low,high,side,0,1,side===4 && (i===2 || i===3) ? glass : paint);
        }
      }
    }
    mesh.faces.push([outline.at(-1).slice().reverse(),"b34852"]);
    for (const side of [-1,1]) {
      mesh.box(side*1.26,1.895,-.33,.061,.060,1.54,trim);
      mesh.box(side*1.264,1.71,.77,.045,.057,.23,"657582");
      mesh.tube([side*1.19,2.65,-1.03],[side*1.49,2.66,-1.05],.032,.030,"313946",6);
      mesh.box(side*1.505,2.63,-1.11,.105,.31,.205,"283442");
    }
    mesh.box(0,3.30,2.101,1.45,.32,.27,"852d3c");
    mesh.box(0,1.29,2.56,1.24,.22,.07,"642b39");
    mesh.box(0,.76,2.89,1.49,.13,.93,"697483");
    mesh.egg(0,.88,2.87,.52,.132,.39,"283440",8);
    mesh.box(0,.56,3.83,2.36,.18,.18,"495667");
    mesh.box(0,.63,3.931,.43,.13,.026,"a7acb2");
    for (const side of [-1,1]) {
      mesh.box(side*1.13,1.04,2.87,.41,.11,1.72,"414753");
      mesh.box(side*1.13,.69,3.77,.42,.25,.12,"292f39");
      mesh.box(side*1.08,.72,3.841,.28,.121,.046,"cb3944");
      mesh.box(side*1.08,.64,3.841,.28,.029,.043,"a97751");
    }
  }

  function addBentleyBadge(mesh,nose) {
    const z=nose-.22, y=1.23;
    function plate(points,color,depth) {
      const [a,b,c]=points;
      const facing=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
      const vertices=points.map(([x,h])=>[x,y+h,depth]);
      mesh.faces.push([facing<0 ? vertices : vertices.reverse(),color]);
    }
    for (const side of [-1,1]) {
      const wing=(points,color,depth)=>plate(points.map(([x,h])=>[side*x,h]),color,depth);
      wing([[.16,.077],[.34,.106],[.72,.121],[.61,.024],[.37,-.102],[.15,-.092]],"657485",z+.012);
      for (let i=0;i<5;i++) {
        const h=.068-i*.030, end=.70-i*.057;
        wing([[.16,h],[end-.04,.111-i*.030],[end,.105-i*.030],
          [end-.059,.085-i*.030],[.20,h-.023]],i%2 ? "aebdca" : "e0e6e7",z+.006);
      }
    }
    mesh.tube([0,y,z+.071],[0,y,z-.001],.190,.197,"d5dde1",12);
    mesh.tube([0,y,z-.002],[0,y,z-.016],.167,.171,"1d2730",12);
    const letter=z-.020;
    plate([[-.078,-.110],[-.078,.113],[-.027,.113],[-.027,-.110]],"f8f3e5",letter);
    plate([[-.061,.007],[-.061,.113],[.044,.113],[.091,.086],[.094,.052],[.067,.018],[.036,.007]],"f8f3e5",letter-.001);
    plate([[-.061,-.110],[-.061,.015],[.049,.015],[.098,-.015],[.107,-.064],
      [.082,-.099],[.042,-.110]],"f8f3e5",letter-.001);
    plate([[-.027,.036],[-.027,.085],[.038,.085],[.052,.072],[.040,.049],[.017,.036]],"1d2730",letter-.006);
    plate([[-.027,-.077],[-.027,-.015],[.038,-.015],[.065,-.033],[.059,-.062],[.034,-.077]],"1d2730",letter-.006);
  }

  function addWeddingCabTrim(mesh,nose) {
    addBentleyBadge(mesh,nose);
    const hood=nose+.34;
    mesh.egg(0,1.532,hood,.30,.093,.23,"48653d",6);
    for (const [x,y,z] of [[0,.17,0],[-.114,.127,-.08],[.114,.135,-.075],[-.179,.109,.023],
      [.185,.109,.031],[-.063,.116,.109],[.071,.121,.115],[0,.089,-.143]]) {
      mesh.egg(x,1.526+y,hood+z,.080,.063,.076,"f6e9cf",5);
      mesh.egg(x-.012,1.571+y,hood+z-.009,.040,.026,.037,"fff3df",5);
    }
    for (const side of [-1,1]) {
      const ribbon=[[side*.13,1.575,hood+.078],[side*.19,1.565,hood+.016],
        [side*.94,1.568,hood+.391],[side*.95,1.568,hood+.483]];
      mesh.faces.push([side<0 ? ribbon : ribbon.slice().reverse(),"fff3e3"]);
      mesh.egg(side*.94,1.572,hood+.45,.087,.047,.067,"ece1d2",5);
    }
  }

  function makeParkedTruck(spec,highwayCab=false) {
    const {paint,shade:trim,width:r,roof,nose,glassZ,back,rust,floral,gem,limousine}=spec;
    const bridge=spec.id==="bridge";
    const mesh=new Mesh();
    const front=nose-.06;
    const lampY=floral?.92:.82;
    const lights=[[-r*.76,lampY,front],[r*.76,lampY,front]];
    mesh.box(0,.50,1.29,r*1.43,.25,6.45,"303541");
    const axles=[nose+1.0,2.57,3.55];
    for (const side of [-1,1]) {
      for (const z of axles) {
        truckWheel(mesh,side,side*(r-.02),z,floral?.46:.53);
      }
      mesh.box(side*r*.85,.56,1.35,.25,.28,1.85,"707781");
      mesh.box(side*r*.92,.42,.76,.24,.07,1.22,"a2a7ab");
    }

    if (gem) {
      crystalBody(mesh,[[-2.80,.63],[-2.38,.93],[-1.55,1.14],[1.97,1.09],[2.46,.89],[3.08,.65]],1.43);
      mesh.box(0,1.55,-2.72,1.20,.34,.09,"304867");
      mesh.box(0,.71,nose,2*r,.24,.29,"8197a7");
    } else {
      vehicleShell(mesh,[[.65,r*.92,nose,back],[.86,r,nose-.05,back],
        [1.41,r*.93,nose+.06,back],[1.55,r*.86,nose+.38,back]],paint);
      if (highwayCab) makeHighwayCab(mesh,paint);
      else {
        const cabin=limousine ? [[1.36,r*.84,glassZ-.18,back],[2.85,r*.91,glassZ+.24,back],
          [3.25,r*.88,glassZ+.51,back-.10],[roof,r*.69,glassZ+.70,back-.32]] :
          [[1.36,r*.84,glassZ-.17,back],[roof-.30,r*.91,glassZ+.30,back-.10],
            [roof,r*.69,glassZ+.62,back-.32]];
        vehicleShell(mesh,cabin,paint);
        const top=limousine ? 2.78 : bridge ? 2.91 : roof-.53;
        const low=floral?1.60:1.72;
        const windshield=limousine ? y=>glassZ-.192+(y-1.36)*.42/1.49 :
          y=>glassZ-.193+(y-1.36)*.47/(roof-1.66);
        const glassFront=windshield(low), glassTop=windshield(top);
        mesh.faces.push([[[-r*.69,low,glassFront],[-r*.66,top,glassTop],
          [r*.66,top,glassTop],[r*.69,low,glassFront]],"344957"]);
        mesh.faces.push([[[-r*.56,low+.016,glassFront-.006],[-r*.29,top-.020,glassTop-.018],
          [-r*.12,top-.020,glassTop-.018],[-r*.42,low+.016,glassFront-.006]],"79929f"]);
        for (const offset of [-.33,.30]) {
          mesh.tube([r*offset,low+.035,windshield(low+.035)-.016],
            [r*(offset+.17),low+.16,windshield(low+.16)-.028],.019,.017,"242c36",5);
        }
        for (const side of [-1,1]) {
          const pane=(y,z)=>[side*(r*(.84+.07*(y-1.36)/(cabin[1][0]-1.36))+.014),y,z];
          const window=limousine ?
            [pane(low+.10,glassZ+.18),pane(top-.09,glassZ+.45),pane(top-.09,back-1.11),
              pane(low+.10,back-1.03)] :
            [pane(low+.03,glassZ+.23),pane(top-.045,glassZ+.55),pane(top-.045,back-.83),pane(low+.03,back-.62)];
          mesh.faces.push([side>0?window:window.reverse(),"354b59"]);
          mesh.box(side*(r+.15),top-.15,glassZ+.30,.16,.41,.21,limousine ? "b9c4cb" : "272a36");
          if (limousine) {
            const sleeper=[pane(2.17,back-.76),pane(2.54,back-.76),
              pane(2.54,back-.36),pane(2.17,back-.36)];
            mesh.faces.push([side>0?sleeper:sleeper.reverse(),"425364"]);
            mesh.tube([side*r*.88,top-.28,glassZ+.31],[side*(r+.114),top-.24,glassZ+.31],
              .032,.024,"a8b3ba",6);
            mesh.box(side*(r+.15),top-.14,glassZ+.201,.117,.29,.024,"637788");
            mesh.box(side*r*.91,1.31,glassZ-.17,.033,.052,.51,"a6aeb4");
          }
          mesh.box(side*r*.99,1.28,back-.63,.025,.055,.20,"c1c4c2");
          mesh.box(side*r*.95,1.03,back-.51,.035,.07,.19,"dd8959");
          if (floral) {
            for (let i=0;i<6;i++) {
              const angle=i*1.4;
              const flowerZ=glassZ+.18+i*.29;
              const flowerY=1.11+Math.sin(angle)*.18;
              mesh.egg(side*r*.98,flowerY,flowerZ,.036,.10,.10,i%2?"c7819e":"d8ab65",5);
              mesh.egg(side*r,flowerY-.09,flowerZ+.08,.035,.05,.11,"6d9677",5);
            }
          }
        }
      }
      mesh.box(0,.69,nose-.05,r*1.98,.19,.27,trim);
      const grilleTop=floral?1.08:1.44;
      mesh.box(0,(grilleTop+.77)/2,nose-.07,r*1.08,grilleTop-.77,.10,"252a34");
      for (let i=-4;i<=4;i++) {
        mesh.box(i*r*.106,(grilleTop+.77)/2,nose-.131,.032,grilleTop-.82,.035,trim);
      }
      if (bridge) mesh.tube([-.56,.82,nose-.158],[.56,1.40,nose-.158],.023,.023,"a4a9ad",5);
      if (limousine) addWeddingCabTrim(mesh,nose);
      if (rust) {
        for (const [x,y,z,w,h] of [[-.68,.86,nose-.146,.31,.12],[.63,1.33,nose+.12,.28,.15],
          [-1.12,1.63,glassZ+.63,.055,.26],[1.13,1.20,back-.70,.052,.30]]) {
          mesh.box(x,y,z,w,h,.25,"89513c");
        }
        mesh.tube([r+.11,.81,1.42],[r+.11,3.35,1.42],.073,.065,"715446",8);
      }
    }
    for (const [x,y,z] of lights) {
      mesh.box(x,y,z-.13,.40,.19,.115,"282b35");
      mesh.box(x,y+.012,z-.203,.34,.119,.045,"fff3d2");
      mesh.box(x,y-.161,z-.15,.17,.052,.040,"d68a45");
    }
    return {mesh,trailer:highwayCab ? null : makeParkedTrailer(spec),lights:lights.map(([x,y,z])=>[x,y,z-.23])};
  }

  const parkedTrucks=[
    {id:"rust",x:-10.1,z:4.3,yaw:.41,paint:"726f5b",shade:"785346",width:1.12,roof:2.91,nose:-2.53,
      glassZ:-.83,back:1.72,rust:true,cargo:{paint:"84644c",roof:"8e7961",rib:"644a3e",trim:"5f4e42",height:2.20,pitch:.71}},
    {id:"sanya",x:-5.4,z:2.0,yaw:.35,paint:"e4e6e4",shade:"9cabb2",width:1.13,roof:2.43,nose:-2.58,
      glassZ:-1.02,back:1.32,floral:true,cargo:{paint:"d8dad8",roof:"e7e8e4",rib:"c1c7c5",trim:"b3bfc3",height:2.61,pitch:.94}},
    {id:"silver",x:5.9,z:1.3,yaw:.39,paint:"eee5d5",shade:"c8d0d5",width:1.24,roof:3.54,nose:-2.45,
      glassZ:-.96,back:1.80,limousine:true,cargo:{paint:"eae1d4",roof:"f5ebda",trim:"b8b7b6",height:2.73}},
    {id:"diamond",x:10.5,z:5.2,yaw:.48,width:1.16,nose:-2.80,gem:true,cargo:{trim:"9bb1c9"}},
    {id:"bridge",x:.25,z:-2.9,yaw:.45,paint:"ab2c3d",shade:"9c9ba3",width:1.34,roof:3.95,nose:-3.19,
      glassZ:-.82,back:2.54,cargo:{paint:"803943",roof:"9a545b",rib:"682f3a",trim:"ac5c5b",height:2.88,pitch:.34}}
  ].map(spec=>({...spec,...makeParkedTruck(spec)}));

  function makeAveo() {
    const mesh = new Mesh();
    const paint = "508ac6", lower = "497db6", sill = "416c9b", edge = "659bd0";
    const trim = "242d3c", gasket = "1d2939", glass = "263f62";
    const front = -2.031, roadRear = 2.004, parkedRear = 1.951;
    const cowlZ = -.86, hatchZ = 1.78, beltY = 1.20;
    const roofLift = .105;
    const axles = [-1.26,1.24];
    const rows = [0,.19,.51,.81,1];

    const face = (points,color,outward) => {
      const normal = cross(sub(points[1],points[0]),sub(points[2],points[0]));
      const dot = normal.reduce((n,value,i)=>n+value*outward[i],0);
      mesh.faces.push([dot<0 ? [points[2],points[1],points[0],...points.slice(3).reverse()] : points,color]);
    };
    const quad = (surface,u0,u1,v0,v1,color,outward) =>
      face([surface(u0,v0),surface(u0,v1),surface(u1,v1),surface(u1,v0)],color,outward);

    // Cross-sections across each bumper. Each row is width, height, centre depth and corner sweep.
    const nose = [
      [.67,.28,front,.171],[.81,.346,-2.013,.132],[.887,.541,-2.007,.200],
      [.902,.770,-1.974,.283],[.825,.937,-1.899,.263]
    ];
    const tail = [
      [.718,.29,roadRear,.168],[.829,.348,1.987,.131],[.906,.525,1.976,.149],
      [.908,.868,1.939,.151],[.826,beltY,1.892,.112]
    ];
    const endSweep = [-1,-.927,-.884,-.72,-.52,-.33,0,.33,.52,.72,.884,.927,1];
    const endRings = (end,dir) => end.map(([width,height,z,sweep],i) =>
      endSweep.map(u=>[u*width,height+(1-u*u)*(i===4 ? .043 : 0),z-dir*sweep*u*u]));
    const frontRings = endRings(nose,-1), rearRings = endRings(tail,1);

    // The wheel openings are cut into the side panels and return into dark inner wells.
    const archRadius = .305, archTop = .745, sillHeight = .269;
    const archColumns = axles.map(z=>[
      z-archRadius-.014,z-archRadius,z-.263,z-.152,z,z+.152,z+.263,z+archRadius,z+archRadius+.014
    ]);
    const stations = [-1.56,...archColumns[0],cowlZ,-.35,.2,.65,.9,...archColumns[1],1.6,1.70]
      .filter((z,i,list)=>list.indexOf(z)===i).sort((a,b)=>a-b);
    const opening = z => {
      const delta = Math.min(...axles.map(axle=>Math.abs(z-axle)));
      return delta<=archRadius+1e-8
        ? .388+(archTop-.388)*Math.sqrt(Math.max(0,1-(delta/archRadius)**2))
        : sillHeight;
    };
    const bodyStation = z => {
      const full = .902+.037*Math.exp(-(((z-axles[0])/.41)**2))
        +.036*Math.exp(-(((z-axles[1])/.42)**2));
      const hood = (z+1.56)/(cowlZ+1.56), cabin = (z-cowlZ)/(hatchZ-cowlZ);
      const top = z<cowlZ ? .956+(beltY-.956)*hood : beltY;
      const crown = z<cowlZ ? .826-.034*hood : .792+.034*cabin;
      const base = opening(z);
      return [[full*.938,base,z],[full*.987,base+(top-base)*.15,z],
        [full,base+(top-base)*.56,z],[full*.991,Math.max(top-.078,base+(top-base)*.76),z],[crown,top,z]];
    };
    const bodyColumns = [frontRings.map(row=>row.at(-1)),...stations.map(bodyStation),rearRings.map(row=>row.at(-1))];
    const left = column=>column.map(([x,y,z])=>[-x,y,z]);
    for (const side of [-1,1]) {
      const columns = side===1 ? bodyColumns : bodyColumns.map(left);
      for (let i=1;i<columns.length;i++) {
        const a = columns[i-1], b = columns[i];
        [sill,lower,paint,edge].forEach((color,k)=>
          face([a[k],b[k],b[k+1],a[k+1]],color,[side,0,0]));
        face([a[0],b[0],[side*.652,b[0][1],b[0][2]],[side*.652,a[0][1],a[0][2]]],
          trim,[0,-1,0]);
      }
    }
    for (const z of axles) mesh.box(0,.365,z,1.305,.28,.62,"303e51");
    face([...frontRings[0],...rearRings[0].slice().reverse()],trim,[0,-1,0]);

    // Map the lamps and grilles onto the curved fascia. Split them at the same panel breaks.
    function buildEnd(rings,dir) {
      const outward = [0,0,dir];
      const solve = (i,j,u,v) => {
        const h = (v-rows[j])/(rows[j+1]-rows[j]);
        const w = (u-endSweep[i])/(endSweep[i+1]-endSweep[i]);
        return blend(blend(rings[j][i],rings[j][i+1],w),blend(rings[j+1][i],rings[j+1][i+1],w),h);
      };
      for (let j=0;j<rows.length-1;j++) {
        for (let i=0;i<endSweep.length-1;i++) {
          quad((u,v)=>solve(i,j,u,v),endSweep[i],endSweep[i+1],rows[j],rows[j+1],
            [lower,paint,paint,edge][j],outward);
        }
      }
      return (outline,color,offset=.004) => {
        for (let j=0;j<rows.length-1;j++) {
          for (let i=0;i<endSweep.length-1;i++) {
            let patch = outline;
            for (const [axis,line,sign] of [[0,endSweep[i],1],[0,endSweep[i+1],-1],
              [1,rows[j],1],[1,rows[j+1],-1]]) {
              patch = patch.flatMap((a,k)=>{
                const b = patch[(k+1)%patch.length];
                const da = (a[axis]-line)*sign, db = (b[axis]-line)*sign;
                const cut = da*db<0 ? [blend(a,b,da/(da-db))] : [];
                return da>=0 ? [a,...cut] : cut;
              });
            }
            if (patch.length<3) continue;
            const points = patch.map(([u,v])=>{
              const [x,y,z] = solve(i,j,u,v);
              return [x,y,dir*Math.min(dir*z+offset,dir*(dir<0 ? front : roadRear))];
            });
            // Clipped outlines may have collinear corners on a panel edge.
            const start = points.findIndex((a,k)=>Math.hypot(...cross(sub(points[(k+1)%points.length],a),
              sub(points[(k+2)%points.length],a)))>1e-8);
            if (start>=0) face([...points.slice(start),...points.slice(0,start)],color,outward);
          }
        }
      };
    }
    const frontPatch = buildEnd(frontRings,-1);
    const rearPatch = buildEnd(rearRings,1);
    const symmetric = (patch,points,color,offset) => {
      for (const side of [-1,1]) patch(points.map(([u,v])=>[u*side,v]),color,offset);
    };
    frontPatch([[-.38,.805],[.38,.805],[.41,.724],[.345,.533],[-.345,.533],[-.41,.724]],"b3c4d3");
    frontPatch([[-.36,.777],[.36,.777],[.383,.718],[.324,.557],[-.324,.557],[-.383,.718]],"202c3b",.010);
    frontPatch([[-.397,.391],[.397,.391],[.35,.202],[.28,.121],[-.28,.121],[-.35,.202]],"9eafc2");
    frontPatch([[-.372,.365],[.372,.365],[.326,.209],[.266,.145],[-.266,.145],[-.326,.209]],"202c39",.010);
    for (const [bottom,top,width] of [[.213,.345,.30],[.583,.746,.319]]) {
      for (let i=-4;i<=4;i++) {
        const x=i*width/4;
        frontPatch([[x-.010,bottom],[x+.004,bottom],[x+.021,top],[x+.007,top]],"354357",.012);
      }
    }
    frontPatch([[-.124,.483],[.124,.483],[.124,.442],[-.124,.442]],"e5b966",.012);
    frontPatch([[-.052,.514],[.052,.514],[.052,.411],[-.052,.411]],"e5b966",.012);
    symmetric(frontPatch,[[.42,.556],[.465,.743],[.651,.836],[.928,.929],[.966,.866],[.872,.704],[.647,.594]],
      "4d5b6d",.009);
    symmetric(frontPatch,[[.451,.579],[.488,.732],[.663,.817],[.923,.900],[.930,.865],[.851,.716],[.640,.615]],
      "e5e2d4",.015);
    symmetric(frontPatch,[[.478,.599],[.502,.722],[.609,.772],[.686,.751],[.652,.657],[.574,.622]],"ffedbd",.018);
    symmetric(frontPatch,[[.753,.814],[.909,.882],[.898,.841],[.842,.760],[.794,.741]],"aebcd0",.018);
    symmetric(frontPatch,[[.515,.205],[.532,.352],[.691,.371],[.829,.302],[.847,.214]],"2a3545",.011);
    symmetric(frontPatch,[[.660,.280],[.685,.332],[.742,.331],[.767,.281],[.745,.236],[.686,.236]],"697a8f",.016);

    rearPatch([[-.92,.126],[.92,.126],[.87,.224],[-.87,.224]],"41658e",.007);
    rearPatch([[-.282,.457],[.282,.457],[.31,.337],[-.31,.337]],"3c5d83",.010);
    rearPatch([[-.218,.425],[.218,.425],[.218,.363],[-.218,.363]],"c5ced7",.014);
    rearPatch([[-.098,.725],[.098,.725],[.09,.687],[-.09,.687]],"d6ab57",.014);
    rearPatch([[-.040,.745],[.040,.745],[.036,.669],[-.036,.669]],"d6ab57",.014);
    symmetric(rearPatch,[[.735,.561],[.793,.828],[.861,.942],[1,.971],[1,.611],[.906,.521]],"612b3e",.008);
    symmetric(rearPatch,[[.767,.565],[.819,.824],[.886,.928],[1,.951],[1,.634],[.899,.552]],"bf3949",.014);
    symmetric(rearPatch,[[.783,.649],[.804,.725],[.921,.716],[1,.745],[1,.664],[.905,.628]],"ef8a75",.018);
    symmetric(rearPatch,[[.818,.77],[.841,.830],[1,.869],[1,.822]],"ef6071",.018);
    symmetric(rearPatch,[[.660,.261],[.841,.246],[.862,.292],[.684,.309]],"a84358",.009);

    // Crown and hood creases share the front rim; the last row also forms the windshield base.
    const windshield = (u,v) => {
      const crown = 1-u*u;
      const z = cowlZ+.86*v-crown*(.093-.043*v);
      return [u*(.792-.155*v),beltY+(.84+roofLift)*v+crown*(.053+.067*v),z];
    };
    const hatch = (u,v) => {
      const crown = 1-u*u;
      return [u*(.826-.206*v),beltY+(.777+roofLift)*v+crown*(.043+.080*v),hatchZ-.239*v+crown*(.112-.075*v)];
    };
    const hoodRings = [frontRings.at(-1)];
    for (const z of stations.filter(z=>z<cowlZ)) {
      const [w,y] = bodyStation(z)[4];
      const sweep = .093*(z+1.56)/(cowlZ+1.56);
      hoodRings.push(endSweep.map(u=>[u*w,y+(1-u*u)*(.049+.016*(1-Math.abs(Math.abs(u)-.52)/.52)),z-sweep*(1-u*u)]));
    }
    hoodRings.push(endSweep.map(u=>windshield(u,0)));
    for (let i=1;i<hoodRings.length;i++) {
      const a = hoodRings[i-1], b = hoodRings[i];
      for (let j=1;j<endSweep.length;j++) {
        const outer = Math.abs((endSweep[j]+endSweep[j-1])/2);
        face([a[j-1],b[j-1],b[j],a[j]],outer>.70 && outer<.90 ? "669bd0" : paint,[0,1,0]);
      }
    }

    const pillars = [
      [0,0,paint],[.077,.105,gasket],[.099,.127,glass],[.417,.424,gasket],[.447,.451,"343d4d"],
      [.472,.478,glass],[.756,.767,gasket],[.786,.802,"293f5d"],[.886,.898,gasket],[.921,.936,paint],[1,1]
    ];
    const roofStations = pillars.map(([,top])=>top);
    const roof = (u,v) => {
      const [x,y,z] = blend(windshield(u,1),hatch(u,1),v);
      const arch = Math.sin(Math.PI*v);
      return [x,y+arch*(.097+.056*(1-u*u)),z];
    };
    for (let i=1;i<endSweep.length;i++) {
      const shoulder = Math.abs((endSweep[i-1]+endSweep[i])/2);
      const roofPaint = shoulder>.88 ? "6097cb" : shoulder>.70 ? "5b8fc4" : "5083b7";
      for (let j=1;j<roofStations.length;j++) {
        quad(roof,endSweep[i-1],endSweep[i],roofStations[j-1],roofStations[j],roofPaint,[0,1,0]);
      }
    }
    for (const [surface,dir,low,high] of [[windshield,-1,.086,.93],[hatch,1,.16,.90]]) {
      const outward = [0,0,dir];
      const boundaries = [0,low-.026,low,low+(high-low)*.31,high,high+.025,1];
      for (let j=1;j<boundaries.length;j++) {
        const v0 = boundaries[j-1], v1 = boundaries[j];
        const strips = [[-1,-.927,paint],[-.927,-.884,j===3||j===4 ? gasket : paint],
          [-.884,0,[paint,gasket,"314e72",glass,gasket,paint][j-1]],
          [0,.884,[paint,gasket,"314e72","2b4467",gasket,paint][j-1]],
          [.884,.927,j===3||j===4 ? gasket : paint],[.927,1,paint]];
        for (const [a,b,color] of strips) {
          const steps = endSweep.filter(u=>a<=u && u<=b);
          for (let i=1;i<steps.length;i++) quad(surface,steps[i-1],steps[i],v0,v1,color,outward);
        }
      }
    }

    const flankAt = (side,z,y) => {
      const profile = bodyStation(z);
      const i = profile.findIndex(([,h])=>h>=y);
      const [x] = i<=0 ? profile[0] : blend(profile[i-1],profile[i],
        (y-profile[i-1][1])/(profile[i][1]-profile[i-1][1]));
      return [side*(x+.009),y,z];
    };
    const wheelCircle = circle(20);
    for (const side of [-1,1]) {
      const outward = [side,0,0];
      const pane = (u,v)=>{
        const point = blend(windshield(side,v),hatch(side,v),u);
        point[1] += .097*Math.sin(Math.PI*u)*v;
        return point;
      };
      const cut = ([bottom,top],v)=>bottom+(top-bottom)*v;
      for (let i=1;i<pillars.length;i++) {
        const a = pillars[i-1], b = pillars[i];
        const panel = (v0,v1,color)=>face([pane(cut(a,v0),v0),pane(cut(a,v1),v1),
          pane(cut(b,v1),v1),pane(cut(b,v0),v0)],color,outward);
        panel(0,.10,edge);
        panel(.10,.132,i===1||i===pillars.length-1 ? paint : gasket);
        panel(.132,.37,a[2]===glass ? "314c70" : a[2]);
        panel(.37,.865,a[2]);
        panel(.865,.902,i===1||i===pillars.length-1 ? paint : gasket);
        panel(.902,1,paint);
      }

      const seam = (curve,color) => {
        for (let i=1;i<curve.length;i++) {
          const [az,ay] = curve[i-1], [bz,by] = curve[i];
          face([flankAt(side,az,ay),flankAt(side,az+.012,ay),
            flankAt(side,bz+.012,by),flankAt(side,bz,by)],color,outward);
        }
      };
      seam([[-.67,1.181],[-.63,.865],[-.59,.47],[-.49,.332]],"356194");
      seam([[.34,1.185],[.362,.865],[.387,.49],[.39,.33]],"365f8b");
      seam([[1.355,1.185],[1.356,1.015],[1.20,.836],[1.083,.688],[.976,.492],[.88,.335]],"3c6796");
      for (const z of [.157,1.174]) {
        const [x,y] = flankAt(side,z,1.101);
        mesh.egg(x,y,z,.019,.025,.084,trim,10);
      }
      const [markerX,markerY,markerZ] = flankAt(side,-.96,.98);
      mesh.egg(markerX,markerY,markerZ,.010,.025,.043,"e1cdc2",8);
      mesh.tube([side*.755,1.241,-.704],[side*.865,1.250,-.683],.026,.037,trim,8);
      mesh.lathe(side*.883,-.693,[[1.222,.055,.104],[1.239,.087,.130],[1.282,.092,.136],
        [1.325,.075,.121],[1.348,.035,.082]],"303846",10);
      for (const z of axles) {
        const wheel = (x,size) => wheelCircle.map(([u,v])=>[side*x,.364+.364*u*size,z-side*.238*v*size]);
        const bead = wheel(.908,.744);
        mesh.connect(wheel(.731,.85),wheel(.753,1),"252a35");
        mesh.connect(wheel(.753,1),wheel(.879,1),"252a35");
        const outer = wheel(.901,.91);
        const ring = (a,b,color) => a.forEach((p,i)=>
          face([p,b[i],b[(i+1)%a.length],a[(i+1)%a.length]],color,outward));
        ring(wheel(.879,1),outer,"292f39");
        ring(outer,bead,"303644");
        const rim = wheel(.913,.672), hub = wheel(.926,.172);
        ring(bead,rim,"a5b3c5");
        rim.forEach((p,i)=>{
          const next = (i+1)%rim.length;
          face([p,rim[next],hub[next],hub[i]],i%4===0 ? "bac7d5" : "343e4e",outward);
        });
        face(hub,"8d9bad",outward);
      }
      // Continue the tall rear lenses around the hatch corners onto the quarter panels.
      const last = (i,v)=>{
        const [x,y,z] = blend(bodyColumns.at(-i)[3],bodyColumns.at(-i)[4],v);
        return [side*(x+.004),y,z];
      };
      face([last(1,.035),last(1,.948),last(2,.824),last(2,.163)],"aa354b",outward);
      face([last(1,.35),last(1,.55),last(2,.49),last(2,.34)],"d05a61",outward);
    }

    for (const [a,b] of [[-.67,.13],[.06,.70]]) {
      const p = windshield(a,.106), q = windshield(b,.139);
      mesh.tube(sum(p,[0,.004,-.006]),sum(q,[0,.004,-.006]),.008,.007,trim,5);
    }
    const rearWiperA = hatch(-.42,.30), rearWiperB = hatch(.48,.225);
    mesh.tube(sum(rearWiperA,[0,0,.008]),sum(rearWiperB,[0,0,.008]),.010,.010,trim,5);
    const antenna = roof(.11,.13);
    mesh.egg(antenna[0],antenna[1],antenna[2],.033,.025,.055,"2c3949",8);
    mesh.tube(sum(antenna,[0,.015,0]),sum(antenna,[0,.252,.253]),.011,.004,"485566",5);

    const scale = [1.5,1.27,1.8];
    const parkingMesh = new Mesh();
    // Preserve both pre-existing footprints with the same body design.
    const park = ([x,y,z])=>[x,y,z>1.60 ? z-(z-1.60)*(roadRear-parkedRear)/(roadRear-1.60) : z];
    parkingMesh.add(mesh,park);
    const lights = [-1,1].map(side=>[side*.56,.719,-1.89]);
    const tailLights = [-1,1].map(side=>[side*.766,.967,1.85]);
    const bounds = {halfWidth:.975,front:-front,rear:roadRear};
    // Keep the pre-existing collision margins around the road mesh.
    const collision = {width:.98*scale[0],front:2.05*scale[2],rear:2.04*scale[2]};
    const road = {id:"aveo",scale,mesh,lights,tailLights,bounds,collision};
    const parked = {id:road.id,x:3.37,z:-5.55,yaw:.66,scale,mesh:parkingMesh,lights,
      bounds:{...bounds,rear:parkedRear}};
    return {road,parked};
  }

  const {road:roadAveo,parked:parkedAveo} = makeAveo();

  function makeTrafficCar(paint,roofHeight,van) {
    const mesh = new Mesh();
    const back = van ? 2.18 : 1.96;
    const glass = "2d4358";
    const rearGlass = van ? back-.20 : 1.11;
    const rearRoof = van ? back-.37 : .69;
    vehicleShell(mesh,[[.29,.74,-1.78,back-.14],[.42,.83,-1.93,back-.03],[.60,.87,-1.98,back],
      [.76,.84,-1.91,back-.035],[.90,.779,-1.69,back-.15]],paint);
    vehicleShell(mesh,[[.865,.75,-1.30,rearGlass],[roofHeight-.095,.647,-.65,rearRoof+.07],
      [roofHeight,.619,-.53,rearRoof]],glass);
    vehicleShell(mesh,[[roofHeight-.014,.643,-.58,rearRoof+.065],
      [roofHeight+.056,.598,-.45,rearRoof-.07]],paint);
    const distant = new Mesh();
    distant.faces = mesh.faces.slice();
    distant.box(0,.24,0,1.51,.29,2.94,"252b34");
    mesh.box(0,.42,back-.022,1.43,.124,.082,"323a48");
    mesh.box(0,.59,back+.006,.51,.16,.035,"25313e");
    mesh.box(0,.598,back+.031,.31,.092,.017,"bfc7cc");
    mesh.box(0,.796,back-.08,.159,.043,.039,"a6b2bf");
    for (const side of [-1,1]) {
      for (const z of [-1.22,back-.61]) {
        mesh.tube([side*.68,.318,z],[side*.825,.318,z],.313,.318,"1c242e",10);
        mesh.tube([side*.825,.318,z],[side*.892,.318,z],.318,.277,"252b34",10);
        mesh.tube([side*.892,.318,z],[side*.903,.318,z],.166,.158,"8d99a6",8);
        mesh.tube([side*.903,.318,z],[side*.911,.318,z],.067,.067,"3d4855",6);
      }
      mesh.tube([side*.748,.876,.31],[side*.636,roofHeight-.04,.25],.022,.020,paint,5);
      mesh.box(side*.822,.808,.44,.026,.040,.17,"778396");
      mesh.box(side*.798,1.015,-.78,.165,.089,.20,"343d4a");
      mesh.box(side*.61,.685,back-.019,.275,.13,.086,"a43843");
      mesh.box(side*.61,.699,back+.027,.234,.044,.014,"d84a50");
      mesh.box(side*.61,.644,back+.020,.223,.035,.019,"bd9871");
      mesh.box(side*.70,.69,-1.91,.26,.11,.14,"dbcaaa");
    }
    return {mesh,distant,width:.92,front:2.03,rear:back+.05,tail:[.61,.70]};
  }

  function makeTrafficHeavy({paint,bodyPaint=paint,front,rear,bus=false,trailer=false}) {
    const mesh = new Mesh();
    const width = 1.24, height = bus ? 3.15 : 3.58;
    const bodyFront = bus ? -front+.12 : trailer ? -.2 : -front+2.28;
    const bodyLength = rear-.10-bodyFront;
    const center = bodyFront+bodyLength/2;
    mesh.box(0,.59,(rear-front)/2,1.91,.28,front+rear-.20,"29313c");
    vehicleShell(mesh,[[.81,1.13,bodyFront,rear-.16],[1.03,width,bodyFront,rear-.08],
      [height-.16,width,bodyFront+.035,rear-.10],[height,1.10,bodyFront+.19,rear-.27]],bodyPaint);
    const distant = new Mesh();
    distant.faces = mesh.faces.slice();
    distant.box(0,.48,center,2.24,.52,bodyLength-.34,"29313c");
    if (bus) {
      for (const side of [-1,1]) {
        const step = bodyLength/6;
        for (let i=0;i<6;i++) {
          mesh.box(side*1.242,2.32,bodyFront+step*(i+.5),.023,.74,step-.18,"405c70");
        }
        mesh.box(side*1.242,1.77,center,.026,.095,bodyLength-.32,"b7c1ca");
      }
      mesh.box(0,2.30,rear-.091,1.78,.69,.023,"314859");
      distant.box(0,2.30,rear-.091,1.78,.69,.023,"314859");
      mesh.box(0,2.37,-front+.156,1.87,.82,.025,"40566c");
      mesh.box(0,height+.025,center+.65,1.52,.142,2.1,"dadee4");
    } else {
      const cabBack = bodyFront-.10;
      const cab = [[.70,1.02,-front+.06,cabBack],[1.46,1.17,-front+.05,cabBack],
        [2.63,1.13,-front+.36,cabBack-.06],[2.91,1.02,-front+.57,cabBack-.22]];
      vehicleShell(mesh,cab,paint);
      vehicleShell(distant,cab,paint);
      mesh.box(0,1.97,-front+.15,1.69,.45,.03,"344b62");
      for (const side of [-1,1]) mesh.box(side*1.14,2.08,(cabBack-front+.45)/2,.035,.46,.82,"3f556b");
      mesh.box(0,2.23,rear-.087,.036,2.04,.043,"495663");
      for (const side of [-1,1]) {
        mesh.tube([side*.36,1.20,rear-.066],[side*.36,height-.32,rear-.066],.035,.030,"929da4",6);
        mesh.box(side*1.23,1.22,center,.038,.087,bodyLength-.24,"a0a8ad");
      }
    }
    for (const side of [-1,1]) {
      const axles = trailer ? [-front+1.0,bodyFront-.68,rear-2.4,rear-1.28] : [-front+1.46,rear-1.64];
      for (const z of axles) {
        mesh.tube([side*.91,.49,z],[side*1.23,.49,z],.46,.48,"202732",8);
        mesh.tube([side*1.23,.49,z],[side*1.265,.49,z],.25,.24,"7e8b98",8);
      }
      mesh.box(side*.99,.98,rear-.018,.20,.31,.069,"612d37");
      mesh.box(side*.99,1.013,rear+.022,.16,.118,.024,"e25059");
      mesh.box(side*.99,.900,rear+.019,.16,.057,.018,"d19e62");
    }
    mesh.box(0,.65,rear-.018,2.41,.165,.14,"424d5a");
    mesh.box(0,.79,rear+.019,.39,.122,.034,"c8cbd0");
    return {mesh,distant,width:1.28,front,rear:rear+.08,tail:[.99,1.013]};
  }

  function makeFather() {
    const mesh = new Mesh();
    const skin = "d39a75";
    mesh.lathe(0,0,[[.12,.25,.16],[.32,.31,.18],[.53,.34,.19],[.63,.23,.14]],"f4ede5");
    mesh.tube([0,.51,.084],[0,.75,.052],.151,.121,skin,8);
    mesh.egg(0,.89,-.006,.219,.266,.198,skin,10);
    mesh.lathe(0,-.035,[[1.002,.196,.168],[1.087,.17,.142],[1.143,.105,.106],[1.162,.038,.042]],"392d2b",10);
    mesh.egg(0,.900,.186,.054,.058,.054,"e0a682",6);
    mesh.box(0,.794,.167,.128,.041,.038,"623738");
    mesh.box(0,.804,.187,.105,.014,.012,"f1ddc6");
    for (const side of [-1,1]) {
      mesh.egg(side*.218,.892,.004,.044,.080,.036,skin,6);
      mesh.egg(side*.091,.952,.158,.057,.029,.026,"e9d8c6",6);
      mesh.egg(side*.092,.949,.179,.024,.025,.012,"4a6877",5);
      mesh.tube([side*.039,.980,.175],[side*.135,1.005,.146],.016,.015,"5c4034",5);
      mesh.tube([side*.26,.542,0],[side*.36,.301,.125],.103,.085,skin,8);
      mesh.tube([side*.36,.301,.125],[side*.27,.242,.28],.083,.064,skin,8);
      mesh.egg(side*.27,.233,.289,.067,.053,.081,skin,6);
    }
    return mesh;
  }

  const roadTraffic = [makeTrafficCar("586c82",1.46,false),makeTrafficCar("ae9a75",1.42,false),
    makeTrafficCar("7d9a92",1.79,true),makeTrafficCar("8d535a",1.45,false),makeTrafficCar("a1a9bb",1.67,true),
    makeTrafficHeavy({paint:"b5c4cd",bodyPaint:"657b92",front:3.17,rear:4.13}),
    makeTrafficHeavy({paint:"617b6e",bodyPaint:"c4bbb0",front:3.74,rear:7.86,trailer:true}),
    makeTrafficHeavy({paint:"78a696",front:4.67,rear:5.62,bus:true}),
    makeTrafficHeavy({paint:"a98a5e",front:4.48,rear:5.44,bus:true})];
  function makeRoadBridge() {
    const cab = makeParkedTruck(parkedTrucks.find(vehicle=>vehicle.id==="bridge"),true).mesh;
    const driver = makeFather();
    const faceOut = poseTransform(1.22,.88,0);
    return Array.from({length:9},(_,pose)=>{
      const amount = pose/8;
      const lean = poseTransform(0,1,-.40*amount);
      const place = point => {
        const [x,y,z] = lean(faceOut(point));
        return [x+.72+amount*.34,y+1.77,z-.27];
      };
      const mesh = new Mesh();
      mesh.faces = cab.faces.slice();
      mesh.add(driver,place);
      return {mesh,speech:place([.02,1.21,.08])};
    });
  }

  function makeRoadTrim(vehicle) {
    const mesh = new Mesh();
    mesh.faces = vehicle.mesh.faces.slice();
    const trailer = new Mesh();
    trailer.faces = vehicle.trailer.faces.slice();
    trailer.box(0,.54,12.42,2.46,.16,.24,"526170");
    trailer.box(0,.65,12.55,.43,.12,.028,"b8c2ca");
    for (const side of [-1,1]) {
      trailer.box(side*1.02,.80,12.46,.42,.19,.13,"313940");
      trailer.box(side*1.04,.83,12.536,.269,.059,.020,"d14f56");
      trailer.box(side*1.04,.756,12.537,.269,.032,.018,"b88653");
    }
    if (vehicle.gem) {
      vehicleShell(mesh,[[1.43,1.01,-2.57,.69],[1.71,1.025,-2.56,.72]],"889eae");
      vehicleShell(mesh,[[1.71,1.025,-2.56,.72],[2.53,.89,-2.10,.53]],"374d62");
      vehicleShell(mesh,[[2.50,.91,-2.13,.56],[2.69,.79,-1.99,.45]],"869eb1");
    } else {
      const roof = vehicle.roof;
      mesh.box(0,roof-.017,(vehicle.glassZ+vehicle.back)*.53,.86,.073,.43,"596779");
      for (const side of [-1,1]) mesh.box(side*vehicle.width*.60,roof-.07,vehicle.back-.4,.053,.083,.52,"657685");
    }
    return {...vehicle,mesh,trailer};
  }

  const roadBridge = makeRoadBridge();
  const roadVehicles = [roadAveo,...parkedTrucks.filter(vehicle=>vehicle.id!=="bridge").map(makeRoadTrim)];

  const parkedWoman=new Mesh();
  parkedWoman.lathe(0,0,[[.69,.22,.13],[.98,.25,.15],[1.35,.25,.16],[1.44,.17,.118]],"d8c9b8",8);
  parkedWoman.egg(0,1.54,.026,.129,.164,.125,"d3a48b",8);
  parkedWoman.egg(0,1.62,-.041,.141,.136,.128,"433638",8);
  for (const side of [-1,1]) {
    parkedWoman.tube([side*.10,.85,0],[side*.11,.08,.04],.095,.072,"343746");
    parkedWoman.box(side*.11,.057,-.015,.16,.10,.26,"342b2f");
    parkedWoman.tube([side*.203,1.37,0],[side*.273,.91,.035],.084,.050,"d8c9b8");
    parkedWoman.egg(side*.276,.87,.039,.053,.079,.057,"c99783",6);
  }

  return {runner,walker,bride,items,icons,policeDimensions,jumpSoleHeight,poseTransform,Mesh,parkedTrucks,parkedAveo,roadAveo,parkedWoman,
    roadTraffic,roadBridge,roadVehicles};
})();
