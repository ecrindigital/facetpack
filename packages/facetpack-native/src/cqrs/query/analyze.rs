use crate::cqrs::traits::Query;
use crate::domain::error::FacetpackError;
use crate::domain::types::{ExportInfo, ImportInfo, ModuleAnalysis, ModuleInput};

use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_parser::Parser;
use oxc_span::SourceType;

pub struct AnalyzeQuery {
  pub filename: String,
  pub source_text: String,
}

impl AnalyzeQuery {
  pub fn new(filename: String, source_text: String) -> Self {
    Self { filename, source_text }
  }
}

impl Query for AnalyzeQuery {
  type Result = ModuleAnalysis;

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

    let mut exports = Vec::new();
    let mut imports = Vec::new();
    let mut has_side_effects = false;

    for stmt in program.body.iter() {
      match stmt {
        Statement::ImportDeclaration(import_decl) => {
          let source = import_decl.source.value.to_string();
          let mut specifiers = Vec::new();
          let mut is_side_effect = true;

          if let Some(import_specifiers) = &import_decl.specifiers {
            is_side_effect = import_specifiers.is_empty();
            for spec in import_specifiers.iter() {
              match spec {
                ImportDeclarationSpecifier::ImportSpecifier(s) => {
                  specifiers.push(s.imported.name().to_string());
                }
                ImportDeclarationSpecifier::ImportDefaultSpecifier(_) => {
                  specifiers.push("default".to_string());
                }
                ImportDeclarationSpecifier::ImportNamespaceSpecifier(_) => {
                  specifiers.push("*".to_string());
                }
              }
            }
          }

          imports.push(ImportInfo {
            source,
            specifiers,
            is_side_effect,
          });
        }

        Statement::ExportNamedDeclaration(export_decl) => {
          let source = export_decl.source.as_ref().map(|s| s.value.to_string());
          let is_reexport = source.is_some();

          for spec in export_decl.specifiers.iter() {
            exports.push(ExportInfo {
              name: spec.exported.name().to_string(),
              is_default: false,
              is_reexport,
              source: source.clone(),
            });
          }

          if let Some(decl) = &export_decl.declaration {
            match decl {
              Declaration::VariableDeclaration(var_decl) => {
                for declarator in var_decl.declarations.iter() {
                  if let Some(name) = get_binding_name(&declarator.id) {
                    exports.push(ExportInfo {
                      name,
                      is_default: false,
                      is_reexport: false,
                      source: None,
                    });
                  }
                }
              }
              Declaration::FunctionDeclaration(fn_decl) => {
                if let Some(id) = &fn_decl.id {
                  exports.push(ExportInfo {
                    name: id.name.to_string(),
                    is_default: false,
                    is_reexport: false,
                    source: None,
                  });
                }
              }
              Declaration::ClassDeclaration(class_decl) => {
                if let Some(id) = &class_decl.id {
                  exports.push(ExportInfo {
                    name: id.name.to_string(),
                    is_default: false,
                    is_reexport: false,
                    source: None,
                  });
                }
              }
              _ => {}
            }
          }
        }

        Statement::ExportDefaultDeclaration(_) => {
          exports.push(ExportInfo {
            name: "default".to_string(),
            is_default: true,
            is_reexport: false,
            source: None,
          });
        }

        Statement::ExportAllDeclaration(export_all) => {
          let source = export_all.source.value.to_string();
          let name = export_all
            .exported
            .as_ref()
            .map(|e| e.name().to_string())
            .unwrap_or_else(|| "*".to_string());

          exports.push(ExportInfo {
            name,
            is_default: false,
            is_reexport: true,
            source: Some(source),
          });
        }

        Statement::ExpressionStatement(expr_stmt) => {
          match &expr_stmt.expression {
            Expression::CallExpression(_) => {
              has_side_effects = true;
            }
            Expression::AssignmentExpression(_) => {
              has_side_effects = true;
            }
            _ => {}
          }
        }

        _ => {}
      }
    }

    Ok(ModuleAnalysis {
      exports,
      imports,
      has_side_effects,
    })
  }
}

fn get_binding_name(pattern: &BindingPattern) -> Option<String> {
  match &pattern.kind {
    BindingPatternKind::BindingIdentifier(id) => Some(id.name.to_string()),
    _ => None,
  }
}

pub struct AnalyzeBatchQuery {
  pub modules: Vec<ModuleInput>,
}

impl AnalyzeBatchQuery {
  pub fn new(modules: Vec<ModuleInput>) -> Self {
    Self { modules }
  }
}

impl Query for AnalyzeBatchQuery {
  type Result = Vec<ModuleAnalysis>;

  fn execute(&self) -> Result<Self::Result, FacetpackError> {
    let mut results = Vec::with_capacity(self.modules.len());

    for module in &self.modules {
      let query = AnalyzeQuery::new(module.path.clone(), module.code.clone());
      match query.execute() {
        Ok(analysis) => results.push(analysis),
        Err(_) => {
          results.push(ModuleAnalysis {
            exports: Vec::new(),
            imports: Vec::new(),
            has_side_effects: true,
          });
        }
      }
    }

    Ok(results)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_analyze_named_exports() {
    let code = r#"
      export const foo = 1;
      export function bar() {}
      export class Baz {}
    "#;
    let query = AnalyzeQuery::new("test.ts".to_string(), code.to_string());
    let result = query.execute().unwrap();

    assert_eq!(result.exports.len(), 3);
    assert!(result.exports.iter().any(|e| e.name == "foo"));
    assert!(result.exports.iter().any(|e| e.name == "bar"));
    assert!(result.exports.iter().any(|e| e.name == "Baz"));
  }

  #[test]
  fn test_analyze_default_export() {
    let code = "export default function() {}";
    let query = AnalyzeQuery::new("test.ts".to_string(), code.to_string());
    let result = query.execute().unwrap();

    assert_eq!(result.exports.len(), 1);
    assert!(result.exports[0].is_default);
    assert_eq!(result.exports[0].name, "default");
  }

  #[test]
  fn test_analyze_reexports() {
    let code = r#"
      export { foo, bar } from './module';
      export * from './other';
    "#;
    let query = AnalyzeQuery::new("test.ts".to_string(), code.to_string());
    let result = query.execute().unwrap();

    assert_eq!(result.exports.len(), 3);
    assert!(result.exports.iter().all(|e| e.is_reexport));
  }

  #[test]
  fn test_analyze_imports() {
    let code = r#"
      import React from 'react';
      import { useState, useEffect } from 'react';
      import * as lodash from 'lodash';
      import './styles.css';
    "#;
    let query = AnalyzeQuery::new("test.tsx".to_string(), code.to_string());
    let result = query.execute().unwrap();

    assert_eq!(result.imports.len(), 4);

    let css_import = result.imports.iter().find(|i| i.source == "./styles.css").unwrap();
    assert!(css_import.is_side_effect);
  }

  #[test]
  fn test_analyze_side_effects() {
    let code = r#"
      console.log('side effect');
      window.foo = 'bar';
    "#;
    let query = AnalyzeQuery::new("test.js".to_string(), code.to_string());
    let result = query.execute().unwrap();

    assert!(result.has_side_effects);
  }

  #[test]
  fn test_analyze_no_side_effects() {
    let code = r#"
      export const x = 1;
      export function foo() { return x; }
    "#;
    let query = AnalyzeQuery::new("test.js".to_string(), code.to_string());
    let result = query.execute().unwrap();

    assert!(!result.has_side_effects);
  }
}
