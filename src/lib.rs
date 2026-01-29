//! AI coding assistant templates for Cursor IDE, Claude Code, and GitHub Copilot.
//!
//! The same markdown templates used by the npm CLI are embedded here.
//!
//! # Example
//!
//! ```ignore
//! use agentic_team_templates::TEMPLATES;
//!
//! let file = TEMPLATES.get_file("web-frontend/CLAUDE.md").unwrap();
//! let contents = file.contents_utf8().unwrap();
//! ```

use include_dir::{include_dir, Dir};

/// Embedded templates directory. Paths are relative to the `templates/` root,
/// e.g. `"web-frontend/CLAUDE.md"`, `"_shared/core-principles.md"`.
pub static TEMPLATES: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/templates");
