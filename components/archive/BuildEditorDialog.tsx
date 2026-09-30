import type { FormEvent } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buildImageUrl, getBuildText, type Build } from "@/lib/builds";
import { BuildTagFields } from "./BuildTags";
import { useLocale } from "./Locale";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Build | null;
  saving: boolean;
  saveError: string;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
};
export function BuildEditorDialog({
  open,
  onOpenChange,
  editing,
  saving,
  saveError,
  onSave,
}: Props) {
  const { t, locale } = useLocale();
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!saving) onOpenChange(v);
      }}
    >
      <DialogContent className="build-dialog">
        <DialogTitle>
          {editing
            ? t("Edit build", "Редактировать билд")
            : t("New build", "Новый билд")}
        </DialogTitle>
        <DialogDescription>
          {t(
            "Fill in both languages. The screenshot is shared by RU and ENG.",
            "Заполни оба языка. Скриншот общий для RU и ENG.",
          )}
        </DialogDescription>
        <form key={editing?.id ?? "new"} onSubmit={onSave}>
          {editing && !editing.title_ru && !editing.title_en && (
            <details className="legacy-build-copy" open>
              <summary>
                {t(
                  "Original text — copy it into the matching language below",
                  "Исходный текст — перенеси его в нужный язык ниже",
                )}
              </summary>
              <strong>{editing.title}</strong>
              <p>{editing.description}</p>
            </details>
          )}
          <BuildTagFields tags={editing?.tags ?? []} disabled={saving} />
          <div className="build-translations">
            {(["ru", "en"] as const).map((language) => (
              <fieldset
                key={language}
                className="build-translation"
                disabled={saving}
              >
                <legend>
                  {language === "ru" ? "RU · Русский" : "ENG · English"}
                </legend>
                <label>
                  {language === "ru" ? "Название" : "Title"}
                  <input
                    lang={language}
                    name={`title_${language}`}
                    defaultValue={editing?.[`title_${language}`] ?? ""}
                    required
                    maxLength={120}
                    placeholder={
                      language === "ru"
                        ? "Например: Striker — соло PvE"
                        : "For example: Striker — solo PvE"
                    }
                  />
                </label>
                <label>
                  {language === "ru" ? "Описание" : "Description"}
                  <textarea
                    lang={language}
                    name={`description_${language}`}
                    defaultValue={editing?.[`description_${language}`] ?? ""}
                    required
                    maxLength={60000}
                    rows={6}
                    placeholder={
                      language === "ru"
                        ? "Оружие, снаряжение, характеристики и стиль игры…"
                        : "Weapons, gear, attributes and playstyle…"
                    }
                  />
                </label>
              </fieldset>
            ))}
          </div>
          <label>
            {t("Screenshot", "Скриншот")}
            {editing && (
              <>
                <img
                  className="edit-build-preview"
                  src={buildImageUrl(editing.image_key)}
                  alt={getBuildText(editing, locale).title}
                />
                <small>
                  {t(
                    "Leave empty to keep the current screenshot.",
                    "Оставь поле пустым, чтобы сохранить текущий скриншот.",
                  )}
                </small>
              </>
            )}
            <span className="upload-box">
              <ImagePlus size={24} />
              <input
                name="image"
                type="file"
                disabled={saving}
                required={!editing}
                accept="image/png,image/jpeg,image/webp"
              />
              <small>
                {t(
                  "PNG, JPG or WebP · up to 10 MB",
                  "PNG, JPG или WebP · до 10 МБ",
                )}
              </small>
            </span>
          </label>
          {saveError && (
            <p className="error" role="alert">
              {saveError}
            </p>
          )}
          <button className="primary-button" disabled={saving} type="submit">
            {saving ? (
              <>
                <LoaderCircle className="spin" size={18} />
                {t("Saving…", "Сохраняем…")}
              </>
            ) : (
              t("Save build", "Сохранить билд")
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
