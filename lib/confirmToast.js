import { toast } from "sonner";

export function confirmToast({
    message,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    duration = 10000
}) {
    return new Promise((resolve) => {
        let settled = false;

        toast(message, {
            description,
            duration,
            action: {
                label: confirmLabel,
                onClick: () => {
                    settled = true;
                    resolve(true);
                }
            },
            cancel: {
                label: cancelLabel,
                onClick: () => {
                    settled = true;
                    resolve(false);
                }
            },
            onDismiss: () => {
                if (!settled) resolve(false);
            }
        });
    });
}
