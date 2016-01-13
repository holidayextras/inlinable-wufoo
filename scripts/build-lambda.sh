#!/bin/bash

rm -rf node_modules
npm install --production

rm -rf dist
mkdir -p dist
FILENAME="./dist/embeddable-wufoo-lambda.zip"
zip -r $FILENAME . --exclude *.git*
