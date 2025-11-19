"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { avatarImages } from "@/constants";
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

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
}: MeetingCardProps) => {
  const { toast } = useToast();

  return (
    <section className="flex min-h-[240px] sm:min-h-[258px] w-full flex-col justify-between rounded-xl bg-white px-4 sm:px-5 py-6 sm:py-8 xl:max-w-[568px] border border-light-4 shadow-sm hover:shadow-md transition-all duration-300">
      <article className="flex flex-col gap-4 sm:gap-5">
        <Image src={icon} alt="upcoming" width={28} height={28} className="icon-blue" />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-black truncate">{title}</h1>
            <p className="text-sm sm:text-base font-normal text-text-secondary">{date}</p>
          </div>
        </div>
      </article>
      <article className={cn("flex justify-center relative mt-4", {})}>
        <div className="relative flex w-full max-sm:hidden">
          {avatarImages.map((img, index) => (
            <Image
              key={index}
              src={img}
              alt="attendees"
              width={40}
              height={40}
              className={cn("rounded-full", { absolute: index > 0 })}
              style={{ top: 0, left: index * 28 }}
            />
          ))}
          <div className="flex-center absolute left-[136px] size-10 rounded-full border-[5px] border-light-4 bg-light-2 text-text-secondary text-xs font-medium">
            +5
          </div>
        </div>
        {!isPreviousMeeting && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleClick} className="rounded w-full sm:w-auto sm:px-6">
              {buttonIcon1 && (
                <Image src={buttonIcon1} alt="feature" width={20} height={20} className="brightness-0 invert mr-2" />
              )}
              {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({
                  title: "Link Copied",
                });
              }}
              variant="outline"
              className="w-full sm:w-auto sm:px-6"
            >
              <Image
                src="/icons/copy.svg"
                alt="feature"
                width={20}
                height={20}
                className="icon-blue mr-2"
              />
              Copy Link
            </Button>
          </div>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
