"use strict";

window.WeddingCampusQuiz = class WeddingCampusQuiz {
  static questions = [
    ["ГДЕ ОБОСРАЛСЯ ДИМАС?","НА МОСТУ","В ТАКСИ"],
    ["ОТЧЕГО ДИМА БЛЕВАЛ НА ФУДКОРТЕ?","СНЮС","ОТ ПАЛЕНОЙ ВОДЯРЫ"],
    ["ГДЕ БЛЕВАЛ ДИМАС?","В ТРАМВАЕ","В АВТОБУСЕ"],
    ["СКОЛЬКО РАЗ ДИМАС ЖАРИЛ НЕВЕСТУ?","2,5","1"],
    ["ЗА ЧТО НЕВЕСТА ДАЛА ДИМЕ В ПЕРВЫЙ РАЗ?","2 МАЭСТРО И КАРТОШКА","3 ШЕФБУРГЕРА И КОЛА"],
    ["ГДЕ ПЕРВЫЙ РАЗ ДИМАС ТРАХНУЛ БОРОВИХУ?","В ПОДЪЕЗДЕ","НА АВТОМОЙКЕ"],
    ["КАК ДИМАСА НАЗВАЛА ТОЛСТУХА?","НЕДОМАЖОРИК","ВОЛОСЯНОЙ КОМОЧЕК"],
    ["ЧТО ДИМАС ВЫПИЛ «ДЛЯ ВОЗБУЖДЕНИЯ»?","1,5 ЛИТРА ОХОТЫ КРЕПКОЙ И ЛИТР ВОДКИ","3 ТАБЛЕТКИ ВИАГРЫ"],
    ["КТО ЗАШЁЛ ВО ВРЕМЯ ОСЕМЕНЕНИЯ В ОБЩАГЕ?","СОСЕДКА ПО КОМНАТЕ","БАБУШКА НЕВЕСТЫ"],
    ["ВО СКОЛЬКО РАЗ НЕВЕСТА БОЛЬШЕ ВЕСИТ?","В 2 РАЗА","В 1,5 РАЗА"],
    ["ЛЮБИМОЕ ПОЙЛО ДИМАСА?","ОХОТА КРЕПКАЯ","ВОДКА ЦАРСКАЯ"],
    ["ЦЕЛОВАЛСЯ ЛИ ДИМАС С НЕВЕСТОЙ?","«ФУ, НЕТ»","«КОНЕЧНО, МЫ ЖЕ ТРАХАЛИСЬ»"]
  ];
  static finalQuestion = ["РЕАЛЬНО ЛИ ДИМАС ЖЕНИТСЯ НА ТОЛСТУХЕ?","ДА","НЕТ"];
  static scoreFormat = new Intl.NumberFormat("ru-RU");

  constructor({root,ending,painter,capital,debit,formatMoney,playDebit,playDormTrombone,fadeMusic,restart,mainMenu}) {
    this.root = root;
    this.ending = ending;
    this.painter = painter;
    this.capital = capital;
    this.debit = debit;
    this.formatMoney = formatMoney;
    this.playDebit = playDebit;
    this.playDormTrombone = playDormTrombone;
    this.fadeMusic = fadeMusic;
    this.restart = restart;
    this.mainMenu = mainMenu;
    this.ui = Object.fromEntries([...root.querySelectorAll("[data-campus]")].map(el=>[el.dataset.campus,el]));
    this.buttons = [this.ui.left,this.ui.right];
    this.buttons.forEach((button,index)=>button.addEventListener("click",()=>this.choose(index)));
    this.ui.pay.addEventListener("click",()=>this.pay());
    this.ui.refuse.addEventListener("click",()=>this.refuse());
    this.ui.menu.addEventListener("click",()=>this.enterDorm());
    this.ui.spend.addEventListener("click",()=>this.chooseDorm(true));
    this.ui.keep.addEventListener("click",()=>this.chooseDorm(false));
    this.ui.finish.addEventListener("click",()=>{
      if (this.phase==="dorm-complete") this.mainMenu();
    });
  }

  start(driveTime,passes) {
    this.interior ??= new WeddingCampusInterior(this.painter);
    const deck = [...WeddingCampusQuiz.questions];
    for (let i=deck.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [deck[i],deck[j]] = [deck[j],deck[i]];
    }
    this.rounds = [...deck.slice(0,WeddingCampusInterior.gates.length-1),WeddingCampusQuiz.finalQuestion].map(([question,right,wrong])=>{
      const correct = Math.random()<.5 ? 0 : 1;
      return {question,correct,answers:correct===0 ? [right,wrong] : [wrong,right]};
    });
    this.index = 0;
    this.mistakes = 0;
    this.doors = [];
    this.bride = null;
    this.dorm = null;
    this.closeup = 0;
    this.hero = {x:0,z:1.1,yaw:0,stride:0};
    const {message,choices,bargain,failure,complete,result,change,pay} = this.ui;
    message.hidden = choices.hidden = bargain.hidden = failure.hidden = complete.hidden = change.hidden = true;
    this.ui.wallet.classList.remove("debited");
    pay.disabled = false;
    const {location,dormChoices,dormEnding,dormResult,scoreCard,badEnding,finish,spend,keep} = this.ui;
    location.textContent = "ГАУМАНКА";
    dormChoices.hidden = dormEnding.hidden = dormResult.hidden = scoreCard.hidden = badEnding.hidden = finish.hidden = true;
    spend.disabled = keep.disabled = false;
    delete dormChoices.dataset.choice;
    dormEnding.style.removeProperty("--dorm-shade");
    this.wrongSide = 0;
    this.root.hidden = false;
    this.root.focus({preventScroll:true});
    this.updateProgress();
    this.updateCapital();
    result.hidden = driveTime === undefined;
    result.textContent = result.hidden ? "" : `Время заезда ${driveTime} · Обгонов ${passes}`;
    this.walk([[0,this.stopZ()]],"question");
  }

  stopZ() {
    return WeddingCampusInterior.gates[this.index]-4.15;
  }

  updateProgress() {
    this.ui.progress.textContent = `Препод ${this.index+1} из ${this.rounds.length}`;
  }

  updateCapital(amount=this.capital()) {
    const text = this.formatMoney(amount);
    if (this.ui.capital.textContent!==text) this.ui.capital.textContent = text;
  }

  setPhase(phase) {
    this.phase = phase;
    this.elapsed = 0;
    this.dirty = true;
  }

  walk(points,after) {
    let from = [this.hero.x,this.hero.z];
    let distance = 0;
    const legs = points.map(to=>{
      const length = Math.hypot(to[0]-from[0],to[1]-from[1]);
      const leg = {from,to,length,start:distance};
      distance += length;
      from = to;
      return leg;
    });
    this.route = {legs,distance,after};
    this.setPhase("walk");
  }

  reachQuestion() {
    this.setPhase("question");
    this.wrongSide = 0;
    const {question,answers} = this.rounds[this.index];
    this.ui.messageText.textContent = question;
    this.ui.amount.hidden = true;
    for (const [index,button] of this.buttons.entries()) {
      button.firstElementChild.textContent = answers[index];
    }
    this.ui.message.hidden = this.ui.choices.hidden = false;
    this.ui.message.focus({preventScroll:true});
  }

  choose(index) {
    if (this.phase!=="question") return;
    const {correct} = this.rounds[this.index];
    if (index===correct) {
      this.openDoor();
      return;
    }
    this.wrongSide = index===0 ? -1 : 1;
    this.failureLine = "";
    if (++this.mistakes===1) {
      const capital = this.capital();
      this.bribeCost = capital<100_000_000 ? null :
        capital<=200_000_000 ? 100_000_000 : Math.round(capital/2);
    } else {
      this.failureLine = this.index===this.rounds.length-1 ? "ТЫ ВИДИМО ТАК И НЕ ПОНЯЛ" :
        "СТЫДНО НЕ ЗНАТЬ ОТВЕТЫ НА ТАКИЕ ЛЕГКИЕ ВОПРОСЫ";
    }
    this.setPhase("reject");
    this.ui.message.hidden = this.ui.choices.hidden = true;
    this.root.focus({preventScroll:true});
  }

  showRejection() {
    if (this.failureLine) {
      this.setPhase(this.index===this.rounds.length-1 ? "fatal-reply" : "caught-reply");
      this.ui.messageText.textContent = this.failureLine;
    } else if (this.bribeCost === null) {
      this.fail("СЕССИЯ НЕ СДАНА");
      return;
    } else {
      this.setPhase("bribe");
      this.ui.amount.textContent = this.formatMoney(this.bribeCost);
      this.ui.messageText.textContent = "ПРИДЕТСЯ ЗАНОСИТЬ…";
      this.ui.amount.hidden = this.ui.bargain.hidden = this.ui.refuse.hidden = false;
    }
    this.ui.message.hidden = false;
    this.ui.message.focus({preventScroll:true});
  }

  refuse() {
    if (this.phase!=="bribe") return;
    this.setPhase("bribe-only");
    this.ui.messageText.textContent = "ЧУВАК ЭТО ГАУМАНКА";
    this.ui.refuse.hidden = true;
    this.ui.pay.disabled = true;
    this.ui.message.focus({preventScroll:true});
  }

  pay() {
    if ((this.phase!=="bribe" && this.phase!=="bribe-only") || this.ui.pay.disabled) return;
    const block = this.phase==="bribe" ? 1 : 0;
    this.setPhase("paying");
    this.ui.message.hidden = this.ui.bargain.hidden = true;
    this.root.focus({preventScroll:true});
    const before = this.capital();
    this.debit(this.bribeCost);
    this.payment = {before,after:this.capital(),block};
    if (this.payment.before===this.payment.after) {
      this.allowPassage();
      return;
    }
    this.ui.change.textContent = `−${this.formatMoney(this.bribeCost)}`;
    this.ui.change.hidden = false;
    this.ui.wallet.classList.add("debited");
    this.playDebit();
  }

  allowPassage() {
    this.setPhase("paid");
    this.ui.change.hidden = this.ui.amount.hidden = true;
    this.ui.wallet.classList.remove("debited");
    this.ui.messageText.textContent = "ТЕПЕРЬ ПРОХОДИ";
    this.ui.message.hidden = false;
    this.ui.message.focus({preventScroll:true});
  }

  openDoor() {
    this.setPhase("open");
    this.wrongSide = 0;
    const side = this.rounds[this.index].correct===0 ? -1 : 1;
    this.doors[this.index] = {side,progress:0};
    this.ui.message.hidden = this.ui.choices.hidden = this.ui.bargain.hidden = true;
    this.root.focus({preventScroll:true});
  }

  fail(copy) {
    this.setPhase("failure");
    this.ui.message.hidden = this.ui.choices.hidden = true;
    this.ui.failureText.textContent = copy;
    this.ui.failure.hidden = false;
    this.root.focus({preventScroll:true});
  }

  startBrideRush() {
    this.setPhase("bride-rush");
    this.doors[this.index] = {side:this.wrongSide,progress:0};
    this.stepBrideRush();
  }

  stepBrideRush() {
    const ease = WeddingDrive.smooth, t = this.elapsed;
    const doorZ = WeddingCampusInterior.gates[this.index];
    const side = this.wrongSide, lane = WeddingCampusInterior.doorX;
    const run = Math.min(1,Math.max(0,(t-.19)/1.54));
    const forward = ease(run);
    const corner = Math.max(0,(forward-.46)/.54);
    const stride = 6*run*(1-run);
    const across = lane-1.08;
    const depth = doorZ+2.24-this.stopZ()-.63;
    const dx = across*ease(corner), dz = depth*forward;
    const turn = ease((run-.72)/.28);
    const pathAngle = Math.atan2(across*6*corner*(1-corner)/.54,depth);
    this.doors[this.index].progress = ease(t/.41);
    this.bride = {
      x:side*(lane-dx),
      z:doorZ+2.24-dz,
      yaw:Math.PI+side*(pathAngle*(1-turn)+1.16*turn),
      distance:Math.hypot(dx,dz),
      speed:Math.min(1,stride),
      kiss:0
    };
    const faceBride = ease((t-.93)/.80);
    this.hero.x = -side*.29*faceBride;
    this.hero.z = this.stopZ()-.06*faceBride;
    this.hero.yaw = side*1.10*faceBride;
    this.hero.stride = .32*Math.sin(Math.PI*faceBride);
    this.hero.resist = side*.42*ease((t-1.33)/.40);
    this.closeup = .34*ease((t-1.13)/.60);
    if (run===1) {
      this.setPhase("kiss");
      this.ui.message.hidden = true;
    }
  }

  stepKiss() {
    const ease = WeddingDrive.smooth, side = this.wrongSide, t = this.elapsed;
    const guard = ease(t/.30);
    const approach = ease((t-.11)/.57);
    const shove = Math.sin(Math.PI*ease((t-.16)/.48))+.68*Math.sin(Math.PI*ease((t-.69)/.45));
    const release = ease((t-1.07)/.30);
    this.hero.resist = side*(.42+.49*guard+.09*shove);
    this.hero.x = -side*(.29+.124*guard+.043*shove-.055*release);
    this.hero.z = this.stopZ()-.06-.103*guard-.03*shove;
    this.hero.yaw = side*(1.10+.032*guard-.21*release);
    const distance = .989*approach;
    this.bride = {
      x:side*(1.08-distance+.10*shove+.26*release),
      z:this.stopZ()+.63-.67*approach+.062*release,
      yaw:Math.PI+side*(1.16-.045*approach),
      distance:distance*1.05,
      speed:.40*Math.sin(Math.PI*approach),
      kiss:approach*(1-.55*release)
    };
    this.closeup = .34+.66*ease(t/.64);
    if (t>=1.40) {
      this.setPhase("ending");
      this.ending.hidden = false;
    }
  }

  reaction() {
    const easing = WeddingDrive.smooth, t = this.elapsed;
    let block = 0, laugh = 0;
    if (this.phase==="reject") block = easing((t-.035)/.215);
    else if (["bribe","fatal-reply","caught-reply","failure"].includes(this.phase)) block = 1;
    else if (this.phase==="bribe-only") {
      block = 1-easing(t/.2);
      const envelope = easing((t-.11)/.15)*(1-easing((t-.88)/.30));
      laugh = envelope*(.33+.67*Math.abs(Math.sin((t-.11)*10.8)));
    } else if (this.phase==="paying") block = this.payment.block*(1-easing(t/.25));
    else if (this.phase==="bride-rush") block = 1-easing(t/.26);
    return {index:this.index,side:this.wrongSide,block:block*this.wrongSide,laugh};
  }

  exitDoor() {
    const z = WeddingCampusInterior.gates[this.index];
    const x = this.doors[this.index].side*WeddingCampusInterior.doorX;
    const points = [[x,z-1.15],[x,z+1.35]];
    const final = this.index===this.rounds.length-1;
    points.push([0,final ? z+5.5 : WeddingCampusInterior.gates[this.index+1]-4.15]);
    this.walk(points,final ? "complete" : "next");
  }

  enterDorm() {
    if (this.phase!=="complete") return;
    this.dorm = {opening:0,morph:0};
    this.ui.complete.hidden = true;
    this.root.focus({preventScroll:true});
    this.setPhase("dorm-opening");
  }

  reachDorm() {
    this.setPhase("dorm-choice");
    this.ui.location.textContent = "ОБЩАГА";
    this.ui.progress.textContent = "Комната 332";
    this.painter.canvas.setAttribute("aria-label","Розовая комната 332 в общежитии");
    this.ui.messageText.textContent = "ОДИН СЕКС = 2500";
    this.ui.amount.hidden = true;
    this.ui.message.hidden = this.ui.dormChoices.hidden = false;
    this.ui.message.focus({preventScroll:true});
  }

  chooseDorm(spend) {
    if (this.phase!=="dorm-choice") return;
    this.setPhase(spend ? "dorm-spending" : "dorm-morphing");
    const ui = this.ui;
    ui.spend.disabled = ui.keep.disabled = true;
    ui.dormChoices.dataset.choice = spend ? "spend" : "keep";
    ui.message.hidden = true;
    ui.dormEnding.hidden = false;
    this.root.focus({preventScroll:true});
    if (spend) {
      this.dorm.capital = this.capital();
      if (this.dorm.capital) this.debit(this.dorm.capital);
    }
  }

  stepDormEnding(spend) {
    const ui = this.ui, t = this.elapsed, ease = WeddingDrive.smooth;
    const morphStart = .43;
    const shade = spend ? ease((t-.44)/.82) : ease((t-2.09)/.81);
    ui.dormEnding.style.setProperty("--dorm-shade",shade.toFixed(3));
    const duck = spend ? 0 : ease((t-morphStart)/.12)*.72;
    this.fadeMusic(1-Math.max(shade*.86,duck));
    if (spend) {
      if (t>=1.26) {
        ui.dormResult.hidden = ui.scoreCard.hidden = false;
        const amount = Math.round(this.dorm.capital*ease((t-1.40)/1.5));
        const remaining = this.dorm.capital-amount;
        ui.exchange.textContent = this.formatMoney(remaining);
        ui.score.textContent = WeddingCampusQuiz.scoreFormat.format(Math.floor(amount/(WeddingCampusDorm.rate*100)));
        this.updateCapital(remaining);
      }
    } else {
      const morph = ease((t-morphStart)/1.63);
      if (this.dorm.morph===0 && morph>0) this.playDormTrombone();
      this.dorm.morph = morph;
      this.dirty = true;
    }
    if (shade===1) ui.dormChoices.hidden = true;
    if (t<2.90) return;
    this.setPhase("dorm-complete");
    ui.dormResult.hidden = ui.finish.hidden = false;
    if (spend) {
      ui.exchange.textContent = `${this.formatMoney(this.dorm.capital)} по ${this.formatMoney(WeddingCampusDorm.rate*100)}`;
      ui.finish.focus({preventScroll:true});
    } else {
      ui.badEnding.hidden = false;
      ui.badEnding.focus({preventScroll:true});
    }
  }

  stepWalk(dt) {
    const {legs,distance,after} = this.route;
    const progress = Math.min(1,this.elapsed/(distance/3.45+.27));
    const walked = distance*(progress-Math.sin(2*Math.PI*progress)*.15/(2*Math.PI));
    const leg = legs.find(item=>item.start+item.length>=walked) ?? legs.at(-1);
    const f = Math.min(1,(walked-leg.start)/leg.length);
    const {hero} = this;
    hero.x = leg.from[0]+(leg.to[0]-leg.from[0])*f;
    hero.z = leg.from[1]+(leg.to[1]-leg.from[1])*f;
    hero.stride = Math.round(distance/1.25)*1.25*walked/distance;
    const yaw = progress>.92 ? 0 : Math.atan2(leg.to[0]-leg.from[0],leg.to[1]-leg.from[1]);
    hero.yaw += (yaw-hero.yaw)*(1-Math.exp(-13*dt));
    if (progress<1) return;
    [hero.x,hero.z] = legs.at(-1).to;
    hero.stride = 0;
    hero.yaw = 0;
    if (after==="dorm") {
      this.reachDorm();
      return;
    }
    if (after==="complete") {
      this.setPhase("complete");
      this.ui.complete.hidden = false;
      this.ui.menu.focus({preventScroll:true});
      return;
    }
    if (after==="next") {
      this.index++;
      this.updateProgress();
    }
    this.reachQuestion();
  }

  positionChoices(reaction) {
    const p = this.painter, z = WeddingCampusInterior.gates[this.index];
    const low = this.ui.progress.parentElement.getBoundingClientRect().bottom+8;
    const [x,y,dz] = WeddingCampusInterior.teacherPosition(reaction.block,reaction.laugh);
    const [speaker,speakerTop] = this.phase==="dorm-choice" ?
      p.project(0,2.53,WeddingCampusDorm.residentZ) : p.project(x,y+2.32,z+dz);
    let bottom = speakerTop-8;
    if (this.phase==="question") bottom = Math.min(bottom,this.positionDoorButtons(z)-14);
    else if (!this.ui.bargain.hidden) bottom = Math.min(bottom,this.ui.bargain.getBoundingClientRect().top-10);
    const {message} = this.ui;
    const margin = message.offsetWidth/2+12;
    const center = Math.min(p.w-margin,Math.max(margin,speaker));
    message.style.left = `${center}px`;
    message.style.setProperty("--speech-pointer",`${speaker-center}px`);
    message.style.top = `${Math.max(low,bottom-message.offsetHeight)}px`;
  }

  positionDoorButtons(z) {
    const p = this.painter;
    const {doorX,doorWidth,doorInset,answerPanel} = WeddingCampusInterior;
    const faceZ = z+answerPanel.front;
    const doorHalf = doorWidth/2-doorInset;
    const panelHalf = doorHalf-answerPanel.inset/2;
    const hitTop = p.project(0,3.44,faceZ)[1];
    const hitBottom = p.project(0,.06,faceZ)[1];
    let highest = Infinity;
    for (const [index,button] of this.buttons.entries()) {
      const x = (index===0 ? -1 : 1)*doorX;
      const [center,plaqueY] = p.project(x,answerPanel.y,faceZ);
      const left = Math.max(3,p.project(x-doorHalf,answerPanel.y,faceZ)[0]);
      const right = Math.min(p.w-3,p.project(x+doorHalf,answerPanel.y,faceZ)[0]);
      const panelLeft = p.project(x-panelHalf,answerPanel.y,faceZ)[0];
      const panelRight = p.project(x+panelHalf,answerPanel.y,faceZ)[0];
      const plaqueWidth = Math.min(panelRight-panelLeft,2*Math.min(center-4,p.w-center-4));
      button.style.left = `${left}px`;
      button.style.top = `${hitTop}px`;
      button.style.width = `${right-left}px`;
      button.style.height = `${hitBottom-hitTop}px`;
      button.style.setProperty("--plaque-x",`${center-left}px`);
      button.style.setProperty("--plaque-y",`${plaqueY-hitTop}px`);
      button.style.setProperty("--plaque-width",`${plaqueWidth}px`);
      highest = Math.min(highest,plaqueY-button.firstElementChild.offsetHeight/2);
    }
    return highest;
  }

  frame(dt) {
    this.elapsed += dt;
    if (this.phase==="walk") {
      this.stepWalk(dt);
      this.dirty = true;
    } else if (this.phase==="open") {
      this.doors[this.index].progress = WeddingDrive.smooth((this.elapsed-.18)/.50);
      if (this.elapsed>=.75) this.exitDoor();
      this.dirty = true;
    } else if (this.phase==="dorm-opening") {
      this.dorm.opening = WeddingDrive.smooth(this.elapsed/.94);
      if (this.elapsed>=1.06) {
        const entry = WeddingCampusDorm.entranceZ;
        this.walk([[0,entry+.47],[-1.16,entry+3.5]],"dorm");
      }
      this.dirty = true;
    } else if (this.phase==="dorm-spending" || this.phase==="dorm-morphing") {
      this.stepDormEnding(this.phase==="dorm-spending");
    } else if (this.phase==="reject") {
      if (this.elapsed>=.25) this.showRejection();
      this.dirty = true;
    } else if (this.phase==="fatal-reply" && this.elapsed>=.90) {
      this.fail(this.failureLine);
    } else if (this.phase==="caught-reply" && this.elapsed>=1.30) {
      this.startBrideRush();
    } else if (this.phase==="bride-rush") {
      this.stepBrideRush();
      this.dirty = true;
    } else if (this.phase==="kiss") {
      this.stepKiss();
      this.dirty = true;
    } else if (this.phase==="ending") {
      this.fadeMusic(1-WeddingDrive.smooth(this.elapsed/.74));
      if (this.elapsed<1.70) return;
      this.setPhase("menu");
      this.mainMenu();
      this.ending.classList.add("leaving");
      Promise.allSettled(this.ending.getAnimations().map(animation=>animation.finished)).then(()=>{
        this.ending.hidden = true;
        this.ending.classList.remove("leaving");
      });
      return;
    } else if (this.phase==="bribe-only" && this.ui.pay.disabled) {
      if (this.elapsed>=1.18) this.ui.pay.disabled = false;
      this.dirty = true;
    } else if (this.phase==="paying") {
      const {before,after} = this.payment;
      const progress = WeddingDrive.smooth(this.elapsed/.70);
      this.updateCapital(after+Math.round((before-after)*(1-progress)));
      if (this.elapsed>=.92) this.allowPassage();
      this.dirty = true;
    } else if (this.phase==="paid" && this.elapsed>=.94) {
      this.openDoor();
    } else if (this.phase==="failure" && this.elapsed>=2.65) {
      this.setPhase("resetting");
      this.restart();
      return;
    }
    const {w,h} = this.painter;
    if (!this.dirty && this.width===w && this.height===h) return;
    this.width = w;
    this.height = h;
    this.dirty = false;
    const reaction = this.reaction();
    this.interior.draw(this.hero,this.doors,reaction,this.bride,this.closeup,this.dorm);
    if (!this.ui.message.hidden) this.positionChoices(reaction);
  }
};
