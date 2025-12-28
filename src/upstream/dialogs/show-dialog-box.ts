// @ts-nocheck
export interface AlertDialogParams {
    title?: string;
    text?: string;
    confirmText?: string;
    warning?: boolean;
}

export const showAlertDialog = (_element: unknown, _params: AlertDialogParams): void => {
    // No-op: Alert dialog not needed in card context
};
