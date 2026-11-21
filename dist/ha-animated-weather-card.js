/*!
 * ha-animated-weather-card v1.0.0
 * Home Assistant custom card: weather with a live animated WebGL sky
 * (sun, moon & stars, clouds, rain, snow, thunderstorm, fog, wind; day / dusk / night).
 * One file, no dependencies. MIT License. https://github.com/Marco520520/ha-animated-weather-card
 *
 * Minimal config:
 *   type: custom:ha-animated-weather-card
 *   weather_entity: weather.home
 *
 * Preview every sky without waiting for the weather:  demo: rain   (or append ?demo=rain to the dashboard URL)
 * Demo values: rain, pouring, snow, storm, fog, clear, night, cloudy, partly, windy, hail, sleet  (suffix "-night" = at night)
 */
(() => {
const TAG = 'ha-animated-weather-card';
if (customElements.get(TAG)) return;

/* ====================== OPTIONS ====================== */
const DEFAULTS = {
  weather_entity: null,    // weather.* entity: current state + hourly forecast (required)
  daily_entity: null,      // optional weather.* used for the daily forecast if the main one gives few days
  details_entity: null,    // optional weather.* providing uv_index / cloud_coverage / wind gusts (e.g. Met.no)
  feels_like_entity: null, // optional weather.* whose hourly forecast has apparent_temperature (e.g. Open-Meteo)
  sun_entity: 'sun.sun',   // sun entity (elevation, azimuth, sunrise / sunset)
  name: '',                // location label in the header (e.g. "Vienna")
  footer: '',              // free text in the footer (e.g. data source)
  locale: 'auto',          // auto | en | sk | cs | de   (auto = Home Assistant language)
  hour12: null,            // null = by locale, true / false to force 12 / 24 h clock
  mode: 'auto',            // auto | day | night   (force the sky look)
  animated: true,          // false = static gradient instead of the WebGL sky
  show_clock: true,
  show_details: true,      // humidity, wind, gusts, pressure, UV, cloud cover
  show_sun: true,          // sunrise / sunset arc
  show_hourly: true,
  show_graph: true,        // 24 h temperature + precipitation graph
  show_daily: true,
  hours: 12,               // hours shown in the hourly strip
  days: 5,                 // days shown in the daily strip
  chips: [],               // extra values: [{ entity: sensor.x, label: 'Indoor', unit: '°C', decimals: 1 }]
  refresh_min: 15,         // forecast refresh interval
  quality: 0.45,           // sky resolution (share of pixels, 0.2 - 1)
  fps: 30,                 // sky frame rate
  border_radius: 24,       // px
  height: null,            // e.g. "520px" (default: fits the content)
  load_fonts: true,        // load Manrope + Sora from Google Fonts (false = system fonts, no external request)
  demo: null               // force a sky + sample data, see header
};
const I18N = {
  en: { cond: { sunny: 'Sunny', 'clear-night': 'Clear night', partlycloudy: 'Partly cloudy', cloudy: 'Cloudy', rainy: 'Rain', pouring: 'Heavy rain', snowy: 'Snow', 'snowy-rainy': 'Sleet', lightning: 'Thunderstorm', 'lightning-rainy': 'Thunderstorm with rain', fog: 'Fog', windy: 'Windy', 'windy-variant': 'Windy, cloudy', hail: 'Hail', exceptional: 'Exceptional weather', unavailable: 'Weather unavailable', unknown: 'Weather unknown' },
    humidity: 'Humidity', wind: 'Wind', gusts: 'Gusts', pressure: 'Pressure', uv: 'UV index', clouds: 'Cloud cover', feels: 'Feels like', max: 'High', min: 'Low', today: 'Today', next24: 'Next 24 h', precip: 'precipitation', updated: 'updated', demo: 'demo', dir: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] },
  sk: { cond: { sunny: 'Slnečno', 'clear-night': 'Jasná noc', partlycloudy: 'Polooblačno', cloudy: 'Zamračené', rainy: 'Dážď', pouring: 'Lejak', snowy: 'Sneženie', 'snowy-rainy': 'Dážď so snehom', lightning: 'Búrka', 'lightning-rainy': 'Búrka s dažďom', fog: 'Hmla', windy: 'Veterno', 'windy-variant': 'Veterno, oblačno', hail: 'Krupobitie', exceptional: 'Výnimočné počasie', unavailable: 'Počasie nedostupné', unknown: 'Počasie neznáme' },
    humidity: 'Vlhkosť', wind: 'Vietor', gusts: 'Nárazy', pressure: 'Tlak', uv: 'UV index', clouds: 'Oblačnosť', feels: 'Pocitovo', max: 'Max', min: 'Min', today: 'Dnes', next24: 'Najbližších 24 h', precip: 'zrážky', updated: 'aktualizované', demo: 'ukážka', dir: ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'] },
  cs: { cond: { sunny: 'Slunečno', 'clear-night': 'Jasná noc', partlycloudy: 'Polojasno', cloudy: 'Zataženo', rainy: 'Déšť', pouring: 'Liják', snowy: 'Sněžení', 'snowy-rainy': 'Déšť se sněhem', lightning: 'Bouřka', 'lightning-rainy': 'Bouřka s deštěm', fog: 'Mlha', windy: 'Větrno', 'windy-variant': 'Větrno, oblačno', hail: 'Krupobití', exceptional: 'Výjimečné počasí', unavailable: 'Počasí nedostupné', unknown: 'Počasí neznámé' },
    humidity: 'Vlhkost', wind: 'Vítr', gusts: 'Nárazy', pressure: 'Tlak', uv: 'UV index', clouds: 'Oblačnost', feels: 'Pocitově', max: 'Max', min: 'Min', today: 'Dnes', next24: 'Příštích 24 h', precip: 'srážky', updated: 'aktualizováno', demo: 'ukázka', dir: ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ'] },
  de: { cond: { sunny: 'Sonnig', 'clear-night': 'Klare Nacht', partlycloudy: 'Teilweise bewölkt', cloudy: 'Bewölkt', rainy: 'Regen', pouring: 'Starkregen', snowy: 'Schnee', 'snowy-rainy': 'Schneeregen', lightning: 'Gewitter', 'lightning-rainy': 'Gewitter mit Regen', fog: 'Nebel', windy: 'Windig', 'windy-variant': 'Windig, bewölkt', hail: 'Hagel', exceptional: 'Außergewöhnliches Wetter', unavailable: 'Wetter nicht verfügbar', unknown: 'Wetter unbekannt' },
    humidity: 'Feuchte', wind: 'Wind', gusts: 'Böen', pressure: 'Druck', uv: 'UV-Index', clouds: 'Bewölkung', feels: 'Gefühlt', max: 'Max', min: 'Min', today: 'Heute', next24: 'Nächste 24 h', precip: 'Niederschlag', updated: 'aktualisiert', demo: 'Demo', dir: ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'] }
};
// parametre oblohy podľa stavu HA: cloud (0–1 pokrytie), dark (tmavé mraky), rain, snow, fog, wind, storm
const SCENE = { sunny: { cloud: .12 }, 'clear-night': { cloud: .1 }, partlycloudy: { cloud: .55 }, cloudy: { cloud: .95, dark: .45 }, fog: { cloud: .85, dark: .4, fog: .8 }, rainy: { cloud: 1, dark: .7, rain: .7 }, pouring: { cloud: 1, dark: .82, rain: 1 }, snowy: { cloud: .95, dark: .35, snow: .85 }, 'snowy-rainy': { cloud: 1, dark: .6, rain: .4, snow: .6 }, lightning: { cloud: 1, dark: .95, rain: .25, storm: 1 }, 'lightning-rainy': { cloud: 1, dark: .95, rain: .9, storm: 1 }, hail: { cloud: 1, dark: .7, rain: .6, snow: .5 }, windy: { cloud: .4, wind: 1 }, 'windy-variant': { cloud: .8, wind: 1, dark: .2 }, exceptional: { cloud: .9, dark: .6 } };
const DEMO = { rain: 'rainy', pouring: 'pouring', snow: 'snowy', storm: 'lightning-rainy', fog: 'fog', clear: 'sunny', night: 'clear-night', cloudy: 'cloudy', partly: 'partlycloudy', windy: 'windy', hail: 'hail', sleet: 'snowy-rainy' };
/* ====================== OBLOHA (WebGL) ====================== */
const SKY_VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const SKY_FS = `precision mediump float;
uniform vec2 R; uniform float T;
uniform float uCloud, uDark, uRain, uSnow, uNight, uDusk, uFlash, uFog, uWind, uMorn, uBolt;
uniform vec2 uSun, uFlashP;
float h1(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x), mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<6;i++){ v+=a*n2(p); p=m*p; a*=.5; } return v; }
float segd(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
vec3 skyCol(float y){
  vec3 dayT=vec3(.12,.36,.78), dayB=vec3(.55,.76,.95);
  vec3 duT=vec3(.11,.15,.36), duM=vec3(.78,.43,.42), duB=vec3(.98,.70,.42);
  vec3 niT=vec3(.008,.016,.05), niB=vec3(.07,.12,.26);
  vec3 ovT=vec3(.33,.38,.45), ovB=vec3(.62,.67,.72);
  vec3 day=mix(dayB,dayT,pow(y,.8));
  duB=mix(duB,vec3(1.,.80,.62),uMorn); duM=mix(duM,vec3(.86,.56,.66),uMorn); duT=mix(duT,vec3(.20,.27,.52),uMorn);
  vec3 du=y<.5?mix(duB,duM,y*2.):mix(duM,duT,(y-.5)*2.);
  vec3 ni=mix(niB,niT,y);
  vec3 c=mix(day,du,uDusk); c=mix(c,ni,uNight);
  vec3 ov=mix(ovB,ovT,y)*mix(1.,.16,uNight)*mix(1.,.55,uDark);
  return mix(c,ov,clamp(uDark*1.1,0.,1.));
}
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y; vec2 p=vec2(uv.x*asp,uv.y);
  vec3 col=skyCol(uv.y);
  col+=mix(vec3(1.,.55,.25),vec3(1.,.7,.5),uMorn)*uDusk*exp(-abs(uv.x-uSun.x)*2.2)*exp(-uv.y*3.)*.55*(1.-uDark*.8);
  vec2 sp=vec2(uSun.x*asp,uSun.y); float sd=length(p-sp);
  float vis=(1.-uCloud*.75);
  vec3 sunC=mix(vec3(1.,.96,.85),vec3(1.,.62,.35),uDusk);
  if(uNight<.5){
    col+=sunC*(smoothstep(.06,.0,sd)*1.2+exp(-sd*5.)*.45+exp(-sd*1.6)*.18)*vis;
    float an=atan(p.y-sp.y,p.x-sp.x); float ray=n2(vec2(an*4.,T*.2))*n2(vec2(an*7.+3.,T*.3));
    col+=sunC*ray*exp(-sd*3.)*.18*vis*(1.-uDark);
    // odlesky objektívu smerom do stredu
    vec2 cen=vec2(asp*.5,.5);
    for(int i=1;i<4;i++){ float fi=float(i); vec2 fp=sp+(cen-sp)*(.45*fi); col+=sunC*smoothstep(.02*fi,.0,length(p-fp))*.10*vis*(1.-uDark)*(1.-uDusk*.5); }
  } else {
    // mesiac s krátermi a žiarou
    float cr=n2((p-sp)*70.)*n2((p-sp)*33.+5.);
    vec3 mc=vec3(.86,.89,1.)-vec3(.16)*smoothstep(.45,.7,cr);
    col+=mc*(smoothstep(.035,.03,sd)*.95+exp(-sd*9.)*.2+exp(-sd*2.5)*.05)*vis;
  }
  if(uNight>0.){
    vec2 g=uv*vec2(asp,1.)*48.; vec2 id=floor(g); float r=h1(id);
    if(r>.965){ vec2 f=fract(g)-.5; float tw=.55+.45*sin(T*(1.5+r*4.)+r*40.);
      col+=vec3(1.)*smoothstep(.22,.0,length(f))*tw*1.4*uNight*(1.-uCloud)*smoothstep(.15,.6,uv.y); }
    // padajúca hviezda každých ~11 s
    float per=11.; float ss=fract(T/per); float sid=floor(T/per);
    vec2 s0=vec2(.15+h1(vec2(sid,3.))*.6,.95)*vec2(asp,1.); vec2 dir=normalize(vec2(1.,-.55));
    vec2 rel=p-(s0+dir*ss*2.2); float along=dot(rel,dir); float perp=abs(dot(rel,vec2(-dir.y,dir.x)));
    float tail=smoothstep(-.16,0.,along)*step(along,0.);
    col+=vec3(1.)*smoothstep(.005,0.,perp)*tail*uNight*(1.-uCloud)*step(ss,.45)*smoothstep(.45,.3,ss)*1.3;
  }
  float spd=.012+uWind*.05+uDark*.012;
  vec2 lightDir=normalize(sp-p+1e-4)*.06;
  vec3 cLit=mix(vec3(1.),sunC*1.05,uDusk*.7);
  vec3 cSh=mix(vec3(.62,.66,.74),vec3(.42,.36,.46),uDusk);
  // vysoké riasy (najďalej, najpomalšie)
  float ci=fbm(p*vec2(2.2,7.)+vec2(T*.015,T*.004));
  col=mix(col,mix(cLit,vec3(.75,.78,.9),uNight)*.95,smoothstep(.6,.82,ci)*.3*(1.-uCloud)*(1.-uNight*.75)*smoothstep(.45,.95,uv.y));
  // ďaleká vrstva
  vec2 qf=p*1.3+vec2(T*spd*.55,0.);
  float wf=fbm(qf*.7+vec2(T*.01,-T*.006));
  float df=fbm(qf+wf*.9+vec2(-T*.004,T*.003));
  float covf=mix(.78,.36,uCloud);
  float densf=smoothstep(covf,covf+.25,df)*smoothstep(.0,.55,uv.y+uCloud*.5)*.75;
  float df2=fbm(qf+wf*.9+vec2(-T*.004,T*.003)+lightDir*.8);
  float litf=clamp(.6+(df-df2)*5.,0.,1.);
  // blízka vrstva (rýchlejšia – paralaxa)
  vec2 q=p*2.2+vec2(T*spd*1.6,0.);
  float w=fbm(q*.6+vec2(T*.012,T*.007));
  float d=fbm(q+w*.85+vec2(T*.01,-T*.004));
  float cov=mix(.72,.30,uCloud);
  float dens=smoothstep(cov,cov+.2,d)*smoothstep(-.1,.35,uv.y+uCloud*.4);
  dens=mix(dens,max(dens,.55+.45*smoothstep(.3,.7,d)),smoothstep(.85,1.,uCloud));
  float d2=fbm(q+w*.85+vec2(T*.01,-T*.004)+lightDir);
  float lit=clamp(.55+(d-d2)*6.,0.,1.);
  float fl=uFlash*exp(-length(p-vec2(uFlashP.x*asp,uFlashP.y))*1.3);
  vec3 ccf=mix(cSh,cLit,litf); ccf=mix(ccf,vec3(.34,.37,.42),uDark*.75); ccf=mix(ccf,vec3(.075,.09,.14)+ccf*.04,uNight); ccf+=vec3(.7,.7,1.)*fl*1.4;
  col=mix(col,ccf,densf);
  vec3 cc=mix(cSh,cLit,lit);
  cc=mix(cc,vec3(.30,.33,.38),uDark*.75);
  cc=mix(cc,vec3(.09,.11,.17)+cc*.05+vec3(.05,.06,.08)*lit,uNight);
  cc+=sunC*exp(-sd*4.)*.35*(1.-uNight)*vis*(1.-dens*.4);
  cc+=vec3(.75,.75,1.)*fl*2.2; col+=vec3(.5,.5,.8)*uFlash*.35;
  col=mix(col,cc,dens*.96);
  // blesk – kreslená čiara so zlomami od miesta úderu nadol
  if(uBolt>0.01){ vec2 b0=vec2(uFlashP.x*asp,uFlashP.y); float bd=9.; float seed=floor(T*3.);
    for(int i=0;i<7;i++){ float fi=float(i); vec2 b1=b0+vec2((h1(vec2(fi,seed))-.5)*.14,-.11-h1(vec2(seed,fi))*.04); bd=min(bd,segd(p,b0,b1));
      if(i==2||i==4){ vec2 br=b0+vec2((h1(vec2(fi+9.,seed))-.5)*.3,-.12); bd=min(bd,segd(p,b0,br)+.004); } b0=b1; }
    col+=vec3(.85,.9,1.)*(smoothstep(.006,.0,bd)*1.6+smoothstep(.06,.0,bd)*.35)*uBolt; }
  // hmla – dve vrstvy
  if(uFog>0.){ float f=fbm(p*2.+vec2(T*.04,0.)); float f2=fbm(p*3.5+vec2(-T*.025,T*.01));
    vec3 fc=mix(vec3(.72,.75,.79),vec3(.16,.18,.22),uNight);
    col=mix(col,fc,uFog*smoothstep(.85,.1,uv.y)*(.5+.5*f)); col=mix(col,fc*1.05,uFog*smoothstep(.6,.0,uv.y)*.5*f2); }
  // dážď – 3 hĺbky
  if(uRain>0.){ float r=0.;
    for(int i=0;i<3;i++){ float fi=float(i); float sc=14.+fi*10.; float sl=.08+uWind*.35+sin(T*.4)*.04; vec2 rp=vec2(p.x+p.y*sl,p.y)*vec2(sc,sc*.07);
      rp.y+=T*(9.+fi*4.); vec2 id=floor(rp); vec2 f=fract(rp); float hh=h1(id+fi*7.);
      float dropx=.2+.6*hh; float st=smoothstep(.13,.0,abs(f.x-dropx))*smoothstep(0.,.3,f.y)*smoothstep(1.,.6,f.y);
      r+=st*step(.35,hh)*(.55-fi*.12); }
    col+=vec3(.75,.82,.9)*r*uRain*.32; col*=1.-uRain*.08;
    // kvapky na skle: objavia sa, narastú, stečú so stopou
    vec2 gp=p*vec2(7.,4.); float gy=T*.05; vec2 gid=floor(vec2(gp.x,gp.y+gy)); vec2 gf=fract(vec2(gp.x,gp.y+gy))-.5;
    float gh=h1(gid); float life=fract(T*.12+gh*7.); float slide=step(.7,gh);
    vec2 go=vec2(gh-.5,fract(gh*13.)-.5)*.5; go.y+=-life*.35*slide;
    float dd=length((gf-go)*vec2(1.,1.25)); float dr=smoothstep(.11,.08,dd)*step(.45,gh)*smoothstep(0.,.15,life)*smoothstep(1.,.75,life);
    float trail=smoothstep(.05,.0,abs(gf.x-go.x))*smoothstep(0.,.08,gf.y-go.y)*step(gf.y,go.y+life*.35)*slide*step(.45,gh)*smoothstep(1.,.8,life);
    col=mix(col,col*1.12+vec3(.04),trail*uRain*.6);
    col=mix(col,col*1.18+vec3(.06),dr*uRain*.8); col+=vec3(1.)*smoothstep(.05,.0,length(gf-go-vec2(-.03,.04)))*step(.45,gh)*uRain*.25*smoothstep(0.,.15,life); }
  // sneh – 4 hĺbky, kolísanie vo vetre
  if(uSnow>0.){ float s=0.;
    for(int i=0;i<4;i++){ float fi=float(i); float sc=8.+fi*6.; vec2 sp2=p*sc; sp2.y+=T*(.6+fi*.25)*sc*.1; sp2.x+=sin(T*.7+sp2.y*.5+fi)*.35+T*uWind*sc*.08;
      vec2 id=floor(sp2), f=fract(sp2)-.5; float hh=h1(id+fi*11.); vec2 o=vec2(hh-.5,fract(hh*7.)-.5)*.6;
      s+=smoothstep(.09-fi*.012,.0,length(f-o))*step(.45,hh)*(1.-fi*.18); }
    col+=vec3(1.)*s*uSnow*.9; }
  col+=(h1(gl_FragCoord.xy+T)-.5)*.012;
  gl_FragColor=vec4(col,1.);
}`;
const UNI = ['uCloud', 'uDark', 'uRain', 'uSnow', 'uNight', 'uDusk', 'uFog', 'uWind', 'uMorn'];
class SkyGL {
  constructor(parent, quality, fps) {
    this.cv = document.createElement('canvas'); this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; parent.appendChild(this.cv);
    this.scale = quality; this.frame = 1000 / fps;
    const gl = this.gl = this.cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { this.ok = false; return; }
    try {
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, SKY_VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, SKY_FS)); gl.linkProgram(pr); gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      this.u = {}; [...UNI, 'R', 'T', 'uFlash', 'uBolt', 'uSun', 'uFlashP'].forEach((k) => { this.u[k] = gl.getUniformLocation(pr, k); });
    } catch (e) { this.ok = false; return; }
    this.ok = true; this.t0 = performance.now(); this.flash = 0; this.bolt = 0; this.nextFlash = 2; this.fp = [.6, .8]; this.cur = null; this.tgt = null;
    this._loop = this._loop.bind(this); this.raf = requestAnimationFrame(this._loop);
  }
  set(P) { this.tgt = P; if (!this.cur) this.cur = Object.assign({}, P, { sun: P.sun.slice() }); }
  _loop(now) {
    this.raf = requestAnimationFrame(this._loop);
    if (document.hidden || !this.tgt) return;
    if (this.last && now - this.last < this.frame - 2) return; this.last = now;
    const gl = this.gl, cv = this.cv;
    const w = Math.max(2, Math.round(cv.clientWidth * this.scale)), h = Math.max(2, Math.round(cv.clientHeight * this.scale));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    const t = (now - this.t0) / 1000;
    for (const k of UNI) this.cur[k] = (this.cur[k] || 0) + ((this.tgt[k] || 0) - (this.cur[k] || 0)) * .04;
    for (let i = 0; i < 2; i++) this.cur.sun[i] += (this.tgt.sun[i] - this.cur.sun[i]) * .03;
    if (this.tgt.storm) {
      if (t > this.nextFlash) { this.flash = 1; this.bolt = 1; this.fp = [.15 + Math.random() * .7, .62 + Math.random() * .3]; this.nextFlash = t + 2.5 + Math.random() * 5; this.second = t + .14; }
      if (this.second && t > this.second) { this.flash = Math.max(this.flash, .85); this.bolt = Math.max(this.bolt, .7); this.second = 0; }
    }
    this.flash *= .86; this.bolt *= .8;
    gl.uniform2f(this.u.R, w, h); gl.uniform1f(this.u.T, t);
    for (const k of UNI) gl.uniform1f(this.u[k], this.cur[k] || 0);
    gl.uniform1f(this.u.uFlash, this.flash); gl.uniform1f(this.u.uBolt, this.bolt > .02 ? this.bolt : 0);
    gl.uniform2f(this.u.uSun, this.cur.sun[0], this.cur.sun[1]); gl.uniform2f(this.u.uFlashP, this.fp[0], this.fp[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  destroy() { cancelAnimationFrame(this.raf); const ext = this.gl && this.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); this.cv.remove(); }
}
// dve plátna – každých 8 min nové plátno s prelínaním (čas v shaderi ostáva presný)
class SkyStage {
  constructor(parent, quality, fps) {
    this.parent = parent; this.q = quality; this.fps = fps; this.a = new SkyGL(parent, quality, fps); this.ok = this.a.ok; this.P = null;
    if (this.ok) this._iv = setInterval(() => this._swap(), 480e3);
  }
  set(P) { this.P = P; this.a.set(P); if (this.b) this.b.set(P); }
  _swap() {
    if (document.hidden || this.b) return;
    const b = new SkyGL(this.parent, this.q, this.fps); if (!b.ok) { b.destroy(); return; }
    b.t0 = performance.now() - Math.random() * 60000;
    if (this.P) { b.set(this.P); b.cur = Object.assign({}, this.a.cur, { sun: this.a.cur.sun.slice() }); b.nextFlash = 1e9; }
    b.cv.style.opacity = '0'; b.cv.style.transition = 'opacity 5s ease-in-out';
    this.b = b; requestAnimationFrame(() => requestAnimationFrame(() => { b.cv.style.opacity = '1'; }));
    setTimeout(() => { const old = this.a; this.a = this.b; this.b = null; old.destroy(); this.a.nextFlash = 0; }, 5500);
  }
  destroy() { clearInterval(this._iv); this.a && this.a.destroy(); this.b && this.b.destroy(); }
}
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function skyParams(cond, sun, wind, forceNight) {
  const s = SCENE[cond] || SCENE.cloudy; const P = { uCloud: s.cloud || 0, uDark: s.dark || 0, uRain: s.rain || 0, uSnow: s.snow || 0, uFog: s.fog || 0, uWind: s.wind != null ? s.wind : Math.min(1, (wind || 10) / 45), storm: !!s.storm, uNight: 0, uDusk: 0, uMorn: 0 };
  let el = sun && sun.attributes ? sun.attributes.elevation : null; const az = sun && sun.attributes && sun.attributes.azimuth != null ? sun.attributes.azimuth : null; const rising = sun && sun.attributes ? !!sun.attributes.rising : false;
  if (forceNight === true) el = -20; else if (forceNight === false) el = 32;
  if (el == null) el = 30;
  P.uNight = 1 - sm(-10, -1.5, el); P.uDusk = sm(-9, -1, el) * (1 - sm(5, 14, el)) * (P.uDark < .7 ? 1 : .35); P.uMorn = rising ? 1 : 0;
  const a = az != null ? az : (rising ? 100 : 260);
  P.sun = [Math.min(.94, Math.max(.06, (a - 70) / 220)), .07 + Math.min(1, Math.max(-.2, el / 45)) * .82];
  if (P.uNight > .6) P.sun = [Math.min(.9, Math.max(.1, ((a + 180) % 360 - 70) / 220)), .78];
  return P;
}

/* ====================== KARTA ====================== */
const CSS = `
:host{display:block;position:relative;height:100%;min-height:420px;border-radius:var(--haw-radius,24px);overflow:hidden;color:#fff;font-family:'Manrope',system-ui,sans-serif;-webkit-font-smoothing:antialiased;user-select:none}
*{box-sizing:border-box;margin:0;padding:0}
.sky{position:absolute;inset:0;background:linear-gradient(180deg,#2a6ab3,#9dbfdd);transition:background 2s}
.sky.night{background:linear-gradient(180deg,#080c1e,#1f2f55)}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(4,8,14,.14) 28%,rgba(4,8,14,.6) 58%,rgba(4,8,14,.86) 100%);pointer-events:none}
.c{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:18px 22px 16px}
.top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.clock{font:800 46px/1 'Sora','Manrope',sans-serif;letter-spacing:-1.5px;text-shadow:0 4px 18px rgba(0,0,0,.4);font-variant-numeric:tabular-nums}
.date{font:700 13px/1.3 'Manrope',system-ui,sans-serif;color:rgba(255,255,255,.82);text-shadow:0 1px 8px rgba(0,0,0,.4);margin-top:4px}
.date b{color:#fff}
.where{font:800 12px/1 'Manrope',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.75);text-shadow:0 1px 6px rgba(0,0,0,.4);text-align:right;padding-top:6px}
.cond{font:800 28px/1.1 'Manrope',system-ui,sans-serif;margin-top:12px;text-shadow:0 2px 12px rgba(0,0,0,.4)}
.temp{display:flex;align-items:flex-start;gap:6px;margin-top:-2px}
.temp b{font:800 112px/1 'Sora','Manrope',system-ui,sans-serif;letter-spacing:-5px;text-shadow:0 6px 30px rgba(0,0,0,.45)}
.temp i{font:700 38px/1 'Sora','Manrope',system-ui,sans-serif;margin-top:12px;font-style:normal;opacity:.9}
.feel{display:flex;gap:16px;margin-top:2px;font:700 14.5px/1.3 'Manrope',system-ui,sans-serif;color:rgba(255,255,255,.85);text-shadow:0 1px 8px rgba(0,0,0,.45)}
.feel b{color:#fff}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.chips span{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:9px;background:rgba(6,10,16,.42);border:1px solid rgba(255,255,255,.12);font:700 11px/1 'Manrope',system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.chips b{font:700 13px/1 'Sora','Manrope',system-ui,sans-serif;color:#fff;letter-spacing:0;text-transform:none}
.det{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.det div{background:rgba(6,10,16,.4);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:9px 12px;display:flex;flex-direction:column;gap:5px}
.det small{font:700 10.5px/1 'Manrope',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.62)}
.det b{font:700 19px/1 'Sora','Manrope',system-ui,sans-serif}
.det b span{font:700 12px/1 'Manrope',system-ui,sans-serif;opacity:.75;margin-left:3px}
.sunrow{display:flex;align-items:center;gap:10px;margin-top:10px;font:700 13px/1 'Manrope',system-ui,sans-serif;color:rgba(255,255,255,.85)}
.sunrow svg.arc{flex:1;height:34px}
.hrs{display:grid;grid-template-columns:repeat(6,1fr);gap:8px 4px;margin-top:12px;background:rgba(6,10,16,.42);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:11px 6px 9px}
.hrs div{display:flex;flex-direction:column;align-items:center;gap:4px}
.hrs small{font:700 12px/1 'Manrope',system-ui,sans-serif;color:rgba(255,255,255,.72)}
.hrs b{font:700 17px/1 'Sora','Manrope',system-ui,sans-serif}
.hrs em{font:700 10.5px/1 'Manrope',system-ui,sans-serif;font-style:normal;color:#9fd8ff;min-height:11px}
.mg{margin-top:10px;background:rgba(6,10,16,.42);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:10px 12px 6px}
.mg .t{display:flex;justify-content:space-between;font:800 10.5px/1 'Manrope',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.62);margin-bottom:4px}
.mg .t i{font-style:normal;color:#9fd8ff}
.mg svg{width:100%;height:112px;display:block}
.days{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:10px}
.days div{background:rgba(6,10,16,.42);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px 6px 9px;display:flex;flex-direction:column;align-items:center;gap:4px}
.days small{font:800 12px/1 'Manrope',system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.8)}
.days b{font:700 16px/1 'Sora','Manrope',system-ui,sans-serif}
.days b i{font-style:normal;font-weight:600;opacity:.6;margin-left:4px}
.days em{font:700 10.5px/1.2 'Manrope',system-ui,sans-serif;font-style:normal;color:rgba(255,255,255,.7);min-height:11px;text-align:center}
.days em i{font-style:normal;color:#9fd8ff}
.foot{margin-top:auto;padding-top:8px;font:600 10.5px/1 'Manrope',system-ui,sans-serif;color:rgba(255,255,255,.5);display:flex;justify-content:space-between}
.ic{display:block;flex-shrink:0}
.spin{animation:spin 48s linear infinite;transform-origin:32px 32px}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.spin{animation:none}}
`;
// 3D ikony predpovede (SVG)
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9ECC0"/><stop offset=".5" stop-color="#E1C781"/><stop offset="1" stop-color="#9E7B40"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F7FA"/><stop offset=".45" stop-color="#B8C2CF"/><stop offset=".7" stop-color="#7C8898"/><stop offset="1" stop-color="#A9B4C2"/></linearGradient>
<radialGradient id="sun" cx=".38" cy=".36" r=".7"><stop offset="0" stop-color="#FFF8D2"/><stop offset=".45" stop-color="#FFD95E"/><stop offset=".8" stop-color="#F7A42B"/><stop offset="1" stop-color="#E2871A"/></radialGradient>
<radialGradient id="moon" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#FCFDFF"/><stop offset=".6" stop-color="#D9E0EC"/><stop offset="1" stop-color="#9FADC4"/></radialGradient>
<linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#E3E9F1"/><stop offset="1" stop-color="#B5C1D0"/></linearGradient>
<linearGradient id="cloudD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7C0CC"/><stop offset=".55" stop-color="#7F8A99"/><stop offset="1" stop-color="#566170"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6EAFF"/><stop offset=".5" stop-color="#5DB5F0"/><stop offset="1" stop-color="#1F6CC0"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#000" flood-opacity=".55"/></filter>
<filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
</defs></svg>`;
const HL = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45"/>`;
const RAYS = `<g class="spin" stroke="url(#gold)" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="32" y1="6" x2="32" y2="13" transform="rotate(${a} 32 32)"/>`).join('')}</g>`;
const S = {
  sun: () => `<g filter="url(#sh)">${RAYS}<circle cx="32" cy="32" r="15" fill="url(#sun)"/>${HL(26.5, 26, 5, 3)}</g>`,
  moon: () => `<g filter="url(#sh)"><path d="M38 6a24 24 0 1 0 19 38.5A20 20 0 0 1 38 6z" fill="url(#moon)"/><circle cx="33" cy="22" r="3.2" fill="#B4BFD3" opacity=".8"/><circle cx="27" cy="35" r="4.4" fill="#B4BFD3" opacity=".7"/><circle cx="37" cy="42" r="2.4" fill="#B4BFD3" opacity=".7"/>${HL(30, 15, 5, 2.6)}</g>`,
  cloud: (o) => `<g filter="url(#sh)"><path d="M19 50h27a10.5 10.5 0 0 0 1.3-21A14.5 14.5 0 0 0 19.6 26 12 12 0 0 0 19 50z" fill="url(#${o && o.dark ? 'cloudD' : 'cloud'})"/>${HL(27, 31, 7, 3.2)}</g>`,
  cloudsun: () => `<g filter="url(#sh)"><g transform="translate(10 -4) scale(.72)">${RAYS}<circle cx="32" cy="32" r="15" fill="url(#sun)"/>${HL(26.5, 26, 5, 3)}</g><path d="M15 54h27a9.5 9.5 0 0 0 1.2-19A13 13 0 0 0 15.5 32.5 11 11 0 0 0 15 54z" fill="url(#cloud)"/>${HL(23, 37, 6, 2.8)}</g>`,
  cloudmoon: () => `<g filter="url(#sh)"><g transform="translate(16 -2) scale(.6)"><path d="M38 6a24 24 0 1 0 19 38.5A20 20 0 0 1 38 6z" fill="url(#moon)"/></g><path d="M15 54h27a9.5 9.5 0 0 0 1.2-19A13 13 0 0 0 15.5 32.5 11 11 0 0 0 15 54z" fill="url(#cloudD)"/>${HL(23, 37, 6, 2.8)}</g>`,
  rain: () => `<g filter="url(#sh)"><path d="M19 42h27a10.5 10.5 0 0 0 1.3-21A14.5 14.5 0 0 0 19.6 18 12 12 0 0 0 19 42z" fill="url(#cloudD)"/>${HL(27, 23, 7, 3.2)}${[22, 32, 42].map((x, i) => `<path d="M${x} 46c-3 4.5-3 7.5 0 9.5 3-2 3-5 0-9.5z" fill="url(#water)" transform="translate(0 ${i === 1 ? 3 : 0})"/>`).join('')}</g>`,
  snow: () => `<g filter="url(#sh)"><path d="M19 40h27a10.5 10.5 0 0 0 1.3-21A14.5 14.5 0 0 0 19.6 16 12 12 0 0 0 19 40z" fill="url(#cloud)"/>${HL(27, 21, 7, 3.2)}<g stroke="#fff" stroke-width="2.2" stroke-linecap="round">${[[22, 50], [33, 55], [44, 49]].map(([x, y]) => `<path d="M${x} ${y - 5}v10M${x - 4.3} ${y - 2.5}l8.6 5M${x - 4.3} ${y + 2.5}l8.6-5"/>`).join('')}</g></g>`,
  bolt: () => `<g filter="url(#sh)"><path d="M19 38h27a10.5 10.5 0 0 0 1.3-21A14.5 14.5 0 0 0 19.6 14 12 12 0 0 0 19 38z" fill="url(#cloudD)"/>${HL(27, 19, 7, 3.2)}<path d="M35 34l-9 14h7l-3 12 11-16h-7l3-10z" fill="url(#sun)" filter="url(#bl)" opacity=".7"/><path d="M35 34l-9 14h7l-3 12 11-16h-7l3-10z" fill="url(#sun)"/></g>`,
  fog: () => `<g filter="url(#sh)"><path d="M19 36h27a10.5 10.5 0 0 0 1.3-21A14.5 14.5 0 0 0 19.6 12 12 12 0 0 0 19 36z" fill="url(#cloud)"/>${HL(27, 17, 7, 3.2)}<g stroke="#D6DEE8" stroke-width="4" stroke-linecap="round"><path d="M14 44h36" opacity=".85"/><path d="M20 52h30" opacity=".6"/><path d="M26 60h18" opacity=".4"/></g></g>`,
  wind: () => `<g filter="url(#sh)" fill="none" stroke="url(#steel)" stroke-width="4.5" stroke-linecap="round"><path d="M8 24h30a6 6 0 1 0-6-6"/><path d="M8 34h40a6 6 0 1 1-6 6"/><path d="M8 44h22a5 5 0 1 1-5 5"/></g>`
};
const WXI = { sunny: ['sun', 'moon'], 'clear-night': ['moon', 'moon'], partlycloudy: ['cloudsun', 'cloudmoon'], cloudy: ['cloud', 'cloud'], rainy: ['rain', 'rain'], pouring: ['rain', 'rain'], snowy: ['snow', 'snow'], 'snowy-rainy': ['snow', 'snow'], lightning: ['bolt', 'bolt'], 'lightning-rainy': ['bolt', 'bolt'], fog: ['fog', 'fog'], windy: ['wind', 'wind'], 'windy-variant': ['wind', 'wind'], hail: ['snow', 'snow'], exceptional: ['cloud', 'cloud'] };
const ico = (n, s = 40, o = {}) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true">${(S[n] || S.cloud)(o)}</svg>`;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// locale state (set at the start of every render; rendering is synchronous)
let L = I18N.en, LOC = 'en', H12 = false;
const NUM = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
const nf = (v, d) => (v == null || v === '' || isNaN(v)) ? '–' : Number(v).toLocaleString(LOC, { minimumFractionDigits: d, maximumFractionDigits: d });
const F0 = (v) => nf(v, 0);
const F1 = (v) => nf(v, 1);
const FT = (v) => (v == null || v === '' || isNaN(v)) ? '–' : (Math.round(v * 10) / 10).toLocaleString(LOC, { maximumFractionDigits: 1 });
const P2 = (n) => (n < 10 ? '0' : '') + n;
const TM = (d) => d.toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit', hourCycle: H12 ? 'h12' : 'h23' });
const TH = (d) => H12 ? d.toLocaleTimeString(LOC, { hour: 'numeric', hourCycle: 'h12' }) : P2(d.getHours()) + ':00';
const TG = (d) => H12 ? String(d.getHours() % 12 || 12) : P2(d.getHours());
const KMH = { 'km/h': 1, kmh: 1, mph: 1.609, 'm/s': 3.6, kn: 1.852, 'ft/s': 1.097 };
const TEMP_BY_COND = { sunny: 24, 'clear-night': 11, partlycloudy: 18, cloudy: 14, rainy: 11, pouring: 10, snowy: -2, 'snowy-rainy': 1, lightning: 19, 'lightning-rainy': 17, fog: 6, windy: 13, 'windy-variant': 13, hail: 4 };
const PRECIP_BY_COND = { rainy: .8, pouring: 3.2, snowy: .6, 'snowy-rainy': .7, 'lightning-rainy': 1.6, lightning: .4, hail: .9 };

class HaAnimatedWeatherCard extends HTMLElement {
  static getStubConfig(hass) { const e = hass && Object.keys(hass.states || {}).find((k) => k.startsWith('weather.')); return { weather_entity: e || 'weather.home' }; }
  static getConfigElement() { return document.createElement(TAG + '-editor'); }
  setConfig(c) {
    const cfg = Object.assign({}, DEFAULTS, c || {});
    const m = /[?&]demo=([a-z-]+)/.exec(location.search); this._demo = (m && m[1]) || cfg.demo || null;
    if (!cfg.weather_entity && !this._demo) throw new Error(TAG + ': "weather_entity" is required, e.g. weather_entity: weather.home');
    this._c = cfg;
    this.style.setProperty('--haw-radius', (+cfg.border_radius || 0) + 'px');
    this.style.height = cfg.height || '';
    if (this._built) this._reset();
    if (this._h) this.hass = this._h;
  }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }
  connectedCallback() {
    if (this._c && this._c.load_fonts && !document.getElementById('haw-font')) { const l = document.createElement('link'); l.id = 'haw-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Sora:wght@600;700;800&display=swap'; document.head.appendChild(l); }
    if (!this._clock) this._clock = setInterval(() => this._tick(), 1000);
    if (this._built && !this._sky) this._mkSky();
    if (this._built && !this._ro && window.ResizeObserver) { this._ro = new ResizeObserver(() => { const w = this.clientWidth; if (w !== this._lw) { this._lw = w; if (this._fc) this._renderFc(); } }); this._ro.observe(this); }
  }
  disconnectedCallback() { if (this._ro) { this._ro.disconnect(); this._ro = null; } clearInterval(this._clock); this._clock = null; if (this._sky) { this._sky.destroy(); this._sky = null; } }
  _reset() { if (this._ro) { this._ro.disconnect(); this._ro = null; } if (this._sky) { this._sky.destroy(); this._sky = null; } if (this.shadowRoot) this.shadowRoot.innerHTML = ''; this._built = false; this._fc = null; this._fcAt = 0; }
  set hass(h) { this._h = h; if (!this._c) return; if (!this._built) this._build(); try { this._render(h); } catch (e) { console.warn(TAG, e); } this._forecast(h); }
  _use() {
    const want = this._c.locale === 'auto' ? ((this._h && this._h.locale && this._h.locale.language) || navigator.language || 'en') : this._c.locale;
    LOC = want; L = I18N[String(want).slice(0, 2).toLowerCase()] || I18N.en;
    H12 = this._c.hour12 != null ? !!this._c.hour12 : !!new Intl.DateTimeFormat(LOC, { hour: 'numeric' }).resolvedOptions().hour12;
  }
  _st(e) {
    const s = this._h && this._h.states && this._h.states[e]; if (s) return s;
    if (this._demo) return this._demoState(e);
    return { state: 'unavailable', attributes: {} };
  }
  /* ---------- demo mode: sample data, no entity needed ---------- */
  _demoCond() { const d = this._demo.replace(/-night$/, ''); return DEMO[d] || (SCENE[d] ? d : 'cloudy'); }
  _demoState(e) {
    const cond = this._demoCond(), night = this._forceNight(), now = new Date();
    if (e === this._c.sun_entity) {
      const at = (h, m) => { const d = new Date(now); d.setHours(h, m, 0, 0); return d.toISOString(); };
      return { state: night ? 'below_horizon' : 'above_horizon', attributes: { elevation: night ? -20 : 32, azimuth: 200, rising: false, next_rising: at(6, 30), next_setting: at(18, 30) } };
    }
    if (this._c.weather_entity && e !== this._c.weather_entity && e !== this._c.details_entity) return { state: 'unavailable', attributes: {} };
    const stormy = /lightning/.test(cond), windy = /windy/.test(cond);
    return { state: cond, last_updated: now.toISOString(), attributes: { temperature: TEMP_BY_COND[cond] != null ? TEMP_BY_COND[cond] : 15, apparent_temperature: (TEMP_BY_COND[cond] || 15) - (windy ? 4 : 2), humidity: /rain|pour|fog|snow/.test(cond) ? 88 : 54, wind_speed: windy ? 38 : stormy ? 24 : 9, wind_gust_speed: windy ? 62 : stormy ? 49 : 18, wind_bearing: 225, pressure: stormy ? 1002 : 1016, cloud_coverage: (SCENE[cond].cloud || 0) * 100, uv_index: night ? 0 : 3.4, temperature_unit: '°C', wind_speed_unit: 'km/h', pressure_unit: 'hPa', precipitation_unit: 'mm' } };
  }
  _demoForecast() {
    const cond = this._demoCond(), T = TEMP_BY_COND[cond] != null ? TEMP_BY_COND[cond] : 15, P = PRECIP_BY_COND[cond] || 0;
    const base = new Date(); base.setMinutes(0, 0, 0);
    const hours = Array.from({ length: 30 }, (_, i) => { const d = new Date(base.getTime() + (i + 1) * 3600e3); const wave = Math.sin(((d.getHours() - 9) / 24) * 2 * Math.PI); const rainy = P && (i % 5 !== 3); return { datetime: d.toISOString(), condition: cond, temperature: T + 3 * wave, precipitation: rainy ? P * (.6 + .4 * Math.abs(Math.sin(i))) : 0 }; });
    const seq = [cond, 'partlycloudy', 'sunny', 'rainy', 'cloudy', 'sunny'];
    const days = seq.map((c, i) => { const d = new Date(base.getTime() + i * 86400e3); return { datetime: d.toISOString(), condition: c, temperature: T + [2, 1, 4, -2, 0, 3][i], templow: T - 6 + [0, 1, 0, -1, 1, 0][i], precipitation: PRECIP_BY_COND[c] ? PRECIP_BY_COND[c] * 4 : 0 }; });
    return { hours, days, feel: [] };
  }
  _forceNight() { if (this._c.mode === 'night') return true; if (this._c.mode === 'day') return false; if (!this._demo) return null; return this._demo === 'night' || /-night$/.test(this._demo); }
  _cond() { return this._demo ? this._demoCond() : this._st(this._c.weather_entity).state; }
  _night(t) {
    const fn = this._forceNight(); if (fn != null) return fn;
    const s = this._st(this._c.sun_entity).attributes; if (!s.next_rising) return false;
    const r = new Date(s.next_rising), st = new Date(s.next_setting); const base = new Date(t); base.setHours(0, 0, 0, 0);
    const ri = base.getTime() + (r.getHours() * 60 + r.getMinutes()) * 6e4, se = base.getTime() + (st.getHours() * 60 + st.getMinutes()) * 6e4;
    return t < ri || t > se;
  }
  _mkSky() { if (this._sky || !this._c.animated) return; try { this._sky = new SkyStage(this._skyEl, this._c.quality, this._c.fps); if (!this._sky.ok) this._sky = null; } catch (e) { this._sky = null; } }
  _build() {
    this._built = true; const sh = this.shadowRoot || this.attachShadow({ mode: 'open' }); const c = this._c;
    sh.innerHTML = `<style>${CSS}${c.load_fonts ? '' : ":host{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}"}</style>${DEFS}<div class="sky"></div><div class="shade"></div><div class="c">
      <div class="top"><div><div class="clock"></div><div class="date"></div></div><div class="where"></div></div>
      <div class="cond">–</div><div class="temp"><b>–</b><i></i></div><div class="feel"></div><div class="chips"></div>
      <div class="det"></div><div class="sunrow"></div><div class="hrs"></div><div class="mg"></div><div class="days"></div><div class="foot"><span class="src"></span><span class="upd"></span></div></div>`;
    const q = (s) => sh.querySelector(s);
    this._skyEl = q('.sky'); this._el = { clock: q('.clock'), date: q('.date'), where: q('.where'), cond: q('.cond'), temp: q('.temp b'), tu: q('.temp i'), feel: q('.feel'), chips: q('.chips'), det: q('.det'), sunrow: q('.sunrow'), hrs: q('.hrs'), mg: q('.mg'), days: q('.days'), src: q('.src'), upd: q('.upd') };
    const hide = (el, on) => { if (!on) el.style.display = 'none'; };
    hide(q('.top > div'), c.show_clock); hide(this._el.det, c.show_details); hide(this._el.sunrow, c.show_sun); hide(this._el.hrs, c.show_hourly); hide(this._el.mg, c.show_graph); hide(this._el.days, c.show_daily);
    this._el.src.textContent = c.footer || ''; this._el.where.textContent = c.name || '';
    this._mkSky(); this._use(); this._tick();
    if (window.ResizeObserver) { this._ro = new ResizeObserver(() => { const w = this.clientWidth; if (w !== this._lw) { this._lw = w; if (this._fc) this._renderFc(); } }); this._ro.observe(this); }
  }
  _tick() { if (!this._el || !this._c.show_clock) return; this._use(); const d = new Date(); const t = TM(d); if (this._el.clock.textContent !== t) { this._el.clock.textContent = t; this._el.date.innerHTML = `${esc(d.toLocaleDateString(LOC, { weekday: 'long' }))}, <b>${esc(d.toLocaleDateString(LOC, { day: 'numeric', month: 'long', year: 'numeric' }))}</b>`; } }
  _render(h) {
    this._use(); const E = this._el, c = this._c; const s = this._st(c.weather_entity), a = s.attributes, m = this._st(c.details_entity || c.weather_entity).attributes; const cond = this._cond(); const night = this._night(Date.now());
    const uT = a.temperature_unit || '°C', uW = a.wind_speed_unit || 'km/h', uP = a.pressure_unit || 'hPa';
    E.cond.textContent = (L.cond[cond] || cond) + (this._demo ? ' · ' + L.demo : ''); E.temp.textContent = FT(NUM(a.temperature)); E.tu.textContent = uT;
    this._skyEl.classList.toggle('night', !!night);
    const wk = NUM(a.wind_speed); if (this._sky) this._sky.set(skyParams(cond, this._st(c.sun_entity), wk == null ? null : wk * (KMH[uW] || 1), this._forceNight()));
    const wb = NUM(a.wind_bearing); const dir = wb == null ? '' : L.dir[Math.round(wb / 45) % 8];
    const pick = (k) => (a[k] != null ? a[k] : m[k]);
    E.det.innerHTML = `<div><small>${L.humidity}</small><b>${F0(pick('humidity'))}<span>%</span></b></div><div><small>${L.wind} ${dir}</small><b>${F0(a.wind_speed)}<span>${esc(uW)}</span></b></div><div><small>${L.gusts}</small><b>${F0(pick('wind_gust_speed'))}<span>${esc(uW)}</span></b></div><div><small>${L.pressure}</small><b>${F0(pick('pressure'))}<span>${esc(uP)}</span></b></div><div><small>${L.uv}</small><b>${F1(m.uv_index != null ? m.uv_index : a.uv_index)}</b></div><div><small>${L.clouds}</small><b>${F0(pick('cloud_coverage'))}<span>%</span></b></div>`;
    E.chips.innerHTML = (c.chips || []).map((ch) => { const st = this._st(ch.entity); const v = NUM(st.state); const dec = ch.decimals != null ? ch.decimals : 1; const txt = v == null ? (st.state === 'unavailable' ? '–' : esc(st.state)) : nf(v, dec); const unit = ch.unit != null ? ch.unit : st.attributes.unit_of_measurement; return `<span>${esc(ch.label || st.attributes.friendly_name || ch.entity)}<b>${txt}${unit ? ' ' + esc(unit) : ''}</b></span>`; }).join('');
    const su = this._st(c.sun_entity).attributes; if (su.next_rising) {
      const r = new Date(su.next_rising), st = new Date(su.next_setting); const rm = r.getHours() * 60 + r.getMinutes(), smn = st.getHours() * 60 + st.getMinutes(); const d = new Date(); let nowm = d.getHours() * 60 + d.getMinutes();
      if (this._demo) nowm = rm + (smn - rm) * .62;
      let f = (nowm - rm) / Math.max(1, smn - rm); const up = this._demo ? !night : (this._st(c.sun_entity).state !== 'below_horizon' && f >= 0 && f <= 1); f = Math.max(0, Math.min(1, f));
      const x = 10 + f * 180, y = 30 - Math.sin(f * Math.PI) * 24;
      E.sunrow.innerHTML = `${ico('sun', 22)}<span>${TM(r)}</span><svg class="arc" viewBox="0 0 200 34"><path d="M10 30 Q100 -22 190 30" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="4 5"/><line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,.3)"/>${up ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#ffd95e" stroke="#fff" stroke-width="1.5"/>` : ''}</svg><span>${TM(st)}</span>${ico('moon', 20)}`;
    }
    E.upd.textContent = s.last_updated ? L.updated + ' ' + TM(new Date(s.last_updated)) : '';
    if (this._fc) this._renderFc();
  }
  async _forecast(h) {
    const now = Date.now(); if (this._fcAt && now - this._fcAt < this._c.refresh_min * 60e3) return; this._fcAt = now; const c = this._c;
    if (this._demo) { this._fc = this._demoForecast(); this._renderFc(); return; }
    if (!h || !h.callWS) return;
    const get = (e, type) => h.callWS({ type: 'call_service', domain: 'weather', service: 'get_forecasts', service_data: { type }, target: { entity_id: e }, return_response: true }).then((r) => (((r || {}).response || {})[e] || {}).forecast || []).catch(() => []);
    try {
      const [hours, dMain, dAlt, feel] = await Promise.all([get(c.weather_entity, 'hourly'), get(c.weather_entity, 'daily'), c.daily_entity ? get(c.daily_entity, 'daily') : [], c.feels_like_entity ? get(c.feels_like_entity, 'hourly') : []]);
      const days = dAlt.length > dMain.length ? dAlt : dMain;
      this._fc = { hours, days, feel }; this._renderFc();
    } catch (e) { this._fcAt = now - (c.refresh_min - 2) * 60e3; }
  }
  _renderFc() {
    this._use(); const E = this._el, c = this._c, { hours, days, feel } = this._fc; const now = Date.now(); const a = this._st(c.weather_entity).attributes; const uT = a.temperature_unit || '°C', uR = a.precipitation_unit || 'mm';
    const fut = hours.filter((f) => new Date(f.datetime).getTime() > now - 30 * 60e3);
    E.hrs.innerHTML = fut.slice(0, c.hours).map((f) => { const t = new Date(f.datetime); const n = (this._demo && c.mode === 'auto') ? (t.getHours() < 6 || t.getHours() >= 19) : this._night(t.getTime()); const ic = (WXI[f.condition] || WXI.cloudy)[n ? 1 : 0]; const pr = NUM(f.precipitation); return `<div><small>${TH(t)}</small>${ico(ic, 38)}<b>${F0(f.temperature)}°</b><em>${pr >= 0.05 ? F1(pr) + ' ' + esc(uR) : ''}</em></div>`; }).join('');
    const mh = fut.slice(0, 24);
    if (c.show_graph && mh.length > 2) {
      const W = Math.max(260, Math.round((E.mg.clientWidth || 564) - 24)), H = 112, top = 14, bot = 22; const te = mh.map((f) => NUM(f.temperature)).filter((v) => v != null); let mn = Math.min(...te), mx = Math.max(...te); if (mx - mn < 4) { const md = (mx + mn) / 2; mn = md - 2; mx = md + 2; }
      const pm = Math.max(1, ...mh.map((f) => NUM(f.precipitation) || 0)); const X = (i) => 10 + (i / (mh.length - 1)) * (W - 20), Y = (v) => H - bot - ((v - mn) / (mx - mn)) * (H - top - bot);
      const bw = Math.min(14, ((W - 20) / mh.length) * .62); const bars = mh.map((f, i) => { const p = NUM(f.precipitation) || 0; if (p < 0.05) return ''; const bh = Math.max(3, (p / pm) * (H - top - bot) * .8); return `<rect x="${(X(i) - bw / 2).toFixed(1)}" y="${(H - bot - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="#5fc3ff" opacity=".75"/>`; }).join('');
      const pts = mh.map((f, i) => `${X(i).toFixed(1)},${Y(NUM(f.temperature) == null ? mn : NUM(f.temperature)).toFixed(1)}`).join(' ');
      const labs = mh.map((f, i) => (i % 3 === 0 ? `<text x="${X(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="rgba(255,255,255,.65)" font-family="Manrope,system-ui,sans-serif">${TG(new Date(f.datetime))}</text>` : '')).join('');
      const tl = mh.map((f, i) => (i % 3 === 0 ? `<text x="${X(i).toFixed(1)}" y="${(Y(NUM(f.temperature) == null ? mn : NUM(f.temperature)) - 7).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Sora,system-ui,sans-serif">${F0(f.temperature)}°</text>` : '')).join('');
      const tot = mh.reduce((s, f) => s + (NUM(f.precipitation) || 0), 0);
      E.mg.innerHTML = `<div class="t"><span>${L.next24}</span><span>${F0(mn)}° … ${F0(mx)}° <i>· ${L.precip} ${F1(tot)} ${esc(uR)}</i></span></div><svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="mgf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd95e" stop-opacity=".35"/><stop offset="1" stop-color="#ffd95e" stop-opacity="0"/></linearGradient></defs>${bars}<polygon points="${X(0).toFixed(1)},${H - bot} ${pts} ${X(mh.length - 1).toFixed(1)},${H - bot}" fill="url(#mgf)"/><polyline points="${pts}" fill="none" stroke="#ffe08a" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${tl}${labs}</svg>`;
    }
    const ds = days.filter((f) => new Date(f.datetime).getTime() > now - 20 * 3600e3).slice(0, c.days);
    E.days.style.gridTemplateColumns = `repeat(${Math.max(1, Math.min(7, ds.length || c.days))},1fr)`;
    E.days.innerHTML = ds.map((f, i) => { const t = new Date(f.datetime); const ic = (WXI[f.condition] || WXI.cloudy)[0]; const pr = NUM(f.precipitation); return `<div><small>${i === 0 ? L.today : esc(t.toLocaleDateString(LOC, { weekday: 'short' }).replace('.', ''))}</small>${ico(ic, 40)}<b>${F0(f.temperature)}°<i>${F0(f.templow)}°</i></b><em>${esc((L.cond[f.condition] || '').split(',')[0])}${pr >= 0.05 ? `<br><i>${F1(pr)} ${esc(uR)}</i>` : ''}</em></div>`; }).join('');
    const o0 = feel.find((f) => Math.abs(new Date(f.datetime).getTime() - now) < 3600e3) || feel[0]; const d0 = ds[0] || days[0] || {};
    const fe = a.apparent_temperature != null ? a.apparent_temperature : (o0 && o0.apparent_temperature != null ? o0.apparent_temperature : null);
    E.feel.innerHTML = `${fe != null ? `<span>${L.feels} <b>${FT(fe)} ${esc(uT)}</b></span>` : ''}<span>${L.max} <b>${F0(d0.temperature)}°</b></span><span>${L.min} <b>${F0(d0.templow)}°</b></span>`;
  }
}

/* ====================== VISUAL EDITOR ====================== */
class HaAnimatedWeatherCardEditor extends HTMLElement {
  setConfig(c) { this._c = c || {}; this._draw(); }
  set hass(h) { this._h = h; if (this._f) this._f.hass = h; else this._draw(); }
  _draw() {
    if (!this._h || !this._c) return;
    if (!this._f) {
      this._f = document.createElement('ha-form'); this.appendChild(this._f);
      const names = { weather_entity: 'Weather entity', name: 'Location label', mode: 'Sky', locale: 'Language', animated: 'Animated sky', show_clock: 'Clock', show_details: 'Details', show_sun: 'Sunrise / sunset', show_hourly: 'Hourly forecast', show_graph: '24 h graph', show_daily: 'Daily forecast' };
      this._f.computeLabel = (s) => names[s.name] || s.name;
      this._f.addEventListener('value-changed', (e) => { this._c = e.detail.value; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._c }, bubbles: true, composed: true })); });
      this._f.schema = [
        { name: 'weather_entity', required: true, selector: { entity: { domain: 'weather' } } },
        { name: 'name', selector: { text: {} } },
        { type: 'grid', name: '', schema: [
          { name: 'mode', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (day / night)' }, { value: 'day', label: 'Always day' }, { value: 'night', label: 'Always night' }] } } },
          { name: 'locale', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (Home Assistant)' }, { value: 'en', label: 'English' }, { value: 'sk', label: 'Slovenčina' }, { value: 'cs', label: 'Čeština' }, { value: 'de', label: 'Deutsch' }] } } }] },
        { type: 'grid', name: '', schema: ['animated', 'show_clock', 'show_details', 'show_sun', 'show_hourly', 'show_graph', 'show_daily'].map((n) => ({ name: n, selector: { boolean: {} } })) }
      ];
    }
    this._f.data = Object.assign({ mode: 'auto', locale: 'auto', animated: true, show_clock: true, show_details: true, show_sun: true, show_hourly: true, show_graph: true, show_daily: true }, this._c);
    if (this._h) this._f.hass = this._h;
  }
}
customElements.define(TAG, HaAnimatedWeatherCard);
customElements.define(TAG + '-editor', HaAnimatedWeatherCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: TAG, name: 'Animated Weather Card', description: 'Weather with a live animated WebGL sky: sun, moon, clouds, rain, snow, storm, fog, wind.', preview: false, documentationURL: 'https://github.com/Marco520520/ha-animated-weather-card' });
console.info('%c ANIMATED-WEATHER-CARD %c 1.0.0 ', 'color:#fff;background:#2a6ab3;font-weight:700', 'color:#2a6ab3;background:#fff;font-weight:700');
})();
