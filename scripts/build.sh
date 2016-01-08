#!/bin/bash

TAG=`git tag --contains`
if [[ -z $TAG ]]; then
  echo "No tag - nothing to build"
  exit;
fi

rm -rf node_modules
npm install --production

rm -rf dist
mkdir -p dist
FILENAME="./dist/embeddable-wufoo-lambda-$TAG.zip"
zip -r $FILENAME . --exclude *.git*
