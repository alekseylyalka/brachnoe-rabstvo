"use strict";

window.WeddingVehicleDepth = class WeddingVehicleDepth {
  constructor() {
    this.layer = document.createElement("canvas");
    this.gl = this.layer.getContext("webgl", {alpha:true,antialias:true,depth:true});
    this.meshes = new WeakMap();
    this.layer.addEventListener("webglcontextrestored",()=>this.setup());
    this.setup();
  }

  setup() {
    const gl = this.gl;
    this.program = null;
    if (!gl || gl.isContextLost()) return;
    const compile = (type,source)=>{
      const shader = gl.createShader(type);
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER,`
      attribute vec3 position, normal, paint;
      uniform mat3 pose, normalPose;
      uniform vec3 origin;
      uniform vec4 lens;
      uniform vec3 eye;
      uniform bool warmInterior;
      const float nearPlane = .55;
      const float farPlane = 450.0;
      varying vec3 color;
      void main() {
        vec3 world = pose * position + origin;
        float height = eye.y - world.y;
        float depth = world.z + eye.z + height * .16;
        float clipZ = ((farPlane + nearPlane) * depth - 2.0 * farPlane * nearPlane) / (farPlane - nearPlane);
        gl_Position = vec4(lens.z * depth + lens.x * (world.x - eye.x),
          lens.w * depth - lens.y * height, clipZ, depth);
        float light = max(0.0, dot(normalize(normalPose * normal), vec3(-.48,.78,-.39)));
        color = paint * (.754 + .476 * light) + vec3(4.0,4.0,9.0) / 255.0;
        if (warmInterior) {
          float bay = mod(world.z,6.0)-3.0;
          float heightToLight = world.y-4.1;
          float pool = 1.0/(1.0+.20*(bay*bay+.28*world.x*world.x+.25*heightToLight*heightToLight));
          color = paint * (vec3(.66,.62,.61)+vec3(.38,.30,.20)*light+vec3(.46,.30,.16)*pool);
          color = mix(color,vec3(.35,.23,.17),smoothstep(13.0,88.0,depth)*.76);
        }
        color = min(vec3(1.0),color);
      }
    `);
    const fragment = compile(gl.FRAGMENT_SHADER,`
      precision mediump float;
      varying vec3 color;
      void main() { gl_FragColor = vec4(color, 1.0); }
    `);
    const program = gl.createProgram();
    gl.attachShader(program,vertex);
    gl.attachShader(program,fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }
    this.program = program;
    this.meshes = new WeakMap();
    this.attributes = ["position","normal","paint"].map(name=>gl.getAttribLocation(program,name));
    this.uniforms = Object.fromEntries(["pose","normalPose","origin","lens","eye","warmInterior"].map(name=>[name,gl.getUniformLocation(program,name)]));
  }

  add(mesh,x,y,z,yaw,scale=1,tilt=0,sortHeight=.18) {
    this.batch.push({mesh,x,y,z,yaw,scale,tilt,sortHeight});
  }

  start() {
    this.batch = [];
  }

  geometry(mesh) {
    if (this.meshes.has(mesh)) return this.meshes.get(mesh);
    const gl = this.gl, vertices = [];
    for (const [face,material] of mesh.faces) {
      if (typeof material!=="string") continue;
      const [a,b,c] = face;
      const [ux,uy,uz] = b.map((n,i)=>n-a[i]);
      const [vx,vy,vz] = c.map((n,i)=>n-a[i]);
      const normal = [uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
      const pale = material.match(/../g).map(hex=>parseInt(hex,16)/255);
      for (let i=2;i<face.length;i++) {
        for (const point of [a,face[i-1],face[i]]) vertices.push(...point,...normal,...pale);
      }
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    const geometry = {buffer,count:vertices.length/9};
    this.meshes.set(mesh,geometry);
    return geometry;
  }

  paint(p,warmInterior=false) {
    const gl = this.gl;
    if (!this.program || gl.isContextLost()) {
      const faces = [];
      for (const {mesh,x,y,z,yaw,scale,tilt,sortHeight} of this.batch) {
        mesh.collectFaces(p,x,y,z,yaw,scale,tilt,faces,sortHeight);
      }
      faces.sort((a,b)=>b.depth-a.depth);
      for (const {points,fill} of faces) {
        if (typeof fill==="string") p.poly(points,fill);
        else p.sticker(points,fill);
      }
      return;
    }
    const w = Math.ceil(p.w*p.dpr), h = Math.ceil(p.h*p.dpr);
    if (this.layer.width!==w) this.layer.width = w;
    if (this.layer.height!==h) this.layer.height = h;
    const {uniforms:u} = this;
    gl.viewport(0,0,w,h);
    gl.useProgram(this.program);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CW);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform4f(u.lens,2*p.fx/p.w,2*p.fy/p.h,2*p.cx/p.w-1,1-2*p.horizon/p.h);
    gl.uniform3f(u.eye,p.cameraX,p.eye,6-p.cameraDepth);
    gl.uniform1i(u.warmInterior,warmInterior);
    for (const {mesh,x,y,z,yaw,scale,tilt} of this.batch) {
      const {buffer,count} = this.geometry(mesh);
      const basis = [[1,0,0],[0,1,0],[0,0,1]];
      const inverse = Array.isArray(scale) ? scale.map(n=>1/n) : 1/scale;
      gl.uniformMatrix3fv(u.pose,false,basis.flatMap(WeddingModels.poseTransform(yaw,scale,tilt)));
      gl.uniformMatrix3fv(u.normalPose,false,basis.flatMap(WeddingModels.poseTransform(yaw,inverse,tilt)));
      gl.uniform3f(u.origin,x,y,z);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for (const [i,attribute] of this.attributes.entries()) {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute,3,gl.FLOAT,false,36,i*12);
      }
      gl.drawArrays(gl.TRIANGLES,0,count);
    }
    p.ctx.drawImage(this.layer,0,0,p.w,p.h);
  }
};
