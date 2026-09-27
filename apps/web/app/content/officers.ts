// 役員会メンバー。ここを編集すると役員会ページに反映されます（バックエンド不要）。
// 写真は public/ 配下に置き、image にパスを指定してください（例: "/site/officers/tanaka.webp"）。
// image を未指定にすると、丸いプレースホルダーが表示されます。

export type Officer = {
	id: string;
	/** 氏名 */
	name: string;
	/** 役職（会長・副会長 など） */
	role: string;
	/** 顔写真のパス（public 配下）。未指定でプレースホルダー表示 */
	image?: string;
};

const DEFAULT_IMAGE = "/site/officers/default.svg";

export const officers: Officer[] = [
	{
		id: "chair",
		name: "竹西怜",
		role: "会長",
		image: "/site/officers/takenishi.webp",
	},
	{
		id: "vice-chair-1",
		name: "若和田史弥",
		role: "副会長",
		image: "/site/officers/wakawada.webp",
	},
	{
		id: "vice-chair-2",
		name: "桑原卓己",
		role: "副会長",
		image: "/site/officers/kuwahara.webp",
	},
	{
		id: "coordinator-1",
		name: "曽我部容子",
		role: "常任幹事",
		image: DEFAULT_IMAGE,
	},
	{
		id: "coordinator-2",
		name: "明海輝",
		role: "常任幹事",
		image: DEFAULT_IMAGE,
	},
	{ id: "treasurer-1", name: "大山未聖", role: "会計", image: DEFAULT_IMAGE },
	{ id: "treasurer-2", name: "笠井優花", role: "会計", image: DEFAULT_IMAGE },
	{ id: "auditor-1", name: "池上陽子", role: "監査", image: DEFAULT_IMAGE },
	{ id: "auditor-2", name: "円井大翔", role: "監査", image: DEFAULT_IMAGE },
	{ id: "publicist-1", name: "小沼洸生", role: "広報", image: DEFAULT_IMAGE },
	{ id: "publicist-2", name: "齋藤智郎", role: "広報", image: "/site/officers/saito.webp" },
	{
		id: "planner-1",
		name: "山川奈緒",
		role: "事業",
		image: "/site/officers/yamakawa.webp",
	},
	{
		id: "planner-2",
		name: "粟田浩暉",
		role: "事業",
		image: "/site/officers/awata.webp",
	},
];
