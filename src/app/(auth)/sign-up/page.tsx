import { redirect } from "next/navigation";

// Account creation is disabled — all entry goes through the login page.
export default function SignUpPage() {
  redirect("/sign-in");
}
