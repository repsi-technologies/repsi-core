# Flutter's Gradle plugin already keeps the engine and generated plugin registrant.
# Keep Health Connect SDK model classes the `health` plugin reads reflectively.
-keep class androidx.health.connect.client.** { *; }
-dontwarn com.google.android.play.core.**
