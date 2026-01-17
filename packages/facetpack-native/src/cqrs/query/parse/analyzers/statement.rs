use super::{ErrorAnalyzer, ErrorInfo};

pub struct StatementAnalyzer;

impl ErrorAnalyzer for StatementAnalyzer {
  fn can_analyze(&self, message: &str, _snippet: &str) -> bool {
    let msg_lower = message.to_lowercase();
    (msg_lower.contains("return") && !msg_lower.contains("type"))
      || msg_lower.contains("await")
      || msg_lower.contains("yield")
      || msg_lower.contains("break")
      || msg_lower.contains("continue")
  }

  fn analyze(&self, message: &str, snippet: &str, _column: u32) -> ErrorInfo {
    let msg_lower = message.to_lowercase();

    if msg_lower.contains("return") {
      return self.analyze_return_error(snippet);
    }

    if msg_lower.contains("await") {
      return self.analyze_await_error(snippet);
    }

    if msg_lower.contains("yield") {
      return self.analyze_yield_error();
    }

    if msg_lower.contains("break") || msg_lower.contains("continue") {
      return self.analyze_loop_control_error(message);
    }

    ErrorInfo::fallback(message)
  }

  fn priority(&self) -> u8 {
    40
  }
}

impl StatementAnalyzer {
  fn analyze_return_error(&self, snippet: &str) -> ErrorInfo {
    if snippet.contains("<") && snippet.contains(">") {
      return ErrorInfo::new(
        "E0040",
        "'return' utilisé en dehors d'une fonction",
        "En React, le JSX doit être retourné depuis l'intérieur d'une fonction ou composant",
        "Placez le return dans une fonction: `function Component() { return <View />; }`",
      );
    }

    ErrorInfo::new(
      "E0040",
      "'return' utilisé en dehors d'une fonction",
      "L'instruction 'return' ne peut être utilisée qu'à l'intérieur du corps d'une fonction",
      "Placez le code dans une fonction: `function myFunc() { return value; }`",
    )
  }

  fn analyze_await_error(&self, snippet: &str) -> ErrorInfo {
    if snippet.contains("function") && !snippet.contains("async") {
      return ErrorInfo::new(
        "E0041",
        "'await' utilisé dans une fonction non-async",
        "L'opérateur 'await' ne peut être utilisé que dans une fonction marquée 'async'",
        "Ajoutez 'async' devant 'function': `async function myFunc() { await promise; }`",
      );
    }

    ErrorInfo::new(
      "E0041",
      "'await' utilisé en dehors d'une fonction async",
      "L'opérateur 'await' ne peut être utilisé que dans une fonction marquée 'async'",
      "Créez une fonction async: `async function myFunc() { await promise; }` ou utilisez une IIFE: `(async () => { await promise; })()`",
    )
  }

  fn analyze_yield_error(&self) -> ErrorInfo {
    ErrorInfo::new(
      "E0042",
      "'yield' utilisé en dehors d'un générateur",
      "L'opérateur 'yield' ne peut être utilisé que dans une fonction génératrice (function*)",
      "Créez un générateur: `function* myGenerator() { yield value; }`",
    )
  }

  fn analyze_loop_control_error(&self, message: &str) -> ErrorInfo {
    let keyword = if message.to_lowercase().contains("break") {
      "break"
    } else {
      "continue"
    };

    ErrorInfo::new(
      "E0043",
      &format!("'{}' utilisé en dehors d'une boucle", keyword),
      &format!(
        "L'instruction '{}' ne peut être utilisée qu'à l'intérieur d'une boucle (for, while, do-while)",
        keyword
      ),
      &format!(
        "Placez '{}' dans une boucle: `for (let i = 0; i < 10; i++) {{ if (cond) {} }}`",
        keyword, keyword
      ),
    )
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_return_error() {
    let analyzer = StatementAnalyzer;
    assert!(analyzer.can_analyze("return outside function", ""));

    let result = analyzer.analyze("return outside function", "return 5;", 1);
    assert_eq!(result.code, "E0040");
  }

  #[test]
  fn test_await_error() {
    let analyzer = StatementAnalyzer;
    let result = analyzer.analyze("await outside async", "await fetch()", 1);
    assert_eq!(result.code, "E0041");
  }

  #[test]
  fn test_await_in_non_async() {
    let analyzer = StatementAnalyzer;
    let result = analyzer.analyze("await error", "function foo() { await bar(); }", 17);
    assert!(result.suggestion.contains("async"));
  }

  #[test]
  fn test_yield_error() {
    let analyzer = StatementAnalyzer;
    let result = analyzer.analyze("yield outside generator", "yield 5", 1);
    assert_eq!(result.code, "E0042");
  }

  #[test]
  fn test_break_error() {
    let analyzer = StatementAnalyzer;
    let result = analyzer.analyze("break outside loop", "break;", 1);
    assert_eq!(result.code, "E0043");
  }
}
