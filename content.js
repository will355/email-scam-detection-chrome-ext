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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
