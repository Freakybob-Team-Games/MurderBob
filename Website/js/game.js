// HomeScreen
document.getElementById('enableAudio').addEventListener('click', () => {
    const homemusic = document.getElementById('homemusic');
    const HomeScreen = document.querySelector('.HomeScreen');
    const enableAudioScreen = document.querySelector('.enableAudioScreen');
    HomeScreen.style.display = 'block';
    enableAudioScreen.style.display = 'none';
    const app = document.getElementById('app');
    homemusic.play();

    document.getElementById('startButton').addEventListener('click', () => {
        const Game = document.querySelector('.Game');
        HomeScreen.style.display = 'none';
        Game.style.display = 'block';
        startGame();
        homemusic.pause();
    });

    document.getElementById('quitButton').addEventListener('click', () => {
        window.alert('you need to press ctrl+w for it to work greg');
    });

    document.getElementById('leaderboardButton').addEventListener('click', () => {
        const Leaderboard = document.querySelector('.Leaderboard');
        HomeScreen.style.display = 'none';
        Leaderboard.style.display = 'block';
        app.style.backgroundColor = '#ffffff';
    });

    document.getElementById('backButton').addEventListener('click', () => {
        const Leaderboard = document.querySelector('.Leaderboard');
        HomeScreen.style.display = 'block';
        Leaderboard.style.display = 'none';
        app.style.backgroundColor = '#000000';
    });
});

// Game
function startGame() {
    const game = new Game();
}

class GamePanel {
    constructor(context, game) {
        this.context = context;
        this.game = game;
    }

    paintComponent() {
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        if (this.game.freakyBobSprite) {
            this.context.drawImage(this.game.freakyBobSprite, this.game.playerX, this.game.playerY, 52, 52);
        } else {
            this.context.fillStyle = 'red';
            this.context.fillRect(this.game.playerX, this.game.playerY, 32, 32);
        }

        this.game.bullets.forEach(bullet => bullet.draw(this.context));
        this.game.enemies.forEach(enemy => enemy.draw(this.context));
        this.game.perks.forEach(perk => perk.draw(this.context));

        this.context.fillStyle = 'white';
        this.context.fillText(`Health: ${this.game.playerHealth}`, 10, 20);
        this.context.fillText(`Current Wave: ${this.game.currentWave}`, 10, 40);

        if (this.game.preparing) {
            this.context.fillText(`Prepare! Time left: ${this.game.prepareTime}`, 10, 60);
        } else if (this.game.playerHealth <= 0) {
            this.context.fillText("Skill issue. Press R to Restart", 300, 300);
        }
    }
}

class Bullet {
    constructor(x, y, targetX, targetY, canvas) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.canvas = canvas;
        this.SPEED = 5;
        this.calculateDirection();
    }

    calculateDirection() {
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.velocityX = this.SPEED * Math.cos(angle);
        this.velocityY = this.SPEED * Math.sin(angle);
    }

    move() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    isOffScreen() {
        return (this.x < 0 || this.x > this.canvas.width || this.y < 0 || this.y > this.canvas.height);
    }

    intersects(enemy) {
        return this.x < enemy.x + 20 && this.x + 5 > enemy.x && this.y < enemy.y + 20 && this.y + 5 > enemy.y;
    }

    draw(context) {
        context.fillStyle = 'yellow';
        context.fillRect(this.x, this.y, 5, 5);
    }
}


class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.context = this.canvas.getContext('2d');
        this.bullets = [];
        this.enemies = [];
        this.perks = [];
        this.playerX = 400;
        this.playerY = 300;
        this.random = Math.random;
        this.upPressed = false;
        this.downPressed = false;
        this.leftPressed = false;
        this.rightPressed = false;
        this.isPaused = false;
        this.playerHealth = 100;
        this.currentWave = 0;
        this.preparing = true;
        this.prepareTime = 10;

        this.loadSprite();
        this.loadGunshotSound();
        this.playMusic();

        window.addEventListener('keydown', this.keyDownHandler.bind(this));
        window.addEventListener('keyup', this.keyUpHandler.bind(this));
        this.canvas.addEventListener('mousedown', this.mouseDownHandler.bind(this));

        this.timer = setInterval(this.gameLoop.bind(this), 20);

        this.gamePanel = new GamePanel(this.context, this);

        this.startPreparation();
    }

    keyDownHandler(e) {
        if (this.isPaused) {
            if (e.key === 'Escape') {
                this.resumeGame();
            }
            return;
        }
        if (e.key === 'Escape') {
            this.pauseGame();
        }
        if (e.key === ' ') {
            this.shoot();
        }
        if (e.key === 'ArrowUp' || e.key === 'w') {
            this.upPressed = true;
        }
        if (e.key === 'ArrowDown' || e.key === 's') {
            this.downPressed = true;
        }
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            this.leftPressed = true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            this.rightPressed = true;
        }
        if (e.key === 'r' && this.playerHealth <= 0) {
            this.restartGame();
        }
    }

    keyUpHandler(e) {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            this.upPressed = false;
        }
        if (e.key === 'ArrowDown' || e.key === 's') {
            this.downPressed = false;
        }
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            this.leftPressed = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            this.rightPressed = false;
        }
    }

    mouseDownHandler(e) {
        this.shoot(e.offsetX, e.offsetY);
    }

    loadSprite() {
        this.freakyBobSprite = new Image();
        this.freakyBobSprite.src = 'Assets/Freakybob.png';
        this.freakyBobSprite.onload = () => {
            console.log('Sprite loaded');
        };
    }

    loadGunshotSound() {
        try {
            this.gunshotSound = new Audio('Assets/gunshot.wav');
        } catch (e) {
            console.error("Error loading gunshot sound: " + e.message);
        }
    }

    playGunshotSound() {
        if (this.gunshotSound) {
            this.gunshotSound.currentTime = 0;
            this.gunshotSound.play();
        }
    }

    playMusic() {
        try {
            this.music = new Audio('Assets/awesome_ass_music_David_Fesliyan.wav');
            this.music.loop = true;
            this.music.play();
        } catch (e) {
            console.error("Error playing music: " + e.message);
        }
    }

    shoot(targetX, targetY) {
        const bulletX = this.playerX + 26;
        const bulletY = this.playerY + 26;
        this.bullets.push(new Bullet(bulletX, bulletY, targetX, targetY, this.canvas));
        this.playGunshotSound();
    }

    startPreparation() {
        let secondsRemaining = this.prepareTime;
        const interval = setInterval(() => {
            if (secondsRemaining > 0) {
                secondsRemaining--;
                this.prepareTime = secondsRemaining;
            } else {
                this.preparing = false;
                clearInterval(interval);
                this.spawnEnemies();
                this.spawnPerk();
            }
            this.gamePanel.paintComponent();
        }, 1000);
    }

    spawnEnemies() {
        const enemyCount = Math.min(3 + Math.floor(this.currentWave / 2), 20);
        this.enemies = [];
        for (let i = 0; i < enemyCount; i++) {
            const enemyX = Math.floor(Math.random() * this.canvas.width);
            const enemyY = Math.floor(Math.random() * this.canvas.height);
            this.enemies.push(new Enemy(enemyX, enemyY));
        }
        this.currentWave++;
    }

    restartGame() {
        this.playerHealth = 100;
        this.currentWave = 0;
        this.preparing = true;
        this.prepareTime = 10;
        this.bullets = [];
        this.enemies = [];
        this.perks = [];
        this.playerX = 400;
        this.playerY = 300;
        this.startPreparation();
        this.timer = setInterval(this.gameLoop.bind(this), 20);
    }

    spawnPerk() {
        const perkX = Math.floor(Math.random() * (this.canvas.width - 32));
        const perkY = Math.floor(Math.random() * (this.canvas.height - 32));
        const perkType = Math.floor(Math.random() * 2);
        this.perks.push(new Perk(perkX, perkY, perkType));
    }

    pauseGame() {
        this.isPaused = true;
        clearInterval(this.timer);
    }

    resumeGame() {
        this.isPaused = false;
        this.timer = setInterval(this.gameLoop.bind(this), 20);
    }

    gameLoop() {
        if (this.playerHealth <= 0) {
            clearInterval(this.timer);
            this.gamePanel.paintComponent();
            return;
        }

        let newPlayerX = this.playerX;
        let newPlayerY = this.playerY;

        if (this.upPressed) {
            newPlayerY -= 5;
        }
        if (this.downPressed) {
            newPlayerY += 5;
        }
        if (this.leftPressed) {
            newPlayerX -= 5;
        }
        if (this.rightPressed) {
            newPlayerX += 5;
        }

        if (newPlayerX < 0) newPlayerX = 0;
        if (newPlayerX + 52 > this.canvas.width) newPlayerX = this.canvas.width - 52;
        if (newPlayerY < 0) newPlayerY = 0;
        if (newPlayerY + 52 > this.canvas.height) newPlayerY = this.canvas.height - 52;

        this.playerX = newPlayerX;
        this.playerY = newPlayerY;

        if (!this.preparing) {
            this.bullets.forEach((bullet, i) => {
                bullet.move();
                if (bullet.isOffScreen()) {
                    this.bullets.splice(i, 1);
                } else {
                    this.enemies.forEach((enemy, j) => {
                        if (bullet.intersects(enemy)) {
                            this.bullets.splice(i, 1);
                            this.enemies.splice(j, 1);
                        }
                    });
                }
            });

            this.enemies.forEach((enemy, i) => {
                enemy.moveTowards(this.playerX, this.playerY);
                if (enemy.intersects(this.playerX, this.playerY)) {
                    this.playerHealth -= 7;
                    this.enemies.splice(i, 1);
                }
            });

            this.perks.forEach((perk, i) => {
                if (perk.intersects(this.playerX, this.playerY)) {
                    perk.applyPerk(this);
                    this.perks.splice(i, 1);
                }
            });

            if (this.enemies.length === 0) {
                this.preparing = true;
                this.startPreparation();
            }
        }

        this.gamePanel.paintComponent();
    }

    increaseHealth(amount) {
        this.playerHealth += amount;
        if (this.playerHealth > 100) {
            this.playerHealth = 100;
        }
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.SPEED = 2;
        this.enemySprite = null;
        this.loadSprite();
    }

    loadSprite() {
        this.enemySprite = new Image();
        this.enemySprite.src = 'Assets/Enemy.png';
        this.enemySprite.onerror = (e) => {
            console.error("Error loading enemy sprite: " + e.message);
        };
    }

    moveTowards(playerX, playerY) {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.x += this.SPEED * Math.cos(angle);
        this.y += this.SPEED * Math.sin(angle);
    }

    draw(context) {
        if (this.enemySprite && this.enemySprite.complete) {
            context.drawImage(this.enemySprite, this.x, this.y, 32, 32);
        } else {
            context.fillStyle = 'green';
            context.fillRect(this.x, this.y, 20, 20);
        }
    }

    intersects(playerX, playerY) {
        return this.x < playerX + 52 && this.x + 32 > playerX && this.y < playerY + 52 && this.y + 32 > playerY;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }
}


class Perk {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.image = null;
        this.imageLoaded = false;
        this.loadImage();
    }

    loadImage() {
        this.image = new Image();
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = (e) => {
            console.error("Error loading perk image: " + e.message);
        };
        if (this.type === 0) {
            this.image.src = 'Assets/green-marijuana-leaf-png_252592.jpg';
        } else if (this.type === 1) {
            /*this.image.src = 'Assets/speed_perk.png'; TO BE CONTINUED*/
            this.image.src = 'Assets/green-marijuana-leaf-png_252592.jpg';
        }
    }

    draw(context) {
        if (this.imageLoaded) {
            context.drawImage(this.image, this.x, this.y, 32, 32);
        } else {
            context.fillStyle = 'blue';
            context.fillRect(this.x, this.y, 10, 10);
        }
    }

    intersects(playerX, playerY) {
        return this.x < playerX + 52 && this.x + 32 > playerX && this.y < playerY + 52 && this.y + 32 > playerY;
    }

    applyPerk(game) {
        if (this.type === 0) {
            game.increaseHealth(20);
        } else if (this.type === 1) {

        }
    }
}
