use crate::domain::error::FacetpackError;

pub trait Query {
  type Result;

  fn execute(&self) -> Result<Self::Result, FacetpackError>;
}

pub trait Command {
  type Result;

  fn execute(&self) -> Result<Self::Result, FacetpackError>;
}

#[allow(dead_code)]
pub trait QueryHandler<Q: Query> {
  fn handle(&self, query: Q) -> Result<Q::Result, FacetpackError>;
}

#[allow(dead_code)]
pub trait CommandHandler<C: Command> {
  fn handle(&self, command: C) -> Result<C::Result, FacetpackError>;
}
