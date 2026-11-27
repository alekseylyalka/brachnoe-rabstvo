"use strict";

window.WeddingCampusDorm = class WeddingCampusDorm {
  static roomModelEntranceZ = 72;
  static entranceZ = 96;
  static residentZ = this.entranceZ+7.1;
  static rate = 2500;

  constructor() {
    this.room = this.makeRoom();
    this.door = this.makeDoor();
    this.poses = new Map();
  }

  static lettering(mesh,text,cx,y,z,height,color) {
    const glyphs = {
      "О":[[[.12,0],[.66,0],[.78,.17],[.78,.83],[.66,1],[.12,1],[0,.83],[0,.17],[.12,0]]],
      "Б":[[[.75,1],[0,1],[0,0],[.63,0],[.76,.12],[.76,.40],[.63,.53],[0,.53]]],
      "Щ":[[[0,1],[0,0],[.90,0],[.90,1]],[[.45,1],[.45,0]],[[.90,0],[1.06,0],[1.06,-.20]]],
      "А":[[[0,0],[.39,1],[.78,0]],[[.15,.36],[.63,.36]]],
      "Г":[[[0,0],[0,1],[.71,1]]],
      "3":[[[0,.89],[.13,1],[.58,1],[.74,.88],[.74,.66],[.60,.52],[.22,.52]],[[.60,.52],[.76,.39],[.76,.13],[.60,0],[.13,0],[0,.11]]],
      "2":[[[0,.84],[.14,1],[.60,1],[.75,.88],[.75,.68],[0,.08],[0,0],[.78,0]]]
    };
    let left = cx-height*(text.length*1.01-.23)/2;
    const stroke = height*.073;
    for (const letter of text) {
      for (const path of glyphs[letter]) {
        const points = path.map(([x,dy])=>[left+height*x,y+height*dy,z]);
        for (let i=1;i<points.length;i++) mesh.tube(points[i-1],points[i],stroke,stroke,color,6);
        for (const point of points) mesh.egg(...point,stroke,stroke,stroke,color,6);
      }
      left += height*(letter==="Щ" ? 1.30 : 1.01);
    }
  }

  makeDoor() {
    const m = new WeddingModels.Mesh();
    m.box(1.66,1.94,0,3.32,3.84,.18,"41564f");
    for (const x of [.84,2.48]) {
      for (const y of [.99,2.74]) {
        m.box(x,y,-.105,1.43,1.50,.055,"94765a");
        m.box(x,y,-.141,1.31,1.37,.023,"657567");
      }
    }
    m.box(1.66,2.91,-.171,1.29,.55,.060,"aa7653");
    m.box(1.66,2.91,-.208,1.20,.46,.023,"654938");
    WeddingCampusDorm.lettering(m,"332",1.66,2.752,-.235,.314,"ffdb9e");
    m.egg(3.05,1.56,-.151,.086,.078,.093,"dfa974",8);
    return m;
  }

  makeRoom() {
    const m = new WeddingModels.Mesh();
    const rose = "d791ab", ivory = "ffe1d7", brass = "c39873";
    const entry = WeddingCampusDorm.roomModelEntranceZ;
    const back = 83.4, center = (back+entry)/2, depth = back-entry;
    m.box(0,2.46,back,8.9,4.92,.30,"e7a5b9");
    m.box(0,4.92,center,8.9,.16,depth,"f6ced5");
    for (const side of [-1,1]) {
      m.box(side*4.45,2.46,center,.24,4.92,depth,rose);
      m.box(side*4.29,.16,center,.13,.32,depth,"a85d80");
      m.box(side*4.29,4.67,center,.16,.18,depth,"e9b1bd");
    }
    m.box(0,-.089,center,8.9,.13,depth,"946b65");
    const wood = ["ba897e","c69a8e","d4aa98","bf9086"];
    for (let i=-8;i<=8;i++) {
      const seam = (i+8)%3*.88;
      for (let start=entry-(2.77-seam)%2.77,j=0;start+.008<back;start+=2.77,j++) {
        const near = Math.max(start+.008,entry), far = Math.min(start+2.762,back);
        m.box(i*.52,-.024,(near+far)/2,.508,.048,far-near,wood[(i*5+j+44)%4]);
      }
    }

    // Pink area rug and the flower pattern in its centre.
    for (const [y,xr,zr,color] of [[.009,2.54,2.69,"a94d75"],[.014,2.42,2.56,"e3a4b6"],[.019,2.34,2.48,"ce779d"]]) {
      this.floorOval(m,0,y,78.55,xr,zr,color);
    }
    for (let i=0;i<6;i++) {
      const angle = i*Math.PI/3;
      this.floorOval(m,.51*Math.cos(angle),.022,78.55+.51*Math.sin(angle),.27,.27,"f6b7ca");
    }
    this.floorOval(m,0,.026,78.55,.32,.32,"e291b1");

    // Bed, folded quilt and small pieces of furniture sit along the sides.
    m.box(2.96,.40,81.53,2.05,.50,3.20,"884c63");
    m.box(2.96,1.12,83.09,2.08,1.58,.19,"b86f91");
    m.box(2.96,.72,81.56,1.96,.30,2.98,ivory);
    m.box(2.96,.80,81.14,2.01,.24,2.17,"af5685");
    for (const z of [80.24,80.75,81.26,81.77]) {
      m.box(2.96,.928,z,1.96,.018,.036,"d484a6");
    }
    for (const x of [2.48,3.43]) m.egg(x,.91,82.70,.43,.18,.31,"fff0e4",10);
    m.box(-2.98,.62,81.67,1.82,1.24,1.04,"b77491");
    m.box(-2.98,1.24,81.65,1.94,.13,1.16,ivory);
    for (const y of [.31,.67,1.02]) {
      m.box(-2.98,y,81.123,1.62,.29,.067,"d393a9");
      m.egg(-2.98,y,81.061,.071,.047,.051,brass,8);
    }
    m.lathe(-3.50,81.69,[[1.31,.23,.20],[1.36,.22,.19],[1.69,.038,.038],[1.90,.048,.048]],brass,10);
    m.lathe(-3.50,81.69,[[1.74,.29,.26],[2.16,.18,.17],[2.19,.17,.16]],["ffc7d1","ffdae0","ef99af"],10);
    for (let i=0;i<4;i++) {
      m.box(-2.61+i*.12,1.52,81.64,.116,.43-(i%3)*.065,.29,["883b64","e2a485","8c6b91","ac6079"][i]);
    }

    // Cool window panes behind curtains, a garland and a framed heart.
    m.box(2.01,3.24,83.22,2.41,2.23,.19,"a36388");
    m.box(2.01,3.24,83.10,2.20,2.00,.071,"747aab");
    for (const x of [1.50,2.52]) {
      for (const y of [2.77,3.71]) m.box(x,y,83.054,1.002,.909,.022,"a8b2d2");
    }
    m.box(2.01,2.18,83.02,2.66,.12,.37,ivory);
    m.tube([.43,4.43,82.94],[3.59,4.43,82.94],.036,.036,brass,8);
    for (const side of [-1,1]) {
      const x = 2.01+side*1.2;
      for (let i=0;i<5;i++) {
        m.tube([x+side*i*.095,4.42,82.94],[x+side*(.10+i*.074),2.14,82.90],
          .084,.072,i%2 ? "da8aaa" : "eeacc2",8);
      }
    }
    m.box(-2.42,3.33,83.20,1.48,1.48,.13,brass);
    m.box(-2.42,3.33,83.119,1.34,1.34,.046,"ffe0d6");
    for (const side of [-1,1]) m.egg(-2.42+side*.21,3.49,83.088,.29,.25,.023,"d873a0",10);
    m.faces.push([[[-2.42,2.96,83.062],[-2.88,3.39,83.062],[-1.96,3.39,83.062]],"d873a0"]);
    const bulb = i=>[i*.55,4.62-.38*(1-(i/7)**2),83.02];
    for (let i=-7;i<7;i++) m.tube(bulb(i),bulb(i+1),.016,.016,"996479");
    for (let i=-7;i<=7;i++) {
      const [x,y,z] = bulb(i);
      m.egg(x,y-.066,z,.053,.079,.054,i%2 ? "ffe2b3" : "fff0d2",8);
    }
    m.tube([0,4.90,78.8],[0,4.23,78.8],.036,.036,brass);
    m.lathe(0,78.8,[[3.99,.49,.49],[4.05,.46,.46],[4.32,.19,.19],[4.35,.16,.16]],
      ["f7b1c2","ffd4d9","eda6bd"],12);
    m.lathe(0,78.8,[[3.974,.39,.39],[3.99,.44,.44]],"ffeacb",12);
    return m;
  }

  floorOval(m,x,y,z,rx,rz,color) {
    const points = Array.from({length:24},(_,i)=>{
      const a = -i*Math.PI/12;
      return [x+rx*Math.cos(a),y,z+rz*Math.sin(a)];
    });
    m.faces.push([points,color]);
  }

  pose(amount) {
    const step = Math.round(amount*48);
    if (!this.poses.has(step)) {
      this.poses.set(step,step===48 ? WeddingModels.bride(0) : this.makeResident(step/48));
    }
    return this.poses.get(step);
  }

  makeResident(t) {
    const m = new WeddingModels.Mesh();
    const mix = (from,to)=>from+(to-from)*t;
    const point = (from,to)=>from.map((n,i)=>mix(n,to[i]));
    const paint = (from,to)=>{
      const target = to.match(/../g);
      return from.match(/../g).map((c,i)=>Math.round(mix(parseInt(c,16),parseInt(target[i],16)))
        .toString(16).padStart(2,"0")).join("");
    };
    const ring = (from,to)=>from.map((a,i)=>point(a,to[i]));
    const skin = paint("dfae8c","dbab91"), hair = paint("6b4736","38262d");
    const lace = paint("5b294b","f1ddc2");
    const skirt = ["f1ddc2","fff3e0","dbbea0","f5dfc8","fff8e8","e7c8ac"];
    m.lathe(0,0,ring([[.98,.122,.103],[1.10,.176,.116],[1.27,.152,.101],[1.42,.132,.103],[1.61,.205,.119],[1.69,.118,.079]],
      [[.96,.348,.287],[.98,.351,.294],[1.10,.390,.318],[1.26,.368,.277],[1.38,.290,.21],[1.40,.268,.20]]),paint("dfae8c","f0d7bf"),10);
    m.lathe(0,mix(.008,-.06),ring([[.984,.111,.107],[1.004,.139,.113],[1.042,.164,.118],
      [1.103,.181,.123],[1.148,.171,.118],[1.17,.155,.112]],
      [[.022,.76,.50],[.14,.76,.49],[.39,.66,.45],[.67,.55,.39],[.87,.45,.344],[1.06,.35,.29]]),
      skirt.map(color=>paint("6b3457",color)),12);
    m.lathe(0,mix(.017,-.06),ring([[1.127,.175,.124],[1.145,.172,.122],[1.164,.165,.12]],
      [[.067,.771,.508],[.102,.773,.507],[.13,.764,.497]]),paint("be7ca2","f1e4ca"),12,false);
    m.lathe(0,mix(.018,.031),ring([[1.381,.147,.110],[1.404,.149,.116],[1.489,.169,.138],[1.537,.175,.122],[1.566,.180,.108]],
      [[.957,.354,.295],[1.08,.388,.318],[1.17,.389,.318],[1.26,.369,.277],[1.401,.269,.201]]),paint("61334f","f0d7bf"),10);
    m.lathe(0,mix(.027,.018),ring([[1.375,.150,.113],[1.402,.154,.119]],[[1.008,.375,.308],[1.05,.389,.319]]),
      paint("b9749c","e5b899"),10,false);
    m.tube([0,mix(1.63,1.36),0],[0,mix(1.80,1.54),0],mix(.059,.111),mix(.062,.104),skin);
    m.egg(0,mix(1.95,1.625),mix(-.052,-.050),mix(.133,.218),mix(.187,.259),mix(.137,.186),hair,8);
    m.egg(0,mix(1.94,1.62),mix(.047,.048),mix(.113,.196),mix(.164,.214),mix(.120,.175),skin,8);
    m.egg(mix(-.036,-.06),mix(2.058,1.77),.025,mix(.092,.149),mix(.072,.103),mix(.108,.155),hair,8);
    m.egg(0,mix(1.89,1.44),mix(-.157,-.145),mix(.085,.176),mix(.07,.37),mix(.082,.127),"3f2c32",10);
    m.egg(0,mix(1.882,1.546),mix(.156,.200),mix(.035,.048),.018,.024,"a06669",6);
    for (const side of [-1,1]) {
      const elbow = point([side*.256,1.37,.013],[side*.45,1.12,0]);
      const hand = point([side*.267,1.12,.065],[side*.457,1,.176]);
      m.tube(point([side*.174,1.61,0],[side*.267,1.355,.01]),elbow,mix(.053,.104),mix(.036,.072),skin,8);
      m.tube(elbow,hand,mix(.036,.072),mix(.024,.049),skin,8);
      m.egg(...hand,mix(.032,.066),mix(.048,.063),mix(.027,.054),skin,6);
      m.egg(side*mix(.104,.195),mix(1.855,1.485),-.012,mix(.026,.057),mix(.094,.244),mix(.047,.108),hair,7);
      m.egg(side*mix(.049,.075),mix(1.971,1.656),mix(.161,.211),mix(.012,.026),.019,.016,"4a3638",6);
      m.egg(side*mix(.117,.207),mix(1.887,1.55),-.018,.026,.029,.026,"ffdab1",5);
    }
    if (t<1) this.addResidentDetails(m,t,skin,lace);
    return m;
  }

  addResidentDetails(m,t,skin,lace) {
    const original = 1-t;
    for (const side of [-1,1]) {
      const x = side*(.083+.074*t);
      m.tube([x,1.047-.12*t,0],[x,.535,.023],.072+.019*t,.047,skin,8);
      m.tube([x,.56,.023],[x,.112,0],.049,.030,skin,8);
      m.egg(x,.066,.058,.046,.053,.108,skin,8);
      m.tube([side*.115,1.53-.17*t,.106],[side*.124,1.647-.24*t,.044],.014*original,.013*original,lace);
      const lens = [[.013,.013],[.026,.036],[.076,.036],[.097,.015],[.090,-.027],[.073,-.036],[.030,-.032],[.016,-.016],[.013,.013]];
      const rim = lens.map(([u,v])=>[side*(.055+(u-.055)*original),1.97-.313*t+v*original,.177+.044*t]);
      for (let i=1;i<rim.length;i++) m.tube(rim[i-1],rim[i],.0068*original,.0068*original,"4d3e45",6);
      m.tube([side*.09,1.985-.313*t,.175+.044*t],[side*.122,1.985-.313*t,.046+.16*t],
        .0056*original,.0056*original,"4d3e45",6);
      for (let i=0;i<5;i++) {
        const inset = i*.022;
        for (const y of [1.115,1.427,1.467]) {
          m.egg(side*(.026+inset),y-.17*t,.142+.04*t-inset*.28,.010*original,.008*original,.004*original,"c184aa",6);
        }
      }
    }
    m.tube([-.017*original,1.983-.313*t,.178+.044*t],[.017*original,1.983-.313*t,.178+.044*t],
      .0058*original,.0058*original,"4d3e45",6);
  }

  draw(layer,shadow,opening,morph) {
    const {entranceZ,residentZ,roomModelEntranceZ} = WeddingCampusDorm;
    // The hinge stays fixed while the number plate follows the door leaf.
    layer.add(this.door,-1.66,0,entranceZ-.22,-opening*1.54);
    if (!opening) return;
    layer.add(this.room,0,0,entranceZ-roomModelEntranceZ,0);
    layer.add(shadow,0,.012,residentZ,0,[.28+.61*morph,1,.22+.27*morph]);
    const scale = [1+.60*morph,1.12,1];
    layer.add(this.pose(morph),0,0,residentZ,Math.PI,scale);
  }
};
