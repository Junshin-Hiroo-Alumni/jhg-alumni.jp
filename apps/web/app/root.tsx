import { Theme } from "@radix-ui/themes";
import radixThemesStylesheet from "@radix-ui/themes/styles.css?url";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import { css } from "styled-system/css";
import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";

export const links: Route.LinksFunction = () => [
	{ rel: "icon", href: "/common/base-logo.ico", type: "image/x-icon" },
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic&display=swap",
	},
	{ rel: "stylesheet", href: radixThemesStylesheet },
	{ rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body
				className={css({
					bg: "paper.50",
					color: "ink.900",
					fontFamily: '"Noto Sans JP", sans-serif',
					minH: "100dvh",
				})}
			>
				<Theme accentColor="grass" grayColor="sage" radius="small" scaling="100%">
					{children}
				</Theme>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404 ? "The requested page could not be found." : error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main
			className={css({
				maxW: "3xl",
				mx: "auto",
				px: "4",
				py: "16",
			})}
		>
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre
					className={css({
						w: "full",
						p: "4",
						overflowX: "auto",
						borderRadius: "lg",
						mt: "4",
					})}
				>
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
