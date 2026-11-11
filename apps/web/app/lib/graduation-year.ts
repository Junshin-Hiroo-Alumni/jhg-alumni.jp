/** 名簿で最も古い卒業年（1 回生、昭和3年） */
const FIRST_GRADUATION_YEAR = 1928;

/**
 * 和暦の年（卒業する 3 月時点）
 *
 * 改元が年の途中のため、1989 年 3 月は平成元年、2019 年 3 月は平成31年になる。
 */
function toWareki(year: number): string {
	const [era, offset] =
		year >= 2020
			? ["令和", 2018]
			: year >= 1989
				? ["平成", 1988]
				: year >= 1927
					? ["昭和", 1925]
					: ["大正", 1911];
	const eraYear = year - offset;
	return `${era}${eraYear === 1 ? "元" : eraYear}年`;
}

/** 名簿に卒年がない中学卒業の人は、卒業年の代わりにこれを選ぶ */
export const JUNIOR_HIGH_LABEL = "中学卒業";
/** フォームで中学卒業を表す値（API には null で送る） */
export const JUNIOR_HIGH_VALUE = "junior-high";

/** `1928` → `1928年（昭和3年）`。中学卒業（null）は `中学卒業` */
export function formatGraduationYear(year: number | null): string {
	return year === null ? JUNIOR_HIGH_LABEL : `${year}年（${toWareki(year)}）`;
}

/** フォームの値を API に送る卒業年に変換する。不正な値は undefined */
export function parseGraduationYearValue(
	value: FormDataEntryValue | null,
): number | null | undefined {
	if (value === JUNIOR_HIGH_VALUE) {
		return null;
	}
	const year = Number(value);
	return Number.isInteger(year) && year > 0 ? year : undefined;
}

/** 選択肢に出す卒業年（新しい順） */
export function graduationYearOptions(now = new Date()): number[] {
	const latest = now.getFullYear();
	return Array.from({ length: latest - FIRST_GRADUATION_YEAR + 1 }, (_, i) => latest - i);
}
