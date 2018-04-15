#!/bin/bash

VERSION=$(grep "\"version\"" ../package.json | cut -d':' -f 2,3 | cut -d'"' -f2)

mkdir -p downloads
wget -q -i nwjs-downloads.txt -nc -c -P downloads


# Reset temp folders
rm -r ../dist/
mkdir -p ../dist/package-contents/
rm -r ../output/
mkdir -p ../output

# Copy only necessary files into release
cp -r ../README.md ../dist/package-contents/
cp -r ../LICENSE ../dist/package-contents/
cp -r ../index.html ../dist/package-contents/
cp -r ../main.css ../dist/package-contents/
cp -r ../package.json ../dist/package-contents/
cp -r ../manifest.webapp ../dist/package-contents/
cp -r ../js ../dist/package-contents/
cp -r ../json ../dist/package-contents/
cp -r ../media ../dist/package-contents/
cp -r ../third-party ../dist/package-contents/

# Linux 64bit App
tar -zxvf downloads/nwjs-*-linux-x64.tar.gz -C ../dist/
mv ../dist/nwjs-*-linux-x64 ../dist/exchanges-game
mv ../dist/exchanges-game/nw ../dist/exchanges-game/exchanges-game
chmod +x ../dist/exchanges-game/exchanges-game
cd ../dist/package-contents/;
zip -r ../exchanges-game/package.nw *
cd ../exchanges-game/
zip -r ../../output/exchanges-game.zip  *
cd ../tools

rm -r ../dist
exit
