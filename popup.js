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


    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            files: ["content.js"]
        },
        () => {
            chrome.runtime.sendMessage(
                {
                    action: "aiAnalyze",
                    payload: {
                        baselineScore: response.score,
                        subject: response.rawEmailData?.subject || "",
                        issues: response.issues
                    }
                },
                (aiResponse) => {
                    const finalScore = Math.round(
                        response.score * 0.6 + aiResponse.aiRiskScore * 0.4
                    );

                    document.getElementById("score").textContent = finalScore;
                    document.getElementById("status").textContent = aiResponse.aiLabel;

                    const issuesList = document.getElementById("issues");
                    issuesList.innerHTML = "";

                    response.issues.forEach(issue => {
                        const li = document.createElement("li");
                        li.textContent = issue;
                        issuesList.appendChild(li);
                    });

                    const aiLi = document.createElement("li");
                    aiLi.textContent = `AI Insight: ${aiResponse.explanation}`;
                    issuesList.appendChild(aiLi);
                }
            );

        }
    );
});
