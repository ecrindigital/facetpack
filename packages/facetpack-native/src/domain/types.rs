use napi_derive::napi;

#[napi(string_enum)]
#[derive(Debug, Clone, Copy, Default)]
pub enum DiagnosticSeverity {
  #[default]
  Error,
  Warning,
  Info,
  Hint,
}

#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct Diagnostic {
  pub severity: DiagnosticSeverity,
  pub code: Option<String>,
  pub message: String,
  pub filename: String,
  pub line: u32,
  pub column: u32,
  pub end_line: Option<u32>,
  pub end_column: Option<u32>,
  pub snippet: Option<String>,
  pub label: Option<String>,
  pub help: Option<String>,
  pub suggestion: Option<String>,
  pub formatted: String,
}

impl Diagnostic {
  const RED: &'static str = "\x1b[31m";
  const YELLOW: &'static str = "\x1b[33m";
  const BLUE: &'static str = "\x1b[34m";
  const CYAN: &'static str = "\x1b[36m";
  const GREEN: &'static str = "\x1b[32m";
  const WHITE: &'static str = "\x1b[37m";
  const GRAY: &'static str = "\x1b[90m";
  const BOLD: &'static str = "\x1b[1m";
  const UNDERLINE: &'static str = "\x1b[4m";
  const RESET: &'static str = "\x1b[0m";

  pub fn format(&self) -> String {
    let mut output = String::new();

    let (severity_text, icon, color) = match self.severity {
      DiagnosticSeverity::Error => ("ERROR", "✖", Self::RED),
      DiagnosticSeverity::Warning => ("WARNING", "⚠", Self::YELLOW),
      DiagnosticSeverity::Info => ("INFO", "ℹ", Self::CYAN),
      DiagnosticSeverity::Hint => ("HINT", "💡", Self::BLUE),
    };

    output.push_str(&format!(
      "\n{}{}{} {} {}{}\n",
      Self::BOLD,
      color,
      icon,
      severity_text,
      Self::RESET,
      self.code.as_ref().map(|c| format!("{}[{}]{}", Self::GRAY, c, Self::RESET)).unwrap_or_default()
    ));

    output.push_str(&format!(
      "{}{}  {}{}\n",
      Self::BOLD,
      Self::WHITE,
      self.message,
      Self::RESET
    ));

    output.push_str(&format!(
      "\n  {}→{} {}{}{}:{}:{}{}\n",
      Self::CYAN,
      Self::RESET,
      Self::UNDERLINE,
      self.filename,
      Self::RESET,
      self.line,
      self.column,
      Self::RESET
    ));

    if let Some(snippet) = &self.snippet {
      output.push_str(&format!("\n  {}┌──────────────────────────────────────{}\n", Self::GRAY, Self::RESET));

      for (i, line) in snippet.lines().enumerate() {
        let line_num = self.line as usize + i;
        let is_error_line = i == 0;

        if is_error_line {
          output.push_str(&format!(
            "  {}│{} {}{}{:>4}{} {} {}{}{}\n",
            Self::GRAY,
            Self::RESET,
            Self::RED,
            Self::BOLD,
            line_num,
            Self::RESET,
            Self::GRAY,
            Self::RESET,
            line,
            Self::RESET
          ));

          let padding = " ".repeat(self.column.saturating_sub(1) as usize + 8);
          let caret_len = std::cmp::min(3, line.len().saturating_sub(self.column.saturating_sub(1) as usize));
          let carets = "^".repeat(std::cmp::max(1, caret_len));
          output.push_str(&format!(
            "  {}│{} {}{}{}{}\n",
            Self::GRAY,
            Self::RESET,
            padding,
            color,
            carets,
            Self::RESET
          ));
        } else {
          output.push_str(&format!(
            "  {}│{} {}{:>4}{} {} {}\n",
            Self::GRAY,
            Self::RESET,
            Self::GRAY,
            line_num,
            Self::RESET,
            Self::GRAY,
            line
          ));
        }
      }

      output.push_str(&format!("  {}└──────────────────────────────────────{}\n", Self::GRAY, Self::RESET));
    }

    if let Some(help) = &self.help {
      output.push_str(&format!(
        "\n  {}💡 Contexte:{} {}\n",
        Self::CYAN,
        Self::RESET,
        help
      ));
    }

    if let Some(suggestion) = &self.suggestion {
      output.push_str(&format!(
        "\n  {}✨ Solution:{} {}\n",
        Self::GREEN,
        Self::RESET,
        suggestion
      ));
    }

    output.push('\n');
    output
  }
}

#[napi(string_enum)]
#[derive(Debug, Clone, Copy, Default)]
pub enum SourceType {
  #[default]
  Script,
  Module,
  Jsx,
  Tsx,
  Typescript,
}

#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct ParseOptions {
  pub source_type: Option<SourceType>,
  pub preserve_parens: Option<bool>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ParseResult {
  pub program: String,
  pub errors: Vec<String>,
  pub diagnostics: Vec<Diagnostic>,
  pub panicked: bool,
}

#[napi(string_enum)]
#[derive(Debug, Clone, Copy, Default)]
pub enum JsxRuntime {
  #[default]
  Automatic,
  Classic,
}

#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct TransformOptions {
  pub source_type: Option<SourceType>,
  pub jsx: Option<bool>,
  pub jsx_runtime: Option<JsxRuntime>,
  pub jsx_pragma: Option<String>,
  pub jsx_pragma_frag: Option<String>,
  pub jsx_import_source: Option<String>,
  pub typescript: Option<bool>,
  pub flow: Option<bool>,
  pub sourcemap: Option<bool>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct TransformResult {
  pub code: String,
  pub map: Option<String>,
  pub errors: Vec<String>,
  pub diagnostics: Vec<Diagnostic>,
}

#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct MinifyOptions {
  pub compress: Option<bool>,
  pub mangle: Option<bool>,
  pub keep_fnames: Option<bool>,
  pub drop_console: Option<bool>,
  pub drop_debugger: Option<bool>,
  pub sourcemap: Option<bool>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct MinifyResult {
  pub code: String,
  pub map: Option<String>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ExportInfo {
  pub name: String,
  pub is_default: bool,
  pub is_reexport: bool,
  pub source: Option<String>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ImportInfo {
  pub source: String,
  pub specifiers: Vec<String>,
  pub is_side_effect: bool,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ModuleAnalysis {
  pub exports: Vec<ExportInfo>,
  pub imports: Vec<ImportInfo>,
  pub has_side_effects: bool,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ModuleInput {
  pub path: String,
  pub code: String,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ShakeResult {
  pub code: String,
  pub map: Option<String>,
  pub removed_exports: Vec<String>,
}
