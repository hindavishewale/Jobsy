document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    const langMobile = document.getElementById('languageMobile');
    const langDesktop = document.getElementById('language');
    if (langMobile && langDesktop) {
        langMobile.value = localStorage.getItem('appLang') || 'en';
        langMobile.addEventListener('change', (e) => {
            langDesktop.value = e.target.value;
            langDesktop.dispatchEvent(new Event('change'));
        });
    }

    function loadProfile() {
        fetch("/api/getUser")
            .then(res => res.json())
            .then(data => {
                console.log("userProfile:", data);
                const userName = data.Name || "Candidate";
                const userNameEl = document.getElementById("userName");
                if (userNameEl) {
                    userNameEl.textContent = userName;
                }
                localStorage.setItem('userEmail', data.Email);
                
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`;
                document.querySelectorAll('.user-avatar img').forEach(img => {
                    img.src = avatarUrl;
                    img.alt = userName;
                });
                
                if (data.Email) {
                    loadInternships(data.Email);
                    loadApplications(data.Email);
                    loadApplicationCount();
                    updateSavedCount();
                    loadNotifications(data.Email);
                }
                loadCandidateProfileForm(data);
            })
            .catch(err => {
                console.error("Error loading profile:", err);
            });
    }

    loadProfile();
});

function logout() {
    fetch("/api/logout")
        .then(() => {
            window.location.href = "index.html";
        });
}

function loadInternships(email) {
    fetch("/bert/matchInternships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
    })
    .then(res => res.json())
    .then(data => {
        const rec = document.getElementById("recc");
        if (!rec) return;

        if (!data || data.length === 0) {
            rec.innerHTML = '<p style="text-align:center;color:#666;">No matching internships found.</p>';
            return;
        }

        const activeInternships = data.filter(obj => !obj.internship.status || obj.internship.status === 'Active');

        rec.innerHTML = '';
        activeInternships.forEach(obj => {
            const id = obj.internship._id;
            // Ensure skills is a string for the analyzer
            const skillsStr = Array.isArray(obj.internship.skills) ? 
                              obj.internship.skills.join(' ') : 
                              (obj.internship.skills || '');
            
            const jobDesc = `${obj.internship.internshipTitle} ${obj.internship.description || ''} ${skillsStr}`;
            
            // 1. Render the card immediately with a placeholder div for keywords
            const cardHtml = `
                <div class="internship-card" style="margin-bottom:15px;">
                    <h3>${obj.internship.internshipTitle}</h3>
                    <p>${obj.internship.companyName || 'Company'}</p>
                    <p>${obj.internship.location} | Rs.${obj.internship.stipend}/month</p>
                    <span class="trust-badge trust-high">${obj.matchPercentage}% Match</span>
                    
                    <div id="rec-keywords-${id}"></div>

                    <button class="btn btn-primary btn-small" style="margin-top:10px;" 
                        onclick="applyNow('${obj.internship.internshipTitle}', '${obj.internship.companyName || 'Company'}')">
                        Apply Now
                    </button>
                </div>`;
            
            rec.insertAdjacentHTML("beforeend", cardHtml);

            // 2. Fetch the keywords and update the specific placeholder
            fetch('/ats/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, jobDescription: jobDesc })
            })
            .then(r => r.json())
            .then(ats => {
                const keywordsDiv = document.getElementById(`rec-keywords-${id}`);
                if (ats.success && ats.missingKeywords && ats.missingKeywords.length > 0) {
                    const kwList = ats.missingKeywords.slice(0, 5).join(', ');
                    keywordsDiv.innerHTML = `
                        <p style="color:#ef4444;font-size:0.85rem;margin-top:10px;padding:8px;background:#fff5f5;border-radius:4px;">
                            <strong>🚀 Boost Selection Chance:</strong> Add these to your resume: <br>
                            <span style="font-weight:600;">${kwList}</span>
                        </p>`;
                }
            })
            .catch(err => console.error("Keyword analysis failed:", err));
        });
    })
    .catch(err => {
        console.error("Error loading internships:", err);
        const rec = document.getElementById("recc");
        if (rec) rec.innerHTML = '<p style="text-align:center;color:#ef4444;">Error loading recommendations.</p>';
    });
}

let ALL_INTERNSHIPS = [];
const fraudCache = {};

function loadAllInternships() {
    const container = document.getElementById("allInternshipsContainer");
    if (!container) return;

    container.innerHTML = "<p style='text-align:center;'>Scanning for internships...</p>";

    fetch("/getData/getInternships")
        .then(res => res.json())
        .then(data => {
            ALL_INTERNSHIPS = data;
            container.innerHTML = "";

            if (!data || !data.length) {
                container.innerHTML = "<p>No internships available at the moment.</p>";
                return;
            }

            const email = localStorage.getItem('userEmail');
            data.forEach(job => {
                const id = job._id;
                const description = job.description || '';
                const skills = Array.isArray(job.skills) ? job.skills.join(' ') : (job.skills || '');
                const jobDesc = `${job.internshipTitle} ${description} ${skills}`;
                
                container.insertAdjacentHTML("beforeend", `
                    <div class="internship-card">
                        <div style="display:flex; justify-content:space-between;">
                            <div>
                                <h3>${job.internshipTitle}</h3>
                                <p><strong>${job.companyName}</strong></p>
                            </div>
                            <div class="risk-gauge" id="risk-${id}" onclick="showFraudDetails('${id}')" title="Click for Trust Analysis">
                                <span>--</span>
                            </div>
                        </div>
                        <p>${job.location} | ₹${job.stipend}/mo</p>
                        <div id="keywords-${id}"></div>
                        <div style="margin-top:10px; display:flex; gap:10px;">
                            <button class="btn btn-primary btn-small" onclick="applyNow('${job.internshipTitle}','${job.companyName}')">Apply Now</button>
                            <button class="btn btn-secondary btn-small" onclick="saveJob('${job.internshipTitle}','${job.companyName}')">Save</button>
                        </div>
                    </div>
                `);
                checkFraudForInternship(job, id);
                if (email) checkKeywords(email, jobDesc, id);
            });
        })
        .catch(err => {
            container.innerHTML = "<p>Error loading internships.</p>";
            console.error("Internship load error:", err);
        });
}

function checkKeywords(email, jobDesc, id) {
    fetch('/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, jobDescription: jobDesc })
    })
    .then(r => r.json())
    .then(ats => {
        const keywordsDiv = document.getElementById(`keywords-${id}`);
        if (!keywordsDiv) return;
        
        const keywords = ats.success && ats.missingKeywords ? ats.missingKeywords.slice(0, 5).join(', ') : '';
        if (keywords) {
            keywordsDiv.innerHTML = `<p style="color:#ef4444;font-size:0.85rem;margin-top:10px;"><strong>Add to Resume:</strong> ${keywords}</p>`;
        }
    })
    .catch(err => console.error(`Keywords check failed for ${id}:`, err));
}

function checkFraudForInternship(job, id) {
    fetch('/api/getUser')
        .then(res => res.json())
        .then(() => {
            return fetch('/getData/getCompany', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName: job.companyName })
            });
        })
        .then(res => res.json())
        .then(company => {
            return fetch("/api/fraud/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyName: job.companyName,
                    website: company?.Website || "",
                    stipend: job.stipend || 0,
                    location: job.location || "",
                    email: company?.Email || "",
                    phone: company?.ContactPerson || "",
                    registrationFee: 0,
                    description: job.description || ""
                })
            });
        })
        .then(res => res.json())
        .then(data => {
            fraudCache[id] = data;
            renderGauge(id, data);
        })
        .catch(err => console.error(`Fraud check failed for ${id}:`, err));
}

function renderGauge(id, data) {
    const gauge = document.getElementById(`risk-${id}`);
    if (!gauge) return;

    const score = Number(data.riskScore || 0);
    let color = "#22c55e";
    if (data.riskLevel === "Medium") color = "#facc15";
    if (data.riskLevel === "High") color = "#ef4444";

    const degree = (score / 100) * 360;
    gauge.style.background = `conic-gradient(${color} ${degree}deg, #e5e7eb ${degree}deg)`;
    
    const span = gauge.querySelector("span");
    if (span) span.textContent = score;
}

function showFraudDetails(id) {
    const data = fraudCache[id];
    if (!data) return;

    const modal = document.getElementById("fraudModal");
    const levelEl = document.getElementById("modalRiskLevel");
    const scoreEl = document.getElementById("modalRiskScore");
    const reasonsEl = document.getElementById("modalReasons");

    if (modal && levelEl && scoreEl && reasonsEl) {
        levelEl.textContent = data.riskLevel;
        levelEl.style.color = (data.riskLevel === "High") ? "#ef4444" : (data.riskLevel === "Medium" ? "#facc15" : "#22c55e");
        scoreEl.textContent = data.riskScore;
        
        reasonsEl.innerHTML = "";
        if (data.reasons && data.reasons.length > 0) {
            data.reasons.forEach(r => {
                const li = document.createElement("li");
                li.textContent = r;
                reasonsEl.appendChild(li);
            });
        } else {
            reasonsEl.innerHTML = "<li>No specific risk factors detected.</li>";
        }

        modal.classList.add("active");
    }
}

function closeFraudModal() {
    const modal = document.getElementById("fraudModal");
    if (modal) modal.classList.remove("active");
}



function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
    }
    
    if (sectionId === 'internships') {
        loadAllInternships();
    } else if (sectionId === 'saved') {
        loadSavedInternships();
    } else if (sectionId === 'fraud') {
        loadMyFraudReports();
    } else if (sectionId === 'skills') {
        loadCurrentSkills();
    } else if (sectionId === 'quiz') {
        loadAllQuizzes();
    } else if (sectionId === 'notifications') {
        loadNotifications(localStorage.getItem('userEmail'));
    } else if (sectionId === 'analytics') {
        loadAnalytics();
    }
}

function applyNow(jobTitle, company) {
    const container = document.querySelector('[id="allInternshipsContainer"], [id="recc"]');
    const internshipCard = event.target.closest('.internship-card');
    let internshipId = '';
    let location = '';
    let stipend = '';
    if (internshipCard) {
        const locationStipendText = internshipCard.querySelector('p:nth-of-type(2)')?.textContent || '';
        const parts = locationStipendText.split('|');
        location = parts[0]?.trim() || '';
        stipend = parts[1]?.replace('Rs.', '').replace('/month', '').trim() || '';
        internshipId = `${company}_${jobTitle}`.replace(/\s+/g, '_');
    }
    if (confirm(`Do you want to apply for ${jobTitle} at ${company}?`)) {
        fetch('/api/getUser')
            .then(res => res.json())
            .then(user => {
                return fetch('/application/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidateEmail: user.Email,
                        internshipId,
                        internshipTitle: jobTitle,
                        companyName: company,
                        location,
                        stipend
                    })
                });
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error === 'Already applied' ? 'You have already applied for this internship!' : 'Error: ' + data.error);
                } else {
                    alert(`Application submitted successfully for ${jobTitle} at ${company}!\n\nYou will receive a confirmation email shortly.`);
                    loadApplicationCount();
                }
            })
            .catch(err => {
                console.error('Error applying:', err);
                alert('Failed to submit application. Please try again.');
            });
    }
}

function saveJob(jobTitle, company) {
    const internshipCard = event.target.closest('.internship-card');
    let location = '', stipend = '', skills = '';
    if (internshipCard) {
        const locationStipendText = internshipCard.querySelector('p:nth-of-type(2)')?.textContent || '';
        const parts = locationStipendText.split('|');
        location = parts[0]?.trim() || '';
        stipend = parts[1]?.replace('Rs.', '').replace('/month', '').trim() || '';
        const skillsText = internshipCard.querySelector('p:nth-of-type(3)')?.textContent || '';
        skills = skillsText.replace('Skills:', '').trim();
    }
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            return fetch('/application/saveInternship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateEmail: user.Email,
                    internshipTitle: jobTitle,
                    companyName: company,
                    location,
                    stipend,
                    skills
                })
            });
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error === 'Already saved' ? 'This internship is already in your saved list!' : 'Error: ' + data.error);
            } else {
                alert(`${jobTitle} at ${company} has been saved to your Saved Internships!`);
                updateSavedCount();
            }
        })
        .catch(err => {
            console.error('Error saving internship:', err);
            alert('Failed to save internship. Please try again.');
        });
}

function withdrawApplication(jobTitle, company) {
    if (confirm(`Are you sure you want to withdraw your application for ${jobTitle} at ${company}?`)) {
        alert(`Your application for ${jobTitle} at ${company} has been withdrawn.`);
    }
}

function viewDetails(jobTitle, company) {
    alert(`Application Details:\n\nPosition: ${jobTitle}\nCompany: ${company}\nStatus: Interview Scheduled\nInterview Date: Jan 25, 2024\nInterview Time: 10:00 AM\nInterview Mode: Virtual (Google Meet)\n\nPlease check your email for the meeting link.`);
}

function removeFromSaved(jobTitle, company) {
    if (confirm(`Remove ${jobTitle} at ${company} from saved internships?`)) {
        fetch('/api/getUser')
            .then(res => res.json())
            .then(user => {
                return fetch('/application/removeSaved', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidateEmail: user.Email,
                        internshipTitle: jobTitle,
                        companyName: company
                    })
                });
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(`${jobTitle} at ${company} has been removed from your saved list.`);
                    loadSavedInternships();
                    updateSavedCount();
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(err => {
                console.error('Error removing saved internship:', err);
                alert('Failed to remove internship.');
            });
    }
}
function updateCandidateProfile(){
const inputs=document.querySelectorAll('#profile input');
const select=document.querySelector('#profile select');
fetch('/api/updateProfile',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
Name:inputs[0].value,
Email:inputs[1].value,
Education:select.value,
Skills:inputs[3].value,
Portfolio:inputs[5].value,
Location:inputs[2].value
})
})
.then(res=>res.json())
.then(data=>{
if(data.error){
alert('Error: '+data.error);
}else{
alert('Profile updated successfully!');
window.location.reload();
}
})
.catch(err=>{
console.error('Error updating profile:',err);
alert('Failed to update profile.');
});
}
function loadCandidateProfileForm(data){
const inputs=document.querySelectorAll('#profile input');
const select=document.querySelector('#profile select');
if(inputs[0])inputs[0].value=data.Name||'';
if(inputs[1])inputs[1].value=data.Email||'';
if(select)select.value=data.Education||'';
if(inputs[3])inputs[3].value=data.Skills||'';
if(inputs[5])inputs[5].value=data.Portfolio||'';
}
function loadApplications(email) {
    fetch(`/application/candidate?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(apps => {
            const recentContainer = document.getElementById('recentApplicationsContainer');
            const allContainer = document.querySelector('#applications .section');
            if (recentContainer) {
                if (apps.length === 0) {
                    recentContainer.innerHTML = '<p style="text-align:center;color:#666;">No recent applications</p>';
                } else {
                    recentContainer.innerHTML = '';
                    apps.slice(0, 3).forEach(app => {
                        const card = `
                            <div class="internship-card">
                                <h3>${app.internshipTitle}</h3>
                                <p>${app.companyName}</p>
                                <p><strong>Status:</strong> <span style="color:#f59e0b">${app.status}</span></p>
                                <p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
                            </div>`;
                        recentContainer.insertAdjacentHTML('beforeend', card);
                    });
                }
            }
            if (allContainer) {
                const existingCards = allContainer.querySelectorAll('.internship-card');
                existingCards.forEach(card => card.remove());
                if (apps.length === 0) {
                    allContainer.insertAdjacentHTML('beforeend', '<p style="text-align:center;color:#666;">No applications yet</p>');
                } else {
                    apps.forEach(app => {
                        const card = `
                            <div class="internship-card">
                                <h3>${app.internshipTitle}</h3>
                                <p>${app.companyName}</p>
                                <span class="trust-badge trust-high">Applied</span>
                                <p><strong>Status:</strong> <span style="color:#f59e0b">${app.status}</span></p>
                                <p><strong>Applied:</strong> ${new Date(app.appliedDate).toLocaleDateString()}</p>
                            </div>`;
                        allContainer.insertAdjacentHTML('beforeend', card);
                    });
                }
            }
        })
        .catch(err => console.error('Error loading applications:', err));
}
function loadApplicationCount() {
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            return fetch(`/application/candidate?email=${encodeURIComponent(user.Email)}`);
        })
        .then(res => res.json())
        .then(apps => {
            const countEl = document.getElementById('statApplications');
            if (countEl) {
                countEl.textContent = apps.length;
            }
        })
        .catch(err => console.error('Error loading count:', err));
}
function updateSavedCount() {
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            return fetch(`/application/savedInternships?email=${encodeURIComponent(user.Email)}`);
        })
        .then(res => res.json())
        .then(saved => {
            const countEl = document.getElementById('statSaved');
            if (countEl) {
                countEl.textContent = saved.length;
            }
        })
        .catch(err => console.error('Error loading saved count:', err));
}
function loadSavedInternships() {
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            return fetch(`/application/savedInternships?email=${encodeURIComponent(user.Email)}`);
        })
        .then(res => res.json())
        .then(saved => {
            const container = document.querySelector('#saved .section');
            if (!container) return;
            const existingCards = container.querySelectorAll('.internship-card');
            existingCards.forEach(card => card.remove());
            if (saved.length === 0) {
                container.insertAdjacentHTML('beforeend', '<p style="text-align:center;color:#666;">No saved internships yet</p>');
            } else {
                saved.forEach(item => {
                    const title = (item.internshipTitle || '').replace(/'/g, "\\'");
                    const company = (item.companyName || '').replace(/'/g, "\\'");
                    const card = `
                        <div class="internship-card">
                            <h3>${item.internshipTitle}</h3>
                            <p>${item.companyName}</p>
                            <span class="trust-badge trust-high">Verified</span>
                            <p>${item.location || 'Location'} | Rs.${item.stipend || '0'}/month</p>
                            <button class="btn btn-primary btn-small" onclick="applyNow('${title}', '${company}')">Apply Now</button>
                            <button class="btn btn-secondary btn-small" onclick="removeFromSaved('${title}', '${company}')">Remove</button>
                        </div>`;
                    container.insertAdjacentHTML('beforeend', card);
                });
            }
        })
        .catch(err => console.error('Error loading saved internships:', err));
}
function submitFraudReport() {
    const companyName = document.getElementById('fraudCompanyName').value;
    const internshipTitle = document.getElementById('fraudInternshipTitle').value;
    const issue = document.getElementById('fraudIssue').value;
    const severity = document.getElementById('fraudSeverity').value;
    const description = document.getElementById('fraudDescription').value;
    if (!companyName || !internshipTitle || !description) {
        alert('Please fill in all required fields');
        return;
    }
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            return fetch('/getData/submitFraudReport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    internshipTitle,
                    reportedBy: user.Email,
                    issue: `${issue}: ${description}`,
                    severity
                })
            });
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Fraud report submitted successfully! Government authorities will review your report.');
                document.getElementById('fraudCompanyName').value = '';
                document.getElementById('fraudInternshipTitle').value = '';
                document.getElementById('fraudDescription').value = '';
                loadMyFraudReports();
            } else {
                alert('Error submitting report: ' + data.error);
            }
        })
        .catch(err => {
            console.error('Error submitting fraud report:', err);
            alert('Failed to submit report. Please try again.');
        });
}
function loadCurrentSkills() {
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            const container = document.getElementById('currentSkillsContainer');
            if (user.Skills) {
                const skills = user.Skills.split(',').map(s => s.trim()).filter(s => s);
                if (skills.length > 0) {
                    container.innerHTML = skills.map(skill => `<span class="skill-item">${skill}</span>`).join('');
                } else {
                    container.innerHTML = '<p style="color:#666;">No skills added yet. Update your profile to add skills.</p>';
                }
            } else {
                container.innerHTML = '<p style="color:#666;">No skills added yet. Update your profile to add skills.</p>';
            }
        })
        .catch(err => {
            console.error('Error loading skills:', err);
            document.getElementById('currentSkillsContainer').innerHTML = '<p style="color:#ef4444;">Error loading skills</p>';
        });
}
function analyzeSkillGap() {
    const targetRole = document.getElementById('targetRole').value;
    if (!targetRole) return;
    const roleSkills = {
        'Full Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Git'],
        'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'TypeScript', 'Responsive Design', 'Git'],
        'Backend Developer': ['Node.js', 'Express.js', 'MongoDB', 'SQL', 'REST APIs', 'Python', 'Java', 'Git'],
        'Data Analyst': ['Python', 'SQL', 'Excel', 'Tableau', 'Power BI', 'Statistics', 'Data Visualization'],
        'UI/UX Designer': ['Figma', 'Adobe XD', 'Sketch', 'Wireframing', 'Prototyping', 'User Research', 'HTML', 'CSS']
    };
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            const userSkills = user.Skills ? user.Skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
            const requiredSkills = roleSkills[targetRole].map(s => s.toLowerCase());
            const matching = roleSkills[targetRole].filter(skill => userSkills.includes(skill.toLowerCase()));
            const missing = roleSkills[targetRole].filter(skill => !userSkills.includes(skill.toLowerCase()));
            document.getElementById('skillGapResults').classList.remove('hidden');
            document.getElementById('matchingSkills').innerHTML = matching.length > 0 
                ? matching.map(skill => `<span class="skill-item" style="background:#d1fae5;color:#065f46">${skill}</span>`).join('')
                : '<p style="color:#666;">No matching skills found</p>';
            document.getElementById('missingSkills').innerHTML = missing.length > 0
                ? missing.map(skill => `<span class="skill-item" style="background:#fee2e2;color:#991b1b">${skill}</span>`).join('')
                : '<p style="color:#10b981;">You have all required skills!</p>';
            const recommendations = [
                `<p><strong>Add to Resume:</strong> Highlight these skills - ${missing.slice(0, 3).join(', ')}</p>`,
                `<p><strong>Priority Learning:</strong> Focus on ${missing[0] || 'advanced topics'} first as it's most in-demand</p>`,
                `<p><strong>Skill Match:</strong> You have ${matching.length} out of ${roleSkills[targetRole].length} required skills (${Math.round((matching.length/roleSkills[targetRole].length)*100)}%)</p>`,
                missing.length > 0 ? `<p><strong>Action:</strong> Complete courses in ${missing.slice(0, 2).join(' and ')} to become job-ready</p>` : '<p><strong>Status:</strong> You are ready to apply for this role!</p>'
            ];
            document.getElementById('recommendations').innerHTML = recommendations.join('');
        })
        .catch(err => console.error('Error analyzing skills:', err));
}
function generateRoadmap() {
    const targetRole = document.getElementById('targetRole').value;
    if (!targetRole) {
        alert('Please select a target role first from Skill Gap Analysis');
        return;
    }
    const skillConcepts = {
        'Node.js': {
            duration: '2-3 weeks',
            concepts: ['Introduction to Node.js & Runtime', 'NPM Package Manager', 'Modules (require/import)', 'File System Operations', 'Event Loop & Async Programming', 'Creating HTTP Server', 'Environment Variables']
        },
        'Express.js': {
            duration: '2 weeks',
            concepts: ['Express Setup & Routing', 'Middleware Functions', 'Request & Response Objects', 'REST API Design', 'Error Handling', 'Template Engines', 'Static Files Serving']
        },
        'MongoDB': {
            duration: '2-3 weeks',
            concepts: ['NoSQL Database Basics', 'MongoDB Installation & Setup', 'CRUD Operations', 'Schema Design', 'Mongoose ODM', 'Indexing & Performance', 'Aggregation Pipeline']
        },
        'REST APIs': {
            duration: '1-2 weeks',
            concepts: ['HTTP Methods (GET, POST, PUT, DELETE)', 'Status Codes', 'JSON Data Format', 'API Authentication', 'CORS Handling', 'API Documentation', 'Testing APIs with Postman']
        },
        'React': {
            duration: '3-4 weeks',
            concepts: ['JSX Syntax', 'Components & Props', 'State Management', 'Hooks (useState, useEffect)', 'Event Handling', 'Conditional Rendering', 'React Router', 'API Integration']
        },
        'Vue.js': {
            duration: '2-3 weeks',
            concepts: ['Vue Instance & Templates', 'Directives (v-if, v-for)', 'Data Binding', 'Components & Props', 'Vue Router', 'Vuex State Management', 'Lifecycle Hooks']
        },
        'TypeScript': {
            duration: '2 weeks',
            concepts: ['Type Annotations', 'Interfaces & Types', 'Classes & Objects', 'Generics', 'Enums', 'Type Guards', 'Decorators']
        },
        'Python': {
            duration: '3-4 weeks',
            concepts: ['Python Syntax & Variables', 'Data Types & Structures', 'Functions & Modules', 'OOP Concepts', 'File Handling', 'Exception Handling', 'Libraries (NumPy, Pandas)']
        },
        'SQL': {
            duration: '2 weeks',
            concepts: ['Database Basics', 'SELECT Queries', 'WHERE & Filtering', 'JOINs (INNER, LEFT, RIGHT)', 'Aggregate Functions', 'GROUP BY & HAVING', 'Subqueries', 'Indexes']
        },
        'Java': {
            duration: '4-5 weeks',
            concepts: ['Java Syntax & OOP', 'Classes & Objects', 'Inheritance & Polymorphism', 'Collections Framework', 'Exception Handling', 'Multithreading', 'JDBC Database']
        },
        'Figma': {
            duration: '1-2 weeks',
            concepts: ['Interface Basics', 'Frames & Layers', 'Auto Layout', 'Components & Variants', 'Prototyping', 'Design Systems', 'Collaboration Features']
        },
        'Adobe XD': {
            duration: '1-2 weeks',
            concepts: ['Artboards & Grids', 'Vector Tools', 'Repeat Grid', 'Components & States', 'Prototyping & Interactions', 'Plugins', 'Sharing & Feedback']
        },
        'Wireframing': {
            duration: '1 week',
            concepts: ['Low-fidelity vs High-fidelity', 'Layout Principles', 'User Flow Diagrams', 'Information Architecture', 'Sketching Techniques', 'Tools (Balsamiq, Sketch)']
        },
        'Prototyping': {
            duration: '1-2 weeks',
            concepts: ['Interactive Prototypes', 'Clickable Mockups', 'Animations & Transitions', 'User Testing', 'Feedback Integration', 'Handoff to Developers']
        },
        'User Research': {
            duration: '2 weeks',
            concepts: ['User Interviews', 'Surveys & Questionnaires', 'Persona Creation', 'User Journey Mapping', 'Usability Testing', 'A/B Testing', 'Analytics & Insights']
        },
        'HTML': {
            duration: '1 week',
            concepts: ['HTML Structure & Tags', 'Semantic HTML', 'Forms & Input Types', 'Tables & Lists', 'Links & Navigation', 'Media Elements', 'Accessibility']
        },
        'CSS': {
            duration: '2 weeks',
            concepts: ['Selectors & Specificity', 'Box Model', 'Flexbox Layout', 'Grid Layout', 'Responsive Design', 'Animations & Transitions', 'CSS Variables']
        },
        'JavaScript': {
            duration: '3-4 weeks',
            concepts: ['Variables & Data Types', 'Functions & Scope', 'Arrays & Objects', 'DOM Manipulation', 'Events & Event Listeners', 'Async/Await & Promises', 'ES6+ Features']
        },
        'Git': {
            duration: '1 week',
            concepts: ['Version Control Basics', 'Git Init & Clone', 'Commit & Push', 'Branches & Merging', 'Pull Requests', 'Conflict Resolution', 'GitHub/GitLab']
        },
        'Responsive Design': {
            duration: '1 week',
            concepts: ['Mobile-First Approach', 'Media Queries', 'Flexible Grids', 'Viewport Meta Tag', 'Responsive Images', 'Breakpoints', 'Testing on Devices']
        },
        'Excel': {
            duration: '1-2 weeks',
            concepts: ['Formulas & Functions', 'VLOOKUP & HLOOKUP', 'Pivot Tables', 'Data Validation', 'Conditional Formatting', 'Charts & Graphs', 'Macros Basics']
        },
        'Tableau': {
            duration: '2 weeks',
            concepts: ['Data Connection', 'Worksheets & Dashboards', 'Calculated Fields', 'Filters & Parameters', 'Visual Analytics', 'Story Telling', 'Publishing Reports']
        },
        'Power BI': {
            duration: '2 weeks',
            concepts: ['Data Import & Transformation', 'DAX Formulas', 'Visualizations', 'Reports & Dashboards', 'Power Query', 'Data Modeling', 'Sharing & Collaboration']
        },
        'Statistics': {
            duration: '2-3 weeks',
            concepts: ['Descriptive Statistics', 'Probability Basics', 'Distributions', 'Hypothesis Testing', 'Correlation & Regression', 'Sampling Methods', 'Statistical Inference']
        },
        'Data Visualization': {
            duration: '1-2 weeks',
            concepts: ['Chart Types Selection', 'Color Theory', 'Dashboard Design', 'Storytelling with Data', 'Best Practices', 'Tools (Matplotlib, Seaborn)', 'Interactive Visualizations']
        },
        'Sketch': {
            duration: '1-2 weeks',
            concepts: ['Vector Editing', 'Symbols & Overrides', 'Artboards', 'Plugins Ecosystem', 'Prototyping', 'Design Systems', 'Export & Handoff']
        }
    };
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            const roleSkills = {
                'Full Stack Developer': ['Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'React', 'JavaScript', 'HTML', 'CSS', 'Git'],
                'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'TypeScript', 'Responsive Design', 'Git'],
                'Backend Developer': ['Node.js', 'Express.js', 'MongoDB', 'SQL', 'REST APIs', 'Python', 'Java', 'Git'],
                'Data Analyst': ['Python', 'SQL', 'Excel', 'Tableau', 'Power BI', 'Statistics', 'Data Visualization'],
                'UI/UX Designer': ['Figma', 'Adobe XD', 'Sketch', 'Wireframing', 'Prototyping', 'User Research', 'HTML', 'CSS']
            };
            const userSkills = user.Skills ? user.Skills.split(',').map(s => s.trim().toLowerCase()) : [];
            const requiredSkills = roleSkills[targetRole];
            const missingSkills = requiredSkills.filter(skill => !userSkills.includes(skill.toLowerCase()));
            const roadmapContainer = document.getElementById('roadmapContent');
            if (missingSkills.length === 0) {
                roadmapContainer.innerHTML = '<div style="text-align:center;padding:40px;"><h3 style="color:#10b981;">🎉 Congratulations!</h3><p style="color:#666;margin-top:10px;">You already have all the skills needed for ' + targetRole + '!</p></div>';
                return;
            }
            let html = '<h3 style="color:#2563eb;margin-bottom:20px;">Learning Path for ' + targetRole + '</h3>';
            let weekCounter = 1;
            missingSkills.forEach((skill, index) => {
                const concepts = skillConcepts[skill];
                if (concepts) {
                    const borderColor = index === 0 ? '#6366f1' : '#e5e7eb';
                    html += `
                        <div style="border-left:3px solid ${borderColor};padding-left:20px;margin-bottom:30px;">
                            <h3 style="color:#1e40af;">${skill}</h3>
                            <p style="color:#666;font-size:0.9rem;margin:5px 0;">⏱️ Duration: ${concepts.duration}</p>
                            <p style="color:#666;font-weight:500;margin:15px 0 10px 0;">📚 Topics to Learn:</p>
                            <ul style="margin:0;padding-left:20px;">
                                ${concepts.concepts.map(concept => `<li style="color:#666;margin:8px 0;">${concept}</li>`).join('')}
                            </ul>
                        </div>`;
                }
            });
            html += '<div style="background:#eff6ff;padding:20px;border-radius:8px;margin-top:30px;"><h3 style="color:#1e40af;margin-bottom:10px;">💡 Learning Tips</h3><ul style="margin:0;padding-left:20px;"><li style="color:#666;margin:8px 0;">Practice daily for at least 1-2 hours</li><li style="color:#666;margin:8px 0;">Build small projects after each topic</li><li style="color:#666;margin:8px 0;">Join online communities for support</li><li style="color:#666;margin:8px 0;">Take notes and create a portfolio</li></ul></div>';
            roadmapContainer.innerHTML = html;
            showSection('roadmap');
        })
        .catch(err => console.error('Error generating roadmap:', err));
}
function loadMyFraudReports() {
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            return fetch('/getData/getAllFraudReports');
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                return fetch('/api/getUser').then(res => res.json()).then(user => {
                    const myReports = data.reports.filter(r => r.reportedBy === user.Email);
                    const container = document.getElementById('myFraudReports');
                    if (!container) return;
                    if (myReports.length === 0) {
                        container.innerHTML = '<p style="text-align:center;color:#666;">No reports submitted yet</p>';
                    } else {
                        container.innerHTML = '';
                        myReports.forEach(report => {
                            const severityClass = report.severity === 'High' ? 'trust-low' : report.severity === 'Medium' ? 'trust-medium' : 'trust-high';
                            const statusClass = report.status === 'Resolved' ? 'trust-high' : report.status === 'Under Review' ? 'trust-medium' : 'trust-medium';
                            const card = `
                                <div class="internship-card">
                                    <h3>${report.companyName}</h3>
                                    <span class="trust-badge ${severityClass}">${report.severity} Severity</span>
                                    <span class="trust-badge ${statusClass}" style="margin-left:10px">${report.status}</span>
                                    <p><strong>Issue:</strong> ${report.issue}</p>
                                    <p><strong>Reported:</strong> ${new Date(report.reportDate).toLocaleDateString()}</p>
                                </div>`;
                            container.insertAdjacentHTML('beforeend', card);
                        });
                    }
                });
            }
        })
        .catch(err => {
            console.error('Error loading fraud reports:', err);
            const container = document.getElementById('myFraudReports');
            if (container) {
                container.innerHTML = '<p style="text-align:center;color:#ef4444;">Error loading reports</p>';
            }
        });
}

const allQuizzes = [
    {skill: 'JavaScript', questions: 20, duration: 30, level: 'Beginner', roles: ['Full Stack Developer', 'Frontend Developer']},
    {skill: 'React', questions: 25, duration: 40, level: 'Intermediate', roles: ['Full Stack Developer', 'Frontend Developer']},
    {skill: 'Node.js', questions: 30, duration: 45, level: 'Intermediate', roles: ['Full Stack Developer', 'Backend Developer']},
    {skill: 'Express.js', questions: 20, duration: 30, level: 'Intermediate', roles: ['Full Stack Developer', 'Backend Developer']},
    {skill: 'MongoDB', questions: 25, duration: 35, level: 'Beginner', roles: ['Full Stack Developer', 'Backend Developer']},
    {skill: 'SQL', questions: 30, duration: 40, level: 'Beginner', roles: ['Backend Developer', 'Data Analyst']},
    {skill: 'Python', questions: 35, duration: 50, level: 'Beginner', roles: ['Backend Developer', 'Data Analyst']},
    {skill: 'HTML', questions: 15, duration: 20, level: 'Beginner', roles: ['Full Stack Developer', 'Frontend Developer', 'UI/UX Designer']},
    {skill: 'CSS', questions: 20, duration: 30, level: 'Beginner', roles: ['Full Stack Developer', 'Frontend Developer', 'UI/UX Designer']},
    {skill: 'TypeScript', questions: 25, duration: 35, level: 'Intermediate', roles: ['Full Stack Developer', 'Frontend Developer']},
    {skill: 'Vue.js', questions: 25, duration: 40, level: 'Intermediate', roles: ['Frontend Developer']},
    {skill: 'Git', questions: 15, duration: 20, level: 'Beginner', roles: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer']},
    {skill: 'REST APIs', questions: 20, duration: 30, level: 'Intermediate', roles: ['Full Stack Developer', 'Backend Developer']},
    {skill: 'Figma', questions: 20, duration: 30, level: 'Beginner', roles: ['UI/UX Designer']},
    {skill: 'Adobe XD', questions: 20, duration: 30, level: 'Beginner', roles: ['UI/UX Designer']},
    {skill: 'Wireframing', questions: 15, duration: 25, level: 'Beginner', roles: ['UI/UX Designer']},
    {skill: 'User Research', questions: 20, duration: 30, level: 'Intermediate', roles: ['UI/UX Designer']},
    {skill: 'Excel', questions: 25, duration: 35, level: 'Beginner', roles: ['Data Analyst']},
    {skill: 'Tableau', questions: 30, duration: 40, level: 'Intermediate', roles: ['Data Analyst']},
    {skill: 'Power BI', questions: 30, duration: 40, level: 'Intermediate', roles: ['Data Analyst']},
    {skill: 'Statistics', questions: 35, duration: 50, level: 'Intermediate', roles: ['Data Analyst']}
];
function loadAllQuizzes() {
    displayQuizzes(allQuizzes);
}
function showMySkillsQuizzes() {
    fetch('/api/getUser')
        .then(res => res.json())
        .then(user => {
            const userSkills = user.Skills ? user.Skills.split(',').map(s => s.trim().toLowerCase()) : [];
            const filteredQuizzes = allQuizzes.filter(quiz => userSkills.includes(quiz.skill.toLowerCase()));
            if (filteredQuizzes.length === 0) {
                document.getElementById('quizListContainer').innerHTML = '<p style="text-align:center;color:#666;">No quizzes match your skills. Add skills to your profile first.</p>';
            } else {
                displayQuizzes(filteredQuizzes);
            }
        })
        .catch(err => console.error('Error loading user skills:', err));
}
function showAllQuizzes() {
    document.getElementById('quizRoleFilter').value = 'all';
    displayQuizzes(allQuizzes);
}
function filterQuizzes() {
    const selectedRole = document.getElementById('quizRoleFilter').value;
    if (selectedRole === 'all') {
        displayQuizzes(allQuizzes);
    } else {
        const filteredQuizzes = allQuizzes.filter(quiz => quiz.roles.includes(selectedRole));
        displayQuizzes(filteredQuizzes);
    }
}
function displayQuizzes(quizzes) {
    fetch('/quiz/getResults?email=' + encodeURIComponent(localStorage.getItem('userEmail') || ''))
        .then(res => res.json())
        .then(data => {
            const userResults = data.success ? data.results : [];
            const container = document.getElementById('quizListContainer');
            if (quizzes.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:#666;">No quizzes available for this filter.</p>';
                return;
            }
            container.innerHTML = quizzes.map(quiz => {
                const result = userResults.find(r => r.skill === quiz.skill);
                const statusHtml = result 
                    ? `<p><strong>Score:</strong> ${result.score}% | <strong>Percentile:</strong> ${result.percentile}th</p><p style="color:#10b981;">✓ Completed</p>`
                    : '<p><strong>Status:</strong> Not Attempted</p>';
                const btnClass = result ? 'btn-secondary' : 'btn-primary';
                const btnText = result ? 'Retake' : 'Start Quiz';
                return `
                    <div class="internship-card">
                        <h3>${quiz.skill}</h3>
                        <p>${quiz.questions} Questions | ${quiz.duration} Minutes | ${quiz.level} Level</p>
                        <p><strong>Roles:</strong> ${quiz.roles.join(', ')}</p>
                        ${statusHtml}
                        <a href="quiz.html?skill=${quiz.skill}" class="btn ${btnClass} btn-small" style="text-decoration:none">${btnText}</a>
                    </div>
                `;
            }).join('');
        })
        .catch(err => {
            console.error('Error loading quiz results:', err);
            const container = document.getElementById('quizListContainer');
            container.innerHTML = quizzes.map(quiz => `
                <div class="internship-card">
                    <h3>${quiz.skill}</h3>
                    <p>${quiz.questions} Questions | ${quiz.duration} Minutes | ${quiz.level} Level</p>
                    <p><strong>Roles:</strong> ${quiz.roles.join(', ')}</p>
                    <p><strong>Status:</strong> Not Attempted</p>
                    <a href="quiz.html?skill=${quiz.skill}" class="btn btn-primary btn-small" style="text-decoration:none">Start Quiz</a>
                </div>
            `).join('');
        });
}
function loadNotifications(email){
if(!email)return;
console.log('Loading notifications for:',email);
fetch(`/notification/getNotifications?email=${encodeURIComponent(email)}`)
.then(res=>res.json())
.then(data=>{
console.log('Notifications response:',data);
if(data.success){
const container=document.getElementById('notificationsContainer');
const unread=data.notifications.filter(n=>!n.read).length;
const badge=document.getElementById('notifBadge');
if(unread>0){
badge.textContent=unread;
badge.style.display='inline';
}else{
badge.style.display='none';
}
if(data.notifications.length===0){
container.innerHTML='<p style="text-align:center;color:#666;">No notifications yet</p>';
return;
}
container.innerHTML='';
data.notifications.forEach(notif=>{
console.log('Processing notification:',notif);
const typeColor=notif.type==='Shortlisted'?'#10b981':notif.type==='Rejected'?'#ef4444':'#3b82f6';
const bgColor=notif.read?'#f9fafb':'#eff6ff';
const typeLabel=notif.type==='Info'?'Interview Scheduled':notif.type;
const card=`
<div class="internship-card" style="background:${bgColor};border-left:4px solid ${typeColor};">
<h3 style="color:${typeColor};">${typeLabel}</h3>
<p><strong>${notif.internshipTitle||'N/A'}</strong>${notif.companyName?' at '+notif.companyName:''}</p>
<p>${notif.message}</p>
<p style="font-size:0.85rem;color:#666;">${new Date(notif.createdAt).toLocaleString()}</p>
${!notif.read?`<button class="btn btn-secondary btn-small" onclick="markNotificationRead('${notif._id}')">Mark as Read</button>`:''}
</div>`;
container.insertAdjacentHTML('beforeend',card);
});
}
})
.catch(err=>console.error('Error loading notifications:',err));
}
function markNotificationRead(id){
fetch('/notification/markAsRead',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({id})
})
.then(res=>res.json())
.then(data=>{
if(data.success){
loadNotifications(localStorage.getItem('userEmail'));
}
})
.catch(err=>console.error('Error marking notification:',err));
}
function loadAnalytics(){
Promise.all([
fetch('/api/getUser').then(r=>r.json()),
fetch(`/application/candidate?email=${localStorage.getItem('userEmail')}`).then(r=>r.json()),
fetch(`/application/savedInternships?email=${localStorage.getItem('userEmail')}`).then(r=>r.json()),
fetch(`/quiz/getResults?email=${localStorage.getItem('userEmail')}`).then(r=>r.json())
])
.then(([user,apps,saved,quizData])=>{
const quizResults=quizData.success?quizData.results:[];
const appRate=saved.length>0?Math.round((apps.length/saved.length)*100):0;
const shortlisted=apps.filter(a=>a.status==='Shortlisted').length;
const responseRate=apps.length>0?Math.round((shortlisted/apps.length)*100):0;
const quizAvg=quizResults.length>0?Math.round(quizResults.reduce((sum,q)=>sum+q.score,0)/quizResults.length):0;
document.getElementById('analyticsAppRate').textContent=appRate+'%';
document.getElementById('analyticsResponseRate').textContent=responseRate+'%';
document.getElementById('analyticsQuizAvg').textContent=quizAvg+'%';
document.getElementById('analyticsSkillsTested').textContent=quizResults.length;
const statusCounts={UnderReview:0,Shortlisted:0,Rejected:0};
apps.forEach(app=>{
if(app.status==='Shortlisted')statusCounts.Shortlisted++;
else if(app.status==='Rejected')statusCounts.Rejected++;
else statusCounts.UnderReview++;
});
const statusBreakdown=document.getElementById('statusBreakdown');
statusBreakdown.innerHTML=`
<div class="internship-card">
<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
<span>Under Review</span>
<strong style="color:#f59e0b;">${statusCounts.UnderReview}</strong>
</div>
<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
<span>Shortlisted</span>
<strong style="color:#10b981;">${statusCounts.Shortlisted}</strong>
</div>
<div style="display:flex;justify-content:space-between;">
<span>Rejected</span>
<strong style="color:#ef4444;">${statusCounts.Rejected}</strong>
</div>
</div>`;
const topQuizzes=document.getElementById('topQuizzes');
if(quizResults.length===0){
topQuizzes.innerHTML='<p style="text-align:center;color:#666;">No quiz attempts yet</p>';
}else{
const sorted=quizResults.sort((a,b)=>b.score-a.score).slice(0,5);
topQuizzes.innerHTML=sorted.map(q=>{
const color=q.score>=75?'#10b981':q.score>=50?'#f59e0b':'#ef4444';
return`
<div class="internship-card">
<div style="display:flex;justify-content:space-between;align-items:center;">
<div>
<h4 style="margin:0;color:#1e40af;">${q.skill}</h4>
<p style="margin:5px 0 0;color:#666;font-size:0.85rem;">Percentile: ${q.percentile}th</p>
</div>
<div style="text-align:right;">
<div style="font-size:1.5rem;font-weight:700;color:${color};">${q.score}%</div>
<p style="margin:5px 0 0;color:#666;font-size:0.85rem;">${new Date(q.completedDate).toLocaleDateString()}</p>
</div>
</div>
</div>`;
}).join('');
}
})
.catch(err=>console.error('Error loading analytics:',err));
}

function checkATSScore() {
    const resumeFile = document.getElementById('resumeFile').files[0];
    const jobDescription = document.getElementById('jobDescription').value;
    
    if (!resumeFile || !jobDescription) {
        alert('Please upload resume PDF and enter job description');
        return;
    }
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);
    
    fetch('/ats/checkPDF', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert('Error: ' + data.error);
            return;
        }
        
        const resultsDiv = document.getElementById('atsResults');
        const scoreDisplay = document.getElementById('atsScoreDisplay');
        const keywordsSection = document.getElementById('missingKeywordsSection');
        
        const color = data.atsScore >= 70 ? '#10b981' : data.atsScore >= 50 ? '#f59e0b' : '#ef4444';
        scoreDisplay.textContent = data.atsScore + '%';
        scoreDisplay.style.color = color;
        
        if (data.missingKeywords && data.missingKeywords.length > 0) {
            keywordsSection.innerHTML = `
                <h4 style="color:#ef4444;margin-bottom:10px;">Missing Keywords (Add to Resume)</h4>
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    ${data.missingKeywords.map(kw => `<span class="skill-item" style="background:#fee2e2;color:#991b1b;">${kw}</span>`).join('')}
                </div>
            `;
        } else {
            keywordsSection.innerHTML = '<p style="color:#10b981;">✓ Your resume contains all important keywords!</p>';
        }
        
        resultsDiv.classList.remove('hidden');
    })
    .catch(err => {
        console.error('Error checking ATS:', err);
        alert('Failed to check ATS score. Please try again.');
    });
}
