// Canvas ve global değişkenler
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let nodes = [];
let userRoute = [];
let totalDistance = 0;
let gameActive = false;
let solver;

// Canvas boyutlarını ayarla
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

/**
 * Rastgele node'lar oluşturur
 */
function generateNodes() {
    nodes = [];
    const nodeCountInput = document.getElementById("nodeCountInput");
    const nodeCount = parseInt(nodeCountInput?.value) || 10; // varsayılan 10
    
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            id: i,
            x: Math.random() * (canvas.width - 40) + 20,
            y: Math.random() * (canvas.height - 40) + 20
        });
    }

    document.getElementById("visitedCount").textContent = `0/${nodeCount}`;
}

/**
 * Canvas'ı temizleyip tüm node'ları ve rotaları çizer
 */
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Kullanıcı rotası çiz
    if (userRoute.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "#764ba2";
        ctx.lineWidth = 2;
        for (let i = 0; i < userRoute.length - 1; i++) {
            const a = userRoute[i];
            const b = userRoute[i + 1];
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
    }

    // Node'ları çiz
    nodes.forEach((node, index) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = index === 0 ? "green" : "dodgerblue"; // depo: yeşil, müşteri: mavi
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();

        // ID yazısı
        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.fillText(index, node.x - 4, node.y + 4);
    });
}

/**
 * İki nokta arasındaki Öklid mesafesi
 */
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Canvas tıklama olayı
 */
canvas.addEventListener("click", (event) => {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // En yakın node’u bul
    let nearestNode = null;
    let minDist = 20; // tıklama toleransı
    for (const node of nodes) {
        const d = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        if (d < minDist) {
            nearestNode = node;
            minDist = d;
        }
    }

    // Node tıklanmadıysa çık
    if (!nearestNode) return;

    // Daha önce ziyaret edilmişse atla
    if (userRoute.includes(nearestNode)) return;

    // İlk node depo olmalı
    if (userRoute.length === 0 && nearestNode.id !== 0) {
        alert("İlk olarak depo (yeşil) noktasından başlamalısın!");
        return;
    }

    userRoute.push(nearestNode);

    // Mesafeyi güncelle
    if (userRoute.length > 1) {
        const prev = userRoute[userRoute.length - 2];
        totalDistance += distance(prev, nearestNode);
    }

    // UI güncelle
    document.getElementById("visitedCount").textContent = `${userRoute.length}/${nodes.length}`;
    document.getElementById("currentDistance").textContent = `${totalDistance.toFixed(2)} km`;

    drawGame();

    // Tüm noktalar ziyaret edildiyse depoya dön
    if (userRoute.length === nodes.length) {
        totalDistance += distance(userRoute[userRoute.length - 1], userRoute[0]);
        document.getElementById("currentDistance").textContent = `${totalDistance.toFixed(2)} km`;
        gameActive = false;
        showResult();
    }
});

/**
 * Oyunu başlat
 */
document.getElementById("startBtn").addEventListener("click", () => {
    gameActive = true;
    userRoute = [];
    totalDistance = 0;

    generateNodes();
    drawGame();

    document.getElementById("resetBtn").disabled = false;
    document.getElementById("showSolutionBtn").disabled = false;

    // Optimal çözüm önceden hesapla
    solver = new TSPSolver(nodes);
    const solution = solver.solve();
    document.getElementById("optimalDistance").textContent = `${solution.distance.toFixed(2)} km`;
});

/**
 * Yeniden başlat
 */
document.getElementById("resetBtn").addEventListener("click", () => {
    gameActive = false;
    userRoute = [];
    totalDistance = 0;
    document.getElementById("currentDistance").textContent = "0 km";
    document.getElementById("visitedCount").textContent = `0/${nodes.length}`;
    drawGame();
});

/**
 * Optimal rotayı göster
 */
document.getElementById("showSolutionBtn").addEventListener("click", () => {
    if (!solver || !solver.bestRoute.length) return;

    const route = solver.bestRoute;

    drawGame();

    // Optimal rotayı turuncu renkle çiz
    ctx.beginPath();
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 3;
    for (let i = 0; i < route.length; i++) {
        const a = route[i];
        const b = route[(i + 1) % route.length];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
});

/**
 * Sonuç modalını göster
 */
function showResult() {
    const modal = document.getElementById("resultModal");
    const resultTitle = document.getElementById("resultTitle");
    const resultMessage = document.getElementById("resultMessage");

    const optimal = solver.bestDistance;
    const ratio = (totalDistance / optimal) * 100;

    resultTitle.textContent = "Oyun Bitti!";
    resultMessage.innerHTML = `
        Toplam Mesafen: <strong>${totalDistance.toFixed(2)} km</strong><br>
        Optimal Mesafe: <strong>${optimal.toFixed(2)} km</strong><br>
        Performans: <strong>${ratio.toFixed(1)}%</strong> (optimalin ${(ratio - 100).toFixed(1)}% fazlası)
    `;

    modal.style.display = "block";
}

document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("resultModal").style.display = "none";
});
