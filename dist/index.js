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
exports.openai = exports.prisma = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const level_routes_1 = __importDefault(require("./routes/level.routes"));
const question_routes_1 = __importDefault(require("./routes/question.routes"));
const answer_route_1 = __importDefault(require("./routes/answer.route"));
const questionResponse_route_1 = __importDefault(require("./routes/questionResponse.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const school_route_1 = __importDefault(require("./routes/school.route"));
const grade_route_1 = __importDefault(require("./routes/grade.route"));
const openai_1 = __importDefault(require("openai"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const port = process.env.PORT;
// instantiating a new prisma client
exports.prisma = new client_1.PrismaClient();
exports.openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
// middlewares
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        success: true,
        message: "server working",
    });
}));
app.use("/auth", auth_routes_1.default);
app.use("/subject", subject_routes_1.default);
app.use("/level", level_routes_1.default);
app.use("/question", question_routes_1.default);
app.use("/answer", answer_route_1.default);
app.use("/question-response", questionResponse_route_1.default);
app.use("/user", user_route_1.default);
app.use("/school", school_route_1.default);
app.use("/grade", grade_route_1.default);
// Check if SSL certificates exist
const sslEnabled = () => {
    try {
        return {
            key: fs_1.default.readFileSync("./certs/key.pem"),
            cert: fs_1.default.readFileSync("./certs/cert.pem"),
        };
    }
    catch (error) {
        return false;
    }
};
const options = sslEnabled();
if (options) {
    // Create HTTPS server if SSL certificates exist
    https_1.default.createServer(options, app).listen(port, () => {
        console.log(`Secure server is running on https://localhost:${port}`);
    });
}
else {
    // Fallback to HTTP server if no SSL certificates
    http_1.default.createServer(app).listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}
