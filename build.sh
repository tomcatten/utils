#!/bin/sh
echo 'node -v'
node -v
echo 'npm -v'
npm -v
echo 'npm install'
npm install
echo 'clean'
rm -rf *.zip
rm -rf dest
echo 'gulp build'
chmod +x ./node_modules/.bin/gulp
./node_modules/.bin/gulp build
