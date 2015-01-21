#!/bin/bash
rm Gainstrack.apk
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../conf/gainstrack.keystore platforms/android/ant-build/CordovaApp-release-unsigned.apk gainstrack
/Users/kevin/Library/Android/sdk//build-tools/21.1.2/zipalign -v 4 platforms/android/ant-build/CordovaApp-release-unsigned.apk Gainstrack.apk

