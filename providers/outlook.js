const OutlookProvider = {
    name: 'Outlook',

    detect() {
        return window.location.hostname.includes('outlook');
    },

    isViewingEmail() {
        // Outlook uses different URL patterns
        const url = window.location.href;
        return url.includes('/mail/') &&
            (url.includes('/id/') || document.querySelector('[role="main"] [role="region"]'));
    },

    extractEmailData() {
        console.log('🔍 Outlook: Extracting email data...');

        const data = {
            provider: 'Outlook',
            senderEmail: null,
            senderName: null,
            subject: null,
            timestamp: new Date().toISOString()
        };

        // Outlook stores sender in button elements often
        const senderButton = document.querySelector('[aria-label*="@"]');
        if (senderButton) {
            const ariaLabel = senderButton.getAttribute('aria-label');
            const emailMatch = ariaLabel.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) {
                data.senderEmail = emailMatch[0];
            }
        }

        // Alternative: look for email pattern in visible text
        if (!data.senderEmail) {
            const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
            const readingPane = document.querySelector('[role="main"]');
            if (readingPane) {
                const match = readingPane.textContent.match(emailRegex);
                if (match && match[0]) {
                    data.senderEmail = match[0];
                }
            }
        }

        // Try to get subject
        const subjectElement = document.querySelector('[role="heading"]');
        if (subjectElement) {
            data.subject = subjectElement.textContent.trim();
        }

        console.log('Outlook data extracted:', data);
        return data.senderEmail ? data : null;
    },

    getButtonContainer() {
        return document.body;
    }
};
