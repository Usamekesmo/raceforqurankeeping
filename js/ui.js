// ====================================================================
// ==      وحدة واجهة المستخدم (ui.js) - النسخة النهائية والكاملة      ==
// ====================================================================

// --- تعريف عناصر واجهة المستخدم (DOM Elements) ---
export const startScreen = document.getElementById('start-screen');
export const mainInterface = document.getElementById('main-interface');
export const quizScreen = document.getElementById('quiz-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const resultScreen = document.getElementById('result-screen');
export const loader = document.getElementById('loader');
export const userNameInput = document.getElementById('userName');
export const startButton = document.getElementById('startButton');
export const playerInfoHeader = document.getElementById('player-info-header');
export const pageSelect = document.getElementById('pageSelect');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');
export const startTestButton = document.getElementById('startTestButton');
export const eventsContainer = document.getElementById('live-events-container');
export const leaderboardList = document.getElementById('leaderboard-list');
export const progressCounter = document.getElementById('progress-counter');
export const progressBar = document.getElementById('progress-bar');
export const questionArea = document.getElementById('question-area');
export const feedbackArea = document.getElementById('feedback-area');
export const errorListDiv = document.getElementById('error-list');
export const showFinalResultButton = document.getElementById('show-final-result-button');
export const resultNameSpan = document.getElementById('resultName');
export const finalScoreSpan = document.getElementById('finalScore');
export const xpGainedSpan = document.getElementById('xpGained');
export const levelUpMessage = document.getElementById('level-up-message');
export const saveStatus = document.getElementById('save-status');
export const reloadButton = document.getElementById('reloadButton');
export const achievementToast = document.getElementById('achievement-toast');
export const achievementToastName = document.getElementById('achievement-toast-name');
export const achievementToastReward = document.getElementById('achievement-toast-reward');
export const toastNotification = document.getElementById('toast-notification');
export const modalOverlay = document.getElementById('item-details-modal');
export const modalBody = document.getElementById('modal-body');
export const modalCloseButton = document.getElementById('modal-close-btn');
export const modalBuyButton = document.getElementById('modal-buy-button');

// عناصر النافذة المنبثقة العامة الجديدة
export const genericModalOverlay = document.getElementById('generic-modal-overlay');
export const genericModalBody = document.getElementById('generic-modal-body');
export const genericModalCloseButton = document.getElementById('generic-modal-close-btn');


let liveEventsCache = [];

// --- دوال التحكم في الواجهة ---

export function showScreen(screenToShow) {
    [startScreen, mainInterface, quizScreen, errorReviewScreen, resultScreen].forEach(s => {
        if (s) s.classList.add('hidden');
    });
    if (screenToShow) screenToShow.classList.remove('hidden');
}

export function showTab(tabIdToShow) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    const activeTabContent = document.getElementById(tabIdToShow);
    const activeTabButton = document.querySelector(`.tab-button[data-tab="${tabIdToShow}"]`);
    if (activeTabContent) activeTabContent.classList.remove('hidden');
    if (activeTabButton) activeTabButton.classList.add('active');
}

export function toggleLoader(show) {
    if (loader) loader.classList.toggle('hidden', !show);
}

export function updatePlayerHeader(playerData, levelInfo) {
    if (!playerInfoHeader) return;
    playerInfoHeader.innerHTML = `
        <p>مرحباً بك يا <strong>${playerData.username}</strong>!</p>
        <p>
            المستوى: ${levelInfo.level} (${levelInfo.title}) | الخبرة: ${playerData.xp} | 
            الألماس: ${playerData.diamonds} 💎
        </p>
        <p>
            المحاولات المجانية: <strong>${playerData.daily_free_attempts_left}</strong> | 
            نجوم الطاقة: <strong>${playerData.energy_stars} ⭐</strong>
        </p>
    `;
}

export function populateSelect(selectElement, optionsArray, prefix = '') {
    if (!selectElement) return;
    selectElement.innerHTML = '';
    if (optionsArray.length === 0) {
        selectElement.innerHTML = `<option value="">لا توجد ${prefix} متاحة</option>`;
        return;
    }
    optionsArray.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = `${prefix} ${optionValue}`;
        selectElement.appendChild(option);
    });
}

export function populateQariSelect(selectElement, inventory) {
    if (!selectElement) return;
    const defaultQaris = [
        { value: 'ar.alafasy', text: 'مشاري العفاسي' },
        { value: 'ar.abdulbasitmurattal', text: 'عبد الباسط (مرتل)' },
    ];
    const purchasableQaris = [
        { id: 'qari_minshawi', value: 'ar.minshawi', text: 'محمد صديق المنشاوي' },
        { id: 'qari_husary', value: 'ar.husary', text: 'محمود خليل الحصري' },
        { id: 'qari_sudais', value: 'ar.sudais', text: 'عبد الرحمن السديس' },
    ];
    selectElement.innerHTML = '';
    defaultQaris.forEach(q => {
        const option = document.createElement('option');
        option.value = q.value;
        option.textContent = q.text;
        selectElement.appendChild(option);
    });
    purchasableQaris.forEach(q => {
        if (inventory.includes(q.id)) {
            const option = document.createElement('option');
            option.value = q.value;
            option.textContent = `${q.text} (تم شراؤه)`;
            selectElement.appendChild(option);
        }
    });
}

export function updateQuestionsCountOptions(maxQuestions) {
    if (!questionsCountSelect) return;
    questionsCountSelect.innerHTML = '';
    for (let i = 5; i <= maxQuestions; i += 5) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} ${i <= 10 ? 'أسئلة' : 'سؤالاً'}`;
        if (i === 10) option.selected = true;
        questionsCountSelect.appendChild(option);
    }
}

export function updateProgress(current, total) {
    if (progressCounter) progressCounter.textContent = `السؤال ${current} من ${total}`;
    if (progressBar) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }
}

export function disableQuestionInteraction() {
    if (questionArea) {
        questionArea.querySelectorAll('button, .choice-box, .number-box, .option-div').forEach(el => {
            el.style.pointerEvents = 'none';
        });
    }
}

export function markAnswer(element, isCorrect) {
    if (element) {
        element.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
    }
}

export function showFeedback(isCorrect, correctAnswerText) {
    if (!feedbackArea) return;
    feedbackArea.classList.remove('hidden', 'correct-answer', 'wrong-answer');
    if (isCorrect) {
        feedbackArea.textContent = 'إجابة صحيحة! أحسنت.';
        feedbackArea.classList.add('correct-answer');
    } else {
        feedbackArea.innerHTML = `إجابة خاطئة. الإجابة الصحيحة هي: <strong>${correctAnswerText}</strong>`;
        feedbackArea.classList.add('wrong-answer');
    }
}

export function renderEvents(events) {
    liveEventsCache = events || [];
    if (!eventsContainer) return;
    eventsContainer.innerHTML = '';
    if (liveEventsCache.length === 0) {
        eventsContainer.innerHTML = '<p>لا توجد تحديات أو أحداث خاصة متاحة حاليًا.</p>';
        return;
    }
    liveEventsCache.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-card';
        eventDiv.innerHTML = `
            <h4>${event.title}</h4>
            <p>${event.description}</p>
            <p><strong>المكافأة:</strong> ${event.reward_diamonds} 💎 (عند الإتقان)</p>
            <button class="challenge-start-button" data-event-id="${event.id}">ابدأ التحدي</button>
        `;
        eventsContainer.appendChild(eventDiv);
    });
}

export function getEventById(id) {
    return liveEventsCache.find(event => String(event.id) === String(id));
}

export function displayLeaderboard(leaderboardData, listId) {
    const listElement = document.getElementById(listId);
    if (!listElement) return;
    listElement.innerHTML = '';
    if (!leaderboardData || leaderboardData.length === 0) {
        listElement.innerHTML = '<p>لا توجد بيانات لعرضها حاليًا.</p>';
        return;
    }
    leaderboardData.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${player.username}</span>
            <span class="leaderboard-xp">${player.xp} XP</span>
        `;
        listElement.appendChild(item);
    });
}

export function displayFinalResult(quizState, levelUpInfo) {
    if (resultNameSpan) resultNameSpan.textContent = quizState.userName;
    if (finalScoreSpan) finalScoreSpan.textContent = `${quizState.score} / ${quizState.totalQuestions}`;
    if (xpGainedSpan) xpGainedSpan.textContent = quizState.xpEarned;
    
    if (levelUpMessage) {
        if (levelUpInfo) {
            levelUpMessage.innerHTML = `🎉 تهانينا! لقد ارتقيت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وكسبت ${levelUpInfo.reward} ألماسة!`;
            levelUpMessage.classList.remove('hidden');
        } else {
            levelUpMessage.classList.add('hidden');
        }
    }
    
    updateSaveMessage(true);
    showScreen(resultScreen);
}

export function displayErrorReview(errorLog) {
    if (!errorListDiv) return;
    errorListDiv.innerHTML = errorLog.map(error => `
        <div class="error-review-item">
            <h4>السؤال الذي أخطأت فيه:</h4>
            <div class="question-content-review">${error.questionHTML}</div>
            <hr>
            <p><strong>الإجابة الصحيحة كانت:</strong> <span class="correct-text">${error.correctAnswer}</span></p>
        </div>
    `).join('');
    
    errorListDiv.querySelectorAll('audio, button, .choice-box, .option-div').forEach(el => {
        el.setAttribute('disabled', 'true');
        el.style.pointerEvents = 'none';
    });
    showScreen(errorReviewScreen);
}

export function updateSaveMessage(isSaved) {
    if (!saveStatus) return;
    if (isSaved) {
        saveStatus.textContent = 'تم حفظ تقدمك بنجاح!';
        saveStatus.style.color = '#004d40';
    } else {
        saveStatus.textContent = 'جاري حفظ تقدمك...';
        saveStatus.style.color = '#555';
    }
}

export function showAchievementToast(achievement) {
    if (!achievementToast) return;
    if (achievementToastName) achievementToastName.textContent = achievement.name;
    if (achievementToastReward) achievementToastReward.textContent = `+${achievement.xp_reward} XP, +${achievement.diamonds_reward} 💎`;
    
    achievementToast.classList.add('show');
    setTimeout(() => {
        achievementToast.classList.remove('show');
    }, 4000);
}

export function showToast(message, type = 'info') {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.className = `toast-notification show ${type}`;
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

export function showModal(show, item = null, currentPlayerData = null) {
    if (!modalOverlay) return;

    if (show && item && currentPlayerData) {
        modalBody.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="item-price">السعر: ${item.price} ${item.type === 'exchange' ? 'XP' : '💎'}</p>
        `;
        
        if (modalBuyButton) {
            modalBuyButton.dataset.itemId = item.id;
            
            const canAfford = (item.type === 'exchange')
                ? currentPlayerData.xp >= item.price
                : currentPlayerData.diamonds >= item.price;
            
            modalBuyButton.disabled = !canAfford;
            modalBuyButton.textContent = canAfford ? 'تأكيد الشراء' : 'رصيدك غير كافٍ';
        }
        modalOverlay.classList.remove('hidden');
    } else {
        modalOverlay.classList.add('hidden');
    }
}

export function renderPlayerStats(stats) {
    const container = document.getElementById('profile-stats-container');
    if (!container) return;
    const playTimeMinutes = Math.floor((stats.total_play_time_seconds || 0) / 60);
    
    // ▼▼▼ هذا هو الجزء الذي تم تصحيحه ▼▼▼
    const correctAnswers = stats.total_correct_answers || 0;
    const totalQuestions = stats.total_questions_answered || 1; // استخدام 1 لتجنب القسمة على صفر
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    // ▲▲▲ نهاية التصحيح ▲▲▲

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-title">الاختبارات المكتملة</div>
            <div class="stat-value">${stats.total_quizzes_completed || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">إجمالي وقت اللعب (دقائق)</div>
            <div class="stat-value">${playTimeMinutes}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">مجموع الإجابات الصحيحة</div>
            <div class="stat-value">${correctAnswers}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">نسبة الدقة</div>
            <div class="stat-value">${accuracy}%</div>
        </div>
    `;
}


// =============================================================
// ==      وحدة واجهة القبائل (Clans UI)         ==
// =============================================================

export function toggleGenericModal(show, content = '') {
    if (!genericModalOverlay) return;
    if (show) {
        if (genericModalBody) genericModalBody.innerHTML = content;
        genericModalOverlay.classList.remove('hidden');
    } else {
        genericModalOverlay.classList.add('hidden');
    }
}

export function renderClansTab(playerData, clansList, clanDetails, lastWeekWinners) {
    const container = document.getElementById('clans-tab');
    if (!container) return;

    if (playerData.clan_id && clanDetails) {
        // عرض واجهة اللاعب المنضم لقبيلة
        renderClanDetails(container, clanDetails, playerData, lastWeekWinners);
    } else {
        // عرض واجهة اللاعب غير المنضم لقبيلة
        renderNoClanView(container, clansList);
    }
}

function renderClanDetails(container, clanDetails, playerData, lastWeekWinners) {
    const getCountdown = () => {
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
        endOfWeek.setUTCHours(23, 59, 59, 999);

        const diff = endOfWeek - now;
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${d} يوم, ${h} ساعة, ${m} دقيقة`;
    };

    let winnersHtml = '';
    if (lastWeekWinners && lastWeekWinners.length > 0) {
        winnersHtml = `
            <div class="last-week-winners">
                <h4>🏆 الفائزون في الأسبوع الماضي 🏆</h4>
                ${lastWeekWinners.map(winner => `
                    <p>المركز ${winner.rank}: <strong>${winner.clan_name}</strong></p>
                `).join('')}
            </div>
        `;
    }

    const sortedMembers = clanDetails.players.sort((a, b) => b.xp - a.xp);
    const isLeader = playerData.id === clanDetails.leader_id;

    container.innerHTML = `
        <div class="clan-competition-header">
            <h3>المنافسة الأسبوعية</h3>
            <p>الوقت المتبقي: <strong>${getCountdown()}</strong></p>
        </div>
        ${winnersHtml}
        <hr>
        <div class="clan-header">
            <h2>${clanDetails.name} <span class="clan-emblem">${clanDetails.emblem || '🛡️'}</span></h2>
            <p>${clanDetails.description}</p>
            <p><strong>النقاط الأسبوعية:</strong> ${clanDetails.weekly_xp} XP</p>
        </div>
        <button id="showClanLeaderboardButton" class="button-secondary">عرض ترتيب القبائل</button>
        <hr>
        <h3>أعضاء القبيلة (${clanDetails.players.length})</h3>
        <div id="clan-members-list">
            ${sortedMembers.map(member => `
                <div class="clan-member-item ${member.id === clanDetails.leader_id ? 'leader' : ''} ${member.id === playerData.id ? 'current-user' : ''}">
                    <div class="member-info">
                        <span>${member.username} ${member.id === clanDetails.leader_id ? '👑' : ''}</span>
                        <small>${member.xp} XP</small>
                    </div>
                    ${isLeader && member.id !== playerData.id ? `
                        <div class="member-actions">
                            <button class="action-button promote" data-member-id="${member.id}" title="تعيين كقائد">👑</button>
                            <button class="action-button kick" data-member-id="${member.id}" title="طرد العضو">❌</button>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        <button id="leaveClanButton" class="button-danger">مغادرة القبيلة</button>
    `;
}

function renderNoClanView(container, clansList) {
    container.innerHTML = `
        <h3>انضم إلى قبيلة أو أنشئ قبيلتك الخاصة!</h3>
        <p>تعاون مع الآخرين، تنافسوا معًا، واكسبوا مكافآت حصرية.</p>
        <button id="showCreateClanModalButton" class="button-primary">أنشئ قبيلة جديدة</button>
        <hr>
        <h4>القبائل المتاحة</h4>
        <div id="clans-list-container">
            ${clansList && clansList.length > 0 ? clansList.map(clan => `
                <div class="clan-list-item">
                    <div class="clan-info">
                        <strong>${clan.name} ${clan.emblem || ''}</strong>
                        <small>الأعضاء: ${clan.member_count} | النقاط: ${clan.weekly_xp} XP</small>
                    </div>
                    <button class="joinClanButton" data-clan-id="${clan.id}">انضم</button>
                </div>
            `).join('') : '<p>لا توجد قبائل متاحة حاليًا. كن أول من ينشئ واحدة!</p>'}
        </div>
    `;
}

export function showClansLeaderboardModal(leaderboardData) {
    let content = `
        <h3>لوحة صدارة القبائل الأسبوعية</h3>
        <div class="leaderboard-list">
    `;
    
    leaderboardData.forEach((clan, index) => {
        content += `
            <div class="leaderboard-item">
                <span class="leaderboard-rank">${index + 1}</span>
                <span class="leaderboard-name">${clan.name}</span>
                <span class="leaderboard-xp">${clan.weekly_xp} XP</span>
            </div>
        `;
    });

    content += `</div>`;
    toggleGenericModal(true, content);
}
