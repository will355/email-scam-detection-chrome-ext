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
    const bodyText = document.querySelector('[data-test-id="message-subject"]')?.textContent?.trim() || "";
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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {


    if (!EMAIL_PROVIDER) {
        sendResponse({ error: "unsupported_provider" });
        return;
    }

    if (!isEmailOpen(EMAIL_PROVIDER)) {
        sendResponse({ error: "no_email_open" });
        return;
    }

    if (request.action !== "analyze") return;


    const emailText = document.body.innerText.toLowerCase();
    const links = [...document.querySelectorAll('a')].map(a => a.href);


    let score = 100;
    let issues = [];


    // Keyword checks
    const redFlags = [
        "verify your account",
        "urgent",
        "password",
        "click below",
        "suspended",
        "unauthorized",
        "confirm now"
    ];


    redFlags.forEach(flag => {
        if (emailText.includes(flag)) {
            score -= 10;
            issues.push(`Suspicious phrase detected: "${flag}"`);
        }
    });


    //
    links.forEach(link => {
        if (link.startsWith("http://")) {
            score -= 10;
            issues.push("Insecure HTTP link detected");
        }


        if (link.includes("@")) {
            score -= 20;
            issues.push("Possible deceptive link (contains @)");
        }
    });


    // Too many links
    if (links.length > 5) {
        score -= 10;
        issues.push("Email contains many links");
    }


    // Final verdict
    let status = "Legit";
    if (score < 70) status = "Suspicious";
    if (score < 40) status = "Scam Likely";


    score = Math.max(score, 0);


    sendResponse({ score, status, issues });
});
