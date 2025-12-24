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
