"""SaaS plan catalogue: the single backend source for REPSI subscription plans, prices and entitlements.

Mirrors docs/payments/pricing.md (prices taken from app/web/lib/pricing-data.ts). Edit here, then run
`python -m scripts.sync_saas_plans`. Amounts are integer minor units (paise/cents), tax-inclusive totals
per billing period. Only INR is enabled; other currencies stay disabled until provider/tax approval.
"""

ENABLED_CURRENCIES = {"INR"}

# code: (name, rank, public)
PLANS = {
    "lite": ("Lite", 10, True),
    "starter": ("Starter", 20, True),
    "growth": ("Growth", 30, True),
    "pro": ("Pro", 40, True),
    "enterprise": ("Enterprise", 50, True),
}

# Limits: -1 = unlimited.
LIMITS = {
    "lite": {"members": 20, "trainers": 1, "staff": 1, "branches": 1},
    "starter": {"members": 50, "trainers": 3, "staff": 3, "branches": 1},
    "growth": {"members": 150, "trainers": 10, "staff": 10, "branches": 1},
    "pro": {"members": 400, "trainers": 30, "staff": 30, "branches": 3},
    "enterprise": {"members": -1, "trainers": -1, "staff": -1, "branches": -1},
}

_ALL = ("lite", "starter", "growth", "pro", "enterprise")
_GROWTH_UP = ("growth", "pro", "enterprise")
_PRO_UP = ("pro", "enterprise")
# feature key -> plans that include it. Keys match require_feature(...) call sites.
FEATURE_PLANS = {
    "member_management": _ALL,
    "qr_attendance": _ALL,
    "payment_records": _ALL,
    "basic_workouts": _ALL,
    "basic_dashboard": _ALL,
    "membership_reminders": _ALL,
    "data_export": _ALL,  # never withheld
    "trainer_management": _ALL,
    "ai_assistant": _ALL,
    "ai_workouts": _ALL,
    "member_portal": ("starter",) + _GROWTH_UP,
    "growth_analytics": ("starter",) + _GROWTH_UP,
    "ai_insights": _GROWTH_UP,
    "member_broadcasts": _GROWTH_UP,
    "structured_workouts": _GROWTH_UP,
    "diet_plans": _GROWTH_UP,
    "sales_crm": _GROWTH_UP,
    "multi_branch": _PRO_UP,
    "advanced_analytics": _PRO_UP,
    "whatsapp_automation": _PRO_UP,
    "custom_domain": ("enterprise",),
    "api_access": ("enterprise",),
}

# The 14-day trial and grandfathered gyms get this plan's entitlements.
TRIAL_PLAN_CODE = "growth"

# code -> [(billing_cycle, period_months, currency, amount_minor)]
PRICES = {
    "lite": [
        ("monthly", 1, "INR", 19900),
        ("quarterly", 3, "INR", 53700),
        ("half_yearly", 6, "INR", 89400),
        ("annual", 12, "INR", 154800),
        ("monthly", 1, "USD", 900),
        ("quarterly", 3, "USD", 2400),
        ("half_yearly", 6, "USD", 4000),
        ("annual", 12, "USD", 7000),
        ("monthly", 1, "EUR", 800),
        ("quarterly", 3, "EUR", 2200),
        ("half_yearly", 6, "EUR", 3600),
        ("annual", 12, "EUR", 6200),
        ("monthly", 1, "GBP", 700),
        ("quarterly", 3, "GBP", 1900),
        ("half_yearly", 6, "GBP", 3200),
        ("annual", 12, "GBP", 5500),
        ("monthly", 1, "AED", 3300),
        ("quarterly", 3, "AED", 8900),
        ("half_yearly", 6, "AED", 14900),
        ("annual", 12, "AED", 25700),
    ],
    "starter": [
        ("monthly", 1, "INR", 49900),
        ("quarterly", 3, "INR", 134700),
        ("half_yearly", 6, "INR", 225000),
        ("annual", 12, "INR", 390000),
        ("monthly", 1, "USD", 1900),
        ("quarterly", 3, "USD", 5100),
        ("half_yearly", 6, "USD", 8500),
        ("annual", 12, "USD", 14800),
        ("monthly", 1, "EUR", 1600),
        ("quarterly", 3, "EUR", 4300),
        ("half_yearly", 6, "EUR", 7200),
        ("annual", 12, "EUR", 12500),
        ("monthly", 1, "GBP", 1400),
        ("quarterly", 3, "GBP", 3800),
        ("half_yearly", 6, "GBP", 6300),
        ("annual", 12, "GBP", 10900),
        ("monthly", 1, "AED", 6900),
        ("quarterly", 3, "AED", 18600),
        ("half_yearly", 6, "AED", 31100),
        ("annual", 12, "AED", 53800),
    ],
    "growth": [
        ("monthly", 1, "INR", 99900),
        ("quarterly", 3, "INR", 269700),
        ("half_yearly", 6, "INR", 449400),
        ("annual", 12, "INR", 778800),
        ("monthly", 1, "USD", 3900),
        ("quarterly", 3, "USD", 10500),
        ("half_yearly", 6, "USD", 17500),
        ("annual", 12, "USD", 30400),
        ("monthly", 1, "EUR", 3400),
        ("quarterly", 3, "EUR", 9200),
        ("half_yearly", 6, "EUR", 15300),
        ("annual", 12, "EUR", 26500),
        ("monthly", 1, "GBP", 2900),
        ("quarterly", 3, "GBP", 7800),
        ("half_yearly", 6, "GBP", 13100),
        ("annual", 12, "GBP", 22600),
        ("monthly", 1, "AED", 14500),
        ("quarterly", 3, "AED", 39200),
        ("half_yearly", 6, "AED", 65300),
        ("annual", 12, "AED", 113100),
    ],
    "pro": [
        ("monthly", 1, "INR", 199900),
        ("quarterly", 3, "INR", 539700),
        ("half_yearly", 6, "INR", 899400),
        ("annual", 12, "INR", 1558800),
        ("monthly", 1, "USD", 7900),
        ("quarterly", 3, "USD", 21300),
        ("half_yearly", 6, "USD", 35500),
        ("annual", 12, "USD", 61600),
        ("monthly", 1, "EUR", 6800),
        ("quarterly", 3, "EUR", 18400),
        ("half_yearly", 6, "EUR", 30600),
        ("annual", 12, "EUR", 53000),
        ("monthly", 1, "GBP", 5800),
        ("quarterly", 3, "GBP", 15700),
        ("half_yearly", 6, "GBP", 26100),
        ("annual", 12, "GBP", 45200),
        ("monthly", 1, "AED", 28900),
        ("quarterly", 3, "AED", 78000),
        ("half_yearly", 6, "AED", 130100),
        ("annual", 12, "AED", 225400),
    ],
    "enterprise": [
        ("monthly", 1, "INR", 399900),
        ("quarterly", 3, "INR", 1079700),
        ("half_yearly", 6, "INR", 1799400),
        ("annual", 12, "INR", 3118800),
        ("monthly", 1, "USD", 14900),
        ("quarterly", 3, "USD", 40200),
        ("half_yearly", 6, "USD", 67200),
        ("annual", 12, "USD", 116400),
        ("monthly", 1, "EUR", 12900),
        ("quarterly", 3, "EUR", 34800),
        ("half_yearly", 6, "EUR", 58200),
        ("annual", 12, "EUR", 100800),
        ("monthly", 1, "GBP", 10900),
        ("quarterly", 3, "GBP", 29400),
        ("half_yearly", 6, "GBP", 49200),
        ("annual", 12, "GBP", 85200),
        ("monthly", 1, "AED", 54900),
        ("quarterly", 3, "AED", 148200),
        ("half_yearly", 6, "AED", 247200),
        ("annual", 12, "AED", 428400),
    ],
}
