#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
printf '%s\n' 'Open http://localhost:8080/#A1-71e2bdd4@1'
python3 -m http.server 8080
