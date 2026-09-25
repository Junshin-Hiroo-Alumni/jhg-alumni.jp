import { redirect } from "react-router";
import { type ApiClient, createApiClient } from "./api.server";
import { deleteCookie, readCookie, serializeCookie } from "./cookies.server";

const TICKET_COOKIE = "jhg_reg";
const TICKET_COOKIE_PATH = "/register";

export type RegistrationStage =
	| "code_verified"
	| "confirmed"
	| "quiz_passed"
	| "email_sent"
	| "completed";

/** 登録の段階ごとに表示する画面 */
export function pathForStage(stage: RegistrationStage): string {
	switch (stage) {
		case "code_verified":
			return "/register/confirm";
		case "confirmed":
			return "/register/quiz";
		case "quiz_passed":
			return "/register/email";
		case "email_sent":
			return "/register/email-sent";
		case "completed":
			return "/login";
	}
}

export function ticketCookieHeaders(ticket: string): Headers {
	// 確認メールのリンクを開くまで（最大 24 時間）保持する。有効期限は API 側で管理する
	return new Headers({
		"Set-Cookie": serializeCookie(TICKET_COOKIE, ticket, {
			maxAge: 24 * 60 * 60,
			path: TICKET_COOKIE_PATH,
		}),
	});
}

export function clearTicketCookie(): string {
	return deleteCookie(TICKET_COOKIE, TICKET_COOKIE_PATH);
}

/** 登録チケットがない、または期限切れなら認証コードの入力へ戻す */
export function redirectToStart(): Response {
	return redirect("/register?expired", { headers: { "Set-Cookie": clearTicketCookie() } });
}

/** 登録チケット付きの API クライアント。チケットがなければ認証コードの入力へ戻す */
export function registrationApi(request: Request): ApiClient {
	const ticket = readCookie(request, TICKET_COOKIE);
	if (!ticket) {
		throw redirectToStart();
	}
	return createApiClient(request, { registrationTicket: ticket });
}

/** 現在の登録状態を取得し、`allowed` 以外の段階ならその段階の画面へ移動する */
export async function requireRegistrationStage(request: Request, allowed: RegistrationStage[]) {
	const res = await registrationApi(request).v1.registrations.current.$get();
	if (res.status !== 200) {
		throw redirectToStart();
	}
	const registration = await res.json();
	if (!allowed.includes(registration.stage)) {
		throw redirect(pathForStage(registration.stage));
	}
	return registration;
}
