import { env } from "cloudflare:workers";

const SENDER_NAME = "順心広尾学園同窓会";

/**
 * 案内メールを送る
 *
 * `MAIL_DELIVERY` が `console`（ローカル開発）の場合は送信せず、リンク（なければ本文）をログに出す。
 */
async function sendLinkEmail(params: {
	to: string;
	subject: string;
	lines: string[];
	url?: string;
}): Promise<void> {
	const { to, subject, lines, url } = params;
	if (env.MAIL_DELIVERY === "console") {
		console.info(`[mail] ${to} 宛「${subject}」（送信はしていません）: ${url ?? lines.join(" ")}`);
		return;
	}
	await env.EMAIL.send({
		to,
		from: { email: env.MAIL_FROM, name: SENDER_NAME },
		subject: `【${SENDER_NAME}】${subject}`,
		text: [...lines, "", SENDER_NAME].join("\n"),
	});
}

export async function sendVerificationEmail(params: {
	to: string;
	name: string;
	verifyUrl: string;
}): Promise<void> {
	const { to, name, verifyUrl } = params;
	await sendLinkEmail({
		to,
		subject: "メールアドレスの確認",
		url: verifyUrl,
		lines: [
			`${name} 様`,
			"",
			"順心広尾学園同窓会の会員登録をお申し込みいただき、ありがとうございます。",
			"以下のリンクを開いて、パスワードを設定し登録を完了してください。",
			"",
			verifyUrl,
			"",
			"このリンクの有効期限は24時間です。",
			"お心当たりのない場合は、このメールを破棄してください。",
		],
	});
}

export async function sendPasswordResetEmail(params: {
	to: string;
	name: string;
	resetUrl: string;
}): Promise<void> {
	const { to, name, resetUrl } = params;
	await sendLinkEmail({
		to,
		subject: "パスワードの再設定",
		url: resetUrl,
		lines: [
			`${name} 様`,
			"",
			"パスワード再設定のお申し込みを受け付けました。",
			"以下のリンクを開いて、新しいパスワードを設定してください。",
			"",
			resetUrl,
			"",
			"このリンクの有効期限は1時間です。",
			"お心当たりのない場合は、このメールを破棄してください。パスワードは変更されません。",
		],
	});
}

export async function sendEmailChangeEmail(params: {
	to: string;
	name: string;
	confirmUrl: string;
}): Promise<void> {
	const { to, name, confirmUrl } = params;
	await sendLinkEmail({
		to,
		subject: "メールアドレス変更の確認",
		url: confirmUrl,
		lines: [
			`${name} 様`,
			"",
			"ログインに使うメールアドレスを、このアドレスに変更するお申し込みを受け付けました。",
			"以下のリンクを開いて、変更を完了してください。",
			"",
			confirmUrl,
			"",
			"このリンクの有効期限は24時間です。",
			"お心当たりのない場合は、このメールを破棄してください。メールアドレスは変更されません。",
		],
	});
}

/** 変更前のアドレスに送る、メールアドレスが変更されたことの通知 */
export async function sendEmailChangedNotice(params: {
	to: string;
	name: string;
	newEmail: string;
}): Promise<void> {
	const { to, name, newEmail } = params;
	await sendLinkEmail({
		to,
		subject: "メールアドレスが変更されました",
		lines: [
			`${name} 様`,
			"",
			`ログインに使うメールアドレスが ${newEmail} に変更されました。`,
			"すべての端末でログアウトしています。今後は新しいメールアドレスでログインしてください。",
			"",
			"お心当たりのない場合は、第三者に変更された可能性があります。",
			"お手数ですが、同窓会事務局までご連絡ください。",
		],
	});
}
