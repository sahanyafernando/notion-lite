import Link from "next/link";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button component integration", () => {
  it("renders a button and handles click events", async () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a child link when asChild is enabled", () => {
    render(
      <Button asChild>
        <Link href="/sign-up">Sign up</Link>
      </Button>,
    );

    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/sign-up");
  });
});
