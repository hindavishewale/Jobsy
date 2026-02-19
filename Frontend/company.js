document.addEventListener('DOMContentLoaded',()=>{
    const FRONTEND_URL = "https://jobsyhwm.vercel.app";
const BACKEND_URL = "https://final-year-project-rk87.onrender.com";

const lang=localStorage.getItem('appLang')||'en';
if(typeof translations!=='undefined'&&translations[lang]){
window.t=translations[lang];
}
loadCompanyProfile();
loadCompanyProfileForm();
});
function loadCompanyProfile(){
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
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
fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(companyName)}`)
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
const statusColor=app.status==='Shortlisted'?'#10b981':app.status==='Rejected'?'#ef4444':'#f59e0b';
const item=`
<div class="candidate-item">
<div class="candidate-info">
<h4>${app.candidateName}</h4>
<p>Applied for: ${app.internshipTitle}</p>
<p><strong>Status:</strong> <span style="color:${statusColor};font-weight:600">${app.status}</span></p>
<p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
</div>
<div>
<button class="btn btn-primary btn-small" onclick="viewCandidateProfile('${app.candidateEmail}')">View Profile</button>
<button class="btn btn-secondary btn-small" onclick="shortlistCandidate('${app.candidateEmail}','${app.internshipTitle}')">Shortlist</button>
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
const statusColor=app.status==='Shortlisted'?'#10b981':app.status==='Rejected'?'#ef4444':'#f59e0b';
const item=`
<div class="candidate-item">
<div class="candidate-info">
<h4>${app.candidateName}</h4>
<p>Applied for: ${app.internshipTitle}</p>
<p>Email: ${app.candidateEmail}</p>
<p><strong>Status:</strong> <span style="color:${statusColor};font-weight:600">${app.status}</span></p>
<p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
</div>
<div>
<button class="btn btn-primary btn-small" onclick="viewCandidateProfile('${app.candidateEmail}')">View Profile</button>
<button class="btn btn-secondary btn-small" onclick="shortlistCandidate('${app.candidateEmail}','${app.internshipTitle}')">Shortlist</button>
<button class="btn btn-secondary btn-small" onclick="rejectCandidate('${app.candidateEmail}','${app.internshipTitle}')">Reject</button>
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
fetch(`${BACKEND_URL}/getData/getCompanyInternships?companyName=${encodeURIComponent(companyName)}`)
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
fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(apps=>{
const appCount=apps.filter(a=>a.internshipTitle===int.internshipTitle).length;
const status=int.status||'Active';
const statusClass=status==='Active'?'status-active':'status-closed';
const card=`
<div class="internship-card">
<h3>${int.internshipTitle}</h3>
<span class="status-badge ${statusClass}">${status}</span>
<p>${int.location} | Rs.${int.stipend}/month</p>
<p><strong>Applications:</strong> ${appCount}</p>
<button class="btn btn-primary btn-small" onclick="viewInternshipApplications('${int.internshipTitle}')">View Applications</button>
<button class="btn btn-secondary btn-small" onclick="editInternship('${int.internshipTitle}')">Edit</button>
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
fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(companyName)}`)
.then(res=>res.json())
.then(apps=>{
const appCount=apps.filter(a=>a.internshipTitle===int.internshipTitle).length;
const status=int.status||'Active';
const statusClass=status==='Active'?'status-active':'status-closed';
const toggleBtn=status==='Active'?'Deactivate':'Activate';
const card=`
<div class="internship-card">
<h3>${int.internshipTitle}</h3>
<span class="status-badge ${statusClass}">${status}</span>
<p>${int.location} | Rs.${int.stipend}/month</p>
<p><strong>Posted:</strong> ${new Date(int.createdAt||Date.now()).toLocaleDateString()} | <strong>Applications:</strong> ${appCount}</p>
<button class="btn btn-primary btn-small" onclick="viewInternshipApplications('${int.internshipTitle}')">View Applications</button>
<button class="btn btn-secondary btn-small" onclick="editInternship('${int.internshipTitle}')">Edit</button>
<button class="btn btn-secondary btn-small" onclick="closeInternship('${int.internshipTitle}')">${toggleBtn}</button>
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
fetch(`${BACKEND_URL}/getData/getCompanyInternships?companyName=${encodeURIComponent(companyName)}`).then(r=>r.json()),
fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(companyName)}`).then(r=>r.json())
])
.then(([internships,apps])=>{
const shortlisted=apps.filter(a=>a.status==='Shortlisted').length;
document.getElementById('statActivePostings').textContent=internships.length;
document.getElementById('statTotalApplications').textContent=apps.length;
document.getElementById('statShortlisted').textContent=shortlisted;
document.getElementById('statHired').textContent=0;
loadShortlistedCandidates(apps.filter(a=>a.status==='Shortlisted'));
})
.catch(err=>console.error('Error loading stats:',err));
}
function loadCompanyProfileForm(){
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
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

function viewCandidateProfile(email){
const t=window.t||{};
Promise.all([
fetch(`${BACKEND_URL}/api/getCandidateByEmail?email=${encodeURIComponent(email)}`).then(r=>r.json()),
fetch(`${BACKEND_URL}/quiz/getResults?email=${encodeURIComponent(email)}`).then(r=>r.json())
])
.then(([candidate,quizData])=>{
const quizResults=quizData.success?quizData.results:[];
let profileHtml=`
<div style="max-width:600px;">
<h3 style="color:#2563eb;margin-bottom:20px;">${candidate.Name}</h3>
<div style="margin-bottom:15px;">
<p><strong>Email:</strong> ${candidate.Email}</p>
<p><strong>Education:</strong> ${candidate.Education||'Not specified'}</p>
<p><strong>Skills:</strong> ${candidate.Skills||'Not specified'}</p>
<p><strong>Location:</strong> ${candidate.Location||'Not specified'}</p>
<p><strong>Portfolio:</strong> ${candidate.Portfolio?`<a href="${candidate.Portfolio}" target="_blank">View Portfolio</a>`:'Not provided'}</p>
</div>`;
if(quizResults.length>0){
profileHtml+=`
<h4 style="color:#2563eb;margin:20px 0 10px;">Quiz Performance</h4>
<div style="background:#f9fafb;padding:15px;border-radius:8px;">`;
quizResults.forEach(result=>{
const percentileColor=result.percentile>=75?'#10b981':result.percentile>=50?'#f59e0b':'#ef4444';
profileHtml+=`
<div style="margin-bottom:15px;padding:10px;background:#fff;border-radius:6px;">
<div style="display:flex;justify-content:space-between;align-items:center;">
<strong>${result.skill}</strong>
<span style="color:${percentileColor};font-weight:600;">${result.score}%</span>
</div>
<div style="margin-top:5px;font-size:0.9rem;color:#666;">
<span>Percentile: ${result.percentile}th</span> | 
<span>Completed: ${new Date(result.completedDate).toLocaleDateString()}</span>
</div>
<div style="margin-top:8px;background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden;">
<div style="background:${percentileColor};height:100%;width:${result.score}%;"></div>
</div>
</div>`;
});
profileHtml+=`</div>`;
}else{
profileHtml+=`<p style="color:#666;margin-top:20px;">No quiz attempts yet</p>`;
}
profileHtml+=`</div>`;
const modal=document.createElement('div');
modal.className='modal active';
modal.innerHTML=`
<div class="modal-content">
<span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
${profileHtml}
<button class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="margin-top:20px;">Close</button>
</div>`;
document.body.appendChild(modal);
})
.catch(err=>{
console.error('Error loading candidate profile:',err);
showError('Error loading candidate profile');
});
}
function shortlistCandidate(email,internshipTitle){
const t=window.t||{};
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
.then(res=>res.json())
.then(user=>{
return fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(user.CompanyName)}`);
})
.then(res=>res.json())
.then(apps=>{
const app=apps.find(a=>a.candidateEmail===email&&a.internshipTitle===internshipTitle);
if(!app){
showError('Application not found');
return;
}
if(app.status==='Shortlisted'){
if(!confirm(`This candidate is already Shortlisted.\n\nDo you want to change the status?`)){
return;
}
}
if(app.status==='Rejected'){
if(!confirm(`This candidate was Rejected.\n\nDo you want to change status to Shortlisted?`)){
return;
}
}
if(confirm(`Shortlist this candidate for ${internshipTitle}?`)){
fetch(`${BACKEND_URL}/application/updateStatus`,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({candidateEmail:email,internshipTitle,status:'Shortlisted'})
})
.then(res=>res.json())
.then(data=>{
if(data.success){
showSuccess('Candidate shortlisted successfully! The candidate will be notified via email.');
loadCompanyProfile();
}else{
showError('Error: '+data.error);
}
})
.catch(err=>{
console.error('Error shortlisting:',err);
showError('Failed to shortlist candidate');
});
}
})
.catch(err=>{
console.error('Error:',err);
showError('Failed to check application status');
});
}
function rejectCandidate(email,internshipTitle){
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
.then(res=>res.json())
.then(user=>{
return fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(user.CompanyName)}`);
})
.then(res=>res.json())
.then(apps=>{
const app=apps.find(a=>a.candidateEmail===email&&a.internshipTitle===internshipTitle);
if(!app){
showError('Application not found');
return;
}
if(app.status==='Rejected'){
if(!confirm(`This candidate is already Rejected.\n\nDo you want to change the status?`)){
return;
}
}
if(app.status==='Shortlisted'){
if(!confirm(`This candidate was Shortlisted.\n\nDo you want to change status to Rejected?`)){
return;
}
}
if(confirm(`Reject this candidate for ${internshipTitle}?`)){
fetch(`${BACKEND_URL}/application/updateStatus`,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({candidateEmail:email,internshipTitle,status:'Rejected'})
})
.then(res=>res.json())
.then(data=>{
if(data.success){
showSuccess('Candidate rejected.');
loadCompanyProfile();
}else{
showError('Error: '+data.error);
}
})
.catch(err=>{
console.error('Error rejecting:',err);
showError('Failed to reject candidate');
});
}
})
.catch(err=>{
console.error('Error:',err);
showError('Failed to check application status');
});
}
function viewInternshipApplications(internshipTitle){
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
.then(res=>res.json())
.then(user=>{
return fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(user.CompanyName)}`);
})
.then(res=>res.json())
.then(apps=>{
const filtered=apps.filter(a=>a.internshipTitle===internshipTitle);
if(filtered.length===0){
showNotification('No applications for this internship yet.', 'info');
return;
}
let html=`<div style="max-width:800px;"><h3 style="color:#2563eb;margin-bottom:20px;">Applications for ${internshipTitle}</h3>`;
filtered.forEach(app=>{
const statusColor=app.status==='Shortlisted'?'#10b981':app.status==='Rejected'?'#ef4444':'#f59e0b';
html+=`
<div style="border:1px solid #93c5fd;padding:15px;border-radius:8px;margin-bottom:15px;background:#eff6ff;">
<h4 style="margin:0 0 10px;color:#1e40af;">${app.candidateName}</h4>
<p style="margin:5px 0;color:#1e3a8a;font-size:0.9rem;">Email: ${app.candidateEmail}</p>
<p style="margin:5px 0;color:#1e3a8a;font-size:0.9rem;"><strong>Status:</strong> <span style="color:${statusColor};font-weight:600;">${app.status}</span></p>
<p style="margin:5px 0;color:#1e3a8a;font-size:0.9rem;">Applied: ${new Date(app.appliedDate).toLocaleDateString()}</p>
<div style="margin-top:10px;">
<button class="btn btn-primary btn-small" onclick="viewCandidateProfile('${app.candidateEmail}')">View Profile</button>
<button class="btn btn-secondary btn-small" onclick="shortlistCandidate('${app.candidateEmail}','${app.internshipTitle}');document.querySelector('.modal').remove();">Shortlist</button>
<button class="btn btn-secondary btn-small" onclick="rejectCandidate('${app.candidateEmail}','${app.internshipTitle}');document.querySelector('.modal').remove();">Reject</button>
</div>
</div>`;
});
html+=`</div>`;
const modal=document.createElement('div');
modal.className='modal active';
modal.innerHTML=`
<div class="modal-content">
<span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
${html}
<button class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="margin-top:20px;">Close</button>
</div>`;
document.body.appendChild(modal);
})
.catch(err=>{
console.error('Error loading applications:',err);
showError('Failed to load applications');
});
}
function editInternship(internshipTitle){
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
.then(res=>res.json())
.then(user=>{
return fetch(`${BACKEND_URL}/getData/getCompanyInternships?companyName=${encodeURIComponent(user.CompanyName)}`);
})
.then(res=>res.json())
.then(internships=>{
const int=internships.find(i=>i.internshipTitle===internshipTitle);
if(!int){
showError('Internship not found');
return;
}
const modal=document.createElement('div');
modal.className='modal active';
modal.innerHTML=`
<div class="modal-content">
<span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
<h3 style="color:#2563eb;margin-bottom:20px;">Edit Internship</h3>
<div class="form-group">
<label>Job Title</label>
<input type="text" id="editTitle" value="${int.internshipTitle}">
</div>
<div class="form-group">
<label>Location</label>
<input type="text" id="editLocation" value="${int.location}">
</div>
<div class="form-group">
<label>Stipend (₹/month)</label>
<input type="number" id="editStipend" value="${int.stipend}">
</div>
<div class="form-group">
<label>Skills (comma-separated)</label>
<input type="text" id="editSkills" value="${int.skills.join(', ')}">
</div>
<div class="form-group">
<label>Description</label>
<textarea id="editDescription" rows="4">${int.description||''}</textarea>
</div>
<button class="btn btn-primary" onclick="saveInternshipEdit('${int.internshipTitle}','${int.companyName}')">Save Changes</button>
<button class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="margin-left:10px;">Cancel</button>
</div>`;
document.body.appendChild(modal);
})
.catch(err=>{
console.error('Error loading internship:',err);
showError('Failed to load internship details');
});
}
function saveInternshipEdit(oldTitle,companyName){
const updates={
location:document.getElementById('editLocation').value,
stipend:document.getElementById('editStipend').value,
skills:document.getElementById('editSkills').value.split(',').map(s=>s.trim()),
description:document.getElementById('editDescription').value
};
fetch(`${BACKEND_URL}/getData/updateInternship`,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({internshipTitle:oldTitle,companyName,updates})
})
.then(res=>res.json())
.then(data=>{
if(data.success){
showSuccess('Internship updated successfully!');
document.querySelector('.modal').remove();
loadCompanyProfile();
}else{
showError('Error: '+data.error);
}
})
.catch(err=>{
console.error('Error updating internship:',err);
showError('Failed to update internship');
});
}
function closeInternship(internshipTitle){
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
.then(res=>res.json())
.then(user=>{
return fetch(`${BACKEND_URL}/getData/getCompanyInternships?companyName=${encodeURIComponent(user.CompanyName)}`);
})
.then(res=>res.json())
.then(internships=>{
const int=internships.find(i=>i.internshipTitle===internshipTitle);
if(!int){
showError('Internship not found');
return;
}
const currentStatus=int.status||'Active';
const newStatus=currentStatus==='Active'?'Inactive':'Active';
const action=newStatus==='Inactive'?'deactivate':'activate';
if(confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} "${internshipTitle}"?\n\nThis will ${newStatus==='Inactive'?'stop accepting new applications':'reopen the internship for applications'}.`)){
fetch(`${BACKEND_URL}/getData/updateInternshipStatus`,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({internshipTitle,companyName:int.companyName,status:newStatus})
})
.then(res=>res.json())
.then(data=>{
if(data.success){
showSuccess(`Internship ${newStatus.toLowerCase()} successfully!`);
loadCompanyProfile();
}else{
showError('Error: '+data.error);
}
})
.catch(err=>{
console.error('Error updating status:',err);
showError('Failed to update internship status');
});
}
})
.catch(err=>{
console.error('Error:',err);
showError('Failed to load internship');
});
}
function loadShortlistedCandidates(shortlisted){
const container=document.getElementById('shortlistedContainer');
if(!container)return;
if(shortlisted.length===0){
container.innerHTML='<p style="text-align:center;color:#666;">No shortlisted candidates yet</p>';
return;
}
container.innerHTML='';
shortlisted.forEach(app=>{
const item=`
<div class="candidate-item">
<div class="candidate-info">
<h4>${app.candidateName}</h4>
<p>Position: ${app.internshipTitle}</p>
<p>Email: ${app.candidateEmail}</p>
<p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
</div>
<div>
<button class="btn btn-primary btn-small" onclick="scheduleInterview('${app.candidateEmail}','${app.candidateName}','${app.internshipTitle}')">Schedule Interview</button>
<button class="btn btn-secondary btn-small" onclick="viewCandidateProfile('${app.candidateEmail}')">View Profile</button>
</div>
</div>`;
container.insertAdjacentHTML('beforeend',item);
});
}
function scheduleInterview(email,name,internshipTitle){
const t=window.t||{};
const modal=document.createElement('div');
modal.className='modal active';
modal.innerHTML=`
<div class="modal-content">
<span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
<h3 style="color:#2563eb;margin-bottom:20px;">Schedule Interview</h3>
<p style="margin-bottom:20px;"><strong>Candidate:</strong> ${name}<br><strong>Position:</strong> ${internshipTitle}</p>
<div class="form-group">
<label>Interview Date</label>
<input type="date" id="interviewDate" min="${new Date().toISOString().split('T')[0]}">
</div>
<div class="form-group">
<label>Interview Time</label>
<input type="time" id="interviewTime">
</div>
<div class="form-group">
<label>Interview Mode</label>
<select id="interviewMode">
<option value="Virtual">Virtual (Google Meet/Zoom)</option>
<option value="In-Person">In-Person</option>
<option value="Phone">Phone Call</option>
</select>
</div>
<div class="form-group">
<label>Meeting Link (if virtual)</label>
<input type="url" id="meetingLink" placeholder="https://meet.google.com/...">
</div>
<div class="form-group">
<label>Additional Notes</label>
<textarea id="interviewNotes" rows="3" placeholder="Any special instructions..."></textarea>
</div>
<button class="btn btn-primary" onclick="confirmInterview('${email}','${name}','${internshipTitle}')">Send Interview Invite</button>
<button class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="margin-left:10px;">Cancel</button>
</div>`;
document.body.appendChild(modal);
}
function confirmInterview(email,name,internshipTitle){
const date=document.getElementById('interviewDate').value;
const time=document.getElementById('interviewTime').value;
const mode=document.getElementById('interviewMode').value;
const link=document.getElementById('meetingLink').value;
const notes=document.getElementById('interviewNotes').value;
if(!date||!time){
showWarning('Please select interview date and time');
return;
}
if(mode==='Virtual'&&!link){
showWarning('Please provide meeting link for virtual interview');
return;
}
const interviewDate=new Date(date+' '+time).toLocaleString();
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
.then(res=>res.json())
.then(company=>{
const message=`Interview scheduled for ${internshipTitle} at ${company.CompanyName} on ${interviewDate}. Mode: ${mode}${mode==='Virtual'?' - '+link:''}${notes?' - '+notes:''}`;
return fetch(`${BACKEND_URL}/notification/create`,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
candidateEmail:email,
message,
type:'Info',
internshipTitle,
companyName:company.CompanyName
})
});
})
.then(res=>res.json())
.then(data=>{
if(data.success){
showSuccess(`Interview scheduled for ${name} on ${interviewDate}. Email sent to ${email}`);
document.querySelector('.modal').remove();
}else{
showWarning('Interview scheduled but notification failed');
document.querySelector('.modal').remove();
}
})
.catch(err=>{
console.error('Error:',err);
showError('Failed to schedule interview');
});
}
function loadAnalytics(){
fetch(`${BACKEND_URL}/api/getUser`,{credentials:'include'})
.then(res=>res.json())
.then(user=>{
return Promise.all([
fetch(`${BACKEND_URL}/getData/getCompanyInternships?companyName=${encodeURIComponent(user.CompanyName)}`).then(r=>r.json()),
fetch(`${BACKEND_URL}/application/company?companyName=${encodeURIComponent(user.CompanyName)}`).then(r=>r.json())
]);
})
.then(([internships,apps])=>{
document.getElementById('analyticsPostings').textContent=internships.length;
document.getElementById('analyticsApplications').textContent=apps.length;
const avgApps=internships.length>0?(apps.length/internships.length).toFixed(1):0;
document.getElementById('analyticsAvgApps').textContent=avgApps;
const shortlisted=apps.filter(a=>a.status==='Shortlisted').length;
const shortlistRate=apps.length>0?((shortlisted/apps.length)*100).toFixed(1):0;
document.getElementById('analyticsShortlistRate').textContent=shortlistRate+'%';
const underReview=apps.filter(a=>a.status==='Under Review').length;
const rejected=apps.filter(a=>a.status==='Rejected').length;
document.getElementById('analyticsUnderReview').textContent=underReview;
document.getElementById('analyticsShortlisted').textContent=shortlisted;
document.getElementById('analyticsRejected').textContent=rejected;
const postingStats=internships.map(int=>{
const intApps=apps.filter(a=>a.internshipTitle===int.internshipTitle);
return{title:int.internshipTitle,appCount:intApps.length,shortlisted:intApps.filter(a=>a.status==='Shortlisted').length};
}).sort((a,b)=>b.appCount-a.appCount).slice(0,5);
const container=document.getElementById('topPostingsContainer');
if(postingStats.length===0){
container.innerHTML='<p style="text-align:center;color:#666;">No postings yet</p>';
}else{
container.innerHTML='';
postingStats.forEach(stat=>{
const card=`
<div class="internship-card">
<h3>${stat.title}</h3>
<p><strong>Applications:</strong> ${stat.appCount} | <strong>Shortlisted:</strong> ${stat.shortlisted}</p>
</div>`;
container.insertAdjacentHTML('beforeend',card);
});
}
})
.catch(err=>console.error('Error loading analytics:',err));
}
