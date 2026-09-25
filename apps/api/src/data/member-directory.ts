import { z } from "@hono/zod-openapi";
import { MEMBER_CODE_PATTERN } from "../lib/member-code";
import rawEntries from "./member-codes.json";

export type DirectoryEntry = {
	code: string;
	name: string;
	graduationYear: number;
};

/**
 * 認証コードと会員の対応表
 *
 * 開発中は JSON（`member-codes.json`）を使い、本番では D1 の実装に差し替える。
 */
export interface MemberDirectory {
	findByCode(code: string): Promise<DirectoryEntry | null>;
}

const entriesSchema = z
	.array(
		z.object({
			code: z.string().regex(MEMBER_CODE_PATTERN),
			name: z.string().min(1),
			graduationYear: z.int().min(1900).max(2100),
		}),
	)
	.superRefine((entries, ctx) => {
		const seen = new Set<string>();
		for (const [index, entry] of entries.entries()) {
			if (seen.has(entry.code)) {
				ctx.addIssue({
					code: "custom",
					message: `コードが重複しています: ${entry.code}`,
					path: [index],
				});
			}
			seen.add(entry.code);
		}
	});

/** 型を満たさない場合は読み込み時（Worker の起動時）にエラーにする */
export function parseDirectoryEntries(input: unknown): DirectoryEntry[] {
	return entriesSchema.parse(input);
}

export function createJsonMemberDirectory(entries: DirectoryEntry[]): MemberDirectory {
	const byCode = new Map(entries.map(entry => [entry.code, entry]));
	return {
		findByCode: async code => byCode.get(code) ?? null,
	};
}

export const memberDirectory = createJsonMemberDirectory(parseDirectoryEntries(rawEntries));
