const ProtonMailProvider = {
    name: 'Proton Mail',

    detect() {
        // check if url has the word Proton
        return window.location.hostname.includes('proton')

    },

    isViewingEmail() {
        return document.querySelector('[data-testid="message-content"]') !== null ||
            window.location.pathname.includes('/mail/');
    },

    extractEmailData() {
        console.log('🔍 Proton: Extracting email data...');

        const data = {
            provider: 'Proton Mail',
            senderEmail: null,
            senderName: null,
            subject: null,
            timeStamp: new Date().toISOString()

        }


        // ProtonMail structure
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
        const senderArea = document.querySelector('.message-header');

        if (senderArea) {
            const match = senderArea.textContent.match(emailRegex);
            if (match) {
                data.senderEmail = match[0];
            }
        }

        console.log('ProtonMail data extracted:', data);
        return data.senderEmail ? data : null;
    },


    getButtonContainer() {
        // return body of document
        return document.body;
    },
}
