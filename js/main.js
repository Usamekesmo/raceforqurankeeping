// =================================================================
// ==      الملف الرئيسي (main.js) - نسخة نهائية ومؤكدة
// =================================================================

import * as ui from './ui.js';
import * as api from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import * as achievements from './achievements.js';
import * as quests from './quests.js';
import { surahMetadata } from './quran-metadata.js';

// --- دوال التهيئة والإعداد ---

async function initialize() {
    ui.toggleLoader(true);
    try {
        await Promise.all([
            progression.initializeProgression(),
            quiz.initializeQuiz(),
            achievements.initializeAchievements()
        ]);
        setupEventListeners();
        ui.showScreen(ui.startScreen);
    } catch (error) {
        console.error("فشل تهيئة التطبيق:", error);
        document.body.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2em;">حدث خطأ فادح أثناء تحميل التطبيق. يرجى تحديث الصفحة.</p>';
    } finally {
        ui.toggleLoader(false);
    }
}

function setupEventListeners() {
    // --- مستمعو المصادقة ---
    if (document.getElementById('loginButton')) {
        document.getElementById('loginButton').addEventListener('click', handleLogin);
    }
    if (document.getElementById('signUpButton')) {
        document.getElementById('signUpButton').addEventListener('click', handleSignUp);
    }
    if (document.getElementById('recoverAccountLink')) {
        document.getElementById('recoverAccountLink').addEventListener('click', showRecoveryModal);
    }

    // --- المستمعون الأساسيون ---
    if (ui.startTestButton) ui.startTestButton.addEventListener('click', onStartPageTestClick);
    if (ui.reloadButton) ui.reloadButton.addEventListener('click', returnToMainMenu);
    if (ui.showFinalResultButton) {
        ui.showFinalResultButton.addEventListener('click', () => {
            const quizState = quiz.getCurrentState();
            const oldXp = player.playerData.xp - quizState.xpEarned;
            const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
            ui.displayFinalResult(quizState, levelUpInfo);
        });
    }

    // --- مستمعو التبويبات والفلاتر ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            ui.showTab(tabId);
            if (!button.dataset.loaded || tabId === 'clans-tab') {
                if (tabId === 'store-tab') store.renderStoreTabs('all');
                else if (tabId === 'leaderboard-tab') onLeaderboardTabClick();
                else if (tabId === 'profile-tab') ui.renderPlayerStats(player.playerData);
                else if (tabId === 'quests-tab') quests.renderQuests();
                else if (tabId === 'clans-tab') onClansTabClick();
                
                if (tabId !== 'test-tab') button.dataset.loaded = 'true';
            }
        });
    });
    
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            store.renderStoreTabs(e.target.dataset.filter);
        });
    });

    // --- مستمعو النوافذ المنبثقة والأزرار الديناميكية ---
    if (ui.modalBuyButton) ui.modalBuyButton.addEventListener('click', (e) => store.purchaseItem(e.target.dataset.itemId));
    if (ui.modalCloseButton) ui.modalCloseButton.addEventListener('click', () => ui.showModal(false, null, player.playerData));
    if (ui.genericModalCloseButton) ui.genericModalCloseButton.addEventListener('click', () => ui.toggleGenericModal(false));

    const storeContainer = document.getElementById('store-container');
    if (storeContainer) {
        storeContainer.addEventListener('click', (e) => {
            if (e.target.matches('.details-button')) {
                e.preventDefault();
                const itemId = e.target.dataset.itemId;
                if (itemId) {
                    store.handleDetailsClick(itemId);
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.matches('.challenge-start-button')) {
            handleChallengeStart(e.target.dataset.eventId, surahMetadata);
        }
    });
}

// --- دوال المصادقة واستعادة الحساب ---

function createEmailFromUsername(username) {
    const encodedUsername = btoa(unescape(encodeURIComponent(username)));
    const safeEncodedUsername = encodedUsername.replace(/=/g, '').replace(/[^a-zA-Z0-9]/g, '');
    return `${safeEncodedUsername}@quran-quiz.app`;
}

async function handleLogin() {
    const userName = ui.userNameInput.value.trim();
    const password = document.getElementById('password').value;

    if (!userName || !password) {
        return ui.showToast("يرجى إدخال اسم المستخدم وكلمة المرور.", "error");
    }

    ui.toggleLoader(true);
    const email = createEmailFromUsername(userName);
    const { error } = await api.loginUser(email, password);
    ui.toggleLoader(false);

    if (error) {
        return ui.showToast(`فشل تسجيل الدخول: تأكد من اسم المستخدم وكلمة المرور.`, "error");
    }

    await postLoginSetup();
    ui.showScreen(ui.mainInterface);
}

async function handleSignUp() {
    const userName = ui.userNameInput.value.trim();
    const password = document.getElementById('password').value;

    if (!userName || password.length < 6) {
        return ui.showToast("يجب أن يكون اسم المستخدم مدخلاً وكلمة المرور 6 أحرف على الأقل.", "error");
    }

    ui.toggleLoader(true);
    const email = createEmailFromUsername(userName);
    const { error } = await api.signUpUser(email, password, userName);
    ui.toggleLoader(false);

    if (error) {
        if (error.message.includes("User already registered")) {
            return ui.showToast("هذا المستخدم موجود بالفعل. حاول تسجيل الدخول.", "error");
        }
        return ui.showToast(`فشل إنشاء الحساب: ${error.message}`, "error");
    }

    ui.showToast("تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...", "info");
    await handleLogin();
}

function showRecoveryModal(event) {
    event.preventDefault();
    
    const content = `
        <h3>استعادة حساب مستخدم قديم</h3>
        <p>أدخل اسمك الذي كنت تستخدمه، ثم قم بتعيين كلمة مرور جديدة لحسابك.</p>
        <input type="text" id="recoveryUsername" placeholder="اسم المستخدم القديم" autocomplete="username">
        <input type="password" id="recoveryNewPassword" placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)" autocomplete="new-password">
        <button id="confirmRecoveryButton" class="button-primary">تأكيد وتعيين كلمة المرور</button>
    `;
    
    ui.toggleGenericModal(true, content);
    
    document.getElementById('confirmRecoveryButton').addEventListener('click', handleAccountRecovery);
}

async function handleAccountRecovery() {
    const username = document.getElementById('recoveryUsername').value.trim();
    const newPassword = document.getElementById('recoveryNewPassword').value;

    if (!username || newPassword.length < 6) {
        return ui.showToast("يرجى إدخال اسم المستخدم وكلمة مرور جديدة (6 أحرف على الأقل).", "error");
    }

    ui.toggleLoader(true);

    const safeUsernameForEmail = btoa(unescape(encodeURIComponent(username))).replace(/=/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const email = `${safeUsernameForEmail}@quran-quiz.app`;
    const oldPassword = `QURAN_QUIZ_#_${safeUsernameForEmail}`;

    const { error: loginError } = await api.loginUser(email, oldPassword);

    if (loginError) {
        ui.toggleLoader(false);
        return ui.showToast("اسم المستخدم غير موجود أو تم تحديث كلمة المرور له بالفعل.", "error");
    }

    const { error: updateError } = await api.updateUser({ password: newPassword });

    ui.toggleLoader(false);

    if (updateError) {
        return ui.showToast(`حدث خطأ أثناء تحديث كلمة المرور: ${updateError.message}`, "error");
    }

    ui.toggleGenericModal(false);
    ui.showToast("تم تحديث حسابك بنجاح! يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة.", "info");
    
    ui.userNameInput.value = username;
    document.getElementById('password').value = newPassword;
}


// --- دوال منطق اللعبة ---

async function returnToMainMenu() {
    await postLoginSetup();
    ui.showScreen(ui.mainInterface);
}

async function postLoginSetup() {
    const playerLoaded = await player.loadPlayer();
    if (!playerLoaded) {
        ui.showToast("فشل تحميل بيانات اللاعب. حاول تحديث الصفحة.", "error");
        // قد يكون من الجيد هنا إعادة المستخدم لشاشة الدخول
        // supabase.auth.signOut();
        // ui.showScreen(ui.startScreen);
        return;
    }

    const [storeItems, specialOffers, liveEvents, assignedQuests, masteryData] = await Promise.all([
        api.fetchStoreConfig(),
        api.fetchSpecialOffers(),
        api.fetchLiveEvents(),
        api.fetchOrAssignDailyQuests(),
        api.fetchPlayerMastery()
    ]);
    
    store.processStoreData(storeItems, specialOffers);
    quests.initialize(assignedQuests, masteryData);
    
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerHeader(player.playerData, levelInfo);
    updateAvailablePages();
    ui.populateQariSelect(ui.qariSelect, player.playerData.inventory);
    const maxQuestions = progression.getMaxQuestionsForLevel(levelInfo.level);
    ui.updateQuestionsCountOptions(maxQuestions);
    ui.renderEvents(liveEvents);
}

export function updateAvailablePages() {
    const purchasedPages = (player.playerData.inventory || []).filter(id => id.startsWith('page_')).map(id => parseInt(id.replace('page_', ''), 10));
    const availablePages = [...new Set([...player.FREE_PAGES, ...purchasedPages])].sort((a, b) => a - b);
    ui.populateSelect(ui.pageSelect, availablePages, 'الصفحة');
}

async function onStartPageTestClick() {
    const selectedPage = ui.pageSelect.value;
    if (!selectedPage) return ui.showToast("يرجى اختيار صفحة.", "error");

    if (player.playerData.daily_free_attempts_left > 0) {
        player.playerData.daily_free_attempts_left--;
    } else if (player.playerData.energy_stars > 0) {
        player.playerData.energy_stars--;
    } else {
        return ui.showToast("ليس لديك محاولات كافية. يمكنك شراء نجوم الطاقة من المتجر.", "error");
    }
    
    await player.savePlayer();
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerHeader(player.playerData, levelInfo);

    startTestWithSettings({
        pageNumbers: [parseInt(selectedPage, 10)],
        totalQuestions: parseInt(ui.questionsCountSelect.value, 10),
    });
}

async function onLeaderboardTabClick() {
    ui.leaderboardList.innerHTML = '<p>جاري تحميل البيانات...</p>';
    const leaderboardData = await api.fetchLeaderboard();
    if (leaderboardData && leaderboardData.length > 0) {
        ui.displayLeaderboard(leaderboardData, 'leaderboard-list');
    } else {
        ui.leaderboardList.innerHTML = '<p>لوحة الصدارة فارغة حاليًا.</p>';
    }
}

async function handleChallengeStart(eventId, localSurahMetadata) {
    if (!localSurahMetadata) return console.error("خطأ فادح: بيانات السور الوصفية غير متوفرة.");

    const event = ui.getEventById(eventId);
    if (!event) return console.error(`لم يتم العثور على حدث بالمعرف: ${eventId}`);
    
    const surahInfo = localSurahMetadata[event.target_surah]; 
    if (!surahInfo) {
        return console.error(`لم يتم العثور على بيانات وصفية للسورة. القيمة المستهدفة: ${event.target_surah}`);
    }
    
    const confirmation = confirm(`أنت على وشك بدء تحدي "${event.title}". هل أنت مستعد؟`);
    if (confirmation) {
        const pageNumbers = Array.from({ length: surahInfo.endPage - surahInfo.startPage + 1 }, (_, i) => surahInfo.startPage + i);
        startTestWithSettings({
            pageNumbers: pageNumbers,
            totalQuestions: event.questions_count,
            liveEvent: event
        });
    }
}

async function startTestWithSettings(settings) {
    ui.toggleLoader(true);
    let allAyahs = [];
    for (const pageNum of settings.pageNumbers) {
        const pageAyahs = await api.fetchPageData(pageNum);
        if (pageAyahs) allAyahs.push(...pageAyahs);
    }
    ui.toggleLoader(false);
    if (allAyahs.length > 0) {
        quiz.start({
            pageAyahs: allAyahs,
            selectedQari: ui.qariSelect.value,
            totalQuestions: settings.totalQuestions,
            userName: player.playerData.username,
            pageNumber: settings.pageNumbers[0],
            liveEvent: settings.liveEvent,
            quest: settings.quest
        });
    } else {
        ui.showToast("حدث خطأ أثناء تحميل آيات الصفحة. يرجى المحاولة مرة أخرى.", "error");
    }
}

// =============================================================
// ==      وحدة التحكم بالقبائل (Clans Controller)         ==
// =============================================================

async function onClansTabClick() {
    const clansTabContainer = document.getElementById('clans-tab');
    clansTabContainer.innerHTML = '<p>جاري تحميل بيانات القبائل...</p>';

    await player.loadPlayer();

    if (player.playerData.clan_id) {
        const [clanDetails, lastWeekWinners] = await Promise.all([
            api.fetchClanDetails(player.playerData.clan_id),
            api.fetchLastWeekWinners()
        ]);
        
        ui.renderClansTab(player.playerData, [], clanDetails, lastWeekWinners);
        
        document.getElementById('leaveClanButton')?.addEventListener('click', handleLeaveClan);
        document.getElementById('showClanLeaderboardButton')?.addEventListener('click', async () => {
            ui.toggleLoader(true);
            const leaderboard = await api.fetchClansLeaderboard();
            ui.toggleLoader(false);
            ui.showClansLeaderboardModal(leaderboard);
        });

        document.querySelectorAll('.action-button.kick').forEach(button => {
            button.addEventListener('click', (e) => {
                const memberId = e.currentTarget.dataset.memberId;
                if (confirm("هل أنت متأكد من أنك تريد طرد هذا العضو؟")) {
                    handleKickMember(memberId);
                }
            });
        });

        document.querySelectorAll('.action-button.promote').forEach(button => {
            button.addEventListener('click', (e) => {
                const memberId = e.currentTarget.dataset.memberId;
                if (confirm("هل أنت متأكد من أنك تريد تعيين هذا العضو كقائد جديد؟ ستفقد صلاحياتك كقائد.")) {
                    handlePromoteMember(memberId);
                }
            });
        });

    } else {
        const clansList = await api.fetchClans();
        ui.renderClansTab(player.playerData, clansList, null, null);
        document.getElementById('showCreateClanModalButton')?.addEventListener('click', handleShowCreateClanModal);
        document.querySelectorAll('.joinClanButton').forEach(button => {
            button.addEventListener('click', (e) => handleJoinClan(e.target.dataset.clanId));
        });
    }
}

function handleShowCreateClanModal() {
    const content = `
        <h3>إنشاء قبيلة جديدة</h3>
        <input type="text" id="newClanName" placeholder="اسم القبيلة (3-20 حرف)" maxlength="20" required>
        <textarea id="newClanDescription" placeholder="وصف قصير للقبيلة (اختياري)" maxlength="100"></textarea>
        <button id="confirmCreateClanButton" class="button-primary">تأكيد الإنشاء</button>
    `;
    ui.toggleGenericModal(true, content);
    document.getElementById('confirmCreateClanButton')?.addEventListener('click', handleCreateClan);
}

async function handleCreateClan() {
    const name = document.getElementById('newClanName').value.trim();
    const description = document.getElementById('newClanDescription').value.trim();

    if (name.length < 3) {
        return ui.showToast("يجب أن يكون اسم القبيلة 3 أحرف على الأقل.", "error");
    }

    ui.toggleLoader(true);
    const newClan = await api.createClan(name, description);
    ui.toggleLoader(false);

    if (newClan) {
        ui.showToast(`تم إنشاء قبيلة "${name}" بنجاح!`, "info");
        ui.toggleGenericModal(false);
        onClansTabClick(); // إعادة تحميل التبويب
    }
}

async function handleJoinClan(clanId) {
    if (!confirm("هل أنت متأكد من أنك تريد الانضمام إلى هذه القبيلة؟")) return;

    ui.toggleLoader(true);
    const success = await api.joinClan(clanId);
    ui.toggleLoader(false);

    if (success) {
        ui.showToast("تم الانضمام للقبيلة بنجاح!", "info");
        onClansTabClick();
    } else {
        ui.showToast("فشل الانضمام للقبيلة.", "error");
    }
}

async function handleLeaveClan() {
    if (!confirm("هل أنت متأكد من أنك تريد مغادرة القبيلة؟ لا يمكنك التراجع عن هذا القرار.")) return;

    ui.toggleLoader(true);
    const success = await api.leaveClan();
    ui.toggleLoader(false);

    if (success) {
        ui.showToast("لقد غادرت القبيلة.", "info");
        onClansTabClick();
    } else {
        ui.showToast("فشلت عملية المغادرة.", "error");
    }
}

async function handleKickMember(memberId) {
    ui.toggleLoader(true);
    const success = await api.kickMember(memberId);
    ui.toggleLoader(false);

    if (success) {
        ui.showToast("تم طرد العضو بنجاح.", "info");
        onClansTabClick();
    }
}

async function handlePromoteMember(memberId) {
    ui.toggleLoader(true);
    const success = await api.promoteMember(memberId);
    ui.toggleLoader(false);

    if (success) {
        ui.showToast("تم تعيين قائد جديد بنجاح.", "info");
        onClansTabClick();
    }
}

// بدء تشغيل التطبيق
initialize();
