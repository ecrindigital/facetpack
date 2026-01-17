use regex::Regex;

pub struct ComponentContextDetector<'a> {
  source_text: &'a str,
}

impl<'a> ComponentContextDetector<'a> {
  pub fn new(source_text: &'a str) -> Self {
    Self { source_text }
  }

  pub fn detect(&self, line: u32) -> Option<String> {
    let lines: Vec<&str> = self.source_text.lines().collect();
    let start_line = line.saturating_sub(1) as usize;

    for i in (0..=start_line.min(lines.len().saturating_sub(1))).rev() {
      let l = lines.get(i).unwrap_or(&"");

      if let Some(name) = self.extract_function_component(l) {
        return Some(format!("Component: {}", name));
      }

      if l.contains("class ") && l.contains("extends") {
        if let Some(name) = self.extract_class_component(l) {
          return Some(format!("Class: {}", name));
        }
      }

      if l.contains("const use") || l.contains("function use") {
        if let Some(name) = self.extract_hook(l) {
          return Some(format!("Hook: {}", name));
        }
      }
    }

    None
  }

  fn extract_function_component(&self, line: &str) -> Option<String> {
    let patterns = [
      r"(?:export\s+)?(?:default\s+)?function\s+([A-Z][a-zA-Z0-9]*)",
      r"const\s+([A-Z][a-zA-Z0-9]*)\s*=",
      r"export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=",
    ];

    for pattern in patterns {
      if let Ok(re) = Regex::new(pattern) {
        if let Some(caps) = re.captures(line) {
          if let Some(name) = caps.get(1) {
            return Some(name.as_str().to_string());
          }
        }
      }
    }
    None
  }

  fn extract_class_component(&self, line: &str) -> Option<String> {
    if let Ok(re) = Regex::new(r"class\s+([A-Z][a-zA-Z0-9]*)") {
      if let Some(caps) = re.captures(line) {
        return caps.get(1).map(|m| m.as_str().to_string());
      }
    }
    None
  }

  fn extract_hook(&self, line: &str) -> Option<String> {
    if let Ok(re) = Regex::new(r"(?:const|function)\s+(use[A-Z][a-zA-Z0-9]*)") {
      if let Some(caps) = re.captures(line) {
        return caps.get(1).map(|m| m.as_str().to_string());
      }
    }
    None
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_detect_function_component() {
    let code = r#"
export default function MyComponent() {
  const x = 5;
  return <div />;
}
"#;
    let detector = ComponentContextDetector::new(code);
    assert_eq!(detector.detect(3), Some("Component: MyComponent".to_string()));
  }

  #[test]
  fn test_detect_arrow_component() {
    let code = r#"
const UserProfile = () => {
  const error = here;
}
"#;
    let detector = ComponentContextDetector::new(code);
    assert_eq!(detector.detect(3), Some("Component: UserProfile".to_string()));
  }

  #[test]
  fn test_detect_hook() {
    let code = r#"
function useCustomHook() {
  const state = something;
}
"#;
    let detector = ComponentContextDetector::new(code);
    assert_eq!(detector.detect(3), Some("Hook: useCustomHook".to_string()));
  }
}
