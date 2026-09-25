/**
 * 会員登録用の認証コード（12 文字、4 文字ごとにハイフン区切りで表示）
 *
 * 使える文字種の判定は API 側で行い、ブラウザには送らない。
 */
export const MEMBER_CODE_LENGTH = 12;
const GROUP_SIZE = 4;

/**
 * 入力値を大文字化し、英数字以外（ハイフンや空白）を取り除く
 *
 * 使われていない文字もここでは取り除かない。入力欄の挙動から文字種を推測させないため。
 */
export function normalizeMemberCode(input: string): string {
	return input
		.toUpperCase()
		.replace(/[^0-9A-Z]/g, "")
		.slice(0, MEMBER_CODE_LENGTH);
}

/** `K7M2P9XQ4RTW` → `K7M2-P9XQ-4RTW` */
export function formatMemberCode(code: string): string {
	return code.match(new RegExp(`.{1,${GROUP_SIZE}}`, "g"))?.join("-") ?? "";
}

/** 入力が桁数に達したか（ボタンの有効化用） */
export function isCompleteMemberCode(code: string): boolean {
	return code.length === MEMBER_CODE_LENGTH;
}
