// =============================================================
// ==      وحدة الاختبار (quiz.js) - النسخة النهائية والمحصنة
// =============================================================

import * as ui from './ui.js';
import * as api from './api.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as achievements from './achievements.js';
import * as quests from './quests.js';
import { allQuestionGenerators } from './questions.js';

let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    errorLog: [],
    userName: '',
    pageNumber: 0,
    xpEarned: 0,
    startTime: 0,
    // سيتم إضافة بقية السياق من دالة start
};

let allQuestionTypes = []; // سنخزن هنا كل أنواع الأسئلة وقواعدها
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

/**
 * دالة التهيئة: تجلب إعدادات الأسئلة من قاعدة البيانات
 */
export async function initializeQuiz() {
    const config = await api.fetchQuestionsConfig();
    if (config && config.length > 0) {
        allQuestionTypes = config;
        console.log(`تم تحميل ${allQuestionTypes.length} نوع سؤال من قاعدة البيانات.`);
    } else {
        console.error("فشل تحميل إعدادات الأسئلة من قاعدة البيانات.");
    }
}

/**
 * دالة البدء: تستقبل كائن context كاملاً
 */
export function start(context) {
    state = {
        ...state,
        ...context, // دمج كل معلومات السياق في الحالة
        score: 0,
        currentQuestionIndex: 0,
        errorLog: [],
        xpEarned: 0,
        startTime: Date.now()
    };
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

/**
 * دالة عرض السؤال التالي (النسخة المحصنة)
 */
function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    // 1. بناء كائن السياق الحالي
    const playerLevelInfo = progression.getLevelInfo(player.playerData.xp);
    const getPlayerPath = (level) => {
        if (level >= 61) return 'مسار الإجازة';
        if (level >= 41) return 'مسار الحُفّاظ';
        if (level >= 21) return 'مسار الإتقان';
        return 'المسار الأساسي';
    };
    
    const currentContext = {
        testMode: state.testMode || 'normal_test',
        playerLevel: playerLevelInfo.level,
        playerPath: getPlayerPath(playerLevelInfo.level),
        scope: state.scope || 'page'
    };

    // 2. فلترة أنواع الأسئلة بناءً على السياق
    const availableQuestionTypes = allQuestionTypes.filter(qType => {
        if (currentContext.playerLevel < qType.required_level) return false;
        if (currentContext.playerPath !== qType.required_path) return false;
        if (currentContext.scope === 'page' && qType.scope !== 'صفحة واحدة') return false;
        if (currentContext.scope === 'surah' && !['صفحة واحدة', 'سورة'].includes(qType.scope)) return false;

        const mode = currentContext.testMode;
        if (mode === 'normal_test' && !qType.is_in_normal_test) return false;
        if (mode === 'live_event' && !qType.is_in_live_event) return false;
        if (mode === 'quest' && !qType.is_in_quest) return false;
        if (mode === 'pvp' && !qType.is_in_pvp) return false;
        if (mode === 'clan_quest' && !qType.is_in_clan_quest) return false;

        return true;
    });

    if (availableQuestionTypes.length === 0) {
        ui.showToast("عفواً، لا توجد أسئلة متاحة لهذه المعايير.", "error");
        endQuiz(); 
        return;
    }

    // 3. محاولة توليد سؤال بطريقة آمنة
    let questionGenerated = false;
    let attempts = 0;
    const shuffledTypes = shuffleArray(availableQuestionTypes);

    while (!questionGenerated && attempts < 10) {
        attempts++;
        const selectedType = shuffledTypes[attempts % shuffledTypes.length];
        const generatorFunction = allQuestionGenerators[selectedType.id];

        if (generatorFunction) {
            const question = generatorFunction(state.pageAyahs, state.selectedQari, handleResult);
            if (question) {
                ui.questionArea.innerHTML = question.questionHTML;
                question.setupListeners(ui.questionArea);
                questionGenerated = true;
            }
        } else {
            console.error(`لم يتم العثور على دالة توليد للسؤال بالمعرف: ${selectedType.id}`);
        }
    }

    if (!questionGenerated) {
        console.error("فشل توليد أي سؤال صالح بعد عدة محاولات.");
        ui.showToast("حدث خطأ أثناء إعداد السؤال التالي.", "error");
        endQuiz();
    }
}

function handleResult(isCorrect, correctAnswerText, clickedElement) {
    ui.disableQuestionInteraction();
    const rules = progression.getGameRules();
    if (isCorrect) {
        state.score++;
        state.xpEarned += rules.xp_per_correct_answer || 10;
        ui.markAnswer(clickedElement, true);
    } else {
        state.errorLog.push({
            questionHTML: ui.questionArea.innerHTML,
            correctAnswer: correctAnswerText
        });
        ui.markAnswer(clickedElement, false);
    }
    ui.showFeedback(isCorrect, correctAnswerText);
    setTimeout(displayNextQuestion, 3000);
}

/**
 * دالة إنهاء الاختبار (النسخة المحصنة)
 */
async function endQuiz() {
    const durationInSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const rules = progression.getGameRules();
    const isPerfect = state.score === state.totalQuestions;

    player.playerData.total_quizzes_completed = (player.playerData.total_quizzes_completed || 0) + 1;
    player.playerData.total_play_time_seconds = (player.playerData.total_play_time_seconds || 0) + durationInSeconds;
    player.playerData.total_correct_answers = (player.playerData.total_correct_answers || 0) + state.score;
    player.playerData.total_questions_answered = (player.playerData.total_questions_answered || 0) + state.totalQuestions;

    if (isPerfect) {
        state.xpEarned += rules.xp_bonus_all_correct || 50;
        if (state.liveEvent) {
            player.playerData.diamonds += state.liveEvent.reward_diamonds || 0;
        }
        if (state.pageNumber) { // التأكد من وجود رقم صفحة قبل استدعاء الدالة
            api.updateMasteryRecord(state.pageNumber, durationInSeconds);
        }
        quests.updateQuestsProgress('mastery_check');
    }

    const oldXp = player.playerData.xp;
    player.playerData.xp += state.xpEarned;
    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    if (levelUpInfo) {
        player.playerData.diamonds += levelUpInfo.reward;
    }

    quests.updateQuestsProgress('quiz_completed');
    achievements.checkAchievements('quiz_completed', {
        isPerfect: isPerfect,
        pageNumber: state.pageNumber
    });

    // بناء كائن النتيجة بشكل صريح لضمان وجود كل الحقول
    const resultToSave = {
        pageNumber: state.pageNumber,
        score: state.score,
        totalQuestions: state.totalQuestions,
        xpEarned: state.xpEarned,
        errorLog: state.errorLog
    };

    await player.savePlayer();
    // التأكد من وجود رقم صفحة قبل الحفظ لتجنب الأخطاء
    if (resultToSave.pageNumber) {
        await api.saveResult(resultToSave);
    } else {
        console.warn("تم تخطي حفظ نتيجة الاختبار لعدم وجود رقم صفحة (قد يكون اختبارًا خاصًا).");
    }
    
    ui.updateSaveMessage(true);

    if (state.errorLog.length > 0) {
        ui.displayErrorReview(state.errorLog);
    } else {
        ui.displayFinalResult(state, levelUpInfo);
    }
}

export function getCurrentState() {
    return state;
}
