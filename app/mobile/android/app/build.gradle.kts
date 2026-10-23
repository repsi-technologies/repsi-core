import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "app.repsi.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // Release builds must use the real upload keystore. The debug key is allowed only for local
    // dry runs with -PALLOW_DEBUG_SIGNING=true (or ALLOW_DEBUG_SIGNING=true); such APKs can't be published.
    fun useDebugSigningOrFail(config: com.android.build.api.dsl.ApkSigningConfig) {
        val allowDebug = (project.findProperty("ALLOW_DEBUG_SIGNING") as String? ?: System.getenv("ALLOW_DEBUG_SIGNING")) == "true"
        val releaseTask = gradle.startParameter.taskNames.any { it.contains("Release", ignoreCase = true) }
        if (releaseTask && !allowDebug) {
            throw GradleException(
                "No release keystore found. Provide key.properties or KEYSTORE_PATH/KEYSTORE_PASSWORD/KEY_ALIAS/KEY_PASSWORD, " +
                    "or pass -PALLOW_DEBUG_SIGNING=true for a local, unpublishable build."
            )
        }
        val debugConfig = signingConfigs.getByName("debug")
        config.storeFile = debugConfig.storeFile
        config.storePassword = debugConfig.storePassword
        config.keyAlias = debugConfig.keyAlias
        config.keyPassword = debugConfig.keyPassword
    }

    signingConfigs {
        create("release") {
            val keyPropsFile = rootProject.file("key.properties")
            if (keyPropsFile.exists()) {
                val properties = Properties().apply {
                    load(FileInputStream(keyPropsFile))
                }
                val storeFilePath = properties.getProperty("storeFile")
                val resolvedFile = if (storeFilePath != null) {
                    val directFile = file(storeFilePath)
                    if (directFile.exists()) directFile else rootProject.file(storeFilePath)
                } else null

                if (resolvedFile != null && resolvedFile.exists()) {
                    storeFile = resolvedFile
                    storePassword = properties.getProperty("storePassword")
                    keyAlias = properties.getProperty("keyAlias")
                    keyPassword = properties.getProperty("keyPassword")
                } else {
                    useDebugSigningOrFail(this)
                }
            } else {
                val keystoreFile = project.findProperty("KEYSTORE_PATH") as String? ?: System.getenv("KEYSTORE_PATH")
                if (keystoreFile != null && file(keystoreFile).exists()) {
                    storeFile = file(keystoreFile)
                    storePassword = project.findProperty("KEYSTORE_PASSWORD") as String? ?: System.getenv("KEYSTORE_PASSWORD")
                    keyAlias = project.findProperty("KEY_ALIAS") as String? ?: System.getenv("KEY_ALIAS")
                    keyPassword = project.findProperty("KEY_PASSWORD") as String? ?: System.getenv("KEY_PASSWORD")
                } else {
                    useDebugSigningOrFail(this)
                }
            }
        }
    }

    defaultConfig {
        applicationId = "app.repsi.mobile"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
