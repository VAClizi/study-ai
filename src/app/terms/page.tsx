"use client"

import Link from "next/link"
import { useT } from "@/lib/i18n"

export default function TermsPage() {
  const t = useT()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>{t("terms.title")}</h1>
        <p className="text-sm text-zinc-400">{t("terms.lastUpdated")}</p>

        <p>{t("terms.intro")}</p>

        <h2>{t("terms.serviceDesc")}</h2>
        <p>{t("terms.serviceDescText")}</p>

        <h2>{t("terms.userAccount")}</h2>
        <p>{t("terms.userAccountText")}</p>

        <h2>{t("terms.useRestrictions")}</h2>
        <p>{t("terms.useRestrictionsText")}</p>

        <h2>{t("terms.intellectualProperty")}</h2>
        <p>{t("terms.intellectualPropertyText")}</p>

        <h2>{t("terms.disclaimer")}</h2>
        <p>{t("terms.disclaimerText")}</p>

        <h2>{t("terms.changes")}</h2>
        <p>{t("terms.changesText")}</p>

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
