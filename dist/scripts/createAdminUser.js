"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const __1 = require("..");
function createAdminUser(email, password, name, avatar) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // hash the plain text password and create a user with role ==="ADMIN"
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(password.trim(), salt);
            const existingUser = yield __1.prisma.user.findUnique({
                where: { email: email.trim().toLowerCase() },
            });
            if (existingUser) {
                throw new Error("User with email already exists");
            }
            const adminUser = yield __1.prisma.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    password: hashedPassword,
                    avatar: avatar,
                    name: name.trim(),
                    role: "ADMIN",
                },
            });
            console.log("Admin user created :- ", adminUser.email, " ", adminUser.name);
        }
        catch (error) {
            console.log(error);
        }
    });
}
createAdminUser(process.argv[2], process.argv[3], process.argv[4], "MALE")
    .then(() => {
    console.log("SUCCESSFULLY ADDED ADMIN USER");
})
    .catch((e) => console.log("FAILED TO CREATE ADMIN USER"));
