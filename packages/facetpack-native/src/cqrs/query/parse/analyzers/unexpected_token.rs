use super::{ErrorAnalyzer, ErrorInfo};

pub struct UnexpectedTokenAnalyzer;

impl ErrorAnalyzer for UnexpectedTokenAnalyzer {
  fn can_analyze(&self, message: &str, _snippet: &str) -> bool {
    let msg_lower = message.to_lowercase();
    msg_lower.contains("unexpected token") || msg_lower.contains("expected expression")
  }

  fn analyze(&self, message: &str, snippet: &str, column: u32) -> ErrorInfo {
    let col = column.saturating_sub(1) as usize;
    let line = snippet.lines().next().unwrap_or("");

    if line.contains("= =") || line.contains("= = =") {
      return ErrorInfo::new(
        "E0001",
        "Opérateur double invalide détecté",
        "Deux opérateurs '=' consécutifs ne sont pas valides. Peut-être vouliez-vous '==' ou '==='?",
        &format!(
          "Remplacez '= =' par '==' pour une comparaison, ou retirez un '=' si c'est une affectation: `{}`",
          line.replace("= = =", "===").replace("= =", "==")
        ),
      );
    }

    if line.trim().ends_with('=') || (col > 0 && line.chars().nth(col) == Some('=')) {
      return ErrorInfo::new(
        "E0001",
        "Expression manquante après l'opérateur d'affectation",
        "L'opérateur '=' nécessite une valeur à droite",
        "Ajoutez une valeur après '=': `const x = 5` ou `const x = getValue()`",
      );
    }

    if snippet.contains("style=") && snippet.contains(">") {
      return ErrorInfo::new(
        "E0010",
        "Attribut JSX incomplet",
        "Un attribut JSX doit avoir une valeur. Pour les styles, utilisez un objet JavaScript",
        "Exemple: `style={{ color: 'red' }}` ou `style={styles.container}`",
      );
    }

    ErrorInfo::new(
      "E0001",
      message,
      "Un token inattendu a été trouvé. Vérifiez les opérateurs, parenthèses et virgules",
      "Vérifiez qu'il n'y a pas de caractère manquant ou en trop près de l'erreur",
    )
  }

  fn priority(&self) -> u8 {
    100
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_double_operator() {
    let analyzer = UnexpectedTokenAnalyzer;
    assert!(analyzer.can_analyze("Unexpected token", ""));

    let result = analyzer.analyze("Unexpected token", "const x = = 5;", 11);
    assert_eq!(result.code, "E0001");
    assert!(result.message.contains("double"));
  }

  #[test]
  fn test_missing_value() {
    let analyzer = UnexpectedTokenAnalyzer;
    let result = analyzer.analyze("Unexpected token", "const x =", 9);
    assert!(result.help.contains("valeur"));
  }
}
