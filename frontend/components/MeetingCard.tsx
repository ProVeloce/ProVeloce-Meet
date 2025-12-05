"use client";

import Image from "next/image";
import { memo, useCallback } from "react";
import { Copy, Play, Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
}

const MeetingCard = memo(function MeetingCard({
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
}: MeetingCardProps) {
  const { toast } = useToast();

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
    });
  }, [link, toast]);

  return (
    <section className="flex flex-col justify-between w-full p-4 sm:p-5 rounded-xl bg-white border border-border-lighter hover:shadow-md transition-all touch-target">
      {/* Header */}
      <article className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-google-blue-light flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-google-blue" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary truncate">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {date}
          </p>
        </div>
      </article>

      {/* Actions */}
      {!isPreviousMeeting && (
        <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-4 border-t border-border-lighter">
          <Button
            onClick={handleClick}
            className="flex-1 h-11 rounded-full touch-target active:scale-[0.98] bg-google-blue hover:bg-google-blue-hover"
          >
            {buttonText === 'Play' ? (
              <Play className="w-4 h-4 mr-2" />
            ) : buttonIcon1 && (
              <Image src={buttonIcon1} alt="" width={18} height={18} className="brightness-0 invert mr-2" />
            )}
            {buttonText}
          </Button>
          <Button
            onClick={copyLink}
            variant="outline"
            className="flex-1 sm:flex-none h-11 rounded-full touch-target active:scale-[0.98]"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      )}

      {isPreviousMeeting && (
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border-lighter text-text-tertiary text-sm">
          <span>Ended</span>
        </div>
      )}
    </section>
  );
});

export default MeetingCard;
