import { Point, BonusFood, GameSpeed } from '../types';

export const GRID_COLS = 24;
export const GRID_ROWS = 18;

export interface EngineConfig {
  speed: GameSpeed;
  walls: boolean;
}

export interface EngineState {
  snake: Point[];
  direction: Point;
  food: Point;
  bonus: BonusFood | null;
  score: number;
  foodsEaten: number;
  isAlive: boolean;
  isPaused: boolean;
  tickIntervalMs: number;
}

export interface TickResult {
  moved: boolean;
  ateFood: boolean;
  ateBonus: boolean;
  bonusSpawned: boolean;
  leveledUp: boolean;
  level: number;
  died: boolean;
  deathReason?: 'wall' | 'self';
}

export class SnakeEngine {
  public snake: Point[] = [];
  public direction: Point = { x: 1, y: 0 };
  private inputQueue: Point[] = [];
  public food: Point = { x: 16, y: 9 };
  public bonus: BonusFood | null = null;
  public score: number = 0;
  public foodsEaten: number = 0;
  public isAlive: boolean = true;
  public isPaused: boolean = false;
  public config: EngineConfig;
  public tickIntervalMs: number = 110;

  public get level(): number {
    return Math.floor(this.foodsEaten / 10) + 1;
  }

  public get levelProgress(): number {
    return this.foodsEaten % 10;
  }

  public get foodsToNextLevel(): number {
    return 10 - (this.foodsEaten % 10);
  }

  constructor(config: EngineConfig) {
    this.config = config;
    this.reset();
  }

  public reset() {
    const midX = Math.floor(GRID_COLS / 2);
    const midY = Math.floor(GRID_ROWS / 2);

    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
      { x: midX - 3, y: midY },
    ];
    this.direction = { x: 1, y: 0 };
    this.inputQueue = [];
    this.score = 0;
    this.foodsEaten = 0;
    this.isAlive = true;
    this.isPaused = false;
    this.bonus = null;
    this.updateSpeed();
    this.spawnFood();
  }

  private updateSpeed() {
    // Progressive challenge: Each level (every 10 foods) increases the speed automatically
    const levelIndex = this.level - 1; // 0 for level 1, 1 for level 2, etc.

    switch (this.config.speed) {
      case 'slow':
        // Base 150ms, decreases by 10ms per level down to 50ms
        this.tickIntervalMs = Math.max(50, 150 - levelIndex * 10);
        break;
      case 'normal':
        // Base 110ms, decreases by 8ms per level down to 38ms
        this.tickIntervalMs = Math.max(38, 110 - levelIndex * 8);
        break;
      case 'fast':
        // Base 75ms, decreases by 6ms per level down to 30ms
        this.tickIntervalMs = Math.max(30, 75 - levelIndex * 6);
        break;
      case 'extreme':
        // Dynamic speed based on both level and foods eaten
        this.tickIntervalMs = Math.max(28, 115 - levelIndex * 12 - (this.foodsEaten % 10) * 1.2);
        break;
    }
  }

  public queueDirection(newDir: Point): boolean {
    if (!this.isAlive || this.isPaused) return false;

    // Determine reference direction (either the last queued direction or current direction)
    const lastDir = this.inputQueue.length > 0 ? this.inputQueue[this.inputQueue.length - 1] : this.direction;

    // Prevent immediate 180-degree reversal
    if (newDir.x === -lastDir.x && newDir.y === -lastDir.y) {
      return false;
    }

    // Ignore exact duplicates
    if (newDir.x === lastDir.x && newDir.y === lastDir.y) {
      return false;
    }

    // Keep input queue short (maximum 2 pending directions)
    if (this.inputQueue.length < 2) {
      this.inputQueue.push(newDir);
      return true;
    }
    return false;
  }

  public spawnFood() {
    const occupied = new Set<string>();
    this.snake.forEach((p) => occupied.add(`${p.x},${p.y}`));
    if (this.bonus) {
      occupied.add(`${this.bonus.x},${this.bonus.y}`);
    }

    const freeSpots: Point[] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      for (let y = 0; y < GRID_ROWS; y++) {
        if (!occupied.has(`${x},${y}`)) {
          freeSpots.push({ x, y });
        }
      }
    }

    if (freeSpots.length === 0) {
      // Victory / Filled whole screen!
      return;
    }

    const picked = freeSpots[Math.floor(Math.random() * freeSpots.length)];
    this.food = picked;
  }

  public spawnBonus() {
    const occupied = new Set<string>();
    this.snake.forEach((p) => occupied.add(`${p.x},${p.y}`));
    occupied.add(`${this.food.x},${this.food.y}`);

    const freeSpots: Point[] = [];
    for (let x = 1; x < GRID_COLS - 1; x++) {
      for (let y = 1; y < GRID_ROWS - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          freeSpots.push({ x, y });
        }
      }
    }

    if (freeSpots.length > 0) {
      const picked = freeSpots[Math.floor(Math.random() * freeSpots.length)];
      const types: ('bug' | 'mouse' | 'fly')[] = ['bug', 'mouse', 'fly'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const maxTicks = 40;

      this.bonus = {
        x: picked.x,
        y: picked.y,
        type: chosenType,
        points: 50,
        timeLeft: maxTicks,
        maxTime: maxTicks,
      };
    }
  }

  public tick(): TickResult {
    const result: TickResult = {
      moved: false,
      ateFood: false,
      ateBonus: false,
      bonusSpawned: false,
      leveledUp: false,
      level: this.level,
      died: false,
    };

    if (!this.isAlive || this.isPaused) {
      return result;
    }

    // Dequeue next direction if available
    if (this.inputQueue.length > 0) {
      const nextDir = this.inputQueue.shift()!;
      // Double check not reversing
      if (!(nextDir.x === -this.direction.x && nextDir.y === -this.direction.y)) {
        this.direction = nextDir;
      }
    }

    // Manage bonus creature timer
    if (this.bonus) {
      this.bonus.timeLeft--;
      if (this.bonus.timeLeft <= 0) {
        this.bonus = null;
      } else {
        // Points degrade as time ticks down
        this.bonus.points = Math.max(10, Math.floor((this.bonus.timeLeft / this.bonus.maxTime) * 50));
      }
    }

    // Calculate new head position
    const head = this.snake[0];
    let nextX = head.x + this.direction.x;
    let nextY = head.y + this.direction.y;

    // Handle Wall Collision vs Wrap-around
    if (this.config.walls) {
      if (nextX < 0 || nextX >= GRID_COLS || nextY < 0 || nextY >= GRID_ROWS) {
        this.isAlive = false;
        result.died = true;
        result.deathReason = 'wall';
        return result;
      }
    } else {
      // Wrap-around mode (Snake 2 style)
      if (nextX < 0) nextX = GRID_COLS - 1;
      else if (nextX >= GRID_COLS) nextX = 0;

      if (nextY < 0) nextY = GRID_ROWS - 1;
      else if (nextY >= GRID_ROWS) nextY = 0;
    }

    const newHead: Point = { x: nextX, y: nextY };

    // Check Self-Collision (skip tail segment if we aren't eating, because tail will move)
    const isEatingFood = newHead.x === this.food.x && newHead.y === this.food.y;
    const bodyCheckLength = isEatingFood ? this.snake.length : this.snake.length - 1;

    for (let i = 0; i < bodyCheckLength; i++) {
      if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
        this.isAlive = false;
        result.died = true;
        result.deathReason = 'self';
        return result;
      }
    }

    // Move snake head forward
    this.snake.unshift(newHead);
    result.moved = true;

    // Check if eating regular food
    if (isEatingFood) {
      result.ateFood = true;
      const prevLevel = this.level;
      this.foodsEaten++;
      const currentLevel = this.level;

      if (currentLevel > prevLevel) {
        result.leveledUp = true;
      }
      result.level = currentLevel;

      // Speed multiplier
      let multiplier = 1;
      if (this.config.speed === 'normal') multiplier = 1.5;
      else if (this.config.speed === 'fast') multiplier = 2;
      else if (this.config.speed === 'extreme') multiplier = 2.5;

      const levelMultiplier = 1 + (currentLevel - 1) * 0.1;
      const baseScore = Math.round(10 * multiplier * levelMultiplier);
      this.score += baseScore;

      this.updateSpeed();
      this.spawnFood();

      // Bonus creature spawn every 5 foods
      if (this.foodsEaten % 5 === 0 && !this.bonus) {
        this.spawnBonus();
        result.bonusSpawned = true;
      }
    } else {
      // Check if eating bonus creature
      if (this.bonus && newHead.x === this.bonus.x && newHead.y === this.bonus.y) {
        result.ateBonus = true;
        this.score += this.bonus.points;
        this.bonus = null;
      }
      // Remove tail segment since no regular food was eaten
      this.snake.pop();
    }

    return result;
  }
}
