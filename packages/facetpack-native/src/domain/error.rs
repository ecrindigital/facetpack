use thiserror::Error;

#[derive(Error, Debug)]
pub enum FacetpackError {
  #[error("Parse error: {0}")]
  ParseError(String),

  #[error("Transform error: {0}")]
  TransformError(String),

  #[error("Invalid source type: {0}")]
  InvalidSourceType(String),

  #[error("Codegen error: {0}")]
  CodegenError(String),
}

impl From<FacetpackError> for napi::Error {
  fn from(err: FacetpackError) -> Self {
    napi::Error::from_reason(err.to_string())
  }
}
