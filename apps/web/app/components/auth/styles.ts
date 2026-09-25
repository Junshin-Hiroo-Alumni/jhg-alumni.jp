import { css } from "styled-system/css";

// `xxxStyle` は他のスタイルと合成するとき（`css(xxxStyle, { ... })`）に使う

export const labelClass = css({
	display: "block",
	fontWeight: "bold",
	fontSize: "sm",
	color: "gray.800",
	mb: "0.5rem",
});

export const inputStyle = css.raw({
	display: "block",
	width: "100%",
	height: "3rem",
	px: "1rem",
	borderRadius: "0.5rem",
	border: "1px solid token(colors.gray.300)",
	bg: "#FFFFFF",
	fontSize: "md",
	color: "gray.900",
	transition: "border-color 0.15s ease, box-shadow 0.15s ease",
	_focusVisible: {
		outline: "none",
		borderColor: "green.500",
		boxShadow: "0 0 0 3px token(colors.green.100)",
	},
	"&[aria-invalid='true']": { borderColor: "red.500" },
});
export const inputClass = css(inputStyle);

export const hintClass = css({
	mt: "0.5rem",
	fontSize: "xs",
	color: "gray.500",
	lineHeight: "1.6",
});

export const errorClass = css({
	mt: "0.75rem",
	px: "1rem",
	py: "0.75rem",
	borderRadius: "0.5rem",
	bg: "red.50",
	color: "red.700",
	fontSize: "sm",
	lineHeight: "1.6",
});

const buttonStyle = css.raw({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "100%",
	height: "3rem",
	borderRadius: "0.5rem",
	fontWeight: "bold",
	fontSize: "md",
	cursor: "pointer",
	transition: "background-color 0.15s ease, opacity 0.15s ease",
	_disabled: { opacity: 0.4, cursor: "not-allowed" },
});

export const primaryButtonStyle = css.raw(buttonStyle, {
	bg: "green.600",
	color: "#FFFFFF",
	border: "none",
	_hover: { bg: "green.700" },
});
export const primaryButtonClass = css(primaryButtonStyle);

export const secondaryButtonClass = css(buttonStyle, {
	bg: "#FFFFFF",
	color: "gray.700",
	border: "1px solid token(colors.gray.300)",
	_hover: { bg: "gray.50" },
});

export const textLinkClass = css({
	color: "green.700",
	fontWeight: "bold",
	textDecoration: "underline",
	textUnderlineOffset: "0.2em",
	_hover: { color: "green.600" },
});

export const bodyTextStyle = css.raw({
	color: "#444444",
	fontSize: "sm",
	lineHeight: "1.9",
});
export const bodyTextClass = css(bodyTextStyle);
