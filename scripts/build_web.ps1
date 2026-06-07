$ErrorActionPreference = "Stop"

echo "Building web version..."
python -m pip install -r requirements.txt
python -m pygbag --build the_dawn_of_remmers

echo "Copying to docs directory..."
if (-not (Test-Path "docs\the-dawn-of-remmers")) {
    New-Item -ItemType Directory -Force -Path "docs\the-dawn-of-remmers"
}

Copy-Item -Path "the_dawn_of_remmers\build\web\*" -Destination "docs\the-dawn-of-remmers" -Recurse -Force
echo "Done! You can test by running 'python -m http.server' inside docs/the-dawn-of-remmers"
