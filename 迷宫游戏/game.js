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
    
    // 递归回溯生成迷宫
    const stack = [];
    const startX = 1;
    const startY = 1;
    
    maze[startY][startX] = PATH;
    stack.push({ x: startX, y: startY });
    
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(current.x, current.y);
        
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // 移除当前单元格和选择的邻居之间的墙
            const wallX = current.x + (next.x - current.x) / 2;
            const wallY = current.y + (next.y - current.y) / 2;
            
            maze[wallY][wallX] = PATH;
            maze[next.y][next.x] = PATH;
            
            stack.push(next);
        } else {
            stack.pop();
        }
    }
    
    // 确保起点是通路
    maze[1][1] = PATH;
    
    // 寻找一个合适的终点位置（必须在通路上且距离起点较远）
    findValidTargetPosition();
    
    // 重置玩家位置
    player.x = 1;
    player.y = 1;
    gameWon = false;
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
function getUnvisitedNeighbors(x, y) {
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
            maze[newY][newX] === WALL) {
            neighbors.push({ x: newX, y: newY });
        }
    }
    
    return neighbors;
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
        
        // 检查是否到达目标
        if (player.x === target.x && player.y === target.y) {
            gameWon = true;
            showWinModal();
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
    
    // 绘制目标（小红旗）
    ctx.fillStyle = '#e74c3c';
    const flagX = target.x * CELL_SIZE + CELL_SIZE / 2;
    const flagY = target.y * CELL_SIZE + CELL_SIZE / 2;
    
    // 绘制旗杆
    ctx.fillRect(flagX - 1, flagY - 8, 2, 16);
    
    // 绘制旗帜
    ctx.beginPath();
    ctx.moveTo(flagX + 1, flagY - 8);
    ctx.lineTo(flagX + 8, flagY - 5);
    ctx.lineTo(flagX + 1, flagY - 2);
    ctx.closePath();
    ctx.fill();
    
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

// 游戏主循环
function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

// 显示胜利弹窗
function showWinModal() {
    document.getElementById('winModal').style.display = 'block';
}

// 关闭胜利弹窗
function closeWinModal() {
    document.getElementById('winModal').style.display = 'none';
}

// 生成新迷宫
function generateNewMaze() {
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