import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <ForgotPasswordForm />
    </div>
  );
}
