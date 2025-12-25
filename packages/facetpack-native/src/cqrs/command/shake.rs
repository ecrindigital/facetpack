use std::collections::HashSet;

use crate::cqrs::traits::Command;
use crate::domain::error::FacetpackError;
use crate::domain::types::ShakeResult;

use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_codegen::{Codegen, CodegenOptions};
use oxc_parser::Parser;
use oxc_span::SourceType;

pub struct ShakeCommand {
  pub filename: String,
  pub source_text: String,
  pub used_exports: Vec<String>,
}

impl ShakeCommand {
  pub fn new(filename: String, source_text: String, used_exports: Vec<String>) -> Self {
    Self {
      filename,
      source_text,
      used_exports,
    }
  }
}

impl Command for ShakeCommand {
  type Result = ShakeResult;

  fn execute(&self) -> Result<Self::Result, FacetpackError> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&self.filename).unwrap_or_default();

    let parser_return = Parser::new(&allocator, &self.source_text, source_type).parse();

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

    let program = parser_return.program;
    let used_set: HashSet<&str> = self.used_exports.iter().map(|s| s.as_str()).collect();
    let use_all = used_set.contains("*");

    let mut removed_exports = Vec::new();
    let mut kept_statements = Vec::new();

    for stmt in program.body.iter() {
      let should_keep = match stmt {
        Statement::ExportNamedDeclaration(export_decl) => {
          if use_all {
            true
          } else if !export_decl.specifiers.is_empty() {
            let mut any_used = false;
            for spec in export_decl.specifiers.iter() {
              let name = spec.exported.name().to_string();
              if used_set.contains(name.as_str()) {
                any_used = true;
              } else {
                removed_exports.push(name);
              }
            }
            any_used
          } else if let Some(decl) = &export_decl.declaration {
            let name = get_declaration_name(decl);
            if let Some(ref n) = name {
              if used_set.contains(n.as_str()) {
                true
              } else {
                removed_exports.push(n.clone());
                false
              }
            } else {
              true
            }
          } else {
            true
          }
        }

        Statement::ExportDefaultDeclaration(_) => {
          if use_all || used_set.contains("default") {
            true
          } else {
            removed_exports.push("default".to_string());
            false
          }
        }

        Statement::ExportAllDeclaration(export_all) => {
          if use_all {
            true
          } else if let Some(exported) = &export_all.exported {
            let name = exported.name().to_string();
            if used_set.contains(name.as_str()) {
              true
            } else {
              removed_exports.push(name);
              false
            }
          } else {
            true
          }
        }

        _ => true,
      };

      if should_keep {
        kept_statements.push(stmt);
      }
    }

    let codegen_options = CodegenOptions::default();
    let codegen_return = Codegen::new().with_options(codegen_options).build(&program);

    Ok(ShakeResult {
      code: codegen_return.code,
      map: None,
      removed_exports,
    })
  }
}

fn get_declaration_name(decl: &Declaration) -> Option<String> {
  match decl {
    Declaration::VariableDeclaration(var_decl) => {
      var_decl
        .declarations
        .first()
        .and_then(|d| match &d.id.kind {
          BindingPatternKind::BindingIdentifier(id) => Some(id.name.to_string()),
          _ => None,
        })
    }
    Declaration::FunctionDeclaration(fn_decl) => fn_decl.id.as_ref().map(|id| id.name.to_string()),
    Declaration::ClassDeclaration(class_decl) => {
      class_decl.id.as_ref().map(|id| id.name.to_string())
    }
    _ => None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_shake_unused_exports() {
    let code = r#"
      export const used = 1;
      export const unused = 2;
      export function alsoUnused() {}
    "#;
    let command = ShakeCommand::new(
      "test.js".to_string(),
      code.to_string(),
      vec!["used".to_string()],
    );
    let result = command.execute().unwrap();

    assert!(result.removed_exports.contains(&"unused".to_string()));
    assert!(result.removed_exports.contains(&"alsoUnused".to_string()));
    assert!(!result.removed_exports.contains(&"used".to_string()));
  }

  #[test]
  fn test_shake_keep_all_with_star() {
    let code = r#"
      export const a = 1;
      export const b = 2;
    "#;
    let command = ShakeCommand::new(
      "test.js".to_string(),
      code.to_string(),
      vec!["*".to_string()],
    );
    let result = command.execute().unwrap();

    assert!(result.removed_exports.is_empty());
  }

  #[test]
  fn test_shake_default_export() {
    let code = r#"
      export default function() {}
      export const named = 1;
    "#;
    let command = ShakeCommand::new(
      "test.js".to_string(),
      code.to_string(),
      vec!["named".to_string()],
    );
    let result = command.execute().unwrap();

    assert!(result.removed_exports.contains(&"default".to_string()));
  }

  #[test]
  fn test_shake_preserves_imports() {
    let code = r#"
      import { dep } from './dep';
      export const used = dep;
      export const unused = 1;
    "#;
    let command = ShakeCommand::new(
      "test.js".to_string(),
      code.to_string(),
      vec!["used".to_string()],
    );
    let result = command.execute().unwrap();

    assert!(result.code.contains("import"));
  }
}
