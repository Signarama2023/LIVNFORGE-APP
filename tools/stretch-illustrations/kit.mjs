// Shared cartoon-character kit. Every stretch SVG is composed from these so the
// whole set stays consistent. Side-view figure on a mat, LIVN FORGE palette.
export const C = {
  stage: "#f4efe4", mat: "#e6c079", matEdge: "#d9ab5e",
  skin: "#e8ab80", skinFar: "#d1926a", shirt: "#2e6f6a", shorts: "#33424e",
  hair: "#3a2b24", gold: "#c9832e",
};
const n = (v) => Math.round(v * 10) / 10;
const V = (x, y) => ({ x, y });
const sub = (a, b) => V(a.x - b.x, a.y - b.y);
const add = (a, b) => V(a.x + b.x, a.y + b.y);
const mul = (a, s) => V(a.x * s, a.y * s);
const norm = (a) => { const l = Math.hypot(a.x, a.y) || 1; return V(a.x / l, a.y / l); };
const perp = (a) => V(-a.y, a.x);

// rounded capsule segment
export function seg(a, b, color, w) {
  return `<path d="M${n(a[0])} ${n(a[1])} L${n(b[0])} ${n(b[1])}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}
// two-segment limb through a joint
function limb2(p, color, w) {
  return `<path d="M${n(p[0][0])} ${n(p[0][1])} L${n(p[1][0])} ${n(p[1][1])} L${n(p[2][0])} ${n(p[2][1])}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
export function hand(p, color) { return `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="5.5" fill="${color}"/>`; }
export function foot(p, color) { return `<ellipse cx="${n(p[0])}" cy="${n(p[1])}" rx="8.5" ry="4.5" fill="${color}"/>`; }

// tapered torso (shirt) between hip and neck, rounded at both ends
export function torso(hip, neck, wHip = 9, wSh = 11) {
  const H = V(hip[0], hip[1]), N = V(neck[0], neck[1]);
  const ax = norm(sub(N, H)); const p = perp(ax);
  const a1 = add(H, mul(p, wHip)), a2 = sub(H, mul(p, wHip));
  const b1 = add(N, mul(p, wSh)), b2 = sub(N, mul(p, wSh));
  const path = `M${n(a1.x)} ${n(a1.y)} L${n(b1.x)} ${n(b1.y)} L${n(b2.x)} ${n(b2.y)} L${n(a2.x)} ${n(a2.y)} Z`;
  return `<path d="${path}" fill="${C.shirt}"/>`
    + `<circle cx="${n(N.x)}" cy="${n(N.y)}" r="${wSh}" fill="${C.shirt}"/>`
    + `<circle cx="${n(H.x)}" cy="${n(H.y)}" r="${wHip}" fill="${C.shirt}"/>`;
}
// shorts blob at pelvis
export function shorts(hip, r = 11) { return `<circle cx="${n(hip[0])}" cy="${n(hip[1])}" r="${r}" fill="${C.shorts}"/>`; }

// head with simple face; face 'r' looks right, 'l' looks left
export function head(cx, cy, face = "r", hair = "short") {
  const s = face === "r" ? 1 : -1;
  const ear = `<circle cx="${n(cx - 13 * s)}" cy="${n(cy + 2)}" r="3.6" fill="${C.skin}"/>`;
  const nose = `<path d="M${n(cx + 13.5 * s)} ${n(cy - 1)} l${n(4 * s)} 2 l${n(-4 * s)} 2" fill="none" stroke="${C.skinFar}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const eye = `<circle cx="${n(cx + 6 * s)}" cy="${n(cy - 1)}" r="1.7" fill="${C.hair}"/>`;
  const face_ = `<circle cx="${n(cx)}" cy="${n(cy)}" r="14" fill="${C.skin}"/>`;
  let h;
  if (hair === "pony") {
    h = `<path d="M${n(cx - 14)} ${n(cy)} Q${n(cx - 14)} ${n(cy - 16)} ${n(cx)} ${n(cy - 16)} Q${n(cx + 14)} ${n(cy - 16)} ${n(cx + 14)} ${n(cy)} Q${n(cx + 7)} ${n(cy - 9)} ${n(cx)} ${n(cy - 8)} Q${n(cx - 7)} ${n(cy - 9)} ${n(cx - 14)} ${n(cy)} Z" fill="${C.hair}"/>`
      + `<path d="M${n(cx - 15 * s)} ${n(cy - 2)} q${n(-9 * s)} 6 ${n(-4 * s)} 16" fill="none" stroke="${C.hair}" stroke-width="6" stroke-linecap="round"/>`;
  } else {
    h = `<path d="M${n(cx - 14)} ${n(cy)} Q${n(cx - 14)} ${n(cy - 16)} ${n(cx)} ${n(cy - 16)} Q${n(cx + 14)} ${n(cy - 16)} ${n(cx + 14)} ${n(cy)} Q${n(cx + 7)} ${n(cy - 9)} ${n(cx)} ${n(cy - 8)} Q${n(cx - 7)} ${n(cy - 9)} ${n(cx - 14)} ${n(cy)} Z" fill="${C.hair}"/>`;
  }
  return ear + face_ + eye + nose + h;
}

// gold direction arrow: array of [x,y] points (a smooth path) + arrowhead angle(deg) at last point
export function arrow(points, headDeg) {
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;
  if (points.length === 3) d += ` Q${n(points[1][0])} ${n(points[1][1])} ${n(points[2][0])} ${n(points[2][1])}`;
  else for (let i = 1; i < points.length; i++) d += ` L${n(points[i][0])} ${n(points[i][1])}`;
  const tip = points[points.length - 1];
  const a = (headDeg * Math.PI) / 180;
  const L = 7;
  const h1 = [tip[0] - L * Math.cos(a - 0.5), tip[1] - L * Math.sin(a - 0.5)];
  const h2 = [tip[0] - L * Math.cos(a + 0.5), tip[1] - L * Math.sin(a + 0.5)];
  return `<path d="${d}" fill="none" stroke="${C.gold}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M${n(h1[0])} ${n(h1[1])} L${n(tip[0])} ${n(tip[1])} L${n(h2[0])} ${n(h2[1])}" fill="none" stroke="${C.gold}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Compose a full character from a skeleton spec.
export function character(sk) {
  const out = [];
  if (sk.farArm) out.push(limb2(sk.farArm, C.skinFar, 9));
  if (sk.farLeg) out.push(limb2(sk.farLeg, C.skinFar, 11));
  if (sk.nearLeg) { // thigh = shorts, shin = skin
    out.push(seg(sk.nearLeg[0], sk.nearLeg[1], C.shorts, 16));
    out.push(seg(sk.nearLeg[1], sk.nearLeg[2], C.skin, 13));
  }
  if (sk.shorts) out.push(shorts(sk.shorts));
  out.push(torso(sk.torso[0], sk.torso[1]));
  if (sk.nearArm) {
    out.push(`<circle cx="${n(sk.nearArm[0][0])}" cy="${n(sk.nearArm[0][1])}" r="8" fill="${C.shirt}"/>`);
    out.push(limb2(sk.nearArm, C.skin, 9));
    out.push(hand(sk.nearArm[2], C.skin));
  }
  for (const f of (sk.feet || [])) out.push(foot(f, C.skin));
  out.push(head(sk.head[0], sk.head[1], sk.face || "r", sk.hair || "short"));
  return out.join("");
}

export function svg(sk, matRx = 74) {
  const body = character(sk);
  const arrows = (sk.arrows || []).map((a) => arrow(a.p, a.deg)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 196">`
    + `<rect width="200" height="196" fill="${C.stage}"/>`
    + `<ellipse cx="100" cy="172" rx="${matRx}" ry="7" fill="${C.mat}"/>`
    + body + arrows + `</svg>`;
}
