// Tiny safe expression compiler for LAB / FUNC markup (no eval).
// Supports + - * / ^ ** comparisons, functions sin cos tan exp log ln sqrt atan abs pow ..., constants pi and e.
export type Env = Record<string, number>;
type Fn = (env: Env) => number;

const FN: Record<string, (...a: number[]) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, log: Math.log, ln: Math.log, log10: Math.log10, sqrt: Math.sqrt,
  atan: Math.atan, asin: Math.asin, acos: Math.acos, abs: Math.abs, fabs: Math.abs, pow: Math.pow, min: Math.min, max: Math.max,
  floor: Math.floor, ceil: Math.ceil, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh
};
const cache = new Map<string, Fn>();

export function compile(src: string): Fn {
  const hit = cache.get(src);
  if (hit) return hit;
  type Tok = { k: "n" | "i" | "o"; v: string | number };
  const toks: Tok[] = [];
  const re = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+)|([A-Za-z_]\w*)|(\*\*|<=|>=|==|!=|[-+*/^<>(),]))/y;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) { if (/^\s*$/.test(src.slice(pos))) break; throw new Error("bad token in: " + src); }
    pos = re.lastIndex;
    if (m[1] !== undefined) toks.push({ k: "n", v: parseFloat(m[1]) });
    else if (m[2]) toks.push({ k: "i", v: m[2] });
    else toks.push({ k: "o", v: m[3] === "^" ? "**" : m[3] });
  }
  let p = 0;
  const isOp = (v: string) => !!toks[p] && toks[p].k === "o" && toks[p].v === v;
  const bin = (op: string, a: Fn, b: Fn): Fn =>
    op === "+" ? (E) => a(E) + b(E) : op === "-" ? (E) => a(E) - b(E) : op === "*" ? (E) => a(E) * b(E) : (E) => a(E) / b(E);

  function cmp(): Fn {
    let l = add();
    while (toks[p] && toks[p].k === "o" && /^(<|>|<=|>=|==|!=)$/.test(String(toks[p].v))) {
      const op = String(toks[p++].v), a = l, b = add();
      l = (E) => { const x = a(E), y = b(E); return +(op === "<" ? x < y : op === ">" ? x > y : op === "<=" ? x <= y : op === ">=" ? x >= y : op === "==" ? x === y : x !== y); };
    }
    return l;
  }
  function add(): Fn { let l = mul(); while (isOp("+") || isOp("-")) { const op = String(toks[p++].v); l = bin(op, l, mul()); } return l; }
  function mul(): Fn { let l = unary(); while (isOp("*") || isOp("/")) { const op = String(toks[p++].v); l = bin(op, l, unary()); } return l; }
  function unary(): Fn {
    if (isOp("-")) { p++; const u = unary(); return (E) => -u(E); }
    if (isOp("+")) { p++; return unary(); }
    return pw();
  }
  function pw(): Fn {
    const b = atom();
    if (isOp("**")) { p++; const e = unary(); return (E) => Math.pow(b(E), e(E)); }
    return b;
  }
  function atom(): Fn {
    const t = toks[p++];
    if (!t) throw new Error("unexpected end: " + src);
    if (t.k === "n") { const v = t.v as number; return () => v; }
    if (t.k === "o" && t.v === "(") { const e = cmp(); if (!isOp(")")) throw new Error("missing ) in " + src); p++; return e; }
    if (t.k === "i") {
      const name = String(t.v);
      if (isOp("(")) {
        p++;
        const args: Fn[] = [];
        if (!isOp(")")) { args.push(cmp()); while (isOp(",")) { p++; args.push(cmp()); } }
        if (!isOp(")")) throw new Error("missing ) in " + src);
        p++;
        const f = FN[name];
        if (!f) throw new Error("unknown function " + name);
        return (E) => f(...args.map((a) => a(E)));
      }
      return (E) => { if (name in E) return E[name]; if (name === "pi") return Math.PI; if (name === "e") return Math.E; throw new Error("unknown name " + name); };
    }
    throw new Error("unexpected token in " + src);
  }
  const fn = cmp();
  if (p < toks.length) throw new Error("trailing tokens in " + src);
  cache.set(src, fn);
  return fn;
}
export const num = (src: string, env: Env = {}) => compile(src)(env);
