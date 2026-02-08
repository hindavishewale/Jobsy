async function loadStats() {
    try {
        const response = await fetch('http://localhost:3400/getData/getGovStats', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('statTotalCompanies').textContent = data.stats.totalCompanies || 0;
            document.getElementById('statFraudReports').textContent = data.stats.fraudReports || 0;
            document.getElementById('statVerifiedCompanies').textContent = data.stats.verifiedCompanies || 0;
            document.getElementById('statActionsTaken').textContent = data.stats.actionsTaken || 0;
            document.getElementById('pendingReview').textContent = data.stats.pendingReview || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentFraudReports() {
    try {
        const response = await fetch('http://localhost:3400/getData/getRecentFraudReports', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.reports.length > 0) {
            const container = document.getElementById('recentFraudReportsContainer');
            container.innerHTML = data.reports.map(report => `
                <div class="report-card">
                    <span class="severity-${report.severity.toLowerCase()}">${report.severity} Severity</span>
                    <h3>${report.issue}</h3>
                    <p><strong>Company:</strong> ${report.companyName}</p>
                    <p><strong>Reported by:</strong> ${report.reportedBy}</p>
                    <p><strong>Date:</strong> ${new Date(report.reportDate).toLocaleDateString()}</p>
                    <button class="btn btn-primary btn-small" onclick="investigateReport('${report.issue}', '${report.companyName}')">Investigate</button>
                    <button class="btn btn-danger btn-small" onclick="takeAction('${report.companyName}', '${report.issue}')">Take Action</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading fraud reports:', error);
    }
}

async function loadPendingCompanies() {
    try {
        const response = await fetch('http://localhost:3400/getData/getPendingCompanies', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.companies.length > 0) {
            const container = document.getElementById('pendingVerificationsContainer');
            container.innerHTML = data.companies.map(company => `
                <div class="company-card">
                    <h3>${company.CompanyName}</h3>
                    <span class="status-badge status-pending">Pending Verification</span>
                    <p>Industry: ${company.Industry} | Size: ${company.CompanySize}</p>
                    <p><strong>Contact:</strong> ${company.ContactPerson}</p>
                    <p><strong>Registration Date:</strong> ${new Date(company.registrationDate).toLocaleDateString()}</p>
                    <button class="btn btn-secondary btn-small" onclick="approveCompanyAction('${company.Email}')">Approve</button>
                    <button class="btn btn-danger btn-small" onclick="rejectCompanyAction('${company.Email}')">Reject</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading pending companies:', error);
    }
}

async function loadAllFraudReports() {
    try {
        const response = await fetch('http://localhost:3400/getData/getAllFraudReports', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.reports.length > 0) {
            const container = document.getElementById('allFraudReportsContainer');
            container.innerHTML = data.reports.map(report => `
                <div class="report-card">
                    <span class="severity-${report.severity.toLowerCase()}">${report.severity} Severity</span>
                    <h3>${report.issue.split(':')[0]}</h3>
                    <p><strong>Company:</strong> ${report.companyName}</p>
                    <p><strong>Reported by:</strong> ${report.reportedBy}</p>
                    <p><strong>Issue:</strong> ${report.issue}</p>
                    <p><strong>Date:</strong> ${new Date(report.reportDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span style="color:#f59e0b">${report.status}</span></p>
                    <button class="btn btn-primary btn-small">View Details</button>
                    <button class="btn btn-danger btn-small">Take Action</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading all fraud reports:', error);
    }
}

async function loadAllCompanies() {
    try {
        const response = await fetch('http://localhost:3400/getData/getAllCompanies', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.companies.length > 0) {
            const tbody = document.querySelector('#companies tbody');
            tbody.innerHTML = data.companies.map(company => `
                <tr>
                    <td>${company.CompanyName}</td>
                    <td>${company.Industry}</td>
                    <td><span class="status-badge status-${company.verificationStatus.toLowerCase()}">${company.verificationStatus}</span></td>
                    <td>-</td>
                    <td><button class="btn btn-secondary btn-small" onclick='viewCompanyDetails(${JSON.stringify(company).replace(/'/g, "&#39;")})'>View</button></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function viewCompanyDetails(company) {
    const modal = document.getElementById('companyModal');
    const content = document.getElementById('companyDetailsContent');
    content.innerHTML = `
        <h3>${company.CompanyName}</h3>
        <p><strong>Email:</strong> ${company.Email}</p>
        <p><strong>Industry:</strong> ${company.Industry}</p>
        <p><strong>Company Size:</strong> ${company.CompanySize}</p>
        <p><strong>Location:</strong> ${company.Location || 'Not specified'}</p>
        <p><strong>Website:</strong> ${company.Website || 'Not provided'}</p>
        <p><strong>Contact Person:</strong> ${company.ContactPerson}</p>
        <p><strong>Verification Status:</strong> <span class="status-badge status-${company.verificationStatus.toLowerCase()}">${company.verificationStatus}</span></p>
        <p><strong>Registration Date:</strong> ${new Date(company.registrationDate).toLocaleDateString()}</p>
    `;
    modal.classList.add('active');
}

function closeCompanyModal() {
    document.getElementById('companyModal').classList.remove('active');
}

async function loadVerificationQueue() {
    try {
        const response = await fetch('http://localhost:3400/getData/getPendingCompanies', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.companies.length > 0) {
            const container = document.getElementById('verificationQueueContainer');
            container.innerHTML = data.companies.map(company => `
                <div class="company-card">
                    <h3>${company.CompanyName}</h3>
                    <span class="status-badge status-pending">Pending Verification</span>
                    <p>Industry: ${company.Industry} | Size: ${company.CompanySize}</p>
                    <p><strong>Contact:</strong> ${company.ContactPerson}</p>
                    <p><strong>Registration Date:</strong> ${new Date(company.registrationDate).toLocaleDateString()}</p>
                    <button class="btn btn-secondary btn-small" onclick="approveCompanyAction('${company.Email}')">Approve</button>
                    <button class="btn btn-danger btn-small" onclick="rejectCompanyAction('${company.Email}')">Reject</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading verification queue:', error);
    }
}

async function loadAnalytics() {
    try {
        const response = await fetch('http://localhost:3400/getData/getAnalytics', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('statTotalInternships').textContent = data.analytics.totalInternships || 0;
            document.getElementById('statActiveCandidates').textContent = data.analytics.activeCandidates || 0;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function loadRegionalData() {
    try {
        const response = await fetch('http://localhost:3400/getData/getRegionalData', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.regionalData.length > 0) {
            const container = document.getElementById('regionalStatsContainer');
            container.innerHTML = data.regionalData.slice(0, 4).map(region => `
                <div class="stat-card">
                    <h3>${region.region}</h3>
                    <div class="number">${region.companyCount}</div>
                    <p style="font-size:0.85rem;color:#666;margin-top:5px">Companies</p>
                    <p style="font-size:0.85rem;color:#ef4444;margin-top:5px">${region.fraudCount} fraud reports</p>
                </div>
            `).join('');
            const highRiskContainer = document.getElementById('highRiskRegionsContainer');
            const highRisk = data.regionalData.filter(r => r.fraudCount > 0).sort((a, b) => b.fraudCount - a.fraudCount).slice(0, 2);
            if (highRisk.length > 0) {
                highRiskContainer.innerHTML = highRisk.map(region => `
                    <div class="report-card">
                        <h3>${region.region}</h3>
                        <p>${region.fraudCount} fraud reports</p>
                        <p>Companies: ${region.companyCount}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading regional data:', error);
    }
}

async function loadActionsTaken() {
    try {
        const response = await fetch('http://localhost:3400/getData/getActionsTaken', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.actions.length > 0) {
            const tbody = document.querySelector('#actions tbody');
            tbody.innerHTML = data.actions.map(action => `
                <tr>
                    <td>${new Date(action.actionDate).toLocaleDateString()}</td>
                    <td>${action.companyName}</td>
                    <td>${action.action}</td>
                    <td>${action.reason}</td>
                    <td><span style="color:${action.status === 'Active' ? '#10b981' : '#f59e0b'}">${action.status}</span></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading actions:', error);
    }
}

async function approveCompanyAction(email) {
    if (!confirm('Approve this company?')) return;
    try {
        const response = await fetch('http://localhost:3400/getData/approveCompany', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            alert('Company approved successfully!');
            loadPendingCompanies();
            loadStats();
        }
    } catch (error) {
        console.error('Error approving company:', error);
    }
}

async function rejectCompanyAction(email) {
    if (!confirm('Reject this company?')) return;
    try {
        const response = await fetch('http://localhost:3400/getData/rejectCompany', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            alert('Company rejected!');
            loadPendingCompanies();
        }
    } catch (error) {
        console.error('Error rejecting company:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadRecentFraudReports();
    loadPendingCompanies();
});

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');
    if (sectionId === 'fraud-reports') {
        loadAllFraudReports();
    } else if (sectionId === 'companies') {
        loadAllCompanies();
    } else if (sectionId === 'verification') {
        loadVerificationQueue();
    } else if (sectionId === 'analytics') {
        loadAnalytics();
    } else if (sectionId === 'regional') {
        loadRegionalData();
    } else if (sectionId === 'actions') {
        loadActionsTaken();
    }
}
