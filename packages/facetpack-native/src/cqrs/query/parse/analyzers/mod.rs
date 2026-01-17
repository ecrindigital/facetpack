mod jsx;
mod module;
mod reserved_word;
mod statement;
mod typescript;
mod unclosed_bracket;
mod unexpected_token;
mod unterminated;

use super::error_info::ErrorInfo;

pub use jsx::JsxAnalyzer;
pub use module::ModuleAnalyzer;
pub use reserved_word::ReservedWordAnalyzer;
pub use statement::StatementAnalyzer;
pub use typescript::TypeScriptAnalyzer;
pub use unclosed_bracket::UnclosedBracketAnalyzer;
pub use unexpected_token::UnexpectedTokenAnalyzer;
pub use unterminated::UnterminatedAnalyzer;

pub trait ErrorAnalyzer: Send + Sync {
  fn can_analyze(&self, message: &str, snippet: &str) -> bool;
  fn analyze(&self, message: &str, snippet: &str, column: u32) -> ErrorInfo;

  fn priority(&self) -> u8 {
    50
  }
}

pub struct AnalyzerRegistry {
  analyzers: Vec<Box<dyn ErrorAnalyzer>>,
}

impl AnalyzerRegistry {
  pub fn new() -> Self {
    let mut registry = Self {
      analyzers: Vec::new(),
    };
    registry.register_defaults();
    registry
  }

  fn register_defaults(&mut self) {
    self.register(Box::new(UnexpectedTokenAnalyzer));
    self.register(Box::new(UnclosedBracketAnalyzer));
    self.register(Box::new(UnterminatedAnalyzer));
    self.register(Box::new(ReservedWordAnalyzer));
    self.register(Box::new(JsxAnalyzer));
    self.register(Box::new(TypeScriptAnalyzer));
    self.register(Box::new(ModuleAnalyzer));
    self.register(Box::new(StatementAnalyzer));
  }

  pub fn register(&mut self, analyzer: Box<dyn ErrorAnalyzer>) {
    self.analyzers.push(analyzer);
    self.analyzers.sort_by(|a, b| b.priority().cmp(&a.priority()));
  }

  pub fn analyze(&self, message: &str, snippet: &str, column: u32) -> ErrorInfo {
    for analyzer in &self.analyzers {
      if analyzer.can_analyze(message, snippet) {
        return analyzer.analyze(message, snippet, column);
      }
    }

    ErrorInfo::fallback(message)
  }
}

impl Default for AnalyzerRegistry {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_registry_finds_correct_analyzer() {
    let registry = AnalyzerRegistry::new();

    let result = registry.analyze("Unexpected token", "const x = = 5;", 11);
    assert_eq!(result.code, "E0001");

    let result = registry.analyze("Expected `}`", "const obj = {", 12);
    assert_eq!(result.code, "E0002");
  }

  #[test]
  fn test_registry_fallback() {
    let registry = AnalyzerRegistry::new();

    let result = registry.analyze("Some unknown error", "code", 1);
    assert_eq!(result.code, "E0000");
  }
}
