!function(t){var e={};function n(r){if(e[r])return e[r].exports;var i=e[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)n.d(r,i,function(e){return t[e]}.bind(null,i));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s="tjUo")}({Tf3d:function(t,e,n){},oOT8:function(t,e,n){},tjUo:function(t,e,n){"use strict";n.r(e);n("Tf3d"),n("oOT8");function r(t,e){var n,r,i,u,f;return{c(){var t;t="h1",n=document.createElement(t),r=o("Hello "),i=o(e.name),u=o("!"),n.className="svelte-1hwkvdu"},m(t,e){!function(t,e,n){t.insertBefore(e,n)}(t,n,e),s(n,r),s(n,i),s(n,u),f=!0},p(t,e){var n,r;t.name&&(n=i,r=e.name,n.data=""+r)},i(t,e){f||this.m(t,e)},o:a,d(t){var e;t&&(e=n).parentNode.removeChild(e)}}}function i(t){!function(t,e){t._handlers=c(),t._slots=c(),t._bind=e._bind,t._staged={},t.options=e,t.root=e.root||t,t.store=e.store||t.root.store,e.root||(t._beforecreate=[],t._oncreate=[],t._aftercreate=[])}(this,t),this._state=u({},t.data),this._intro=!!t.intro,this._fragment=r(0,this._state),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor)),this._intro=!0}function o(t){return document.createTextNode(t)}function s(t,e){t.appendChild(e)}function a(t){t()}function u(t,e){for(var n in e)t[n]=e[n];return t}function f(){}function c(){return Object.create(null)}function _(t){for(;t&&t.length;)t.shift()()}u(i.prototype,{destroy:function(t){this.destroy=f,this.fire("destroy"),this.set=f,this._fragment.d(!1!==t),this._fragment=null,this._state={}},get:function(){return this._state},fire:function(t,e){var n=t in this._handlers&&this._handlers[t].slice();if(!n)return;for(var r=0;r<n.length;r+=1){var i=n[r];if(!i.__calling)try{i.__calling=!0,i.call(this,e)}finally{i.__calling=!1}}},on:function(t,e){var n=this._handlers[t]||(this._handlers[t]=[]);return n.push(e),{cancel:function(){var t=n.indexOf(e);~t&&n.splice(t,1)}}},set:function(t){if(this._set(u({},t)),this.root._lock)return;e=this.root,e._lock=!0,_(e._beforecreate),_(e._oncreate),_(e._aftercreate),e._lock=!1;var e},_set:function(t){var e=this._state,n={},r=!1;for(var i in t=u(this._staged,t),this._staged={},t)this._differs(t[i],e[i])&&(n[i]=r=!0);if(!r)return;this._state=u(u({},e),t),this._recompute(n,this._state),this._bind&&this._bind(n,this._state);this._fragment&&(this.fire("state",{changed:n,current:this._state,previous:e}),this._fragment.p(n,this._state),this.fire("update",{changed:n,current:this._state,previous:e}))},_stage:function(t){u(this._staged,t)},_mount:function(t,e){this._fragment[this._fragment.i?"i":"m"](t,e||null)},_differs:function(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}}),i.prototype._recompute=f;const l=new i({target:document.body,data:{name:"world"}});e.default=l}});
//# sourceMappingURL=main.6eabbb6e03dfebe1028d.js.map