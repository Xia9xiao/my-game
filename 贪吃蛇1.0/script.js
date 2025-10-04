// 获取DOM元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const currentLevelElement = document.getElementById('current-level');
const targetScoreElement = document.getElementById('target-score');
const playCountElement = document.getElementById('play-count');
const milestonePopup = document.getElementById('milestone-popup');
const milestoneText = document.getElementById('milestone-text');
const popupClose = document.getElementById('popup-close');
const gameOverElement = document.getElementById('game-over');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resumeButton = document.getElementById('resume-btn');
const restartButton = document.getElementById('restart-btn');
const confirmStartButton = document.getElementById('confirm-start-btn');
const startScreen = document.getElementById('start-screen');
const mainGame = document.getElementById('main-game');

// 移除摇杆控制器元素引用
// const joystickBase = document.getElementById('joystick-base');
// const joystickKnob = document.getElementById('joystick-knob');

// 方向控制按键元素
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const startMobileBtn = document.getElementById('start-mobile-btn');
const pauseMobileBtn = document.getElementById('pause-mobile-btn');
const restartMobileBtn = document.getElementById('restart-mobile-btn');

// 游戏常量
const GRID_SIZE = 40; // 网格大小 40x40
const BLOCK_SIZE = canvas.width / GRID_SIZE; // 每个方块的大小
const BASE_FPS = 4; // 基础游戏帧率 (降低速度)
let currentFPS = BASE_FPS; // 当前帧率，会随分数增加而提高

// 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioEnabled = true;

// 创建音效的函数
function createBeepSound(frequency, duration, volume = 0.3) {
    if (!audioEnabled) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.log('音效播放失败:', error);
    }
}

// 不同类型食物的音效
function playFoodSound() {
    createBeepSound(800, 0.1, 0.3); // 普通食物：高音短促
}

function playBigFoodSound() {
    createBeepSound(600, 0.2, 0.4); // 大食物：中音较长
    setTimeout(() => createBeepSound(800, 0.1, 0.3), 100); // 双音效
}

function playSlowFoodSound() {
    createBeepSound(400, 0.3, 0.3); // 减速食物：低音长音
}

// 通关音效
function playVictoryFanfare() {
    if (!audioEnabled) return;
    
    try {
        // 创建胜利号角音效 - 经典的"Ta-da!"音效
        const notes = [
            { freq: 523, start: 0, duration: 0.2 },      // C5
            { freq: 659, start: 0.2, duration: 0.2 },    // E5
            { freq: 784, start: 0.4, duration: 0.2 },    // G5
            { freq: 1047, start: 0.6, duration: 0.4 }    // C6 (长音)
        ];
        
        notes.forEach(note => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + note.duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + note.duration);
            }, note.start * 1000);
        });
    } catch (error) {
        console.log('胜利音效播放失败:', error);
    }
}

function playSuccessChime() {
    if (!audioEnabled) return;
    
    try {
        // 创建成功提示音 - 清脆的钟声效果
        const frequencies = [880, 1108, 1319]; // A5, C#6, E6 - 大三和弦
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1.5);
            }, index * 100);
        });
    } catch (error) {
        console.log('成功音效播放失败:', error);
    }
}

function playLevelCompleteSound() {
    // 播放胜利号角
    playVictoryFanfare();
    // 延迟播放成功提示音
    setTimeout(() => {
        playSuccessChime();
    }, 1000);
}

// 游戏结束音效
function playGameOverSound() {
    if (!audioEnabled) return;
    
    try {
        // 创建游戏结束音效 - 下降的音调表示失败
        const notes = [
            { freq: 523, start: 0, duration: 0.3 },      // C5
            { freq: 466, start: 0.3, duration: 0.3 },    // Bb4
            { freq: 415, start: 0.6, duration: 0.3 },    // Ab4
            { freq: 349, start: 0.9, duration: 0.6 }     // F4 (长音)
        ];
        
        notes.forEach(note => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.type = 'sawtooth'; // 使用锯齿波，音色更加严肃
                oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + note.duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + note.duration);
            }, note.start * 1000);
        });
        
        // 添加低频震动效果
        setTimeout(() => {
            const bassOscillator = audioContext.createOscillator();
            const bassGain = audioContext.createGain();
            
            bassOscillator.connect(bassGain);
            bassGain.connect(audioContext.destination);
            
            bassOscillator.type = 'sine';
            bassOscillator.frequency.setValueAtTime(80, audioContext.currentTime); // 低频
            
            bassGain.gain.setValueAtTime(0, audioContext.currentTime);
            bassGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
            bassGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
            
            bassOscillator.start(audioContext.currentTime);
            bassOscillator.stop(audioContext.currentTime + 0.8);
        }, 1200);
        
    } catch (error) {
        console.log('游戏结束音效播放失败:', error);
    }
}

// 方向
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };
const LEFT = { x: -1, y: 0 };
const RIGHT = { x: 1, y: 0 };

// 颜色
const COLORS = {
    background: '#F5F5DC', // 米白色背景
    snake: '#4CAF50',
    snakeBorder: '#2E7D32',
    food: '#FF5252',
    bigFood: '#FF9800', // 橙色大食物
    slowFood: '#2196F3', // 蓝色减速食物
    grid: '#E0E0E0', // 浅灰色网格线，在米白色背景上更清晰
    obstacle: '#9E9E9E',
    // AI蛇颜色
    aiSnake1: '#FF6B6B', // 红色AI蛇
    aiSnake1Border: '#E53E3E',
    aiSnake2: '#4ECDC4', // 青色AI蛇
    aiSnake2Border: '#319795'
};

// 游戏状态
let snake = [];
let food = [];  // 改为数组，支持多个普通食物
let bigFood = null; // 大食物（橙色，20分）
let slowFood = null; // 减速食物（蓝色）
let obstacles = [];
let fixedObstacles = []; // 固定的障碍物布局
let direction = RIGHT;
let nextDirection = RIGHT;
let score = 0;
let highScore = 0;
let playCount = 0;
let lastMilestone = 0; // 记录上次达到的里程碑分数
let gameRunning = false;
let gamePaused = false;
let gameLoop;
let obstacleTimer = 0; // 障碍物移动计时器

// AI蛇系统
let aiSnakes = []; // AI蛇数组
let aiSnakeTimer = 0; // AI蛇移动计时器

// 关卡系统变量
let currentLevel = 1; // 当前关卡
const MAX_LEVEL = 5; // 最大关卡数
const LEVEL_SCORE_INCREMENT = 100; // 每关分数递增

// 获取当前关卡的目标分数
function getLevelTargetScore(level) {
    return level * LEVEL_SCORE_INCREMENT;
}

// 更新关卡显示
function updateLevelDisplay() {
    currentLevelElement.textContent = currentLevel;
    targetScoreElement.textContent = getLevelTargetScore(currentLevel);
}
function getLevelObstacleCount(level) {
    return Math.min(5 + (level - 1) * 3, 20); // 第1关5个，每关增加3个，最多20个
}
function loadGameData() {
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    playCount = parseInt(localStorage.getItem('snakePlayCount')) || 0;
    updateStatsDisplay();
}

// 保存数据到本地存储
function saveGameData() {
    localStorage.setItem('snakeHighScore', highScore);
    localStorage.setItem('snakePlayCount', playCount);
}

// 更新统计信息显示
function updateStatsDisplay() {
    highScoreElement.textContent = highScore;
    playCountElement.textContent = playCount;
}

// 检查里程碑
function checkMilestone() {
    const currentMilestone = Math.floor(score / 100) * 100;
    if (currentMilestone > lastMilestone && currentMilestone > 0) {
        lastMilestone = currentMilestone;
        showMilestonePopup(currentMilestone);
    }
}

// 显示里程碑弹窗
function showMilestonePopup(milestone) {
    milestoneText.textContent = `🎉恭喜达到 ${milestone} 分！`;
    milestonePopup.classList.add('show');
    
    // 不暂停游戏，让游戏继续运行
    // 3秒后自动关闭弹窗
    setTimeout(() => {
        closeMilestonePopup();
    }, 3000);
}

// 关闭里程碑弹窗
function closeMilestonePopup() {
    milestonePopup.classList.remove('show');
    // 不需要恢复游戏，因为游戏一直在运行
}

// 初始化游戏
function showLevelUpPopup(message, callback) {
    // 使用现有的里程碑弹窗来显示关卡提升信息
    milestoneText.textContent = message;
    milestonePopup.style.display = 'flex';
    
    // 2秒后自动关闭弹窗并执行回调
    setTimeout(() => {
        milestonePopup.style.display = 'none';
        if (callback) {
            callback();
        }
    }, 2000);
}

function resetGameForNextLevel() {
    // 重置分数
    score = 0;
    lastMilestone = 0;
    scoreElement.textContent = score;
    
    // 重置蛇到初始位置和长度
    snake = [
        { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) }
    ];
    
    // 重置方向
    direction = RIGHT;
    nextDirection = RIGHT;
    
    // 重置速度
    currentFPS = BASE_FPS;
    
    // 重置障碍物移动计时器
    obstacleTimer = 0;
    
    // 重置AI蛇计时器
    aiSnakeTimer = 0;
    
    // 重新生成障碍物布局
    generateFixedObstacles();
    obstacles = [...fixedObstacles];
    
    // 清空所有食物
    food = [];
    
    // 生成多个普通食物
    for (let i = 0; i < 3; i++) {
        generateFood();
    }
    
    // 重置特殊食物
    bigFood = null;
    slowFood = null;
    
    // 生成AI蛇（从第三关开始）
    generateAISnakes();
    
    // 更新关卡显示
    updateLevelDisplay();
    
    // 重新绘制游戏界面
    draw();
}

function initGame() {
    // 初始化蛇
    snake = [
        { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) }
    ];
    
    // 初始方向
    direction = RIGHT;
    nextDirection = RIGHT;
    
    // 初始分数
    score = 0;
    lastMilestone = 0; // 重置里程碑记录
    scoreElement.textContent = score;
    
    // 更新关卡显示
    updateLevelDisplay();
    
    // 重置速度到初始值
    currentFPS = BASE_FPS;
    
    // 重置障碍物移动计时器
    obstacleTimer = 0;
    
    // 如果是第一次初始化，生成固定的障碍物布局
    if (fixedObstacles.length === 0) {
        generateFixedObstacles();
    }
    
    // 使用固定布局设置障碍物
    obstacles = [...fixedObstacles];
    
    // 清空所有食物
    food = [];
    
    // 生成多个普通食物
    for (let i = 0; i < 3; i++) {
        generateFood();
    }
    
    // 重置特殊食物
    bigFood = null;
    slowFood = null;
    
    // 隐藏游戏结束界面
    gameOverElement.style.display = 'none';
}

// 生成固定的障碍物布局
function generateFixedObstacles() {
    fixedObstacles = [];
    const obstacleCount = getLevelObstacleCount(currentLevel);
    
    // 预定义的安全障碍物位置（确保不会阻碍蛇的移动）
    const safeObstaclePositions = [
        { x: 10, y: 10 }, { x: 35, y: 10 }, { x: 10, y: 35 }, { x: 35, y: 35 },
        { x: 22, y: 15 }, { x: 22, y: 30 }, { x: 15, y: 22 }, { x: 30, y: 22 },
        { x: 8, y: 20 }, { x: 37, y: 25 }, { x: 12, y: 8 }, { x: 32, y: 12 },
        { x: 18, y: 35 }, { x: 28, y: 8 }, { x: 6, y: 30 }, { x: 38, y: 18 },
        { x: 14, y: 25 }, { x: 26, y: 32 }, { x: 20, y: 5 }, { x: 25, y: 38 }
    ];
    
    // 根据关卡选择障碍物数量
    for (let i = 0; i < Math.min(obstacleCount, safeObstaclePositions.length); i++) {
        const pos = safeObstaclePositions[i];
        fixedObstacles.push({ x: pos.x, y: pos.y, originalX: pos.x, originalY: pos.y });
    }
}

// 移动障碍物
function moveObstacles() {
    obstacles.forEach(obstacle => {
        // 每个障碍物有30%的概率移动
        if (Math.random() < 0.3) {
            const directions = [
                { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }
            ];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            
            const newX = obstacle.x + randomDir.x;
            const newY = obstacle.y + randomDir.y;
            
            // 检查新位置是否与蛇身体重叠
            const isOnSnake = snake.some(segment => segment.x === newX && segment.y === newY);
            
            // 检查新位置是否与普通食物重叠
            const isOnFood = food.some(f => f.x === newX && f.y === newY);
            
            // 检查新位置是否与大食物重叠（大食物占2x2格子）
            const isOnBigFood = bigFood && 
                newX >= bigFood.x && newX <= bigFood.x + 1 &&
                newY >= bigFood.y && newY <= bigFood.y + 1;
            
            // 检查新位置是否与减速食物重叠
            const isOnSlowFood = slowFood && slowFood.x === newX && slowFood.y === newY;
            
            // 检查新位置是否与其他障碍物重叠
            const isOnOtherObstacle = obstacles.some(other => other !== obstacle && other.x === newX && other.y === newY);
            
            // 确保障碍物不会移动到边界外，不会与任何游戏元素重叠
            // 并且不会离原始位置太远（最多2格）
            if (newX >= 0 && newX < GRID_SIZE && 
                newY >= 0 && newY < GRID_SIZE &&
                Math.abs(newX - obstacle.originalX) <= 2 &&
                Math.abs(newY - obstacle.originalY) <= 2 &&
                !isOnSnake &&
                !isOnFood &&
                !isOnBigFood &&
                !isOnSlowFood &&
                !isOnOtherObstacle) {
                
                obstacle.x = newX;
                obstacle.y = newY;
            }
        }
    });
}

// 生成食物
function generateFood() {
    // 随机生成食物位置，确保不在蛇身上和障碍物上
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (
        snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y) ||
        (bigFood && 
         newFood.x >= bigFood.x && newFood.x <= bigFood.x + 1 &&
         newFood.y >= bigFood.y && newFood.y <= bigFood.y + 1) ||
        (slowFood && slowFood.x === newFood.x && slowFood.y === newFood.y) ||
        // 检查是否与现有食物重叠
        food.some(existingFood => existingFood.x === newFood.x && existingFood.y === newFood.y)
    );
    
    food.push(newFood);  // 添加到食物数组中
}

// 生成大食物
function generateBigFood() {
    if (bigFood) return; // 如果已经有大食物，不生成新的
    
    let newBigFood;
    do {
        newBigFood = {
            x: Math.floor(Math.random() * (GRID_SIZE - 1)), // 确保2x2不超出边界
            y: Math.floor(Math.random() * (GRID_SIZE - 1))
        };
    } while (
        // 检查2x2区域是否与蛇身冲突
        snake.some(segment => 
            (segment.x >= newBigFood.x && segment.x <= newBigFood.x + 1) &&
            (segment.y >= newBigFood.y && segment.y <= newBigFood.y + 1)
        ) ||
        // 检查2x2区域是否与障碍物冲突
        obstacles.some(obstacle => 
            (obstacle.x >= newBigFood.x && obstacle.x <= newBigFood.x + 1) &&
            (obstacle.y >= newBigFood.y && obstacle.y <= newBigFood.y + 1)
        ) ||
        // 检查2x2区域是否与普通食物冲突
        food.some(foodItem => 
            (foodItem.x >= newBigFood.x && foodItem.x <= newBigFood.x + 1) &&
            (foodItem.y >= newBigFood.y && foodItem.y <= newBigFood.y + 1)
        ) ||
        // 检查2x2区域是否与减速食物冲突
        (slowFood && 
         (slowFood.x >= newBigFood.x && slowFood.x <= newBigFood.x + 1) &&
         (slowFood.y >= newBigFood.y && slowFood.y <= newBigFood.y + 1))
    );
    
    bigFood = newBigFood;
}

// 生成减速食物
function generateSlowFood() {
    if (slowFood) return; // 如果已经有减速食物，不生成新的
    
    let newSlowFood;
    do {
        newSlowFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (
        snake.some(segment => segment.x === newSlowFood.x && segment.y === newSlowFood.y) ||
        obstacles.some(obstacle => obstacle.x === newSlowFood.x && obstacle.y === newSlowFood.y) ||
        food.some(foodItem => foodItem.x === newSlowFood.x && foodItem.y === newSlowFood.y) ||
        (bigFood && 
         newSlowFood.x >= bigFood.x && newSlowFood.x <= bigFood.x + 1 &&
         newSlowFood.y >= bigFood.y && newSlowFood.y <= bigFood.y + 1)
    );
    
    slowFood = newSlowFood;
}

// AI蛇系统函数
function generateAISnakes() {
    aiSnakes = [];
    
    // 只在第三关及以后生成AI蛇
    if (currentLevel >= 3) {
        // 生成两条AI蛇
        for (let i = 0; i < 2; i++) {
            const aiSnake = createAISnake(i);
            if (aiSnake) {
                aiSnakes.push(aiSnake);
            }
        }
    }
}

function createAISnake(index) {
    let attempts = 0;
    let startX, startY;
    
    // 尝试找到合适的起始位置
    do {
        startX = Math.floor(Math.random() * (GRID_SIZE - 6)) + 3;
        startY = Math.floor(Math.random() * (GRID_SIZE - 6)) + 3;
        attempts++;
        
        if (attempts > 100) return null; // 避免无限循环
        
    } while (
        // 检查是否与玩家蛇重叠
        snake.some(segment => 
            Math.abs(segment.x - startX) < 5 && Math.abs(segment.y - startY) < 5
        ) ||
        // 检查是否与障碍物重叠
        obstacles.some(obstacle => 
            Math.abs(obstacle.x - startX) < 3 && Math.abs(obstacle.y - startY) < 3
        ) ||
        // 检查是否与其他AI蛇重叠
        aiSnakes.some(otherSnake => 
            Math.abs(otherSnake.body[0].x - startX) < 5 && Math.abs(otherSnake.body[0].y - startY) < 5
        )
    );
    
    const directions = [UP, DOWN, LEFT, RIGHT];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    return {
        id: index,
        body: [
            { x: startX, y: startY },
            { x: startX - randomDirection.x, y: startY - randomDirection.y },
            { x: startX - randomDirection.x * 2, y: startY - randomDirection.y * 2 }
        ],
        direction: randomDirection,
        color: index === 0 ? COLORS.aiSnake1 : COLORS.aiSnake2,
        borderColor: index === 0 ? COLORS.aiSnake1Border : COLORS.aiSnake2Border,
        targetFood: null,
        moveTimer: 0,
        score: 30, // AI蛇的分数值
        speedBoosts: 0, // AI蛇吃食物的次数，用于计算速度
        baseSpeed: 1.0 // AI蛇的基础速度倍数，初始与玩家相同
    };
}

function updateAISnakes() {
    if (currentLevel < 3 || aiSnakes.length === 0) return;
    
    aiSnakeTimer++;
    
    // 使用玩家蛇的基础速度作为参考
    const playerSpeed = currentFPS;
    
    if (aiSnakeTimer >= Math.floor(60 / playerSpeed)) {
        aiSnakeTimer = 0;
        
        aiSnakes.forEach((aiSnake, index) => {
            if (!aiSnake) return;
            
            // 计算AI蛇的个体速度：基础速度 + 吃食物加速，但不能超过玩家速度
            const aiSpeedMultiplier = Math.min(1.0, aiSnake.baseSpeed + aiSnake.speedBoosts * 0.05);
            
            // 检查是否到了这条AI蛇的移动时间
            aiSnake.moveTimer++;
            const aiMoveInterval = Math.floor(1 / aiSpeedMultiplier);
            
            if (aiSnake.moveTimer >= aiMoveInterval) {
                aiSnake.moveTimer = 0;
                
                // 尝试移动AI蛇，如果返回false表示需要分解
                const moveSuccessful = moveAISnake(aiSnake);
                if (!moveSuccessful) {
                    // AI蛇撞到障碍物、边界或其他蛇，分解成食物
                    decomposeAISnake(aiSnake, index);
                    return;
                }
                
                // 检查AI蛇是否吃到食物
                checkAISnakeFoodCollision(aiSnake);
                
                // 检查AI蛇是否与玩家蛇碰撞
                if (checkAISnakePlayerCollision(aiSnake)) {
                    // 将AI蛇分解成食物
                    decomposeAISnake(aiSnake, index);
                }
            }
        });
        
        // 移除已分解的AI蛇
        aiSnakes = aiSnakes.filter(snake => snake !== null);
    }
}

function moveAISnake(aiSnake) {
    // 简单的AI寻路逻辑：寻找最近的食物
    const nearestFood = findNearestFood(aiSnake.body[0]);
    
    if (nearestFood) {
        const head = aiSnake.body[0];
        const dx = nearestFood.x - head.x;
        const dy = nearestFood.y - head.y;
        
        // 选择最优方向
        let newDirection = aiSnake.direction;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            newDirection = dx > 0 ? RIGHT : LEFT;
        } else {
            newDirection = dy > 0 ? DOWN : UP;
        }
        
        // 检查新方向是否安全
        if (isAISnakeDirectionSafe(aiSnake, newDirection)) {
            aiSnake.direction = newDirection;
        } else {
            // 如果不安全，尝试其他方向
            const directions = [UP, DOWN, LEFT, RIGHT];
            for (const dir of directions) {
                if (isAISnakeDirectionSafe(aiSnake, dir)) {
                    aiSnake.direction = dir;
                    break;
                }
            }
        }
    }
    
    // 移动AI蛇
    const head = { ...aiSnake.body[0] };
    head.x += aiSnake.direction.x;
    head.y += aiSnake.direction.y;
    
    // 边界检查
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        // 改变方向
        const directions = [UP, DOWN, LEFT, RIGHT];
        aiSnake.direction = directions[Math.floor(Math.random() * directions.length)];
        return false; // 返回false表示需要分解
    }
    
    // 检查是否撞到障碍物
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
        return false; // 返回false表示需要分解
    }
    
    // 检查是否撞到自己
    if (aiSnake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
        return false; // 返回false表示需要分解
    }
    
    // 检查是否撞到其他AI蛇
    if (aiSnakes.some(otherSnake => 
        otherSnake !== aiSnake && otherSnake &&
        otherSnake.body.some(segment => segment.x === head.x && segment.y === head.y)
    )) {
        return false; // 返回false表示需要分解
    }
    
    aiSnake.body.unshift(head);
    aiSnake.body.pop(); // 移除尾部
    return true; // 返回true表示移动成功
}

function findNearestFood(position) {
    let nearest = null;
    let minDistance = Infinity;
    
    // 检查普通食物
    food.forEach(foodItem => {
        const distance = Math.abs(foodItem.x - position.x) + Math.abs(foodItem.y - position.y);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = foodItem;
        }
    });
    
    // 检查大食物
    if (bigFood) {
        const distance = Math.abs(bigFood.x - position.x) + Math.abs(bigFood.y - position.y);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = bigFood;
        }
    }
    
    return nearest;
}

function isAISnakeDirectionSafe(aiSnake, direction) {
    const head = { ...aiSnake.body[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // 边界检查
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return false;
    }
    
    // 检查是否撞到障碍物
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
        return false;
    }
    
    // 检查是否撞到自己
    if (aiSnake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
        return false;
    }
    
    // 检查是否撞到其他AI蛇
    if (aiSnakes.some(otherSnake => 
        otherSnake !== aiSnake && otherSnake &&
        otherSnake.body.some(segment => segment.x === head.x && segment.y === head.y)
    )) {
        return false;
    }
    
    return true;
}

function checkAISnakeFoodCollision(aiSnake) {
    const head = aiSnake.body[0];
    
    // 检查普通食物
    for (let i = food.length - 1; i >= 0; i--) {
        if (food[i].x === head.x && food[i].y === head.y) {
            food.splice(i, 1);
            // AI蛇吃到食物后增长
            const tail = { ...aiSnake.body[aiSnake.body.length - 1] };
            aiSnake.body.push(tail);
            // AI蛇吃食物加速（每吃一次食物得20分，增加一次速度）
            aiSnake.speedBoosts++;
            // 生成新食物
            generateFood();
            break;
        }
    }
    
    // 检查大食物
    if (bigFood && head.x === bigFood.x && head.y === bigFood.y) {
        bigFood = null;
        // AI蛇吃到大食物后增长更多
        for (let i = 0; i < 2; i++) {
            const tail = { ...aiSnake.body[aiSnake.body.length - 1] };
            aiSnake.body.push(tail);
        }
        // 大食物也增加速度
        aiSnake.speedBoosts++;
    }
}

function checkAISnakePlayerCollision(aiSnake) {
    const aiHead = aiSnake.body[0];
    
    // 检查AI蛇头是否撞到玩家蛇身体
    return snake.some(segment => segment.x === aiHead.x && segment.y === aiHead.y);
}

function decomposeAISnake(aiSnake, index) {
    // 将AI蛇的每个身体段落转换为食物，分数基于蛇的长度
    const snakeLength = aiSnake.body.length;
    const scorePerSegment = Math.max(5, Math.floor(snakeLength / 2)); // 最少5分，长度越长分数越高
    
    aiSnake.body.forEach(segment => {
        // 避免在障碍物或其他蛇身上生成食物
        if (!obstacles.some(obstacle => obstacle.x === segment.x && obstacle.y === segment.y) &&
            !snake.some(playerSegment => playerSegment.x === segment.x && playerSegment.y === segment.y)) {
            food.push({
                x: segment.x,
                y: segment.y,
                value: scorePerSegment // 根据蛇长度计算分数
            });
        }
    });
    
    // 标记AI蛇为已分解
    aiSnakes[index] = null;
}

// 绘制网格
function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.3; // 减小网格线宽度，弱化像素风格
    
    // 绘制垂直线
    for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

// 绘制障碍物
function drawObstacles() {
    ctx.fillStyle = COLORS.obstacle;
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * BLOCK_SIZE, obstacle.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#757575';
        ctx.strokeRect(obstacle.x * BLOCK_SIZE, obstacle.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    });
}

// 绘制蛇
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * BLOCK_SIZE;
        const y = segment.y * BLOCK_SIZE;
        
        if (index === 0) {
            // 蛇头 - 像素化设计，参考传说之下风格
            drawPixelSnakeHead(x, y);
        } else {
            // 蛇身 - 像素化设计
            drawPixelSnakeBody(x, y, index);
        }
    });
}

// 绘制像素化蛇头
function drawPixelSnakeHead(x, y) {
    const pixelSize = BLOCK_SIZE / 8; // 8x8像素网格
    
    // 蛇头像素图案 (8x8)
    const headPattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,3,2,2,3,2,1],
        [1,2,2,2,2,2,2,1],
        [1,2,4,2,2,4,2,1],
        [1,2,2,5,5,2,2,1],
        [0,1,2,2,2,2,1,0],
        [0,0,1,1,1,1,0,0]
    ];
    
    // 颜色映射
    const colors = {
        0: 'transparent',
        1: '#2E7D32', // 深绿边框
        2: '#66BB6A', // 主体绿色
        3: '#FFFFFF', // 眼睛白色
        4: '#000000', // 眼珠黑色
        5: '#FF4444'  // 嘴巴红色
    };
    
    // 绘制像素
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const colorIndex = headPattern[row][col];
            if (colorIndex !== 0) {
                ctx.fillStyle = colors[colorIndex];
                ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

// 绘制AI蛇
function drawAISnakes() {
    aiSnakes.forEach(aiSnake => {
        if (!aiSnake) return;
        
        aiSnake.body.forEach((segment, index) => {
            const x = segment.x * BLOCK_SIZE;
            const y = segment.y * BLOCK_SIZE;
            
            if (index === 0) {
                // AI蛇头
                drawPixelAISnakeHead(x, y, aiSnake.color, aiSnake.borderColor);
            } else {
                // AI蛇身
                drawPixelAISnakeBody(x, y, index, aiSnake.color, aiSnake.borderColor);
            }
        });
    });
}

// 绘制像素化AI蛇头
function drawPixelAISnakeHead(x, y, color, borderColor) {
    const pixelSize = BLOCK_SIZE / 8; // 8x8像素网格
    
    // AI蛇头像素图案 (8x8)
    const headPattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,3,2,2,3,2,1],
        [1,2,2,2,2,2,2,1],
        [1,2,4,2,2,4,2,1],
        [1,2,2,5,5,2,2,1],
        [0,1,2,2,2,2,1,0],
        [0,0,1,1,1,1,0,0]
    ];
    
    // 颜色映射
    const colors = {
        0: 'transparent',
        1: borderColor, // 边框颜色
        2: color, // 主体颜色
        3: '#FFFFFF', // 眼睛白色
        4: '#000000', // 眼珠黑色
        5: '#FF4444'  // 嘴巴红色
    };
    
    // 绘制像素
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const colorIndex = headPattern[row][col];
            if (colorIndex !== 0) {
                ctx.fillStyle = colors[colorIndex];
                ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

// 绘制像素化AI蛇身
function drawPixelAISnakeBody(x, y, segmentIndex, color, borderColor) {
    const pixelSize = BLOCK_SIZE / 8; // 8x8像素网格
    
    // AI蛇身像素图案 (8x8) - 带有纹理
    const bodyPattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,2,3,3,2,2,1],
        [1,2,3,2,2,3,2,1],
        [1,2,3,2,2,3,2,1],
        [1,2,2,3,3,2,2,1],
        [0,1,2,2,2,2,1,0],
        [0,0,1,1,1,1,0,0]
    ];
    
    // 颜色映射 - 根据段落索引调整亮度
    const brightness = Math.max(0.7, 1 - (segmentIndex * 0.05));
    
    // 解析颜色值
    const colorMatch = color.match(/#([0-9A-F]{6})/i);
    let r, g, b;
    if (colorMatch) {
        r = parseInt(colorMatch[1].substr(0, 2), 16);
        g = parseInt(colorMatch[1].substr(2, 2), 16);
        b = parseInt(colorMatch[1].substr(4, 2), 16);
    } else {
        r = g = b = 128; // 默认灰色
    }
    
    const colors = {
        0: 'transparent',
        1: borderColor, // 边框颜色
        2: `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`, // 主体颜色
        3: `rgb(${Math.floor(r * brightness * 1.2)}, ${Math.floor(g * brightness * 1.2)}, ${Math.floor(b * brightness * 1.2)})` // 纹理颜色
    };
    
    // 绘制像素
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const colorIndex = bodyPattern[row][col];
            if (colorIndex !== 0) {
                ctx.fillStyle = colors[colorIndex];
                ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

// 绘制像素化蛇身
function drawPixelSnakeBody(x, y, segmentIndex) {
    const pixelSize = BLOCK_SIZE / 8; // 8x8像素网格
    
    // 蛇身像素图案 (8x8) - 带有纹理
    const bodyPattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [1,2,2,3,3,2,2,1],
        [1,2,3,2,2,3,2,1],
        [1,2,3,2,2,3,2,1],
        [1,2,2,3,3,2,2,1],
        [0,1,2,2,2,2,1,0],
        [0,0,1,1,1,1,0,0]
    ];
    
    // 颜色映射 - 根据段落索引调整亮度
    const brightness = Math.max(0.7, 1 - (segmentIndex * 0.05));
    const baseGreen = Math.floor(76 * brightness); // #4CAF50 的绿色分量
    const accentGreen = Math.floor(102 * brightness); // 更亮的绿色
    
    const colors = {
        0: 'transparent',
        1: '#2E7D32', // 深绿边框
        2: `rgb(${Math.floor(76 * brightness)}, ${Math.floor(175 * brightness)}, ${Math.floor(80 * brightness)})`, // 主体绿色
        3: `rgb(${Math.floor(102 * brightness)}, ${Math.floor(187 * brightness)}, ${Math.floor(106 * brightness)})` // 纹理绿色
    };
    
    // 绘制像素
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const colorIndex = bodyPattern[row][col];
            if (colorIndex !== 0) {
                ctx.fillStyle = colors[colorIndex];
                ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

// 绘制食物
function drawFood() {
    // 绘制所有普通食物
    food.forEach(foodItem => {
        const x = foodItem.x * BLOCK_SIZE;
        const y = foodItem.y * BLOCK_SIZE;
        const size = BLOCK_SIZE;
        
        // 绘制像素版苹果
        ctx.fillStyle = '#FF4444'; // 苹果红色
        
        // 苹果主体 - 圆形底部
        ctx.fillRect(x + size * 0.2, y + size * 0.3, size * 0.6, size * 0.5);
        ctx.fillRect(x + size * 0.1, y + size * 0.4, size * 0.8, size * 0.3);
        ctx.fillRect(x + size * 0.15, y + size * 0.25, size * 0.7, size * 0.15);
        
        // 苹果顶部凹陷
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + size * 0.4, y + size * 0.2, size * 0.2, size * 0.15);
        
        // 苹果茎
        ctx.fillStyle = '#8B4513'; // 棕色茎
        ctx.fillRect(x + size * 0.45, y + size * 0.1, size * 0.1, size * 0.2);
        
        // 苹果叶子
        ctx.fillStyle = '#228B22'; // 绿色叶子
        ctx.fillRect(x + size * 0.55, y + size * 0.15, size * 0.15, size * 0.1);
        
        // 苹果高光
        ctx.fillStyle = '#FFAAAA';
        ctx.fillRect(x + size * 0.25, y + size * 0.35, size * 0.15, size * 0.1);
    });
}

// 绘制大食物
function drawBigFood() {
    if (!bigFood) return;
    
    const x = bigFood.x * BLOCK_SIZE;
    const y = bigFood.y * BLOCK_SIZE;
    const size = BLOCK_SIZE * 2; // 2x2大小
    
    // 绘制像素版大橙子 (2x2)
    ctx.fillStyle = '#FF8C00'; // 橙子橙色
    
    // 橙子主体 - 更大的圆形 (占据2x2区域)
    ctx.fillRect(x + size * 0.1, y + size * 0.15, size * 0.8, size * 0.7);
    ctx.fillRect(x + size * 0.05, y + size * 0.25, size * 0.9, size * 0.5);
    ctx.fillRect(x + size * 0.15, y + size * 0.1, size * 0.7, size * 0.8);
    
    // 橙子纹理线条 - 更多更明显的纹理
    ctx.fillStyle = '#FF7700'; // 深一点的橙色
    ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.08, size * 0.7);
    ctx.fillRect(x + size * 0.35, y + size * 0.1, size * 0.08, size * 0.8);
    ctx.fillRect(x + size * 0.5, y + size * 0.1, size * 0.08, size * 0.8);
    ctx.fillRect(x + size * 0.65, y + size * 0.15, size * 0.08, size * 0.7);
    
    // 橙子顶部 - 更大的绿色部分
    ctx.fillStyle = '#228B22'; // 绿色顶部
    ctx.fillRect(x + size * 0.35, y + size * 0.02, size * 0.3, size * 0.15);
    
    // 橙子茎 - 更粗的茎
    ctx.fillStyle = '#8B4513'; // 棕色茎
    ctx.fillRect(x + size * 0.42, y, size * 0.16, size * 0.08);
    
    // 橙子高光 - 更多高光效果
    ctx.fillStyle = '#FFB347'; // 浅橙色高光
    ctx.fillRect(x + size * 0.25, y + size * 0.2, size * 0.2, size * 0.15);
    ctx.fillRect(x + size * 0.15, y + size * 0.4, size * 0.15, size * 0.2);
    ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.15, size * 0.15);
    
    // 橙子底部阴影 - 更大的阴影
    ctx.fillStyle = '#E67300'; // 深橙色阴影
    ctx.fillRect(x + size * 0.15, y + size * 0.75, size * 0.7, size * 0.15);
    
    // 额外的细节 - 橙子表面的小点
    ctx.fillStyle = '#FF9500';
    ctx.fillRect(x + size * 0.3, y + size * 0.35, size * 0.05, size * 0.05);
    ctx.fillRect(x + size * 0.55, y + size * 0.45, size * 0.05, size * 0.05);
    ctx.fillRect(x + size * 0.4, y + size * 0.6, size * 0.05, size * 0.05);
}

// 绘制减速食物
function drawSlowFood() {
    if (!slowFood) return;
    
    const x = slowFood.x * BLOCK_SIZE;
    const y = slowFood.y * BLOCK_SIZE;
    const size = BLOCK_SIZE;
    
    // 绘制像素版蓝色雪花
    ctx.fillStyle = '#4FC3F7'; // 浅蓝色雪花
    
    // 雪花中心
    ctx.fillRect(x + size * 0.45, y + size * 0.45, size * 0.1, size * 0.1);
    
    // 主要十字形
    ctx.fillRect(x + size * 0.1, y + size * 0.45, size * 0.8, size * 0.1); // 水平线
    ctx.fillRect(x + size * 0.45, y + size * 0.1, size * 0.1, size * 0.8); // 垂直线
    
    // 对角线
    ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.05); // 左上到右下
    ctx.fillRect(x + size * 0.2, y + size * 0.75, size * 0.6, size * 0.05); // 左下到右上
    
    // 雪花分支 - 水平
    ctx.fillRect(x + size * 0.05, y + size * 0.4, size * 0.1, size * 0.2);
    ctx.fillRect(x + size * 0.85, y + size * 0.4, size * 0.1, size * 0.2);
    
    // 雪花分支 - 垂直
    ctx.fillRect(x + size * 0.4, y + size * 0.05, size * 0.2, size * 0.1);
    ctx.fillRect(x + size * 0.4, y + size * 0.85, size * 0.2, size * 0.1);
    
    // 雪花装饰点
    ctx.fillStyle = '#81D4FA'; // 更浅的蓝色装饰
    ctx.fillRect(x + size * 0.25, y + size * 0.25, size * 0.05, size * 0.05);
    ctx.fillRect(x + size * 0.7, y + size * 0.25, size * 0.05, size * 0.05);
    ctx.fillRect(x + size * 0.25, y + size * 0.7, size * 0.05, size * 0.05);
    ctx.fillRect(x + size * 0.7, y + size * 0.7, size * 0.05, size * 0.05);
}

// 更新游戏状态
function update() {
    // 更新方向
    direction = nextDirection;
    
    // 计算新的头部位置
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // 处理穿墙效果
    if (head.x < 0) {
        head.x = GRID_SIZE - 1;
    } else if (head.x >= GRID_SIZE) {
        head.x = 0;
    }
    
    if (head.y < 0) {
        head.y = GRID_SIZE - 1;
    } else if (head.y >= GRID_SIZE) {
        head.y = 0;
    }
    
    // 检查是否撞到自己
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        playGameOverSound(); // 播放游戏结束音效
        gameOver(false);
        return;
    }
    
    // 检查是否撞到障碍物
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
        playGameOverSound(); // 播放游戏结束音效
        gameOver(false);
        return;
    }
    
    // 检查是否撞到AI蛇
    if (currentLevel >= 3 && aiSnakes.length > 0) {
        for (const aiSnake of aiSnakes) {
            if (aiSnake && aiSnake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
                playGameOverSound(); // 播放游戏结束音效
                gameOver(false);
                return;
            }
        }
    }
    
    // 移动蛇
    snake.unshift(head);
    
    let ateFood = false;
    
    // 检查是否吃到普通食物
    for (let i = 0; i < food.length; i++) {
        if (head.x === food[i].x && head.y === food[i].y) {
            score += 10;
            scoreElement.textContent = score;
            playFoodSound(); // 播放普通食物音效
            checkMilestone(); // 检查里程碑
            food.splice(i, 1); // 移除被吃掉的食物
            generateFood(); // 生成新的食物
            ateFood = true;
            break;
        }
    }
    
    // 检查是否吃到大食物 (2x2区域)
    if (bigFood && 
        head.x >= bigFood.x && head.x <= bigFood.x + 1 &&
        head.y >= bigFood.y && head.y <= bigFood.y + 1) {
        score += 20;
        scoreElement.textContent = score;
        playBigFoodSound(); // 播放大食物音效
        checkMilestone(); // 检查里程碑
        bigFood = null;
        ateFood = true;
    }
    
    // 检查是否吃到减速食物
    if (slowFood && head.x === slowFood.x && head.y === slowFood.y) {
        score += 5;
        scoreElement.textContent = score;
        playSlowFoodSound(); // 播放减速食物音效
        checkMilestone(); // 检查里程碑
        // 减速效果：降低当前速度
        currentFPS = Math.max(currentFPS - 2, 3); // 最低速度为3帧
        slowFood = null;
        ateFood = true;
        
        // 重新设置游戏循环以应用新速度
        if (gameRunning && !gamePaused) {
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, 1000 / currentFPS);
        }
    }
    
    if (ateFood) {
        // 检查是否达到当前关卡的胜利条件
        const targetScore = getLevelTargetScore(currentLevel);
        if (score >= targetScore) {
            if (currentLevel < MAX_LEVEL) {
                // 进入下一关
                currentLevel++;
                // 播放通关音效
                playLevelCompleteSound();
                // 暂停游戏
                gameRunning = false;
                clearInterval(gameLoop);
                // 重置游戏状态
                resetGameForNextLevel();
                // 显示关卡提升信息，2秒后自动开始游戏
                showLevelUpPopup(`🎉 恭喜！进入第${currentLevel}关！\n目标分数：${getLevelTargetScore(currentLevel)}分`, () => {
                    startGame();
                });
            } else {
                // 通关所有关卡，自动返回第一关
                currentLevel = 1;
                // 播放通关音效
                playLevelCompleteSound();
                gameRunning = false;
                clearInterval(gameLoop);
                resetGameForNextLevel();
                // 显示通关信息，2秒后自动开始第一关
                showLevelUpPopup(`🏆 恭喜通关！\n游戏将返回第一关`, () => {
                    startGame();
                });
            }
        }
        
        // 根据分数调整速度，每20分提高一次速度，最高不超过12帧
        updateSpeed();
        
        // 随机生成特殊食物
        if (Math.random() < 0.3) { // 30%概率生成大食物
            generateBigFood();
        }
        if (Math.random() < 0.2) { // 20%概率生成减速食物
            generateSlowFood();
        }
    } else {
        // 如果没有吃到食物，移除尾部
        snake.pop();
    }
    
    // 每10步移动一次障碍物
    obstacleTimer++;
    if (obstacleTimer >= 10) {
        moveObstacles();
        obstacleTimer = 0;
    }
    
    // 更新AI蛇
    updateAISnakes();
}

// 根据分数更新游戏速度
function updateSpeed() {
    // 每20分提高一次速度，最高不超过8帧 (降低最大速度)
    const speedLevel = Math.floor(score / 20);
    currentFPS = Math.min(BASE_FPS + speedLevel, 8);
    
    // 如果游戏正在运行，重新设置游戏循环以应用新速度
    if (gameRunning && !gamePaused) {
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, 1000 / currentFPS);
    }
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    drawGrid();
    
    // 绘制障碍物
    drawObstacles();
    
    // 绘制食物
    drawFood();
    
    // 绘制特殊食物
    drawBigFood();
    drawSlowFood();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制AI蛇
    drawAISnakes();
}

// 游戏主循环
function gameStep() {
    update();
    draw();
}

// 游戏结束
function gameOver(isWin = false) {
    clearInterval(gameLoop);
    gameRunning = false;
    finalScoreElement.textContent = score;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
    }
    
    // 增加游玩次数
    playCount++;
    
    // 保存数据并更新显示
    saveGameData();
    updateStatsDisplay();
    
    // 如果不是胜利结束，重置到第一关
    if (!isWin) {
        currentLevel = 1;
        // 清除所有AI蛇
        aiSnakes = [];
    }
    
    // 更新游戏结束界面文本
    const gameOverTitle = document.querySelector('#game-over h2');
    if (isWin) {
        gameOverTitle.textContent = '恭喜你赢了!';
        gameOverTitle.style.color = '#4CAF50';
    } else {
        gameOverTitle.textContent = '游戏结束! 返回第一关';
        gameOverTitle.style.color = '#ff6b6b';
    }
    
    gameOverElement.style.display = 'block';
    
    // 重置按钮状态
    startButton.disabled = false;
    pauseButton.disabled = true;
    resumeButton.disabled = true;
}

// 游戏胜利
function gameWin() {
    gameOver(true);
}

// 暂停游戏
function pauseGame() {
    if (gameRunning && !gamePaused) {
        clearInterval(gameLoop);
        gamePaused = true;
        pauseButton.disabled = true;
        resumeButton.disabled = false;
    }
}

// 继续游戏
function resumeGame() {
    if (gameRunning && gamePaused) {
        gameLoop = setInterval(gameStep, 1000 / currentFPS);
        gamePaused = false;
        pauseButton.disabled = false;
        resumeButton.disabled = true;
    }
}

// 开始游戏
function startGame() {
    // 启用音频上下文（需要用户交互）
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    if (gameRunning) return;
    
    initGame();
    gameRunning = true;
    gamePaused = false;
    
    // 启用暂停按钮，禁用继续按钮
    pauseButton.disabled = false;
    resumeButton.disabled = true;
    startButton.disabled = true;
    
    // 立即开始移动
    gameLoop = setInterval(gameStep, 1000 / currentFPS);
}

// 显示主游戏界面
function showMainGame() {
    startScreen.style.display = 'none';
    mainGame.style.display = 'block';
}

// 显示开始界面
function showStartScreen() {
    startScreen.style.display = 'block';
    mainGame.style.display = 'none';
}

// 重新开始游戏
function restartGame() {
    clearInterval(gameLoop);
    gameLoop = undefined;
    gameOverElement.style.display = 'none';
    
    // 清除所有AI蛇（确保重新开始时AI蛇被清除）
    aiSnakes = [];
    
    // 初始化游戏但不立即开始移动
    initGame();
    gameRunning = false;
    gamePaused = false;
    
    // 启用开始游戏按钮，禁用暂停和继续按钮
    startButton.disabled = false;
    pauseButton.disabled = true;
    resumeButton.disabled = true;
    
    // 绘制初始状态
    draw();
}

// 处理键盘输入
function handleKeydown(e) {
    // 防止按键滚动页面
    if ([37, 38, 39, 40, 32, 82, 79].includes(e.keyCode)) {
        e.preventDefault();
    }
    
    // 在开始界面时的按键处理
    if (startScreen.style.display !== 'none') {
        if (e.keyCode === 82) { // R键
            showMainGame();
        }
        return;
    }
    
    // 全局按键处理
    switch (e.keyCode) {
        case 82: // R键 - 开始游戏
            if (!gameRunning) {
                startGame();
            }
            break;
        case 79: // O键 - 重新开始
            restartGame();
            break;
        case 32: // 空格键 - 暂停/继续
            if (gameRunning) {
                if (gamePaused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
            }
            break;
    }
    
    // 只有在游戏运行时才处理方向键
    if (!gameRunning || gamePaused) return;
    
    // 根据按键更改方向，防止180度转弯
    switch (e.keyCode) {
        case 38: // 上箭头
        case 87: // W
            if (direction.y !== 1) nextDirection = UP;
            break;
        case 40: // 下箭头
        case 83: // S
            if (direction.y !== -1) nextDirection = DOWN;
            break;
        case 37: // 左箭头
        case 65: // A
            if (direction.x !== 1) nextDirection = LEFT;
            break;
        case 39: // 右箭头
        case 68: // D
            if (direction.x !== -1) nextDirection = RIGHT;
            break;
    }
}

// 触摸控制（适用于移动设备）
function handleTouchStart(e) {
    if (!gameRunning || gamePaused) return;
    
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // 获取画布位置
    const rect = canvas.getBoundingClientRect();
    const canvasCenterX = rect.left + rect.width / 2;
    const canvasCenterY = rect.top + rect.height / 2;
    
    // 计算触摸点相对于画布中心的位置
    const deltaX = touchX - canvasCenterX;
    const deltaY = touchY - canvasCenterY;
    
    // 判断主要方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平方向
        if (deltaX > 0 && direction.x !== -1) {
            nextDirection = RIGHT;
        } else if (deltaX < 0 && direction.x !== 1) {
            nextDirection = LEFT;
        }
    } else {
        // 垂直方向
        if (deltaY > 0 && direction.y !== -1) {
            nextDirection = DOWN;
        } else if (deltaY < 0 && direction.y !== 1) {
            nextDirection = UP;
        }
    }
}

// 触屏方向控制函数
function handleMobileDirection(newDirection) {
    if (gameRunning && !gamePaused) {
        // 防止180度转弯
        if ((direction === UP && newDirection === DOWN) ||
            (direction === DOWN && newDirection === UP) ||
            (direction === LEFT && newDirection === RIGHT) ||
            (direction === RIGHT && newDirection === LEFT)) {
            return;
        }
        nextDirection = newDirection;
    }
}

// 触屏游戏控制函数
function handleMobileGameControl(action) {
    switch(action) {
        case 'start':
            if (!gameRunning) {
                startGame();
            }
            break;
        case 'pause':
            if (gameRunning && !gamePaused) {
                pauseGame();
            } else if (gameRunning && gamePaused) {
                resumeGame();
            }
            break;
        case 'restart':
            restartGame();
            break;
    }
}

// 事件监听
// 添加弹窗关闭事件监听
popupClose.addEventListener('click', closeMilestonePopup);

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
confirmStartButton.addEventListener('click', showMainGame);

// 触觉反馈函数
function vibrate(pattern = [50]) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// 方向控制按键变量
let currentDirection = null;

// 方向控制按键事件处理
function handleDirectionPress(direction) {
    if (!gameRunning) return;
    
    // 防止反向移动
    if ((direction === UP && snake[0].direction === DOWN) ||
        (direction === DOWN && snake[0].direction === UP) ||
        (direction === LEFT && snake[0].direction === RIGHT) ||
        (direction === RIGHT && snake[0].direction === LEFT)) {
        return;
    }
    
    currentDirection = direction;
    handleMobileDirection(direction);
    vibrate([25]);
}

// 方向按键事件监听
function initDirectionControls() {
    // 上方向按键
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDirectionPress(UP);
        upBtn.style.transform = 'translateY(0) scale(0.95)';
    });
    upBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        upBtn.style.transform = '';
    });
    upBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDirectionPress(UP);
    });

    // 下方向按键
    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDirectionPress(DOWN);
        downBtn.style.transform = 'translateY(0) scale(0.95)';
    });
    downBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        downBtn.style.transform = '';
    });
    downBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDirectionPress(DOWN);
    });

    // 左方向按键
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDirectionPress(LEFT);
        leftBtn.style.transform = 'translateY(0) scale(0.95)';
    });
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        leftBtn.style.transform = '';
    });
    leftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDirectionPress(LEFT);
    });

    // 右方向按键
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDirectionPress(RIGHT);
        rightBtn.style.transform = 'translateY(0) scale(0.95)';
    });
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        rightBtn.style.transform = '';
    });
    rightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDirectionPress(RIGHT);
    });
}

// 游戏控制按键事件监听
startMobileBtn.addEventListener('click', () => {
    vibrate([50]);
    handleMobileGameControl('start');
});
startMobileBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    vibrate([50]);
    handleMobileGameControl('start');
    startMobileBtn.style.transform = 'scale(0.95)';
});
startMobileBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    startMobileBtn.style.transform = '';
});

pauseMobileBtn.addEventListener('click', () => {
    vibrate([40]);
    handleMobileGameControl('pause');
});
pauseMobileBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    vibrate([40]);
    handleMobileGameControl('pause');
    pauseMobileBtn.style.transform = 'scale(0.95)';
});
pauseMobileBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    pauseMobileBtn.style.transform = '';
});

restartMobileBtn.addEventListener('click', () => {
    vibrate([60]);
    handleMobileGameControl('restart');
});
restartMobileBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    vibrate([60]);
    handleMobileGameControl('restart');
    restartMobileBtn.style.transform = 'scale(0.95)';
});
restartMobileBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    restartMobileBtn.style.transform = '';
});

// 防止游戏控制按键的默认行为（保留原有的防止默认行为代码）
[startMobileBtn, pauseMobileBtn, restartMobileBtn].forEach(btn => {
    btn.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

document.addEventListener('keydown', handleKeydown);
canvas.addEventListener('touchstart', handleTouchStart);

// 自适应画布大小
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(container.clientWidth - 40, 600);
    
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = maxWidth + 'px';
}

// 初始化方向控制
window.addEventListener('load', () => {
    loadGameData(); // 加载游戏数据
    initDirectionControls();
    resizeCanvas();
});
window.addEventListener('resize', () => {
    resizeCanvas();
});

// 初始化游戏
initGame();
draw(); // 绘制初始状态

// 默认显示开始界面
showStartScreen();