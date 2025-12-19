#![deny(clippy::all)]

mod cqrs;
mod domain;

use napi_derive::napi;

pub use domain::types::*;

use cqrs::command::TransformCommand;
use cqrs::query::ParseQuery;
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
