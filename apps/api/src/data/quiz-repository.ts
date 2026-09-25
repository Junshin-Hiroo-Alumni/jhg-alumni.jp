import { z } from "@hono/zod-openapi";
import rawQuestions from "./quizzes.json";

/** 1 回の挑戦で出題する問題数 */
export const QUIZ_QUESTION_COUNT = 5;

const questionSchema = z
	.object({
		id: z.string().min(1),
		text: z.string().min(1),
		/** サイト内のパス（例: `/quiz/photo.jpg`）または絶対 URL */
		image: z.string().min(1).optional(),
		type: z.enum(["single", "multiple"]),
		choices: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
		answers: z.array(z.string()).min(1),
	})
	.superRefine((question, ctx) => {
		const choiceIds = question.choices.map(choice => choice.id);
		if (new Set(choiceIds).size !== choiceIds.length) {
			ctx.addIssue({ code: "custom", message: "選択肢の id が重複しています", path: ["choices"] });
		}
		if (question.answers.some(answer => !choiceIds.includes(answer))) {
			ctx.addIssue({
				code: "custom",
				message: "answers に存在しない選択肢があります",
				path: ["answers"],
			});
		}
		if (question.type === "single" && question.answers.length !== 1) {
			ctx.addIssue({
				code: "custom",
				message: "single の正解は 1 つにしてください",
				path: ["answers"],
			});
		}
	});

const questionsSchema = z
	.array(questionSchema)
	.min(QUIZ_QUESTION_COUNT)
	.superRefine((questions, ctx) => {
		const ids = questions.map(question => question.id);
		if (new Set(ids).size !== ids.length) {
			ctx.addIssue({ code: "custom", message: "問題の id が重複しています" });
		}
	});

export type QuizQuestion = z.infer<typeof questionSchema>;

/**
 * クイズの問題集
 *
 * 開発中は JSON（`quizzes.json`）を使い、本番では D1 の実装に差し替える。
 */
export interface QuizRepository {
	list(): Promise<QuizQuestion[]>;
}

/** 型を満たさない場合は読み込み時（Worker の起動時）にエラーにする */
export function parseQuizQuestions(input: unknown): QuizQuestion[] {
	return questionsSchema.parse(input);
}

export function createJsonQuizRepository(questions: QuizQuestion[]): QuizRepository {
	return { list: async () => questions };
}

export const quizRepository = createJsonQuizRepository(parseQuizQuestions(rawQuestions));
