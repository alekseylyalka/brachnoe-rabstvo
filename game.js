"use strict";

(() => {
  const byId = id => document.getElementById(id);
  const touchScreen = matchMedia("(any-pointer: coarse)");
  const landscapeScreen = matchMedia("(orientation: landscape)");
  const mobileTelegram = () => {
    const telegram = window.Telegram?.WebApp;
    const platform = telegram?.platform;
    return platform==="ios" || platform==="android" || platform==="android_x" ? telegram : null;
  };
  const isMobileGame = () => touchScreen.matches || Boolean(mobileTelegram());
  const needsLandscape = () => isMobileGame() && !landscapeScreen.matches;
  const gameSuspended = () => document.hidden || needsLandscape();
  document.documentElement.classList.toggle("mobile-game",isMobileGame());
  const audio = byId("track");
  const heavenAudio = byId("heaven-track");
  const campusAudio = byId("campus-track");
  const garageAudio = byId("garage-track");
  const menuAudio = byId("menu-track");
  const ostAudio = byId("ost-player");
  const musicTracks = [audio,heavenAudio,campusAudio];
  const scene = new WeddingScene(byId("scene"));
  const stage = byId("stage");
  const hallEnd = 90;
  const exitLane = 0;
  const playerZ = 5;
  const laneWidth = 2.65;
  const roofHeight = 2.36;
  const truckLength = 11.8;
  const rampLength = 6.8;
  const hallFlightHeight = 3.18;
  const gardenFlightHeight = 6.20;
  const chaseDistance = 2.84;
  const brideRetreatDistance = 4;
  const brideHalfWidth = .83;
  const brideHalfDepth = .58;
  const slideDuration = .75;
  const truckHalfWidth = 1.06;
  const sideHitWindow = 3;
  const laneShiftDuration = .29;
  const guestInterval = 30;
  const guestApproach = 3.5;
  const brideSpeechInterval = 15;
  const brideSpeechDuration = 4;
  const paintingInterval = 5;
  const noteValue = 5000;
  const sausageValue = 2500;
  const magnetDuration = 12;
  const heavenDuration = 20;
  const cloudDuration = .92;
  const returnFadeDuration = .85;
  const lanes = [-1,0,1];
  const smooth = p => {
    const v = Math.min(1,Math.max(0,p));
    return v*v*(3-2*v);
  };
  const trackDuration = 192.329;
  const highwayStart = trackDuration-8;
  const acceleration = .042;
  const speedCurve = (t,initial=11.6) => initial*t + acceleration*t*t/2;
  const number = new Intl.NumberFormat("ru-RU");
  const money = rubles => number.format(rubles) + " ₽";
  const formatCapital = kopecks => money(kopecks/100);
  const formatTime = t => Math.floor(t/60) + ":" + String(Math.floor(t%60)).padStart(2,"0");

  function readLocal(key, fallback) {
    try { return JSON.parse(localStorage.getItem("wedding-run-" + key)) ?? fallback; }
    catch { return fallback; }
  }
  function writeLocal(key, value) {
    try { localStorage.setItem("wedding-run-" + key, JSON.stringify(value)); }
    catch { /* Storage is optional, including when the game is opened from disk. */ }
  }

  const boosts = {
    bottle: { label: "Охота крепкое", message: "Охота крепкое · полёт 10 секунд" },
    hood: { label: "Капюшон", message: "Капюшон · защита от одного столкновения" },
    boots: { label: "Ганжаботы", message: "Ганжаботы · высокий прыжок ↑" },
    magnet: { label: "Магнит", message: "Магнит · три дорожки · 12 секунд" }
  };
  const multiplierLabel = "Множитель капусты";
  const guestMessages = [
    ["Женись КОНСТАНТИН", "Хороша невестка, сынок!", "Маткапитал трать с умом!"],
    ["Сына остановись и поучи билеты!", "Дима в штаны не нагадь!", "Сынок ты опять прогулял Гауманку?"]
  ];
  const brideMessages = [
    "ЖЕНИСЬ НА МНЕ!",
    "ТЫ ЗАЧЕМ СНЯЛ КАПЮШОН?!",
    "ВЕРНИ МАТКАПИТАЛ!",
    "ЧТО ТАМ У ТЕБЯ ЗА ГРЯЗНУЛЯ В ГАУМАНКЕ?!",
    "У МЕНЯ НЕ ВОНЯЛА ЖОПА!",
    "КУПИ БУРГЕР!!!"
  ];
  const escapeVehicles = [
    {id:"aveo",name:"ШЕВРОЛЕ АВЕО",price:0,nitro:1,topSpeed:135,boostSpeed:230},
    {id:"rust",name:"КРЕСТЬЯНСКИЙ",price:1000000,nitro:4,topSpeed:150,boostSpeed:260},
    {id:"sanya",name:"ТЯГАЧ ДЯДЬ САНИ",price:5000000,nitro:6,topSpeed:165,boostSpeed:305},
    {id:"silver",name:"тягач свадебный лимузин",price:10000000,nitro:8,topSpeed:180,boostSpeed:350},
    {id:"diamond",name:"БРИЛЛИАНТОВЫЙ ОКУРОК",price:20000000,nitro:10,topSpeed:200,boostSpeed:400}
  ];
  const ui = Object.fromEntries([
    "overlay","headline","description","eyebrow","primary","primary-label","secondary","results",
    "main-menu","menu-play","menu-story","menu-ost","menu-settings",
    "story","warning","warning-continue","ost","ost-tracks","ost-sound","settings","settings-guide","settings-sound",
    "landscape-required","landscape-fullscreen",
    "runner-pause","runner-guide","runner-controls","pause-resume","pause-restart","pause-menu",
    "result-money","result-distance","result-best","hud","money","distance","boosts-live","clock","progress",
    "chapter-label","route-hall","route-garden","pause","toast","sound","help",
    "guest-speech","bride-speech","route-heaven","route-main","heaven-hud","heaven-clock","heaven-progress",
    "heaven-money","heaven-boosts","cloud-veil","heaven-fine","fine-count","fine-debit","fine-capital",
    "parking-intro","parking-heading","parking-continue",
    "garage","garage-heading","garage-image","garage-name","garage-price","garage-capital","garage-options",
    "garage-buy","garage-status","garage-continue","garage-nitro","garage-speed","garage-sound",
    "teleport-hall","teleport-garden","teleport-yard","teleport-campus"
  ].map(id => [id,byId(id)]));
  const iconSources = Object.fromEntries(Object.entries(WeddingModels.icons).map(([name,icon])=>[name,icon.toDataURL()]));
  ui["cloud-veil"].style.setProperty("--cloud-shape",`url(${scene.heavenCloud.toDataURL()})`);
  document.querySelectorAll("[data-boost-icon]").forEach(image => { image.src = iconSources[image.dataset.boostIcon]; });
  function makeChips(container, names) {
    return Object.fromEntries(names.map(name => {
      const chip = document.createElement("div");
      chip.className = "power-chip";
      chip.title = boosts[name]?.label ?? multiplierLabel;
      chip.hidden = true;
      const icon = document.createElement(name === "multiplier" ? "b" : "img");
      if (name === "multiplier") icon.className = "multiplier-mark";
      else {
        icon.src = iconSources[name] ?? "assets/" + name + ".webp";
        icon.alt = boosts[name].label;
      }
      const value = document.createElement("span");
      chip.append(icon,value);
      container.append(chip);
      return [name,{chip,icon,value}];
    }));
  }
  const chips = makeChips(ui["boosts-live"],Object.keys(boosts));
  const heavenChips = makeChips(ui["heaven-boosts"],["hood","boots","magnet","multiplier"]);

  let mode = "menu";
  let t = 0;
  let startTime = 0;
  let distance = 0;
  let garden = false;
  let runEarningsKopecks = 0;
  let capitalKopecks = 0;
  let adminUnlocked = false;
  let unlimitedGarage = false;
  const adminForms = [...document.querySelectorAll("[data-admin-key]")];
  const adminTools = [...document.querySelectorAll("[data-admin-tool]")];
  const capitalToggles = [...document.querySelectorAll("[data-unlimited-garage]")];
  const acquiredVehicles = new Set();
  let selectedVehicle = null;
  let inspectedVehicle = escapeVehicles.at(-1);
  const previewOnly = new URLSearchParams(location.search).get("preview") === "trucks";
  // The stored record stays in units of 5,000 ₽ for existing saves.
  let best = Math.round(readLocal("best",0)*noteValue*100);
  let unlocked = readLocal("garden",false);
  let lane = 0;
  let x = 0;
  let brideX = 0;
  let brideTarget = 0;
  let brideDistance = -chaseDistance;
  let brideYield = 0;
  let runnerShift = null;
  let brideShift = null;
  let laneChangeDistance = -Infinity;
  let sideRebound = null;
  let lastSideHit = -Infinity;
  let playerY = 0;
  let brideAway = 0;
  let brideSpeech = {slot:0,at:-Infinity,message:""};
  let chaseGap = chaseDistance;
  let velocityY = 0;
  let groundY = 0;
  let grounded = true;
  let gravity = 17.25;
  let jumpStart = -Infinity;
  let landedAt = -Infinity;
  let poweredJump = false;
  let slideUntil = -Infinity;
  let flightUntil = -Infinity;
  let flightSource = -Infinity;
  let bootsUntil = -Infinity;
  let magnetUntil = -Infinity;
  let magnetTrails = [];
  let magnetThrow = null;
  let shield = false;
  let lastWarning = false;
  let showUntil = 0;
  let lastHudUpdate = -Infinity;
  let flash = 0;
  let shake = 0;
  let firstVisible = 0;
  let simulation = [];
  let guests = [];
  let paintings = [];
  let airships = [];
  let processTicket = 0;
  let portal = null;
  let returnFade = null;
  let previousFrame = 0;
  let routeFrame = null;
  let audioWaiting = false;
  let stillFrame = null;
  // A complete local media URL keeps seeking available on static hosts without byte ranges.
  const weddingFile = location.protocol === "file:" ? Promise.resolve(null) :
    fetch(audio.src).then(response => {
      if (!response.ok) throw new Error("Wedding track unavailable");
      return response.blob();
    }).then(blob => {
      const url = URL.createObjectURL(blob);
      if (mode === "menu") audio.src = url;
      return url;
    }).catch(() => null);
  const inHeaven = () => portal?.active === true;
  const isCash = kind => kind === "note" || kind === "roof" || kind === "air";
  const isVehicle = kind => kind === "truck" || kind === "police";

  function scatterBoosts(course, windows, place, initialSpeed) {
    const hazards = course.filter(entity => isVehicle(entity.kind) || ["barrier","ribbon"].includes(entity.kind));
    const groundRewards = course.filter(entity => entity.kind === "note" || (entity.kind === "sausage" && entity.y < 1));
    const placed = [];
    for (const [kind,from,to] of windows) {
      if (kind==="leaf" && Math.random()>=.5) continue;
      const candidates = [];
      for (let at=from+Math.random()*.12;at<=to;at+=.12) {
        if (placed.some(other => {
          if (Math.abs(other.at-at)<.60) return true;
          if (kind==="leaf" && other.kind==="bottle") return at>other.at && at<other.at+10.35;
          if (kind==="bottle" && other.kind==="leaf") return other.at>at && other.at<at+10.35;
          return false;
        })) continue;
        const before = speedCurve(at-.36,initialSpeed);
        const after = speedCurve(at+.30,initialSpeed);
        for (const lane of lanes) {
          if (hazards.some(obstacle => obstacle.lane===lane &&
              obstacle.position-(obstacle.ramp || .15)<after &&
              obstacle.position+(obstacle.length ?? .50)>before)) continue;
          if (groundRewards.some(item => item.lane===lane && Math.abs(item.t-at)<.20)) continue;
          candidates.push({at,lane});
        }
      }
      if (!candidates.length) continue;
      const {at,lane} = candidates[Math.floor(Math.random()*candidates.length)];
      placed.push({kind,at});
      place(kind,at,lane);
    }
  }

  function makeCourse() {
    const course = [];
    const windows = [["magnet",3.48,3.98],["bottle",6.45,7.20],["leaf",17.80,18.35],
      ["boots",18.78,19.30]];
    const safePattern = [0,-1,0,1,1,0,-1,0,-1,1,0,1];
    let trucks = 0;
    const add = (kind, time, path, extra = {}) => course.push({
      kind, t:time, lane:path, position:speedCurve(time),
      y:.83, used:false, ...extra
    });
    const note = (time,path) => add("note",time,path);
    const pickup = (kind,time,path) => {
      const extra = kind==="multiplier" ? {y:1.32,factor:Math.random()<.20?5:2} : {y:1.10};
      add(kind,time,path,extra);
      if (kind === "bottle") {
        const height=time<hallEnd?hallFlightHeight:gardenFlightHeight;
        for (const [airLane,start,count] of [[-1,.75,3],[0,3.55,4],[1,7.30,3]]) {
          for (let i=0;i<count;i++) add("air",time+start+i*.87,airLane,{y:height+.50,flight:time});
        }
      }
    };
    const truck = (time,path,brand,ramp=false) => {
      add("truck",time,path,{brand,length:truckLength,ramp:ramp?rampLength:0});
      const offsets = trucks++%2===0 ? [.30,.58] : [.45];
      for (const offset of offsets) add("roof",time+offset,path,{y:roofHeight+.80});
    };

    for (let i=0;i<3;i++) note(1.05 + i*1.08,0);
    truck(4.2,-1,0,true);
    truck(5,1,1);

    let i=0;
    for (let time=10.2;time<highwayStart-1.2;time+=time<90?2.38:2.20) {
      if (time>84.7 && time<93.1) continue;
      const safe = safePattern[i%safePattern.length];
      const blocked = lanes.filter(path => path !== safe);
      const pattern = i % 7;
      if (pattern !== 3) truck(time,blocked[i%2],(i+1)%4,pattern===0 || pattern===4);
      if (i===4) truck(time-.09,safe,(i+2)%4);
      if (i>2 && (pattern === 0 || pattern === 5)) {
        truck(time+.07,blocked[1-i%2],(i+2)%4,pattern===5);
      } else if (pattern === 1 || pattern === 3) {
        add("barrier",time,blocked[1-i%2]);
      } else if (pattern === 2 || pattern === 6) {
        add("ribbon",time+.10,blocked[1-i%2],{top:2.18});
      }
      const offsets = i%2===0 ? [-.67,.42] : [-.70,0,.70];
      for (const offset of offsets) note(time+offset,i===4?0:safe);
      if (i % 4 === 2) {
        const kind = ["hood","boots","bottle"][Math.floor(i/4)%3];
        if (kind!=="bottle" || time<78 || (time>91 && time<highwayStart-12)) {
          windows.push([kind,time+.78,time+1.73]);
        }
      }
      if (i%16===5) {
        windows.push(["multiplier",time+.78,time+1.73]);
      } else if (i%16===9) {
        windows.push(["magnet",time+.78,time+1.73]);
      } else if (i%18===13) {
        windows.push(["leaf",time+.78,Math.min(time+6.2,time<hallEnd?hallEnd-1.6:trackDuration-2)]);
      }
      i++;
    }
    for (let time=85.7;time<90;time+=.84) note(time,exitLane);
    add("exit",hallEnd,exitLane);
    for (let i=1;i<=3;i++) note(90.25+i*.70,exitLane);
    scatterBoosts(course,windows.map(([kind,from,to])=>[kind,from,Math.min(to,highwayStart-.6)]),pickup);
    return course.sort((a,b) => a.position-b.position);
  }

  function makeHeavenCourse(initialSpeed) {
    const course = [];
    const add = (kind,t,lane,extra) => course.push({kind,t,lane,position:speedCurve(t,initialSpeed),
      y:.83,used:false,...extra});
    const rows = [
      [2.38,1,[[0,"skoda"]]],
      [4.18,0,[[1,"haval"]]],
      [5.85,-1,[[0,"jeep"],[1,"skoda"]]],
      [7.60,-1,[[0,"bus"]]],
      [9.55,0,[[-1,"haval"],[1,"jeep"]]],
      [11.18,1,[[-1,"skoda"],[0,"haval"]]],
      [12.83,0,[[1,"skoda"]]],
      [14.48,-1,[[0,"jeep"]]],
      [16.13,-1,[[1,"bus"]]],
      [17.95,0,[[-1,"skoda"]]],
      [19.40,0,[[1,"haval"]]]
    ];
    for (const [at,safe,vehicles] of rows) {
      for (const [path,brand] of vehicles) {
        add("police",at,path,{brand,...WeddingModels.policeDimensions[brand]});
      }
      for (const offset of [-.66,-.38,-.10,.18]) add("sausage",at+offset,safe);
    }
    scatterBoosts(course,[["hood",1.10,4.24],["boots",2.35,5.66],
      ["magnet",4.55,7.54],["multiplier",10.4,17.4]],
      (kind,at,lane)=>add(kind,at,lane,kind==="multiplier"?{y:1.32,factor:2}:{y:1.10}),initialSpeed);
    const bus = WeddingModels.policeDimensions.bus;
    for (const at of [7.58,7.76,7.94,8.12]) {
      add("sausage",at,0,{y:bus.height+.82});
    }
    return course.sort((a,b)=>a.position-b.position);
  }

  const menuCourse = makeCourse();
  function findGardenFlightGaps(course) {
    return course.filter(item=>item.kind==="bottle" && item.t>=hallEnd).flatMap(({t:launch})=>[
      [speedCurve(launch-.2)+playerZ,speedCurve(launch+.58)+playerZ],
      [speedCurve(launch+9.98)+playerZ,speedCurve(launch+10.86)+playerZ]
    ]);
  }
  let gardenFlightGaps=findGardenFlightGaps(menuCourse);

  function makeGuests(from) {
    const appearances = [];
    let person = Math.floor(Math.random()*guestMessages.length);
    for (let time=from+guestInterval;time+guestApproach<highwayStart;time+=guestInterval) {
      const messages = guestMessages[person];
      const side = Math.random()<.5 ? -1 : 1;
      appearances.push({
        time, person, side, x:side*(5.48+Math.random()*.42),
        position:speedCurve(time+guestApproach)+8+Math.random()*3,
        message:messages[Math.floor(Math.random()*messages.length)], garden:time>=hallEnd
      });
      person = (person+1)%guestMessages.length;
    }
    return appearances;
  }

  function makePaintings() {
    const firstSide = Math.random()<.5 ? -1 : 1;
    return WeddingScene.pickPhotos(Math.ceil(hallEnd/paintingInterval)-1).map((image,i)=>({
      side:firstSide*(i%2 ? -1 : 1),image,position:speedCurve((i+1)*paintingInterval)+21.5
    }));
  }

  function makeAirships() {
    const interval = (highwayStart-hallEnd)/4;
    const firstSide = Math.random()<.5 ? -1 : 1;
    return WeddingScene.pickPhotos(4).map((image,style)=>{
      const start = hallEnd+1.4+style*interval;
      return {image,style,start,end:start+interval-1.8,side:firstSide*(style%2 ? -1 : 1)};
    });
  }

  function syncTelegramSwipes() {
    const telegram = window.Telegram?.WebApp;
    if (!telegram?.isVersionAtLeast("7.7")) return;

    const allowSwipes = mode !== "playing";
    if (telegram.isVerticalSwipesEnabled === allowSwipes) return;
    if (allowSwipes) telegram.enableVerticalSwipes();
    else telegram.disableVerticalSwipes();
  }

  function setMode(next) {
    if (mode === "menu" && next !== "menu") {
      menuAudio.pause();
      menuAudio.currentTime = 0;
    }
    if (mode === "campus" && next !== "campus") campusAudio.pause();
    if (mode === "garage" && next !== "garage") {
      garageAudio.pause();
      garageAudio.currentTime = 0;
    }
    const enteringPause = next === "paused" && mode !== "paused";
    if (next !== mode) routeFrame = null;
    stillFrame = null;
    mode = next;
    syncTelegramSwipes();
    const atParking = next === "parking" || next === "garage";
    const driving = next === "driving";
    const atCampus = next === "campus";
    ui.hud.hidden = next !== "playing";
    ui["main-menu"].hidden = next !== "menu";
    ui["runner-pause"].hidden = next !== "paused";
    ui.help.hidden = next !== "playing" && next !== "paused";
    ui.overlay.hidden = next !== "loading" && next !== "lost" && next !== "error";
    ui["parking-intro"].hidden = next !== "parking";
    ui.garage.hidden = next !== "garage";
    stage.classList.toggle("parking-open",atParking);
    stage.classList.toggle("driving-open",driving);
    stage.classList.toggle("campus-open",atCampus);
    scene.canvas.setAttribute("aria-label",driving ? "Ночная трасса с четырьмя полосами" :
      atCampus ? "Коридор Гауманки" : "Свадебная трасса с тремя дорожками");
    ui.overlay.classList.toggle("finished",next === "lost");
    ui.results.hidden = next !== "lost";
    ui.secondary.hidden = next !== "lost" || !unlocked;
    ui["pause-resume"].disabled = false;
    if (enteringPause) {
      ui["runner-pause"].scrollTop = 0;
      ui["pause-resume"].focus({preventScroll:true});
    }
    ui.primary.hidden = next === "loading";
    if (next !== "playing") ui.toast.hidden = true;
    if (next !== "playing") ui["guest-speech"].hidden = ui["bride-speech"].hidden = true;
    updateRoute();
    if (next === "menu") playMenuMusic();
    if (ui.overlay.hidden) return;

    const stateCopy = {
      loading: ["СВАДЕБНЫЙ РАННЕР","Готовим","забег","Загружаем музыку и оформление трассы.",""],
      lost: ["ЗАБЕГ ОКОНЧЕН","Невеста","догнала",lossReason,"Ещё раз"],
      error: ["МУЗЫКА НЕ ЗАГРУЗИЛАСЬ","Не удалось","начать забег","Проверь, что файл assets/wedding.mp3 на месте, и попробуй ещё раз.","Повторить"]
    }[next];
    ui.eyebrow.querySelector("span").textContent = stateCopy[0];
    ui.headline.replaceChildren(document.createTextNode(stateCopy[1]));
    if (stateCopy[2]) {
      const line = document.createElement("span");
      line.textContent = stateCopy[2];
      ui.headline.append(line);
    }
    ui.description.textContent = stateCopy[3];
    ui["primary-label"].textContent = stateCopy[4];

    if (next === "lost") {
      ui["result-money"].textContent = formatCapital(runEarningsKopecks);
      ui["result-distance"].textContent = number.format(Math.floor(distance-speedCurve(startTime))) + " м";
      ui["result-best"].textContent = formatCapital(best);
    }
  }

  function changeCapital(kopecks) {
    capitalKopecks = Math.max(0,capitalKopecks+kopecks);
  }

  function earnCapital(kopecks) {
    runEarningsKopecks += kopecks;
    if (kopecks) changeCapital(kopecks);
  }

  const vehicleArtwork = vehicle => `assets/garage/${vehicle.id}.jpg?v=wedding-limo`;
  const vehiclePrice = price => price === 0 ? "БЕСЦЕННО" : money(price);
  const vehicleNitro = vehicle => vehicle.nitro ? `Нитро · ${vehicle.nitro} с` : "Без нитро";
  const vehicleSpeed = vehicle => vehicle.nitro ? `${vehicle.topSpeed} км/ч · ${vehicle.boostSpeed} с нитро` : `${vehicle.topSpeed} км/ч`;

  const vehicleButtons = escapeVehicles.map(vehicle => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "truck-option";
    button.dataset.truck = vehicle.id;
    const frame = document.createElement("picture");
    frame.className = "truck-photo-frame";
    const image = document.createElement("img");
    image.src = vehicleArtwork(vehicle);
    image.alt = "";
    image.loading = "lazy";
    const name = document.createElement("strong");
    name.textContent = vehicle.name;
    const value = document.createElement("span");
    const nitro = document.createElement("small");
    nitro.textContent = vehicleNitro(vehicle);
    const speed = document.createElement("small");
    speed.textContent = vehicleSpeed(vehicle);
    frame.append(image);
    button.append(frame,name,value,nitro,speed);
    button.addEventListener("click",() => {
      if (mode !== "garage") return;
      inspectedVehicle = vehicle;
      renderGarage();
    });
    ui["garage-options"].append(button);
    return {vehicle,button,value};
  });

  function renderGarage() {
    const vehicle = inspectedVehicle;
    const free = vehicle.price === 0;
    const owned = acquiredVehicles.has(vehicle.id);
    const selected = selectedVehicle === vehicle.id;
    const shortfall = unlimitedGarage ? 0 : Math.max(0,vehicle.price*100-capitalKopecks);
    const image = ui["garage-image"];
    const src = vehicleArtwork(vehicle);
    if (image.getAttribute("src") !== src) image.src = src;
    image.alt = vehicle.name;
    setText(ui["garage-name"],vehicle.name);
    setText(ui["garage-price"],vehiclePrice(vehicle.price));
    setText(ui["garage-nitro"],vehicleNitro(vehicle));
    setText(ui["garage-speed"],vehicleSpeed(vehicle));
    setText(ui["garage-capital"],unlimitedGarage ? "∞ ₽" : formatCapital(capitalKopecks));
    const buy = ui["garage-buy"];
    buy.disabled = previewOnly || selected || (!owned && !!shortfall);
    ui["garage-continue"].disabled = !acquiredVehicles.has(selectedVehicle);
    const action = free ? "Выбрать бесплатно" : owned ? "Выбрать тягач" : "Купить и выбрать";
    setText(buy,selected ? (free ? "Машина выбрана" : "Тягач выбран") : action);
    const status = previewOnly ? "Выбор откроется после забега." :
      selected ? "Можно продолжить." : owned && !free ? "Этот тягач уже куплен." :
      shortfall ? `Не хватает ${formatCapital(shortfall)}` : "";
    setText(ui["garage-status"],status);
    for (const {vehicle:option,button,value} of vehicleButtons) {
      button.setAttribute("aria-pressed",String(option===vehicle));
      const paid = option.price>0 && acquiredVehicles.has(option.id);
      const label = paid ? (selectedVehicle === option.id ? "Выбран" : "Куплен") : vehiclePrice(option.price);
      setText(value,label);
    }
  }

  function enterParking() {
    setMode("parking");
    ui["parking-heading"].focus({preventScroll:true});
  }

  function playMenuMusic() {
    if (mode === "menu" && !ui.ost.open && !gameSuspended() && menuAudio.paused) {
      menuAudio.play().catch(() => {});
    }
  }

  function playGarageMusic() {
    if (mode === "garage" && drive.phase === "idle" && !gameSuspended()) {
      garageAudio.play().catch(() => {});
    }
  }

  function openGarage() {
    if (mode !== "parking") return;
    inspectedVehicle = escapeVehicles.at(-1);
    renderGarage();
    setMode("garage");
    playGarageMusic();
    ui["garage-heading"].focus({preventScroll:true});
  }

  function updateRoute() {
    const heaven = inHeaven();
    ui["route-main"].hidden = heaven;
    ui["route-heaven"].hidden = !heaven;
    ui["heaven-hud"].hidden = !heaven;
    stage.classList.toggle("heaven",heaven);
    stage.classList.toggle("sunlit",garden);
    for (const [key, current] of [["hall",!garden],["garden",garden]]) {
      const element = ui["route-"+key];
      element.classList.toggle("current",current);
      if (current) element.setAttribute("aria-current","step");
      else element.removeAttribute("aria-current");
    }
    ui["chapter-label"].textContent = garden ? "Свадебный сад" : "Свадебный зал";
  }

  function updateSound(muted = readLocal("muted",false)) {
    for (const track of musicTracks) track.muted = muted;
    garageAudio.muted = menuAudio.muted = ostAudio.muted = muted;
    drive.setMuted(muted);
    applyMusicMix();
    const label = muted ? "Включить звук" : "Выключить звук";
    for (const button of [ui.sound,campusSound,ui["garage-sound"],ui["settings-sound"],ui["ost-sound"]]) {
      button.setAttribute("aria-pressed",String(muted));
      button.setAttribute("aria-label",label);
      button.title = label;
    }
  }

  function toggleSound() {
    const muted = !audio.muted;
    writeLocal("muted",muted);
    updateSound(muted);
  }

  let musicContext;
  let musicGains;
  let musicMix = [1,0,0];

  function applyMusicMix() {
    for (const [index,track] of musicTracks.entries()) {
      if (musicGains) {
        musicGains[index].gain.setTargetAtTime(track.muted ? 0 : musicMix[index],musicContext.currentTime,.018);
      } else {
        track.volume = musicMix[index];
      }
    }
  }

  function mixMusic(wedding, heaven, campus = 0) {
    if (musicMix[0] === wedding && musicMix[1] === heaven && musicMix[2] === campus) return;
    musicMix = [wedding,heaven,campus];
    applyMusicMix();
  }

  function unlockMusic() {
    if (!musicContext && window.AudioContext) {
      musicContext = new AudioContext();
      musicGains = musicTracks.map(track => {
        const gain = musicContext.createGain();
        gain.gain.value = 0;
        track.volume = 1;
        musicContext.createMediaElementSource(track).connect(gain);
        gain.connect(musicContext.destination);
        return gain;
      });
      applyMusicMix();
    }
    if (musicContext?.state === "suspended") musicContext.resume().catch(() => {});
  }

  function pauseMusic() {
    for (const track of musicTracks) track.pause();
  }

  function playCampusDebit() {
    if (campusAudio.muted) return;
    unlockMusic();
    if (!musicContext) return;
    const now = musicContext.currentTime+.01;
    for (const [delay,from,to,volume] of [[0,710,441,.052],[.074,480,290,.037]]) {
      const tone = musicContext.createOscillator();
      const gain = musicContext.createGain();
      const start = now+delay;
      tone.type = "triangle";
      tone.frequency.setValueAtTime(from,start);
      tone.frequency.exponentialRampToValueAtTime(to,start+.088);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(volume,start+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,start+.105);
      tone.connect(gain);
      gain.connect(musicContext.destination);
      tone.onended = ()=>{
        tone.disconnect();
        gain.disconnect();
      };
      tone.start(start);
      tone.stop(start+.11);
    }
  }

  function playDormTrombone() {
    if (campusAudio.muted) return;
    unlockMusic();
    if (!musicContext) return;
    const harmonics = new Float32Array([0,1,.57,.38,.25,.16,.105,.063,.035]);
    const brass = musicContext.createPeriodicWave(new Float32Array(harmonics.length),harmonics);
    const now = musicContext.currentTime+.008;
    const notes = [
      {delay:0,pitch:174.61,release:171,duration:.26},
      {delay:.30,pitch:164.81,release:161,duration:.26},
      {delay:.60,pitch:155.56,release:152,duration:.27},
      {delay:.91,pitch:146.83,release:123.47,duration:.83}
    ];
    for (const {delay,pitch,release,duration} of notes) {
      const tone = musicContext.createOscillator();
      const bell = musicContext.createBiquadFilter();
      const volume = musicContext.createGain();
      const vibrato = musicContext.createOscillator();
      const depth = musicContext.createGain();
      const start = now+delay, end = start+duration;

      tone.setPeriodicWave(brass);
      tone.frequency.setValueAtTime(pitch*.972,start);
      tone.frequency.exponentialRampToValueAtTime(pitch,start+.035);
      tone.frequency.setValueAtTime(pitch,end-duration*.55);
      tone.frequency.exponentialRampToValueAtTime(release,end);
      bell.type = "lowpass";
      bell.frequency.setValueAtTime(680,start);
      bell.frequency.exponentialRampToValueAtTime(1520,start+.058);
      bell.frequency.exponentialRampToValueAtTime(510,end);
      volume.gain.setValueAtTime(.0001,start);
      volume.gain.exponentialRampToValueAtTime(.24,start+.031);
      volume.gain.exponentialRampToValueAtTime(.14,end-.115);
      volume.gain.exponentialRampToValueAtTime(.0001,end);

      vibrato.frequency.value = 5.2;
      depth.gain.setValueAtTime(0,start);
      depth.gain.linearRampToValueAtTime(duration>.5 ? 24 : 10,end-.08);
      vibrato.connect(depth).connect(tone.detune);
      tone.connect(bell).connect(volume).connect(musicContext.destination);
      tone.onended = ()=>{
        tone.disconnect();
        bell.disconnect();
        volume.disconnect();
        vibrato.disconnect();
        depth.disconnect();
      };
      tone.start(start);
      vibrato.start(start);
      tone.stop(end);
      vibrato.stop(end);
    }
  }

  let lossReason = "";

  function resetMotion(time,path) {
    t = time;
    distance = speedCurve(t);
    lane = path;
    x = brideX = brideTarget = lane * laneWidth;
    brideDistance = distance-chaseDistance;
    brideYield = 0;
    runnerShift = brideShift = null;
    laneChangeDistance = lastSideHit = -Infinity;
    sideRebound = null;
    playerY = groundY = velocityY = 0;
    brideAway = 0;
    chaseGap = chaseDistance;
    grounded = true;
    poweredJump = false;
    gravity = 17.25;
    jumpStart = landedAt = slideUntil = flightUntil = flightSource = bootsUntil = magnetUntil = -Infinity;
    magnetTrails = [];
    magnetThrow = null;
    showUntil = flash = shake = 0;
    lastHudUpdate = -Infinity;
  }

  function clearPortal() {
    portal = null;
    returnFade = null;
    ui["cloud-veil"].hidden = ui["heaven-fine"].hidden = true;
  }

  function placeOnRoute(time) {
    startTime = time;
    garden = time >= hallEnd;
    brideSpeech = {slot:0,at:-Infinity,message:""};
    lastWarning = garden;
    resetMotion(time,garden ? exitLane : 0);
    firstVisible = simulation.findIndex(entity => entity.t > time);
    if (firstVisible < 0) firstVisible = simulation.length;
  }

  function reset(fromGarden) {
    clearPortal();
    capitalKopecks = 0;
    runEarningsKopecks = 0;
    shield = false;
    acquiredVehicles.clear();
    selectedVehicle = null;
    simulation = makeCourse();
    placeOnRoute(fromGarden ? hallEnd : 0);
    gardenFlightGaps = findGardenFlightGaps(simulation);
    guests = makeGuests(startTime);
    paintings = fromGarden ? [] : makePaintings();
    airships = makeAirships();
  }

  async function begin(fromGarden = false) {
    const ticket = ++processTicket;
    pauseMusic();
    if (audio.error) audio.load();
    reset(fromGarden);
    mixMusic(0,0);
    unlockMusic();
    heavenAudio.currentTime = 0;
    // Authorize the second media element in the same input event that starts the run.
    heavenAudio.play().then(() => {
      if (ticket === processTicket && !portal) heavenAudio.pause();
    }).catch(() => {});
    setMode("loading");
    updateHud();
    try {
      audio.currentTime = startTime;
      const initialPlay = audio.play();
      initialPlay.catch(() => {});
      const prepared = await weddingFile;
      if (ticket !== processTicket) return;
      let playing = initialPlay;
      if (prepared && audio.src !== prepared) {
        audio.pause();
        audio.src = prepared;
        audio.currentTime = startTime;
        playing = audio.play();
      }
      await Promise.all([playing,scene.paintingsReady]);
      if (ticket !== processTicket) return;
      if (Math.abs(audio.currentTime-startTime)>.25) audio.currentTime = startTime;
      if (audio.seeking) {
        await new Promise((resolve,reject) => {
          const cleanup = () => {
            clearTimeout(timeout);
            audio.removeEventListener("seeked",complete);
            audio.removeEventListener("error",failed);
          };
          const complete = () => { cleanup(); resolve(); };
          const failed = () => { cleanup(); reject(new Error("Audio seek failed")); };
          const timeout = setTimeout(failed,5000);
          audio.addEventListener("seeked",complete);
          audio.addEventListener("error",failed);
        });
      }
      if (ticket !== processTicket) return;
      if (Math.abs(audio.currentTime-startTime)>.85) throw new Error("Wrong audio position");
      mixMusic(1,0);
      if (gameSuspended()) {
        pauseMusic();
        setMode("paused");
      } else {
        setMode("playing");
      }
    } catch {
      if (ticket === processTicket) {
        pauseMusic();
        setMode("error");
      }
    }
  }

  function pause() {
    if (mode !== "playing") return;
    pauseMusic();
    setMode("paused");
    ui["heaven-fine"].hidden = true;
    ui["cloud-veil"].hidden = true;
  }

  function teleport(time, toYard = false) {
    if (mode !== "paused") return;
    ++processTicket;
    pauseMusic();
    if (portal) simulation = portal.route.simulation;
    clearPortal();
    heavenAudio.currentTime = 0;
    mixMusic(1,0);

    // Restore obstacles on a rewind while leaving collected rewards spent.
    for (const entity of simulation) {
      if (isVehicle(entity.kind) || entity.kind === "exit") entity.used = false;
      if (entity.shielded) entity.shielded = false;
    }
    placeOnRoute(time);
    if (!garden && !paintings.length) {
      paintings = makePaintings();
      guests = [...makeGuests(0).filter(guest => !guest.garden),...guests];
    }
    audio.currentTime = time;
    if (toYard) enterParking();
    else setMode("paused");
    updateHud();
  }

  async function resume() {
    const button = ui["pause-resume"];
    if (mode !== "paused" || button.disabled || gameSuspended()) return;
    button.disabled = true;
    const ticket = ++processTicket;
    unlockMusic();
    try {
      const phase = portal?.phase;
      const wedding = !phase || phase === "enter" ? audio.play() : null;
      if ((phase && phase !== "fine") || returnFade?.heaven) heavenAudio.play().catch(() => {});
      await wedding;
      if (ticket !== processTicket) return;
      if (gameSuspended()) {
        pauseMusic();
        button.disabled = false;
        return;
      }
      setMode("playing");
      if (phase === "fine") ui["heaven-fine"].hidden = false;
    } catch {
      if (ticket === processTicket) setMode("error");
    }
  }

  function notify(message, seconds = 2.2) {
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    showUntil = t+seconds;
  }

  function enterHeaven() {
    routeFrame = null;
    const route = {t,distance,lane,x,brideX,brideTarget,brideDistance,brideYield,runnerShift,brideShift,
      laneChangeDistance,sideRebound,lastSideHit,playerY,brideAway,chaseGap,velocityY,groundY,
      grounded,gravity,jumpStart,landedAt,poweredJump,slideUntil,flightUntil,flightSource,bootsUntil,magnetUntil,
      magnetTrails,magnetThrow,firstVisible,simulation};
    returnFade = null;
    mixMusic(1,0);
    heavenAudio.currentTime = 0;
    heavenAudio.play().catch(() => {});
    ui.toast.hidden = true;
    portal = {route,capital:capitalKopecks,initialSpeed:11.6+acceleration*t,phase:"enter",elapsed:0,active:false,
      sausages:0,multipliedSausages:0,factor:1};
  }

  function heavenReward(visit) {
    return (visit.sausages+visit.multipliedSausages*(visit.factor-1))*sausageValue;
  }

  function leaveHeaven(caught) {
    if (portal.phase !== "run") return;
    portal.phase = "exit";
    portal.elapsed = 0;
    portal.caught = caught;
    if (caught) {
      portal.debit = Math.floor(portal.capital/2);
      runEarningsKopecks -= Math.floor(runEarningsKopecks/2);
      changeCapital(-portal.debit);
    } else {
      earnCapital(heavenReward(portal)*100);
    }
    ui.toast.hidden = true;
    updateHud();
  }

  function restoreRoute() {
    ({t,distance,lane,x,brideX,brideTarget,brideDistance,brideYield,runnerShift,brideShift,
      laneChangeDistance,sideRebound,lastSideHit,playerY,brideAway,chaseGap,velocityY,groundY,
      grounded,gravity,jumpStart,landedAt,poweredJump,slideUntil,flightUntil,flightSource,bootsUntil,magnetUntil,
      magnetTrails,magnetThrow,firstVisible,simulation} = portal.route);
    portal.active = false;
    flash = shake = 0;
    lastHudUpdate = -Infinity;
    updateRoute();
    updateHud();
  }

  function resumeRoute() {
    const visit = portal;
    const ticket = processTicket;
    portal = null;
    routeFrame = null;
    ui["heaven-fine"].hidden = true;
    if (!visit.caught) notify(`Рай · +${money(heavenReward(visit))}`,2.8);
    returnFade = {elapsed:0,heaven:!visit.caught};
    mixMusic(0,returnFade.heaven ? .7 : 0);
    audio.play().catch(() => {
      if (ticket === processTicket && mode === "playing" && !portal) pause();
    });
  }

  function updateFine(visit) {
    const remaining = Math.max(0,3-visit.elapsed);
    setText(ui["fine-count"],String(Math.ceil(remaining)));
    const capital = formatCapital(fineCapital(visit));
    setText(ui["fine-capital"],capital);
    setText(ui.money,capital);
  }

  function fineCapital(visit) {
    const amount = visit.phase === "fine" ? smooth(visit.elapsed/2.45) : 0;
    return visit.capital-Math.round(visit.debit*amount);
  }

  function stepPortal(dt) {
    const visit = portal;
    const {phase} = visit;
    if (phase === "run") {
      advance(Math.min(heavenDuration,t+dt));
      if (visit.phase === "run" && t>=heavenDuration) leaveHeaven(false);
      return;
    }
    visit.elapsed += dt;
    if (phase === "fine") {
      updateFine(visit);
      if (visit.elapsed>=3) resumeRoute();
      return;
    }

    const progress = Math.min(1,visit.elapsed/cloudDuration);
    const eased = smooth(progress);
    if (phase === "enter") mixMusic(1-eased,eased);
    else mixMusic(0,1-eased*(visit.caught ? 1 : .3));
    const veil = ui["cloud-veil"];
    veil.hidden = false;
    veil.style.opacity = smooth(Math.min(progress/.39,(1-progress)/.39));
    veil.style.transform = `translateX(${(progress-.5)*30}%)`;
    if (progress>=.5) {
      if (phase === "enter" && !visit.active) {
        visit.active = true;
        resetMotion(0,0);
        simulation = makeHeavenCourse(visit.initialSpeed);
        firstVisible = 0;
        updateRoute();
        updateHud();
      } else if (phase === "exit" && visit.active) restoreRoute();
    }
    if (progress<1) return;
    veil.hidden = true;
    if (phase === "enter") {
      audio.pause();
      for (let i=0;i<audio.seekable.length;i++) {
        if (visit.route.t>=audio.seekable.start(i) && visit.route.t<audio.seekable.end(i)) {
          audio.currentTime = visit.route.t;
          break;
        }
      }
      visit.phase = "run";
    } else if (visit.caught) {
      heavenAudio.pause();
      visit.phase = "fine";
      visit.elapsed = 0;
      setText(ui["fine-debit"],`Списано ${formatCapital(visit.debit)}`);
      updateFine(visit);
      ui["heaven-fine"].hidden = false;
    } else resumeRoute();
  }

  function collect({kind,factor,t:at}) {
    if (isCash(kind)) {
      earnCapital(noteValue*100);
      return;
    }
    if (kind === "sausage") {
      portal.sausages++;
      return;
    }
    if (kind === "leaf") {
      enterHeaven();
      return;
    }
    flash = .23;
    if (kind === "multiplier") {
      if (inHeaven()) {
        portal.factor = factor;
        portal.multipliedSausages = portal.sausages;
        notify(`${multiplierLabel} · ×${factor} к собранным сосискам`);
        return;
      }
      earnCapital(runEarningsKopecks*(factor-1));
      notify(`${multiplierLabel} · ×${factor} · ${formatCapital(runEarningsKopecks)}`);
      return;
    }
    if (kind === "bottle") {
      flightUntil = t+10;
      flightSource = at;
      slideUntil = jumpStart = -Infinity;
      gravity = 17.25;
      poweredJump = false;
    } else if (kind === "hood") {
      shield = true;
    } else if (kind === "boots") {
      bootsUntil = t+20;
    } else if (kind === "magnet") {
      magnetUntil = t+magnetDuration;
      magnetThrow = null;
    }
    const message = inHeaven() && kind === "magnet" ? "Магнит · сосиски с трёх дорожек" : boosts[kind].message;
    notify(message);
  }

  function absorbCollision(entity) {
    if (!shield) return false;
    shield = false;
    entity.shielded = true;
    shake = .30;
    flash = .49;
    notify("Капюшон спас от столкновения");
    return true;
  }

  function finish(won, reason = "") {
    if (mode !== "playing") return;
    pauseMusic();
    best = Math.max(runEarningsKopecks,best);
    writeLocal("best",best/(noteValue*100));
    if (won) {
      enterParking();
    } else {
      lossReason = reason;
      setMode("lost");
    }
  }

  function enterGarden() {
    garden = true;
    unlocked = true;
    writeLocal("garden",true);
    updateRoute();
    flash = .64;
    notify("Свадебный сад",2.8);
  }

  function truckSurface(entity, position) {
    const gap = entity.position-position;
    const height = entity.height ?? roofHeight;
    if (gap <= .19 && gap >= -(entity.length ?? truckLength)) return height;
    if (entity.ramp && gap > .19 && gap < entity.ramp) {
      return height*(entity.ramp-gap)/(entity.ramp-.19);
    }
    return 0;
  }

  function besideTruck(truck, position) {
    return position >= truck.position && position <= truck.position+(truck.length ?? truckLength);
  }

  function shift(from, to, duration) {
    return {from, to, start:t, duration, follow:true};
  }

  function shiftProgress(move) {
    return smooth((t-move.start)/move.duration);
  }

  function shiftLean(move) {
    return move ? Math.sin(Math.PI*shiftProgress(move))*Math.sign(move.to-move.from) : 0;
  }

  function updateRunnerLane() {
    if (runnerShift) {
      const progress = shiftProgress(runnerShift);
      x = progress === 1 ? runnerShift.to : runnerShift.from+(runnerShift.to-runnerShift.from)*progress;
      if (runnerShift.follow && progress >= .8) {
        brideTarget = runnerShift.to;
        runnerShift.follow = false;
      }
      if (progress === 1) runnerShift = null;
    }
  }

  function slidePose() {
    return smooth((slideDuration-(slideUntil-t))/.12)*smooth((slideUntil-t)/.18);
  }

  function bridePathClear(fromX, toX, fromDistance, toDistance) {
    const left = Math.min(fromX,toX)-brideHalfWidth;
    const right = Math.max(fromX,toX)+brideHalfWidth;
    const near = Math.min(fromDistance,toDistance)-brideHalfDepth;
    const far = Math.max(fromDistance,toDistance)+brideHalfDepth;
    for (let i=firstVisible;i<simulation.length;i++) {
      const entity = simulation[i];
      if (entity.position > far+rampLength) break;
      const truck = isVehicle(entity.kind);
      if (entity.used || (!truck && entity.kind!=="barrier" && entity.kind!=="ribbon")) continue;
      const width = truck ? (entity.halfWidth ?? 1.16) : .94;
      const center = entity.lane*laneWidth;
      const front = entity.position-(entity.ramp || .13);
      const end = entity.position+(truck ? (entity.length ?? truckLength) : .51);
      if (front <= far && end >= near && center+width >= left && center-width <= right) return false;
    }
    return true;
  }

  function updateBride(dt, flying) {
    const gapTarget = chaseDistance+Math.min(2.12,groundY*.90);
    chaseGap += (gapTarget-chaseGap)*(1-Math.exp(-9*dt));
    if (flying) brideAway = Math.min(1,brideAway+dt/.78);
    else if (grounded) brideAway = Math.max(0,brideAway-dt/.85);

    const pace = (inHeaven()?portal.initialSpeed:11.6)+acceleration*t;
    const ahead = brideDistance+pace*.22;
    const blocked = !bridePathClear(brideX,brideX,brideDistance,ahead);
    const crossing = brideX !== brideTarget;
    const waiting = crossing && !bridePathClear(brideX,brideTarget,brideDistance,ahead);
    if (!brideShift) {
      if (crossing && !waiting) {
        brideShift = shift(brideX,brideTarget,laneShiftDuration);
      } else if (blocked) {
        // Clear the current lane before a solid obstacle, then resume the pursuit.
        const alternative = [brideTarget,0,-laneWidth,laneWidth].find(target => target !== brideX &&
          bridePathClear(brideX,target,brideDistance,brideDistance) &&
          bridePathClear(target,target,brideDistance,ahead));
        if (alternative !== undefined) brideShift = shift(brideX,alternative,laneShiftDuration);
      }
    }

    const yieldGap = blocked || waiting ? 1.28 : 0;
    brideYield += (yieldGap-brideYield)*(1-Math.exp(-9*dt));
    const desired = distance-chaseGap-brideRetreatDistance*smooth(brideAway)-.86*slidePose()-brideYield;
    const nextDistance = brideDistance+Math.max(-6*dt,Math.min((pace+11)*dt,desired-brideDistance));
    const progress = brideShift ? shiftProgress(brideShift) : 0;
    const nextX = !brideShift ? brideX : progress === 1 ? brideShift.to :
      brideShift.from+(brideShift.to-brideShift.from)*progress;
    if (bridePathClear(brideX,nextX,brideDistance,nextDistance)) {
      brideX = nextX;
      brideDistance = nextDistance;
    } else if (bridePathClear(brideX,nextX,brideDistance,brideDistance)) {
      brideX = nextX;
    } else {
      if (bridePathClear(brideX,brideX,brideDistance,nextDistance)) brideDistance = nextDistance;
      if (brideShift) brideShift = shift(brideX,brideShift.to,Math.max(.16,brideShift.duration*(1-progress)));
    }
    if (brideShift && brideX === brideShift.to) brideShift = null;

    // Rejoin behind the camera if several obstacles have boxed her in.
    if (distance-brideDistance > 12) {
      const rejoin = distance-chaseDistance-4.5;
      const clearLane = [brideTarget,0,-laneWidth,laneWidth].find(target =>
        bridePathClear(target,target,rejoin,rejoin+pace*.22));
      if (clearLane !== undefined) {
        brideX = clearLane;
        brideDistance = rejoin;
        brideShift = null;
      }
    }
  }

  function hitTruckFromSide(truck, previousX) {
    const truckX = truck.lane*laneWidth;
    if (Math.abs(previousX-truckX) <= truckHalfWidth || !besideTruck(truck,laneChangeDistance)) return false;
    const repeated = t-lastSideHit < sideHitWindow;
    lastSideHit = t;
    if (repeated) return false;
    lane = truck.lane+Math.sign(previousX-truckX);
    x = previousX;
    runnerShift = shift(x,lane*laneWidth,.22);
    laneChangeDistance = -Infinity;
    sideRebound = truck;
    shake = .18;
    return true;
  }

  function updateHeight(dt, flying, previousDistance, previousX) {
    const previousHeight = playerY;
    if (flying) {
      const target=(garden?gardenFlightHeight:hallFlightHeight)+.12*Math.sin((flightUntil-t)*8);
      playerY += (target-playerY) * (1-Math.exp(-8*dt));
      velocityY = 0;
      grounded = false;
      groundY = 0;
    } else if (!grounded) {
      playerY += velocityY*dt-.5*gravity*dt*dt;
      velocityY -= gravity*dt;
    }

    if (flying) return;
    let floor = 0;
    for (let i=firstVisible;i<simulation.length;i++) {
      const entity = simulation[i];
      if (entity.position-distance > Math.max(rampLength,WeddingModels.policeDimensions.bus.ramp)+1) break;
      const center = entity.lane*laneWidth;
      const halfWidth = entity.halfWidth ?? truckHalfWidth;
      if (entity.used || !isVehicle(entity.kind) || Math.abs(center-x) > halfWidth) continue;
      const surface = truckSurface(entity,distance);
      const approach = entity.position-distance;
      if (entity.kind === "police") {
        const step = entity.ramp && approach>.19 ? .12 : .035;
        const previousSurface = entity.ramp && Math.abs(center-previousX)<=halfWidth ?
          truckSurface(entity,previousDistance) : surface;
        // A falling runner or a rising ramp can cross the roof between simulation steps.
        const reachedTop = velocityY<=0 && previousHeight>=previousSurface && playerY<=surface;
        if (surface && (playerY>=surface-step || reachedTop)) floor = Math.max(floor,surface);
        continue;
      }
      const reachedRamp = entity.ramp && (approach>.19 || playerY>roofHeight-.5);
      const bootLanding = poweredJump && t-jumpStart < 1.03 && playerY > 1.10;
      if (surface && (reachedRamp || playerY>=surface-.23 || bootLanding)) floor = Math.max(floor,surface);
    }

    if (grounded && floor < groundY-.1) {
      grounded = false;
      gravity = 17.25;
      jumpStart = -Infinity;
      poweredJump = false;
    }
    groundY = floor;
    if (playerY<=floor || grounded) {
      if (!grounded && Number.isFinite(jumpStart)) landedAt = t;
      playerY = floor;
      velocityY = 0;
      grounded = true;
      jumpStart = -Infinity;
      poweredJump = false;
    }
  }

  function updateStep(nextTime) {
    const previousTime = t;
    const previousDistance = distance;
    const dt = nextTime-t;
    t = nextTime;
    const heaven = inHeaven();
    distance = speedCurve(t,heaven?portal.initialSpeed:undefined);
    const previousX = x;
    updateRunnerLane();
    if (sideRebound && (!besideTruck(sideRebound,distance) || Math.abs(x-sideRebound.lane*laneWidth) >= laneWidth-.20)) {
      sideRebound = null;
    }
    flash = Math.max(0,flash-dt);
    shake = Math.max(0,shake-dt);
    const flying = t < flightUntil;
    updateHeight(dt,flying,previousDistance,previousX);
    updateBride(dt,flying);
    if (!heaven && !flying && brideAway<.10 && distance-brideDistance<4.9) {
      const slot = Math.floor((t-startTime)/brideSpeechInterval);
      if (slot>brideSpeech.slot) {
        const options = brideMessages.filter(message => message !== brideSpeech.message);
        brideSpeech = {slot,at:t,message:options[Math.floor(Math.random()*options.length)]};
      }
    }
    const sliding = t < slideUntil;
    if (!heaven && !lastWarning && t >= 84) {
      if (t<88.1) notify("Впереди дверь «Выход» · держись центра",Math.min(3.4,88.1-t));
      lastWarning = true;
    }
    if (!ui.toast.hidden && t >= showUntil) ui.toast.hidden = true;

    while (firstVisible < simulation.length && simulation[firstVisible].position-distance < -truckLength-11.6) {
      firstVisible++;
    }
    const attracting = t<magnetUntil;
    if (previousTime<magnetUntil && !attracting) {
      magnetThrow = {time:t,distance,pace:(heaven?portal.initialSpeed:11.6)+acceleration*t};
    }
    for (let index=firstVisible; index<simulation.length; index++) {
      const entity = simulation[index];
      const z = playerZ + entity.position-distance;
      if (z>playerZ+(heaven?WeddingModels.policeDimensions.bus.ramp:(attracting?2.6:1.15))) break;
      if (entity.used || entity.shielded) continue;
      const dx = Math.abs(entity.lane*laneWidth-x);
      if (entity.kind === "exit") {
        if (t < hallEnd) continue;
        entity.used = true;
        if (dx > .81) {
          finish(false,"Дверь в сад находится на центральной дорожке. По бокам стены зала.");
          return;
        }
        enterGarden();
        continue;
      }
      const truck = isVehicle(entity.kind);
      if (entity.kind === "police") {
        const reach = entity.ramp || .15;
        if (z>playerZ+reach || z<playerZ-entity.length || dx>entity.halfWidth) continue;
        const height = entity.ramp ? truckSurface(entity,distance) : entity.height;
        if (playerY>=height-.035) continue;
        if (absorbCollision(entity)) continue;
        shake = .27;
        leaveHeaven(true);
        return;
      }
      if (truck || entity.kind==="barrier" || entity.kind==="ribbon") {
        if (z>playerZ+.15 || z<playerZ-(truck?(entity.length ?? truckLength):.34) || dx>(truck?(entity.halfWidth ?? truckHalfWidth):1.13) || flying) continue;
        if (truck && playerY >= (entity.height ?? roofHeight)-.035) continue;
        if (entity.kind === "barrier" && playerY > .64) continue;
        if (entity.kind === "ribbon" && sliding && playerY<.31) continue;
        if (entity.kind === "ribbon" && poweredJump && !sliding && playerY+WeddingModels.jumpSoleHeight > entity.top) continue;
        if (absorbCollision(entity) || (truck && hitTruckFromSide(entity,previousX))) continue;
        shake = .27;
        finish(false,truck?"Съезжай в сторону, ищи тягач с рампой или нажми ↑ чуть раньше, если подобрал ганжаботы.":entity.kind==="ribbon"?"Под щитком ↓ можно проскользнуть, а с ганжаботами — перепрыгнуть его.":"Низкий барьер можно перепрыгнуть.");
        return;
      }
      const isAir = entity.kind === "air";
      if (isAir && (!flying || entity.flight !== flightSource || Math.abs(entity.y-playerY-.50)>1.05)) continue;
      if (attracting && (isCash(entity.kind) || entity.kind==="sausage") && Math.abs(z-playerZ)<=2.6) {
        if (dx>.2 || Math.abs(entity.y-playerY-.83)>.5) {
          magnetTrails.push({x:entity.lane*laneWidth,y:entity.y,z,time:t,kind:entity.kind});
        }
      } else {
        if (Math.abs(z-playerZ)>.77 || dx>.72) continue;
        if (!isAir && (flying || Math.abs(entity.y-playerY-.83)>1.04)) continue;
      }
      entity.used = true;
      collect(entity);
      if (entity.kind === "leaf") return;
    }
  }

  function advance(target) {
    const visit = portal;
    while (mode === "playing" && portal === visit && (!visit || visit.phase === "run") && t < target) {
      updateStep(Math.min(target,t+1/90));
    }
  }

  function advanceRoute(now) {
    if (audioWaiting || audio.paused || audio.seeking || audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      routeFrame = null;
      return;
    }
    const mediaTime = audio.currentTime;
    const elapsed = routeFrame === null ? 0 : Math.min(.12,Math.max(0,(now-routeFrame)/1000));
    routeFrame = now;
    const expected = t+elapsed*audio.playbackRate;
    const drift = mediaTime-expected;
    // Media clocks can repeat a sample across several display frames. Correct drift gradually.
    const outsideDeadband = Math.sign(drift)*Math.max(0,Math.abs(drift)-.055);
    const correction = Math.min(.34,Math.max(-.18,outsideDeadband*2));
    advance(Math.min(expected+elapsed*correction,mediaTime+.115,audio.duration || trackDuration));
  }

  function action(direction) {
    if (mode !== "playing" || (portal && portal.phase!=="run")) return;
    if (direction === "left" || direction === "right") {
      const nextLane = Math.max(-1,Math.min(1,lane+(direction === "left" ? -1 : 1)));
      if (nextLane !== lane && nextLane !== sideRebound?.lane) {
        lane = nextLane;
        laneChangeDistance = distance;
        const span = Math.abs(lane*laneWidth-x)/laneWidth;
        runnerShift = shift(x,lane*laneWidth,laneShiftDuration*Math.max(.68,span));
      }
    }
    if (t < flightUntil) {
      if (direction !== "down") return;
      flightUntil = flightSource = -Infinity;
    }
    if (direction === "up" && grounded) {
      slideUntil = -Infinity;
      poweredJump = t < bootsUntil;
      gravity = poweredJump ? 12.88 : 17.25;
      velocityY = Math.sqrt(2*gravity*(poweredJump?2.84:1.42));
      grounded = false;
      jumpStart = t;
    }
    if (direction === "down") {
      if (!grounded) velocityY = Math.min(-8,velocityY);
      slideUntil = t+slideDuration;
    }
  }

  function visibleEntities() {
    const list = mode === "menu" ? menuCourse : simulation;
    const visible = [];
    for (let i=mode==="menu"?0:firstVisible;i<list.length;i++) {
      const entity = list[i];
      const z = playerZ+entity.position-distance;
      if (z>WeddingScene.viewDistance) break;
      const depth = entity.length || 0;
      const near=entity.kind==="exit"?-4.2:-6.6;
      if (z+depth<near || (entity.used && entity.kind!=="exit") ||
          (entity.kind==="air" && (t>=flightUntil || entity.flight!==flightSource))) continue;
      visible.push({...entity,z});
    }
    return visible;
  }

  function setText(element,value) {
    if (element.textContent !== value) element.textContent = value;
  }

  function updateHud() {
    lastHudUpdate = t;
    const active = {bottle:Math.ceil(flightUntil-t),hood:shield?1:0,boots:Math.ceil(bootsUntil-t),
      magnet:Math.ceil(magnetUntil-t),multiplier:(portal?.factor ?? 1)-1};
    const heaven = inHeaven();
    const compact = !heaven && isMobileGame();
    let hasBoosts = false;
    for (const [kind,{chip,icon,value}] of Object.entries(heaven?heavenChips:chips)) {
      const hidden = active[kind]<=0 || (compact && kind==="hood");
      if (chip.hidden !== hidden) chip.hidden = hidden;
      if (chip.hidden) continue;
      hasBoosts = true;
      if (kind === "multiplier") setText(icon,`×${portal.factor}`);
      const seconds = heaven ? Math.min(active[kind],Math.ceil(heavenDuration-t)) : active[kind];
      setText(value,kind==="hood"?"1 удар":kind==="multiplier"?"до выхода":seconds+" с");
    }
    const boostGroup = ui[heaven ? "heaven-boosts" : "boosts-live"];
    if (boostGroup.hidden === hasBoosts) boostGroup.hidden = !hasBoosts;
    if (heaven) {
      setText(ui["heaven-clock"],`${Math.max(0,Math.ceil(heavenDuration-t))} с`);
      const {sausages,multipliedSausages,factor} = portal;
      const count = factor===1 ? sausages :
        sausages===multipliedSausages ? `${sausages} × ${factor}` :
        `(${multipliedSausages} × ${factor} + ${sausages-multipliedSausages})`;
      setText(ui["heaven-money"],`${count} × ${number.format(sausageValue)} = ${money(heavenReward(portal))}`);
      ui["heaven-progress"].style.transform = `scaleX(${Math.max(0,1-t/heavenDuration)})`;
      return;
    }
    setText(ui.money,formatCapital(portal?.caught ? fineCapital(portal) : capitalKopecks));
    if (compact) return;
    setText(ui.distance,number.format(Math.floor(distance-speedCurve(startTime))) + " м");
    const chapterStart = garden ? hallEnd : 0;
    const chapterEnd = garden ? (audio.duration || trackDuration) : hallEnd;
    const seconds = t-chapterStart;
    setText(ui.clock,formatTime(seconds) + " / " + formatTime(chapterEnd-chapterStart));
    ui.progress.style.transform = `scaleX(${Math.min(1,seconds/(chapterEnd-chapterStart))})`;
  }

  const driveFade = byId("drive-fade");
  const campusSound = byId("campus-sound");
  const campusEntryLight = byId("campus-entry-light");

  function returnToMenu() {
    ++processTicket;
    pauseMusic();
    reset(false);
    setMode("menu");
    ui["menu-play"].focus({preventScroll:true});
  }

  const campus = new WeddingCampusQuiz({
    root:byId("campus-quiz"),ending:byId("campus-ending"),painter:scene,
    capital:()=>capitalKopecks,formatMoney:formatCapital,
    playDebit:playCampusDebit,
    playDormTrombone,
    fadeMusic:level=>mixMusic(0,0,.74*level),
    debit:amount=>changeCapital(-amount),
    restart:async ()=>{
      driveFade.classList.add("black","instant");
      campus.root.hidden = true;
      try { await begin(); }
      finally {
        driveFade.classList.remove("instant");
        requestAnimationFrame(()=>driveFade.classList.remove("black"));
      }
    },
    mainMenu:()=>{
      campus.root.hidden = true;
      returnToMenu();
    }
  });
  function enterCampus(time,passes) {
    ++processTicket;
    pauseMusic();
    clearPortal();
    setMode("campus");
    mixMusic(0,0,.74);
    campusAudio.currentTime = 0;
    if (!gameSuspended()) campusAudio.play().catch(() => {});
    campus.start(time,passes);
    campus.frame(0);
    if (time!==undefined) {
      campusEntryLight.hidden = false;
      Promise.allSettled(campusEntryLight.getAnimations().map(animation=>animation.finished)).then(()=>{
        campusEntryLight.hidden = true;
      });
    }
    driveFade.classList.remove("black");
  }

  const drive = new WeddingDrive({scene,track:byId("drive-track"),root:byId("drive"),fade:driveFade,
    caught:byId("drive-caught"),onCaught:()=>begin(),onCampus:enterCampus,
    onMainMenu:returnToMenu,canTeleport:()=>adminUnlocked,isSuspended:gameSuspended,
    onEnter:()=>setMode("driving"),onExit:()=>{
      renderGarage();
      setMode("garage");
      playGarageMusic();
      ui["garage-continue"].focus({preventScroll:true});
    },onMute:toggleSound
  });

  for (const toggle of capitalToggles) {
    toggle.addEventListener("change",()=>{
      if (!adminUnlocked) return;
      unlimitedGarage = toggle.checked;
      writeLocal("unlimited-garage",unlimitedGarage);
      for (const input of capitalToggles) input.checked = unlimitedGarage;
    });
  }

  for (const form of adminForms) {
    const field = form.elements.key;
    const status = form.querySelector("output");
    field.addEventListener("input",() => {
      field.removeAttribute("aria-invalid");
      status.textContent = "";
    });
    form.addEventListener("submit",event => {
      event.preventDefault();
      if (adminUnlocked) return;
      const correct = field.value.trim() === "60225";
      form.reset();
      if (!correct) {
        field.setAttribute("aria-invalid","true");
        status.textContent = "Неверный ключ";
        field.focus();
        return;
      }
      adminUnlocked = true;
      unlimitedGarage = readLocal("unlimited-garage",false) === true;
      for (const input of capitalToggles) input.checked = unlimitedGarage;
      for (const keyForm of adminForms) keyForm.hidden = true;
      for (const tool of adminTools) tool.hidden = false;
      form.parentElement.querySelector("[data-unlimited-garage]").focus({preventScroll:true});
    });
  }

  const guideHome = ui["runner-guide"].parentElement;
  const restoreRunnerGuide = () => guideHome.insertBefore(ui["runner-guide"],guideHome.lastElementChild);
  ui["menu-settings"].addEventListener("click",() => {
    ui["settings-guide"].append(ui["runner-guide"]);
    ui.settings.showModal();
  });
  ui.settings.addEventListener("close",() => {
    if (!ui.settings.open) restoreRunnerGuide();
  });

  function chooseTeleport(time) {
    if (!adminUnlocked) return;
    if (mode === "paused") {
      if (time === undefined) enterCampus();
      else teleport(time,time === trackDuration);
      return;
    }
    if (mode !== "menu" || !ui.settings.open) return;
    ui.settings.close();
    restoreRunnerGuide();
    if (time === 0 || time === hallEnd) {
      begin(time === hallEnd);
      return;
    }
    reset(false);
    unlockMusic();
    if (time === undefined) enterCampus();
    else {
      placeOnRoute(time);
      enterParking();
    }
  }

  const ostButtons = [...document.querySelectorAll("audio[data-ost-title]")].map((track,index) => {
    const row = document.createElement("li");
    const button = document.createElement("button");
    // The preview needs its own request while gameplay media is preloading.
    const source = new URL(track.getAttribute("src"),location.href);
    source.searchParams.set("ost","1");
    button.type = "button";
    button.className = "secondary wedding-secondary";
    button.textContent = track.dataset.ostTitle;
    button.setAttribute("aria-pressed",String(index === 0));
    if (index === 0) ostAudio.src = source;
    button.addEventListener("click",() => {
      if (button.getAttribute("aria-pressed") === "false") {
        for (const option of ostButtons) option.setAttribute("aria-pressed",String(option === button));
        ostAudio.src = source;
      }
      ostAudio.play().catch(() => {});
    });
    row.append(button);
    ui["ost-tracks"].append(row);
    return button;
  });

  ui["menu-ost"].addEventListener("click",() => {
    menuAudio.pause();
    ui.ost.showModal();
  });
  ui.ost.addEventListener("close",() => {
    if (ui.ost.open) return;
    ostAudio.pause();
    ostAudio.currentTime = 0;
    playMenuMusic();
  });
  ui.ost.querySelector("form").addEventListener("submit",event => {
    event.preventDefault();
    ui.ost.close();
    ostAudio.pause();
    playMenuMusic();
  });
  window.addEventListener("click",playMenuMusic);

  const openWarning = () => ui.warning.showModal();
  ui["menu-play"].addEventListener("click",openWarning);
  ui["menu-story"].addEventListener("click",() => ui.story.showModal());
  ui.story.addEventListener("close",() => { ui.story.querySelector(".story-scroll").scrollTop = 0; });
  ui["warning-continue"].addEventListener("click",() => {
    ui.warning.close();
    begin();
  });
  ui.primary.addEventListener("click",() => begin());
  ui.secondary.addEventListener("click",() => begin(true));
  ui.pause.addEventListener("click",pause);
  ui["pause-resume"].addEventListener("click",resume);
  ui["pause-restart"].addEventListener("click",() => begin());
  ui["pause-menu"].addEventListener("click",returnToMenu);
  ui["teleport-hall"].addEventListener("click",() => chooseTeleport(0));
  ui["teleport-garden"].addEventListener("click",() => chooseTeleport(hallEnd));
  ui["teleport-yard"].addEventListener("click",() => chooseTeleport(trackDuration));
  ui["teleport-campus"].addEventListener("click",() => chooseTeleport());
  ui["parking-continue"].addEventListener("click",openGarage);
  ui["garage-buy"].addEventListener("click",() => {
    if (mode !== "garage" || previewOnly) return;
    const {id,price} = inspectedVehicle;
    const cost = price*100;
    if (selectedVehicle === id) return;
    if (!acquiredVehicles.has(id)) {
      if (!unlimitedGarage && capitalKopecks<cost) {
        renderGarage();
        return;
      }
      if (!unlimitedGarage && cost>0) changeCapital(-cost);
      acquiredVehicles.add(id);
    }
    selectedVehicle = id;
    renderGarage();
  });
  ui["garage-continue"].addEventListener("click",async () => {
    if (mode !== "garage" || !acquiredVehicles.has(selectedVehicle)) return;
    const vehicle = escapeVehicles.find(option=>option.id===selectedVehicle);
    garageAudio.pause();
    pauseMusic();
    mixMusic(0,0,0);
    // Authorize the corridor music from the same tap that starts the drive.
    campusAudio.play().then(()=>{
      if (mode !== "campus") campusAudio.pause();
    }).catch(() => {});
    ui["garage-continue"].disabled = true;
    const started = await drive.start(vehicle);
    renderGarage();
    if (!started) {
      playGarageMusic();
      setText(ui["garage-status"],"Трек не запустился. Попробуй продолжить ещё раз.");
    }
  });
  for (const button of [ui.sound,ui["ost-sound"],ui["settings-sound"]]) {
    button.addEventListener("click",toggleSound);
  }
  ui["garage-sound"].addEventListener("click",() => {
    toggleSound();
    if (!garageAudio.muted && garageAudio.paused) playGarageMusic();
  });
  campusSound.addEventListener("click",()=>{
    toggleSound();
    if (!campusAudio.muted && campusAudio.paused) campusAudio.play().catch(() => {});
  });
  audio.addEventListener("ended",() => {
    if (mode !== "playing" || portal) return;
    advance(audio.duration);
    if (mode === "playing" && !portal && garden) finish(true);
  });
  audio.addEventListener("waiting",() => {
    audioWaiting = true;
    routeFrame = null;
  });
  audio.addEventListener("playing",() => {
    audioWaiting = false;
    routeFrame = null;
  });
  audio.addEventListener("error",() => {
    if (mode === "playing") {
      pauseMusic();
      setMode("error");
    }
  });
  document.addEventListener("visibilitychange",() => {
    if (mode === "menu") {
      if (gameSuspended()) {
        menuAudio.pause();
        ostAudio.pause();
      } else {
        playMenuMusic();
      }
      return;
    }
    if (mode === "garage") {
      if (gameSuspended()) garageAudio.pause();
      else playGarageMusic();
      return;
    }
    if (mode === "campus") {
      if (gameSuspended()) campusAudio.pause();
      else campusAudio.play().catch(() => {});
      return;
    }
    if (document.hidden) pause();
  });

  ui.help.addEventListener("click",() => {
    if (mode === "playing") pause();
    if (mode === "paused") ui["runner-controls"].focus();
  });
  const keys = {ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down"};
  window.addEventListener("keydown",event => {
    if (needsLandscape() || ui.warning.open || ui.story.open || ui.ost.open || ui.settings.open ||
        event.target.closest?.("input") || event.altKey || event.ctrlKey || event.metaKey) return;
    if (mode === "driving") {
      drive.keydown(event);
      return;
    }
    if (mode === "parking" || mode === "garage" || mode === "campus") return;
    const code = event.code;
    if (keys[code]) {
      if (mode !== "playing") return;
      event.preventDefault();
      if (!event.repeat) action(keys[code]);
    } else if (code === "Escape" || code === "KeyP") {
      event.preventDefault();
      if (event.repeat) return;
      if (mode === "paused") resume();
      else pause();
    } else if (code === "Space" && mode !== "playing" && mode !== "loading") {
      if (event.target.closest?.("button,input")) return;
      event.preventDefault();
      if (event.repeat) return;
      if (mode === "paused") resume();
      else if (mode === "menu") openWarning();
      else begin();
    }
  });
  window.addEventListener("keyup",event => {
    if (mode === "driving") drive.keyup(event);
  });

  let pointer = null;
  stage.addEventListener("pointerdown", event => {
    if (mode !== "playing" || event.target.closest("button") || pointer || event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    pointer = {id:event.pointerId,x:event.clientX,y:event.clientY,used:false};
  });
  stage.addEventListener("pointermove",event => {
    if (!pointer || pointer.id!==event.pointerId || pointer.used) return;
    const dx=event.clientX-pointer.x;
    const dy=event.clientY-pointer.y;
    if (Math.hypot(dx,dy)<24) return;
    pointer.used = true;
    action(Math.abs(dx)>Math.abs(dy) ? (dx<0?"left":"right") : (dy<0?"up":"down"));
  });
  function clearPointer(event) { if (pointer?.id === event.pointerId) pointer = null; }
  stage.addEventListener("pointerup",clearPointer);
  stage.addEventListener("pointercancel",clearPointer);
  stage.addEventListener("lostpointercapture",clearPointer);

  function showSpeech(element,anchor) {
    const hidden = mode !== "playing" || !anchor;
    if (element.hidden !== hidden) element.hidden = hidden;
    if (!hidden) {
      setText(element,anchor.message);
      scene.placeSpeech(element,anchor);
    }
  }

  function frame(now) {
    const dt = previousFrame ? Math.min(.25,(now-previousFrame)/1000) : 0;
    previousFrame = now;
    if (needsLandscape()) {
      requestAnimationFrame(frame);
      return;
    }
    if (mode === "menu") {
      scene.sampleDisplayInterval(dt);
      requestAnimationFrame(frame);
      return;
    }
    if (mode === "driving") {
      drive.frame(now);
      requestAnimationFrame(frame);
      return;
    }
    if (mode === "campus") {
      campus.frame(dt);
      requestAnimationFrame(frame);
      return;
    }
    if (mode === "playing") {
      if (portal) stepPortal(dt);
      else {
        if (returnFade) {
          returnFade.elapsed += dt;
          const amount = smooth(returnFade.elapsed/returnFadeDuration);
          mixMusic(amount,returnFade.heaven ? .7*(1-amount) : 0);
          if (amount===1) {
            heavenAudio.pause();
            returnFade = null;
          }
        }
        advanceRoute(now);
      }
      if (t-lastHudUpdate >= .05) updateHud();
    }
    if (mode === "paused" || mode === "lost" || mode === "error") {
      const {width,height}=scene.canvas;
      if (stillFrame?.mode===mode && stillFrame.t===t && stillFrame.width===width && stillFrame.height===height) {
        if (now-stillFrame.since>400) {
          requestAnimationFrame(frame);
          return;
        }
      } else {
        stillFrame={mode,t,width,height,since:now};
      }
    } else {
      stillFrame=null;
    }
    if (magnetTrails.length) magnetTrails = magnetTrails.filter(pull=>t-pull.time<.24);
    if (magnetThrow && t-magnetThrow.time>=1.24) magnetThrow = null;
    const slide = slidePose();
    const flight = t < flightUntil;
    const mount = flight ? smooth((10-(flightUntil-t))/.34) : 0;
    const brideRetreat = smooth(brideAway);
    const jump = Number.isFinite(jumpStart) && !flight ? {
      lift:smooth((t-jumpStart)/.13), tuck:smooth(1-Math.abs(velocityY)/6), descent:smooth(-velocityY/5)
    } : null;
    const landing = smooth(1-(t-landedAt)/.19);
    const lineAge = t-brideSpeech.at;
    const brideLine = !portal && lineAge>=0 && lineAge<brideSpeechDuration ? {
      message:brideSpeech.message, opacity:Math.min(1,(lineAge+.02)/.14,(brideSpeechDuration-lineAge)/.3)
    } : null;
    const speeches = scene.draw({
      mode, garden, heaven:inHeaven(), t, distance, x, brideX, playerY, groundY, grounded, shield, flash, shake,
      runnerLean:shiftLean(runnerShift), brideLean:shiftLean(brideShift), jump, landing,
      brideRetreat, brideGap:distance-brideDistance, brideStride:(brideDistance+chaseDistance)/13, brideLine,
      flying:flight, boots:t<bootsUntil, slide, mount, gardenFlightGaps, guests, paintings, airships, magnetTrails,
      magnetHeld:t<magnetUntil, magnetThrow,
      gardenProgress:Math.max(0,Math.min(1,(t-hallEnd)/(highwayStart-hallEnd))),
      yardAhead:garden ? Math.max(0,speedCurve(trackDuration)-distance) : Infinity,
      visible:visibleEntities()
    }, now/1000);
    showSpeech(ui["guest-speech"],speeches?.guest);
    showSpeech(ui["bride-speech"],speeches?.bride);
    requestAnimationFrame(frame);
  }

  function syncOrientation() {
    const mobile = isMobileGame();
    const root = document.documentElement;
    if (root.classList.contains("mobile-game") !== mobile) {
      root.classList.toggle("mobile-game",mobile);
      scene.resize();
      if (mode === "playing" || mode === "paused") updateHud();
    }
    const prompt = ui["landscape-required"];
    if (needsLandscape()) {
      pointer = null;
      pause();
      drive.pause();
      for (const track of [menuAudio,ostAudio,garageAudio,campusAudio]) track.pause();
      if (!prompt.open) prompt.showModal();
    } else if (prompt.open) {
      prompt.close();
      playMenuMusic();
      playGarageMusic();
      if (mode === "campus" && !gameSuspended()) campusAudio.play().catch(() => {});
    }
  }

  let connectedTelegram;
  function connectTelegram() {
    const telegram = window.Telegram?.WebApp;
    if (!telegram || telegram===connectedTelegram) return;
    connectedTelegram = telegram;
    syncTelegramSwipes();
    syncOrientation();
    if (!mobileTelegram()) return;
    telegram.ready();
    if (!telegram.isVersionAtLeast("8.0")) {
      telegram.expand();
      return;
    }
    if (telegram.isOrientationLocked) telegram.unlockOrientation();
    const syncFullscreen = () => {
      ui["landscape-fullscreen"].hidden = telegram.isFullscreen;
      scene.resize();
    };
    telegram.onEvent("fullscreenChanged",syncFullscreen);
    telegram.onEvent("safeAreaChanged",() => scene.resize());
    telegram.onEvent("contentSafeAreaChanged",() => scene.resize());
    syncFullscreen();
    if (!telegram.isFullscreen) telegram.requestFullscreen();
  }

  ui["landscape-required"].addEventListener("cancel",event => event.preventDefault());
  ui["landscape-fullscreen"].addEventListener("click",() => mobileTelegram()?.requestFullscreen());
  landscapeScreen.addEventListener("change",syncOrientation);
  touchScreen.addEventListener("change",syncOrientation);
  byId("telegram-web-app")?.addEventListener("load",connectTelegram,{once:true});
  updateSound();
  if (previewOnly) {
    garden = true;
    resetMotion(trackDuration,0);
    enterParking();
  } else {
    setMode("menu");
  }
  syncOrientation();
  connectTelegram();
  requestAnimationFrame(frame);
})();
