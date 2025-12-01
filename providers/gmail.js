const GmailProvider = {
    name: 'Gmail',

    detect() {
        return window.location.hostname === 'mail.google.com';
    },

    isViewingEmail() {
        return window.location.hash.includes('/#inbox/') ||
            window.location.hash.includes('/#sent/') ||
            window.location.hash.includes('/#all/') ||
            window.location.hash.includes('/#spam/');

    }
     extractEmailData() {
        console.log('🔍 Gmail: Extracting email data...');
    }

}
