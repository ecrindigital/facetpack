use crate::cqrs::traits::Query;
use crate::domain::error::FacetpackError;
use crate::domain::types::{Diagnostic, DiagnosticSeverity, ParseOptions, ParseResult, SourceType};

use oxc_allocator::Allocator;
use oxc_ast::ast::Program;
use oxc_codegen::Codegen;
use oxc_diagnostics::{GraphicalReportHandler, GraphicalTheme, NamedSource};
use oxc_parser::Parser;
use oxc_span::SourceType as OxcSourceType;

pub struct ParseQuery {
  pub filename: String,
  pub source_text: String,
  pub options: ParseOptions,
}

impl ParseQuery {
  pub fn new(filename: String, source_text: String, options: Option<ParseOptions>) -> Self {
    Self {
      filename,
      source_text,
      options: options.unwrap_or_default(),
    }
  }

  fn get_oxc_source_type(&self) -> OxcSourceType {
    match self.options.source_type {
      Some(SourceType::Module) => OxcSourceType::mjs(),
      Some(SourceType::Script) => OxcSourceType::cjs(),
      Some(SourceType::Jsx) => OxcSourceType::jsx(),
      Some(SourceType::Tsx) => OxcSourceType::tsx(),
      Some(SourceType::Typescript) => OxcSourceType::ts(),
      None => OxcSourceType::from_path(&self.filename).unwrap_or_default(),
    }
  }

  fn serialize_program(program: &Program) -> String {
    Codegen::new().build(program).code
  }
}

impl Query for ParseQuery {
  type Result = ParseResult;

  fn execute(&self) -> Result<Self::Result, FacetpackError> {
    let allocator = Allocator::default();
    let source_type = self.get_oxc_source_type();

    let parser_return = Parser::new(&allocator, &self.source_text, source_type).parse();

    let errors: Vec<String> = parser_return.errors.iter().map(|e| e.to_string()).collect();

    let diagnostics: Vec<Diagnostic> = parser_return
      .errors
      .iter()
      .map(|e| self.create_diagnostic(e))
      .collect();

    let program = Self::serialize_program(&parser_return.program);

    Ok(ParseResult {
      program,
      errors,
      diagnostics,
      panicked: parser_return.panicked,
    })
  }
}

impl ParseQuery {
  fn create_diagnostic(&self, error: &oxc_diagnostics::OxcDiagnostic) -> Diagnostic {
    let message = error.message.to_string();
    let formatted = self.render_diagnostic(error);
    let (line, column) = self.extract_position(error);
    let help = self.get_help_text(&message);
    let suggestion = self.get_suggestion(&message);
    let code = Some(self.get_error_code(&message));
    let snippet = self.get_snippet_at_line(line);

    Diagnostic {
      severity: DiagnosticSeverity::Error,
      code,
      message,
      filename: self.filename.clone(),
      line,
      column,
      end_line: None,
      end_column: None,
      snippet,
      label: None,
      help,
      suggestion,
      formatted,
    }
  }

  fn render_diagnostic(&self, error: &oxc_diagnostics::OxcDiagnostic) -> String {
    let enhanced = self.enhance_with_help(error);

    let handler = GraphicalReportHandler::new_themed(GraphicalTheme::unicode())
      .with_context_lines(3);

    let source = NamedSource::new(&self.filename, self.source_text.clone());
    let error_with_source = enhanced.with_source_code(source);

    let mut output = String::new();
    handler.render_report(&mut output, error_with_source.as_ref()).ok();
    output
  }

  fn enhance_with_help(&self, error: &oxc_diagnostics::OxcDiagnostic) -> oxc_diagnostics::OxcDiagnostic {
    let msg = error.message.to_string();

    let help: Option<&str> = if msg.contains("Expected `}` but found") {
      Some("Add the missing closing brace `}` to match the opening `{`")
    } else if msg.contains("Expected `,`") || msg.contains("Expected `}`") {
      Some("Check for missing punctuation or unclosed brackets")
    } else if msg.contains("Unexpected token") {
      Some("Check for missing operators, brackets, or typos near this location")
    } else if msg.contains("Unterminated string") || msg.contains("Unterminated") {
      Some("Add a closing quote to terminate the string literal")
    } else if msg.contains("reserved word") || msg.contains("reserved") {
      Some("Use a different identifier - this is a JavaScript reserved keyword")
    } else if msg.contains("return") && msg.contains("function") {
      Some("The `return` statement can only be used inside a function body")
    } else if msg.contains("await") {
      Some("The `await` keyword can only be used inside an async function")
    } else if msg.contains("import") || msg.contains("export") {
      Some("Import/export statements are only allowed in ES modules")
    } else {
      None
    };

    match help {
      Some(text) => error.clone().with_help(text),
      None => error.clone(),
    }
  }

  fn extract_position(&self, error: &oxc_diagnostics::OxcDiagnostic) -> (u32, u32) {
    if let Some(labels) = &error.labels {
      if let Some(first_label) = labels.first() {
        let offset = first_label.offset();
        return self.offset_to_line_col(offset);
      }
    }
    (1, 1)
  }

  fn offset_to_line_col(&self, offset: usize) -> (u32, u32) {
    let mut line = 1u32;
    let mut col = 1u32;
    for (i, ch) in self.source_text.chars().enumerate() {
      if i >= offset {
        break;
      }
      if ch == '\n' {
        line += 1;
        col = 1;
      } else {
        col += 1;
      }
    }
    (line, col)
  }

  fn get_snippet_at_line(&self, line: u32) -> Option<String> {
    self
      .source_text
      .lines()
      .nth(line.saturating_sub(1) as usize)
      .map(|s| s.to_string())
  }

  fn get_error_code(&self, message: &str) -> String {
    if message.contains("Expected") && message.contains("but found") {
      "E0001".to_string()
    } else if message.contains("Unexpected token") {
      "E0002".to_string()
    } else if message.contains("Unterminated") {
      "E0003".to_string()
    } else if message.contains("reserved word") || message.contains("reserved") {
      "E0004".to_string()
    } else if message.contains("return") {
      "E0005".to_string()
    } else if message.contains("await") {
      "E0006".to_string()
    } else if message.contains("import") || message.contains("export") {
      "E0007".to_string()
    } else {
      "E0000".to_string()
    }
  }

  fn get_help_text(&self, message: &str) -> Option<String> {
    if message.contains("Expected `}` but found") {
      Some("Add the missing closing brace `}` to match the opening `{`".to_string())
    } else if message.contains("Expected `,`") || message.contains("Expected `}`") {
      Some("Check for missing punctuation or unclosed brackets".to_string())
    } else if message.contains("Unexpected token") {
      Some("Check for missing operators, brackets, or typos near this location".to_string())
    } else if message.contains("Unterminated string") || message.contains("Unterminated") {
      Some("Add a closing quote to terminate the string literal".to_string())
    } else if message.contains("reserved word") || message.contains("reserved") {
      Some("Use a different identifier - this is a JavaScript reserved keyword".to_string())
    } else if message.contains("return") && message.contains("function") {
      Some("The `return` statement can only be used inside a function body".to_string())
    } else {
      None
    }
  }

  fn get_suggestion(&self, message: &str) -> Option<String> {
    if message.contains("Unterminated string") {
      Some("Add `\"` at the end of the string".to_string())
    } else if message.contains("Expected `}`") {
      Some("Add `}` to close the block".to_string())
    } else {
      None
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_javascript() {
    let query = ParseQuery::new("test.js".to_string(), "const x = 1;".to_string(), None);
    let result = query.execute().unwrap();

    assert!(!result.panicked);
    assert!(result.errors.is_empty());
    assert!(result.program.contains("const"));
  }

  #[test]
  fn test_parse_typescript() {
    let query = ParseQuery::new(
      "test.ts".to_string(),
      "const x: number = 1;".to_string(),
      None,
    );
    let result = query.execute().unwrap();

    assert!(!result.panicked);
    assert!(result.errors.is_empty());
  }

  #[test]
  fn test_parse_tsx() {
    let query = ParseQuery::new(
      "test.tsx".to_string(),
      "const App = () => <div>Hello</div>;".to_string(),
      None,
    );
    let result = query.execute().unwrap();

    assert!(!result.panicked);
    assert!(result.errors.is_empty());
  }

  #[test]
  fn test_parse_with_explicit_source_type() {
    let options = ParseOptions {
      source_type: Some(SourceType::Module),
      preserve_parens: None,
    };
    let query = ParseQuery::new(
      "test.txt".to_string(),
      "const x = 1;".to_string(),
      Some(options),
    );
    let result = query.execute().unwrap();

    assert!(!result.panicked);
  }

  #[test]
  fn test_parse_syntax_error() {
    let query = ParseQuery::new("test.js".to_string(), "const x = ;".to_string(), None);
    let result = query.execute().unwrap();

    assert!(!result.errors.is_empty());
  }

  #[test]
  fn test_error_unclosed_brace() {
    let code = r#"const obj = {
  name: "test",
  value: 42"#;
    let query = ParseQuery::new("config.ts".to_string(), code.to_string(), None);
    let result = query.execute().unwrap();

    assert!(result.panicked);
    assert!(!result.diagnostics.is_empty());
    for diag in &result.diagnostics {
      println!("{}", diag.formatted);
    }
  }

  #[test]
  fn test_error_unexpected_token() {
    let code = "const x = = 5;";
    let query = ParseQuery::new("app.ts".to_string(), code.to_string(), None);
    let result = query.execute().unwrap();

    assert!(!result.diagnostics.is_empty());
    for diag in &result.diagnostics {
      println!("{}", diag.formatted);
    }
  }

  #[test]
  fn test_error_invalid_jsx() {
    let code = r#"const App = () => {
  return <View style=>
};"#;
    let options = ParseOptions {
      source_type: Some(SourceType::Tsx),
      preserve_parens: None,
    };
    let query = ParseQuery::new("App.tsx".to_string(), code.to_string(), Some(options));
    let result = query.execute().unwrap();

    assert!(!result.diagnostics.is_empty());
    for diag in &result.diagnostics {
      println!("{}", diag.formatted);
    }
  }

  #[test]
  fn test_error_invalid_typescript_type() {
    let code = "const x: = 5;";
    let options = ParseOptions {
      source_type: Some(SourceType::Typescript),
      preserve_parens: None,
    };
    let query = ParseQuery::new("types.ts".to_string(), code.to_string(), Some(options));
    let result = query.execute().unwrap();

    assert!(!result.diagnostics.is_empty());
    for diag in &result.diagnostics {
      println!("{}", diag.formatted);
    }
  }

  #[test]
  fn test_error_missing_semicolon_asi() {
    let code = r#"const a = 1
const b = 2
return a + b"#;
    let query = ParseQuery::new("calc.js".to_string(), code.to_string(), None);
    let result = query.execute().unwrap();

    for diag in &result.diagnostics {
      println!("{}", diag.formatted);
    }
  }

  #[test]
  fn test_error_unterminated_string() {
    let code = r#"const message = "Hello world"#;
    let query = ParseQuery::new("strings.ts".to_string(), code.to_string(), None);
    let result = query.execute().unwrap();

    assert!(!result.diagnostics.is_empty());
    for diag in &result.diagnostics {
      println!("{}", diag.formatted);
    }
  }

  #[test]
  fn test_error_reserved_word_as_identifier() {
    let code = "const class = 5;";
    let query = ParseQuery::new("reserved.ts".to_string(), code.to_string(), None);
    let result = query.execute().unwrap();

    assert!(!result.diagnostics.is_empty());
    for diag in &result.diagnostics {
      println!("{}", diag.formatted);
    }
  }

  #[test]
  fn test_all_source_types() {
    let options = ParseOptions {
      source_type: Some(SourceType::Script),
      preserve_parens: None,
    };
    let query = ParseQuery::new(
      "test.txt".to_string(),
      "var x = 1;".to_string(),
      Some(options),
    );
    assert!(query.execute().is_ok());

    let options = ParseOptions {
      source_type: Some(SourceType::Jsx),
      preserve_parens: None,
    };
    let query = ParseQuery::new("test.txt".to_string(), "<div/>".to_string(), Some(options));
    assert!(query.execute().is_ok());

    let options = ParseOptions {
      source_type: Some(SourceType::Tsx),
      preserve_parens: None,
    };
    let query = ParseQuery::new("test.txt".to_string(), "<div/>".to_string(), Some(options));
    assert!(query.execute().is_ok());

    let options = ParseOptions {
      source_type: Some(SourceType::Typescript),
      preserve_parens: None,
    };
    let query = ParseQuery::new(
      "test.txt".to_string(),
      "const x: number = 1;".to_string(),
      Some(options),
    );
    assert!(query.execute().is_ok());
  }
}
