#!/bin/bash
PWD=$(dirname "$0")

cp $PWD/src/domain/services/pdf/BITTERY.jpg  $PWD/dist/domain/services/pdf/BITTERY.jpg
cp $PWD/src/domain/services/pdf/Lato-Regular.ttf $PWD/dist/domain/services/pdf/Lato-Regular.ttf
cp -r $PWD/src/assets $PWD/dist/assets
