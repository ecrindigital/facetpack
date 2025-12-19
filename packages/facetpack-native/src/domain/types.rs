use napi_derive::napi;

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
  pub sourcemap: Option<bool>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct TransformResult {
  pub code: String,
  pub map: Option<String>,
  pub errors: Vec<String>,
}
