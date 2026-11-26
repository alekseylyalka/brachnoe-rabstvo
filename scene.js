"use strict";

window.WeddingScene = class WeddingScene {
  static viewDistance = 196;
  static renderSettings = [
    {pixelRatio:2, sceneryDistance:196, hallPixelRatio:2, hallDistance:166, hallDetail:1},
    {pixelRatio:1.40, sceneryDistance:154, hallPixelRatio:1.25, hallDistance:124, hallDetail:.82},
    {pixelRatio:1, sceneryDistance:112, hallPixelRatio:.90, hallDistance:94, hallDetail:.67}
  ];
  static archHalfWidth = 4.68;
  static archSpring = 3.44;
  static paintingCount = 63;
  static hallWall = 7.6;
  static wallNear = -12;
  static roadTransitionLength = 30;
  static airshipColors = [
    ["#fff2cb","#dcad68","#997048"], ["#ffe1cb","#d78981","#8a5155"],
    ["#e0eef3","#85adc3","#496d8c"], ["#e8efc2","#96b788","#527961"]
  ];
  static airshipHull = new Path2D("M -171 0 C -162 -22 -120 -49 -52 -55 C 42 -64 135 -44 163 -14 C 194 21 126 56 45 59 C -38 63 -131 35 -171 0 Z");
  // The character meshes have different unscaled heights.
  static brideScale = [1.02*1.8,2.107/1.884,1.02];
  static archCurve = Array.from({length:19},(_,i) =>
    [Math.cos(i*Math.PI/18),Math.sin(i*Math.PI/18)]);
  static truckStyles = [
    { name:"VOLVO", body:"#147e83", light:"#6bdfd2", shade:"#18505e", trailer:"#217881",
      deck:"#93ddd4", stripe:"#c3f7dc", glass:"#80c7da", rake:.23, grille:.58 },
    { name:"SCANIA", body:"#b63147", light:"#f28c77", shade:"#652838", trailer:"#943449",
      deck:"#e9937e", stripe:"#ffd2a6", glass:"#89b4d0", rake:.18, grille:.65 },
    { name:"MAN", body:"#385db8", light:"#8caaf0", shade:"#263f7d", trailer:"#3c59a1",
      deck:"#a7c4ed", stripe:"#badcff", glass:"#93c1e9", rake:.33, grille:.67 },
    { name:"КАМАЗ", body:"#c36a23", light:"#ffc484", shade:"#7e412c", trailer:"#ad612d",
      deck:"#eab675", stripe:"#fff0bd", glass:"#91b7ca", rake:.10, grille:.61 }
  ];

  static pickPhotos(count) {
    const pool = Array.from({length:WeddingScene.paintingCount},(_,i)=>i);
    return Array.from({length:count},()=>pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  }

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.cameraRise = 0;
    this.cameraX = 0;
    this.brideOffset = 0;
    this.previousFrame = 0;
    this.performanceFrames = 0;
    this.slowFrames = 0;
    this.smoothWindows = 0;
    this.minimumRenderQuality = 0;
    this.note = this.makeGlowingNote();
    this.paintings = [];
    this.photos = [];
    this.paintingsReady = Promise.all(Array.from({length:WeddingScene.paintingCount},(_,index) =>
      this.loadPainting(index)));
    this.bouquets = Array.from({length:8},(_,i) => this.makeBouquet(i*19+3));
    this.hallFlowers = Array.from({length:3},(_,i) => this.makeHallFlowers(i));
    this.truckTrim = WeddingScene.truckStyles.map((paint,brand)=>this.makeTruckTrim(paint,brand));
    this.truckHub = this.makeTruckHub();
    this.pickupSprites = this.makePickupSprites();
    this.gardenFlowerBeds = this.makeGardenFlowerBeds();
    this.runnerGait = [];
    this.brideGait = [];
    this.faceProjection = [];
    this.lampGlow = this.makeLampGlow();
    this.hallLight = this.makeHallLight();
    this.heavenCloud = this.makeHeavenCloud();
    const skyPhoto = new Image();
    skyPhoto.onload = () => { this.heavenPortrait = this.makeHeavenPortrait(skyPhoto); };
    skyPhoto.src = "assets/heaven-sky.jpg?v=heaven-3";
    this.sausage = this.makeSausage();
    this.wallOrnaments = [this.makeWallOrnament(false),this.makeWallOrnament(true)];
    this.guestSprites = [
      `M 113,117 Q 102,96 109,77 L 117,68 C 123,7 201,13 199,66 Q 202,107 177,131 L 174,146 Q 202,150 232,162 C
       258,170 270,207 277,250 Q 289,310 284,350 L 285,388 Q 307,456 277,485 L 262,501 253,495 252,472 249,504 Q
       225,548 232,578 Q 247,633 232,692 L 218,778 237,794 265,814 264,824 Q 241,832 198,821 L 185,813 Q 181,791
       188,749 Q 177,699 177,652 L 171,593 158,535 145,534 Q 137,566 131,595 Q 123,635 114,667 L 98,759 Q
       103,791 104,812 Q 97,824 56,824 L 31,818 Q 27,812 37,800 L 72,767 59,698 Q 43,639 58,590 L 61,516 Q
       45,512 41,495 L 40,473 Q 27,500 17,486 3,476 6,445 L 12,418 8,372 Q 4,321 24,269 L 24,231 Q 28,182 65,162
       L 112,140 Z`,
      `M 106,65 C 100,34 117,8 146,9 Q 164,1 183,9 Q 210,17 216,48 L 229,60 210,70 Q 207,97 189,115 L 202,144 Q
       231,145 249,163 L 258,190 262,271 269,305 277,355 281,390 Q 294,420 284,446 L 265,473 259,468 260,445
       250,482 234,486 226,518 Q 225,559 217,590 Q 233,649 214,716 L 216,747 Q 230,765 227,782 Q 222,801 192,800
       L 166,796 Q 150,787 161,774 L 174,748 176,706 Q 158,650 167,597 L 159,554 147,505 135,506 Q 126,534
       125,568 L 121,607 Q 122,672 108,728 L 107,750 Q 118,774 107,795 Q 94,813 65,802 L 57,797 Q 50,787 62,770
       L 72,740 Q 57,679 62,615 Q 53,582 62,545 L 68,483 56,473 53,450 45,463 Q 39,473 31,459 L 20,435 21,410
       33,366 39,318 46,282 52,224 Q 51,179 74,162 L 96,149 Q 102,133 101,118 Q 107,90 106,65 Z`
    ].map((outline,index) => {
      const image = new Image();
      image.src = `assets/guest-${index+1}.png`;
      return {image, outline:new Path2D(outline)};
    });
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, width);
    this.h = Math.max(1, height);
    this.renderQuality ??= this.w<=600 && this.h>this.w ? 1 : 0;
    this.resizeBuffer();
    this.speechSizes = new WeakMap();
  }

  resizeBuffer() {
    // The scene scales independently of the sharp, CSS-rendered controls and labels.
    const {pixelRatio,hallPixelRatio}=WeddingScene.renderSettings[this.renderQuality];
    const ratio=this.renderingHall?hallPixelRatio:pixelRatio;
    this.dpr = Math.min(ratio,devicePixelRatio || 1,Math.sqrt(1_650_000/(this.w*this.h)));
    const pixelWidth = Math.round(this.w*this.dpr);
    const pixelHeight = Math.round(this.h*this.dpr);
    if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
    if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
  }

  adaptToFrameTime(interval) {
    if (interval<=0 || interval>.18) return;
    this.performanceFrames++;
    if (interval>.021) this.slowFrames++;
    if (this.performanceFrames<28) return;
    const lower = this.slowFrames>=5;
    this.smoothWindows=this.slowFrames<=1 ? this.smoothWindows+1 : 0;
    this.performanceFrames=this.slowFrames=0;
    const previous=this.renderQuality;
    if (lower) {
      this.renderQuality=Math.min(WeddingScene.renderSettings.length-1,previous+1);
      // Avoid retrying a setting that already caused frame drops during this session.
      this.minimumRenderQuality=this.renderQuality;
    } else if (this.smoothWindows>=10 && previous>this.minimumRenderQuality) {
      this.renderQuality=previous-1;
      this.smoothWindows=0;
    }
    if (this.renderQuality!==previous) this.resizeBuffer();
  }

  rnd(n) {
    const value = Math.sin(n * 127.1 + 72.7) * 43758.5453;
    return value - Math.floor(value);
  }

  distanceVisibility(z, start = 108, end = WeddingScene.viewDistance) {
    const blend = Math.min(1,Math.max(0,(end-z)/(end-start)));
    return blend*blend*(3-2*blend);
  }

  depth(y,z) {
    return z+6-this.cameraDepth+(this.eye-y)*.16;
  }

  project(x, y, z) {
    const d = Math.max(.55,this.depth(y,z));
    return [this.cx + (x-this.cameraX)*this.fx/d,this.horizon + (this.eye-y)*this.fy/d];
  }

  clipped(points) {
    const near=.55;
    let count=0;
    for (const [,y,z] of points) count+=Number(this.depth(y,z)>=near);
    if (count===points.length) return points;
    if (count===0) return [];
    const depths=points.map(([,y,z])=>this.depth(y,z));
    const result=[];
    for (let i=0;i<points.length;i++) {
      const j=(i+points.length-1)%points.length;
      const a=depths[j], b=depths[i];
      if ((a>=near)!==(b>=near)) {
        const t=(near-a)/(b-a);
        result.push(points[j].map((value,axis)=>value+(points[i][axis]-value)*t));
      }
      if (b>=near) result.push(points[i]);
    }
    return result;
  }

  face(points,color) {
    if (points.length<3) return;
    const screen=this.faceProjection;
    let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    for (let i=0;i<points.length;i++) {
      const point=points[i];
      const d=this.depth(point[1],point[2]);
      if (d<.55) {
        const world=this.clipped(points);
        if (world.length>=3) this.poly(world.map(point=>this.project(...point)),color);
        return;
      }
      const x=this.cx+(point[0]-this.cameraX)*this.fx/d;
      const y=this.horizon+(this.eye-point[1])*this.fy/d;
      screen[2*i]=x;
      screen[2*i+1]=y;
      left=Math.min(left,x);
      right=Math.max(right,x);
      top=Math.min(top,y);
      bottom=Math.max(bottom,y);
    }
    if (left>this.w || right<0 || top>this.h || bottom<0) return;
    const g=this.ctx;
    g.beginPath();
    g.moveTo(screen[0],screen[1]);
    for (let i=1;i<points.length;i++) g.lineTo(screen[2*i],screen[2*i+1]);
    g.closePath();
    g.fillStyle=color;
    g.fill();
  }

  edge(a,b,color,width) {
    const d1=this.depth(a[1],a[2]);
    const d2=this.depth(b[1],b[2]);
    if (d1<.55 && d2<.55) return;
    if (d1<.55 || d2<.55) {
      const t=(.55-d1)/(d2-d1);
      const cross=a.map((value,axis)=>value+(b[axis]-value)*t);
      if (d1<.55) a=cross;
      else b=cross;
    }
    this.line([this.project(...a),this.project(...b)],color,width);
  }

  poly(points, fill) {
    const g = this.ctx;
    g.fillStyle = fill;
    g.beginPath();
    g.moveTo(points[0][0],points[0][1]);
    for (let i=1;i<points.length;i++) g.lineTo(points[i][0],points[i][1]);
    g.closePath();
    g.fill();
  }

  sticker(points,{image,start,width}) {
    const [[ax,ay],[bx,by],[dx,dy],[cx,cy]]=points;
    const g=this.ctx;
    g.save();
    g.beginPath();
    g.moveTo(ax,ay);
    g.lineTo(bx,by);
    g.lineTo(dx,dy);
    g.lineTo(cx,cy);
    g.closePath();
    g.clip();
    g.transform((bx-ax+dx-cx)/(2*width),(by-ay+dy-cy)/(2*width),
      (cx-ax+dx-bx)/(2*image.height),(cy-ay+dy-by)/(2*image.height),
      (3*ax+bx+cx-dx)/4,(3*ay+by+cy-dy)/4);
    g.drawImage(image,start,0,width,image.height,0,0,width,image.height);
    g.restore();
  }

  line(points, color, width) {
    const g = this.ctx;
    g.beginPath();
    points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }

  ellipse(x, y, rx, ry, color) {
    const g = this.ctx;
    g.beginPath();
    g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
  }

  plane(x1, x2, z1, z2, y, color, offsets) {
    const depth = this.depth(y,0);
    const near = Math.max(.55,Math.min(z1,z2)+depth);
    const far = Math.max(z1,z2)+depth;
    if (far<.55) return;
    const left = (x1-this.cameraX)*this.fx;
    const right = (x2-this.cameraX)*this.fx;
    const offsetY = (this.eye-y)*this.fy;
    const low = this.horizon+offsetY/near;
    const high = this.horizon+offsetY/far;
    if (Math.min(low,high)>this.h || Math.max(low,high)<0) return;
    const g = this.ctx;
    g.fillStyle = color;
    g.beginPath();
    if (offsets) {
      for (const x of offsets) {
        const shift=x*this.fx;
        g.moveTo(this.cx+(left+shift)/near,low);
        g.lineTo(this.cx+(right+shift)/near,low);
        g.lineTo(this.cx+(right+shift)/far,high);
        g.lineTo(this.cx+(left+shift)/far,high);
        g.closePath();
      }
    } else {
      g.moveTo(this.cx+left/near,low);
      g.lineTo(this.cx+right/near,low);
      g.lineTo(this.cx+right/far,high);
      g.lineTo(this.cx+left/far,high);
      g.closePath();
    }
    g.fill();
  }

  front(x1, x2, y1, y2, z, fill) {
    this.face([[x1,y2,z],[x2,y2,z],[x2,y1,z],[x1,y1,z]],fill);
  }

  box(x, z, width, length, bottom, top, colors) {
    const l = x - width / 2;
    const r = x + width / 2;
    const end=z+length;
    const cameraX=this.cameraX;
    const far=this.depth(bottom,end);
    if (far<.55) return;
    if (l>cameraX && this.cx+(l-cameraX)*this.fx/far>this.w) return;
    if (r<cameraX && this.cx+(r-cameraX)*this.fx/far<0) return;
    const cameraZ=this.cameraDepth-6;
    if (this.eye>=top) this.plane(l,r,z,end,top,colors[1]);
    if (this.eye<bottom) this.plane(l,r,z,end,bottom,colors[2]);
    const side=this.cameraX<l?l:this.cameraX>r?r:null;
    if (side!==null) this.face([[side,bottom,z],[side,top,z],[side,top,end],[side,bottom,end]],colors[2]);
    if (cameraZ<=z) this.front(l,r,bottom,top,z,colors[0]);
    else if (cameraZ>=end) this.front(l,r,bottom,top,end,colors[2]);
  }

  backdrop(garden, progress=0) {
    const g = this.ctx;
    const { w, h, cx, horizon } = this;
    const sky = g.createLinearGradient(0, 0, 0, horizon + 55);
    if (garden) {
      const sunset=.52;
      const tone=(day,evening,night) => {
        const from=progress<sunset ? day : evening;
        const to=progress<sunset ? evening : night;
        const fraction=progress<sunset ? progress/sunset : (progress-sunset)/(1-sunset);
        return `rgb(${from.map((channel,i)=>Math.round(channel+(to[i]-channel)*fraction)).join(",")})`;
      };
      sky.addColorStop(0,tone([40,143,205],[71,73,133],[15,24,48]));
      sky.addColorStop(.57,tone([141,216,241],[213,136,140],[28,42,72]));
      sky.addColorStop(1,tone([223,244,220],[245,167,100],[59,66,95]));
    } else {
      sky.addColorStop(0, "#9e5540");
      sky.addColorStop(.65, "#d1995e");
      sky.addColorStop(1, "#ffe0a1");
    }
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(cx, horizon - 18, 1, cx, horizon - 18, h * .48);
    glow.addColorStop(0, garden ? `rgba(255,218,159,${.51*(1-Math.pow(progress,3))})` : "#fff0c2bc");
    glow.addColorStop(1, "#00000000");
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
    if (garden) {
      const sunY=h*.11+(horizon-h*.11+h*.070)*progress;
      const light=Math.max(0,1-Math.pow(progress,4));
      g.globalAlpha=light;
      this.ellipse(w*(.65+.035*progress),sunY,h*.029,h*.029,progress<.38?"#fff7ca":"#ffc376");
      for (let i=0;i<6;i++) {
        const x=w*(.018+i*.193)-this.cameraX*3;
        const y=h*(.064+this.rnd(i+15)*.100);
        const s=h*(.020+this.rnd(i+19)*.017);
        this.ellipse(x,y,s*2.54,s*.53,"#fff8e4b8");
        this.ellipse(x-s*.27,y-s*.31,s*1.24,s*.57,"#fffff2d6");
        this.ellipse(x+s*.83,y-s*.15,s*.99,s*.49,"#f8ffffbc");
      }
      g.globalAlpha=Math.max(0,(progress-.62)/.38);
      for (let i=0;i<32;i++) {
        const star=h*(.0011+this.rnd(i+689)*.0011);
        this.ellipse(w*this.rnd(i+657),horizon*.74*this.rnd(i+722),star,star,"#edf3f9b5");
      }
      g.globalAlpha=1;
      const grass=g.createLinearGradient(0,horizon,0,h);
      grass.addColorStop(0,"#b4d67a");
      grass.addColorStop(.52,"#7db654");
      grass.addColorStop(1,"#5e9d45");
      g.fillStyle=grass;
      g.fillRect(0,horizon+6,w,h);
      for (let layer=0;layer<2;layer++) {
        g.beginPath();
        g.moveTo(0,horizon+13+layer*7);
        for (let i=0;i<=20;i++) {
          const x=i*w/20;
          const wave=.027*Math.sin(i*.46+layer*1.3)+.017*Math.sin(i*.82+1);
          g.lineTo(x,horizon-h*(.065-layer*.020+wave));
        }
        g.lineTo(w,horizon+13+layer*7);
        g.fillStyle=layer?"#92bf70":"#badb9b";
        g.fill();
      }
      for (let i=0;i<27;i++) {
        const x=(i+.35)*w/26;
        const size=h*(.012+this.rnd(70+i)*.024);
        if (Math.abs(x-cx)<h*.068) continue;
        this.ellipse(x,horizon+7,size*.90,size*(.76+this.rnd(i)*.46),i%3?"#79ad65":"#93bb72");
      }
    } else {
      g.fillStyle = "#805444";
      g.fillRect(0, horizon + 8, w, h);
      this.hallWalls();
    }
  }

  hallWalls() {
    const g=this.ctx;
    const farther=2048;
    const near=this.cameraDepth-7.25;
    const ceiling=9.25;
    const wall=WeddingScene.hallWall;
    for (const side of [-1, 1]) {
      const x = side*wall;
      const panel = g.createLinearGradient(this.cx+side*this.w*.06,0,
        side<0?0:this.w,this.h*.19);
      panel.addColorStop(0,side<0?"#83aa7b":"#b76d69");
      panel.addColorStop(.47,side<0?"#327956":"#994154");
      panel.addColorStop(1,side<0?"#134b39":"#681d38");
      const band = (bottom,top,fill) => this.face([[x,bottom,near],[x,bottom,farther],
        [x,top,farther],[x,top,near]],fill);
      band(0,ceiling,panel);
      band(0,2.35,side<0?"#10352866":"#430e2b70");
      band(.10,.29,side<0?"#10362d":"#511830");
      band(2.26,2.38,"#a9683f");
      band(2.38,2.44,"#f6cc78");
      band(8.35,ceiling,"#2f182640");
      band(8.32,8.42,"#eac081");
    }
    const plaster=g.createLinearGradient(0,0,0,this.horizon);
    plaster.addColorStop(0,"#c99268");
    plaster.addColorStop(.65,"#f0cca1");
    plaster.addColorStop(1,"#fae0b1");
    this.plane(-wall,wall,near,farther,ceiling,plaster);
    for (const x of [-7.4,-4.4,4.4,7.4]) {
      this.plane(x-.09,x+.09,near,farther,9.23,"#a96d4f80");
      this.plane(x-.025,x+.025,near,farther,9.22,"#ffe7b9");
    }
  }

  async loadPainting(index) {
    const image = new Image();
    image.src = `assets/paintings/${String(index+1).padStart(2,"0")}.webp?v=album-63-v2`;
    try {
      await image.decode();
    } catch {
      return;
    }
    this.photos[index] = image;
    const scale = Math.min(1,464/Math.max(image.width,image.height));
    const pictureWidth = Math.round(image.width*scale);
    const pictureHeight = Math.round(image.height*scale);
    const border = Math.round(Math.max(pictureWidth,pictureHeight)*.061);
    const frame = document.createElement("canvas");
    frame.width = pictureWidth+2*border;
    frame.height = pictureHeight+2*border;
    const g = frame.getContext("2d",{alpha:false});
    const {width,height} = frame;
    const walnut = g.createLinearGradient(0,0,width*.55,height);
    walnut.addColorStop(0,"#b2744a");
    walnut.addColorStop(.38,"#895035");
    walnut.addColorStop(1,"#563122");
    g.fillStyle = walnut;
    g.fillRect(0,0,width,height);
    for (const [x,y,length,rotate] of [[0,0,width,0],[width,0,height,Math.PI/2],
      [width,height,width,Math.PI],[0,height,height,-Math.PI/2]]) {
      g.save();
      g.translate(x,y);
      g.rotate(rotate);
      for (let i=0;i<13;i++) {
        const at = 2+this.rnd(i*11+index)*border;
        g.beginPath();
        g.moveTo(0,at);
        g.bezierCurveTo(length*.29,at+4,length*.66,at-4,length,at+1);
        g.strokeStyle = i%3===0 ? "#f0b27855" : "#47211968";
        g.lineWidth = i%3===0 ? 1.6 : 1;
        g.stroke();
      }
      g.restore();
    }
    for (const [inset,stroke,color] of [[2,4,"#542f20"],[6,2,"#d69a61"],
      [border-7,4,"#47261d"],[border-3,2,"#ebb77c"]]) {
      g.strokeStyle = color;
      g.lineWidth = stroke;
      g.strokeRect(inset,inset,width-2*inset,height-2*inset);
    }
    for (const x of [border*.51,width-border*.51]) {
      for (const y of [border*.51,height-border*.51]) {
        g.fillStyle = "#dfaa6c";
        g.beginPath();
        g.arc(x,y,border*.13,0,Math.PI*2);
        g.fill();
        g.fillStyle = "#743f29";
        g.fillRect(x-border*.045,y-border*.045,border*.09,border*.09);
      }
    }
    g.drawImage(image,border,border,pictureWidth,pictureHeight);
    this.paintings[index] = frame;
  }

  hallPainting(z,side,index) {
    const frame = this.paintings[index];
    if (frame) this.wallArtwork(frame,z,side,5.40,3.35,12.8,true);
  }

  gardenAirship(flights,time,dusk) {
    const pass = flights.find(({start,end})=>time>=start && time<end);
    if (!pass) return;
    const {w,h,ctx:g} = this;
    const progress = (time-pass.start)/(pass.end-pass.start);
    const wave = progress*Math.PI*2;
    const z = 177-32*progress;
    const altitude = 46+1.4*Math.sin(wave+pass.style);
    const span = 43+w*this.depth(altitude,177)/(2*this.fx);
    const [x,projectedY] = this.project(span*pass.side*(2*progress-1),altitude,z);
    const [light,mid,shadow] = WeddingScene.airshipColors[pass.style];
    const image = this.photos[pass.image];
    const hull = WeddingScene.airshipHull;
    const scale = Math.min(1.48,w*.00175,h*.00225,this.fx*.23/this.depth(altitude,z));
    // Leave room for the whole suspended poster above the tops of the garden arches.
    const skyTop = 10, skyBottom = this.horizon-10;
    const verticalScale = Math.min(scale,(skyBottom-skyTop)/400);
    const y = Math.min(skyBottom-330*verticalScale,Math.max(skyTop+70*verticalScale,projectedY));
    g.save();
    g.translate(x,y);
    g.scale(scale,verticalScale);
    g.rotate(pass.side*(.028+.031*Math.sin(wave)));
    g.globalAlpha *= 1-dusk*.31;
    g.save();
    g.scale(pass.side,1);
    this.poly([[-122,-15],[-180,-49],[-158,-8],[-181,32],[-112,15]],shadow);
    this.poly([[-132,12],[-166,41],[-138,38],[-111,23]],mid);
    for (const [a,b] of [[-56,-35],[64,50]]) {
      this.line([[a,42],[b,80]],"#805e4a",3);
    }
    g.fillStyle = shadow;
    g.beginPath();
    g.roundRect(-45,67,116,24,[4,7,13,12]);
    g.fill();
    for (const at of [-29,-3,23,49]) {
      g.fillStyle = "#f5dfaa";
      g.fillRect(at,73,15,7);
    }
    const silk = g.createLinearGradient(0,-56,0,60);
    silk.addColorStop(0,light);
    silk.addColorStop(.54,mid);
    silk.addColorStop(1,shadow);
    g.fillStyle = silk;
    g.fill(hull);
    g.save();
    g.clip(hull);
    for (const at of [-128,-89,87,127]) {
      g.beginPath();
      g.ellipse(at,0,15,62,-.13,0,Math.PI*2);
      g.strokeStyle = "#633c452f";
      g.lineWidth = 1.5;
      g.stroke();
    }
    this.line([[-166,3],[-127,11],[-74,15],[75,15],[129,10],[177,1]],"#ffe7b99e",2.5);
    g.restore();
    g.strokeStyle = shadow;
    g.lineWidth = 2.2;
    g.stroke(hull);
    g.restore();

    if (image) this.airshipPoster(image,pass.side*Math.sin(wave*2.45+.4),verticalScale/scale);
    g.restore();
  }

  airshipPoster(image,sway,aspect) {
    const g = this.ctx;
    const ratio = Math.min(338/image.width,177/image.height);
    const width = image.width*ratio*aspect, height = image.height*ratio;
    const half = width/2+8, top = 108, bottom = height+13;
    const drift = sway*10, tilt = sway*.073;
    for (const side of [-1,1]) {
      const pin = side*(half-4);
      const end = [drift+pin*Math.cos(tilt),top+pin*Math.sin(tilt)];
      this.line([[side*31,87],end],"#574644",2.8);
      this.line([[side*31+.8,87],[end[0]+.8,end[1]]],"#ddc398",.95);
    }
    g.translate(drift,top);
    g.rotate(tilt);
    g.fillStyle = "#ffe6b9";
    g.beginPath();
    g.moveTo(-half,0);
    g.lineTo(half,0);
    g.lineTo(half-2,bottom-2);
    g.quadraticCurveTo(0,bottom+7,-half+2,bottom-2);
    g.closePath();
    g.fill();
    g.drawImage(image,-width/2,6,width,height);
    this.line([[-half-2,0],[half+2,0]],"#876544",3.6);
    for (const side of [-1,1]) this.ellipse(side*(half-4),0,2.5,2.5,"#f5cc85");
  }

  wallArtwork(sprite,z,side,centerY,maxHeight,maxLength,framed=false) {
    const opacity = this.distanceVisibility(z,framed?54:42,framed?82:65);
    if (!opacity) return;
    // Set the proportions for the point where a wall piece fills the side of the view.
    const squeeze = Math.max(1,this.h*.88/this.w);
    const wall = WeddingScene.hallWall;
    const ratio = sprite.width/sprite.height*2.82*squeeze;
    const height = Math.min(maxHeight,maxLength/ratio);
    const half = height*ratio/2;
    const top = centerY+height/2;
    const bottom = centerY-height/2;
    const wallX = side*(wall-.045);
    // Clip the near edge to the viewport. The far end stays visible as the frame passes by.
    const space = side<0 ? this.cx : this.w-this.cx;
    const screenDepth = Math.abs(wallX-this.cameraX)*this.fx/Math.max(1,space+2);
    const nearest = Math.max(.7-this.depth(top,0),screenDepth-this.depth(bottom,0));
    if (z+half<=nearest) return;
    const cut = Math.max(0,(nearest-z+half)/(2*half));
    const start = side<0 ? cut : 0;
    const end = side>0 ? 1-cut : 1;
    const point = (fraction,y) => [wallX,y,z-side*half*(2*fraction-1)];
    const corners = [point(start,top),point(end,top),point(end,bottom),point(start,bottom)];
    const screen = corners.map(p=>this.project(...p));

    const g = this.ctx;
    g.save();
    g.globalAlpha *= opacity;
    if (framed) {
      this.face(corners.map(([,y,depth])=>[side*wall,y-.075,depth-.09]),"#33252662");
      if (!cut) {
        const edge = side>0 ? 1 : 0;
        this.face([corners[edge],corners[3-edge],
          [side*wall,...corners[3-edge].slice(1)],[side*wall,...corners[edge].slice(1)]],"#522b20");
      }
    }

    // Project short strips of the texture along the wall plane.
    g.beginPath();
    screen.forEach(([x,y],i)=>i ? g.lineTo(x,y) : g.moveTo(x,y));
    g.closePath();
    g.clip();
    const pixelWidth = Math.abs(screen[1][0]-screen[0][0]);
    const strips = Math.max(1,Math.min(14,Math.ceil(pixelWidth/10)));
    const span = (end-start)*sprite.width;
    const sw = span/strips;
    const overlap = Math.min(sw/3,span/Math.max(pixelWidth,1));
    const dpr = this.dpr;
    let [ax,ay] = screen[0];
    let [cx,cy] = screen[3];
    for (let i=0;i<strips;i++) {
      const b = start+(end-start)*(i+1)/strips;
      const [bx,by] = this.project(...point(b,top));
      const [dx,dy] = this.project(...point(b,bottom));
      const left = i===0 ? 0 : overlap;
      const right = i===strips-1 ? 0 : overlap;
      const sampleWidth = sw+left+right;
      const source = start*sprite.width+i*sw-left;
      if (Math.abs(ax-bx-cx+dx)+Math.abs(ay-by-cy+dy)>1.25) {
        // Close up, fit both triangles so the front and back edges stay aligned.
        this.wallTriangle(sprite,source,sampleWidth,left,sw,
          [ax,ay,bx,by,cx,cy],ax,ay,bx-ax,by-ay,cx-ax,cy-ay);
        this.wallTriangle(sprite,source,sampleWidth,left,sw,
          [dx,dy,cx,cy,bx,by],bx+cx-dx,by+cy-dy,dx-cx,dy-cy,dx-bx,dy-by);
      } else {
        g.setTransform(dpr*(bx-ax+dx-cx)/(2*sw),dpr*(by-ay+dy-cy)/(2*sw),
          dpr*(cx-ax+dx-bx)/(2*sprite.height),dpr*(cy-ay+dy-by)/(2*sprite.height),
          dpr*(3*ax+bx+cx-dx)/4,dpr*(3*ay+by+cy-dy)/4);
        g.drawImage(sprite,source,0,sampleWidth,sprite.height,-left,0,sampleWidth,sprite.height);
      }
      ax=bx; ay=by;
      cx=dx; cy=dy;
    }
    g.restore();
  }

  wallTriangle(sprite,source,width,left,sw,points,x,y,ux,uy,vx,vy) {
    const g = this.ctx;
    const dpr = this.dpr;
    const centerX = (points[0]+points[2]+points[4])/3;
    const centerY = (points[1]+points[3]+points[5])/3;
    g.save();
    g.setTransform(dpr,0,0,dpr,0,0);
    g.beginPath();
    for (let i=0;i<6;i+=2) {
      const a=points[i], b=points[i+1];
      const grow=1.2/(Math.hypot(a-centerX,b-centerY)||1);
      const px=a+(a-centerX)*grow, py=b+(b-centerY)*grow;
      if (i===0) g.moveTo(px,py);
      else g.lineTo(px,py);
    }
    g.closePath();
    g.clip();
    g.setTransform(dpr*ux/sw,dpr*uy/sw,dpr*vx/sprite.height,dpr*vy/sprite.height,dpr*x,dpr*y);
    g.drawImage(sprite,source,0,width,sprite.height,-left,0,width,sprite.height);
    g.restore();
  }

  gardenCity(distance, entranceZ) {
    const near = Math.max(this.cameraDepth-7,entranceZ);
    const {sceneryDistance}=WeddingScene.renderSettings[this.renderQuality];
    const postDistance=Math.min(148,sceneryDistance);
    for (const side of [-1,1]) {
      for (const row of [1,0]) {
        const block = row ? 29 : 19;
        const offset = row ? 12 : 0;
        const first = Math.floor((distance+near-offset)/block);
        const last = Math.floor((distance+sceneryDistance-offset)/block);
        for (let index=last;index>=first;index--) {
          const z = index*block+offset-distance;
          if (z < entranceZ && z+block <= entranceZ) continue;
          const seed = index+side*401+row*83;
          const width = (row ? 9 : 6)+this.rnd(seed+8)*5;
          const length = block*(.69+this.rnd(seed+20)*.22);
          const edge = (row ? 36 : 23.8)+this.rnd(seed+4)*2.8;
          const height = row ? 13+this.rnd(seed+11)*14 : 6.5+this.rnd(seed+11)*10;
          const [inner] = this.project(side*edge,0,z+length);
          if (z+length <= near || (side<0 ? inner<0 : inner>this.w)) continue;
          this.cityBuilding(side*(edge+width/2),Math.max(z,entranceZ),width,z+length-Math.max(z,entranceZ),
            height,seed,row,sceneryDistance);
        }
      }
      const edge = side*22.2;
      const cap = edge+side*.37;
      this.face([[edge,0,near],[edge,0,2048],[edge,4.15,2048],[edge,4.15,near]],"#a99b82");
      this.face([[edge,.55,near],[edge,.55,2048],[edge,.72,2048],[edge,.72,near]],"#8e826c");
      this.plane(edge,cap,near,2048,4.15,"#e0d4b8");
      this.face([[edge,3.89,near],[edge,3.89,2048],[edge,4.15,2048],[edge,4.15,near]],"#cbbca0");
      const start = Math.ceil((distance+near)/12)*12;
      for (let position=start;position<distance+postDistance;position+=12) {
        const z = position-distance;
        const [px] = this.project(edge,2,z);
        if (px < -12 || px > this.w+12) continue;
        const g = this.ctx;
        g.globalAlpha = this.distanceVisibility(z,Math.min(90,postDistance-40),postDistance);
        this.box(edge,z,.53,.64,0,4.38,["#b3a28a","#e5dbc5","#978a73"]);
        this.box(edge,z-.04,.69,.71,4.15,4.39,["#cfbea4","#e9ddc1","#aa9b81"]);
        g.globalAlpha = 1;
      }
    }
  }

  cityBuilding(x,z,width,length,height,seed,row,sceneryDistance) {
    if (length <= .1) return;
    const g = this.ctx;
    const palette = [
      ["#c1ae91","#dfcdb5","#a58c76","#718c92"],
      ["#be8d7e","#cab2a0","#a57268","#768991"],
      ["#a5b8ba","#c8d1cc","#789bab","#627f94"],
      ["#b8b3a1","#d8d3bb","#999b88","#7f8d85"],
      ["#969fa9","#bdc5c9","#808c96","#657c89"]
    ][Math.floor(this.rnd(seed+5)*5)];
    g.save();
    g.globalAlpha *= this.distanceVisibility(z,Math.min(135,sceneryDistance-46),sceneryDistance);
    this.box(x,z,width,length,0,height,palette);
    const x1 = x-width/2;
    const x2 = x+width/2;
    const inner = x>0 ? x1-.014 : x2+.014;
    const front = z>=this.cameraDepth-6;
    const pitched = !row && this.rnd(seed+63)<.37;
    if (pitched) {
      this.face([[x1-.18,height,z-.16],[x,height+2.2,z-.16],[x2+.18,height,z-.16]],palette[2]);
      this.face([[inner,height,z-.16],[x,height+2.2,z-.16],[x,height+2.2,z+length+.16],
        [inner,height,z+length+.16]],"#8f7f75");
    } else {
      this.box(x,z-.12,width+.24,length+.24,height-.25,height+.28,[palette[2],palette[1],palette[2]]);
      if (row && this.rnd(seed+97)<.67) {
        this.box(x,z+length*.25,width*.64,length*.47,height,height+2.3,palette);
      }
    }
    const detail = this.distanceVisibility(z,Math.min(75,sceneryDistance-49),Math.min(135,sceneryDistance-12));
    g.globalAlpha *= detail;
    if (detail > 0) {
      const stepped = this.rnd(seed+14)<.55;
      const floor = stepped ? 2.2 : 2.65;
      for (let y=2.1;y<height-1;y+=floor) {
        const top = y+(stepped?1.03:.78);
        if (front) this.front(x1+width*.12,x2-width*.12,y,top,z-.012,palette[3]);
        this.face([[inner,y,z+length*.08],[inner,top,z+length*.08],
          [inner,top,z+length*.91],[inner,y,z+length*.91]],palette[3]);
      }
      for (const ratio of [.31,.52,.73]) {
        if (front) this.front(x1+width*ratio-.08,x1+width*ratio+.08,1.8,height-.54,z-.022,palette[0]);
        const at = z+length*ratio;
        this.face([[inner,1.8,at],[inner,height-.54,at],[inner,height-.54,at+.19],[inner,1.8,at+.19]],palette[2]);
      }
    }
    g.restore();
  }

  ground(distance, garden, far=2048, railEnd=far) {
    const edge = garden ? "#baa987" : "#edbd76";
    const near=this.cameraDepth-7.1;
    const floorPaint=(farColor,midColor,nearColor) => {
      const gradient=this.ctx.createLinearGradient(0,this.horizon,0,this.h);
      gradient.addColorStop(0,farColor);
      gradient.addColorStop(.32,midColor);
      gradient.addColorStop(1,nearColor);
      return gradient;
    };
    if (garden) {
      for (const side of [-1,1]) {
        this.plane(side*8.6,side*13.7,near,far,.003,"#8dc265");
        this.plane(side*15.0,side*20.6,near,far,.004,"#a3ca6c");
        this.plane(side*10.9,side*12.55,near,far,.007,"#dfd0ab");
        this.plane(side*11.08,side*12.38,near,far,.009,"#f3e3bf");
      }
    }
    this.plane(-7.6,7.6,near,far,0,garden?"#e3c792":floorPaint("#f0c990","#ce9863","#a46d4e"));
    this.plane(-4.15,4.15,near,far,.012,garden?"#51574d":floorPaint("#8b6457","#5a4343","#3e3037"));
    this.plane(-1.42,1.42,near,far,.016,garden?"#9e784f":floorPaint("#b97864","#91434f","#64253b"));
    for (const side of [-1, 1]) {
      if (!garden) {
        this.plane(side*1.23,side*1.29,near,far,.020,"#d697717f");
        this.plane(side*4.35,side*4.54,near,far,.023,"#7e42414a");
        this.plane(side*6.63,side*7.6,near,far,.020,"#75453d40");
      }
      this.plane(side*4.19,side*4.29,near,far,.025,edge);
      this.plane(side*4.48,side*4.51,near,far,.026,garden?"#faf0ce":"#ffe1a9");
      this.plane(side*7.30,side*7.38,near,far,.027,edge);
    }
    const spacing = 2.2;
    const lanes = [-2.65,0,2.65];
    const origin = Math.floor((distance+Math.min(122,far))/spacing)*spacing;
    this.ctx.save();
    for (let absolute = origin; absolute > distance + near; absolute -= spacing) {
      const z = absolute - distance;
      this.ctx.globalAlpha = this.distanceVisibility(z,73,122);
      const faint = Math.floor(absolute / spacing + .01) % 2;
      if (faint) {
        this.plane(-7.28,-4.35,z,z+.07,.025,"#f7e8be7b");
        this.plane(4.35,7.28,z,z+.07,.025,"#f7e8be7b");
      }
      if (z>=railEnd) continue;
      this.plane(-.93,.93,z,z+.20,.045,"#3f3a32",lanes);
      if (z<70) this.plane(-.9,.9,z+.13,z+.19,.049,"#927f65",lanes);
    }
    this.ctx.restore();
    if (railEnd<=near) return;
    for (const x of [-2.65, 0, 2.65]) {
      for (const rail of [x-.72, x+.72]) {
        this.plane(rail-.056,rail+.056,near,railEnd,.058,"#3b3f38");
        this.plane(rail-.024,rail+.038,near,railEnd,.074,garden?"#ffe1aa":"#f3dcb5");
      }
    }
  }

  highwayApproach(distance, from, to) {
    const near=Math.max(this.cameraDepth-6.9,from);
    const length=WeddingScene.roadTransitionLength;
    const fullPavement=from+length;
    const g=this.ctx;
    const paint=(y,color) => {
      const bottom=(this.eye-y)*this.fy/(this.h-this.horizon)-this.depth(y,0);
      const visibleStart=Math.max(near,bottom);
      if (visibleStart>=fullPavement) return `rgb(${color})`;
      const [,startY]=this.project(0,y,visibleStart);
      const [,endY]=this.project(0,y,fullPavement);
      const gradient=g.createLinearGradient(0,startY,0,endY);
      for (const sample of [0,.25,.5,.75,1]) {
        const z=visibleStart+(fullPavement-visibleStart)*sample;
        const [,screenY]=this.project(0,y,z);
        const stop=Math.min(1,Math.max(0,(screenY-startY)/(endY-startY)));
        gradient.addColorStop(stop,`rgba(${color},${Math.min(1,(z-from)/length)})`);
      }
      return gradient;
    };
    // Fade the asphalt over rails at a fixed point on the route.
    this.plane(-4.45,4.45,near,to,.085,paint(.085,"65,70,82"));
    const edge=paint(.10,"223,212,173");
    for (const x of [-3.975,3.975]) this.plane(x-.035,x+.035,near,to,.10,edge);
    const first=Math.floor((distance+near)/4)*4-distance;
    const last=Math.min(to,WeddingScene.viewDistance);
    g.save();
    for (let z=first;z<last;z+=4) {
      const start=Math.max(near,z);
      const end=Math.min(to,z+1.68);
      if (end<=start) continue;
      g.globalAlpha=Math.min(1,(start-from)/length)*this.distanceVisibility(z,140);
      this.plane(-.06,.06,start,end,.111,"#d0c9b8");
    }
    g.restore();
  }

  highwayGround(z) {
    this.plane(-70,70,z-5.2,z+17.5,.090,"#4e5460");
    this.plane(-70,70,z-4.8,z+16.9,.095,"#333944");
    const visibility=this.distanceVisibility(z,98,204);
    if (visibility<=0) return;
    const g=this.ctx;
    g.save();
    g.globalAlpha=visibility;
    for (const side of [-1,1]) {
      this.plane(-69,69,z+6.5+side*.17,z+6.55+side*.17,.105,"#c9a66a");
      this.plane(-69,69,z+(side>0?15.98:-4.33),z+(side>0?16.07:-4.24),.106,"#c0c4ca");
    }
    for (let x=-66;x<68;x+=6.2) {
      this.plane(x,x+3.1,z+10.52,z+10.59,.115,"#aeb3bd");
    }
    const guard="#687485";
    for (let x=-64;x<=64;x+=3.7) this.box(x,z+18.15,.11,.18,.06,.84,[guard,guard,guard]);
    this.box(0,z+18.14,132,.19,.66,.84,["#8492a3","#a7a8b0","#697386"]);
    for (const x of [-15.8,15.8]) {
      for (const at of [z-4.7,z+18.2]) {
        this.box(x,at,.14,.16,.04,5.46,["#718093","#a8aab5","#4e5d75"]);
        this.box(x*.978,at-.1,.69,.32,5.31,5.50,["#68798d","#9299a8","#4e6077"]);
      }
    }
    g.restore();
  }

  highwayLineup(z) {
    const g=this.ctx;
    const visibility=this.distanceVisibility(z,70,190);
    if (visibility<=0) return;
    g.save();
    g.globalAlpha=visibility;
    const {parkedTrucks,parkedAveo}=WeddingModels;
    const lampsFor=(vehicle,scale)=>{
      const pose=WeddingModels.poseTransform(vehicle.yaw,vehicle.scale ?? 1,0);
      return vehicle.lights.map(point => {
        const [x,y,depth]=pose(point);
        return [x+vehicle.x,y,z+vehicle.z+depth,scale];
      });
    };
    const truckLamps=parkedTrucks.flatMap(truck=>lampsFor(truck,1));
    const aveoLamps=lampsFor(parkedAveo,.80);
    const aveoPose=WeddingModels.poseTransform(parkedAveo.yaw,parkedAveo.scale,0);
    const {halfWidth,front,rear}=parkedAveo.bounds;
    const side=halfWidth-.055;
    const aveoShadow=[[-side,.035,-front],[side,.035,-front],[side,.035,rear],[-side,.035,rear]];
    this.face(aveoShadow.map(point=>{
      const [x,y,depth]=aveoPose(point);
      return [parkedAveo.x+x,y,z+parkedAveo.z+depth];
    }),"#1016258c");
    for (const [x,,depth,scale] of [...truckLamps,...aveoLamps]) {
      const [px,py]=this.project(x,.11,depth);
      const end=depth-7.2*scale;
      const [endX,endY]=this.project(x,.11,end);
      const beam=g.createLinearGradient(px,py,endX,endY);
      beam.addColorStop(0,"#f6deb16e");
      beam.addColorStop(.37,"#fce4bf3a");
      beam.addColorStop(1,"#f7dfc000");
      this.face([[x-.19*scale,.11,depth],[x+.19*scale,.11,depth],
        [x+1.18*scale,.11,end],[x-1.18*scale,.11,end]],beam);
    }
    for (const truck of parkedTrucks) truck.trailer.render(this,truck.x,0,z+truck.z,truck.yaw);
    for (const truck of parkedTrucks) truck.mesh.render(this,truck.x,0,z+truck.z,truck.yaw,truck.scale ?? 1);
    WeddingModels.parkedWoman.render(this,-6.98,0,z-1.4,Math.PI-.24);
    const guest=this.guestSprites[0];
    if (guest.image.naturalWidth) {
      const [x,top]=this.project(1.62,1.82,z-4.7);
      const [,bottom]=this.project(1.62,0,z-4.7);
      const width=(bottom-top)*guest.image.naturalWidth/guest.image.naturalHeight;
      g.save();
      g.translate(x-width/2,top);
      g.scale(width/guest.image.naturalWidth,(bottom-top)/guest.image.naturalHeight);
      g.clip(guest.outline);
      g.drawImage(guest.image,0,0);
      g.restore();
    }
    const drawLamp = ([x,y,depth,scale])=>{
      const [px,py]=this.project(x,y,depth);
      const size=scale*Math.max(3,130/this.depth(y,depth));
      const bloom=g.createRadialGradient(px,py,0,px,py,size*3.7);
      bloom.addColorStop(0,"#fff6d9ad");
      bloom.addColorStop(.31,"#ffe6bb78");
      bloom.addColorStop(1,"#ffd28a00");
      this.ellipse(px,py,size*3.7,size*3.7,bloom);
      this.ellipse(px,py,size*.80,size*.36,"#fff3da");
    };
    truckLamps.forEach(drawLamp);
    // The Aveo is in front of the other parked vehicles and their headlight blooms.
    const depth = this.parkedAveoDepth ??= new WeddingVehicleDepth();
    depth.start();
    depth.add(parkedAveo.mesh,parkedAveo.x,0,z+parkedAveo.z,parkedAveo.yaw,parkedAveo.scale);
    depth.paint(this);
    aveoLamps.forEach(drawLamp);
    for (const x of [-15.8,15.8]) {
      for (const at of [z-4.8,z+18.1]) {
        const [px,py]=this.project(x*.978,5.33,at);
        const radius=Math.max(5,540/this.depth(5.33,at));
        const glow=g.createRadialGradient(px,py,1,px,py,radius);
        glow.addColorStop(0,"#ffdeb2b8");
        glow.addColorStop(1,"#ffdeb200");
        this.ellipse(px,py,radius,radius,glow);
        this.ellipse(px,py,Math.max(1,radius*.16),Math.max(1,radius*.055),"#fff0d0");
      }
    }
    g.restore();
  }

  chandelier(z, time) {
    // Blend the lights out before they enter the chase camera's near field.
    const fadeStart=7.5+this.cameraRise*15;
    const opacity=Math.min(1,Math.max(0,(z-fadeStart)/8));
    if (opacity<=0) return;
    const [x, y] = this.project(0,8.12,z);
    const [, roof] = this.project(0,9.25,z);
    const s = this.fy / (z + 6);
    const u = this.fx / (z + 6);
    const g = this.ctx;
    if (y < -3 * s || s < 3) return;
    g.save();
    g.globalAlpha *= opacity*opacity*(3-2*opacity)*this.distanceVisibility(z,80,145);
    if (u<8) {
      this.line([[x,roof],[x,y+.28*s]],"#bd854c",1);
      this.ellipse(x,y+.17*s,u*1.25,s*.11,"#e3ac69");
      this.ellipse(x,y,u*.95,s*.088,"#fff2b9");
      g.restore();
      return;
    }
    g.drawImage(this.lampGlow,x-2.20*u,y-1.53*s,4.4*u,3.32*s);
    this.line([[x, roof], [x, y+.52*s]], "#bd854c", Math.max(1, u*.067));
    this.ellipse(x,roof,u*.24,s*.052,"#dba864");
    const gold=g.createLinearGradient(x-u,0,x+u,0);
    gold.addColorStop(0,"#a96b42");
    gold.addColorStop(.43,"#ffe6aa");
    gold.addColorStop(1,"#c98f51");
    g.strokeStyle=gold;
    g.lineWidth=Math.max(1,u*.055);
    for (const [dy,rx,ry] of [[0,1.38,.16],[.30,.73,.12]]) {
      g.beginPath();
      g.ellipse(x,y+dy*s,u*rx,s*ry,0,0,Math.PI);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x-u*1.08,y+.12*s);
    g.quadraticCurveTo(x-u*.77,y+.50*s,x,y+.50*s);
    g.quadraticCurveTo(x+u*.77,y+.50*s,x+u*1.08,y+.12*s);
    g.stroke();
    for (let i=-4;i<=4;i++) {
      const bx=x+i*.311*u;
      const by=y+(4-Math.abs(i))*.036*s;
      this.line([[bx,by],[bx,by-.19*s]],"#c58c51",Math.max(.7,u*.042));
      this.hallBulb(bx,by-.24*s,Math.max(.55,u*.059),time*1.9+i*.6);
      this.ellipse(bx,by+.12*s,u*.032,s*.065,"#ffeac6");
    }
    this.ellipse(x,y+.59*s,u*.079,s*.108,"#ffe6a9");
    g.restore();
  }

  arch(x, z, width, height, colors, floral = false) {
    const [px, y] = this.project(x, 0, z);
    const rx = width * this.fx / (z+6) / 2;
    const ry = height * this.fy / (z+6);
    const g = this.ctx;
    if (rx < 2) return;
    const band = Math.max(2, rx*.13);
    for (let i = 0; i < 3; i++) {
      const inset = (i-1) * band*.37;
      g.beginPath();
      g.moveTo(px-rx+inset, y);
      g.lineTo(px-rx+inset, y-ry*.63);
      g.bezierCurveTo(px-rx+inset, y-ry*1.12, px+rx-inset, y-ry*1.12, px+rx-inset, y-ry*.63);
      g.lineTo(px+rx-inset, y);
      g.strokeStyle = colors[i];
      g.lineWidth = i === 0 ? band : Math.max(1, band*.31);
      g.stroke();
    }
    if (floral) {
      this.bouquet(px-rx*.87, y-ry*.755, band*.8, 15);
      this.bouquet(px+rx*.83, y-ry*.789, band*.9, 27);
      this.bouquet(px-rx*.98, y-ry*.11, band*.72, 41);
      this.bouquet(px+rx*.98, y-ry*.11, band*.72, 36);
    }
  }

  makeLampGlow() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 96;
    const g = canvas.getContext("2d");
    const light = g.createRadialGradient(48,48,0,48,48,48);
    light.addColorStop(0,"#ffb5656b");
    light.addColorStop(1,"#ffa37c00");
    g.fillStyle = light;
    g.fillRect(0,0,96,96);
    return canvas;
  }

  makeHallLight() {
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 48;
    const g = sprite.getContext("2d");
    g.fillStyle = "#efb664";
    g.beginPath();
    g.ellipse(24,24,20,24,0,0,2*Math.PI);
    g.fill();
    g.fillStyle = "#fff4c3";
    g.beginPath();
    g.ellipse(24,20.2,12.6,13.8,0,0,2*Math.PI);
    g.fill();
    return sprite;
  }

  makeBouquet(seed) {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 96;
    const g = canvas.getContext("2d");
    const size = 22;
    const ellipse = (x,y,rx,ry,fill) => {
      g.fillStyle = fill;
      g.beginPath();
      g.ellipse(x,y,rx,ry,0,0,Math.PI*2);
      g.fill();
    };
    for (let i = 0; i < 14; i++) {
      const a = this.rnd(seed+i*.61) * Math.PI * 2;
      const r = this.rnd(seed+i*8.1) * size * 2.0;
      const tx = 60+Math.cos(a)*r;
      const ty = 48+Math.sin(a)*r*.71;
      ellipse(tx-size*.17, ty+size*.33, size*.53, size*.23, i % 2 ? "#526648" : "#384e46");
      ellipse(tx, ty, size*(.18+this.rnd(i)*.26), size*.29, ["#ffd9b5","#ffa9aa","#e77290","#fff0d9"][i%4]);
      ellipse(tx, ty, size*.12, size*.088, "#da7b70");
    }
    return canvas;
  }

  bouquet(x, y, size, seed) {
    const sprite = this.bouquets[Math.floor(this.rnd(seed)*this.bouquets.length)];
    const width = sprite.width*size/22;
    const height = sprite.height*size/22;
    this.ctx.drawImage(sprite,x-width/2,y-height/2,width,height);
  }

  makeHallFlowers(variant) {
    const sprite=document.createElement("canvas");
    sprite.width=240;
    sprite.height=160;
    const g=sprite.getContext("2d");
    const seed=variant*37;
    const foliage=g.createLinearGradient(0,25,0,145);
    foliage.addColorStop(0,"#85a95b");
    foliage.addColorStop(.36,"#397e4c");
    foliage.addColorStop(1,"#123b31");
    const leaf=new Path2D("M 0 0 Q 8 -14 31 0 Q 10 14 0 0");
    const greenery=["#1a543b","#2b7246","#52914f",foliage,"#7caa5b"];
    for (let i=0;i<40;i++) {
      const angle=i*2.4;
      const spread=.43+this.rnd(seed+i*1.63)*.59;
      const x=120+Math.cos(angle)*108*spread;
      const y=80+Math.sin(angle)*53*spread;
      g.save();
      g.translate(x,y);
      g.rotate(angle+this.rnd(i+14)-.5);
      g.scale(.62+this.rnd(i+26)*.75,.60+this.rnd(i)*.46);
      g.translate(-19,0);
      g.fillStyle=greenery[i%greenery.length];
      g.fill(leaf);
      g.strokeStyle="#d6d98955";
      g.lineWidth=1.05;
      g.beginPath();
      g.moveTo(3,0);
      g.quadraticCurveTo(17,-2,28,0);
      g.stroke();
      g.restore();
    }
    const colors=[
      ["#dab68c","#fff3d5","#fffbee","#c38e57"],
      ["#af5762","#f4bac0","#ffe1d0","#a95765"],
      ["#64203c","#ac3554","#e46e84","#731e42"]
    ];
    const mix=[[0,0,1,0,2],[1,0,2,1,0],[2,1,0,2,0]][variant];
    for (let i=0;i<17;i++) {
      const angle=i*2.4+.5;
      const spread=Math.sqrt((17-i)/17);
      const x=120+Math.cos(angle)*83*spread;
      const y=81+Math.sin(angle)*45*spread;
      const r=(i<7?8:10)+this.rnd(seed+i*9)*9;
      const [shadow,body,edge,center]=colors[mix[i%mix.length]];
      g.beginPath();
      g.ellipse(x+1,y+3,r*1.12,r*.94,angle,0,Math.PI*2);
      g.fillStyle="#24251e88";
      g.fill();
      for (let petal=0;petal<5;petal++) {
        const a=angle+petal*Math.PI*.4;
        const px=x+Math.cos(a)*r*.48;
        const py=y+Math.sin(a)*r*.43;
        g.beginPath();
        g.ellipse(px,py,r*.56,r*.63,a,0,Math.PI*2);
        g.fillStyle=petal%3===0?shadow:body;
        g.fill();
        g.strokeStyle=edge;
        g.lineWidth=1.2;
        g.stroke();
      }
      g.beginPath();
      g.arc(x,y,r*.43,0,Math.PI*2);
      g.fillStyle=edge;
      g.fill();
      g.beginPath();
      g.arc(x+1,y,r*.20,0,Math.PI*2);
      g.fillStyle=center;
      g.fill();
    }
    return sprite;
  }

  hallArrangement(x,y,z,width,height,variant) {
    const depth=this.depth(y,z);
    if (depth<.55) return;
    const [px,py]=this.project(x,y,z);
    const w=this.fx*width/depth;
    const h=this.fy*height/depth;
    if (px+w/2<0 || px-w/2>this.w || py+h/2<0 || py-h/2>this.h) return;
    this.ctx.drawImage(this.hallFlowers[variant],px-w/2,py-h/2,w,h);
  }

  makeWallOrnament(rose) {
    const sprite = document.createElement("canvas");
    sprite.width = 360;
    sprite.height = 263;
    const g = sprite.getContext("2d");
    const ribbon = g.createLinearGradient(0,38,0,232);
    ribbon.addColorStop(0,rose?"#ffd3bd":"#ffebe0");
    ribbon.addColorStop(.44,rose?"#de7181":"#f29a9f");
    ribbon.addColorStop(1,rose?"#a83e5d":"#bd506c");
    g.save();
    for (const side of [-1,1]) {
      g.save();
      g.translate(180,62);
      g.scale(side,1);
      const streamer = new Path2D("M 0,0 C 58,-22 121,8 111,46 C 105,67 69,53 49,34 C 67,68 100,109 105,168 L 80,150 L 67,174 C 65,115 22,62 0,18 Z");
      g.translate(3,5);
      g.fillStyle = "#502f3550";
      g.fill(streamer);
      g.translate(-3,-5);
      g.fillStyle = ribbon;
      g.fill(streamer);
      g.strokeStyle = "#ffddbd9c";
      g.lineWidth = 2;
      g.stroke(new Path2D("M 6,4 C 55,-6 103,8 105,35 M 44,43 C 61,71 83,108 90,141"));
      g.restore();
    }
    const gold = g.createLinearGradient(120,96,230,237);
    gold.addColorStop(0,"#ffedb2");
    gold.addColorStop(.38,"#db9d42");
    gold.addColorStop(.60,"#ffdd87");
    gold.addColorStop(1,"#a25c31");
    for (const side of [-1,1]) {
      g.beginPath();
      g.ellipse(180+side*31,164,47,62,side*.24,0,Math.PI*2);
      g.lineWidth = 14;
      g.strokeStyle = "#50302272";
      g.stroke();
      g.lineWidth = 10;
      g.strokeStyle = gold;
      g.stroke();
    }
    for (const side of [-1,1]) {
      g.save();
      g.translate(180,73);
      g.scale(side,1);
      g.strokeStyle = "#335c48";
      g.lineWidth = 3.5;
      g.stroke(new Path2D("M 0,16 Q 88,-4 166,-50"));
      for (let i=0;i<12;i++) {
        const x = 45+i*10;
        const y = 5-i*3.7;
        g.beginPath();
        g.ellipse(x,y+(i%2?9:-8),17,6,i%2?.39:-.69,0,Math.PI*2);
        g.fillStyle = ["#356a54","#80a476","#5e9475"][i%3];
        g.fill();
      }
      g.restore();
    }
    for (const [x,y,size,seed] of [[123,73,70,3],[238,77,73,19],[181,65,101,27]]) {
      const flowers = this.bouquets[seed%this.bouquets.length];
      g.drawImage(flowers,x-size/2,y-size*.4,size,size*.8);
    }
    g.restore();
    return sprite;
  }

  hallSection(z, seed, gallerySide, detailScale) {
    const detail = this.distanceVisibility(z,52*detailScale,84*detailScale);
    for (const side of [-1,1]) {
      if (side === gallerySide) continue;
      const [innerEdge]=this.project(side*5.92,0,z+.82);
      if (side<0 ? innerEdge<0 : innerEdge>this.w) continue;
      const x=side*6.87;
      const curtainX=x+side*.39;
      const curtainZ=z+.80;
      const [columnX,columnTop]=this.project(x,8.78,z);
      const [,floor]=this.project(x,0,z);
      const u=this.fx/(z+6);
      const curtains=[
        ["#eac899","#fff3d4","#b98860"],
        ["#9a3651","#c66271","#651b3a"],
        ["#edbdac","#ffe7cf","#bd8173"]
      ][((seed+Number(side>0))%3+3)%3];
      const drape=(amount,y)=>this.project(curtainX+side*amount,y,curtainZ);
      const top=(i)=>-1.25+i*.32;
      const tie=(i)=>-.13+i*.141;
      const hem=(i)=>-.33+i*.21;
      if (detail < 1) {
        this.poly([drape(top(0),8.62),drape(top(7),8.62),drape(tie(7),3.30),drape(hem(7),.12),
          drape(hem(0),.12),drape(tie(0),3.30)],curtains[0]);
        this.front(x-.175,x+.175,0,8.82,z,"#f4ebd5");
      }
      if (detail === 0) continue;
      const opacity = this.ctx.globalAlpha;
      this.ctx.globalAlpha *= detail;
      for (let i=0;i<7;i++) {
        this.poly([
          drape(top(i),8.62),drape(top(i+1),8.62),drape(tie(i+1),3.30),
          drape(hem(i+1),.12),drape(hem(i),.12),drape(tie(i),3.30)
        ],curtains[[0,1,0,2,0,1,0][i]]);
      }
      this.line([drape(-1.29,8.67),drape(1.02,8.67)],"#f4cc7d",Math.max(1,u*.047));
      this.line([drape(-.12,3.33),drape(.86,3.29)],"#f4c678",Math.max(1,u*.054));
      this.box(x,z,.35,.50,0,8.82,["#f3e0bc","#fff3d2","#aa866c"]);
      this.front(x-.208,x+.208,0,.24,z-.04,"#d3b48e");
      this.front(x-.264,x+.264,8.46,8.75,z-.04,"#f4deb8");
      this.front(x-.267,x+.267,8.46,8.51,z-.05,"#c88c51");
      this.line([[columnX-u*.07,columnTop+u*.35],[columnX-u*.07,floor-u*.30]],"#fff9e6",Math.max(1,u*.019));
      this.front(x-.080,x+.080,2.31,2.67,z-.05,"#edc58a");
      this.front(x-.049,x+.049,2.37,2.62,z-.059,"#fff6d8");
      if (seed%2===0) this.hallSwag(x-side*.28,z-.13);
      this.ctx.globalAlpha = opacity;
    }
  }

  hallSwag(x,z) {
    const depth=this.depth(6.18,z);
    if (depth<.55) return;
    const g = this.ctx;
    const [px,py] = this.project(x,6.18,z);
    const s = this.fy/depth;
    const u = this.fx/depth;
    g.strokeStyle = "#f0ce8e";
    g.lineWidth = Math.max(1,s*.044);
    for (const side of [-1,1]) {
      g.beginPath();
      g.ellipse(px+side*u*.15,py+s*.22,u*.23,s*.29,0,0,2*Math.PI);
      g.stroke();
      this.poly([[px,py-s*.08],[px+side*u*.42,py+s*.44],[px+side*u*.27,py+s*.37],
        [px+side*u*.24,py+s*.53]],"#ab2f55");
    }
    this.hallArrangement(x,6.28,z,1.26,.72,0);
  }

  hallBay(x,z,variant,covered,time,detailScale) {
    const side=Math.sign(x);
    const depth=this.depth(7.3,z);
    if (this.depth(7.3,z-3.85)<.55) return;
    const [edge]=this.project(x-side*.85,7.3,z+3.85);
    if (side<0 ? edge<0 : edge>this.w) return;
    const g=this.ctx;
    const u=this.fx/depth;
    const s=this.fy/depth;
    const point=(t,y)=>this.project(x,y,z+t*3.85);
    const detailed=u>=10/detailScale;
    const steps=detailed?10:4;
    const swag=Array.from({length:steps+1},(_,i)=> {
      const t=2*i/steps-1;
      return [t,7.82-(1-t*t)*.55];
    });
    const outline=swag.map(([t,y])=>point(t,y));
    this.poly(outline.concat(swag.slice().reverse().map(([t,y])=>point(t,y-.42*(1-t*t)-.06))),
      variant===1?"#f4d4a1":"#9f3855");
    this.line(outline,"#ffdb8b",Math.max(.65,u*.027));
    const lower=swag.map(([t,y])=>point(t,y-.54*(1-t*t)-.07));
    this.line(lower,"#4e3029",Math.max(.6,u*.024));
    for (let i=1;i<steps;i+=2) {
      const [px,py]=lower[i];
      this.hallBulb(px,py,Math.max(.48,s*.043),time+i*.83+z*.02);
    }
    this.hallArrangement(x,7.67,z+3.38,1.39,.76,variant);
    if (detailed) this.hallArrangement(x,7.51,z-2.82,1.12,.71,(variant+1)%3);
    if (covered) return;

    const [px,py]=this.project(x-side*.12,4.74,z+.65);
    if (!detailed) {
      this.ellipse(px,py,u*.20,s*.13,"#edba76");
      return;
    }
    const glow=s*.66;
    g.drawImage(this.lampGlow,px-glow,py-glow,glow*2,glow*2);
    this.ellipse(px+side*u*.06,py+s*.20,u*.17,s*.36,"#40182b79");
    this.ellipse(px,py+s*.15,u*.142,s*.32,"#c4894c");
    this.ellipse(px-side*u*.018,py+s*.10,u*.082,s*.22,"#ffe0a2");
    this.poly([[px-u*.24,py-s*.19],[px+u*.24,py-s*.19],[px+u*.16,py+s*.06],[px-u*.16,py+s*.06]],
      "#ffe2aa");
    this.line([[px-u*.24,py-s*.19],[px+u*.24,py-s*.19]],"#af7246",Math.max(.7,s*.033));
    this.hallBulb(px,py-s*.047,Math.max(.6,s*.057),time+variant);
  }

  hallBulb(x,y,radius,phase) {
    const g=this.ctx;
    const extent=radius*(radius>1.25?4.1:1.2);
    if (x+extent<0 || x-extent>this.w || y+extent<0 || y-extent>this.h) return;
    const opacity=g.globalAlpha;
    if (radius>1.25) {
      g.globalAlpha*=.76+.22*Math.sin(phase);
      g.drawImage(this.lampGlow,x-extent,y-extent,extent*2,extent*2);
    }
    g.drawImage(this.hallLight,x-radius*1.2,y-radius*1.2,radius*2.4,radius*2.4);
    if (radius>1.25) g.globalAlpha=opacity;
  }

  hallPlanter(x,z,variant) {
    const d=this.depth(0,z);
    if (d<.55) return;
    const [px,py]=this.project(x,0,z);
    const u=this.fx/d;
    const s=this.fy/d;
    if (px+u<0 || px-u>this.w || py-s*2.75>this.h) return;
    const [neck,crown]=this.project(x,1.47,z);
    const g=this.ctx;
    const brass=g.createLinearGradient(neck-u*.37,0,neck+u*.37,0);
    brass.addColorStop(0,"#88502e");
    brass.addColorStop(.26,"#d09651");
    brass.addColorStop(.50,"#ffe1a1");
    brass.addColorStop(.73,"#d99a50");
    brass.addColorStop(1,"#865031");
    this.ellipse(px,py,u*.78,s*.19,"#4b283250");
    this.box(x,z,.54,.53,.04,.69,["#a45e4f","#edc68c","#743c40"]);
    this.box(x,z-.038,.67,.60,.64,.77,["#dca967","#ffdea0","#a36541"]);
    g.beginPath();
    g.moveTo(neck-u*.38,crown);
    g.bezierCurveTo(neck-u*.37,crown+s*.34,neck-u*.15,crown+s*.28,px-u*.13,py-s*.78);
    g.lineTo(px+u*.13,py-s*.78);
    g.bezierCurveTo(neck+u*.15,crown+s*.28,neck+u*.37,crown+s*.34,neck+u*.38,crown);
    g.closePath();
    g.fillStyle=brass;
    g.fill();
    this.ellipse(neck,crown,u*.40,s*.087,"#eec183");
    this.ellipse(neck,crown,u*.35,s*.046,"#553322");
    this.hallArrangement(x,1.87,z+.06,2.18,1.44,variant);
  }

  hallFloorLight(x,z) {
    const depth=this.depth(.02,z);
    if (depth<1) return;
    const [px,py]=this.project(x,.02,z);
    const width=this.fx/depth*1.16;
    const height=this.fy/depth*Math.min(.66,3.2/depth);
    if (px+width<0 || px-width>this.w || py-height>this.h) return;
    this.ctx.drawImage(this.lampGlow,px-width,py-height,2*width,2*height);
  }

  hallCanopy(z,variant,time,detailScale) {
    const g=this.ctx;
    const depth=this.depth(8.55,z);
    if (depth<.55 || (variant===1 && this.project(0,7,z)[1]<-8)) return;
    const s=this.fy/depth;
    const u=this.fx/depth;
    const detailed=u>=8/detailScale;
    const half=variant===1?6.92:5.62;
    const metal=g.createLinearGradient(0,this.project(0,8.65,z)[1],0,this.project(0,3.7,z)[1]);
    metal.addColorStop(0,"#fff1ba");
    metal.addColorStop(.34,"#d79850");
    metal.addColorStop(.73,"#f6cd83");
    metal.addColorStop(1,"#a76342");
    if (variant!==1) {
      const archSteps=detailed?20:10;
      const arch=Array.from({length:archSteps+1},(_,i)=>{
        const x=(2*i/archSteps-1)*half;
        const y=6.14+2.41*Math.sqrt(Math.max(0,1-(x/half)**2));
        return this.project(x,y,z);
      });
      const frame=[this.project(-half,.22,z),...arch,this.project(half,.22,z)];
      this.line(frame,"#6c3e33",Math.max(1.4,u*.17));
      this.line(frame,metal,Math.max(.8,u*.105));
      if (detailed) this.line(arch.map(([x,y])=>[x,y+s*.144]),"#ffe4a7",Math.max(.6,u*.029));
      for (const side of [-1,1]) {
        if (detailed) {
          this.box(side*half,z-.20,.56,.48,0,.46,["#c99461","#ffe0a5","#89513d"]);
          this.box(side*half,z-.226,.68,.53,.37,.49,["#dbab70","#ffe7aa","#b9794a"]);
          this.hallArrangement(side*5.49,5.99,z-.13,2.02,1.86,variant);
        }
        this.hallArrangement(side*4.61,7.62,z-.15,2.63,1.34,variant);
        if (detailed) this.hallArrangement(side*3.25,8.11,z-.19,2.30,1.18,(variant+1)%3);
      }
      this.hallArrangement(-.17,8.46,z-.24,2.64,1.12,1);
    }

    for (const side of [-1,1]) {
      const anchor=side*half;
      const center=side*.13;
      const cloth=[];
      const hem=[];
      const seam=[];
      const cord=[];
      const clothSteps=detailed?12:6;
      for (let i=0;i<=clothSteps;i++) {
        const t=i/clothSteps;
        const sag=Math.sin(Math.PI*t);
        const x=anchor+(center-anchor)*t;
        const y=8.28+t*.20-sag*(variant===1?.85:.54);
        cloth.push(this.project(x,y,z-.29));
        if (detailed) seam.push(this.project(x,y-sag*.14,z-.30));
        hem.push(this.project(x,y-sag*(variant===1?.47:.30)-.06,z-.31));
        cord.push(this.project(x,y-sag*.53-.32,z-.37));
      }
      const clothColor=variant===1?"#ac3b5b":variant===2?"#ecb7a3":"#f6d6a7";
      this.poly(cloth.concat(hem.slice().reverse()),clothColor);
      if (detailed) this.poly(cloth.concat(seam.slice().reverse()),variant===1?"#dc7483":"#fff0cd");
      this.line(hem,metal,Math.max(.7,u*.033));
      this.line(cord,"#825642",Math.max(.6,u*.023));
      for (let i=1;i<cord.length;i+=2) {
        this.hallBulb(...cord[i],Math.max(.47,s*.050),time*2.1+i*.9+variant);
      }
      if (variant===1 && detailed) this.hallArrangement(anchor,8.22,z-.36,2.18,1.36,1);
    }
    if (variant===1) this.hallArrangement(0,8.42,z-.42,2.52,1.20,0);
  }

  hallTable(z,seed,positions=[-5.38,5.38]) {
    const detail = this.distanceVisibility(z,38,72);
    const opacity = this.ctx.globalAlpha;
    for (const x of positions) {
      const [px,y]=this.project(x,.95,z);
      const [floorX,floor]=this.project(x,0,z-.13);
      const d=Math.max(.8,z+6-this.cameraDepth+(this.eye-.95)*.16);
      const u=this.fx/d;
      const s=this.fy/d;
      if (y-s*.57>this.h || px+u<0 || px-u>this.w) continue;
      this.ellipse(floorX,floor,u*.92,s*.25,"#5648345c");
      this.poly([[px-u*.76,y],[px+u*.76,y],[floorX+u*.61,floor],[floorX-u*.61,floor]],"#e7dac2");
      if (detail > 0) {
        this.ctx.globalAlpha = opacity*detail;
        for (let i=0;i<7;i++) {
          const q=i/6-.5;
          this.poly([[px+q*u*1.46,y],[px+q*u*1.46+u*.10,y+.03*s],[floorX+q*u*1.19+u*.012,floor],[floorX+q*u*1.19-u*.065,floor]],i%2?"#d6c6ac":"#f4e9d4");
        }
        this.ctx.globalAlpha = opacity;
      }
      this.ellipse(px,y,u*.79,s*.253,"#fff6e5");
      if (detail === 0) continue;
      this.ctx.globalAlpha = opacity*detail;
      this.ellipse(px,y+s*.045,u*.72,s*.219,"#fcf3e1");
      for (const inner of [-1,1]) {
        const [plateX,plateY]=this.project(x+inner*.43,.957,z-.24);
        this.ellipse(plateX,plateY,u*.154,s*.071,"#d6bb91");
        this.ellipse(plateX,plateY,u*.120,s*.049,"#fffdf1");
        this.ellipse(plateX,plateY+s*.008,u*.062,s*.024,seed%3===0?"#c89078":"#8f9d77");
      }
      const [vaseX,vaseY]=this.project(x,1.08,z+.12);
      this.ellipse(vaseX,vaseY,u*.13,s*.18,"#648676");
      this.ellipse(vaseX+u*.016,vaseY-s*.08,u*.107,s*.053,"#a7b6a0");
      if (s>6) this.bouquet(vaseX,vaseY-s*.25,s*.15,seed+Math.sign(x)*11);
      this.ctx.globalAlpha = opacity;
    }
  }

  hallCelebration(x,z,seed) {
    const d = this.depth(1.75,z);
    if (d<.55) return;
    const g = this.ctx;
    const [px,py] = this.project(x,1.75,z);
    const u = this.fx/d;
    const s = this.fy/d;
    if (px+u*1.7<0 || px-u*1.7>this.w || py-s*1.4>this.h) return;
    this.gardenBalloons(x+Math.sign(x)*.52,z+.72,seed);
    this.box(x,z,.52,.45,.04,1.28,["#d5af99","#fff2d7","#aa8070"]);
    this.box(x,z-.064,.72,.57,1.18,1.34,["#f4dfba","#fff7e5","#bca078"]);
    for (const side of [-1,1]) {
      g.beginPath();
      g.ellipse(px+side*u*.19,py,u*.30,s*.38,-side*.25,0,Math.PI*2);
      g.lineWidth = Math.max(1.1,s*.073);
      g.strokeStyle = side>0?"#eab0a6":"#e8be7b";
      g.stroke();
    }
    const [flowersX,flowersY] = this.project(x,1.33,z-.08);
    this.bouquet(flowersX,flowersY,s*.19,seed+6);
  }

  nearVisibility(z) {
    const blend=Math.min(1,Math.max(0,(z+4.8)/1.35));
    return blend*blend*(3-2*blend);
  }

  gardenTree(x,z,seed) {
    const d=this.depth(2.6,z);
    if (d<.8) return;
    const s=this.fy/d;
    const u=this.fx/d;
    const [px,py]=this.project(x,2.8,z);
    if (px+u*2.3<0 || px-u*2.3>this.w || py-s*3.0>this.h) return;
    const [shadeX,shadeY]=this.project(x+.28,.023,z+.50);
    this.ellipse(shadeX,shadeY,u*1.8,s*.39,"#54724e3f");
    const treeHeight=3.55+this.rnd(seed)*.79;
    this.box(x,z,.30,.34,0,treeHeight,["#8d6b47","#b38d5e","#6f5d3e"]);
    const g = this.ctx;
    const opacity = g.globalAlpha;
    const detail = Math.min(1,Math.max(0,(s-(this.renderQuality===2?10:7))/3));
    if (detail < 1) {
      const [topX,topY]=this.project(x,treeHeight-.45,z);
      g.globalAlpha = opacity*(1-detail);
      this.ellipse(topX,topY,u*1.65,s*1.18,"#73ae61");
      g.globalAlpha = opacity;
      if (detail === 0) return;
    }
    g.globalAlpha = opacity*detail;
    const colors=seed%3===0?
      ["#43914f","#69ad58","#88bb5c","#b2d47a"]:
      ["#3f8056","#529f58","#79b860","#a9cd74"];
    for (let i=0;i<8;i++) {
      const lean=(this.rnd(seed*2+i)-.5)*2.75;
      const tier=treeHeight-1.05+this.rnd(seed+i*1.82)*2.03;
      const [tx,ty]=this.project(x+lean,tier,z+(i%3-1)*.52);
      const spread=.72+this.rnd(i+25)*.56;
      this.ellipse(tx,ty,u*spread,s*spread*.67,colors[i%colors.length]);
    }
    if (s>15 && seed%2===0) {
      for(let i=0;i<6;i++) {
        const [tx,ty]=this.project(x+(this.rnd(seed+i+63)-.5)*2.32,treeHeight-.9+this.rnd(seed*i+18)*1.2,z-.38);
        this.ellipse(tx,ty,u*.076,s*.059,i%2?"#e7c59e":"#ffe4c0");
      }
    }
    g.globalAlpha = opacity;
  }

  gardenLamp(x,z) {
    const iron=["#41433f","#707168","#323632"];
    const trim=["#776348","#9c8660","#514331"];
    this.box(x,z-.20,.40,.40,0,.17,iron);
    this.box(x,z-.12,.24,.24,.17,.56,iron);
    this.box(x,z-.07,.14,.14,.56,3.22,iron);
    this.box(x,z-.19,.38,.38,3.22,3.31,trim);
    this.box(x,z-.15,.30,.30,3.29,3.75,["#b0aba0","#dbd1b9","#777b71"]);
    for (const side of [-1,1]) this.box(x+side*.144,z-.16,.045,.045,3.30,3.75,iron);
    this.box(x,z-.23,.46,.46,3.73,3.81,iron);
    this.face([[x-.23,3.81,z-.23],[x+.23,3.81,z-.23],[x,4.00,z]],trim[0]);
    this.box(x,z-.033,.066,.066,3.98,4.10,trim);
  }

  gardenLampPool(x,z,light) {
    const depth=this.depth(.09,z);
    if (depth<2) return;
    const [px,py]=this.project(x*.74,.09,z);
    const width=4.7*this.fx/depth;
    const height=4.5*(this.eye-.09)*this.fy/(depth*depth);
    if (px+width<0 || px-width>this.w || py-height>this.h) return;
    const g=this.ctx;
    g.save();
    g.globalAlpha=light*.9*this.nearVisibility(z)*this.distanceVisibility(z,64,130);
    g.drawImage(this.lampGlow,px-width,py-height,width*2,height*2);
    g.restore();
  }

  gardenLampGlow(x,z,light) {
    const depth=this.depth(3.52,z);
    if (depth<1) return;
    const [px,py]=this.project(x,3.52,z-.17);
    const scale=Math.min(this.h*.17,this.fy/depth);
    const radius=scale*1.56;
    if (px+radius<0 || px-radius>this.w || py+radius<0 || py-radius>this.h) return;
    const g=this.ctx;
    g.save();
    g.globalAlpha=light*this.nearVisibility(z)*this.distanceVisibility(z,84,160);
    g.drawImage(this.lampGlow,px-radius,py-radius,radius*2,radius*2);
    this.ellipse(px,py,scale*.11,scale*.16,"#ffebbb");
    g.restore();
  }

  gardenFlowers(x,z,seed,size=1) {
    const d=this.depth(.14,z);
    if (d<.85) return;
    const s=this.fy/d*size;
    const u=this.fx/d*size;
    const [px,py]=this.project(x,.07,z);
    if (py-s*.85>this.h || px+u*1.48<0 || px-u*1.48>this.w) return;
    if (s<24) {
      this.ctx.drawImage(this.gardenFlowerBeds[((seed%3)+3)%3],px-u*96/76,py-s*65/76,u*192/76,s*100/76);
      return;
    }
    this.paintGardenFlowerBed(x,z,seed,size,s,u,px,py);
  }

  makeGardenFlowerBeds() {
    return [0,1,2].map(seed=>{
      const image=document.createElement("canvas");
      image.width=192;
      image.height=100;
      const painter={ctx:image.getContext("2d"),ellipse:this.ellipse,rnd:this.rnd,
        project(x,y,z) { return [96+x*76,65-(y-.07)*76-z*9]; }};
      this.paintGardenFlowerBed.call(painter,0,0,seed,1,76,76,96,65);
      return image;
    });
  }

  paintGardenFlowerBed(x,z,seed,size,s,u,px,py) {
    this.ellipse(px,py+s*.045,u*1.18,s*.39,"#71684f42");
    this.ellipse(px,py-s*.049,u*1.13,s*.37,"#c4a785");
    this.ellipse(px,py-s*.11,u*1.02,s*.31,"#559953");
    const petals=seed%3===0?["#fff6df","#ee8f7d","#f1c49d"]:["#fff2dd","#ee7d93","#f6cf69"];
    for (let i=0;i<9;i++) {
      const [fx,fy]=this.project(x+(this.rnd(seed+i*.97)-.5)*1.66*size,
        (.17+this.rnd(seed*1.4+i)*.31)*size,z+(this.rnd(i+seed*.13)-.5)*.96*size);
      const radius=s*(.048+this.rnd(i)*.053);
      this.ellipse(fx-u*.049,fy+s*.028,u*.097,s*.043,"#527e56");
      this.ellipse(fx,fy,radius,radius*.76,petals[i%3]);
      this.ellipse(fx,fy,radius*.31,radius*.24,"#d89f6d");
    }
  }

  gardenBalloons(x,z,seed) {
    const d=this.depth(2.66,z);
    if (d<.85) return;
    const [px,py]=this.project(x,2.55,z);
    const s=this.fy/d;
    const u=this.fx/d;
    if (px+u<0 || px-u>this.w || py-s>this.h) return;
    const colors=["#fff4df","#f3a29e","#79c6d9","#f5cf74","#f8cbbd"];
    for (let i=0;i<5;i++) {
      const xOffset=(this.rnd(seed+i*.78)-.5)*1.27;
      const height=2.17+this.rnd(i*2.2+seed)*1.26;
      const [bx,by]=this.project(x+xOffset,height,z+i*.07);
      const [tailX,tailY]=this.project(x+xOffset*.16,.82,z);
      this.line([[bx,by+s*.24],[(bx+tailX)/2+u*.13,(by+tailY)/2],[tailX,tailY]],"#aa9975",Math.max(.65,s*.013));
      this.ellipse(bx,by,s*.183,s*.246,colors[i]);
      this.ellipse(bx-s*.062,by-s*.093,s*.045,s*.065,"#ffffff8c");
    }
    this.box(x,z,.19,.20,.0,.81,["#b59b6b","#fce9bb","#8c7955"]);
  }

  gardenChair(x,z,accent) {
    const trim=["#eee3cc","#fff7e4","#cfbc99"];
    this.box(x,z,.46,.46,.42,.51,trim);
    this.box(x,z+.42,.45,.07,.49,.99,trim);
    this.front(x-.19,x+.19,.62,.74,z+.407,accent);
    for (const side of [-1,1]) {
      this.box(x+side*.179,z+.04,.057,.066,.03,.5,trim);
      this.box(x+side*.179,z+.38,.057,.066,.03,.5,trim);
    }
  }

  gardenPavilion(x,z,seed) {
    const radius=2.2;
    const edgeY=3.02;
    const crown=[x,4.36,z+.06];
    const edging=["#e7dbbb","#fff5e1","#b5a886"];
    const ring=Array.from({length:8},(_,i)=>{
      const angle=i*Math.PI/4;
      return [x+Math.cos(angle)*radius,edgeY,z+Math.sin(angle)*radius];
    });
    this.plane(x-1.91,x+1.91,z-1.77,z+1.84,.025,"#6e7f4a40");
    this.box(x,z-1.66,3.41,3.4,.01,.14,edging);
    for (const [px,,pz] of ring) {
      this.box(px,pz,.112,.112,.13,edgeY,edging);
    }
    if (this.fy/this.depth(edgeY,z)>14) {
      for (const row of [z+1.17,z+.45,z-.31]) {
        for (const ox of [-.81,.81]) this.gardenChair(x+ox,row,"#dca593");
      }
    }
    const panels=ring.map((p,i)=>[p,ring[(i+1)%8]])
      .sort((a,b)=>(b[0][2]+b[1][2])-(a[0][2]+a[1][2]));
    for (const [a,b] of panels) {
      const index=ring.indexOf(a);
      this.face([a,b,crown],index%2?"#fff6e5":"#e5d8b7");
      this.edge(a,crown,"#c3ac81",Math.max(1,this.fy/this.depth(3,z)*.024));
      this.face([a,b,[b[0],b[1]-.14,b[2]],[a[0],a[1]-.14,a[2]]],"#cfac81");
    }
    const depth=this.depth(edgeY,z-radius);
    if (depth>.85 && this.fy/depth>9) {
      const [px,py]=this.project(x,edgeY-.22,z-radius+.13);
      this.bouquet(px,py,this.fy/depth*.21,seed+19);
    }
  }

  gardenReception(x,z,seed,outdoors=true) {
    const [px,py]=this.project(x,.93,z);
    const d=this.depth(.93,z);
    if (d<.8) return;
    const s=this.fy/d, u=this.fx/d;
    this.box(x,z-.66,1.76,1.38,.03,.89,["#eee1c9","#fff5e0","#cebb96"]);
    if (s>12) {
      for (const side of [-1,1]) this.gardenChair(x+side*1.26,z+.32,side<0?"#8cb4b0":"#dba595");
    }
    this.ellipse(px,py,u*.86,s*.29,"#fff7e6");
    const [cakeX,cakeY]=this.project(x,.93,z-.08);
    this.ellipse(cakeX,cakeY,u*.38,s*.095,"#deb982");
    for (const [level,radius] of [[1.06,.31],[1.26,.224],[1.43,.139]]) {
      const [tx,ty]=this.project(x,level,z-.08);
      this.ellipse(tx,ty,u*radius,s*.145,"#ead1b0");
      this.ellipse(tx,ty-s*.062,u*radius,s*.103,"#fff4dc");
      this.ellipse(tx+u*.058,ty-s*.082,u*.064,s*.052,"#e4a0a0");
    }
    if (outdoors && s>12) this.gardenFlowers(x+1.24,z-1.15,seed,.72);
  }

  gardenFountain(x,z) {
    const d=this.depth(.52,z);
    if (d<.8) return;
    const u=this.fx/d, s=this.fy/d;
    const [px,py]=this.project(x,.48,z);
    const [floorX,floorY]=this.project(x,.05,z);
    this.ellipse(floorX,floorY,u*1.65,s*.61,"#697a4b55");
    this.ellipse(px,py+s*.17,u*1.51,s*.60,"#abac8d");
    this.ellipse(px,py,u*1.51,s*.56,"#f0e4c4");
    this.ellipse(px,py-s*.01,u*1.35,s*.48,"#86bdbc");
    this.ellipse(px,py-s*.063,u*1.10,s*.37,"#a8d5cd");
    this.box(x,z,.25,.25,.42,1.65,["#dbd2b4","#fff2d1","#a4ad94"]);
    for (const delta of [-.84,-.42,.42,.84]) {
      const points=[];
      for (let i=0;i<=8;i++) {
        const t=i/8;
        points.push(this.project(x+delta*t,1.66+.78*t-1.86*t*t,z+.21*t));
      }
      this.line(points,"#effff4be",Math.max(1,s*.031));
    }
  }

  gardenBunting(x,z,seed) {
    const span=4.35;
    const height=2.7;
    const colors=["#fcf2d8","#e7aa9f","#b6d4d5","#ecc884"];
    for (const end of [x-span/2,x+span/2]) {
      this.box(end,z,.074,.087,0,height+.10,["#aa9569","#e9d39e","#7d7853"]);
    }
    const cord=t=>[x+span*(t-.5),height-1.57*t*(1-t),z+.20*Math.sin(t*Math.PI)];
    for (let i=0;i<12;i++) {
      const t=i/12;
      this.edge(cord(t),cord((i+1)/12),"#987d56",Math.max(.8,this.fy/Math.max(2,this.depth(height,z))*.019));
      if (i%2===0) {
        const a=cord(t+.019), b=cord(t+.112);
        this.face([a,b,[(a[0]+b[0])/2,(a[1]+b[1])/2-.30,z-.10]],colors[(seed+i/2)%4]);
      }
    }
  }

  lawnBorders(z,seed) {
    for (const side of [-1,1]) {
      const x=side*(21.7+this.rnd(seed*6)*3.5);
      this.plane(x-side*.52,x+side*.52,z-2.9,z+2.9,.023,"#c8b58d");
      this.plane(x-side*.42,x+side*.42,z-2.82,z+2.82,.029,seed%2?"#86a66c":"#82a66f");
      for(const offset of [-2.1,-.30,1.67]) {
        const d=this.depth(.24,z+offset);
        if (d<2.8 || d>74) continue;
        const [px,py]=this.project(x,.24,z+offset);
        if (px< -this.fy/d || px>this.w+this.fy/d) continue;
        this.bouquet(px,py,this.fy/d*.16,seed+side*4+offset*7);
      }
    }
  }

  gardenArchSupports(z,seed) {
    const frame=WeddingScene.archHalfWidth;
    const d=this.depth(4.95,z);
    if (d<.15) return;
    const palettes=["#d4c4a3","#fffae7","#f6ebd5"];
    const spring=WeddingScene.archSpring;
    for (const side of [-1,1]) {
      const x=side*frame;
      this.box(x,z,.31,.33,0,spring+.16,palettes);
      this.box(x,z-.057,.49,.47,.02,.20,palettes);
      this.box(x,z-.043,.44,.43,3.24,3.48,palettes);
      for (let i=0;i<3;i++) {
        const near=x-side*(.072+i*.115);
        const far=near-side*.123;
        this.face([[near,.10,z+.19],[far,.10,z+.19],[far-side*.19,2.03,z+.19],
          [far-side*.40,3.70,z+.24],[near-side*.40,3.70,z+.24]],i%2?"#f4e7d5":"#fff8e6");
      }
    }
    this.archFlowers(z,seed,d,[[-4.51,.46],[4.54,.44]]);
  }

  gardenArch(z,seed) {
    const d=this.depth(4.95,z);
    if (d<.15) return;
    const frame=WeddingScene.archHalfWidth;
    const spring=WeddingScene.archSpring;
    const beam=(i,inner,depth)=>{
      const [cos,sin]=WeddingScene.archCurve[i];
      return [(frame+(inner?-.14:.14))*cos,spring+(inner?1.58:1.88)*sin,z+depth];
    };
    if (this.fy/d<(this.renderQuality===2?36:26)) {
      const band = [];
      for (let i=0;i<=18;i+=2) band.push(beam(i,false,0));
      for (let i=18;i>=0;i-=2) band.push(beam(i,true,0));
      this.face(band,"#fff5de");
      this.archFlowers(z,seed,d,[[-4.27,3.86],[3.64,4.52]]);
      return;
    }
    for (let i=0;i<18;i++) {
      const a=beam(i,false,0), b=beam(i+1,false,0);
      const aInner=beam(i,true,0), bInner=beam(i+1,true,0);
      const aBack=beam(i,false,.32), bBack=beam(i+1,false,.32);
      const aBackInner=beam(i,true,.32), bBackInner=beam(i+1,true,.32);
      this.face([aBack,bBack,bBackInner,aBackInner],"#e8d9ba");
      this.face([aInner,bInner,bBackInner,aBackInner],"#cab690");
      this.face([a,b,bBack,aBack],i%3?"#eadbbb":"#f6ebd5");
      this.face([a,b,bInner,aInner],"#fff5de");
      this.edge(a,b,"#c5ae83",Math.max(.7,this.fy/Math.max(.55,d)*.018));
    }
    this.archFlowers(z,seed,d,[[-4.27,3.86],[3.64,4.52]]);
  }

  archFlowers(z,seed,d,positions) {
    if (d<=.65) return;
    const size=Math.min(this.h*.23,this.fy/d);
    for (const [offset,top] of positions) {
      const [px,py]=this.project(offset,top,z-.10);
      if (px< -size || px>this.w+size || py< -size || py>this.h+size) continue;
      this.bouquet(px,py,size*.192,seed+offset*8);
    }
  }

  gardenDecor(z,seed,occupiedSide) {
    const s=this.fy/Math.max(1,this.depth(1.62,z));
    for (const side of [-1,1]) {
      if (side===occupiedSide) continue;
      this.gardenFlowers(side*5.52,z,seed+side*17);
      if (s>9 && seed%2===0) this.gardenBalloons(side*6.85,z+.22,seed+side*14);
      this.box(side*4.72,z,.092,.092,.06,.96,["#b29760","#fff1ad","#827451"]);
      this.box(side*4.72,z-.035,.19,.18,.83,1.08,["#f9eac3","#fff7dc","#bead82"]);
      if (s>11 && seed%2!==0) this.gardenFlowers(side*(8.1+this.rnd(seed)*.9),z-1.2,seed+74+side,.83);
    }
  }

  guest(prop, garden, time) {
    const { x, z, person, side, message, time:arrival } = prop;
    const seated = person === 0;
    const tableX = x+side*(seated?.27:.96);
    const tableZ = seated ? z-.62 : z+.56;
    const table = () => garden ? this.gardenReception(tableX,tableZ,Math.floor(arrival)) :
      this.hallTable(tableZ,Math.floor(arrival),[tableX]);
    if (!seated) table();
    if (seated) this.gardenChair(x-side*.24,z+.13,"#bf8980");
    const opacity = Math.min(1,Math.max(0,(time-arrival)/.23));
    const {image, outline} = this.guestSprites[person];
    let anchor = null;
    const topY = seated ? 2.74 : 3.15;
    if (opacity > 0 && image.naturalWidth && this.depth(topY,z)>.7) {
      const spriteX = seated ? x-side*.24 : x;
      const [px, top] = this.project(spriteX,topY,z);
      const [, bottom] = this.project(spriteX,seated?.53:0,z);
      const sourceHeight = seated ? 525 : image.naturalHeight;
      const height = bottom-top;
      const width = height*image.naturalWidth/sourceHeight*Math.min(1,this.fx/this.fy*1.40);
      if (px+width/2>0 && px-width/2<this.w && top<this.h && bottom>0) {
        const g = this.ctx;
        g.save();
        g.globalAlpha *= opacity;
        if (!seated) this.ellipse(px,bottom,width*.38,height*.07,"#4c3b2966");
        g.translate(px-width/2,top);
        g.scale(width/image.naturalWidth,height/sourceHeight);
        g.clip(outline);
        g.drawImage(image,0,0,image.naturalWidth,sourceHeight,0,0,image.naturalWidth,sourceHeight);
        g.restore();
        anchor = {x:px, y:top, side, message, opacity, halfWidth:width/2};
      }
    }
    if (seated) table();
    return anchor;
  }

  placeSpeech(label, {x,y,side,opacity,halfWidth,centerAbove=false}) {
    const message = label.textContent;
    let size = this.speechSizes.get(label);
    if (size?.message !== message) {
      size = {message,width:label.offsetWidth,height:label.offsetHeight};
      this.speechSizes.set(label,size);
    }
    const {width,height} = size;
    const edge = 8;
    const gap = halfWidth+6;
    let preferred = side > 0 ? x+gap : x-width-gap;
    if (centerAbove && (preferred<edge || preferred+width>this.w-edge)) preferred = x-width*.5;
    const left = Math.min(this.w-width-edge,Math.max(edge,preferred));
    const beside = left === preferred;
    const minTop = beside ? Math.min(145,this.h*.35) : edge;
    const top = Math.max(minTop,Math.min(this.h-height-edge,y-height-8));
    label.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    label.style.opacity = opacity;
    label.style.setProperty("--speech-tail",`${Math.max(9,Math.min(width-20,x-left-4))}px`);
  }

  truck(entity, z, canJump = false) {
    const x = entity.lane * 2.65;
    const g = this.ctx;
    const brand=entity.brand%WeddingScene.truckStyles.length;
    const paint=WeddingScene.truckStyles[brand];
    const end=z+(entity.length??11.8);
    if (this.depth(.07,end)<.55) return;
    const projectedWidth=2.1*this.fx/Math.max(.55,this.depth(1.18,z));
    const near=projectedWidth>=22;
    const distant=projectedWidth<14;
    if (!distant) this.plane(x-1.19,x+1.19,z-.21,end+.15,.08,"#231c2a65");
    this.plane(x-.98,x+.98,z,end,.083,"#20192669");
    this.box(x,z+.12,1.64,end-z-.18,.37,.67,["#292c36","#454953","#20252f"]);
    if (!distant) {
      for (const side of [-1,1]) {
        for (const axle of [z+.70,z+2.08,end-2.05,end-.89]) {
          this.truckWheel(x,axle,side,near);
        }
        if (near) this.box(x+side*.86,z+1.24,.29,.59,.38,.63,["#5d6774","#85929e","#363f49"]);
      }
    }
    this.truckTrailer(x,z+1.80,end,paint,near,distant);
    this.truckCab(x,z,paint,brand,near,distant);
    if (entity.ramp) this.ramp(x,z,entity.ramp);
    else if (canJump) {
      const [tipX,tipY]=this.project(x,2.91,z);
      const s=Math.min(21,this.fy/(z+6)*.28);
      this.ellipse(tipX,tipY,s*.70,s*.66,"#354c43");
      g.fillStyle="#f1ffd7";
      g.font="900 "+s+"px Arial";
      g.fillText("↑",tipX,tipY);
    }
  }

  truckWheel(x, z, side, near) {
    this.box(x+side*.87,z-.34,.35,.68,.055,.72,["#232735","#3f4654","#1d212e"]);
    const edge=x+side*1.047;
    if (!near || (this.cameraX-edge)*side<=0 || this.depth(.77,z-.38)<.55) return;
    this.sticker([
      this.project(edge,.77,z-.38),this.project(edge,.77,z+.38),
      this.project(edge,.01,z+.38),this.project(edge,.01,z-.38)
    ],this.truckHub);
  }

  makeTruckHub() {
    const image=document.createElement("canvas");
    image.width=image.height=96;
    const painter={ctx:image.getContext("2d"),ellipse:this.ellipse};
    for (const [radius,color] of [[48,"#1a1e28"],[38,"#313945"],[29,"#9ca6ab"],
      [22,"#4b5b67"],[12,"#d2d4c9"]]) {
      painter.ellipse(48,48,radius,radius,color);
    }
    for (let i=0;i<6;i++) {
      const angle=i*Math.PI/3;
      painter.ellipse(48+Math.cos(angle)*19.4,48+Math.sin(angle)*19.4,3,3,"#c8d1d2");
    }
    return {image,start:0,width:image.width};
  }

  truckTrailer(x,start,end,paint,near,distant) {
    const length=end-start;
    this.box(x,start,2.10,length,.72,2.27,[paint.shade,paint.deck,paint.trailer]);
    this.box(x,start+.025,1.93,length-.050,2.20,2.36,[paint.trailer,paint.deck,paint.light]);
    for (const side of [-1,1]) {
      const edge=x+side*1.051;
      const seam=x+side*.91;
      if (!distant) this.face([[edge,2.268,start],[edge,2.268,end],[x+side*.96,2.36,end],[x+side*.96,2.36,start]],paint.light);
      this.plane(seam-.033,seam+.033,start+.07,end-.07,2.365,paint.stripe);
      if (near) this.plane(seam-side*.10-.010,seam-side*.10+.010,start+.11,end-.11,2.365,"#233c4970");
      if (distant || (this.cameraX-edge)*side<=0) continue;
      const point=(at,y)=>[edge,y,start+at];
      const panel=(from,to,bottom,top,color)=>
        this.face([point(from,bottom),point(to,bottom),point(to,top),point(from,top)],color);
      panel(0,length,.72,.91,paint.shade);
      panel(.09,length-.09,.84,.885,"#f4bf79");
      panel(0,length,2.11,2.26,paint.shade);
      panel(.08,length-.08,2.23,2.26,paint.light);
      const diagonal=length*.31;
      this.face([point(.28,1.14),point(diagonal,1.14),point(diagonal+1.62,2.05),point(1.90,2.05)],paint.shade);
      this.face([point(diagonal-.20,1.14),point(diagonal+.08,1.14),
        point(diagonal+1.70,2.05),point(diagonal+1.42,2.05)],paint.stripe);
      this.face([point(diagonal+.23,1.14),point(diagonal+.31,1.14),
        point(diagonal+1.93,2.05),point(diagonal+1.85,2.05)],paint.light);
      if (near) {
        for (let rib=.58;rib<length-.20;rib+=.77) {
          panel(rib,rib+.030,.94,2.09,"#13212d45");
          panel(rib+.030,rib+.067,.94,2.09,"#fff7e534");
        }
        for (const marker of [.33,length*.52,length-.46]) {
          panel(marker,marker+.20,.735,.81,"#ffe198");
        }
      }
    }
    if (!distant) {
      for (let at=start+.63;at<end-.24;at+=near?.68:1.36) {
        this.plane(x-.86,x+.86,at,at+.049,2.367,"#34455037");
        if (near) this.plane(x-.86,x+.86,at+.049,at+.083,2.368,"#fff4de78");
      }
    }
    if (this.cameraDepth-6>=end) {
      this.front(x-1.03,x+1.03,.70,2.28,end,paint.shade);
      for (const side of [-1,1]) {
        const door=x+side*.52;
        this.front(door-.44,door+.44,.80,2.19,end+.006,paint.trailer);
        this.front(door-.044,door+.044,.81,2.18,end+.012,"#adacaf");
        this.front(door-.20,door+.20,.57,.72,end+.018,"#252633");
        this.front(door-.16,door+.16,.61,.68,end+.025,"#f56a5a");
      }
    }
  }

  truckCab(x,z,paint,brand,near,distant) {
    const frontRows=[
      [.53,.92,.08],[1.31,1.04,0],[2.08,.99,paint.rake],
      [2.26,.94,paint.rake+.12],[2.36,.84,paint.rake+.27]
    ];
    const back=1.69;
    const at=([y,w,front],side,rear=false)=>
      [x+side*w,y,z+(rear?back-(y>2.26?.12:0):front)];
    for (const side of [-1,1]) {
      if ((this.cameraX-x)*side<.91) continue;
      for (let i=0;i<frontRows.length-1;i++) {
        const a=frontRows[i], b=frontRows[i+1];
        this.face([at(a,side),at(a,side,true),at(b,side,true),at(b,side)],
          [paint.shade,paint.body,paint.shade,paint.light][i]);
      }
      if (distant) continue;
      const panel=(edge,from,to,low,high,color)=>this.face([
        [edge,low,z+from],[edge,low,z+to],[edge,high,z+to],[edge,high,z+from]
      ],color);
      const edge=x+side*1.025;
      const glass=x+side*1.008;
      this.face([[glass,1.49,z+.29],[glass,1.49,z+1.32],[glass,2.01,z+1.32],
        [glass,2.01,z+.52]],"#142a3b");
      this.face([[glass,1.77,z+.42],[glass,1.77,z+1.24],[glass,1.96,z+1.24],
        [glass,1.96,z+.54]],paint.glass);
      panel(edge,.28,1.35,.735,.99,paint.body);
      panel(edge,.28,1.35,.974,1.015,paint.light);
      if (near) {
        panel(edge,.33,1.35,1.22,1.26,"#dbd0ae");
        panel(edge,1.32,1.36,.77,1.28,"#202937");
        panel(edge,1.10,1.27,1.12,1.17,"#202937");
        panel(edge,.43,.79,.59,.66,"#c1c4c2");
      }
    }
    if (this.eye>=2.36) {
      const roof=frontRows.at(-1);
      this.face([at(roof,-1),at(roof,1),at(roof,1,true),at(roof,-1,true)],paint.light);
      this.plane(x-.55,x+.55,z+paint.rake+.35,z+1.28,2.363,"#fdedc34d");
    }
    if (this.depth(2.36,z)<.55 || z<this.cameraDepth-6) return;
    for (let i=0;i<frontRows.length-1;i++) {
      const a=frontRows[i],b=frontRows[i+1];
      this.face([at(a,-1),at(a,1),at(b,1),at(b,-1)],
        [paint.body,paint.body,paint.shade,paint.light][i]);
    }
    this.face([[x-.91,2.20,z+paint.rake+.055],[x+.91,2.20,z+paint.rake+.055],
      [x+.92,2.24,z+paint.rake+.083],[x-.92,2.24,z+paint.rake+.083]],paint.stripe);
    this.truckFront(x,z,paint,brand,near,distant);
  }

  truckFront(x,z,paint,brand,near,distant) {
    for (let i=0;i<2;i++) {
      const trim=this.truckTrim[brand][i];
      const {half,top,bottom}=trim;
      const depth=y=>z+(i===0?(y-1.31)*paint.rake/.77-.014:-.058);
      this.sticker([
        this.project(x-half,top,depth(top)),this.project(x+half,top,depth(top)),
        this.project(x+half,bottom,depth(bottom)),this.project(x-half,bottom,depth(bottom))
      ],trim);
    }
    if (distant) return;
    for (const side of [-1,1]) {
      const mirror=x+side*1.072;
      this.box(mirror,z+paint.rake+.16,.117,.19,1.58,1.865,["#242d39",paint.light,"#35414c"]);
      if (near) this.front(mirror-.038,mirror+.038,1.64,1.815,z+paint.rake+.154,paint.shade);
    }
  }

  makeTruckTrim(paint,brand) {
    // The glass and lower fascia sit on separate planes because the windscreen leans back.
    const scale=144;
    return [[.95,1.38,2.07,this.paintTruckGlass],[1.025,.39,1.34,this.paintTruckFascia]]
      .map(([half,bottom,top,draw])=>{
        const image=document.createElement("canvas");
        image.width=Math.ceil(half*2*scale);
        image.height=Math.ceil((top-bottom)*scale);
        const painter={
          ctx:image.getContext("2d"), fx:scale, fy:scale, depth:()=>1,
          project(x,y) { return [(x+half)*image.width/(2*half),(top-y)*image.height/(top-bottom)]; },
          poly:this.poly, front:this.front, line:this.line, edge:this.edge, ellipse:this.ellipse,
          face(points,fill) { this.poly(points.map(([x,y])=>this.project(x,y)),fill); }
        };
        draw.call(painter,0,0,paint,brand);
        return {image,start:0,width:image.width,half,bottom,top};
      });
  }

  paintTruckGlass(x,z,paint) {
    const g=this.ctx;
    const pane=(u,y)=>[x+u,y,z+(y-1.31)*paint.rake/.77-.014];
    const windscreen=(bottom,top,wide,narrow,fill)=>this.face([
      pane(-wide,bottom),pane(wide,bottom),pane(narrow,top),pane(-narrow,top)
    ],fill);
    windscreen(1.39,2.06,.935,.85,"#151d2a");
    const glass=g.createLinearGradient(0,this.project(...pane(0,2.04))[1],0,this.project(...pane(0,1.44))[1]);
    glass.addColorStop(0,paint.glass);
    glass.addColorStop(.34,"#487889");
    glass.addColorStop(1,"#203448");
    windscreen(1.445,2.02,.885,.805,glass);
    this.face([pane(-.82,1.49),pane(-.58,1.49),pane(.20,2.02),pane(-.12,2.02)],"#e0f5ec63");
    this.face([pane(.39,1.47),pane(.55,1.47),pane(.79,1.68),pane(.79,1.81)],"#c6e7ed39");
    for (const side of [-1,1]) {
      const wiper=pane(side*.14,1.475);
      this.edge(wiper,pane(side*.78,1.58),"#152332",this.fx*.020);
    }
    windscreen(1.46,2.01,.023,.018,"#243444");
  }

  paintTruckFascia(x,z,paint,brand) {
    const g=this.ctx;
    const span=paint.grille;
    const fascia=(width,bottom,top,offset,color)=>
      this.front(x-width,x+width,bottom,top,z+offset,color);
    fascia(.95,1.27,1.333,-.020,paint.light);
    fascia(.973,.47,.63,-.038,"#282e3b");
    fascia(.928,.49,.523,-.047,"#a4aab0");
    fascia(.38,.40,.495,-.052,"#222934");
    fascia(.19,.422,.484,-.058,"#eee0ba");
    this.face([[x-span+.045,.64,z-.03],[x+span-.045,.64,z-.03],
      [x+span,1.25,z-.03],[x-span,1.25,z-.03]],"#a5afb3");
    fascia(span-.045,.674,1.214,-.041,"#182331");
    const slats=brand===2?4:5;
    for (let i=0;i<slats;i++) {
      const y=.70+i*.076;
      fascia(span-.10,y,y+(brand===2?.032:.020),-.051,i%2?"#53616b":"#77838a");
    }
    if (brand===0) {
      this.face([[x-span+.105,.69,z-.061],[x-span+.16,.69,z-.061],
        [x+span-.105,1.035,z-.061],[x+span-.16,1.035,z-.061]],"#c7d1ce");
    }

    for (const side of [-1,1]) {
      const lamp=(u,y)=>[x+side*u,y,z-.060];
      this.face([lamp(.64,.63),lamp(.982,.66),lamp(1.014,.90),lamp(.65,.87)],"#212734");
      this.face([lamp(.69,.69),lamp(.94,.72),lamp(.97,.849),lamp(.69,.82)],"#e8ebdf");
      const [px,py]=this.project(...lamp(.795,.765));
      this.ellipse(px,py,this.fx*.049,this.fy*.056,"#fff7c7");
      if (brand<2) this.face([lamp(.679,.686),lamp(.946,.712),lamp(.955,.754),
        lamp(.721,.735),lamp(.719,.817),lamp(.682,.809)],"#fcfff5");
      else this.face([lamp(.697,.716),lamp(.953,.735),lamp(.96,.775),lamp(.697,.754)],"#fcfff5");
      this.face([lamp(.85,.61),lamp(.966,.63),lamp(.973,.674),lamp(.858,.655)],"#ffbb57");
    }
    const [px,py]=this.project(x,1.114,z-.07);
    g.font=`900 ${this.fy*.245}px Arial, sans-serif`;
    g.textAlign="center";
    g.textBaseline="middle";
    g.fillStyle="#f5efdb";
    g.fillText(paint.name,px,py,this.fx*(span*1.76));
  }

  ramp(x,z,length,roof=2.36,halfWidth=.94,police=false) {
    const bottom=z-length;
    const top=z-.19;
    if (this.depth(.06,top)<.55) return;
    const height=at => roof*(at-bottom)/(top-bottom);
    const point=(localZ,side,offset=0)=>[x+side,height(localZ)+offset,localZ];
    for (const side of [-1,1]) {
      const edge=side*halfWidth;
      const base=police?0:.06;
      this.face([[x+edge,base,bottom],[x+edge,base,top],point(top,edge),point(bottom,edge)],police?"#354271":"#4d3e47");
    }
    this.face([point(bottom,-halfWidth),point(bottom,halfWidth),point(top,halfWidth),point(top,-halfWidth)],police?"#53628e":"#7e6b70");
    for (const side of [-1,1]) {
      const stripe=side*(halfWidth-.06);
      this.edge(point(bottom,stripe,.01),point(top,stripe,.015),"#ffcf94",Math.max(1,this.fy/Math.max(1,z+6)*.033));
    }
    for (let at=bottom+.68;at<top-.26;at+=.90) {
      if (!police) {
        this.face([point(at-.14,-.84,.009),point(at-.14,.84,.009),
          point(at-.083,.84,.009),point(at-.083,-.84,.009)],"#322b3670");
      }
      this.face([point(at,-.72,.012),point(at+.33,0,.012),point(at,.72,.012),point(at+.17,.72,.012),point(at+.53,0,.012),point(at+.17,-.72,.012)],police?"#ffd78e":"#ffe8ae");
    }
  }

  barrier(entity, z) {
    const x = entity.lane*2.65;
    const high = entity.kind === "ribbon";
    const y = high ? 1.38 : .14;
    const top = high ? entity.top : .71;
    for (const side of [-1,1]) this.box(x+side*.86,z+.12,.14,.38,.02,top+.12,["#b37482","#ffe0ab","#8d4d70"]);
    this.box(x,z,1.85,.34,y,top,["#883c54","#e49fa1","#552c46"]);
    for (let i=0;i<4;i++) {
      const x1 = x-.88+i*.44;
      this.face([[x1+.02,y+.04,z-.03],[x1+.20,y+.04,z-.03],[x1+.39,top-.04,z-.03],[x1+.19,top-.04,z-.03]],"#ffd4aa");
    }
    const g = this.ctx;
    const [px, py] = this.project(x, (top+y)/2, z-.07);
    const depth=this.depth((top+y)/2,z-.07);
    if (depth<.55) return;
    const s = Math.min(this.fx,this.fy)/depth;
    if (s < 13) return;
    this.ellipse(px, py, s*.21, s*.21, "#42263e");
    g.fillStyle = "#fff0ca";
    g.font = "900 " + s*.29 + "px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(high ? "↓" : "↑",px,py);
  }

  exit(z, time, garden) {
    const g=this.ctx;
    const opacity=this.nearVisibility(z);
    if (opacity<=0) return;
    const width=1.25;
    const openingHeight=3.72;
    const frameDepth=z-.03;
    const top=9.25;
    const center=(time-86.7)/2.85;
    const angle=Math.min(1,Math.max(0,center))*Math.PI*.47;
    const opening=[
      this.project(-width,0,z),this.project(width,0,z),
      this.project(width,openingHeight,z),this.project(-width,openingHeight,z)
    ];
    g.save();
    g.globalAlpha*=opacity;
    if (!garden && angle>.03) {
      g.save();
      g.beginPath();
      opening.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
      g.closePath();
      g.clip();
      this.backdrop(true);
      this.plane(-2.5,2.5,z,z+70,0,"#9a846b");
      this.plane(-.054,.054,z,z+70,.015,"#edd1a0");
      for (const x of [-2.1,2.1]) {
        const [px,py]=this.project(x,1.24,z+5.5);
        const s=this.fy/(z+11.5);
        this.ellipse(px,py,s*.67,s*1.02,"#60775f");
        this.ellipse(px-s*.13,py-s*.33,s*.43,s*.59,"#82947a");
      }
      this.arch(0,z+14,5.7,4.9,["#ac9480","#f3dfbc","#fff1cc"],true);
      g.restore();
    }
    const wall="#ded3bb";
    this.front(-7.68,-width,0,top,z,wall);
    this.front(width,7.68,0,top,z,wall);
    this.front(-width,width,openingHeight,top,z,wall);
    for (const side of [-1,1]) {
      const left=side<0?-7.68:width;
      const right=side<0?-width:7.68;
      this.front(left,right,0,.35,frameDepth,"#aca28c");
      this.front(left,right,3.43,3.50,frameDepth,"#b9a98b");
      this.front(left,right,3.50,3.60,frameDepth,"#f8edcf");
      for (const offset of [2.04,3.80,5.56]) {
        const px=side*offset;
        this.front(px-.78,px+.78,.55,3.16,frameDepth,"#bfae90");
        this.front(px-.71,px+.71,.62,3.10,frameDepth-.005,"#f1e8d4");
        this.front(px-.59,px+.59,.77,2.96,frameDepth-.01,side<0?"#c0c7ab":"#d9c4a5");
      }
      const j=side*(width+.10);
      this.front(j-.10,j+.10,0,openingHeight+.20,frameDepth-.055,"#86704e");
      this.front(j-.065,j+.065,0,openingHeight+.20,frameDepth-.07,"#f5dfaf");

      const leafPoint=(ratio,y)=>this.project(
        side*(width-width*ratio*Math.cos(angle)),y,z+width*ratio*Math.sin(angle)
      );
      this.poly([leafPoint(0,0),leafPoint(1,0),leafPoint(1,openingHeight),leafPoint(0,openingHeight)],"#8e7857");
      this.poly([leafPoint(.045,.09),leafPoint(.96,.09),leafPoint(.96,openingHeight-.10),leafPoint(.045,openingHeight-.10)],"#a1845c");
      for (const [from,to] of [[.24,1.62],[1.89,3.49]]) {
        this.poly([leafPoint(.135,from),leafPoint(.88,from),leafPoint(.88,to),leafPoint(.135,to)],"#6a7058");
        this.poly([leafPoint(.19,from+.065),leafPoint(.82,from+.065),leafPoint(.82,to-.065),leafPoint(.19,to-.065)],"#879275");
      }
      const [handleX,handleY]=leafPoint(.85,1.77);
      const size=this.fy/Math.max(1,z+6.4);
      this.ellipse(handleX,handleY,size*.047,size*.038,"#ffe3a6");
    }
    this.front(-1.48,1.48,openingHeight,openingHeight+.22,frameDepth-.08,"#f5dfaf");
    this.front(-1.24,1.24,4.18,4.92,frameDepth-.10,"#786347");
    this.front(-1.17,1.17,4.24,4.86,frameDepth-.13,"#375b4d");
    const [px,py]=this.project(0,4.56,frameDepth-.16);
    const scale=Math.min(this.fx,this.fy)/Math.max(2,z+5.3);
    g.textAlign="center";
    g.textBaseline="middle";
    g.font="900 "+Math.max(6,scale*.39)+"px Arial";
    g.fillStyle="#fff6d9";
    g.fillText("ВЫХОД",px,py,scale*2.01);
    g.restore();
  }

  makeNote() {
    const canvas=document.createElement("canvas");
    canvas.width=314;
    canvas.height=138;
    const g=canvas.getContext("2d");
    const paper=g.createLinearGradient(0,0,314,120);
    paper.addColorStop(0,"#ffd5a1");
    paper.addColorStop(.25,"#eaa076");
    paper.addColorStop(.69,"#f0ac82");
    paper.addColorStop(1,"#ffdfb0");
    g.fillStyle=paper;
    g.fillRect(0,0,314,138);
    g.strokeStyle="#963c37";
    g.lineWidth=2;
    g.strokeRect(4,4,306,130);
    g.lineWidth=1;
    g.strokeRect(9,9,296,120);
    for (let i=0;i<11;i++) {
      g.beginPath();
      for (let x=12;x<302;x+=2) {
        const y=16+i*10+Math.sin(x*.058+i*.37)*2.2+Math.sin(x*.17)*1.2;
        if (x===12) g.moveTo(x,y);
        else g.lineTo(x,y);
      }
      g.strokeStyle=i%2?"#9c454055":"#fff2c476";
      g.stroke();
    }
    g.fillStyle="#a84c46";
    g.fillRect(30,10,16,118);
    g.fillStyle="#f6c594";
    for (let i=0;i<7;i++) {
      const y=18+i*16;
      g.beginPath();
      g.moveTo(38,y-5);
      g.lineTo(43,y);
      g.lineTo(38,y+5);
      g.lineTo(33,y);
      g.fill();
    }

    // The Amur embankment and monument are drawn as a simplified engraving.
    g.fillStyle="#b65f4e";
    g.beginPath();
    g.moveTo(97,83);
    g.bezierCurveTo(130,81,146,62,173,73);
    g.bezierCurveTo(199,79,218,64,264,75);
    g.lineTo(265,99);
    g.lineTo(97,100);
    g.fill();
    g.strokeStyle="#f8bc90";
    for (let y=80;y<102;y+=4) {
      g.beginPath();
      g.moveTo(96,y+4);
      g.bezierCurveTo(147,y-6,209,y+7,264,y);
      g.stroke();
    }
    g.fillStyle="#793e3c";
    g.beginPath();
    [[164,102],[171,94],[181,94],[186,67],[184,64],[191,61],
      [190,47],[192,39],[193,29],[199,27],[202,33],[201,40],[205,49],
      [214,54],[213,59],[203,55],[202,70],[204,83],[205,94],
      [216,95],[220,102]].forEach(([x,y],i) => i?g.lineTo(x,y):g.moveTo(x,y));
    g.fill();
    g.fillStyle="#a04043";
    g.beginPath();
    g.moveTo(255,23);
    g.lineTo(274,23);
    g.lineTo(273,35);
    g.quadraticCurveTo(271,43,264.5,46);
    g.quadraticCurveTo(257,43,256,36);
    g.fill();
    g.fillStyle="#ffe3b7";
    g.font="bold 13px Georgia";
    g.fillText("Х",260,37);
    g.fillStyle="#853632";
    g.font="bold 13px Arial";
    g.fillText("БАНК РОССИИ",55,26);
    g.font="bold 54px Georgia";
    g.strokeStyle="#ffdcaa";
    g.lineWidth=4;
    g.strokeText("5000",52,78);
    g.fillText("5000",52,78);
    g.font="bold 12px Arial";
    g.fillText("ПЯТЬ ТЫСЯЧ РУБЛЕЙ",52,117);
    g.font="bold 10px Arial";
    g.fillText("ХАБАРОВСК",185,117);
    g.font="bold 20px Georgia";
    g.fillText("5000",248,112);
    return canvas;
  }

  makeGlowingNote() {
    const note = this.makeNote();
    const padding = 18;
    const image = document.createElement("canvas");
    image.width = note.width+2*padding;
    image.height = note.height+2*padding;
    const g = image.getContext("2d");
    g.shadowColor = "#ffc084b0";
    g.shadowBlur = 14;
    g.drawImage(note,padding,padding);
    return {image,scaleX:image.width/note.width,scaleY:image.height/note.height};
  }

  makePickupSprites() {
    return Object.fromEntries(["bottle","hood","boots","magnet","multiplier2","multiplier5"].map(kind=>{
      const image=document.createElement("canvas");
      image.width=96;
      image.height=112;
      const painter={ctx:image.getContext("2d"),poly:this.poly,sticker:this.sticker,
        project(x,y,z) { return [48+64*x/(1+z*.18),56-64*y/(1+z*.18)]; }};
      const multiplier=kind.startsWith("multiplier");
      const scale=multiplier?1.30:kind==="magnet"?1.37:.92;
      WeddingModels.items[kind].render(painter,0,0,0,multiplier?0:.22,scale);
      return [kind,image];
    }));
  }

  pickup(entity,z,time) {
    const g=this.ctx;
    const money=["note","air","roof"].includes(entity.kind);
    const x=entity.lane*2.65;
    const wave=time*5+(entity.t%8)*.6;
    const y=entity.y+Math.sin(wave)*.105;
    const depth=this.depth(y,z);
    if (depth<.55) return;
    const [px,py]=this.project(x,y,z);
    const s=this.fy/depth;
    const w=Math.min(this.fx/depth,s);
    if (py+s*.62<0 || py-s*.62>this.h || px+w<0 || px-w>this.w) return;
    if (money) {
      const scale=.58+Math.abs(Math.cos(wave*.86))*.42;
      g.save();
      g.translate(px,py);
      g.rotate(Math.sin(wave*.7)*.17);
      const width=w*1.32*scale*this.note.scaleX;
      const height=s*.56*this.note.scaleY;
      g.drawImage(this.note.image,-width/2,-height/2,width,height);
      g.restore();
      return;
    }
    const multiplier = entity.kind === "multiplier";
    const color = multiplier ? (entity.factor===5?"#bacfff":"#ffd17d") :
      {bottle:"#ffae6a",hood:"#afaccf",boots:"#b3df9e",magnet:"#ace8ee",leaf:"#d3ed9c",sausage:"#ffd99c"}[entity.kind];
    const [baseX,baseY]=this.project(x,y-.47,z);
    this.ellipse(baseX,baseY,w*.45,s*.11,"#342638a6");
    const pulse=.74+.10*Math.sin(wave);
    g.save();
    g.globalAlpha*=pulse;
    g.strokeStyle=color;
    g.lineWidth=Math.max(1,s*.024);
    g.beginPath();
    g.ellipse(baseX,baseY,w*.45,s*.115,0,0,2*Math.PI);
    g.stroke();
    g.restore();
    if (s>6) {
      g.save();
      g.globalAlpha *= Math.min(1,(s-6)/5);
      const key=multiplier?`multiplier${entity.factor}`:entity.kind;
      const sprite=w<16?this.pickupSprites[key]:null;
      if (sprite) {
        g.drawImage(sprite,px-w*.75,py-s*.875,w*1.5,s*1.75);
        if (!multiplier) {
          g.restore();
          return;
        }
      }
      if (multiplier) {
        const yaw = sprite?0:Math.sin(wave*.43)*.23;
        const scale = 1.30;
        if (!sprite) WeddingModels.items[key].render(this,x,y,z,yaw,scale);
        const [labelX,labelY] = this.project(x-Math.sin(yaw)*.27*scale,y,z-Math.cos(yaw)*.27*scale);
        const font = Math.max(9,Math.min(w*.76,s*.52));
        g.font = `900 ${font}px system-ui, sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.lineJoin = "round";
        g.lineWidth = Math.max(1,font*.13);
        g.strokeStyle = "#342536";
        g.fillStyle = "#fff4d1";
        const label = `×${entity.factor}`;
        g.strokeText(label,labelX,labelY, w*1.01);
        g.fillText(label,labelX,labelY, w*1.01);
      } else if (entity.kind === "leaf") {
        const tex = WeddingModels.icons.leaf;
        g.translate(px,py);
        g.rotate(Math.sin(wave*.68)*.18);
        const width=w*(1.33+.17*Math.cos(wave*.57));
        g.drawImage(tex,-width/2,-s*.70,width,s*1.40);
      } else if (entity.kind === "sausage") {
        g.translate(px,py);
        g.rotate(.12*Math.sin(wave)-.20);
        g.drawImage(this.sausage,-w*.66,-s*.30,w*1.32,s*.60);
      } else if (entity.kind === "magnet") {
        WeddingModels.items.magnet.render(this,x,y,z,Math.sin(wave*.64)*.69,1.37,.14*Math.sin(wave));
      } else {
        WeddingModels.items[entity.kind].render(this,x,y,z,time*2.15+entity.t,.92,Math.sin(wave*.55)*.15);
      }
      g.restore();
    }
  }

  gaitMesh(time,rate,cache,build) {
    const frames=48;
    const cycle=2*Math.PI/rate;
    const step=Math.round(time*frames/cycle);
    const frame=((step%frames)+frames)%frames;
    return cache[frame] ??= build(frame*cycle/frames);
  }

  character(type,x,y,z,floor,state,time,menu) {
    const scale=this.fy/(z+6-this.cameraDepth);
    const [px,py]=this.project(x,floor+.035,z);
    const runner=type==="runner";
    const kuzy=type==="kuzy";
    const bride=type==="bride";
    const modelScale=bride?WeddingScene.brideScale:runner?1:1.02;
    this.ellipse(px,py,scale*(runner?.37:bride?.68*1.8:.68),scale*.125,"#33281980");
    if (runner && !menu && state.flying) {
      for (let i=0;i<17;i++) {
        const phase=(i/17+time*1.38)%1;
        const [tx,ty]=this.project(x+(this.rnd(i)-.5)*phase*.68,y+.25-phase*.28,z-.62-phase*1.14);
        this.ellipse(tx,ty,scale*(.04+.095*phase)*(1-phase),scale*.14*(1-phase),["#ffecb2","#f9b469","#ed8960"][i%3]);
      }
    }
    if (runner && state.slide>.20 && y<floor+.18) {
      for (let i=0;i<9;i++) {
        const phase=(i/9+time*2.4)%1;
        const [dx,dy]=this.project(x+(this.rnd(i+21)-.5)*(.46+phase*.44),floor+.068+phase*.22,z-.18-phase*.81);
        this.ellipse(dx,dy,scale*(.017+phase*.042),scale*.021*(1-phase),i%2?"#f4d3a374":"#fff0c662");
      }
    }
    const yaw=kuzy ? .45+Math.sin(time*6)*.17+.34*state.brideLean : menu?(runner?2.62:3.45):Math.sin(time*6)*.045+
      (runner?.27*state.runnerLean+.34*state.slide+state.mount*(.28+.08*Math.sin(time*3.6)):.20*state.brideLean);
    const toss=runner && !menu ? state.magnetThrow : null;
    const throwAge=toss ? state.t-toss.time : Infinity;
    const pose={airborne:!state.grounded&&!menu,shield:state.shield,slide:state.slide,mount:state.mount,
      lean:state.runnerLean,jump:state.jump,landing:state.landing,magnetHeld:state.magnetHeld&&!menu,throwAge};
    let mesh;
    if (runner) {
      const ordinaryGait=!pose.airborne && !pose.shield && !pose.slide && !pose.mount &&
        !pose.lean && !pose.jump && !pose.landing && !pose.magnetHeld && !toss;
      mesh=ordinaryGait ? this.gaitMesh(time,15,this.runnerGait,WeddingModels.runner) : WeddingModels.runner(time,pose);
    } else if (kuzy) {
      mesh=WeddingModels.runner(state.brideStride,{kuzy:true,lean:state.brideLean});
    } else {
      mesh=this.gaitMesh((menu?time:state.brideStride)+.16,13.4,this.brideGait,WeddingModels.bride);
    }
    const tilt=runner?.10*state.slide+.095*state.mount*Math.sin(time*5):-.085*state.brideLean;
    mesh.render(this,x,y,z,yaw,modelScale,tilt);
    if (toss && !toss.origin && mesh.magnetGrip) {
      const [gx,gy,gz]=WeddingModels.poseTransform(yaw,1,tilt)(mesh.magnetGrip);
      toss.origin={x:x+gx,y:y+gy,z:z+gz,side:x>.8?-1:1,yaw,tilt};
    }
  }

  tossedMagnet(state) {
    const toss=state.magnetThrow;
    if (!toss?.origin) return;
    const g=this.ctx;
    const age=state.t-toss.time;
    const {x,y,z,side,yaw,tilt}=toss.origin;
    const lateral=x+side*(1.8*age+.45*age*age);
    const height=Math.max(.18,y+1.7*age-3.1*age*age);
    const depth=z+(toss.pace-1.05)*age-(state.distance-toss.distance);
    if (age<.94) {
      g.globalAlpha=Math.min(1,(.94-age)/.48);
      WeddingModels.items.magnet.render(this,lateral,height,depth,yaw+age*7,.63*(1-age*.34),tilt+side*age*8.4);
    }
    if (age>.42) {
      const phase=(age-.42)/.82;
      for (let i=0;i<14;i++) {
        const angle=i*2.4;
        const radius=phase*(.24+this.rnd(i+489)*.64);
        const [px,py]=this.project(lateral+Math.cos(angle)*radius,height+Math.sin(angle)*radius+.40*phase,
          depth+(this.rnd(i+652)-.5)*radius);
        const size=(.026+phase*.063)*this.fy/this.depth(height,depth);
        g.globalAlpha=Math.sin(phase*Math.PI)*(.58+this.rnd(i+719)*.32);
        this.ellipse(px,py,size*1.2,size,["#fff0d7","#b0e7f3","#f8b7c3"][i%3]);
      }
    }
    g.globalAlpha=1;
  }

  framePortraitBride(x,z,retreat) {
    const margin=Math.max(8,this.w*.025);
    // The dress hem is the closest part of the animated model to the bottom edge.
    const hemY=-.11;
    const hemZ=-.68;
    const bottom=this.h-margin-retreat;
    const minDepth=(this.eye-hemY)*this.fy/(bottom-this.horizon);
    z=Math.max(z,minDepth-this.depth(hemY,hemZ));

    const skirtHalfWidth=1.49;
    const unitsPerPixel=this.depth(.31,z-.64)/this.fx;
    const left=this.cameraX+(margin-this.cx)*unitsPerPixel+skirtHalfWidth;
    const right=this.cameraX+(this.w-margin-this.cx)*unitsPerPixel-skirtHalfWidth;
    return {x:Math.max(left,Math.min(right,x)),z};
  }

  makeHeavenCloud() {
    const image=document.createElement("canvas");
    image.width=384;
    image.height=160;
    const g=image.getContext("2d");
    for (const [x,y,rx,ry] of [[83,105,78,40],[278,110,101,37],[133,70,83,59],
      [206,81,106,67],[275,88,74,48],[187,118,170,33]]) {
      const light=g.createLinearGradient(0,y-ry,0,y+ry);
      light.addColorStop(0,"#fff7e6");
      light.addColorStop(.62,"#f4def2");
      light.addColorStop(1,"#c5aad855");
      g.fillStyle=light;
      g.beginPath();
      g.ellipse(x,y,rx,ry,0,0,Math.PI*2);
      g.fill();
    }
    return image;
  }

  makeHeavenPortrait(photo) {
    const image=document.createElement("canvas");
    image.width=photo.naturalWidth;
    image.height=photo.naturalHeight;
    const {width,height}=image;
    const g=image.getContext("2d");
    g.drawImage(photo,0,0);
    const pixels=g.getImageData(0,0,width,height);
    const {data}=pixels;
    const luma=new Float32Array(width*height);
    for (let i=0;i<luma.length;i++) {
      const channel=i*4;
      luma[i]=.2126*data[channel]+.7152*data[channel+1]+.0722*data[channel+2];
    }
    for (let y=0;y<height;y++) {
      for (let x=0;x<width;x++) {
        const i=y*width+x;
        const base=luma[i];
        const interior=x>0 && x<width-1 && y>0 && y<height-1;
        const nearby=interior ? (luma[i-1]+luma[i+1]+luma[i-width]+luma[i+width])*.25 : base;
        const light=(base-128)*1.10+128+(base-nearby)*.55;
        const channel=i*4;
        data[channel]=light*.80+16;
        data[channel+1]=light*.88+26;
        data[channel+2]=light*.94+56;
      }
    }
    g.putImageData(pixels,0,0);
    g.globalCompositeOperation="destination-in";
    const fade=g.createLinearGradient(0,0,0,height);
    fade.addColorStop(0,"white");
    fade.addColorStop(.54,"white");
    fade.addColorStop(.77,"#ffffff7a");
    fade.addColorStop(1,"transparent");
    g.fillStyle=fade;
    g.fillRect(0,0,width,height);
    return image;
  }

  makeSausage() {
    const image=document.createElement("canvas");
    image.width=152;
    image.height=72;
    const painter={ctx:image.getContext("2d"),poly:this.poly,
      project(x,y,z) { return [76+127*x/(1+z*.25),36-110*(y-z*.24)/(1+z*.25)]; }};
    WeddingModels.items.sausage.render(painter,0,0,0,.23,1);
    return image;
  }

  heavenSky(distance) {
    const {ctx:g,w,h,horizon}=this;
    const sky=g.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,"#5f63b7");
    sky.addColorStop(.31,"#a493d9");
    sky.addColorStop(.54,"#eab1c3");
    sky.addColorStop(1,"#a685c8");
    g.fillStyle=sky;
    g.fillRect(0,0,w,h);
    const portrait=this.heavenPortrait;
    if (portrait) {
      const width=Math.max(w*1.06,h*.68);
      const height=Math.max(h*.54,width*portrait.height/portrait.width);
      const x=(w-width)*.5-this.cameraX*5;
      const y=Math.min(0,horizon*.64-height*.365);
      g.globalAlpha=.71;
      g.drawImage(portrait,x,y,width,height);
      g.globalAlpha=1;
    }
    for (let i=0;i<17;i++) {
      const x=w*this.rnd(i+275)-this.cameraX*2;
      const y=h*this.rnd(i+305)*.31;
      const r=this.rnd(i+351)*1.6+.4;
      this.ellipse(x,y,r,r,"#fff4dfb0");
    }
    for (const side of [-1,1]) {
      for (let i=0;i<3;i++) {
        const width=Math.max(h*.24,w*(.24+i*.075));
        const x=w*(.5+side*(.44-i*.124))-this.cameraX*(4+i*2);
        const y=h*(-.085+i*.072)+Math.sin(distance*.015+i+side)*h*.012;
        g.globalAlpha=.25+i*.085;
        g.drawImage(this.heavenCloud,x-width/2,y,width,width*.28);
      }
      for (let i=0;i<2;i++) {
        const width=Math.max(h*.39,w*(.52-i*.14));
        const x=w*(side<0 ? .035+i*.08 : .965-i*.08)-this.cameraX*(9-i*3);
        const y=h*(.74+i*.13)+Math.sin(distance*.027+i+side)*h*.024;
        g.globalAlpha=.77-i*.12;
        g.drawImage(this.heavenCloud,x-width/2,y,width,width*.38);
      }
    }
    for (let i=0;i<9;i++) {
      const x=w*(i/8)+(this.rnd(i+79)-.5)*w*.17-this.cameraX*3;
      const y=horizon+h*(this.rnd(i+83)*.25-.065);
      const width=w*(.18+this.rnd(i+75)*.28);
      g.globalAlpha=.42+this.rnd(i+97)*.20;
      g.drawImage(this.heavenCloud,x-width/2,y,width,width*.32);
    }
    const first=Math.floor(distance/18);
    for (let i=first+9;i>=first;i--) {
      for (const side of [-1,1]) {
        const z=i*18-distance+10+this.rnd(i+side*89)*12;
        const d=this.depth(-1,z);
        if (d<2) continue;
        const x=side*(6.8+this.rnd(i+side*37)*15);
        const y=-1.7+this.rnd(i+side*41)*2.60;
        const [px,py]=this.project(x,y,z);
        const width=Math.min(w*.84,(6+this.rnd(i+48)*9)*this.fx/d);
        if (px+width/2<0 || px-width/2>w || py>h) continue;
        g.globalAlpha=.84;
        g.drawImage(this.heavenCloud,px-width/2,py,width,width*.38);
      }
    }
    g.globalAlpha=1;
  }

  heavenRoad(distance) {
    const near=this.cameraDepth-6.6, far=2048;
    for (const x of [-2.65,0,2.65]) {
      this.plane(x-1.19,x+1.19,near,far,-.12,"#806897");
      this.plane(x-1.13,x+1.13,near,far,0,"#5e527e");
      this.plane(x-.71,x+.71,near,far,.018,x===0?"#7b6389":"#70618f");
      for (const side of [-1,1]) {
        const edge=x+side*1.074;
        this.plane(edge-.034,edge+.034,near,far,.038,"#ffdfad");
        this.plane(edge+side*.047,edge+side*.083,near,far,.034,"#c48ea9");
      }
    }
    const spacing=2.35;
    for (let at=Math.floor((distance+83)/spacing)*spacing;at>distance+near;at-=spacing) {
      const z=at-distance;
      this.ctx.globalAlpha=this.distanceVisibility(z,49,83);
      for (const x of [-2.65,0,2.65]) this.plane(x-.98,x+.98,z,z+.085,.043,"#f4d3c755");
    }
    this.ctx.globalAlpha=1;
  }

  policeLights(x,z,base,time,span=.28) {
    this.box(x,z,span*2+.29,.25,base,base+.108,["#54526e","#9196b0","#686783"]);
    for (const side of [-1,1]) {
      const bell=x+side*span;
      const glowing=(Math.floor(time*7+z*.06)+Number(side>0))%2===0;
      const color=side<0 ? glowing?"#ff575d":"#983956" : glowing?"#66caff":"#5360a6";
      this.box(bell,z-.008,.275,.237,base+.045,base+.134,[color,color,color]);
      if (glowing) {
        const [px,py]=this.project(bell,base+.10,z);
        const size=this.fy/Math.max(.65,this.depth(base,z));
        this.ellipse(px,py,size*.32,size*.21,side<0?"#ff6b8067":"#66caff6b");
      }
    }
  }

  policeWheels(x,z,radius,halfWidth,axles) {
    for (const side of [-1,1]) {
      for (const axle of axles) {
        const d=this.depth(radius,z+axle);
        if (d<1) continue;
        const [px,py]=this.project(x+side*(halfWidth-radius*.63),radius,z+axle);
        const wheelX=this.fx/d*radius, wheelY=this.fy/d*radius;
        this.ellipse(px,py,wheelX*.63,wheelY,"#28243a");
        this.ellipse(px,py,wheelX*.31,wheelY*.54,"#737e98");
        this.ellipse(px,py,wheelX*.14,wheelY*.27,"#b6bcd1");
      }
    }
  }

  policeLabel(label,x,y,z,width) {
    const d=this.depth(y,z);
    if (d<=2 || d>=45) return;
    const [px,py]=this.project(x,y,z);
    const g=this.ctx;
    g.font=`900 ${Math.max(6,this.fy/d*.105)}px system-ui, sans-serif`;
    g.textAlign="center";
    g.textBaseline="middle";
    g.fillStyle="#f0f7ff";
    g.fillText(label,px,py,width*this.fx/d);
  }

  police(entity,z,time) {
    const {length,height,halfWidth:r,brand}=entity;
    const x=entity.lane*2.65;
    if (brand === "bus") {
      this.policeBus(entity,x,z,time);
      return;
    }
    if (this.depth(.1,z+length)<.55) return;
    const palette={
      skoda:{name:"ŠKODA",body:"#e4eaf2",top:"#f2eff7",stripe:"#3d70ab",hood:.54,
        dash:1.15,back:3.40,span:.52,taper:.19,skirt:.17,wheel:.27},
      haval:{name:"HAVAL",body:"#dbe2ef",top:"#f6eeec",stripe:"#455fa3",hood:.86,
        dash:1.00,back:4.18,span:.57,taper:.14,skirt:.23,wheel:.34},
      jeep:{name:"JEEP",body:"#b8cbd6",top:"#cadddf",stripe:"#4c64a5",hood:1.04,
        dash:1.09,back:3.82,span:.25,taper:.12,skirt:.35,wheel:.40}
    }[brand];
    const {hood,dash,back,skirt,taper,stripe}=palette;
    const roof=height-.135;
    this.plane(x-r-.08,x+r+.08,z-.1,z+length+.09,.052,"#201a405d");
    this.policeWheels(x,z,palette.wheel,r,[.78,length-.77]);
    const width=2*r;
    this.box(x,z,width,length,skirt,hood,[palette.body,palette.top,"#96a4bd"]);
    this.box(x,z+.018,width,length-.04,hood*.56,hood*.75,[stripe,stripe,stripe]);
    const span=palette.span, wide=r-.095, narrow=r-taper;
    const front=[[x-wide,hood,z+dash],[x+wide,hood,z+dash],
      [x+narrow,roof,z+dash+span],[x-narrow,roof,z+dash+span]];
    const rear=[[x-wide,hood,z+back],[x+wide,hood,z+back],
      [x+narrow,roof,z+back-span*.56],[x-narrow,roof,z+back-span*.56]];
    this.face(rear,"#4c607d");
    this.face([front[0],rear[0],rear[3],front[3]],"#4c5f82");
    this.face([front[1],rear[1],rear[2],front[2]],"#617491");
    this.face([front[2],rear[2],rear[3],front[3]],palette.top);
    this.face(front,"#2d3d5b");
    this.face([front[3],front[2],[x+narrow*.78,roof-.11,z+dash+span*.78],
      [x-narrow*.83,roof-.11,z+dash+span*.78]],"#6b809e");
    this.edge(front[0],front[3],palette.body,1.4);
    this.edge(front[1],front[2],palette.body,1.4);
    for (const side of [-1,1]) {
      const a=side<0 ? 0 : 1, b=side<0 ? 3 : 2;
      const blend=(start,end,f)=>start.map((v,i)=>v+(end[i]-v)*f);
      if (brand!=="skoda") this.edge(blend(front[a],rear[a],.49),blend(front[b],rear[b],.47),palette.body,1.4);
    }
    this.front(x-r*.88,x+r*.88,skirt,skirt+.11,z-.015,"#353748");
    const grille=brand==="haval" ? r*.57 : r*.46;
    this.front(x-grille,x+grille,skirt+.13,hood-.10,z-.02,"#353e53");
    if (brand==="jeep") {
      for (let i=-3;i<=3;i++) {
        const slat=x+i*.113;
        this.front(slat-.025,slat+.025,skirt+.17,hood-.12,z-.025,"#a0b3c7");
      }
    } else if (brand==="haval") {
      for (let i=0;i<3;i++) {
        const y=skirt+.16+i*.105;
        this.front(x-grille*.84,x+grille*.84,y,y+.018,z-.026,"#899bb1");
      }
    }
    for (const side of [-1,1]) {
      const head=x+side*r*.72;
      if (brand==="jeep") {
        const y=hood-.20;
        this.face(Array.from({length:8},(_,i)=>[head+.135*Math.cos(i*Math.PI/4),
          y+.135*Math.sin(i*Math.PI/4),z-.026]),"#ffe7b4");
      } else {
        const bottom=hood-(brand==="skoda"?.115:.147);
        this.face([[head-.17,bottom+.018,z-.026],[head+.17,bottom-.014,z-.026],
          [head+.17,hood-.028,z-.026],[head-.17,hood-.028,z-.026]],"#fff0d0");
      }
    }
    this.policeLights(x,z+dash+span+.32,roof,time);
    this.policeLabel(palette.name,x,skirt+.105,z-.036,1.30);
  }

  policeBus(entity,x,z,time) {
    const {length,ramp,halfWidth:r,height}=entity;
    if (this.depth(.1,z+length)<.55) return;
    const width=2*r;
    const start=z-.19;
    const bodyLength=length+.19;
    this.plane(x-r-.08,x+r+.08,z-ramp,z+length,.052,"#201a405d");
    this.policeWheels(x,z,.40,r,[1.14,length-2.42,length-1.26]);
    this.box(x,start,width,bodyLength,.31,height,["#d4ddec","#adbdd6","#8d9abb"]);
    this.box(x,start+.012,width,bodyLength-.024,.75,1.04,["#435b9b","#455c9b","#405691"]);
    for (const side of [-1,1]) {
      for (let i=0;i<6;i++) {
        const a=z+.52+i*1.77, end=a+1.43, edge=x+side*(r+.005);
        this.face([[edge,1.23,a],[edge,1.23,end],[edge,2.12,end],[edge,2.12,a]],
          i%2?"#536988":"#435674");
        this.edge([edge,2.115,a],[edge,2.115,end],"#8c9eb7",1.5);
      }
    }
    this.front(x-r*.83,x+r*.83,1.25,2.13,start-.014,"#394e73");
    this.front(x-.45,x+.45,.43,.66,start-.02,"#333949");
    for (const side of [-1,1]) {
      const edge=x+side*.75;
      this.front(edge-.17,edge+.17,.46,.62,start-.026,"#ffedcb");
      this.plane(edge-.035,edge+.035,z+.34,z+length-.40,height+.007,"#e8d5be");
    }
    this.plane(x-.47,x+.47,z+.25,z+2.1,height+.008,"#506aa4");
    this.policeLights(x,z+length-.45,height-.134,time,.79);
    this.policeLabel("ПОЛИЦИЯ",x,height+.025,z+1.62,1.3);
    this.ramp(x,z,ramp,height,r,true);
  }

  drawHeaven(state,time) {
    this.heavenSky(state.distance);
    this.heavenRoad(state.distance);
    const props=state.visible.concat({z:5,character:"runner"},
      {z:5-state.brideGap,character:"kuzy"});
    props.sort((a,b)=>(b.z+(b.length??0)*.55)-(a.z+(a.length??0)*.55));
    for (const prop of props) {
      this.ctx.globalAlpha=this.distanceVisibility(prop.z,84,152);
      if (this.ctx.globalAlpha===0) continue;
      if (prop.character) {
        const runner=prop.character==="runner";
        this.character(prop.character,runner?state.x:state.brideX,runner?state.playerY:0,prop.z,
          runner?state.groundY:0,state,time,false);
      } else if (prop.kind==="police") this.police(prop,prop.z,time);
      else this.pickup(prop,prop.z,time);
    }
    this.ctx.globalAlpha=1;
    this.magnetPulls(state);
    this.tossedMagnet(state);
  }

  magnetPulls(state) {
    const g=this.ctx;
    for (const pull of state.magnetTrails ?? []) {
      const progress=Math.min(1,(state.t-pull.time)/.24);
      const amount=progress*progress*(3-2*progress);
      const x=pull.x+(state.x+.49-pull.x)*amount;
      const y=pull.y+(state.playerY+1.25-pull.y)*amount+Math.sin(progress*Math.PI)*.20;
      const z=pull.z+(5-pull.z)*amount-(state.t-pull.time)*4;
      const [px,py]=this.project(x,y,z);
      const s=Math.min(this.fx,this.fy)/this.depth(y,z);
      g.globalAlpha=1-progress;
      const sprite=pull.kind==="sausage"?this.sausage:this.note.image;
      g.drawImage(sprite,px-s*.52,py-s*.24,s*1.04,s*.48);
    }
    g.globalAlpha=1;
  }

  draw(state, elapsed) {
    const g = this.ctx;
    const { w, h } = this;
    const intervalSinceDraw=elapsed-this.previousFrame;
    const menu = state.mode === "menu";
    const gate=state.visible.find(entity=>entity.kind==="exit");
    const garden=!state.heaven && state.garden && !(gate && gate.z>1);
    const renderingHall=!garden && !state.heaven;
    if (this.renderingHall!==renderingHall) {
      this.renderingHall=renderingHall;
      this.resizeBuffer();
    }
    if (state.mode==="playing") this.adaptToFrameTime(intervalSinceDraw);
    g.setTransform(this.dpr,0,0,this.dpr,0,0);
    const compactMenu = menu && w<=740;
    const portraitRun = !menu && w<=600 && h>w;
    const closeCamera = portraitRun && !state.heaven;
    const cameraShift = menu && !compactMenu ? .17 : 0;
    const drift = state.shake > 0 ? Math.sin(elapsed*60)*Math.min(4,state.shake*18) : 0;
    const dt=Math.min(.06,Math.max(.001,intervalSinceDraw));
    this.previousFrame=elapsed;
    const altitude=state.flying?1:Math.min(.68,state.groundY*.26+Math.max(0,state.playerY-state.groundY)*.055);
    const lineupFraming=garden ? Math.max(0,Math.min(1,1-state.yardAhead/55)) : 0;
    const cameraFollow=(portraitRun?.22:.46)*(1-lineupFraming)+.12*lineupFraming;
    this.cameraRise+=((menu?0:altitude)-this.cameraRise)*(1-Math.exp(-5.5*dt));
    this.cameraX+=((menu?0:state.x*cameraFollow)-this.cameraX)*(1-Math.exp(-11*dt));
    this.cameraDepth=menu?0:closeCamera?2.08:.56;
    this.cx = w*(.5+cameraShift) + drift;
    const lift=garden?Math.min(1,Math.max(0,(state.playerY-3.3)/2.85)):0;
    this.eye=(closeCamera?4:5.65)+this.cameraRise*2.70+lift*2.85;
    this.fy=h*(1.10-this.cameraRise*.23-lift*.105);
    // The closer camera widens the foreground, so keep the outer rails inside the portrait frame.
    const trackWidth=closeCamera?1.42:portraitRun?1.55:1.25;
    this.fx=Math.min(this.fy,w*(trackWidth*(1-lineupFraming)+.99*lineupFraming));
    const runnerHorizon=portraitRun?Math.max(h*.25,Math.min(156,h*.306)):h*.306;
    this.horizon=(menu?h*(compactMenu?.25:.284):runnerHorizon)-h*(this.cameraRise*.046+lift*.065+(closeCamera?.025:0));
    const distance = state.distance;
    const anim = menu ? elapsed*.31 : state.t;
    if (state.heaven) return this.drawHeaven(state,anim);
    const gardenProgress=garden ? state.gardenProgress : 0;
    const yardZ=garden ? state.yardAhead+21 : Infinity;
    const roadStart=yardZ-132;
    const crossingStart=yardZ-5.2;
    const groundEnd=Math.min(2048,crossingStart+.4);
    const railEnd=Math.min(groundEnd,roadStart+WeddingScene.roadTransitionLength);
    const dusk=Math.min(1,Math.max(0,(gardenProgress-.57)/.23));
    const lampLight=dusk*dusk*(3-2*dusk);
    this.backdrop(garden,gardenProgress);
    this.ground(distance,garden,groundEnd,railEnd);
    if (garden) {
      this.gardenAirship(state.airships,state.t,dusk);
      this.gardenCity(distance,gate ? gate.z : -Infinity);
      this.highwayApproach(distance,roadStart,crossingStart+.4);
      this.highwayGround(yardZ);
    }
    const props = [];
    const groundDecor = [];
    const gardenLamps = [];
    const {sceneryDistance:gardenDistance,hallDistance,hallDetail}=WeddingScene.renderSettings[this.renderQuality];
    const sceneryDistance=garden?gardenDistance:hallDistance;
    const sceneryFade=Math.min(108,sceneryDistance-45);
    const gallery = garden ? [] : state.paintings.filter(painting =>
      painting.position-distance > WeddingScene.wallNear && painting.position-distance < 104);
    const guests = state.guests.filter(guest => guest.garden === garden && guest.position-distance > -5 &&
      guest.position-distance < WeddingScene.viewDistance);
    const interval = garden ? 8 : 9;
    const first=Math.floor((distance+(garden?-8.25:WeddingScene.wallNear-4.5))/interval);
    const last=Math.ceil((distance+sceneryDistance)/interval);
    const addDecor=(z,kind,seed,x=0,low=false) => {
      const wall = kind==="painting" || kind==="wallOrnament";
      const near=wall?WeddingScene.wallNear:garden?-6.4:-4.8;
      if (z<=near || z>=sceneryDistance) return;
      if (garden && z+3.2>crossingStart) return;
      if (gate && (garden?z<gate.z+1.3:z>gate.z-.65)) return;
      const roadside = kind!=="arch" && kind!=="chandelier";
      const prop={z,decor:kind,seed,x,roadside};
      (low ? groundDecor : props).push(prop);
      if (kind==="lamp") gardenLamps.push(prop);
    };
    for(let index=first;index<=last;index++) {
      const z=index*interval-distance;
      if (garden) {
        addDecor(z,"flowers",index,0,true);
        if (index%2===1) addDecor(z+1.8,"borders",index,0,true);
        const anchor=index*interval;
        const blocksGuest = state.guests.some(guest => guest.garden && anchor > guest.position-13 && anchor < guest.position+2);
        if (index%3===0 && !blocksGuest && !state.gardenFlightGaps.some(([from,to])=>anchor>=from && anchor<=to)) {
          addDecor(z,"archSupports",index);
          addDecor(z,"arch",index);
        }
        for (const side of [-1,1]) {
          if (index%3===1) addDecor(z+(side<0 ? 3.4 : 5.5),"lamp",index,side*6.15);
          addDecor(z+1.7+this.rnd(index+side)*1.9,"tree",index*2+side,side*(8.1+this.rnd(index*3)*2.25));
          if (index%2===0) addDecor(z+4.5,"tree",index+side+30,side*(16.9+this.rnd(index+13)*2.6));
        }
        const variant=index%7;
        if (variant===0 || variant===4) addDecor(z+3.6,"pavilion",index,variant===0?-15.3:15.9);
        if (variant===1 || variant===5) addDecor(z+2.0,"reception",index,variant===1?8.9:-9.15);
        if (variant===2 || variant===6) addDecor(z+4.1,"fountain",index,variant===2?14.6:-14.9);
        if (variant===0 || variant===3) addDecor(z+.55,"bunting",index,variant===0?-14.1:13.6);
      }
      else {
        const painting = gallery.find(painting => {
          const gap = painting.position-distance-z;
          return gap>-6.8 && gap<11;
        });
        addDecor(z,"hall",index,painting?.side);
        const ornamentSide = index%2===0 ? -1 : 1;
        const ornamentZ = z+4.5;
        if (ornamentZ<65 && !gallery.some(painting => painting.side===ornamentSide &&
          Math.abs(painting.position-distance-ornamentZ)<11.5)) {
          addDecor(ornamentZ,"wallOrnament",index,ornamentSide);
        }
        const celebration = index%3===0;
        const cakeSide = Math.floor(index/3)%2 ? -1 : 1;
        const canopy = (index-2)/3;
        if (Number.isInteger(canopy) && z<120) addDecor(z+6.5,"hallCanopy",((canopy%3)+3)%3);
        for (const side of [-1,1]) {
          if (ornamentZ<92) {
            addDecor(ornamentZ,"hallBay",((index+Number(side===1))%3+3)%3,side*7.06);
            addDecor(ornamentZ+1.15,"hallPool",index,side*5.72,true);
          }
          if (z<116 && !guests.some(guest => guest.side===side && Math.abs(guest.position-distance-z-3.4)<2.2)) {
            if (celebration && side===cakeSide) addDecor(z+3.4,"cakeTable",index,side*5.92);
            else if (side===ornamentSide && z<86) addDecor(z+3.4,"hallPlanter",((index%3)+3)%3,side*6.15);
            else addDecor(z+3.4,"table",index,side*5.38);
          }
        }
        if (celebration && z<100) addDecor(z+5.4,"hallCelebration",index,-cakeSide*6.03);
        if (index%2===0 && z<143) addDecor(z+2,"chandelier",index);
      }
    }
    if (lampLight>0) {
      for (const {x,z} of gardenLamps) this.gardenLampPool(x,z,lampLight);
    }
    // Ground lighting and low scenery are painted below the solid props.
    for (const prop of groundDecor.reverse()) {
      const opacity=this.nearVisibility(prop.z)*this.distanceVisibility(prop.z,Math.min(76,sceneryFade),Math.min(155,sceneryDistance));
      if (opacity<=0) continue;
      g.globalAlpha=opacity;
      if (prop.decor==="flowers") {
        const venue = state.guests.find(guest => guest.garden && Math.abs(guest.position-distance-prop.z)<3);
        this.gardenDecor(prop.z,prop.seed,venue?.side);
      } else if (prop.decor==="hallPool") this.hallFloorLight(prop.x,prop.z);
      else this.lawnBorders(prop.z,prop.seed);
    }
    g.globalAlpha = 1;
    for (const painting of gallery) {
      addDecor(painting.position-distance,"painting",painting.image,painting.side);
    }
    for (const guest of guests) props.push({...guest,z:guest.position-distance,guest:true,roadside:true});
    for (const entity of state.visible) {
      props.push(entity.kind==="truck"?{...entity,depth:entity.z+(entity.length??0)*.74}:entity);
    }
    const y = menu ? 0 : state.playerY;
    const playerZ = compactMenu ? 8.5 : 5;
    const brideZ = playerZ-state.brideGap;
    const characterX=compactMenu?2.65:state.x;
    const brideX=compactMenu?2.65:state.brideX;
    const side=characterX>1 ? -1 : 1;
    const separation=Math.max(0,1.75-Math.abs(characterX-brideX));
    const offset=(Math.sign(brideX-characterX) || side)*separation;
    this.brideOffset+=(offset-this.brideOffset)*(1-Math.exp(-12*dt));
    const retreat=h*(closeCamera?.09:.32)*state.brideRetreat;
    const bride=closeCamera ? this.framePortraitBride(brideX+this.brideOffset,brideZ,retreat) :
      {x:brideX+this.brideOffset,z:brideZ};
    props.push({ z:playerZ, character:"runner" });
    if (state.brideRetreat < 1 && this.depth(2,bride.z)>.65) props.push({ z:bride.z, character:"bride" });
    // Scenery outside the tracks is painted behind the traffic, even next to long trailers.
    props.sort((a,b) => Number(!!b.roadside)-Number(!!a.roadside) || (b.depth??b.z)-(a.depth??a.z));
    let speech = null;
    let brideSpeech = null;
    for (const prop of props) {
      const {z} = prop;
      const visibility = prop.decor ? this.distanceVisibility(z,sceneryFade,sceneryDistance) : this.distanceVisibility(z);
      if (visibility <= 0) continue;
      g.globalAlpha = visibility;
      if (prop.decor) {
        if (prop.decor==="chandelier") this.chandelier(z,anim);
        else if (prop.decor==="painting") this.hallPainting(z,prop.x,prop.seed);
        else if (prop.decor==="wallOrnament") this.wallArtwork(this.wallOrnaments[Number(prop.x<0)],
          z,prop.x,5.23,2.82,8.0);
        else {
          g.save();
          const fade=prop.decor==="arch" || prop.decor==="archSupports" ? 1 : this.nearVisibility(z);
          g.globalAlpha*=fade;
          if (prop.decor==="hall") this.hallSection(z,prop.seed,prop.x,hallDetail);
          if (prop.decor==="hallCanopy") {
            g.globalAlpha*=this.distanceVisibility(z,73,126)*Math.max(0,Math.min(1,(z-4)/6));
            if (g.globalAlpha>0) this.hallCanopy(z,prop.seed,anim,hallDetail);
          }
          if (prop.decor==="hallBay") {
            g.globalAlpha*=this.distanceVisibility(z,57,92);
            const covered=gallery.some(painting=>painting.side===Math.sign(prop.x) &&
              Math.abs(painting.position-distance-z)<7.5);
            if (g.globalAlpha>0) this.hallBay(prop.x,z,prop.seed,covered,anim,hallDetail);
          }
          if (prop.decor==="hallPlanter") {
            g.globalAlpha*=this.distanceVisibility(z,59,86);
            if (g.globalAlpha>0) this.hallPlanter(prop.x,z,prop.seed);
          }
          if (prop.decor==="table" || prop.decor==="cakeTable") {
            g.globalAlpha *= this.distanceVisibility(z,73,116);
            if (g.globalAlpha>0) {
              if (prop.decor==="table") this.hallTable(z,prop.seed,[prop.x]);
              else this.gardenReception(prop.x,z,prop.seed,false);
            }
          }
          if (prop.decor==="hallCelebration") {
            g.globalAlpha *= this.distanceVisibility(z,64,100);
            if (g.globalAlpha>0) this.hallCelebration(prop.x,z,prop.seed);
          }
          if (prop.decor==="lamp") this.gardenLamp(prop.x,z);
          if (prop.decor==="tree") this.gardenTree(prop.x,z,prop.seed);
          if (prop.decor==="archSupports") this.gardenArchSupports(z,prop.seed);
          if (prop.decor==="arch") this.gardenArch(z,prop.seed);
          if (prop.decor==="pavilion") this.gardenPavilion(prop.x,z,prop.seed);
          if (prop.decor==="reception") this.gardenReception(prop.x,z,prop.seed);
          if (prop.decor==="fountain") this.gardenFountain(prop.x,z);
          if (prop.decor==="bunting") this.gardenBunting(prop.x,z,prop.seed);
          g.restore();
        }
      } else if (prop.guest) {
        speech = this.guest(prop,garden,state.t) ?? speech;
      } else if (prop.character === "runner") {
        this.character("runner",characterX,y,z,menu?0:state.groundY,state,anim,menu);
      } else if (prop.character === "bride") {
        const x=bride.x;
        g.save();
        g.translate(0,retreat);
        if (closeCamera) g.globalAlpha*=Math.min(1,(1-state.brideRetreat)*2);
        this.character("bride",x,0,z,0,state,anim,menu);
        g.restore();
        if (state.brideLine) {
          const [px, top]=this.project(x,2.12,z);
          const y=top+retreat;
          if (y<h && px>-28 && px<w+28) {
            const halfWidth=this.fx*.45/this.depth(2.12,z);
            brideSpeech={...state.brideLine,x:px,y,side:px<this.cx?-1:1,halfWidth,centerAbove:true};
          }
        }
      } else if (prop.kind === "truck") {
        const until=prop.t-state.t;
        this.truck(prop,z,state.boots && Math.abs(state.x-prop.lane*2.65)<1.15 && until>=.18 && until<=.91);
      } else if (prop.kind === "exit") {
        this.exit(z,state.t,garden);
      } else if (prop.kind === "barrier" || prop.kind === "ribbon") {
        this.barrier(prop,z);
      } else {
        this.pickup(prop,z,anim);
      }
    }
    this.magnetPulls(state);
    this.tossedMagnet(state);
    const fleckCount = menu ? 34 : 22;
    for(let i=0;i<fleckCount;i++) {
      const x=(this.rnd(i+171)*w+anim*(6+this.rnd(i)*20))%w;
      const y=(this.rnd(i+212)*h+anim*(7+this.rnd(i+27)*14))%h;
      const opacity=.17+Math.abs(Math.sin(anim+i))*.48;
      const fill=garden?"#ffe4a3":"#fff4d7";
      g.globalAlpha=opacity;
      this.ellipse(x,y,1+this.rnd(i)*1.6,1+this.rnd(i+12)*1.8,fill);
    }
    g.globalAlpha=1;
    if (gardenProgress>0) {
      g.fillStyle=`rgba(7,13,33,${.65*Math.pow(gardenProgress,1.75)})`;
      g.fillRect(0,0,w,h);
    }
    if (garden) this.highwayLineup(yardZ);
    if (lampLight>0) {
      for (const {x,z} of gardenLamps) this.gardenLampGlow(x,z,lampLight);
    }
    if (state.flash>0) {
      g.fillStyle="rgba(255,204,165,"+Math.min(.26,state.flash*.40)+")";
      g.fillRect(0,0,w,h);
    }
    return {guest:speech,bride:brideSpeech};
  }
};
