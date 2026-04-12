files = [
    'the_dawn_of_remmers_websrc/crazy.py',
    'the_dawn_of_remmers_websrc/Hottie.py',
    'the_dawn_of_remmers_websrc/Bond.py'
]
import re

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix bad asyncio sleep placement
    # First: clock.tick(60)\nawait asyncio.sleep(0)  (no indent) -> clock.tick(60)\n            await asyncio.sleep(0)
    content = content.replace('clock.tick(60)\nawait asyncio.sleep(0)', 'clock.tick(60)\n            await asyncio.sleep(0)\n')

    # Fix "await asyncio.sleep(0)step" into "await asyncio.sleep(0)\n        step" etc.
    content = re.sub(r'(await asyncio\.sleep\(0\))([^\n]+)', r'\1\n        \2', content)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
print("done")
