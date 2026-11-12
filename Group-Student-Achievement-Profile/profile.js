// ---- Supabase config: Project Settings > API (URL + anon public key) ----
const SUPABASE_URL='https://xkyeuongogbvmpsvhehg.supabase.co',SUPABASE_ANON_KEY='sb_publishable_FiDoWnO2q4XG9tlYQ7jrUw_K1tnR34k';
// Students sign in with their 6-digit ID; it is mapped to this email domain for Supabase Auth.
const STUDENT_EMAIL_DOMAIN='students.africau.edu';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const names=new Proxy({},{get:(_,k)=>(S.users.find(u=>u.id===k)||{}).name||'Unknown student'});
const cats=['Academic','Leadership','Internship','Research','Competition','Community','Club or society','Professional development','Sports','Volunteering','Scholarship','Conference','Certification','Debate and public speaking','Entrepreneurship','Technical work','Pre-university'];
const purposes=['Master’s scholarship','Employment reference','Internship application','Postgraduate application','Leadership opportunity'];
const stepNames={requested:'Requested',drafting:'In progress',sent:'Sent'};
const icon={verified:'✓',sent:'✓',pending:'…',requested:'…',rejected:'✕',declined:'✕',drafting:'✎'};
const label={verified:'Verified',pending:'Awaiting endorsement',rejected:'Not endorsed',requested:'Requested',drafting:'In progress',sent:'Sent',declined:'Declined'};
const cvThemes=[['indigo','Indigo','#5145d2',[81,69,210]],['ocean','Ocean','#0c8096',[12,128,150]],['forest','Forest','#227852',[34,120,82]],['burgundy','Burgundy','#992d4b',[153,45,75]],['navy','Navy','#244a7c',[36,74,124]],['teal','Teal','#168c83',[22,140,131]],['emerald','Emerald','#16804a',[22,128,74]],['plum','Plum','#7546a8',[117,70,168]],['coral','Coral','#d45b4b',[212,91,75]],['amber','Amber','#b77913',[183,121,19]],['slate','Slate','#536579',[83,101,121]],['rose','Rose','#c04478',[192,68,120]]];
const cvLayouts=[['modern','Modern','A bold header with a clean, spacious layout.'],['classic','Classic','A traditional, refined document style.'],['compact','Compact','A neat layout that fits more on each page.'],['executive','Executive','A polished profile with a focused accent banner.'],['sidebar','Sidebar','A two-column design with contact details in a side rail.'],['academic','Academic','A formal, centered layout suited to academic CVs.']];
const uiIcons={
ach:'<path d="M5 3.5h14v17H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
add:'<path d="M12 5v14M5 12h14"/>',
req:'<path d="M7 3.5h10v17H7z"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3"/>',
prof:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
res:'<path d="M4 19.5h16M6.5 16V10m5.5 6V5m5.5 11v-4"/>',
priv:'<path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/>',
act:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
requests:'<path d="M4 5h16v12H8l-4 3z"/><path d="M8 9h8M8 13h5"/>',
endorse:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
in:'<path d="M4 12h16M14 6l6 6-6 6"/>',
up:'<path d="M12 5v14M5 12h14"/>',
all:'<path d="M4 6h16M4 12h16M4 18h16"/>',
verified:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
pending:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
rejected:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'
};
const uiIcon=name=>`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${uiIcons[name]||uiIcons.ach}</svg>`;
function D(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
let S={users:[],ach:[],reqs:[],log:[],drafts:{},skills:[],results:[],views:[]};
const nameOf=id=>(S.users.find(u=>u.id===id)||{}).name||'';
async function load(){
const [p,a,r,l,ac,sk,rs,pv]=await Promise.all([
sb.from('profiles').select('id,full_name,student_id,role,share_enabled,share_token,phone,backup_email,share_expires_at'),
sb.from('achievements').select('*').order('achieved_on',{ascending:false}),
sb.from('recommendation_requests').select('*'),
sb.from('letters').select('request_id,body,released'),
sb.from('activity').select('student_text,lecturer_text,created_at').order('created_at',{ascending:false}).limit(40),
sb.from('skills').select('*').order('kind'),sb.from('results').select('*').order('semester'),sb.from('profile_views').select('viewed_at').order('viewed_at',{ascending:false}).limit(20)]);
const bad=[p,a,r,l,ac,sk,rs,pv].find(x=>x.error);if(bad)throw bad.error;
S.users=p.data.map(x=>({id:x.id,role:x.role,name:x.full_name,login:x.student_id||'',share:x.share_enabled,token:x.share_token,phone:x.phone||'',backup:x.backup_email||'',exp:x.share_expires_at}));
S.ach=a.data.map(x=>({id:x.id,sid:x.student_id,cat:x.category,title:x.title,date:x.achieved_on,lid:x.lecturer_id,lvl:x.significance,file:x.evidence_path,shared:x.shared,ev:x.evidence||'',status:x.status,by:nameOf(x.endorsed_by),note:x.note||''}));
S.reqs=r.data.map(x=>({id:x.id,sid:x.student_id,lid:x.lecturer_id,purpose:x.purpose,due:x.due_on,status:x.status,note:x.decline_reason||'',kp:x.key_points||''}));
S.drafts=Object.fromEntries(l.data.map(x=>[x.request_id,x.body]));
S.rel=new Set(l.data.filter(x=>x.released).map(x=>x.request_id));S.skills=sk.data;S.results=rs.data;S.views=pv.data.map(x=>x.viewed_at);
const lec=user()?.role==='lecturer';
S.log=ac.data.map(x=>({t:lec?x.lecturer_text:x.student_text,at:x.created_at})).filter(x=>x.t)}
const fail=e=>say(e?.message?'Something went wrong: '+e.message:'Something went wrong. Try again.');
async function act(p,ok){const{error}=await p;if(error){fail(error);return false}await load();if(ok)say(ok);return true}
let dt,pd=null;
function queueDraft(id,body){pd={id,body};clearTimeout(dt);dt=setTimeout(flushDraft,800)}
async function flushDraft(){clearTimeout(dt);if(!pd)return;const d=pd;pd=null;const{error}=await sb.from('letters').upsert({request_id:d.id,body:d.body,updated_at:new Date().toISOString()});if(error)say('Draft couldn’t be saved: '+error.message)}
async function alertLecturer(kind,requestId){
try{
const{data,error}=await sb.functions.invoke('send-request-alert',{body:{kind,request_id:String(requestId)}});
if(error){const status=error.context?.status,reason=status===404?'The email alert service has not been deployed in Supabase yet.':status===503?'Email alerts are not configured in Supabase yet.':error.message;say('Request was saved, but the email alert could not be sent: '+reason);return}
say(data?.sent?'Request submitted and email alert sent to the lecturer.':'Request submitted; the email alert was already sent.');
}catch(error){say('Request was saved, but the email alert could not be sent: '+(error?.message||'Try again later.'))}
}
let ready=false,pub=null,me=null,stab='ach',auth='in',authErr='',authVal={},ltab='requests',rf='all',sf='all',open=null,modal=null,mobileNavOpen=false,cvTemplate='modern',cvTheme='indigo';
const user=()=>S.users.find(u=>u.id===me);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=d=>new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const fmtAt=t=>new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const left=d=>Math.round((new Date(d+'T00:00')-new Date().setHours(0,0,0,0))/864e5);
const badge=s=>`<span class="badge ${s}"><span aria-hidden="true">${icon[s]}</span>${label[s]}</span>`;
let tt;function say(m){const t=document.getElementById('toast');t.textContent=m;clearTimeout(tt);tt=setTimeout(()=>t.textContent='',3200)}
function dueText(r){if(r.status==='sent'||r.status==='declined')return 'Was due '+fmt(r.due);const n=left(r.due);return n<0?`<span class="late">Overdue by ${-n} day${n===-1?'':'s'}</span>`:n===0?'<span class="late">Due today</span>':`Due ${fmt(r.due)} (${n} day${n===1?'':'s'})`}
async function copy(t){try{await navigator.clipboard.writeText(t);say('Copied')}catch(_){const x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();try{document.execCommand('copy');say('Copied')}catch(__){say('Copy isn’t available here')}x.remove()}}
const verified=sid=>S.ach.filter(a=>a.sid===sid&&a.status==='verified');
const shareUrl=()=>location.href.split('#')[0].split('?')[0]+'?p='+user().token;

function achItem(a,extra=''){
const n=a.note?`<p class="note"><b>${a.status==='rejected'?'Reason':'Note'}:</b> ${esc(a.note)}</p>`:'';
const by=a.status==='verified'&&a.by?` · Endorsed by ${esc(a.by)}`:a.status==='pending'&&a.lid?` · Sent to ${esc(nameOf(a.lid))}`:'';
const lv=a.lvl?` · ${a.lvl[0].toUpperCase()+a.lvl.slice(1)} recognition`:'',fl=a.file?` · <button class="btn" data-act="file" data-v="${esc(a.file)}" style="min-height:32px;padding:.1rem .6rem">View file</button>`:'';
return `<li class="item" id="achievement-${esc(a.id)}"><div class="row"><h3>${esc(a.title)}</h3>${badge(a.status)}</div><p class="meta">${esc(a.cat)} · ${fmt(a.date)} · Evidence: ${esc(a.ev||'none given')}${by}${lv}${fl}</p>${n}${extra}</li>`}
const feedHTML=rows=>`<ul class="list feed">${rows.map(l=>`<li class="item"><p class="meta" style="margin:0">${fmtAt(l.at)}</p>${esc(l.t)}</li>`).join('')||'<li class="empty">No activity yet.</li>'}</ul>`;

function student(){
const u=user(),mine=S.ach.filter(a=>a.sid===me),c=s=>mine.filter(x=>x.status===s).length;
const myReqs=S.reqs.filter(r=>r.sid===me),on=u.share;
const ini=u.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const head=`<div class="profile"><div class="avatar" aria-hidden="true">${esc(ini)}</div><div><h1>${esc(u.name)}</h1><p class="sub" style="margin:0">BSc Software Engineering · Student ID ${esc(u.login)}</p><p class="sub" style="margin:.3rem 0 0"><b>${c('verified')}</b> verified · <b>${c('pending')}</b> awaiting endorsement · <b>${myReqs.length}</b> request${myReqs.length===1?'':'s'}</p></div></div>`;
let body='';
if(stab==='ach'){
const shown=sf==='all'?mine:mine.filter(a=>a.status===sf);
const fl=[['all','All'],['verified','Verified'],['pending','Awaiting'],['rejected','Not endorsed']];
const itm=a=>achItem(a,a.status==='pending'?`<div class="actions"><button class="btn" data-act="withdraw" data-id="${a.id}">Withdraw claim</button></div>`:a.status==='rejected'?`<div class="actions"><button class="btn primary" data-act="resubmit" data-id="${a.id}">Resubmit for endorsement</button><button class="btn" data-act="withdraw" data-id="${a.id}">Remove</button></div>`:a.status==='verified'?`<div class="actions"><button class="btn" data-act="tshare" data-id="${a.id}" data-v="${a.shared?0:1}">${a.shared?'Hide from shared profile':'Include in shared profile'}</button></div>`:'');
const groups=cats.map(cn=>[cn,shown.filter(a=>a.cat===cn).sort((x,y)=>x.date<y.date?1:-1)]).filter(g=>g[1].length);
body=`<section class="panel hl" aria-labelledby="h-a"><h2 id="h-a">My achievements</h2>
<div class="tabs" role="tablist" aria-label="Filter achievements">${fl.map(f=>`<button role="tab" aria-selected="${sf===f[0]}" data-act="sf" data-v="${f[0]}">${uiIcon(f[0])}<span>${f[1]}</span></button>`).join('')}</div>
${groups.map(g=>`<h3 class="cat">${g[0]}<span class="count">${g[1].length}</span></h3><ul class="list timeline">${g[1].map(itm).join('')}</ul>`).join('')||(mine.length?'<div class="empty">Nothing matches this filter.</div>':'<div class="empty"><p>No achievements yet. Record your first one so a lecturer can endorse it.</p><button class="btn main" data-act="snav" data-v="add">Add an achievement</button></div>')}</section>`}
else if(stab==='add'){
body=`<section class="panel" aria-labelledby="h-add"><h2 id="h-add">Add an achievement</h2><p class="sub">The lecturer you choose must endorse it before it counts as verified, and only that lecturer sees it until then. You can withdraw a claim but not edit it.</p>
<form id="addForm"><label for="c">Category</label><select id="c" name="cat">${cats.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="al">Lecturer who will endorse it</label><select id="al" name="lid" required>${S.users.filter(x=>x.role==='lecturer').map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
<label for="t">What did you do?</label><input id="t" name="title" type="text" required maxlength="120">
<label for="d">Date</label><input id="d" name="date" type="date" required max="${D(0)}">
<label for="e">Evidence or who can confirm it</label><input id="e" name="ev" type="text" maxlength="120">
<label for="ef">Evidence file (PDF, PNG or JPG, up to 5 MB)</label><input id="ef" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg">
<label for="sg">Level of recognition (for reporting only)</label><select id="sg" name="sg"><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="major">Major</option></select>
<p></p><button class="btn main" type="submit">Submit for endorsement</button></form></section>`}
else if(stab==='req'){
body=`<section class="panel" aria-labelledby="h-r"><h2 id="h-r">Request a recommendation</h2><p class="sub">Choose who you’d like to write it. They see only your verified achievements.</p>
<form id="reqForm"><label for="lc">Lecturer</label><select id="lc" name="lid">${S.users.filter(x=>x.role==='lecturer').map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
<label for="p">What is it for?</label><select id="p" name="purpose">${purposes.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="kp">Key points you’d like included (optional)</label><textarea id="kp" name="kp" maxlength="500" style="min-height:90px"></textarea>
<label for="rd">Needed by</label><input id="rd" name="due" type="date" required min="${D(0)}">
<p></p><button class="btn main" type="submit">Send request</button></form></section>
<section class="panel" style="margin-top:1.5rem" aria-labelledby="h-mr"><h2 id="h-mr">My requests</h2><ul class="list">${myReqs.map(r=>`<li class="item"><div class="row"><h3>${esc(r.purpose)}</h3>${badge(r.status)}</div><p class="meta">${dueText(r)} · Lecturer: ${esc(names[r.lid])}</p>${r.status==='declined'?`<p class="note"><b>Reason:</b> ${esc(r.note)}</p>`:`<ol class="stepper" aria-label="Progress">${Object.keys(stepNames).map((k,i)=>{const cur=Object.keys(stepNames).indexOf(r.status),st=r.status==='sent'||i<cur?'done':i===cur?'now':'';return `<li class="${st}"${st==='now'?' aria-current="step"':''}>${stepNames[k]}</li>`}).join('')}</ol>`}${r.status==='sent'?(S.rel?.has(r.id)?`<div class="actions" style="margin-top:.6rem"><button class="btn primary" data-act="viewletter" data-id="${r.id}">View letter</button></div>`:'<p class="meta" style="margin-top:.6rem">The lecturer sent this letter directly and didn’t release a copy to you.</p>'):`<div class="actions" style="margin-top:.6rem"><button class="btn" data-act="cancelreq" data-id="${r.id}">${r.status==='declined'?'Remove':'Cancel request'}</button></div>`}</li>`).join('')||'<li class="empty">No requests yet. Use the form above to ask a lecturer.</li>'}</ul></section>`}
else if(stab==='prof'){
body=`<section class="panel" aria-labelledby="h-pf"><h2 id="h-pf">Contact details</h2><p class="sub">Your name, student ID and programme are locked. You can update how people reach you.</p>
<form id="contactForm"><label for="pn">Phone</label><input id="pn" name="phone" type="text" maxlength="30" value="${esc(u.phone)}"><label for="be">Personal backup email (for use after graduation)</label><input id="be" name="backup" type="text" maxlength="120" value="${esc(u.backup)}"><p></p><button class="btn main" type="submit">Save contact details</button></form></section>
<section class="panel" style="margin-top:1.5rem"><h2>Skills</h2><ul class="list">${S.skills.map(x=>`<li class="item"><div class="row"><span><b>${esc(x.name)}</b> · ${x.kind}${x.level?' · '+x.level:''}</span><button class="btn" data-act="delskill" data-id="${x.id}">Remove</button></div></li>`).join('')||'<li class="empty">No skills yet.</li>'}</ul>
<form id="skillForm"><label for="sn">Skill</label><input id="sn" name="name" type="text" required maxlength="60"><label for="sk">Type</label><select id="sk" name="kind"><option>Technical</option><option>Language</option></select><label for="sl">Level</label><select id="sl" name="level"><option>Basic</option><option>Good</option><option>Fluent or expert</option></select><p></p><button class="btn primary" type="submit">Add skill</button></form></section>
<section class="panel" style="margin-top:1.5rem"><h2>CV</h2><p class="sub">Choose a layout and color theme for a PDF built from your verified achievements and skills.</p>
<fieldset class="cv-template-fieldset"><legend>Choose a CV layout</legend><div class="cv-template-grid" style="--cv-preview-accent:${cvThemes.find(x=>x[0]===cvTheme)?.[2]||cvThemes[0][2]}">${cvLayouts.map(([id,title,desc])=>`<button type="button" class="cv-template ${cvTemplate===id?'selected':''}" data-act="cvtemplate" data-v="${id}" aria-pressed="${cvTemplate===id}"><span class="cv-preview ${id}" aria-hidden="true"><span class="cv-sheet"><span class="cv-sample-head"></span><span class="cv-sample-title"></span><span class="cv-sample-line"></span><span class="cv-sample-line short"></span><span class="cv-sample-section"></span><span class="cv-sample-line"></span><span class="cv-sample-line"></span><span class="cv-sample-section"></span><span class="cv-sample-line short"></span></span></span><span class="cv-template-copy"><b>${title}</b><span>${desc}</span></span></button>`).join('')}</div></fieldset>
<fieldset class="cv-color-fieldset"><legend>Color theme <span>${cvThemes.find(x=>x[0]===cvTheme)?.[1]||'Indigo'}</span></legend><div class="cv-color-swatches" role="group" aria-label="CV color themes">${cvThemes.map(([id,name,hex])=>`<button type="button" class="cv-color-swatch ${cvTheme===id?'selected':''}" style="--swatch:${hex}" data-act="cvtheme" data-v="${id}" aria-label="${name} color theme" title="${name}" aria-pressed="${cvTheme===id}"></button>`).join('')}</div></fieldset>
<div class="actions" style="margin-top:1rem"><button class="btn main" data-act="cv">Generate PDF</button></div></section>`}
else if(stab==='res'){body=`<section class="panel" aria-labelledby="h-rs"><h2 id="h-rs">My results</h2><p class="sub">Read-only. Results are imported by the Academic Records Office.</p><ul class="list">${S.results.map(x=>`<li class="item"><div class="row"><span><b>${esc(x.course_code)}</b> ${esc(x.course_name)}<br><span class="meta">${esc(x.semester)}</span></span><b>${esc(x.grade)}</b></div></li>`).join('')||'<li class="empty">No results have been imported yet.</li>'}</ul></section>`}
else if(stab==='priv'){
body=`<section class="panel" aria-labelledby="h-p"><h2 id="h-p">Privacy and sharing</h2><div class="toggle"><input type="checkbox" id="sh" data-act="share" ${on?'checked':''}><label for="sh">Let employers and scholarship providers check my verified achievements with a link I share.</label></div>
<p class="meta" style="margin-top:.6rem">${on?'Sharing is on. Only verified achievements are visible.':'Sharing is off. Only you and your recommendation writers can see your record.'}</p>
<label for="ex">Link expiry</label><select id="ex" data-act="exp"><option value="x">Change expiry…</option><option value="0">Never expires</option><option value="7">In 7 days</option><option value="30">In 30 days</option><option value="90">In 90 days</option></select>${u.exp?`<p class="meta">Current link expires ${fmtAt(u.exp)}.</p>`:''}
<p class="meta"><b>${S.views.length}</b> recent view${S.views.length===1?'':'s'} of your shared profile${S.views[0]?', latest '+fmtAt(S.views[0]):''}.</p>
<div class="actions"><button class="btn primary" data-act="preview">Preview shared profile</button><button class="btn" data-act="newlink">Cancel old link, make a new one</button><button class="btn" data-act="copysum">Copy profile summary</button><button class="btn" data-act="print">Print</button></div></section>`}
else{body=`<section class="panel" aria-labelledby="h-f"><h2 id="h-f">Recent activity</h2>${feedHTML(S.log.slice(0,10))}</section>`}
return head+body}

function draftFor(r){const vs=verified(r.sid);
return `Dear Selection Committee,\n\nI am pleased to support ${names[r.sid]}’s application for a ${r.purpose.toLowerCase()}.\n\nThe university’s verified record shows the following:\n${vs.map(a=>`- ${a.title} (${a.cat}, ${fmt(a.date)})`).join('\n')||'- No verified achievements yet.'}\n\n[Add your own observations of ${names[r.sid].split(' ')[0]}’s work and conduct here.]\n\nYours faithfully,\n${user().name}\nDepartment of AI, Software Engineering and Computer Science\nCredify`}

function lecturer(){
const RQ=S.reqs.filter(r=>r.lid===me),pend=S.ach.filter(a=>a.status==='pending'&&a.lid===me),openR=RQ.filter(r=>r.status==='requested'||r.status==='drafting');
const soon=openR.filter(r=>left(r.due)<=7).length;
let body='';
if(ltab==='requests'){
const list=RQ.filter(r=>rf==='all'||r.status===rf).sort((a,b)=>a.due<b.due?-1:1);
const sel=RQ.find(r=>r.id===open);
body=`<div style="max-width:260px"><label for="rf" style="margin-top:0">Show</label><select id="rf" data-act="rf">${[['all','All requests'],['requested','Requested'],['drafting','In progress'],['sent','Sent'],['declined','Declined']].map(o=>`<option value="${o[0]}" ${rf===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
<ul class="list" style="margin-top:1rem">${list.map(r=>`<li class="item${(r.status==='requested'||r.status==='drafting')&&left(r.due)<=7?' urgent':''}"><div class="row"><div class="who"><span class="avatar sm" aria-hidden="true">${ini(names[r.sid])}</span><div><h3>${names[r.sid]}</h3><p class="meta" style="margin:0">${esc(r.purpose)}</p></div></div>${badge(r.status)}</div><p class="meta" style="margin-top:.5rem"><b>${dueText(r)}</b> · ${verified(r.sid).length} verified achievements on record</p><div class="actions"><button class="btn ${r.status==='requested'||r.status==='drafting'?'primary':''}" data-act="open" data-id="${r.id}">${r.status==='sent'?'View letter':r.status==='declined'?'View record':'Open record and draft'}</button></div></li>`).join('')||'<li class="empty">No requests match this filter.</li>'}</ul>`;
if(sel){const sa=S.ach.filter(a=>a.sid===sel.sid&&a.status==='verified'),ro=sel.status==='sent'||sel.status==='declined';
body+=`<section class="panel hl" style="margin-top:1.5rem" aria-labelledby="h-d"><div class="row"><h2 id="h-d" style="border:0;margin:0;padding:0">${names[sel.sid]}: ${esc(sel.purpose)}</h2><button class="btn" data-act="close">Close</button></div>
<div class="grid" style="margin-top:1rem"><div>${sel.kp?`<p class="note"><b>Student’s key points:</b> ${esc(sel.kp)}</p>`:''}<h3 style="margin-top:0">Record</h3><ul class="list">${sa.map(a=>achItem(a)).join('')}</ul></div>
<div><h3 style="margin-top:0">Draft letter</h3><label for="dr" style="position:absolute;left:-9999px">Letter text</label><textarea id="dr" class="draft" ${ro?'readonly':''}>${esc(S.drafts[sel.id]||draftFor(sel))}</textarea>
${ro?'':`<div class="toggle"><input type="checkbox" id="rel"><label for="rel">Release a copy to the student when I mark it as sent</label></div>`}<div class="actions" style="margin-top:.6rem"><button class="btn" data-act="copy">Copy text</button>${sel.status==='sent'?`<button class="btn ${S.rel.has(sel.id)?'':'main'}" data-act="release" data-id="${sel.id}" data-v="${S.rel.has(sel.id)?0:1}">${S.rel.has(sel.id)?'Withdraw from student':'Release to student'}</button>`:''}${ro?'':`<button class="btn" data-act="regen" data-id="${sel.id}">Reset draft</button><button class="btn danger" data-act="declineR" data-id="${sel.id}">Decline request</button><button class="btn main" data-act="sent" data-id="${sel.id}">Mark as sent</button>`}</div>
<p class="meta" style="margin-top:.6rem">${sel.status==='sent'?(S.rel.has(sel.id)?'You released a copy of this letter to the student.':'This letter was not released to the student.'):sel.status==='declined'?'You declined this request.':'Only verified achievements are added to the draft. Edits save automatically.'}</p></div></div></section>`}
}else if(ltab==='endorse'){
body=`<ul class="list">${pend.map(a=>achItem(a,`<p class="meta who"><span class="avatar sm" aria-hidden="true">${ini(names[a.sid])}</span><span><b>${names[a.sid]}</b> submitted this for endorsement.</span></p><div class="actions"><button class="btn primary" data-act="endorse" data-id="${a.id}">Endorse</button><button class="btn danger" data-act="declineA" data-id="${a.id}">Decline</button></div>`)).join('')||'<li class="empty">Nothing waiting. New claims from students appear here.</li>'}</ul>`}else{body=`<section class="panel" aria-labelledby="h-l"><h2 id="h-l">Recent activity</h2>${feedHTML(S.log.slice(0,10))}</section>`}
return `<h1>Lecturer dashboard</h1><p class="sub">${esc(user().name)}, Software Engineering.</p>
<div class="stats"><div class="stat gold"><b>${openR.length}</b>Open requests</div><div class="stat"><b>${soon}</b>Due within 7 days</div><div class="stat"><b>${pend.length}</b>Claims to endorse</div></div>
${body}`}

function modalHTML(){const m=modal;
if(m.type==='share'){const vs=verified(me).filter(a=>a.shared);
return `<h2>Shared profile preview</h2><p class="sub">This is what an employer sees when you share your link.</p>`+(user().share?`<div class="panel"><h3 style="margin:0">${names[me]}</h3><p class="meta">BSc Software Engineering, Credify</p><ul class="list">${vs.map(a=>`<li class="item"><h3>${esc(a.title)}</h3><p class="meta">${esc(a.cat)} · ${fmt(a.date)} · Verified by ${esc(a.by)}</p></li>`).join('')||'<li class="empty">No verified achievements yet.</li>'}</ul></div><p class="meta">${shareUrl(me)}</p><div class="actions"><button class="btn primary" data-act="copylink">Copy link</button><button class="btn" data-act="mclose">Close</button></div>`:`<p class="empty">Sharing is off, so employers can’t see anything. Turn it on under Privacy and sharing.</p><div class="actions"><button class="btn" data-act="mclose">Close</button></div>`)}
if(m.type==='letter'){const r=S.reqs.find(x=>x.id===m.id);return `<h2>Recommendation letter</h2><p class="sub">From ${esc(names[r.lid])}, for ${esc(r.purpose.toLowerCase())}.</p><pre class="note" style="white-space:pre-wrap;font:inherit">${esc(S.drafts[m.id]||'')}</pre><div class="actions"><button class="btn main" data-act="pdfletter" data-id="${m.id}">Download PDF</button><button class="btn" data-act="copyletter" data-id="${m.id}">Copy</button><button class="btn" data-act="printletter" data-id="${m.id}">Print</button><button class="btn" data-act="mclose">Close</button></div>`}
const req=m.type==='declineR',a=(req?S.reqs:S.ach).find(x=>x.id===m.id),must=m.type!=='endorse';
const title=m.type==='endorse'?`Endorse “${esc(a.title)}”`:req?`Decline request from ${names[a.sid]}`:`Decline “${esc(a.title)}”`;
return `<h2>${title}</h2><form id="mForm"><label for="note" style="margin-top:0">${must?'Reason for the student (required)':'Note for the student (optional)'}</label><textarea id="note" name="note" style="min-height:110px" maxlength="300" ${must?'required':''}></textarea><div class="actions" style="margin-top:.9rem"><button class="btn ${must?'danger':'main'}" type="submit">${m.type==='endorse'?'Confirm endorsement':'Confirm decline'}</button><button class="btn" type="button" data-act="mclose">Cancel</button></div></form>`}

const dlg=document.createElement('dialog');dlg.id='dlg';document.body.appendChild(dlg);
dlg.addEventListener('close',()=>{modal=null});
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
let revealObserver;
function initScrollReveal(){
revealObserver?.disconnect();
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const targets=document.querySelectorAll('#app .panel,#app h1,#app h2,#app h3,#app p,#app .tabs,#app .stat,#app .item,#app .empty');
targets.forEach(el=>el.classList.add('scroll-reveal'));
revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)),{threshold:0.08,rootMargin:'0px 0px -24px 0px'});
targets.forEach(el=>revealObserver.observe(el))}
function render(){const u=user();
document.getElementById('who').innerHTML=u?`<span><b>${esc(u.name)}</b> · ${u.role==='lecturer'?'Lecturer':'Student'}</span><button class="btn" data-act="logout" style="min-height:40px;padding:.3rem .9rem">Sign out</button>`:'';
const mobileNav=document.getElementById('mobileNavToggle');
mobileNav.hidden=!u;
mobileNav.setAttribute('aria-expanded',String(mobileNavOpen));
mobileNav.setAttribute('aria-label',mobileNavOpen?'Close navigation menu':'Open navigation menu');
const subnav=document.getElementById('subnav');
subnav.innerHTML=u?navHTML(u):'';
subnav.classList.toggle('mobile-open',mobileNavOpen&&Boolean(u));
document.getElementById('app').innerHTML=!ready?'<p class="sub">Loading…</p>':pub?publicHTML():!u?loginPage():u.role==='student'?student():lecturer();
initScrollReveal();
if(u&&modal){dlg.innerHTML=modalHTML();if(!dlg.open)dlg.showModal()}else if(dlg.open)dlg.close()}

document.addEventListener('click',async e=>{
const b=e.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.act,id=+b.dataset.id;
if(a==='mobilenav'){mobileNavOpen=!mobileNavOpen;render();return}
const rq=()=>S.reqs.find(x=>x.id===id),role=user()?.role;
const LA=['ltab','open','close','sent','regen','endorse','declineA','declineR','copy','release'],SA=['snav','sf','withdraw','resubmit','cancelreq','share','preview','viewletter','pdfletter','copyletter','printletter','tshare','newlink','delskill','cv','cvtemplate','cvtheme','copylink','copysum','print'];
if(!role&&a!=='auth')return;
if((LA.includes(a)&&role!=='lecturer')||(SA.includes(a)&&role!=='student'))return;
if(['open','sent','regen','declineR','release'].includes(a)&&rq()?.lid!==me)return;
try{await flushDraft();
if(a==='auth'){auth=b.dataset.v;authErr=''}
else if(a==='logout'){await sb.auth.signOut();resetUI();say('Signed out')}
else if(a==='share'){const on=b.checked;await act(sb.from('profiles').update({share_enabled:on}).eq('id',me),on?'Sharing turned on':'Sharing turned off')}
else if(a==='sf')sf=b.dataset.v;
else if(a==='cvtemplate')cvTemplate=b.dataset.v;
else if(a==='cvtheme')cvTheme=b.dataset.v;
else if(a==='snav'){stab=b.dataset.v;mobileNavOpen=false}
else if(a==='ltab'){ltab=b.dataset.v;open=null;mobileNavOpen=false}
else if(a==='open'){open=id;if(rq().status==='requested')await act(sb.from('recommendation_requests').update({status:'drafting'}).eq('id',id))}
else if(a==='close')open=null;
else if(a==='withdraw')await act(sb.from('achievements').delete().eq('id',id),'Claim removed');
else if(a==='resubmit')await act(sb.from('achievements').update({status:'pending',endorsed_by:null,note:null}).eq('id',id),'Resubmitted for endorsement');
else if(a==='cancelreq'){await act(sb.from('recommendation_requests').delete().eq('id',id),'Request removed');if(open===id)open=null}
else if(a==='tshare')await act(sb.rpc('set_achievement_shared',{p_id:id,p_shared:b.dataset.v==='1'}),b.dataset.v==='1'?'Included in shared profile':'Hidden from shared profile');
else if(a==='newlink')await act(sb.from('profiles').update({share_token:crypto.randomUUID()}).eq('id',me),'New link created. The old link no longer works');
else if(a==='delskill')await act(sb.from('skills').delete().eq('id',id),'Skill removed');
else if(a==='file'){const w=window.open('','_blank');const{data,error}=await sb.storage.from('evidence').createSignedUrl(b.dataset.v,120);if(error){w?.close();throw error}if(w)w.location=data.signedUrl;else say('Allow pop-ups to open the file');return}
else if(a==='cv'){openCV();return}
else if(a==='release')await act(sb.rpc('set_letter_released',{p_request:id,p_released:b.dataset.v==='1'}),b.dataset.v==='1'?'Letter released to the student':'Letter withdrawn from the student');
else if(a==='viewletter')modal={type:'letter',id};
else if(a==='pdfletter'){if(!window.jspdf){say('The PDF tool didn’t load. Check your connection and reload.');return}letterPDF(id);return}
else if(a==='copyletter'){copy(S.drafts[id]||'');return}
else if(a==='printletter'){const w=window.open('','_blank');if(!w){say('Allow pop-ups to print');return}w.document.write('<!doctype html><meta charset="utf-8"><title>Recommendation letter</title><pre style="font:16px/1.6 Georgia,serif;white-space:pre-wrap;max-width:700px;margin:2rem auto">'+esc(S.drafts[id]||'')+'</pre>');w.document.close();w.print();return}
else if(a==='preview')modal={type:'share'};
else if(a==='copylink'){copy(shareUrl());return}
else if(a==='copysum'){copy(`${names[me]}, BSc Software Engineering, Credify\nVerified achievements:\n`+(verified(me).map(x=>`- ${x.title} (${x.cat}, ${fmt(x.date)}), verified by ${x.by}`).join('\n')||'- None yet'));return}
else if(a==='print'){try{window.print()}catch(_){say('Printing isn’t available here')}return}
else if(a==='copy'){copy(document.getElementById('dr').value);return}
else if(a==='regen'){S.drafts[id]=draftFor(rq());queueDraft(id,S.drafts[id]);await flushDraft();say('Draft reset to the verified record')}
else if(a==='sent'){const body=document.getElementById('dr').value,now=new Date().toISOString();
const{error}=await sb.from('letters').upsert({request_id:id,body,released:!!document.getElementById('rel')?.checked,updated_at:now});if(error)throw error;
await act(sb.from('recommendation_requests').update({status:'sent',sent_at:now}).eq('id',id),'Marked as sent. The student can see this.')}
else if(a==='endorse')await act(sb.from('achievements').update({status:'verified',endorsed_by:me,note:null}).eq('id',id),'Endorsed “'+S.ach.find(x=>x.id===id)?.title+'”');
else if(a==='declineA')modal={type:'declineA',id};
else if(a==='declineR')modal={type:'declineR',id};
else if(a==='mclose'){modal=null;dlg.close();return}
}catch(err){fail(err)}
render();
if(a==='open')document.getElementById('h-d')?.scrollIntoView({block:'start'})});

document.addEventListener('change',async e=>{const a=e.target.dataset?.act;
if(a==='rf'){rf=e.target.value;render()}
else if(a==='exp'&&e.target.value!=='x'){const d=+e.target.value;try{await act(sb.from('profiles').update({share_expires_at:d?new Date(Date.now()+d*864e5).toISOString():null}).eq('id',me),d?'Link will expire in '+d+' days':'Link no longer expires')}catch(err){fail(err)}render()}});

document.addEventListener('submit',async e=>{e.preventDefault();const id=e.target.id,f=new FormData(e.target);
if(id==='loginForm'){doLogin(f);return}
if(id==='regForm'){doReg(f);return}
if(!user())return;
try{
if(id==='addForm'){const title=f.get('title').trim(),date=f.get('date'),file=f.get('file');
if(S.ach.some(x=>x.sid===me&&x.title.toLowerCase()===title.toLowerCase()&&x.date===date)&&!confirm('You already have an achievement with this title and date. Add it anyway?'))return;
let path=null;
if(file&&file.size){if(file.size>5242880){say('That file is over 5 MB.');return}
path=me+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^\w.\-]/g,'_');
const up=await sb.storage.from('evidence').upload(path,file,{contentType:file.type});if(up.error)throw up.error}
const lecturerId=f.get('lid'),{data,error}=await sb.from('achievements').insert({lecturer_id:lecturerId,category:f.get('cat'),title,achieved_on:date,evidence:f.get('ev').trim()||null,significance:f.get('sg'),evidence_path:path}).select('id').single();
if(error)throw error;
await load();stab='ach';render();say('Submitted for endorsement');await alertLecturer('verification',data.id);return}
else if(id==='contactForm')await act(sb.from('profiles').update({phone:f.get('phone').trim()||null,backup_email:f.get('backup').trim()||null}).eq('id',me),'Contact details saved');
else if(id==='skillForm'){if(await act(sb.from('skills').insert({name:f.get('name').trim(),kind:f.get('kind'),level:f.get('level')}),'Skill added'))e.target.reset()}
else if(id==='reqForm'){const lec=S.users.find(u=>u.id===f.get('lid')&&u.role==='lecturer');if(!lec)return;
const{data,error}=await sb.from('recommendation_requests').insert({lecturer_id:lec.id,purpose:f.get('purpose'),due_on:f.get('due'),key_points:f.get('kp').trim()||null}).select('id').single();
if(error)throw error;
await load();render();say('Request sent to '+lec.name);await alertLecturer('recommendation',data.id);return}
else if(id==='mForm'){const note=f.get('note').trim(),m=modal;let ok;
if(m.type==='declineR')ok=await act(sb.from('recommendation_requests').update({status:'declined',decline_reason:note}).eq('id',m.id),'Request declined');
else if(m.type==='endorse')ok=await act(sb.from('achievements').update({status:'verified',endorsed_by:me,note:note||null}).eq('id',m.id),'Achievement endorsed');
else ok=await act(sb.from('achievements').update({status:'rejected',endorsed_by:me,note}).eq('id',m.id),'Achievement declined');
if(ok){modal=null;dlg.close()}}
}catch(err){fail(err)}
render()});

document.addEventListener('input',e=>{if(e.target.classList.contains('draft')){S.drafts[open]=e.target.value;queueDraft(open,e.target.value)}});

const toEmail=s=>/^\d{6}$/.test(s)?s+'@'+STUDENT_EMAIL_DOMAIN:s.toLowerCase();
function resetUI(){me=null;stab='ach';open=null;modal=null;sf='all';ltab='requests';rf='all';auth='in';authErr='';authVal={};S={users:[],ach:[],reqs:[],log:[],drafts:{},skills:[],results:[],views:[]}}
async function enter(id,quiet){me=id;
try{await load()}catch(e){await sb.auth.signOut();resetUI();authErr='Couldn’t load your data: '+e.message;render();return}
const u=user();if(!u){await sb.auth.signOut();resetUI();authErr='No profile was found for this account.';render();return}
stab='ach';sf='all';ltab='requests';rf='all';open=null;authErr='';authVal={};
const params=new URLSearchParams(location.search),alertKind=params.get('alert'),alertId=params.get('request_id');
if(u.role==='lecturer'&&alertId&&alertKind==='recommendation'){
const request=S.reqs.find(r=>String(r.id)===alertId&&r.lid===id);
if(request)open=request.id
}else if(u.role==='lecturer'&&alertId&&alertKind==='verification'){
const achievement=S.ach.find(a=>String(a.id)===alertId&&a.lid===id&&a.status==='pending');
if(achievement)ltab='endorse'
}
render();
if(ltab==='endorse'&&alertId&&alertKind==='verification')requestAnimationFrame(()=>document.getElementById('achievement-'+CSS.escape(alertId))?.scrollIntoView({behavior:'smooth',block:'center'}));
if(!quiet)say('Signed in as '+u.name)}
async function doLogin(f){const raw=f.get('login').trim();
const{data,error}=await sb.auth.signInWithPassword({email:toEmail(raw),password:f.get('pw')});
if(error){authVal={login:raw};authErr='Incorrect ID or password. Check both and try again.';render();return}
await enter(data.user.id)}
async function doReg(f){const name=f.get('name').trim(),sid=f.get('sid').trim(),pw=f.get('pw');authVal={name,sid};
if(!/^\d{6}$/.test(sid))authErr='Enter your 6-digit student ID.';
else if(pw.length<8)authErr='Use a password with at least 8 characters.';
else if(pw!==f.get('pw2'))authErr='The two passwords don’t match.';
else authErr='';
if(authErr){render();return}
const{data,error}=await sb.auth.signUp({email:toEmail(sid),password:pw,options:{data:{full_name:name,student_id:sid}}});
if(error){authErr=/database error|already|registered/i.test(error.message)?'An account with this student ID already exists. Sign in instead.':error.message;render();return}
if(!data.session){authErr='Account created, but email confirmation is switched on in Supabase, so you can’t sign in yet.';render();return}
await enter(data.user.id)}
function publicHTML(){const d=pub.data;
if(!d)return `<div class="authwrap"><section class="panel"><h2>Profile not available</h2><p class="sub">This link is switched off or doesn’t exist.</p></section></div>`;
return `<section class="panel hl" aria-labelledby="h-pub"><h1 id="h-pub">${esc(d.name)}</h1><p class="meta">Verified achievements, Credify</p><ul class="list">${(d.achievements||[]).map(a=>`<li class="item"><h3>${esc(a.title)}</h3><p class="meta">${esc(a.category)} · ${fmt(a.date)} · Verified by ${esc(a.verified_by||'the university')}</p></li>`).join('')||'<li class="empty">No verified achievements yet.</li>'}</ul>${(d.skills||[]).length?`<h3 class="cat">Skills</h3><ul class="list">${d.skills.map(x=>`<li class="item">${esc(x.name)} · ${esc(x.kind)}${x.level?' · '+esc(x.level):''}</li>`).join('')}</ul>`:''}</section>`}
function loginPage(){const up=auth==='up',v=authVal;
return `<div class="authwrap"><div class="hero"><div class="mark" aria-hidden="true">C</div><h1>Keep a verified record of your university achievements</h1><p class="sub">Students record what they’ve done. Lecturers endorse it and write recommendations from the evidence.</p></div>
<section class="panel hl" aria-labelledby="h-au"><h2 id="h-au">${up?'Create a student account':'Sign in'}</h2>
<p class="sub">${up?'Lecturer accounts are set up by the university.':'Students and lecturers sign in here. You’ll see the view for your role.'}</p>
<div class="tabs" role="tablist"><button role="tab" aria-selected="${!up}" data-act="auth" data-v="in">${uiIcon('in')}<span>Sign in</span></button><button role="tab" aria-selected="${up}" data-act="auth" data-v="up">${uiIcon('up')}<span>Create student account</span></button></div>
${authErr?`<p class="note" role="alert" style="border-left-color:var(--bad);color:var(--bad)"><b>${esc(authErr)}</b></p>`:''}
${up?`<form id="regForm"><label for="rn">Full name</label><input id="rn" name="name" type="text" required maxlength="80" autocomplete="name" value="${esc(v.name)}">
<label for="rs">Student ID (6 digits)</label><input id="rs" name="sid" type="text" required inputmode="numeric" maxlength="6" value="${esc(v.sid)}">
<label for="rp">Password (8 characters or more)</label><input id="rp" name="pw" type="password" required minlength="8" autocomplete="new-password">
<label for="rp2">Confirm password</label><input id="rp2" name="pw2" type="password" required autocomplete="new-password">
<p></p><button class="btn main" type="submit">Create account</button></form>`
:`<form id="loginForm"><label for="li">Student ID or staff email</label><input id="li" name="login" type="text" required autocomplete="username" value="${esc(v.login)}">
<label for="lp">Password</label><input id="lp" name="pw" type="password" required autocomplete="current-password">
<p></p><button class="btn main" type="submit">Sign in</button></form>`}
</section>
</div>`}
(async()=>{const tok=new URLSearchParams(location.search).get('p');
if(tok){const{data}=await sb.rpc('get_shared_profile',{p_token:tok});pub={data};ready=true;render();return}
const{data:{session}}=await sb.auth.getSession();ready=true;
if(session)await enter(session.user.id,true);else render()})();

function navHTML(u){const st=u.role==='student';
const items=st?[['ach','Achievements','ach'],['add','Add achievement','add'],['req','Recommendations','req'],['prof','Profile and CV','prof'],['res','Results','res'],['priv','Privacy','priv'],['act','Activity','act']]:[['requests',`Requests (${S.reqs.filter(r=>r.lid===me).length})`,'requests'],['endorse',`To endorse (${S.ach.filter(a=>a.status==='pending'&&a.lid===me).length})`,'endorse'],['act','Activity','act']];
const cur=st?stab:ltab,act=st?'snav':'ltab';
return `<div class="subbar" role="tablist" aria-label="Sections">${items.map(i=>`<button role="tab" aria-selected="${cur===i[0]}" data-act="${act}" data-v="${i[0]}">${uiIcon(i[2])}<span>${i[1]}</span></button>`).join('')}</div>`}

function ini(n){return n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}

function openCV(){
if(!window.jspdf){say('The PDF tool didn’t load. Check your connection and reload.');return}
const u=user(),vs=verified(me),layout=cvTemplate,theme=cvTheme;
const templates={modern:{font:'helvetica',size:10.5,margin:52,line:15},classic:{font:'times',size:11,margin:62,line:17},compact:{font:'helvetica',size:9.5,margin:42,line:12},executive:{font:'helvetica',size:10.5,margin:54,line:15},sidebar:{font:'helvetica',size:10,margin:42,line:14},academic:{font:'times',size:11,margin:62,line:17}};
const accent=cvThemes.find(x=>x[0]===theme)?.[3]||cvThemes[0][3];
const style=templates[layout]||templates.modern,{jsPDF}=window.jspdf,d=new jsPDF({unit:'pt',format:'a4'});
const W=d.internal.pageSize.getWidth(),H=d.internal.pageSize.getHeight(),m=style.margin,isSidebar=layout==='sidebar',railWidth=isSidebar?100:0,contentX=m+railWidth,contentWidth=W-contentX-m,bottom=H-m;
let y=m;
const drawSidebar=()=>{if(!isSidebar)return;d.setFillColor(...accent);d.rect(0,0,railWidth,H,'F');d.setFont('helvetica','bold');d.setFontSize(18);d.setTextColor(255,255,255);d.text(ini(u.name),railWidth/2,48,{align:'center'});d.setFont('helvetica','normal');d.setFontSize(7.5);const lines=d.splitTextToSize(contact,railWidth-24);let sy=78;for(const lineText of lines){d.text(lineText,12,sy);sy+=10}};
const page=()=>{d.addPage();drawSidebar();y=m};
const ensure=height=>{if(y+height>bottom)page()};
const write=(text,{x=contentX,width=contentWidth,size=style.size,line=style.line,color=[35,43,58],font=style.font,bold=false}={})=>{
d.setFont(font,bold?'bold':'normal');d.setFontSize(size);d.setTextColor(...color);
const lines=d.splitTextToSize(String(text??''),width);
for(const lineText of lines){ensure(line);d.text(lineText,x,y);y+=line}
};
const section=title=>{
ensure(style.line*2.5);y+=style.line*.6;d.setFont(style.font,'bold');d.setFontSize(style.size+2);d.setTextColor(...accent);d.text(title,contentX,y);
y+=style.line*.5;d.setDrawColor(...accent);d.setLineWidth(.8);d.line(contentX,y,contentX+contentWidth,y);y+=style.line*.8;
};
const contact=[`Student ID ${u.login}`,u.phone&&`Phone ${u.phone}`,u.backup&&u.backup].filter(Boolean).join('  ·  ');
drawSidebar();
if(layout==='modern'){
d.setTextColor(255,255,255);d.setFont('helvetica','bold');d.setFontSize(25);
const titleLines=d.splitTextToSize(u.name,contentWidth),titleY=38,titleLine=30,subtitleY=titleY+titleLines.length*titleLine+5;
d.setFont('helvetica','normal');d.setFontSize(11);
const subtitleLines=d.splitTextToSize('BSc Software Engineering · Credify',contentWidth),contactY=subtitleY+subtitleLines.length*15+4;
d.setFontSize(9.5);const contactLines=d.splitTextToSize(contact,contentWidth),headerHeight=Math.max(132,contactY+contactLines.length*12+14);
d.setFillColor(...accent);d.rect(0,0,W,headerHeight,'F');d.setFont('helvetica','bold');d.setFontSize(25);d.text(titleLines,m,titleY);
d.setFont('helvetica','normal');d.setFontSize(11);d.text(subtitleLines,m,subtitleY);
d.setFontSize(9.5);d.text(contactLines,m,contactY);y=headerHeight+18;
}else if(layout==='executive'){
d.setFillColor(...accent);d.rect(0,0,W,12,'F');d.setFont('helvetica','bold');d.setFontSize(8);d.setTextColor(...accent);d.text('PROFESSIONAL PROFILE',contentX,40);
d.setFont('helvetica','bold');d.setFontSize(27);d.setTextColor(28,38,55);const titleLines=d.splitTextToSize(u.name,contentWidth);d.text(titleLines,contentX,72);
y=72+titleLines.length*31;d.setFont('helvetica','normal');d.setFontSize(11);d.setTextColor(85,94,110);d.text('BSc Software Engineering · Credify',contentX,y);y+=18;
write(contact,{size:9.5,line:12,color:[101,112,130]});y+=8;d.setDrawColor(...accent);d.setLineWidth(2);d.line(contentX,y,contentX+contentWidth,y);y+=14;
}else if(layout==='sidebar'){
d.setFont('helvetica','bold');d.setFontSize(23);d.setTextColor(28,38,55);const titleLines=d.splitTextToSize(u.name,contentWidth);d.text(titleLines,contentX,48);y=48+titleLines.length*27+4;
d.setFont('helvetica','normal');d.setFontSize(11);d.setTextColor(85,94,110);d.text('BSc Software Engineering · Credify',contentX,y);y+=style.line;
}else{
d.setFont(layout==='academic'||layout==='classic'?'times':'helvetica','bold');const titleSize=layout==='classic'?24:layout==='academic'?23:20,titleLine=layout==='classic'?28:layout==='academic'?27:23,titleY=layout==='classic'?48:layout==='academic'?48:38;
d.setFontSize(titleSize);d.setTextColor(28,38,55);const titleLines=d.splitTextToSize(u.name,contentWidth);d.text(titleLines,contentX,titleY,layout==='academic'?{align:'center',maxWidth:contentWidth}:{});
d.setFont(layout==='classic'||layout==='academic'?'times':'helvetica','normal');d.setFontSize(style.size);d.setTextColor(85,94,110);
const subtitleY=titleY+titleLines.length*titleLine+3;d.text('BSc Software Engineering · Credify',layout==='academic'?W/2:contentX,subtitleY,layout==='academic'?{align:'center'}:{});
const contactY=subtitleY+style.line;d.setFontSize(style.size-1);const contactLines=d.splitTextToSize(contact,contentWidth);d.text(contactLines,layout==='academic'?W/2:contentX,contactY,layout==='academic'?{align:'center',maxWidth:contentWidth}:{});
const ruleY=contactY+contactLines.length*style.line*.85+6;d.setDrawColor(...accent);d.setLineWidth(layout==='classic'?1.5:layout==='compact'?3:1);d.line(contentX,ruleY,contentX+contentWidth,ruleY);if(layout==='academic')d.line(contentX,ruleY+3,contentX+contentWidth,ruleY+3);y=ruleY+style.line;
}
section('Verified achievements');
if(vs.length){vs.forEach(a=>{
const titleLines=d.splitTextToSize(a.title,contentWidth),meta=[a.cat,fmt(a.date),a.lvl&&`${a.lvl[0].toUpperCase()+a.lvl.slice(1)} recognition`,a.by&&`Verified by ${a.by}`].filter(Boolean).join(' · ');
ensure(titleLines.length*style.line+style.line*1.7);d.setFont(style.font,'bold');d.setFontSize(style.size);d.setTextColor(35,43,58);d.text(titleLines,contentX,y);y+=titleLines.length*style.line;
write(meta,{size:style.size-1,line:style.line*.9,color:[101,112,130]});y+=style.line*.25;
})}else write('No verified achievements yet.',{color:[101,112,130]});
section('Skills');
if(S.skills.length){S.skills.forEach(x=>write(`${x.name} · ${x.kind}${x.level?' · '+x.level:''}`,{line:style.line} ))}else write('No skills listed yet.',{color:[101,112,130]});
const pages=d.getNumberOfPages();for(let i=1;i<=pages;i++){d.setPage(i);d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(130,139,153);d.text(`Credify · ${u.name} · ${i} / ${pages}`,contentX,H-22)}
d.save((u.name+' - Credify CV').replace(/[^\w .-]/g,'')+'.pdf')
}

function letterPDF(id){const r=S.reqs.find(x=>x.id===id),{jsPDF}=window.jspdf,d=new jsPDF({unit:'pt',format:'a4'});
const W=d.internal.pageSize.getWidth(),H=d.internal.pageSize.getHeight(),m=64;let y=m;
d.setFont('times','normal');d.setFontSize(12);
for(const line of d.splitTextToSize(S.drafts[id]||'',W-2*m)){if(y>H-m){d.addPage();y=m}d.text(line,m,y);y+=17}
d.save(('Recommendation letter - '+names[r.lid]).replace(/[^\w .-]/g,'')+'.pdf')}