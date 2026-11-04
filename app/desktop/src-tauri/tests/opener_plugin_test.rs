use tauri::plugin::Plugin;

#[test]
fn test_opener_plugin_initializes_with_expected_name() {
    let plugin = tauri_plugin_opener::init::<tauri::Wry>();
    assert_eq!(plugin.name(), "opener");
}

#[cfg(target_os = "linux")]
mod linux_tests {
    use std::env;
    use std::fs;
    use std::os::unix::fs::PermissionsExt;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::{Mutex, MutexGuard};
    use std::time::{SystemTime, UNIX_EPOCH};

    // Serialize access to process-wide environment variables (PATH) across concurrent test threads.
    static PATH_MUTEX: Mutex<()> = Mutex::new(());
    static TEST_COUNTER: AtomicU64 = AtomicU64::new(1);

    struct EnvPathGuard<'a> {
        _mutex_guard: MutexGuard<'a, ()>,
        original_path: Option<String>,
        temp_dir: PathBuf,
    }

    impl<'a> EnvPathGuard<'a> {
        fn new(temp_dir: PathBuf) -> Self {
            let mutex_guard = PATH_MUTEX
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner());
            let original_path = env::var("PATH").ok();
            let new_path = match &original_path {
                Some(orig) => format!("{}:{}", temp_dir.display(), orig),
                None => temp_dir.display().to_string(),
            };
            env::set_var("PATH", &new_path);

            Self {
                _mutex_guard: mutex_guard,
                original_path,
                temp_dir,
            }
        }
    }

    impl<'a> Drop for EnvPathGuard<'a> {
        fn drop(&mut self) {
            match &self.original_path {
                Some(orig) => env::set_var("PATH", orig),
                None => env::remove_var("PATH"),
            }
            let _ = fs::remove_dir_all(&self.temp_dir);
        }
    }

    #[test]
    fn test_opener_launches_external_browser_url_on_linux() {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let counter = TEST_COUNTER.fetch_add(1, Ordering::Relaxed);
        let temp_dir = env::temp_dir().join(format!(
            "repsi_opener_test_{}_{}_{}",
            std::process::id(),
            timestamp,
            counter
        ));
        fs::create_dir_all(&temp_dir).expect("failed to create unique temp dir");

        let log_file = temp_dir.join("opener_invocation.log");
        let mock_xdg_open = temp_dir.join("xdg-open");

        // Safely quote the output file path in the shell script
        let script_content = format!("#!/bin/sh\necho \"$@\" > \"{}\"\nexit 0\n", log_file.display());
        fs::write(&mock_xdg_open, script_content).expect("failed to write mock script");
        let mut perms = fs::metadata(&mock_xdg_open).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&mock_xdg_open, perms).unwrap();

        // RAII guard serializes test execution, updates PATH, and cleans up temp_dir on drop
        let _guard = EnvPathGuard::new(temp_dir);

        let test_url = "https://repsi.app/pay?t=single_use_checkout_handoff_token_123";
        let res = tauri_plugin_opener::open_url(test_url, None::<&str>);
        assert!(res.is_ok(), "open_url returned error: {:?}", res.err());

        // Poll briefly for the detached child process to execute and write to the log file
        let mut found = false;
        for _ in 0..30 {
            if let Ok(logged) = fs::read_to_string(&log_file) {
                if logged.trim() == test_url {
                    found = true;
                    break;
                }
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }

        assert!(
            found,
            "Mock xdg-open was not invoked with the expected target URL: {}",
            test_url
        );
    }
}
