/**
 * Mr.Bekmirzayev AI - Easy Correspondence
 * Yaratuvchi: Mr.Bekmirzayev (Boburjon)
 * Ishonchli, avtomatik model aniqlovchi va barqaror chat logikasi
 */

// Yaratuvchi (Mr.Bekmirzayev) tomonidan belgilangan ichki doimiy tizim ko'rsatmasi (Foydalanuvchi buni o'zgartira olmaydi)
const CREATOR_SYSTEM_INSTRUCTION = `Seni 𝙈𝙧 𝘽𝙚𝙠𝙢𝙞𝙧𝙯𝙖𝙮𝙚𝙫 ツ yaratgan. Sen 𝙈𝙧 𝘽𝙚𝙠𝙢𝙞𝙧𝙯𝙖𝙮𝙚𝙫 ツ AI deb atalasan.
Muomilang juda xushmuomala, sabrli, intellektual va samimiy bo'lsin.
Foydalanuvchi salom bersa ("Assalomu alaykum"), doimo "Va alaykum assalom" deb samimiy alik ol.
Agar diniy mavzular qo'zg'alsa, bag'rikeng, odobli va tushunarli bo'l. Biz musulmonmiz, Islom dinining ezgulik, sabr va go'zalligini hurmat qil.
Foydalanuvchi seni kim yaratganini so'ramaguncha buni o'zingdan-o'zing aytma; agar so'rasa, seni 𝙈𝙧 𝘽𝙚𝙠𝙢𝙞𝙧𝙯𝙖𝙮𝙚𝙫 ツ yaratganini faxr bilan ma'lum qil.
Dasturlash yoki kod so'ralsa, eng sifatli, tushunarli va optimal kod yoz, kodni Markdown blokida tegishli til nomi bilan o'ra.
Barcha javoblaringni aniq, ravon va tartibli Markdown formatida taqdim et. kodlarni alohida divga o'rab, unga stil berib monoscape font familiysida foydalanuvchiga ber.`;

// Asosiy va zaxira modellar (2026-yilgi eng so'nggi ishlovchi modellar)
const DEFAULT_MODEL = "gemini-3.6-flash";
const FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest"
];

// Asl loyihada kiritilgan boshlang'ich API kalit
const INITIAL_FALLBACK_KEY = "AQ.Ab8RN6Kr979sqD6lP7GKZ2vM73omTAstfSOM4NFVFZ-5yLK3Dg";

// Mehmon rejimida ruxsat etilgan xabarlar soni
const GUEST_MESSAGE_LIMIT = 2;

let state = {
    chats: [],
    activeChatId: null,
    theme: 'light',
    lang: (localStorage.getItem('mb_ai_lang') || 'uz'),
    apiKey: '',
    model: DEFAULT_MODEL,
    isGenerating: false,
    sidebarOpen: false,
    user: null,
    fbReady: false,
    guestMessageCount: parseInt(localStorage.getItem('mb_ai_guest_msg_count') || '0', 10) || 0,
    authMode: 'login',
    authMandatory: false,
    pendingFeedback: null
};

// Tarjima yordamchisi
function t(key, vars) {
    if (window.translate) return window.translate(state.lang, key, vars);
    return key;
}

// Xavfsiz ID generatori
function createId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}


// DOM Elementlari
const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    newChatBtn: document.getElementById('newChatBtn'),
    chatHistoryList: document.getElementById('chatHistoryList'),
    chatMessagesContainer: document.getElementById('chatMessagesContainer'),
    welcomeSection: document.getElementById('welcomeSection'),
    userInput: document.getElementById('userInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    clearAllChatsBtn: document.getElementById('clearAllChatsBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    headerApiKeyBtn: document.getElementById('headerApiKeyBtn'),
    openSettingsKeyBtn: document.getElementById('openSettingsKeyBtn'),
    apiKeyAlertBox: document.getElementById('apiKeyAlertBox'),
    // Sozlamalar modal oynasi
    settingsModal: document.getElementById('settingsModal'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    modelSelect: document.getElementById('modelSelect'),
    toggleApiKeyVisibility: document.getElementById('toggleApiKeyVisibility'),
    testKeyBtn: document.getElementById('testKeyBtn'),
    modelDetectStatus: document.getElementById('modelDetectStatus'),
    // Akkaunt / auth
    accountBtn: document.getElementById('accountBtn'),
    guestBadge: document.getElementById('guestBadge'),
    settingsLoginBtn: document.getElementById('settingsLoginBtn'),
    settingsLogoutBtn: document.getElementById('settingsLogoutBtn'),
    accountGuestView: document.getElementById('accountGuestView'),
    accountUserView: document.getElementById('accountUserView'),
    accountEmail: document.getElementById('accountEmail'),
    accountStatus: document.getElementById('accountStatus'),
    settingsThemeBtn: document.getElementById('settingsThemeBtn'),
    settingsThemeLabel: document.getElementById('settingsThemeLabel'),
    onboardingModal: document.getElementById('onboardingModal'),
    onboardingDoneBtn: document.getElementById('onboardingDoneBtn'),
    authModal: document.getElementById('authModal'),
    authModalTitle: document.getElementById('authModalTitle'),
    authRequiredNotice: document.getElementById('authRequiredNotice'),
    closeAuthBtn: document.getElementById('closeAuthBtn'),
    loginTabBtn: document.getElementById('loginTabBtn'),
    registerTabBtn: document.getElementById('registerTabBtn'),
    authForm: document.getElementById('authForm'),
    nameFieldGroup: document.getElementById('nameFieldGroup'),
    authNameInput: document.getElementById('authNameInput'),
    authEmailInput: document.getElementById('authEmailInput'),
    authPasswordInput: document.getElementById('authPasswordInput'),
    authError: document.getElementById('authError'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
    // Feedback (like / dislike)
    feedbackModal: document.getElementById('feedbackModal'),
    closeFeedbackBtn: document.getElementById('closeFeedbackBtn'),
    cancelFeedbackBtn: document.getElementById('cancelFeedbackBtn'),
    submitFeedbackBtn: document.getElementById('submitFeedbackBtn'),
    feedbackReasonInput: document.getElementById('feedbackReasonInput'),
    feedbackOtherBtn: document.getElementById('feedbackOtherBtn'),
    // O'chirish modal oynasi
    deleteModal: document.getElementById('deleteModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    toastContainer: document.getElementById('toastContainer')
};

let chatToDeleteId = null;

// Dasturni ishga tushirish
function initApp() {
    loadSettings();
    applyTheme(state.theme);
    loadChats();
    updateApiKeyBanners();

    if (!state.chats || state.chats.length === 0) {
        createNewChat(false);
    } else {
        const activeChat = state.chats.find(c => c.id === state.activeChatId) || state.chats[0];
        setActiveChat(activeChat.id);
    }

    applyLanguage(state.lang);
    setupEventListeners();
    setupAuth();
    handleResize();
    updateGuestLimitUI();

    // Birinchi marta kirgan foydalanuvchiga qo'llanma ko'rsatish
    if (localStorage.getItem('mb_ai_onboarded') !== '1') {
        setTimeout(() => openModal(elements.onboardingModal), 500);
    }

    // Agar saqlangan kalit bo'lsa, mavjud modellarni jimgina tekshirib qo'yish
    if (state.apiKey) {
        detectSupportedModels(state.apiKey, false);
    }
}

// Tilni qo'llash (barcha statik va dinamik matnlar)
function applyLanguage(lang) {
    if (!window.I18N || !window.I18N[lang]) lang = 'uz';
    state.lang = lang;
    localStorage.setItem('mb_ai_lang', lang);
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key) el.innerHTML = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) el.setAttribute('title', t(key));
    });

    // Tayyor taklif matnlarini joriy tilga moslash
    document.querySelectorAll('[data-prompt-i18n]').forEach(card => {
        const key = card.getAttribute('data-prompt-i18n');
        if (key) card.setAttribute('data-prompt', t(key));
    });

    // Til tanlagichlarini sinxronlash
    document.querySelectorAll('.js-lang-select').forEach(select => {
        select.value = lang;
    });

    renderChatHistoryList();
    renderChatMessages();
    updateGuestLimitUI();
    updateAccountUI();
    updateThemeLabel();

    if (elements.authModal && elements.authModal.classList.contains('active')) {
        updateAuthModalChrome();
    }

    // Til almashganda generatsiya davom etayotgan bo'lsa, indikatorni qayta ko'rsatish
    if (state.isGenerating && elements.chatMessagesContainer) {
        showTypingIndicator(t('typing'));
    }
}

// Sozlamalarni yuklash va saqlash
function loadSettings() {
    const savedTheme = localStorage.getItem('mb_ai_theme');
    if (savedTheme) {
        state.theme = savedTheme;
    } else {
        state.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const savedLang = localStorage.getItem('mb_ai_lang');
    state.lang = (savedLang && window.I18N && window.I18N[savedLang]) ? savedLang : 'uz';

    state.apiKey = localStorage.getItem('mb_ai_api_key') || '';
    
    // Eski/eskirgan modellarni yangi gemini-3.6-flash ga tozalab yangilash
    const savedModel = localStorage.getItem('mb_ai_model');
    if (!savedModel || savedModel === 'gemini-1.5-flash' || savedModel === 'gemini-pro' || savedModel === 'gemini-1.0-pro') {
        state.model = DEFAULT_MODEL;
        localStorage.setItem('mb_ai_model', DEFAULT_MODEL);
    } else {
        state.model = savedModel;
    }

    if (elements.apiKeyInput) elements.apiKeyInput.value = state.apiKey;
    if (elements.modelSelect) elements.modelSelect.value = state.model;
}

function saveSettings() {
    const key = elements.apiKeyInput.value.trim();
    const model = elements.modelSelect ? elements.modelSelect.value : DEFAULT_MODEL;

    state.apiKey = key;
    state.model = model || DEFAULT_MODEL;

    localStorage.setItem('mb_ai_api_key', state.apiKey);
    localStorage.setItem('mb_ai_model', state.model);

    updateApiKeyBanners();
    closeModal(elements.settingsModal);
    showToast(t('settingsSaved', { model: state.model }), "success");
}

function updateApiKeyBanners() {
    const hasKey = !!state.apiKey;
    if (elements.apiKeyAlertBox) {
        elements.apiKeyAlertBox.style.display = hasKey ? 'none' : 'flex';
    }
    if (elements.headerApiKeyBtn) {
        elements.headerApiKeyBtn.style.display = hasKey ? 'none' : 'inline-flex';
    }
}

// Google AI Studio orqali modellarni aniqlash
async function detectSupportedModels(apiKey, updateUI = true) {
    if (!apiKey) return [];

    if (updateUI && elements.modelDetectStatus) {
        elements.modelDetectStatus.className = 'model-detect-status loading';
        elements.modelDetectStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('modelCheckLoading')}`;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            if (updateUI && elements.modelDetectStatus) {
                elements.modelDetectStatus.className = 'model-detect-status error';
                elements.modelDetectStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${t('modelCheckError', { error: data.error.message || t('errGeneric') })}`;
            }
            return [];
        }

        if (data.models && Array.isArray(data.models)) {
            const supported = data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace(/^models\//, ''));

            if (supported.length > 0) {
                // Select elementini to'ldirish
                if (elements.modelSelect) {
                    const currentVal = elements.modelSelect.value;
                    elements.modelSelect.innerHTML = '';
                    supported.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m;
                        opt.textContent = m;
                        if (m === currentVal || m === DEFAULT_MODEL) {
                            opt.selected = true;
                        }
                        elements.modelSelect.appendChild(opt);
                    });
                }

                // Eng optimal modelni tanlash
                const bestModel = supported.find(m => m === 'gemini-3.6-flash') ||
                                  supported.find(m => m.includes('3.6')) ||
                                  supported.find(m => m.includes('2.5-flash')) ||
                                  supported.find(m => m.includes('2.0-flash')) ||
                                  supported[0];

                if (bestModel) {
                    state.model = bestModel;
                    localStorage.setItem('mb_ai_model', bestModel);
                    if (elements.modelSelect) elements.modelSelect.value = bestModel;
                }

                if (updateUI && elements.modelDetectStatus) {
                    elements.modelDetectStatus.className = 'model-detect-status success';
                    elements.modelDetectStatus.innerHTML = `<i class="fa-solid fa-check"></i> ${t('modelCheckSuccess', { best: bestModel, count: supported.length })}`;
                }

                return supported;
            }
        }
    } catch (e) {
        console.warn("Modellarni tekshirishda xatolik:", e);
        if (updateUI && elements.modelDetectStatus) {
            elements.modelDetectStatus.className = 'model-detect-status error';
            elements.modelDetectStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${t('modelCheckNetwork')}`;
        }
    }
    return [];
}

// Tema boshqaruvi
function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mb_ai_theme', theme);

    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.innerHTML = theme === 'dark' 
            ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>' 
            : '<i class="fa-solid fa-moon" style="color: #3b82f6;"></i>';
        elements.themeToggleBtn.setAttribute('title', t('themeToggle'));
    }
    updateThemeLabel();
}

function updateThemeLabel() {
    if (elements.settingsThemeLabel) {
        elements.settingsThemeLabel.textContent = t(state.theme === 'dark' ? 'darkMode' : 'lightMode');
    }
}

function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
}

// Chatlarni xotirada saqlash
function loadChats() {
    try {
        const raw = localStorage.getItem('mb_ai_chats');
        if (raw) {
            state.chats = JSON.parse(raw);
        } else {
            state.chats = [];
        }
    } catch (e) {
        console.error("Chatlarni yuklashda xatolik:", e);
        state.chats = [];
    }

    if (!Array.isArray(state.chats)) state.chats = [];

    // Eski xabarlarga ham barqaror ID berish (like/dislike uchun kerak)
    state.chats.forEach(chat => {
        if (!Array.isArray(chat.messages)) chat.messages = [];
        chat.messages.forEach((msg, index) => {
            if (!msg.id) msg.id = `msg_${chat.id || 'chat'}_${index}`;
        });
    });

    state.activeChatId = localStorage.getItem('mb_ai_active_chat');
}

function saveChats() {
    localStorage.setItem('mb_ai_chats', JSON.stringify(state.chats));
    if (state.activeChatId) {
        localStorage.setItem('mb_ai_active_chat', state.activeChatId);
    }
}

// Yangi chat yaratish — agar bo'sh chat mavjud bo'lsa, yangisini yaratmasdan o'shani qaytaradi
function createNewChat(focusInput = true) {
    const activeEmptyChat = state.chats.find(c =>
        c.id === state.activeChatId && (!c.messages || c.messages.length === 0)
    );
    const anyEmptyChat = activeEmptyChat || state.chats.find(c => !c.messages || c.messages.length === 0);

    if (anyEmptyChat) {
        setActiveChat(anyEmptyChat.id);

        if (focusInput && elements.userInput) {
            elements.userInput.focus();
        }
        if (window.innerWidth < 1024) {
            toggleSidebar(false);
        }
        return anyEmptyChat;
    }

    const newChatId = createId('chat');
    const newChat = {
        id: newChatId,
        title: "",
        createdAt: Date.now(),
        messages: []
    };

    state.chats.unshift(newChat);
    saveChats();
    setActiveChat(newChatId);

    if (focusInput && elements.userInput) {
        elements.userInput.focus();
    }

    if (window.innerWidth < 1024) {
        toggleSidebar(false);
    }

    return newChat;
}

function setActiveChat(chatId) {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) {
        if (state.chats.length > 0) {
            setActiveChat(state.chats[0].id);
        }
        return;
    }

    state.activeChatId = chatId;
    localStorage.setItem('mb_ai_active_chat', chatId);

    renderChatHistoryList();
    renderChatMessages();
}

function openDeleteModal(chatId, event) {
    if (event) event.stopPropagation();
    chatToDeleteId = chatId;
    openModal(elements.deleteModal);
}

function confirmDeleteChat() {
    if (!chatToDeleteId) return;

    state.chats = state.chats.filter(c => c.id !== chatToDeleteId);
    saveChats();

    if (state.activeChatId === chatToDeleteId) {
        if (state.chats.length > 0) {
            setActiveChat(state.chats[0].id);
        } else {
            createNewChat(false);
        }
    } else {
        renderChatHistoryList();
    }

    closeModal(elements.deleteModal);
    showToast(t('chatDeleted'), "info");
    chatToDeleteId = null;
}

function clearAllChats() {
    if (confirm(t('clearConfirm'))) {
        state.chats = [];
        localStorage.removeItem('mb_ai_chats');
        localStorage.removeItem('chatHistory');
        createNewChat(false);
        showToast(t('allCleared'), "info");
    }
}

// Suhbatlar tarixini yon panelda chizish
function renderChatHistoryList() {
    if (!elements.chatHistoryList) return;

    if (state.chats.length === 0) {
        elements.chatHistoryList.innerHTML = `<div class="empty-history-text"><i class="fa-regular fa-comment-dots" style="font-size: 26px; margin-bottom: 8px; opacity: 0.5; display: block;"></i>${escapeHtml(t('emptyHistory')).replace(/\n/g, '<br>')}</div>`;
        return;
    }

    elements.chatHistoryList.innerHTML = '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    const groups = { today: [], yesterday: [], older: [] };

    state.chats.forEach(chat => {
        const chatTime = chat.createdAt || Date.now();
        if (chatTime >= today) groups.today.push(chat);
        else if (chatTime >= yesterday) groups.yesterday.push(chat);
        else groups.older.push(chat);
    });

    function renderGroup(title, chatList) {
        if (chatList.length === 0) return;

        const header = document.createElement('div');
        header.className = 'history-section-title';
        header.textContent = title;
        elements.chatHistoryList.appendChild(header);

        chatList.forEach(chat => {
            const item = document.createElement('div');
            item.className = `chat-history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
            item.setAttribute('data-id', chat.id);

            const displayTitle = (chat.title && chat.title !== "Yangi suhbat") ? chat.title : t('newChat');

            item.innerHTML = `
                <div class="chat-item-content">
                    <i class="fa-regular fa-message chat-item-icon"></i>
                    <span class="chat-item-title" title="${escapeHtml(displayTitle)}">${escapeHtml(displayTitle)}</span>
                </div>
                <div class="chat-item-actions">
                    <button class="chat-action-btn delete-btn" title="${escapeHtml(t('deleteTitle'))}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;

            item.addEventListener('click', () => {
                setActiveChat(chat.id);
                if (window.innerWidth < 1024) toggleSidebar(false);
            });

            const delBtn = item.querySelector('.delete-btn');
            delBtn.addEventListener('click', (e) => openDeleteModal(chat.id, e));

            elements.chatHistoryList.appendChild(item);
        });
    }

    renderGroup(t('today'), groups.today);
    renderGroup(t('yesterday'), groups.yesterday);
    renderGroup(t('older'), groups.older);
}

// Xabarlarni ko'rsatish
function renderChatMessages() {
    const currentChat = state.chats.find(c => c.id === state.activeChatId);
    if (!currentChat || !elements.chatMessagesContainer) return;

    elements.chatMessagesContainer.innerHTML = '';

    if (!currentChat.messages || currentChat.messages.length === 0) {
        if (elements.welcomeSection) elements.welcomeSection.style.display = 'flex';
        return;
    }

    if (elements.welcomeSection) elements.welcomeSection.style.display = 'none';

    currentChat.messages.forEach(msg => {
        appendMessageElement(msg.role, msg.text, msg.timestamp, false, msg);
    });

    scrollToBottom();
}

function appendMessageElement(role, text, timestamp = Date.now(), shouldScroll = true, msg = null) {
    if (elements.welcomeSection) {
        elements.welcomeSection.style.display = 'none';
    }

    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${role}`;

    const messageId = msg && msg.id ? msg.id : '';
    if (messageId) messageRow.setAttribute('data-message-id', messageId);

    const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let contentHtml = '';
    if (role === 'ai') {
        contentHtml = renderMarkdown(text);
    } else {
        contentHtml = escapeHtml(text).replace(/\n/g, '<br>');
    }

    if (role === 'user') {
        messageRow.innerHTML = `
            <div class="message-bubble-wrap">
                <div class="message-meta">
                    <span class="message-author-name">${escapeHtml(t('you'))}</span>
                    <span>•</span>
                    <span>${formattedTime}</span>
                </div>
                <div class="message-bubble">${contentHtml}</div>
                <div class="message-actions-bar">
                    <button class="msg-btn copy-msg-btn" title="${escapeHtml(t('copy'))}">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="message-avatar user">
                <i class="fa-solid fa-user"></i>
            </div>
        `;
    } else {
        const feedback = msg && msg.feedback ? msg.feedback : '';
        const showFeedback = !(msg && msg.isError) && !!messageId;

        // AI javobi davomiyligini (sekund / minut) ko'rsatish
        let durationHtml = '';
        if (msg && msg.durationMs) {
            const timeFormatted = formatResponseDuration(msg.durationMs);
            if (timeFormatted) {
                durationHtml = `<span>•</span><span class="message-duration-tag" title="${escapeHtml(t('responseTimeTitle'))}"><i class="fa-regular fa-clock"></i> ${escapeHtml(timeFormatted)}</span>`;
            }
        }

        messageRow.innerHTML = `
            <div class="message-avatar ai" title="Mr.Bekmirzayev AI">
                <img src="./meteor-solid (1).png" alt="AI" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✨</text></svg>'">
            </div>
            <div class="message-bubble-wrap">
                <div class="message-meta">
                    <span class="message-author-name">Mr.Bekmirzayev AI</span>
                    <span>•</span>
                    <span>${formattedTime}</span>
                    ${durationHtml}
                </div>
                <div class="message-bubble markdown-body">${contentHtml}</div>
                <div class="message-actions-bar">
                    <button class="msg-btn copy-msg-btn" title="${escapeHtml(t('copyAnswer'))}">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <button class="msg-btn speak-msg-btn" title="${escapeHtml(t('speak'))}">
                        <i class="fa-solid fa-volume-high"></i>
                    </button>
                    ${showFeedback ? `
                    <button class="msg-btn feedback-btn like-btn ${feedback === 'like' ? 'active' : ''}" title="${escapeHtml(t('like'))}">
                        <i class="fa-regular fa-thumbs-up"></i>
                    </button>
                    <button class="msg-btn feedback-btn dislike-btn ${feedback === 'dislike' ? 'active' : ''}" title="${escapeHtml(t('dislike'))}">
                        <i class="fa-regular fa-thumbs-down"></i>
                    </button>` : ''}
                </div>
            </div>
        `;
    }

    const copyBtn = messageRow.querySelector('.copy-msg-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text).then(() => {
                showToast(t('copied'), "success");
            });
        });
    }

    const speakBtn = messageRow.querySelector('.speak-msg-btn');
    if (speakBtn) {
        speakBtn.addEventListener('click', () => speakText(text));
    }

    const likeBtn = messageRow.querySelector('.like-btn');
    if (likeBtn && messageId) {
        likeBtn.addEventListener('click', () => handleLike(messageId, text));
    }

    const dislikeBtn = messageRow.querySelector('.dislike-btn');
    if (dislikeBtn && messageId) {
        dislikeBtn.addEventListener('click', () => handleDislikeClick(messageId, text));
    }

    setupCodeCopyButtons(messageRow);

    const inlineActionBtns = messageRow.querySelectorAll('.btn-open-settings-inline');
    inlineActionBtns.forEach(b => {
        b.addEventListener('click', () => {
            openSettingsModal();
        });
    });

    elements.chatMessagesContainer.appendChild(messageRow);

    if (shouldScroll) {
        scrollToBottom();
    }

    return messageRow;
}

// Typing animatsiyasi
let typingIndicatorElem = null;

function showTypingIndicator(message = t('typing')) {
    removeTypingIndicator();

    typingIndicatorElem = document.createElement('div');
    typingIndicatorElem.className = 'typing-indicator-row';
    typingIndicatorElem.id = 'typingIndicator';
    typingIndicatorElem.innerHTML = `
        <div class="message-avatar ai">
            <img src="./meteor-solid (1).png" alt="AI">
        </div>
        <div class="typing-bubble">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <span class="typing-text">${escapeHtml(message)}</span>
        </div>
    `;

    elements.chatMessagesContainer.appendChild(typingIndicatorElem);
    scrollToBottom();
}

function removeTypingIndicator() {
    if (typingIndicatorElem && typingIndicatorElem.parentNode) {
        typingIndicatorElem.parentNode.removeChild(typingIndicatorElem);
    }
    typingIndicatorElem = null;
}

// Gemini API uchun to'g'ri navbatdagi (alternating) xabarlar massivini tayyorlash
function prepareValidContents(messages) {
    const valid = [];
    // Faqat xatolik bo'lmagan toza xabarlarni filtrlash
    const filtered = messages.filter(m => !m.isError && m.text && m.text.trim());

    for (const msg of filtered) {
        const role = msg.role === 'ai' ? 'model' : 'user';
        if (valid.length > 0 && valid[valid.length - 1].role === role) {
            // Agar ketma-ket bir xil roldan xabar kelsa, birlashtirish (Gemini qat'iy talabi)
            valid[valid.length - 1].parts[0].text += "\n" + msg.text;
        } else {
            valid.push({
                role: role,
                parts: [{ text: msg.text }]
            });
        }
    }

    // Birinchi xabar doim 'user' bo'lishini ta'minlash
    while (valid.length > 0 && valid[0].role !== 'user') {
        valid.shift();
    }

    return valid;
}

// Google Gemini API so'rovi (Aqlli zaxira modellari bilan)
async function executeGeminiRequest(apiKey, validContents, preferredModel) {
    // Sinab ko'riladigan modellar ro'yxati
    const modelsToTry = [preferredModel];
    FALLBACK_MODELS.forEach(m => {
        if (!modelsToTry.includes(m)) modelsToTry.push(m);
    });

    let lastError = null;

    for (let i = 0; i < modelsToTry.length; i++) {
        const modelName = modelsToTry[i];
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const payload = {
                system_instruction: {
                    parts: [{ text: CREATOR_SYSTEM_INSTRUCTION }]
                },
                contents: validContents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95
                }
            };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.error) {
                lastError = data.error;
                // Agar model topilmasa (404), navbatdagi modelga o'tish
                if (data.error.code === 404 || 
                    (data.error.message && data.error.message.includes('not found')) ||
                    (data.error.message && data.error.message.includes('not supported'))) {
                    console.warn(`Model ${modelName} mavjud emas, navbatdagisi sinab ko'rilmoqda...`);
                    continue;
                }
                // Agar API kalit noto'g'ri bo'lsa yoki limit tugagan bo'lsa, davom ettirmaslik
                return { success: false, error: data.error };
            }

            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                // Ishlaydigan modelni eslab qolish
                if (modelName !== state.model) {
                    state.model = modelName;
                    localStorage.setItem('mb_ai_model', modelName);
                    if (elements.modelSelect) elements.modelSelect.value = modelName;
                }
                return { success: true, text: text, model: modelName };
            }

        } catch (fetchErr) {
            console.warn(`Model ${modelName} ulanishida xatolik:`, fetchErr);
            lastError = fetchErr;
        }
    }

    return { success: false, error: lastError };
}

// Xabar yuborish asosiy funksiyasi
async function sendMessage() {
    if (state.isGenerating) return;

    const text = elements.userInput.value.trim();
    if (!text) return;

    // Mehmon rejimi cheklovi: 2 ta xabardan so'ng akkauntga kirish majburiy
    if (!state.user && state.guestMessageCount >= GUEST_MESSAGE_LIMIT) {
        openAuthModal({ mandatory: true });
        return;
    }

    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    updateSendButtonState();

    let currentChat = state.chats.find(c => c.id === state.activeChatId);
    if (!currentChat) {
        currentChat = createNewChat(false);
    }

    if (currentChat.messages.length === 0) {
        currentChat.title = text.length > 28 ? text.substring(0, 28) + '...' : text;
        renderChatHistoryList();
    }

    const userMsg = {
        id: createId('msg'),
        role: 'user',
        text: text,
        timestamp: Date.now()
    };
    currentChat.messages.push(userMsg);
    saveChats();

    // Mehmon xabarlari hisoblagichi
    if (!state.user) {
        state.guestMessageCount += 1;
        localStorage.setItem('mb_ai_guest_msg_count', String(state.guestMessageCount));
        updateGuestLimitUI();
    }

    appendMessageElement('user', text, userMsg.timestamp, true, userMsg);

    state.isGenerating = true;
    updateSendButtonState();
    showTypingIndicator(t('typing'));
    const requestStartTime = Date.now();

    try {
        const apiKey = state.apiKey || INITIAL_FALLBACK_KEY;
        const preferredModel = state.model || DEFAULT_MODEL;

        // Xabarlar tarixini tozalash (xatoliklar API ga yuborilmaydi)
        const validContents = prepareValidContents(currentChat.messages);

        const result = await executeGeminiRequest(apiKey, validContents, preferredModel);
        removeTypingIndicator();
        const durationMs = Math.max(100, Date.now() - requestStartTime);

        if (result.success) {
            const aiMsg = {
                id: createId('msg'),
                role: 'ai',
                text: result.text,
                timestamp: Date.now(),
                durationMs: durationMs
            };
            currentChat.messages.push(aiMsg);
            saveChats();
            appendMessageElement('ai', result.text, aiMsg.timestamp, true, aiMsg);
        } else {
            handleApiError(result.error);
        }

    } catch (err) {
        removeTypingIndicator();
        console.error("Tarmoq xatosi:", err);
        showToast(t('networkError'), "error");
        handleApiError({ message: t('networkError') });
    } finally {
        state.isGenerating = false;
        updateSendButtonState();
    }
}

// Xatoliklarni boshqarish
function handleApiError(error) {
    console.error("API Xatosi:", error);
    const errText = error && error.message ? error.message : t('errGeneric');
    let errorMessage = t('apiErrPrefix', { msg: errText });

    if (!state.apiKey) {
        errorMessage = `${t('apiErrNoKey')}\n\n<button type="button" class="btn-inline-action btn-open-settings-inline" style="margin-top: 8px;"><i class="fa-solid fa-key"></i> ${t('btnEnterNewKey')}</button>`;
    } else if (error && (error.code === 400 || (error.message && error.message.toLowerCase().includes('api_key')))) {
        errorMessage = `${t('apiErrInvalidKey')}\n\n<button type="button" class="btn-inline-action btn-open-settings-inline" style="margin-top: 8px;"><i class="fa-solid fa-sliders"></i> ${t('btnSetupKey')}</button>`;
    } else if (error && (error.code === 429 || (error.message && error.message.toLowerCase().includes('quota')))) {
        errorMessage = `${t('apiErrQuota')}\n\n<button type="button" class="btn-inline-action btn-open-settings-inline" style="margin-top: 8px;"><i class="fa-solid fa-key"></i> ${t('btnAddNewKey')}</button>`;
    } else {
        errorMessage += `\n\n<button type="button" class="btn-inline-action btn-open-settings-inline" style="margin-top: 8px;"><i class="fa-solid fa-sliders"></i> ${t('btnCheckSettings')}</button>`;
    }

    const currentChat = state.chats.find(c => c.id === state.activeChatId);
    if (currentChat) {
        // isError: true bayrog'i orqali xatolik keyingi suhbat tarixiga qo'shilmaydi!
        const errorMsgObj = {
            id: createId('msg'),
            role: 'ai',
            text: errorMessage,
            timestamp: Date.now(),
            isError: true
        };
        currentChat.messages.push(errorMsgObj);
        saveChats();
        appendMessageElement('ai', errorMessage, errorMsgObj.timestamp, true, errorMsgObj);
    }
}

// Markdown va kod bloklarini formatlash
function renderMarkdown(rawText) {
    if (!rawText) return '';

    if (window.marked) {
        try {
            window.marked.setOptions({ breaks: true, gfm: true });
            let parsed = window.marked.parse(rawText);
            return wrapCodeBlocks(parsed);
        } catch (e) {
            console.warn("Marked xatoligi:", e);
        }
    }

    return parseBasicMarkdown(rawText);
}

function wrapCodeBlocks(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const preElements = doc.querySelectorAll('pre');
    preElements.forEach(pre => {
        const code = pre.querySelector('code');
        let lang = 'code';
        if (code && code.className) {
            const match = code.className.match(/language-(\w+)/);
            if (match) lang = match[1];
        }

        const wrapper = doc.createElement('div');
        wrapper.className = 'code-block-wrapper';

        wrapper.innerHTML = `
            <div class="code-block-header">
                <span class="code-lang-label">${lang}</span>
                <button class="btn-copy-code" type="button">
                    <i class="fa-regular fa-copy"></i> ${escapeHtml(t('copy'))}
                </button>
            </div>
        `;

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
    });

    return doc.body.innerHTML;
}

function parseBasicMarkdown(text) {
    let escaped = escapeHtml(text);

    escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'code';
        return `
            <div class="code-block-wrapper">
                <div class="code-block-header">
                    <span class="code-lang-label">${language}</span>
                    <button class="btn-copy-code" type="button">
                        <i class="fa-regular fa-copy"></i> ${escapeHtml(t('copy'))}
                    </button>
                </div>
                <pre><code>${code.trim()}</code></pre>
            </div>
        `;
    });

    escaped = escaped.replace(/`([^`]+)`/g, '<inline-code>$1</inline-code>');
    escaped = escaped.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    escaped = escaped.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    escaped = escaped.replace(/__(.*?)__/g, '<b>$1</b>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<i>$1</i>');
    escaped = escaped.replace(/_([^_]+)_/g, '<i>$1</i>');
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}

function setupCodeCopyButtons(container) {
    const copyBtns = container.querySelectorAll('.btn-copy-code');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wrapper = btn.closest('.code-block-wrapper');
            if (wrapper) {
                const codeElem = wrapper.querySelector('pre code') || wrapper.querySelector('pre');
                if (codeElem) {
                    const text = codeElem.innerText;
                    navigator.clipboard.writeText(text).then(() => {
                        const originalHtml = btn.innerHTML;
                        btn.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981;"></i> ${escapeHtml(t('copiedShort'))}`;
                        setTimeout(() => {
                            btn.innerHTML = originalHtml;
                        }, 2000);
                        showToast(t('codeCopied'), "success");
                    });
                }
            }
        });
    });
}

// Ovozli eshitish (Text-to-speech)
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        showToast(t('ttsUnsupported'), "info");
        return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\[\]()]/g, ' ').substring(0, 400);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('uz') || v.lang.startsWith('tr') || v.lang.startsWith('ru') || v.lang.startsWith('en'));
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
    showToast(t('ttsPlaying'), "info");
}

// Hodisalar tinglovchilari (Event Listeners)
function setupEventListeners() {
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    if (elements.sidebarToggleBtn) {
        elements.sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));
    }

    if (elements.newChatBtn) {
        elements.newChatBtn.addEventListener('click', () => createNewChat(true));
    }

    if (elements.clearAllChatsBtn) {
        elements.clearAllChatsBtn.addEventListener('click', clearAllChats);
    }

    if (elements.userInput) {
        elements.userInput.addEventListener('input', () => {
            elements.userInput.style.height = 'auto';
            elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 180) + 'px';
            updateSendButtonState();
        });

        elements.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (elements.sendMessageBtn) {
        elements.sendMessageBtn.addEventListener('click', sendMessage);
    }

    // Sozlamalar
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', openSettingsModal);
    }
    if (elements.headerApiKeyBtn) {
        elements.headerApiKeyBtn.addEventListener('click', openSettingsModal);
    }
    if (elements.openSettingsKeyBtn) {
        elements.openSettingsKeyBtn.addEventListener('click', openSettingsModal);
    }
    if (elements.closeSettingsBtn) {
        elements.closeSettingsBtn.addEventListener('click', () => closeModal(elements.settingsModal));
    }
    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }
    if (elements.toggleApiKeyVisibility) {
        elements.toggleApiKeyVisibility.addEventListener('click', () => {
            const isPassword = elements.apiKeyInput.type === 'password';
            elements.apiKeyInput.type = isPassword ? 'text' : 'password';
            elements.toggleApiKeyVisibility.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
        });
    }

    // Sozlamalarda kalitni tekshirish
    if (elements.testKeyBtn) {
        elements.testKeyBtn.addEventListener('click', () => {
            const key = elements.apiKeyInput.value.trim();
            if (!key) {
                if (elements.modelDetectStatus) {
                    elements.modelDetectStatus.className = 'model-detect-status error';
                    elements.modelDetectStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${t('modelCheckKeyEmpty')}`;
                }
                return;
            }
            detectSupportedModels(key, true);
        });
    }

    // Til tanlash
    document.querySelectorAll('.js-lang-select').forEach(select => {
        select.addEventListener('change', (e) => applyLanguage(e.target.value));
    });

    // Akkaunt
    if (elements.accountBtn) {
        elements.accountBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.user) openSettingsModal();
            else openAuthModal();
        });
    }
    if (elements.settingsLoginBtn) {
        elements.settingsLoginBtn.addEventListener('click', () => {
            closeModal(elements.settingsModal);
            openAuthModal();
        });
    }
    if (elements.settingsLogoutBtn) {
        elements.settingsLogoutBtn.addEventListener('click', logoutUser);
    }
    if (elements.settingsThemeBtn) {
        elements.settingsThemeBtn.addEventListener('click', toggleTheme);
    }

    // Onboarding
    if (elements.onboardingDoneBtn) {
        elements.onboardingDoneBtn.addEventListener('click', () => {
            localStorage.setItem('mb_ai_onboarded', '1');
            closeModal(elements.onboardingModal);
        });
    }

    // Auth modal
    if (elements.closeAuthBtn) {
        elements.closeAuthBtn.addEventListener('click', () => {
            if (!state.authMandatory) closeModal(elements.authModal);
        });
    }
    if (elements.loginTabBtn) {
        elements.loginTabBtn.addEventListener('click', () => setAuthMode('login'));
    }
    if (elements.registerTabBtn) {
        elements.registerTabBtn.addEventListener('click', () => setAuthMode('register'));
    }
    if (elements.authForm) {
        elements.authForm.addEventListener('submit', handleAuthSubmit);
    }
    if (elements.forgotPasswordBtn) {
        elements.forgotPasswordBtn.addEventListener('click', handlePasswordReset);
    }

    // Feedback modal
    if (elements.closeFeedbackBtn) {
        elements.closeFeedbackBtn.addEventListener('click', () => closeModal(elements.feedbackModal));
    }
    if (elements.cancelFeedbackBtn) {
        elements.cancelFeedbackBtn.addEventListener('click', () => closeModal(elements.feedbackModal));
    }
    if (elements.submitFeedbackBtn) {
        elements.submitFeedbackBtn.addEventListener('click', submitDislikeFeedback);
    }
    if (elements.feedbackOtherBtn) {
        elements.feedbackOtherBtn.addEventListener('click', () => {
            if (elements.feedbackReasonInput) {
                elements.feedbackReasonInput.value = t('feedbackOther');
                elements.feedbackReasonInput.focus();
            }
        });
    }

    // O'chirish modal oynasi
    if (elements.cancelDeleteBtn) {
        elements.cancelDeleteBtn.addEventListener('click', () => {
            closeModal(elements.deleteModal);
            chatToDeleteId = null;
        });
    }
    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener('click', confirmDeleteChat);
    }

    window.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeModal(elements.settingsModal);
        if (e.target === elements.deleteModal) closeModal(elements.deleteModal);
        if (e.target === elements.feedbackModal) closeModal(elements.feedbackModal);
        if (e.target === elements.authModal && !state.authMandatory) closeModal(elements.authModal);
    });

    window.addEventListener('resize', handleResize);

    const promptCards = document.querySelectorAll('.prompt-card');
    promptCards.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            if (prompt && elements.userInput) {
                elements.userInput.value = prompt;
                elements.userInput.style.height = 'auto';
                elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 180) + 'px';
                updateSendButtonState();
                sendMessage();
            }
        });
    });
}

function openSettingsModal() {
    elements.apiKeyInput.value = state.apiKey;
    if (elements.modelSelect) elements.modelSelect.value = state.model;
    if (elements.modelDetectStatus) {
        elements.modelDetectStatus.style.display = 'none';
    }
    document.querySelectorAll('.js-lang-select').forEach(select => select.value = state.lang);
    updateAccountUI();
    updateThemeLabel();
    updateSettingsLimitUI();
    openModal(elements.settingsModal);
    setTimeout(() => {
        if (elements.apiKeyInput) elements.apiKeyInput.focus();
    }, 150);
}

function updateSendButtonState() {
    if (!elements.sendMessageBtn || !elements.userInput) return;
    const hasText = elements.userInput.value.trim().length > 0;
    elements.sendMessageBtn.disabled = !hasText || state.isGenerating;
}

function toggleSidebar(forceState) {
    const isClosed = forceState !== undefined ? !forceState : !elements.sidebar.classList.contains('closed');
    
    if (isClosed) {
        elements.sidebar.classList.add('closed');
        if (elements.sidebarOverlay) elements.sidebarOverlay.classList.remove('active');
        state.sidebarOpen = false;
    } else {
        elements.sidebar.classList.remove('closed');
        if (window.innerWidth < 1024 && elements.sidebarOverlay) {
            elements.sidebarOverlay.classList.add('active');
        }
        state.sidebarOpen = true;
    }
}

function handleResize() {
    // Sidebar faqat foydalanuvchi tugmani bosganda ochiladi.
    // Ekran o'lchami o'zgarganda avtomatik ochilib ketmaydi.
    if (window.innerWidth < 1024) {
        elements.sidebar.classList.add('closed');
        if (elements.sidebarOverlay) elements.sidebarOverlay.classList.remove('active');
        state.sidebarOpen = false;
    } else {
        elements.sidebar.classList.toggle('closed', !state.sidebarOpen);
        if (elements.sidebarOverlay) elements.sidebarOverlay.classList.remove('active');
    }
}

/* ==========================================================================
   Firebase Authentication
   ========================================================================== */

let authInitStarted = false;

function setupAuth() {
    const init = () => {
        if (authInitStarted) return;
        authInitStarted = true;

        if (!window.FB || !window.FB.auth || !window.FB.onAuthStateChanged) {
            console.warn("Firebase mavjud emas — mehmon rejimida ishlaydi.");
            return;
        }

        state.fbReady = true;

        try {
            window.FB.onAuthStateChanged(window.FB.auth, (user) => {
                state.user = user || null;
                updateAccountUI();
                updateGuestLimitUI();

                if (user) {
                    if (elements.authModal && elements.authModal.classList.contains('active')) {
                        state.authMandatory = false;
                        closeModal(elements.authModal);
                    }
                }
            });
        } catch (e) {
            console.warn("Auth holatini kuzatishda xatolik:", e);
        }
    };

    if (window.FB && window.FB.auth) {
        init();
    } else {
        window.addEventListener('fb-ready', init, { once: true });
    }
}

function updateAccountUI() {
    const user = state.user;

    if (elements.accountGuestView) {
        elements.accountGuestView.style.display = user ? 'none' : 'flex';
    }
    if (elements.accountUserView) {
        elements.accountUserView.style.display = user ? 'flex' : 'none';
    }

    if (user) {
        if (elements.accountEmail) {
            const name = user.displayName ? `${user.displayName} • ` : '';
            elements.accountEmail.textContent = `${name}${user.email || ''}`;
        }
        if (elements.accountStatus) {
            elements.accountStatus.textContent = t('signedInAs');
        }
    }

    if (elements.accountBtn) {
        elements.accountBtn.classList.toggle('signed-in', !!user);
        elements.accountBtn.setAttribute('title', user ? (user.email || t('accountTitle')) : t('accountTitle'));
    }

    // Sidebardagi akkaunt kartasini yangilash
    const sidebarAccountName = document.getElementById('sidebarAccountName');
    const sidebarAccountSub = document.getElementById('sidebarAccountSub');
    const sidebarAccountIcon = document.getElementById('sidebarAccountIcon');
    if (sidebarAccountName) {
        sidebarAccountName.textContent = user ? (user.displayName || (user.email ? user.email.split('@')[0] : t('accountTitle'))) : t('guest');
    }
    if (sidebarAccountSub) {
        sidebarAccountSub.textContent = user
            ? (user.email || t('signedInAs'))
            : t('guestBadge', { n: Math.min(state.guestMessageCount, GUEST_MESSAGE_LIMIT) });
    }
    if (sidebarAccountIcon) {
        sidebarAccountIcon.className = user ? 'fa-solid fa-user-check' : 'fa-regular fa-user';
    }

    updateSettingsLimitUI();
}

function updateGuestLimitUI() {
    const shownCount = Math.min(state.guestMessageCount, GUEST_MESSAGE_LIMIT);

    if (elements.guestBadge) {
        if (state.user) {
            elements.guestBadge.style.display = 'none';
        } else {
            elements.guestBadge.style.display = 'inline-flex';
            elements.guestBadge.textContent = t('guestBadge', { n: shownCount });
            elements.guestBadge.classList.toggle('limit-reached', state.guestMessageCount >= GUEST_MESSAGE_LIMIT);
        }
    }

    const sidebarAccountSub = document.getElementById('sidebarAccountSub');
    if (sidebarAccountSub && !state.user) {
        sidebarAccountSub.textContent = t('guestBadge', { n: shownCount });
    }

    updateSettingsLimitUI();
}

function updateSettingsLimitUI() {
    const labelElem = document.getElementById('settingsLimitLabel');
    const badgeElem = document.getElementById('settingsLimitBadge');
    const barElem = document.getElementById('settingsLimitBar');
    const helpElem = document.getElementById('settingsLimitHelp');

    if (!labelElem || !badgeElem) return;

    if (state.user) {
        labelElem.textContent = t('accountLimitLabel') || 'Akkaunt holati:';
        badgeElem.textContent = t('limitUnlimited') || 'Cheksiz';
        badgeElem.className = 'settings-limit-badge success';
        if (barElem) {
            barElem.style.width = '100%';
            barElem.className = 'settings-limit-bar-fill success';
        }
        if (helpElem) {
            helpElem.textContent = t('limitUserHelp') || 'Tizimga kirgansiz. Sizda cheksiz xabarlar mavjud.';
        }
    } else {
        const remaining = Math.max(0, GUEST_MESSAGE_LIMIT - state.guestMessageCount);
        labelElem.textContent = t('guestLimitLabel') || 'Mehmon limiti:';
        badgeElem.textContent = `${remaining} / ${GUEST_MESSAGE_LIMIT} ${t('remaining') || 'qoldi'}`;

        const pct = Math.max(0, Math.min(100, (remaining / GUEST_MESSAGE_LIMIT) * 100));
        if (barElem) {
            barElem.style.width = `${pct}%`;
            barElem.className = pct > 0 ? 'settings-limit-bar-fill' : 'settings-limit-bar-fill danger';
        }
        badgeElem.className = remaining > 0 ? 'settings-limit-badge' : 'settings-limit-badge danger';

        if (helpElem) {
            helpElem.textContent = remaining > 0
                ? (t('limitGuestHelp', { n: remaining }) || `Mehmon sifatida yana ${remaining} ta bepul xabar yuborishingiz mumkin.`)
                : (t('limitGuestExhausted') || `Limit tugadi. Davom etish uchun akkauntga kiring!`);
        }
    }
}

function openAuthModal(options) {
    state.authMandatory = !!(options && options.mandatory);
    updateAuthModalChrome();
    setAuthMode('login');
    openModal(elements.authModal);

    setTimeout(() => {
        if (elements.authEmailInput) elements.authEmailInput.focus();
    }, 150);
}

function updateAuthModalChrome() {
    if (elements.authModalTitle) {
        elements.authModalTitle.textContent = state.authMandatory ? t('authRequiredTitle') : t('authTitle');
    }
    if (elements.authRequiredNotice) {
        elements.authRequiredNotice.style.display = state.authMandatory ? 'flex' : 'none';
    }
    if (elements.closeAuthBtn) {
        elements.closeAuthBtn.style.display = state.authMandatory ? 'none' : 'flex';
    }
}

function setAuthMode(mode) {
    state.authMode = mode === 'register' ? 'register' : 'login';
    const isRegister = state.authMode === 'register';

    if (elements.loginTabBtn) elements.loginTabBtn.classList.toggle('active', !isRegister);
    if (elements.registerTabBtn) elements.registerTabBtn.classList.toggle('active', isRegister);
    if (elements.nameFieldGroup) elements.nameFieldGroup.style.display = isRegister ? 'flex' : 'none';
    if (elements.forgotPasswordBtn) elements.forgotPasswordBtn.style.display = isRegister ? 'none' : 'inline-block';

    const submitSpan = elements.authSubmitBtn ? elements.authSubmitBtn.querySelector('span') : null;
    if (submitSpan) {
        const key = isRegister ? 'registerBtn' : 'loginBtn';
        submitSpan.setAttribute('data-i18n', key);
        submitSpan.textContent = t(key);
    }

    if (elements.authPasswordInput) {
        elements.authPasswordInput.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
    }

    showAuthError('');
}

function showAuthError(message) {
    if (!elements.authError) return;
    elements.authError.textContent = message || '';
    elements.authError.style.display = message ? 'block' : 'none';
}

function setAuthLoading(isLoading) {
    if (!elements.authSubmitBtn) return;
    elements.authSubmitBtn.disabled = !!isLoading;

    const submitSpan = elements.authSubmitBtn.querySelector('span');
    if (!submitSpan) return;

    if (isLoading) {
        submitSpan.textContent = t('authLoading');
    } else {
        const key = state.authMode === 'register' ? 'registerBtn' : 'loginBtn';
        submitSpan.setAttribute('data-i18n', key);
        submitSpan.textContent = t(key);
    }
}

function mapAuthError(error) {
    const code = error && error.code ? String(error.code) : '';

    if (code.includes('email-already-in-use')) return t('errEmailInUse');
    if (code.includes('invalid-email')) return t('errInvalidEmail');
    if (code.includes('weak-password')) return t('errWeakPassword');
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return t('errWrongPassword');
    if (code.includes('user-not-found')) return t('errUserNotFound');
    if (code.includes('too-many-requests')) return t('errTooMany');
    if (code.includes('network-request-failed')) return t('errAuthUnavailable');

    return t('errGeneric');
}

async function handleAuthSubmit(event) {
    if (event) event.preventDefault();

    if (!window.FB || !window.FB.auth) {
        showAuthError(t('errAuthUnavailable'));
        return;
    }

    const name = elements.authNameInput ? elements.authNameInput.value.trim() : '';
    const email = elements.authEmailInput ? elements.authEmailInput.value.trim() : '';
    const password = elements.authPasswordInput ? elements.authPasswordInput.value : '';

    if (state.authMode === 'register' && !name) {
        showAuthError(t('errNameRequired'));
        return;
    }
    if (!email) {
        showAuthError(t('errEmailRequired'));
        return;
    }
    if (!password) {
        showAuthError(t('errPasswordRequired'));
        return;
    }

    showAuthError('');
    setAuthLoading(true);

    try {
        if (state.authMode === 'register') {
            const credential = await window.FB.createUserWithEmailAndPassword(window.FB.auth, email, password);

            if (credential && credential.user && name && window.FB.updateProfile) {
                try {
                    await window.FB.updateProfile(credential.user, { displayName: name });
                } catch (e) {
                    console.warn("Profil ismini yangilashda xatolik:", e);
                }
            }

            if (credential && credential.user && window.FB.saveUserProfile) {
                try {
                    await window.FB.saveUserProfile({
                        uid: credential.user.uid,
                        name: name,
                        email: email,
                        language: state.lang,
                        createdAtClient: new Date().toISOString()
                    });
                } catch (e) {
                    console.warn("Foydalanuvchi profilini saqlashda xatolik:", e);
                }
            }

            state.user = credential && credential.user ? credential.user : state.user;
            showToast(t('authRegisterDone'), 'success');
        } else {
            const credential = await window.FB.signInWithEmailAndPassword(window.FB.auth, email, password);
            state.user = credential && credential.user ? credential.user : state.user;
            showToast(t('authWelcome'), 'success');
        }

        state.authMandatory = false;
        closeModal(elements.authModal);
        if (elements.authForm) elements.authForm.reset();
        updateAccountUI();
        updateGuestLimitUI();

    } catch (error) {
        console.error("Auth xatosi:", error);
        showAuthError(mapAuthError(error));
    } finally {
        setAuthLoading(false);
    }
}

async function handlePasswordReset() {
    if (!window.FB || !window.FB.auth) {
        showAuthError(t('errAuthUnavailable'));
        return;
    }

    const email = elements.authEmailInput ? elements.authEmailInput.value.trim() : '';
    if (!email) {
        showAuthError(t('errEmailRequired'));
        return;
    }

    try {
        await window.FB.sendPasswordResetEmail(window.FB.auth, email);
        showAuthError('');
        showToast(t('authResetSent'), 'success');
    } catch (error) {
        console.error("Parolni tiklash xatosi:", error);
        showAuthError(mapAuthError(error));
    }
}

async function logoutUser() {
    if (!window.FB || !window.FB.auth) return;

    try {
        await window.FB.signOut(window.FB.auth);
        state.user = null;
        updateAccountUI();
        updateGuestLimitUI();
        showToast(t('authLoggedOut'), 'info');
    } catch (error) {
        console.error("Chiqish xatosi:", error);
        showToast(t('errGeneric'), 'error');
    }
}

/* ==========================================================================
   Like / Dislike & AI Response Duration
   ========================================================================== */

function formatResponseDuration(ms) {
    if (!ms || ms <= 0) return '';
    const totalSec = ms / 1000;
    if (totalSec < 60) {
        const s = totalSec < 10 ? totalSec.toFixed(1) : Math.round(totalSec);
        return `${s} ${t('secShort') || 'soniya'}`;
    }
    const mins = Math.floor(totalSec / 60);
    const secs = Math.round(totalSec % 60);
    return `${mins} ${t('minShort') || 'daq'} ${secs} ${t('secShort') || 'soniya'}`;
}

function getMessageById(messageId) {
    const chat = state.chats.find(c => c.id === state.activeChatId);
    if (!chat) return { chat: null, message: null };
    const message = chat.messages.find(m => m.id === messageId);
    return { chat, message };
}

async function handleLike(messageId, text) {
    const { chat, message } = getMessageById(messageId);
    if (!chat || !message) return;

    // Agar allaqachon like bosilgan bo'lsa, qayta bosilganda bekor qilish (toggle)
    if (message.feedback === 'like') {
        message.feedback = null;
        message.feedbackReason = '';
        saveChats();
        updateFeedbackButtons(messageId, null);
        showToast(t('feedbackCanceled') || "Baho bekor qilindi", "info");
        return;
    }

    message.feedback = 'like';
    message.feedbackReason = '';
    saveChats();
    updateFeedbackButtons(messageId, 'like');

    const payload = buildFeedbackPayload(chat, message, 'like', '');
    await saveFeedbackRecord(payload);
    showToast(t('feedbackSaved'), 'success');
}

function handleDislikeClick(messageId, text) {
    const { chat, message } = getMessageById(messageId);
    if (!chat || !message) return;

    // Agar allaqachon dislike bosilgan bo'lsa, qayta bosilganda bekor qilish (toggle)
    if (message.feedback === 'dislike') {
        message.feedback = null;
        message.feedbackReason = '';
        saveChats();
        updateFeedbackButtons(messageId, null);
        showToast(t('feedbackCanceled') || "Baho bekor qilindi", "info");
        return;
    }

    openFeedbackModal(messageId, text);
}

function openFeedbackModal(messageId, text) {
    const { message } = getMessageById(messageId);
    state.pendingFeedback = { messageId: messageId, text: text || (message ? message.text : '') };

    if (elements.feedbackReasonInput) {
        elements.feedbackReasonInput.value = message && message.feedbackReason ? message.feedbackReason : '';
    }

    openModal(elements.feedbackModal);
    setTimeout(() => {
        if (elements.feedbackReasonInput) elements.feedbackReasonInput.focus();
    }, 150);
}

async function submitDislikeFeedback() {
    const pending = state.pendingFeedback;
    if (!pending) {
        closeModal(elements.feedbackModal);
        return;
    }

    // Sabab kiritilmagan bo'lsa ham avtomatik "Boshqa / Yoqmadi" deb qabul qilinadi
    const inputVal = elements.feedbackReasonInput ? elements.feedbackReasonInput.value.trim() : '';
    const reason = inputVal || t('feedbackOther') || 'Yoqmadi';

    const { chat, message } = getMessageById(pending.messageId);
    if (!chat || !message) {
        closeModal(elements.feedbackModal);
        state.pendingFeedback = null;
        return;
    }

    message.feedback = 'dislike';
    message.feedbackReason = reason;
    saveChats();
    updateFeedbackButtons(pending.messageId, 'dislike');

    closeModal(elements.feedbackModal);
    state.pendingFeedback = null;

    const payload = buildFeedbackPayload(chat, message, 'dislike', reason);
    await saveFeedbackRecord(payload);
    showToast(t('feedbackSaved'), 'success');
}

function updateFeedbackButtons(messageId, feedback) {
    const row = document.querySelector(`.message-row[data-message-id="${messageId}"]`);
    if (!row) return;

    const likeBtn = row.querySelector('.like-btn');
    const dislikeBtn = row.querySelector('.dislike-btn');

    if (likeBtn) likeBtn.classList.toggle('active', feedback === 'like');
    if (dislikeBtn) dislikeBtn.classList.toggle('active', feedback === 'dislike');
}

function buildFeedbackPayload(chat, message, rating, reason) {
    return {
        rating: rating,
        reason: reason || '',
        chatId: chat.id,
        chatTitle: chat.title || t('newChat'),
        messageId: message.id,
        messageText: String(message.text || '').slice(0, 4000),
        model: state.model || DEFAULT_MODEL,
        language: state.lang
    };
}

async function saveFeedbackRecord(payload) {
    const user = state.user;
    const record = {
        ...payload,
        userId: user ? user.uid : 'guest',
        userEmail: user && user.email ? user.email : '',
        userName: user && user.displayName ? user.displayName : '',
        isGuest: !user,
        createdAtClient: new Date().toISOString()
    };

    // 1. Har bir bahoni brauzerning lokal xotirasiga saqlash (ishonchli zaxira)
    try {
        const raw = localStorage.getItem('mb_ai_feedback');
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) {
            list.push(record);
            localStorage.setItem('mb_ai_feedback', JSON.stringify(list.slice(-500)));
        }
    } catch (e) {
        console.warn("Lokal feedback xotirasiga yozishda xatolik:", e);
    }

    // 2. Agar Firebase Firestore ulangan bo'lsa, bulutli bazaga yozish
    if (window.FB && typeof window.FB.saveFeedback === 'function') {
        try {
            await window.FB.saveFeedback(record);
            console.log("Feedback Firestore'ga muvaffaqiyatli saqlandi.");
            return true;
        } catch (error) {
            console.warn("Firestore'ga feedback yozishda xatolik (Firebase Rules tekshiring):", error);
            return true;
        }
    } else {
        console.info("Firebase Firestore hali yuklanmagan yoki file:// protokoli, baho lokal saqlandi.");
    }

    return true;
}

function scrollToBottom() {
    const viewport = document.getElementById('chatViewport');
    if (viewport) {
        setTimeout(() => {
            viewport.scrollTop = viewport.scrollHeight;
        }, 50);
    }
}

function openModal(modal) {
    if (modal) modal.classList.add('active');
}

function closeModal(modal) {
    if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '<i class="fa-solid fa-circle-info" style="color: var(--primary);"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check" style="color: var(--success);"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation" style="color: var(--danger);"></i>';

    toast.innerHTML = `
        ${icon}
        <span>${escapeHtml(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', initApp);
