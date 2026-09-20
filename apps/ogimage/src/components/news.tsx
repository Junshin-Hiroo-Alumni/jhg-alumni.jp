import { tz } from "@date-fns/tz";
import { format } from "date-fns";

type NewsTag = "news" | string;
export interface NewsProps {
	publishedAt: string;
	title: string;
	description?: string;
	tag?: NewsTag;
}
export function News({ publishedAt }: NewsProps) {
	return (
		<div>
			<span>{format(new Date(publishedAt), "yyyy.MM.dd (E)", { in: tz("Asia/Tokyo") })}</span>
			こここんにちは
		</div>
	);
}
