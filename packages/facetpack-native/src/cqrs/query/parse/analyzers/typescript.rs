use super::{ErrorAnalyzer, ErrorInfo};

pub struct TypeScriptAnalyzer;

impl ErrorAnalyzer for TypeScriptAnalyzer {
  fn can_analyze(&self, message: &str, snippet: &str) -> bool {
    let msg_lower = message.to_lowercase();
    msg_lower.contains("type") || snippet.contains(": ")
  }

  fn analyze(&self, message: &str, snippet: &str, _column: u32) -> ErrorInfo {
    if let Some(error) = self.check_empty_type_annotation(snippet) {
      return error;
    }

    if let Some(error) = self.check_missing_parameter_type(snippet) {
      return error;
    }

    if let Some(error) = self.check_invalid_generic(snippet) {
      return error;
    }

    if let Some(error) = self.check_readonly_assignment(message) {
      return error;
    }

    ErrorInfo::new(
      "E0020",
      message,
      "Erreur de syntaxe TypeScript. Vérifiez les annotations de type",
      "Consultez: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
    )
  }

  fn priority(&self) -> u8 {
    60
  }
}

impl TypeScriptAnalyzer {
  fn check_empty_type_annotation(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains(": =") || snippet.contains(":=") || snippet.contains(": ;") {
      return Some(ErrorInfo::new(
        "E0020",
        "Annotation de type vide",
        "Une annotation de type (:) doit être suivie d'un type valide",
        "Ajoutez le type: `const x: number = 5` ou `const x: string = 'hello'`",
      ));
    }
    None
  }

  fn check_missing_parameter_type(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains("(") && snippet.contains(":)") {
      return Some(ErrorInfo::new(
        "E0021",
        "Type de paramètre manquant",
        "Un paramètre avec ':' doit avoir un type spécifié",
        "Exemple: `function foo(param: string)` ou utilisez `any` temporairement",
      ));
    }
    None
  }

  fn check_invalid_generic(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains("<>") || snippet.contains("<,") {
      return Some(ErrorInfo::new(
        "E0022",
        "Générique invalide ou vide",
        "Les génériques doivent contenir au moins un type: Array<T>",
        "Spécifiez un type: `Array<string>` ou `Promise<void>`",
      ));
    }
    None
  }

  fn check_readonly_assignment(&self, message: &str) -> Option<ErrorInfo> {
    if message.to_lowercase().contains("readonly") {
      return Some(ErrorInfo::new(
        "E0023",
        "Tentative de modification d'une propriété readonly",
        "Les propriétés marquées 'readonly' ne peuvent pas être modifiées après initialisation",
        "Retirez 'readonly' si la modification est nécessaire, ou créez une nouvelle instance",
      ));
    }
    None
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_empty_type_annotation() {
    let analyzer = TypeScriptAnalyzer;
    assert!(analyzer.can_analyze("type error", "const x: "));

    let result = analyzer.analyze("error", "const x: = 5;", 10);
    assert_eq!(result.code, "E0020");
    assert!(result.message.contains("vide"));
  }

  #[test]
  fn test_missing_parameter_type() {
    let analyzer = TypeScriptAnalyzer;
    let result = analyzer.analyze("error", "function foo(x:) {}", 14);
    assert_eq!(result.code, "E0021");
  }

  #[test]
  fn test_invalid_generic() {
    let analyzer = TypeScriptAnalyzer;
    let result = analyzer.analyze("error", "const arr: Array<> = []", 17);
    assert_eq!(result.code, "E0022");
  }
}
