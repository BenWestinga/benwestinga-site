#!/bin/bash
set -e

echo "Building web version..."
python -m pip install -r requirements.txt
python -m pygbag --build the_dawn_of_remmers

echo "Copying to docs directory..."
mkdir -p docs/the-dawn-of-remmers
cp -r the_dawn_of_remmers/build/web/* docs/the-dawn-of-remmers/
echo "Done! You can test by running 'python -m http.server' inside docs/the-dawn-of-remmers"
