import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SnakesGame.css'; // Importa o CSS que criamos acima

const GRID_SIZE = 20;
const CANVAS_SIZE = 420;

const SnakeGame = () => {
  // --- ESTADOS (O que muda na tela) ---
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(true);

  // --- REFS (Variáveis do jogo que não redesenham a tela) ---
  const canvasRef = useRef(null);
  // Cobra começa no meio
  const snakeRef = useRef([{ x: 200, y: 200 }, { x: 200, y: 220 }]);
  const foodRef = useRef({ x: 100, y: 100, dx: GRID_SIZE, dy: GRID_SIZE });
  const directionRef = useRef({ dx: 0, dy: -GRID_SIZE }); 
  const blinkCounterRef = useRef(0);
  const gameLoopRef = useRef(null);

  // Carregar High Score ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Função para gerar comida aleatória
  const generateFoodPosition = useCallback(() => {
    while (true) {
      let newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE,
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE,
      };
      
      // Verifica se não caiu em cima da cobra
      const collision = snakeRef.current.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );

      if (!collision) return newFood;
    }
  }, []);

  // Reiniciar Jogo
  const initializeGame = useCallback(() => {
    const startX = Math.floor(CANVAS_SIZE / 2 / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(CANVAS_SIZE / 2 / GRID_SIZE) * GRID_SIZE;

    snakeRef.current = [
      { x: startX, y: startY },
      { x: startX, y: startY + GRID_SIZE },
    ];

    foodRef.current = {
      ...generateFoodPosition(),
      dx: (Math.random() < 0.5 ? 1 : -1) * GRID_SIZE,
      dy: (Math.random() < 0.5 ? 1 : -1) * GRID_SIZE,
    };

    directionRef.current = { dx: 0, dy: -GRID_SIZE };
    blinkCounterRef.current = 0;

    setScore(0);
    setIsGameOver(false);
    setIsGameRunning(true);
  }, [generateFoodPosition]);

  // Função de Game Over
  const handleGameOver = useCallback(() => {
    setIsGameRunning(false);
    setIsGameOver(true);

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score);
    }
  }, [score, highScore]);

  // --- LOOP PRINCIPAL (Onde a mágica acontece) ---
  const gameStep = useCallback(() => {
    if (!canvasRef.current || !isGameRunning) return;
    
    const ctx = canvasRef.current.getContext('2d');

    // 1. Atualizar posições
    const head = { 
        x: snakeRef.current[0].x + directionRef.current.dx, 
        y: snakeRef.current[0].y + directionRef.current.dy 
    };

    // Colisão com paredes ou corpo
    if (
        head.x < 0 || head.x >= CANVAS_SIZE ||
        head.y < 0 || head.y >= CANVAS_SIZE ||
        snakeRef.current.some(seg => seg.x === head.x && seg.y === head.y)
    ) {
        handleGameOver();
        return;
    }

    snakeRef.current.unshift(head);

    // Comer comida
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(prev => prev + 1);
        foodRef.current = {
            ...generateFoodPosition(),
            dx: (Math.random() < 0.5 ? 1 : -1) * GRID_SIZE,
            dy: (Math.random() < 0.5 ? 1 : -1) * GRID_SIZE,
        };
    } else {
        snakeRef.current.pop();
    }

    // Movimento da Comida (Snake Pong)
    blinkCounterRef.current++;
    if (blinkCounterRef.current % 4 === 0) {
        let f = foodRef.current;
        f.x += f.dx;
        f.y += f.dy;

        if (f.x < 0) { f.dx = -f.dx; f.x = 0; }
        if (f.x >= CANVAS_SIZE) { f.dx = -f.dx; f.x = CANVAS_SIZE - GRID_SIZE; }
        if (f.y < 0) { f.dy = -f.dy; f.y = 0; }
        if (f.y >= CANVAS_SIZE) { f.dy = -f.dy; f.y = CANVAS_SIZE - GRID_SIZE; }
    }

    // 2. Desenhar na tela
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid (Opcional - Estilo Visual)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    // ... código do grid se quiser ...

    // Cobra
    snakeRef.current.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4CAF50' : '#2E7D32';
        ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
    });

    // Comida
    ctx.fillStyle = 'red';
    ctx.fillRect(foodRef.current.x, foodRef.current.y, GRID_SIZE, GRID_SIZE);

  }, [isGameRunning, generateFoodPosition, handleGameOver]);

  // Iniciar Loop
  useEffect(() => {
    if (isGameRunning) {
        gameLoopRef.current = setInterval(gameStep, 120);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [isGameRunning, gameStep]);

  // Controles
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (isGameOver && e.key === 'Enter') {
            initializeGame();
            return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }

        const { dx, dy } = directionRef.current;
        switch (e.key) {
            case 'ArrowUp': if (dy === 0) directionRef.current = { dx: 0, dy: -GRID_SIZE }; break;
            case 'ArrowDown': if (dy === 0) directionRef.current = { dx: 0, dy: GRID_SIZE }; break;
            case 'ArrowLeft': if (dx === 0) directionRef.current = { dx: -GRID_SIZE, dy: 0 }; break;
            case 'ArrowRight': if (dx === 0) directionRef.current = { dx: GRID_SIZE, dy: 0 }; break;
            default: break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, initializeGame]);

  return (
    <div className="game-container">
      <div className="header">
        <h1>Snake Pong</h1>
        <div className="scores">
          <div>Score: <span>{score}</span></div>
          <div>High Score: <span>{highScore}</span></div>
        </div>
      </div>

      <div className="canvas-container">
        <canvas 
            ref={canvasRef} 
            width={CANVAS_SIZE} 
            height={CANVAS_SIZE}
        />

        {isGameOver && (
          <div className="game-over-screen">
            <h2>Game Over!</h2>
            <p>You lost.</p>
            <button className="restart-btn" onClick={initializeGame}>
              Restart Game
            </button>
            <p style={{marginTop: '10px', fontSize: '12px'}}>Press ENTER to restart</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;