"use strict";

window.WeddingCampusInterior = class WeddingCampusInterior {
  static gates = [13,25,37,49,61];
  static doorX = 2.37;
  static doorWidth = 3.04;
  static doorInset = .12;
  static answerPanel = {y:2.40,height:1.88,inset:.45,front:-.31};
  static width = 4.78;

  static teacherPosition(block,laugh) {
    return [.51*block,.065*laugh,-.93-.30*Math.abs(block)+.06*laugh];
  }

  constructor(painter) {
    this.painter = painter;
    this.layer = new WeddingVehicleDepth();
    this.bay = this.makeBay();
    this.lastBay = new WeddingModels.Mesh();
    for (const [face,color] of this.bay.faces) {
      const clipped = [];
      for (const [i,a] of face.entries()) {
        const b = face[(i+1)%face.length];
        if (a[2]<=0) clipped.push(a);
        if ((a[2]<0 && b[2]>0) || (a[2]>0 && b[2]<0)) {
          const t = a[2]/(a[2]-b[2]);
          clipped.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,0]);
        }
      }
      if (clipped.length>=3) this.lastBay.faces.push([clipped,color]);
    }
    this.dormWall = this.makeDormWall();
    this.portals = ["774450","305a58","4c5671","80503e","493a61"].map(color=>this.makePortal(color));
    this.bench = this.makeBench();
    this.doors = [-1,1].map(side=>({
      side,
      closed:this.makeDoor(side,"293f40","47635c","c49b62"),
      rejected:this.makeDoor(side,"8b312d","d35643","ff9274"),
      open:this.makeDoor(side,"26503c","479568","b5efa8")
    }));
    this.teachers = Array.from({length:5},(_,index)=>new Map([[0,this.makeTeacher(index,0,0)]]));
    this.bridePoses = new Map();
    this.heroResistPoses = new Map();
    this.shadow = new WeddingModels.Mesh();
    this.shadow.faces.push([Array.from({length:16},(_,index)=>{
      const angle = -index*Math.PI/8;
      return [Math.cos(angle),.018,Math.sin(angle)];
    }),"494032"]);
  }

  makeBay() {
    const m = new WeddingModels.Mesh(), w = WeddingCampusInterior.width;
    const stone = "d2b99e", molding = "ecd3a8", shade = "82705e";
    const floor = ["bda98b","897a72","b69e85","a29683","d0bca0"];
    const floorTile = (x0,x1,z0,z1,color,y=0) =>
      m.faces.push([[[x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0]],color]);
    floorTile(-w,w,-3,3,"605249",-.013);
    for (let row=0;row<4;row++) {
      const near = -3+row*1.5+.014, far = near+1.472;
      for (let col=-3;col<=3;col++) {
        const left = col*1.36-.68+.013;
        floorTile(left,left+1.334,near,far,floor[(row*3+col+10)%floor.length]);
      }
    }
    floorTile(-1.16,1.16,-3,3,"684249",.005);
    for (const side of [-1,1]) {
      floorTile(side*.99-.024,side*.99+.024,-3,3,"c39262",.009);
      floorTile(side*.88-.014,side*.88+.014,-3,3,"a77056",.009);
      const a = side*3.35, b = side*4.11;
      floorTile(Math.min(a,b),Math.max(a,b),-3,3,"4a5452",.004);
      for (const x of [side*3.39,side*4.05]) floorTile(x-.026,x+.026,-3,3,"d5a768",.009);
      for (const z of [-2.25,-.75,.75,2.25]) {
        const x = side*3.72;
        m.faces.push([[[x,.009,z-.35],[x-.22,.009,z],[x,.009,z+.35],[x+.22,.009,z]],"a38f6c"]);
        m.faces.push([[[x,.011,z-.20],[x-.124,.011,z],[x,.011,z+.20],[x+.124,.011,z]],"3a4341"]);
      }
      m.box(side*(w+.11),2.31,0,.22,4.62,6,stone);
      m.box(side*(w-.035),.58,0,.11,1.16,6,"354f51");
      for (const y of [.14,1.07,1.21,4.23,4.40]) {
        m.box(side*(w-.085),y,0,.22,.10,6,y>4 ? molding : "9d8769");
      }
      for (const z of [-1.76,0,1.76]) {
        m.box(side*(w-.112),.63,z,.025,.64,1.64,"a48059");
        m.box(side*(w-.128),.63,z,.020,.55,1.53,"3e5755");
      }
      for (const y of [1.56,2.05,2.54,3.03,3.52,4.00]) {
        m.box(side*(w-.012),y,0,.024,.015,6,"ad9477");
      }
      this.makeWindow(m,side,0);
      const pillar = side*(w-.18);
      m.box(pillar,.21,-2.99,.69,.42,.85,shade);
      m.box(pillar,.51,-2.99,.54,.20,.68,molding);
      m.lathe(pillar,-2.99,[[.61,.21,.27],[2.45,.19,.24],[4.14,.16,.24]],["b6a28b",stone,"a58d74"],8);
      m.box(pillar,4.18,-2.99,.60,.21,.68,molding);
      m.box(pillar,4.045,-2.99,.53,.07,.62,"ad8455");
    }
    for (const [r,color,y] of [[.69,"ad7858",.010],[.60,"493141",.012],[.42,"905e56",.014],[.23,"c69965",.016]]) {
      m.faces.push([Array.from({length:8},(_,index)=>{
        const angle = (1-index)*Math.PI/4;
        return [r*Math.cos(angle),y,r*Math.sin(angle)];
      }),color]);
    }
    const vault = (angle,z,offset=0) => [-(w-offset)*Math.cos(angle),4.48+(3.18-offset)*Math.sin(angle),z];
    for (let i=0;i<18;i++) {
      const a = i*Math.PI/18, b = (i+1)*Math.PI/18;
      const color = i>=7 && i<=10 ? ["758285","7c8789"][i%2] : ["bfa58f","c6ae96","cab39b"][i%3];
      m.faces.push([[vault(a,-3),vault(b,-3),vault(b,3),vault(a,3)],color]);
      for (const [z,depth,offset,rib] of [[-2.98,.20,.17,molding],[-2.74,.075,.06,"ab8053"],[-2.53,.035,.035,"bc966a"]]) {
        const outerA = vault(a,z-depth), outerB = vault(b,z-depth);
        const innerA = vault(a,z-depth,offset), innerB = vault(b,z-depth,offset);
        m.faces.push([[outerA,outerB,innerB,innerA],shade]);
        m.faces.push([[innerA,innerB,vault(b,z+depth,offset),vault(a,z+depth,offset)],rib]);
      }
    }
    this.makeLantern(m,-3);
    return m;
  }

  makeWindow(m,side,z) {
    const w = WeddingCampusInterior.width;
    const opening = (inset,depth,color)=>{
      const x = side*(w-depth), y = 1.63+inset, half = 1.42-inset;
      const points = [[x,y,z-half],[x,3.15,z-half],[x,3.58-inset*.35,z-half*.65],
        [x,4.14-inset,z],[x,3.58-inset*.35,z+half*.65],[x,3.15,z+half],[x,y,z+half]];
      m.faces.push([side<0 ? points : points.reverse(),color]);
    };
    opening(0,.052,"86694e");
    opening(.117,.068,"dbb98d");
    opening(.22,.082,"253943");
    for (const [i,color] of ["37778b","5ca7a9","c6a975","527e9e","3d8390"].entries()) {
      const x = side*(w-.105), middle = z+(i-2)*.43, peak = 3.83-.25*Math.abs(i-2);
      const points = [[x,1.94,middle-.183],[x,3.08,middle-.183],[x,peak,middle],
        [x,3.08,middle+.183],[x,1.94,middle+.183]];
      m.faces.push([side<0 ? points : points.reverse(),color]);
      for (const [y,pigment] of [[2.34,"adbb9f"],[2.89,"e1ad6b"]]) {
        const inset = side*(w-.118);
        const glass = [[inset,y-.21,middle],[inset,y,middle-.16],[inset,y+.21,middle],[inset,y,middle+.16]];
        m.faces.push([side<0 ? glass : glass.reverse(),pigment]);
      }
    }
    m.box(side*(w-.12),2.64,z,.076,.054,2.35,"514c46");
    m.box(side*(w-.12),3.14,z,.077,.047,2.35,"514c46");
    m.tube([side*(w-.135),3.15,z],[side*(w-.135),3.81,z],.034,.024,"b38962",6);
    m.box(side*(w-.16),1.69,z,.35,.13,2.95,"c6a887");
  }

  makeLantern(m,z) {
    const brass = "ad7950";
    m.lathe(0,z,[[7.49,.09,.09],[7.61,.33,.33],[7.68,.36,.36]],brass,10);
    m.tube([0,7.53,z],[0,5.44,z],.037,.034,"745340");
    m.lathe(0,z,[[5.24,.12,.12],[5.38,.31,.31],[5.53,.20,.20],[5.72,.08,.08]],brass,10);
    m.egg(0,5.23,z,.104,.15,.104,"d49d60",8);
    for (let i=0;i<6;i++) {
      const angle = (i+.5)*Math.PI/3;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const joint = (radius,y)=>[radius*dx,y,z+radius*dz];
      const [x,,back] = joint(.72,5.68);
      m.tube(joint(.19,5.40),joint(.49,5.37),.036,.029,brass);
      m.tube(joint(.49,5.37),joint(.72,5.55),.029,.030,brass);
      m.lathe(x,back,[[5.51,.07,.07],[5.57,.164,.164],[5.63,.164,.164]],brass,8);
      m.lathe(x,back,[[5.63,.122,.122],[5.88,.084,.084],[5.97,.035,.035]],
        ["ffdf9b","ffe8bc","ffc987"],8);
    }
  }

  makePortal(fabric) {
    const {width,doorX,doorWidth} = WeddingCampusInterior;
    const m = new WeddingModels.Mesh();
    const stone = "c2aa8d", trim = "ead0a5", base = "867063";
    m.box(0,1.77,0,1.34,3.54,.61,stone);
    m.box(0,.20,-.055,1.50,.40,.76,base);
    for (const side of [-1,1]) {
      const pierWidth = width-doorX-doorWidth/2;
      m.box(side*(width-pierWidth/2),1.77,0,pierWidth,3.54,.61,stone);
      for (const dx of [-doorWidth/2,doorWidth/2]) {
        const jamb = side*doorX+dx;
        m.box(jamb,1.74,-.12,.24,3.49,.43,trim);
        m.box(jamb,.18,-.12,.35,.36,.53,base);
        m.box(jamb,3.29,-.142,.32,.19,.47,"c6a47e");
      }
      m.box(side*doorX,3.53,0,doorWidth+.28,.23,.64,trim);
      m.box(side*doorX,3.76,.036,doorWidth+.31,.25,.54,"6e6963");
      for (let bar=-4;bar<=4;bar++) {
        const x = side*doorX+bar*.30;
        m.tube([x,3.87,.054],[x,4.26,.054],.023,.023,"7f6348");
        if (bar<4) {
          m.tube([x,3.90,.05],[x+.30,4.22,.05],.015,.015,"aa845b");
          m.tube([x,4.22,.05],[x+.30,3.90,.05],.015,.015,"aa845b");
        }
      }
      const x = side*4.25;
      m.egg(x,2.68,-.356,.15,.22,.066,"9c6e41",8);
      m.tube([x,2.61,-.39],[x,2.64,-.60],.038,.033,"b68953");
      m.lathe(x,-.62,[[2.62,.067,.067],[2.67,.16,.16],[2.71,.16,.16]],"b98955",8);
      m.lathe(x,-.62,[[2.72,.127,.127],[2.97,.098,.098],[3.04,.041,.041]],
        ["fbc47b","ffe3a3"],8);
      this.makePlanter(m,side*4.16,-1.47,side);
    }
    m.box(0,4.27,.043,2*width,.13,.24,"ad855b");
    m.box(0,3.55,-.035,2*width,.16,.67,trim);
    this.makePennant(m,fabric);
    return m;
  }

  makePennant(m,fabric) {
    const front = (outline,z,color)=>m.faces.push([outline.map(([x,y])=>[x,y,z]),color]);
    const outline = [[0,3.46],[-.53,3.73],[-.53,4.76],[.53,4.76],[.53,3.73]];
    front(outline,-.41,"cb9c60");
    front(outline.map(([x,y])=>[x*.92,4.14+(y-4.14)*.95]),-.42,fabric);
    m.tube([-.67,4.76,-.43],[.67,4.76,-.43],.041,.041,"9d724d",8);
    for (const side of [-1,1]) {
      m.egg(side*.65,4.76,-.43,.071,.061,.063,"d3a366",8);
      m.box(side*.449,4.23,-.428,.022,.86,.012,"ca9e62");
    }
    m.egg(0,4.18,-.440,.251,.248,.028,"bc915b",12);
    m.egg(0,4.18,-.463,.223,.223,.017,"4c3d3f",12);
    for (const side of [-1,1]) {
      const page = [[0,4.07],[side*.15,4.11],[side*.15,4.28],[0,4.24]];
      front(side<0 ? page : page.reverse(),-.484,"e5bf84");
      for (const y of [4.15,4.19,4.23]) {
        m.tube([side*.033,y-.024,-.492],[side*.124,y,-.492],.008,.008,"826548",5);
      }
    }
    m.egg(0,3.86,-.445,.047,.062,.024,"cf9e65",8);
  }

  makePlanter(m,x,z,side) {
    const soil = .565;
    const profile = [
      [.015,.252,"704239"],[.043,.275,"8c5142"],[.097,.278,"a1604c"],[.128,.243,"79493b"],
      [.178,.247,"8e5143"],[.476,.334,"a3624c"],[.528,.352,"a96951"],[.555,.383,"b97d57"],
      [.613,.393,"c28760"],[.654,.376,"d19b70"],[.659,.339,"d9a77d"],[.636,.317,"936047"],
      [soil,.303,"80513d"]
    ];
    const rings = profile.map(([y,radius])=>Array.from({length:12},(_,i)=>{
      const angle = i*Math.PI/6;
      return [x+radius*Math.cos(angle),y,z+radius*Math.sin(angle)];
    }));
    for (let i=1;i<rings.length;i++) m.connect(rings[i-1],rings[i],profile[i][2]);
    m.faces.push([rings[0],"704239"],[rings.at(-1).slice().reverse(),"4b3529"]);

    const leaves = ["405e49","55775d","75916b","516e57","80976b"];
    for (let i=0;i<11;i++) {
      const angle = i*2.40+side*.63;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const reach = .23+(i%4)*.077;
      const height = .85+(i%5)*.119;
      const point = (r,y,w=0)=>[x+r*dx+w*dz,y,z+r*dz-w*dx];
      const bend = point(reach*.64,soil+(height-soil)*.61);
      const stem = point(reach,height);
      m.tube(point(.035+(i%3)*.016,soil-.018),bend,.016,.012,"496448",5);
      m.tube(bend,stem,.012,.008,"567356",5);
      const length = .255+(i%3)*.044, width = .084+(i%4)*.011;
      const rise = .10+(i%3)*.036;
      const rim = [stem,point(reach+length*.32,height+rise*.60,width*.88),
        point(reach+length*.67,height+rise,width),point(reach+length,height+rise*.68),
        point(reach+length*.67,height+rise,-width),point(reach+length*.32,height+rise*.60,-width*.88)];
      const top = point(reach+length*.48,height+rise+.031);
      const bottom = point(reach+length*.48,height+rise+.016);
      for (let edge=0;edge<rim.length;edge++) {
        const a = rim[edge], b = rim[(edge+1)%rim.length];
        m.faces.push([[top,b,a],leaves[(i+(edge<3 ? 0 : 1))%leaves.length]],[[bottom,a,b],"3a5747"]);
      }
    }
  }

  makeBench() {
    const m = new WeddingModels.Mesh();
    for (const z of [-.74,.74]) {
      m.box(0,.26,z,.42,.52,.13,"4b3b36");
      m.box(.02,.66,z,.074,.82,.11,"795441");
      m.egg(.02,1.05,z,.067,.08,.071,"a57952",8);
    }
    m.box(-.17,.49,0,.53,.10,1.82,"926449");
    for (const y of [.74,.93]) m.box(.02,y,0,.078,.132,1.71,"83563f");
    m.box(-.39,.53,0,.044,.041,1.78,"be895c");
    return m;
  }

  makeDoor(side,wood,panel,metal) {
    const m = new WeddingModels.Mesh();
    const {doorWidth,doorInset,answerPanel} = WeddingCampusInterior;
    const w = doorWidth-2*doorInset;
    m.box(-side*w/2,1.74,0,w,3.40,.17,wood);
    for (const {y,height} of [{y:.69,height:1.01},answerPanel]) {
      m.box(-side*w/2,y,-.10,w-.25,height,.06,metal);
      m.box(-side*w/2,y,-.145,w-.34,height-.10,.046,panel);
      m.box(-side*w/2,y,-.177,w-answerPanel.inset,height-.23,.027,wood);
      for (const dir of [-1,1]) {
        const x = -side*w/2+dir*(w-.41)/2;
        for (const end of [-1,1]) {
          m.egg(x,y+end*(height-.14)/2,-.162,.048,.048,.036,metal,6);
        }
      }
    }
    m.box(-side*(w-.27),1.35,-.112,.16,.31,.075,metal);
    m.egg(-side*(w-.27),1.39,-.184,.079,.059,.076,metal,8);
    return m;
  }

  teacherPose(index,block,laugh) {
    const cache = this.teachers[index];
    const reach = Math.round(block*10), chuckle = Math.round(laugh*10);
    const key = reach*16+chuckle;
    if (!cache.has(key)) cache.set(key,this.makeTeacher(index,reach/10,chuckle/10));
    return cache.get(key);
  }

  makeTeacher(index,block,laugh) {
    const m = new WeddingModels.Mesh();
    const head = new WeddingModels.Mesh();
    const jacket = ["594343","465461","595046","45454d","503d4e"][index];
    const skin = ["d5a486","ba8b71","ddae89","c49576","dfae8b"][index];
    const hair = ["493b39","77716c","413535","675653","a19384"][index];
    const shoulderLift = .075*laugh+.025*Math.abs(block);
    const tilt = -.33*laugh;
    const cos = Math.cos(tilt), sin = Math.sin(tilt);
    m.lathe(0,0,[[.81,.28,.18],[1.12,.33,.21],[1.46+shoulderLift,.40,.21],[1.64+shoulderLift,.27,.13]],jacket,8);
    m.box(0,1.42,-.184,.19,.32,.09,"e7d3b8");
    m.tube([0,1.50,-.243],[0,1.28,-.248],.038,.054,"8e533f",5);
    m.tube([0,1.55,0],[0,1.73+shoulderLift,0],.136,.127,skin);
    head.egg(0,1.89,-.018,.235,.297,.205,skin,10);
    head.egg(0,2.045,.031,.240,.163,.191,hair,10);
    head.egg(.016,1.87,-.221,.056,.073,.087,skin,8);
    const mouth = .013+.068*laugh;
    head.egg(0,1.746,-.188,.066+.037*laugh,mouth,.020,"653333",10);
    if (laugh>.24) {
      head.box(0,1.752+mouth*.47,-.203,.135,.022,.016,"f6dec0");
    }
    for (const side of [-1,1]) {
      m.tube([side*.15,.94,.015],[side*.16,.15,.035],.122,.083,"30313b");
      m.egg(side*.16,.088,-.046,.116,.085,.179,"32282c",8);
      head.egg(side*.102,1.936,-.201,.059,.036-.023*laugh,.023,"eed8bd",8);
      head.egg(side*.096,1.932,-.225,.020,.023-.014*laugh,.011,"373039",6);
      head.tube([side*.045,1.966+.027*laugh,-.224],[side*.178,2.009-.036*laugh,-.181],.024,.024,hair,6);
      const reach = Math.max(0,side*block);
      const shoulder = [side*.31,1.53+shoulderLift,0];
      const elbow = [side*(.396+.24*reach+.03*laugh),1.17+.49*reach+.10*laugh,-.167-.22*reach];
      const hand = [side*(-.215+1.22*reach+.10*laugh),1.30+side*.04+.56*reach+.05*laugh,-.282-.37*reach];
      m.tube(shoulder,elbow,.115,.104,jacket,8);
      m.tube(elbow,hand,.104,.078,jacket,8);
      m.egg(...hand,.088+.055*reach,.066+.046*reach,.052+.044*reach,skin,8);
      if (reach>.4) {
        for (const lift of [-.050,0,.050]) {
          m.egg(hand[0]+side*.047,hand[1]+lift,hand[2]-.064,.073,.035,.039,skin,6);
        }
        m.egg(hand[0]-side*.054,hand[1]-.059,hand[2]-.099,.057,.035,.034,skin,6);
      }
      if (index%2===0) head.box(side*.108,1.931,-.230,.143,.074,.017,"6b6460");
    }
    if (index%2===0) head.box(0,1.949,-.234,.092,.018,.023,"6b6460");
    else m.box(.22,1.441,-.212,.090,.068,.026,"c39d6c");
    m.add(head,([x,y,z])=>[x,1.65+shoulderLift+(y-1.65)*cos+z*sin,z*cos-(y-1.65)*sin]);
    return m;
  }

  makeDormWall() {
    const m = new WeddingModels.Mesh();
    const wall = "bc9c78", wood = "98704e", trim = "d1a77f", width = WeddingCampusInterior.width;
    const halfOpening = 1.67;
    for (const side of [-1,1]) {
      const x = side*(width+halfOpening)/2;
      m.box(x,1.92,.033,width-halfOpening,3.84,.44,wall);
      m.box(side*1.74,1.97,-.225,.17,3.94,.34,wood);
      m.box(side*1.83,1.98,-.289,.058,3.95,.22,trim);
      m.box(x,.18,-.233,width-halfOpening,.36,.13,"74604e");
    }
    m.box(0,5.74,.033,2*width,3.8,.44,wall);
    m.box(0,3.94,-.225,3.73,.22,.34,wood);
    m.box(0,4.08,-.251,3.86,.095,.28,trim);
    WeddingCampusDorm.lettering(m,"ОБЩАГА",0,4.51,-.22,.51,"f9d3a0");
    return m;
  }

  bridePose({distance,speed,kiss}) {
    const speedStep = Math.round(speed*6);
    const gait = speedStep ? Math.floor(distance/1.58*24)%24 : 0;
    const embrace = Math.round(kiss*14);
    const key = `${speedStep}:${gait}:${embrace}`;
    if (!this.bridePoses.has(key)) {
      const time = gait*(2*Math.PI/13.4)/24;
      this.bridePoses.set(key,WeddingModels.bride(time,{rush:speedStep/6,kiss:embrace/14}));
    }
    return this.bridePoses.get(key);
  }

  draw(hero,doorStates,reaction,bride,closeup=0,dorm=null) {
    const p = this.painter, {ctx:g,w,h,dpr} = p;
    g.setTransform(dpr,0,0,dpr,0,0);
    g.fillStyle = "#524036";
    g.fillRect(0,0,w,h);
    const focusX = bride ? (bride.x+hero.x)*.5 : hero.x;
    const inside = dorm ? WeddingDrive.smooth((hero.z-WeddingCampusDorm.entranceZ+.1)/3.6) : 0;
    p.cameraX = hero.x*(.53-.34*inside)*(1-closeup)+focusX*closeup;
    p.cameraDepth = 6+hero.z-(4.25-1.90*closeup-1.05*inside);
    p.eye = 3.01-.86*closeup-.59*inside;
    p.cx = w/2;
    const shortLandscape = h<=440 && w/h>1.45;
    p.horizon = h*((shortLandscape ? .403 : .444)*(1-closeup)+.378*closeup-.058*inside);
    p.fx = Math.min(w*1.01,h*(shortLandscape ? 1.56 : 1.19));
    p.fy = Math.min(h*(shortLandscape ? .94 : .84),w*1.33);

    const layer = this.layer;
    layer.start();
    const entrance = WeddingCampusDorm.entranceZ;
    for (let z=0;z<entrance;z+=6) {
      if (z+3>p.cameraDepth-6) layer.add(this.bay,0,0,z,0);
    }
    if (entrance>p.cameraDepth-6) layer.add(this.lastBay,0,0,entrance,0);
    for (let z=5;z<70;z+=12) {
      if (z+1>p.cameraDepth-6) {
        layer.add(this.bench,4.35,0,z,0);
        layer.add(this.bench,-4.35,0,z+1.45,Math.PI);
      }
    }
    if (entrance+.3>p.cameraDepth-6) layer.add(this.dormWall,0,0,entrance,0);
    if (hero.z>entrance-17) {
      this.dorm ??= new WeddingCampusDorm();
      this.dorm.draw(layer,this.shadow,dorm?.opening ?? 0,dorm?.morph ?? 0);
    }
    for (const [index,z] of WeddingCampusInterior.gates.entries()) {
      if (z+3<p.cameraDepth-6) continue;
      const state = doorStates[index];
      const reacting = reaction.index===index;
      const block = reacting ? reaction.block : 0, laugh = reacting ? reaction.laugh : 0;
      layer.add(this.portals[index],0,0,z,0);
      for (const {side,closed,rejected,open} of this.doors) {
        const chosen = state?.side===side;
        const red = reacting && side===reaction.side;
        const x = side*(WeddingCampusInterior.doorX+WeddingCampusInterior.doorWidth/2-WeddingCampusInterior.doorInset);
        layer.add(red ? rejected : chosen ? open : closed,x,0,z-.12,side*(chosen ? state.progress : 0)*1.52);
      }
      const [x,y,dz] = WeddingCampusInterior.teacherPosition(block,laugh);
      layer.add(this.shadow,x,0,z+dz+.02,0,[.52,1,.33]);
      layer.add(this.teacherPose(index,block,laugh),x,y,z+dz,block*.18,1,laugh*.085);
    }
    if (bride) {
      const {x,z,yaw} = bride;
      layer.add(this.shadow,x,0,z,0,[1.07,1,.49]);
      layer.add(this.bridePose(bride),x,0,z,yaw,[1.60,WeddingScene.brideScale[1],WeddingScene.brideScale[2]]);
    }
    const resistance = Math.round((hero.resist ?? 0)*14);
    if (resistance && !this.heroResistPoses.has(resistance)) {
      this.heroResistPoses.set(resistance,WeddingModels.runner(0,{walk:true,resist:resistance/14}));
    }
    const model = resistance ? this.heroResistPoses.get(resistance) : WeddingModels.walker(hero.stride);
    layer.add(this.shadow,hero.x,0,hero.z,0,[.49,1,.31]);
    layer.add(model,hero.x,0,hero.z,hero.yaw);
    layer.paint(p,true);
  }
};
