document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });


    chrome.tabs.sendMessage(tab.id, { action: "analyze" }, (response) => {
        if (!response) return;


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
});
