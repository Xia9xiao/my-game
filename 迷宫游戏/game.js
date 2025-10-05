// 游戏配置
const GRID_SIZE = 30;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// 游戏状态
let canvas, ctx;
let maze = [];
let player = { x: 1, y: 1 };
let target = { x: GRID_SIZE - 2, y: GRID_SIZE - 2 };
let gameWon = false;

// 钥匙系统
let keys = []; // 存储所有钥匙的位置和类型
let collectedKeys = { gold: false, silver: false, bronze: false }; // 收集状态
const KEY_TYPES = [
    { type: 'gold', color: '#FFD700', name: '金钥匙' },
    { type: 'silver', color: '#C0C0C0', name: '银钥匙' },
    { type: 'bronze', color: '#CD7F32', name: '铜钥匙' }
];

// 迷宫生成相关
const WALL = 1;
const PATH = 0;

// 初始化游戏
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    // 生成迷宫
    generateMaze();
    
    // 设置键盘监听
    document.addEventListener('keydown', handleKeyPress);
    
    // 开始游戏循环
    gameLoop();
}

// 生成迷宫（使用递归回溯算法）
function generateMaze() {
    // 初始化迷宫，全部设为墙
    maze = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        maze[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            maze[y][x] = WALL;
        }
    }
    
    // 递归回溯生成迷宫主路径
    const stack = [];
    const visited = new Set();
    const startX = 1;
    const startY = 1;
    
    maze[startY][startX] = PATH;
    stack.push({ x: startX, y: startY });
    visited.add(`${startX},${startY}`);
    
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(current.x, current.y, visited);
        
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // 移除当前单元格和选择的邻居之间的墙
            const wallX = current.x + (next.x - current.x) / 2;
            const wallY = current.y + (next.y - current.y) / 2;
            
            maze[wallY][wallX] = PATH;
            maze[next.y][next.x] = PATH;
            visited.add(`${next.x},${next.y}`);
            
            stack.push(next);
        } else {
            stack.pop();
        }
    }
    
    // 生成环路结构
    generateLoops();
    
    // 生成额外的死胡同和分支路径
    generateDeadEnds();
    
    // 确保起点是通路
    maze[1][1] = PATH;
    
    // 寻找一个合适的终点位置（必须在通路上且距离起点较远）
    findValidTargetPosition();
    
    // 验证路径连通性（不再要求唯一路径）
    if (!verifyPathExists()) {
        // 如果没有路径，重新生成
        generateMaze();
        return;
    }
    
    // 生成钥匙
    generateKeys();
    
    // 重置玩家位置和游戏状态
    player.x = 1;
    player.y = 1;
    gameWon = false;
    collectedKeys = { gold: false, silver: false, bronze: false };
}

// 寻找有效的目标位置
function findValidTargetPosition() {
    const validPositions = [];
    
    // 遍历整个迷宫，找到所有通路位置
    for (let y = 1; y < GRID_SIZE - 1; y++) {
        for (let x = 1; x < GRID_SIZE - 1; x++) {
            if (maze[y][x] === PATH) {
                // 计算与起点的距离
                const distance = Math.abs(x - 1) + Math.abs(y - 1);
                // 只考虑距离起点较远的位置作为目标点
                if (distance > GRID_SIZE / 2) {
                    validPositions.push({ x, y, distance });
                }
            }
        }
    }
    
    if (validPositions.length > 0) {
        // 按距离排序，选择距离最远的位置之一
        validPositions.sort((a, b) => b.distance - a.distance);
        const topPositions = validPositions.slice(0, Math.min(5, validPositions.length));
        const selectedPosition = topPositions[Math.floor(Math.random() * topPositions.length)];
        target.x = selectedPosition.x;
        target.y = selectedPosition.y;
    } else {
        // 如果没有找到合适的位置，使用默认位置并确保它是通路
        target.x = GRID_SIZE - 2;
        target.y = GRID_SIZE - 2;
        maze[target.y][target.x] = PATH;
    }
}

// 获取未访问的邻居
function getUnvisitedNeighbors(x, y, visited) {
    const neighbors = [];
    const directions = [
        { x: 0, y: -2 }, // 上
        { x: 2, y: 0 },  // 右
        { x: 0, y: 2 },  // 下
        { x: -2, y: 0 }  // 左
    ];
    
    for (const dir of directions) {
        const newX = x + dir.x;
        const newY = y + dir.y;
        
        if (newX > 0 && newX < GRID_SIZE - 1 && 
            newY > 0 && newY < GRID_SIZE - 1 && 
            maze[newY][newX] === WALL &&
            !visited.has(`${newX},${newY}`)) {
            neighbors.push({ x: newX, y: newY });
        }
    }
    
    return neighbors;
}

// 生成环路结构
function generateLoops() {
    const maxLoops = Math.floor(GRID_SIZE * 0.3); // 控制环路数量
    let loopCount = 0;
    
    for (let attempts = 0; attempts < maxLoops * 5 && loopCount < maxLoops; attempts++) {
        // 随机选择一个墙位置
        const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        
        // 确保是偶数坐标（墙的位置）
        const wallX = x % 2 === 0 ? x : x + 1;
        const wallY = y % 2 === 0 ? y : y + 1;
        
        if (wallX >= GRID_SIZE - 1 || wallY >= GRID_SIZE - 1) continue;
        if (maze[wallY][wallX] === PATH) continue;
        
        // 检查这个墙是否连接两个不同的通路区域
        if (canCreateLoop(wallX, wallY)) {
            maze[wallY][wallX] = PATH;
            loopCount++;
        }
    }
}

// 检查是否可以创建环路
function canCreateLoop(x, y) {
    // 检查水平墙
    if (x % 2 === 0 && y % 2 === 1) {
        const leftPath = (x > 0 && maze[y][x - 1] === PATH);
        const rightPath = (x < GRID_SIZE - 1 && maze[y][x + 1] === PATH);
        return leftPath && rightPath;
    }
    
    // 检查垂直墙
    if (x % 2 === 1 && y % 2 === 0) {
        const topPath = (y > 0 && maze[y - 1][x] === PATH);
        const bottomPath = (y < GRID_SIZE - 1 && maze[y + 1][x] === PATH);
        return topPath && bottomPath;
    }
    
    return false;
}

// 生成死胡同和分支路径
function generateDeadEnds() {
    const maxDeadEnds = Math.floor(GRID_SIZE * 1.2); // 增加死胡同数量
    let deadEndCount = 0;
    
    for (let attempts = 0; attempts < maxDeadEnds * 4 && deadEndCount < maxDeadEnds; attempts++) {
        // 随机选择一个墙位置
        const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        
        // 确保是奇数坐标（符合迷宫网格）
        const oddX = x % 2 === 1 ? x : x + 1;
        const oddY = y % 2 === 1 ? y : y + 1;
        
        if (oddX >= GRID_SIZE - 1 || oddY >= GRID_SIZE - 1) continue;
        if (maze[oddY][oddX] === PATH) continue;
        
        // 检查周围的通路数量
        const adjacentPaths = countAdjacentPaths(oddX, oddY);
        
        // 如果有1-2个相邻通路，可以创建死胡同或分支
        if (adjacentPaths >= 1 && adjacentPaths <= 2) {
            maze[oddY][oddX] = PATH;
            deadEndCount++;
        }
    }
}

// 计算相邻通路数量
function countAdjacentPaths(x, y) {
    const directions = [
        { x: 0, y: -1 }, // 上
        { x: 1, y: 0 },  // 右
        { x: 0, y: 1 },  // 下
        { x: -1, y: 0 }  // 左
    ];
    
    let pathCount = 0;
    for (const dir of directions) {
        const newX = x + dir.x;
        const newY = y + dir.y;
        
        if (newX >= 0 && newX < GRID_SIZE && 
            newY >= 0 && newY < GRID_SIZE && 
            maze[newY][newX] === PATH) {
            pathCount++;
        }
    }
    
    return pathCount;
}

// 验证从起点到终点是否存在路径（不要求唯一）
function verifyPathExists() {
    // 使用BFS查找从起点到终点是否存在路径
    const queue = [{ x: 1, y: 1 }];
    const visited = new Set();
    
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const key = `${x},${y}`;
        
        // 如果到达终点
        if (x === target.x && y === target.y) {
            return true;
        }
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        // 探索四个方向
        const directions = [
            { x: 0, y: -1 }, // 上
            { x: 1, y: 0 },  // 右
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }  // 左
        ];
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            const newKey = `${newX},${newY}`;
            
            if (newX >= 0 && newX < GRID_SIZE && 
                newY >= 0 && newY < GRID_SIZE && 
                maze[newY][newX] === PATH &&
                !visited.has(newKey)) {
                
                queue.push({ x: newX, y: newY });
            }
        }
    }
    
    // 没有找到路径
    return false;
}

// 验证从起点到终点是否存在唯一路径（保留原函数）
function verifyUniquePathExists() {
    // 使用BFS查找从起点到终点的所有可能路径
    const queue = [{ x: 1, y: 1, path: [[1, 1]] }];
    const visited = new Set();
    const allPaths = [];
    
    while (queue.length > 0) {
        const { x, y, path } = queue.shift();
        const key = `${x},${y}`;
        
        // 如果到达终点
        if (x === target.x && y === target.y) {
            allPaths.push(path);
            continue;
        }
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        // 探索四个方向
        const directions = [
            { x: 0, y: -1 }, // 上
            { x: 1, y: 0 },  // 右
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }  // 左
        ];
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            const newKey = `${newX},${newY}`;
            
            if (newX >= 0 && newX < GRID_SIZE && 
                newY >= 0 && newY < GRID_SIZE && 
                maze[newY][newX] === PATH &&
                !visited.has(newKey) &&
                !path.some(([px, py]) => px === newX && py === newY)) {
                
                queue.push({ 
                    x: newX, 
                    y: newY, 
                    path: [...path, [newX, newY]] 
                });
            }
        }
    }
    
    // 返回是否存在且仅存在一条路径
    return allPaths.length === 1;
}

// 生成钥匙
function generateKeys() {
    keys = []; // 清空现有钥匙
    
    // 获取所有可到达的通路位置
    const reachablePositions = getReachablePositions();
    
    // 过滤掉起点和终点附近的位置
    const validPositions = reachablePositions.filter(pos => {
        const distanceFromStart = Math.abs(pos.x - 1) + Math.abs(pos.y - 1);
        const distanceFromTarget = Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y);
        return distanceFromStart > 3 && distanceFromTarget > 3;
    });
    
    // 随机选择3个位置放置钥匙
    if (validPositions.length >= 3) {
        const shuffled = validPositions.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < 3; i++) {
            keys.push({
                x: shuffled[i].x,
                y: shuffled[i].y,
                type: KEY_TYPES[i].type,
                color: KEY_TYPES[i].color,
                collected: false
            });
        }
    }
}

// 获取所有可到达的位置
function getReachablePositions() {
    const reachable = [];
    const visited = new Set();
    const queue = [{ x: 1, y: 1 }];
    
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        reachable.push({ x, y });
        
        // 探索四个方向
        const directions = [
            { x: 0, y: -1 }, // 上
            { x: 1, y: 0 },  // 右
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }  // 左
        ];
        
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            const newKey = `${newX},${newY}`;
            
            if (newX >= 0 && newX < GRID_SIZE && 
                newY >= 0 && newY < GRID_SIZE && 
                maze[newY][newX] === PATH &&
                !visited.has(newKey)) {
                
                queue.push({ x: newX, y: newY });
            }
        }
    }
    
    return reachable;
}

// 检查钥匙收集
function checkKeyCollection() {
    keys.forEach(key => {
        if (!key.collected && key.x === player.x && key.y === player.y) {
            key.collected = true;
            collectedKeys[key.type] = true;
            
            // 显示收集提示
            showKeyCollectedMessage(key.type);
        }
    });
}

// 检查是否收集了所有钥匙
function hasAllKeys() {
    return collectedKeys.gold && collectedKeys.silver && collectedKeys.bronze;
}

// 显示钥匙收集提示
function showKeyCollectedMessage(keyType) {
    const keyNames = {
        gold: '金钥匙',
        silver: '银钥匙',
        bronze: '铜钥匙'
    };
    
    // 创建临时提示元素
    const message = document.createElement('div');
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    message.style.color = 'white';
    message.style.padding = '10px 20px';
    message.style.borderRadius = '5px';
    message.style.fontSize = '16px';
    message.style.zIndex = '1000';
    message.textContent = `获得了${keyNames[keyType]}！`;
    
    document.body.appendChild(message);
    
    // 2秒后移除提示
    setTimeout(() => {
        document.body.removeChild(message);
    }, 2000);
}

// 显示需要钥匙的提示
function showKeyRequiredMessage() {
    const missingKeys = [];
    if (!collectedKeys.gold) missingKeys.push('金钥匙');
    if (!collectedKeys.silver) missingKeys.push('银钥匙');
    if (!collectedKeys.bronze) missingKeys.push('铜钥匙');
    
    const message = document.createElement('div');
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    message.style.color = 'white';
    message.style.padding = '10px 20px';
    message.style.borderRadius = '5px';
    message.style.fontSize = '16px';
    message.style.zIndex = '1000';
    message.textContent = `需要收集所有钥匙才能通关！还缺少：${missingKeys.join('、')}`;
    
    document.body.appendChild(message);
    
    // 3秒后移除提示
    setTimeout(() => {
        document.body.removeChild(message);
    }, 3000);
}

// 处理键盘输入
function handleKeyPress(event) {
    if (gameWon) return;
    
    let newX = player.x;
    let newY = player.y;
    
    switch (event.key) {
        case 'ArrowUp':
            newY--;
            break;
        case 'ArrowDown':
            newY++;
            break;
        case 'ArrowLeft':
            newX--;
            break;
        case 'ArrowRight':
            newX++;
            break;
        default:
            return;
    }
    
    // 检查边界和碰撞
    if (newX >= 0 && newX < GRID_SIZE && 
        newY >= 0 && newY < GRID_SIZE && 
        maze[newY][newX] === PATH) {
        player.x = newX;
        player.y = newY;
        
        // 检查钥匙收集
        checkKeyCollection();
        
        // 检查是否到达目标
        if (player.x === target.x && player.y === target.y) {
            // 检查是否收集了所有钥匙
            if (hasAllKeys()) {
                gameWon = true;
                // 显示胜利提示并自动进入下一关
                showWinMessage();
                // 延迟2秒后自动生成新迷宫
                setTimeout(() => {
                    generateNewMaze();
                }, 2000);
            } else {
                // 显示需要收集钥匙的提示
                showKeyRequiredMessage();
            }
        }
    }
    
    event.preventDefault();
}

// 绘制像素玫瑰丛
function drawRoseBush(x, y, size) {
    // 使用固定种子来确保每个位置的玫瑰丛样式固定
    const seed = (x / size) * 1000 + (y / size);
    
    // 绘制深绿色背景（灌木丛基底）
    ctx.fillStyle = '#2d4a22';
    ctx.fillRect(x, y, size, size);
    
    // 绘制浅绿色叶子层
    ctx.fillStyle = '#3d5a32';
    const leafSize = size * 0.8;
    const leafOffset = size * 0.1;
    ctx.fillRect(x + leafOffset, y + leafOffset, leafSize, leafSize);
    
    // 绘制更浅的绿色叶子细节
    ctx.fillStyle = '#4d6a42';
    const innerLeafSize = size * 0.6;
    const innerLeafOffset = size * 0.2;
    ctx.fillRect(x + innerLeafOffset, y + innerLeafOffset, innerLeafSize, innerLeafSize);
    
    // 绘制固定位置的小玫瑰花朵（基于位置确定）
    const numRoses = Math.floor((seed % 3)) + 1; // 1-3朵玫瑰，但位置固定
    for (let i = 0; i < numRoses; i++) {
        const roseX = x + ((seed + i * 17) % (size - 6)) + 3;
        const roseY = y + ((seed + i * 23) % (size - 6)) + 3;
        
        // 绘制玫瑰花朵（更柔和的颜色）
        ctx.fillStyle = '#b85450'; // 更柔和的红色花朵
        ctx.beginPath();
        ctx.arc(roseX, roseY, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制花朵中心
        ctx.fillStyle = '#a04844'; // 稍深的红色中心
        ctx.beginPath();
        ctx.arc(roseX, roseY, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 绘制固定位置的刺（小深色点）
    ctx.fillStyle = '#1a2a1a';
    const numThorns = Math.floor((seed % 4)) + 2; // 2-5个刺，位置固定
    for (let i = 0; i < numThorns; i++) {
        const thornX = x + ((seed + i * 31) % size);
        const thornY = y + ((seed + i * 37) % size);
        ctx.fillRect(thornX, thornY, 1, 1);
    }
    
    // 添加固定位置的高光效果（更柔和的绿色点）
    ctx.fillStyle = '#5d7a52';
    const numHighlights = Math.floor((seed % 3)) + 1;
    for (let i = 0; i < numHighlights; i++) {
        const hlX = x + ((seed + i * 41) % (size - 2)) + 1;
        const hlY = y + ((seed + i * 43) % (size - 2)) + 1;
        ctx.fillRect(hlX, hlY, 1, 1);
    }
}

// 渲染游戏
function render() {
    // 清空画布（米白色背景）
    ctx.fillStyle = '#faf8f3';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // 绘制迷宫
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (maze[y][x] === WALL) {
                drawRoseBush(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE);
            }
        }
    }
    
    // 绘制网格线（可选）
    ctx.strokeStyle = '#e6ddd4';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // 绘制钥匙
    drawKeys();
    
    // 绘制目标（魔法传送门）
    const doorX = target.x * CELL_SIZE;
    const doorY = target.y * CELL_SIZE;
    const doorSize = CELL_SIZE;
    const centerX = doorX + doorSize / 2;
    const centerY = doorY + doorSize / 2;
    
    // 绘制外层光环（紫色渐变）
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, doorSize / 2);
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
    gradient.addColorStop(0.7, 'rgba(75, 0, 130, 0.6)');
    gradient.addColorStop(1, 'rgba(25, 25, 112, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, doorSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制内层传送门核心（蓝色发光）
    const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, doorSize / 3);
    innerGradient.addColorStop(0, 'rgba(0, 191, 255, 0.9)');
    innerGradient.addColorStop(0.5, 'rgba(30, 144, 255, 0.7)');
    innerGradient.addColorStop(1, 'rgba(0, 0, 139, 0.4)');
    
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, doorSize / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制旋转的能量粒子
    const time = Date.now() * 0.003;
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI / 3) + time;
        const radius = doorSize / 4;
        const particleX = centerX + Math.cos(angle) * radius;
        const particleY = centerY + Math.sin(angle) * radius;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + 0.2 * Math.sin(time * 2 + i)})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制中心星形光芒
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const startRadius = doorSize / 6;
        const endRadius = doorSize / 4;
        const startX = centerX + Math.cos(angle) * startRadius;
        const startY = centerY + Math.sin(angle) * startRadius;
        const endX = centerX + Math.cos(angle) * endRadius;
        const endY = centerY + Math.sin(angle) * endRadius;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
    }
    ctx.stroke();
    
    // 绘制玩家（像素球）
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(
        player.x * CELL_SIZE + CELL_SIZE / 2,
        player.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        2 * Math.PI
    );
    ctx.fill();
    
    // 添加球的高光效果
    ctx.fillStyle = '#5dade2';
    ctx.beginPath();
    ctx.arc(
        player.x * CELL_SIZE + CELL_SIZE / 2 - 3,
        player.y * CELL_SIZE + CELL_SIZE / 2 - 3,
        3,
        0,
        2 * Math.PI
    );
    ctx.fill();
}

// 绘制钥匙
function drawKeys() {
    const time = Date.now() * 0.002;
    
    keys.forEach(key => {
        if (!key.collected) {
            const keyX = key.x * CELL_SIZE + CELL_SIZE / 2;
            const keyY = key.y * CELL_SIZE + CELL_SIZE / 2;
            const keySize = CELL_SIZE * 1.2; // 增大钥匙尺寸
            
            // 添加浮动动画效果
            const floatOffset = Math.sin(time + key.x + key.y) * 3;
            const currentY = keyY + floatOffset;
            
            // 绘制发光光环（更大更明显）
            const glowGradient = ctx.createRadialGradient(keyX, currentY, 0, keyX, currentY, keySize / 1.5);
            glowGradient.addColorStop(0, `${key.color}A0`); // 更不透明
            glowGradient.addColorStop(0.5, `${key.color}60`);
            glowGradient.addColorStop(1, `${key.color}00`); // 完全透明
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(keyX, currentY, keySize / 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制钥匙主体（更立体的设计）
            // 钥匙柄（圆形）- 更大
            const handleGradient = ctx.createRadialGradient(
                keyX - keySize / 10, currentY - keySize / 2.5 - keySize / 10, 
                0, keyX, currentY - keySize / 2.5, keySize / 4
            );
            handleGradient.addColorStop(0, '#ffffff');
            handleGradient.addColorStop(0.3, key.color);
            handleGradient.addColorStop(1, key.color === '#FFD700' ? '#B8860B' : 
                                       key.color === '#C0C0C0' ? '#808080' : '#8B4513');
            
            ctx.fillStyle = handleGradient;
            ctx.beginPath();
            ctx.arc(keyX, currentY - keySize / 2.5, keySize / 4, 0, Math.PI * 2);
            ctx.fill();
            
            // 钥匙柄内圈
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(keyX, currentY - keySize / 2.5, keySize / 8, 0, Math.PI * 2);
            ctx.fill();
            
            // 钥匙杆（矩形）- 更粗更长
            const shaftGradient = ctx.createLinearGradient(
                keyX - keySize / 8, 0, keyX + keySize / 8, 0
            );
            shaftGradient.addColorStop(0, key.color === '#FFD700' ? '#B8860B' : 
                                      key.color === '#C0C0C0' ? '#808080' : '#8B4513');
            shaftGradient.addColorStop(0.5, key.color);
            shaftGradient.addColorStop(1, key.color === '#FFD700' ? '#B8860B' : 
                                       key.color === '#C0C0C0' ? '#808080' : '#8B4513');
            
            ctx.fillStyle = shaftGradient;
            ctx.fillRect(keyX - keySize / 16, currentY - keySize / 8, keySize / 8, keySize / 2);
            
            // 钥匙齿（更大更明显的设计）
            ctx.fillStyle = key.color;
            // 第一个齿
            ctx.fillRect(keyX + keySize / 16, currentY + keySize / 8, keySize / 5, keySize / 10);
            // 第二个齿
            ctx.fillRect(keyX + keySize / 16, currentY + keySize / 5, keySize / 6, keySize / 10);
            // 第三个齿
            ctx.fillRect(keyX + keySize / 16, currentY + keySize / 3.5, keySize / 7, keySize / 10);
            
            // 添加高光效果
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(keyX - keySize / 12, currentY - keySize / 2.5 - keySize / 12, 
                       keySize / 12, keySize / 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制旋转的星星粒子效果（更大更多）
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI / 3) + time * 2;
                const radius = keySize / 2.2;
                const starX = keyX + Math.cos(angle) * radius;
                const starY = currentY + Math.sin(angle) * radius;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + 0.3 * Math.sin(time * 3 + i)})`;
                drawStar(starX, starY, 3, 5, 2); // 更大的星星
            }
            
            // 钥匙类型标识已移除，不再显示金银铜文字
        }
    });
}

// 绘制星星的辅助函数
function drawStar(x, y, radius, points, innerRadius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? radius : innerRadius;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// 游戏主循环
function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

// 显示胜利消息
function showWinMessage() {
    // 在画布上显示胜利消息
    ctx.save();
    
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(248, 246, 240, 0.9)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // 绘制胜利文字
    ctx.fillStyle = '#8b4513';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    
    // 添加文字阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText('🎉 恭喜通关！', centerX, centerY - 30);
    
    // 绘制提示文字
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#5d4e37';
    ctx.fillText('正在准备下一关...', centerX, centerY + 20);
    
    ctx.restore();
}

// 显示胜利弹窗（保留原功能）
function showWinModal() {
    document.getElementById('winModal').style.display = 'block';
}

// 关闭胜利弹窗
function closeWinModal() {
    document.getElementById('winModal').style.display = 'none';
}

// 生成新迷宫（自动进入下一关）
function generateNewMaze() {
    // 重置游戏状态
    gameWon = false;
    player.x = 1;
    player.y = 1;
    
    // 生成新的迷宫
    generateMaze();
}

// 重置游戏
function resetGame() {
    player.x = 1;
    player.y = 1;
    gameWon = false;
    closeWinModal();
}

// 页面加载完成后初始化游戏
window.addEventListener('load', initGame);