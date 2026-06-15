// Markdown ファイル（app/content/notice/*.md）からお知らせを読み込む。
// バックエンド不要。.md を追加・編集するだけで更新できる。
// frontmatter 例:
//   ---
//   title: タイトル
//   date: 2026-06-01
//   category: お知らせ
//   url: https://example.com/foo.pdf   # 任意。指定すると一覧から外部リンク（PDF等）へ直接遷移する
//   ---
//   本文(Markdown)

export type NoticeItem = {
	slug: string;
	title: string;
	date: string; // YYYY-MM-DD
	formattedDate: string; // YYYY.MM.DD
	category: string;
	body: string; // Markdown 本文
	href?: string; // 外部リンク（PDF等）。指定時は詳細ページではなく外部リンクへ遷移する
};

const files = import.meta.glob("../content/notice/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
	if (!match) {
		return { data: {}, body: raw };
	}
	const data: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		const value = line
			.slice(idx + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		if (key) data[key] = value;
	}
	return { data, body: match[2].trim() };
}

function toSlug(path: string): string {
	return (path.split("/").pop() ?? path).replace(/\.md$/, "");
}

function formatDate(date: string): string {
	return date.replaceAll("-", ".");
}

const allNotices: NoticeItem[] = Object.entries(files)
	.map(([path, raw]) => {
		const { data, body } = parseFrontmatter(raw);
		const date = data.date ?? "";
		return {
			slug: toSlug(path),
			title: data.title ?? "（無題）",
			date,
			formattedDate: formatDate(date),
			category: data.category ?? "お知らせ",
			body,
			href: data.url || undefined,
		};
	})
	.sort((a, b) => b.date.localeCompare(a.date));

/** すべてのお知らせ（新しい順） */
export function getAllNotices(): NoticeItem[] {
	return allNotices;
}

/** 最新 n 件 */
export function getLatestNotices(count: number): NoticeItem[] {
	return allNotices.slice(0, count);
}

/** slug で1件取得 */
export function getNoticeBySlug(slug: string): NoticeItem | undefined {
	return allNotices.find(n => n.slug === slug);
}
