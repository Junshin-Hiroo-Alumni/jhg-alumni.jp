/** 見間違えやすい 0 / O、1 / I / L を除いた英大文字と数字（31 文字） */
export const MEMBER_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const MEMBER_CODE_LENGTH = 12;
export const MEMBER_CODE_PATTERN = new RegExp(`^[${MEMBER_CODE_ALPHABET}]{${MEMBER_CODE_LENGTH}}$`);

/** 大文字化し、ハイフンや空白を取り除く（`k7m2-p9xq-4rtw` → `K7M2P9XQ4RTW`） */
export function normalizeMemberCode(input: string): string {
	return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}
