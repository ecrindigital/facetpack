use super::{ErrorAnalyzer, ErrorInfo};

pub struct ReservedWordAnalyzer;

const RESERVED_WORDS: &[&str] = &[
  "class", "const", "let", "var", "function", "return", "if", "else",
  "for", "while", "do", "switch", "case", "break", "continue",
  "new", "this", "super", "extends", "static", "public", "private",
  "protected", "import", "export", "default", "async", "await",
  "try", "catch", "finally", "throw", "typeof", "instanceof",
  "yield", "enum", "interface", "implements", "package",
];

impl ErrorAnalyzer for ReservedWordAnalyzer {
  fn can_analyze(&self, message: &str, _snippet: &str) -> bool {
    let msg_lower = message.to_lowercase();
    msg_lower.contains("reserved") || msg_lower.contains("keyword")
  }

  fn analyze(&self, _message: &str, snippet: &str, _column: u32) -> ErrorInfo {
    let found_word = self.find_reserved_word(snippet);

    ErrorInfo::new(
      "E0004",
      "Utilisation d'un mot réservé comme identifiant",
      &format!(
        "Le mot '{}' est réservé par JavaScript et ne peut pas être utilisé comme nom de variable",
        found_word.unwrap_or("(mot réservé)")
      ),
      &self.generate_suggestion(found_word),
    )
  }

  fn priority(&self) -> u8 {
    80
  }
}

impl ReservedWordAnalyzer {
  fn find_reserved_word(&self, snippet: &str) -> Option<&'static str> {
    for word in RESERVED_WORDS {
      if snippet.contains(&format!("const {} ", word))
        || snippet.contains(&format!("let {} ", word))
        || snippet.contains(&format!("var {} ", word))
      {
        return Some(word);
      }
    }
    None
  }

  fn generate_suggestion(&self, word: Option<&str>) -> String {
    match word {
      Some(w) => {
        let capitalized = w
          .chars()
          .next()
          .map(|c| c.to_uppercase().to_string())
          .unwrap_or_default()
          + &w[1..];
        format!(
          "Choisissez un autre nom: `my{}` ou `{}_value` par exemple",
          capitalized, w
        )
      }
      None => "Choisissez un autre nom pour votre variable".to_string(),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_reserved_class() {
    let analyzer = ReservedWordAnalyzer;
    assert!(analyzer.can_analyze("reserved word", ""));

    let result = analyzer.analyze("reserved word", "const class = 5;", 7);
    assert_eq!(result.code, "E0004");
    assert!(result.help.contains("class"));
    assert!(result.suggestion.contains("myClass"));
  }

  #[test]
  fn test_reserved_function() {
    let analyzer = ReservedWordAnalyzer;
    let result = analyzer.analyze("reserved word", "let function = test", 5);
    assert!(result.help.contains("function"));
  }
}
