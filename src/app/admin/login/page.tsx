import { Suspense } from "react";
import { googleSignInEnabled } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm googleEnabled={googleSignInEnabled} />
    </Suspense>
  );
}
