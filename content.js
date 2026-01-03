function emptyResponse(reason) {
    return {
        score: 0,
        status: "Safe",
        issues: [reason],
        features: {}
    };
}


function detectEmailProviders() {
    const host = window.location.hostname
    if (host.includes('mail.google.com')) return 'gmail';
    if (host.includes('outlook.live.com') || host.includes('outlook.office.com')) return 'outlook';
    if (host.includes('mail.yahoo.com')) return 'yahoo';
    if (host.includes('mail.proton.me') || host.includes('mail.protonmail.com')) return 'proton';

    return null;
}

const EMAIL_PROVIDER = detectEmailProviders()

if (!EMAIL_PROVIDER) {
    console.log("Email Analyzer: Unsupported site, exiting.")

}

console.log("Email Analyzer running on:", EMAIL_PROVIDER)

// checks if email message is open
function isEmailOpen(provider) {
    switch (provider) {
        case 'gmail':
            return !!document.querySelector("h2.hP");
        case 'outlook':
            return !!document.querySelector('[role="main"] div[aria-label]');
        case 'yahoo':
            return !!document.querySelector('[data-test-id="message-view-body"]');
        case 'proton':
            return !!document.querySelector(".message-content");
        default:
            return false;
    }
}

// Email extractors

function extractGmailEmail() {
    const senderName = document.querySelector("span.gD")?.textContent?.trim() || "";
    const senderEmail = document.querySelector("span.gD")?.getAttribute("email") || "";
    const subject = document.querySelector("h2.hP")?.textContent?.trim() || "";
    const bodyText = document.querySelector("div.a3s")?.innerText?.trim() || "";
    const links = Array.from(
        document.querySelectorAll("div.a3s a")
    ).map(a => a.href);

    return { senderName, senderEmail, subject, bodyText, links };
}

function extractOutlookEmail() {
    const senderName = document.querySelector('[data-testid="message-from"] span')?.textContent?.trim() || "";

    const senderEmail = document.querySelector('[data-testid="message-from"] span')?.getAttribute("title") || "";
    const subject = document.querySelector('[data-testid="message-subject"]')?.textContent?.trim() || "";
    const bodyText = document.querySelector('[role="document"]')?.innerText?.trim() || "";
    const links = Array.from(
        document.querySelectorAll('[role="document"] a')
    ).map(a => a.href);
    return { senderName, senderEmail, subject, bodyText, links };
}

function extractYahooEmail() {
    const senderName = document.querySelector('[data-test-id="message-from"] span')?.textContent?.trim() || "";
    const senderEmail = document.querySelector('[data-test-id="message-from"] span')?.getAttribute("title") || "";
    const subject = document.querySelector('[data-test-id="message-subject"]')?.textContent?.trim() || "";
    const bodyText = document.querySelector('[data-test-id="message-view-body"]')?.innerText?.trim() || "";
    const links = Array.from(
        document.querySelectorAll('[data-test-id="message-view-body"] a')
    ).map(a => a.href);
    return { senderName, senderEmail, subject, bodyText, links };
}

function extractProtonEmail() {
    const senderName = document.querySelector(".message-header .from-name")?.textContent?.trim() || "";
    const senderEmail = document.querySelector(".message-header .from-address")?.textContent?.trim() || "";
    const subject = document.querySelector(".message-header .subject")?.textContent?.trim() || "";
    const bodyText = document.querySelector(".message-content")?.innerText?.trim() || "";
    const links = Array.from(
        document.querySelectorAll(".message-content a")
    ).map(a => a.href);
    return { senderName, senderEmail, subject, bodyText, links };
}

function extractEmailByProvider(provider) {
    switch (provider) {
        case 'gmail':
            return extractGmailEmail();
        case 'outlook':
            return extractOutlookEmail();
        case 'yahoo':
            return extractYahooEmail();
        case 'proton':
            return extractProtonEmail();
        default:
            return null;
    }
}
// checks for links
function getDomainFromEmail(email) {
    return email.split("@")[1]?.toLowerCase() || "";
}

function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname.replace("www.", "").toLowerCase();
    } catch {
        return "";
    }
}

function senderDomainMatchesLinks(senderEmail, links) {
    const senderDomain = getDomainFromEmail(senderEmail);
    if (!senderDomain || links.length === 0) return true;

    return links.every(link => {
        const linkDomain = getDomainFromUrl(link);
        return linkDomain.includes(senderDomain);
    });
}

const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd"];

function hasShortenedLinks(links) {
    return links.some(link => {
        const domain = getDomainFromUrl(link);
        return SHORTENERS.includes(domain);
    });
}

function isExternalSender(senderEmail) {
    const domain = getDomainFromEmail(senderEmail);
    const trustedDomains = ["gmail.com", "outlook.com", "yahoo.com", "proton.me"];
    return !trustedDomains.includes(domain);
}

function hasIpBasedLinks(links) {
    const ipRegex = /^\d{1,3}(\.\d{1,3}){3}$/;

    return links.some(link => {
        const domain = getDomainFromUrl(link);
        return ipRegex.test(domain);
    });
}

function getLinkCount(links) {
    return links.length;
}

function extractSecurityFeatures(raw) {
    return {
        senderDomainMatchesLinks: senderDomainMatchesLinks(raw.senderEmail, raw.links),
        hasShortenedLinks: hasShortenedLinks(raw.links),
        externalSender: isExternalSender(raw.senderEmail),
        hasIpBasedLinks: hasIpBasedLinks(raw.links),
        linkCount: getLinkCount(raw.links)
    };
}


function calculateBaselineRisk(features) {
    let score = 0;
    const issues = [];

    if (features.externalSender) {
        score += 25;
        issues.push("External sender domain");
    }

    if (!features.senderDomainMatchesLinks) {
        score += 20;
        issues.push("Sender domain does not match link domains");
    }

    if (features.hasShortenedLinks) {
        score += 20;
        issues.push("Shortened URLs detected");
    }

    if (features.hasIpBasedLinks) {
        score += 25;
        issues.push("IP-based link detected");
    }

    if (features.linkCount >= 3) {
        score += 15;
        issues.push("Multiple links in email");
    }

    score = Math.min(score, 100);

    let status = "Safe";
    if (score > 30) status = "Suspicious";
    if (score > 70) status = "High Risk";

    return { score, status, issues };
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action !== "analyze") return;

    if (!EMAIL_PROVIDER) {
        sendResponse(emptyResponse("Unsupported email provider"));
        return;
    }

    if (!isEmailOpen(EMAIL_PROVIDER)) {
        sendResponse(emptyResponse("No email open"));
        return;
    }

    const rawEmailData = extractEmailByProvider(EMAIL_PROVIDER);

    if (!rawEmailData) {
        sendResponse(emptyResponse("Failed to extract email"));
        return;
    }

    const features = extractSecurityFeatures(rawEmailData);
    const baseline = calculateBaselineRisk(features);

    sendResponse({
        score: baseline.score,
        status: baseline.status,
        issues: baseline.issues,
        features
    });
});
