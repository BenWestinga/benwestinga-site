import os
import re

directory = r"c:\Users\benwe\Desktop\benwestinga-site\the_dawn_of_remmers"

for filename in os.listdir(directory):
    if filename.endswith(".py") and filename not in ["Project.py", "game_settings.py", "main.py"]:
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        changed = False

        if "import asyncio" not in content:
            content = "import asyncio\n" + content
            changed = True
            
        if "async def bossfight_" not in content:
            content = re.sub(r'\bdef bossfight_', 'async def bossfight_', content)
            changed = True
            
        if "async def end_screen" not in content:
            content = re.sub(r'\bdef end_screen', 'async def end_screen', content)
            changed = True
            
        # Replace end_screen("...") with await end_screen("...")
        # Only if not already await
        if "await end_screen" not in content:
            content = re.sub(r'(?<!await )end_screen\(', 'await end_screen(', content)
            changed = True
            
        def replace_while(match):
            indent = match.group(1)
            return f"{indent}while True:\n{indent}    await asyncio.sleep(0)"
        
        if "await asyncio.sleep(0)" not in content:
            content = re.sub(r'(^[ \t]*)while True:', replace_while, content, flags=re.MULTILINE)
            changed = True
        
        # fix asset paths:
        # replace Path(__file__).resolve().with_name("...") with "..." (since in pygbag we will just use relative paths)
        # Actually wait, pygbag runs from root, so if we just use "the_dawn_of_remmers/beast.png", that's better, or rely on a helper.
        # But wait, Project.py has `resolve_asset(name)`. I can use that, or just use `game_settings.asset_path(name)`.
        
        if changed:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filename}")
