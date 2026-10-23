"""
Capacity / load test for the REPSI API.

Simulates N concurrent signed-in gym staff hitting the hottest dashboard endpoints for a fixed
duration and reports per-endpoint p50/p95/p99 latency, throughput, error rate and (optionally)
the API process's memory/CPU.

Refuses non-local targets unless --allow-remote is passed; never point it at production.

    # terminal 1 (scratch SQLite, test OTP, no real providers)
    DATABASE_URL=sqlite:///./loadtest.db ENVIRONMENT=development OTP_PROVIDER=test AISENSY_API_KEY= \\
        .venv/Scripts/python.exe -m uvicorn app.main:app --port 8010 --workers 1
    # terminal 2
    .venv/Scripts/python.exe scripts/load_test.py --base-url http://127.0.0.1:8010 --users 25 --duration 30 --server-pid <pid>
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import random
import statistics
import subprocess
import sys
import threading
import time
import uuid
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

import httpx

SCENARIO = [
    # (weight, label, path)
    (4, "dashboard", "/api/v1/dashboard/metrics"),
    (4, "members_page", "/api/v1/members?page=1&page_size=25"),
    (2, "members_search", "/api/v1/members?page=1&page_size=25&query=load"),
    (3, "notifications", "/api/v1/notifications?page=1&page_size=25"),
    (3, "entitlements", "/api/v1/billing/entitlements"),
    (2, "attendance_summary", "/api/v1/attendance/summary"),
    (1, "broadcasts", "/api/v1/broadcasts?page=1&page_size=20"),
]


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    k = (len(ordered) - 1) * pct / 100.0
    lo, hi = int(k), min(int(k) + 1, len(ordered) - 1)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (k - lo)


def sample_process(pid: int) -> dict | None:
    """RSS (MB) and cumulative CPU seconds of the server process, without extra dependencies."""
    try:
        if platform.system() == "Windows":
            out = subprocess.run(
                ["powershell", "-NoProfile", "-Command",
                 f"Get-Process -Id {pid} | Select-Object WorkingSet64,CPU | ConvertTo-Json"],
                capture_output=True, text=True, timeout=10,
            ).stdout
            data = json.loads(out)
            return {"rss_mb": round(data["WorkingSet64"] / 1e6, 1), "cpu_s": float(data["CPU"] or 0)}
        with open(f"/proc/{pid}/status") as fh:
            rss_kb = next(int(line.split()[1]) for line in fh if line.startswith("VmRSS"))
        with open(f"/proc/{pid}/stat") as fh:
            fields = fh.read().split()
        ticks = os.sysconf(os.sysconf_names["SC_CLK_TCK"])
        return {"rss_mb": round(rss_kb / 1024, 1), "cpu_s": (int(fields[13]) + int(fields[14])) / ticks}
    except Exception:
        return None


def setup_tenant(client: httpx.Client, members: int) -> dict:
    tag = uuid.uuid4().hex[:8]
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Load Owner", "email": f"load.{tag}@example.com", "password": "LoadTest123!",
        "gym_name": f"Load Gym {tag}", "gym_phone": f"+91 9{random.randint(10**8, 10**9 - 1)}", "gym_city": "Pune",
    })
    res.raise_for_status()
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    rows = [{"first_name": f"Load{i}", "last_name": "Member", "phone": f"+9198{random.randint(10**7, 10**8 - 1)}",
             "email": f"load{i}.{tag}@example.com"} for i in range(members)]
    client.post("/api/v1/members/import-batch", headers=headers, json=rows, timeout=120).raise_for_status()
    return headers


def run(args: argparse.Namespace) -> dict:
    host = urlparse(args.base_url).hostname or ""
    if host not in ("127.0.0.1", "localhost", "::1") and not args.allow_remote:
        sys.exit("Refusing to load-test a non-local host without --allow-remote (never use production).")

    with httpx.Client(base_url=args.base_url, timeout=30) as setup_client:
        headers = setup_tenant(setup_client, args.members)

    weighted = [(label, path) for weight, label, path in SCENARIO for _ in range(weight)]
    latencies: dict[str, list[float]] = defaultdict(list)
    errors: dict[str, int] = defaultdict(int)
    status_codes: dict[int, int] = defaultdict(int)
    lock = threading.Lock()
    stop_at = time.monotonic() + args.duration

    def user_loop(_: int) -> None:
        rng = random.Random()
        with httpx.Client(base_url=args.base_url, headers=headers, timeout=30) as c:
            while time.monotonic() < stop_at:
                label, path = rng.choice(weighted)
                t0 = time.perf_counter()
                try:
                    r = c.get(path)
                    code = r.status_code
                except httpx.HTTPError:
                    code = 599
                ms = (time.perf_counter() - t0) * 1000
                with lock:
                    latencies[label].append(ms)
                    status_codes[code] += 1
                    if code >= 400:
                        errors[label] += 1
                if args.think_ms:
                    time.sleep(rng.uniform(0, args.think_ms) / 1000)

    before = sample_process(args.server_pid) if args.server_pid else None
    peak_rss = before["rss_mb"] if before else None
    started = time.monotonic()
    with ThreadPoolExecutor(max_workers=args.users) as pool:
        futures = [pool.submit(user_loop, i) for i in range(args.users)]
        while any(not f.done() for f in futures):
            time.sleep(1)
            if args.server_pid:
                s = sample_process(args.server_pid)
                if s and (peak_rss is None or s["rss_mb"] > peak_rss):
                    peak_rss = s["rss_mb"]
        for f in futures:
            f.result()
    elapsed = time.monotonic() - started
    after = sample_process(args.server_pid) if args.server_pid else None

    all_ms = [v for vals in latencies.values() for v in vals]
    report = {
        "base_url": args.base_url, "users": args.users, "duration_s": round(elapsed, 1), "seed_members": args.members,
        "requests": len(all_ms), "throughput_rps": round(len(all_ms) / elapsed, 1),
        "error_rate_pct": round(100 * sum(errors.values()) / max(1, len(all_ms)), 2),
        "status_codes": dict(sorted(status_codes.items())),
        "overall_ms": {"p50": round(percentile(all_ms, 50), 1), "p95": round(percentile(all_ms, 95), 1),
                       "p99": round(percentile(all_ms, 99), 1), "max": round(max(all_ms, default=0), 1)},
        "endpoints": {
            label: {"n": len(v), "p50": round(percentile(v, 50), 1), "p95": round(percentile(v, 95), 1),
                    "p99": round(percentile(v, 99), 1), "mean": round(statistics.fmean(v), 1) if v else 0,
                    "errors": errors.get(label, 0)}
            for label, v in sorted(latencies.items())
        },
    }
    if before and after:
        report["server"] = {
            "rss_mb_start": before["rss_mb"], "rss_mb_end": after["rss_mb"], "rss_mb_peak": peak_rss,
            "cpu_seconds": round(after["cpu_s"] - before["cpu_s"], 2),
            "avg_cpu_pct_of_one_core": round(100 * (after["cpu_s"] - before["cpu_s"]) / elapsed, 1),
        }
    return report


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--base-url", default="http://127.0.0.1:8010")
    p.add_argument("--users", type=int, default=20, help="concurrent simulated users")
    p.add_argument("--duration", type=int, default=30, help="seconds")
    p.add_argument("--members", type=int, default=30, help="members seeded into the test gym")
    p.add_argument("--think-ms", type=int, default=0, help="max random pause between a user's requests")
    p.add_argument("--server-pid", type=int, default=None, help="API process id for memory/CPU sampling")
    p.add_argument("--allow-remote", action="store_true", help="allow a non-local (staging) target")
    p.add_argument("--json-out", default=None)
    args = p.parse_args()
    report = run(args)
    text = json.dumps(report, indent=2)
    print(text)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as fh:
            fh.write(text)


if __name__ == "__main__":
    main()
