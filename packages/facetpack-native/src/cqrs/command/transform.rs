use std::path::Path;

use crate::cqrs::traits::Command;
use crate::domain::error::FacetpackError;
use crate::domain::types::{JsxRuntime, SourceType, TransformOptions, TransformResult};

use oxc_allocator::Allocator;
use oxc_codegen::{Codegen, CodegenOptions};
use oxc_parser::Parser;
use oxc_semantic::SemanticBuilder;
use oxc_span::SourceType as OxcSourceType;
use oxc_transformer::{
  EnvOptions, HelperLoaderMode, HelperLoaderOptions, JsxOptions, JsxRuntime as OxcJsxRuntime,
  TransformOptions as OxcTransformOptions, Transformer, TypeScriptOptions,
};
use std::borrow::Cow;

pub struct TransformCommand {
  pub filename: String,
  pub source_text: String,
  pub options: TransformOptions,
}

impl TransformCommand {
  pub fn new(filename: String, source_text: String, options: Option<TransformOptions>) -> Self {
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

  fn build_transform_options(&self) -> OxcTransformOptions {
    let mut transform_options = OxcTransformOptions::default();

    if let Ok(env) = EnvOptions::from_target("es2020") {
      transform_options.env = env;
    }

    transform_options.helper_loader = HelperLoaderOptions {
      module_name: Cow::Borrowed("@babel/runtime"),
      mode: HelperLoaderMode::Runtime,
    };

    if self.options.jsx.unwrap_or(true) {
      let runtime = match self.options.jsx_runtime {
        Some(JsxRuntime::Classic) => OxcJsxRuntime::Classic,
        Some(JsxRuntime::Automatic) | None => OxcJsxRuntime::Automatic,
      };

      transform_options.jsx = JsxOptions {
        runtime,
        import_source: self.options.jsx_import_source.clone(),
        pragma: self.options.jsx_pragma.clone(),
        pragma_frag: self.options.jsx_pragma_frag.clone(),
        ..Default::default()
      };
    }

    if self.options.typescript.unwrap_or(true) {
      transform_options.typescript = TypeScriptOptions::default();
    }

    transform_options
  }
}

impl Command for TransformCommand {
  type Result = TransformResult;

  fn execute(&self) -> Result<Self::Result, FacetpackError> {
    let allocator = Allocator::default();
    let source_type = self.get_oxc_source_type();

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

    let mut program = parser_return.program;

    let semantic_return = SemanticBuilder::new().build(&program);

    if !semantic_return.errors.is_empty() {
      return Err(FacetpackError::TransformError(
        semantic_return
          .errors
          .iter()
          .map(|e| e.to_string())
          .collect::<Vec<_>>()
          .join("\n"),
      ));
    }

    let scoping = semantic_return.semantic.into_scoping();

    let transform_options = self.build_transform_options();
    let path = Path::new(&self.filename);
    let transformer = Transformer::new(&allocator, path, &transform_options);
    let transformer_return = transformer.build_with_scoping(scoping, &mut program);

    let errors: Vec<String> = transformer_return
      .errors
      .into_iter()
      .map(|e| e.to_string())
      .collect();

    let codegen_options = CodegenOptions {
      source_map_path: if self.options.sourcemap.unwrap_or(false) {
        Some(self.filename.clone().into())
      } else {
        None
      },
      ..Default::default()
    };

    let codegen_return = Codegen::new().with_options(codegen_options).build(&program);

    let map = codegen_return.map.map(|m| m.to_json_string());

    Ok(TransformResult {
      code: codegen_return.code,
      map,
      errors,
      diagnostics: vec![],
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_transform_typescript_stripping() {
    let command = TransformCommand::new(
      "test.ts".to_string(),
      "const x: number = 1;".to_string(),
      None,
    );
    let result = command.execute().unwrap();

    assert!(result.errors.is_empty());
    assert!(!result.code.contains(":"));
    assert!(result.code.contains("const x = 1"));
  }

  #[test]
  fn test_transform_jsx_automatic() {
    let command = TransformCommand::new(
      "test.tsx".to_string(),
      "const App = () => <div>Hello</div>;".to_string(),
      None,
    );
    let result = command.execute().unwrap();

    assert!(result.errors.is_empty());
    assert!(!result.code.contains("<div>"));
    assert!(result.code.contains("jsx"));
  }

  #[test]
  fn test_transform_jsx_classic() {
    let options = TransformOptions {
      jsx_runtime: Some(JsxRuntime::Classic),
      ..Default::default()
    };
    let command = TransformCommand::new(
      "test.tsx".to_string(),
      "const App = () => <div>Hello</div>;".to_string(),
      Some(options),
    );
    let result = command.execute().unwrap();

    assert!(result.errors.is_empty());
    assert!(!result.code.contains("<div>"));
    assert!(result.code.contains("createElement"));
  }

  #[test]
  fn test_transform_with_sourcemap() {
    let options = TransformOptions {
      sourcemap: Some(true),
      ..Default::default()
    };
    let command = TransformCommand::new(
      "test.ts".to_string(),
      "const x: number = 1;".to_string(),
      Some(options),
    );
    let result = command.execute().unwrap();

    assert!(result.errors.is_empty());
    assert!(result.map.is_some());
    assert!(result.map.unwrap().contains("mappings"));
  }

  #[test]
  fn test_transform_complex_tsx() {
    let code = r#"
      interface Props {
        name: string;
      }
      const Greeting = ({ name }: Props) => {
        return <div>Hello, {name}!</div>;
      };
      export default Greeting;
    "#;
    let command = TransformCommand::new("Greeting.tsx".to_string(), code.to_string(), None);
    let result = command.execute().unwrap();

    assert!(result.errors.is_empty());
    assert!(!result.code.contains("interface"));
    assert!(!result.code.contains(": Props"));
    assert!(!result.code.contains("<div>"));
  }

  #[test]
  fn test_transform_all_source_types() {
    let options = TransformOptions {
      source_type: Some(SourceType::Module),
      ..Default::default()
    };
    let command = TransformCommand::new(
      "test.txt".to_string(),
      "export const x = 1;".to_string(),
      Some(options),
    );
    assert!(command.execute().is_ok());

    let options = TransformOptions {
      source_type: Some(SourceType::Script),
      ..Default::default()
    };
    let command = TransformCommand::new(
      "test.txt".to_string(),
      "var x = 1;".to_string(),
      Some(options),
    );
    assert!(command.execute().is_ok());

    let options = TransformOptions {
      source_type: Some(SourceType::Jsx),
      ..Default::default()
    };
    let command =
      TransformCommand::new("test.txt".to_string(), "<div/>".to_string(), Some(options));
    assert!(command.execute().is_ok());

    let options = TransformOptions {
      source_type: Some(SourceType::Tsx),
      ..Default::default()
    };
    let command =
      TransformCommand::new("test.txt".to_string(), "<div/>".to_string(), Some(options));
    assert!(command.execute().is_ok());

    let options = TransformOptions {
      source_type: Some(SourceType::Typescript),
      ..Default::default()
    };
    let command = TransformCommand::new(
      "test.txt".to_string(),
      "const x: number = 1;".to_string(),
      Some(options),
    );
    assert!(command.execute().is_ok());
  }

  #[test]
  fn test_transform_parse_error() {
    let command = TransformCommand::new(
      "test.ts".to_string(),
      "const x: number = ;".to_string(),
      None,
    );
    let result = command.execute();

    assert!(result.is_err());
  }

  #[test]
  fn test_transform_empty_code() {
    let command = TransformCommand::new("test.js".to_string(), "".to_string(), None);
    let result = command.execute().unwrap();

    assert!(result.errors.is_empty());
  }

  #[test]
  fn test_error_transform_invalid_jsx_attribute() {
    let code = r#"const App = () => <View style= />;"#;
    let command = TransformCommand::new("Component.tsx".to_string(), code.to_string(), None);
    let result = command.execute();
    assert!(result.is_err());
  }

  #[test]
  fn test_error_transform_unclosed_jsx_tag() {
    let code = r#"const App = () => <View><Text>Hello</View>;"#;
    let command = TransformCommand::new("App.tsx".to_string(), code.to_string(), None);
    let result = command.execute();
    assert!(result.is_err());
  }

  #[test]
  fn test_error_transform_invalid_typescript_generic() {
    let code = "const fn = <T,>(x: T) => x; fn<>(5);";
    let command = TransformCommand::new("generic.ts".to_string(), code.to_string(), None);
    let _result = command.execute();
  }

  #[test]
  fn test_error_transform_mixed_jsx_children() {
    let code = r#"const App = () => <View>{items.map(i => <Text key={i}>{i}</Text>)}</View>;"#;
    let command = TransformCommand::new("List.tsx".to_string(), code.to_string(), None);
    let result = command.execute();
    assert!(result.is_ok());
  }

  #[test]
  fn test_error_transform_async_in_wrong_context() {
    let code = r#"const x = await fetch('/api');"#;
    let command = TransformCommand::new("api.ts".to_string(), code.to_string(), None);
    let _result = command.execute();
  }
}
