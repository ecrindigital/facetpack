use crate::cqrs::traits::Query;
use crate::domain::error::FacetpackError;
use crate::domain::types::{ParseOptions, ParseResult, SourceType};

use oxc_allocator::Allocator;
use oxc_ast::ast::Program;
use oxc_codegen::Codegen;
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

    let program = Self::serialize_program(&parser_return.program);

    Ok(ParseResult {
      program,
      errors,
      panicked: parser_return.panicked,
    })
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
