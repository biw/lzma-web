var r=1,n=2,f=3,t="function"==typeof setImmediate?setImmediate:setTimeout,o=[4294967295,-4294967296],u=[0,-0x8000000000000000],i=[0,0],e=[1,0];function c(r,n){postMessage({action:3,cbn:n,result:r})}function a(r){var n=[];return n[r-1]=void 0,n}function v(r,n){return s(r[0]+n[0],r[1]+n[1])}function l(r,n){return function(r,n){var f;f=n,0>n&&(f+=4294967296);return[f,4294967296*r]}(~~Math.max(Math.min(r[1]/4294967296,2147483647),-2147483648)&~~Math.max(Math.min(n[1]/4294967296,2147483647),-2147483648),M(r)&M(n))}function h(r,n){var f,t;return r[0]==n[0]&&r[1]==n[1]?0:(t=0>n[1],(f=0>r[1])&&!t?-1:!f&&t?1:0>x(r,n)[1]?-1:1)}function s(r,n){var f,t;for(n=(n%=0x10000000000000000)-(f=n%4294967296)+(t=4294967296*Math.floor((r%=0x10000000000000000)/4294967296)),r=r-t+f;0>r;)r+=4294967296,n-=4294967296;for(;r>4294967295;)r-=4294967296,n+=4294967296;for(n%=0x10000000000000000;n>0x7fffffff00000000;)n-=0x10000000000000000;for(;-0x8000000000000000>n;)n+=0x10000000000000000;return[r,n]}function d(r,n){return r[0]==n[0]&&r[1]==n[1]}function w(r){return 0>r?[r+4294967296,-4294967296]:[r,0]}function M(r){return 2147483648>r[0]?~~Math.max(Math.min(r[0],2147483647),-2147483648):~~Math.max(Math.min(r[0]-4294967296,2147483647),-2147483648)}function p(r){return r>30?p(30)*p(r-30):1<<r}function m(r,n){var f,t,o,e;if(n&=63,d(r,u))return n?i:r;if(0>r[1])throw Error("Neg");return e=p(n),t=r[1]*e%0x10000000000000000,0x8000000000000000>(t+=f=(o=r[0]*e)-o%4294967296)||(t-=0x10000000000000000),[o-=f,t]}function b(r,n){var f;return f=p(n&=63),s(Math.floor(r[0]/f),r[1]/f)}function x(r,n){return s(r[0]-n[0],r[1]-n[1])}function g(r,n){return r.t=n,r.o=0,r.count=n.length,r}function E(r){return r.count>r.o?255&r.t[r.o++]:-1}function y(r,n,f,t){return r.count>r.o?(N(r.t,r.o,n,f,t=Math.min(t,r.count-r.o)),r.o+=t,t):-1}function k(r){return r.t=a(32),r.count=0,r}function D(r){var n=r.t;return n.length=r.count,n}function S(r,n){r.t[r.count++]=n<<24>>24}function I(r,n,f,t){N(n,f,r.t,r.count,t),r.count+=t}function N(r,n,f,t,o){for(var u=0;o>u;++u)f[t+u]=r[n+u]}function $(r,n,f,t,u){var e,c;if(0>h(t,o))throw Error("invalid length "+t);for(r.u=t,function(r,n){!function(r,n){r.i=n;for(var f=0;n>1<<f;++f);r.v=2*f}(n,1<<r.l),n.h=r.f,function(r,n){var f=r.s;r.s=n,r.M&&f!=r.s&&(r.p=-1,r.M=null)}(n,r.m),n.g=0,n.k=3,n.D=2,n.S=3}(u,e=function(r){var n;for(r.I=a(4),r.N=[],r.$={},r.j=a(192),r.T=a(12),r.q=a(12),r.A=a(12),r.B=a(12),r.C=a(192),r.F=[],r.G=a(114),r.H=Dr({},4),r.J=dr({}),r.K=dr({}),r.L={},r.O=[],r.P=[],r.R=[],r.U=a(16),r.V=a(4),r.W=a(4),r.X=[i],r.Y=[i],r.Z=[0],r.properties=a(5),r._=a(128),r.rr=0,r.s=1,r.nr=0,r.tr=-1,r.or=0,n=0;4096>n;++n)r.N[n]={};for(n=0;4>n;++n)r.F[n]=Dr({},6);return r}({})),e.ur=void 0===LZMA.ir,function(r,n){r.properties[0]=9*(5*r.D+r.g)+r.k<<24>>24;for(var f=0;4>f;++f)r.properties[1+f]=r.i>>8*f<<24>>24;I(n,r.properties,0,5)}(e,f),c=0;64>c;c+=8)S(f,255&M(b(t,c)));r.er=(e.cr=0,e.ar=n,e.vr=0,function(r){var n,f;r.M||(f=4,r.s||(f=2),function(r,n){r.lr=n>2,r.lr?(r.hr=0,r.sr=4,r.dr=66560):(r.hr=2,r.sr=3,r.dr=0)}(n={},f),r.M=n);if(function(r,n,f){var t,o;if(null!=r.wr&&r.Mr==f&&r.pr==n)return;for(r.pr=n,r.mr=(1<<n)-1,r.Mr=f,r.wr=a(o=1<<r.Mr+r.pr),t=0;o>t;++t)r.wr[t]=xr({})}(r.L,r.g,r.k),r.i==r.p&&r.tr==r.h)return;(function(r,n,f,t,o){var u,i;1073741567>n&&(r.br=16+(t>>1),function(r,n,f,t){var o;r.xr=n,r.gr=f,o=n+f+t,(null==r.Er||r.yr!=o)&&(r.Er=null,r.yr=o,r.Er=a(r.yr));r.kr=r.yr-f}(r,n+f,t+o,256+~~((n+f+t+o)/2)),r.Dr=t,r.Sr!=(u=n+1)&&(r.Ir=a(2*(r.Sr=u))),i=65536,r.lr&&(i=n-1,i|=i>>1,i|=i>>2,i|=i>>4,i|=i>>8,i>>=1,(i|=65535)>16777216&&(i>>=1),r.Nr=i,i+=1,i+=r.dr),i!=r.$r&&(r.jr=a(r.$r=i)))})(r.M,r.i,4096,r.h,274),r.p=r.i,r.tr=r.h}(e),e.$.Tr=f,function(r){(function(r){r.qr=0,r.zr=0;for(var n=0;4>n;++n)r.I[n]=0})(r),function(r){r.Ar=i,r.Br=i,r.Range=-1,r.Cr=1,r.Fr=0}(r.$),zr(r.j),zr(r.C),zr(r.T),zr(r.q),zr(r.A),zr(r.B),zr(r.G),function(r){var n,f=1<<r.Mr+r.pr;for(n=0;f>n;++n)zr(r.wr[n].Gr)}(r.L);for(var n=0;4>n;++n)zr(r.F[n].Hr);lr(r.J,1<<r.D),lr(r.K,1<<r.D),zr(r.H.Hr),r.Jr=0,r.Kr=0,r.Lr=0,r.Or=0}(e),fr(e),nr(e),e.J.Pr=e.h+1-2,Mr(e.J,1<<e.D),e.K.Pr=e.h+1-2,Mr(e.K,1<<e.D),e.Qr=i,function(r,n){return r.Rr=n,r.Ur=null,r.Vr=1,r}({},e))}function j(r,n,f){return r.Wr=k({}),$(r,g({},n),r.Wr,w(n.length),f),r}function T(r,n,f){var t,u,e,c,v="",l=[];for(u=0;5>u;++u){if(-1==(e=E(n)))throw Error("truncated input");l[u]=e<<24>>24}if(!function(r,n){var f,t,o,u,i,e,c;if(5>n.length)return 0;for(o=(c=255&n[0])%9,u=(e=~~(c/9))%5,i=~~(e/5),f=0,t=0;4>t;++t)f+=(255&n[1+t])<<8*t;if(f>99999999||!function(r,n,f,t){if(n>8||f>4||t>4)return 0;!function(r,n,f){var t,o;if(null!=r.wr&&r.Mr==f&&r.pr==n)return;for(r.pr=n,r.mr=(1<<n)-1,r.Mr=f,r.wr=a(o=1<<r.Mr+r.pr),t=0;o>t;++t)r.wr[t]=Z({})}(r.Xr,f,n);var o=1<<t;return V(r.Yr,o),V(r.Zr,o),r._r=o-1,1}(r,o,u,i))return 0;return function(r,n){if(0>n)return 0;r.rn!=n&&(r.rn=n,r.nn=Math.max(r.rn,1),function(r,n){null!=r.fn&&r.tn==n||(r.fn=a(n));r.tn=n,r.on=0,r.un=0}(r.in,Math.max(r.nn,4096)));return 1}(r,f)}(t=function(r){r.in={},r.en={},r.cn=a(192),r.an=a(12),r.vn=a(12),r.ln=a(12),r.hn=a(12),r.sn=a(192),r.dn=a(4),r.wn=a(114),r.Mn=yr({},4),r.Yr=X({}),r.Zr=X({}),r.Xr={};for(var n=0;4>n;++n)r.dn[n]=yr({},6);return r}({}),l))throw Error("corrupted input");for(u=0;64>u;u+=8){if(-1==(e=E(n)))throw Error("truncated input");1==(e=e.toString(16)).length&&(e="0"+e),v=e+""+v}r.u=/^0+$|^f+$/i.test(v)?o:(c=parseInt(v,16))>4294967295?o:w(c),r.er=function(r,n,f,t){return r.en.Tr=n,O(r.in),r.in.pn=f,function(r){r.in.un=0,r.in.on=0,zr(r.cn),zr(r.sn),zr(r.an),zr(r.vn),zr(r.ln),zr(r.hn),zr(r.wn),function(r){var n,f;for(f=1<<r.Mr+r.pr,n=0;f>n;++n)zr(r.wr[n].mn)}(r.Xr);for(var n=0;4>n;++n)zr(r.dn[n].Hr);Y(r.Yr),Y(r.Zr),zr(r.Mn.Hr),function(r){r.bn=0,r.Range=-1;for(var n=0;5>n;++n)r.bn=r.bn<<8|E(r.Tr)}(r.en)}(r),r.state=0,r.xn=0,r.gn=0,r.En=0,r.yn=0,r.kn=t,r.Qr=i,r.Dn=0,function(r,n){return r.Ur=n,r.Rr=null,r.Vr=1,r}({},r)}(t,n,f,r.u)}function q(r,n){return r.Wr=k({}),T(r,g({},n),r.Wr),r}function z(r,n){return r.Er[r.Sn+r.on+n]}function A(r,n,f,t){var o,u;for(r.In&&r.on+n+t>r.un&&(t=r.un-(r.on+n)),++f,u=r.Sn+r.on+n,o=0;t>o&&r.Er[u+o]==r.Er[u+o-f];++o);return o}function B(r){return r.un-r.on}function C(r){var n,f;if(!r.In)for(;;){if(!(f=-r.Sn+r.yr-r.un))return;if(-1==(n=y(r.pn,r.Er,r.Sn+r.un,f)))return r.Nn=r.un,r.Sn+r.Nn>r.kr&&(r.Nn=r.kr-r.Sn),void(r.In=1);r.un+=n,r.on+r.gr>r.un||(r.Nn=r.un-r.gr)}}function F(r,n){r.Sn+=n,r.Nn-=n,r.on-=n,r.un-=n}var G=function(){var r,n,f,t=[];for(r=0;256>r;++r){for(f=r,n=0;8>n;++n)0!=(1&f)?(f>>>=1,f^=-306674912):f>>>=1;t[r]=f}return t}();function H(r){var n;(r.$n+=1)<r.Sr||(r.$n=0),function(r){r.on+=1,r.on>r.Nn&&(r.Sn+r.on>r.kr&&function(r){var n,f,t;for((t=r.Sn+r.on-r.xr)>0&&--t,f=r.Sn+r.un-t,n=0;f>n;++n)r.Er[n]=r.Er[t+n];r.Sn-=t}(r),C(r))}(r),1073741823==r.on&&(J(r.Ir,2*r.Sr,n=r.on-r.Sr),J(r.jr,r.$r,n),F(r,n))}function J(r,n,f){var t,o;for(t=0;n>t;++t)(o=r[t]||0)>f?o-=f:o=0,r[t]=o}function K(r){var n=r.on-r.un;n&&(I(r.pn,r.fn,r.un,n),r.tn>r.on||(r.on=0),r.un=r.on)}function L(r,n){var f=r.on-n-1;return 0>f&&(f+=r.tn),r.fn[f]}function O(r){K(r),r.pn=null}function P(r){return 4>(r-=2)?r:3}function Q(r){return 4>r?0:10>r?r-3:r-6}function R(r){if(!r.Vr)throw Error("bad state");if(r.Rr)throw Error("No encoding");return function(r){var n=function(r){var n,f,t,o,u,i;if(i=M(r.Qr)&r._r,qr(r.en,r.cn,(r.state<<4)+i)){if(qr(r.en,r.an,r.state))t=0,qr(r.en,r.vn,r.state)?(qr(r.en,r.ln,r.state)?(qr(r.en,r.hn,r.state)?(f=r.yn,r.yn=r.En):f=r.En,r.En=r.gn):f=r.gn,r.gn=r.xn,r.xn=f):qr(r.en,r.sn,(r.state<<4)+i)||(r.state=7>r.state?9:11,t=1),t||(t=W(r.Zr,r.en,i)+2,r.state=7>r.state?8:11);else if(r.yn=r.En,r.En=r.gn,r.gn=r.xn,t=2+W(r.Yr,r.en,i),r.state=7>r.state?7:10,4>(u=kr(r.dn[P(t)],r.en)))r.xn=u;else if(r.xn=(2|1&u)<<(o=(u>>1)-1),14>u)r.xn+=function(r,n,f,t){var o,u,i=1,e=0;for(u=0;t>u;++u)o=qr(f,r,n+i),i<<=1,i+=o,e|=o<<u;return e}(r.wn,r.xn-u-1,r.en,o);else if(r.xn+=function(r,n){var f,t,o=0;for(f=n;0!=f;f-=1)r.Range>>>=1,r.bn-=r.Range&(t=r.bn-r.Range>>>31)-1,o=o<<1|1-t,-16777216&r.Range||(r.bn=r.bn<<8|E(r.Tr),r.Range<<=8);return o}(r.en,o-4)<<4,r.xn+=function(r,n){var f,t,o=1,u=0;for(t=0;r.jn>t;++t)f=qr(n,r.Hr,o),o<<=1,o+=f,u|=f<<t;return u}(r.Mn,r.en),0>r.xn)return-1==r.xn?1:-1;if(h(w(r.xn),r.Qr)>=0||r.xn>=r.nn)return-1;!function(r,n,f){var t=r.on-n-1;for(0>t&&(t+=r.tn);0!=f;f-=1)r.tn>t||(t=0),r.fn[r.on]=r.fn[t],r.on+=1,t+=1,r.tn>r.on||K(r)}(r.in,r.xn,t),r.Qr=v(r.Qr,w(t)),r.Dn=L(r.in,0)}else n=function(r,n,f){return r.wr[((n&r.mr)<<r.Mr)+((255&f)>>>8-r.Mr)]}(r.Xr,M(r.Qr),r.Dn),r.Dn=7>r.state?function(r,n){var f=1;do{f=f<<1|qr(n,r.mn,f)}while(256>f);return f<<24>>24}(n,r.en):function(r,n,f){var t,o,u=1;do{if(o=f>>7&1,f<<=1,t=qr(n,r.mn,(1+o<<8)+u),u=u<<1|t,o!=t){for(;256>u;)u=u<<1|qr(n,r.mn,u);break}}while(256>u);return u<<24>>24}(n,r.en,L(r.in,r.xn)),function(r,n){r.fn[r.on]=n,r.on+=1,r.tn>r.on||K(r)}(r.in,r.Dn),r.state=Q(r.state),r.Qr=v(r.Qr,e);return 0}(r.Ur);if(-1==n)throw Error("corrupted input");r.Tn=o,r.qn=r.Ur.Qr,(n||h(r.Ur.kn,i)>=0&&h(r.Ur.Qr,r.Ur.kn)>=0)&&(K(r.Ur.in),O(r.Ur.in),r.Ur.en.Tr=null,r.Vr=0)}(r),r.Vr}function U(r){if(!r.Vr)throw Error("bad state");if(!r.Rr)throw Error("No decoding");return function(r){(function(r,n,f,t){var o,u,c,a,l,s,p,m,b,g,E,y,k,D;n[0]=i,f[0]=i,t[0]=1,r.ar&&(r.M.pn=r.ar,function(r){r.Sn=0,r.on=0,r.un=0,r.In=0,C(r),r.$n=0,F(r,-1)}(r.M),r.cr=1,r.ar=null);if(r.vr)return;if(r.vr=1,k=r.Qr,d(r.Qr,i)){if(!B(r.M))return void tr(r,M(r.Qr));cr(r),y=M(r.Qr)&r.S,Br(r.$,r.j,(r.qr<<4)+y,0),r.qr=Q(r.qr),c=z(r.M,-r.Or),mr(pr(r.L,M(r.Qr),r.zr),r.$,c),r.zr=c,r.Or-=1,r.Qr=v(r.Qr,e)}if(!B(r.M))return void tr(r,M(r.Qr));for(;;){if(s=or(r,M(r.Qr)),b=r.or,y=M(r.Qr)&r.S,u=(r.qr<<4)+y,1==s&&-1==b)Br(r.$,r.j,u,0),c=z(r.M,-r.Or),D=pr(r.L,M(r.Qr),r.zr),7>r.qr?mr(D,r.$,c):(m=z(r.M,-r.I[0]-1-r.Or),br(D,r.$,m,c)),r.zr=c,r.qr=Q(r.qr);else{if(Br(r.$,r.j,u,1),4>b){if(Br(r.$,r.T,r.qr,1),b?(Br(r.$,r.q,r.qr,1),1==b?Br(r.$,r.A,r.qr,0):(Br(r.$,r.A,r.qr,1),Br(r.$,r.B,r.qr,b-2))):(Br(r.$,r.q,r.qr,0),Br(r.$,r.C,u,1==s?0:1)),1==s?r.qr=7>r.qr?9:11:(sr(r.K,r.$,s-2,y),r.qr=7>r.qr?8:11),a=r.I[b],0!=b){for(var S=b;S>=1;--S)r.I[S]=r.I[S-1];r.I[0]=a}}else{Br(r.$,r.T,r.qr,0),r.qr=7>r.qr?7:10,sr(r.J,r.$,s-2,y),E=vr(b-=4),p=P(s),Sr(r.F[p],r.$,E),4>E||(g=b-(o=(2|1&E)<<(l=(E>>1)-1)),14>E?jr(r.G,o-E-1,r.$,l,g):(Cr(r.$,g>>4,l-4),Nr(r.H,r.$,15&g),r.zn+=1)),a=b;for(S=3;S>=1;--S)r.I[S]=r.I[S-1];r.I[0]=a,r.An+=1}r.zr=z(r.M,s-1-r.Or)}if(r.Or-=s,r.Qr=v(r.Qr,w(s)),!r.Or){if(128>r.An||fr(r),16>r.zn||nr(r),n[0]=r.Qr,f[0]=Fr(r.$),!B(r.M))return void tr(r,M(r.Qr));if(h(x(r.Qr,k),[4096,0])>=0)return r.vr=0,void(t[0]=0)}}})(r.Rr,r.Rr.X,r.Rr.Y,r.Rr.Z),r.Tn=r.Rr.X[0],r.Rr.Z[0]&&(!function(r){ar(r),r.$.Tr=null}(r.Rr),r.Vr=0)}(r),r.Vr}function V(r,n){for(;n>r.Bn;r.Bn+=1)r.Cn[r.Bn]=yr({},3),r.Fn[r.Bn]=yr({},3)}function W(r,n,f){if(!qr(n,r.Gn,0))return kr(r.Cn[f],n);var t=8;return qr(n,r.Gn,1)?t+=8+kr(r.Hn,n):t+=kr(r.Fn[f],n),t}function X(r){return r.Gn=a(2),r.Cn=a(16),r.Fn=a(16),r.Hn=yr({},8),r.Bn=0,r}function Y(r){zr(r.Gn);for(var n=0;r.Bn>n;++n)zr(r.Cn[n].Hr),zr(r.Fn[n].Hr);zr(r.Hn.Hr)}function Z(r){return r.mn=a(768),r}var _=function(){var r,n,f,t=2,o=[0,1];for(f=2;22>f;++f){var u=f;for(u>>=1,n=1,n<<=u-=1,r=0;n>r;++r,++t)o[t]=f<<24>>24}return o}();function rr(r,n){var f,t,o,u;r.Kr=n,o=r.N[n].Jn,t=r.N[n].Kn;do{r.N[n].Ln&&(Er(r.N[o]),r.N[o].Jn=o-1,r.N[n].On&&(r.N[o-1].Ln=0,r.N[o-1].Jn=r.N[n].Pn,r.N[o-1].Kn=r.N[n].Qn)),f=t,t=r.N[u=o].Kn,o=r.N[u].Jn,r.N[u].Kn=f,r.N[u].Jn=n,n=u}while(n>0);return r.or=r.N[0].Kn,r.Lr=r.N[0].Jn,r.Lr}function nr(r){for(var n=0;16>n;++n)r.U[n]=$r(r.H,n);r.zn=0}function fr(r){var n,f,t,o,u,i,e,c;for(o=4;128>o;++o)i=vr(o),r._[o]=Tr(r.G,(n=(2|1&i)<<(t=(i>>1)-1))-i-1,t,o-n);for(u=0;4>u;++u){for(f=r.F[u],e=u<<6,i=0;r.v>i;i+=1)r.P[e+i]=Ir(f,i);for(i=14;r.v>i;i+=1)r.P[e+i]+=(i>>1)-1-4<<6;for(c=128*u,o=0;4>o;++o)r.R[c+o]=r.P[e+o];for(;128>o;++o)r.R[c+o]=r.P[e+vr(o)]+r._[o]}r.An=0}function tr(r,n){ar(r),function(r,n){if(!r.ur)return;Br(r.$,r.j,(r.qr<<4)+n,1),Br(r.$,r.T,r.qr,0),r.qr=7>r.qr?7:10,sr(r.J,r.$,0,n);var f=P(2);Sr(r.F[f],r.$,63),Cr(r.$,67108863,26),Nr(r.H,r.$,15)}(r,n&r.S);for(var f=0;5>f;++f)Gr(r.$)}function or(r,n){var f,t,o,u,i,e,c,a,v,l,h,s,d,w,M,p,m,b,x,g,E,y,k,D,S,I,N,$,j,T,q,C,F,G,H,J,K,L,O,P,R,U,V;if(r.Kr!=r.Lr)return d=r.N[r.Lr].Jn-r.Lr,r.or=r.N[r.Lr].Kn,r.Lr=r.N[r.Lr].Jn,d;if(r.Lr=r.Kr=0,r.Jr?(s=r.rr,r.Jr=0):s=cr(r),I=r.nr,2>(D=B(r.M)+1))return r.or=-1,1;for(D>273&&(D=273),O=0,v=0;4>v;++v)r.V[v]=r.I[v],r.W[v]=A(r.M,-1,r.V[v],273),r.W[v]>r.W[O]&&(O=v);if(r.W[O]>=r.h)return r.or=O,er(r,(d=r.W[O])-1),d;if(s>=r.h)return r.or=r.O[I-1]+4,er(r,s-1),s;if(c=z(r.M,-1),m=z(r.M,-r.I[0]-1-1),2>s&&c!=m&&2>r.W[O])return r.or=-1,1;if(r.N[0].Rn=r.qr,r.N[1].Un=Ar[r.j[(r.qr<<4)+(F=n&r.S)]>>>2]+gr(pr(r.L,n,r.zr),r.qr>=7,m,c),Er(r.N[1]),L=(b=Ar[2048-r.j[(r.qr<<4)+F]>>>2])+Ar[2048-r.T[r.qr]>>>2],m==c&&(P=L+function(r,n,f){return Ar[r.q[n]>>>2]+Ar[r.C[(n<<4)+f]>>>2]}(r,r.qr,F),r.N[1].Un>P&&(r.N[1].Un=P,function(r){r.Kn=0,r.Ln=0}(r.N[1]))),2>(h=r.W[O]>s?r.W[O]:s))return r.or=r.N[1].Kn,1;r.N[1].Jn=0,r.N[0].Vn=r.V[0],r.N[0].Wn=r.V[1],r.N[0].Xn=r.V[2],r.N[0].Yn=r.V[3],l=h;do{r.N[l].Un=268435455,l-=1}while(l>=2);for(v=0;4>v;++v)if((K=r.W[v])>=2){H=L+ir(r,v,r.qr,F);do{u=H+wr(r.K,K-2,F),(T=r.N[K]).Un>u&&(T.Un=u,T.Jn=0,T.Kn=v,T.Ln=0)}while((K-=1)>=2)}if(k=b+Ar[r.T[r.qr]>>>2],s>=(l=2>r.W[0]?2:r.W[0]+1)){for(N=0;l>r.O[N];)N+=2;for(;u=k+ur(r,a=r.O[N+1],l,F),(T=r.N[l]).Un>u&&(T.Un=u,T.Jn=0,T.Kn=a+4,T.Ln=0),l!=r.O[N]||(N+=2)!=I;l+=1);}for(f=0;;){if(++f==h)return rr(r,f);if(x=cr(r),I=r.nr,x>=r.h)return r.rr=x,r.Jr=1,rr(r,f);if(n+=1,C=r.N[f].Jn,r.N[f].Ln?(C-=1,r.N[f].On?(U=r.N[r.N[f].Pn].Rn,U=4>r.N[f].Qn?7>U?8:11:7>U?7:10):U=r.N[C].Rn,U=Q(U)):U=r.N[C].Rn,C==f-1?U=r.N[f].Kn?Q(U):7>U?9:11:(r.N[f].Ln&&r.N[f].On?(C=r.N[f].Pn,q=r.N[f].Qn,U=7>U?8:11):U=4>(q=r.N[f].Kn)?7>U?8:11:7>U?7:10,j=r.N[C],4>q?q?1==q?(r.V[0]=j.Wn,r.V[1]=j.Vn,r.V[2]=j.Xn,r.V[3]=j.Yn):2==q?(r.V[0]=j.Xn,r.V[1]=j.Vn,r.V[2]=j.Wn,r.V[3]=j.Yn):(r.V[0]=j.Yn,r.V[1]=j.Vn,r.V[2]=j.Wn,r.V[3]=j.Xn):(r.V[0]=j.Vn,r.V[1]=j.Wn,r.V[2]=j.Xn,r.V[3]=j.Yn):(r.V[0]=q-4,r.V[1]=j.Vn,r.V[2]=j.Wn,r.V[3]=j.Xn)),r.N[f].Rn=U,r.N[f].Vn=r.V[0],r.N[f].Wn=r.V[1],r.N[f].Xn=r.V[2],r.N[f].Yn=r.V[3],e=r.N[f].Un,c=z(r.M,-1),m=z(r.M,-r.V[0]-1-1),t=e+Ar[r.j[(U<<4)+(F=n&r.S)]>>>2]+gr(pr(r.L,n,z(r.M,-2)),U>=7,m,c),g=0,(E=r.N[f+1]).Un>t&&(E.Un=t,E.Jn=f,E.Kn=-1,E.Ln=0,g=1),L=(b=e+Ar[2048-r.j[(U<<4)+F]>>>2])+Ar[2048-r.T[U]>>>2],m!=c||f>E.Jn&&!E.Kn||(P=L+(Ar[r.q[U]>>>2]+Ar[r.C[(U<<4)+F]>>>2]))>E.Un||(E.Un=P,E.Jn=f,E.Kn=0,E.Ln=0,g=1),(D=S=(S=B(r.M)+1)>4095-f?4095-f:S)>=2){if(D>r.h&&(D=r.h),!g&&m!=c&&(M=A(r.M,0,r.V[0],Math.min(S-1,r.h)))>=2){for(V=Q(U),y=t+Ar[2048-r.j[(V<<4)+(G=n+1&r.S)]>>>2]+Ar[2048-r.T[V]>>>2],$=f+1+M;$>h;)r.N[h+=1].Un=268435455;u=y+(wr(r.K,M-2,G)+ir(r,0,V,G)),(T=r.N[$]).Un>u&&(T.Un=u,T.Jn=f+1,T.Kn=0,T.Ln=1,T.On=0)}for(R=2,J=0;4>J;++J)if((w=A(r.M,-1,r.V[J],D))>=2){p=w;do{for(;f+w>h;)r.N[h+=1].Un=268435455;u=L+(wr(r.K,w-2,F)+ir(r,J,U,F)),(T=r.N[f+w]).Un>u&&(T.Un=u,T.Jn=f,T.Kn=J,T.Ln=0)}while((w-=1)>=2);if(w=p,J||(R=w+1),S>w&&(M=A(r.M,w,r.V[J],Math.min(S-1-w,r.h)))>=2){for(V=7>U?8:11,G=n+w&r.S,o=L+(wr(r.K,w-2,F)+ir(r,J,U,F))+Ar[r.j[(V<<4)+G]>>>2]+gr(pr(r.L,n+w,z(r.M,w-1-1)),1,z(r.M,w-1-(r.V[J]+1)),z(r.M,w-1)),V=Q(V),y=o+Ar[2048-r.j[(V<<4)+(G=n+w+1&r.S)]>>>2]+Ar[2048-r.T[V]>>>2],$=w+1+M;f+$>h;)r.N[h+=1].Un=268435455;u=y+(wr(r.K,M-2,G)+ir(r,0,V,G)),(T=r.N[f+$]).Un>u&&(T.Un=u,T.Jn=f+w+1,T.Kn=0,T.Ln=1,T.On=1,T.Pn=f,T.Qn=J)}}if(x>D){for(x=D,I=0;x>r.O[I];I+=2);r.O[I]=x,I+=2}if(x>=R){for(k=b+Ar[r.T[U]>>>2];f+x>h;)r.N[h+=1].Un=268435455;for(N=0;R>r.O[N];)N+=2;for(w=R;;w+=1)if(u=k+ur(r,i=r.O[N+1],w,F),(T=r.N[f+w]).Un>u&&(T.Un=u,T.Jn=f,T.Kn=i+4,T.Ln=0),w==r.O[N]){if(S>w&&(M=A(r.M,w,i,Math.min(S-1-w,r.h)))>=2){for(o=u+Ar[r.j[((V=7>U?7:10)<<4)+(G=n+w&r.S)]>>>2]+gr(pr(r.L,n+w,z(r.M,w-1-1)),1,z(r.M,w-(i+1)-1),z(r.M,w-1)),V=Q(V),y=o+Ar[2048-r.j[(V<<4)+(G=n+w+1&r.S)]>>>2]+Ar[2048-r.T[V]>>>2],$=w+1+M;f+$>h;)r.N[h+=1].Un=268435455;u=y+(wr(r.K,M-2,G)+ir(r,0,V,G)),(T=r.N[f+$]).Un>u&&(T.Un=u,T.Jn=f+w+1,T.Kn=0,T.Ln=1,T.On=1,T.Pn=f,T.Qn=i+4)}if((N+=2)==I)break}}}}}function ur(r,n,f,t){var o=P(f);return(128>n?r.R[128*o+n]:r.P[(o<<6)+function(r){if(131072>r)return _[r>>6]+12;if(134217728>r)return _[r>>16]+32;return _[r>>26]+52}(n)]+r.U[15&n])+wr(r.J,f-2,t)}function ir(r,n,f,t){var o;return n?(o=Ar[2048-r.q[f]>>>2],1==n?o+=Ar[r.A[f]>>>2]:(o+=Ar[2048-r.A[f]>>>2],o+=Hr(r.B[f],n-2))):(o=Ar[r.q[f]>>>2],o+=Ar[2048-r.C[(f<<4)+t]>>>2]),o}function er(r,n){n>0&&(!function(r,n){var f,t,o,u,i,e,c,a,v,l,h,s,d,w,M;do{if(r.un<r.on+r.Dr){if(r.sr>(l=r.un-r.on)){H(r);continue}}else l=r.Dr;for(h=r.on>r.Sr?r.on-r.Sr:0,t=r.Sn+r.on,r.lr?(r.jr[1023&(M=G[255&r.Er[t]]^255&r.Er[t+1])]=r.on,r.jr[1024+(65535&(M^=(255&r.Er[t+2])<<8))]=r.on,e=(M^G[255&r.Er[t+3]]<<5)&r.Nr):e=255&r.Er[t]^(255&r.Er[t+1])<<8,o=r.jr[r.dr+e],r.jr[r.dr+e]=r.on,d=1+(r.$n<<1),w=r.$n<<1,a=v=r.hr,f=r.br;;){if(h>=o||0==f){f-=1,r.Ir[d]=r.Ir[w]=0;break}if(u=((i=r.on-o)>r.$n?r.$n-i+r.Sr:r.$n-i)<<1,r.Er[(s=r.Sn+o)+(c=v>a?a:v)]==r.Er[t+c]){for(;(c+=1)!=l&&r.Er[s+c]==r.Er[t+c];);if(c==l){r.Ir[w]=r.Ir[u],r.Ir[d]=r.Ir[u+1];break}}(255&r.Er[t+c])>(255&r.Er[s+c])?(r.Ir[w]=o,o=r.Ir[w=u+1],v=c):(r.Ir[d]=o,o=r.Ir[d=u],a=c)}H(r)}while(0!=(n-=1))}(r.M,n),r.Or+=n)}function cr(r){var n=0;return r.nr=function(r,n){var f,t,o,u,i,e,c,a,v,l,h,s,d,w,M,p,m,b,x,g,E;if(r.un<r.on+r.Dr){if(r.sr>(w=r.un-r.on))return H(r),0}else w=r.Dr;for(m=0,M=r.on>r.Sr?r.on-r.Sr:0,t=r.Sn+r.on,p=1,a=0,v=0,r.lr?(a=1023&(E=G[255&r.Er[t]]^255&r.Er[t+1]),v=65535&(E^=(255&r.Er[t+2])<<8),l=(E^G[255&r.Er[t+3]]<<5)&r.Nr):l=255&r.Er[t]^(255&r.Er[t+1])<<8,o=r.jr[r.dr+l]||0,r.lr&&(u=r.jr[a]||0,i=r.jr[1024+v]||0,r.jr[a]=r.on,r.jr[1024+v]=r.on,u>M&&r.Er[r.Sn+u]==r.Er[t]&&(n[m++]=p=2,n[m++]=r.on-u-1),i>M&&r.Er[r.Sn+i]==r.Er[t]&&(i==u&&(m-=2),n[m++]=p=3,n[m++]=r.on-i-1,u=i),0!=m&&u==o&&(m-=2,p=1)),r.jr[r.dr+l]=r.on,x=1+(r.$n<<1),g=r.$n<<1,s=d=r.hr,0!=r.hr&&o>M&&r.Er[r.Sn+o+r.hr]!=r.Er[t+r.hr]&&(n[m++]=p=r.hr,n[m++]=r.on-o-1),f=r.br;;){if(M>=o||0==f){f-=1,r.Ir[x]=r.Ir[g]=0;break}if(e=((c=r.on-o)>r.$n?r.$n-c+r.Sr:r.$n-c)<<1,r.Er[(b=r.Sn+o)+(h=d>s?s:d)]==r.Er[t+h]){for(;(h+=1)!=w&&r.Er[b+h]==r.Er[t+h];);if(h>p&&(n[m++]=p=h,n[m++]=c-1,h==w)){r.Ir[g]=r.Ir[e],r.Ir[x]=r.Ir[e+1];break}}(255&r.Er[t+h])>(255&r.Er[b+h])?(r.Ir[g]=o,o=r.Ir[g=e+1],d=h):(r.Ir[x]=o,o=r.Ir[x=e],s=h)}return H(r),m}(r.M,r.O),r.nr>0&&(n=r.O[r.nr-2])==r.h&&(n+=A(r.M,n-1,r.O[r.nr-1],273-n)),r.Or+=1,n}function ar(r){r.M&&r.cr&&(r.M.pn=null,r.cr=0)}function vr(r){return 2048>r?_[r]:2097152>r?_[r>>10]+20:_[r>>20]+40}function lr(r,n){zr(r.Zn);for(var f=0;n>f;++f)zr(r._n[f].Hr),zr(r.rf[f].Hr);zr(r.nf.Hr)}function hr(r,n,f,t,o){var u,i,e,c,a;for(u=Ar[r.Zn[0]>>>2],e=(i=Ar[2048-r.Zn[0]>>>2])+Ar[r.Zn[1]>>>2],c=i+Ar[2048-r.Zn[1]>>>2],a=0,a=0;8>a;++a){if(a>=f)return;t[o+a]=u+Ir(r._n[n],a)}for(;16>a;++a){if(a>=f)return;t[o+a]=e+Ir(r.rf[n],a-8)}for(;f>a;++a)t[o+a]=c+Ir(r.nf,a-8-8)}function sr(r,n,f,t){!function(r,n,f,t){8>f?(Br(n,r.Zn,0,0),Sr(r._n[t],n,f)):(f-=8,Br(n,r.Zn,0,1),8>f?(Br(n,r.Zn,1,0),Sr(r.rf[t],n,f)):(Br(n,r.Zn,1,1),Sr(r.nf,n,f-8)))}(r,n,f,t),0==(r.ff[t]-=1)&&(hr(r,t,r.Pr,r.tf,272*t),r.ff[t]=r.Pr)}function dr(r){return function(r){r.Zn=a(2),r._n=a(16),r.rf=a(16),r.nf=Dr({},8);for(var n=0;16>n;++n)r._n[n]=Dr({},3),r.rf[n]=Dr({},3)}(r),r.tf=[],r.ff=[],r}function wr(r,n,f){return r.tf[272*f+n]}function Mr(r,n){for(var f=0;n>f;++f)hr(r,f,r.Pr,r.tf,272*f),r.ff[f]=r.Pr}function pr(r,n,f){return r.wr[((n&r.mr)<<r.Mr)+((255&f)>>>8-r.Mr)]}function mr(r,n,f){var t,o,u=1;for(o=7;o>=0;--o)Br(n,r.Gr,u,t=f>>o&1),u=u<<1|t}function br(r,n,f,t){var o,u,i,e,c=1,a=1;for(u=7;u>=0;--u)o=t>>u&1,e=a,c&&(e+=1+(i=f>>u&1)<<8,c=i==o),Br(n,r.Gr,e,o),a=a<<1|o}function xr(r){return r.Gr=a(768),r}function gr(r,n,f,t){var o,u,i=1,e=7,c=0;if(n)for(;e>=0;--e)if(c+=Hr(r.Gr[(1+(u=f>>e&1)<<8)+i],o=t>>e&1),i=i<<1|o,u!=o){--e;break}for(;e>=0;--e)c+=Hr(r.Gr[i],o=t>>e&1),i=i<<1|o;return c}function Er(r){r.Kn=-1,r.Ln=0}function yr(r,n){return r.jn=n,r.Hr=a(1<<n),r}function kr(r,n){var f,t=1;for(f=r.jn;0!=f;f-=1)t=(t<<1)+qr(n,r.Hr,t);return t-(1<<r.jn)}function Dr(r,n){return r.jn=n,r.Hr=a(1<<n),r}function Sr(r,n,f){var t,o,u=1;for(o=r.jn;0!=o;)Br(n,r.Hr,u,t=f>>>(o-=1)&1),u=u<<1|t}function Ir(r,n){var f,t,o=1,u=0;for(t=r.jn;0!=t;)u+=Hr(r.Hr[o],f=n>>>(t-=1)&1),o=(o<<1)+f;return u}function Nr(r,n,f){var t,o,u=1;for(o=0;r.jn>o;++o)Br(n,r.Hr,u,t=1&f),u=u<<1|t,f>>=1}function $r(r,n){var f,t,o=1,u=0;for(t=r.jn;0!=t;t-=1)f=1&n,n>>>=1,u+=Hr(r.Hr[o],f),o=o<<1|f;return u}function jr(r,n,f,t,o){var u,i,e=1;for(i=0;t>i;++i)Br(f,r,n+e,u=1&o),e=e<<1|u,o>>=1}function Tr(r,n,f,t){var o,u,i=1,e=0;for(u=f;0!=u;u-=1)o=1&t,t>>>=1,e+=Ar[(2047&(r[n+i]-o^-o))>>>2],i=i<<1|o;return e}function qr(r,n,f){var t,o=n[f];return(-2147483648^(t=(r.Range>>>11)*o))>(-2147483648^r.bn)?(r.Range=t,n[f]=o+(2048-o>>>5)<<16>>16,-16777216&r.Range||(r.bn=r.bn<<8|E(r.Tr),r.Range<<=8),0):(r.Range-=t,r.bn-=t,n[f]=o-(o>>>5)<<16>>16,-16777216&r.Range||(r.bn=r.bn<<8|E(r.Tr),r.Range<<=8),1)}function zr(r){for(var n=r.length-1;n>=0;--n)r[n]=1024}var Ar=function(){var r,n,f,t,o=[];for(n=8;n>=0;--n)for(t=1,r=1,r<<=9-n,f=t<<=9-n-1;r>f;++f)o[f]=(n<<6)+(r-f<<6>>>9-n-1);return o}();function Br(r,n,f,t){var o,u=n[f];o=(r.Range>>>11)*u,t?(r.Br=v(r.Br,l(w(o),[4294967295,0])),r.Range-=o,n[f]=u-(u>>>5)<<16>>16):(r.Range=o,n[f]=u+(2048-u>>>5)<<16>>16),-16777216&r.Range||(r.Range<<=8,Gr(r))}function Cr(r,n,f){for(var t=f-1;t>=0;t-=1)r.Range>>>=1,1==(n>>>t&1)&&(r.Br=v(r.Br,w(r.Range))),-16777216&r.Range||(r.Range<<=8,Gr(r))}function Fr(r){return v(v(w(r.Cr),r.Ar),[4,0])}function Gr(r){var n,f,t,o,u=M((t=32,o=b(f=r.Br,t&=63),0>f[1]&&(o=v(o,m([2,0],63-t))),o));if(0!=u||0>h(r.Br,[4278190080,0])){r.Ar=v(r.Ar,w(r.Cr)),n=r.Fr;do{S(r.Tr,n+u),n=255}while(0!=(r.Cr-=1));r.Fr=M(r.Br)>>>24}r.Cr+=1,r.Br=m(l(r.Br,[16777215,0]),8)}function Hr(r,n){return Ar[(2047&(r-n^-n))>>>2]}function Jr(r){for(var n,f,t,o=0,u=0,i=r.length,e=[],c=[];i>o;++o,++u){if(128&(n=255&r[o]))if(192==(224&n)){if(o+1>=i)return r;if(128!=(192&(f=255&r[++o])))return r;c[u]=(31&n)<<6|63&f}else{if(224!=(240&n))return r;if(o+2>=i)return r;if(128!=(192&(f=255&r[++o])))return r;if(128!=(192&(t=255&r[++o])))return r;c[u]=(15&n)<<12|(63&f)<<6|63&t}else{if(!n)return r;c[u]=n}16383==u&&(e.push(String.fromCharCode.apply(String,c)),u=-1)}return u>0&&(c.length=u,e.push(String.fromCharCode.apply(String,c))),e.join("")}function Kr(r){var n,f,t,o=[],u=0,i=r.length;if("object"==typeof r)return r;for(function(r,n,f,t,o){var u;for(u=n;f>u;++u)t[o++]=r.charCodeAt(u)}(r,0,i,o,0),t=0;i>t;++t)1>(n=o[t])||n>127?u+=n&&(128>n||n>2047)?3:2:++u;for(f=[],u=0,t=0;i>t;++t)1>(n=o[t])||n>127?n&&(128>n||n>2047)?(f[u++]=(224|n>>12&15)<<24>>24,f[u++]=(128|n>>6&63)<<24>>24,f[u++]=(128|63&n)<<24>>24):(f[u++]=(192|n>>6&31)<<24>>24,f[u++]=(128|63&n)<<24>>24):f[u++]=n<<24>>24;return f}function Lr(r){return r[1]+r[0]}function compress(r,n,f,o){var u,i,e={},a=void 0===f&&void 0===o;if("function"!=typeof f&&(i=f,f=o=0),o=o||function(r){if(void 0!==i)return c(r,i)},f=f||function(r,n){if(void 0!==i)return postMessage({action:1,cbn:i,result:r,error:n})},a){for(e.c=j({},Kr(r),Pr(n));U(e.c.er););return D(e.c.Wr)}try{e.c=j({},Kr(r),Pr(n)),o(0)}catch(r){return f(null,r)}t((function r(){try{for(var n,i=(new Date).getTime();U(e.c.er);)if(u=Lr(e.c.er.Tn)/Lr(e.c.u),(new Date).getTime()-i>200)return o(u),t(r,0),0;o(1),n=D(e.c.Wr),t(f.bind(null,n),0)}catch(r){f(null,r)}}),0)}function decompress(r,n,f){var o,u,i,e,a={},v=void 0===n&&void 0===f;if("function"!=typeof n&&(u=n,n=f=0),f=f||function(r){if(void 0!==u)return c(i?r:-1,u)},n=n||function(r,n){if(void 0!==u)return postMessage({action:2,cbn:u,result:r,error:n})},v){for(a.d=q({},r);R(a.d.er););return Jr(D(a.d.Wr))}try{a.d=q({},r),e=Lr(a.d.u),i=e>-1,f(0)}catch(r){return n(null,r)}t((function r(){try{for(var u,c=0,v=(new Date).getTime();R(a.d.er);)if(++c%1e3==0&&(new Date).getTime()-v>200)return i&&(o=Lr(a.d.er.Ur.Qr)/e,f(o)),t(r,0),0;f(1),u=Jr(D(a.d.Wr)),t(n.bind(null,u),0)}catch(r){n(null,r)}}),0)}var Or,Pr=(Or=[{l:16,f:64,m:0},{l:20,f:64,m:0},{l:19,f:64,m:1},{l:20,f:64,m:1},{l:21,f:128,m:1},{l:22,f:128,m:1},{l:23,f:128,m:1},{l:24,f:255,m:1},{l:25,f:255,m:1}],function(r){return Or[r-1]||Or[6]}),LZMA=function(){};export{LZMA,r as action_compress,n as action_decompress,f as action_progress,compress,decompress};
