import asyncio
import sys

# Ensure the local dir is in path
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import Project

if __name__ == "__main__":
    asyncio.run(Project.main())
