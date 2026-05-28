"use client"

import Link from "next/link"
import { useT } from "@/lib/i18n"

export default function PrivacyPage() {
  const t = useT()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>{t("privacy.title")}</h1>
        <p className="text-sm text-zinc-400">{t("privacy.lastUpdated")}</p>

        <p>{t("privacy.intro")}</p>

        <h2>{t("privacy.dataCollection")}</h2>
        <p>{t("privacy.dataCollectionText")}</p>

        <h2>{t("privacy.dataUse")}</h2>
        <p>{t("privacy.dataUseText")}</p>

        <h2>{t("privacy.dataStorage")}</h2>
        <p>{t("privacy.dataStorageText")}</p>

        <h2>{t("privacy.cookies")}</h2>
        <p>{t("privacy.cookiesText")}</p>

        <h2>{t("privacy.userRights")}</h2>
        <p>{t("privacy.userRightsText")}</p>

        <h2>{t("privacy.changes")}</h2>
        <p>{t("privacy.changesText")}</p>

        <h2>{t("footer.contact")}</h2>
        <p>
          {t("about.contactDesc")}{" "}
          <a href="mailto:hello@studyai.app" className="text-purple-500 hover:text-purple-600">hello@studyai.app</a>
        </p>
      </article>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-purple-500 hover:text-purple-600 transition-colors">
          ← {t("about.backHome")}
        </Link>
      </div>
    </div>
  )
}
