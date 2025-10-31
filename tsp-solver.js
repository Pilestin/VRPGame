/**
 * TSP Solver - Optimal rota hesaplama
 * Nearest Neighbor ve 2-opt algoritmaları kullanılır
 */

class TSPSolver {
    constructor(nodes) {
        this.nodes = nodes;
        this.bestRoute = [];
        this.bestDistance = Infinity;
    }

    /**
     * İki nokta arasındaki Öklid mesafesini hesaplar
     */
    calculateDistance(node1, node2) {
        const dx = node1.x - node2.x;
        const dy = node1.y - node2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Bir rotanın toplam mesafesini hesaplar
     */
    calculateRouteDistance(route) {
        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += this.calculateDistance(route[i], route[i + 1]);
        }
        // Son noktadan başlangıca dön
        totalDistance += this.calculateDistance(route[route.length - 1], route[0]);
        return totalDistance;
    }

    /**
     * Nearest Neighbor algoritması ile başlangıç rotası oluşturur
     */
    nearestNeighbor() {
        const depot = this.nodes[0]; // İlk node depo
        const unvisited = this.nodes.slice(1); // Diğer node'lar
        const route = [depot];

        while (unvisited.length > 0) {
            const current = route[route.length - 1];
            let nearestIndex = 0;
            let nearestDistance = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const distance = this.calculateDistance(current, unvisited[i]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            route.push(unvisited[nearestIndex]);
            unvisited.splice(nearestIndex, 1);
        }

        return route;
    }

    /**
     * 2-opt algoritması ile rotayı optimize eder
     */
    twoOptOptimization(route, maxIterations = 1000) {
        let improved = true;
        let iterations = 0;
        let currentRoute = [...route];
        let currentDistance = this.calculateRouteDistance(currentRoute);

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            for (let i = 1; i < currentRoute.length - 1; i++) {
                for (let j = i + 1; j < currentRoute.length; j++) {
                    // İki kenarı değiştir
                    const newRoute = this.twoOptSwap(currentRoute, i, j);
                    const newDistance = this.calculateRouteDistance(newRoute);

                    if (newDistance < currentDistance) {
                        currentRoute = newRoute;
                        currentDistance = newDistance;
                        improved = true;
                    }
                }
            }
        }

        return { route: currentRoute, distance: currentDistance };
    }

    /**
     * 2-opt swap işlemi
     */
    twoOptSwap(route, i, j) {
        const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
        return newRoute;
    }

    /**
     * Optimal rotayı hesaplar (Nearest Neighbor + 2-opt)
     */
    solve() {
        // Nearest Neighbor ile başlangıç rotası
        const initialRoute = this.nearestNeighbor();
        
        // 2-opt ile optimize et
        const optimized = this.twoOptOptimization(initialRoute);
        
        this.bestRoute = optimized.route;
        this.bestDistance = optimized.distance;

        return {
            route: this.bestRoute,
            distance: this.bestDistance
        };
    }

    /**
     * Birden fazla başlangıç noktası deneyerek en iyi rotayı bulur
     */
    solveMultiStart(attempts = 5) {
        let bestSolution = null;

        for (let attempt = 0; attempt < attempts; attempt++) {
            // Her denemede farklı bir sıralama ile başla
            const shuffledNodes = this.shuffleArray([...this.nodes.slice(1)]);
            const tempNodes = [this.nodes[0], ...shuffledNodes];
            
            const tempSolver = new TSPSolver(tempNodes);
            const solution = tempSolver.solve();

            if (!bestSolution || solution.distance < bestSolution.distance) {
                bestSolution = solution;
            }
        }

        this.bestRoute = bestSolution.route;
        this.bestDistance = bestSolution.distance;

        return bestSolution;
    }

    /**
     * Array'i karıştırır (Fisher-Yates shuffle)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
