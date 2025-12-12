console.log('📧 Email Analyzer: Multi-provider version loaded');

const providers = [
    typeof GmailProvider !== 'undefined' ? GmailProvider : null,
    typeof OutlookProvider !== 'undefined' ? OutlookProvider : null,
    typeof YahooProvider !== 'undefined' ? YahooProvider : null,
    typeof ProtonMailProvider !== 'undefined' ? ProtonMailProvider : null
].filter(p => p !== null);

let currentProvider = null;
let currentUrl = window.location.href;
let analyzeButton = null;

function detectProvider() {
    for (const provider of providers) {
        if (provider.detect()) {
            console.log(`Detected Provider: ${provider.name}`);
            return provider;
        }
    }
    console.log('No Supported provider detected');
    return null;
}

currentProvider = detectProvider();

if (!currentProvider) {
    console.log('This email provider is not yet supported')
} else {
    console.log(`Running on ${currentProvider.name}`);
}

function createAnalyzeButton() {
    if (analyzeButton) {
        analyzeButton.remove();
    }


    analyzeButton = document.createElement('button');
    analyzeButton.textContent = '🔍 Analyze Email';
    analyzeButton.id = 'email-analyzer-btn';

    //Styling
    analyzeButton.style.cssText = `position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 999999;
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`

    // Add hover effect
    analyzeButton.onmouseenter = () => {
        analyzeButton.style.transform = 'scale(1.05)';
        analyzeButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    };

    analyzeButton.onmouseleave = () => {
        analyzeButton.style.transform = 'scale(1)';
        analyzeButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    };

    analyzeButton.onclick = () => {
        console.log('🎯 Analyze button clicked!');
        analyzeCurrentEmail();
    };

    const container = currentProvider.getButtonContainer();
    if (container) {
        container.appendChild(analyzeButton);
        console.log('✓ Analyze button added to page');
    }
}

function analyzeCurrentEmail() {
    if (!currentProvider) {
        alert('Email provider not supported yet!');
        return;
    }

    const emailData = currentProvider.extractEmailData();

    if (emailData && emailData.senderEmail) {
        console.log('📊 Email data:', emailData);

        // Simple analysis for now
        const result = performBasicAnalysis(emailData);

        // Show results
        alert(`
📧 Email Analyzer Results
━━━━━━━━━━━━━━━━━━━━
Provider: ${emailData.provider}
From: ${emailData.senderEmail}
${emailData.subject ? `Subject: ${emailData.subject}` : ''}

Trust Score: ${result.score}/100
Status: ${result.status}

${result.warnings.length > 0 ? '⚠️ Warnings:\n' + result.warnings.join('\n') : '✓ No immediate concerns detected'}
        `.trim());
    } else {
        console.log('❌ Could not extract email data');
        alert(`Could not extract email information from ${currentProvider.name}. The email may still be loading, or the page structure has changed.`);
    }
}

function performBasicAnalysis(emailData) {
    const suspiciousKeywords = ['urgent', 'verify', 'suspended', 'click here', 'act now', 'limited time'];
    const email = emailData.senderEmail.toLowerCase();
    const subject = (emailData.subject || '').toLowerCase();

    let score = 100;
    let warnings = [];

    // Check sender email for suspicious patterns
    suspiciousKeywords.forEach(keyword => {
        if (email.includes(keyword)) {
            score -= 15;
            warnings.push(`Suspicious keyword in email: "${keyword}"`);
        }
    });

    // Check subject line
    if (subject) {
        suspiciousKeywords.forEach(keyword => {
            if (subject.includes(keyword)) {
                score -= 10;
                warnings.push(`Suspicious keyword in subject: "${keyword}"`);
            }
        });
    }

    // Check for common spoofing patterns
    if (email.includes('noreply') || email.includes('no-reply')) {
        score -= 5;
        warnings.push('Sender uses no-reply address (common but worth noting)');
    }

    return {
        score: Math.max(0, score),
        warnings: warnings,
        status: score > 80 ? '✓ Looks Safe' : score > 50 ? '⚠️ Be Careful' : '🚨 High Risk'
    };
}

function handleEmailOpen() {
    if (!currentProvider) return;

    console.log(`📧 Email detected on ${currentProvider.name}`);

    setTimeout(() => {
        createAnalyzeButton();
        const emailData = currentProvider.extractEmailData();
        if (emailData) {
            console.log('📊 Email ready for analysis');
        } else {
            console.log('⚠️ Waiting for email to fully load...');
        }
    }, 1500);
}

function checkForEmailChange() {
    if (!currentProvider) return;

    if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        console.log('🔄 URL changed:', currentUrl);

        if (currentProvider.isViewingEmail()) {
            handleEmailOpen();
        } else {
            // Remove button when not viewing email
            if (analyzeButton) {
                analyzeButton.remove();
                analyzeButton = null;
            }
        }
    }
}

// Check for changes every 500ms
setInterval(checkForEmailChange, 500);

// Check if already viewing an email on load
if (currentProvider && currentProvider.isViewingEmail()) {
    handleEmailOpen();
}


