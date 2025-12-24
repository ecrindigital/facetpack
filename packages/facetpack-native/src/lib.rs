#![deny(clippy::all)]

mod cqrs;
mod domain;

use napi_derive::napi;

pub use domain::types::*;

use cqrs::command::{MinifyCommand, ShakeCommand, TransformCommand};
use cqrs::query::{AnalyzeBatchQuery, AnalyzeQuery, ParseQuery, ResolveBatchQuery, ResolveQuery, ResolveResult, ResolverOptions};
use cqrs::traits::{Command, Query};


#[napi]
pub struct FacetPack {
  _config: FacetPackConfig,
}

#[derive(Default)]
struct FacetPackConfig {
}

#[napi]
impl FacetPack {
  #[napi(constructor)]
  pub fn new() -> Self {
    Self {
      _config: FacetPackConfig::default(),
    }
  }

  #[napi]
  pub fn parse(
    &self,
    filename: String,
    source_text: String,
    options: Option<ParseOptions>,
  ) -> napi::Result<ParseResult> {
    let query = ParseQuery::new(filename, source_text, options);
    query.execute().map_err(Into::into)
  }

  #[napi]
  pub fn transform(
    &self,
    filename: String,
    source_text: String,
    options: Option<TransformOptions>,
  ) -> napi::Result<TransformResult> {
    let command = TransformCommand::new(filename, source_text, options);
    command.execute().map_err(Into::into)
  }

  #[napi]
  pub fn resolve(
    &self,
    directory: String,
    specifier: String,
    options: Option<ResolverOptions>,
  ) -> napi::Result<ResolveResult> {
    let query = ResolveQuery::new(directory, specifier, options);
    query.execute().map_err(Into::into)
  }
}

#[napi]
pub fn parse_sync(
  filename: String,
  source_text: String,
  options: Option<ParseOptions>,
) -> napi::Result<ParseResult> {
  let query = ParseQuery::new(filename, source_text, options);
  query.execute().map_err(Into::into)
}

#[napi]
pub fn transform_sync(
  filename: String,
  source_text: String,
  options: Option<TransformOptions>,
) -> napi::Result<TransformResult> {
  let command = TransformCommand::new(filename, source_text, options);
  command.execute().map_err(Into::into)
}

#[napi]
pub fn resolve_sync(
  directory: String,
  specifier: String,
  options: Option<ResolverOptions>,
) -> napi::Result<ResolveResult> {
  let query = ResolveQuery::new(directory, specifier, options);
  query.execute().map_err(Into::into)
}

#[napi]
pub fn resolve_batch_sync(
  directory: String,
  specifiers: Vec<String>,
  options: Option<ResolverOptions>,
) -> Vec<ResolveResult> {
  let query = ResolveBatchQuery::new(directory, specifiers, options);
  query.execute()
}

#[napi]
pub fn minify_sync(
  code: String,
  filename: String,
  options: Option<MinifyOptions>,
) -> napi::Result<MinifyResult> {
  let command = MinifyCommand::new(code, filename, options);
  command.execute().map_err(Into::into)
}

#[napi]
pub fn analyze_sync(filename: String, source_text: String) -> napi::Result<ModuleAnalysis> {
  let query = AnalyzeQuery::new(filename, source_text);
  query.execute().map_err(Into::into)
}

#[napi]
pub fn analyze_batch_sync(modules: Vec<ModuleInput>) -> napi::Result<Vec<ModuleAnalysis>> {
  let query = AnalyzeBatchQuery::new(modules);
  query.execute().map_err(Into::into)
}

#[napi]
pub fn shake_sync(
  filename: String,
  source_text: String,
  used_exports: Vec<String>,
) -> napi::Result<ShakeResult> {
  let command = ShakeCommand::new(filename, source_text, used_exports);
  command.execute().map_err(Into::into)
}
