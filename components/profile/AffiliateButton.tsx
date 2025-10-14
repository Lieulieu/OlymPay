import { useState } from "react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

type Props = {
  referralCode: string;
};

export default function AffiliateButton({ referralCode }: Props) {
  const [isSending, setIsSending] = useState(false);

  const handleAffiliate = async () => {
    try {
      setIsSending(true);

      const link = `${window.location.origin}/signup?ref=${encodeURIComponent(
        referralCode
      )}`;

      if (navigator.share) {
        await navigator.share({
          title: "Join with me!",
          text: "Sign up with this link to get a discount:",
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Copied invite link to clipboard!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to send/copy link. Please try again later.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      className="btn w-full"
      onClick={handleAffiliate}
      disabled={isSending}
    >
      {isSending ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <UserPlusIcon className="h-5 w-5" />
      )}
      Affiliate
    </button>
  );
}
