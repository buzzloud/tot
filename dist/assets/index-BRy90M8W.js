(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function n(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(r){if(r.ep)return;r.ep=!0;const i=n(r);fetch(r.href,i)}})();const u={keywordGroups:[],currentAnalysis:null,proxySettings:{mode:"auto",customTemplate:"",timeoutMs:15e3,renderJs:!1},editingGroupId:null,rankingsHistory:[],archivedRankingsHistory:[]},ut="keyword-gap-groups";function Nt(){try{const t=localStorage.getItem(ut);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e:[]}catch{return[]}}function pt(t){localStorage.setItem(ut,JSON.stringify(t))}const mt="keyword-gap-proxy-settings",D={mode:"auto",customTemplate:"",timeoutMs:15e3,renderJs:!1};function It(){try{const t=localStorage.getItem(mt);if(!t)return{...D};const e=JSON.parse(t);return{...D,...e}}catch{return{...D}}}function Bt(t){localStorage.setItem(mt,JSON.stringify(t))}const Dt={mode:"auto",customTemplate:"",timeoutMs:15e3,renderJs:!1},Ot=[{name:"AllOrigins",url:"https://api.allorigins.win/raw?url={url}"},{name:"CorsProxyIO",url:"https://corsproxy.io/?{url}"}],_t=[/enable javascript/i,/access denied/i,/verify you are/i,/captcha/i,/attention required/i,/unusual traffic/i,/bot detection/i,/request blocked/i,/service unavailable/i,/checking your browser/i,/cf-browser-verification/i,/cf-error-details/i,/keyword presence & competitor gap analyzer/i,/app not initialized/i,/keyword groups/i,/npm run dev/i];function Gt(t){return t.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<noscript[\s\S]*?<\/noscript>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}function qt(t){return t?t.split(/\s+/).filter(e=>e.length>0).length:0}function Wt(t){const e=t.trim();if(e.length<1200)return!0;const n=Gt(e),o=qt(n);return _t.some(i=>i.test(e))&&o<200}function K(t,e){const n=encodeURIComponent(e);let o=t;return o.includes("{url_raw}")&&(o=o.split("{url_raw}").join(e)),o.includes("{url}")&&(o=o.split("{url}").join(n)),o===t&&(o=`${t}${n}`),o}function Ft(t,e){const n=[],o="http://localhost:8787/proxy?url=";return e.renderJs&&e.mode!=="custom"&&n.push({name:"LocalProxy Rendered (localhost:8787)",url:K(o,t)+"&render=1"}),e.mode==="auto"&&n.push({name:"Direct",url:t}),e.customTemplate&&n.push({name:"Custom",url:K(e.customTemplate,t)}),e.mode!=="custom"&&n.push({name:"LocalProxy (localhost:8787)",url:K(o,t)}),e.mode==="auto"&&Ot.forEach(r=>{n.push({name:r.name,url:K(r.url,t)})}),n.length===0&&n.push({name:"Direct",url:t}),n}async function jt(t,e){const n=new AbortController,o=window.setTimeout(()=>n.abort(),e);try{return await fetch(t,{method:"GET",cache:"no-store",headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"},signal:n.signal})}finally{window.clearTimeout(o)}}async function Yt(t,e=Dt){const n=Ft(t,e),o=[];for(const r of n)try{const i=await jt(r.url,e.timeoutMs);if(i.type==="opaque")throw new Error("Opaque response (CORS blocked)");const a=await i.text();if(!i.ok){const s=a&&a.length<300?a:`HTTP ${i.status}`;throw new Error(s)}if(!a)throw new Error("Empty response");if(Wt(a))throw new Error(`Blocked or empty content detected (length ${a.length})`);return a}catch(i){const a=i instanceof Error?i.message:"Unknown error";o.push(`${r.name}: ${a}`)}throw new Error(`All fetch attempts failed. ${o.join(" | ")}`)}const zt=["script","style","noscript","iframe","nav","header","footer","aside","[role='navigation']","[role='banner']","[role='contentinfo']",".navigation",".nav",".menu","#navigation","#nav","#menu"],Qt="main, article, [role='main']",Jt=".main-content, #main-content, .content, .entry-content, .post-content, .page-content, .entry, .post",Vt="section, div",N=120;function P(t){return t.replace(/\s+/g," ").trim()}function gt(t){return t?t.split(/\s+/).filter(e=>e.length>0).length:0}function T(t){const e=P(t.textContent||"");return{text:e,wordCount:gt(e)}}function O(t,e){return Array.from(t.querySelectorAll(e)).map(o=>P(o.textContent||"")).filter(o=>o.length>0).join(" ")}function Xt(t,e=100){if(!t)return"";const n=document.createTreeWalker(t,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let o=!1,r=!1;const i=[];for(;n.nextNode();){const a=n.currentNode;if(a.nodeType===Node.ELEMENT_NODE){a.tagName.toLowerCase()==="h1"&&!r&&(r=!0,o=!0);continue}if(o&&a.nodeType===Node.TEXT_NODE){const s=a.parentElement||null;if(s&&s.tagName.toLowerCase()==="h1")continue;const l=P(a.nodeValue||"");if(!l)continue;const d=l.split(" ");for(const m of d)if(m.length!==0&&(i.push(m),i.length>=e))return i.join(" ")}}return i.join(" ")}function Zt(t){if(!t)return{altTexts:[],total:0,withAlt:0,missingAlt:0};const e=Array.from(t.querySelectorAll("img")),n=[];let o=0;e.forEach(i=>{const a=P(i.getAttribute("alt")||"");a.length>0&&(o+=1,n.push(a))});const r=e.length;return{altTexts:n,total:r,withAlt:o,missingAlt:Math.max(0,r-o)}}function nt(t){const e=a=>{let s=null,l=0;return a.forEach(d=>{const{wordCount:m}=T(d);m>l&&(s=d,l=m)}),s},n=e(Array.from(t.querySelectorAll(Qt))),o=e(Array.from(t.querySelectorAll(Jt))),r=e(Array.from(t.querySelectorAll(Vt)));let i=n;return(!i||T(i).wordCount<N)&&(i=o||i),(!i||T(i).wordCount<N)&&(i=r||i),(!i||T(i).wordCount<N)&&(i=t.body),i}function ot(t,e,n){const o=t?O(t,"h1"):"",r=t?O(t,"h2"):"",i=t?O(t,"h3"):"",a=Xt(t,100),s=Zt(t);let l="";if(t){const y=t.cloneNode(!0);y.querySelectorAll("h1, h2, h3").forEach(w=>w.remove()),l=P(y.textContent||"")}const d=t?P(t.textContent||""):"",m=gt(d),g=d.slice(0,280);return{title:e,metaDescription:n,h1:o,h2:r,h3:i,body:l,first100AfterH1:a,imageAltTexts:s.altTexts,totalImages:s.total,imagesWithAlt:s.withAlt,imagesMissingAlt:s.missingAlt,wordCount:m,source:"pruned",previewText:g}}function te(t){var y,w;const e=new DOMParser,n=e.parseFromString(t,"text/html"),o=e.parseFromString(t,"text/html");if(!n||!n.body||!o||!o.body)return{title:"",metaDescription:"",h1:"",h2:"",h3:"",body:"",first100AfterH1:"",imageAltTexts:[],totalImages:0,imagesWithAlt:0,imagesMissingAlt:0,wordCount:0,source:"pruned",previewText:""};zt.forEach(C=>{o.querySelectorAll(C).forEach(h=>h.remove())});const r=P(((y=n.querySelector("title"))==null?void 0:y.textContent)||""),i=P(((w=n.querySelector("meta[name='description']"))==null?void 0:w.getAttribute("content"))||""),a=nt(o),s=nt(n),l=ot(a,r,i),d=ot(s,r,i),m=d.wordCount>0?l.wordCount/d.wordCount:1;return l.wordCount<N&&d.wordCount>l.wordCount||m<.5?{...d,source:"full"}:{...l,source:"pruned"}}const ee={normalizePunctuation:!0},ne=/\u00a0/g,oe=/\u00ad/g,re=/[\u2018\u2019\u201c\u201d]/g,ie=/[\u2012\u2013\u2014\u2015-]/g,ae=/[\/\\]/g;function E(t,e=ee){let n=t||"";try{n=n.normalize("NFKC")}catch{}return n=n.replace(ne," "),n=n.replace(oe,""),e.normalizePunctuation&&(n=n.replace(re,"'"),n=n.replace(ie," "),n=n.replace(ae," ")),n=n.toLowerCase(),n=n.replace(/\s+/g," ").trim(),n}const se=["title","meta","h1","h2","h3","body"];function le(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function ce(t){const e=t.split(" ").filter(Boolean);if(e.length===0)return"";const n=e.map(le);return`\\b${e.length>1?n.join("\\s+"):n[0]}\\b`}function $(t,e){if(!t||!e)return 0;const n=new RegExp(t,"g"),o=e.match(n);return o?o.length:0}function de(t){return t.map(e=>({keyword:e,found:!1,occurrencesTotal:0,occurrencesByBucket:{title:0,meta:0,h1:0,h2:0,h3:0,body:0},bucketsFound:[]}))}function ue(t,e){const n={title:E(e.title),meta:E(e.metaDescription),h1:E(e.h1),h2:E(e.h2),h3:E(e.h3),body:E(e.body)};return t.map(o=>{const r=E(o),i=ce(r),a={title:$(i,n.title),meta:$(i,n.meta),h1:$(i,n.h1),h2:$(i,n.h2),h3:$(i,n.h3),body:$(i,n.body)},s=a.title+a.meta+a.h1+a.h2+a.h3+a.body,l=se.filter(d=>a[d]>0);return{keyword:o,found:s>0,occurrencesTotal:s,occurrencesByBucket:a,bucketsFound:l}})}const pe=["Your Questions Answered by us","Commonly Asked Questions","Frequently Asked Questions","FAQs","Common Questions","Common Questions Answered","Questions & Answers","Your Questions Answered","Popular Questions","Top Questions","Most Asked Questions","Questions Homeowners Ask","Questions We’re Often Asked","What Customers Ask Us","What People Ask Us","What You Need to Know","Questions You Might Have","Got Questions?","Answers to Your Questions","Before You Decide","What to Expect","Helpful Answers Before You Buy","Key Things to Know","Important Information","Things to Consider","What You Should Know","Clear Answers to Common Questions","Explained: Common Questions","Your Questions, Explained","Simple Answers to Common Questions","Everything You Need to Know","Quick Answers","learn more about"];function me(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function ge(t){const e=E(t);if(!e)return null;const n=e.split(" ").filter(Boolean).map(me);if(n.length===0)return null;const o=n.length>1?n.join("\\s+"):n[0];return new RegExp(`\\b${o}\\b`,"g")}function he(t){const e=E(`${t.h2} ${t.h3} ${t.body}`),n=[];return pe.forEach(o=>{const r=ge(o);r&&r.test(e)&&n.push(o)}),{present:n.length>0,matches:n}}const ye=["Customer Reviews","Customer Testimonials","Reviews","Testimonials","What Our Customers Say","What Customers Say","Real Customer Reviews","Verified Reviews","Independent Reviews","Trustpilot","Trustpilot Reviews","Rated on Trustpilot","TrustScore","Rated X out of 5","Based on X reviews","Read our Trustpilot reviews","Google Reviews","Google Customer Reviews","Rated on Google","Google rating","Reviews on Google","Read our Google reviews","Customer Rating","Star Rating","Overall Rating","Average Rating","Review Score","Rated Excellent","Highly Rated","Trusted by Customers","Trusted by Thousands","Why Customers Choose Us","Why Homeowners Trust Us","Customer Feedback","Feedback & Reviews","Reviews & Ratings"];function fe(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function be(t){const e=E(t);if(!e)return null;const n=e.split(" ").filter(Boolean).map(fe);if(n.length===0)return null;const o=n.length>1?n.join("\\s+"):n[0];return new RegExp(`\\b${o}\\b`,"g")}function Ee(t){const e=E(`${t.h2} ${t.h3} ${t.body}`),n=[];return ye.forEach(o=>{const r=be(o);r&&r.test(e)&&n.push(o)}),{present:n.length>0,matches:n}}function we(t){const e=t.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi);return e?e.some(n=>/"@context"\s*:|"@type"\s*:/i.test(n)):!1}function ve(t){const e=/itemscope\b/i.test(t),n=/itemtype\s*=\s*["']https?:\/\/schema\.org\//i.test(t)||/itemtype\s*=/i.test(t),o=/itemprop\s*=/i.test(t);return e&&(n||o)}function Ce(t){const e=/vocab\s*=\s*["']https?:\/\/schema\.org/i.test(t),n=/typeof\s*=/i.test(t),o=/property\s*=/i.test(t);return e||n&&o}function Ae(t){const e=[];return we(t)&&e.push("JSON-LD"),ve(t)&&e.push("Microdata"),Ce(t)&&e.push("RDFa"),{present:e.length>0,matches:e}}function Pe(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Se(t){const e=t.split(" ").filter(Boolean);if(e.length===0)return"";const n=e.map(Pe);return`\\b${e.length>1?n.join("\\s+"):n[0]}\\b`}function $e(t,e){const n=E(t);if(!n)return{present:!1,matches:[]};const o=[];return e.forEach(r=>{const i=E(r),a=Se(i);if(!a)return;new RegExp(a,"g").test(n)&&o.push(r)}),{present:o.length>0,matches:o}}function Ue(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function ke(t){const e=t.split(" ").filter(Boolean);if(e.length===0)return"";const n=e.map(Ue);return`\\b${e.length>1?n.join("\\s+"):n[0]}\\b`}function Le(t,e,n,o){const r=Array.from(new Set(t.map(s=>s.trim()).filter(Boolean))),i=[],a=E(r.join(" "));return e.forEach(s=>{const l=E(s),d=ke(l);if(!d||!a)return;new RegExp(d,"g").test(a)&&i.push(s)}),{fulfilled:n===0?!0:o===0,phrases:r,keywordMatches:i}}const Ke=["script","style","noscript","iframe","nav","header","footer","aside","[role='navigation']","[role='banner']","[role='contentinfo']",".navigation",".nav",".menu","#navigation","#nav","#menu"],Te="main, article, [role='main']",Re=".main-content, #main-content, .content, .entry-content, .post-content, .page-content, .entry, .post",xe="section, div",_=120;function ht(t){return t.replace(/\s+/g," ").trim()}function Me(t){return t?t.split(/\s+/).filter(e=>e.length>0).length:0}function R(t){return{wordCount:Me(ht(t.textContent||""))}}function He(t){const e=a=>{let s=null,l=0;return a.forEach(d=>{const{wordCount:m}=R(d);m>l&&(s=d,l=m)}),s},n=e(Array.from(t.querySelectorAll(Te))),o=e(Array.from(t.querySelectorAll(Re))),r=e(Array.from(t.querySelectorAll(xe)));let i=n;return(!i||R(i).wordCount<_)&&(i=o||i),(!i||R(i).wordCount<_)&&(i=r||i),(!i||R(i).wordCount<_)&&(i=t.body),i}function v(t,e,n,o,r){return{key:t,label:e,status:n,summary:o,details:r}}function Ne(t){const n=(t?Array.from(t.querySelectorAll("h1, h2, h3, h4, h5, h6")):[]).map(d=>Number(d.tagName.toLowerCase().slice(1))),o=[1,2,3,4,5,6].reduce((d,m)=>(d[m]=n.filter(g=>g===m).length,d),{});let r=0;for(let d=1;d<n.length;d+=1)n[d]-n[d-1]>1&&(r+=1);const i=[];o[1]===0&&i.push("missing H1"),o[1]>1&&i.push("multiple H1"),r>0&&i.push(`hierarchy jumps=${r}`);const a=i.length>0?"fail":"pass",s=`H1=${o[1]}, H2=${o[2]}, H3=${o[3]}, H4=${o[4]}, H5=${o[5]}, H6=${o[6]}, jumps=${r}`,l=i.length>0?`Issues: ${i.join("; ")}`:"Heading order is valid for H1-H6.";return v("header-hierarchy","Header hierarchy (H1-H6)",a,s,l)}function Ie(t,e){const n=Array.from(t.querySelectorAll("link[rel]")).filter(r=>(r.getAttribute("rel")||"").toLowerCase().split(/\s+/).includes("canonical"));if(n.length===0)return v("canonical","Canonical tag","fail","canonical count=0","No canonical link tag found.");if(n.length>1)return v("canonical","Canonical tag","fail",`canonical count=${n.length}`,"Multiple canonical link tags found.");const o=(n[0].getAttribute("href")||"").trim();if(!o)return v("canonical","Canonical tag","fail","canonical href is empty","Canonical href is empty.");try{const r=new URL(o,e);return["http:","https:"].includes(r.protocol)?v("canonical","Canonical tag","pass","canonical count=1",`Resolved canonical: ${r.toString()}`):v("canonical","Canonical tag","fail","canonical protocol invalid",`Canonical protocol is not http/https: ${r.protocol}`)}catch{return v("canonical","Canonical tag","fail","canonical URL invalid","Canonical href cannot be resolved as a valid URL.")}}function Be(t){const e=t?Array.from(t.querySelectorAll("a[href]")):[],n=e.reduce((a,s)=>{const l=(s.getAttribute("href")||"").trim();return l===""||l==="#"?a+1:a},0),o=n>0?"fail":"pass",r=`Broken ${n} of ${e.length} anchors`,i=n>0?"Found anchors with empty href or # only.":"No empty or # only anchors found.";return v("broken-anchors","Broken anchor links",o,r,i)}function De(t){const e=t.querySelectorAll("title").length,n=Array.from(t.querySelectorAll("meta[name]")).filter(i=>(i.getAttribute("name")||"").toLowerCase()==="description").length;let o="pass",r="Single title and meta description tags found.";return e>1||n>1?(o="fail",r="Duplicate title or meta description tags detected."):(e===0||n===0)&&(o="warn",r="Missing title or meta description tag."),v("meta-duplicates","Meta tag duplicates",o,`title=${e}, meta description=${n}`,r)}function Oe(t){const e=t?Array.from(t.querySelectorAll("img")):[],n=e.length;let o=0,r=0,i=0;e.forEach(l=>{if(!l.hasAttribute("alt")){i+=1;return}if(ht(l.getAttribute("alt")||"").length===0){o+=1;return}r+=1});let a="pass",s="All images have alt attributes.";return n===0?(a="warn",s="No images found in main content."):i>0&&(a="fail",s="Some images are missing alt attributes."),v("image-alt-classification","Decorative vs content images",a,`content=${r}, decorative=${o}, missing alt=${i}`,s)}function _e(t){const e=t?Array.from(t.querySelectorAll("img")):[],n=e.length,o=t?t.querySelectorAll("picture").length:0,r=e.reduce((l,d)=>(d.getAttribute("srcset")||"").trim()?l+1:l,0),i=t?Array.from(t.querySelectorAll("source[srcset]")).reduce((l,d)=>(d.getAttribute("srcset")||"").trim()?l+1:l,0):0;let a="pass",s="Responsive image signals detected.";return n===0?(a="warn",s="No images found in main content."):o===0&&r===0&&i===0&&(a="fail",s="No picture/srcset usage detected in main content."),v("responsive-images","Responsive image usage",a,`picture=${o}, img[srcset]=${r}, source[srcset]=${i}`,s)}function Ge(t){const e=t?Array.from(t.querySelectorAll("img")):[],n=e.length,o=e.reduce((s,l)=>{const d=(l.getAttribute("width")||"").trim(),m=(l.getAttribute("height")||"").trim();return d&&m?s+1:s},0),r=n-o;let i="pass",a="All images have width and height attributes.";return n===0?(i="warn",a="No images found in main content."):r>0&&(i="fail",a="Some images are missing width or height attributes."),v("image-dimensions","Image dimensions",i,`with dimensions=${o}/${n}, missing=${r}`,a)}function qe(t){const e=new DOMParser,n=e.parseFromString(t.html,"text/html"),o=e.parseFromString(t.html,"text/html");Ke.forEach(i=>{o.querySelectorAll(i).forEach(a=>a.remove())});const r=He(o);return[Ne(r),Ie(n,t.pageUrl),Be(r),De(n),Oe(r),_e(r),Ge(r)]}const We=["script","style","noscript","iframe","nav","header","footer","aside","[role='navigation']","[role='banner']","[role='contentinfo']",".navigation",".nav",".menu","#navigation","#nav","#menu"],Fe="main, article, [role='main']",je=".main-content, #main-content, .content, .entry-content, .post-content, .page-content, .entry, .post",Ye="section, div",G=120;function ze(t){return t.replace(/\s+/g," ").trim()}function Qe(t){return t?t.split(/\s+/).filter(e=>e.length>0).length:0}function x(t){return{wordCount:Qe(ze(t.textContent||""))}}function Je(t){const e=a=>{let s=null,l=0;return a.forEach(d=>{const{wordCount:m}=x(d);m>l&&(s=d,l=m)}),s},n=e(Array.from(t.querySelectorAll(Fe))),o=e(Array.from(t.querySelectorAll(je))),r=e(Array.from(t.querySelectorAll(Ye)));let i=n;return(!i||x(i).wordCount<G)&&(i=o||i),(!i||x(i).wordCount<G)&&(i=r||i),(!i||x(i).wordCount<G)&&(i=t.body),i}function Ve(t){const e=t.trim();if(!e.startsWith("#"))return"";const n=e.slice(1).trim();if(!n)return"";try{return decodeURIComponent(n)}catch{return n}}function Xe(t){var o;if(t.querySelector("th, thead, caption"))return!0;const e=t.rows.length,n=((o=t.rows[0])==null?void 0:o.cells.length)||0;return e>=2&&n>=2}function Ze(t){const e=new DOMParser,n=e.parseFromString(t,"text/html"),o=e.parseFromString(t,"text/html");We.forEach(h=>{o.querySelectorAll(h).forEach(A=>A.remove())});const i=Je(o)||o.body,a=i?Array.from(i.querySelectorAll("a[href]")):[],s=new Set;let l=0;a.forEach(h=>{const A=(h.getAttribute("href")||"").trim();if(A==="#"||!A.startsWith("#"))return;const k=Ve(A);k&&(l+=1,s.add(k))});let d=0;s.forEach(h=>{n.getElementById(h)&&(d+=1)});const m=l>=2&&d>=2,g=i?Array.from(i.querySelectorAll("table")):[],y=g.length,w=g.filter(h=>Xe(h)).length,C=w>0;return{tocPresent:m,tocJumpLinks:l,tocMatchedSections:d,tableUsagePresent:C,dataTableCount:w,totalTableCount:y}}const tn=["script","style","noscript","nav","header","footer","aside","[role='navigation']","[role='banner']","[role='contentinfo']",".navigation",".nav",".menu","#navigation","#nav","#menu"],en="main, article, [role='main']",nn=".main-content, #main-content, .content, .entry-content, .post-content, .page-content, .entry, .post",on="section, div",q=120;function rn(t){return t.replace(/\s+/g," ").trim()}function an(t){return t?t.split(/\s+/).filter(e=>e.length>0).length:0}function M(t){return{wordCount:an(rn(t.textContent||""))}}function sn(t){const e=a=>{let s=null,l=0;return a.forEach(d=>{const{wordCount:m}=M(d);m>l&&(s=d,l=m)}),s},n=e(Array.from(t.querySelectorAll(en))),o=e(Array.from(t.querySelectorAll(nn))),r=e(Array.from(t.querySelectorAll(on)));let i=n;return(!i||M(i).wordCount<q)&&(i=o||i),(!i||M(i).wordCount<q)&&(i=r||i),(!i||M(i).wordCount<q)&&(i=t.body),i}function ln(t){const e=t.toLowerCase();return e.includes("youtube.com/embed/")||e.includes("youtube-nocookie.com/embed/")||e.includes("youtu.be/")}function cn(t){const e=t.toLowerCase();return e.includes("player.vimeo.com/video/")||e.includes("vimeo.com/video/")}function dn(t){const n=new DOMParser().parseFromString(t,"text/html");tn.forEach(d=>{n.querySelectorAll(d).forEach(m=>m.remove())});const r=sn(n)||n.body,i=r?Array.from(r.querySelectorAll("iframe[src]")):[];let a=0,s=0;i.forEach(d=>{const m=(d.getAttribute("src")||"").trim();if(m){if(ln(m)){a+=1;return}cn(m)&&(s+=1)}});const l=a+s;return{videoEmbedsPresent:l>0,videoEmbedCount:l,youtubeEmbedCount:a,vimeoEmbedCount:s}}function z(){return typeof crypto<"u"&&typeof crypto.randomUUID=="function"?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`}function un(t){try{return new URL(t).hostname}catch{return t}}function rt(t){return un(t).replace(/^www\./i,"")}async function pn(t,e,n){try{const o=await Yt(t.url,n),r=te(o),i=ue(e,r),a=he(r),s=Ee(r),l=Ae(o),d=$e(r.first100AfterH1,e),m=Ze(o),g=Le(r.imageAltTexts,e,r.totalImages,r.imagesMissingAlt),y=dn(o),w=t.type==="my-site"?qe({html:o,pageUrl:t.url}):[],C=r.wordCount>0&&r.wordCount<120?`Low content count (${r.wordCount} words). The page may be blocked or JS-rendered.`:r.source==="full"?"Using full-page text fallback (includes header/navigation).":void 0;return{url:t.url,type:t.type,label:t.label,fetchStatus:"success",warningMessage:C,previewText:r.previewText,title:r.title,metaDescription:r.metaDescription,h1Text:r.h1,faqPresent:a.present,faqMatches:a.matches,reviewsPresent:s.present,reviewsMatches:s.matches,schemaPresent:l.present,schemaMatches:l.matches,first100AfterH1:r.first100AfterH1,first100Present:d.present,first100Matches:d.matches,tocPresent:m.tocPresent,tocJumpLinks:m.tocJumpLinks,tocMatchedSections:m.tocMatchedSections,tableUsagePresent:m.tableUsagePresent,dataTableCount:m.dataTableCount,totalTableCount:m.totalTableCount,imageAltTotal:r.totalImages,imageAltWithValue:r.imagesWithAlt,imageAltMissing:r.imagesMissingAlt,imageAltFulfilled:g.fulfilled,imageAltPhrases:g.phrases,imageAltKeywordMatches:g.keywordMatches,videoEmbedsPresent:y.videoEmbedsPresent,videoEmbedCount:y.videoEmbedCount,youtubeEmbedCount:y.youtubeEmbedCount,vimeoEmbedCount:y.vimeoEmbedCount,technicalChecks:w,wordCount:r.wordCount,matches:i}}catch(o){const r=o instanceof Error?o.message:"Unknown error";return{url:t.url,type:t.type,label:t.label,fetchStatus:"error",errorMessage:r,wordCount:0,title:"",metaDescription:"",h1Text:"",faqPresent:!1,faqMatches:[],reviewsPresent:!1,reviewsMatches:[],schemaPresent:!1,schemaMatches:[],first100AfterH1:"",first100Present:!1,first100Matches:[],tocPresent:!1,tocJumpLinks:0,tocMatchedSections:0,tableUsagePresent:!1,dataTableCount:0,totalTableCount:0,imageAltTotal:0,imageAltWithValue:0,imageAltMissing:0,imageAltFulfilled:!1,imageAltPhrases:[],imageAltKeywordMatches:[],videoEmbedsPresent:!1,videoEmbedCount:0,youtubeEmbedCount:0,vimeoEmbedCount:0,technicalChecks:[],matches:de(e)}}}async function mn(t){var r;const e=rt(t.myUrl),n=[{url:t.myUrl,type:"my-site",label:e?`Your Site (${e})`:"Your Site"},...t.competitorUrls.map((i,a)=>({url:i,type:"competitor",label:rt(i)||`Competitor ${a+1}`}))],o=[];for(let i=0;i<n.length;i+=1){const a=n[i];(r=t.onProgress)==null||r.call(t,`Analyzing ${a.label} (${i+1}/${n.length})`);const s=await pn(a,t.group.keywords,t.proxySettings);o.push(s)}return{id:z(),timestamp:new Date().toISOString(),groupName:t.group.name,keywords:t.group.keywords,myUrl:t.myUrl,competitorUrls:t.competitorUrls,results:o}}function gn(t){const e=t.results.find(o=>o.type==="my-site");if(!e)return[];const n=[];return t.keywords.forEach(o=>{const r=e.matches.find(a=>a.keyword===o);if(!r||r.found)return;const i=t.results.filter(a=>a.type==="competitor").map(a=>{const s=a.matches.find(l=>l.keyword===o);return!s||!s.found?null:{label:a.label,url:a.url,occurrences:s.occurrencesTotal,buckets:s.bucketsFound}}).filter(a=>a!==null);i.length>0&&n.push({keyword:o,competitors:i})}),n}function c(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function hn(t){const e=new Set,n=[];return t.forEach(o=>{e.has(o)||(e.add(o),n.push(o))}),n}function yn(t){const e=new Date(t.timestamp).toLocaleString(),n=t.results.map(o=>{const r=t.keywords.map(a=>{const s=o.matches.find(l=>l.keyword===a);return!s||o.type==="competitor"&&!s.found?"":`
            <tr>
              <td>${c(a)}</td>
              <td>${s.found?"Yes":"No"}</td>
              <td>${s.occurrencesTotal}</td>
              <td>${s.occurrencesByBucket.title}</td>
              <td>${s.occurrencesByBucket.meta}</td>
              <td>${s.occurrencesByBucket.h1}</td>
              <td>${s.occurrencesByBucket.h2}</td>
              <td>${s.occurrencesByBucket.h3}</td>
              <td>${s.occurrencesByBucket.body}</td>
            </tr>
          `}).join(""),i=r.trim().length>0?r:'<tr><td colspan="8">No matching keywords found.</td></tr>';return`
        <h2>${c(o.label)}</h2>
        <p><strong>URL:</strong> ${c(o.url)}</p>
        <table>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Found</th>
              <th>Total</th>
              <th>Title</th>
              <th>Meta</th>
              <th>H1</th>
              <th>H2</th>
              <th>H3</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
            ${i}
          </tbody>
        </table>
      `}).join("");return`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Keyword Analysis Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      h1, h2 { color: #1f6feb; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th, td { border: 1px solid #d8dde2; padding: 8px; text-align: left; }
      th { background: #f4f6fa; }
    </style>
  </head>
  <body>
    <h1>Keyword Analysis Report</h1>
    <p><strong>Date:</strong> ${c(e)}</p>
    <p><strong>Group:</strong> ${c(t.groupName)}</p>
    ${n}
  </body>
</html>
  `}function fn(t,e){const n=new Blob([t],{type:"text/html"}),o=URL.createObjectURL(n),r=document.createElement("a");r.href=o,r.download=e,r.click(),URL.revokeObjectURL(o)}function it(t){try{const e=new URL(t);return e.protocol==="http:"||e.protocol==="https:"}catch{return!1}}function p(t,e=document){const n=e.querySelector(t);if(!n)throw new Error(`Missing element: ${t}`);return n}function bn(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function En(t){const e=t.trim();if(!e)return null;const n=e.split(/\s+/).filter(Boolean).map(bn);if(n.length===0)return null;const r=`\\b${n.length>1?n.join("\\s+"):n[0]}\\b`;return new RegExp(r,"gi")}function W(t,e){if(!t)return"";const n=e.map(s=>En(s)).filter(s=>s!==null);if(n.length===0)return c(t);const o=[];if(n.forEach(s=>{s.lastIndex=0;let l=s.exec(t);for(;l;)o.push({start:l.index,end:l.index+l[0].length}),l=s.exec(t)}),o.length===0)return c(t);o.sort((s,l)=>s.start-l.start||s.end-l.end);const r=[];o.forEach(s=>{const l=r[r.length-1];if(!l||s.start>l.end){r.push({...s});return}l.end=Math.max(l.end,s.end)});let i="",a=0;return r.forEach(s=>{a<s.start&&(i+=c(t.slice(a,s.start))),i+=`<mark class="kw-hit">${c(t.slice(s.start,s.end))}</mark>`,a=s.end}),a<t.length&&(i+=c(t.slice(a))),i}function wn(t){return t.results.map(e=>{const n=e.matches.filter(i=>i.occurrencesByBucket.title>0).map(i=>i.keyword),o=e.matches.filter(i=>i.occurrencesByBucket.meta>0).map(i=>i.keyword),r=e.matches.filter(i=>i.occurrencesByBucket.h1>0).map(i=>i.keyword);return{label:e.label,url:e.url,titleHtml:W(e.title,n),metaHtml:W(e.metaDescription,o),h1Html:W(e.h1Text,r)}})}function vn(t){try{return new URL(t).toString()}catch{return t}}function S(t,e){return`
    <div class="page-cell">
      <div class="page-label">${c(t)}</div>
      <div class="page-path">${c(vn(e))}</div>
    </div>
  `}function Cn(t){const e=t.results.filter(r=>r.type==="competitor").map(r=>r.title.trim()).filter(r=>r.length>0).join(`
`),n=t.results.filter(r=>r.type==="competitor").map(r=>r.metaDescription.trim()).filter(r=>r.length>0).join(`
`),o=wn(t).map(r=>`
      <tr>
        <td>${S(r.label,r.url)}</td>
        <td>${r.titleHtml||"-"}</td>
        <td>${r.metaHtml||"-"}</td>
        <td>${r.h1Html||"-"}</td>
      </tr>
    `).join("");return`
    <div class="panel summary-panel">
      <div class="summary-header">
        <h3>Title / Meta / H1 Summary</h3>
        <div class="actions">
          <button class="btn secondary copy-summary" data-copy-type="title" data-copy-text="${encodeURIComponent(e)}">
            Copy competitor titles
          </button>
          <button class="btn secondary copy-summary" data-copy-type="meta" data-copy-text="${encodeURIComponent(n)}">
            Copy competitor meta
          </button>
        </div>
      </div>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Title</th>
            <th>Meta Description</th>
            <th>H1</th>
          </tr>
        </thead>
        <tbody>
          ${o}
        </tbody>
      </table>
    </div>
  `}function An(t){return`
    <div class="panel summary-panel">
      <h3>FAQ Presence</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>FAQ Present</th>
            <th>Matched Phrases</th>
          </tr>
        </thead>
        <tbody>
          ${t.results.map(n=>{const o=n.faqPresent?"Yes":"No",r=n.faqPresent?"pill ok":"pill no",i=n.faqMatches.length>0?c(n.faqMatches.join(", ")):"-";return`
        <tr>
          <td>${S(n.label,n.url)}</td>
          <td><span class="${r}">${o}</span></td>
          <td>${i}</td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    </div>
  `}function Pn(t){return`
    <div class="panel summary-panel">
      <h3>Reviews Presence</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Reviews Present</th>
            <th>Matched Phrases</th>
          </tr>
        </thead>
        <tbody>
          ${t.results.map(n=>{const o=n.reviewsPresent?"Yes":"No",r=n.reviewsPresent?"pill ok":"pill no",i=n.reviewsMatches.length>0?c(n.reviewsMatches.join(", ")):"-";return`
        <tr>
          <td>${S(n.label,n.url)}</td>
          <td><span class="${r}">${o}</span></td>
          <td>${i}</td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    </div>
  `}function Sn(t){return`
    <div class="panel summary-panel">
      <h3>Schema Presence</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Schema Present</th>
            <th>Detected Types</th>
          </tr>
        </thead>
        <tbody>
          ${t.results.map(n=>{const o=n.schemaPresent?"Yes":"No",r=n.schemaPresent?"pill ok":"pill no",i=n.schemaMatches.length>0?c(n.schemaMatches.join(", ")):"-";return`
        <tr>
          <td>${S(n.label,n.url)}</td>
          <td><span class="${r}">${o}</span></td>
          <td>${i}</td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    </div>
  `}function $n(t){return`
    <div class="panel summary-panel">
      <h3>First 100 Words After H1</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Keyword Found</th>
            <th>Matched Keywords</th>
          </tr>
        </thead>
        <tbody>
          ${t.results.map(n=>{const o=n.first100Present?"Yes":"No",r=n.first100Present?"pill ok":"pill no",i=n.first100Matches.length>0?c(n.first100Matches.join(", ")):"-";return`
        <tr>
          <td>${S(n.label,n.url)}</td>
          <td><span class="${r}">${o}</span></td>
          <td>${i}</td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    </div>
  `}function at(t){return t.length===0?"-":c(t.join(", "))}function Un(t){return`
    <div class="panel summary-panel">
      <h3>Image ALT Check (Page Content)</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>ALT Fulfilled</th>
            <th>ALT Coverage</th>
            <th>Missing ALTs</th>
            <th>ALT Phrases Used</th>
            <th>Matched Group Keywords</th>
          </tr>
        </thead>
        <tbody>
          ${t.results.map(n=>{const o=n.imageAltFulfilled?"Yes":"No",r=n.imageAltFulfilled?"pill ok":"pill no",i=`${n.imageAltWithValue}/${n.imageAltTotal}`,a=at(n.imageAltPhrases),s=at(n.imageAltKeywordMatches);return`
        <tr>
          <td>${S(n.label,n.url)}</td>
          <td><span class="${r}">${o}</span></td>
          <td>${i}</td>
          <td>${n.imageAltMissing}</td>
          <td>${a}</td>
          <td>${s}</td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    </div>
  `}function kn(t){return t==="pass"?'<span class="pill ok">Pass</span>':t==="fail"?'<span class="pill no">Fail</span>':'<span class="pill warn">Warn</span>'}function Ln(t){const e=t.results.find(r=>r.type==="my-site"),n=e&&e.fetchStatus==="success"?e.technicalChecks:[];return`
    <div class="panel summary-panel">
      <h3>My URL Technical Checks</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Summary</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${n.length>0?n.map(r=>`
        <tr>
          <td>${c(r.label)}</td>
          <td>${kn(r.status)}</td>
          <td>${c(r.summary)}</td>
          <td>${c(r.details)}</td>
        </tr>
      `).join(""):`
        <tr>
          <td colspan="4" class="hint">No technical checks available.</td>
        </tr>
      `}
        </tbody>
      </table>
    </div>
  `}function Kn(t){return`
    <div class="panel summary-panel">
      <h3>Content Structure Checks</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>TOC Present</th>
            <th>TOC Details</th>
            <th>Data Tables Present</th>
            <th>Table Details</th>
          </tr>
        </thead>
        <tbody>
          ${t.results.map(n=>{const o=n.tocPresent?"Yes":"No",r=n.tocPresent?"pill ok":"pill no",i=n.tableUsagePresent?"Yes":"No",a=n.tableUsagePresent?"pill ok":"pill no",s=`jump links=${n.tocJumpLinks}, matched sections=${n.tocMatchedSections}`,l=`data tables=${n.dataTableCount}, total tables=${n.totalTableCount}`;return`
        <tr>
          <td>${S(n.label,n.url)}</td>
          <td><span class="${r}">${o}</span></td>
          <td>${c(s)}</td>
          <td><span class="${a}">${i}</span></td>
          <td>${c(l)}</td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    </div>
  `}function Tn(t){return`
    <div class="panel summary-panel">
      <h3>Video Embed Checks</h3>
      <table class="results-table summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Video Embeds Present</th>
            <th>Total Embeds</th>
            <th>YouTube</th>
            <th>Vimeo</th>
          </tr>
        </thead>
        <tbody>
          ${t.results.map(n=>{const o=n.videoEmbedsPresent?"Yes":"No",r=n.videoEmbedsPresent?"pill ok":"pill no";return`
        <tr>
          <td>${S(n.label,n.url)}</td>
          <td><span class="${r}">${o}</span></td>
          <td>${n.videoEmbedCount}</td>
          <td>${n.youtubeEmbedCount}</td>
          <td>${n.vimeoEmbedCount}</td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    </div>
  `}const Rn="http://localhost:8787/serp",xn="United States",F=60;function Q(t,e){return`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${c(t)}</title>
    <style>
      body { margin: 0; font-family: "Trebuchet MS", "Lucida Sans Unicode", sans-serif; background: #f5f8fb; color: #1f2a2f; }
      .wrap { max-width: 1100px; margin: 0 auto; padding: 20px; }
      .panel { background: #ffffff; border: 1px solid #d8dde2; border-radius: 12px; padding: 16px 18px; box-shadow: 0 10px 24px rgba(20, 30, 40, 0.08); }
      h1 { margin: 0 0 8px; font-size: 24px; }
      .hint { color: #54616a; font-size: 13px; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
      th, td { border: 1px solid #d8dde2; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f4f6fa; }
      .ok { color: #0f6a3d; font-weight: 600; }
      .no { color: #a53a3a; font-weight: 600; }
      .url { max-width: 420px; word-break: break-word; }
      .my-rank-row td { background: #fff1d6; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="panel">
        ${e}
      </div>
    </div>
  </body>
</html>
  `}function Mn(t){return Q(`SERP Rankings - ${t}`,`
      <h1>SERP Rankings</h1>
      <div class="hint">Keyword: ${c(t)}</div>
      <div class="hint">Loading rankings...</div>
    `)}function Hn(t,e){return Q(`SERP Rankings - ${t}`,`
      <h1>SERP Rankings</h1>
      <div class="hint">Keyword: ${c(t)}</div>
      <div class="hint no">Error: ${c(e)}</div>
      <div class="hint">Tip: run proxy with SERP key, e.g. <code>$env:SERPAPI_KEY="your_key"; npm run proxy</code></div>
    `)}function Nn(t){try{return new URL(t).hostname.replace(/^www\./i,"")}catch{return""}}function In(t){const e=typeof t.params.scanDepth=="number"&&Number.isFinite(t.params.scanDepth)?t.params.scanDepth:F,n=t.targets.map(g=>{const y=g.position!==null,w=y?`#${g.position}`:`Not in top ${e}`,C=y?"ok":"no",h=g.resultUrl?c(g.resultUrl):"-",A=g.title?c(g.title):"-";return`
        <tr>
          <td>${c(g.label)}</td>
          <td class="${C}">${w}</td>
          <td class="url">${c(g.url)}</td>
          <td class="url">${h}</td>
          <td>${A}</td>
        </tr>
      `}).join(""),o=t.topOrganic&&t.topOrganic.length>0?t.topOrganic.map(g=>`
        <tr>
          <td>#${g.position}</td>
          <td>${c(g.domain||"-")}</td>
          <td>${c(g.title||"-")}</td>
          <td class="url">${c(g.link||"-")}</td>
        </tr>
      `).join(""):`
        <tr>
          <td colspan="4" class="hint">No organic results returned.</td>
        </tr>
      `,r=t.targets[0],a=r&&typeof r.position=="number"&&Number.isFinite(r.position)&&r.position>10?`
        <tr class="my-rank-row">
          <td>#${r.position}</td>
          <td>${c(Nn(r.resultUrl||r.url)||"-")}</td>
          <td>${c(r.title||"(Your page position outside top 10)")}</td>
          <td class="url">${c(r.resultUrl||r.url||"-")}</td>
        </tr>
      `:"",s=t.peopleAlsoAsk&&t.peopleAlsoAsk.length>0?t.peopleAlsoAsk.map(g=>`
        <tr>
          <td>${c(g.question||"-")}</td>
          <td>${c(g.snippet||"-")}</td>
          <td class="url">${c(g.link||"-")}</td>
        </tr>
      `).join(""):`
        <tr>
          <td colspan="3" class="hint">No People Also Ask results returned.</td>
        </tr>
      `,l=t.peopleAlsoSearchFor&&t.peopleAlsoSearchFor.length>0?t.peopleAlsoSearchFor.map(g=>`
        <tr>
          <td>${c(g.query||"-")}</td>
          <td class="url">${c(g.link||"-")}</td>
        </tr>
      `).join(""):`
        <tr>
          <td colspan="2" class="hint">No People Also Search For results returned.</td>
        </tr>
      `,d=`Location: ${t.params.location} | hl=${t.params.hl} | gl=${t.params.gl} | domain=${t.params.google_domain} | device=${t.params.device||"desktop"} | num=${t.params.num}`,m=`Requested depth: top ${e} (page size ${t.params.pageSize||10})`;return Q(`SERP Rankings - ${t.keyword}`,`
      <h1>SERP Rankings</h1>
      <div class="hint">Keyword: ${c(t.keyword)}</div>
      <div class="hint">${c(d)}</div>
      <div class="hint">${c(m)}</div>
      <div class="hint">Organic results returned by API: ${t.totalOrganic}</div>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Rank</th>
            <th>Target URL</th>
            <th>Matched Result URL</th>
            <th>Matched Result Title</th>
          </tr>
        </thead>
        <tbody>${n}</tbody>
      </table>
      <h2 style="margin:18px 0 8px;font-size:20px;">Top 10 Organic Results</h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Domain</th>
            <th>Title</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>${o}${a}</tbody>
      </table>
      <h2 style="margin:18px 0 8px;font-size:20px;">People Also Ask</h2>
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Snippet</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>${s}</tbody>
      </table>
      <h2 style="margin:18px 0 8px;font-size:20px;">People Also Search For</h2>
      <table>
        <thead>
          <tr>
            <th>Query</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>${l}</tbody>
      </table>
    `)}async function Bn(t,e,n=xn,o="desktop"){const r=window.open("","_blank","width=1200,height=840");if(!r)return alert("Popup blocked by browser."),null;r.document.write(Mn(t)),r.document.close();const i=e.results.map(a=>({label:a.label,url:a.url}));try{const a=await fetch(Rn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({keyword:t,targets:i,location:n,hl:"en",gl:"uk",googleDomain:"google.co.uk",device:o,num:F,scanDepth:F})}),s=await a.text();if(!a.ok)throw new Error(s||`SERP request failed with HTTP ${a.status}`);const l=JSON.parse(s);return r.document.open(),r.document.write(In(l)),r.document.close(),l}catch(a){const s=a instanceof Error?a.message:"Unknown SERP error";return r.document.open(),r.document.write(Hn(t,s)),r.document.close(),null}}const Dn=[{city:"Aberdeen",nation:"Scotland",country:"United Kingdom",population:198590,featureCode:"PPLA2",location:"Aberdeen, Scotland, United Kingdom"},{city:"Aylesbury",nation:"England",country:"United Kingdom",population:74748,featureCode:"PPLA2",location:"Aylesbury, England, United Kingdom"},{city:"Bangor",nation:"Northern Ireland",country:"United Kingdom",population:61011,featureCode:"PPLA2",location:"Bangor, Northern Ireland, United Kingdom"},{city:"Barnsley",nation:"England",country:"United Kingdom",population:71447,featureCode:"PPLA2",location:"Barnsley, England, United Kingdom"},{city:"Barry",nation:"Wales",country:"United Kingdom",population:54673,featureCode:"PPLA2",location:"Barry, Wales, United Kingdom"},{city:"Bath",nation:"England",country:"United Kingdom",population:101557,featureCode:"PPLA2",location:"Bath, England, United Kingdom"},{city:"Bedford",nation:"England",country:"United Kingdom",population:106940,featureCode:"PPLA2",location:"Bedford, England, United Kingdom"},{city:"Belfast",nation:"Northern Ireland",country:"United Kingdom",population:348005,featureCode:"PPLA",location:"Belfast, Northern Ireland, United Kingdom"},{city:"Birmingham",nation:"England",country:"United Kingdom",population:1157603,featureCode:"PPLA2",location:"Birmingham, England, United Kingdom"},{city:"Blackburn",nation:"England",country:"United Kingdom",population:146521,featureCode:"PPLA2",location:"Blackburn, England, United Kingdom"},{city:"Blackpool",nation:"England",country:"United Kingdom",population:145007,featureCode:"PPLA2",location:"Blackpool, England, United Kingdom"},{city:"Bolton",nation:"England",country:"United Kingdom",population:141331,featureCode:"PPLA2",location:"Bolton, England, United Kingdom"},{city:"Bournemouth",nation:"England",country:"United Kingdom",population:163600,featureCode:"PPLA2",location:"Bournemouth, England, United Kingdom"},{city:"Bracknell",nation:"England",country:"United Kingdom",population:76103,featureCode:"PPLA2",location:"Bracknell, England, United Kingdom"},{city:"Bradford",nation:"England",country:"United Kingdom",population:366187,featureCode:"PPLA2",location:"Bradford, England, United Kingdom"},{city:"Bristol",nation:"England",country:"United Kingdom",population:479024,featureCode:"PPLA2",location:"Bristol, England, United Kingdom"},{city:"Bury",nation:"England",country:"United Kingdom",population:61044,featureCode:"PPLA2",location:"Bury, England, United Kingdom"},{city:"Cambridge",nation:"England",country:"United Kingdom",population:145674,featureCode:"PPLA2",location:"Cambridge, England, United Kingdom"},{city:"Cardiff",nation:"Wales",country:"United Kingdom",population:372089,featureCode:"PPLA",location:"Cardiff, Wales, United Kingdom"},{city:"Carlisle",nation:"England",country:"United Kingdom",population:78470,featureCode:"PPLA2",location:"Carlisle, England, United Kingdom"},{city:"Castlereagh",nation:"Northern Ireland",country:"United Kingdom",population:56679,featureCode:"PPLA2",location:"Castlereagh, Northern Ireland, United Kingdom"},{city:"Chelmsford",nation:"England",country:"United Kingdom",population:111511,featureCode:"PPLA2",location:"Chelmsford, England, United Kingdom"},{city:"Chester",nation:"England",country:"United Kingdom",population:90524,featureCode:"PPLA2",location:"Chester, England, United Kingdom"},{city:"Coventry",nation:"England",country:"United Kingdom",population:345324,featureCode:"PPLA2",location:"Coventry, England, United Kingdom"},{city:"Craigavon",nation:"Northern Ireland",country:"United Kingdom",population:59236,featureCode:"PPLA2",location:"Craigavon, Northern Ireland, United Kingdom"},{city:"Darlington",nation:"England",country:"United Kingdom",population:92363,featureCode:"PPLA2",location:"Darlington, England, United Kingdom"},{city:"Derby",nation:"England",country:"United Kingdom",population:270468,featureCode:"PPLA2",location:"Derby, England, United Kingdom"},{city:"Derry",nation:"Northern Ireland",country:"United Kingdom",population:83652,featureCode:"PPLA2",location:"Derry, Northern Ireland, United Kingdom"},{city:"Doncaster",nation:"England",country:"United Kingdom",population:113566,featureCode:"PPLA2",location:"Doncaster, England, United Kingdom"},{city:"Dudley",nation:"England",country:"United Kingdom",population:199059,featureCode:"PPLA2",location:"Dudley, England, United Kingdom"},{city:"Dundee",nation:"Scotland",country:"United Kingdom",population:148210,featureCode:"PPLA2",location:"Dundee, Scotland, United Kingdom"},{city:"Edinburgh",nation:"Scotland",country:"United Kingdom",population:514990,featureCode:"PPLA",location:"Edinburgh, Scotland, United Kingdom"},{city:"Exeter",nation:"England",country:"United Kingdom",population:130709,featureCode:"PPLA2",location:"Exeter, England, United Kingdom"},{city:"Gateshead",nation:"England",country:"United Kingdom",population:77649,featureCode:"PPLA2",location:"Gateshead, England, United Kingdom"},{city:"Glasgow",nation:"Scotland",country:"United Kingdom",population:626410,featureCode:"PPLA2",location:"Glasgow, Scotland, United Kingdom"},{city:"Gloucester",nation:"England",country:"United Kingdom",population:132416,featureCode:"PPLA2",location:"Gloucester, England, United Kingdom"},{city:"Grays",nation:"England",country:"United Kingdom",population:89755,featureCode:"PPLA2",location:"Grays, England, United Kingdom"},{city:"Grimsby",nation:"England",country:"United Kingdom",population:86138,featureCode:"PPLA2",location:"Grimsby, England, United Kingdom"},{city:"Halifax",nation:"England",country:"United Kingdom",population:82624,featureCode:"PPLA2",location:"Halifax, England, United Kingdom"},{city:"Hamilton",nation:"Scotland",country:"United Kingdom",population:54480,featureCode:"PPLA2",location:"Hamilton, Scotland, United Kingdom"},{city:"Hartlepool",nation:"England",country:"United Kingdom",population:88855,featureCode:"PPLA2",location:"Hartlepool, England, United Kingdom"},{city:"Hereford",nation:"England",country:"United Kingdom",population:60415,featureCode:"PPLA2",location:"Hereford, England, United Kingdom"},{city:"Hove",nation:"England",country:"United Kingdom",population:75174,featureCode:"PPLA2",location:"Hove, England, United Kingdom"},{city:"Huddersfield",nation:"England",country:"United Kingdom",population:149017,featureCode:"PPLA2",location:"Huddersfield, England, United Kingdom"},{city:"Ipswich",nation:"England",country:"United Kingdom",population:178835,featureCode:"PPLA2",location:"Ipswich, England, United Kingdom"},{city:"Kingston upon Hull",nation:"England",country:"United Kingdom",population:314018,featureCode:"PPLA2",location:"Kingston upon Hull, England, United Kingdom"},{city:"Leeds",nation:"England",country:"United Kingdom",population:536280,featureCode:"PPLA2",location:"Leeds, England, United Kingdom"},{city:"Leicester",nation:"England",country:"United Kingdom",population:368600,featureCode:"PPLA2",location:"Leicester, England, United Kingdom"},{city:"Lincoln",nation:"England",country:"United Kingdom",population:103813,featureCode:"PPLA2",location:"Lincoln, England, United Kingdom"},{city:"Lisburn",nation:"Northern Ireland",country:"United Kingdom",population:77506,featureCode:"PPLA2",location:"Lisburn, Northern Ireland, United Kingdom"},{city:"Liverpool",nation:"England",country:"United Kingdom",population:496770,featureCode:"PPLA2",location:"Liverpool, England, United Kingdom"},{city:"Livingston",nation:"Scotland",country:"United Kingdom",population:56840,featureCode:"PPLA2",location:"Livingston, Scotland, United Kingdom"},{city:"London",nation:"England",country:"United Kingdom",population:8961989,featureCode:"PPLC",location:"London, England, United Kingdom"},{city:"Luton",nation:"England",country:"United Kingdom",population:225262,featureCode:"PPLA2",location:"Luton, England, United Kingdom"},{city:"Maidenhead",nation:"England",country:"United Kingdom",population:70374,featureCode:"PPLA2",location:"Maidenhead, England, United Kingdom"},{city:"Maidstone",nation:"England",country:"United Kingdom",population:107627,featureCode:"PPLA2",location:"Maidstone, England, United Kingdom"},{city:"Manchester",nation:"England",country:"United Kingdom",population:568996,featureCode:"PPLA2",location:"Manchester, England, United Kingdom"},{city:"Middlesbrough",nation:"England",country:"United Kingdom",population:142707,featureCode:"PPLA2",location:"Middlesbrough, England, United Kingdom"},{city:"Milton Keynes",nation:"England",country:"United Kingdom",population:256385,featureCode:"PPLA2",location:"Milton Keynes, England, United Kingdom"},{city:"Newcastle upon Tyne",nation:"England",country:"United Kingdom",population:300125,featureCode:"PPLA2",location:"Newcastle upon Tyne, England, United Kingdom"},{city:"Newport",nation:"Wales",country:"United Kingdom",population:161506,featureCode:"PPLA2",location:"Newport, Wales, United Kingdom"},{city:"Newtownabbey",nation:"Northern Ireland",country:"United Kingdom",population:63860,featureCode:"PPLA2",location:"Newtownabbey, Northern Ireland, United Kingdom"},{city:"Northampton",nation:"England",country:"United Kingdom",population:245899,featureCode:"PPLA2",location:"Northampton, England, United Kingdom"},{city:"Norwich",nation:"England",country:"United Kingdom",population:143135,featureCode:"PPLA2",location:"Norwich, England, United Kingdom"},{city:"Nottingham",nation:"England",country:"United Kingdom",population:323632,featureCode:"PPLA2",location:"Nottingham, England, United Kingdom"},{city:"Oldham",nation:"England",country:"United Kingdom",population:237110,featureCode:"PPLA2",location:"Oldham, England, United Kingdom"},{city:"Oxford",nation:"England",country:"United Kingdom",population:162100,featureCode:"PPLA2",location:"Oxford, England, United Kingdom"},{city:"Paisley",nation:"Scotland",country:"United Kingdom",population:77270,featureCode:"PPLA2",location:"Paisley, Scotland, United Kingdom"},{city:"Peterborough",nation:"England",country:"United Kingdom",population:163379,featureCode:"PPLA2",location:"Peterborough, England, United Kingdom"},{city:"Plymouth",nation:"England",country:"United Kingdom",population:260203,featureCode:"PPLA2",location:"Plymouth, England, United Kingdom"},{city:"Portsmouth",nation:"England",country:"United Kingdom",population:208100,featureCode:"PPLA2",location:"Portsmouth, England, United Kingdom"},{city:"Preston",nation:"England",country:"United Kingdom",population:313332,featureCode:"PPLA2",location:"Preston, England, United Kingdom"},{city:"Reading",nation:"England",country:"United Kingdom",population:318014,featureCode:"PPLA2",location:"Reading, England, United Kingdom"},{city:"Rochdale",nation:"England",country:"United Kingdom",population:97550,featureCode:"PPLA2",location:"Rochdale, England, United Kingdom"},{city:"Rotherham",nation:"England",country:"United Kingdom",population:117618,featureCode:"PPLA2",location:"Rotherham, England, United Kingdom"},{city:"Salford",nation:"England",country:"United Kingdom",population:129794,featureCode:"PPLA2",location:"Salford, England, United Kingdom"},{city:"Scunthorpe",nation:"England",country:"United Kingdom",population:81576,featureCode:"PPLA2",location:"Scunthorpe, England, United Kingdom"},{city:"Sheffield",nation:"England",country:"United Kingdom",population:556500,featureCode:"PPLA2",location:"Sheffield, England, United Kingdom"},{city:"Shrewsbury",nation:"England",country:"United Kingdom",population:76782,featureCode:"PPLA2",location:"Shrewsbury, England, United Kingdom"},{city:"Slough",nation:"England",country:"United Kingdom",population:164793,featureCode:"PPLA2",location:"Slough, England, United Kingdom"},{city:"Solihull",nation:"England",country:"United Kingdom",population:126577,featureCode:"PPLA2",location:"Solihull, England, United Kingdom"},{city:"South Shields",nation:"England",country:"United Kingdom",population:83655,featureCode:"PPLA2",location:"South Shields, England, United Kingdom"},{city:"Southampton",nation:"England",country:"United Kingdom",population:269781,featureCode:"PPLA2",location:"Southampton, England, United Kingdom"},{city:"Southend-on-Sea",nation:"England",country:"United Kingdom",population:295310,featureCode:"PPLA2",location:"Southend-on-Sea, England, United Kingdom"},{city:"Southport",nation:"England",country:"United Kingdom",population:91703,featureCode:"PPLA2",location:"Southport, England, United Kingdom"},{city:"St Helens",nation:"England",country:"United Kingdom",population:183200,featureCode:"PPLA2",location:"St Helens, England, United Kingdom"},{city:"Stafford",nation:"England",country:"United Kingdom",population:70145,featureCode:"PPLA2",location:"Stafford, England, United Kingdom"},{city:"Stockport",nation:"England",country:"United Kingdom",population:139052,featureCode:"PPLA2",location:"Stockport, England, United Kingdom"},{city:"Stockton-on-Tees",nation:"England",country:"United Kingdom",population:79957,featureCode:"PPLA2",location:"Stockton-on-Tees, England, United Kingdom"},{city:"Stoke-on-Trent",nation:"England",country:"United Kingdom",population:258366,featureCode:"PPLA2",location:"Stoke-on-Trent, England, United Kingdom"},{city:"Sunderland",nation:"England",country:"United Kingdom",population:170134,featureCode:"PPLA2",location:"Sunderland, England, United Kingdom"},{city:"Swansea",nation:"Wales",country:"United Kingdom",population:300352,featureCode:"PPLA2",location:"Swansea, Wales, United Kingdom"},{city:"Swindon",nation:"England",country:"United Kingdom",population:201669,featureCode:"PPLA2",location:"Swindon, England, United Kingdom"},{city:"Taunton",nation:"England",country:"United Kingdom",population:64621,featureCode:"PPLA2",location:"Taunton, England, United Kingdom"},{city:"Telford",nation:"England",country:"United Kingdom",population:155570,featureCode:"PPLA2",location:"Telford, England, United Kingdom"},{city:"Torquay",nation:"England",country:"United Kingdom",population:65388,featureCode:"PPLA2",location:"Torquay, England, United Kingdom"},{city:"Wakefield",nation:"England",country:"United Kingdom",population:109766,featureCode:"PPLA2",location:"Wakefield, England, United Kingdom"},{city:"Wallasey",nation:"England",country:"United Kingdom",population:58794,featureCode:"PPLA2",location:"Wallasey, England, United Kingdom"},{city:"Walsall",nation:"England",country:"United Kingdom",population:172141,featureCode:"PPLA2",location:"Walsall, England, United Kingdom"},{city:"Warrington",nation:"England",country:"United Kingdom",population:172330,featureCode:"PPLA2",location:"Warrington, England, United Kingdom"},{city:"Weston-super-Mare",nation:"England",country:"United Kingdom",population:82903,featureCode:"PPLA2",location:"Weston-super-Mare, England, United Kingdom"},{city:"Widnes",nation:"England",country:"United Kingdom",population:61464,featureCode:"PPLA2",location:"Widnes, England, United Kingdom"},{city:"Wigan",nation:"England",country:"United Kingdom",population:175405,featureCode:"PPLA2",location:"Wigan, England, United Kingdom"},{city:"Wolverhampton",nation:"England",country:"United Kingdom",population:263700,featureCode:"PPLA2",location:"Wolverhampton, England, United Kingdom"},{city:"Worcester",nation:"England",country:"United Kingdom",population:101659,featureCode:"PPLA2",location:"Worcester, England, United Kingdom"},{city:"Wrexham",nation:"Wales",country:"United Kingdom",population:65692,featureCode:"PPLA2",location:"Wrexham, Wales, United Kingdom"},{city:"York",nation:"England",country:"United Kingdom",population:156135,featureCode:"PPLA2",location:"York, England, United Kingdom"}],On={cities:Dn};function st(t){const e=new Date(t);return Number.isNaN(e.getTime())?t:e.toLocaleString()}function J(t){return t.response.targets[0]||null}function j(t){try{return new URL(t).hostname.toLowerCase().replace(/^www\./,"")}catch{return""}}function _n(t){const e=J(t),n=j((e==null?void 0:e.resultUrl)||"");return n||j((e==null?void 0:e.url)||"")||"-"}function Gn(t){if(!t.response.topOrganic||t.response.topOrganic.length===0)return'<p class="hint">No top 10 data.</p>';const e=J(t),n=j((e==null?void 0:e.url)||(e==null?void 0:e.resultUrl)||"");return`
    <table class="results-table history-inner-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Domain</th>
          <th>Title</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>${t.response.topOrganic.map(r=>`
      <tr class="${r.domain===n?"history-row-myurl":""}">
        <td>#${r.position}</td>
        <td>${c(r.domain||"-")}</td>
        <td>${c(r.title||"-")}</td>
        <td class="history-url">${c(r.link||"-")}</td>
      </tr>
    `).join("")}</tbody>
    </table>
  `}function yt(t,e){return t.length===0?e?'<p class="hint">Archive is empty.</p>':'<p class="hint">No saved ranking checks yet.</p>':`<div class="history-list">${t.map(o=>{const r=J(o),i=r&&typeof r.position=="number"?`#${r.position}`:"Not found",a=(r==null?void 0:r.resultUrl)||(r==null?void 0:r.url)||"-",l=`${o.response.params.location||"-"} | ${o.response.params.google_domain} | gl=${o.response.params.gl}`;return`
        <div class="history-entry">
          <div class="history-entry-header">
            <div class="history-entry-title">${c(o.keyword)}</div>
            ${e?"":`<button class="btn secondary history-archive-btn" type="button" data-entry-id="${c(o.id)}">Archive</button>`}
          </div>
          <div class="history-meta">
            <div class="history-meta-item">
              <div class="history-meta-label">Date</div>
              <div>${c(st(o.createdAt))}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">Keyword</div>
              <div>${c(o.keyword)}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">SERP Params</div>
              <div>${c(l)}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">Your Rank</div>
              <div>${c(i)}</div>
            </div>
            <div class="history-meta-item">
              <div class="history-meta-label">Ranked URL</div>
              <div class="history-url">${c(a)}</div>
            </div>
          </div>
          <details class="history-toggle">
            <summary class="btn secondary history-toggle-btn">
              ${c(st(o.createdAt))} | ${c(o.keyword)} | ${c(_n(o))}
            </summary>
            <div class="history-top-title">Saved Top 10</div>
            ${Gn(o)}
          </details>
        </div>
      `}).join("")}</div>`}function qn(t){return yt(t,!1)}function Wn(t){return yt(t,!0)}const V="keyword-gap-rankings-history",ft="keyword-gap-rankings-history-archive",bt=200;function Fn(){try{const t=localStorage.getItem(V);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e:[]}catch{return[]}}function jn(){try{const t=localStorage.getItem(ft);if(!t)return[];const e=JSON.parse(t);return Array.isArray(e)?e:[]}catch{return[]}}function Et(t){localStorage.setItem(V,JSON.stringify(t))}function Yn(t){localStorage.setItem(ft,JSON.stringify(t))}function zn(t,e){const n=[e,...t].slice(0,bt);return Et(n),n}function Qn(){localStorage.removeItem(V)}function Jn(t,e,n){const o=t.find(a=>a.id===n);if(!o)return{activeEntries:t,archivedEntries:e};const r=t.filter(a=>a.id!==n),i=[o,...e].slice(0,bt);return Et(r),Yn(i),{activeEntries:r,archivedEntries:i}}const wt=10,vt="serp_location",Ct="serp_device",lt="London, England, United Kingdom",Vn="desktop",Xn=Array.from(new Set((On.cities||[]).map(t=>t&&typeof t.location=="string"?t.location.trim():"").filter(t=>t.length>0)));function Zn(){u.keywordGroups=Nt(),u.proxySettings=It(),u.rankingsHistory=Fn(),u.archivedRankingsHistory=jn(),eo(),Z(),tt(),mo(),go(),ro(),I(),window.__appBooted=!0}function to(t){const e=t instanceof Error?t.message:String(t),n=document.getElementById("app")||document.body,o=document.createElement("div");o.className="panel warning",o.innerHTML=`
    <strong>App failed to initialize.</strong>
    <div class="hint">Details: ${c(e)}</div>
    <div class="hint">If you opened index.html directly, run the Vite dev server (npm run dev).</div>
  `,n.prepend(o)}function eo(){p("#save-group-btn").addEventListener("click",po),p("#cancel-edit-btn").addEventListener("click",()=>{U(null)}),p("#add-competitor-btn").addEventListener("click",()=>{$t()}),p("#toggle-groups-panel-btn").addEventListener("click",()=>{oo()}),p("#analyze-btn").addEventListener("click",yo),p("#export-html-btn").addEventListener("click",wo),p("#export-pdf-btn").addEventListener("click",()=>{alert("PDF export is not implemented yet.")}),p("#save-proxy-btn").addEventListener("click",ho),p("#toggle-proxy-panel-btn").addEventListener("click",()=>{no()}),p("#clear-rankings-history-btn").addEventListener("click",()=>{Qn(),u.rankingsHistory=[],I()}),io(),uo()}function no(t){const e=p("#proxy-panel-content"),n=p("#toggle-proxy-panel-btn"),o=e.classList.contains("hidden");e.classList.toggle("hidden",!o),n.textContent=o?"Close":"Open"}function oo(t){const e=p("#groups-panel-content"),n=p("#toggle-groups-panel-btn"),o=e.classList.contains("hidden");e.classList.toggle("hidden",!o),n.textContent=o?"Close":"Open"}function ro(){const t=p("#results-content");t.addEventListener("input",e=>{const n=e.target,o=n==null?void 0:n.closest(".serp-location-input");if(!o)return;const r=o.value.trim();r&&Pt(r)}),t.addEventListener("click",async e=>{const n=e.target,o=n==null?void 0:n.closest(".serp-device-btn");if(o){e.preventDefault(),e.stopPropagation();const l=o.dataset.device==="mobile"?"mobile":"desktop";ao(l),lo(t);return}const r=n==null?void 0:n.closest(".serp-check-btn");if(r){e.preventDefault(),e.stopPropagation();const l=r.dataset.keyword||"",d=l?decodeURIComponent(l):r.getAttribute("data-keyword")||"";if(!d||!u.currentAnalysis)return;const m=so(t),g=X(),y=await Bn(d,u.currentAnalysis,m,g);y&&(u.rankingsHistory=zn(u.rankingsHistory,{id:z(),createdAt:new Date().toISOString(),keyword:d,response:y}),I());return}const i=n==null?void 0:n.closest(".keyword-cell");if(!i)return;const a=i.dataset.keyword||"",s=a?decodeURIComponent(a):i.textContent||"";s&&(St(s.trim()),i.classList.add("copied"),window.setTimeout(()=>i.classList.remove("copied"),600))})}function I(){const t=p("#rankings-history-content");t.innerHTML=qn(u.rankingsHistory);const e=p("#rankings-archive-content");e.innerHTML=Wn(u.archivedRankingsHistory)}function io(){p("#rankings-history-content").addEventListener("click",e=>{const n=e.target,o=n==null?void 0:n.closest(".history-archive-btn");if(!o)return;const r=o.dataset.entryId||"";if(!r)return;const i=Jn(u.rankingsHistory,u.archivedRankingsHistory,r);u.rankingsHistory=i.activeEntries,u.archivedRankingsHistory=i.archivedEntries,I()})}function At(){try{return localStorage.getItem(vt)||lt}catch{return lt}}function Pt(t){try{localStorage.setItem(vt,t)}catch{}}function X(){try{return localStorage.getItem(Ct)==="mobile"?"mobile":"desktop"}catch{return Vn}}function ao(t){try{localStorage.setItem(Ct,t)}catch{}}function so(t){const e=t.querySelector(".serp-location-input"),n=(e==null?void 0:e.value.trim())||"";if(n)return Pt(n),n;const o=At();return e&&(e.value=o),o}function lo(t){const e=X();t.querySelectorAll(".serp-device-btn").forEach(n=>{n.classList.toggle("active",n.dataset.device===e),n.setAttribute("aria-pressed",n.dataset.device===e?"true":"false")})}function co(){const t=At(),e=X(),n=Xn.map(o=>`<option value="${c(o)}"></option>`).join("");return`
    <div class="serp-controls-panel">
      <div class="form-row">
        <label for="serp-location-input">SERP location</label>
        <input
          id="serp-location-input"
          type="text"
          class="serp-location-input"
          list="serp-city-options"
          value="${c(t)}"
          placeholder="Start typing a city, e.g. Swindon, England, United Kingdom"
        />
        <datalist id="serp-city-options">
          ${n}
        </datalist>
      </div>
      <div class="serp-device-toggle" role="group" aria-label="SERP device">
        <button
          type="button"
          class="btn secondary serp-device-btn ${e==="desktop"?"active":""}"
          data-device="desktop"
          aria-pressed="${e==="desktop"?"true":"false"}"
        >
          Desktop
        </button>
        <button
          type="button"
          class="btn secondary serp-device-btn ${e==="mobile"?"active":""}"
          data-device="mobile"
          aria-pressed="${e==="mobile"?"true":"false"}"
        >
          Mobile
        </button>
      </div>
    </div>
  `}function uo(){p("#summary-table").addEventListener("click",e=>{const n=e.target,o=n==null?void 0:n.closest(".copy-summary");if(!o)return;const r=o.dataset.copyText||"",i=r?decodeURIComponent(r):"";i.trim().length!==0&&(St(i),o.classList.add("copied"),window.setTimeout(()=>o.classList.remove("copied"),600))})}function St(t){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).catch(()=>ct(t));return}ct(t)}function ct(t){const e=document.createElement("textarea");e.value=t,e.setAttribute("readonly","true"),e.style.position="absolute",e.style.left="-9999px",document.body.appendChild(e),e.select(),document.execCommand("copy"),document.body.removeChild(e)}function Y(t){p("#group-warning").textContent=t}function U(t){const e=p("#group-name"),n=p("#keywords-input"),o=p("#save-group-btn"),r=p("#cancel-edit-btn");if(!t){u.editingGroupId=null,e.value="",n.value="",o.textContent="Save group",r.classList.add("hidden"),Y("");return}u.editingGroupId=t.id,e.value=t.name,n.value=t.keywords.join(`
`),o.textContent="Update group",r.classList.remove("hidden")}function po(){const t=p("#group-name"),e=p("#keywords-input"),n=t.value.trim(),o=e.value.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);if(!n){alert("Please provide a group name.");return}if(o.length===0){alert("Please add at least one keyword.");return}const r=new Map;o.forEach(l=>{const d=E(l);d&&(r.has(d)||r.set(d,l))});const i=Array.from(r.values()),a=i.filter(l=>E(l).length<=2);a.length>0?Y(`Warning: ${a.length} keyword(s) are very short and may increase false positives.`):Y("");const s=p("#keyword-group-select").value;if(u.editingGroupId){const l=u.keywordGroups.find(m=>m.id===u.editingGroupId);if(!l){U(null),alert("The group you were editing no longer exists.");return}const d={...l,name:n,keywords:i};u.keywordGroups=u.keywordGroups.map(m=>m.id===l.id?d:m)}else{const l={id:z(),name:n,keywords:i,createdAt:new Date().toISOString()};u.keywordGroups=[l,...u.keywordGroups]}pt(u.keywordGroups),Z(),tt(),s&&(p("#keyword-group-select").value=s),U(null)}function Z(){const t=p("#groups-list");if(u.keywordGroups.length===0){t.innerHTML='<p class="hint">No keyword groups yet.</p>';return}t.innerHTML=u.keywordGroups.map(e=>{const n=e.keywords.slice(0,4).join(", "),o=e.keywords.length>4?"...":"";return`
        <div class="group-item">
          <div class="group-info">
            <div class="group-name">${c(e.name)}</div>
            <div class="group-keywords">${c(n)}${o}</div>
          </div>
          <div class="actions">
            <button class="btn secondary" data-action="edit" data-group-id="${e.id}">Edit</button>
            <button class="btn secondary" data-action="delete" data-group-id="${e.id}">Delete</button>
          </div>
        </div>
      `}).join(""),t.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",()=>{const n=e.getAttribute("data-group-id"),o=e.getAttribute("data-action");if(n){if(o==="edit"){const r=u.keywordGroups.find(i=>i.id===n);r&&U(r);return}o==="delete"&&(u.keywordGroups=u.keywordGroups.filter(r=>r.id!==n),u.editingGroupId===n&&U(null),pt(u.keywordGroups),Z(),tt())}})})}function tt(){const t=p("#keyword-group-select");if(u.keywordGroups.length===0){t.innerHTML='<option value="">No groups available</option>';return}t.innerHTML=['<option value="">Select a group</option>',...u.keywordGroups.map(e=>`<option value="${e.id}">${c(e.name)}</option>`)].join("")}function mo(){p("#competitors-container").children.length===0&&$t()}function $t(t=""){const e=p("#competitors-container");if(e.children.length>=wt){alert("Maximum of 10 competitor URLs.");return}const n=document.createElement("div");n.className="competitor-row",n.innerHTML=`
    <input type="url" class="competitor-url" placeholder="https://competitor.com" value="${c(t)}" />
    <button class="btn secondary" type="button">Remove</button>
  `;const o=n.querySelector("button");o&&o.addEventListener("click",()=>n.remove()),e.appendChild(n)}function H(t){p("#analysis-status").textContent=t}function go(){const t=p("#proxy-mode"),e=p("#proxy-template"),n=p("#render-js");t.value=u.proxySettings.mode,e.value=u.proxySettings.customTemplate,n.checked=u.proxySettings.renderJs,Ut()}function Ut(){const t=p("#proxy-hint");if(u.proxySettings.mode==="local"){t.textContent="Local proxy expected at http://localhost:8787/proxy (run: npm run proxy).";return}if(u.proxySettings.mode==="custom"){t.textContent="Custom proxy template should include {url}.";return}t.textContent="Auto mode tries direct, local, and public proxies."}function ho(){const t=p("#proxy-mode"),e=p("#proxy-template"),n=p("#render-js");if(t.value==="custom"){const o=e.value.trim();if(o.length===0){alert("Custom proxy mode requires a template (include {url} or {url_raw}).");return}if(!o.includes("{url}")&&!o.includes("{url_raw}")){alert("Custom proxy template should include {url} or {url_raw}.");return}}u.proxySettings={...u.proxySettings,mode:t.value,customTemplate:e.value.trim(),renderJs:n.checked},Bt(u.proxySettings),Ut()}async function yo(){const t=p("#keyword-group-select").value,e=p("#my-url").value.trim(),n=Array.from(document.querySelectorAll(".competitor-url")),o=hn(n.map(s=>s.value.trim()).filter(s=>s.length>0));if(!t){alert("Please select a keyword group.");return}if(!it(e)){alert("Please enter a valid URL for your site.");return}if(o.length>wt){alert("Maximum of 10 competitor URLs.");return}if(o.filter(s=>!it(s)).length>0){alert("One or more competitor URLs are invalid.");return}const i=u.keywordGroups.find(s=>s.id===t);if(!i){alert("Selected group not found.");return}const a=p("#analyze-btn");a.disabled=!0;try{H("Starting analysis...");const s=await mn({myUrl:e,competitorUrls:o,group:i,proxySettings:u.proxySettings,onProgress:l=>H(l)});u.currentAnalysis=s,bo(s.results,s),H("Analysis complete.")}catch(s){const l=s instanceof Error?s.message:"Unknown error";H(`Analysis failed: ${l}`)}finally{a.disabled=!1}}function fo(t){const e=t.matches.filter(o=>o.found).length,n=t.matches.reduce((o,r)=>o+r.occurrencesTotal,0);return`Found ${e} keywords, ${n} total matches, ${t.wordCount} words.`}function bo(t,e){const n=p("#results-meta");n.textContent=`Group: ${e.groupName} | Keywords: ${e.keywords.length}`;const o=p("#summary-table");u.currentAnalysis?o.innerHTML=Cn(u.currentAnalysis):o.innerHTML="";const r=p("#first100-table");u.currentAnalysis?r.innerHTML=$n(u.currentAnalysis):r.innerHTML="";const i=p("#results-content"),a=t.find(h=>h.type==="my-site"),s=new Map;a&&a.matches.forEach(h=>{s.set(h.keyword,h.found)}),i.innerHTML=t.map(h=>{const A=new Map;if(h.type==="my-site"&&t.filter(f=>f.type==="competitor").forEach(f=>{f.matches.forEach(b=>{b.found&&A.set(b.keyword,!0)})}),h.fetchStatus==="error"){const f=u.proxySettings.mode==="local"?"Tip: Start the local proxy with npm run proxy.":"Tip: Try Auto or Local proxy mode if this keeps failing.";return`
          <div class="panel">
            <h3>${c(h.label)}</h3>
            <p class="hint">URL: ${c(h.url)}</p>
            <p class="hint">Error: ${c(h.errorMessage||"Unknown error")}</p>
            <p class="hint">${c(f)}</p>
          </div>
        `}const k=f=>{const b=h.matches.find(Ht=>Ht.keyword===f);if(!b)return"";const Mt=h.type==="my-site"&&!b.found&&A.get(f)===!0?'<span class="gap-badge">Gap</span>':"";return`
          <tr class="${h.type==="competitor"&&b.found&&s.get(f)===!1?"gap-row":""}">
            <td class="keyword-cell" data-keyword="${encodeURIComponent(f)}">
              <span>${c(f)} ${Mt}</span>
              <button
                class="btn secondary serp-check-btn"
                type="button"
                title="Check SERP rankings"
                data-keyword="${encodeURIComponent(f)}"
              >&#127760;</button>
            </td>
            <td>${b.found?'<span class="pill ok">Yes</span>':'<span class="pill no">No</span>'}</td>
            <td>${b.occurrencesTotal}</td>
            <td>${b.occurrencesByBucket.title}</td>
            <td>${b.occurrencesByBucket.meta}</td>
            <td>${b.occurrencesByBucket.h1}</td>
            <td>${b.occurrencesByBucket.h2}</td>
            <td>${b.occurrencesByBucket.h3}</td>
            <td>${b.occurrencesByBucket.body}</td>
          </tr>
        `},et=e.keywords.filter(f=>{const b=h.matches.find(L=>L.keyword===f);return b?b.found:!1}).map(f=>k(f)).join(""),B=e.keywords.filter(f=>{const b=h.matches.find(L=>L.keyword===f);return b?!b.found:!1}),kt=B.map(f=>`<li>${c(f)}</li>`).join(""),Lt=et.trim().length>0?et:'<tr><td colspan="8" class="hint">No matching keywords found.</td></tr>',Kt=h.warningMessage?`<p class="hint">Warning: ${c(h.warningMessage)}</p>`:"",Tt=h.previewText&&h.warningMessage?`<p class="hint">Preview: ${c(h.previewText)}...</p>`:"",Rt=h.type==="my-site"&&B.length>0?`
            <details class="missing-keywords">
              <summary class="btn secondary">Show missing keywords (${B.length})</summary>
              <ul>${kt}</ul>
            </details>
          `:"",xt=h.type==="my-site"?co():"";return`
        <div class="panel">
          <h3>${c(h.label)}</h3>
          <p class="hint">URL: ${c(h.url)}</p>
          <p class="hint">${fo(h)}</p>
          ${Kt}
          ${Tt}
          <table class="results-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Found</th>
                <th>Total</th>
                <th>Title</th>
                <th>Meta</th>
                <th>H1</th>
                <th>H2</th>
                <th>H3</th>
                <th>Body</th>
              </tr>
            </thead>
            <tbody>${Lt}</tbody>
          </table>
          ${xt}
          ${Rt}
        </div>
      `}).join("");const l=p("#content-structure-table");u.currentAnalysis?l.innerHTML=Kn(u.currentAnalysis):l.innerHTML="";const d=p("#faq-table");u.currentAnalysis?d.innerHTML=An(u.currentAnalysis):d.innerHTML="";const m=p("#reviews-table");u.currentAnalysis?m.innerHTML=Pn(u.currentAnalysis):m.innerHTML="";const g=p("#schema-table");u.currentAnalysis?g.innerHTML=Sn(u.currentAnalysis):g.innerHTML="";const y=p("#image-alt-table");u.currentAnalysis?y.innerHTML=Un(u.currentAnalysis):y.innerHTML="";const w=p("#video-embeds-table");u.currentAnalysis?w.innerHTML=Tn(u.currentAnalysis):w.innerHTML="";const C=p("#technical-checks-table");u.currentAnalysis?C.innerHTML=Ln(u.currentAnalysis):C.innerHTML="",Eo()}function Eo(){const t=p("#gap-content");if(!u.currentAnalysis){t.innerHTML='<p class="hint">No analysis yet.</p>';return}const e=gn(u.currentAnalysis);if(e.length===0){t.innerHTML='<p class="hint">No gap keywords found.</p>';return}t.innerHTML=e.map(n=>{const o=n.competitors.map(r=>`${c(r.label)} (${r.occurrences} in ${r.buckets.join(", ")})`).join("; ");return`
        <div class="group-item">
          <div class="group-info">
            <div class="group-name">${c(n.keyword)}</div>
            <div class="group-keywords">${c(o)}</div>
          </div>
        </div>
      `}).join("")}function wo(){if(!u.currentAnalysis){alert("No analysis to export.");return}const t=yn(u.currentAnalysis);fn(t,`keyword-analysis-${Date.now()}.html`)}function vo(){try{const t=document.getElementById("js-warning");t&&t.classList.add("hidden"),Zn()}catch(t){to(t)}}const dt=()=>vo();document.readyState==="loading"?document.addEventListener("DOMContentLoaded",dt):dt();
