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
exports.prisma = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dbSeeder_1 = require("./utils/dbSeeder");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const level_routes_1 = __importDefault(require("./routes/level.routes"));
const question_routes_1 = __importDefault(require("./routes/question.routes"));
const answer_route_1 = __importDefault(require("./routes/answer.route"));
const app = (0, express_1.default)();
const port = process.env.PORT;
// instantiating a new prisma client
exports.prisma = new client_1.PrismaClient();
// middlewares
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
const initialize = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, dbSeeder_1.dbInit)();
        console.log('DB INITIALIZED');
    }
    catch (error) {
        console.log('server initialization error', error);
        process.exit(1);
    }
});
app.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        "success": true,
        "message": "server working"
    });
}));
app.use("/auth", auth_routes_1.default);
app.use("/subject", subject_routes_1.default);
app.use("/level", level_routes_1.default);
app.use("/question", question_routes_1.default);
app.use("/answer", answer_route_1.default);
initialize().catch((e) => {
    process.exit(1);
});
// seedUsers().catch(e => {
//     console.log('Failed to seed users',e);
//     process.exit(1);
// });
app.listen(port, () => {
    console.log(`server is running on post ${port}`);
});
