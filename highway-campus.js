"use strict";

window.WeddingCampus = class WeddingCampus {
  static x = 38;
  static setback = 48;
  static scale = 1.25;
  static drivewayStart = -13;
  static drivewayEnd = 18;
  static approachTime = 3;

  static approach(start,meters,progress) {
    const t = 1-(1-progress)**2;
    const u = 1-t;
    const endX = WeddingCampus.x-5.25;
    const guideX = WeddingCampus.x-8;
    const firstX = start.x+Math.max(0,Math.tan(start.heading))*14;
    const x = u**3*start.x+3*u*u*t*firstX+3*u*t*t*guideX+t**3*endX;
    const distance = meters+3*u*u*t*14+3*u*t*t*16+t**3*25;
    const dx = u*u*(firstX-start.x)+2*u*t*(guideX-firstX)+t*t*(endX-guideX);
    const dz = u*u*14+2*u*t*2+t*t*9;
    const turnIn = Math.min(1,t*8);
    const heading = start.heading+(Math.atan2(dx,dz)-start.heading)*turnIn;
    return {x,distance,heading};
  }

  static walkToEntrance(state,time) {
    const smooth = WeddingDrive.smooth;
    const turn = WeddingModels.poseTransform(state.heading,1,0);
    const step = smooth((time-.22)/.79);
    const front = state.isTruck ? .68 : .29;
    const width = state.isTruck ? 1.52 : 1.27;
    const [dx,,dz] = turn([-(width+.56*step),0,front]);
    const walk = Math.min(1,Math.max(0,(time-1.03)/4.55));
    const walkX = smooth((walk-.15)/.44);
    const endZ = state.finishMeters+WeddingCampus.setback-state.distance-.43;
    const z = dz+(endZ-dz)*walk;
    const stairs = .2625*smooth((z-endZ+1.63)/.30)+.19375*smooth((z-endZ+1.13)/.30);
    return {
      x:state.x+dx+(WeddingCampus.x-state.x-dx)*walkX,
      y:(state.isTruck ? 1.22 : .57)*(1-step)+stairs,
      z,yaw:state.heading-Math.PI*.5*(1-smooth(walk*5.3))+.71*walkX*(1-walkX)*3,
      stride:step*.96+walk*(endZ-dz),door:smooth((z-endZ+7.6)/3.6),
      visible:time>=.22, camera:smooth((time-.52)/2.55),
      driverView:smooth((time-.07)/.67)*(1-smooth((time-1.22)/1.25)),
      wash:smooth((time-4.91)/.68),time
    };
  }

  constructor() {
    const mesh = new WeddingModels.Mesh();
    const stone = "657389", trim = "a9a397", roof = "33465e";
    const front = (z,outline,color)=>{
      mesh.faces.push([outline.map(([x,y])=>[x,y,z]),color]);
    };
    const arch = (x,y,w,h,z,color)=>{
      front(z,[[x-w/2,y],[x-w/2,y+h*.56],[x-w*.39,y+h*.78],[x,y+h],
        [x+w*.39,y+h*.78],[x+w/2,y+h*.56],[x+w/2,y]],color);
    };
    const window = (x,y,w,h,z,warm)=>{
      arch(x,y-.1,w+.32,h+.30,z+.05,trim);
      arch(x,y,w,h,z,"202e42");
      arch(x,y+.19,w-.25,h-.35,z-.025,warm ? "e6a164" : "465e7a");
      if (warm) arch(x,y+.64,w-.52,h-.83,z-.041,"f6bb73");
      mesh.box(x,y+h*.41,z-.055,.09,h*.78,.05,"5b5154");
      mesh.box(x,y+h*.38,z-.055,w-.14,.095,.05,"5b5154");
      mesh.box(x,y-.11,z-.17,w+.42,.18,.42,trim);
    };
    const cornice = (x,y,z,w,d)=>{
      mesh.box(x,y,z,w+.34,.24,d+.35,trim);
      mesh.box(x,y+.25,z,w+.13,.22,d+.16,stone);
    };
    const wall = (x,width,height,z,depth,color)=>{
      mesh.box(x,height/2,z+depth/2,width,height,depth,color);
      for (let y=.85,row=0;y<height-.65;y+=.47,row++) {
        const left = x-width/2+.06, right = x+width/2-.06;
        front(z-.008,[[left,y],[left,y+.021],[right,y+.021],[right,y]],"556478");
        for (let joint=left+.59+(row%2)*.62;joint<right-.2;joint+=1.27) {
          front(z-.009,[[joint,y],[joint,y+.47],[joint+.022,y+.47],[joint+.022,y]],"59687b");
        }
      }
      for (const y of [.37,4.04,height-.45]) cornice(x,y,z+depth/2,width,depth);
    };
    const gable = (x,z,w,d,y,rise)=>{
      const left = [x-w/2,y,z], middle = [x,y+rise,z], right = [x+w/2,y,z];
      const back = point=>[point[0],point[1],point[2]+d];
      mesh.faces.push([[left,middle,right],stone],
        [[left,back(left),back(middle),middle],"475d76"],
        [[middle,back(middle),back(right),right],roof]);
      mesh.tube([x,y+rise+.04,z],[x,y+rise+.04,z+d],.13,.13,"82939f",6);
      for (const edge of [left,right]) mesh.tube(edge,middle,.13,.10,trim,6);
    };
    const pinnacle = (x,z,y,height,width)=>{
      mesh.lathe(x,z,[[y,width,width],[y+.37,width*1.10,width*1.10],
        [y+height*.64,width*.23,width*.23],[y+height,.035,.035]],
        ["3b526b","40586e","263b55","304561"],8);
      mesh.tube([x,y+height,z],[x,y+height+.55,z],.035,.026,"d2ae6a",6);
      mesh.egg(x,y+height+.58,z,.12,.16,.12,"d2ae6a",6);
    };
    const tower = (x,z,w,height,spire)=>{
      wall(x,w,height,z,w*.86,stone);
      for (const y of [height-2.0,height-.22]) cornice(x,y,z+w*.43,w,w*.86);
      window(x,1.55,w*.27,2.10,z-.05,false);
      window(x,height-5.08,w*.31,2.50,z-.05,true);
      for (const side of [-1,1]) {
        mesh.box(x+side*(w/2-.20),height*.48,z-.035,.31,height*.90,.26,"8293a3");
        pinnacle(x+side*(w/2-.18),z+.16,height-.18,2.65,.43);
      }
      pinnacle(x,z+w*.43,height,spire,w*.57);
    };
    const buttress = (x,z,height)=>{
      mesh.box(x,height*.43,z-.26,.46,height*.86,.68,"87949e");
      mesh.box(x,height*.30,z-.44,.58,height*.59,.70,trim);
      mesh.box(x,.68,z-.62,.76,1.33,1.17,stone);
      pinnacle(x,z-.41,height*.85,1.32,.28);
    };

    // Higher roofs and spires sit behind the academic wings.
    tower(-12.2,9,5.6,17.5,8.1);
    tower(9.5,11,5.25,16.6,6.6);
    for (const side of [-1,1]) {
      const x = side*12.1;
      wall(x,11.7,9.1,2,9.5,"617188");
      gable(x,1.8,12.1,9.7,9.28,4.8);
      for (const i of [-1,0,1]) {
        const bay = x+i*3.37;
        window(bay,1.36,1.29,2.18,1.94,i!==side);
        window(bay,4.88,1.51,2.96,1.94,i!==0 || side===1);
      }
      for (const post of [-5.53,-1.72,1.72,5.53]) buttress(x+post,1.90,7.8);
      window(x,9.46,1.06,1.75,1.75,true);
    }
    tower(-18.85,1.2,4.46,13.6,6.05);
    tower(18.85,2.0,5.05,14.5,7.05);

    wall(0,15.4,11.6,.0,9.1,"718199");
    gable(0,-.12,15.82,9.42,11.75,6.13);
    for (const side of [-1,1]) {
      window(side*5.07,1.76,1.67,3.23,-.05,true);
      window(side*5.22,6.6,1.48,3.78,-.05,false);
      buttress(side*7.04,-.10,10.5);
      pinnacle(side*6.9,.21,11.4,3.44,.63);
      mesh.box(side*4.0,1.28,-.91,.55,2.54,.57,trim);
      mesh.egg(side*4.0,2.74,-.91,.18,.30,.18,"ffce83");
    }
    arch(0,.025,6.12,7.10,-.10,trim);
    arch(0,.081,5.33,6.61,-.16,"576776");
    arch(0,.14,4.75,6.19,-.21,"b38a63");
    arch(0,.18,4.34,5.89,-.27,"36262c");
    arch(0,.26,4.04,5.64,-.282,"332724");
    front(-.308,[[-2.02,3.67],[-1.55,4.69],[0,5.90],[1.55,4.69],[2.02,3.67]],"78513a");
    this.entranceLight = new WeddingModels.Mesh();
    this.entranceLight.box(0,2.012,-.325,4.014,3.31,.009,"fff1d6");
    this.entranceLeaves = [];
    for (const side of [-1,1]) {
      const leaf = new WeddingModels.Mesh();
      const w = 2.01;
      leaf.box(-side*w/2,1.96,0,w,3.46,.11,"4c3539");
      leaf.box(-side*w/2,2.01,-.066,w-.18,3.12,.045,"77533f");
      for (let i=1;i<=4;i++) {
        leaf.box(-side*w*i/5,1.96,-.105,.034,3.1,.032,"57393a");
      }
      leaf.egg(-side*(w-.24),1.98,-.14,.055,.09,.055,"e3ae68",6);
      this.entranceLeaves.push({leaf,side});
    }
    const round = (x,y,r,z,color)=>{
      front(z,Array.from({length:24},(_,i)=>{
        const angle = i*Math.PI/12;
        return [x+r*Math.cos(angle),y-r*Math.sin(angle)];
      }),color);
    };
    const rose = 14.02;
    round(0,rose,1.52,-.20,trim);
    round(0,rose,1.33,-.23,"25324c");
    for (let i=0;i<8;i++) {
      const angle = i*Math.PI/4;
      const cx = Math.cos(angle), cy = Math.sin(angle);
      round(.77*cx,rose+.77*cy,.31,-.25,i%2 ? "e6aa6b" : "a06886");
      mesh.tube([cx*.27,rose+cy*.27,-.28],[cx*1.29,rose+cy*1.29,-.28],.038,.053,"b4a18a",5);
    }
    round(0,rose,.43,-.31,"b99d73");
    round(0,rose,.30,-.34,"fcce82");
    mesh.box(0,.105,-.84,8.0,.21,1.4,"888b8c");
    mesh.box(0,.235,-.49,7.3,.26,1.3,"9d9b91");

    for (const side of [-1,1]) {
      const x = side*8.9, z = -14;
      mesh.box(x,.16,z,.55,.32,.55,"899597");
      mesh.tube([x,.25,z],[x,2.34,z],.073,.046,"444b52",8);
      mesh.box(x,2.51,z,.24,.32,.24,"ffcc86");
      mesh.box(x,2.69,z,.36,.08,.36,"56555c");
      pinnacle(x,z,2.72,.27,.23);
      for (const deck of [-18.2,-12.0,-5.8]) {
        const edge = side*13.4;
        mesh.box(edge,.18,deck,1.56,.36,3.72,"737c7f");
        mesh.box(edge,.37,deck,1.66,.16,3.86,"8e9693");
        for (let plant=0;plant<3;plant++) {
          mesh.egg(edge,.62,deck+(plant-1)*1.09,.60,.58,.68,
            plant===1 ? "425d56" : "394e4d",8);
        }
      }
    }
    this.mesh = mesh;

    const image = document.createElement("canvas");
    image.width = 1024;
    image.height = 220;
    const g = image.getContext("2d");
    g.fillStyle = "#252c3b";
    g.fillRect(0,0,image.width,image.height);
    g.strokeStyle = "#ba9567";
    g.lineWidth = 5;
    g.strokeRect(12,12,1000,196);
    g.strokeStyle = "#6f6057";
    g.lineWidth = 2;
    g.strokeRect(26,26,972,168);
    g.fillStyle = "#f9dd9d";
    g.font = "bold 131px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("ГАУМАНКА",512,115,894);
    this.plaque = {image,start:0,width:image.width};
  }

  grounds(p,z) {
    const {x,scale,drivewayStart} = WeddingCampus;
    const left = x-23*scale, right = x+24*scale;
    const depth = offset=>z+offset*scale;
    p.plane(9,x+31*scale,depth(-57),depth(14),-.004,"#202f34");
    const entrance = z-WeddingCampus.setback;
    p.face([[8,.018,entrance+drivewayStart],[16,.018,entrance-11],[29,.018,entrance-2],
      [44,.018,entrance+14],[49,.018,z-.1],[24,.018,z-.1],[24,.018,entrance+34],
      [17,.018,entrance+25],[8,.018,entrance+WeddingCampus.drivewayEnd]],"#414652");
    p.plane(left,right,depth(-19),z-.1,.029,"#4c505a");
    for (let n=-6;n<=6;n++) {
      const joint = x+n*3.5*scale;
      p.plane(joint-.024,joint+.024,depth(-19),z-.12,.031,"#313c49");
    }
    for (let line=depth(-16);line<z-1;line+=3.6*scale) {
      p.plane(left,right,line,line+.05,.031,"#353d48");
    }
  }

  entrance(layer,z,open) {
    const {x,scale} = WeddingCampus;
    if (open>0) layer.add(this.entranceLight,x,0,z,0,scale);
    for (const {leaf,side} of this.entranceLeaves) {
      layer.add(leaf,x+side*2.02*scale,0,z-.39*scale,-side*open*1.48,scale);
    }
  }

  entranceSpill(p,z,strength) {
    const {x} = WeddingCampus, g = p.ctx;
    const [sx,sy] = p.project(x,.04,z-1.7);
    const [tx,ty] = p.project(x,.04,z-10.8);
    const falloff = g.createLinearGradient(sx,sy,tx,ty);
    falloff.addColorStop(0,"#fff0cfb0");
    falloff.addColorStop(.36,"#f9d3a254");
    falloff.addColorStop(1,"#f2b9a500");
    g.save();
    g.globalCompositeOperation = "screen";
    for (let i=0;i<4;i++) {
      const edge = i*.38;
      g.globalAlpha = strength*.31;
      p.face([[x-2.27+edge,.04,z-1.28],[x+2.27-edge,.04,z-1.28],
        [x+4.3-edge*1.5,.04,z-10.8],[x-4.3+edge*1.5,.04,z-10.8]],falloff);
    }
    g.restore();
  }

  entranceBloom(p,z,{door,wash,time}) {
    const {x,scale} = WeddingCampus, g = p.ctx;
    const sourceZ = z-.32*scale;
    const [sx,sy] = p.project(x,2.55,sourceZ);
    const depth = p.depth(2.55,sourceZ);
    const rx = p.fx*4.64/depth, ry = p.fy*4.28/depth;
    const strength = WeddingDrive.smooth(door*1.5);
    g.save();
    g.globalCompositeOperation = "screen";
    g.translate(sx,sy);
    g.scale(rx,ry);
    const aura = g.createRadialGradient(0,-.04,.05,0,0,1);
    aura.addColorStop(0,"#fffaf19c");
    aura.addColorStop(.28,"#ffe5bb76");
    aura.addColorStop(.60,"#e7b4d12b");
    aura.addColorStop(1,"#f9cee900");
    g.globalAlpha = strength;
    g.fillStyle = aura;
    g.fillRect(-1,-1,2,2);
    g.restore();

    g.save();
    g.globalCompositeOperation = "screen";
    for (let i=0;i<17;i++) {
      const age = (p.rnd(i+213)+time*(.32+p.rnd(i+914)*.16))%1;
      const lateral = (p.rnd(i+524)-.5)*(3.61+age*4.3);
      const y = .53+p.rnd(i+20)*3.71+age*age*.43;
      const zz = sourceZ-.09-age*4.6;
      const [px,py] = p.project(x+lateral,y,zz);
      const size = p.fy*(.009+p.rnd(i+519)*.017)/p.depth(y,zz);
      g.globalAlpha = .65*strength*Math.sin(age*Math.PI)**2;
      p.ellipse(px,py,size,size*.86,i%3 ? "#fff0c3" : "#f4d6f7");
    }
    g.restore();

    if (wash<=0) return;
    const radius = Math.max(p.w,p.h)*(.18+1.44*wash);
    const veil = g.createRadialGradient(sx,sy,0,sx,sy,radius);
    veil.addColorStop(0,"#fff8e8");
    veil.addColorStop(.34+.33*wash,"#fff8e8");
    veil.addColorStop(.84,"#fff1d6a0");
    veil.addColorStop(1,"#fff1d600");
    g.save();
    g.globalAlpha = Math.min(1,wash*1.38);
    g.fillStyle = veil;
    g.fillRect(0,0,p.w,p.h);
    g.globalAlpha = WeddingDrive.smooth((wash-.73)/.27);
    g.fillStyle = "#fff8e8";
    g.fillRect(0,0,p.w,p.h);
    g.restore();
  }

  sign(p,z) {
    const {x,scale} = WeddingCampus;
    const corners = [[-5.52,9.98],[5.52,9.98],[5.52,7.66],[-5.52,7.66]];
    p.sticker(corners.map(([dx,y])=>p.project(x+dx*scale,y*scale,z-.30*scale)),this.plaque);
  }
};
