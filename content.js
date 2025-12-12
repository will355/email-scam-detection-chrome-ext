console.log('📧 Email Analyzer: Multi-provider version loaded');

const providers = [
    typeof GmailProvider !== 'undefined' ? GmailProvider : null,
    typeof OutlookProvider !== 'undefined' ? OutlookProvider : null,
    typeof YahooProvider !== 'undefined' ? YahooProvider : null,
    typeof ProtonMailProvider !== 'undefined' ? ProtonMailProvider : null
].filter(p => p !== null);

let currentProvider = null;
let currentUrl = window.location.href;
let anaylzeButton = null;

function detectProvider() {
    for (const provider of providers) {
        if (provider.detect()) {
            console.log(`Detected Provider: ${provider.name}`);
            return provider;
        }
    }
    console.log('No Supported provider detected');
    return null;
}

currentProvider = detectProvider();

if (!currentProvider) {
    console.log('This email provider is not yet supported')
} else {
    console.log(`Running on ${currentProvider.name}`);
}

function createAnalyzeButton() {
    if (analyzeButton) {
        anaylzeButton.remove();
    }

}
