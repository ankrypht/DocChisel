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
