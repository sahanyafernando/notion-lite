"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

type AuthControlsProps = {
  signInClassName?: string;
  signUpClassName?: string;
};

export function AuthControls({
  signInClassName,
  signUpClassName,
}: AuthControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
          <Button variant="outline" size="sm" className={signInClassName}>
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
          <Button size="sm" className={signUpClassName}>
            Sign up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}
