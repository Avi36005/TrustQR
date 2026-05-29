"""
Compute an overall safety rating from a list of check dicts.

Each check dict may have a 'severity' key: 'danger' | 'warning' | 'info'.
Checks without a severity key are treated as info.
"""

from typing import Any


def compute_safety(checks: list[dict[str, Any]]) -> str:
    danger_count = sum(1 for c in checks if c.get("severity") == "danger")
    warning_count = sum(1 for c in checks if c.get("severity") == "warning")

    if danger_count > 0:
        return "danger"
    if warning_count >= 2:
        return "caution"
    return "safe"
