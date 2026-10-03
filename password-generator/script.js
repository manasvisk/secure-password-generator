"use strict";

// Character groups required in every generated password.
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}?";
const MIN_LENGTH = 6;
const MAX_LENGTH = 64;
const ANALYTICS_STORAGE_KEY = "northstar.passwordGenerator.analytics.v1";

const lengthInput = document.querySelector("#passwordLength");
const lengthError = document.querySelector("#lengthError");
const includeSymbols = document.querySelector("#includeSymbols");
const passwordOutput = document.querySelector("#passwordOutput");
const generateButton = document.querySelector("#generateButton");
const copyButton = document.querySelector("#copyButton");
const copyFeedback = document.querySelector("#copyFeedback");
const strengthWrap = document.querySelector("#strengthWrap");
const strengthLabel = document.querySelector("#strengthLabel");
const resultState = document.querySelector("#resultState");
const visibilityButton = document.querySelector("#visibilityButton");

// Use rejection sampling to choose uniformly from a character group.
function randomIndex(maxExclusive) {
  const range = 0x100000000;
  const limit = range - (range % maxExclusive);
  const randomValue = new Uint32Array(1);

  do {
    window.crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= limit);

  return randomValue[0] % maxExclusive;
}

function chooseCharacter(characters) {
  return characters[randomIndex(characters.length)];
}

// Seed each required character class, fill the remainder, then shuffle.
function createPassword(length, symbolsEnabled) {
  const groups = [UPPERCASE, LOWERCASE, DIGITS];
  if (symbolsEnabled) {
    groups.push(SYMBOLS);
  }

  const allCharacters = groups.join("");
  const passwordCharacters = groups.map(chooseCharacter);

  while (passwordCharacters.length < length) {
    passwordCharacters.push(chooseCharacter(allCharacters));
  }

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ];
  }

  return passwordCharacters.join("");
}

function setStrength(length) {
  let strength = "weak";
  let label = "Weak";

  if (length >= 16) {
    strength = "strong";
    label = "Strong";
  } else if (length >= 10) {
    strength = "medium";
    label = "Medium";
  }

  strengthWrap.dataset.strength = strength;
  strengthLabel.textContent = label;
  return label;
}

// Store generation metadata only; never save the generated password itself.
function recordGeneration(length, strength) {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const record = { date, length, strength, timestamp: now.toISOString() };

  try {
    const storedRecords = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || "[]");
    const records = Array.isArray(storedRecords) ? storedRecords : [];
    records.push(record);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.warn("Password analytics could not be saved:", error);
    return false;
  }
}

function validateLength() {
  const length = Number(lengthInput.value);
  const isValid = Number.isInteger(length) && length >= MIN_LENGTH && length <= MAX_LENGTH;

  lengthInput.setAttribute("aria-invalid", String(!isValid));
  lengthError.hidden = isValid;
  return isValid ? length : null;
}

function setLoading(isLoading) {
  generateButton.disabled = isLoading;
  generateButton.classList.toggle("is-loading", isLoading);
  generateButton.querySelector(".button-label").textContent = isLoading
    ? "Generating..."
    : "Generate password";
}

// Generate on demand, keeping all password creation inside the browser.
generateButton.addEventListener("click", async () => {
  const length = validateLength();
  if (length === null) {
    lengthInput.focus();
    return;
  }

  copyFeedback.textContent = "";
  copyFeedback.classList.remove("is-error");
  setLoading(true);

  await new Promise((resolve) => window.setTimeout(resolve, 360));

  try {
    const password = createPassword(length, includeSymbols.checked);
    passwordOutput.value = password;
    passwordOutput.type = "text";
    passwordOutput.classList.remove("is-updated");
    void passwordOutput.offsetWidth;
    passwordOutput.classList.add("is-updated");
    copyButton.disabled = false;
    visibilityButton.disabled = false;
    visibilityButton.setAttribute("aria-label", "Hide password");
    visibilityButton.title = "Hide password";
    visibilityButton.innerHTML = '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
    resultState.textContent = "PASSWORD READY";
    const strength = setStrength(length);
    const analyticsSaved = recordGeneration(length, strength);
    if (!analyticsSaved) {
      copyFeedback.textContent = "Password generated, but analytics could not be saved.";
      copyFeedback.classList.add("is-error");
    }
  } catch (error) {
    copyFeedback.textContent = "Secure randomness is unavailable in this browser context.";
    copyFeedback.classList.add("is-error");
    console.error("Password generation failed:", error);
  } finally {
    setLoading(false);
  }
});

// Copy the result and announce success or a useful failure message.
copyButton.addEventListener("click", async () => {
  if (!passwordOutput.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(passwordOutput.value);
    copyFeedback.textContent = "Password copied to clipboard.";
    copyFeedback.classList.remove("is-error");
  } catch {
    copyFeedback.textContent = "Clipboard access was blocked. Select and copy the password instead.";
    copyFeedback.classList.add("is-error");
  }
});

// Let users mask the generated value without changing the clipboard value.
visibilityButton.addEventListener("click", () => {
  const isVisible = passwordOutput.type === "text";
  passwordOutput.type = isVisible ? "password" : "text";
  visibilityButton.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
  visibilityButton.title = isVisible ? "Show password" : "Hide password";
  visibilityButton.innerHTML = isVisible
    ? '<i class="fa-regular fa-eye-slash" aria-hidden="true"></i>'
    : '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
});

// Keep the step controls inside the accepted length range.
document.querySelector("#decreaseLength").addEventListener("click", () => {
  lengthInput.value = String(Math.max(MIN_LENGTH, Number(lengthInput.value || MIN_LENGTH) - 1));
  validateLength();
});

document.querySelector("#increaseLength").addEventListener("click", () => {
  lengthInput.value = String(Math.min(MAX_LENGTH, Number(lengthInput.value || MIN_LENGTH) + 1));
  validateLength();
});

lengthInput.addEventListener("input", () => {
  if (lengthInput.value === "") {
    lengthError.hidden = false;
    lengthInput.setAttribute("aria-invalid", "true");
    return;
  }
  validateLength();
});

// Decorative particles add depth without intercepting clicks or keyboard input.
const particleField = document.querySelector("#particleField");
const particleColors = ["#73e5aa", "#ffcc75", "#dba94f"];

for (let index = 0; index < 34; index += 1) {
  const particle = document.createElement("span");
  particle.className = "particle";
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.top = `${Math.random() * 100}%`;
  particle.style.setProperty("--particle-color", particleColors[index % particleColors.length]);
  particle.style.setProperty("--drift-duration", `${9 + Math.random() * 12}s`);
  particle.style.setProperty("--drift-delay", `${Math.random() * -18}s`);
  particleField.append(particle);
}