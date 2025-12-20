use crate::cqrs::traits::Query;
use crate::domain::error::FacetpackError;
use napi_derive::napi;
use oxc_resolver::{ResolveOptions, Resolver};
use std::path::Path;

#[napi(object)]
#[derive(Debug, Clone)]
pub struct ResolveResult {
  pub path: Option<String>,
  pub error: Option<String>,
}

#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct ResolverOptions {
  pub extensions: Option<Vec<String>>,
  pub main_fields: Option<Vec<String>>,
  pub condition_names: Option<Vec<String>>,
}

pub struct ResolveQuery {
  pub directory: String,
  pub specifier: String,
  pub options: ResolverOptions,
}

impl ResolveQuery {
  pub fn new(directory: String, specifier: String, options: Option<ResolverOptions>) -> Self {
    Self {
      directory,
      specifier,
      options: options.unwrap_or_default(),
    }
  }

  fn build_resolve_options(&self) -> ResolveOptions {
    let mut opts = ResolveOptions::default();

    if let Some(ref extensions) = self.options.extensions {
      opts.extensions = extensions.clone();
    }

    if let Some(ref main_fields) = self.options.main_fields {
      opts.main_fields = main_fields.clone();
    }

    if let Some(ref condition_names) = self.options.condition_names {
      opts.condition_names = condition_names.clone();
    }

    opts
  }
}

impl Query for ResolveQuery {
  type Result = ResolveResult;

  fn execute(&self) -> Result<Self::Result, FacetpackError> {
    let options = self.build_resolve_options();
    let resolver = Resolver::new(options);
    let path = Path::new(&self.directory);

    match resolver.resolve(path, &self.specifier) {
      Ok(resolution) => Ok(ResolveResult {
        path: Some(resolution.full_path().to_string_lossy().to_string()),
        error: None,
      }),
      Err(e) => Ok(ResolveResult {
        path: None,
        error: Some(e.to_string()),
      }),
    }
  }
}

pub struct ResolveBatchQuery {
  pub directory: String,
  pub specifiers: Vec<String>,
  pub options: ResolverOptions,
}

impl ResolveBatchQuery {
  pub fn new(directory: String, specifiers: Vec<String>, options: Option<ResolverOptions>) -> Self {
    Self {
      directory,
      specifiers,
      options: options.unwrap_or_default(),
    }
  }

  fn build_resolve_options(&self) -> ResolveOptions {
    let mut opts = ResolveOptions::default();

    if let Some(ref extensions) = self.options.extensions {
      opts.extensions = extensions.clone();
    }

    if let Some(ref main_fields) = self.options.main_fields {
      opts.main_fields = main_fields.clone();
    }

    if let Some(ref condition_names) = self.options.condition_names {
      opts.condition_names = condition_names.clone();
    }

    opts
  }

  pub fn execute(&self) -> Vec<ResolveResult> {
    let options = self.build_resolve_options();
    let resolver = Resolver::new(options);
    let path = Path::new(&self.directory);

    self.specifiers.iter().map(|specifier| {
      match resolver.resolve(path, specifier) {
        Ok(resolution) => ResolveResult {
          path: Some(resolution.full_path().to_string_lossy().to_string()),
          error: None,
        },
        Err(e) => ResolveResult {
          path: None,
          error: Some(e.to_string()),
        },
      }
    }).collect()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_resolve_relative() {
    let query = ResolveQuery::new(
      ".".to_string(),
      "./Cargo.toml".to_string(),
      None,
    );
    let result = query.execute().unwrap();
    assert!(result.path.is_some());
    assert!(result.error.is_none());
  }

  #[test]
  fn test_resolve_not_found() {
    let query = ResolveQuery::new(
      ".".to_string(),
      "./nonexistent-file-xyz".to_string(),
      None,
    );
    let result = query.execute().unwrap();
    assert!(result.path.is_none());
    assert!(result.error.is_some());
  }
}
