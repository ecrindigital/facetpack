use super::{ErrorAnalyzer, ErrorInfo};

pub struct JsxAnalyzer;

impl ErrorAnalyzer for JsxAnalyzer {
  fn can_analyze(&self, message: &str, snippet: &str) -> bool {
    let msg_lower = message.to_lowercase();
    msg_lower.contains("jsx")
      || (snippet.contains("<") && (snippet.contains("/>") || snippet.contains("</")))
  }

  fn analyze(&self, message: &str, snippet: &str, _column: u32) -> ErrorInfo {
    if let Some(error) = self.check_style_syntax(snippet) {
      return error;
    }

    if let Some(error) = self.check_class_attribute(snippet) {
      return error;
    }

    if let Some(error) = self.check_event_handlers(snippet) {
      return error;
    }

    if let Some(error) = self.check_for_attribute(snippet) {
      return error;
    }

    ErrorInfo::new(
      "E0010",
      message,
      "Erreur de syntaxe JSX. Vérifiez les balises, attributs et expressions",
      "Les expressions JS doivent être entre accolades: `{expression}`",
    )
  }

  fn priority(&self) -> u8 {
    70
  }
}

impl JsxAnalyzer {
  fn check_style_syntax(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains("style=")
      && !snippet.contains("style={{")
      && !snippet.contains("style={")
    {
      return Some(ErrorInfo::new(
        "E0010",
        "Syntaxe de style JSX invalide",
        "En JSX/React Native, les styles doivent être passés comme objet JavaScript",
        "Utilisez: `style={{ prop: value }}` ou `style={styles.nomDuStyle}`",
      ));
    }
    None
  }

  fn check_class_attribute(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains("class=") && !snippet.contains("className=") {
      return Some(ErrorInfo::new(
        "E0011",
        "Attribut 'class' invalide en JSX",
        "En JSX, utilisez 'className' au lieu de 'class' pour les classes CSS",
        "Remplacez `class=` par `className=`",
      ));
    }
    None
  }

  fn check_event_handlers(&self, snippet: &str) -> Option<ErrorInfo> {
    let lowercase_handlers = ["onclick", "onchange", "onsubmit", "onfocus", "onblur", "onmouseover"];

    for handler in lowercase_handlers {
      if snippet.to_lowercase().contains(handler) && !snippet.contains(&self.to_camel_case(handler)) {
        return Some(ErrorInfo::new(
          "E0012",
          "Gestionnaire d'événement en minuscules",
          "En JSX, les gestionnaires d'événements utilisent le camelCase",
          &format!(
            "Utilisez `{}` au lieu de `{}`. Pour React Native, utilisez `onPress`",
            self.to_camel_case(handler),
            handler
          ),
        ));
      }
    }
    None
  }

  fn check_for_attribute(&self, snippet: &str) -> Option<ErrorInfo> {
    if snippet.contains("for=") && !snippet.contains("htmlFor=") {
      return Some(ErrorInfo::new(
        "E0013",
        "Attribut 'for' invalide en JSX",
        "En JSX, utilisez 'htmlFor' au lieu de 'for' pour les labels",
        "Remplacez `for=` par `htmlFor=`",
      ));
    }
    None
  }

  fn to_camel_case(&self, handler: &str) -> String {
    if handler.len() < 3 {
      return handler.to_string();
    }
    let first_part = &handler[..2];
    let rest = &handler[2..];
    let capitalized = rest
      .chars()
      .next()
      .map(|c| c.to_uppercase().to_string())
      .unwrap_or_default()
      + &rest[1..];
    format!("{}{}", first_part, capitalized)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_style_syntax() {
    let analyzer = JsxAnalyzer;
    assert!(analyzer.can_analyze("jsx error", "<div style="));

    let result = analyzer.analyze("error", "<View style=>", 12);
    assert_eq!(result.code, "E0010");
    assert!(result.suggestion.contains("style={{"));
  }

  #[test]
  fn test_class_attribute() {
    let analyzer = JsxAnalyzer;
    let result = analyzer.analyze("error", "<div class=\"foo\">", 6);
    assert_eq!(result.code, "E0011");
    assert!(result.suggestion.contains("className"));
  }

  #[test]
  fn test_event_handler() {
    let analyzer = JsxAnalyzer;
    let result = analyzer.analyze("error", "<button onclick={}>", 8);
    assert_eq!(result.code, "E0012");
    assert!(result.suggestion.contains("onClick"));
  }

  #[test]
  fn test_for_attribute() {
    let analyzer = JsxAnalyzer;
    let result = analyzer.analyze("error", "<label for=\"input\">", 7);
    assert_eq!(result.code, "E0013");
    assert!(result.suggestion.contains("htmlFor"));
  }
}
