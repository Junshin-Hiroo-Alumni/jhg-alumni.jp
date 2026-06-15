// 役員会メンバー。ここを編集すると役員会ページに反映されます（バックエンド不要）。
// 写真は public/ 配下に置き、image にパスを指定してください（例: "/site/officers/tanaka.webp"）。
// image を未指定にすると、丸いプレースホルダーが表示されます。

export type Officer = {
	id: string;
	/** 氏名 */
	name: string;
	/** 役職（会長・副会長 など） */
	role: string;
	/** ひとことコメント */
	comment: string;
	/** 顔写真のパス（public 配下）。未指定でプレースホルダー表示 */
	image?: string;
};

export const officers: Officer[] = [
	{
		id: "chair",
		name: "氏名",
		role: "会長",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
	{
		id: "vice-chair",
		name: "氏名",
		role: "副会長",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
	{
		id: "treasurer",
		name: "氏名",
		role: "会計",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
	{
		id: "secretary",
		name: "氏名",
		role: "書記",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
	{
		id: "auditor",
		name: "氏名",
		role: "監事",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
	{
		id: "officer-1",
		name: "氏名",
		role: "役員",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
	{
		id: "officer-2",
		name: "氏名",
		role: "役員",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
	{
		id: "officer-3",
		name: "氏名",
		role: "役員",
		comment: "ここにひとことコメントが入ります。",
		image: undefined,
	},
];
