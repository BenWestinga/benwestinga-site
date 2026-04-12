files = [
    'the_dawn_of_remmers_websrc/crazy.py',
    'the_dawn_of_remmers_websrc/Hottie.py',
    'the_dawn_of_remmers_websrc/Bond.py'
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('def await ', 'def ')

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed defs")
