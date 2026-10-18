#!/usr/bin/env python3
# Gera public/login-comunidade.svg, a ilustração "pessoas conectadas" do login e das boas-vindas
# (vetorial e original, sem fotos de terceiros). Uso: python3 scripts/gerar-fundo-login.py > public/login-comunidade.svg
import math, random, sys
random.seed(7)
W, H = 1600, 1000
SKIN = ['#F3CDB0', '#E8B48C', '#D39A6A', '#B97A4B', '#8D5524', '#6B3E22', '#F6D7C3']
HAIR = ['#1F1410', '#3B2417', '#5A3420', '#2B2B2B', '#8A5A2B', '#C9A27A', '#141414']
SHIRT = ['#FFFFFF', '#F7E7D9', '#FFB4A6', '#F59E0B', '#0F766E', '#FDE68A', '#FCA5A5', '#E7E5E4', '#1C1917']
BG = ['#FDF1F0', '#FFF7ED', '#F0FDFA', '#FEF3C7', '#F5F5F4', '#FFE4E1']

# Posições (x, y, raio): mais gente à direita e embaixo; o canto esquerdo fica livre para o texto.
nodes = []
def free(x, y, r):
    return all(math.hypot(x - a, y - b) > r + c + 34 for a, b, c in nodes)
tries = 0
while len(nodes) < 23 and tries < 20000:
    tries += 1
    x = random.uniform(60, W - 60); y = random.uniform(60, H - 60)
    r = random.choice([30, 36, 44, 52, 60, 70, 82])
    if x - r < 700 and y + r > 190 and y - r < 920:  # área do texto de boas-vindas
        continue
    if x > 1080 and y < 600 and random.random() < 0.6:  # atrás do cartão de login: menos gente
        continue
    if free(x, y, r):
        nodes.append((x, y, r))

edges = set()
for i, (x, y, r) in enumerate(nodes):
    d = sorted(range(len(nodes)), key=lambda j: math.hypot(nodes[j][0] - x, nodes[j][1] - y))
    for j in d[1:random.choice([3, 3, 4])]:
        edges.add(tuple(sorted((i, j))))

out = []
o = out.append
o(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">')
o('<title>Pessoas conectadas</title>')
o('''<defs>
<radialGradient id="bg" cx="72%" cy="38%" r="85%">
  <stop offset="0" stop-color="#E0301E"/><stop offset=".45" stop-color="#A3140A"/><stop offset="1" stop-color="#3A0A05"/>
</radialGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%">
  <stop offset="0" stop-color="#FFD7C9" stop-opacity=".55"/><stop offset="1" stop-color="#FFD7C9" stop-opacity="0"/>
</radialGradient>
<pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#fff" fill-opacity=".09"/></pattern>
<style>
  .pulse{animation:p 4.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  .flow{stroke-dasharray:2 10;animation:f 9s linear infinite}
  @keyframes p{0%,100%{opacity:.25;transform:scale(.9)}50%{opacity:.7;transform:scale(1.15)}}
  @keyframes f{to{stroke-dashoffset:-240}}
  @media (prefers-reduced-motion:reduce){.pulse,.flow{animation:none}}
</style>
</defs>''')
o(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
o(f'<rect width="{W}" height="{H}" fill="url(#dots)"/>')
for k, (cx, cy, rr) in enumerate([(1150, 380, 520), (300, 900, 380)]):
    o(f'<circle cx="{cx}" cy="{cy}" r="{rr}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="1.5"/>')
    o(f'<circle cx="{cx}" cy="{cy}" r="{rr*0.68:.0f}" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="1.5" stroke-dasharray="3 9"/>')

# Conexões
for i, j in sorted(edges):
    (x1, y1, r1), (x2, y2, r2) = nodes[i], nodes[j]
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    bend = random.uniform(-0.18, 0.18) * L
    qx, qy = mx - dy / L * bend, my + dx / L * bend
    path = f'M{x1:.0f},{y1:.0f} Q{qx:.0f},{qy:.0f} {x2:.0f},{y2:.0f}'
    o(f'<path d="{path}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.6"/>')
    o(f'<path class="flow" d="{path}" fill="none" stroke="#FFE1D6" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round" style="animation-delay:-{random.uniform(0,9):.1f}s"/>')
    # pacote no meio da curva
    t = random.uniform(.35, .65)
    px = (1-t)**2*x1 + 2*(1-t)*t*qx + t*t*x2; py = (1-t)**2*y1 + 2*(1-t)*t*qy + t*t*y2
    o(f'<circle cx="{px:.0f}" cy="{py:.0f}" r="3.2" fill="#FFF3EE" fill-opacity=".85"/>')

def person(i, cx, cy, r):
    skin = random.choice(SKIN); hair = random.choice(HAIR); shirt = random.choice(SHIRT); bg = random.choice(BG)
    style = random.choice(['curto', 'longo', 'coque', 'cacheado', 'raspado', 'franja', 'longo'])
    cid = f'c{i}'
    g = []
    g.append(f'<circle class="pulse" cx="{cx:.0f}" cy="{cy:.0f}" r="{r*1.45:.0f}" fill="url(#glow)" style="animation-delay:-{random.uniform(0,4.5):.1f}s"/>')
    g.append(f'<clipPath id="{cid}"><circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r}"/></clipPath>')
    g.append(f'<g clip-path="url(#{cid})">')
    g.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r}" fill="{bg}"/>')
    hx, hy, hr = cx, cy - r * 0.12, r * 0.34
    if style == 'longo':
        g.append(f'<path d="M{hx-hr*1.25:.1f},{hy:.1f} Q{hx-hr*1.3:.1f},{hy+hr*2.4:.1f} {hx-hr*0.2:.1f},{hy+hr*2.2:.1f} L{hx+hr*0.2:.1f},{hy+hr*2.2:.1f} Q{hx+hr*1.3:.1f},{hy+hr*2.4:.1f} {hx+hr*1.25:.1f},{hy:.1f} A{hr*1.25:.1f},{hr*1.25:.1f} 0 0 0 {hx-hr*1.25:.1f},{hy:.1f}Z" fill="{hair}"/>')
    # ombros
    g.append(f'<ellipse cx="{cx:.1f}" cy="{cy+r*0.98:.1f}" rx="{r*0.78:.1f}" ry="{r*0.62:.1f}" fill="{shirt}"/>')
    if shirt in ('#FFFFFF', '#F7E7D9', '#E7E5E4', '#FDE68A'):
        g.append(f'<ellipse cx="{cx:.1f}" cy="{cy+r*0.98:.1f}" rx="{r*0.78:.1f}" ry="{r*0.62:.1f}" fill="none" stroke="#000" stroke-opacity=".06" stroke-width="2"/>')
    g.append(f'<rect x="{cx-hr*0.42:.1f}" y="{hy+hr*0.6:.1f}" width="{hr*0.84:.1f}" height="{hr*0.95:.1f}" rx="{hr*0.3:.1f}" fill="{skin}"/>')
    g.append(f'<path d="M{cx-hr*0.42:.1f},{hy+hr*1.25:.1f} Q{cx:.1f},{hy+hr*1.75:.1f} {cx+hr*0.42:.1f},{hy+hr*1.25:.1f}" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="2"/>')
    g.append(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{hr:.1f}" fill="{skin}"/>')
    if style in ('curto', 'longo', 'franja'):
        g.append(f'<path d="M{hx-hr*1.04:.1f},{hy+hr*0.1:.1f} A{hr*1.04:.1f},{hr*1.08:.1f} 0 0 1 {hx+hr*1.04:.1f},{hy+hr*0.1:.1f} Q{hx+hr*0.5:.1f},{hy-hr*0.55:.1f} {hx-hr*0.1 if style=="franja" else hx:.1f},{hy-hr*0.45:.1f} Q{hx-hr*0.6:.1f},{hy-hr*0.4:.1f} {hx-hr*1.04:.1f},{hy+hr*0.1:.1f}Z" fill="{hair}"/>')
    elif style == 'coque':
        g.append(f'<circle cx="{hx:.1f}" cy="{hy-hr*1.15:.1f}" r="{hr*0.45:.1f}" fill="{hair}"/>')
        g.append(f'<path d="M{hx-hr*1.02:.1f},{hy:.1f} A{hr*1.02:.1f},{hr*1.05:.1f} 0 0 1 {hx+hr*1.02:.1f},{hy:.1f} Q{hx:.1f},{hy-hr*0.5:.1f} {hx-hr*1.02:.1f},{hy:.1f}Z" fill="{hair}"/>')
    elif style == 'cacheado':
        for a in range(0, 181, 30):
            ang = math.radians(180 + a)
            g.append(f'<circle cx="{hx+math.cos(ang)*hr*0.95:.1f}" cy="{hy+math.sin(ang)*hr*0.95:.1f}" r="{hr*0.42:.1f}" fill="{hair}"/>')
    elif style == 'raspado':
        g.append(f'<path d="M{hx-hr*0.98:.1f},{hy-hr*0.05:.1f} A{hr:.1f},{hr:.1f} 0 0 1 {hx+hr*0.98:.1f},{hy-hr*0.05:.1f} Q{hx:.1f},{hy-hr*0.62:.1f} {hx-hr*0.98:.1f},{hy-hr*0.05:.1f}Z" fill="{hair}" fill-opacity=".85"/>')
    g.append('</g>')
    g.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="{max(2.5, r*0.06):.1f}"/>')
    if random.random() < 0.2:  # indicador de conversa
        bx, by = cx + r * 0.72, cy - r * 0.72
        g.append(f'<g><rect x="{bx-14:.0f}" y="{by-11:.0f}" width="28" height="20" rx="10" fill="#fff"/><path d="M{bx-6:.0f},{by+8:.0f} l-4,6 l9,-6z" fill="#fff"/>'
                 f'<circle cx="{bx-6:.0f}" cy="{by-1:.0f}" r="2" fill="#D31809"/><circle cx="{bx:.0f}" cy="{by-1:.0f}" r="2" fill="#D31809"/><circle cx="{bx+6:.0f}" cy="{by-1:.0f}" r="2" fill="#D31809"/></g>')
    return ''.join(g)

for i, (x, y, r) in enumerate(nodes):
    o(person(i, x, y, r))
o('</svg>')
sys.stdout.write('\n'.join(out))
