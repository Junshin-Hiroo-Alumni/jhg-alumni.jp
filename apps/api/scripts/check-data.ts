// 認証コード表とクイズの JSON が型を満たすか検証する（typecheck / CI で実行）
import rawEntries from "../src/data/member-codes.json";
import { parseDirectoryEntries } from "../src/data/member-directory";
import { parseQuizQuestions } from "../src/data/quiz-repository";
import rawQuestions from "../src/data/quizzes.json";

parseDirectoryEntries(rawEntries);
parseQuizQuestions(rawQuestions);
console.info("member-codes.json / quizzes.json: OK");
