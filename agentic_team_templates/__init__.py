"""AI coding assistant templates for Cursor IDE, Claude Code, and GitHub Copilot."""

from pathlib import Path

__all__ = ["get_templates_dir"]


def get_templates_dir() -> Path:
    """Return the path to the bundled templates directory (markdown rules and CLAUDE.md)."""
    return Path(__file__).resolve().parent / "templates"
