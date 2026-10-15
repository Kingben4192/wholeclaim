"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type ChoiceOption<T extends string> = { value: T; label: string; primary?: boolean };

type ChoiceRequest<T extends string> = {
  title: string;
  body: string;
  options: ChoiceOption<T>[];
  // What Escape or clicking outside the box means.
  cancelValue: T;
};

// An in-page question with a few buttons, replacing window.confirm. Browsers
// can suppress their own pop-ups (or show them where they're easy to miss),
// which left an upload waiting on a prompt the person never saw.
export function useChoiceDialog<T extends string>() {
  const [request, setRequest] = useState<(ChoiceRequest<T> & { resolve: (value: T) => void }) | null>(null);

  const ask = useCallback(
    (req: ChoiceRequest<T>) => new Promise<T>((resolve) => setRequest({ ...req, resolve })),
    [],
  );

  const choose = useCallback(
    (value: T) => {
      request?.resolve(value);
      setRequest(null);
    },
    [request],
  );

  const dialog = request ? <ChoiceDialogBox request={request} onChoose={choose} /> : null;
  return { ask, dialog };
}

function ChoiceDialogBox<T extends string>({
  request,
  onChoose,
}: {
  request: ChoiceRequest<T>;
  onChoose: (value: T) => void;
}) {
  const titleId = useId();
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChoose(request.cancelValue);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, onChoose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={() => onChoose(request.cancelValue)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-sm bg-paper border border-ink/15 p-5 flex flex-col gap-3 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display font-bold text-base text-ink">
          {request.title}
        </h2>
        <p className="text-sm text-ink/70 break-words">{request.body}</p>
        <div className="flex flex-col gap-2 mt-1">
          {request.options.map((option, i) => (
            <button
              key={option.value}
              ref={i === 0 ? firstButton : undefined}
              type="button"
              onClick={() => onChoose(option.value)}
              className={
                option.primary
                  ? "rounded-sm bg-ledger text-paper px-4 py-2 text-sm font-semibold"
                  : "rounded-sm border border-ink/20 text-ink px-4 py-2 text-sm font-semibold"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
