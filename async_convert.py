import re

files = [
    'the_dawn_of_remmers_websrc/crazy.py',
    'the_dawn_of_remmers_websrc/Hottie.py',
    'the_dawn_of_remmers_websrc/Bond.py'
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    if 'import asyncio' not in content:
        content = re.sub(r'(import pygame)', r'import asyncio\n\1', content, count=1)

    # 2. Defs
    content = re.sub(r'^def bossfight_', 'async def bossfight_', content, flags=re.MULTILINE)
    content = re.sub(r'^[ \t]*def end_screen\(result: str\):', lambda m: m.group().replace('def', 'async def'), content, flags=re.MULTILINE)
    content = re.sub(r'^[ \t]*def die\(now\):', lambda m: m.group().replace('def', 'async def'), content, flags=re.MULTILINE)
    content = re.sub(r'^[ \t]*def boss_take_damage\(', lambda m: m.group().replace('def', 'async def'), content, flags=re.MULTILINE)

    # 3. Yulding
    # We replace "clock.tick(60)" with "clock.tick(60)\n            await asyncio.sleep(0)"
    # But notice some do dt_ms = clock.tick(60). Let's handle both.
    def yielder(m):
        raw = m.group(1)
        # Check if we already have it
        if 'await asyncio.sleep(0)' in raw: return raw
        # Add yield
        return raw + '\n' + m.group(2) + 'await asyncio.sleep(0)'

    content = re.sub(r'([ \t]*.*clock\.tick\(60\).*)\n([ \t]*)', yielder, content)

    # 4. Calls
    # Avoid double await
    def awaiter(m):
        full = m.group()
        if 'await' in full: return full
        return full.replace(m.group(1), 'await ' + m.group(1))

    content = re.sub(r'[^a-zA-Z_](end_screen\()', awaiter, content)
    content = re.sub(r'[^a-zA-Z_](die\()', awaiter, content)
    content = re.sub(r'[^a-zA-Z_](boss_take_damage\()', awaiter, content)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
