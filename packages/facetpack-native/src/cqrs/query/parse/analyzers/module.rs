use super::{ErrorAnalyzer, ErrorInfo};

pub struct ModuleAnalyzer;

impl ErrorAnalyzer for ModuleAnalyzer {
  fn can_analyze(&self, message: &str, _snippet: &str) -> bool {
    let msg_lower = message.to_lowercase();
    msg_lower.contains("import") || msg_lower.contains("export")
  }

  fn analyze(&self, message: &str, snippet: &str, _column: u32) -> ErrorInfo {
    if let Some(error) = self.check_default_export_syntax(snippet) {
      return error;
    }

    if let Some(error) = self.check_named_import_syntax(snippet) {
      return error;
    }

    if let Some(error) = self.check_import_assertion(message) {
      return error;
    }

    ErrorInfo::new(
      "E0030",
      message,
      "Les instructions import/export ne sont valides que dans les modules ES",
      "Vérifiez que le fichier est traité comme un module (extension .mjs ou \"type\": \"module\" dans package.json)",
    )
  }

  fn priority(&self) -> u8 {
    50
  }
}

impl ModuleAnalyzer {
  fn check_default_export_syntax(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains("export default =") {
      return Some(ErrorInfo::new(
        "E0031",
        "Syntaxe d'export default invalide",
        "L'export default ne nécessite pas le signe '='",
        "Utilisez: `export default value` ou `export default function() {}`",
      ));
    }
    None
  }

  fn check_named_import_syntax(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains("import ")
      && snippet.contains(" from ")
      && !snippet.contains("{")
      && !snippet.contains("*")
      && !snippet.contains("import type")
    {
      if snippet.contains(",") {
        return Some(ErrorInfo::new(
          "E0032",
          "Syntaxe d'import nommé invalide",
          "Les imports nommés doivent être entre accolades",
          "Utilisez: `import { name1, name2 } from 'module'`",
        ));
      }
    }
    None
  }

  fn check_import_assertion(&self, message: &str) -> Option<ErrorInfo> {
    if message.to_lowercase().contains("assertion") || message.to_lowercase().contains("assert") {
      return Some(ErrorInfo::new(
        "E0033",
        "Assertion d'import invalide",
        "Les assertions d'import (import assertions) ont une syntaxe spécifique",
        "Utilisez: `import data from './data.json' assert { type: 'json' }`",
      ));
    }
    None
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_can_analyze() {
    let analyzer = ModuleAnalyzer;
    assert!(analyzer.can_analyze("import error", ""));
    assert!(analyzer.can_analyze("export error", ""));
    assert!(!analyzer.can_analyze("syntax error", ""));
  }

  #[test]
  fn test_default_export_syntax() {
    let analyzer = ModuleAnalyzer;
    let result = analyzer.analyze("error", "export default = foo", 16);
    assert_eq!(result.code, "E0031");
  }

  #[test]
  fn test_generic_module_error() {
    let analyzer = ModuleAnalyzer;
    let result = analyzer.analyze("import error", "import something", 1);
    assert_eq!(result.code, "E0030");
  }
}
