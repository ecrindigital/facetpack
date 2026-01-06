# Facetpack Doctor

`facet doctor` helps diagnose common issues in your React Native + Facetpack setup.

It runs a series of checks grouped by category and reports errors or warnings,
along with guidance on how to fix them.

---

## 🖥 Environment Checks

### checkNodeVersion
**What it checks:**  
Ensures a supported Node.js version is installed.

**Why it matters:**  
Facetpack and Metro depend on Node.js features available only in supported versions.

**Failure / Warning:**  
- Error if the Node.js version is unsupported.

**How to fix:**  
Install or upgrade Node.js to a supported version.

---

### checkBunInstalled
**What it checks:**  
Checks whether Bun is installed on the system.

**Why it matters:**  
Facetpack relies on Bun for fast builds and tooling.

**Failure / Warning:**  
- Warning if Bun is not installed.

**How to fix:**  
Install Bun from https://bun.sh

---

### checkPackageManagerVersion
**What it checks:**  
Validates the version of the detected package manager.

**Why it matters:**  
Unsupported versions may cause dependency or build issues.

**Failure / Warning:**  
- Warning if the package manager version is outdated.

**How to fix:**  
Update your package manager to a supported version.

---

### checkPlatform
**What it checks:**  
Detects the operating system platform.

**Why it matters:**  
Some tools and checks are platform-specific.

**Failure / Warning:**  
- Informational output only.

**How to fix:**  
No action required.

---

### checkWatchmanInstalled
**What it checks:**  
Verifies whether Watchman is installed.

**Why it matters:**  
Watchman improves file watching performance for Metro.

**Failure / Warning:**  
- Warning if Watchman is missing.

**How to fix:**  
Install Watchman using your system package manager.

---

### checkXcodeVersion
**What it checks:**  
Checks the installed Xcode version (macOS only).

**Why it matters:**  
React Native iOS builds require a compatible Xcode version.

**Failure / Warning:**  
- Error if Xcode is missing or unsupported.

**How to fix:**  
Install or update Xcode from the App Store.

---

### checkCocoapodsVersion
**What it checks:**  
Ensures CocoaPods is installed and usable.

**Why it matters:**  
CocoaPods is required for iOS native dependencies.

**Failure / Warning:**  
- Error if CocoaPods is not installed.

**How to fix:**  
Install CocoaPods using `gem install cocoapods`.

---

### checkAndroidSdk
**What it checks:**  
Verifies that the Android SDK is installed and configured.

**Why it matters:**  
Android builds require a properly configured SDK.

**Failure / Warning:**  
- Error if Android SDK is missing or misconfigured.

**How to fix:**  
Install Android Studio and configure the SDK and environment variables.

---

## 📦 Installation Checks

### checkFacetpackInstalled
**What it checks:**  
Ensures `@ecrindigital/facetpack` is installed.

**Why it matters:**  
Facetpack must be installed for Metro integration.

**Failure / Warning:**  
- Error if Facetpack is not found.

**How to fix:**  
Install Facetpack using your package manager.

---

### checkFacetpackNativeInstalled
**What it checks:**  
Checks whether the native Facetpack bindings are installed.

**Why it matters:**  
Native bindings power the Rust-based performance features.

**Failure / Warning:**  
- Error if native bindings are missing.

**How to fix:**  
Reinstall dependencies and rebuild native bindings.

---

### checkNativeBindingsLoaded
**What it checks:**  
Verifies that native bindings can be loaded at runtime.

**Why it matters:**  
Facetpack cannot function without loaded native modules.

**Failure / Warning:**  
- Error if bindings fail to load.

**How to fix:**  
Ensure native bindings are built correctly for your platform.

---

## 🚇 Metro Checks

### checkMetroConfigExists
**What it checks:**  
Checks for the presence of `metro.config.js`.

**Why it matters:**  
Metro configuration is required for Facetpack integration.

**Failure / Warning:**  
- Error if the file does not exist.

**How to fix:**  
Create a `metro.config.js` file in your project root.

---

### checkMetroConfigValid
**What it checks:**  
Validates the Metro configuration file.

**Why it matters:**  
Invalid config may break bundling.

**Failure / Warning:**  
- Error if configuration is invalid.

**How to fix:**  
Fix syntax or configuration errors in `metro.config.js`.

---

### checkWithFacetpackApplied
**What it checks:**  
Ensures Metro config is wrapped with `withFacetpack`.

**Why it matters:**  
Facetpack must be applied to Metro to enable transformations.

**Failure / Warning:**  
- Error if Facetpack is not applied.

**How to fix:**  
Wrap the config using `withFacetpack(getDefaultConfig())`.

---

### checkTransformerConfigured
**What it checks:**  
Verifies that the Facetpack transformer is configured.

**Why it matters:**  
The transformer enables fast Rust-based transforms.

**Failure / Warning:**  
- Error if transformer is missing.

**How to fix:**  
Ensure Facetpack is properly applied in Metro config.

---

### checkResolverConfigured
**What it checks:**  
Checks whether the Facetpack resolver is active.

**Why it matters:**  
The resolver improves module resolution performance.

**Failure / Warning:**  
- Error if resolver is not configured.

**How to fix:**  
Apply Facetpack correctly in Metro config.

---

### checkSerializerConflict
**What it checks:**  
Detects conflicting Metro serializers.

**Why it matters:**  
Conflicts can break bundle output.

**Failure / Warning:**  
- Warning if conflicts are detected.

**How to fix:**  
Remove conflicting serializer configurations.

---

### checkWrapperOrder
**What it checks:**  
Ensures Metro config wrappers are applied in the correct order.

**Why it matters:**  
Incorrect order can disable Facetpack features.

**Failure / Warning:**  
- Warning if wrapper order is incorrect.

**How to fix:**  
Reorder wrappers so Facetpack is applied correctly.

---

## 📚 Package Checks

### checkReactNativeVersion
**What it checks:**  
Validates the installed React Native version.

**Why it matters:**  
Facetpack supports specific React Native versions.

**Failure / Warning:**  
- Warning if version is unsupported.

**How to fix:**  
Upgrade or downgrade React Native to a supported version.

---

### checkExpoVersion
**What it checks:**  
Checks the installed Expo version (if applicable).

**Why it matters:**  
Compatibility issues may arise with unsupported Expo versions.

**Failure / Warning:**  
- Warning if Expo version is unsupported.

**How to fix:**  
Update Expo to a compatible version.

---

### checkReanimatedBabelFallback
**What it checks:**  
Detects whether Reanimated requires Babel fallback.

**Why it matters:**  
Some packages still rely on Babel transforms.

**Failure / Warning:**  
- Informational or warning output.

**How to fix:**  
No action required unless issues occur.

---

## ⚡ Runtime Checks

### checkRuntimeTransform
**What it checks:**  
Verifies runtime transform functionality.

**Why it matters:**  
Ensures code transformation works during bundling.

**Failure / Warning:**  
- Error if transforms fail.

**How to fix:**  
Check native bindings and transformer configuration.

---

### checkRuntimeMinify
**What it checks:**  
Checks runtime minification support.

**Why it matters:**  
Minification reduces bundle size.

**Failure / Warning:**  
- Warning if minification fails.

**How to fix:**  
Ensure Facetpack runtime is correctly set up.

---

### checkRuntimeResolve
**What it checks:**  
Verifies runtime module resolution.

**Why it matters:**  
Correct resolution is required for successful bundling.

**Failure / Warning:**  
- Error if resolution fails.

**How to fix:**  
Check resolver configuration and project setup.
