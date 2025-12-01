//gmail-specific
const GmailProvider = {
    name: 'Gmail',
    // checks if were on gmail
    detect() {
        return window.location.hostname === 'mail.google.com';
    },
    // checks if veiwing email
    isViewingEmail() {
        return window.location.hash.includes('/#inbox/') ||
            window.location.hash.includes('/#sent/') ||
            window.location.hash.includes('/#all/') ||
            window.location.hash.includes('/#spam/');

    },
    // getting data from email
    extractEmailData() {
        console.log('🔍 Gmail: Extracting email data...');

        const data = {
            provider: 'Gmail',
            senderEmail: null,
            senderName: null,
            subject: null,
            timestamp: new Date().toISOString()

        };
        // looking for email attribute
        const emailElement = document.querySelector('[email]');

        if (emailElement) {
            data.senderEmail = emailElement.getAttribute('email');
            data.senderName = emailElement.getAtrribute('name') ||
                emailElement.textContent.trim();
        }

        // getting subject
        const subjectElement = document.querySelector('h2.hP');
        if (subjectElement) {
            data, subject = subjectElement.textContent.trim();
        }

        console.log('Gmail data extracted:', data);
        return data.senderEmail ? data : null;
    },

    getButtonContainer() {
        return document.body;
    }
}
