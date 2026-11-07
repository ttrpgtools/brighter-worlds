import { canReadAccount, type AccountSession } from '$lib/data/account-session';

/** Recheck identity after a dialog wait, even if the owner has since signed back in. */
export function canUseSheet(session: AccountSession, owner?: string | null, epoch?: number) {
  return (
    !owner ||
    (canReadAccount(session, owner) && (epoch === undefined || session.current().epoch === epoch))
  );
}
