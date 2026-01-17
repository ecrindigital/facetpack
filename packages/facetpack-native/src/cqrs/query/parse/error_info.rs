/// Represents enriched error information with context and suggestions
#[derive(Debug, Clone)]
pub struct ErrorInfo {
  pub code: String,
  pub message: String,
  pub help: String,
  pub suggestion: String,
}

impl ErrorInfo {
  pub fn new(code: &str, message: &str, help: &str, suggestion: &str) -> Self {
    Self {
      code: code.to_string(),
      message: message.to_string(),
      help: help.to_string(),
      suggestion: suggestion.to_string(),
    }
  }

  /// Creates a generic fallback error info
  pub fn fallback(message: &str) -> Self {
    Self {
      code: "E0000".to_string(),
      message: message.to_string(),
      help: "Vérifiez la syntaxe autour de cette ligne".to_string(),
      suggestion: "Consultez la documentation JavaScript/TypeScript".to_string(),
    }
  }
}
