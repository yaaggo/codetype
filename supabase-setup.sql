-- CodeType Database Schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- ========================================
-- 1. ALGORITHMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS algorithms (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    group_path TEXT,
    kind TEXT CHECK (kind IN ('algorithm', 'structure')),
    code TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. FOLDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS folders (
    path TEXT PRIMARY KEY,
    markdown TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. USER PROGRESS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_progress (
    algorithm_id TEXT PRIMARY KEY,
    best_wpm INTEGER DEFAULT 0,
    last_practiced TIMESTAMPTZ,
    interval INTEGER DEFAULT 0,
    due_date TIMESTAMPTZ,
    last_reviewed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (algorithm_id) REFERENCES algorithms(id) ON DELETE CASCADE
);

-- ========================================
-- 4. APP SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_algorithms_group ON algorithms(group_path);
CREATE INDEX IF NOT EXISTS idx_algorithms_kind ON algorithms(kind);
CREATE INDEX IF NOT EXISTS idx_algorithms_order ON algorithms(sort_order);
CREATE INDEX IF NOT EXISTS idx_progress_due ON user_progress(due_date);

-- ========================================
-- 6. INITIAL DATA - YOUR SEGMENT TREE ALGORITHMS
-- ========================================

-- Insert your Segment Tree algorithms
INSERT INTO algorithms (id, title, group_path, kind, code, sort_order) VALUES
('custom-1764860726158', 'Min SegTree', 'Segtree/Min SegTree', 'structure', 'struct segtree {
    int n;
    vector<int> seg;
    segtree(int n) {
        this->n = n;
        seg.assign(4 * n, INT_MAX);
    }
    void build(vector<int> &a, int idx, int l, int r) {
        if (l == r) {
            seg[idx] = a[l];
            return;
        }
        int mid = (l + r) / 2;
        build(a, 2 * idx, l, mid);
        build(a, 2 * idx + 1, mid + 1, r);
        seg[idx] = min(seg[2 * idx], seg[2 * idx + 1]);
    }
    int query(int idx, int l, int r, int ql, int qr) {
        if (qr < l || ql > r) return INT_MAX;
        if (ql <= l && r <= qr) return seg[idx];
        int mid = (l + r) / 2;
        return min(
            query(2 * idx, l, mid, ql, qr),
            query(2 * idx + 1, mid + 1, r, ql, qr)
        );
    }
    void update(int idx, int l, int r, int pos, int val) {
        if (l == r) {
            seg[idx] = val;
            return;
        }
        int mid = (l + r) / 2;
        if (pos <= mid) update(2 * idx, l, mid, pos, val);
        else update(2 * idx + 1, mid + 1, r, pos, val);
        seg[idx] = min(seg[2 * idx], seg[2 * idx + 1]);
    }
};', 0),

('custom-1764860337295', 'Build', 'Segtree/Min SegTree', 'algorithm', 'void build(vector<int> &a, int idx, int l, int r) {
    if (l == r) {
        seg[idx] = a[l];
        return;
    }
    int mid = (l + r) / 2;
    build(a, 2 * idx, l, mid);
    build(a, 2 * idx + 1, mid + 1, r);
    seg[idx] = min(seg[2 * idx], seg[2 * idx + 1]);
}', 1),

('custom-1764861175614', 'Update', 'Segtree/Min SegTree', 'algorithm', 'void update(int idx, int l, int r, int pos, int val) {
        if (l == r) {
            seg[idx] = val;
            return;
        }
        int mid = (l + r) / 2;
        if (pos <= mid) update(2 * idx, l, mid, pos, val);
        else update(2 * idx + 1, mid + 1, r, pos, val);
        seg[idx] = min(seg[2 * idx], seg[2 * idx + 1]);
    }', 2),

('custom-1764860365475', 'Query', 'Segtree/Min SegTree', 'algorithm', 'int query(int idx, int l, int r, int ql, int qr) {
    if (qr < l || ql > r) return INT_MAX;
    if (ql <= l && r <= qr) return seg[idx];
    int mid = (l + r) / 2;
    return min(
        query(2 * idx, l, mid, ql, qr),
        query(2 * idx + 1, mid + 1, r, ql, qr)
    );
}', 3),

('custom-1764863002411', 'Lazy Increment Sum SegTree', 'Segtree/Lazy Increment Sum SegTree', 'structure', 'struct segtree {
    int n;
    vector<int> seg, lazy;
    segtree_inc(int n) {
        this->n = n;
        seg.assign(4 * n, 0);
        lazy.assign(4 * n, 0);
    }
    void build(vector<int> &a, int idx, int l, int r) {
        if (l == r) {
            seg[idx] = a[l];
            return;
        }
        int mid = (l + r) / 2;
        build(a, 2 * idx, l, mid);
        build(a, 2 * idx + 1, mid + 1, r);
        seg[idx] = seg[2 * idx] + seg[2 * idx + 1];
    }
    void push(int idx, int l, int r) {
        if (lazy[idx] != 0) {
            seg[idx] += lazy[idx] * (r - l + 1);
            if (l != r) {
                lazy[2 * idx]     += lazy[idx];
                lazy[2 * idx + 1] += lazy[idx];
            }
            lazy[idx] = 0;
        }
    }
    void update_range(int idx, int l, int r, int ql, int qr, int val) {
        push(idx, l, r);
        if (qr < l || ql > r) return;
        if (ql <= l && r <= qr) {
            lazy[idx] += val;
            push(idx, l, r);
            return;
        }
        int mid = (l + r) / 2;
        update_range(2 * idx, l, mid, ql, qr, val);
        update_range(2 * idx + 1, mid + 1, r, ql, qr, val);
        seg[idx] = seg[2 * idx] + seg[2 * idx + 1];
    }
    int query(int idx, int l, int r, int ql, int qr) {
        push(idx, l, r);
        if (qr < l || ql > r) return 0;
        if (ql <= l && r <= qr) return seg[idx];
        int mid = (l + r) / 2;
        return query(2 * idx, l, mid, ql, qr) +
               query(2 * idx + 1, mid + 1, r, ql, qr);
    }
};', 4),

('custom-1764863218314', 'Push', 'Segtree/Lazy Increment Sum SegTree', 'algorithm', 'void push(int idx, int l, int r) {
    if (lazy[idx] != 0) {
        seg[idx] += lazy[idx] * (r - l + 1);
        if (l != r) {
            lazy[2 * idx]     += lazy[idx];
            lazy[2 * idx + 1] += lazy[idx];
        }
        lazy[idx] = 0;
    }
}', 5),

('custom-1764863667616', 'Update Range', 'Segtree/Lazy Increment Sum SegTree', 'algorithm', 'void update_range(int idx, int l, int r, int ql, int qr, int val) {
    push(idx, l, r);
    if (qr < l || ql > r) return;
    if (ql <= l && r <= qr) {
        lazy[idx] += val;
        push(idx, l, r);
        return;
    }
    int mid = (l + r) / 2;
    update_range(2 * idx, l, mid, ql, qr, val);
    update_range(2 * idx + 1, mid + 1, r, ql, qr, val);
    seg[idx] = seg[2 * idx] + seg[2 * idx + 1];
}', 6),

('custom-1764863712181', 'Query', 'Segtree/Lazy Increment Sum SegTree', 'algorithm', 'int query(int idx, int l, int r, int ql, int qr) {
    push(idx, l, r);
    if (qr < l || ql > r) return 0;
    if (ql <= l && r <= qr) return seg[idx];
    int mid = (l + r) / 2;
    return query(2 * idx, l, mid, ql, qr) + query(2 * idx + 1, mid + 1, r, ql, qr);
}', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert folders with your documentation
INSERT INTO folders (path, markdown) VALUES
('Segtree/Min SegTree', '# 📌 Segment Tree — Explicação do Código

A **Segment Tree** é uma estrutura de dados que permite realizar consultas e atualizações em intervalos de forma eficiente, geralmente em **O(log n)**.

Este exemplo implementa uma segment tree para **consultar o valor mínimo** em um intervalo e atualizar valores de forma dinâmica.

---

## 📂 Estrutura da Segment Tree

```cpp
struct segtree {
    int n;
    vector<int> seg;
```

* `n` → tamanho do array original.
* `seg` → vetor interno da árvore, com tamanho aproximadamente `4 * n` (seguro para armazenar toda a estrutura da árvore).

---

## 🧱 Construtor

```cpp
segtree(int n) {
    this->n = n;
    seg.assign(4 * n, INT_MAX);
}
```

* Define `n`.
* Inicializa o vetor `seg` com `INT_MAX` pois estamos trabalhando com consultas de mínimo.

---

## 🛠 Função `build` — Construção da árvore

```cpp
void build(vector<int> &a, int idx, int l, int r) {
    if (l == r) {
        seg[idx] = a[l];
        return;
    }
    int mid = (l + r) / 2;
    build(a, 2 * idx, l, mid);
    build(a, 2 * idx + 1, mid + 1, r);
    seg[idx] = min(seg[2 * idx], seg[2 * idx + 1]);
}
```

### 🔹 Objetivo:

Construir a árvore com base no array `a`.

### 🔹 Como funciona:

* Se `l == r`, estamos em uma *folha*, então `seg[idx] = a[l]`.
* Divide o intervalo em duas metades:

  * Esquerda: `[l, mid]`
  * Direita: `[mid+1, r]`
* O nó atual (`idx`) recebe o **mínimo** entre seus dois filhos.

---

## 🔍 Função `query` — Consulta de mínimo em um intervalo `[ql, qr]`

```cpp
int query(int idx, int l, int r, int ql, int qr) {
    if (qr < l || ql > r) return INT_MAX;
    if (ql <= l && r <= qr) return seg[idx];
    int mid = (l + r) / 2;
    return min(
        query(2 * idx, l, mid, ql, qr),
        query(2 * idx + 1, mid + 1, r, ql, qr)
    );
}
```

### 🔹 Casos tratados:

| Situação                              | Comportamento                |
| ------------------------------------- | ---------------------------- |
| Intervalo fora de `[ql, qr]`          | retorna `INT_MAX`            |
| Intervalo totalmente dentro do pedido | retorna `seg[idx]`           |
| Parcialmente dentro                   | divide e junta os resultados |

Consulta sempre percorre **apenas os nós necessários**, mantendo a complexidade `O(log n)`.

---

## ✏ Função `update` — Atualizar elemento

```cpp
void update(int idx, int l, int r, int pos, int val) {
    if (l == r) {
        seg[idx] = val;
        return;
    }
    int mid = (l + r) / 2;
    if (pos <= mid) update(2 * idx, l, mid, pos, val);
    else update(2 * idx + 1, mid + 1, r, pos, val);
    seg[idx] = min(seg[2 * idx], seg[2 * idx + 1]);
}
```

### 🔹 Objetivo:

Modificar `a[pos] = val` e atualizar a árvore.

### 🔹 Como funciona:

* Navega até a folha correspondente.
* Atualiza o valor.
* Na volta da recursão, recalcula os mínimos dos nós ascendentes.

Complexidade: **`O(log n)`**.

---

## 🚀 Resumo Geral

| Operação   | O que faz                       | Complexidade |
| ---------- | ------------------------------- | ------------ |
| `build()`  | Monta estrutura inicial         | `O(n)`       |
| `query()`  | Consulta mínimo em um intervalo | `O(log n)`   |
| `update()` | Atualiza um valor do array      | `O(log n)`   |

A Segment Tree é extremamente eficiente quando temos **muitas consultas e atualizações em intervalos**.
'),

('Segtree/Lazy Increment Sum SegTree', '# 🌳 Segment Tree com Lazy Propagation — Incremento por Intervalo

Essa estrutura permite:

| Operação                                                 | Tempo        |
| -------------------------------------------------------- | ------------ |
| Atualizar todos os valores em um intervalo somando `val` | **O(log n)** |
| Consultar soma em um intervalo                           | **O(log n)** |
| Construir a árvore                                       | **O(n)**     |

A técnica **Lazy Propagation** evita recalcular atualizações imediatamente quando possível, armazenando incrementos pendentes para aplicar apenas quando necessário.

---

## 📂 Estrutura Geral

```cpp
struct segtree_inc {
    int n;
    vector<int> seg, lazy;
```

* `seg[]` armazena os **valores da segment tree (somas)**.
* `lazy[]` guarda **atualizações pendentes de incremento** ainda não aplicadas.

---

## 🧱 Construtor

```cpp
segtree_inc(int n) {
    this->n = n;
    seg.assign(4 * n, 0);
    lazy.assign(4 * n, 0);
}
```

* Inicializa duas árvores (`seg` e `lazy`).
* Usa `4 * n` para garantir memória suficiente.

---

## 🔨 build() — Construção da Árvore

```cpp
void build(vector<int> &a, int idx, int l, int r) {
    if (l == r) {
        seg[idx] = a[l];
        return;
    }
    int mid = (l + r) / 2;
    build(a, 2 * idx, l, mid);
    build(a, 2 * idx + 1, mid + 1, r);
    seg[idx] = seg[2 * idx] + seg[2 * idx + 1];
}
```

* Folha recebe valor diretamente do array.
* Nó interno = soma dos dois filhos.

---

## ⚡ push() — Aplicando Lazy Propagation

```cpp
void push(int idx, int l, int r) {
    if (lazy[idx] != 0) {
        seg[idx] += lazy[idx] * (r - l + 1);
        if (l != r) {
            lazy[2 * idx] += lazy[idx];
            lazy[2 * idx + 1] += lazy[idx];
        }
        lazy[idx] = 0;
    }
}
```

📌 **Objetivo:** Aplicar incrementos pendentes.

* A soma do segmento é incrementada por `(r - l + 1) * valor`.
* Se não for folha, repassa o incremento acumulado para os dois filhos.
* Limpa `lazy[idx]` após aplicar.

👉 **Por isso é rápido:** não atualiza cada elemento individualmente — atualiza um intervalo inteiro de uma vez.

---

## ✏ update_range() — Atualização por Intervalo

```cpp
void update_range(int idx, int l, int r, int ql, int qr, int val) {
    push(idx, l, r);
    if (qr < l || ql > r) return;
    if (ql <= l && r <= qr) {
        lazy[idx] += val;
        push(idx, l, r);
        return;
    }
    int mid = (l + r) / 2;
    update_range(2 * idx, l, mid, ql, qr, val);
    update_range(2 * idx + 1, mid + 1, r, ql, qr, val);
    seg[idx] = seg[2 * idx] + seg[2 * idx + 1];
}
```

### Cenários:

| Situação                    | Ação                      |
| --------------------------- | ------------------------- |
| Intervalo fora do alcance   | Ignora                    |
| Intervalo totalmente dentro | Guarda no `lazy` e aplica |
| Parcialmente dentro         | Divide recursivamente     |

Recalcula `seg[idx]` com base nos filhos quando sobe a recursão.

---

## 🔍 query() — Consulta por Intervalo

```cpp
int query(int idx, int l, int r, int ql, int qr) {
    push(idx, l, r);
    if (qr < l || ql > r) return 0;
    if (ql <= l && r <= qr) return seg[idx];
    int mid = (l + r) / 2;
    return query(2 * idx, l, mid, ql, qr) +
           query(2 * idx + 1, mid + 1, r, ql, qr);
}
```

Antes de consultar, garante que qualquer atualização pendente foi aplicada via `push()`.

---

## 🧩 Interface Simplificada para o Usuário

```cpp
void build(vector<int> &a) { build(a, 1, 0, n - 1); }
void update_range(int l, int r, int val) { update_range(1, 0, n - 1, l, r, val); }
int query(int ql, int qr) { return query(1, 0, n - 1, ql, qr); }
```

Facilita o uso, escondendo detalhes internos como `idx`, `l`, `r`.

---

## 🚀 Resumo Final

| Função                    | O que faz                    |
| ------------------------- | ---------------------------- |
| `build()`                 | Cria a árvore                |
| `update_range(l, r, val)` | Soma `val` em todo intervalo |
| `query(l, r)`             | Retorna a soma no intervalo  |

| Técnica          | Por que é útil?                                          |
| ---------------- | -------------------------------------------------------- |
| Lazy Propagation | Evita recalcular um intervalo inteiro desnecessariamente |

---
')
ON CONFLICT (path) DO UPDATE SET markdown = EXCLUDED.markdown;

-- Insert your progress data
INSERT INTO user_progress (algorithm_id, best_wpm) VALUES
('custom-1764860337295', 69),
('custom-1764860365475', 66),
('custom-1764863218314', 65),
('custom-1764863712181', 70)
ON CONFLICT (algorithm_id) DO UPDATE SET best_wpm = GREATEST(user_progress.best_wpm, EXCLUDED.best_wpm);

-- Initialize streak
INSERT INTO app_settings (key, value) VALUES
('streak', '{"count": 1, "lastDate": "2025-12-04T14:04:10.350Z"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- 7. ENABLE ROW LEVEL SECURITY (DISABLED FOR NOW)
-- ========================================
-- For single-user app, we disable RLS
-- Future: enable with authentication

ALTER TABLE algorithms DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- ========================================
-- DONE! Your database is ready 🎉
-- ========================================

SELECT 'Database setup complete! You have ' || COUNT(*) || ' algorithms loaded.' as status
FROM algorithms;
