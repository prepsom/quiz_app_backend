"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = void 0;
const validateEmail = (email) => {
    if (email.length === 0)
        return false;
    if (!email.includes("@"))
        return false;
    const [firstPart, lastPart] = email.split("@");
    if (firstPart === "" || lastPart === "")
        return false;
    let isValidDomain = false;
    for (const domain of EMAIL_DOMAINS) {
        if (lastPart.endsWith(domain)) {
            isValidDomain = true;
            break;
        }
    }
    if (!isValidDomain)
        return false;
    return true;
};
exports.validateEmail = validateEmail;
const EMAIL_DOMAINS = [
    ".com",
    ".net",
    ".org",
    ".edu",
    ".gov",
    ".mil",
    ".co",
    ".io",
    ".ai",
    ".app",
    ".dev",
    ".tech",
    ".online",
    ".store",
    ".xyz",
    ".info",
    ".biz",
    ".me",
    ".tv",
    // Country specific
    ".in", // India
    ".us", // United States
    ".uk", // United Kingdom
    ".ca", // Canada
    ".au", // Australia
    ".de", // Germany
    ".fr", // France
    ".jp", // Japan
    ".br", // Brazil
    ".it", // Italy
    // Combined domains
    ".co.in",
    ".co.uk",
    ".com.au",
    ".ac.in",
    ".edu.in",
    ".org.uk",
    ".gov.in",
];
