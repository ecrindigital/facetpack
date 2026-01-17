use super::{ErrorAnalyzer, ErrorInfo};

pub struct UnclosedBracketAnalyzer;

impl ErrorAnalyzer for UnclosedBracketAnalyzer {
  fn can_analyze(&self, message: &str, _snippet: &str) -> bool {
    let msg_lower = message.to_lowercase();
    msg_lower.contains("expected `}`")
      || msg_lower.contains("expected `]`")
      || msg_lower.contains("expected `)`")
  }

  fn analyze(&self, message: &str, snippet: &str, _column: u32) -> ErrorInfo {
    let (bracket_name, open, close) = self.detect_bracket_type(message);

    let open_count = snippet.matches(open).count();
    let close_count = snippet.matches(close).count();

    ErrorInfo::new(
      "E0002",
      &format!("{} fermante '{}' manquante", bracket_name, close),
      &format!(
        "Il y a {} '{}' ouvrant(s) mais seulement {} '{}' fermant(s) dans ce bloc",
        open_count, open, close_count, close
      ),
      &format!(
        "Ajoutez '{}' pour fermer le bloc. Astuce: utilisez un éditeur avec coloration des parenthèses",
        close
      ),
    )
  }

  fn priority(&self) -> u8 {
    90
  }
}

impl UnclosedBracketAnalyzer {
  fn detect_bracket_type(&self, message: &str) -> (&'static str, &'static str, &'static str) {
    if message.contains("}") {
      ("accolade", "{", "}")
    } else if message.contains("]") {
      ("crochet", "[", "]")
    } else {
      ("parenthèse", "(", ")")
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_missing_brace() {
    let analyzer = UnclosedBracketAnalyzer;
    assert!(analyzer.can_analyze("Expected `}`", ""));

    let result = analyzer.analyze("Expected `}`", "const obj = { name: 'test'", 12);
    assert_eq!(result.code, "E0002");
    assert!(result.message.contains("accolade"));
  }

  #[test]
  fn test_missing_bracket() {
    let analyzer = UnclosedBracketAnalyzer;
    let result = analyzer.analyze("Expected `]`", "const arr = [1, 2", 12);
    assert!(result.message.contains("crochet"));
  }

  #[test]
  fn test_missing_paren() {
    let analyzer = UnclosedBracketAnalyzer;
    let result = analyzer.analyze("Expected `)`", "foo(1, 2", 4);
    assert!(result.message.contains("parenthèse"));
  }
}
