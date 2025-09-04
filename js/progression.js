// =============================================================
// ==      وحدة التقدم (progression.js) - نسخة مطورة
// =============================================================

import * as api from './api.js';

let config = {
    levels: [],
    questionRewards: [],
    xp_per_correct_answer: 10,
    xp_bonus_all_correct: 50,
};

let isInitialized = false;

export async function initializeProgression() {
    if (isInitialized) return true;

    const progData = await api.fetchProgressionConfig();

    if (progData) {
        config.levels = progData.levels || [];
        config.questionRewards = progData.question_rewards || [];
        config.xp_per_correct_answer = progData.xp_per_correct_answer || 10;
        config.xp_bonus_all_correct = progData.xp_bonus_all_correct || 50;
        config.levels.sort((a, b) => a.level - b.level);
    }
    
    isInitialized = true;
    return true;
}

export function getGameRules() {
    return {
        xp_per_correct_answer: config.xp_per_correct_answer,
        xp_bonus_all_correct: config.xp_bonus_all_correct,
    };
}

// ▼▼▼ تم تعديل هذه الدالة ▼▼▼
export function getLevelInfo(currentXp) {
    if (!isInitialized || !config.levels || config.levels.length === 0) {
        // قيمة افتراضية في حال عدم تحميل الإعدادات
        return { level: 1, title: 'مبتدئ', progress: 0, nextLevelXp: 100, currentLevelXp: 0, path: 'المسار الأساسي' };
    }

    let currentLevelInfo = config.levels[0];
    for (let i = config.levels.length - 1; i >= 0; i--) {
        if (currentXp >= config.levels[i].xp_required) {
            currentLevelInfo = config.levels[i];
            break;
        }
    }

    const nextLevelIndex = config.levels.findIndex(l => l.level === currentLevelInfo.level + 1);
    const nextLevelInfo = nextLevelIndex !== -1 ? config.levels[nextLevelIndex] : null;

    const xpForCurrentLevel = currentLevelInfo.xp_required;
    const xpForNextLevel = nextLevelInfo ? nextLevelInfo.xp_required : currentXp;

    let progressPercentage = 100;
    if (nextLevelInfo && xpForNextLevel > xpForCurrentLevel) {
        progressPercentage = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    }

    // --- إضافة منطق تحديد المسار ---
    const getPlayerPath = (level) => {
        if (level >= 61) return 'مسار الإجازة';
        if (level >= 41) return 'مسار الحُفّاظ';
        if (level >= 21) return 'مسار الإتقان';
        return 'المسار الأساسي';
    };
    // --- نهاية إضافة المنطق ---

    return {
        level: currentLevelInfo.level,
        title: currentLevelInfo.title,
        progress: Math.min(100, progressPercentage),
        nextLevelXp: xpForNextLevel,
        currentLevelXp: xpForCurrentLevel,
        path: getPlayerPath(currentLevelInfo.level) // إرجاع المسار الحالي
    };
}
// ▲▲▲ نهاية التعديل ▲▲▲

export function checkForLevelUp(oldXp, newXp) {
    const oldLevelInfo = getLevelInfo(oldXp);
    const newLevelInfo = getLevelInfo(newXp);

    if (newLevelInfo.level > oldLevelInfo.level) {
        const newLevelData = config.levels.find(l => l.level === newLevelInfo.level);
        return { ...newLevelInfo, reward: newLevelData ? newLevelData.diamonds_reward : 0 };
    }
    return null;
}

export function getMaxQuestionsForLevel(playerLevel) {
    const baseQuestions = 5;
    if (!isInitialized || !config.questionRewards || config.questionRewards.length === 0) {
        return baseQuestions;
    }

    const sortedRewards = [...config.questionRewards].sort((a, b) => a.level - b.level);
    let questionsToAdd = 0;
    for (const reward of sortedRewards) {
        if (playerLevel >= reward.level) {
            questionsToAdd = reward.is_cumulative ? (questionsToAdd + reward.questions_to_add) : reward.questions_to_add;
        }
    }
    return baseQuestions + questionsToAdd;
}
