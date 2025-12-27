use crate::cqrs::traits::Command;
use crate::domain::error::FacetpackError;
use crate::domain::types::{MinifyOptions, MinifyResult};

use oxc_allocator::Allocator;
use oxc_codegen::{Codegen, CodegenOptions};
use oxc_minifier::{
  CompressOptions, MangleOptions, MangleOptionsKeepNames, Minifier, MinifierOptions,
};
use oxc_parser::Parser;
use oxc_span::SourceType;

pub struct MinifyCommand {
  pub code: String,
  pub filename: String,
  pub options: MinifyOptions,
}

impl MinifyCommand {
  pub fn new(code: String, filename: String, options: Option<MinifyOptions>) -> Self {
    Self {
      code,
      filename,
      options: options.unwrap_or_default(),
    }
  }

  fn build_minifier_options(&self) -> MinifierOptions {
    let compress = if self.options.compress.unwrap_or(true) {
      Some(CompressOptions {
        drop_console: self.options.drop_console.unwrap_or(false),
        drop_debugger: self.options.drop_debugger.unwrap_or(true),
        ..Default::default()
      })
    } else {
      None
    };

    let mangle = if self.options.mangle.unwrap_or(true) {
      let keep_fnames = self.options.keep_fnames.unwrap_or(false);
      Some(MangleOptions {
        keep_names: MangleOptionsKeepNames {
          function: keep_fnames,
          class: keep_fnames,
        },
        ..Default::default()
      })
    } else {
      None
    };

    MinifierOptions { compress, mangle }
  }
}

impl Command for MinifyCommand {
  type Result = MinifyResult;

  fn execute(&self) -> Result<Self::Result, FacetpackError> {
    let allocator = Allocator::default();
    let source_type = SourceType::mjs();

    let parser_return = Parser::new(&allocator, &self.code, source_type).parse();

    if parser_return.panicked {
      return Err(FacetpackError::ParseError(
        parser_return
          .errors
          .iter()
          .map(|e| e.to_string())
          .collect::<Vec<_>>()
          .join("\n"),
      ));
    }

    let mut program = parser_return.program;

    let minifier_options = self.build_minifier_options();
    Minifier::new(minifier_options).minify(&allocator, &mut program);

    let codegen_options = CodegenOptions {
      minify: true,
      source_map_path: if self.options.sourcemap.unwrap_or(false) {
        Some(self.filename.clone().into())
      } else {
        None
      },
      ..Default::default()
    };

    let codegen_return = Codegen::new().with_options(codegen_options).build(&program);

    let map = codegen_return.map.map(|m| m.to_json_string());

    Ok(MinifyResult {
      code: codegen_return.code,
      map,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_minify_basic() {
    let code = r#"
      function hello(name) {
        console.log("Hello, " + name);
        return name;
      }
      hello("world");
    "#;
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), None);
    let result = command.execute().unwrap();

    assert!(!result.code.contains("\n  "));
    assert!(result.code.len() < code.len());
  }

  #[test]
  fn test_minify_with_mangle() {
    let code = r#"
      function calculateTotal(price, quantity) {
        const total = price * quantity;
        return total;
      }
    "#;
    let options = MinifyOptions {
      mangle: Some(true),
      compress: Some(true),
      ..Default::default()
    };
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), Some(options));
    let result = command.execute().unwrap();

    assert!(!result.code.contains("calculateTotal"));
  }

  #[test]
  fn test_minify_without_mangle() {
    // Export function so it's not removed as dead code
    let code = r#"
      export function calculateTotal(price, quantity) {
        const total = price * quantity;
        return total;
      }
    "#;
    let options = MinifyOptions {
      mangle: Some(false),
      compress: Some(false), // Disable compress to avoid dead code elimination
      ..Default::default()
    };
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), Some(options));
    let result = command.execute().unwrap();

    assert!(result.code.contains("calculateTotal"));
  }

  #[test]
  fn test_minify_drop_console() {
    let code = r#"
      console.log("debug");
      const x = 1;
    "#;
    let options = MinifyOptions {
      drop_console: Some(true),
      ..Default::default()
    };
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), Some(options));
    let result = command.execute().unwrap();

    assert!(!result.code.contains("console.log"));
  }

  #[test]
  fn test_minify_keep_console() {
    let code = r#"console.log("keep me"); const x = 1;"#;
    let options = MinifyOptions {
      drop_console: Some(false),
      ..Default::default()
    };
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), Some(options));
    let result = command.execute().unwrap();

    assert!(result.code.contains("console"));
  }

  #[test]
  fn test_minify_with_sourcemap() {
    let code = "const x = 1;";
    let options = MinifyOptions {
      sourcemap: Some(true),
      ..Default::default()
    };
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), Some(options));
    let result = command.execute().unwrap();

    assert!(result.map.is_some());
    assert!(result.map.unwrap().contains("mappings"));
  }

  #[test]
  fn test_minify_parse_error() {
    let code = "const x = ;";
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), None);
    let result = command.execute();

    assert!(result.is_err());
  }

  #[test]
  fn test_minify_empty() {
    let command = MinifyCommand::new("".to_string(), "test.js".to_string(), None);
    let result = command.execute().unwrap();

    assert!(result.code.is_empty() || result.code == "\n");
  }

  #[test]
  fn test_minify_complex_code() {
    let code = r#"
      const users = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];

      function findUser(id) {
        for (let i = 0; i < users.length; i++) {
          if (users[i].id === id) {
            return users[i];
          }
        }
        return null;
      }

      const result = findUser(1);
      if (result) {
        console.log(result.name);
      }
    "#;
    let command = MinifyCommand::new(code.to_string(), "test.js".to_string(), None);
    let result = command.execute().unwrap();

    assert!(result.code.len() < code.len());
  }
}
