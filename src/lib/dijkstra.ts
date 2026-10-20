export type WeightedGraph = Record<string, Record<string, number>>;

export interface DijkstraResult {
    distance: number;
    path: string[];
}

export function dijkstra(
    graph: WeightedGraph,
    start: string,
    end: string
): DijkstraResult {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>(Object.keys(graph));

    for (const node of Object.keys(graph)) {
        distances[node] = Infinity;
        previous[node] = null;
    }

    distances[start] = 0;

    while (unvisited.size > 0) {
        let current: string | null = null;

        for (const node of unvisited) {
            if (
                current === null ||
                distances[node] < distances[current]
            ) {
                current = node;
            }
        }

        if (current === null) break;
        if (current === end) break;

        unvisited.delete(current);

        const neighbors = graph[current] || {};

        for (const [neighbor, weight] of Object.entries(neighbors)) {
            const candidate = distances[current] + weight;

            if (candidate < distances[neighbor]) {
                distances[neighbor] = candidate;
                previous[neighbor] = current;
            }
        }
    }

    const path: string[] = [];
    let current: string | null = end;

    while (current) {
        path.unshift(current);
        current = previous[current];
    }

    if (distances[end] === Infinity) {
        return {
            distance: Infinity,
            path: []
        };
    }

    return {
        distance: distances[end],
        path
    };
}