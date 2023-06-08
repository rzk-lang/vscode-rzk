#!/usr/bin/env bash

for file in syntaxes/*.tmLanguage.yaml syntaxes/*.tmLanguage.yml
do
  if [ -f "$file" ]; then
    npx -y js-yaml "$file" > "${file%.*}.json"
  fi
done
