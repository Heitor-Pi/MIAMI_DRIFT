/**
 * OMODA FLY MIAMI - 8-Bit Retro Arcade Game
 * Inspired by Flappy Bird with an automotive OMODA 5 theme.
 * Pure Vanilla HTML5 & CSS3 - No external dependencies.
 */

(function () {
  'use strict';

  // ==========================================
  // 1. ÁUDIO SINTETIZADO RETRO (Web Audio API)
  // ==========================================
  class SoundEffects {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('omoda_sound_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.muted = !this.muted;
      localStorage.setItem('omoda_sound_muted', this.muted);
      return !this.muted;
    }

    playJump() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    }

    playScore() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [
        { f: 587.33, t: 0 },    // D5
        { f: 880.00, t: 0.08 }  // A5
      ].forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.18, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + 0.13);
      });
    }

    playCrash() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.35);
    }

    playStart() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [330, 440, 554, 660]; // E4, A4, C#5, E5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.12);
      });
    }
  }

  // ==========================================
  // 2. DESENHO PIXEL-ART DO CARRO OMODA 5
  // ==========================================
  // OMODA 5: Crossover cupê futurista com teto flutuante,
  // grade geométrica diamantada e DRLs afiladas.
  function renderOmoda5(ctx, x, y, angle, flamePhase, isBoosting) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const px = 2; // Tamanho do pixel virtual

    // ----------------------------------------
    // FOGO DO TURBO / EXHAUST FLAME (Na traseira)
    // ----------------------------------------
    const flameLen = isBoosting ? (18 + (flamePhase % 8) * 2) : (10 + (flamePhase % 4) * 2);
    const flameY = 2;

    // Fogo externo (Laranja/Vermelho synthwave)
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(-26 - flameLen, flameY - 3, flameLen, 8);

    // Fogo intermediário (Amarelo neon)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-24 - flameLen * 0.7, flameY - 1, flameLen * 0.7, 5);

    // Núcleo do jato (Branco/Ciano plasma)
    ctx.fillStyle = isBoosting ? '#00f0ff' : '#ffffff';
    ctx.fillRect(-22 - flameLen * 0.4, flameY, flameLen * 0.4, 3);

    // ----------------------------------------
    // CORPO PRINCIPAL DO OMODA 5 (Pixel Art)
    // ----------------------------------------
    // Dimensões do carro: ~50px de largura x 22px de altura

    // Sombra inferior do veículo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-20, 12, 42, 3);

    // Base inferior / Saias esportivas com friso Laranja OMODA
    ctx.fillStyle = '#1e222a';
    ctx.fillRect(-20, 9, 44, 4);
    // Detalhe esportivo vermelho/laranja OMODA nas laterais
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(-14, 10, 30, 2);

    // Rodas aerodinâmicas futuristas (Aros diamantados)
    function drawWheel(wx, wy) {
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(wx - 5, wy - 5, 10, 10);
      ctx.fillStyle = '#3a4454';
      ctx.fillRect(wx - 4, wy - 4, 8, 8);
      // Roda diamantada / miolo ciano
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(wx - 2, wy - 2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(wx - 1, wy - 1, 2, 2);
    }
    drawWheel(-12, 11);
    drawWheel(16, 11);

    // Lataria Principal (Turquesa Metálico / Ciano Moderno OMODA)
    ctx.fillStyle = '#00c2cb';
    ctx.fillRect(-20, 2, 44, 8);
    // Tom claro da lataria (brilho superior)
    ctx.fillStyle = '#38e8f2';
    ctx.fillRect(-18, 2, 40, 2);

    // Grade Frontal Geométrica Diamantada (Assinatura OMODA 5)
    ctx.fillStyle = '#161922';
    ctx.fillRect(20, 4, 5, 6);
    ctx.fillStyle = '#d4e2f4'; // Pontos diamantados
    ctx.fillRect(21, 5, 1, 1);
    ctx.fillRect(23, 5, 1, 1);
    ctx.fillRect(22, 7, 1, 1);
    ctx.fillRect(24, 7, 1, 1);
    ctx.fillRect(21, 9, 1, 1);

    // Faróis Afilados DRLs Superiores (LED Fino)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 2, 7, 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(16, 3, 4, 1);

    // Faróis Principais inferiores OMODA
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, 5, 3, 2);

    // Traseira & Lanterna em barra contínua de LED vermelha
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(-22, 3, 3, 3);
    ctx.fillStyle = '#ff3388';
    ctx.fillRect(-21, 4, 2, 1);

    // Teto Flutuante Preto (Black Roof) & Colunas
    ctx.fillStyle = '#0d1117';
    // Coluna A (inclinada para frente)
    ctx.fillRect(5, -4, 4, 7);
    // Coluna B (centro)
    ctx.fillRect(-4, -5, 3, 8);
    // Coluna C fastback cupê (inclinada)
    ctx.fillRect(-16, -4, 5, 7);
    // Teto aerodinâmico
    ctx.fillRect(-14, -6, 22, 3);

    // Vidros Fumê Futuristas com Reflexo Ciano
    ctx.fillStyle = '#102236';
    ctx.fillRect(-11, -3, 6, 6); // Traseiro
    ctx.fillRect(-1, -3, 8, 6);  // Dianteiro
    // Linha de reflexo no vidro
    ctx.fillStyle = '#5eead4';
    ctx.fillRect(-9, -2, 3, 1);
    ctx.fillRect(1, -2, 5, 1);

    // Retrovisor esportivo com detalhe laranja
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(4, 2, 3, 2);
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(4, 2, 1, 1);

    // Aerofólio Traseiro Esportivo OMODA
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(-21, -6, 5, 2);
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(-22, -6, 2, 1);

    ctx.restore();
  }

  // ==========================================
  // 3. CENÁRIO DE MIAMI (PARALLAX LAYERS)
  // ==========================================
  class MiamiSkyline {
    constructor(canvasWidth, canvasHeight) {
      this.width = canvasWidth;
      this.height = canvasHeight;

      this.bgOffset = 0;
      this.midOffset = 0;
      this.fgOffset = 0;
      this.sunY = 150;
      this.wavePhase = 0;

      // Prédios distantes (Silhueta Miami)
      this.distantBuildings = this.generateBuildings(18, 30, 90, 160, 260);
      // Prédios Art Deco coloridos (Camada média)
      this.decoBuildings = this.generateBuildings(14, 40, 75, 110, 190);
    }

    generateBuildings(count, minW, maxW, minH, maxH) {
      const list = [];
      let curX = 0;
      const colors = ['#2a0845', '#1e0836', '#3b0d61', '#4b127b'];
      const decoColors = [
        { main: '#ff007f', win: '#00f0ff' }, // Rosa / Ciano
        { main: '#00c2cb', win: '#ffe600' }, // Turquesa / Amarelo
        { main: '#7928ca', win: '#00f0ff' }, // Roxo Neon
        { main: '#ff7700', win: '#ffffff' }  // Laranja Sunset
      ];

      for (let i = 0; i < count; i++) {
        const w = minW + Math.floor(Math.random() * (maxW - minW));
        const h = minH + Math.floor(Math.random() * (maxH - minH));
        const col = colors[i % colors.length];
        const deco = decoColors[i % decoColors.length];
        const hasAntenna = Math.random() > 0.4;
        const antennaH = 15 + Math.floor(Math.random() * 25);
        list.push({ x: curX, w, h, col, deco, hasAntenna, antennaH });
        curX += w - 4;
      }
      return { list, totalWidth: curX };
    }

    update(speed) {
      this.bgOffset = (this.bgOffset + speed * 0.25) % this.distantBuildings.totalWidth;
      this.midOffset = (this.midOffset + speed * 0.75) % this.decoBuildings.totalWidth;
      this.fgOffset = (this.fgOffset + speed * 2) % 40;
      this.wavePhase += 0.05;
    }

    draw(ctx) {
      const W = this.width;
      const H = this.height;

      // 1. Céu Sunset Synthwave (Gradiente Vibrante de Miami)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
      skyGrad.addColorStop(0, '#1c053a');    // Roxo espacial
      skyGrad.addColorStop(0.3, '#3d0a64');  // Magenta escuro
      skyGrad.addColorStop(0.55, '#89136f'); // Rosa choque Miami
      skyGrad.addColorStop(0.75, '#d63447'); // Laranja pôr do sol
      skyGrad.addColorStop(0.92, '#f57b21'); // Laranja dourado
      skyGrad.addColorStop(1, '#ffc72c');    // Amarelo quente horizonte
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Sol Retrô de Miami com Linhas Synthwave
      this.drawRetroSun(ctx, W * 0.5, H * 0.38, 56);

      // 3. Nuvenzinhas Pixeladas Roxas/Rosas
      this.drawPixelClouds(ctx);

      // 4. Silhueta de Prédios Distantes (Layer 1)
      this.drawDistantSkyline(ctx, H * 0.75);

      // 5. Prédios Art Deco Médios com Luzes Neon (Layer 2)
      this.drawArtDecoSkyline(ctx, H * 0.75);

      // 6. Mar de Miami com Ondas e Reflexos Neon (Layer 3)
      this.drawMiamiOcean(ctx, H * 0.75, H * 0.90);

      // 7. Orla de Ocean Drive com Palmeiras e Pista (Layer 4)
      this.drawOceanDrive(ctx, H * 0.90, H);
    }

    drawRetroSun(ctx, cx, cy, r) {
      ctx.save();
      // Gradiente do Sol (Amarelo Neon ao Laranja)
      const sunGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      sunGrad.addColorStop(0, '#ffff55');
      sunGrad.addColorStop(0.6, '#ff9900');
      sunGrad.addColorStop(1, '#ff0055');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Cortes horizontais estilo Synthwave 80s
      ctx.fillStyle = '#89136f';
      const slices = 6;
      for (let i = 0; i < slices; i++) {
        const sliceY = cy + (r * 0.15) + (i * 7);
        const sliceH = 2 + (i * 0.8);
        if (sliceY + sliceH <= cy + r + 2) {
          ctx.fillRect(cx - r - 5, sliceY, (r + 5) * 2, sliceH);
        }
      }
      ctx.restore();
    }

    drawPixelClouds(ctx) {
      ctx.fillStyle = 'rgba(255, 100, 180, 0.4)';
      // Nuvem 1
      this.drawCloudShape(ctx, 40, 70, 70);
      // Nuvem 2
      this.drawCloudShape(ctx, 260, 95, 60);
      // Nuvem 3
      this.drawCloudShape(ctx, 160, 50, 45);
    }

    drawCloudShape(ctx, x, y, width) {
      const h = 12;
      ctx.fillRect(x + 10, y, width - 20, h);
      ctx.fillRect(x + 4, y + 3, width - 8, h - 3);
      ctx.fillRect(x, y + 6, width, h - 6);
    }

    drawDistantSkyline(ctx, groundY) {
      const data = this.distantBuildings;
      ctx.save();
      ctx.translate(-this.bgOffset, 0);

      for (let repeat = 0; repeat < 3; repeat++) {
        const shiftX = repeat * data.totalWidth;
        for (const b of data.list) {
          const bx = b.x + shiftX;
          const by = groundY - b.h;

          ctx.fillStyle = b.col;
          ctx.fillRect(bx, by, b.w, b.h);

          // Antena com luz piscante
          if (b.hasAntenna) {
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(bx + Math.floor(b.w / 2), by - b.antennaH, 2, b.antennaH);
            ctx.fillRect(bx + Math.floor(b.w / 2) - 1, by - b.antennaH, 4, 3);
          }

          // Janelinhas distantes
          ctx.fillStyle = 'rgba(255, 230, 100, 0.35)';
          for (let row = by + 8; row < groundY - 15; row += 10) {
            for (let col = bx + 5; col < bx + b.w - 5; col += 7) {
              if ((row + col) % 3 === 0) {
                ctx.fillRect(col, row, 3, 4);
              }
            }
          }
        }
      }
      ctx.restore();
    }

    drawArtDecoSkyline(ctx, groundY) {
      const data = this.decoBuildings;
      ctx.save();
      ctx.translate(-this.midOffset, 0);

      for (let repeat = 0; repeat < 3; repeat++) {
        const shiftX = repeat * data.totalWidth;
        for (const b of data.list) {
          const bx = b.x + shiftX;
          const by = groundY - b.h;

          // Prédio Art Deco frontal
          ctx.fillStyle = b.deco.main;
          ctx.fillRect(bx, by, b.w, b.h);

          // Borda superior decorativa Art Deco
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, by, b.w, 4);
          ctx.fillRect(bx + 4, by - 4, b.w - 8, 4);

          // Janelas neon iluminadas
          ctx.fillStyle = b.deco.win;
          for (let row = by + 12; row < groundY - 10; row += 12) {
            for (let col = bx + 6; col < bx + b.w - 8; col += 10) {
              ctx.fillRect(col, row, 5, 6);
            }
          }

          // Letreirinho neon no topo de alguns prédios ("HOTEL", "MIAMI", "OMODA")
          if (b.w > 55) {
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(bx + 6, by + 5, b.w - 12, 3);
          }
        }
      }
      ctx.restore();
    }

    drawMiamiOcean(ctx, topY, botY) {
      // Mar gradiente
      const oceanGrad = ctx.createLinearGradient(0, topY, 0, botY);
      oceanGrad.addColorStop(0, '#0a3d62');
      oceanGrad.addColorStop(0.5, '#008b9e');
      oceanGrad.addColorStop(1, '#00c2cb');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, topY, this.width, botY - topY);

      // Reflexos das luzes da cidade no mar
      ctx.fillStyle = 'rgba(255, 230, 0, 0.4)';
      for (let y = topY + 4; y < botY; y += 6) {
        const waveW = 12 + Math.sin(this.wavePhase + y) * 8;
        const waveX = (this.width * 0.5) + Math.cos(this.wavePhase * 0.8 + y) * 40;
        ctx.fillRect(waveX - waveW / 2, y, waveW, 2);
      }

      // Cristas de onda ciano/branco
      ctx.fillStyle = '#55ffff';
      for (let y = topY + 10; y < botY; y += 12) {
        for (let x = 0; x < this.width; x += 45) {
          const offsetX = (x + (this.fgOffset * 2) + Math.sin(y) * 10) % this.width;
          ctx.fillRect(offsetX, y, 16, 2);
        }
      }
    }

    drawOceanDrive(ctx, topY, botY) {
      const W = this.width;

      // 1. Faixa de Areia da Praia de Miami
      ctx.fillStyle = '#e8a855';
      ctx.fillRect(0, topY, W, 8);

      // 2. Calçada Art Deco de Miami Beach (Padrão Geométrico Ondulado)
      ctx.fillStyle = '#fce4ec';
      ctx.fillRect(0, topY + 8, W, 10);
      ctx.fillStyle = '#00c2cb';
      for (let x = -this.fgOffset; x < W + 40; x += 16) {
        ctx.fillRect(x, topY + 10, 8, 4);
      }

      // 3. Asfalto da Pista de Corrida / Estrada
      ctx.fillStyle = '#1c1b29';
      ctx.fillRect(0, topY + 18, W, botY - (topY + 18));

      // Meio-fio Rosa / Ciano Neon
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(0, topY + 17, W, 2);

      // Linhas da Pista Amarelas em movimento contínuo
      ctx.fillStyle = '#ffeb3b';
      const stripeY = topY + 32;
      for (let x = -this.fgOffset; x < W + 40; x += 32) {
        ctx.fillRect(x, stripeY, 18, 3);
      }

      // Palmeiras Tropicais de Miami na Orla
      for (let x = 20 - (this.fgOffset * 2 % 140); x < W + 140; x += 140) {
        this.drawPalmTree(ctx, x, topY + 8);
      }
    }

    drawPalmTree(ctx, x, baseY) {
      ctx.save();
      // Tronco curvado pixel art
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(x, baseY - 32, 4, 32);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(x + 1, baseY - 32, 2, 32);

      // Folhas da palmeira (Verde esmeralda / Ciano neon)
      ctx.fillStyle = '#00e676';
      // Folha esquerda
      ctx.fillRect(x - 14, baseY - 34, 14, 4);
      ctx.fillRect(x - 18, baseY - 31, 8, 3);
      // Folha direita
      ctx.fillRect(x + 4, baseY - 34, 14, 4);
      ctx.fillRect(x + 12, baseY - 31, 8, 3);
      // Folha topo
      ctx.fillRect(x - 6, baseY - 39, 14, 5);
      ctx.fillRect(x - 2, baseY - 42, 6, 4);

      // Destaque amarelo neon na copa
      ctx.fillStyle = '#a7ffeb';
      ctx.fillRect(x - 4, baseY - 36, 10, 2);
      ctx.restore();
    }
  }

  // ==========================================
  // 4. GERENCIADOR DE OBSTÁCULOS URBANOS
  // ==========================================
  // Prédios, Semáforos, Pórticos e Placas de Trânsito em pares
  class ObstacleManager {
    constructor(canvasWidth, canvasHeight) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.pipes = [];
      this.spawnTimer = 0;
      this.spawnInterval = 105; // frames entre novos pares
      this.pipeWidth = 62;
      this.defaultGap = 155;    // Altura da abertura para o carro
      this.minGap = 125;
      this.minTopH = 65;
      this.groundLimit = canvasHeight * 0.90; // Topo da rua
    }

    reset() {
      this.pipes = [];
      this.spawnTimer = 60; // Começa com um respiro inicial
    }

    update(speed, score) {
      this.spawnTimer++;

      // Reduz levemente o intervalo com a pontuação
      const currentInterval = Math.max(75, this.spawnInterval - Math.floor(score * 1.2));
      if (this.spawnTimer >= currentInterval) {
        this.spawnTimer = 0;
        this.spawnPair(score);
      }

      // Move obstáculos para a esquerda
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const p = this.pipes[i];
        p.x -= speed;

        // Remove os que já saíram da tela
        if (p.x + this.pipeWidth < -10) {
          this.pipes.splice(i, 1);
        }
      }
    }

    spawnPair(score) {
      // Dificuldade gradual: Abertura diminui suavemente até minGap
      const gap = Math.max(this.minGap, this.defaultGap - Math.floor(score * 1.2));

      // Altura disponível entre o teto e a pista
      const playableH = this.groundLimit - gap;
      const topH = Math.floor(this.minTopH + Math.random() * (playableH - this.minTopH * 1.5));
      const botY = topH + gap;
      const botH = this.groundLimit - botY;

      // Variedades de estilos visuais temáticos de Miami
      const styles = ['gantry', 'artdeco', 'skyscraper', 'crane'];
      const topStyle = styles[Math.floor(Math.random() * styles.length)];
      const botStyle = styles[Math.floor(Math.random() * styles.length)];

      const signs = [
        'MIAMI BEACH',
        'OMODA 5',
        'OCEAN DR',
        'COLLINS AVE',
        'DOWNTOWN',
        'HWY 100'
      ];
      const signText = signs[Math.floor(Math.random() * signs.length)];

      this.pipes.push({
        x: this.canvasWidth + 10,
        topH,
        botY,
        botH,
        gap,
        width: this.pipeWidth,
        passed: false,
        topStyle,
        botStyle,
        signText,
        colorTheme: Math.floor(Math.random() * 3)
      });
    }

    draw(ctx) {
      for (const p of this.pipes) {
        // Obstáculo Superior (Vem do teto para baixo)
        this.drawTopObstacle(ctx, p.x, 0, p.width, p.topH, p);

        // Obstáculo Inferior (Vem da rua para cima)
        this.drawBottomObstacle(ctx, p.x, p.botY, p.width, p.botH, p);
      }
    }

    // ----------------------------------------
    // OBSTÁCULO SUPERIOR (Pórticos, Placas, Vigas)
    // ----------------------------------------
    drawTopObstacle(ctx, x, y, w, h, p) {
      ctx.save();

      // Estrutura principal
      ctx.fillStyle = '#1b1b2f';
      ctx.fillRect(x, y, w, h);

      // Colunas estruturais de aço nas laterais
      ctx.fillStyle = '#2e2e4a';
      ctx.fillRect(x, y, 6, h);
      ctx.fillRect(x + w - 6, y, 6, h);

      // Treliças de metal / X em pixel art
      ctx.fillStyle = '#3f3f6b';
      for (let cy = y + 10; cy < h - 25; cy += 18) {
        ctx.fillRect(x + 8, cy, w - 16, 2);
        ctx.fillRect(x + 12, cy + 4, 3, 10);
        ctx.fillRect(x + w - 15, cy + 4, 3, 10);
      }

      // Placa de Trânsito Suspensa / Letreiro Highway
      const signH = Math.min(30, h * 0.45);
      const signY = y + h - signH - 8;
      if (signY > y + 5) {
        // Placa Verde de Rodovia americana com borda branca
        ctx.fillStyle = '#007a3d';
        ctx.fillRect(x + 4, signY, w - 8, signH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, signY + 1, w - 10, signH - 2);

        // Texto pixelado na placa
        ctx.fillStyle = '#ffffff';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.signText, x + w / 2, signY + signH / 2 + 3);
      }

      // Semáforos suspensos / Luzes de aviso de trânsito na ponta inferior
      const tipY = y + h - 8;
      // Barra de aviso zebrada (Amarelo e Preto)
      for (let bx = x; bx < x + w; bx += 8) {
        ctx.fillStyle = ((bx / 8) % 2 === 0) ? '#ffcc00' : '#111111';
        ctx.fillRect(bx, tipY, 8, 8);
      }

      // Semáforo com luzes piscantes na borda
      ctx.fillStyle = '#111';
      ctx.fillRect(x + 8, tipY - 14, 14, 14);
      // Luz amarela de atenção
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(x + 11, tipY - 11, 8, 8);

      // Moldura neon na borda do perigo
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(x, tipY + 6, w, 2);

      ctx.restore();
    }

    // ----------------------------------------
    // OBSTÁCULO INFERIOR (Prédios, Torres, Semáforos)
    // ----------------------------------------
    drawBottomObstacle(ctx, x, y, w, h, p) {
      ctx.save();

      // Paletas de cores retrô Miami
      const palettes = [
        { body: '#ff007f', edge: '#ffffff', win: '#00f0ff', accent: '#ffe600' }, // Rosa choque Art Deco
        { body: '#00c2cb', edge: '#ffffff', win: '#ffea00', accent: '#ff007f' }, // Turquesa Miami
        { body: '#3a0066', edge: '#00f0ff', win: '#ff007f', accent: '#00e676' }  // Cyber Roxo
      ];
      const pal = palettes[p.colorTheme % palettes.length];

      // Fachada do Prédio
      ctx.fillStyle = pal.body;
      ctx.fillRect(x, y, w, h);

      // Pilares laterais / bordas
      ctx.fillStyle = pal.edge;
      ctx.fillRect(x, y, 4, h);
      ctx.fillRect(x + w - 4, y, 4, h);

      // Topo Art Deco / Beiral com antena
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y, w + 4, 6);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x + 2, y + 2, w - 4, 3);

      // Faixa de advertência de trânsito zebrada no topo
      for (let bx = x; bx < x + w; bx += 8) {
        ctx.fillStyle = ((bx / 8) % 2 === 0) ? '#ffea00' : '#111';
        ctx.fillRect(bx, y + 6, 8, 4);
      }

      // Janelas Iluminadas em matriz pixelada
      ctx.fillStyle = pal.win;
      for (let winY = y + 18; winY < y + h - 10; winY += 14) {
        for (let winX = x + 8; winX < x + w - 12; winX += 12) {
          ctx.fillRect(winX, winY, 7, 8);
          // Cortininha / detalhe interno
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(winX + 1, winY + 1, 2, 2);
          ctx.fillStyle = pal.win;
        }
      }

      // Semáforo fixado na lateral da torre
      ctx.fillStyle = '#111111';
      ctx.fillRect(x + w - 14, y + 16, 12, 24);
      // Luzes verde / amarela / vermelha
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(x + w - 11, y + 19, 6, 5);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(x + w - 11, y + 26, 6, 5);
      ctx.fillStyle = '#00ff66';
      ctx.fillRect(x + w - 11, y + 33, 6, 5);

      // Letreiro vertical "OMODA" em alguns prédios
      if (h > 90) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        const letters = ['O', 'M', 'O', 'D', 'A'];
        letters.forEach((l, idx) => {
          ctx.fillText(l, x + 12, y + 35 + (idx * 10));
        });
      }

      ctx.restore();
    }
  }

  // ==========================================
  // 5. SISTEMA DE PARTÍCULAS
  // ==========================================
  // Rastro de turbo, faíscas de colisão e pontos flutuantes (+1)
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.floatingScores = [];
    }

    reset() {
      this.particles = [];
      this.floatingScores = [];
    }

    spawnTurboTrail(x, y, isBoosting) {
      const count = isBoosting ? 4 : 2;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: x - 22 + (Math.random() * 4),
          y: y + 2 + (Math.random() * 6 - 3),
          vx: -(2.5 + Math.random() * 3),
          vy: (Math.random() * 2 - 1) * 0.8,
          size: isBoosting ? (3 + Math.random() * 3) : (2 + Math.random() * 2),
          color: isBoosting ? (Math.random() > 0.5 ? '#00f0ff' : '#ffff00') : (Math.random() > 0.5 ? '#ff3300' : '#ff9900'),
          alpha: 1,
          decay: isBoosting ? 0.05 : 0.08
        });
      }
    }

    spawnExplosion(x, y) {
      // Pedaços do carro e faíscas ao bater
      const colors = ['#00f0ff', '#ff007f', '#ffffff', '#ffaa00', '#222222'];
      for (let i = 0; i < 45; i++) {
        const speed = 1.5 + Math.random() * 5.5;
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.floor(Math.random() * 4),
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02
        });
      }
    }

    spawnScoreText(x, y) {
      this.floatingScores.push({
        x,
        y,
        vy: -1.8,
        alpha: 1,
        text: '+1'
      });
    }

    update() {
      // Partículas físicas
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Textos flutuantes de pontuação
      for (let i = this.floatingScores.length - 1; i >= 0; i--) {
        const s = this.floatingScores[i];
        s.y += s.vy;
        s.alpha -= 0.025;
        if (s.alpha <= 0) {
          this.floatingScores.splice(i, 1);
        }
      }
    }

    draw(ctx) {
      ctx.save();
      // Desenha partículas
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      // Desenha textos flutuantes (+1)
      for (const s of this.floatingScores) {
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 6;
        ctx.fillText(s.text, s.x, s.y);
      }
      ctx.restore();
    }
  }

  // ==========================================
  // 6. MOTOR DO JOGO (GAME ENGINE)
  // ==========================================
  class OmodaFlyGame {
    constructor() {
      // Elementos do DOM
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.startScreen = document.getElementById('startScreen');
      this.gameOverScreen = document.getElementById('gameOverScreen');
      this.startBtn = document.getElementById('startBtn');
      this.restartBtn = document.getElementById('restartBtn');
      this.soundBtn = document.getElementById('soundToggleBtn');
      this.soundIcon = document.getElementById('soundIcon');
      this.finalScoreEl = document.getElementById('finalScore');
      this.bestScoreEl = document.getElementById('bestScore');
      this.newRecordBadge = document.getElementById('newRecordBadge');
      this.previewCanvas = document.getElementById('carPreviewCanvas');

      // Dimensões do Canvas Virtual
      this.width = 400;
      this.height = 600;
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      // Áudio e Cenário
      this.audio = new SoundEffects();
      this.updateSoundIcon();
      this.skyline = new MiamiSkyline(this.width, this.height);
      this.obstacles = new ObstacleManager(this.width, this.height);
      this.particles = new ParticleSystem();

      // Parâmetros do Carro OMODA 5
      this.car = {
        x: 85,
        y: 280,
        radius: 14,
        hitWidth: 38,
        hitHeight: 18,
        vy: 0,
        gravity: 0.38,
        jumpPower: -6.5,
        angle: 0,
        flamePhase: 0,
        isBoosting: false,
        boostTimer: 0
      };

      // Estado do Jogo
      this.state = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
      this.score = 0;
      this.bestScore = parseInt(localStorage.getItem('omoda_fly_miami_best') || '0', 10);
      this.gameSpeed = 2.4;
      this.screenShake = 0;
      this.lastTime = 0;

      // Eventos
      this.bindEvents();
      this.renderCarPreview();

      // Inicia Game Loop
      requestAnimationFrame(this.loop.bind(this));
    }

    bindEvents() {
      // Botão Start
      this.startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startGame();
      });

      // Botão Restart
      this.restartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startGame();
      });

      // Alternar Áudio
      this.soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const unmuted = this.audio.toggle();
        this.updateSoundIcon();
      });

      // Teclado (Espaço / Seta Cima / W)
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          this.handlePlayerAction();
        }
      });

      // Clique do Mouse e Toque na Tela
      const triggerAction = (e) => {
        // Ignora cliques diretos nos botões UI
        if (e.target.closest('button')) return;
        this.handlePlayerAction();
      };

      this.canvas.addEventListener('mousedown', triggerAction);
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        triggerAction(e);
      }, { passive: false });
    }

    updateSoundIcon() {
      this.soundIcon.textContent = this.audio.muted ? '🔇' : '🔊';
    }

    handlePlayerAction() {
      if (this.state === 'START') {
        this.startGame();
      } else if (this.state === 'PLAYING') {
        this.flap();
      } else if (this.state === 'GAMEOVER') {
        // Pequeno delay para evitar reinício acidental ao clicar freneticamente
        if (this.gameOverDelay <= 0) {
          this.startGame();
        }
      }
    }

    startGame() {
      this.state = 'PLAYING';
      this.score = 0;
      this.gameSpeed = 2.4;
      this.screenShake = 0;

      // Reset do carro
      this.car.y = 250;
      this.car.vy = -3;
      this.car.angle = 0;
      this.car.isBoosting = true;
      this.car.boostTimer = 8;

      // Reset dos subsistemas
      this.obstacles.reset();
      this.particles.reset();

      // Esconde telas de overlay
      this.startScreen.classList.remove('active');
      this.gameOverScreen.classList.remove('active');

      this.audio.playStart();
      this.audio.playJump();
    }

    flap() {
      this.car.vy = this.car.jumpPower;
      this.car.isBoosting = true;
      this.car.boostTimer = 10;
      this.audio.playJump();
      this.particles.spawnTurboTrail(this.car.x, this.car.y, true);
    }

    triggerGameOver() {
      if (this.state === 'GAMEOVER') return;
      this.state = 'GAMEOVER';
      this.gameOverDelay = 25; // frames de proteção
      this.screenShake = 18;

      this.audio.playCrash();
      this.particles.spawnExplosion(this.car.x, this.car.y);

      // Atualiza recorde
      let isNewRecord = false;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('omoda_fly_miami_best', this.bestScore);
        isNewRecord = true;
      }

      this.finalScoreEl.textContent = this.score;
      this.bestScoreEl.textContent = this.bestScore;

      if (isNewRecord && this.score > 0) {
        this.newRecordBadge.classList.remove('hidden');
      } else {
        this.newRecordBadge.classList.add('hidden');
      }

      // Exibe overlay com breve delay para ver a explosão
      setTimeout(() => {
        if (this.state === 'GAMEOVER') {
          this.gameOverScreen.classList.add('active');
        }
      }, 450);
    }

    update() {
      this.car.flamePhase++;

      if (this.gameOverDelay > 0) {
        this.gameOverDelay--;
      }

      // Efeito de tremor de tela na colisão
      if (this.screenShake > 0) {
        this.screenShake *= 0.88;
        if (this.screenShake < 0.5) this.screenShake = 0;
      }

      // Atualiza cenário e partículas
      const currentSpeed = (this.state === 'PLAYING') ? this.gameSpeed : (this.state === 'START' ? 1.0 : 0);
      this.skyline.update(currentSpeed);
      this.particles.update();

      if (this.state === 'START') {
        // Animação suave de flutuação do carro parado na tela inicial
        this.car.y = 260 + Math.sin(this.car.flamePhase * 0.08) * 8;
        this.car.angle = Math.sin(this.car.flamePhase * 0.08) * 0.06;
        if (this.car.flamePhase % 4 === 0) {
          this.particles.spawnTurboTrail(this.car.x, this.car.y, false);
        }
        return;
      }

      if (this.state === 'GAMEOVER') {
        // Queda final após a batida
        if (this.car.y < this.obstacles.groundLimit) {
          this.car.vy += this.car.gravity * 1.5;
          this.car.y += this.car.vy;
          this.car.angle = Math.min(Math.PI * 0.45, this.car.angle + 0.08);
        }
        return;
      }

      // ----------------------------------------
      // FÍSICA DO CARRO EM JOGO
      // ----------------------------------------
      this.car.vy += this.car.gravity;
      this.car.y += this.car.vy;

      // Timer do boost de fogo
      if (this.car.boostTimer > 0) {
        this.car.boostTimer--;
        if (this.car.boostTimer === 0) {
          this.car.isBoosting = false;
        }
      }

      // Rastro de fogo contínuo
      if (this.car.flamePhase % 2 === 0) {
        this.particles.spawnTurboTrail(this.car.x, this.car.y, this.car.isBoosting);
      }

      // Rotação suave baseada na velocidade vertical
      const targetAngle = Math.max(-0.4, Math.min(0.65, this.car.vy * 0.065));
      this.car.angle += (targetAngle - this.car.angle) * 0.22;

      // Aumento gradual da velocidade do jogo
      this.gameSpeed = 2.4 + Math.min(2.0, this.score * 0.04);

      // Atualiza obstáculos
      this.obstacles.update(this.gameSpeed, this.score);

      // ----------------------------------------
      // COLISÕES COM LIMITES DA TELA
      // ----------------------------------------
      // Teto (limite superior)
      if (this.car.y - this.car.hitHeight / 2 < 0) {
        this.car.y = this.car.hitHeight / 2;
        this.triggerGameOver();
        return;
      }

      // Asfalto / Chão (limite inferior da pista)
      if (this.car.y + this.car.hitHeight / 2 >= this.obstacles.groundLimit) {
        this.car.y = this.obstacles.groundLimit - this.car.hitHeight / 2;
        this.triggerGameOver();
        return;
      }

      // ----------------------------------------
      // COLISÕES COM OS OBSTÁCULOS & PONTUAÇÃO
      // ----------------------------------------
      const carLeft = this.car.x - this.car.hitWidth / 2 + 6;
      const carRight = this.car.x + this.car.hitWidth / 2 - 4;
      const carTop = this.car.y - this.car.hitHeight / 2 + 4;
      const carBottom = this.car.y + this.car.hitHeight / 2 - 4;

      for (const p of this.obstacles.pipes) {
        const pipeLeft = p.x;
        const pipeRight = p.x + p.width;

        // Verifica se o carro está na faixa horizontal do obstáculo
        if (carRight > pipeLeft && carLeft < pipeRight) {
          // Bateu no obstáculo superior
          if (carTop < p.topH) {
            this.triggerGameOver();
            return;
          }
          // Bateu no obstáculo inferior
          if (carBottom > p.botY) {
            this.triggerGameOver();
            return;
          }
        }

        // Ponto: Carro ultrapassou com sucesso o obstáculo
        if (!p.passed && this.car.x > pipeRight) {
          p.passed = true;
          this.score++;
          this.audio.playScore();
          this.particles.spawnScoreText(p.x + p.width / 2, p.botY - p.gap / 2);
        }
      }
    }

    render() {
      this.ctx.save();

      // Aplica efeito Screen Shake
      if (this.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * this.screenShake;
        const shakeY = (Math.random() - 0.5) * this.screenShake;
        this.ctx.translate(shakeX, shakeY);
      }

      // 1. Cenário de Miami (Céu, Sol, Mar, Skyline, Orla)
      this.skyline.draw(this.ctx);

      // 2. Obstáculos Urbanos (Prédios, Pórticos, Semáforos)
      this.obstacles.draw(this.ctx);

      // 3. Partículas de Turbo, Faíscas e Pontuação Flutuante
      this.particles.draw(this.ctx);

      // 4. Carro OMODA 5
      renderOmoda5(
        this.ctx,
        this.car.x,
        this.car.y,
        this.car.angle,
        this.car.flamePhase,
        this.car.isBoosting
      );

      // 5. Placar de Pontos no Topo em Pixel Art
      if (this.state === 'PLAYING') {
        this.drawHUD();
      }

      this.ctx.restore();
    }

    drawHUD() {
      this.ctx.save();
      const scoreStr = this.score.toString();

      // Caixa de fundo para legibilidade
      this.ctx.fillStyle = 'rgba(18, 4, 36, 0.75)';
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 2;

      const boxW = 80 + (scoreStr.length * 10);
      const boxH = 34;
      const boxX = (this.width - boxW) / 2;
      const boxY = 16;

      this.ctx.fillRect(boxX, boxY, boxW, boxH);
      this.ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Texto de Pontuação em Estilo 8-Bit com Sombra
      this.ctx.font = '16px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';

      // Sombra Rosa
      this.ctx.fillStyle = '#ff007f';
      this.ctx.fillText(scoreStr, this.width / 2 + 2, boxY + 24);

      // Texto Amarelo Neon
      this.ctx.fillStyle = '#ffd000';
      this.ctx.fillText(scoreStr, this.width / 2, boxY + 22);

      this.ctx.restore();
    }

    renderCarPreview() {
      // Mini-renderizador do OMODA 5 para a tela inicial
      if (!this.previewCanvas) return;
      const pctx = this.previewCanvas.getContext('2d');
      pctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
      renderOmoda5(pctx, 48, 28, 0, 10, true);
    }

    loop(timestamp) {
      this.update();
      this.render();
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  // Inicializa quando o DOM estiver pronto
  window.addEventListener('DOMContentLoaded', () => {
    new OmodaFlyGame();
  });
})();
