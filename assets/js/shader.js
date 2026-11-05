// shader.js — "flowing oil" ambient light behind the hero sun. Raw WebGL1, ~2 KB.
// Only loaded when: motion allowed, not Save-Data, ≥6 cores, ≥4 GB RAM (see core.js).
// Renders at reduced resolution, pauses when offscreen or the tab is hidden.

const canvas = document.querySelector('[data-shader]');
const gl = canvas?.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power', premultipliedAlpha: false, failIfMajorPerformanceCaveat: true });

// Without a real GPU (SwiftShader, llvmpipe, Microsoft Basic Render), WebGL runs on the
// CPU and would steal the main thread, so we skip it and keep the CSS sun.
const softwareGL = (() => {
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
})();

if (gl && !softwareGL) {
  const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  // Warm, slow domain-warped noise in saffron/gold tones, faded to transparent at the edges.
  const fs = `precision mediump float;
uniform vec2 r;uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
float tt=t*.035;
vec2 q=vec2(fbm(uv*1.6+tt),fbm(uv*1.6-tt+3.1));
float f=fbm(uv*1.3+q*1.8+vec2(tt*.7,-tt*.4));
vec3 saffron=vec3(.851,.451,.122),gold=vec3(.722,.569,.227),cream=vec3(.957,.929,.878);
vec3 c=mix(cream,mix(gold,saffron,smoothstep(.35,.8,f)),smoothstep(.2,.9,f));
float vig=smoothstep(.95,.15,length(uv));
gl_FragColor=vec4(c,.55*vig*smoothstep(.25,.75,f));
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r');
    const uT = gl.getUniformLocation(prog, 't');

    const SCALE = 0.45; // render at ~half resolution; it's a soft blur anyway
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    new ResizeObserver(resize).observe(canvas);
    resize();

    let visible = true, raf = 0, last = 0, t0 = performance.now();
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last > 33) { // cap ~30fps — ambient, not a game
        last = now;
        gl.uniform2f(uR, canvas.width, canvas.height);
        gl.uniform1f(uT, (now - t0) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      raf = requestAnimationFrame(frame);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(frame); };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); }).observe(canvas);
    document.addEventListener('visibilitychange', run);
    canvas.classList.add('is-live');
    run();
  }
}
