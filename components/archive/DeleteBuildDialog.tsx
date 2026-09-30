import { LoaderCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { getBuildText, type Build } from "@/lib/builds";
import { useLocale } from "./Locale";
type Props = {
  deleting: Build | null;
  onClose: () => void;
  saving: boolean;
  error: string;
  onDelete: () => void;
};
export function DeleteBuildDialog({
  deleting,
  onClose,
  saving,
  error,
  onDelete,
}: Props) {
  const { t, locale } = useLocale();
  return (
    <AlertDialog
      open={!!deleting}
      onOpenChange={(v) => {
        if (!v && !saving) onClose();
      }}
    >
      <AlertDialogContent className="build-delete-dialog">
        <AlertDialogTitle>
          {t("Delete build?", "Удалить билд?")}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {t(
            "The build and its screenshot will be deleted. This cannot be undone.",
            "Билд и его скриншот будут удалены. Это действие нельзя отменить.",
          )}
          <strong className="delete-build-name">
            {deleting ? getBuildText(deleting, locale).title : ""}
          </strong>
        </AlertDialogDescription>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="build-actions">
          <AlertDialogCancel disabled={saving}>
            {t("Cancel", "Отмена")}
          </AlertDialogCancel>
          <button
            className="secondary-button danger-button"
            disabled={saving}
            onClick={onDelete}
          >
            {saving ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Trash2 size={16} />
            )}{" "}
            {saving
              ? t("Deleting…", "Удаляем…")
              : t("Delete build", "Удалить билд")}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
