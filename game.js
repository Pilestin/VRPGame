/**
 * TSP Game - Ana oyun mantığı
 */

class TSPGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.visitedNodes = [];
        this.currentRoute = [];
        this.optimalRoute = [];
        this.optimalDistance = 0;
        this.currentDistance = 0;
        this.gameStarted = false;
        this.gameFinished = false;
        this.showingOptimal = false;

        this.NODE_RADIUS = 15;
        this.DEPOT_COLOR = '#10b981'; // Yeşil
        this.CUSTOMER_COLOR = '#3b82f6'; // Mavi
        this.VISITED_COLOR = '#f59e0b'; // Turuncu
        this.LINE_COLOR = '#6366f1'; // Mor
        this.OPTIMAL_LINE_COLOR = '#10b981'; // Yeşil

        this.initCanvas();
        this.initEventListeners();
    }

    initCanvas() {
        // Canvas boyutunu ayarla
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 600;
    }

    initEventListeners() {
        // Başlat butonu
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());

        // Yeniden başlat butonu
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());

        // Optimal rotayı göster butonu
        document.getElementById('showSolutionBtn').addEventListener('click', () => this.toggleOptimalRoute());

        // Canvas tıklama
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Modal kapat
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());

        // Pencere boyutu değiştiğinde
        window.addEventListener('resize', () => {
            this.initCanvas();
            this.draw();
        });
    }

    startGame() {
        this.generateNodes();
        this.calculateOptimalRoute();
        this.gameStarted = true;
        this.gameFinished = false;
        this.showingOptimal = false;

        // Depoyu otomatik olarak ziyaret edilmiş say
        this.visitedNodes.push(this.nodes[0]);
        this.currentRoute.push(this.nodes[0]);

        document.getElementById('startBtn').disabled = true;
        document.getElementById('resetBtn').disabled = false;
        document.getElementById('showSolutionBtn').disabled = false;

        this.updateUI();
        this.draw();
    }

    generateNodes() {
        this.nodes = [];
        const padding = 50;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;

        // İlk node depo (başlangıç noktası)
        const depot = {
            id: 0,
            x: padding + Math.random() * width,
            y: padding + Math.random() * height,
            isDepot: true
        };
        this.nodes.push(depot);

        // 9 müşteri noktası daha ekle (toplam 10)
        for (let i = 1; i < 10; i++) {
            let node;
            let attempts = 0;
            const maxAttempts = 100;

            // Node'lar birbirine çok yakın olmasın
            do {
                node = {
                    id: i,
                    x: padding + Math.random() * width,
                    y: padding + Math.random() * height,
                    isDepot: false
                };
                attempts++;
            } while (this.isTooClose(node) && attempts < maxAttempts);

            this.nodes.push(node);
        }
    }

    isTooClose(newNode, minDistance = 60) {
        for (const node of this.nodes) {
            const dx = node.x - newNode.x;
            const dy = node.y - newNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }

    calculateOptimalRoute() {
        const solver = new TSPSolver(this.nodes);
        const solution = solver.solveMultiStart(10);
        this.optimalRoute = solution.route;
        this.optimalDistance = solution.distance;
    }

    handleCanvasClick(e) {
        if (!this.gameStarted || this.gameFinished) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Tıklanan node'u bul
        const clickedNode = this.findNodeAt(x, y);

        if (clickedNode && !this.isVisited(clickedNode)) {
            // Node'u ziyaret et
            this.visitNode(clickedNode);
        }
    }

    findNodeAt(x, y) {
        for (const node of this.nodes) {
            const dx = node.x - x;
            const dy = node.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= this.NODE_RADIUS) {
                return node;
            }
        }
        return null;
    }

    isVisited(node) {
        return this.visitedNodes.includes(node);
    }

    visitNode(node) {
        this.visitedNodes.push(node);
        this.currentRoute.push(node);

        // Son node'dan önceki node'a olan mesafeyi ekle
        if (this.currentRoute.length > 1) {
            const prevNode = this.currentRoute[this.currentRoute.length - 2];
            this.currentDistance += this.calculateDistance(prevNode, node);
        }

        this.updateUI();
        this.draw();

        // Tüm müşteriler ziyaret edildi mi?
        if (this.visitedNodes.length === this.nodes.length) {
            this.checkCompletion();
        }
    }

    checkCompletion() {
        // Depoya dönüş mesafesini ekle
        const lastNode = this.currentRoute[this.currentRoute.length - 1];
        const depot = this.nodes[0];
        this.currentDistance += this.calculateDistance(lastNode, depot);
        this.currentRoute.push(depot);

        this.gameFinished = true;
        this.updateUI();
        this.draw();

        // Sonucu kontrol et
        const tolerance = 0.05; // %5 tolerans
        const difference = Math.abs(this.currentDistance - this.optimalDistance);
        const percentDiff = (difference / this.optimalDistance) * 100;

        setTimeout(() => {
            if (percentDiff <= tolerance * 100) {
                this.showResult(true, 'Tebrikler! 🎉', 
                    `Optimal rotayı buldunuz!<br>Mesafe: ${this.currentDistance.toFixed(2)} km`);
            } else if (percentDiff <= 10) {
                this.showResult(false, 'Çok İyi! 👏', 
                    `Optimal rotaya çok yakınsınız!<br>Sizin: ${this.currentDistance.toFixed(2)} km<br>Optimal: ${this.optimalDistance.toFixed(2)} km<br>Fark: %${percentDiff.toFixed(1)}`);
            } else {
                this.showResult(false, 'Oyun Bitti! 🤔', 
                    `Daha iyi yapabilirsiniz!<br>Sizin: ${this.currentDistance.toFixed(2)} km<br>Optimal: ${this.optimalDistance.toFixed(2)} km<br>Fark: %${percentDiff.toFixed(1)}`);
            }
        }, 500);
    }

    calculateDistance(node1, node2) {
        const dx = node1.x - node2.x;
        const dy = node1.y - node2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    toggleOptimalRoute() {
        this.showingOptimal = !this.showingOptimal;
        const btn = document.getElementById('showSolutionBtn');
        btn.textContent = this.showingOptimal ? '🔍 Rotayı Gizle' : '💡 Optimal Rotayı Göster';
        this.draw();
    }

    resetGame() {
        this.nodes = [];
        this.visitedNodes = [];
        this.currentRoute = [];
        this.optimalRoute = [];
        this.optimalDistance = 0;
        this.currentDistance = 0;
        this.gameStarted = false;
        this.gameFinished = false;
        this.showingOptimal = false;

        document.getElementById('startBtn').disabled = false;
        document.getElementById('resetBtn').disabled = true;
        document.getElementById('showSolutionBtn').disabled = true;
        document.getElementById('showSolutionBtn').textContent = '💡 Optimal Rotayı Göster';

        this.updateUI();
        this.draw();
    }

    updateUI() {
        document.getElementById('visitedCount').textContent = 
            `${this.visitedNodes.length}/${this.nodes.length}`;
        
        document.getElementById('currentDistance').textContent = 
            `${this.currentDistance.toFixed(2)} km`;
        
        document.getElementById('optimalDistance').textContent = 
            this.gameStarted ? `${this.optimalDistance.toFixed(2)} km` : '? km';
    }

    draw() {
        // Canvas'ı temizle
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.nodes.length === 0) {
            this.drawWelcomeScreen();
            return;
        }

        // Optimal rotayı göster (arka planda)
        if (this.showingOptimal) {
            this.drawOptimalRoute();
        }

        // Mevcut rotayı çiz
        this.drawCurrentRoute();

        // Node'ları çiz
        this.drawNodes();
    }

    drawWelcomeScreen() {
        this.ctx.fillStyle = '#667eea';
        this.ctx.font = 'bold 24px Segoe UI';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Oyunu başlatmak için "Oyunu Başlat" butonuna tıklayın', 
            this.canvas.width / 2, this.canvas.height / 2);
    }

    drawOptimalRoute() {
        if (this.optimalRoute.length < 2) return;

        this.ctx.strokeStyle = this.OPTIMAL_LINE_COLOR;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.globalAlpha = 0.5;

        this.ctx.beginPath();
        for (let i = 0; i < this.optimalRoute.length; i++) {
            const node = this.optimalRoute[i];
            if (i === 0) {
                this.ctx.moveTo(node.x, node.y);
            } else {
                this.ctx.lineTo(node.x, node.y);
            }
        }
        // Depoya dön
        this.ctx.lineTo(this.optimalRoute[0].x, this.optimalRoute[0].y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
    }

    drawCurrentRoute() {
        if (this.currentRoute.length < 2) return;

        this.ctx.strokeStyle = this.LINE_COLOR;
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        for (let i = 0; i < this.currentRoute.length; i++) {
            const node = this.currentRoute[i];
            if (i === 0) {
                this.ctx.moveTo(node.x, node.y);
            } else {
                this.ctx.lineTo(node.x, node.y);
            }
        }
        this.ctx.stroke();

        // Ok işaretleri çiz
        for (let i = 1; i < this.currentRoute.length; i++) {
            const from = this.currentRoute[i - 1];
            const to = this.currentRoute[i];
            this.drawArrow(from, to);
        }
    }

    drawArrow(from, to) {
        const headlen = 15;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        // Ok başı pozisyonu (node'un kenarında)
        const arrowX = to.x - Math.cos(angle) * this.NODE_RADIUS;
        const arrowY = to.y - Math.sin(angle) * this.NODE_RADIUS;

        this.ctx.fillStyle = this.LINE_COLOR;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(arrowX - headlen * Math.cos(angle - Math.PI / 6),
                        arrowY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(arrowX - headlen * Math.cos(angle + Math.PI / 6),
                        arrowY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawNodes() {
        for (const node of this.nodes) {
            const isVisited = this.isVisited(node);
            
            // Node dairesi
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.NODE_RADIUS, 0, 2 * Math.PI);
            
            if (node.isDepot) {
                this.ctx.fillStyle = this.DEPOT_COLOR;
            } else if (isVisited) {
                this.ctx.fillStyle = this.VISITED_COLOR;
            } else {
                this.ctx.fillStyle = this.CUSTOMER_COLOR;
            }
            
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Node numarası/ikonu
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Segoe UI';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (node.isDepot) {
                this.ctx.fillText('🏠', node.x, node.y);
            } else {
                this.ctx.fillText(node.id.toString(), node.x, node.y);
            }
        }
    }

    showResult(isWin, title, message) {
        const modal = document.getElementById('resultModal');
        document.getElementById('resultTitle').innerHTML = title;
        document.getElementById('resultMessage').innerHTML = message;
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('resultModal').style.display = 'none';
    }
}

// Oyunu başlat
const game = new TSPGame();
