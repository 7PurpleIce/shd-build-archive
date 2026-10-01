"use client";
import { SectionHeading } from "./SectionHeading";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  ImagePlus,
  Maximize2,
  LoaderCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { BuildViewDialog } from "./BuildViewDialog";
import { BuildEditorDialog } from "./BuildEditorDialog";
import { DeleteBuildDialog } from "./DeleteBuildDialog";
import "./build-actions.css";
import { BuildTagFilter, BuildTagBadges } from "./BuildTags";

import { useLocale } from "./Locale";
import { NameSearch, NoSearchResults, startsWithName } from "./NameSearch";
import {
  listBuilds,
  createBuild,
  updateBuild,
  deleteBuild,
  buildImageUrl,
  getBuildText,
  matchesBuildTags,
  type BuildTag,
  type Build,
} from "@/lib/builds";
export function Builds({ canManage }: { canManage: boolean }) {
  const { t, locale } = useLocale();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const viewTrigger = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Build | null>(null);
  const [deleting, setDeleting] = useState<Build | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [tagFilter, setTagFilter] = useState<BuildTag[]>([]);
  const filtered = builds.filter(
    (b) =>
      startsWithName(query, getBuildText(b, locale).title) &&
      matchesBuildTags(b, tagFilter),
  );
  async function load() {
    setLoading(true);
    setError("");
    try {
      setBuilds(await listBuilds());
    } catch {
      setError(
        t(
          "Could not load builds. Please try again.",
          "Не удалось загрузить билды. Попробуй ещё раз.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function startEdit(build: Build | null) {
    setEditing(build);
    setSaveError("");
    setOpen(true);
  }
  async function remove() {
    if (!canManage || !deleting || saving) return;
    setSaving(true);
    setDeleteError("");
    try {
      const cleanupFailed = await deleteBuild(deleting);
      setBuilds((items) => items.filter((b) => b.id !== deleting.id));
      setSelected((id) => (id === deleting.id ? null : id));
      setDeleting(null);
      setNotice(
        cleanupFailed
          ? t(
              "Build deleted, but its old image could not be removed.",
              "Билд удалён, но не удалось удалить старый скриншот.",
            )
          : t("Build deleted.", "Билд удалён."),
      );
    } catch {
      setDeleteError(
        t(
          "Could not delete the build. Please try again.",
          "Не удалось удалить билд. Попробуй ещё раз.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canManage || saving) return;
    const form = e.currentTarget;
    const payload = new FormData(form);
    const file = payload.get("image");
    if (file instanceof File && file.size > 10 * 1024 * 1024) {
      setSaveError(
        t(
          "Screenshot must be smaller than 10 MB.",
          "Скриншот должен быть меньше 10 МБ.",
        ),
      );
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const result = editing
        ? await updateBuild(editing, payload)
        : { build: await createBuild(payload), cleanupFailed: false };
      const build = result.build;
      setBuilds((b) =>
        editing
          ? b.map((item) => (item.id === build.id ? build : item))
          : [build, ...b],
      );
      setNotice(
        result.cleanupFailed
          ? t(
              "Changes saved, but the old image could not be removed.",
              "Изменения сохранены, но не удалось удалить старый скриншот.",
            )
          : t("Build saved.", "Билд сохранён."),
      );
      setSelected(null);
      setQuery("");
      setTagFilter([]);
      setOpen(false);
      form.reset();
    } catch (e) {
      setSaveError(
        e instanceof Error
          ? e.message
          : t("Could not save build.", "Не удалось сохранить билд."),
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <SectionHeading
        section="builds"
        eyebrow={t("BUILD COLLECTION", "КОЛЛЕКЦИЯ СБОРОК")}
        title={t("Builds", "Билды")}
      >
        {canManage && (
          <button className="primary-button" onClick={() => startEdit(null)}>
            <Plus size={18} />
            {t("Add build", "Добавить билд")}
          </button>
        )}
      </SectionHeading>
      <p className="build-notice" role="status">
        {notice}
      </p>
      <NameSearch value={query} onChange={setQuery} />
      <BuildTagFilter selected={tagFilter} onChange={setTagFilter} />
      {!loading && !error && builds.length > 0 && (
        <p className="build-filter-count" role="status">
          {t(
            `${filtered.length} of ${builds.length} builds`,
            `${filtered.length} из ${builds.length} билдов`,
          )}
        </p>
      )}
      {loading ? (
        <div className="empty-state">
          <LoaderCircle className="spin" />
          <p>{t("Loading builds…", "Загружаем билды…")}</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p role="alert">{error}</p>
          <button className="secondary-button" onClick={load}>
            {t("Retry", "Повторить")}
          </button>
        </div>
      ) : builds.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <ImagePlus size={36} />
          </span>
          <h2>
            {canManage
              ? t(
                  "Your collection starts here",
                  "Твоя коллекция начинается здесь",
                )
              : t("No published builds yet", "Пока нет опубликованных билдов")}
          </h2>
          <p>
            {canManage
              ? t(
                  "Add a screenshot, title and description of your first build.",
                  "Добавь скриншот, название и описание первого билда.",
                )
              : t(
                  "The owner has not added any builds yet.",
                  "Владелец сайта ещё не добавил сборки.",
                )}
          </p>
          {canManage && (
            <button className="primary-button" onClick={() => startEdit(null)}>
              <Plus size={18} />
              {t("Add build", "Добавить билд")}
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="build-no-matches">
          <NoSearchResults />
          <p>
            {t(
              "Change the name or selected tags.",
              "Измени название или выбранные теги.",
            )}
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              setQuery("");
              setTagFilter([]);
            }}
          >
            {t("Reset filters", "Сбросить фильтры")}
          </button>
        </div>
      ) : (
        <div className="build-grid">
          {filtered.map((build) => {
            const text = getBuildText(build, locale);
            return (
              <div
                key={build.id}
                className="build-item"
              >
                <button
                  className="build-card"
                  onClick={(event) => {viewTrigger.current=event.currentTarget;setSelected(build.id)}}
                  aria-haspopup="dialog"
                >
                  <img src={buildImageUrl(build.image_key)} alt={text.title} />
                  <span>
                    <strong>{text.title}</strong>
                    <Maximize2 size={18} />
                  </span>
                </button>
                <BuildTagBadges tags={build.tags ?? []} />
                {canManage && (
                  <div className="build-actions">
                    <button
                      className="secondary-button"
                      onClick={() => startEdit(build)}
                      aria-label={
                        t("Edit build: ", "Редактировать билд: ") + text.title
                      }
                    >
                      <Pencil size={16} />
                      {t("Edit", "Редактировать")}
                    </button>
                    <button
                      className="secondary-button danger-button"
                      onClick={() => {
                        setDeleteError("");
                        setDeleting(build);
                      }}
                      aria-label={
                        t("Delete build: ", "Удалить билд: ") + text.title
                      }
                    >
                      <Trash2 size={16} />
                      {t("Delete", "Удалить")}
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
      <BuildViewDialog build={builds.find(build=>build.id===selected)??null} onClose={()=>setSelected(null)} returnFocus={()=>viewTrigger.current?.focus()} />
      <BuildEditorDialog
        open={canManage && open}
        onOpenChange={setOpen}
        editing={editing}
        saving={saving}
        saveError={saveError}
        onSave={save}
      />
      <DeleteBuildDialog
        deleting={canManage ? deleting : null}
        onClose={() => setDeleting(null)}
        saving={saving}
        error={deleteError}
        onDelete={remove}
      />
    </>
  );
}
