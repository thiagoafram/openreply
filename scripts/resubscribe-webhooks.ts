// Re-subscribes every connected META account to the webhook fields OpenReply needs
// (comments, messages, messaging_postbacks). Run after changing the field list.
// Usage: npx tsx --env-file=/etc/openreply.env scripts/resubscribe-webhooks.ts
import { prisma } from "@/lib/db/client";
import { subscribeInstagramAccountToWebhooks } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/oauth";

async function main() {
  const accounts = await prisma.instagramAccount.findMany({ where: { provider: "META" } });
  for (const a of accounts) {
    const res = await subscribeInstagramAccountToWebhooks(
      a.instagramId,
      decryptToken(a.accessToken)
    ).catch((e) => ({ success: false, error: e.message }));
    console.log(a.username, JSON.stringify(res));
    await prisma.instagramAccount.update({
      where: { id: a.id },
      data: { webhookSubscribed: Boolean((res as { success?: boolean }).success) },
    });
  }
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
