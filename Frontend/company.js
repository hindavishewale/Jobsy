document.addEventListener('DOMContentLoaded',()=>{
loadCompanyProfile();
loadCompanyProfileForm();
});
function loadCompanyProfile(){
fetch('/api/getUser')
.then(res=>res.json())
.then(data=>{
const companyName=data.CompanyName||'Company';
document.getElementById('companyName').textContent=companyName;
document.querySelectorAll('.user-avatar img').forEach(img=>{
img.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=3b82f6&color=fff`;
});
loadCompanyApplications(companyName);
loadCompanyInternships(companyName);
loadStats(companyName);
})
.catch(err=>console.error('Error loading profile:',err));
}
function loadCompanyApplications(companyName){
fetch(`/application/company?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(apps=>{
const recentContainer=document.querySelector('#dashboard .section:nth-of-type(2)');
const allContainer=document.getElementById('applicationsContainer');
if(recentContainer){
const existingItems=recentContainer.querySelectorAll('.candidate-item');
existingItems.forEach(item=>item.remove());
if(apps.length===0){
recentContainer.insertAdjacentHTML('beforeend','<p style="text-align:center;color:#666;">No applications yet</p>');
}else{
apps.slice(0,3).forEach(app=>{
const item=`
<div class="candidate-item">
<div class="candidate-info">
<h4>${app.candidateName}</h4>
<p>Applied for: ${app.internshipTitle}</p>
<p><strong>Status:</strong> <span style="color:#f59e0b">${app.status}</span></p>
<p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
</div>
<div>
<button class="btn btn-primary btn-small">View Profile</button>
<button class="btn btn-secondary btn-small">Shortlist</button>
</div>
</div>`;
recentContainer.insertAdjacentHTML('beforeend',item);
});
}
}
if(allContainer){
allContainer.innerHTML='';
if(apps.length===0){
allContainer.innerHTML='<p style="text-align:center;color:#666;">No applications yet</p>';
}else{
apps.forEach(app=>{
const item=`
<div class="candidate-item">
<div class="candidate-info">
<h4>${app.candidateName}</h4>
<p>Applied for: ${app.internshipTitle}</p>
<p>Email: ${app.candidateEmail}</p>
<p><strong>Status:</strong> <span style="color:#f59e0b">${app.status}</span></p>
<p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
</div>
<div>
<button class="btn btn-primary btn-small">View Profile</button>
<button class="btn btn-secondary btn-small">Shortlist</button>
<button class="btn btn-secondary btn-small">Reject</button>
</div>
</div>`;
allContainer.insertAdjacentHTML('beforeend',item);
});
}
}
})
.catch(err=>console.error('Error loading applications:',err));
}
function loadCompanyInternships(companyName){
fetch(`/getData/getCompanyInternships?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(internships=>{
const activeContainer=document.getElementById('activePostingsContainer');
const allContainer=document.getElementById('allPostingsContainer');
if(activeContainer){
if(internships.length===0){
activeContainer.innerHTML='<p style="text-align:center;color:#666;">No active postings</p>';
}else{
activeContainer.innerHTML='';
internships.forEach(int=>{
fetch(`/application/company?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(apps=>{
const appCount=apps.filter(a=>a.internshipTitle===int.internshipTitle).length;
const card=`
<div class="internship-card">
<h3>${int.internshipTitle}</h3>
<span class="status-badge status-active">Active</span>
<p>${int.location} | Rs.${int.stipend}/month</p>
<p><strong>Applications:</strong> ${appCount}</p>
<button class="btn btn-primary btn-small">View Applications</button>
<button class="btn btn-secondary btn-small">Edit</button>
</div>`;
activeContainer.insertAdjacentHTML('beforeend',card);
});
});
}
}
if(allContainer){
if(internships.length===0){
allContainer.innerHTML='<p style="text-align:center;color:#666;">No postings yet</p>';
}else{
allContainer.innerHTML='';
internships.forEach(int=>{
fetch(`/application/company?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(apps=>{
const appCount=apps.filter(a=>a.internshipTitle===int.internshipTitle).length;
const card=`
<div class="internship-card">
<h3>${int.internshipTitle}</h3>
<span class="status-badge status-active">Active</span>
<p>${int.location} | Rs.${int.stipend}/month</p>
<p><strong>Posted:</strong> ${new Date(int.createdAt||Date.now()).toLocaleDateString()} | <strong>Applications:</strong> ${appCount}</p>
<button class="btn btn-primary btn-small">View Applications</button>
<button class="btn btn-secondary btn-small">Edit</button>
<button class="btn btn-secondary btn-small">Close</button>
</div>`;
allContainer.insertAdjacentHTML('beforeend',card);
});
});
}
}
})
.catch(err=>console.error('Error loading internships:',err));
}
function loadStats(companyName){
Promise.all([
fetch(`/getData/getCompanyInternships?companyName=${encodeURIComponent(companyName)}`).then(r=>r.json()),
fetch(`/application/company?companyName=${encodeURIComponent(companyName)}`).then(r=>r.json())
])
.then(([internships,apps])=>{
document.getElementById('statActivePostings').textContent=internships.length;
document.getElementById('statTotalApplications').textContent=apps.length;
document.getElementById('statShortlisted').textContent=0;
document.getElementById('statHired').textContent=0;
})
.catch(err=>console.error('Error loading stats:',err));
}
function loadCompanyProfileForm(){
fetch('/api/getUser')
.then(res=>res.json())
.then(data=>{
const inputs=document.querySelectorAll('#profile input');
const select=document.querySelector('#profile select');
if(inputs[0])inputs[0].value=data.CompanyName||'';
if(inputs[1])inputs[1].value=data.Email||'';
if(select)select.value=data.CompanySize||'';
if(inputs[3])inputs[3].value=data.Industry||'';
if(inputs[4])inputs[4].value=data.Website||'';
})
.catch(err=>console.error('Error loading profile form:',err));
}
