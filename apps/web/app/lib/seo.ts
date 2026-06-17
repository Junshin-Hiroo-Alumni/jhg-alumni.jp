import type { MetaDescriptor } from "react-router";

export const SITE_URL = "https://jhg-alumni.jp";
export const SITE_NAME = "順心広尾学園同窓会";
export const DEFAULT_DESCRIPTION =
	"順心広尾学園同窓会（広尾学園・順心女子学園の卒業生による同窓会）の公式サイト。同窓会の活動報告やお知らせ、会報誌・総会記録、フォトギャラリーを掲載しています。";

// 1200x630のOGP
export const DEFAULT_OG_IMAGE = "/common/ogp-wide.jpg";

type BuildMetaInput = {
	/** ページ固有タイトル。未指定だとサイト名のみになる。 */
	title?: string;
	description?: string;
	/** "/about" 等のパス。canonical / og:url の生成に使う。 */
	path?: string;
	/** OGP 画像パス（横長）。未指定でデフォルト画像。 */
	image?: string;
	type?: "website" | "article";
	/** 検索結果に出したくないページは true。 */
	noindex?: boolean;
};

/** 絶対URLを組み立てる関数 */
function absolute(pathOrUrl: string): string {
	if (pathOrUrl.startsWith("http")) return pathOrUrl;
	return `${SITE_URL}${pathOrUrl}`;
}

/**
 * 各ルートの meta() から呼ぶ共通ヘルパー。
 * title / description / OGP / Twitter Card / canonical をまとめて返す。
 */
export function buildMeta({
	title,
	description,
	path = "/",
	image,
	type = "website",
	noindex = false,
}: BuildMetaInput): MetaDescriptor[] {
	const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
	const desc = description ?? DEFAULT_DESCRIPTION;
	const url = absolute(path);
	const img = absolute(image ?? DEFAULT_OG_IMAGE);

	const tags: MetaDescriptor[] = [
		{ title: fullTitle },
		{ name: "description", content: desc },
		// Open Graph
		{ property: "og:title", content: fullTitle },
		{ property: "og:description", content: desc },
		{ property: "og:type", content: type },
		{ property: "og:url", content: url },
		{ property: "og:image", content: img },
		{ property: "og:image:width", content: "1200" },
		{ property: "og:image:height", content: "630" },
		{ property: "og:site_name", content: SITE_NAME },
		{ property: "og:locale", content: "ja_JP" },
		// Twitter Card
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: fullTitle },
		{ name: "twitter:description", content: desc },
		{ name: "twitter:image", content: img },
		{ tagName: "link", rel: "canonical", href: url },
	];

	if (noindex) {
		tags.push({ name: "robots", content: "noindex,nofollow" });
	}
	return tags;
}

/** 組織情報の構造化データ*/
export const organizationJsonLd = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: SITE_NAME,
	alternateName: ["広尾学園同窓会", "順心女子学園同窓会", "順心広尾学園同窓会 公式サイト"],
	url: SITE_URL,
	logo: `${SITE_URL}/common/base-logo.svg`,
	description: DEFAULT_DESCRIPTION,
};
