// Active Matter Collective Simulation
// Samuel Khiangte - Academic Portfolio

class ActiveMatterSim {
    constructor(canvasId, controlsId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Sim parameters (defaults matches sliders)
        this.params = {
            particleCount: 120,
            particleSpeed: 2.0,
            alignment: 1.5,
            cohesion: 0.8,
            separation: 1.2,
            adhesion: 2.0,
            obstacleCount: 4,
            perceptionRadius: 45,
            adhesionRadius: 25,
            obstacleAvoid: 3.5
        };

        this.particles = [];
        this.obstacles = [];
        this.animationFrameId = null;
        
        // Track mouse for interaction
        this.mouse = { x: 0, y: 0, active: false };
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.resizeCanvas();
        this.particles = [];
        this.obstacles = [];

        // Spawn particles
        for (let i = 0; i < this.params.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.params.particleSpeed * 2,
                vy: (Math.random() - 0.5) * this.params.particleSpeed * 2,
                radius: 4,
                color: `hsla(${200 + Math.random() * 60}, 85%, 65%, 0.8)`
            });
        }

        // Spawn fixed obstacles
        this.updateObstacleCount();
    }

    updateObstacleCount() {
        // Retain user obstacles, only spawn random ones if count changes
        const currentCount = this.obstacles.length;
        if (currentCount < this.params.obstacleCount) {
            for (let i = currentCount; i < this.params.obstacleCount; i++) {
                this.obstacles.push({
                    x: 100 + Math.random() * (this.canvas.width - 200),
                    y: 100 + Math.random() * (this.canvas.height - 200),
                    radius: 20 + Math.random() * 15,
                    isUserPlaced: false
                });
            }
        } else if (currentCount > this.params.obstacleCount) {
            this.obstacles = this.obstacles.filter(o => o.isUserPlaced).slice(0, this.params.obstacleCount);
            while (this.obstacles.length < this.params.obstacleCount) {
                this.obstacles.push({
                    x: 100 + Math.random() * (this.canvas.width - 200),
                    y: 100 + Math.random() * (this.canvas.height - 200),
                    radius: 20 + Math.random() * 15,
                    isUserPlaced: false
                });
            }
        }
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.max(350, rect.width * 0.55);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // Click to add obstacle
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicking near existing obstacle to remove it
            const clickedIdx = this.obstacles.findIndex(o => {
                const dist = Math.hypot(o.x - x, o.y - y);
                return dist < o.radius + 10;
            });

            if (clickedIdx !== -1) {
                this.obstacles.splice(clickedIdx, 1);
            } else {
                // Add obstacle
                this.obstacles.push({
                    x: x,
                    y: y,
                    radius: 15 + Math.random() * 15,
                    isUserPlaced: true
                });
            }
        });

        // Set up sliders
        const binds = [
            { id: 'param-speed', key: 'particleSpeed' },
            { id: 'param-alignment', key: 'alignment' },
            { id: 'param-adhesion', key: 'adhesion' },
            { id: 'param-obstacles', key: 'obstacleCount', callback: () => this.updateObstacleCount() }
        ];

        binds.forEach(b => {
            const el = document.getElementById(b.id);
            if (el) {
                el.value = this.params[b.key];
                el.addEventListener('input', (e) => {
                    this.params[b.key] = parseFloat(e.target.value);
                    const label = document.getElementById(`${b.id}-val`);
                    if (label) label.textContent = e.target.value;
                    if (b.callback) b.callback();
                });
            }
        });

        const resetBtn = document.getElementById('btn-reset-sim');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.init());
        }
    }

    start() {
        if (!this.animationFrameId) {
            const loop = () => {
                this.update();
                this.draw();
                this.animationFrameId = requestAnimationFrame(loop);
            };
            this.animationFrameId = requestAnimationFrame(loop);
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    update() {
        const p = this.params;
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (let i = 0; i < this.particles.length; i++) {
            const agent = this.particles[i];

            let alignX = 0, alignY = 0;
            let cohesionX = 0, cohesionY = 0;
            let separationX = 0, separationY = 0;
            let adhesionX = 0, adhesionY = 0;
            let neighborsCount = 0;
            let closeNeighborsCount = 0;

            // Physics loop over neighbors
            for (let j = 0; j < this.particles.length; j++) {
                if (i === j) continue;
                const other = this.particles[j];
                const dx = other.x - agent.x;
                const dy = other.y - agent.y;
                const dist = Math.hypot(dx, dy);

                if (dist < p.perceptionRadius) {
                    alignX += other.vx;
                    alignY += other.vy;
                    cohesionX += other.x;
                    cohesionY += other.y;
                    neighborsCount++;

                    if (dist < p.adhesionRadius) {
                        // Separation (push away if overlapping)
                        separationX -= dx / dist;
                        separationY -= dy / dist;
                        closeNeighborsCount++;

                        // Adhesion force: pulls slightly towards each other if in contact zone
                        // but not too close.
                        if (dist > 8) {
                            adhesionX += (dx / dist) * p.adhesion;
                            adhesionY += (dy / dist) * p.adhesion;
                        }
                    }
                }
            }

            // Acceleration vectors
            let ax = 0;
            let ay = 0;

            if (neighborsCount > 0) {
                // Alignment force
                alignX /= neighborsCount;
                alignY /= neighborsCount;
                const magAlign = Math.hypot(alignX, alignY) || 1;
                ax += ((alignX / magAlign) * p.particleSpeed - agent.vx) * p.alignment * 0.1;
                ay += ((alignY / magAlign) * p.particleSpeed - agent.vy) * p.alignment * 0.1;

                // Cohesion force
                cohesionX /= neighborsCount;
                cohesionY /= neighborsCount;
                const steerX = cohesionX - agent.x;
                const steerY = cohesionY - agent.y;
                const magCohesion = Math.hypot(steerX, steerY) || 1;
                ax += ((steerX / magCohesion) * p.particleSpeed - agent.vx) * p.cohesion * 0.1;
                ay += ((steerY / magCohesion) * p.particleSpeed - agent.vy) * p.cohesion * 0.1;
            }

            if (closeNeighborsCount > 0) {
                // Separation force
                const magSep = Math.hypot(separationX, separationY) || 1;
                ax += ((separationX / magSep) * p.particleSpeed - agent.vx) * p.separation * 0.2;
                ay += ((separationY / magSep) * p.particleSpeed - agent.vy) * p.separation * 0.2;

                // Adhesion force
                ax += adhesionX * 0.05;
                ay += adhesionY * 0.05;
            }

            // Obstacle Avoidance
            this.obstacles.forEach(o => {
                const dx = agent.x - o.x;
                const dy = agent.y - o.y;
                const dist = Math.hypot(dx, dy);
                const safeDist = o.radius + 30;

                if (dist < safeDist) {
                    const force = (safeDist - dist) / safeDist;
                    // Push vector
                    ax += (dx / dist) * force * p.obstacleAvoid * 1.5;
                    ay += (dy / dist) * force * p.obstacleAvoid * 1.5;
                }
            });

            // Update velocity and speed control
            agent.vx += ax;
            agent.vy += ay;

            // Enforce current speed setting
            const currentSpeed = Math.hypot(agent.vx, agent.vy) || 0.1;
            agent.vx = (agent.vx / currentSpeed) * p.particleSpeed;
            agent.vy = (agent.vy / currentSpeed) * p.particleSpeed;

            // Update position
            agent.x += agent.vx;
            agent.y += agent.vy;

            // Boundary wrapping
            if (agent.x < 0) agent.x = width;
            if (agent.x > width) agent.x = 0;
            if (agent.y < 0) agent.y = height;
            if (agent.y > height) agent.y = 0;
        }
    }

    draw() {
        // Semi-transparent clearing for motion blur trails
        this.ctx.fillStyle = 'rgba(11, 15, 25, 0.25)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections (bonds) between close cells first (underneath them)
        const p = this.params;
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.particles.length; i++) {
            const agent = this.particles[i];
            for (let j = i + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dist = Math.hypot(other.x - agent.x, other.y - agent.y);
                if (dist < p.adhesionRadius) {
                    const alpha = (1 - dist / p.adhesionRadius) * 0.45;
                    this.ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`; // Indigo bond
                    this.ctx.beginPath();
                    this.ctx.moveTo(agent.x, agent.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw obstacles
        this.obstacles.forEach(o => {
            // Draw subtle glowing drop shadow for obstacles
            this.ctx.beginPath();
            this.ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = o.isUserPlaced ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.1)';
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = o.isUserPlaced ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.4)';
            this.ctx.stroke();

            // Core of obstacle
            this.ctx.beginPath();
            this.ctx.arc(o.x, o.y, o.radius * 0.7, 0, Math.PI * 2);
            this.ctx.fillStyle = o.isUserPlaced ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.8)';
            this.ctx.fill();
        });

        // Draw active particles
        this.particles.forEach(agent => {
            // Velocity angle for heading indicator
            const angle = Math.atan2(agent.vy, agent.vx);

            // Draw agent body
            this.ctx.beginPath();
            this.ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = agent.color;
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = agent.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // reset shadow

            // Small direction pointer
            this.ctx.beginPath();
            this.ctx.moveTo(agent.x, agent.y);
            this.ctx.lineTo(
                agent.x + Math.cos(angle) * (agent.radius + 3),
                agent.y + Math.sin(angle) * (agent.radius + 3)
            );
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        });
    }
}

// Initialise the simulation on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const simInstance = new ActiveMatterSim('simulation-canvas', 'sim-controls');
    simInstance.start();
});
