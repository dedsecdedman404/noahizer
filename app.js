// --- CONFIGURATION ---
const CREDENTIALS = {
    username: 'admin',
    password: 'password'
};
const API_URL = "https://rewriterpro-backend.azurewebsites.net/api/getResponseToAPrompt";

// --- DOM ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');

const inputText = document.getElementById('input-text');
const humaniseBtn = document.getElementById('humanise-btn');
const copyBtn = document.getElementById('copy-btn');
const outputPlaceholder = document.getElementById('output-placeholder');
const loaderContainer = document.getElementById('loader-container');
const outputText = document.getElementById('output-text');
const apiError = document.getElementById('api-error');

// --- UTILS ---
// Recursive JSON parser (from your python script)
function findPromptInJson(obj) {
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) {
        for (let item of obj) {
            const result = findPromptInJson(item);
            if (result) return result;
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            const result = findPromptInJson(obj[key]);
            if (result) return result;
        }
    }
    return null;
}

// --- EVENT LISTENERS ---

// Login Validation
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (usernameInput.value === CREDENTIALS.username && passwordInput.value === CREDENTIALS.password) {
        loginError.classList.add('hidden');
        
        // Glitch/Fade transition
        loginScreen.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            loginScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            // Allow DOM to update before fading in
            setTimeout(() => {
                appScreen.classList.remove('opacity-0');
            }, 50);
        }, 600);
    } else {
        loginError.classList.remove('hidden');
        passwordInput.value = '';
    }
});

// Input observer to toggle execution button state
inputText.addEventListener('input', () => {
    if (inputText.value.trim().length > 0) {
        humaniseBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        humaniseBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
});

// Copy Button Logic
copyBtn.addEventListener('click', () => {
    const textToCopy = outputText.innerText;
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<span class="font-mono text-xs text-[#27C93F] glow-green">COPIED</span>`;
            setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 2000);
        });
    }
});

// Primary API Functionality
humaniseBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) return;

    // Set UI into Active Processing State
    humaniseBtn.disabled = true;
    humaniseBtn.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
        PROCESSING...
    `;
    humaniseBtn.classList.add('opacity-50', 'cursor-wait');
    
    // Clear outputs and show the sci-fi loading ring
    outputPlaceholder.classList.add('hidden');
    outputText.classList.add('hidden');
    apiError.classList.add('hidden');
    copyBtn.classList.remove('opacity-100');
    copyBtn.classList.add('opacity-0');
    copyBtn.disabled = true;
    loaderContainer.classList.remove('hidden');

    const payload = {
        prompt: text,
        promptOptions: {
            fluency: "🔄 Default",
            tone: "🔄 Default",
            emotion: "🔄 Default",
            audience: "🌍 General",
            length: "🔄 Default",
            language: "🇬🇧 English (UK)"
        },
        isHumanizeEnabled: true,
        rephraseType: "Rewriter",
        selectedModel: "LUMENARIS"
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`CONNECTION_ERROR_${response.status}`);
        }

        const data = await response.json();
        const rewrittenText = findPromptInJson(data);

        if (rewrittenText) {
            // Render Text
            outputText.innerText = rewrittenText;
            outputText.classList.remove('hidden');
            
            // Show Copy Button
            copyBtn.disabled = false;
            copyBtn.classList.remove('opacity-0', 'hidden');
            copyBtn.classList.add('opacity-100');
        } else {
            throw new Error('DATA_PARSE_FAILURE');
        }

    } catch (err) {
        console.error(err);
        apiError.innerText = `> ERR: ${err.message || 'SERVER_TIMEOUT'}\n> CHECK CORS POLICY OR NETWORK STATUS`;
        apiError.classList.remove('hidden');
        outputPlaceholder.classList.remove('hidden');
    } finally {
        // Reset processing states
        loaderContainer.classList.add('hidden');
        humaniseBtn.disabled = false;
        humaniseBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            EXECUTE // HUMANISE
        `;
        humaniseBtn.classList.remove('opacity-50', 'cursor-wait');
    }
});
