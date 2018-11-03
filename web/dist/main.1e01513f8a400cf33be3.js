!function(t){var e={};function n(r){if(e[r])return e[r].exports;var i=e[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)n.d(r,i,function(e){return t[e]}.bind(null,i));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s="tjUo")}({Tf3d:function(t,e,n){},Wgwc:function(t,e,n){t.exports=function(){"use strict";var t="millisecond",e="second",n="minute",r="hour",i="day",s="week",a="month",o="year",u=/^(\d{4})-?(\d{1,2})-?(\d{0,2})(.*?(\d{1,2}):(\d{1,2}):(\d{1,2}))?.?(\d{1,3})?$/,c=/\[.*?\]|Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,d={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},l=function(t,e,n){var r=String(t);return!r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},h={padStart:l,padZoneStr:function(t){var e=Math.abs(t),n=Math.floor(e/60),r=e%60;return(t<=0?"+":"-")+l(n,2,"0")+":"+l(r,2,"0")},monthDiff:function(t,e){var n=12*(e.year()-t.year())+(e.month()-t.month()),r=t.clone().add(n,"months"),i=e-r<0,s=t.clone().add(n+(i?-1:1),"months");return Number(-(n+(e-r)/(i?r-s:s-r)))},absFloor:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},prettyUnit:function(u){return{M:a,y:o,w:s,d:i,h:r,m:n,s:e,ms:t}[u]||String(u||"").toLowerCase().replace(/s$/,"")},isUndefined:function(t){return void 0===t}},f="en",m={};m[f]=d;var p=function(t){return t instanceof b},g=function(t,e,n){var r;if(!t)return null;if("string"==typeof t)m[t]&&(r=t),e&&(m[t]=e,r=t);else{var i=t.name;m[i]=t,r=i}return n||(f=r),r},v=function(t,e){if(p(t))return t.clone();var n=e||{};return n.date=t,new b(n)},y=function(t,e){return v(t,{locale:e.$L})},$=h;$.parseLocale=g,$.isDayjs=p,$.wrapper=y;var b=function(){function d(t){this.parse(t)}var l=d.prototype;return l.parse=function(t){var e,n;this.$d=null===(e=t.date)?new Date(NaN):$.isUndefined(e)?new Date:e instanceof Date?e:"string"==typeof e&&/.*[^Z]$/i.test(e)&&(n=e.match(u))?new Date(n[1],n[2]-1,n[3]||1,n[5]||0,n[6]||0,n[7]||0,n[8]||0):new Date(e),this.init(t)},l.init=function(t){this.$y=this.$d.getFullYear(),this.$M=this.$d.getMonth(),this.$D=this.$d.getDate(),this.$W=this.$d.getDay(),this.$H=this.$d.getHours(),this.$m=this.$d.getMinutes(),this.$s=this.$d.getSeconds(),this.$ms=this.$d.getMilliseconds(),this.$L=this.$L||g(t.locale,null,!0)||f},l.$utils=function(){return $},l.isValid=function(){return!("Invalid Date"===this.$d.toString())},l.$compare=function(t){return this.valueOf()-v(t).valueOf()},l.isSame=function(t){return 0===this.$compare(t)},l.isBefore=function(t){return this.$compare(t)<0},l.isAfter=function(t){return this.$compare(t)>0},l.year=function(){return this.$y},l.month=function(){return this.$M},l.day=function(){return this.$W},l.date=function(){return this.$D},l.hour=function(){return this.$H},l.minute=function(){return this.$m},l.second=function(){return this.$s},l.millisecond=function(){return this.$ms},l.unix=function(){return Math.floor(this.valueOf()/1e3)},l.valueOf=function(){return this.$d.getTime()},l.startOf=function(t,u){var c=this,d=!!$.isUndefined(u)||u,l=function(t,e){var n=y(new Date(c.$y,e,t),c);return d?n:n.endOf(i)},h=function(t,e){return y(c.toDate()[t].apply(c.toDate(),d?[0,0,0,0].slice(e):[23,59,59,999].slice(e)),c)};switch($.prettyUnit(t)){case o:return d?l(1,0):l(31,11);case a:return d?l(1,this.$M):l(0,this.$M+1);case s:return l(d?this.$D-this.$W:this.$D+(6-this.$W),this.$M);case i:case"date":return h("setHours",0);case r:return h("setMinutes",1);case n:return h("setSeconds",2);case e:return h("setMilliseconds",3);default:return this.clone()}},l.endOf=function(t){return this.startOf(t,!1)},l.$set=function(s,u){switch($.prettyUnit(s)){case i:this.$d.setDate(this.$D+(u-this.$W));break;case"date":this.$d.setDate(u);break;case a:this.$d.setMonth(u);break;case o:this.$d.setFullYear(u);break;case r:this.$d.setHours(u);break;case n:this.$d.setMinutes(u);break;case e:this.$d.setSeconds(u);break;case t:this.$d.setMilliseconds(u)}return this.init(),this},l.set=function(t,e){return this.clone().$set(t,e)},l.add=function(t,u){var c=this;t=Number(t);var d,l=$.prettyUnit(u),h=function(e,n){var r=c.set("date",1).set(e,n+t);return r.set("date",Math.min(c.$D,r.daysInMonth()))},f=function(e){var n=new Date(c.$d);return n.setDate(n.getDate()+e*t),y(n,c)};if(l===a)return h(a,this.$M);if(l===o)return h(o,this.$y);if(l===i)return f(1);if(l===s)return f(7);switch(l){case n:d=6e4;break;case r:d=36e5;break;case e:d=1e3;break;default:d=1}var m=this.valueOf()+t*d;return y(m,this)},l.subtract=function(t,e){return this.add(-1*t,e)},l.format=function(t){var e=this,n=t||"YYYY-MM-DDTHH:mm:ssZ",r=$.padZoneStr(this.$d.getTimezoneOffset()),i=this.$locale(),s=i.weekdays,a=i.months,o=function(t,e,n,r){return t&&t[e]||n[e].substr(0,r)};return n.replace(c,function(t){if(t.indexOf("[")>-1)return t.replace(/\[|\]/g,"");switch(t){case"YY":return String(e.$y).slice(-2);case"YYYY":return String(e.$y);case"M":return String(e.$M+1);case"MM":return $.padStart(e.$M+1,2,"0");case"MMM":return o(i.monthsShort,e.$M,a,3);case"MMMM":return a[e.$M];case"D":return String(e.$D);case"DD":return $.padStart(e.$D,2,"0");case"d":return String(e.$W);case"dd":return o(i.weekdaysMin,e.$W,s,2);case"ddd":return o(i.weekdaysShort,e.$W,s,3);case"dddd":return s[e.$W];case"H":return String(e.$H);case"HH":return $.padStart(e.$H,2,"0");case"h":case"hh":return 0===e.$H?12:$.padStart(e.$H<13?e.$H:e.$H-12,"hh"===t?2:1,"0");case"a":return e.$H<12?"am":"pm";case"A":return e.$H<12?"AM":"PM";case"m":return String(e.$m);case"mm":return $.padStart(e.$m,2,"0");case"s":return String(e.$s);case"ss":return $.padStart(e.$s,2,"0");case"SSS":return $.padStart(e.$ms,3,"0");case"Z":return r;default:return r.replace(":","")}})},l.diff=function(t,u,c){var d=$.prettyUnit(u),l=v(t),h=this-l,f=$.monthDiff(this,l);switch(d){case o:f/=12;break;case a:break;case"quarter":f/=3;break;case s:f=h/6048e5;break;case i:f=h/864e5;break;case r:f=h/36e5;break;case n:f=h/6e4;break;case e:f=h/1e3;break;default:f=h}return c?f:$.absFloor(f)},l.daysInMonth=function(){return this.endOf(a).$D},l.$locale=function(){return m[this.$L]},l.locale=function(t,e){var n=this.clone();return n.$L=g(t,e,!0),n},l.clone=function(){return y(this.toDate(),this)},l.toDate=function(){return new Date(this.$d)},l.toArray=function(){return[this.$y,this.$M,this.$D,this.$H,this.$m,this.$s,this.$ms]},l.toJSON=function(){return this.toISOString()},l.toISOString=function(){return this.toDate().toISOString()},l.toObject=function(){return{years:this.$y,months:this.$M,date:this.$D,hours:this.$H,minutes:this.$m,seconds:this.$s,milliseconds:this.$ms}},l.toString=function(){return this.$d.toUTCString()},d}();return v.extend=function(t,e){return t(e,b,v),v},v.locale=g,v.isDayjs=p,v.unix=function(t){return v(1e3*t)},v.en=m[f],v}()},tjUo:function(t,e,n){"use strict";n.r(e);n("Tf3d");var r=n("Wgwc"),i=n.n(r);function s(t){var e=t-1;return e*e*e+1}var a=function(t,e){var n=e.delay;void 0===n&&(n=0);var r=e.duration;void 0===r&&(r=400);var i=+getComputedStyle(t).opacity;return{delay:n,duration:r,css:function(t){return"opacity: "+t*i}}};var o=function(t,e){var n=e.delay;void 0===n&&(n=0);var r=e.duration;void 0===r&&(r=400);var i=e.easing;void 0===i&&(i=s);var a=getComputedStyle(t),o=+a.opacity,u=parseFloat(a.height),c=parseFloat(a.paddingTop),d=parseFloat(a.paddingBottom),l=parseFloat(a.marginTop),h=parseFloat(a.marginBottom),f=parseFloat(a.borderTopWidth),m=parseFloat(a.borderBottomWidth);return{delay:n,duration:r,easing:i,css:function(t){return"overflow: hidden;opacity: "+Math.min(20*t,1)*o+";height: "+t*u+"px;padding-top: "+t*c+"px;padding-bottom: "+t*d+"px;margin-top: "+t*l+"px;margin-bottom: "+t*h+"px;border-top-width: "+t*f+"px;border-bottom-width: "+t*m+"px;"}}};const u="https://fbox.herokuapp.com",c=t=>{if(401===t.status)throw location.href=`${u}/connect/github`,new Error(t.status);return t},d=async(t,e,n)=>fetch(`${u}${t}`,{method:e,headers:{"Content-Type":"application/json; charset=utf-8"},body:n&&JSON.stringify(n),redirect:"follow",mode:"cors",credentials:"include"}).then(c).then(t=>t.json()),l=async t=>d(t,"GET");function h(t,e="YYYY-MM-DD HH:mm:ss"){return t?i()(t).format(e):"unknown"}var f={async del(t){window.confirm(`DELETE "${t.url}"`)&&(t.loading=!0,this.set({feeds:this.get().feeds}),(async(t,e)=>d(t,"DELETE",e))("/api/v1/feeds/remove",{feedId:t.id}).then(t=>this.set({feeds:t})).catch(t=>alert(t.message)))},async add(t){this.set({addLoading:!0});const e=await(async(t,e)=>d(t,"PUT",e))("/api/v1/feeds/add",{url:t});this.set({addLoading:!1,url:"",feeds:e})}};function m(t){const{component:e,ctx:n}=this._svelte;e.del(n.feed)}function p(t,e,n){const r=Object.create(t);return r.feed=e[n],r}function g(t,e){var n,r,i,s,o,u,c,d,l,h,f,m,g,v,$,Y,F,R,U,W=!1,A=[],C=S();function E(){W=!0,t.set({url:m.value}),W=!1}function P(n){t.add(e.url)}var I=e.feeds;const Z=t=>t.feed.id;for(var B=0;B<I.length;++B){let n=p(e,I,B),r=Z(n);A[B]=C[r]=y(t,r,n)}return{c(){for(n=b("div"),r=b("div"),(i=b("h1")).textContent="feedbox",s=w("\n            "),o=b("span"),u=w(e.email),c=w("\n        "),(d=b("div")).innerHTML='<div class="divider"></div>',l=w("\n\n        "),h=b("div"),f=b("div"),m=b("input"),g=w("\n                "),(v=b("button")).textContent="add",$=w("\n        "),(Y=b("div")).innerHTML='<div class="divider"></div>',F=w("\n\n        "),B=0;B<A.length;++B)A[B].c();var t,a,p;i.className="d-inline-block",o.className="chip",r.className="column col-12",d.className="column col-12",D(m,"input",E),t=m,a="type",null==(p="text")?t.removeAttribute(a):t.setAttribute(a,p),m.className="form-input",m.placeholder="feed url",D(v,"click",P),v.type="button",v.className="btn btn-primary input-group-btn",x(v,"loading",e.addLoading),x(v,"disabled",e.addLoading),f.className="input-group",h.className="column col-12",Y.className="column col-12",n.className="columns"},m(t,a){for(_(t,n,a),O(n,r),O(r,i),O(r,s),O(r,o),O(o,u),O(n,c),O(n,d),O(n,l),O(n,h),O(h,f),O(f,m),m.value=e.url,O(f,g),O(f,v),O(n,$),O(n,Y),O(n,F),B=0;B<A.length;++B)A[B].i(n,null);U=!0},p(r,i){e=i,U&&!r.email||N(u,e.email),!W&&r.url&&(m.value=e.url),r.addLoading&&(x(v,"loading",e.addLoading),x(v,"disabled",e.addLoading));const s=e.feeds;M(),A=function(t,e,n,r,i,s,a,o,u,c,d,l,h,f){var m=t.length,p=a.length,g=m,v={};for(;g--;)v[t[g].key]=g;var y=[],$={},b={},g=p;for(;g--;){var _=f(s,a,g),M=r(_),k=o[M];k?i&&k.p(n,_):(k=d(e,M,_)).c(),y[g]=$[M]=k,M in v&&(b[M]=Math.abs(g-v[M]))}var S={},w={};function D(t){t[l](u,h),o[t.key]=t,h=t.first,p--}for(;m&&p;){var x=y[p-1],O=t[m-1],N=x.key,T=O.key;x===O?(h=x.first,m--,p--):$[T]?!o[N]||S[N]?D(x):w[T]?m--:b[N]>b[T]?(w[N]=!0,D(x)):(S[T]=!0,m--):(c(O,o),m--)}for(;m--;){var O=t[m];$[O.key]||c(O,o)}for(;p;)D(y[p-1]);return y}(A,t,r,Z,1,e,s,C,n,T,y,"i",null,p)},i(e,r){U||(t.root._intro&&(R&&R.invalidate(),t.root._aftercreate.push(()=>{R||(R=H(t,n,a,{},!0)),R.run(1)})),this.m(e,r))},o(e){if(!U)return;e=L(e,2);const r=L(e,A.length);for(B=0;B<A.length;++B)A[B].o(r);R||(R=H(t,n,a,{},!1)),R.run(0,()=>{e(),R=null}),U=!1},d(t){for(t&&k(n),j(m,"input",E),j(v,"click",P),B=0;B<A.length;++B)A[B].d();t&&R&&R.abort()}}}function v(t,e){var n,r;return{c(){(n=b("div")).innerHTML='<div class="column col-12"><button class="btn btn-link loading"></button></div>',n.className="columns"},m(t,e){_(t,n,e),r=!0},p:Y,i(t,e){r||this.m(t,e)},o:F,d(t){t&&k(n)}}}function y(t,e,n){var r,i,s,a,u,c,d,l,f,p,g,v,y,$,M,S,T,L,Y,F,R=n.feed.url,U=h(n.feed.lastUpdated);return{key:e,first:null,c(){r=b("div"),i=b("div"),s=b("div"),a=b("div"),u=b("a"),c=w(R),l=w("\n                    "),f=b("div"),p=b("span"),g=w("updated @ "),v=w(U),y=w("\n                "),$=b("div"),M=b("div"),(S=b("button")).textContent="delete",L=w("\n        "),(Y=b("div")).innerHTML='<div class="divider"></div>',u.target="_blank",u.rel="noopener",u.href=d=n.feed.url,a.className="tile-title text-break",f.className="tile-subtitle text-gray",s.className="tile-content",S._svelte={component:t,ctx:n},D(S,"click",m),S.type="button",S.className="btn btn-error",x(S,"loading",n.feed.loading),x(S,"disabled",n.feed.loading),$.className="tile-action",i.className="tile",r.className="column col-12",Y.className="column col-12",this.first=r},m(t,e){_(t,r,e),O(r,i),O(i,s),O(s,a),O(a,u),O(u,c),O(s,l),O(s,f),O(f,p),O(p,g),O(p,v),O(i,y),O(i,$),O($,M),O(M,S),_(t,L,e),_(t,Y,e),F=!0},p(t,e){n=e,F&&!t.feeds||R===(R=n.feed.url)||N(c,R),F&&!t.feeds||d===(d=n.feed.url)||(u.href=d),F&&!t.feeds||U===(U=h(n.feed.lastUpdated))||N(v,U),S._svelte.ctx=n,t.feeds&&(x(S,"loading",n.feed.loading),x(S,"disabled",n.feed.loading))},i(e,n){F||(t.root._intro&&(T&&T.invalidate(),t.root._aftercreate.push(()=>{T||(T=H(t,r,o,{},!0)),T.run(1)})),this.m(e,n))},o(e){F&&(T||(T=H(t,r,o,{},!1)),T.run(0,()=>{e(),T=null}),F=!1)},d(t){t&&k(r),j(S,"click",m),t&&(T&&T.abort(),k(L),k(Y))}}}function $(t){!function(t,e){t._handlers=S(),t._slots=S(),t._bind=e._bind,t._staged={},t.options=e,t.root=e.root||t,t.store=e.store||t.root.store,e.root||(t._beforecreate=[],t._oncreate=[],t._aftercreate=[])}(this,t),this._state=R({loading:!0,addLoading:!1,feeds:[],email:"",url:""},t.data),this._intro=!!t.intro,this._fragment=function(t,e){var n,r,i,s,a=[v,g],o=[];function u(t){return t.loading?0:1}return r=u(e),i=o[r]=a[r](t,e),{c(){n=b("div"),i.c(),n.className="container grid-sm"},m(t,e){_(t,n,e),o[r].i(n,null),s=!0},p(e,s){var c=r;(r=u(s))===c?o[r].p(e,s):(M(),i.o(function(){o[c].d(1),o[c]=null}),(i=o[r])||(i=o[r]=a[r](t,s)).c(),i.i(n,null))},i(t,e){s||this.m(t,e)},o(t){s&&(i?i.o(t):t(),s=!1)},d(t){t&&k(n),o[r].d()}}}(this,this._state),this.root._oncreate.push(()=>{(async function(){const t=await l("/api/v1/user");this.set({loading:!1,email:t.email,feeds:t.feeds})}).call(this),this.fire("update",{changed:function(t,e){for(var n in e)t[n]=1;return t}({},this._state),current:this._state})}),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor),U(this)),this._intro=!0}function b(t){return document.createElement(t)}function _(t,e,n){t.insertBefore(e,n)}function M(){W.current={remaining:0,callbacks:[]}}function k(t){t.parentNode.removeChild(t)}function S(){return Object.create(null)}function w(t){return document.createTextNode(t)}function D(t,e,n,r){t.addEventListener(e,n,r)}function x(t,e,n){t.classList.toggle(e,!!n)}function O(t,e){t.appendChild(e)}function N(t,e){t.data=""+e}function T(t,e){t.o(function(){!function(t,e){t.d(1),e[t.key]=null}(t,e)})}function H(t,e,n,r,i){let s,a,o,u=n.call(t,e,r),c=!1;return{t:i?0:1,running:!1,program:null,pending:null,run(t,e){"function"==typeof u?A.wait().then(()=>{u=u(),this._run(t,e)}):this._run(t,e)},_run(t,n){s=u.duration||300,a=u.easing||C;const r={start:window.performance.now()+(u.delay||0),b:t,callback:n||Y};i&&!c&&(u.css&&u.delay&&(o=e.style.cssText,e.style.cssText+=u.css(0,1)),u.tick&&u.tick(0,1),c=!0),t||(r.group=W.current,W.current.remaining+=1),u.delay?this.pending=r:this.start(r),this.running||(this.running=!0,A.add(this))},start(n){if(t.fire(`${n.b?"intro":"outro"}.start`,{node:e}),n.a=this.t,n.delta=n.b-n.a,n.duration=s*Math.abs(n.b-n.a),n.end=n.start+n.duration,u.css){u.delay&&(e.style.cssText=o);const t=function({a:t,b:e,delta:n,duration:r},i,s){const a=16.666/r;let o="{\n";for(let e=0;e<=1;e+=a){const r=t+n*i(e);o+=100*e+`%{${s(r,1-r)}}\n`}return o+`100% {${s(e,1-e)}}\n}`}(n,a,u.css);A.addRule(t,n.name="__svelte_"+function(t){let e=5381,n=t.length;for(;n--;)e=(e<<5)-e^t.charCodeAt(n);return e>>>0}(t)),e.style.animation=(e.style.animation||"").split(", ").filter(t=>t&&(n.delta<0||!/__svelte/.test(t))).concat(`${n.name} ${n.duration}ms linear 1 forwards`).join(", ")}this.program=n,this.pending=null},update(t){const e=this.program;if(!e)return;const n=t-e.start;this.t=e.a+e.delta*a(n/e.duration),u.tick&&u.tick(this.t,1-this.t)},done(){const n=this.program;this.t=n.b,u.tick&&u.tick(this.t,1-this.t),t.fire(`${n.b?"intro":"outro"}.end`,{node:e}),n.b||n.invalidated?u.css&&A.deleteRule(e,n.name):(n.group.callbacks.push(()=>{n.callback(),u.css&&A.deleteRule(e,n.name)}),0==--n.group.remaining&&n.group.callbacks.forEach(F)),this.running=!!this.pending},abort(t){this.program&&(t&&u.tick&&u.tick(1,0),u.css&&A.deleteRule(e,this.program.name),this.program=this.pending=null,this.running=!1)},invalidate(){this.program&&(this.program.invalidated=!0)}}}function L(t,e){return 0===e&&t(),()=>{--e||t()}}function j(t,e,n,r){t.removeEventListener(e,n,r)}function Y(){}function F(t){t()}function R(t,e){for(var n in e)t[n]=e[n];return t}function U(t){t._lock=!0,E(t._beforecreate),E(t._oncreate),E(t._aftercreate),t._lock=!1}R($.prototype,{destroy:function(t){this.destroy=Y,this.fire("destroy"),this.set=Y,this._fragment.d(!1!==t),this._fragment=null,this._state={}},get:function(){return this._state},fire:function(t,e){var n=t in this._handlers&&this._handlers[t].slice();if(!n)return;for(var r=0;r<n.length;++r){var i=n[r];if(!i.__calling)try{i.__calling=!0,i.call(this,e)}finally{i.__calling=!1}}},on:function(t,e){var n=this._handlers[t]||(this._handlers[t]=[]);return n.push(e),{cancel:function(){var t=n.indexOf(e);~t&&n.splice(t,1)}}},set:function(t){if(this._set(R({},t)),this.root._lock)return;U(this.root)},_set:function(t){var e=this._state,n={},r=!1;for(var i in t=R(this._staged,t),this._staged={},t)this._differs(t[i],e[i])&&(n[i]=r=!0);if(!r)return;this._state=R(R({},e),t),this._recompute(n,this._state),this._bind&&this._bind(n,this._state);this._fragment&&(this.fire("state",{changed:n,current:this._state,previous:e}),this._fragment.p(n,this._state),this.fire("update",{changed:n,current:this._state,previous:e}))},_stage:function(t){R(this._staged,t)},_mount:function(t,e){this._fragment[this._fragment.i?"i":"m"](t,e||null)},_differs:function(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}}),R($.prototype,f),$.prototype._recompute=Y;var W=window._svelteOutros||(window._svelteOutros={});var A=window._svelteTransitionManager||(window._svelteTransitionManager={running:!1,transitions:[],bound:null,stylesheet:null,activeRules:{},promise:null,add(t){this.transitions.push(t),this.running||(this.running=!0,requestAnimationFrame(this.bound||(this.bound=this.next.bind(this))))},addRule(t,e){if(!this.stylesheet){const t=b("style");document.head.appendChild(t),A.stylesheet=t.sheet}this.activeRules[e]||(this.activeRules[e]=!0,this.stylesheet.insertRule(`@keyframes ${e} ${t}`,this.stylesheet.cssRules.length))},next(){this.running=!1;const t=window.performance.now();let e=this.transitions.length;for(;e--;){const n=this.transitions[e];n.program&&t>=n.program.end&&n.done(),n.pending&&t>=n.pending.start&&n.start(n.pending),n.running?(n.update(t),this.running=!0):n.pending||this.transitions.splice(e,1)}if(this.running)requestAnimationFrame(this.bound);else if(this.stylesheet){let t=this.stylesheet.cssRules.length;for(;t--;)this.stylesheet.deleteRule(t);this.activeRules={}}},deleteRule(t,e){t.style.animation=t.style.animation.split(", ").filter(t=>t&&-1===t.indexOf(e)).join(", ")},wait:()=>(A.promise||(A.promise=Promise.resolve(),A.promise.then(()=>{A.promise=null})),A.promise)});function C(t){return t}function E(t){for(;t&&t.length;)t.shift()()}const P=new $({target:document.querySelector("#app")});e.default=P}});
//# sourceMappingURL=main.1e01513f8a400cf33be3.js.map