package app.repsi.mobile

import io.flutter.embedding.android.FlutterFragmentActivity

// FlutterFragmentActivity (not FlutterActivity) is required by the `health` plugin, which uses
// registerForActivityResult to show the Health Connect permission sheet.
class MainActivity : FlutterFragmentActivity()
