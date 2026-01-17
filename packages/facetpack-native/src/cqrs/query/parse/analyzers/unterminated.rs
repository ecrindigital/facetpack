use super::{ErrorAnalyzer, ErrorInfo};

pub struct UnterminatedAnalyzer;

impl ErrorAnalyzer for UnterminatedAnalyzer {
  fn can_analyze(&self, message: &str, _snippet: &str) -> bool {
    message.to_lowercase().contains("unterminated")
  }

  fn analyze(&self, message: &str, snippet: &str, _column: u32) -> ErrorInfo {
    let msg_lower = message.to_lowercase();

    if msg_lower.contains("string") {
      self.analyze_string(snippet)
    } else if msg_lower.contains("template") {
      self.analyze_template()
    } else {
      self.analyze_generic(message)
    }
  }

  fn priority(&self) -> u8 {
    85
  }
}

impl UnterminatedAnalyzer {
  fn analyze_string(&self, snippet: &str) -> ErrorInfo {
    let quote_type = if snippet.contains("'") && !snippet.contains("\"") {
      "'"
    } else {
      "\""
    };

    ErrorInfo::new(
      "E0003",
      "Chaîne de caractères non terminée",
      &format!(
        "Une chaîne de caractères doit être fermée avec le même type de guillemet ({}) qu'à l'ouverture",
        quote_type
      ),
      &format!("Ajoutez {} à la fin de la chaîne pour la fermer", quote_type),
    )
  }

  fn analyze_template(&self) -> ErrorInfo {
    ErrorInfo::new(
      "E0003",
      "Template literal non terminé",
      "Un template literal (`) doit être fermé avec un backtick (`)",
      "Ajoutez ` à la fin du template literal",
    )
  }

  fn analyze_generic(&self, message: &str) -> ErrorInfo {
    ErrorInfo::new(
      "E0003",
      message,
      "Un élément de syntaxe n'est pas correctement fermé",
      "Vérifiez les guillemets, backticks et autres délimiteurs",
    )
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_unterminated_string() {
    let analyzer = UnterminatedAnalyzer;
    assert!(analyzer.can_analyze("Unterminated string literal", ""));

    let result = analyzer.analyze(
      "Unterminated string literal",
      "const msg = \"hello",
      12,
    );
    assert_eq!(result.code, "E0003");
    assert!(result.message.contains("Chaîne"));
  }

  #[test]
  fn test_unterminated_template() {
    let analyzer = UnterminatedAnalyzer;
    let result = analyzer.analyze("Unterminated template literal", "const msg = `hello", 12);
    assert!(result.message.contains("Template"));
  }
}
