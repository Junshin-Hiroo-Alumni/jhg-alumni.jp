import { render } from "takumi-js";
import { OgImage } from "../components/og-image";

export async function getOgImage() {
	return render(<OgImage />, { width: 1200, height: 630 });
}
