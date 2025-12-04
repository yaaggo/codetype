export const algorithms = [
    {
        id: 'binary-search',
        title: 'Binary Search',
        group: 'Searching',
        kind: 'algorithm',
        code: `int binarySearch(vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target)
            return mid;
        
        if (arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    return -1;
}`
    },
    {
        id: 'dfs-graph',
        title: 'DFS',
        group: 'Graph Algorithms',
        kind: 'algorithm',
        code: `void dfs(int u, vector<vector<int>>& adj, vector<bool>& visited) {
    visited[u] = true;
    // Process node u
    
    for (int v : adj[u]) {
        if (!visited[v]) {
            dfs(v, adj, visited);
        }
    }
}`
    },
    {
        id: 'bfs-graph',
        title: 'BFS',
        group: 'Graph Algorithms',
        kind: 'algorithm',
        code: `void bfs(int start, vector<vector<int>>& adj, int n) {
    vector<bool> visited(n, false);
    queue<int> q;

    visited[start] = true;
    q.push(start);

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        // Process node u

        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
}`
    },
    {
        id: 'segment-tree-build',
        title: 'Build',
        group: 'Segment Tree',
        kind: 'structure',
        code: `void build(int node, int start, int end, vector<int>& tree, vector<int>& arr) {
    if (start == end) {
        tree[node] = arr[start];
    } else {
        int mid = (start + end) / 2;
        build(2 * node, start, mid, tree, arr);
        build(2 * node + 1, mid + 1, end, tree, arr);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
}`
    },
    {
        id: 'segment-tree-update',
        title: 'Update',
        group: 'Segment Tree',
        kind: 'structure',
        code: `void update(int node, int start, int end, int idx, int val, vector<int>& tree) {
    if (start == end) {
        tree[node] = val;
    } else {
        int mid = (start + end) / 2;
        if (start <= idx && idx <= mid)
            update(2 * node, start, mid, idx, val, tree);
        else
            update(2 * node + 1, mid + 1, end, idx, val, tree);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
}`
    },
    {
        id: 'segment-tree-query',
        title: 'Query',
        group: 'Segment Tree',
        kind: 'structure',
        code: `int query(int node, int start, int end, int l, int r, vector<int>& tree) {
    if (r < start || end < l)
        return 0;
    if (l <= start && end <= r)
        return tree[node];
    int mid = (start + end) / 2;
    return query(2 * node, start, mid, l, r, tree) +
           query(2 * node + 1, mid + 1, end, l, r, tree);
}`
    }
];
