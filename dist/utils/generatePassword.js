"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePassword = void 0;
const CHARS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    special: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    similar: "ilLI1oO0",
    ambiguous: "{}[]()/\\'\"`~,;:.<>",
};
const containsCharFrom = (str, charSet) => {
    return [...str].some((char) => charSet.includes(char));
};
const generatePassword = (options = {}) => {
    const { length = 12, includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSpecials = true, excludeSimilarCharacters = false, excludeAmbiguous = false, } = options;
    // Build character pool
    let chars = "";
    if (includeLowercase)
        chars += CHARS.lowercase;
    if (includeUppercase)
        chars += CHARS.uppercase;
    if (includeNumbers)
        chars += CHARS.numbers;
    if (includeSpecials)
        chars += CHARS.special;
    // Remove excluded characters
    if (excludeSimilarCharacters) {
        for (const char of CHARS.similar) {
            chars = chars.replace(char, "");
        }
    }
    if (excludeAmbiguous) {
        for (const char of CHARS.ambiguous) {
            chars = chars.replace(char, "");
        }
    }
    if (chars.length === 0) {
        throw new Error("No characters available with current options");
    }
    // Generate password
    let password = "";
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        password += chars[randomValues[i] % chars.length];
    }
    // Ensure at least one character from each required set
    const requirements = [];
    if (includeUppercase)
        requirements.push(CHARS.uppercase);
    if (includeLowercase)
        requirements.push(CHARS.lowercase);
    if (includeNumbers)
        requirements.push(CHARS.numbers);
    if (includeSpecials)
        requirements.push(CHARS.special);
    for (const req of requirements) {
        if (!containsCharFrom(password, req)) {
            const pos = Math.floor(Math.random() * length);
            const char = req[Math.floor(Math.random() * req.length)];
            password =
                password.substring(0, pos) + char + password.substring(pos + 1);
        }
    }
    return password;
};
exports.generatePassword = generatePassword;
