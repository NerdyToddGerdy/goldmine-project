#!/bin/bash
cd "$(dirname "$0")"
rm -rf build
mkdir -p build

poetry export -f requirements.txt --without-hashes > requirements.txt
pip install -r requirements.txt -t build/
cp handler.py build/