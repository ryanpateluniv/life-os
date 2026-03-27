"use client";

import { useState, useEffect } from "react";
import { quotes } from "@/lib/quotes";
import { RefreshCw, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuoteCard() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * quotes.length));
  }, []);
  const quote = quotes[idx];

  const refresh = () => {
    let next = Math.floor(Math.random() * quotes.length);
    if (next === idx) next = (next + 1) % quotes.length;
    setIdx(next);
  };

  return (
    <div className="relative rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 overflow-hidden">
      <Quote className="absolute top-3 right-3 w-8 h-8 text-primary/20" />
      <p className="text-sm font-medium leading-relaxed text-foreground pr-8">
        &ldquo;{quote.text}&rdquo;
      </p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-primary font-semibold">— {quote.author}</span>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-muted-foreground hover:text-primary"
          onClick={refresh}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
