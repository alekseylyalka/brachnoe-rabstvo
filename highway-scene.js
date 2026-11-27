"use strict";

window.WeddingHighway = class WeddingHighway {
  static laneWidth = 3.8;
  static laneX(lane) { return (lane-1.5)*WeddingHighway.laneWidth; }
  static reach = 184;
  static bannerReach = 470;
  static truckScale = [1,1,.73];
  static horizon = .285;

  constructor(painter) {
    this.painter = painter;
    this.vehicles = new Map(WeddingModels.roadVehicles.map(vehicle=>[vehicle.id,vehicle]));
    this.signs = new Map();
    this.depthLayer = new WeddingVehicleDepth();
    this.campus = new WeddingCampus();
  }

  background() {
    const {painter:p} = this;
    const interval = p.h*.01;
    const horizon = Math.round(p.horizon/interval)*interval;
    if (this.sky?.width===Math.round(p.w) && this.sky?.height===Math.round(p.h) && this.skyHorizon===horizon) return this.sky;
    const sky = document.createElement("canvas");
    sky.width = Math.round(p.w);
    sky.height = Math.round(p.h);
    const g = sky.getContext("2d"), {width:w,height:h} = sky;
    const gradient = g.createLinearGradient(0,0,0,horizon*1.23);
    gradient.addColorStop(0,"#0a1024");
    gradient.addColorStop(.66,"#1a2e4c");
    gradient.addColorStop(1,"#536981");
    g.fillStyle = gradient;
    g.fillRect(0,0,w,h);
    for (let i=0;i<92;i++) {
      const x = p.rnd(i+80)*w, y = p.rnd(i+190)*horizon;
      g.fillStyle = `rgba(214,231,252,${.12+p.rnd(i+310)*.55})`;
      const size = i%9===0 ? 1.45 : .78;
      g.fillRect(x,y,size,size);
    }
    const moonX = w*.77, moonY = h*.155, moonRadius = Math.max(8,Math.min(w,h)*.021);
    const glow = g.createRadialGradient(moonX,moonY,moonRadius*.4,moonX,moonY,moonRadius*5);
    glow.addColorStop(0,"#d8e9ff40");
    glow.addColorStop(1,"#d8e9ff00");
    g.fillStyle = glow;
    g.fillRect(moonX-moonRadius*5,moonY-moonRadius*5,moonRadius*10,moonRadius*10);
    g.beginPath();
    g.arc(moonX,moonY,moonRadius,0,Math.PI*2);
    g.fillStyle = "#d7e5f2";
    g.fill();

    for (const [layer,color] of ["#263c55","#1d3147","#132637","#0d1b2b"].entries()) {
      const step = 4+layer*4;
      g.fillStyle = color;
      g.fillRect(0,horizon+h*(.015+layer*.006),w,h);
      for (let x=-step,i=0;x<w+step;x+=step,i++) {
        const away = Math.min(1,Math.abs(x-w*.5)/(w*.40));
        const size = (5+p.rnd(i+layer*313)*h*(.044+layer*.026))*away;
        const base = horizon+h*(.027+layer*.009);
        const r = size*(.15+p.rnd(i+45)*.08), y = base-size;
        g.beginPath();
        g.moveTo(x,y);
        g.lineTo(x+r*.54,y+size*.39);
        g.lineTo(x+r*.29,y+size*.34);
        g.lineTo(x+r,y+size*.74);
        g.lineTo(x+r*.72,y+size*.70);
        g.lineTo(x+r*1.16,base);
        g.lineTo(x-r*1.11,base);
        g.lineTo(x-r*.64,y+size*.71);
        g.lineTo(x-r,y+size*.75);
        g.lineTo(x-r*.28,y+size*.37);
        g.lineTo(x-r*.50,y+size*.40);
        g.closePath();
        g.fill();
      }
    }
    this.sky = sky;
    this.skyHorizon = horizon;
    return sky;
  }

  road(state) {
    const p = this.painter, g = p.ctx;
    const far = WeddingHighway.reach, near = Math.min(-36,p.cameraDepth-12);
    const horizon = WeddingHighway.bannerReach+26;
    const shoulder = WeddingHighway.laneWidth*2;
    const entrance = state.finishMeters-state.distance;
    const entryStart = entrance+WeddingCampus.drivewayStart;
    const entryEnd = entrance+WeddingCampus.drivewayEnd;
    const openedEdge = [[near,Math.min(horizon,entryStart)],[Math.max(near,entryEnd),horizon]].filter(([start,end])=>start<end);
    const surface = g.createLinearGradient(0,p.horizon,0,p.h);
    surface.addColorStop(0,"#364457");
    surface.addColorStop(.28,"#243040");
    surface.addColorStop(1,"#151d29");
    p.plane(-26,26,near,horizon,-.018,"#101e2a");
    p.plane(-shoulder-1.2,shoulder+1.2,near,horizon,0,surface);
    for (const side of [-1,1]) {
      p.plane(side*shoulder,side*(shoulder+1.13),near,horizon,.004,"#293343");
      const sections = side<0 ? [[near,horizon]] : openedEdge;
      for (const [start,end] of sections) p.plane(side*(shoulder-.09),side*(shoulder+.055),start,end,.012,"#c3ccd6");
    }
    for (let z=Math.floor((state.distance+near)/12)*12-state.distance;z<far;z+=12) {
      g.globalAlpha = Math.min(1,Math.max(.05,(far-z)/100));
      for (const x of [-WeddingHighway.laneWidth,0,WeddingHighway.laneWidth]) {
        p.plane(x-.063,x+.063,z,z+5.6,.023,"#b4bdc9");
      }
    }
    g.globalAlpha = 1;

    const arrowX = WeddingHighway.laneX(3), arrowZ = entrance-11;
    if (arrowZ>=near && arrowZ<=far) {
      const arrow = [[-.17,-5],[.17,-5],[.17,-1.35],[1.05,-.2],[.77,.12],
        [1.94,.55],[1.71,-1.04],[1.36,-.61],[-.17,-1.06]];
      p.face(arrow.map(([x,z])=>[arrowX+x,.031,arrowZ+z]),"#dce7eb");
    }

    const aveo = WeddingModels.roadAveo;
    const beamStart = state.isTruck ? 2.2 : -aveo.lights[0][2]*aveo.scale[2];
    const beamX = Math.max(-shoulder,Math.min(shoulder,state.x+state.heading*39));
    const nearPoint = p.project(state.x,.03,beamStart-2);
    const farPoint = p.project(beamX,.03,83);
    const beam = g.createLinearGradient(nearPoint[0],nearPoint[1],farPoint[0],farPoint[1]);
    beam.addColorStop(0,"#fff0c652");
    beam.addColorStop(.45,"#e7eeff30");
    beam.addColorStop(1,"#d2e9ff00");
    g.save();
    g.globalCompositeOperation = "screen";
    if (state.x<shoulder) {
      p.face([[state.x-.9,.025,beamStart],[state.x+.9,.025,beamStart],
        [Math.min(shoulder,beamX+4.3),.025,83],[Math.max(-shoulder,beamX-4.3),.025,83]],beam);
    }
    g.restore();

    for (const side of [-1,1]) {
      const rail = side*(shoulder+.91);
      const sections = side<0 ? [[near,horizon]] : openedEdge;
      for (const [start,end] of sections) {
        p.face([[rail,.56,start],[rail,.56,end],[rail,.80,end],[rail,.80,start]],"#4a5b6c");
        p.face([[rail,.80,start],[rail,.80,end],[rail+side*.13,.80,end],[rail+side*.13,.80,start]],"#8597ad");
      }
      for (let z=Math.floor((state.distance+near)/6)*6-state.distance;z<143;z+=6) {
        if (side>0 && z>=entryStart && z<=entryEnd) continue;
        const depth = p.depth(.5,z);
        if (depth<1) continue;
        p.edge([rail,.02,z],[rail,.57,z],"#344453",Math.max(.5,p.fx*.085/depth));
        const [x,y] = p.project(rail,.735,z);
        const r = Math.min(8,Math.max(.5,p.fx*.066/depth));
        p.ellipse(x,y,r,r*.65,side===1 ? "#e3b884" : "#e68c8e");
      }
    }
  }

  streetlights(state) {
    const p = this.painter, g = p.ctx;
    const near = Math.min(-13,p.cameraDepth-8);
    for (let mile=Math.ceil((state.distance+near)/104)*104;mile<state.distance+155;mile+=104) {
      const z = mile-state.distance, side = (mile/104)%2 ? -1 : 1;
      const outer = side*9.0, lamp = side*6.2;
      const depth = p.depth(7.4,z);
      if (depth<2) continue;
      p.edge([outer,0,z],[outer,7.5,z],"#49586c",Math.max(1,p.fx*.13/depth));
      p.edge([outer,7.5,z],[lamp,7.5,z],"#697786",Math.max(1,p.fx*.08/depth));
      const [x,y] = p.project(lamp,7.48,z);
      const radius = Math.min(43,Math.max(5,p.fx*1.7/depth));
      g.globalAlpha = .72;
      g.drawImage(p.lampGlow,x-radius,y-radius,radius*2,radius*2);
      g.globalAlpha = 1;
      p.ellipse(x,y,Math.max(1,radius*.14),Math.max(.5,radius*.047),"#fff2d1");
    }
  }

  photoBanner({image,side,meters},state) {
    const p = this.painter, g = p.ctx;
    const z = meters-state.distance;
    const x = side*14.25, y = 8.05, height = 6.05;
    const depth = p.depth(y+height/2,z);
    const visibility = p.distanceVisibility(z,380,WeddingHighway.bannerReach);
    if (depth<3 || !visibility) return;
    const photo = p.photos.get(image);
    if (!photo) return;
    const width = Math.max(6.0,Math.min(12.3,height*photo.width/photo.height));
    const screen = (dx,dy)=>p.project(x+dx,y+dy,z-side*dx*.28);
    const rectangle = (w,h)=>[screen(-w/2,h/2),screen(w/2,h/2),screen(w/2,-h/2),screen(-w/2,-h/2)];
    g.save();
    g.globalAlpha = visibility;
    const pad = width*.41+.62;
    p.face([[x-pad,.005,z-2.82],[x+pad,.005,z-2.92],[x+pad+.45,.005,z+.5],
      [x+pad-.12,.005,z+3.10],[x-pad-.46,.005,z+2.15]],"#293947");
    for (const offset of [-width*.31,width*.31]) {
      const foot = x+offset, support = z-side*offset*.28+.19;
      p.face([[foot-.44,.012,support-.39],[foot+.39,.012,support-.39],
        [foot+1.18,.012,support+1.06],[foot+.36,.012,support+1.06]],"#14222e");
      p.box(foot,support,.69,.74,-.018,.24,["#687887","#8c99a3","#526575"]);
      p.box(foot,support,.27,.36,.16,y-height/2+.51,["#617286","#8291a2","#4b6073"]);
    }
    p.poly(rectangle(width+.37,height+.36),"#3d5367");
    p.poly(rectangle(width+.19,height+.19),"#c4ac82");
    p.poly(rectangle(width,height),"#263341");
    const scale = Math.min(width/photo.width,height/photo.height);
    const picture = rectangle(photo.width*scale,photo.height*scale);
    p.sticker(picture,{image:photo,start:0,width:photo.width});
    if (p.watchPaintings) p.observePainting(image,picture);
    p.poly(picture,"#20325224");
    for (const offset of [-width*.32,width*.32]) {
      const [px,py] = screen(offset,height/2+.17);
      p.ellipse(px,py,Math.max(1,p.fx*.17/depth),Math.max(.7,p.fy*.061/depth),"#ffe6b3");
    }
    g.restore();
  }

  sign(name,z,campus) {
    const p = this.painter;
    const top = campus ? 8.27 : 7.94, bottom = campus ? 5.76 : 5.63;
    const half = campus ? 6.08 : 5.45;
    const background = campus ? "#1a574c" : "#254f7e";
    const dep = p.depth(top,z);
    if (dep<2.1) return;
    for (const support of [-8.48,8.48]) {
      p.edge([support,0,z+.10],[support,top-.34,z+.10],"#53697d",Math.max(1,p.fx*.17/dep));
    }
    p.edge([-8.48,top-.36,z+.10],[8.48,top-.36,z+.10],"#7b8b9b",Math.max(1,p.fx*.17/dep));
    if (!this.signs.has(name)) {
      const image = document.createElement("canvas");
      image.width = 720;
      image.height = 168;
      const g = image.getContext("2d");
      g.fillStyle = background;
      g.fillRect(0,0,720,168);
      g.strokeStyle = "#cedde5";
      g.lineWidth = 5;
      g.strokeRect(9,9,702,150);
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "#f1f7fc";
      g.font = "800 82px system-ui,sans-serif";
      g.fillText(name,campus ? 314 : 360,88,campus ? 530 : 650);
      if (campus) {
        g.beginPath();
        g.moveTo(596,77);
        g.lineTo(631,77);
        g.lineTo(631,60);
        g.lineTo(666,84);
        g.lineTo(631,108);
        g.lineTo(631,91);
        g.lineTo(596,91);
        g.closePath();
        g.fill();
      }
      this.signs.set(name,{image,start:0,width:720});
    }
    const corners = [[-half,top,z],[half,top,z],[half,bottom,z],[-half,bottom,z]].map(point=>p.project(...point));
    p.poly(corners,background);
    p.sticker(corners,this.signs.get(name));
  }

  glow(x,y,z,radius,color,core) {
    const p = this.painter, g = p.ctx;
    const [px,py] = p.project(x,y,z);
    const r = Math.min(48,p.fx*radius/p.depth(y,z));
    if (r<.4 || p.depth(y,z)<.8) return;
    const glow = g.createRadialGradient(px,py,0,px,py,r);
    glow.addColorStop(0,color);
    glow.addColorStop(1,"#0000");
    p.ellipse(px,py,r,r,glow);
    if (core) p.ellipse(px,py,Math.max(.7,r*.26),Math.max(.5,r*.14),core);
  }

  vehicle(state) {
    const {x,vehicle:id,heading,tilt,boost} = state;
    const p = this.painter, model = this.vehicles.get(id);
    const truck = Boolean(model.trailer);
    const scale = model.scale ?? WeddingHighway.truckScale;
    const [width,,stretch] = scale;
    const length = truck ? 9.17 : model.bounds.rear*stretch;
    const front = truck ? 1.93 : model.bounds.front*stretch;
    const yaw = Math.PI+heading;
    const rotate = WeddingModels.poseTransform(heading,1,0);
    const world = point => { const [a,b,c]=rotate(point); return [a+x,b,c]; };
    const radius = truck ? 1.38 : (model.bounds.halfWidth-.055)*width;
    p.face([[-radius,.041,-length],[radius,.041,-length],[radius,.041,front],[-radius,.041,front]].map(world),"#0b10187c");
    this.depthLayer.add(model.mesh,x,0,0,yaw,scale,tilt);
    if (model.trailer) this.depthLayer.add(model.trailer,x,0,0,yaw,scale,tilt);
    const tailLights = truck ? [-1,1].map(side=>world([side*1.04,.83,-length-.018]))
      : model.tailLights.map(WeddingModels.poseTransform(yaw,scale,tilt)).map(([a,b,c])=>[a+x,b,c]);
    for (const point of tailLights) this.glow(...point,.38,"#ff3e5476");
    for (const side of [-1,1]) {
      if (boost>.03) {
        const ax = side*.74*width, az = -length-.18;
        const jet = (1.15+p.rnd(side+this.distance)*.59)*boost;
        p.face([[ax-.124,.51,az],[ax+.124,.51,az],[ax,.41,az-jet*4.4]].map(world),"#139aff81");
        p.face([[ax-.070,.53,az],[ax+.070,.53,az],[ax,.48,az-jet*2.65]].map(world),"#abf3ff");
        this.glow(...world([ax,.51,az]),.84*boost,"#32bcffb4","#e5ffff");
      }
    }
  }

  traffic(car,distance) {
    const p = this.painter, x = WeddingHighway.laneX(car.lane), z = car.meters-distance;
    const {mesh,distant,width,front,rear,tail} = WeddingModels.roadTraffic[car.model];
    if (z>83) {
      this.depthLayer.add(distant,x,0,z,Math.PI);
      for (const side of [-1,1]) {
        const [px,py] = p.project(x+side*tail[0],tail[1],z-rear);
        p.ellipse(px,py,1,.65,"#df626c");
      }
      return;
    }
    p.plane(x-width,x+width,z-rear,z+front,.038,"#0b101890");
    this.depthLayer.add(mesh,x,0,z,Math.PI);
    for (const side of [-1,1]) this.glow(x+side*tail[0],tail[1],z-rear,.31,"#ff4e5879");
  }

  pursuer(chase) {
    const p = this.painter;
    const {x,z,lean} = chase;
    if (p.depth(1,z-4)<1.35 || z>48) return;
    const {mesh,speech} = WeddingModels.roadBridge[Math.round(lean*8)];
    const yaw = Math.PI-.083*lean+(chase.heading ?? 0);
    const rotate = WeddingModels.poseTransform(yaw,1,0);
    p.plane(x-1.42,x+1.42,z-3.92,z+3.06,.04,"#0b1018a0");
    this.depthLayer.add(mesh,x,0,z,yaw);
    for (const side of [-1,1]) {
      const [a,b,c] = rotate([side*1.08,.72,3.87]);
      const braking = Math.abs(chase.heading ?? 0)>.01;
      this.glow(x+a,b,z+c,braking ? .60 : .38,braking ? "#ff3e469d" : "#ff425174");
    }
    const [a,b,c] = rotate(speech);
    return p.project(x+a,b,z+c);
  }

  streaks(state) {
    const p = this.painter, g = p.ctx;
    g.globalAlpha = state.boost*.78;
    const cx = p.w*.5, cy = p.h*.43;
    const phase = state.elapsed*3.8;
    for (let i=0;i<42;i++) {
      const angle = p.rnd(i+952)*Math.PI*2;
      const r = (p.rnd(i+420)+phase)%1;
      const radius = .37 + r*.90;
      const dx = Math.cos(angle)*p.w*.63;
      const dy = Math.sin(angle)*p.h*.66;
      p.line([[cx+dx*radius,cy+dy*radius],[cx+dx*(radius+.17*r),cy+dy*(radius+.17*r)]],
        i%3 ? "#9cceff99" : "#c7f4ffcf",.65+r*1.85);
    }
    g.globalAlpha = 1;
  }

  paintGround(state) {
    const p = this.painter, g = p.ctx;
    g.setTransform(p.dpr,0,0,p.dpr,0,0);
    g.globalAlpha = 1;
    g.drawImage(this.background(),0,0,p.w,p.h);
    this.road(state);
    const campusZ = state.finishMeters+WeddingCampus.setback-state.distance;
    if (campusZ>=330 || p.depth(0,campusZ)<=4) return null;
    this.campus.grounds(p,campusZ);
    return campusZ;
  }

  paintVehiclesAndCampus(campusZ,arrivalWalk) {
    const p = this.painter;
    if (campusZ!==null) {
      const {x,scale} = WeddingCampus;
      for (const side of [-1,1]) {
        this.glow(x+side*8.9*scale,2.52*scale,campusZ-14*scale,2.35*scale,"#ffbd7355");
        this.glow(x+side*4.0*scale,2.74*scale,campusZ-.91*scale,2.10*scale,"#ffc68c47");
      }
      // The facade details are nearly coplanar and sort by their inset in the Canvas fallback.
      this.depthLayer.add(this.campus.mesh,x,0,campusZ,0,scale,0,0);
      this.campus.entrance(this.depthLayer,campusZ,arrivalWalk?.door ?? 0);
    }
    this.depthLayer.paint(p);
    if (campusZ!==null) this.campus.sign(p,campusZ);
  }

  draw(state,arrivalWalk) {
    const p = this.painter;
    const aveo = state.vehicle==="aveo";
    const cameraLift = aveo ? .32 : 0;
    const chase = state.chase.visible ? state.chase : null;
    const beside = chase ? chase.lean**2*(3-2*chase.lean) : 0;
    const shock = state.impact>.52 ? Math.sin(state.elapsed*65)*(state.impact-.52)*.13 : 0;
    const behind = (state.isTruck ? 20.3 : 9.6)+.95*beside+state.boost*3.1+(state.captureView ?? 0)*2.1;
    const gap = chase ? chase.x-state.x : 0;
    const followX = state.x*.87+state.heading*.8+shock;
    const windowX = chase ? (state.isTruck ? (state.x+chase.x)*.5 : Math.min(state.x-2.4,chase.x-4.5)) : followX;
    p.cameraX = followX+(windowX-followX)*beside;
    p.cameraDepth = 6-behind;
    p.eye = (state.isTruck ? 7.30 : 4.67)+cameraLift+beside*.16+state.boost*.40;
    p.cx = p.w*.50;
    p.horizon = p.h*(WeddingHighway.horizon-(aveo ? .012 : 0));
    p.fy = p.h*.87/(1+state.boost*.20);
    const lens = Math.min(p.h*1.14,p.w*1.40)/(1+state.boost*.20);
    const wideLens = p.w*.85*(behind-2.65)/(Math.abs(gap)*1.18+4.35);
    p.fx = lens+(Math.min(lens,wideLens)-lens)*beside;
    if (chase && beside>0) {
      const [hero] = p.project(state.x,1.45,0);
      const [rival] = p.project(chase.x,2.50,chase.z);
      p.cx -= (hero*.53+rival*.47-p.w*.50)*beside;
    }
    if (state.arrival) {
      const progress = state.arrival.progress;
      const blend = progress*progress*(3-2*progress);
      const toward = (from,to)=>from+(to-from)*blend;
      p.cameraX = toward(p.cameraX,WeddingCampus.x+.8);
      p.cameraDepth = toward(p.cameraDepth,6-(state.isTruck ? 23 : 21));
      p.eye = toward(p.eye,(state.isTruck ? 8 : 6.7)+cameraLift);
      p.horizon = toward(p.horizon,p.h*.51);
      p.fx = toward(p.fx,Math.min(p.h*1.08,p.w*.80));
      p.fy = toward(p.fy,Math.min(p.h*.81,p.w*1.16));
    }
    if (arrivalWalk) {
      const {x,z,camera,driverView} = arrivalWalk;
      p.cameraX += (x+1.55-p.cameraX)*camera;
      p.cameraX -= 12*driverView;
      p.cameraDepth += (6+z-8.1-p.cameraDepth)*camera;
      p.cameraDepth += (6+z-7.1-p.cameraDepth)*driverView*.69;
      p.eye += (3.0-p.eye)*camera;
      p.eye += (4.3-p.eye)*driverView*.60;
      p.horizon += (p.h*.44-p.horizon)*camera;
      p.cameraDepth += 1.55*arrivalWalk.wash;
    }
    this.distance = state.distance;
    const campusZ = this.paintGround(state);
    this.streetlights(state);
    state.banners.forEach(banner=>this.photoBanner(banner,state));
    if (campusZ!==null && arrivalWalk?.door>0) this.campus.entranceSpill(p,campusZ,arrivalWalk.door);
    this.depthLayer.start();
    for (const car of state.traffic) {
      const z = car.meters-state.distance;
      if (z<160 && p.depth(0,z-WeddingModels.roadTraffic[car.model].rear)>1.25) this.traffic(car,state.distance);
    }
    this.vehicle(state);
    if (arrivalWalk?.visible) {
      const {x,y,z,yaw,stride} = arrivalWalk;
      const [sx,sy] = p.project(x,y,z);
      p.ellipse(sx,sy,p.fx*.43/p.depth(y,z),p.fy*.16/p.depth(y,z),"#1615288c");
      this.depthLayer.add(WeddingModels.walker(stride),x,y,z,yaw);
    }
    const speech = chase ? this.pursuer(chase) : undefined;
    this.paintVehiclesAndCampus(campusZ,arrivalWalk);
    // Every vehicle roof is below the boards. In any projected overlap, the board is closer.
    for (const {name,at,meters} of state.signs) {
      const z = meters-state.distance;
      if (z>=-12 && z<=177) this.sign(name,z,at===1);
    }
    if (state.boost>.02) this.streaks(state);
    if (campusZ!==null && arrivalWalk?.door>0) this.campus.entranceBloom(p,campusZ,arrivalWalk);
    return speech;
  }
};
