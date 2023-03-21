(function(){var n={504:function(n,t,e){"use strict";const r=e(129);const s=e(19);const o=e(12);function spawn(n,t,e){const c=s(n,t,e);const i=r.spawn(c.command,c.args,c.options);o.hookChildProcess(i,c);return i}function spawnSync(n,t,e){const c=s(n,t,e);const i=r.spawnSync(c.command,c.args,c.options);i.error=i.error||o.verifyENOENTSync(i.status,c);return i}n.exports=spawn;n.exports.spawn=spawn;n.exports.sync=spawnSync;n.exports._parse=s;n.exports._enoent=o},12:function(n){"use strict";const t=process.platform==="win32";function notFoundError(n,t){return Object.assign(new Error(`${t} ${n.command} ENOENT`),{code:"ENOENT",errno:"ENOENT",syscall:`${t} ${n.command}`,path:n.command,spawnargs:n.args})}function hookChildProcess(n,e){if(!t){return}const r=n.emit;n.emit=function(t,s){if(t==="exit"){const t=verifyENOENT(s,e,"spawn");if(t){return r.call(n,"error",t)}}return r.apply(n,arguments)}}function verifyENOENT(n,e){if(t&&n===1&&!e.file){return notFoundError(e.original,"spawn")}return null}function verifyENOENTSync(n,e){if(t&&n===1&&!e.file){return notFoundError(e.original,"spawnSync")}return null}n.exports={hookChildProcess:hookChildProcess,verifyENOENT:verifyENOENT,verifyENOENTSync:verifyENOENTSync,notFoundError:notFoundError}},19:function(n,t,e){"use strict";const r=e(622);const s=e(765);const o=e(869);const c=e(922);const i=process.platform==="win32";const a=/\.(?:com|exe)$/i;const u=/node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;function detectShebang(n){n.file=s(n);const t=n.file&&c(n.file);if(t){n.args.unshift(n.file);n.command=t;return s(n)}return n.file}function parseNonShell(n){if(!i){return n}const t=detectShebang(n);const e=!a.test(t);if(n.options.forceShell||e){const e=u.test(t);n.command=r.normalize(n.command);n.command=o.command(n.command);n.args=n.args.map((n=>o.argument(n,e)));const s=[n.command].concat(n.args).join(" ");n.args=["/d","/s","/c",`"${s}"`];n.command=process.env.comspec||"cmd.exe";n.options.windowsVerbatimArguments=true}return n}function parse(n,t,e){if(t&&!Array.isArray(t)){e=t;t=null}t=t?t.slice(0):[];e=Object.assign({},e);const r={command:n,args:t,options:e,file:undefined,original:{command:n,args:t}};return e.shell?r:parseNonShell(r)}n.exports=parse},869:function(n){"use strict";const t=/([()\][%!^"`<>&|;, *?])/g;function escapeCommand(n){n=n.replace(t,"^$1");return n}function escapeArgument(n,e){n=`${n}`;n=n.replace(/(\\*)"/g,'$1$1\\"');n=n.replace(/(\\*)$/,"$1$1");n=`"${n}"`;n=n.replace(t,"^$1");if(e){n=n.replace(t,"^$1")}return n}n.exports.command=escapeCommand;n.exports.argument=escapeArgument},922:function(n,t,e){"use strict";const r=e(747);const s=e(635);function readShebang(n){const t=150;const e=Buffer.alloc(t);let o;try{o=r.openSync(n,"r");r.readSync(o,e,0,t,0);r.closeSync(o)}catch(n){}return s(e.toString())}n.exports=readShebang},765:function(n,t,e){"use strict";const r=e(622);const s=e(480);const o=e(646);function resolveCommandAttempt(n,t){const e=n.options.env||process.env;const c=process.cwd();const i=n.options.cwd!=null;const a=i&&process.chdir!==undefined&&!process.chdir.disabled;if(a){try{process.chdir(n.options.cwd)}catch(n){}}let u;try{u=s.sync(n.command,{path:e[o({env:e})],pathExt:t?r.delimiter:undefined})}catch(n){}finally{if(a){process.chdir(c)}}if(u){u=r.resolve(i?n.options.cwd:"",u)}return u}function resolveCommand(n){return resolveCommandAttempt(n)||resolveCommandAttempt(n,true)}n.exports=resolveCommand},668:function(n,t,e){var r=e(747);var s;if(process.platform==="win32"||global.TESTING_WINDOWS){s=e(332)}else{s=e(484)}n.exports=isexe;isexe.sync=sync;function isexe(n,t,e){if(typeof t==="function"){e=t;t={}}if(!e){if(typeof Promise!=="function"){throw new TypeError("callback not provided")}return new Promise((function(e,r){isexe(n,t||{},(function(n,t){if(n){r(n)}else{e(t)}}))}))}s(n,t||{},(function(n,r){if(n){if(n.code==="EACCES"||t&&t.ignoreErrors){n=null;r=false}}e(n,r)}))}function sync(n,t){try{return s.sync(n,t||{})}catch(n){if(t&&t.ignoreErrors||n.code==="EACCES"){return false}else{throw n}}}},484:function(n,t,e){n.exports=isexe;isexe.sync=sync;var r=e(747);function isexe(n,t,e){r.stat(n,(function(n,r){e(n,n?false:checkStat(r,t))}))}function sync(n,t){return checkStat(r.statSync(n),t)}function checkStat(n,t){return n.isFile()&&checkMode(n,t)}function checkMode(n,t){var e=n.mode;var r=n.uid;var s=n.gid;var o=t.uid!==undefined?t.uid:process.getuid&&process.getuid();var c=t.gid!==undefined?t.gid:process.getgid&&process.getgid();var i=parseInt("100",8);var a=parseInt("010",8);var u=parseInt("001",8);var f=i|a;var p=e&u||e&a&&s===c||e&i&&r===o||e&f&&o===0;return p}},332:function(n,t,e){n.exports=isexe;isexe.sync=sync;var r=e(747);function checkPathExt(n,t){var e=t.pathExt!==undefined?t.pathExt:process.env.PATHEXT;if(!e){return true}e=e.split(";");if(e.indexOf("")!==-1){return true}for(var r=0;r<e.length;r++){var s=e[r].toLowerCase();if(s&&n.substr(-s.length).toLowerCase()===s){return true}}return false}function checkStat(n,t,e){if(!n.isSymbolicLink()&&!n.isFile()){return false}return checkPathExt(t,e)}function isexe(n,t,e){r.stat(n,(function(r,s){e(r,r?false:checkStat(s,n,t))}))}function sync(n,t){return checkStat(r.statSync(n),n,t)}},646:function(n){"use strict";const pathKey=(n={})=>{const t=n.env||process.env;const e=n.platform||process.platform;if(e!=="win32"){return"PATH"}return Object.keys(t).reverse().find((n=>n.toUpperCase()==="PATH"))||"Path"};n.exports=pathKey;n.exports.default=pathKey},635:function(n,t,e){"use strict";const r=e(20);n.exports=(n="")=>{const t=n.match(r);if(!t){return null}const[e,s]=t[0].replace(/#! ?/,"").split(" ");const o=e.split("/").pop();if(o==="env"){return s}return s?`${o} ${s}`:o}},20:function(n){"use strict";n.exports=/^#!(.*)/},480:function(n,t,e){const r=process.platform==="win32"||process.env.OSTYPE==="cygwin"||process.env.OSTYPE==="msys";const s=e(622);const o=r?";":":";const c=e(668);const getNotFoundError=n=>Object.assign(new Error(`not found: ${n}`),{code:"ENOENT"});const getPathInfo=(n,t)=>{const e=t.colon||o;const s=n.match(/\//)||r&&n.match(/\\/)?[""]:[...r?[process.cwd()]:[],...(t.path||process.env.PATH||"").split(e)];const c=r?t.pathExt||process.env.PATHEXT||".EXE;.CMD;.BAT;.COM":"";const i=r?c.split(e):[""];if(r){if(n.indexOf(".")!==-1&&i[0]!=="")i.unshift("")}return{pathEnv:s,pathExt:i,pathExtExe:c}};const which=(n,t,e)=>{if(typeof t==="function"){e=t;t={}}if(!t)t={};const{pathEnv:r,pathExt:o,pathExtExe:i}=getPathInfo(n,t);const a=[];const step=e=>new Promise(((o,c)=>{if(e===r.length)return t.all&&a.length?o(a):c(getNotFoundError(n));const i=r[e];const u=/^".*"$/.test(i)?i.slice(1,-1):i;const f=s.join(u,n);const p=!u&&/^\.[\\\/]/.test(n)?n.slice(0,2)+f:f;o(subStep(p,e,0))}));const subStep=(n,e,r)=>new Promise(((s,u)=>{if(r===o.length)return s(step(e+1));const f=o[r];c(n+f,{pathExt:i},((o,c)=>{if(!o&&c){if(t.all)a.push(n+f);else return s(n+f)}return s(subStep(n,e,r+1))}))}));return e?step(0).then((n=>e(null,n)),e):step(0)};const whichSync=(n,t)=>{t=t||{};const{pathEnv:e,pathExt:r,pathExtExe:o}=getPathInfo(n,t);const i=[];for(let a=0;a<e.length;a++){const u=e[a];const f=/^".*"$/.test(u)?u.slice(1,-1):u;const p=s.join(f,n);const l=!f&&/^\.[\\\/]/.test(n)?n.slice(0,2)+p:p;for(let n=0;n<r.length;n++){const e=l+r[n];try{const n=c.sync(e,{pathExt:o});if(n){if(t.all)i.push(e);else return e}}catch(n){}}}if(t.all&&i.length)return i;if(t.nothrow)return null;throw getNotFoundError(n)};n.exports=which;which.sync=whichSync},129:function(n){"use strict";n.exports=require("child_process")},747:function(n){"use strict";n.exports=require("fs")},622:function(n){"use strict";n.exports=require("path")}};var t={};function __nccwpck_require__(e){var r=t[e];if(r!==undefined){return r.exports}var s=t[e]={exports:{}};var o=true;try{n[e](s,s.exports,__nccwpck_require__);o=false}finally{if(o)delete t[e]}return s.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var e=__nccwpck_require__(504);module.exports=e})();