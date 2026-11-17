import { redirect } from "react-router";

// The old contact form only ever received spam. Keep the URL working for old links.
export const loader = () => redirect("/", 301);
