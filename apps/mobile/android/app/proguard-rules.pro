# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# JNA (Java Native Access)
-dontwarn java.awt.**
-keep class com.sun.jna.** { *; }
-keepclassmembers class * extends com.sun.jna.** { *; }
-keepclassmembers class * extends com.sun.jna.Structure { *; }
-keep interface * extends com.sun.jna.Library { *; }

# UniFFI / DocChisel Bridge
-keep class uniffi.** { *; }
-keepclassmembers class uniffi.** { *; }
-keep class com.docchisel.bridge.** { *; }
-keepclassmembers class com.docchisel.bridge.** { *; }
