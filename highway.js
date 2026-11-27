"use strict";

window.WeddingDrive = class WeddingDrive {
  static stops = [
    {name:"КРЕПОСТНАЯ",at:0}, {name:"СМОЛЕНСКАЯ",at:.185}, {name:"АФИПСКИЙ",at:.365},
    {name:"ЭНЕМ",at:.545}, {name:"КРАСНОДАР",at:.766}, {name:"ГАУМАНКА",at:1}
  ];
  static nitroUnlock = 5;
  static cruiseSpeed = 130/3.6;
  static trafficSpeed = 60/3.6;
  static chaseStartLane = 2;
  static chaseReveal = 2.64;
  static chaseTurnTime = .88;
  static bannerCount = 6;
  static startLane = 1;
  static trafficOpening = [[0,21],[3,48],[0,27],[2,41],[1,11],[3,53]];
  static trafficPairs = [[0,2],[3,1],[2,0],[1,3],[2,0],[3,1],[0,2],[1,3]];
  static trafficModels = [7,1,5,4,8,3,6,2,0,7,5,4,8,1,6,3,0];
  static trafficGaps = [52,48,55,47,51];
  static trafficStagger = [9,13,7,10,11];
  static throttleKeys = new Set(["KeyW","ArrowUp"]);
  static steeringKeys = {ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1};
  static roadEdge = WeddingHighway.laneWidth*2-.17;
  static hulls = {
    aveo:WeddingModels.roadAveo.collision, truck:{width:1.43,front:2.30,rear:9.13},
    chase:{width:1.57,front:3.46,rear:4.00}
  };

  static approach(value,target,maxChange) {
    return value+Math.min(maxChange,Math.max(-maxChange,target-value));
  }

  static smooth(progress) {
    const p = Math.min(1,Math.max(0,progress));
    return p*p*(3-2*p);
  }

  constructor({scene,track,root,fade,caught,onEnter,onExit,onMute,onCaught,onCampus,onMainMenu,canTeleport}) {
    this.scene = new WeddingHighway(scene);
    this.track = track;
    this.root = root;
    this.fade = fade;
    this.caught = caught;
    this.onEnter = onEnter;
    this.onExit = onExit;
    this.onCaught = onCaught;
    this.onCampus = onCampus;
    this.phase = "idle";
    this.steering = new Set();
    this.throttleKeys = new Set();
    this.steeringPointers = new Map();
    this.ui = Object.fromEntries([...root.querySelectorAll("[data-drive]")].map(el=>[el.dataset.drive,el]));
    for (const stop of WeddingDrive.stops) {
      const marker = document.createElement("li");
      marker.textContent = stop.name;
      marker.style.left = `${100*stop.at}%`;
      this.ui.stops.append(marker);
    }
    const {pause,sound,resume,back,mainMenu,teleportCampus,nitro,throttle,left,right} = this.ui;
    pause.addEventListener("click",()=>this.pause());
    sound.addEventListener("click",onMute);
    resume.addEventListener("click",()=>this.resume());
    back.addEventListener("click",()=>this.leave());
    mainMenu.addEventListener("click",()=>this.leave(onMainMenu));
    teleportCampus.addEventListener("click",()=>{
      if (canTeleport()) this.leave(this.onCampus);
    });
    this.bindSteering(left,-1);
    this.bindSteering(right,1);
    this.bindPedal(nitro,"touchNitro");
    this.bindPedal(throttle,"touchThrottle");
    track.addEventListener("ended",()=>this.advanceTo(this.duration));
    track.addEventListener("error",()=>{
      if (this.phase==="driving") this.pause("Не удалось продолжить воспроизведение трека.");
    });
    document.addEventListener("visibilitychange",()=>{
      if (document.hidden) this.pause();
    });
    window.addEventListener("blur",()=>this.clearControls());
  }

  setMuted(muted) {
    this.track.muted = muted;
    this.ui.sound.setAttribute("aria-pressed",String(muted));
    this.ui.sound.setAttribute("aria-label",muted ? "Включить звук" : "Выключить звук");
    this.ui.sound.textContent = muted ? "♪̸" : "♪";
  }

  async start(vehicle,extraChaseKmh = 0) {
    if (this.phase!=="idle") return;
    this.phase = "starting";
    if (this.track.error) this.track.load();
    this.track.volume = 0;
    this.track.currentTime = 0;
    this.fade.classList.add("black");
    try {
      // Request playback from the garage click so the sound also starts on touch browsers.
      const cover = new Promise(resolve=>setTimeout(resolve,360));
      await Promise.all([cover,this.track.play()]);
      if (!Number.isFinite(this.track.duration) || this.track.duration<=0) throw new Error("Missing duration");
    } catch {
      this.track.pause();
      this.fade.classList.remove("black");
      this.phase = "idle";
      return false;
    }
    this.track.currentTime = 0;
    this.duration = this.track.duration;
    const cruise = WeddingDrive.cruiseSpeed;
    const finishMeters = this.duration*cruise;
    this.afterTrackAt = null;
    this.root.classList.remove("campus-view","campus-walk");
    this.lastHudTime = -Infinity;
    this.clearControls();
    this.state = {
      elapsed:0, distance:0, speed:cruise, roadSpeed:cruise, vehicle:vehicle.id,
      topSpeed:vehicle.topSpeed/3.6, boostSpeed:vehicle.boostSpeed/3.6,
      isTruck:vehicle.id!=="aveo", nitro:vehicle.nitro, reserve:vehicle.nitro, boost:0, impact:0, passed:0,
      speedUnlocked:false, finishTime:null, finishMeters, arrival:null,
      x:WeddingHighway.laneX(WeddingDrive.startLane), lateral:0, heading:0, tilt:0, sideContact:false,
      // The red truck is already on the road when the camera reveals it.
      chase:{x:WeddingHighway.laneX(WeddingDrive.chaseStartLane),lane:WeddingDrive.chaseStartLane,
        meters:0,previous:0,z:0,lean:0,speed:cruise,extraSpeed:extraChaseKmh/3.6,visible:false,turn:null},
      traffic:[], nextCar:47, carsSpawned:0,
      banners:WeddingScene.pickPhotos(WeddingDrive.bannerCount).map((image,index)=>({
        image,side:index%2 ? 1 : -1,meters:finishMeters*(index+.5)/WeddingDrive.bannerCount
      })),
      signs:WeddingDrive.stops.map(({name,at})=>({name,at,meters:at===0 ? 38 : at*finishMeters}))
    };
    this.spawnTraffic();
    this.root.inert = false;
    this.caught.hidden = true;
    this.ui.nitroPanel.hidden = vehicle.nitro===0;
    this.ui.nitro.setAttribute("aria-label","Удерживай, чтобы включить нитро");
    this.ui.car.textContent = vehicle.name;
    this.ui.speech.hidden = this.ui.impact.hidden = this.ui.panel.hidden = true;
    this.phase = "driving";
    this.root.hidden = false;
    this.onEnter();
    this.updateHud(true);
    this.frame();
    this.fade.classList.remove("black");
    this.root.focus({preventScroll:true});
    if (document.hidden) this.pause();
    return true;
  }

  clearControls() {
    this.shiftHeld = this.touchNitro = this.touchThrottle = false;
    this.steering.clear();
    this.throttleKeys.clear();
    this.steeringPointers.clear();
    this.tapUntil = 0;
  }

  tapSteering(direction) {
    if (this.phase!=="driving") return;
    this.tapDirection = direction;
    this.tapUntil = this.state.elapsed+.115;
  }

  bindSteering(button,direction) {
    button.addEventListener("pointerdown",event=>{
      if (event.button!==0 || this.phase!=="driving") return;
      button.setPointerCapture(event.pointerId);
      this.steeringPointers.set(event.pointerId,direction);
      this.tapSteering(direction);
    });
    for (const type of ["pointerup","pointercancel","lostpointercapture"]) {
      button.addEventListener(type,event=>this.steeringPointers.delete(event.pointerId));
    }
    button.addEventListener("click",event=>{
      if (event.detail===0) this.tapSteering(direction);
    });
  }

  bindPedal(button,control) {
    button.addEventListener("pointerdown",event=>{
      if (event.button!==0 || this.phase!=="driving") return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      this[control] = true;
    });
    for (const type of ["pointerup","pointercancel","lostpointercapture"]) {
      button.addEventListener(type,()=>{ this[control] = false; });
    }
    button.addEventListener("keydown",event=>{
      if ((event.code==="Space" || event.code==="Enter") && this.phase==="driving") {
        event.preventDefault();
        this[control] = true;
      }
    });
    for (const type of ["keyup","blur"]) button.addEventListener(type,()=>{ this[control] = false; });
  }

  keydown(event) {
    const {code} = event;
    const direction = WeddingDrive.steeringKeys[code];
    const throttle = WeddingDrive.throttleKeys.has(code);
    if (direction || throttle || ["ShiftLeft","ShiftRight","Escape","KeyP"].includes(code)) {
      event.preventDefault();
    }
    if (throttle && this.phase==="driving") this.throttleKeys.add(code);
    if (direction && this.phase==="driving") {
      this.steering.add(code);
      if (!event.repeat) this.tapSteering(direction);
    }
    if (code==="ShiftLeft" || code==="ShiftRight") this.shiftHeld = this.phase==="driving";
    if (event.repeat) return;
    if (code==="Escape" || code==="KeyP") {
      if (this.phase==="paused") this.resume();
      else this.pause();
    }
  }

  keyup(event) {
    this.steering.delete(event.code);
    this.throttleKeys.delete(event.code);
    if (event.code==="ShiftLeft" || event.code==="ShiftRight") this.shiftHeld = event.shiftKey;
  }

  showPanel(text) {
    this.ui.panel.hidden = false;
    this.ui.title.textContent = "ПАУЗА";
    this.ui.panel.scrollTop = 0;
    this.ui.detail.textContent = text;
    this.ui.resume.focus({preventScroll:true});
  }

  pause(error) {
    if (this.phase!=="driving") return;
    this.advanceTo(this.driveTime(performance.now()));
    if (this.phase!=="driving") return;
    this.phase = "paused";
    this.track.pause();
    this.afterTrackAt = null;
    this.clearControls();
    this.showPanel(error || "Поездка продолжится с того же места.");
  }

  async resume() {
    if (this.phase!=="paused" || this.ui.resume.disabled) return;
    this.ui.resume.disabled = true;
    try {
      if (this.state.elapsed<this.duration) await this.track.play();
      if (this.phase!=="paused" || document.hidden) {
        this.track.pause();
        return;
      }
      this.phase = "driving";
      this.ui.panel.hidden = true;
      this.root.focus({preventScroll:true});
    } catch {
      this.ui.detail.textContent = "Трек не запустился. Попробуй ещё раз.";
    } finally {
      this.ui.resume.disabled = false;
    }
  }

  driveTime(now) {
    if (!this.track.ended && this.state.elapsed<this.duration) return this.track.currentTime;
    this.afterTrackAt ??= now-Math.max(0,this.state.elapsed-this.duration)*1000;
    return this.duration+(now-this.afterTrackAt)/1000;
  }

  formatDriveTime(time) {
    const hundredths = Math.round(time*100);
    const seconds = Math.floor(hundredths/100);
    return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")},${String(hundredths%100).padStart(2,"0")}`;
  }

  endDrive() {
    this.phase = "parking";
    this.parkingFrame = null;
    this.parkingTime = 0;
    this.clearControls();
    this.state.boost = this.state.speed = 0;
    this.root.classList.add("campus-walk");
    this.updateHud(true);
  }

  leave(destination=this.onExit) {
    if (this.phase!=="paused") return;
    this.track.pause();
    this.clearControls();
    this.root.hidden = true;
    this.phase = "idle";
    destination();
  }

  updateChase(step,heroHull) {
    const {state} = this;
    const {elapsed,chase} = state;
    const body = WeddingDrive.hulls.chase;
    // Keep the opening in sync until nitro is available to the player.
    const pursuitTime = Math.max(0,elapsed-WeddingDrive.nitroUnlock);
    chase.previous = chase.meters;
    chase.meters = elapsed*WeddingDrive.cruiseSpeed+pursuitTime*chase.extraSpeed;
    chase.speed = WeddingDrive.cruiseSpeed+(pursuitTime>0 ? chase.extraSpeed : 0);
    chase.visible = elapsed>=WeddingDrive.chaseReveal;
    if (elapsed<5.7) return;

    const obstacles = this.trafficBlockers();
    obstacles.push({car:{meters:state.distance,speed:state.roadSpeed},x:state.x,
      hull:{...heroHull,width:Math.max(heroHull.right,-heroHull.left)}});
    if (!chase.turn) {
      const needsPass = this.chaseClearance(chase.x,obstacles)<2.4;
      const outer = chase.lane===0 || chase.lane===3;
      if (needsPass || outer) {
        let best = -Infinity;
        const minimumRoom = needsPass ? WeddingDrive.chaseTurnTime+.34 : 3.2;
        for (const lane of [chase.lane-1,chase.lane+1]) {
          if (lane<0 || lane>3) continue;
          const x = WeddingHighway.laneX(lane);
          const room = this.chaseClearance(x,obstacles);
          const score = Math.min(5,room)-(lane===0 || lane===3 ? 1.4 : 0);
          if (room<minimumRoom || score<=best) continue;
          best = score;
          chase.turn = {from:chase.x,to:x,lane,start:elapsed-step};
        }
      }
    }
    if (!chase.turn) return;
    const turn = chase.turn;
    const progress = (elapsed-turn.start)/WeddingDrive.chaseTurnTime;
    const wanted = turn.from+(turn.to-turn.from)*WeddingDrive.smooth(progress);
    const hull = {...body,left:-body.width,right:body.width,front:body.front+chase.speed*step};
    const nextX = WeddingDrive.approach(chase.x,wanted,7*step);
    const x = this.limitSide(chase.x,nextX,chase.previous,hull,obstacles);
    chase.heading = Math.atan2(x-chase.x,chase.speed*step)*.58;
    chase.x = x;
    if (progress>=1 && Math.abs(x-turn.to)<.001) {
      chase.lane = turn.lane;
      chase.heading = 0;
      chase.turn = null;
    }
  }

  chaseClearance(x,obstacles) {
    const {chase} = this.state;
    const body = WeddingDrive.hulls.chase;
    let seconds = Infinity;
    for (const {car,x:otherX,hull} of obstacles) {
      if (Math.abs(x-otherX)>=body.width+hull.width+.22) continue;
      const offset = car.meters-chase.previous;
      const close = chase.speed-car.speed;
      const behind = offset+hull.front+body.rear+.6;
      if (behind<0) {
        if (close<0) seconds = Math.min(seconds,behind/close);
      } else {
        const gap = offset-hull.rear-body.front-.8;
        if (gap<=0) return 0;
        if (close>0) seconds = Math.min(seconds,gap/close);
      }
    }
    return seconds;
  }

  spawnTraffic() {
    const {state} = this;
    if (state.finishTime!==null) return;
    const {trafficOpening,trafficPairs,trafficModels,trafficGaps,trafficStagger} = WeddingDrive;
    const flow = state.elapsed*WeddingDrive.trafficSpeed;
    const trafficAhead = Math.max(state.distance,Math.min(state.chase.meters,state.finishMeters))+207;
    // Alternate which lanes are occupied and leave room to overtake between groups.
    while (state.nextCar+flow<trafficAhead) {
      const index = state.carsSpawned++;
      const pairIndex = Math.max(0,index-trafficOpening.length);
      const row = Math.floor(pairIndex/2);
      const slot = pairIndex%2;
      const [lane,spacing] = trafficOpening[index] ?? [trafficPairs[row%trafficPairs.length][slot],
        slot ? trafficGaps[row%trafficGaps.length] : trafficStagger[row%trafficStagger.length]];
      const model = trafficModels[index%trafficModels.length];
      const meters = state.nextCar+flow;
      // Ramp up across the route, with a full-density stretch before the finish.
      const progress = Math.max(0,Math.min(1,(meters/state.finishMeters-.06)/.895));
      const density = index<trafficOpening.length ? 1 : 1+.5*progress;
      state.traffic.push({lane,meters,model,speed:WeddingDrive.trafficSpeed});
      state.nextCar += spacing/density;
    }
  }

  moveTraffic(step,hull) {
    const {state} = this;
    state.traffic.sort((a,b)=>b.meters-a.meters);
    const leaders = [];
    for (const car of state.traffic) {
      const body = WeddingModels.roadTraffic[car.model];
      const x = WeddingHighway.laneX(car.lane);
      car.previous = car.meters;
      const wanted = car.meters+WeddingDrive.trafficSpeed*step;
      let next = wanted;
      const leader = leaders[car.lane];
      if (leader) next = Math.min(next,leader.meters-WeddingModels.roadTraffic[leader.model].rear-body.front-.24);
      if (car.meters+body.front<=state.distance-hull.rear+.02 &&
        x+body.width>state.x+hull.left && x-body.width<state.x+hull.right) {
        next = Math.min(next,state.distance-hull.rear-body.front-.08);
      }
      const chase = state.chase, rival = WeddingDrive.hulls.chase;
      if (chase && car.meters+body.front<=chase.previous-rival.rear+.02 && Math.abs(x-chase.x)<body.width+rival.width) {
        next = Math.min(next,chase.meters-rival.rear-body.front-.09);
      }
      car.meters = Math.max(car.meters,next);
      car.speed = next===wanted ? WeddingDrive.trafficSpeed : (car.meters-car.previous)/step;
      leaders[car.lane] = car;
    }
  }

  playerHull(heading) {
    const hull = WeddingDrive.hulls[this.state.isTruck ? "truck" : "aveo"];
    const width = hull.width*Math.cos(heading);
    const sin = Math.sin(heading);
    const spread = hull.width*Math.abs(sin);
    return {left:Math.min(hull.front*sin,-hull.rear*sin)-width,
      right:Math.max(hull.front*sin,-hull.rear*sin)+width,
      front:hull.front*Math.cos(heading)+spread,rear:hull.rear*Math.cos(heading)+spread};
  }

  trafficBlockers() {
    return this.state.traffic.map(car=>({car,x:WeddingHighway.laneX(car.lane),hull:WeddingModels.roadTraffic[car.model]}));
  }

  blockers() {
    const {chase} = this.state;
    return [...this.trafficBlockers(),{car:chase,x:chase.x,hull:WeddingDrive.hulls.chase}];
  }

  limitSide(x,wanted,distance,hull,blockers,rightEdge=WeddingDrive.roadEdge) {
    const roadMin = -WeddingDrive.roadEdge-hull.left;
    const roadMax = rightEdge-hull.right;
    let minX = roadMin, maxX = roadMax;
    for (const {car,x:obstacleX,hull:other} of blockers) {
      if (distance+hull.front<=(car.previous ?? car.meters)-other.rear || distance-hull.rear>=car.meters+other.front) continue;
      if (x<obstacleX) maxX = Math.min(maxX,obstacleX-other.width-.055-hull.right);
      else minX = Math.max(minX,obstacleX+other.width+.055-hull.left);
    }
    const safeMin = Math.max(roadMin,Math.min(minX,x));
    const safeMax = Math.min(roadMax,Math.max(maxX,x));
    return Math.min(safeMax,Math.max(safeMin,wanted));
  }

  limitForward(distance,wanted,x,hull,blockers,onContact) {
    let next = wanted;
    for (const {car,x:otherX,hull:other} of blockers) {
      if (x+hull.right<=otherX-other.width || x+hull.left>=otherX+other.width) continue;
      if (distance+hull.front>(car.previous ?? car.meters)-other.rear+.006) continue;
      const contact = car.meters-other.rear-hull.front-.055;
      if (wanted<=contact) continue;
      next = Math.min(next,Math.max(distance,contact));
      onContact?.(car);
    }
    return next;
  }

  steer(step,blockers) {
    const {state} = this;
    const directions = [...Array.from(this.steering,key=>WeddingDrive.steeringKeys[key]),...this.steeringPointers.values()];
    const steer = Number(directions.includes(1))-Number(directions.includes(-1));
    const input = state.finishTime!==null ? 0 : directions.length ? steer : state.elapsed<this.tapUntil ? this.tapDirection : 0;
    const authority = Math.min(1,state.speed/6);
    const target = input*(state.isTruck ? 7.25 : 8.2)*authority;
    state.lateral += (target-state.lateral)*(1-Math.exp(-(input ? 10 : 13)*step));
    const yaw = Math.max(-.16,Math.min(.16,Math.atan2(state.lateral,Math.max(19,state.speed))*(state.isTruck ? .47 : .76)));
    let heading = state.heading+(yaw-state.heading)*(1-Math.exp(-11*step));
    let hull = this.playerHull(heading);
    const skin = .055;

    // Keep a changing corner angle clear of bodies the player is already alongside.
    for (const {car,x,hull:other} of blockers) {
      if (state.distance+hull.front<=car.previous-other.rear || state.distance-hull.rear>=car.previous+other.front) continue;
      if (state.x+hull.right>x-other.width-skin && state.x+hull.left<x+other.width+skin) {
        heading = state.heading;
        hull = this.playerHull(heading);
        break;
      }
    }
    const wanted = state.x+state.lateral*step;
    state.x = this.limitSide(state.x,wanted,state.distance,hull,blockers);
    const bumped = Math.abs(state.x-wanted)>.001;
    if (bumped) state.lateral = 0;
    if (bumped && !state.sideContact) {
      if (state.speedUnlocked) state.speed *= .69;
      state.impact = .95;
    }
    state.sideContact = bumped;
    state.heading = heading;
    state.tilt += (-input*(state.isTruck ? .024 : .039)-state.tilt)*(1-Math.exp(-7*step));
    return hull;
  }

  travel(step,burn,blockers,hull) {
    const {state} = this;
    const throttle = this.throttleKeys.size || this.touchThrottle;
    const cruise = !state.speedUnlocked;
    const target = cruise ? WeddingDrive.cruiseSpeed : burn ? state.boostSpeed : throttle ? state.topSpeed : 0;
    const acceleration = state.isTruck ? 1.85 : 2.15;
    const rate = burn ? (state.isTruck ? 12.5 : 29) : state.speed>state.topSpeed ? 22 : throttle ? acceleration : 5.85;
    const speed = WeddingDrive.approach(state.speed,target,rate*step);
    const wanted = state.distance+speed*step;
    const next = this.limitForward(state.distance,wanted,state.x,hull,blockers,car=>{
      if (state.speed-car.speed>2.5 || car===state.chase) state.impact = .95;
      car.hit = true;
    });
    state.roadSpeed = next===wanted ? speed : Math.max(0,(next-state.distance)/step);
    state.speed = state.speedUnlocked ? state.roadSpeed : WeddingDrive.cruiseSpeed;
    state.distance = next;
    for (const car of state.traffic) {
      if (!car.passed && car.meters+WeddingModels.roadTraffic[car.model].front < state.distance-hull.rear-.12) {
        car.passed = true;
        if (!car.hit) state.passed++;
      }
    }
    // Keep traffic around the pursuer even if nitro takes the player far ahead.
    const chaseInterest = Math.min(state.chase.meters,state.finishMeters);
    const rearInterest = Math.min(state.distance,chaseInterest)-44;
    const frontInterest = Math.max(state.distance,chaseInterest)+265;
    state.traffic = state.traffic.filter(car=>car.meters>rearInterest && car.meters<frontInterest);
    state.chase.z = state.chase.meters-state.distance;
    const opening = Math.min(1,Math.max(0,(state.elapsed-2.78)/.23),Math.max(0,(5.7-state.elapsed)/.55));
    state.chase.lean = Math.min(opening,Math.max(0,(state.chase.z+3)/3));
  }

  enterCampus(previousDistance,before,step) {
    const {state} = this;
    const across = (state.finishMeters-previousDistance)/(state.distance-previousDistance);
    state.finishTime = before+step*Math.min(1,across);
    state.finishPassed = state.passed;
    state.distance = state.finishMeters;
    state.chase.z = state.chase.meters-state.distance;
    state.arrival = {x:state.x,heading:state.heading,progress:0};
    this.clearControls();
    this.root.classList.add("campus-view");
    this.updateHud(true);
  }

  followDriveway(step,blockers) {
    const {state} = this, {arrival} = state;
    if (arrival.progress===1) return;
    const progress = Math.min(1,arrival.progress+step/WeddingCampus.approachTime);
    const pose = WeddingCampus.approach(arrival,state.finishMeters,progress);
    let hull = this.playerHull(pose.heading);
    // Keep the rear of a turning trailer clear of traffic as it leaves the highway.
    const rotationBlocked = blockers.some(({car,x,hull:other})=>
      state.distance+hull.front>(car.previous ?? car.meters)-other.rear &&
      state.distance-hull.rear<car.meters+other.front &&
      state.x+hull.right>x-other.width && state.x+hull.left<x+other.width);
    if (rotationBlocked) hull = this.playerHull(state.heading);
    const x = this.limitSide(state.x,Math.max(state.x,pose.x),state.distance,hull,blockers,WeddingCampus.x+10);
    const distance = this.limitForward(state.distance,Math.max(state.distance,pose.distance),x,hull,blockers);
    state.roadSpeed = state.speed = Math.hypot(x-state.x,distance-state.distance)/step;
    state.x = x;
    state.distance = distance;
    if (!rotationBlocked) state.heading = pose.heading;
    state.tilt *= Math.exp(-7*step);
    if (x>=pose.x-.001 && distance>=pose.distance-.001) {
      arrival.progress = progress;
      if (progress===1) state.roadSpeed = state.speed = 0;
    }
  }

  advanceTo(time) {
    const {state} = this;
    while (this.phase==="driving" && state.elapsed<time) {
      const before = state.elapsed;
      const unlocked = before>=WeddingDrive.nitroUnlock;
      const use = unlocked && state.finishTime===null && (this.shiftHeld || this.touchNitro) && state.reserve>0;
      state.elapsed = Math.min(time,before+.025,
        unlocked ? Infinity : WeddingDrive.nitroUnlock,
        before<this.duration ? this.duration : Infinity,
        use ? before+state.reserve : Infinity);
      const step = state.elapsed-before;
      const burn = use ? step : 0;
      state.reserve = Math.max(0,state.reserve-burn);
      if (state.reserve<1e-9) state.reserve = 0;
      if (burn>0) state.speedUnlocked = true;
      state.boost += (burn/step-state.boost)*(1-Math.exp(-(burn ? 8 : 5)*step));
      state.impact = Math.max(0,state.impact-step);
      const beforeSteering = this.playerHull(state.heading);
      this.updateChase(step,beforeSteering);
      this.spawnTraffic();
      this.moveTraffic(step,beforeSteering);
      const blockers = this.blockers();
      if (state.arrival) {
        this.followDriveway(step,blockers);
        state.chase.z = state.chase.meters-state.distance;
        if (state.arrival.progress===1) this.endDrive();
      } else {
        const hull = this.steer(step,blockers);
        const previousDistance = state.distance;
        this.travel(step,burn,blockers,hull);
        if (state.distance>=state.finishMeters && state.distance>previousDistance) this.enterCampus(previousDistance,before,step);
        else if (state.elapsed<this.duration) this.checkCapture(hull);
      }
    }
  }

  checkCapture(hull) {
    const {state} = this, chase = state.chase;
    if (!chase.visible || state.roadSpeed>=chase.speed-.025) return;
    const gap = state.distance-chase.meters;
    const side = Math.abs(state.x-chase.x);
    const body = WeddingDrive.hulls.chase;
    const playerSide = chase.x>state.x ? hull.right : -hull.left;
    const sameLane = side<playerSide+body.width+.10;
    const nearRear = gap>=0 && gap<hull.rear+body.front+6.2;
    const coastingSlowly = state.speedUnlocked && !this.throttleKeys.size && !this.touchThrottle && state.roadSpeed<15;
    const hadTimeToEscape = state.elapsed>=5.65;
    if (!coastingSlowly && !hadTimeToEscape && !(sameLane && nearRear)) return;
    if (gap < (coastingSlowly ? -35 : -15) || gap>hull.rear+body.front+5.9) return;
    this.phase = "intercepted";
    this.clearControls();
    this.root.inert = true;
    const laneChange = sameLane && gap>=0;
    const detour = laneChange ? state.x+(state.x>0 ? -1 : 1)*(body.width+Math.max(hull.right,-hull.left)+.28) : chase.x;
    this.capture = {start:null,heading:state.heading,speed:state.roadSpeed,x:chase.x,detour,gap:-gap,oldTime:0};
    this.ui.impact.hidden = this.ui.speech.hidden = true;
  }

  async restartAfterCapture() {
    this.phase = "resetting";
    this.track.pause();
    this.root.hidden = true;
    try {
      await this.onCaught();
    } finally {
      this.root.inert = false;
      this.caught.hidden = true;
      this.fade.classList.remove("black");
      this.phase = "idle";
    }
  }

  animateCapture(now) {
    const {state,capture} = this, chase = state.chase;
    if (capture.start===null) capture.start = now;
    const time = Math.max(0,(now-capture.start)/1000);
    const step = Math.min(.075,time-capture.oldTime);
    capture.oldTime = time;
    const smooth = WeddingDrive.smooth;
    const delay = capture.x===capture.detour ? 0 : .30;
    const merge = smooth((time-.70-delay)/.56);
    const braking = smooth((time-.40-delay)/.43);
    const lead = smooth((time-delay)/.68);
    const oldHero = state.distance;
    const hull = this.playerHull(state.heading);
    const body = WeddingDrive.hulls.chase;

    // Keep the red truck out of the player's lane until its rear has cleared the player's nose.
    const gap = capture.gap+(hull.front+body.rear+.62-capture.gap)*lead;
    const oldChase = chase.meters;
    const oldChaseX = chase.x;
    const approach = capture.x+(capture.detour-capture.x)*smooth(time/.30);
    chase.previous = oldChase;
    const chaseHull = {...body,left:-body.width,right:body.width};
    const obstacles = this.trafficBlockers().map(blocker=>({...blocker,car:{meters:blocker.car.meters}}));
    obstacles.push({car:{meters:oldHero},x:state.x,hull:{...hull,width:Math.max(hull.right,-hull.left)}});
    chase.x = this.limitSide(oldChaseX,approach+(state.x-approach)*merge,oldChase,chaseHull,obstacles);
    const roll = capture.speed*(1-braking)*step;
    chase.meters = this.limitForward(oldChase,Math.max(oldChase,oldHero+roll+gap),chase.x,chaseHull,obstacles);
    chase.heading = Math.max(-.09,Math.min(.09,Math.atan2(chase.x-oldChaseX,Math.max(.2,chase.meters-oldChase))));
    if (step>0) this.moveTraffic(step,hull);
    const distance = this.limitForward(oldHero,oldHero+roll,state.x,hull,this.blockers());
    state.distance = distance;
    chase.z = chase.meters-distance;
    chase.lean = 0;
    state.speed = step ? (distance-oldHero)/step : state.speed;
    state.heading = capture.heading*(1-braking);
    state.impact = Math.max(0,1-Math.abs(time-.66)*4)*.88;
    state.boost = 0;
    state.captureView = smooth(time/.38);
    this.updateHud(true);

    if (time>=1.29+delay) this.fade.classList.add("black");
    this.track.volume = Math.min(1,Math.max(0,(1.63+delay-time)/.34));
    if (time>=1.64+delay) this.caught.hidden = false;
    if (time>=3.39+delay) this.restartAfterCapture();
  }

  updateHud(force=false) {
    const {state,ui} = this;
    const seconds = state.elapsed;
    const progress = state.finishTime===null ? state.distance/state.finishMeters : 1;
    if (!force && seconds-this.lastHudTime<.075) return;
    this.lastHudTime = seconds;
    ui.fill.style.transform = `scaleX(${progress})`;
    const pursuit = Math.min(1,state.chase.meters/state.finishMeters);
    ui.chaseFill.style.transform = `scaleX(${pursuit})`;
    ui.chaseFill.parentElement.style.setProperty("--chase-position",`${pursuit*100}%`);
    ui.progress.setAttribute("aria-valuenow",Math.round(progress*100));
    ui.progress.setAttribute("aria-valuetext",`Игрок ${Math.round(progress*100)}%, пахан ${Math.round(pursuit*100)}%`);
    const left = Math.max(1,Math.round(state.finishMeters-state.distance));
    ui.distance.textContent = state.finishTime===null ? `${left.toLocaleString("ru-RU")} м` : this.formatDriveTime(state.finishTime);
    ui.routeLabel.textContent = state.finishTime===null ? "ДО ГАУМАНКИ" : "ТВОЁ ВРЕМЯ";
    ui.speed.textContent = String(Math.round(state.speed*3.6));
    const live = this.phase==="driving" && state.finishTime===null;
    ui.impact.hidden = !live || state.impact<.59;
    ui.impact.textContent = state.speedUnlocked ? "КОНТАКТ · СБРОС СКОРОСТИ" : "КОНТАКТ";
    ui.throttle.classList.toggle("engaged",live && state.speedUnlocked && Boolean(this.throttleKeys.size || this.touchThrottle));
    ui.throttle.setAttribute("aria-disabled",String(!live || !state.speedUnlocked));
    const unlocked = seconds>=WeddingDrive.nitroUnlock;
    if (state.nitro) {
      ui.nitro.disabled = !live || !unlocked || state.reserve<=0;
      ui.nitroAmount.textContent = `${Math.ceil(state.reserve*10-1e-8)/10} с`.replace(".",",");
      ui.nitroFill.style.transform = `scaleX(${state.reserve/state.nitro})`;
      ui.nitroPanel.classList.toggle("boosting",state.boost>.15);
      ui.nitroPanel.classList.toggle("locked",!unlocked);
    }
  }

  frame(now=performance.now()) {
    if (this.phase==="driving") {
      this.advanceTo(this.driveTime(now));
      this.track.volume = Math.min(1,this.state.elapsed/.38);
      this.updateHud();
    }
    if (this.phase==="intercepted") this.animateCapture(now);
    if (this.phase==="resetting") return;
    const {state,ui} = this;
    if (this.phase==="parking") {
      // Keep late frames from skipping the walk or the peak of the doorway light.
      if (this.parkingFrame!==null) this.parkingTime += Math.min(.12,(now-this.parkingFrame)/1000);
      this.parkingFrame = now;
      const time = this.parkingTime;
      this.track.volume = Math.max(0,1-time/1.6);
      if (time>=5.68) {
        this.track.pause();
        this.root.hidden = true;
        this.phase = "idle";
        this.onCampus(this.formatDriveTime(state.finishTime),state.finishPassed);
      } else {
        this.scene.draw(state,WeddingCampus.walkToEntrance(state,time));
      }
      return;
    }
    const point = this.scene.draw(state);
    ui.speech.hidden = this.phase!=="driving" || !point || state.elapsed<3 || state.elapsed>5.65 || state.chase?.lean<.55;
    if (!ui.speech.hidden) ui.speech.style.left = `${Math.max(62,Math.min(this.scene.painter.w-62,point[0]))}px`;
    if (!ui.speech.hidden) ui.speech.style.top = `${Math.max(this.scene.painter.h*.24,point[1]-11)}px`;
  }
};
