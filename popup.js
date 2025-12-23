document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    const url = tab.url || "";

    // Allow only supported email providers
    const allowedDomains = [
        "mail.google.com",
        "outlook.office.com",
        "mail.yahoo.com",
        "mail.proton.me"
    ];

    const isEmailProvider = allowedDomains.some(domain =>
        url.includes(domain)
    );

    if (!isEmailProvider) {
        alert("This extension only works on supported email providers.");
        return;
    }

    // Inject content.js only on supported providers
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            files: ["content.js"]
        },
        () => {
            chrome.tabs.sendMessage(tab.id, { action: "analyze" }, (response) => {
                if (chrome.runtime.lastError) {
                    alert("Please open an email before analyzing.");
                    return;
                }

                document.getElementById("score").textContent = response.score;
                document.getElementById("status").textContent = response.status;

                const issuesList = document.getElementById("issues");
                issuesList.innerHTML = "";

                response.issues.forEach(issue => {
                    const li = document.createElement("li");
                    li.textContent = issue;
                    issuesList.appendChild(li);
                });
            });
        }
    );
});
