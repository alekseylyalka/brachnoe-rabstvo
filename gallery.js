"use strict";

window.WeddingGallery = (() => {
  const groups = [
    ["common","Обычные",35,[
      "camphoto-1804928587-2","f9c79970-074b-4b07-aa39-63a9fe449f18-2","img-0941-2","img-1750-2",
      "img-2181-2","img-2418-2","img-2893-2","img-2894-2","img-2927-2","img-2951-2","img-3258-2",
      "img-4439-2","img-5066-2","img-5383-2","img-6556-2","img-6590-2","img-6775-2","img-8314-2",
      "img-8407-2","img-9636-2","img-9895-2"
    ]],
    ["rare","Редкие",20,[
      "img-0970-2","img-1094-2","img-1165-2","img-2727-2","img-2829-2","img-2891-2","img-2892-2",
      "img-2898-2","img-2952-2","img-2954-2","img-4271-2","img-6082-2","img-6775-3","img-8610-2",
      "img-9548-2","photo-output-2"
    ]],
    ["epic","Эпические",10,[
      "5336b377-6139-4a00-a338-69de8920445f-2","6bddea9f-51f2-4eed-92cf-6aaa47bf7ab4","img-0833-2",
      "img-1885-2","img-2060-2","img-2104-2","img-2229-2","img-2953-2","img-2955-2","img-4362-2",
      "img-5727-2","img-8898-2","img-8902-2","img-9931-2"
    ]],
    ["legendary","Легендарные",5,[
      "18dfaa1a-bc67-4ba1-808c-ce96e26eb5da-2","449b04e6-ef09-467b-81c2-0089d082d6fd-2",
      "637742e6-c7e2-4a6c-9c38-9f6c65dfff9d","8e677402-abb8-4008-8d3e-955823dc1e23-2","img-2289-2",
      "img-2895-2","img-2956-2","img-8901-2"
    ]],
    ["developers","Разработчики",0,[
      "img-1196-2","img-2897-2","img-5080-2","img-9609-2"
    ]],
  ].map(([key,label,weight,files]) => ({
    key,label,weight,paintings:files.map(file => key+"-"+file)
  }));
  const mapGroups = groups.filter(group => group.weight>0);
  const mapWeight = mapGroups.reduce((total,group) => total+group.weight,0);
  const mapPaintings = mapGroups.flatMap(group => group.paintings);
  const paintings = new Set(groups.flatMap(group => group.paintings));
  const developers = groups.find(group => group.key==="developers").paintings;
  const source = id => `assets/collection/${id}.webp`;
  const describe = id => {
    const group = groups.find(item => item.paintings.includes(id));
    return `Картина №${group.paintings.indexOf(id)+1} · ${group.label}`;
  };
  const pick = (items,random=Math.random) => items[Math.floor(random()*items.length)];

  function spawnAt(count,place,{always=false,random=Math.random}={}) {
    const result = [];
    for (let index=0;index<count;index++) {
      if (!always && random()>=mapWeight/100) continue;
      let roll = random()*mapWeight;
      for (const {weight,paintings} of mapGroups) {
        roll -= weight;
        if (roll>=0) continue;
        result.push({...place(index),image:pick(paintings,random)});
        break;
      }
    }
    return result;
  }

  function polygonArea(points) {
    return Math.abs(points.reduce((sum,[x,y],index) => {
      const [nextX,nextY] = points[(index+1)%points.length];
      return sum+x*nextY-y*nextX;
    },0))/2;
  }

  function clip(points,axis,edge,direction) {
    const clipped = [];
    for (let index=0;index<points.length;index++) {
      const a = points[index], b = points[(index+1)%points.length];
      const insideA = (a[axis]-edge)*direction>=0;
      const insideB = (b[axis]-edge)*direction>=0;
      if (insideA) clipped.push(a);
      if (insideA!==insideB) {
        const ratio = (edge-a[axis])/(b[axis]-a[axis]);
        const point = [a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio];
        point[axis] = edge;
        clipped.push(point);
      }
    }
    return clipped;
  }

  function recognizable(points,width,height) {
    const area = polygonArea(points);
    if (area<360) return false;
    const visible = clip(clip(clip(clip(points,0,0,1),0,width,-1),1,0,1),1,height,-1);
    const visibleArea = polygonArea(visible);
    if (visibleArea<Math.max(360,area*.5)) return false;
    const xs = visible.map(point=>point[0]), ys = visible.map(point=>point[1]);
    return Math.max(...xs)-Math.min(...xs)>=20 && Math.max(...ys)-Math.min(...ys)>=20;
  }

  function display(dialog,progress) {
    const filters = dialog.querySelector(".collection-groups");
    const scroll = dialog.querySelector(".collection-scroll");
    const grid = scroll.firstElementChild;
    const total = dialog.querySelector(".collection-total");
    let active = groups[0];
    const buttons = groups.map(group => {
      const button = document.createElement("button");
      const label = document.createElement("span");
      const count = document.createElement("strong");
      button.type = "button";
      button.className = "wedding-secondary";
      button.dataset.rarity = group.key;
      button.setAttribute("aria-controls",scroll.id);
      label.textContent = group.label;
      button.append(label,count);
      button.addEventListener("click",() => {
        active = group;
        scroll.scrollTop = 0;
        refresh();
      });
      filters.append(button);
      return {button,count};
    });

    function refresh() {
      total.textContent = `Открыто ${progress.opened.size} из ${paintings.size}`;
      groups.forEach((group,index) => {
        const opened = group.paintings.filter(id=>progress.opened.has(id)).length;
        buttons[index].count.textContent = `${opened}/${group.paintings.length}`;
        buttons[index].button.setAttribute("aria-pressed",String(group===active));
      });
      scroll.setAttribute("aria-label",active.label);
      grid.dataset.rarity = active.key;
      grid.replaceChildren(...active.paintings.map((id,index) => {
        const item = document.createElement("div");
        item.className = "collection-card";
        if (progress.opened.has(id)) {
          const image = new Image();
          image.loading = "lazy";
          image.alt = describe(id);
          image.src = source(id);
          item.append(image);
        } else {
          item.classList.add("locked");
          item.setAttribute("role","img");
          item.setAttribute("aria-label",`Картина №${index+1} закрыта`);
          const lock = document.createElement("span");
          lock.className = "collection-lock";
          lock.setAttribute("aria-hidden","true");
          item.append(lock);
        }
        return item;
      }));
    }

    return {
      open() {
        refresh();
        dialog.showModal();
        scroll.scrollTop = 0;
      },
      refresh() {
        if (dialog.open) refresh();
      }
    };
  }

  return {mapPaintings,paintings,developers,source,describe,pick,spawnAt,recognizable,display};
})();
