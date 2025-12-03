const YahooProvider = {
    name: 'Yahoo Mail',

    detect() {
        return window.location.hostname.includes('mail.yahoo.com');
    },

    isViewingEmail() {
        // Yahoo shows emails in a right pane
        return document.querySelector('[data-test-id="message-view"]') !== null;
    },

    extractEmailData() {
        console.log('🔍 Yahoo: Extracting email data...');

        const data = {
            provider: 'Yahoo Mail',
            senderEmail: null,
            senderName: null,
            subject: null,
            timestamp: new Date().toISOString()
        };

        // Yahoo uses data-test-id attributes
        const senderElement = document.querySelector('[data-test-id="message-from"]');
        if (senderElement) {
            const emailMatch = senderElement.textContent.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) {
                data.senderEmail = emailMatch[0];
            }
            data.senderName = senderElement.textContent.replace(data.senderEmail || '', '').trim();
        }

        // Get subject
        const subjectElement = document.querySelector('[data-test-id="message-subject"]');
        if (subjectElement) {
            data.subject = subjectElement.textContent.trim();
        }

        console.log('Yahoo data extracted:', data);
        return data.senderEmail ? data : null;
    },

    getButtonContainer() {
        return document.body;
    }
};
