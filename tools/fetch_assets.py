#!/usr/bin/env python3
"""Download the CC0 assets (Poly Haven) the museum uses into ./assets.  Run once: python3 tools/fetch_assets.py"""
import json, os, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
TEX = {  # name: resolution
    'marble_01': '2k', 'large_sandstone_blocks': '2k', 'dark_wood': '1k', 'medieval_wood': '1k',
    'fine_grained_wood': '1k', 'quatrefoil_jacquard_fabric': '1k', 'leather_red_02': '1k',
    'metal_plate': '1k', 'plastered_wall_04': '1k', 'floor_tiles_06': '1k', 'castle_brick_02_white': '1k',
}
MAPS = {'diff': 'Diffuse', 'nor': 'nor_gl', 'rough': 'Rough', 'ao': 'AO'}
MODELS = ['carved_wooden_elephant', 'brass_vase_01', 'brass_vase_03', 'brass_goblets', 'metal_jug',
          'ceramic_vase_02', 'brass_diya_lantern', 'painted_wooden_bench', 'brass_pot_01', 'horse_statue_01']
HDRI = ('museum_of_ethnography', '1k')

def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'al-jazari-museum/1.0'})
    with urllib.request.urlopen(req) as r, open(dest, 'wb') as f:
        f.write(r.read())
    print('  ', os.path.relpath(dest, ROOT), os.path.getsize(dest) // 1024, 'KB')

def api(name):
    req = urllib.request.Request(f'https://api.polyhaven.com/files/{name}', headers={'User-Agent': 'al-jazari-museum/1.0'})
    return json.load(urllib.request.urlopen(req))

for name, res in TEX.items():
    print(name)
    f = api(name)
    for short, key in MAPS.items():
        if key in f and res in f[key]:
            get(f[key][res]['jpg']['url'], os.path.join(ROOT, 'tex', name, short + '.jpg'))

for name in MODELS:
    print(name)
    g = api(name)['gltf']['1k']['gltf']
    get(g['url'], os.path.join(ROOT, 'models', name, name + '.gltf'))
    for rel, inc in g.get('include', {}).items():
        get(inc['url'], os.path.join(ROOT, 'models', name, rel))

print('hdri')
h = api(HDRI[0])['hdri'][HDRI[1]]['hdr']
get(h['url'], os.path.join(ROOT, 'hdri', 'museum.hdr'))
get('https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/waternormals.jpg', os.path.join(ROOT, 'tex', 'waternormals.jpg'))
print('done')
