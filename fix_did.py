fpath = 'the_dawn_of_remmers_websrc/Did.py'
import re

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

def awaiter(m):
    full = m.group()
    if 'await' in full: return full
    return full.replace(m.group(1), 'await ' + m.group(1))

content = re.sub(r'[^a-zA-Z_](end_screen\()', awaiter, content)
content = re.sub(r'[^a-zA-Z_](die\()', awaiter, content)
content = re.sub(r'[^a-zA-Z_](apply_wall_damage\()', awaiter, content)
content = content.replace('def await ', 'def ')

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)

print("done Did")
